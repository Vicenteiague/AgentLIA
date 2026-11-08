export interface BusinessConfig {
  companyName: string;
  botName: string;
  botRole: string;
  businessPhone: string;
  website?: string;
  websiteConectacard?: string;
  websiteSuperlimpo?: string;
  catalogUrl: string;
  whatsappVerifyToken: string;
  whatsappAccessToken: string;
  whatsappPhoneNumberId: string;
  quickQuestions: string[];
  systemPromptAddendum: string;
}

export type {
  SemanticTopic,
  SemanticIndex,
  SemanticMatchResult,
} from '../utils/semanticIndexer';
export {
  buildSemanticIndex,
  matchSemanticQuery,
  extractKeywords,
} from '../utils/semanticIndexer';

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
  fileUrl?: string;
  fileName?: string;
  fileType?: 'image' | 'pdf';
  fileSize?: string;
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

export const INITIAL_OPENING_MESSAGE = `Oi! Tudo bem? 😊 Eu sou a LIA, da Start Mkt Local.
Posso te ajudar com site, Google Meu Negócio, anúncios e mais.
Qual é o seu nome e o que você tá buscando pro seu negócio?`;

export const OFFICIAL_KNOWLEDGE_BASE = `# IDENTIDADE
Você é a LIA, especialista de atendimento e vendas da Start Mkt Local, agência de marketing digital de Ponta Porã (MS) que atende todo o Brasil.
Você conversa pelo WhatsApp, como uma pessoa simpática e atenta. Nada de linguagem robótica ou de call center.

# COMO VOCÊ FALA
- Português brasileiro natural, do jeito que as pessoas falam no zap: "pra", "tá", "beleza", "show", "bora".
- Mensagens curtas. Máximo 3 linhas por parágrafo.
- No máximo 1 emoji por mensagem, e só quando combinar.
- Chame o cliente pelo nome assim que souber.
- Espelhe o jeito dele: se for mais direto, seja direta; se for mais descontraído, relaxe também.
- Reaja ao que ele disse antes de responder ("Entendi!", "Boa pergunta!"). Varie as expressões, nunca repita a mesma abertura.
- Nunca use listas longas, títulos ou negrito exagerado. Fale como conversa, não como panfleto.
- Não despeje todos os serviços de uma vez. Descubra a necessidade e indique só o que faz sentido.
- Toda mensagem termina com uma pergunta que leve ao próximo passo.

# SE PERGUNTAREM SE VOCÊ É ROBÔ
Seja honesta: diga que é a assistente virtual da Start Mkt Local e que pode passar para o especialista humano quando o cliente quiser. Nunca negue.

# FLUXO DA CONVERSA
1. Cumprimente, diga seu nome e pergunte o nome do cliente.
2. Pergunte qual é o negócio dele e o que ele quer melhorar.
3. Indique o serviço mais adequado, explicando o benefício em 1 ou 2 frases.
4. Passe o valor só quando ele perguntar ou quando fizer sentido.
5. Quebre objeções com calma (veja abaixo).
6. Quando ele demonstrar interesse, conduza para o fechamento no WhatsApp com o link.

# DADOS DA EMPRESA
- Atuação: todo o Brasil. Sede em Ponta Porã (MS).
- Horário: segunda a sexta, 08h às 18h | sábado, 08h às 12h.
- Pagamento: PIX (5% de desconto), cartão em até 3x sem juros e cartão de débito.
- Garantia: 15 dias.
- WhatsApp: https://wa.me/5567993174612
- Site: https://www.startmktlocal.com.br/

# SERVIÇOS
1. Criação de Sites
- Para: empresas em geral. Dá destaque no meio digital.
- Prazo: 7 dias. Valor: a partir de R$ 500,00.

2. Gestão de Google Meu Negócio
- Para: empresas de todo o Brasil.
- Inclui: criação e gestão do perfil da empresa no Google.
- Valor: a combinar.

3. Biosite com Atendimento Virtual
- Para: empresas de todo o Brasil.
- Inclui: biosite com atendimento 24h por agente de IA treinado para saber tudo da empresa.
- Valor: R$ 167,00 + R$ 50,00 por mês de manutenção do agente de IA.
- Modelo: https://vicenteiaguebiositegoogleia.vercel.app/

4. Gestão de Tráfego (Meta Ads)
- Para: empresas de todo o Brasil.
- Inclui: criação de campanhas de marketing no Meta Ads.
- Valor: a combinar.

5. Agente de IA para WhatsApp
- Para: empresas de todo o Brasil.
- Inclui: agente de IA no WhatsApp da empresa, responsável pelo atendimento, com conhecimento total do negócio.
- Valor: a combinar.

6. AvaliaCard
- Para: empresas de todo o Brasil.
- Inclui: cartão NFC e QR Code com link direto para a página de avaliação do Google.
- Valor: R$ 89,00 com frete grátis.
- Site: https://avaliacard.vercel.app/

Quando o valor for "a combinar", explique que depende do tamanho do projeto e chame o especialista no WhatsApp pra montar a proposta.

# OBJEÇÕES
Desconto: "No PIX já te dou 5% de desconto na hora! Se quiser fechar mais de um serviço, posso chamar nosso especialista no WhatsApp pra liberar uma condição especial. Quer que eu te passe o contato?"

Garantia: "Você tem 15 dias de garantia total. Se qualquer coisa não ficar como combinado, a gente resolve sem burocracia. Quer seguir com a gente?"

Valor alto / vou pensar: "Entendo total! Só lembro que nossos serviços são feitos pra turbinar negócios locais e te ajudar a vender mais. Posso te mostrar o parcelamento em até 3x sem juros pra caber no seu orçamento?"

# REGRAS INEGOCIÁVEIS
1. Responda APENAS com base nas informações acima.
2. Nunca invente preços, prazos, promoções, serviços ou condições.
3. Se o cliente perguntar algo que não está neste documento, responda exatamente: "Para te confirmar esse detalhe específico sem erro, vou te passar o contato direto do nosso especialista: https://wa.me/5567993174612"
4. Envie todos os links como URL pura, sem colchetes nem formatação, para ficarem clicáveis.
5. Fora do horário de atendimento, você continua respondendo, e avisa que o especialista humano retorna no próximo horário de funcionamento.`;

const DEFAULT_CONFIG: BusinessConfig = {
  companyName: 'Start Mkt Local',
  botName: 'LIA',
  botRole: 'Especialista de atendimento e vendas',
  businessPhone: '+55 67 99317-4612',
  website: 'https://www.startmktlocal.com.br/',
  websiteConectacard: 'https://www.startmktlocal.com.br/',
  websiteSuperlimpo: 'https://www.startmktlocal.com.br/',
  catalogUrl: 'https://www.startmktlocal.com.br/',
  whatsappVerifyToken: 'lia_token_whatsapp_2026',
  whatsappAccessToken: '',
  whatsappPhoneNumberId: '',
  quickQuestions: [
    'Oi, quanto custa um site?',
    'Achei caro, vou pensar.',
    'Vocês fazem logomarca?',
    'Você é um robô?',
    'Qual o prazo do Meta Ads?',
    'Tem desconto no PIX?',
    'E aí mano, quero um bagulho pra aparecer no Google',
    'Como funciona o Biosite com IA?',
    'Quero o AvaliaCard',
  ],
  systemPromptAddendum: OFFICIAL_KNOWLEDGE_BASE,
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
    console.warn('Erro ao chamar /api/chat, utilizando contingência local humanizada:', err);

    const q = message.toLowerCase().trim();
    let reply = `Para te confirmar esse detalhe específico sem erro, vou te passar o contato direto do nosso especialista: https://wa.me/5567993174612`;
    let needsHumanHandoff = false;

    if (q.includes('logomarca') || q.includes('logo') || (q.includes('prazo') && !q.includes('site'))) {
      reply = `Para te confirmar esse detalhe específico sem erro, vou te passar o contato direto do nosso especialista: https://wa.me/5567993174612`;
      needsHumanHandoff = true;
    } else if (q.includes('robô') || q.includes('robo')) {
      reply = `Sou sim! Eu sou a assistente virtual da Start Mkt Local, treinada pra te atender rapidinho por aqui. 😊\n\nSe você quiser falar com nosso especialista humano a qualquer momento, é só me avisar que eu te passo pra ele, beleza?`;
    } else if (q.includes('caro') || q.includes('vou pensar') || q.includes('valor alto')) {
      reply = `Entendo total! Só lembro que nossos serviços são feitos pra turbinar negócios locais e te ajudar a vender mais.\n\nPosso te mostrar o parcelamento em até 3x sem juros pra caber no seu orçamento?`;
    } else if (q.includes('desconto') || q.includes('pix')) {
      reply = `No PIX já te dou 5% de desconto na hora! Se quiser fechar mais de um serviço, posso chamar nosso especialista no WhatsApp pra liberar uma condição especial. Quer que eu te passe o contato?`;
    } else if (q.includes('garantia')) {
      reply = `Você tem 15 dias de garantia total. Se qualquer coisa não ficar como combinado, a gente resolve sem burocracia. Quer seguir com a gente?`;
    } else if (q.includes('site') && !q.includes('bio')) {
      reply = `Oi! Tudo bem? Aqui na Start Mkt Local os sites começam a partir de R$ 500,00 e ficam prontos em 7 dias.\n\nMe conta, qual é o seu negócio? Assim eu vejo o que faz mais sentido pra você.`;
    } else if (q.includes('google') || q.includes('aparecer')) {
      if (q.includes('mano') || q.includes('bagulho')) {
        reply = `E aí, tudo tranquilo? Bora resolver isso! A gente faz a Gestão do Google Meu Negócio pra criar e cuidar do perfil da sua empresa e te colocar em destaque nas buscas.\n\nComo se chama você e qual é o seu negócio?`;
      } else {
        reply = `Boa! Com a Gestão de Google Meu Negócio a gente cria e cuida do perfil da sua empresa pra te dar destaque nas pesquisas do Google.\n\nMe conta, qual é o seu nome e qual é o ramo do seu negócio?`;
      }
    } else if (q.includes('bio') || q.includes('vicente')) {
      reply = `Show! O Biosite vem com atendimento 24h por um agente de IA que sabe tudo da sua empresa, por R$ 167,00 + R$ 50,00 por mês de manutenção.\n\nOlha o modelo funcionando aqui: https://vicenteiaguebiositegoogleia.vercel.app/\n\nQual é o seu negócio pra gente montar um desse pra você?`;
    } else if (q.includes('avalia') || q.includes('nfc')) {
      reply = `Boa pergunta! O AvaliaCard é um cartão com NFC e QR Code que leva seu cliente direto pra avaliação do Google da sua empresa, e sai por R$ 89,00 com frete grátis.\n\nVocê pode ver ele aqui: https://avaliacard.vercel.app/\n\nQuer garantir o seu com frete grátis?`;
    } else if (q.includes('tráfego') || q.includes('trafego') || q.includes('meta') || q.includes('anúncio') || q.includes('anuncio')) {
      reply = `Entendi! Na Gestão de Tráfego a gente cria campanhas no Meta Ads pra atrair clientes pro seu negócio, e o valor é a combinar conforme o tamanho do projeto.\n\nQuer que eu te passe o contato do nosso especialista no WhatsApp pra montar sua proposta?`;
    } else if (q === 'oi' || q === 'olá' || q === 'ola' || q.includes('bom dia') || q.includes('boa tarde') || q.includes('boa noite')) {
      reply = INITIAL_OPENING_MESSAGE;
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
      reply: `Oi! Recebi sua mensagem "${message}". Como posso te ajudar hoje?`,
    };
  }
}

export async function sendChatMultimodal(
  fileBase64: string,
  mimeType: string,
  fileName: string,
  message: string = '',
  history: Array<{ role: 'user' | 'assistant'; text: string }> = []
): Promise<{ reply: string; fileDescription: string; needsHumanHandoff?: boolean; isFallback?: boolean }> {
  try {
    const res = await fetch('/api/chat-multimodal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileBase64,
        mimeType,
        fileName,
        message,
        history,
      }),
    });

    if (!res.ok) {
      throw new Error(`Status ${res.status}`);
    }

    return await res.json();
  } catch (err) {
    console.warn('Erro ao processar arquivo multimodal:', err);
    const isPdf = mimeType.toLowerCase().includes('pdf') || fileName.toLowerCase().endsWith('.pdf');
    return {
      reply: isPdf
        ? `Recebi seu documento PDF "${fileName}"! Nosso especialista pode avaliar ele com você direto no WhatsApp: https://wa.me/5567993174612`
        : `Recebi sua imagem! Vamos analisar juntos no WhatsApp: https://wa.me/5567993174612`,
      fileDescription: isPdf ? `PDF: ${fileName}` : `Imagem: ${fileName}`,
      needsHumanHandoff: false,
      isFallback: true,
    };
  }
}
