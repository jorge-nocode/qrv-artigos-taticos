# QRV Artigos Táticos

Loja virtual (e-commerce) de equipamentos e artigos táticos/militares — vestuário, calçados, mochilas, brevês/insígnias, cutelaria, kits e acessórios — com serviço de bordado personalizado sob encomenda e canal de cadastro de revendedores parceiros.

**Demo:** https://qrv-artigos-taticos.vercel.app

## Stack

HTML5 + CSS3 + JavaScript ES6 (módulos nativos, sem framework nem bundler). Dados dinâmicos (catálogo, mensagens, pedidos de bordado/revenda) hospedados no Supabase (Postgres + Auth + Storage), acessado diretamente do navegador via SDK oficial e protegido por Row Level Security. Deploy estático contínuo na Vercel.

## Funcionalidades

- Catálogo de produtos com busca/filtro, carrinho de compras e checkout com fechamento de pedido via WhatsApp
- - Formulário de bordado personalizado e cadastro de revendedores parceiros
  - - Painel administrativo com CRUD de produtos, gestão de leads e preenchimento automático de ficha de produto por IA (Google Gemini)
    - - Chatbot de atendimento com IA generativa ("Recruta QRV"), com sanitização de saída via DOMPurify
      - - Conformidade técnica com LGPD (política de privacidade, termos de uso, banner de consentimento)
       
        - ## Segurança
       
        - Projeto passou por auditoria própria de segurança: correção de vulnerabilidade de XSS armazenado identificada no painel administrativo, Row Level Security revisada em todas as tabelas, e nenhuma chave sensível exposta ao navegador do visitante (secret scanning do GitHub sem alertas).
       
        - ## Estrutura
       
        - - `index.html`, `produtos.html`, `produto.html`, `cart.html`, `checkout.html` — vitrine e fluxo de compra
          - - `bordados.html`, `revendedor.html`, `contato.html` — captação de leads
            - - `admin.html` — painel administrativo (protegido por login)
              - - `assets/` — CSS, JavaScript (catálogo, carrinho, chat, componentização de header/footer) e imagens
                - - `*.sql` — scripts de criação de tabelas e políticas de segurança no Supabase
