import express from 'express';
import path from 'path';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  buildSemanticIndex,
  matchSemanticQuery,
  SemanticIndex,
  SemanticMatchResult,
} from './src/utils/semanticIndexer.js';

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

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
  website: string;
  websiteConectacard?: string;
  websiteSuperlimpo?: string;
  catalogUrl: string;
  whatsappVerifyToken: string;
  whatsappAccessToken: string;
  whatsappPhoneNumberId: string;
  quickQuestions: string[];
  systemPromptAddendum: string;
}

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

3. Biosite com Atendimento Virtual (BiositesAI)
- Para: empresas de todo o Brasil.
- Inclui: biosite com atendimento 24h por agente de IA treinado para saber tudo da empresa.
- Valor: R$ 167,00 + R$ 50,00 por mês de manutenção do agente de IA.
- Modelo: https://biositesaisuperlimpo.netlify.app/

4. Gestão de Tráfego (Meta Ads)
- Para: empresas de todo o Brasil.
- Inclui: criação de campanhas de marketing no Meta Ads.
- Valor: a combinar.

5. Agente de IA para WhatsApp
- Para: empresas de todo o Brasil.
- Inclui: agente de IA no WhatsApp da empresa, responsável pelo atendimento, com conhecimento total do negócio.
- Valor: a combinar.

6. AvaliaCard (também chamado de Cartão de Avaliação do Google ou Placa de Avaliação do Google)
- IMPORTANTE: "Cartão de Avaliação do Google" e "Placa de Avaliação do Google" são exatamente o mesmo produto que o "AvaliaCard".
- Para: empresas de todo o Brasil.
- Inclui: cartão/placa com tecnologia NFC (aproximação) e QR Code com link direto para a página de avaliação do Google da empresa.
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

let config: BusinessConfig = {
  companyName: process.env.COMPANY_NAME || 'Start Mkt Local',
  botName: process.env.BOT_NAME || 'LIA',
  botRole: 'Especialista de atendimento e vendas',
  businessPhone: process.env.BUSINESS_PHONE || '+55 67 99317-4612',
  website: process.env.WEBSITE || 'https://www.startmktlocal.com.br/',
  websiteConectacard: 'https://avaliacard.vercel.app/',
  websiteSuperlimpo: 'https://biositesaisuperlimpo.netlify.app/',
  catalogUrl: process.env.CATALOG_URL || 'https://www.startmktlocal.com.br/',
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'lia_token_whatsapp_2026',
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
  quickQuestions: [
    'Oi, quanto custa um site?',
    'Achei caro, vou pensar.',
    'Vocês fazem logomarca?',
    'Você é um robô?',
    'Qual o prazo do Meta Ads?',
    'Tem desconto no PIX?',
    'E aí mano, quero um bagulho pra aparecer no Google',
    'Como funciona o Biosite com IA?',
    'Quero a Placa de Avaliação do Google (AvaliaCard)',
  ],
  systemPromptAddendum: OFFICIAL_KNOWLEDGE_BASE,
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

/**
 * Strips Markdown link formatting [texto](url) -> url so all links are pure URLs as required by Rule #4.
 */
function sanitizePureLinks(text: string): string {
  return text
    .replace(/\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g, '$2')
    .replace(/\[(https?:\/\/[^\s\]]+)\]/g, '$1')
    .trim();
}

/**
 * Checks current business hours in Ponta Porã - MS (America/Campo_Grande).
 * Horário: segunda a sexta, 08h às 18h | sábado, 08h às 12h.
 */
function getBusinessHoursContext(): { isOpen: boolean; statusText: string } {
  try {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('pt-BR', {
      timeZone: 'America/Campo_Grande',
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    });
    const parts = formatter.formatToParts(now);
    const weekday = (parts.find((p) => p.type === 'weekday')?.value || '').toLowerCase();
    const hour = parseInt(parts.find((p) => p.type === 'hour')?.value || '10', 10);

    const isSunday = weekday.includes('domingo');
    const isSaturday = weekday.includes('sábado') || weekday.includes('sabado');
    let isOpen = false;
    if (isSunday) {
      isOpen = false;
    } else if (isSaturday) {
      isOpen = hour >= 8 && hour < 12;
    } else {
      isOpen = hour >= 8 && hour < 18;
    }

    return {
      isOpen,
      statusText: `Dia atual em Ponta Porã (MS): ${weekday}, ${hour}h (${
        isOpen
          ? 'DENTRO do horário comercial'
          : 'FORA do horário comercial — você continua atendendo normalmente 24h, e se falarem de especialista humano ou horário, avise que o especialista humano retorna no próximo horário de funcionamento: seg a sex 08h às 18h ou sáb 08h às 12h'
      }).`,
    };
  } catch {
    return { isOpen: true, statusText: 'Horário comercial: segunda a sexta 08h às 18h | sábado 08h às 12h.' };
  }
}

function buildSystemPrompt() {
  const hoursCtx = getBusinessHoursContext();
  return `${config.systemPromptAddendum || OFFICIAL_KNOWLEDGE_BASE}

# CONTEXTO DE HORÁRIO ATUAL
${hoursCtx.statusText}

# EXEMPLOS DE REFERÊNCIA (SIGA EXATAMENTE ESTE ESTILO E ESTAS REGRAS)

Mensagem de abertura:
Oi! Tudo bem? 😊 Eu sou a LIA, da Start Mkt Local.
Posso te ajudar com site, Google Meu Negócio, anúncios e mais.
Qual é o seu nome e o que você tá buscando pro seu negócio?

Exemplo 1 (dúvida de preço):
Cliente: Oi, quanto custa um site?
LIA: Oi! Tudo bem? Aqui na Start Mkt Local os sites começam a partir de R$ 500,00 e ficam prontos em 7 dias.
Me conta, qual é o seu negócio? Assim eu vejo o que faz mais sentido pra você.

Exemplo 2 (objeção de valor):
Cliente: Achei caro, vou pensar.
LIA: Entendo total! Só lembro que nossos serviços são feitos pra turbinar negócios locais e te ajudar a vender mais.
Posso te mostrar o parcelamento em até 3x sem juros pra caber no seu orçamento?

Exemplo 3 (fora do escopo / informação não presente nos dados):
Cliente: Vocês fazem logomarca?
LIA: Para te confirmar esse detalhe específico sem erro, vou te passar o contato direto do nosso especialista: https://wa.me/5567993174612

Exemplo 4 (prazo de serviço que não tem prazo listado no documento):
Cliente: Qual o prazo do Meta Ads?
LIA: Para te confirmar esse detalhe específico sem erro, vou te passar o contato direto do nosso especialista: https://wa.me/5567993174612

Exemplo 5 (pergunta se é robô):
Cliente: Você é um robô?
LIA: Sou sim! Eu sou a assistente virtual aqui da Start Mkt Local, treinada pra te ajudar rapidinho pelo WhatsApp. 😊
Se você quiser falar direto com nosso especialista humano a qualquer momento, é só me pedir que te passo pra ele. Como posso te ajudar hoje?

Exemplo 6 (desconto no PIX):
Cliente: Tem desconto no PIX?
LIA: No PIX já te dou 5% de desconto na hora! Se quiser fechar mais de um serviço, posso chamar nosso especialista no WhatsApp pra liberar uma condição especial. Quer que eu te passe o contato?
`;
}

// Semantic Index Cache
let cachedSemanticIndex: SemanticIndex | null = null;
let cachedKnowledgeText = '';

function getActiveSemanticIndex(cfg: BusinessConfig): SemanticIndex {
  const currentText = cfg.systemPromptAddendum || OFFICIAL_KNOWLEDGE_BASE;
  if (!cachedSemanticIndex || cachedKnowledgeText !== currentText) {
    cachedSemanticIndex = buildSemanticIndex(currentText, cfg);
    cachedKnowledgeText = currentText;
  }
  return cachedSemanticIndex;
}

/**
 * Extracts customer name from conversation history or current message if mentioned.
 */
function extractClientName(
  message: string,
  history: Array<{ role: string; text: string }> = []
): string | null {
  const allUserTexts = [
    ...history.filter((h) => h.role === 'user').map((h) => h.text),
    message,
  ];
  const namePatterns = [
    /(?:meu nome é|meu nome e|me chamo|eu sou o|eu sou a|sou o|sou a|pode me chamar de)\s+([A-ZÀ-Ÿa-zà-ÿ]{2,20})/i,
    /^([A-ZÀ-Ÿ][a-zà-ÿ]{2,15})\s*[,.-]\s*(?:tenho|quero|preciso|sou)/i,
  ];

  for (let i = allUserTexts.length - 1; i >= 0; i--) {
    const txt = allUserTexts[i].trim();
    for (const pattern of namePatterns) {
      const m = txt.match(pattern);
      if (m && m[1]) {
        const candidate = m[1].trim();
        const ignore = new Set([
          'oi', 'ola', 'olá', 'bom', 'boa', 'tudo', 'bem', 'quero', 'preciso',
          'cliente', 'dono', 'empresario', 'empresário', 'interessado', 'mano',
        ]);
        if (!ignore.has(candidate.toLowerCase())) {
          return candidate.charAt(0).toUpperCase() + candidate.slice(1).toLowerCase();
        }
      }
    }
  }
  return null;
}

/**
 * Strict guardrail checker: returns the exact required out-of-scope sentence if the user asks
 * for something not in the official document (e.g. logo, prazo for Meta Ads/GMN/IA, etc.).
 */
function checkStrictGuardrail(query: string): { reply: string; needsHumanHandoff: boolean } | null {
  const q = query.toLowerCase().trim();
  const exactOutOfScopeReply =
    'Para te confirmar esse detalhe específico sem erro, vou te passar o contato direto do nosso especialista: https://wa.me/5567993174612';

  // 1. Prazos de serviços que NÃO têm prazo no documento (apenas Criação de Sites tem prazo de 7 dias)
  if (
    q.includes('prazo') ||
    q.includes('quanto tempo demora') ||
    q.includes('quantos dias demora') ||
    q.includes('em quanto tempo fica pronto')
  ) {
    const isAboutSite =
      (q.includes('site') || q.includes('pagina') || q.includes('página')) &&
      !q.includes('biosite') &&
      !q.includes('bio site');
    if (!isAboutSite) {
      return { reply: exactOutOfScopeReply, needsHumanHandoff: true };
    }
  }

  // 2. Serviços ou itens que não estão no documento
  const outOfScopeTerms = [
    'logomarca',
    'logotipo',
    'fazer logo',
    'criam logo',
    'fazem logo',
    'identidade visual',
    'cartão de visita',
    'cartao de visita',
    'panfleto',
    'folder',
    'outdoor',
    'hospedagem',
    'registro de domínio',
    'registro de dominio',
    'tiktok',
    'youtube',
    'linkedin',
    'pinterest',
    'email marketing',
    'e-mail marketing',
    'assessoria de imprensa',
    'fotografia',
    'filmagem',
    'edição de vídeo',
    'edicao de video',
    'nota fiscal',
    'cnpj da empresa',
  ];

  if (outOfScopeTerms.some((term) => q.includes(term))) {
    return { reply: exactOutOfScopeReply, needsHumanHandoff: true };
  }

  return null;
}

/**
 * Humanized WhatsApp conversational responder (used as instant guardrail & high-speed fallback).
 */
function findKnowledgeBaseAnswer(
  query: string,
  cfg: BusinessConfig,
  history: Array<{ role: string; text: string }> = []
): { reply: string; needsHumanHandoff: boolean } | null {
  const q = query.toLowerCase().trim();
  const whatsappUrl = 'https://wa.me/5567993174612';
  const websiteUrl = 'https://www.startmktlocal.com.br/';
  const clientName = extractClientName(query, history);
  const namePrefix = clientName ? `${clientName}, ` : '';
  const hoursCtx = getBusinessHoursContext();

  // Check if user is talking about off-hours / Sunday / night
  const mentionsOffHours =
    q.includes('domingo') ||
    q.includes('feriado') ||
    q.includes('madrugada') ||
    q.includes('fora do horário') ||
    q.includes('fora do horario') ||
    q.includes('atende agora') ||
    q.includes('abertos agora');

  const offHoursNote =
    mentionsOffHours || !hoursCtx.isOpen
      ? '\n\nAh, eu continuo te atendendo por aqui normalmente, e nosso especialista humano retorna no próximo horário de funcionamento (segunda a sexta das 08h às 18h e sábado das 08h às 12h).'
      : '';

  // Check if tone is super informal
  const isInformal =
    q.includes('mano') ||
    q.includes('bagulho') ||
    q.includes('parça') ||
    q.includes('parca') ||
    q.includes('brother') ||
    q.includes('irmão') ||
    q.includes('irmao') ||
    q.includes('bora') ||
    q.includes('trampo');

  // 1. Strict Out-of-Scope Guardrail (Regra Inegociável #3)
  const guardrail = checkStrictGuardrail(query);
  if (guardrail) {
    return guardrail;
  }

  // 2. Pergunta se é robô / IA
  if (
    q.includes('robô') ||
    q.includes('robo') ||
    q.includes('é uma ia') ||
    q.includes('e uma ia') ||
    q.includes('assistente virtual') ||
    q.includes('pessoa de verdade') ||
    q.includes('atendente de verdade')
  ) {
    return {
      reply: `Sou sim! Eu sou a assistente virtual da ${cfg.companyName}, treinada pra te ajudar rapidinho aqui pelo WhatsApp. 😊\n\nSe você preferir falar direto com nosso especialista humano, eu te passo pra ele quando você quiser. Quer continuar tirando sua dúvida comigo ou prefere que eu chame ele?`,
      needsHumanHandoff: false,
    };
  }

  // 3. Conversa 2: Objeção de valor ("Achei caro, vou pensar.")
  if (
    q.includes('achei caro') ||
    q.includes('tá caro') ||
    q.includes('ta caro') ||
    q.includes('muito caro') ||
    q.includes('vou pensar') ||
    q.includes('valor alto') ||
    q.includes('achei alto')
  ) {
    return {
      reply: `Entendo total! Só lembro que nossos serviços são feitos pra turbinar negócios locais e te ajudar a vender mais.\n\nPosso te mostrar o parcelamento em até 3x sem juros pra caber no seu orçamento?`,
      needsHumanHandoff: false,
    };
  }

  // 4. Objeção: Desconto / PIX ("Tem desconto no PIX?")
  if (q.includes('desconto') || q.includes('pix')) {
    return {
      reply: `No PIX já te dou 5% de desconto na hora! Se quiser fechar mais de um serviço, posso chamar nosso especialista no WhatsApp pra liberar uma condição especial. Quer que eu te passe o contato?`,
      needsHumanHandoff: false,
    };
  }

  // 5. Objeção: Garantia
  if (q.includes('garantia')) {
    return {
      reply: `Você tem 15 dias de garantia total. Se qualquer coisa não ficar como combinado, a gente resolve sem burocracia. Quer seguir com a gente?`,
      needsHumanHandoff: false,
    };
  }

  // 6. Pergunta sobre atendimento fora do horário (ex: domingo)
  if (mentionsOffHours && !q.includes('site') && !q.includes('google') && !q.includes('anúncio')) {
    return {
      reply: `Oi! Tudo bem? Eu continuo te atendendo por aqui normalmente! 😊 Nosso especialista humano retorna no próximo horário de funcionamento (segunda a sexta das 08h às 18h e sábado das 08h às 12h).\n\nQual é o seu nome e o que você tá buscando melhorar no seu negócio hoje?`,
      needsHumanHandoff: false,
    };
  }

  // 7. Conversa 1: Criação de Sites / "Oi, quanto custa um site?"
  if (
    (q.includes('site') || q.includes('landing page')) &&
    !q.includes('biosite') &&
    !q.includes('bio site') &&
    !q.includes('site de vocês') &&
    !q.includes('site de voces') &&
    !q.includes('site da agência') &&
    !q.includes('site da agencia') &&
    !q.includes('qual o site')
  ) {
    if (isInformal) {
      return {
        reply: `E aí, beleza? Bora fazer esse site sair do papel! Aqui na ${cfg.companyName} os sites começam a partir de R$ 500,00 e ficam prontos em 7 dias pra destacar sua empresa.\n\nQual é o seu nome e qual é o seu ramo pra gente trocar uma ideia?`,
        needsHumanHandoff: false,
      };
    }
    return {
      reply: `Oi! Tudo bem? Aqui na ${cfg.companyName} os sites começam a partir de R$ 500,00 e ficam prontos em 7 dias.\n\nMe conta, qual é o seu negócio? Assim eu vejo o que faz mais sentido pra você.`,
      needsHumanHandoff: false,
    };
  }

  // 8. AvaliaCard / Cartão de Avaliação do Google / Placa de Avaliação do Google
  // (Avaliado antes de Google Meu Negócio para que "Cartão/Placa de Avaliação do Google" caia sempre no AvaliaCard)
  if (
    q.includes('avaliacard') ||
    q.includes('avalia card') ||
    q.includes('nfc') ||
    q.includes('cartão de avaliação') ||
    q.includes('cartao de avaliacao') ||
    q.includes('placa de avaliação') ||
    q.includes('placa de avaliacao') ||
    q.includes('placa do google') ||
    q.includes('cartão do google') ||
    q.includes('cartao do google') ||
    q.includes('plaquinha')
  ) {
    return {
      reply: `Boa! ${clientName ? `${clientName}, o` : 'O'} Cartão ou Placa de Avaliação do Google é o nosso AvaliaCard: ele vem com tecnologia NFC (aproximação) e QR Code que leva seu cliente direto pra avaliar sua empresa no Google. Ele custa R$ 89,00 com frete grátis!\n\nDá uma olhada nele aqui: https://avaliacard.vercel.app/\n\nQuer garantir o seu com frete grátis?`,
      needsHumanHandoff: false,
    };
  }

  // 9. Biosite com Atendimento Virtual (BiositesAI)
  if (q.includes('biosite') || q.includes('bio site') || q.includes('superlimpo')) {
    return {
      reply: `Show! O Biosite vem com atendimento 24h por um agente de IA treinado pra saber tudo da sua empresa. O valor é R$ 167,00 + R$ 50,00 por mês de manutenção.\n\nDá uma olhada nesse modelo funcionando: https://biositesaisuperlimpo.netlify.app/\n\nO que você achou pra usar no seu negócio?`,
      needsHumanHandoff: false,
    };
  }

  // 10. Google Meu Negócio (incluindo versão informal "e aí mano, quero um bagulho pra aparecer no Google")
  if (
    q.includes('google') ||
    q.includes('aparecer no google') ||
    q.includes('meu negócio') ||
    q.includes('meu negocio')
  ) {
    if (isInformal) {
      return {
        reply: `E aí, beleza? Bora resolver isso! A gente faz a Gestão de Google Meu Negócio, criando e cuidando do perfil da sua empresa pra você aparecer bem posicionado no Google.\n\nComo o valor é a combinar conforme o tamanho do projeto, me diz aí: qual é o seu nome e qual é o seu negócio?`,
        needsHumanHandoff: false,
      };
    }
    return {
      reply: `Boa! ${namePrefix}com a Gestão de Google Meu Negócio a gente cria e cuida do perfil da sua empresa pra destacar seu negócio nas buscas do Google.\n\nComo o valor depende do tamanho do projeto, me conta: qual é o seu negócio e o que você quer melhorar hoje?`,
      needsHumanHandoff: false,
    };
  }

  // 11. Gestão de Tráfego (Meta Ads)
  if (q.includes('meta ads') || q.includes('tráfego') || q.includes('trafego') || q.includes('anúncio') || q.includes('anuncio') || q.includes('campanha')) {
    return {
      reply: `Entendi! Na Gestão de Tráfego a gente cria campanhas no Meta Ads pra atrair clientes pro seu negócio. O valor é a combinar porque depende do tamanho do projeto.\n\nQuer que eu chame nosso especialista no WhatsApp pra montar uma proposta pra você?`,
      needsHumanHandoff: false,
    };
  }

  // 12. Agente de IA para WhatsApp
  if (q.includes('agente de ia') || q.includes('agente ia') || q.includes('ia para whatsapp') || q.includes('ia no whatsapp')) {
    return {
      reply: `Show! A gente cria um Agente de IA direto no WhatsApp da sua empresa, responsável pelo atendimento e com conhecimento total do seu negócio.\n\nComo o valor é a combinar de acordo com o tamanho do projeto, quer que eu te passe o contato do nosso especialista pra montar a proposta?`,
      needsHumanHandoff: false,
    };
  }

  // 13. Site Oficial da Agência
  if (
    q.includes('qual o site') ||
    q.includes('site de vocês') ||
    q.includes('site de voces') ||
    q.includes('site da agência') ||
    q.includes('site da agencia') ||
    q.includes('startmktlocal')
  ) {
    return {
      reply: `Claro! O nosso site oficial é esse aqui:\n${websiteUrl}\n\nMe conta, qual é o seu nome e o que você tá querendo melhorar no seu negócio?`,
      needsHumanHandoff: false,
    };
  }

  // 14. Falar com Especialista / WhatsApp
  if (
    q.includes('especialista') ||
    q.includes('atendente') ||
    q.includes('humano') ||
    q.includes('falar com alguém') ||
    q.includes('falar com alguem') ||
    q.includes('whatsapp') ||
    q.includes('contato')
  ) {
    return {
      reply: `Beleza! Vou te passar o contato direto do nosso especialista no WhatsApp:\n${whatsappUrl}${offHoursNote}\n\nQual é o seu nome pra eu já deixar registrado por aqui?`,
      needsHumanHandoff: true,
    };
  }

  // 15. Horário e Localização
  if (q.includes('horário') || q.includes('horario') || q.includes('onde fica') || q.includes('ponta porã') || q.includes('ponta pora')) {
    return {
      reply: `Nossa sede fica em Ponta Porã (MS) e atendemos empresas de todo o Brasil! Nosso horário é de segunda a sexta das 08h às 18h, e sábado das 08h às 12h.${offHoursNote}\n\nComo é o seu nome e qual é o seu negócio?`,
      needsHumanHandoff: false,
    };
  }

  // 16. Saudações simples
  if (
    q === 'oi' ||
    q === 'olá' ||
    q === 'ola' ||
    q === 'bom dia' ||
    q === 'boa tarde' ||
    q === 'boa noite' ||
    q === 'tudo bem' ||
    q === 'tudo bem?' ||
    q === 'opa' ||
    q === 'e aí' ||
    q === 'e ai'
  ) {
    return {
      reply: `Oi! Tudo bem? 😊 Eu sou a ${cfg.botName}, da ${cfg.companyName}.\nPosso te ajudar com site, Google Meu Negócio, anúncios e mais.\nQual é o seu nome e o que você tá buscando pro seu negócio?`,
      needsHumanHandoff: false,
    };
  }

  return null;
}

// Fallback response generator according to Regras Inegociáveis
function getFallbackResponse(
  query: string,
  history: Array<{ role: string; text: string }> = []
): string {
  const kbMatch = findKnowledgeBaseAnswer(query, config, history);
  if (kbMatch) return kbMatch.reply;

  // Regra Inegociável #3: se perguntar algo fora do documento
  return `Para te confirmar esse detalhe específico sem erro, vou te passar o contato direto do nosso especialista: https://wa.me/5567993174612`;
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
    'contato direto do nosso especialista',
  ];
  const textLower = (text + ' ' + reply).toLowerCase();
  return triggerWords.some((w) => textLower.includes(w));
}

// API Router setup (supports standalone Express, Vite proxy, Vercel & Netlify Serverless Functions)
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
    if (updates.systemPromptAddendum !== undefined) {
      cachedSemanticIndex = null;
    }
    res.json({ success: true, config });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Semantic Index & Real-time Test Endpoints
apiRouter.get('/semantic-index', (req, res) => {
  try {
    const semIndex = getActiveSemanticIndex(config);
    res.json({ success: true, index: semIndex });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

apiRouter.post('/semantic-test', (req, res) => {
  try {
    const { query = '', addendum } = req.body;
    const testCfg = addendum ? { ...config, systemPromptAddendum: addendum } : config;
    const semIndex = buildSemanticIndex(testCfg.systemPromptAddendum, testCfg);
    const result = matchSemanticQuery(query, semIndex, testCfg);
    res.json({
      success: true,
      result,
      stats: {
        totalTopics: semIndex.topics.length,
        totalKeywords: semIndex.totalKeywords,
        categories: semIndex.categories,
      },
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Chat endpoint with Humanized WhatsApp Intelligence + Guardrails
apiRouter.post('/chat', async (req, res) => {
  const { message, history = [] } = req.body;

  if (!message || typeof message !== 'string') {
    return res.status(400).json({ error: 'Mensagem inválida' });
  }

  // 1. Check strict out-of-scope guardrails first (Regra Inegociável #3)
  const strictGuardrail = checkStrictGuardrail(message);
  if (strictGuardrail) {
    return res.json({
      reply: strictGuardrail.reply,
      needsHumanHandoff: strictGuardrail.needsHumanHandoff,
      isFallback: false,
      source: 'strict_guardrail',
    });
  }

  // 2. If Gemini API Key is present, use Gemini with full conversation history & humanized prompt
  const systemInstruction = buildSystemPrompt();

  try {
    if (!process.env.GEMINI_API_KEY) {
      const kbMatch = findKnowledgeBaseAnswer(message, config, history);
      const reply = kbMatch ? kbMatch.reply : getFallbackResponse(message, history);
      const needsHumanHandoff = kbMatch ? kbMatch.needsHumanHandoff : checkHumanHandoff(message, reply);
      return res.json({
        reply,
        needsHumanHandoff,
        isFallback: true,
      });
    }

    const contents: any[] = [];
    for (const h of history.slice(-10)) {
      contents.push({
        role: h.role === 'assistant' || h.role === 'model' ? 'model' : 'user',
        parts: [{ text: h.text }],
      });
    }
    contents.push({
      role: 'user',
      parts: [{ text: message }],
    });

    const geminiCall = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        maxOutputTokens: 300,
        temperature: 0.45,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), 6000)
    );

    const response = await Promise.race([geminiCall, timeoutPromise]);
    const rawReply = response.text || getFallbackResponse(message, history);
    const reply = sanitizePureLinks(rawReply);
    const needsHumanHandoff = checkHumanHandoff(message, reply);

    res.json({
      reply,
      needsHumanHandoff,
      isFallback: false,
    });
  } catch (err: any) {
    const reply = getFallbackResponse(message, history);
    const needsHumanHandoff = checkHumanHandoff(message, reply);
    res.json({
      reply,
      needsHumanHandoff,
      isFallback: true,
      apiNotice: 'Respondido em modo de alta performance.',
    });
  }
});

// Audio endpoint - Deprecated / Audio disabled
apiRouter.post('/chat-audio', async (req, res) => {
  res.json({
    transcription: 'Mensagem de voz',
    reply: 'Nosso atendimento agora é exclusivamente por escrito para maior agilidade e clareza. Como posso te ajudar hoje?',
    needsHumanHandoff: false,
    isFallback: false,
  });
});

// Multimodal endpoint - Processes Images and PDFs with Google Gemini Vision & Document Understanding
apiRouter.post('/chat-multimodal', async (req, res) => {
  const { fileBase64, mimeType = 'image/jpeg', fileName = 'anexo', message = '', history = [] } = req.body;

  if (!fileBase64) {
    return res.status(400).json({ error: 'Arquivo não fornecido' });
  }

  const cleanBase64 = fileBase64.replace(/^data:[^;]+;base64,/, '');
  const lowerMime = (mimeType || '').toLowerCase();
  const lowerName = (fileName || '').toLowerCase();
  const isPdf = lowerMime.includes('pdf') || lowerName.endsWith('.pdf');

  try {
    if (!process.env.GEMINI_API_KEY) {
      const fallbackReply = isPdf
        ? `Recebi seu documento PDF "${fileName}". Analisamos contratos, catálogos e orçamentos em PDF com máxima precisão! Para combinarmos uma proposta personalizada, você pode nos chamar no WhatsApp: [Falar no WhatsApp](https://wa.me/5567993174612).`
        : `Recebi sua imagem com sucesso! Se for um comprovante de pagamento PIX ou referência de site, já está registrado para conferência. Quer falar diretamente com nosso especialista no WhatsApp? [Falar no WhatsApp](https://wa.me/5567993174612)`;
      return res.json({
        reply: fallbackReply,
        fileDescription: isPdf ? `Documento PDF: ${fileName}` : `Imagem enviada: ${fileName}`,
        needsHumanHandoff: false,
        isFallback: true,
      });
    }

    const filePart = {
      inlineData: {
        mimeType: isPdf ? 'application/pdf' : mimeType.split(';')[0].trim(),
        data: cleanBase64,
      },
    };

    let promptText = '';
    if (isPdf) {
      promptText = `O cliente enviou este documento PDF anexado ("${fileName}").
Mensagem acompanhante do cliente: "${message || 'Por favor, analise este arquivo PDF.'}"

Instruções para você, LIA (${config.botRole} da ${config.companyName}):
1. Leia e interprete detalhadamente o conteúdo deste documento PDF (tabela de preços, catálogo de produtos, orçamentos, contratos ou apresentação empresarial).
2. Forneça uma resposta clara, amigável, consultiva e em português brasileiro (máximo de 3 parágrafos objetivos).
3. Resuma os pontos mais relevantes do documento e conecte com o atendimento e as soluções da ${config.companyName} (Criação de Sites a partir de R$ 500, Biosite com IA por R$ 167, AvaliaCard NFC por R$ 89, Google Meu Negócio, Tráfego Pago).
4. Termine sempre com uma pergunta para o próximo passo ou convite para fechar no WhatsApp [https://wa.me/5567993174612](https://wa.me/5567993174612).`;
    } else {
      promptText = `O cliente enviou esta imagem anexada ("${fileName}").
Mensagem acompanhante do cliente: "${message || 'Por favor, analise esta imagem.'}"

Instruções para você, LIA (${config.botRole} da ${config.companyName}):
1. Observe detalhadamente o conteúdo da imagem (seja comprovante de PIX/pagamento, referência de design de site, fachada de empresa, foto de produto, logotipo ou captura de tela).
2. Se for um comprovante de PIX: identifique o valor, a data e confirme o recebimento com entusiasmo, orientando os próximos passos da ativação do serviço!
3. Se for uma referência de site ou modelo: comente sobre a estética e explique que desenvolvemos sites modernos nesse padrão a partir de R$ 500,00 com entrega em 7 dias!
4. Se for foto de produto, fachada ou cartão: elogie o negócio e sugira como a ${config.companyName} pode acelerar as vendas locais (Google Meu Negócio, AvaliaCard NFC, Biosite com IA ou Anúncios).
5. Mantenha tom simpático e termine sempre com uma pergunta para avançar.`;
    }

    const geminiCall = ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: [filePart, { text: promptText }],
      config: {
        systemInstruction: buildSystemPrompt(),
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        maxOutputTokens: 600,
        temperature: 0.4,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('MULTIMODAL_TIMEOUT')), 12000)
    );

    const response = await Promise.race([geminiCall, timeoutPromise]);
    const rawReply = response.text || (isPdf ? 'Documento PDF analisado com sucesso.' : 'Imagem analisada com sucesso.');
    const reply = sanitizePureLinks(rawReply);
    const needsHumanHandoff = checkHumanHandoff(message || fileName, reply);

    res.json({
      reply,
      fileDescription: isPdf ? `PDF: ${fileName}` : `Imagem: ${fileName}`,
      needsHumanHandoff,
      isFallback: false,
    });
  } catch (err: any) {
    console.error('Gemini Multimodal Error:', err);
    const reply = isPdf
      ? `Recebi o seu documento PDF "${fileName}"! Para te confirmar esse detalhe específico sem erro, vou te passar o contato direto do nosso especialista: https://wa.me/5567993174612`
      : `Recebi a sua imagem! Vamos analisar juntos no WhatsApp: https://wa.me/5567993174612`;
    res.json({
      reply,
      fileDescription: isPdf ? `PDF: ${fileName}` : `Imagem: ${fileName}`,
      needsHumanHandoff: false,
      isFallback: true,
    });
  }
});

// TTS endpoint - Deprecated / Audio disabled
apiRouter.post('/tts', async (req, res) => {
  res.json({ audioUrl: '' });
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
      messageText = messageText || 'Oi, quanto custa um site?';
    }

    if (!messageText) {
      return res.status(200).json({ status: 'ignored_empty_message' });
    }

    // Process message: check strict guardrails first, then Gemini or humanized fallback
    let botReply = '';
    const strictGuardrail = checkStrictGuardrail(messageText);
    if (strictGuardrail) {
      botReply = strictGuardrail.reply;
    } else if (process.env.GEMINI_API_KEY) {
      try {
        const geminiCall = ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: messageText,
          config: {
            systemInstruction: buildSystemPrompt(),
            thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
            maxOutputTokens: 280,
            temperature: 0.45,
          },
        });

        const timeoutPromise = new Promise<never>((_, reject) =>
          setTimeout(() => reject(new Error('WEBHOOK_TIMEOUT')), 4500)
        );

        const response = await Promise.race([geminiCall, timeoutPromise]);
        botReply = sanitizePureLinks(response.text || getFallbackResponse(messageText));
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
// 2. '/.netlify/functions/api' prefix: works with Netlify Functions
// 3. '/' prefix: works when Vercel/Netlify rewrites /api/* to serverless function
app.use('/api', apiRouter);
app.use('/.netlify/functions/api', apiRouter);
app.use(apiRouter);

// Export Express app for Vercel/Netlify Serverless Function and modular imports
export { app, apiRouter };
export default app;

// Setup Vite or Static File Serving (standalone dev / production server)
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vitePkg = 'vite';
    const { createServer: createViteServer } = await import(vitePkg);
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`LIA WhatsApp Business Server running on http://0.0.0.0:${PORT}`);
  });
}

// Only launch TCP listener when running standalone (not inside Vercel or Netlify serverless environment)
if (
  !process.env.VERCEL &&
  !process.env.NETLIFY &&
  !process.env.AWS_LAMBDA_FUNCTION_NAME &&
  process.env.NODE_ENV !== 'test'
) {
  startServer();
}
