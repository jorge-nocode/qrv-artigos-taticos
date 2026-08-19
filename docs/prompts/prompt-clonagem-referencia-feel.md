# Prompt: Clonagem pixel-perfect da referência Feel Comércio → QRV Artigos Táticos

Cole o texto abaixo no Claude (extensão Claude in Chrome, ou Claude Code com acesso ao navegador) para que ele confira a página de referência em detalhe e ajuste o site QRV batendo exatamente no layout, mantendo o conteúdo militar.

---

## PROMPT

Você tem acesso ao navegador (Claude in Chrome) e aos arquivos do projeto QRV Artigos Táticos, em `C:\Users\jorge\Downloads\CLAUD COD\qrv`. Meu site é modelado visualmente numa loja de produtos Apple, trocando o conteúdo para artigos táticos/militares (não é plágio: é um site diferente, com produtos, textos e marca próprios — só a estrutura visual e o layout estão sendo usados como referência de design, e a paleta de cores será alterada depois). Preciso que você confira a página de referência **no código e visualmente**, e ajuste o meu site (`index.html` + `assets/style.css`, e as páginas internas equivalentes) para bater exatamente com ela nos mínimos detalhes de layout — sem copiar textos, imagens ou nomes de produtos da referência.

**Página de referência:** https://feelcomercio.ab.rio.br/

### O que fazer

1. **Abra a referência no navegador** (desktop, depois redimensione para tablet ~820px e mobile ~390px) e tire screenshots de cada seção da home: header/topbar, hero/carrossel promocional, barra de confiança (frete/segurança/suporte/parcelamento), "Produtos Recentes", mosaico de categorias (Airpods/Watch/Macbook — 2 colunas estreitas + 1 larga), "Últimas do Blog", card de newsletter, rodapé (colunas + formas de pagamento + selos).

2. **Inspecione o código-fonte/CSS computado** de cada seção (DevTools) e anote, para cada uma:
   - Espaçamentos exatos (padding/margin/gap) em px ou rem
   - Larguras máximas de container e breakpoints onde o layout muda
   - Tipografia: família, peso, tamanho, line-height, letter-spacing de cada tipo de texto (títulos, subtítulos, preços, botões)
   - Border-radius, sombras, transições/hover states
   - Proporções de imagem (aspect-ratio) e comportamento de crop (cover/contain)
   - Como o grid do mosaico de categorias é montado (colunas, alturas iguais)
   - Comportamento do carrossel/hero (setas, dots, autoplay, transição)

3. **Compare seção por seção com o meu site** (arquivos em `C:\Users\jorge\Downloads\CLAUD COD\qrv`: `index.html`, `assets/style.css`, e o mesmo padrão nas páginas internas — `produtos.html`, `produto.html`, `bordados.html`, `quem-somos.html`, `revendedor.html`, `cart.html`, `checkout.html`, `contato.html`). Para cada divergência de espaçamento, alinhamento, tamanho de fonte, proporção de imagem, comportamento responsivo etc., ajuste o CSS/HTML do meu site para bater com a referência.

4. **Não altere:**
   - Os textos, nomes de produtos, categorias e conteúdo (tudo já é sobre artigos táticos/militares, não sobre Apple)
   - As imagens já usadas no site (fotos de produtos militares, banners táticos)
   - A paleta de cores atual (variáveis em `:root` no `style.css`) — isso será trocado depois, numa etapa separada
   - Integrações já funcionando (Supabase, carrinho, checkout, WhatsApp float, chatbot)

5. **Ao final**, valide balanceamento de tags HTML e chaves CSS em todos os arquivos alterados, e me dê um resumo objetivo do que foi ajustado, seção por seção (ex: "espaçamento do hero reduzido de Xpx para Ypx pra bater com a referência", "grid do mosaico de categorias corrigido para manter a mesma altura entre os 3 cards").

Se qualquer coisa na referência não fizer sentido pro nicho tático/militar (ex: um elemento muito específico da Apple), me avise em vez de forçar a mudança.

---

*Dica: depois que a estrutura estiver 100% alinhada, é só me pedir a troca de paleta de cores (hoje o site usa tons de cinza/preto com vermelho de destaque) e eu aplico sobre essa base já ajustada.*
