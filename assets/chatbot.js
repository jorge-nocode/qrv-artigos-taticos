// =====================================================================
// Atendente Virtual Tático — "Recruta QRV"
// Widget de chat (HTML/CSS/JS puro) integrado à API do Google Gemini.
// =====================================================================
//
// IMPORTANTE SOBRE A CHAVE DE API (leia antes de publicar):
// Este é um site 100% estático, sem backend — qualquer chave colocada
// aqui embaixo fica visível para QUALQUER visitante que abrir o
// código-fonte da página (Ctrl+U) ou inspecionar as requisições de rede.
// Isso significa que, em teoria, alguém poderia copiar essa chave e
// gerar cobranças na sua conta do Google.
//
// Para publicar com segurança, faça isto no Google AI Studio / Google
// Cloud Console (é rápido, uma vez só):
//   1. Crie uma chave de API específica só para este chat (não reuse a
//      mesma chave do admin.html).
//   2. Em "Restrições de API", limite essa chave só à Generative
//      Language API.
//   3. Em "Restrições de aplicativo" → "Referenciadores HTTP", cadastre
//      o domínio do site (ex: https://qrv-artigos-taticos.vercel.app/*)
//      pra chave só funcionar quando chamada a partir do seu site.
//   4. Defina uma cota diária baixa nessa chave, como trava de segurança.
//
// Cole sua chave na linha abaixo:
const GEMINI_API_KEY = 'COLE_SUA_CHAVE_DO_GEMINI_AQUI';

const WHATSAPP_NUMERO = '5511998703836'; // (11) 99870-3836
const WHATSAPP_LINK = `https://wa.me/${WHATSAPP_NUMERO}`;

const MODEL_CANDIDATES = ['gemini-flash-latest', 'gemini-2.5-flash', 'gemini-1.5-flash'];

const SYSTEM_INSTRUCTION = `Você é o "Recruta QRV", o atendente virtual especialista da loja QRV Artigos Táticos. Seu tom de voz é respeitoso, direto, ágil e sutilmente tático (use expressões moderadas do meio, como "QAP", "Positivo", "À disposição"). Seu objetivo é ajudar os clientes a escolherem coturnos, mochilas, roupas, cutelaria, lanternas e tirar dúvidas gerais sobre compras.

Responda sempre em português do Brasil, em mensagens curtas e objetivas (isto é um chat, não um e-mail) — no máximo 2 a 4 frases por resposta, a menos que o cliente peça mais detalhes.

=== BASE DE CONHECIMENTO DA LOJA (use somente estas informações; nunca invente dados que não estejam aqui) ===
• Endereço físico: Av. Santos Dumont, 61 - Cumbica, Guarulhos - SP.
• Horário de atendimento: Segunda a Quinta 10h–20h30 | Sexta 10h–19h | Sábado 09h–16h.
• Envios: frete e entrega para todo o Brasil.
• Parcelamento: até 3x sem juros no cartão.
• Bordados: fazem bordados personalizados sob encomenda (nome de guerra, tipo sanguíneo, insígnias, revenda).
• Contato direto / WhatsApp: (11) 99870-3836 | e-mail contato@qrvartigostaticos.com.br
• Catálogo / destaques: jaquetas impermeáveis, camisas combat ripstop, mochilas assault e paraquedista, coturnos em couro/cordura, óculos solares táticos Focus, calçados e cutelaria.

=== DIRECIONAMENTO PARA O WHATSAPP ===
Se o cliente disser que quer fechar uma compra, finalizar um pedido, ou pedir um orçamento de bordado sob encomenda (que exige atendimento manual porque depende de detalhes específicos), NÃO tente resolver isso sozinho: oriente o cliente a continuar por lá e sempre inclua o link direto na sua resposta: ${WHATSAPP_LINK}

Se não souber responder algo com certeza (preço exato de um item específico, prazo de entrega para um CEP, disponibilidade de estoque de um produto específico), seja honesto e direcione para o WhatsApp da loja em vez de chutar uma resposta.`;

function buildWidgetHTML() {
  return `
    <button type="button" class="qrv-chat-fab" id="qrvChatFab" aria-label="Abrir atendimento tático">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">
        <rect x="3" y="5" width="18" height="13" rx="3"/>
        <path d="M8 18v2.2a.6.6 0 0 0 .97.47L12 18"/>
        <circle cx="8.5" cy="11.5" r="1"/>
        <circle cx="12" cy="11.5" r="1"/>
        <circle cx="15.5" cy="11.5" r="1"/>
        <path d="M12 5V2.5"/>
        <circle cx="12" cy="1.6" r=".9" fill="currentColor" stroke="none"/>
      </svg>
      <span class="qrv-chat-fab-dot"></span>
    </button>

    <div class="qrv-chat-window" id="qrvChatWindow" role="dialog" aria-label="Atendimento tático QRV">
      <div class="qrv-chat-header">
        <div class="qrv-chat-avatar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="18" height="13" rx="3"/><circle cx="8.5" cy="11.5" r="1"/><circle cx="12" cy="11.5" r="1"/><circle cx="15.5" cy="11.5" r="1"/></svg>
        </div>
        <div class="qrv-chat-header-info">
          <strong>Recruta QRV — Atendimento Tático</strong>
          <div class="qrv-chat-status"><span class="dot"></span> Online</div>
        </div>
        <button type="button" class="qrv-chat-close" id="qrvChatClose" aria-label="Fechar chat">&times;</button>
      </div>
      <div class="qrv-chat-messages" id="qrvChatMessages"></div>
      <div class="qrv-chat-input-row">
        <input type="text" id="qrvChatInput" placeholder="Digite sua mensagem..." autocomplete="off" maxlength="500">
        <button type="button" class="qrv-chat-send" id="qrvChatSend" aria-label="Enviar mensagem">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 2 11 13"/><path d="M22 2 15 22l-4-9-9-4 20-7z"/></svg>
        </button>
      </div>
    </div>
  `;
}

// Converte URLs cruas (ex: o link do WhatsApp) em links clicáveis dentro da bolha de mensagem.
function linkify(text) {
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped.replace(/(https?:\/\/[^\s]+)/g, url => {
    const clean = url.replace(/[.,;!?)]+$/, '');
    return `<a href="${clean}" target="_blank" rel="noopener">${clean}</a>`;
  });
}

async function callGeminiChat(history) {
  let lastError;
  for (const model of MODEL_CANDIDATES) {
    try {
      const resp = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(GEMINI_API_KEY)}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
            contents: history,
            generationConfig: { temperature: 0.6, maxOutputTokens: 512 },
          }),
        }
      );
      const data = await resp.json();
      if (!resp.ok) {
        lastError = new Error(data.error?.message || `Erro na API do Gemini (modelo ${model})`);
        const msg = (data.error?.message || '').toLowerCase();
        if (msg.includes('not found') || msg.includes('not supported') || msg.includes('no longer available') || msg.includes('deprecated')) {
          continue;
        }
        throw lastError;
      }
      const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!text) {
        lastError = new Error('A IA não retornou nenhum conteúdo.');
        continue;
      }
      return text;
    } catch (err) {
      lastError = err;
    }
  }
  throw lastError || new Error('Nenhum modelo do Gemini respondeu.');
}

function initChatWidget() {
  document.body.insertAdjacentHTML('beforeend', buildWidgetHTML());

  const fab = document.getElementById('qrvChatFab');
  const win = document.getElementById('qrvChatWindow');
  const closeBtn = document.getElementById('qrvChatClose');
  const messagesEl = document.getElementById('qrvChatMessages');
  const input = document.getElementById('qrvChatInput');
  const sendBtn = document.getElementById('qrvChatSend');

  let history = [];
  let sending = false;
  let welcomed = false;

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addMessage(role, text) {
    const bubble = document.createElement('div');
    bubble.className = `qrv-chat-msg ${role}`;
    bubble.innerHTML = linkify(text);
    messagesEl.appendChild(bubble);
    scrollToBottom();
  }

  function showTyping() {
    const typing = document.createElement('div');
    typing.className = 'qrv-chat-typing';
    typing.id = 'qrvChatTyping';
    typing.innerHTML = '<span></span><span></span><span></span>';
    messagesEl.appendChild(typing);
    scrollToBottom();
  }

  function hideTyping() {
    document.getElementById('qrvChatTyping')?.remove();
  }

  function openChat() {
    win.classList.add('open');
    fab.classList.add('hidden-while-open');
    if (!welcomed) {
      welcomed = true;
      addMessage('bot', 'QAP! Sou o assistente virtual da QRV Artigos Táticos. Como posso te ajudar na sua missão hoje?');
    }
    input.focus();
  }

  function closeChat() {
    win.classList.remove('open');
    fab.classList.remove('hidden-while-open');
  }

  async function sendMessage() {
    const text = input.value.trim();
    if (!text || sending) return;

    if (!GEMINI_API_KEY || GEMINI_API_KEY === 'COLE_SUA_CHAVE_DO_GEMINI_AQUI') {
      addMessage('user', text);
      input.value = '';
      addMessage('error', `Positivo, mas ainda não estou com o rádio conectado (chave da API não configurada). Fala direto com a equipe pelo WhatsApp: ${WHATSAPP_LINK}`);
      return;
    }

    addMessage('user', text);
    history.push({ role: 'user', parts: [{ text }] });
    input.value = '';
    sending = true;
    sendBtn.disabled = true;
    showTyping();

    try {
      const reply = await callGeminiChat(history);
      hideTyping();
      addMessage('bot', reply);
      history.push({ role: 'model', parts: [{ text: reply }] });
    } catch (err) {
      hideTyping();
      addMessage('error', `Falha na comunicação, câmbio. Tenta de novo em instantes ou fala direto com a equipe: ${WHATSAPP_LINK}`);
      console.error('Erro no chat QRV:', err);
    } finally {
      sending = false;
      sendBtn.disabled = false;
      input.focus();
    }
  }

  fab.addEventListener('click', openChat);
  closeBtn.addEventListener('click', closeChat);
  sendBtn.addEventListener('click', sendMessage);
  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') {
      e.preventDefault();
      sendMessage();
    }
  });
}

document.addEventListener('DOMContentLoaded', initChatWidget);
