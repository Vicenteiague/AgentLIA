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

export const OFFICIAL_KNOWLEDGE_BASE = `# 1. IDENTIDADE E OBJETIVO
- **Nome do Agente:** LIA
- **Empresa:** Start Mkt Local
- **Papel:** Especialista de atendimento e vendas.
- **Tom de Voz:** Direto, simpático, consultivo e focado em conversão (mensagens curtas, ideais para leitura no celular).
- **Objetivo Principal:** Tirar dúvidas sobre o catálogo e conduzir o cliente para o fechamento no WhatsApp.

---

# 2. DADOS DA EMPRESA (Fatos Gerais)
- **O que fazemos:** Agência de marketing digital
- **Localização:** Ponta Porã MS atuamos em todo Brasil
- **Horário de Funcionamento:** Segunda a Sexta, das 08h às 18h | Sábado, das 08h às 12h.
- **Formas de Pagamento:** PIX , Cartão em até 3x sem juros, Cartão de Débito.
- **Link de Contato/WhatsApp:** https://wa.me/5567993174512
- **Link de Contato/Website:** https://www.startmktlocal.com.br/

---

# 3. CATÁLOGO DE PRODUTOS E SERVIÇOS (Tópicos Chave-Valor)

## Produto/Serviço 1: Criação de Sites
- **Para quem é indicado:** Empresas em geral
- **O que inclui:** Destaque no meio digital
- **Prazo de entrega:** 7 dias
- **Valor:** A partir R$ 500,00

## Produto/Serviço 2: Gestor Google meu Negócio
- **Para quem é indicado:** Empresas de todo o Brasil
- **O que inclui:** Criação e gestão de perfis de empresas no Google
- **Valor:** R$ A combinar

## Produto/Serviço 3: Criação de Biosites com atendimento Virtual
- **Modelo de Biosite:** https://vicenteiaguebiositegoogleia.vercel.app/
- **Para quem é indicado:** Empresas de todo o Brasil
- **O que inclui:** Criação de Biosites com atendimento 24 hrs por agentes de IA treinado para saber tudo da sua empresa
- **Valor:** R$ 167.00 mais R$50.00 Mês de manutenção do Agente de IA

## Produto/Serviço 4: Gestor de tráfego Meta Ads
- **Para quem é indicado:** Empresas de todo o Brasil
- **O que inclui:** Criação de campanhas de marketing na Meta Ads
- **Valor:** R$ A combinar

## Produto/Serviço 5: Criação de Agente de IA para atendimento no WhatsApp
- **Para quem é indicado:** Empresas de todo o Brasil
- **O que inclui:** Criação de Agentes de IA no whatsapp da empresa responsável pelo atendimento e conhecimento total da empresa
- **Valor:** R$ A combinar

## Produto/Serviço 6: Criação do Avaliacard cartão NFC e QR Code de avaliação do Google
- **Website:** https://avaliacard.vercel.app/
- **Para quem é indicado:** Empresas de todo o Brasil
- **O que inclui:** Criação do cartão NFC e QR Code com link direto na página de avaliação do Google
- **Valor:** R$ 89.00 + Frete grátis

---

# 4. FAQ E QUEBRA DE OBJEÇÕES (Como responder)

**P: Vocês dão desconto se eu fechar hoje?**
R: No pagamento via PIX já aplicamos 5% de desconto imediato! Se você quiser fechar um pacote com mais de um item, posso chamar nosso especialista no WhatsApp para liberar uma condição especial para você.

**P: Como funciona a garantia?**
R: Você tem 15 dias de garantia total. Se tiver qualquer problema, resolvemos sem burocracia.

**P: Achei o valor alto / Vou pensar.**
R: Entendo perfeitamente! Mas vale lembrar que todos os nossos produtos são de alto desempenho para alavancagem dos Negócios Locais, o que economiza tempo/dinheiro para você. Quer que eu te mostre a opção de parcelamento para caber tranquilo no seu orçamento?

---

# 5. TODOS OS LINKS QUE ENVIAR DEVE SER CLICÁVEL
- Envie sempre em formato de link clicável (ex: [https://wa.me/5567993174512](https://wa.me/5567993174512), [https://www.startmktlocal.com.br/](https://www.startmktlocal.com.br/), [https://vicenteiaguebiositegoogleia.vercel.app/](https://vicenteiaguebiositegoogleia.vercel.app/), [https://avaliacard.vercel.app/](https://avaliacard.vercel.app/)).

---

# 6. REGRAS DE OURO (Guardrails)
1. **Fidelidade aos Dados:** Responda APENAS com base nas informações acima. Se o cliente perguntar algo que não está neste documento, diga exatamente: "Para te confirmar esse detalhe específico sem erro, vou te passar o contato direto do nosso especialista: [- **Link de Contato/WhatsApp:** https://wa.me/5567993174512]".
2. **Proibido Inventar:** Nunca invente preços, prazos, promoções ou serviços que não estejam na seção 3.
3. **Formatação:** Nunca envie blocos gigantes de texto. Use no máximo 3 linhas por parágrafo e termine sempre com uma pergunta que leve o cliente para o próximo passo.`;

const DEFAULT_CONFIG: BusinessConfig = {
  companyName: 'Start Mkt Local',
  botName: 'LIA',
  botRole: 'Especialista de atendimento e vendas',
  businessPhone: '+55 67 99317-4512',
  website: 'https://www.startmktlocal.com.br/',
  websiteConectacard: 'https://www.startmktlocal.com.br/',
  websiteSuperlimpo: 'https://www.startmktlocal.com.br/',
  catalogUrl: 'https://www.startmktlocal.com.br/',
  whatsappVerifyToken: 'lia_token_whatsapp_2026',
  whatsappAccessToken: '',
  whatsappPhoneNumberId: '',
  quickQuestions: [
    'Quais são os serviços?',
    'Quanto custa?',
    'Criação de Sites',
    'Biosite com Atendimento IA',
    'Avaliacard NFC Google',
    'Gestor Google Meu Negócio',
    'Tráfego Meta Ads',
    'Agente IA WhatsApp',
    'Falar com Especialista',
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
    console.warn('Erro ao chamar /api/chat, utilizando contingência local:', err);

    // Fallback response generator according to Start Mkt Local Knowledge Base
    const q = message.toLowerCase();
    let reply = `Olá! Eu sou a ${DEFAULT_CONFIG.botName}, especialista de atendimento e vendas da **Start Mkt Local**. Ajudamos sua empresa a vender mais com Sites, Biosites com IA, Google Meu Negócio, Tráfego Meta Ads e o Avaliacard NFC.\n\nQual dessas soluções você gostaria de conhecer hoje?`;
    let needsHumanHandoff = false;

    if (q.includes('site') && !q.includes('bio')) {
      reply = `Nosso serviço de **Criação de Sites** coloca sua empresa em destaque digital!\n\n• Prazo de entrega: **7 dias**\n• Valor: A partir de **R$ 500,00**\n• Pagamento: PIX (com 5% de desconto) ou até 3x no cartão.\n\nQuer garantir o desenvolvimento do seu site esta semana?`;
    } else if (q.includes('bio') || q.includes('vicente')) {
      reply = `O **Biosite com Atendimento Virtual** inclui biosite moderno e agente de IA 24h treinado para saber tudo da sua empresa!\n\n• Modelo para testar: [Acessar Modelo](https://vicenteiaguebiositegoogleia.vercel.app/)\n• Investimento: R$ 167,00 + R$ 50,00/mês de manutenção.\n\nQuer ter um biosite inteligente como esse para sua empresa?`;
    } else if (q.includes('avalia') || q.includes('nfc')) {
      reply = `O **Avaliacard** é o cartão inteligente com chip NFC e QR Code com link direto na sua página de avaliação do Google!\n\n• Valor: apenas **R$ 89,00 com Frete Grátis** para todo o Brasil!\n• Website: [Acessar Avaliacard](https://avaliacard.vercel.app/)\n\nQuer garantir o seu Avaliacard com frete grátis agora?`;
    } else if (q.includes('google') || q.includes('negócio') || q.includes('negocio')) {
      reply = `Com o **Gestor Google Meu Negócio**, criamos e otimizamos o perfil da sua empresa para dominar as buscas locais no Google Maps!\n\n• Atendemos todo o Brasil | Valor a combinar.\n\nSua empresa já possui perfil no Google ou vamos criar do zero?`;
    } else if (q.includes('tráfego') || q.includes('trafego') || q.includes('meta') || q.includes('anúncio')) {
      reply = `Com a **Gestão de Tráfego Meta Ads**, criamos anúncios de alta conversão no Instagram e Facebook direto para o seu WhatsApp!\n\n• Valor: R$ A combinar de acordo com sua meta.\n\nVocê já anuncia atualmente ou quer começar agora?`;
    } else if (q.includes('quanto custa') || q.includes('preço') || q.includes('preco') || q.includes('valor')) {
      reply = `Valores dos nossos serviços principais:\n\n• **Criação de Sites**: A partir de R$ 500,00 (7 dias)\n• **Biosite com IA 24h**: R$ 167,00 + R$ 50,00/mês\n• **Avaliacard NFC Google**: R$ 89,00 (Frete Grátis)\n• **Google Meu Negócio e Meta Ads**: R$ A combinar\n\nNo PIX você ganha 5% de desconto imediato! Qual opção cabe melhor no seu plano?`;
    } else if (q.includes('garantia')) {
      reply = `Você tem **15 dias de garantia total**! Se tiver qualquer problema, resolvemos sem burocracia.\n\nQuer dar início ao seu projeto hoje mesmo com segurança total?`;
    } else if (q.includes('desconto')) {
      reply = `No pagamento via PIX já aplicamos **5% de desconto imediato**! Se quiser fechar um pacote com mais de um serviço, posso chamar nosso especialista no WhatsApp para liberar uma condição especial: [WhatsApp Especialista](https://wa.me//5567993174512).\n\nQual serviço você gostaria de fechar?`;
    } else if (q.includes('falar com alguém') || q.includes('alguem') || q.includes('humano') || q.includes('atendente') || q.includes('especialista')) {
      reply = `Certamente! Nosso especialista está disponível diretamente no WhatsApp: [Clique para conversar](https://wa.me//5567993174512) ou ligue ${DEFAULT_CONFIG.businessPhone}.\n\nAtendimento de Seg a Sex (08h às 18h) e Sáb (08h às 12h). Como posso adiantar seu contato?`;
      needsHumanHandoff = true;
    } else if (q.includes('serviço') || q.includes('servico')) {
      reply = `Na **Start Mkt Local**, temos 6 serviços principais: Criação de Sites, Gestor Google Meu Negócio, Biosite com IA 24h, Gestor de Tráfego Meta Ads, Agente de IA no WhatsApp e Avaliacard NFC.\n\nQual dessas soluções você gostaria de conhecer?`;
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
