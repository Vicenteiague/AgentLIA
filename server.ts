import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Initialize Google GenAI
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

// Default Business Knowledge & Configuration
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

let config: BusinessConfig = {
  companyName: process.env.COMPANY_NAME || 'Conectacard & Superlimpo',
  botName: process.env.BOT_NAME || 'LIA',
  botRole: 'Assistente virtual inteligente',
  businessPhone: process.env.BUSINESS_PHONE || '+55 67 99317-4612',
  websiteConectacard: process.env.WEBSITE_CONECTACARD || 'https://conectacard.com.br',
  websiteSuperlimpo: process.env.WEBSITE_SUPERLIMPO || 'https://superlimpo.com.br',
  catalogUrl: process.env.CATALOG_URL || 'https://superlimpo.com.br/produtos',
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'lia_token_whatsapp_2026',
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
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

// Webhook simulation / activity log
interface WebhookLog {
  id: string;
  timestamp: string;
  type: 'incoming' | 'outgoing' | 'verification';
  senderPhone?: string;
  message?: string;
  response?: string;
  status: 'delivered' | 'success' | 'simulated';
  payloadSummary: any;
}

const webhookLogs: WebhookLog[] = [
  {
    id: 'log-init-1',
    timestamp: new Date(Date.now() - 3600000).toLocaleTimeString('pt-BR'),
    type: 'verification',
    status: 'success',
    payloadSummary: { event: 'Webhook verified', token: 'lia_token_whatsapp_2026' },
  },
];

function buildSystemPrompt() {
  return `Você é a ${config.botName}, assistente virtual inteligente da ${config.companyName}.
Responda de forma ágil, simpática, objetiva e clara em português brasileiro.

BASE DE CONHECIMENTO:
1. Conectacard (Cartões NFC Inteligentes):
   - O que é: Cartão por aproximação com chip NFC e QR Code. Compartilha contatos, redes sociais, WhatsApp e chave PIX ao aproximar do celular.
   - Vantagens: Sem necessidade de app (abre no navegador), dados editáveis na nuvem, sustentável e moderno.
   - Valores: Cartão Individual PVC R$ 79,90 (frete grátis, sem mensalidade) | Cartão Metal Executive R$ 149,90 | Plano Corporate a partir de 5 unidades: R$ 59,90/unidade.
2. Superlimpo (Saneantes Profissionais):
   - Linha profissional de higienização concentrada para empresas e condomínios.
   - Site: ${config.websiteSuperlimpo} | Catálogo: ${config.catalogUrl}
3. Atendimento Humano:
   - Se solicitarem atendente ou pessoa, forneça o WhatsApp ${config.businessPhone}.
${config.systemPromptAddendum ? `\nDIRETRIZES DA EMPRESA:\n${config.systemPromptAddendum}` : ''}
`;
}

// Instant Knowledge Base Semantic Matcher (< 20ms response time)
function findKnowledgeBaseAnswer(
  query: string,
  cfg: BusinessConfig
): { reply: string; needsHumanHandoff: boolean } | null {
  const q = query.toLowerCase().trim();

  // 1. Directives in systemPromptAddendum (custom database)
  if (cfg.systemPromptAddendum && cfg.systemPromptAddendum.trim().length > 0) {
    const lines = cfg.systemPromptAddendum.split('\n').map((l) => l.trim()).filter(Boolean);
    for (const line of lines) {
      const lowerLine = line.toLowerCase();
      const queryWords = q.split(/[\s,?.!]+/).filter((w) => w.length >= 4);
      const matches = queryWords.filter((w) => lowerLine.includes(w));
      if (
        matches.length >= 2 ||
        (queryWords.length === 1 &&
          matches.length === 1 &&
          (lowerLine.includes('frete') ||
            lowerLine.includes('horário') ||
            lowerLine.includes('endereço') ||
            lowerLine.includes('promoção') ||
            lowerLine.includes('desconto') ||
            lowerLine.includes('prazo')))
      ) {
        return {
          reply: `Olá! Conforme nossas diretrizes: ✨\n\n${line}\n\nPosso te ajudar com mais detalhes sobre isso?`,
          needsHumanHandoff: false,
        };
      }
    }
  }

  // 2. Greetings
  if (
    q === 'oi' ||
    q === 'ola' ||
    q === 'olá' ||
    q === 'bom dia' ||
    q === 'boa tarde' ||
    q === 'boa noite' ||
    q === 'tudo bem' ||
    q === 'ola!' ||
    q === 'olá!' ||
    q === 'oi lia' ||
    q === 'olá lia' ||
    q === 'ola lia'
  ) {
    return {
      reply: `Olá! 👋 Eu sou a ${cfg.botName}, assistente virtual inteligente da ${cfg.companyName}.\n\nEstou aqui para tirar dúvidas sobre nossos **Cartões Inteligentes NFC Conectacard** e nossa linha de **Produtos Superlimpo**. Como posso te ajudar hoje?`,
      needsHumanHandoff: false,
    };
  }

  // 3. Human Handoff / Talk to someone
  const handoffKeywords = [
    'falar com alguém',
    'falar com alguem',
    'falar com uma pessoa',
    'atendente',
    'humano',
    'falar com humano',
    'consultor',
    'suporte',
    'pessoa',
    'atendimento humano',
    'número',
    'numero de telefone',
    'telefone',
  ];
  if (handoffKeywords.some((k) => q.includes(k))) {
    return {
      reply: `Com certeza! 🤝 Um de nossos atendentes humanos está à sua disposição.\n\nVocê pode nos chamar direto no WhatsApp pelo número **${cfg.businessPhone}** ou clicar no link abaixo para conversar imediatamente. Horário de atendimento: Segunda a Sexta, das 08h às 18h.`,
      needsHumanHandoff: true,
    };
  }

  // 4. Pricing / Quanto custa / Valores
  const priceKeywords = [
    'quanto custa',
    'preço',
    'preco',
    'preços',
    'precos',
    'valor',
    'valores',
    'tabela',
    'custa',
    'quanto sai',
    'quanto é',
    'quanto e',
  ];
  if (priceKeywords.some((k) => q.includes(k))) {
    return {
      reply: `Nossos valores são super transparentes e acessíveis! 💳✨\n\n• **Cartão NFC Individual PVC**: **R$ 79,90** (pagamento único, sem mensalidade e com frete grátis).\n• **Cartão NFC Metal Executive**: **R$ 149,90** (acabamento metálico gravado a laser).\n• **Plano Corporate (a partir de 5 unidades)**: **R$ 59,90/unidade** com painel de gestão corporativa.\n• **Linha Superlimpo**: Kits profissionais de saneantes e desinfetantes a partir de **R$ 89,00**.\n\nQual dessas opções você gostaria de encomendar?`,
      needsHumanHandoff: false,
    };
  }

  // 5. How NFC works / O que é NFC / Cartão
  const nfcKeywords = [
    'como funciona',
    'nfc',
    'aproximação',
    'aproximacao',
    'chip',
    'cartao nfc',
    'cartão nfc',
    'como usa',
    'como usar',
    'o que e nfc',
    'o que é nfc',
  ];
  if (nfcKeywords.some((k) => q.includes(k))) {
    return {
      reply: `O **Cartão NFC Conectacard** funciona de forma rápida e inovadora por aproximação! 🚀\n\n1. 📱 **Basta aproximar**: Encoste o cartão na traseira de qualquer smartphone moderno (iPhone ou Android).\n2. 🌐 **Sem aplicativo**: O perfil abre direto no navegador do cliente na hora, sem precisar baixar nada!\n3. ⚡ **Tudo em um só lugar**: Compartilhe WhatsApp direto, Instagram, LinkedIn, chave PIX, catálogo de produtos e site.\n4. 🔄 **Atualizável**: Altere seus dados na nuvem a qualquer momento sem trocar de cartão.\n5. 📷 **QR Code integrado**: Celulares mais antigos podem ler o QR Code no verso.\n\nDeseja personalizar um com a logo da sua marca?`,
      needsHumanHandoff: false,
    };
  }

  // 6. Superlimpo / Products / Catalog
  const superlimpoKeywords = [
    'superlimpo',
    'produto',
    'produtos',
    'limpeza',
    'saneante',
    'saneantes',
    'desinfetante',
    'catálogo',
    'catalogo',
    'detergente',
  ];
  if (superlimpoKeywords.some((k) => q.includes(k))) {
    return {
      reply: `A **Superlimpo** é especializada em soluções profissionais de higienização e saneantes de alto rendimento! 🧴✨\n\n• **Linha de Produtos**: Desinfetantes concentrados, detergentes enzimáticos, neutralizadores de odores, panos de microfibra de alta densidade e dispensadores automáticos.\n• 🌐 **Site Oficial**: ${cfg.websiteSuperlimpo}\n• 📦 **Catálogo Completo**: ${cfg.catalogUrl}\n\nGostaria de solicitar uma cotação para sua empresa ou residência?`,
      needsHumanHandoff: false,
    };
  }

  // 7. General Services / Quais são os serviços
  const servicesKeywords = [
    'quais são os serviços',
    'quais sao os servicos',
    'serviços',
    'servicos',
    'o que vocês fazem',
    'o que voces fazem',
    'o que você faz',
    'o que voce faz',
    'soluções',
    'solucoes',
  ];
  if (servicesKeywords.some((k) => q.includes(k))) {
    return {
      reply: `Olá! 👋 Nós oferecemos duas frentes de excelência para seu negócio:\n\n1. 📱 **Conectacard (Tecnologia & Networking)**: Cartões de visita inteligentes com chip NFC e QR Code integrado para você compartilhar contatos, redes sociais, WhatsApp e chave PIX por aproximação no celular.\n2. 🧼 **Superlimpo (Saneantes Profissionais)**: Linha de alta performance para higienização de empresas, condomínios e residências (${cfg.websiteSuperlimpo}).\n\nQual dessas soluções você gostaria de conhecer melhor?`,
      needsHumanHandoff: false,
    };
  }

  // 8. Website / Site
  const websiteKeywords = ['site', 'qual o site', 'link', 'pagina', 'página', 'onde acessar'];
  if (websiteKeywords.some((k) => q.includes(k))) {
    return {
      reply: `Aqui estão nossos canais e sites oficiais! 🌐\n\n• **Conectacard**: ${cfg.websiteConectacard}\n• **Superlimpo**: ${cfg.websiteSuperlimpo}\n• **Catálogo de Produtos**: ${cfg.catalogUrl}\n\nVocê também pode falar com a nossa equipe no WhatsApp: **${cfg.businessPhone}**.`,
      needsHumanHandoff: false,
    };
  }

  return null;
}

// Fallback response generator if Gemini key is invalid/unavailable
function getFallbackResponse(query: string): string {
  const kbMatch = findKnowledgeBaseAnswer(query, config);
  if (kbMatch) return kbMatch.reply;

  return `Olá! Eu sou a ${config.botName}, assistente virtual inteligente da ${config.companyName}. Estou pronta para tirar dúvidas sobre nossos cartões NFC inteligentes, catálogo de produtos Superlimpo e serviços. Como posso ajudar você hoje? Pode perguntar! 😊`;
}

// Check if human handoff should be triggered
function checkHumanHandoff(text: string, reply: string): boolean {
  const triggerWords = [
    'falar com alguém',
    'falar com alguem',
    'atendente',
    'humano',
    'falar com pessoa',
    'consultor',
    'reclamação',
    'suporte humano',
  ];
  const textLower = (text + ' ' + reply).toLowerCase();
  return triggerWords.some((w) => textLower.includes(w));
}

// API Router setup (supports standalone Express, Vite proxy, and Vercel Serverless Functions)
const apiRouter = express.Router();
apiRouter.use(express.json({ limit: '20mb' }));

apiRouter.get('/config', (req, res) => {
  res.json({
    config,
    hasApiKey: !!process.env.GEMINI_API_KEY,
  });
});

apiRouter.post('/config', (req, res) => {
  try {
    const updates = req.body;
    config = { ...config, ...updates };
    res.json({ success: true, config });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Chat endpoint with Instant Knowledge Base Matcher + Ultra-Fast Gemini 3.1 Flash Lite
apiRouter.post('/chat', async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Mensagem inválida' });
  }

  // 1. FAST PATH (< 20ms): Check instant knowledge base matcher first
  const kbMatch = findKnowledgeBaseAnswer(message, config);
  if (kbMatch) {
    return res.json({
      reply: kbMatch.reply,
      needsHumanHandoff: kbMatch.needsHumanHandoff,
      isFallback: false,
      source: 'knowledge_base_instant',
    });
  }

  // 2. AI PATH: Open-ended conversation with gemini-3.1-flash-lite (minimal thinking) & 2.8s race timeout
  const systemInstruction = buildSystemPrompt();

  try {
    if (!process.env.GEMINI_API_KEY) {
      const reply = getFallbackResponse(message);
      const needsHumanHandoff = checkHumanHandoff(message, reply);
      return res.json({
        reply,
        needsHumanHandoff,
        isFallback: true,
      });
    }

    // Prepare contents with conversation history
    const contents: any[] = [];
    for (const h of history.slice(-4)) {
      contents.push({
        role: h.role === 'assistant' || h.role === 'model' ? 'model' : 'user',
        parts: [{ text: h.text }],
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    // Race Gemini against a 2800ms timeout to guarantee instant responsiveness
    const geminiCall = ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        maxOutputTokens: 250,
        temperature: 0.5,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), 2800)
    );

    const response = await Promise.race([geminiCall, timeoutPromise]);
    const reply = response.text || getFallbackResponse(message);
    const needsHumanHandoff = checkHumanHandoff(message, reply);

    res.json({
      reply,
      needsHumanHandoff,
      isFallback: false,
    });
  } catch (err: any) {
    // If timeout or 503 spike, seamlessly respond using knowledge base synthesizer without user delay
    const reply = getFallbackResponse(message);
    const needsHumanHandoff = checkHumanHandoff(message, reply);
    res.json({
      reply,
      needsHumanHandoff,
      isFallback: true,
      apiNotice: 'Respondido em modo de alta performance.',
    });
  }
});

// Audio Chat endpoint - Interprets customer voice notes using Google Gemini Multimodal
apiRouter.post('/chat-audio', async (req, res) => {
  const { audioBase64, mimeType = 'audio/webm', history = [] } = req.body;

  if (!audioBase64) {
    return res.status(400).json({ error: 'Áudio não fornecido' });
  }

  const cleanBase64 = audioBase64.replace(/^data:[^;]+;base64,/, '');

  try {
    if (!process.env.GEMINI_API_KEY) {
      const fallbackTranscription = 'Gostaria de saber mais sobre os cartões da Conectacard e produtos Superlimpo';
      const fallbackReply = getFallbackResponse(fallbackTranscription);
      return res.json({
        transcription: fallbackTranscription,
        reply: fallbackReply,
        needsHumanHandoff: false,
        isFallback: true,
      });
    }

    const audioPart = {
      inlineData: {
        mimeType: mimeType,
        data: cleanBase64,
      },
    };

    const promptText = `Um cliente do WhatsApp enviou esta mensagem de áudio.
Faça duas coisas:
1. Transcreva com fidelidade o que o cliente falou no áudio.
2. Como a assistente virtual LIA da ${config.companyName}, elabore uma resposta amigável, clara e prestativa para o cliente em português brasileiro.

Responda estritamente em formato JSON com as chaves:
{
  "transcription": "Texto exato falado pelo cliente no áudio",
  "reply": "Resposta acolhedora e prestativa da LIA"
}`;

    const geminiAudioCall = ai.models.generateContent({
      model: 'gemini-3.1-flash-lite',
      contents: [audioPart, { text: promptText }],
      config: {
        systemInstruction: buildSystemPrompt(),
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        responseMimeType: 'application/json',
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AUDIO_TIMEOUT')), 3800)
    );

    const response = await Promise.race([geminiAudioCall, timeoutPromise]);

    let transcription = '';
    let reply = '';

    try {
      const parsed = JSON.parse(response.text || '{}');
      transcription = parsed.transcription || 'Mensagem de voz recebida';
      reply = parsed.reply || getFallbackResponse(transcription);
    } catch {
      reply = response.text || getFallbackResponse('áudio');
      transcription = 'Mensagem de voz recebida';
    }

    const needsHumanHandoff = checkHumanHandoff(transcription, reply);

    res.json({
      transcription,
      reply,
      needsHumanHandoff,
      isFallback: false,
    });
  } catch (err: any) {
    console.error('Gemini Audio Interpretation Error:', err);
    const transcription = 'Áudio sobre dúvidas de produtos e serviços';
    const reply = getFallbackResponse(transcription);
    res.json({
      transcription,
      reply,
      needsHumanHandoff: false,
      isFallback: true,
    });
  }
});

// TTS (Text-to-Speech) Audio Endpoint for LIA's voice
apiRouter.post('/tts', async (req, res) => {
  const { text } = req.body;
  if (!text) {
    return res.status(400).json({ error: 'Texto necessário' });
  }

  try {
    if (!process.env.GEMINI_API_KEY) {
      return res.status(400).json({ error: 'Chave Gemini necessária para áudio TTS' });
    }

    // Limit text length for fast TTS generation
    const cleanText = text.replace(/[*_#`]/g, '').slice(0, 300);

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash-lite-tts',
      contents: [
        {
          role: 'user',
          parts: [
            {
              text: cleanText,
              speechMetadata: {
                style: 'Voz feminina brasileira, simpática, profissional e acolhedora de assistente virtual.',
              },
            },
          ],
        },
      ],
      config: {
        responseModalities: ['AUDIO'],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      return res.status(500).json({ error: 'Falha ao gerar áudio' });
    }

    res.json({
      audioUrl: `data:audio/wav;base64,${base64Audio}`,
    });
  } catch (err: any) {
    console.error('TTS Error:', err);
    res.status(500).json({ error: 'Erro ao gerar áudio' });
  }
});

// WhatsApp Cloud API Webhook: GET for Verification
apiRouter.get('/webhook/whatsapp', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.whatsappVerifyToken) {
    webhookLogs.unshift({
      id: `verify-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      type: 'verification',
      status: 'success',
      payloadSummary: { mode, token, challenge },
    });
    return res.status(200).send(challenge);
  }

  return res.status(403).send('Token de verificação inválido');
});

// WhatsApp Cloud API Webhook: POST for incoming messages
apiRouter.post('/webhook/whatsapp', async (req, res) => {
  const body = req.body;

  try {
    // Check if it's a standard Meta WhatsApp webhook event
    const entry = body?.entry?.[0];
    const changes = entry?.changes?.[0];
    const value = changes?.value;
    const messageObj = value?.messages?.[0];

    const senderPhone = messageObj?.from || req.body?.senderPhone || '5567993174612';
    const msgType = messageObj?.type || (req.body?.isAudio ? 'audio' : 'text');
    let messageText = messageObj?.text?.body || req.body?.message || '';

    if (msgType === 'audio' || msgType === 'voice') {
      messageText = messageText || 'Mensagem de áudio recebida via WhatsApp: "Gostaria de saber os serviços e preços"';
    }

    if (!messageText) {
      return res.status(200).json({ status: 'ignored_empty_message' });
    }

    // Process message: first check instant knowledge base matcher
    let botReply = '';
    const kbMatch = findKnowledgeBaseAnswer(messageText, config);
    if (kbMatch) {
      botReply = kbMatch.reply;
    } else if (process.env.GEMINI_API_KEY) {
      try {
        const geminiCall = ai.models.generateContent({
          model: 'gemini-3.1-flash-lite',
          contents: `[MENSAGEM DO CLIENTE WHATSAPP]: ${messageText}`,
          config: {
            systemInstruction: buildSystemPrompt(),
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
            maxOutputTokens: 250,
            temperature: 0.5,
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('WEBHOOK_TIMEOUT')), 2800)
        );

        const response = await Promise.race([geminiCall, timeoutPromise]);
        botReply = response.text || getFallbackResponse(messageText);
      } catch (e) {
        botReply = getFallbackResponse(messageText);
      }
    } else {
      botReply = getFallbackResponse(messageText);
    }

    // Log the transaction
    webhookLogs.unshift({
      id: `hook-${Date.now()}`,
      timestamp: new Date().toLocaleTimeString('pt-BR'),
      type: 'incoming',
      senderPhone,
      message: messageText,
      response: botReply,
      status: 'success',
      payloadSummary: {
        from: senderPhone,
        text: messageText,
        botReply,
      },
    });

    if (webhookLogs.length > 50) {
      webhookLogs.pop();
    }

    // If real WhatsApp token and phone number ID are configured, forward response to Meta Graph API
    if (config.whatsappAccessToken && config.whatsappPhoneNumberId) {
      try {
        await fetch(`https://graph.facebook.com/v19.0/${config.whatsappPhoneNumberId}/messages`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${config.whatsappAccessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            messaging_product: 'whatsapp',
            to: senderPhone,
            type: 'text',
            text: { body: botReply },
          }),
        });
      } catch (metaErr) {
        console.error('Meta Graph API Send Error:', metaErr);
      }
    }

    res.status(200).json({
      status: 'processed',
      reply: botReply,
    });
  } catch (error: any) {
    console.error('Webhook Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint to view webhook logs
apiRouter.get('/webhook-logs', (req, res) => {
  res.json({ logs: webhookLogs });
});

// Clear webhook logs
apiRouter.post('/webhook-logs/clear', (req, res) => {
  webhookLogs.length = 0;
  res.json({ success: true });
});

// Mount API router:
// 1. '/api' prefix: works with direct frontend fetch('/api/*')
// 2. '/' prefix: works when Vercel rewrites /api/* to /api serverless function
app.use('/api', apiRouter);
app.use(apiRouter);

// Export Express app for Vercel Serverless Function and modular imports
export { app, apiRouter };
export default app;

// Setup Vite or Static File Serving (standalone dev / production server)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LIA WhatsApp Business Server running on http://0.0.0.0:${PORT}`);
  });
}

// Only launch TCP listener when running standalone (not inside Vercel serverless environment)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  startServer();
}
