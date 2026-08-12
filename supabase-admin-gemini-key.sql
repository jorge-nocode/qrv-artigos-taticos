-- ============================================================
-- QRV ARTIGOS TÁTICOS — Globaliza a chave do Gemini usada no
-- Preenchimento Automático por IA (cadastro de produtos no admin).
-- Rode este script UMA VEZ no SQL Editor do Supabase (depois de já
-- ter rodado o supabase-site-config.sql alguma vez).
--
-- Por que não basta usar a policy "Public read site_config" que já
-- existe: aquela policy libera leitura de QUALQUER linha da tabela
-- para QUALQUER pessoa (necessário para o widget de chat público ler
-- a chave "chatbot_gemini_key" sem estar logado). Se a chave de
-- cadastro de produtos ("produtos_gemini_key") fosse salva nessa
-- mesma tabela sem ajustar a policy, qualquer visitante do site
-- conseguiria ler essa chave também via API pública do Supabase —
-- ela deve ficar visível só para o admin autenticado. Este script
-- troca a policy de leitura pública por uma restrita apenas à chave
-- do chat, e adiciona uma policy de leitura só para o admin (que
-- cobre todas as chaves, incluindo a nova).
-- ============================================================

-- Remove a policy de leitura pública antiga (liberava a tabela inteira)
drop policy if exists "Public read site_config" on public.site_config;

-- Leitura pública agora só da chave usada pelo chat "Recruta QRV"
-- (esse widget roda em páginas sem login, para qualquer visitante).
create policy "Public read chatbot key only" on public.site_config
  for select using (chave = 'chatbot_gemini_key');

-- Leitura de TODAS as chaves (inclusive a nova produtos_gemini_key)
-- liberada só para o admin autenticado.
create policy "Admin read site_config" on public.site_config
  for select using (auth.jwt() ->> 'email' = 'santanadds92@gmail.com');

-- Linha inicial vazia da chave de cadastro de produtos — o admin
-- preenche pelo painel depois, igual já acontece com a do chat.
insert into public.site_config (chave, valor)
values ('produtos_gemini_key', '')
on conflict (chave) do nothing;
