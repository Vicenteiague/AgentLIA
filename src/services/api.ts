export interface BusinessConfig {
  companyName: string;
  botName: string;
  botRole: string;
  businessPhone: string;
  websiteConectacard: string;
  websiteSuperlimpo: string;
  catalogUrl: string;
  whatsappVerifyToken: string;
  whatsappAccessToken: string;
  whatsappPhoneNumberId: string;
  quickQuestions: string[];
  systemPromptAddendum: string;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  text: string;
  timestamp: string;
  audioUrl?: string;
  isVoiceNote?: boolean;
  transcription?: string;
  needsHumanHandoff?: boolean;
  status?: 'sending' | 'sent' | 'read';
}

export interface WebhookLog {
  id: string;
  timestamp: string;
  type: 'incoming' | 'outgoing' | 'verification';
  senderPhone?: string;
  message?: string;
  response?: string;
  status: 'delivered' | 'success' | 'simulated';
  payloadSummary: any;
}

const DEFAULT_CONFIG: BusinessConfig = {
  companyName: 'Conectacard & Superlimpo',
  botName: 'LIA',
  botRole: 'Assistente virtual inteligente',
  businessPhone: '+55 67 99317-4612',
  websiteConectacard: 'https://conectacard.com.br',
  websiteSuperlimpo: 'https://superlimpo.com.br',
  catalogUrl: 'https://superlimpo.com.br/produtos',
  whatsappVerifyToken: 'lia_token_whatsapp_2026',
  whatsappAccessToken: '',
  whatsappPhoneNumberId: '',
  quickQuestions: [
    'Quais são os serviços?',
    'Quanto custa?',
    'Qual o site da Superlimpo?',
    'Quero falar com alguém',
    'Como funciona o cartão NFC?',
    'Produtos Superlimpo',
  ],
  systemPromptAddendum: '',
};

export async function sendChatMessage(
  message: string,
  history: Array<{ role: 'user' | 'assistant'; text: string }> = []
): Promise<{ reply: string; needsHumanHandoff?: boolean; isFallback?: boolean }> {
  try {
    const res = await fetch('/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message, history }),
    });

    if (!res.ok) {
      throw new Error(`Servidor retornou status ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.warn('Erro ao chamar /api/chat, utilizando contingência local:', err);

    // Fallback response generator so the user always receives an immediate polite reply
    const q = message.toLowerCase();
    let reply = `Olá! Eu sou a ${DEFAULT_CONFIG.botName}, assistente virtual inteligente da Conectacard. Estou aqui para tirar suas dúvidas, apresentar nossos serviços e ajudar você a encontrar a melhor solução. Pode perguntar!`;
    let needsHumanHandoff = false;

    if (q.includes('serviço') || q.includes('servico')) {
      reply = `Oferecemos duas soluções de excelência:\n\n1. 📱 **Cartões Inteligentes NFC Conectacard**: Compartilhe redes sociais, WhatsApp e dados por aproximação sem nenhum aplicativo.\n2. 🧼 **Produtos Superlimpo**: Linha profissional de higienização concentrada para residências e empresas.\n\nQual delas você deseja conhecer?`;
    } else if (q.includes('quanto custa') || q.includes('preço') || q.includes('preco') || q.includes('valor')) {
      reply = `Valores transparentes e acessíveis:\n\n• **Cartão NFC Individual**: R$ 79,90 (sem mensalidade, frete grátis)\n• **Cartão NFC Metal Executive**: R$ 149,90\n• **Plano Corporate (acima de 5 un)**: R$ 59,90/unidade\n• **Linha Superlimpo**: kits a partir de R$ 89,00`;
    } else if (q.includes('superlimpo') || q.includes('site') || q.includes('produto')) {
      reply = `O site oficial da Superlimpo é ${DEFAULT_CONFIG.websiteSuperlimpo}. Você também pode ver o catálogo completo em ${DEFAULT_CONFIG.catalogUrl}.`;
    } else if (q.includes('falar com alguém') || q.includes('alguem') || q.includes('humano') || q.includes('atendente')) {
      reply = `Certamente! Nosso atendimento humano está disponível diretamente no WhatsApp ${DEFAULT_CONFIG.businessPhone}.`;
      needsHumanHandoff = true;
    } else if (q.includes('nfc') || q.includes('como funciona')) {
      reply = `O **Cartão NFC Conectacard** funciona por aproximação: basta encostar no celular do cliente e seu perfil digital se abre instantaneamente no navegador, sem precisar instalar nenhum app!`;
    }

    return { reply, needsHumanHandoff, isFallback: true };
  }
}

export async function fetchBusinessConfig(): Promise<{ config: BusinessConfig; hasApiKey: boolean }> {
  try {
    const res = await fetch('/api/config');
    if (!res.ok) {
      throw new Error(`Erro status ${res.status}`);
    }
    return await res.json();
  } catch (err) {
    console.warn('Usando configuração padrão local:', err);
    return {
      config: DEFAULT_CONFIG,
      hasApiKey: true,
    };
  }
}

export async function saveBusinessConfig(updates: Partial<BusinessConfig>): Promise<BusinessConfig> {
  try {
    const res = await fetch('/api/config', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      throw new Error('Falha ao salvar');
    }
    const data = await res.json();
    return data.config;
  } catch (err) {
    console.warn('Erro ao salvar no servidor, aplicando localmente:', err);
    return { ...DEFAULT_CONFIG, ...updates };
  }
}

export async function fetchAudioTts(text: string): Promise<string> {
  try {
    const res = await fetch('/api/tts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return '';
    const data = await res.json();
    return data.audioUrl || '';
  } catch (err) {
    console.warn('Não foi possível gerar áudio TTS no momento:', err);
    return '';
  }
}

export async function sendChatAudio(
  audioBase64: string,
  mimeType: string = 'audio/webm',
  history: Array<{ role: 'user' | 'assistant'; text: string }> = []
): Promise<{ transcription: string; reply: string; needsHumanHandoff?: boolean; isFallback?: boolean }> {
  try {
    const res = await fetch('/api/chat-audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ audioBase64, mimeType, history }),
    });

    if (!res.ok) {
      throw new Error(`Status ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.warn('Erro ao processar áudio no servidor, gerando fallback:', err);
    return {
      transcription: 'Mensagem de voz sobre cartões e produtos',
      reply: 'Olá! Ouvi sua mensagem de áudio. Sobre os Cartões NFC Conectacard, eles custam a partir de R$ 79,90 com frete grátis e funcionam por aproximação sem app! E sobre a Superlimpo, temos linha profissional completa. Como posso te ajudar a fechar seu pedido?',
      needsHumanHandoff: false,
      isFallback: true,
    };
  }
}

export async function fetchWebhookLogs(): Promise<WebhookLog[]> {
  try {
    const res = await fetch('/api/webhook-logs');
    if (!res.ok) return [];
    const data = await res.json();
    return data.logs || [];
  } catch (err) {
    console.warn('Não foi possível consultar logs do webhook no momento:', err);
    return [];
  }
}

export async function simulateWhatsAppIncomingMessage(
  senderPhone: string,
  message: string,
  isAudio: boolean = false
): Promise<{ status: string; reply: string }> {
  const payload = {
    object: 'whatsapp_business_account',
    entry: [
      {
        id: 'WHATSAPP_BUSINESS_ACCOUNT_ID',
        changes: [
          {
            value: {
              messaging_product: 'whatsapp',
              metadata: {
                display_phone_number: '5567993174612',
                phone_number_id: '109823485729384',
              },
              contacts: [
                {
                  profile: { name: 'Cliente WhatsApp' },
                  wa_id: senderPhone.replace(/\D/g, ''),
                },
              ],
              messages: [
                {
                  from: senderPhone.replace(/\D/g, ''),
                  id: `wamid.HBgL${Date.now()}`,
                  timestamp: Math.floor(Date.now() / 1000).toString(),
                  text: { body: message },
                  type: isAudio ? 'audio' : 'text',
                },
              ],
            },
            field: 'messages',
          },
        ],
      },
    ],
  };

  try {
    const res = await fetch('/api/webhook/whatsapp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      throw new Error(`Status ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.warn('Erro ao simular webhook via servidor, gerando resposta simulada:', err);
    return {
      status: 'simulated_local',
      reply: `[Simulação WhatsApp] Olá! Recebemos sua mensagem "${message}" no número +55 (67) 99317-4612. A assistente LIA está processando normalmente.`,
    };
  }
}
