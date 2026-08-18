# Auditoria Técnica e de Segurança — QRV Artigos Táticos

**Escopo:** código-fonte completo do projeto conectado (site QRV Artigos Táticos — HTML/CSS/JS vanilla + Supabase). Não há nenhum projeto "MCJ Capital Invest" nesta pasta; onde a MCJ foi citada em rodadas anteriores, foi apenas como referência visual para o dark mode do admin, não como código auditado aqui.

**Metodologia:** leitura direta de todo o código-fonte (13 páginas HTML, 8 arquivos JS, 3 scripts SQL de schema/RLS), sem execução de scanner automatizado — achados citam arquivo e linha para você conferir.

---

## 1. Varredura de Segurança e Vulnerabilidades

### 1.1 Chaves e credenciais no front-end

`assets/supabase-client.js:8-9` expõe `SUPABASE_URL` e `SUPABASE_ANON_KEY` (formato novo `sb_publishable_...`) direto no código-fonte. **Isso não é uma falha** — é o modelo de segurança correto do Supabase: essa chave é pública por design, feita para rodar no navegador, e quem protege os dados é a RLS (Row Level Security), não o sigilo da chave. Não há `service_role key` exposta em nenhum arquivo (essa sim seria crítica) — bom sinal, indica que quem escreveu o código sabia da diferença.

**Achado real (severidade média-alta):** `assets/chatbot.js:104-119` chama a API do Gemini **direto do navegador**, usando uma chave buscada da tabela `site_config` (`chatbot_gemini_key`), que tem `select using (true)` — leitura pública. Ou seja: qualquer visitante que abrir o DevTools → aba Network e mandar uma mensagem no chat consegue copiar essa chave de API do Google e usá-la fora do site, gerando cobrança na sua conta Google. O próprio código já documenta isso (comentário nas linhas 6-29 do arquivo) e recomenda restringir por domínio (HTTP referrer) e cota diária no Google Cloud Console — mas isso é uma configuração que precisa ser feita manualmente lá, o código não impõe.
**Solução prática:** (a) no Google AI Studio/Cloud Console, restrinja a chave do chat por referenciador HTTP ao seu domínio e defina uma cota diária baixa (trava de segurança); (b) para o padrão "pronto para venda corporativa", o ideal é não fazer a chamada à API de IA direto do navegador — criar uma Vercel Serverless Function (`/api/chat`) que guarda a chave como variável de ambiente no servidor e faz o proxy da chamada. Isso tira a chave do alcance de qualquer visitante.

A chave usada no preenchimento automático de produtos (`produtos_gemini_key`) já foi corrigida numa rodada anterior desta conversa — hoje só o admin autenticado consegue ler essa linha específica (`supabase-admin-gemini-key.sql`), então ela não sofre do mesmo problema.

### 1.2 RLS (Row Level Security) do Supabase

Revisei os três scripts de schema (`supabase-setup.sql`, `supabase-site-config.sql`, `supabase-admin-gemini-key.sql`). O padrão geral é correto: leitura pública só do que precisa ser público (produtos ativos, chave do chat), inserção pública liberada só nas tabelas de captação de lead (`mensagens_contato`, `solicitacoes_bordado`, `solicitacoes_revenda`) com `with check (true)`, e toda leitura/edição/exclusão sensível restrita por `auth.jwt() ->> 'email' = 'santanadds92@gmail.com'`.

**Achado (severidade baixa, mas real):** o e-mail do admin está hardcoded, repetido **15 vezes** em 3 arquivos SQL diferentes. Isso funciona hoje, mas: (1) se você trocar o e-mail de login ou quiser adicionar um segundo administrador, precisa editar e rodar 15 policies manualmente — fácil esquecer uma e deixar uma tabela sem proteção; (2) é uma string mágica repetida, o tipo de coisa que auditoria sênior sempre marca como "não escalável".
**Solução prática:** criar uma tabela `public.admins (email text primary key)` e uma função `is_admin()` que checa `auth.jwt()->>'email' in (select email from admins)`, e trocar todas as policies para usar `is_admin()` no lugar do e-mail fixo. Adicionar um admin novo vira um `insert` na tabela em vez de reescrever RLS.

### 1.3 XSS — a vulnerabilidade mais séria encontrada

Isto é o achado mais importante da auditoria, então vou detalhar bem.

**O que está certo:** a descrição de produto (o único campo que aceita HTML de verdade) passa por `DOMPurify.sanitize()` com allow-list de tags/atributos (`assets/supabase-client.js:214-219`) tanto ao salvar (`assets/admin.js:507`) quanto ao exibir para o público (`produto.html:428`). Isso é feito corretamente.

**O que está errado:** os formulários públicos de **Fale Conosco** (`contato.html`), **Solicitar Bordado** (`bordados.html`) e **Seja Revendedor** (`revendedor.html`) permitem que qualquer visitante anônimo insira linhas diretamente nas tabelas `mensagens_contato`, `solicitacoes_bordado` e `solicitacoes_revenda` (a RLS libera isso de propósito, é o formulário funcionando). O problema é que, quando o **admin autenticado** abre as abas "Mensagens", "Bordados" ou "Revenda" no painel, esses dados voltam sem nenhum escape:

```js
// assets/admin.js:590, 634 e 677 — os três têm o mesmo problema
bordadosList.innerHTML = data.map(s => `
  <strong>${s.nome}</strong> ... ${s.observacoes ? `<p>${s.observacoes}</p>` : ''}
`).join('');
```

Um visitante mal-intencionado pode preencher o campo "Nome" ou "Observações" do formulário de bordado com algo como `<img src=x onerror="/* código malicioso */">`. Quando você (admin) abrir essa aba no painel, esse script **executa dentro da sua sessão autenticada** — na prática, é um vetor para roubar o token de sessão do Supabase Auth (guardado no `localStorage` do navegador) ou fazer ações em seu nome (excluir produtos, ler mensagens de outros clientes, etc). É um **XSS armazenado clássico com escalada para a conta admin**, e é 100% explorável hoje: basta preencher o formulário público normalmente.

Curiosamente, o próprio código já sabe fazer isso certo em outro lugar — `assets/admin.js:310-311` escapa aspas ao montar `value="..."` para os campos de produto (`(p.codigo || '').replace(/"/g, '&quot;')`) — só não foi aplicado nos dados vindos dos formulários públicos, que são justamente os de maior risco por vir de qualquer visitante, não do próprio admin.

**Solução prática:** criar uma função de escape simples e usá-la em **todo** dado de string vindo do banco antes de interpolar em `innerHTML` (nome, telefone, e-mail, observações, tipo_peca, o_que_bordar, cidade, tipo_negocio, mensagem):

```js
function escapeHTML(str) {
  return String(str ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));
}
```

E trocar `${s.nome}` → `${escapeHTML(s.nome)}` em `loadBordados`, `loadRevenda` e `loadMessages` (as três funções citadas acima). É uma correção pequena e rápida, mas é a que eu colocaria como prioridade #1 antes de qualquer comercialização — é a única falha desta auditoria que é diretamente explorável por um estranho, sem precisar de senha nem acesso a nada.

### 1.4 CSRF e requisições desprotegidas

O site não usa sessão baseada em cookie no back-end (o Supabase Auth guarda o JWT no `localStorage` do navegador, enviado via header `Authorization`, não via cookie automático) — isso torna CSRF clássico (cookie riding) não aplicável aqui, é uma característica da arquitetura, não uma correção que falta. O checkout (`checkout.html`) não persiste dados no banco — monta um link `wa.me` com o resumo do pedido e abre o WhatsApp, então não há endpoint de escrita desprotegido ali.

**Achado leve:** não há nenhuma configuração de *security headers* (CSP, X-Frame-Options, etc.) — não existe `vercel.json` no projeto. Um Content-Security-Policy bem configurado teria, inclusive, dificultado bastante a exploração do XSS do item 1.3 (bloqueando `onerror=` inline, por exemplo), então vale como camada extra de defesa, não como substituto do escape.
**Solução prática:** criar um `vercel.json` com um bloco `headers` aplicando `Content-Security-Policy`, `X-Content-Type-Options: nosniff` e `X-Frame-Options: DENY` a todas as rotas.

---

## 2. Conformidade com a LGPD

Aqui o diagnóstico é direto: **o site não atende aos requisitos básicos da LGPD hoje.**

- **Política de Privacidade: inexistente.** Busquei em todo o projeto (`grep -ri "política de privacidade"` em todos os HTML) — zero resultados.
- **Termos de Uso: inexistente.** Mesma busca, mesmo resultado.
- **O rodapé finge ter isso:** `index.html:333` (e o mesmo em todas as outras 11 páginas) tem um link `<a href="#">Termos e políticas</a>` — aponta para lugar nenhum (`href="#"`). Pior do que não ter o link: parece que tem, e não tem.
- **Formulários que coletam dado pessoal sem aviso:** `contato.html` (nome, telefone, e-mail, mensagem), `bordados.html` (nome, telefone, o que bordar), `revendedor.html` (nome, telefone, cidade, tipo de negócio) e `checkout.html` (nome completo, telefone, e-mail, CEP, cidade, **endereço completo**) — nenhum desses formulários tem uma linha de texto do tipo "Ao enviar, você concorda com nossa Política de Privacidade" nem um checkbox de consentimento. O checkout, em especial, coleta endereço completo de entrega sem qualquer aviso sobre tratamento de dados.
- **Cookies:** não encontrei Google Analytics, Meta Pixel ou qualquer rastreador de terceiros no código — então, diferente do que normalmente aparece nesse tipo de auditoria, aqui **não é prioridade ter um banner de cookies de rastreamento**, porque não existe rastreamento de terceiros rodando. O `localStorage` usado (carrinho de compras, tema — agora removido) é armazenamento estritamente funcional, que em geral não exige banner de consentimento sob a LGPD/boas práticas equivalentes ao GDPR. Ainda assim, a Política de Privacidade deveria mencionar esse uso, mesmo que mínimo.

**Solução prática, em ordem de prioridade:**
1. Escrever uma Política de Privacidade real (pode ser um `politica-privacidade.html` seguindo o mesmo layout do site) cobrindo: quais dados são coletados em cada formulário, finalidade (contato, orçamento de bordado, entrega do pedido), quanto tempo ficam guardados, que terceiros recebem esse dado (WhatsApp, Google/Gemini no caso do chat), e como o titular pode pedir exclusão — a LGPD garante esse direito (art. 18).
2. Trocar o `href="#"` do rodapé pelo link real, nas 12 páginas.
3. Adicionar, logo acima do botão de enviar em cada formulário (contato, bordado, revenda, checkout), uma linha curta com link para a política — não precisa ser um checkbox obrigatório para esse volume de dado, mas precisa existir o aviso.
4. Se algum dia adicionar Google Analytics/Meta Pixel, aí sim entra a exigência de banner de consentimento antes de carregar esses scripts.

---

## 3. "Vibe Coding" vs. Qualidade de Código Profissional

### O que está bem feito
- Separação clara de responsabilidades em `assets/`: `supabase-client.js` (dados), `cart.js` (carrinho), `admin.js` (painel), `gemini-ai.js` (IA) — cada arquivo tem uma função e os módulos ES (`import`/`export`) são usados corretamente, sem misturar tudo num arquivo só.
- RLS bem pensada por tabela (fora o ponto do e-mail hardcoded já citado).
- Uso de DOMPurify com allow-list explícita — decisão de gente que entende o risco, não um "vibe coded" genérico.
- Sem `console.log` esquecido no código (busquei nos 8 arquivos JS e nos 13 HTML — zero ocorrências), sinal de alguém que limpou o código antes de entregar.

### O que um sênior apontaria de cara

**Duplicação massiva de HTML (o maior problema estrutural).** Não existe nenhum sistema de template/include — cada uma das 12 páginas públicas repete manualmente o mesmo topbar, header, drawer mobile e footer (são cerca de 130-150 linhas idênticas por página). Isso não é exagero de "vibe coding" pontual, é a arquitetura inteira do projeto: qualquer ajuste no header (como os que fizemos nesta conversa) exige editar as 12 páginas com `sed`/find-replace em vez de editar um componente. Deu certo até aqui porque cada mudança foi cuidadosamente replicada, mas é frágil — basta uma página ficar pra trás numa rodada futura para o site ficar inconsistente.
**Solução prática:** como o projeto é propositalmente vanilla (sem build step, decisão documentada em `QRV-planejamento-do-site.md`), a saída mais simples sem reescrever a stack é adotar HTML Includes nativos do navegador (`<template>` + um pequeno `layout.js` que injeta header/footer via `fetch()` de um `partials/header.html`) ou, se aceitar um passo de build leve, algo como 11ty/Astro só para montar os HTML finais a partir de partials — sem tocar no restante da arquitetura (Supabase, JS vanilla no cliente continuam iguais).

**Zero tipagem (JavaScript puro, sem TypeScript nem JSDoc).** Para uma loja pequena isso é uma escolha aceitável, mas para vender como "produto corporativo de alto padrão" é o primeiro ponto que um comprador técnico vai notar — não há nenhuma garantia em tempo de escrita de que `produto.preco` é number, ou que `getSiteConfig()` retorna string, por exemplo. Não achei nenhum bug causado por isso hoje, mas é dívida técnica que cobra juros conforme o projeto cresce.
**Solução prática:** não precisa migrar tudo de uma vez — dá pra adicionar `// @ts-check` + arquivos `.d.ts` com JSDoc nos módulos mais críticos (`supabase-client.js`, `cart.js`) e rodar `tsc --noEmit` no CI, ganhando checagem de tipos sem trocar a stack.

**Nenhum vazamento de memória por `requestAnimationFrame`/Canvas** — não existe animação de partículas em Canvas neste projeto (isso pode ter vindo de uma referência de outro site, como a MCJ). O único timer é o carrossel do banner (`index.html:358`, `setInterval` a cada 5s) — está corretamente escopado dentro de uma IIFE, sem `clearInterval` no fim porque, por ser um site multi-página tradicional (não SPA), o timer morre sozinho na troca de página. Não é um problema real aqui.

**Re-renders desnecessários:** como não há framework reativo, "re-render" no sentido React não se aplica — mas há um padrão repetitivo em `admin.js` de recriar `innerHTML` inteiro (tabela de produtos, listas de mensagens) a cada pequena ação (marcar como lida, excluir um item) em vez de atualizar só o nó que mudou. Funciona bem no volume atual (uma loja pequena, dezenas/centenas de linhas), mas não escalaria bem para milhares de produtos/mensagens sem paginação — hoje não existe paginação em nenhuma lista do admin.

**SEO básico ausente:** nenhuma das 13 páginas tem `<meta name="description">`, não existe `robots.txt` nem `sitemap.xml` no projeto. Para um site que vai "vender para o mercado corporativo", isso pesa na credibilidade e no ranqueamento.

---

## 4. Nota e Diagnóstico Final de Mercado

**Nota Desktop: 7,5/10.** A experiência visual está bem cuidada depois das várias rodadas de ajuste fino nesta conversa (hero acima da dobra, header proporcional, painel admin com identidade visual própria), a navegação funciona, o catálogo e o carrinho são coerentes. Perde pontos por: SEO básico ausente, falta de paginação nas listas do admin, e pela dívida técnica de duplicação de HTML que vai custar caro em manutenção.

**Nota Mobile: 7/10.** As últimas correções (banner sem cortar, margens laterais ajustadas) resolveram os problemas mais visíveis. Ainda assim, sem acesso a um dispositivo real para testar toque, não posso confirmar performance de carregamento de imagem (não vi `srcset`/imagens responsivas — todas as fotos parecem ser servidas no tamanho original para qualquer tela, o que pesa no 4G).

**Veredito franco: o site está no nível "avançado/pronto para operar", mas não no nível "produto corporativo pronto pra vender sem ressalvas".** A parte visual e a experiência de compra estão em patamar profissional. O que te tira do nível "pronto para o mercado corporativo de alto padrão" hoje são três coisas concretas, nesta ordem de urgência:

1. **O XSS armazenado no painel admin (item 1.3)** — é uma vulnerabilidade real e explorável agora mesmo por qualquer visitante, e é o tipo de falha que travaria uma auditoria de segurança formal de qualquer cliente corporativo sério. Correção é rápida (uma função de escape, três lugares para aplicar).
2. **Ausência total de Política de Privacidade/Termos (item 2)** — sem isso, o site está descumprindo a LGPD de forma literal e visível (o link fantasma no rodapé piora, não ajuda). Para venda B2B/corporativa, esse é frequentemente o primeiro documento que o comprador pede para ver.
3. **A chave de API do chat exposta no navegador (item 1.1)** — não é "amador", é uma escolha consciente e documentada no próprio código, mas precisa da restrição por domínio no Google Cloud Console para não virar um problema de custo inesperado.

Nenhum desses três é uma reescrita do projeto — são correções pontuais e bem definidas. Resolvidos esses três pontos, e com uma segunda passada para reduzir a duplicação de HTML, o projeto sobe tranquilamente para o patamar "profissional, pronto para venda corporativa" que você está mirando.
