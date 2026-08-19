docs/# BLUEPRINT TÉCNICO — QRV Artigos Táticos
### Documento-mestre para recriar/adaptar este site em um novo projeto

> Cole este documento inteiro como primeira mensagem de uma nova conversa para recriar a mesma arquitetura, visual e comportamento — trocando o conteúdo (produtos → serviços, categorias → tipos de manutenção, etc.) para o novo negócio.

---

## ⚠️ Aviso importante sobre a stack (leia antes de tudo)

Se você pedir para uma IA genérica "documentar este projeto", ela pode presumir uma stack moderna (Next.js, React, Tailwind, Shadcn/UI, Framer Motion). **Isso está errado para este projeto.** A decisão consciente aqui foi:

> **HTML5 + CSS3 + JavaScript puro (vanilla), sem framework, sem build step, sem bundler.** Supabase é chamado diretamente do navegador via `<script type="module">`. Deploy estático na Vercel a partir de um repositório GitHub.

Motivo da escolha: menos peça móvel, deploy instantâneo (git push → live), zero configuração de build, fácil de editar arquivo por arquivo em tempo real com uma IA, sem custo/complexidade de servidor Node. Para o novo projeto (oficina de motores elétricos), a recomendação é manter exatamente essa mesma stack, a menos que haja um motivo técnico concreto para mudar.

---

## 1. Visão Geral e Arquitetura

### 1.1 Tecnologias reais utilizadas

| Camada | Tecnologia |
|---|---|
| Marcação | HTML5 semântico, um arquivo `.html` por página (sem SPA, sem router client-side) |
| Estilo | CSS3 puro em **um único arquivo** `assets/style.css` (~1160 linhas), com CSS Custom Properties (`:root{--var:...}`) para paleta de cores |
| Interatividade | JavaScript **vanilla**, `type="module"` nos scripts que usam `import`/`export` (ES Modules nativos do navegador, sem transpilação) |
| Backend de dados | **Supabase** (Postgres + Auth + Storage), client JS carregado via CDN ESM: `import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'` |
| IA generativa | Google Gemini API, chamada direto do client-side para um chatbot de atendimento (chave de API guardada no banco, não no código-fonte) |
| Bibliotecas externas via CDN | `DOMPurify` (sanitização de HTML gerado a partir de descrição/markdown) — outras libs como Swiper.js foram **removidas** ao longo do projeto em favor de grades estáticas simples |
| Fontes | Google Fonts: `Inter` (corpo/texto), `Poppins` (títulos/headings), `Oswald` (carregada mas pouco usada) |
| Hospedagem/Deploy | Vercel, deploy automático a partir do push no GitHub (branch `main`) |
| Sem build step | Não há `npm run build`, não há `package.json` no projeto do site (o Supabase JS vem de CDN, não de `node_modules`) |

### 1.2 Estrutura de pastas e arquivos

```
projeto-raiz/
├── index.html                          → Home
├── produtos.html                       → Listagem/catálogo com filtros
├── produto.html                        → Página de produto individual
├── cart.html                           → Carrinho (multi-item, local, sem checkout de pagamento real)
├── checkout.html                       → Formulário de dados de entrega → gera resumo e manda por WhatsApp
├── contato.html                        → Fale Conosco (formulário + mapa + info)
├── quem-somos.html                     → Institucional (missão, história)
├── revendedor.html                     → Formulário "Seja um Revendedor" (B2B)
├── bordados.html                       → Página de serviço (bordado/personalização) com tabela de preços + formulário
├── admin.html                          → Painel administrativo (CRUD, uso exclusivo do dono)
├── blog-*.html                         → Artigos de blog (uma página HTML por artigo, sem CMS)
├── QRV-planejamento-do-site.md         → Documento de planejamento/decisões (histórico do projeto)
├── supabase-setup.sql                  → Script único de criação de tabelas + RLS (rodar 1x no SQL Editor)
├── supabase-site-config.sql            → Script da tabela `site_config` (chave/valor, usada pela chave da API do chat)
├── seed-produtos-catalogo.sql          → Dados de exemplo para popular o catálogo
└── assets/
    ├── style.css                       → CSS único de todo o site (versionado com ?v=N — ver seção 5.6)
    ├── site.js                         → Menu mobile, carrossel de blog, banner promo, newsletter
    ├── supabase-client.js              → Client Supabase + TODAS as funções de acesso a dados (fetch, insert, formatação)
    ├── cart.js                         → Lógica do carrinho (localStorage), badge, toast de "adicionado"
    ├── chatbot.js                      → Widget de chat com IA (Gemini), persona customizada
    ├── theme.js                        → Legado de alternância clara/escura (hoje o site é single-theme claro)
    ├── admin.js                        → Lógica do painel admin (CRUD produtos, upload de fotos, mensagens)
    ├── logo.png, favicon*.{svg,png,ico}
    ├── hero-*.jpg/png                  → Imagens de banners e hero (versões desktop e `-mobile` dedicadas)
    ├── banner-categoria-*.png          → Banners do mosaico de categorias
    ├── produto-*.jpg                   → Fotos de exemplo/placeholder de produto
    ├── pagamento-bandeiras.png         → Imagem composta de bandeiras de pagamento (rodapé)
    ├── selo-ssl.png, selo-loja-protegida.png → Selos de segurança
    └── produtos-catalogo/              → Fotos reais do catálogo seed
```

**Regra fixa de cache-busting:** toda página HTML carrega o CSS como `<link rel="stylesheet" href="assets/style.css?v=N">`. Sempre que `style.css` é editado, o número da versão é incrementado **em todas as páginas simultaneamente** (via `sed` ou find-replace global), para evitar que visitantes recorrentes vejam CSS antigo em cache. Neste projeto já passou de v=5 a v=18 ao longo das sessões de ajuste fino.

---

## 2. Identidade Visual e Estilização

### 2.1 Paleta de cores (CSS Custom Properties, tema único claro estilo "Apple/Feel")

O projeto começou com tema escuro tático (preto + verde-oliva + dourado) inspirado na marca, mas foi **migrado para um tema único claro**, estilo minimalista (referência de design: site "Feel", loja Apple-like). Declarada em `:root`:

```css
:root, :root[data-theme="light"]{
  --bg:#ffffff;              /* fundo geral */
  --bg-alt:#F8F9FA;          /* fundo alternativo (inputs de busca, etc.) */
  --panel:#ffffff;           /* fundo de cards */
  --olive:#2b2b28;           /* remanescente do tema tático — hoje = --gold */
  --olive-light:#6b6b62;
  --gold:#2b2b28;            /* cor de "destaque" — hoje quase preto, não dourado */
  --gold-light:#6b6b62;      /* cinza médio, usado em labels/links secundários */
  --text:#1D1D1F;            /* texto principal — quase preto */
  --text-muted:#68685f;      /* texto secundário */
  --border:rgba(29,29,31,.12); /* bordas sutis */
  --red:#FF3B30;             /* CTA principal (botões de ação, alertas) */
  --green:#00C853;           /* preço, sucesso, "Adicionar ao Carrinho" */
  --green-dark:#00A844;      /* hover do verde */
  --card-shadow:0 14px 34px rgba(20,20,15,.08);
  --topbar-bg:#ffffff;
  --header-bg:#ffffff;
  --footer-bg:#FFFFFF;
}
```

Cores literais usadas fora das variáveis (pontuais, para componentes específicos):
- `#22c55e` — verde do botão "Adicionar ao Carrinho" da página de produto (ligeiramente diferente do `--green` do resto do site)
- `#111827` / `#374151` — texto escuro em abas/descrição de produto (mais neutro que `--text`)
- `#3b82f6` — azul do link auxiliar "Não sei meu CEP"
- `#e5e7eb` / `#d1d5db` / `#f2f2ef` — cinzas de borda/placeholder em componentes específicos
- Paleta de ícones de pagamento (chips coloridos SVG inline): Visa `#1a1f71`, Mastercard círculos `#eb001b`/`#f79e1b`, Amex `#2e77bc`, Elo `#fdd800`, Hipercard `#a5122a`, Diners `#3a3a3a`, JCB `#0b6f3e`, Pix `#0d9488`, Boleto `#111827`

**Nota histórica importante (bug real que já aconteceu — documentar para não repetir):** o site tinha alternância clara/escura via `data-theme` + `localStorage`. Ao migrar para tema único, algumas regras "só tema claro" (`:root[data-theme="light"] .campo{...}`) continuaram condicionadas ao atributo, enquanto a paleta base (`:root`) já tinha virado clara — isso criava uma combinação impossível de "fundo quase preto + texto quase preto" em cards específicos (formulário de bordado, Fale Conosco) sempre que o navegador do visitante tinha `data-theme=dark` salvo de uma visita antiga. **Lição para o novo projeto: se for tema único, não deixe NENHUM estilo condicionado a atributo de tema — declare direto na classe base.**

### 2.2 Tipografia

```html
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Oswald:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700;800;900&display=swap" rel="stylesheet">
```

- **Corpo de texto:** `'Inter', sans-serif` — aplicado via `body{font-family:'Inter',sans-serif;}`
- **Títulos (h1, h2, h3):** `'Poppins', sans-serif`, `font-weight:700` — regra global `h1,h2,h3,.stencil{font-weight:700;font-family:'Poppins',sans-serif;}`
- **Tamanho base:** `html{font-size:18.5px;}` (base elevada acima do padrão 16px — todo o resto do site usa `rem`, então essa única linha escala a tipografia inteira proporcionalmente)
- **Hierarquia típica de página de produto (referência de escala):** título do produto `2rem` (~37px), preço `1.35rem`, texto de descrição `.94rem`, breadcrumb `.75rem`, labels de formulário `.68–.76rem`

### 2.3 Padrões visuais (cards, sombras, bordas, hover)

- **Border-radius:** varia por contexto — botões em pílula usam `20–30px` (praticamente cápsula); cards de produto/imagens usam `14–20px`; inputs/botões utilitários (ex: "Consultar" CEP) usam raio quase reto (`2–4px`) para parecer "bloco retangular definido"
- **Sombra de card:** `--card-shadow: 0 14px 34px rgba(20,20,15,.08)` — sombra suave e larga, aplicada via `box-shadow` em `.product-card`, `.contact-card`, `.search-panel`, tabelas, etc.
- **Botões:**
  - `.btn-gold` (CTA vermelho principal, usado em formulários/CTAs genéricos): `background:var(--red); border-radius:30px; padding:13px 34px;` com hover `transform:translateY(-2px)` + sombra vermelha
  - Botão verde "pill" de compra (produto): `border-radius:25px; height:44px; padding:0 30px;` — **importante:** existia uma classe global `.btn-add-cart` (usada em TODOS os cards de produto do site, com `width:100%`) que colidia por nome com uma tentativa de estilizar só o botão da página de produto — a correção foi criar uma classe própria (`.btn-add-cart-detail`) para não herdar o `width:100%` sitewide. **Lição para o novo projeto: nomeie classes de botão por contexto específico desde o início, evite reusar nomes genéricos em componentes com necessidades de layout diferentes.**
  - Botão outline: `background:transparent;border:1px solid var(--gold);border-radius:4px;`
- **Cards de produto (`.product-card`):** foto com badge de categoria no canto, corpo com título/localização/preço/parcelamento, botão de compra fixado embaixo (grid com `justify-content:space-between` para nivelar botões mesmo com títulos de tamanhos diferentes)
- **Hover/motion:** transições simples via `transition:transform .2s, box-shadow .2s` (sem biblioteca de animação) — usado em botões (`translateY(-2px)` no hover) e ícones de tema/menu (`scale(1.08)`)
- **Efeito "glass"/dark card:** alguns formulários (busca da home, Solicitar Bordado, Fale Conosco) usam um card escuro translúcido: `background:rgba(20,21,15,.88); backdrop-filter:blur(8px);` com inputs em `background:rgba(255,255,255,.08); color:#fff;` — mantido como escolha visual intencional mesmo com o resto do site em tema claro (contraste dramático)
- **Imagens de banner/hero:** técnica de "imagem contida" (background-image dentro de container com `border-radius`, sem full-bleed `100vw`) — **decisão deliberada** depois de um bug real: usar `width:100vw` + margens negativas para banners full-width causava barras cinzas nas laterais (bug do Chromium: `100vw` inclui a largura da scrollbar). Proteção permanente: `html, body { overflow-x: hidden; }`

---

## 3. Estrutura de Páginas e Componentes

### 3.1 Lista completa de páginas

| Página | Arquivo | Propósito |
|---|---|---|
| Home | `index.html` | Hero/carrossel promocional, barra de confiança, produtos recentes, mosaico de categorias, blog, newsletter, Instagram CTA |
| Catálogo | `produtos.html` | Grid de produtos com filtros (categoria, corporação, preço, busca) |
| Produto | `produto.html` | Galeria + compra + abas de descrição + relacionados (ver detalhamento completo abaixo) |
| Carrinho | `cart.html` | Lista de itens, quantidade, total, ir para checkout |
| Checkout | `checkout.html` | Dados de entrega → gera link do WhatsApp com resumo do pedido (sem gateway de pagamento real) |
| Fale Conosco | `contato.html` | Formulário + WhatsApp + e-mail + endereço + mapa incorporado |
| Quem Somos | `quem-somos.html` | Missão, história institucional |
| Seja Revendedor | `revendedor.html` | Formulário B2B dedicado (nome, telefone, cidade, tipo de negócio) |
| Bordados/Personalização | `bordados.html` | Página de **serviço** (não produto): tabela de preços + formulário "Solicitar Bordado" |
| Blog (×N) | `blog-*.html` | Uma página estática por artigo — sem CMS, editado diretamente no HTML |
| Admin | `admin.html` | Painel logado (e-mail único autorizado) — CRUD de produtos, upload de fotos, leitura de mensagens/solicitações |

### 3.2 Componentes globais (presentes em todas ou quase todas as páginas)

**Topbar** (`.topbar`) — faixa fina acima do header: ícone Instagram à esquerda, links rápidos (Home/Sobre/Blog/Contato) à direita. `height:42px`, fonte pequena (12.8px fixo, não escala com `rem`).

**Header principal** (`header.main`) — `position:sticky;top:0`, altura 150px desktop:
- Logo circular (116×116px, `border-radius:50%`) + botão hamburguer (mobile)
- Navegação principal centralizada (categorias)
- Barra de busca inline (pílula cinza clara, `border-radius:30px`)
- Ícone de conta (leva para Fale Conosco) + ícone de carrinho com badge de contagem (`.cart-count`, vermelho, só aparece quando `count > 0`)
- Em telas ≤960px: nav principal some, hamburguer aparece → abre **drawer mobile** (`.mobile-drawer`, desliza da esquerda, overlay escuro)

**Botão flutuante WhatsApp** (`.whatsapp-float`) — fixo no canto inferior direito, `position:fixed;bottom:26px;right:26px`, círculo verde com ícone, em todas as páginas.

**Widget de chat "Recruta QRV"** (`chatbot.js`) — assistente de IA com **persona customizada** (recruta caricato de caserna, trata o cliente como "senhor/senhora", entusiasmado, sempre educado). Integração com Gemini API; a chave fica salva na tabela `site_config` do Supabase (não hardcoded no JS) para evitar exposição de segredo em site 100% estático e permitir troca sem redeploy.

**Rodapé** (`footer`) — grid de 4 colunas: logo+redes sociais / links institucionais / formas de pagamento + selos de segurança / contato (WhatsApp, e-mail, horário, endereço). Newsletter e Instagram CTA ficam em seções próprias logo acima do footer.

**Newsletter** (`.newsletter-band` / `.newsletter-card`) — card com imagem de fundo arredondada (`border-radius:24px`, `aspect-ratio:2.34/1` desktop / `4/5` mobile com imagem própria para mobile), título + formulário de e-mail em pílula com blur, botão vermelho.

### 3.3 Detalhamento da Página de Produto (`produto.html`) — componente mais elaborado do site

Esta foi a página mais iterada do projeto (múltiplas rodadas de ajuste fino contra uma referência visual chamada "Feel"). Estrutura final:

1. **Breadcrumb** — `Home / Categoria / Nome do Produto`
2. **Grid de duas colunas** (`grid-template-columns:1.1fr 1fr`, colapsa para 1 coluna em ≤960px):
   - **Coluna esquerda — Galeria** (`position:sticky` no desktop): imagem principal quadrada (`aspect-ratio:1/1`, `border-radius:20px`), miniaturas clicáveis abaixo, lightbox fullscreen ao clicar na foto principal
   - **Coluna direita — Compra:**
     - Código/categoria (ocultos visualmente por padrão — só metadado)
     - Título (`h1`, Poppins 700, 2rem)
     - Selo de estoque (só aparece se `sob_encomenda` ou `esgotado` — fica oculto quando disponível, ao contrário do padrão antigo que sempre mostrava "Disponível")
     - Seletor de variante (tamanho/cor) em chips, quando aplicável
     - Bloco de preço: valor atual, valor antigo riscado (se promoção), linha de parcelamento calculada (`ou 3x de R$X sem juros`)
     - Campo de personalização (nome de guerra), só visível se `produto.personalizavel === true`
     - Seletor de quantidade (stepper +/-)
     - Botão "Adicionar ao Carrinho" (pílula verde, `height:44px`) — **decisão de manter separado de qualquer botão de WhatsApp** direto nessa área
     - Calculadora de frete por CEP (estimativa simples por faixa de CEP, sem integração real com Correios — só para dar sensação de prazo) + link auxiliar "Não sei meu CEP"
     - Faixa de ícones de pagamento (chips SVG coloridos, uma linha só, com quebra em telas muito estreitas)
     - Resumo curto da descrição (1-2 frases, extraídas automaticamente do início da descrição completa)
     - Formulário de contato **recolhível** (`<details>`) — "Prefere falar com a gente antes? Envie uma mensagem"
3. **Abas full-width** (Descrição / Informações Adicionais / Avaliações) — bloco centralizado, `max-width:820px`, painel com borda arredondada (`border-radius:20px`)
4. **Produtos Relacionados** — grid estático (não é mais carrossel — inicialmente foi feito com Swiper.js em efeito coverflow, depois **trocado para grid estático simples** para bater com a referência visual): cards com imagem 4:3, título, preço, parcelamento, botão "Comprar" em pílula, todos os cards da mesma altura (`justify-content:space-between` empurra o botão pro rodapé do card mesmo com títulos de tamanhos diferentes)
5. **Newsletter** (mesmo componente global) + **Footer**

**Lógica JS da página de produto** (inline `<script type="module">`):
- Lê `?codigo=` da URL, busca produto real no Supabase via `fetchProdutoByCodigo`
- Preenche todos os campos dinamicamente (título, preço, fotos, variantes, especificações)
- Calcula parcelamento (`preço / 3`)
- Renderiza produtos relacionados (mesma categoria, excluindo o atual, limite 4) com template local `relatedCardHTML(p)`
- Fallback com dados de exemplo quando não há `?codigo=` na URL

---

## 4. Conteúdo e Copywriting (estrutura de referência)

### 4.1 Home — títulos e microcopy reais

- **Title da aba:** "QRV Artigos Táticos | Equipando você para o combate"
- **Trust bar (4 itens, ícone + título + subtítulo):**
  - "Frete Grátis" — "Compras acima de R$399,00"
  - "Parcele sua Compra" — "Parcele em até 3x sem juros"
  - "Tire suas Dúvidas Aqui" — "Fale conosco pelo WhatsApp"
  - "Loja 100% Segura" — "Seus dados protegidos"
- **Seção de produtos:** "Produtos Recentes" / "Confira nossas novidades"
- **Mosaico de categorias (eyebrow + título + CTA):** "Resistência" → Calçados / "Precisão" → Cutelaria / "Equipamento" → Mochilas — todos terminam em "Conferir"
- **Blog:** "Últimas do Blog" / "Dicas, novidades e conteúdo tático direto da QRV."
- **Newsletter:** "Receba Todas as Novidades" / "Cadastre-se para receber ofertas exclusivas e lançamentos em primeira mão." / botão "Inscreva-se"
- **Instagram:** "Siga Nosso Instagram" / botão "Seguir"

### 4.2 Página de Bordados — tabela de serviços (exemplo de estrutura "tabela de preços de serviço")

| Serviço | Valor |
|---|---|
| Fixação de divisas | R$ 10,00 cada |
| Manopla | R$ 10,00 |
| Insígnia | R$ 5,00 cada |
| Dom (nome de guerra) | R$ 15,00 |
| Bordado na camisa | R$ 11,40 |

Nota de rodapé: "Valores de referência — confirmamos o orçamento final pelo WhatsApp de acordo com a peça e a quantidade." Formulário abaixo: "Solicitar Bordado" com campos Nome, Telefone/WhatsApp, Tipo de Peça (select), "O que bordar?" (texto livre), Observações.

**Isto é diretamente reaproveitável para a oficina de motores** — troque por uma tabela "Serviço / Valor" de manutenção (ex: "Rebobinamento de motor monofásico — a partir de R$X", "Troca de rolamento — R$X", "Diagnóstico — R$X grátis/cobrado", etc.) com o mesmo padrão de nota de rodapé ("valores de referência, orçamento fechado após avaliação") e formulário "Solicitar Orçamento".

### 4.3 Rodapé — informações institucionais fixas

Horário: "Seg. a Qui. 10h-20h30 · Sex. 10h-19h · Sáb. 09h-16h"
Endereço: "Av. Santos Dumont, 61 · Cumbica · Guarulhos - SP · CEP 07180-270"
WhatsApp e e-mail como links diretos (`https://wa.me/55...` e `mailto:`).

---

## 5. Funcionalidades e Interatividade

### 5.1 Botões e CTAs — comportamento

- **"Adicionar ao Carrinho"** (em qualquer card de produto): delegação de evento global em `cart.js` (`document.addEventListener('click', ...)` filtrando `.add-to-cart-btn`) — lê os dados do produto de um atributo `data-produto` (JSON serializado no próprio HTML do card), adiciona ao carrinho (localStorage), mostra toast "Adicionado ✓" por 1.4s, sem reload de página
- **WhatsApp:** todos os links de WhatsApp seguem o padrão `https://wa.me/{numero}?text={mensagem pré-codificada}` — a mensagem já vem preenchida com contexto (nome do produto, código, ou resumo completo do carrinho no checkout)
- **Checkout → WhatsApp:** como não há gateway de pagamento real, o "fechar pedido" monta uma mensagem de texto com todos os itens, quantidades, variantes e total, e abre o WhatsApp com isso pré-preenchido (`buildWhatsappResumoCarrinho()` em `cart.js`)
- **Formulários (Contato, Bordado, Revenda):** `preventDefault()` no submit → `insert` direto no Supabase via função dedicada (`submitMensagemContato`, `submitSolicitacaoBordado`, `submitSolicitacaoRevenda`) → feedback visual no próprio botão ("Enviando..." → "Mensagem enviada ✓") → `form.reset()`

### 5.2 Carrinho (localStorage, sem backend de pedidos)

Chave: `qrv_cart_v1`. Cada item é identificado por uma chave composta (`código + tamanho + cor + personalização`), permitindo o mesmo produto aparecer como linhas separadas se o cliente pedir tamanhos diferentes. Eventos customizados (`qrv-cart-updated`) disparados a cada mudança para sincronizar badges em qualquer parte da página.

### 5.3 Animações e transições

Não há biblioteca de animação (sem Framer Motion/GSAP). Tudo é CSS `transition` simples:
- Hover de botão: `transform:translateY(-2px)` + sombra
- Abertura de drawer mobile: `transform:translateX(-100%) → translateX(0)`, `transition:transform .35s ease`
- Lightbox de produto: fade via classe `.open` + `display`
- Carrossel de banner promocional: `setInterval` trocando `.active` a cada 5s, com dots clicáveis
- Accordion (`<details>`) nativo do HTML para formulário de contato recolhível

### 5.4 Responsividade

- Breakpoints principais: `1080px`, `960px` (grid de produto empilha), `900px`, `768px` (header encolhe, hamburguer aparece), `640px` (grids viram 1-2 colunas, textos reduzem)
- **Padrão de imagens duplas:** hero/banners têm arquivo dedicado para mobile (ex: `hero-artigos-taticos-mobile.png`), trocado via `background-image` inline `!important` dentro de media query — não é a mesma imagem redimensionada, é uma composição/recorte pensado especificamente para proporção retrato
- Grid de produtos: 4 colunas desktop → 2 colunas em `≤900px` (usando seletor combinado de alta especificidade `.product-grid.product-grid-4` para evitar ser vencido por regra genérica antiga — bug já corrigido no histórico do projeto)
- Menu: nav horizontal desktop → drawer lateral mobile
- **Lição de bug real de mobile:** uma linha de 9 ícones de pagamento não cabia em telas estreitas e ficava dependendo de scroll horizontal invisível (sem indicador visual) — corrigido com `flex-wrap:wrap` abaixo de 480px. **Sempre testar linhas de ícones/badges com muitos itens em viewport de ~360-390px antes de considerar "pronto".**

### 5.5 Testes/QA reais aplicados neste projeto (processo, não só código)

- Verificação via inspeção de CSS computado (`getComputedStyle`) de um site de referência para copiar fielmente fontes, tamanhos, cores e espaçamentos, em vez de "adivinhar" por print de tela
- Teste em aba anônima / hard refresh depois de cada deploy (por causa do cache do `?v=N`)
- Atenção redobrada a **colisão de nomes de classe CSS** — o bug mais persistente e difícil de diagnosticar deste projeto foi uma classe reaproveitada (`.btn-add-cart`) definida duas vezes no mesmo arquivo CSS para dois contextos diferentes (cards da loja com `width:100%` vs. botão único da página de produto), onde a definição que vinha depois no arquivo sempre vencia, mesmo depois de várias tentativas de "diminuir o padding". **Sempre که `grep` o nome da classe no CSS inteiro antes de estilizar algo que já existe, para achar definições duplicadas/conflitantes.**

### 5.6 Cache-busting do CSS (processo obrigatório)

Toda vez que `style.css` muda: incrementar `?v=N` em **todos os arquivos HTML** (não só o que você editou) com um comando único, ex.:
```bash
sed -i 's/style\.css?v=N/style.css?v=N+1/g' *.html
```
Depois validar: `grep -c 'style.css?v=N+1' *.html` (deve retornar 1 por arquivo) e checar balanceamento de chaves do CSS (`grep -o '{' style.css | wc -l` vs `}`).

---

## 6. Modelo de Dados (Supabase) — reaproveitável quase 1:1

### 6.1 Tabelas

```sql
-- Produtos (para a oficina: renomear/adaptar para "servicos" ou manter "produtos"
-- se também vender peças/componentes)
create table public.produtos (
  id uuid primary key default gen_random_uuid(),
  codigo text unique not null,
  titulo text not null,
  categoria text not null,          -- tipo de serviço/produto
  corporacao text,                   -- adaptar: ex. marca/fabricante do motor
  descricao text,                    -- aceita markdown simples (ver 6.3)
  tamanhos text[] default '{}',
  cores text[] default '{}',
  preco numeric not null,
  preco_promocional numeric,
  estoque_status text not null default 'disponivel', -- disponivel | sob_encomenda | esgotado
  personalizavel boolean default false,
  fotos text[] default '{}',
  destaque boolean default false,
  status text not null default 'ativo',              -- ativo | inativo | arquivado
  created_at timestamptz default now()
);

create table public.mensagens_contato (
  id uuid primary key default gen_random_uuid(),
  nome text not null, email text, telefone text, mensagem text not null,
  lida boolean default false, created_at timestamptz default now()
);

-- Adaptar para "solicitacoes_orcamento" no novo projeto
create table public.solicitacoes_bordado (
  id uuid primary key default gen_random_uuid(),
  nome text not null, telefone text not null,
  tipo_peca text, o_que_bordar text, observacoes text,
  status text not null default 'novo',
  created_at timestamptz default now()
);

create table public.solicitacoes_revenda (
  id uuid primary key default gen_random_uuid(),
  nome text not null, telefone text not null,
  cidade text, tipo_negocio text, observacoes text,
  status text not null default 'novo',
  created_at timestamptz default now()
);

-- Configuração chave/valor (usada para a chave de API do chat, editável no admin)
create table public.site_config (
  chave text primary key,
  valor text
);
```

### 6.2 RLS (Row Level Security) — padrão replicável

- **Leitura pública:** só registros com `status = 'ativo'` na tabela de produtos/serviços; qualquer visitante anônimo pode fazer `insert` em mensagens/solicitações (formulários públicos)
- **Escrita/gestão total:** restrita a **um único e-mail autorizado**, validado direto na policy via `auth.jwt() ->> 'email' = 'seuemail@dominio.com'` — **sem tabela extra de usuários/permissões**, simplicidade máxima para um site de dono único
- **Storage:** bucket público (`produtos-fotos`) para leitura; upload/delete só para o e-mail autenticado autorizado

### 6.3 Convenções de conteúdo

- **Descrição de produto/serviço** aceita um mini-markdown próprio (não é markdown padrão, é um parser customizado em `supabase-client.js`): `### Título`, `---` vira `<hr>`, `**negrito**`, listas com `•`/`-`/`*`, parágrafos separados por linha em branco — depois sanitizado com DOMPurify antes de renderizar
- **Categoria** é sempre um slug curto em minúsculas (`vestuario`, `calcados`...) mapeado para um rótulo amigável em `labelCategoria()` — **padrão a reaproveitar:** slug técnico no banco + função de tradução para exibição, facilita trocar o texto exibido sem migração de dados

---

## 7. Código-Fonte Base Reaproveitável

### 7.1 `assets/supabase-client.js` — módulo central (adaptar constantes no topo)

```js
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = 'SUA_URL_AQUI';
const SUPABASE_ANON_KEY = 'SUA_CHAVE_ANON_AQUI';
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
export const FOTOS_BUCKET = 'produtos-fotos'; // trocar nome do bucket se quiser
export const WHATSAPP_NUMERO = '55DDDNUMERO'; // só dígitos, com DDI+DDD

export function formatBRL(value) { /* Intl.NumberFormat via toLocaleString */ }
export function labelCategoria(cat) { /* map slug -> rótulo amigável */ }
export function whatsappLink(produto) { /* monta wa.me com mensagem pronta */ }
export async function fetchProdutos({ categoria, corporacao, destaque, limit, precoMax, busca, codigo }) { /* query filtrada */ }
export async function fetchProdutoByCodigo(codigo) { /* single */ }
export async function uploadFotos(files) { /* upload pro Storage, retorna URLs públicas */ }
export async function submitMensagemContato({ nome, email, telefone, mensagem }) { /* insert */ }
export function markdownToHTML(raw) { /* parser custom simples */ }
export function descricaoToHTML(raw) { /* detecta se já é HTML ou precisa converter */ }
export function sanitizeDescricao(html) { /* DOMPurify com allowlist de tags */ }
export function productCardHTML(produto, opts) { /* template do card, reutilizado em toda a listagem */ }
```

**Por que centralizar assim:** toda página que precisa de dados importa só as funções que usa (`import { fetchProdutos, formatBRL } from './assets/supabase-client.js'`), sem duplicar lógica de fetch/formatação em cada HTML. Isso foi essencial para manter consistência ao longo de várias rodadas de edição.

### 7.2 `assets/cart.js` — carrinho local completo (reaproveitável sem alteração)

Ver código integral na seção 5.2 acima (arquivo inteiro tem ~150 linhas, self-contained, só depende de `localStorage`). Exporta: `getCart`, `addToCart`, `removeFromCart`, `updateQuantidade`, `clearCart`, `getCartCount`, `getCartTotal`, `updateCartBadge`, `buildWhatsappResumoCarrinho`.

### 7.3 Template de card de produto (padrão de card reaproveitável)

```html
<article class="product-card" data-cat="{categoria}">
  <a href="produto.html?codigo={codigo}">
    <div class="product-photo">
      <span class="badge">{Categoria}</span>
      <img src="{foto}" alt="{titulo}" loading="lazy">
    </div>
    <div class="product-body">
      <h3>{titulo}</h3>
      <p class="loc">{corporacao} · {status estoque}</p>
      <div class="product-price">{preço formatado}</div>
      <span class="installments">ou 3x de {preço/3} sem juros</span>
    </div>
  </a>
  <button type="button" class="btn-add-cart add-to-cart-btn" data-produto='{json do produto}'>Comprar</button>
</article>
```

### 7.4 Snippet de inicialização de tema (manter mesmo se for single-theme, evita "flash" de estilo errado)

```html
<script>(function(){try{var t=localStorage.getItem('qrv_theme')||'light';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();</script>
```
Colar isso **inline no `<head>`, antes do CSS**, em toda página — evita flash de conteúdo sem estilo (FOUC) relacionado a tema.

---

## 8. Como adaptar este blueprint para "Oficina de Manutenção de Motores Elétricos e Eletrodomésticos"

Mapeamento direto de conceitos (reaproveitar 100% da arquitetura, trocar só o domínio):

| QRV (loja tática) | Novo projeto (oficina) |
|---|---|
| Produto / catálogo | Serviço de manutenção (ex: rebobinamento, troca de rolamento, diagnóstico, manutenção preventiva) — ou catálogo misto de peças + serviços |
| Categoria (`vestuario`, `calcados`...) | Tipo de equipamento (`motores-monofasicos`, `motores-trifasicos`, `eletrodomesticos-linha-branca`, `bombas`, `ventiladores`...) |
| Corporação (`EB`, `PMESP`...) | Marca/fabricante do equipamento (`WEG`, `Brastemp`, `Electrolux`...) — ou tipo de cliente (residencial/industrial) |
| Tamanho/Cor (variante) | Potência (CV/HP), voltagem (127V/220V/380V), rotação (RPM) |
| Página "Bordados" (serviço + tabela de preço + formulário) | Página "Orçamento Rápido" — tabela de serviços com faixa de preço + formulário "Solicitar Avaliação" |
| "Adicionar ao Carrinho" / checkout via WhatsApp | Pode manter igual (agendar coleta/entrega do equipamento) ou trocar por "Solicitar Orçamento" direto, sem carrinho — decisão de negócio |
| "Seja um Revendedor" | "Atendimento para Empresas/Indústrias" (B2B, contratos de manutenção recorrente) |
| Estoque (disponível/sob encomenda/esgotado) | Status do serviço (`orçamento`, `em manutenção`, `pronto para retirada`) — ou manter para peças de reposição em estoque |
| Chat "Recruta QRV" (persona militar) | Nova persona (ex: "técnico" cordial, direto, focado em diagnóstico rápido) |

**Recomendação de processo para o novo chat:** cole este documento inteiro, depois diga explicitamente "mantenha a mesma arquitetura, troque só [conteúdo específico]" — isso evita que a IA do novo chat reinvente a stack (ex: sugerir Next.js) ou o modelo de dados do zero.
