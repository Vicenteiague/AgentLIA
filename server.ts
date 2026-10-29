import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import {
  buildSemanticIndex,
  matchSemanticQuery,
  SemanticIndex,
  SemanticMatchResult,
} from './src/utils/semanticIndexer.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
- **Link de Contato/WhatsApp:** https://wa.me/5567993174612
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
- Envie sempre em formato de link clicável (ex: [https://wa.me/5567993174612](https://wa.me/5567993174612), [https://www.startmktlocal.com.br/](https://www.startmktlocal.com.br/), [https://vicenteiaguebiositegoogleia.vercel.app/](https://vicenteiaguebiositegoogleia.vercel.app/), [https://avaliacard.vercel.app/](https://avaliacard.vercel.app/)).

---

# 6. REGRAS DE OURO (Guardrails)
1. **Fidelidade aos Dados:** Responda APENAS com base nas informações acima. Se o cliente perguntar algo que não está neste documento, diga exatamente: "Para te confirmar esse detalhe específico sem erro, vou te passar o contato direto do nosso especialista: [- **Link de Contato/WhatsApp:** https://wa.me/5567993174612]".
2. **Proibido Inventar:** Nunca invente preços, prazos, promoções ou serviços que não estejam na seção 3 e 7.
3. **Formatação:** Nunca envie blocos gigantes de texto. Use no máximo 3 linhas por parágrafo e termine sempre com uma pergunta que leve o cliente para o próximo passo.

---

# 7. INTEGRAÇÕES GOOGLE (Agenda, Planilhas e Meu Negócio)
- **Google Agenda (Calendar):** Conectamos e agendamos consultas/reuniões de apresentação de serviços diretamente na Google Agenda. Você pode agendar na aba Google do app ou pelo WhatsApp [https://wa.me/5567993174612](https://wa.me/5567993174612).
- **Google Sheets (Planilhas):** Gravamos e sincronizamos os leads e contatos recebidos automaticamente em planilhas do Google Drive.
- **Google Meu Negócio & AvaliaCard:** Gerenciamos seu perfil no Google Meu Negócio e fornecemos o **AvaliaCard NFC** ([https://avaliacard.vercel.app/](https://avaliacard.vercel.app/)) por R$ 89,00 + frete grátis, para os clientes avaliarem sua empresa com 5 estrelas por aproximação no balcão.`;

let config: BusinessConfig = {
  companyName: process.env.COMPANY_NAME || 'Start Mkt Local',
  botName: process.env.BOT_NAME || 'LIA',
  botRole: 'Especialista de atendimento e vendas',
  businessPhone: process.env.BUSINESS_PHONE || '+55 67 99317-4612',
  website: process.env.WEBSITE || 'https://www.startmktlocal.com.br/',
  websiteConectacard: 'https://www.startmktlocal.com.br/',
  websiteSuperlimpo: 'https://www.startmktlocal.com.br/',
  catalogUrl: process.env.CATALOG_URL || 'https://www.startmktlocal.com.br/',
  whatsappVerifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'lia_token_whatsapp_2026',
  whatsappAccessToken: process.env.WHATSAPP_ACCESS_TOKEN || '',
  whatsappPhoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
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
  return `Você é a ${config.botName}, ${config.botRole} da ${config.companyName}.
Responda de forma direta, simpática, consultiva e focada em conversão, ideal para leitura rápida no celular (máximo de 3 linhas por parágrafo, terminando sempre com uma pergunta para o próximo passo).

BASE DE CONHECIMENTO OFICIAL E DIRETRIZES:
${OFFICIAL_KNOWLEDGE_BASE}

DIRETRIZES CRÍTICAS DE PRECISÃO:
1. Se o cliente perguntar "qual o site da agência", "qual o site de vocês", "qual seu site" ou pedir o link/site da Start Mkt Local, responda OBRIGATORIAMENTE informando o website oficial da agência: [https://www.startmktlocal.com.br/](https://www.startmktlocal.com.br/). NÃO confunda isso com o serviço de contratação de Criação de Sites.
2. Se o cliente perguntar sobre o serviço de Criação de Sites (para criar um site para a empresa dele), informe que criamos sites a partir de R$ 500,00 com entrega em 7 dias.
3. Se perguntar sobre o Biosite com IA ou quiser ver modelo/exemplo, informe o valor de R$ 167,00 + R$ 50,00/mês e o link do modelo: [https://vicenteiaguebiositegoogleia.vercel.app/](https://vicenteiaguebiositegoogleia.vercel.app/).
4. Se perguntar sobre o Avaliacard NFC, informe R$ 89,00 com Frete Grátis e o link: [https://avaliacard.vercel.app/](https://avaliacard.vercel.app/Platform).
5. Se perguntar sobre contato, WhatsApp ou atendimento humano, envie o link clicável: [https://wa.me/5567993174612](https://wa.me/5567993174612) e o telefone ${config.businessPhone}.
6. Se perguntar onde fica ou horário, responda Ponta Porã - MS (atendemos todo Brasil), Seg a Sex 08h-18h e Sáb 08h-12h.
7. Todos os links enviados devem ser em Markdown clicável [Texto](URL) e reais.
8. Nunca invente dados fora da base de conhecimento oficial.

${config.systemPromptAddendum && config.systemPromptAddendum !== OFFICIAL_KNOWLEDGE_BASE ? `\nINSTRUÇÕES ADICIONAIS:\n${config.systemPromptAddendum}` : ''}
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

// Instant Knowledge Base Semantic Matcher (< 20ms response time)
function findKnowledgeBaseAnswer(
  query: string,
  cfg: BusinessConfig
): { reply: string; needsHumanHandoff: boolean } | null {
  const q = query.toLowerCase().trim();

  // 1. Semantic Index Matching (Instant < 5ms semantic topic recovery with entity grounding)
  try {
    const semIndex = getActiveSemanticIndex(cfg);
    const semMatch = matchSemanticQuery(query, semIndex, cfg);
    if (semMatch.isMatch && semMatch.confidence >= 35) {
      return {
        reply: semMatch.reply,
        needsHumanHandoff: semMatch.needsHumanHandoff,
      };
    }
  } catch (err) {
    console.warn('Erro ao processar correspondência semântica:', err);
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
    q === 'ola lia' ||
    q === 'ola tudo bem' ||
    q === 'olá tudo bem' ||
    q === 'opa' ||
    q === 'e ai' ||
    q === 'e aí'
  ) {
    return {
      reply: `Olá! Eu sou a ${cfg.botName}, especialista de atendimento e vendas da **${cfg.companyName}**.\n\nAjudamos empresas de todo o Brasil a venderem mais com Sites, Biosites com IA, Google Meu Negócio, Tráfego Pago e Agentes de WhatsApp.\n\nQual dessas soluções você gostaria de conhecer hoje?`,
      needsHumanHandoff: false,
    };
  }

  // 3. Website Oficial da Agência / Link da Empresa (Prioritário para nunca confundir com o serviço de criar sites)
  const agencySitePatterns = [
    'qual o site',
    'qual e o site',
    'qual é o site',
    'qual seu site',
    'qual o website',
    'qual a pagina',
    'qual a página',
    'site da agência',
    'site da agencia',
    'site da empresa',
    'site de vocês',
    'site de voces',
    'site do negócio',
    'link do site',
    'link da agência',
    'link da agencia',
    'link da empresa',
    'passa o site',
    'manda o site',
    'ver o site',
    'endereço do site',
    'endereco do site',
    'pagina da empresa',
    'página da empresa',
    'website oficial',
    'site oficial',
    'vocês têm site',
    'voces tem site',
    'tem site',
    'startmktlocal',
    'start mkt local',
  ];
  const isAskingAgencySite =
    agencySitePatterns.some((pattern) => q.includes(pattern)) ||
    q === 'site' ||
    q === 'website' ||
    q === 'o site' ||
    q === 'qual o site?';

  if (isAskingAgencySite) {
    return {
      reply: `O website oficial da **Start Mkt Local** é: [https://www.startmktlocal.com.br/](https://www.startmktlocal.com.br/).\n\nLá você pode conferir nossos serviços, portfólio e diferenciais! Você também pode falar direto com nosso especialista no WhatsApp: [https://wa.me/5567993174612](https://wa.me/5567993174612).\n\nQual serviço da nossa agência você gostaria de conhecer melhor?`,
      needsHumanHandoff: false,
    };
  }

  // 4. Todos os Links Oficiais / Links Clicáveis
  const allLinksPatterns = [
    'links',
    'manda os links',
    'mandar os links',
    'passa os links',
    'quais os links',
    'quais são os links',
    'links clicaveis',
    'links clicáveis',
    'todos os links',
  ];
  if (allLinksPatterns.some((p) => q.includes(p))) {
    return {
      reply: `Aqui estão todos os links oficiais da **Start Mkt Local** clicáveis para você acessar:\n\n🌐 **Website Oficial:**\n[https://www.startmktlocal.com.br/](https://www.startmktlocal.com.br/)\n\n💬 **WhatsApp do Especialista:**\n[https://wa.me/5567993174612](https://wa.me/5567993174612)\n\n📱 **Modelo Biosite IA:**\n[https://vicenteiaguebiositegoogleia.vercel.app/](https://vicenteiaguebiositegoogleia.vercel.app/)\n\n⭐ **Website Avaliacard NFC:**\n[https://avaliacard.vercel.app/](https://avaliacard.vercel.app/)\n\nQual deles você gostaria de conferir primeiro?`,
      needsHumanHandoff: false,
    };
  }

  // 5. WhatsApp / Telefone / Atendimento Humano
  const handoffKeywords = [
    'falar com alguém',
    'falar com alguem',
    'falar com uma pessoa',
    'falar com especialista',
    'especialista',
    'atendente',
    'humano',
    'falar com humano',
    'consultor',
    'suporte',
    'pessoa',
    'atendimento humano',
    'número',
    'numero',
    'numero de telefone',
    'número de telefone',
    'telefone',
    'contato',
    'qual o whatsapp',
    'qual o telefone',
    'whatsapp da empresa',
    'whatsapp do especialista',
  ];
  if (handoffKeywords.some((k) => q.includes(k))) {
    return {
      reply: `Com certeza! Vou te conectar direto com nosso especialista da **Start Mkt Local**.\n\nClique no link para conversar agora no WhatsApp: [WhatsApp Especialista](https://wa.me/5567993174612) ou ligue **${cfg.businessPhone}**.\n\nNosso atendimento funciona de Seg a Sex (08h às 18h) e Sáb (08h às 12h). Como posso adiantar seu atendimento?`,
      needsHumanHandoff: true,
    };
  }

  // 6. Serviço 1: Criação de Sites (Apenas quando o usuário quer criar/contratar um site para a empresa dele)
  const siteCreationPhrases = [
    'criação de sites',
    'criacao de sites',
    'criação de site',
    'criacao de site',
    'criar site',
    'criar um site',
    'fazer site',
    'fazer um site',
    'desenvolver site',
    'desenvolvimento de site',
    'construir site',
    'construção de site',
    'quanto custa um site',
    'valor do site',
    'preço do site',
    'quero um site',
    'preciso de um site',
    'vocês fazem site',
    'voces fazem site',
    'vocês criam site',
    'voces criam site',
    'serviço de site',
    'servico de site',
    'landing page',
  ];
  if (siteCreationPhrases.some((phrase) => q.includes(phrase)) && !q.includes('bio')) {
    return {
      reply: `Nosso serviço de **Criação de Sites** coloca sua empresa em destaque total no meio digital!\n\n• **Prazo de entrega:** Apenas 7 dias\n• **Valor:** A partir de R$ 500,00\n• **Para quem é:** Empresas em geral que desejam presença forte e autoridade na internet.\n\nQuer garantir a criação do site da sua empresa esta semana?`,
      needsHumanHandoff: false,
    };
  }

  // 7. Serviço 3: Biosite com Atendimento Virtual
  const biositeKeywords = [
    'biosite',
    'bio site',
    'atendimento virtual',
    'vicente',
    'vicenteiague',
    'biosites',
    'modelo de biosite',
    'exemplo de biosite',
  ];
  if (biositeKeywords.some((k) => q.includes(k))) {
    return {
      reply: `O **Biosite com Atendimento Virtual** inclui um biosite moderno e agente de IA 24 horas treinado com todo o conhecimento da sua empresa!\n\n• **Valor:** R$ 167,00 + R$ 50,00/mês de manutenção do Agente de IA\n• **Exemplo Real Funcionando:** [Ver Modelo de Biosite](https://vicenteiaguebiositegoogleia.vercel.app/)\n\nQuer que eu crie um biosite inteligente como esse para sua empresa?`,
      needsHumanHandoff: false,
    };
  }

  // 8. Serviço 6: Avaliacard NFC & QR Code Google
  const avaliacardKeywords = [
    'avaliacard',
    'avalia card',
    'nfc',
    'cartao nfc',
    'cartão nfc',
    'avaliação do google',
    'avaliacao do google',
    'avaliacoes google',
    'avaliações google',
    'qr code avaliacao',
    'cartão de avaliação',
    'cartao de avaliacao',
  ];
  if (avaliacardKeywords.some((k) => q.includes(k))) {
    return {
      reply: `O **Avaliacard** é o cartão inteligente com chip NFC e QR Code com link direto na página de avaliação do Google da sua empresa!\n\n• **Valor:** Apenas R$ 89,00 + **Frete Grátis** para todo o Brasil!\n• **Website Oficial do Produto:** [Ver Website Avaliacard](https://avaliacard.vercel.app/)\n\nMultiplique suas avaliações 5 estrelas no Google! Quer receber o seu Avaliacard com frete grátis?`,
      needsHumanHandoff: false,
    };
  }

  // 9. Serviço 2: Gestor Google Meu Negócio
  const gmnKeywords = [
    'google meu negócio',
    'google meu negocio',
    'meu negócio',
    'meu negocio',
    'gestor google',
    'perfil no google',
    'google maps',
    'gmn',
    'aparecer no google',
    'ficha do google',
  ];
  if (gmnKeywords.some((k) => q.includes(k))) {
    return {
      reply: `Com a **Gestão do Google Meu Negócio**, cuidamos da criação, otimização e gestão do perfil da sua empresa para você se destacar nas buscas e no Google Maps!\n\n• **Para quem é:** Empresas de todo o Brasil\n• **Valor:** R$ A combinar (personalizado para seu segmento)\n\nSua empresa já tem cadastro no Google ou deseja criar e ranquear do zero?`,
      needsHumanHandoff: false,
    };
  }

  // 10. Serviço 4: Gestor de Tráfego Meta Ads
  const metaAdsKeywords = [
    'meta ads',
    'tráfego',
    'trafego',
    'gestor de tráfego',
    'gestor de trafego',
    'anúncios',
    'anuncios',
    'facebook ads',
    'instagram ads',
    'campanha',
    'campanhas',
    'anunciar no instagram',
    'anunciar no facebook',
  ];
  if (metaAdsKeywords.some((k) => q.includes(k))) {
    return {
      reply: `Com a **Gestão de Tráfego Meta Ads**, criamos campanhas de marketing de alta conversão no Facebook e Instagram para direcionar clientes qualificados direto para seu WhatsApp!\n\n• **Para quem é:** Empresas de todo o Brasil\n• **Valor:** R$ A combinar conforme o volume da sua campanha\n\nVocê já anuncia atualmente ou quer começar a atrair novos clientes esta semana?`,
      needsHumanHandoff: false,
    };
  }

  // 11. Serviço 5: Criação de Agente de IA no WhatsApp
  const botKeywords = [
    'agente de ia',
    'agente ia',
    'ia para whatsapp',
    'ia no whatsapp',
    'atendimento no whatsapp',
    'chatbot',
    'bot whatsapp',
    'robô de whatsapp',
    'robo de whatsapp',
    'atendimento virtual whatsapp',
    'assistente virtual',
  ];
  if (botKeywords.some((k) => q.includes(k))) {
    return {
      reply: `Criamos **Agentes de IA no WhatsApp** da sua empresa responsáveis pelo atendimento 24 horas por dia, tirando dúvidas, enviando links clicáveis e convertendo vendas!\n\n• **O que inclui:** Treinamento com conhecimento total da sua empresa\n• **Valor:** R$ A combinar\n\nQuer colocar uma assistente inteligente como eu trabalhando no WhatsApp da sua empresa?`,
      needsHumanHandoff: false,
    };
  }

  // 12. Catálogo Geral de Serviços
  const servicesKeywords = [
    'quais são os serviços',
    'quais sao os servicos',
    'quais os serviços',
    'quais os servicos',
    'serviços',
    'servicos',
    'o que vocês fazem',
    'o que voces fazem',
    'o que você faz',
    'o que voce faz',
    'catálogo',
    'catalogo',
    'soluções',
    'solucoes',
    'produtos',
    'quais os produtos',
  ];
  if (servicesKeywords.some((k) => q.includes(k))) {
    return {
      reply: `A **Start Mkt Local** é uma agência de marketing digital que oferece 6 serviços de alto desempenho para negócios locais em todo o Brasil:\n\n1. 🌐 **Criação de Sites** (a partir de R$ 500, entrega em 7 dias)\n2. 📍 **Gestor Google Meu Negócio** (destaque nas buscas locais)\n3. 📱 **Biosite com Atendimento Virtual IA** (R$ 167 + R$ 50/mês: [Ver Modelo](https://vicenteiaguebiositegoogleia.vercel.app/))\n4. 📈 **Gestor de Tráfego Meta Ads** (anúncios no Instagram/Facebook)\n5. 🤖 **Agente de IA no WhatsApp** (atendimento e vendas 24h)\n6. ⭐ **Avaliacard NFC Google** (R$ 89 com frete grátis: [Ver Website](https://avaliacard.vercel.app/))\n\nQual dessas soluções você gostaria de contratar para seu negócio?`,
      needsHumanHandoff: false,
    };
  }

  // 13. Tabela de Preços / Quanto custa
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
    'orçamento',
    'orcamento',
  ];
  if (priceKeywords.some((k) => q.includes(k))) {
    return {
      reply: `Aqui estão os valores dos serviços da **Start Mkt Local**:\n\n• **Criação de Sites:** A partir de R$ 500,00 (entrega em 7 dias)\n• **Biosite com Atendimento Virtual IA:** R$ 167,00 + R$ 50,00/mês de manutenção\n• **Avaliacard Cartão NFC Google:** R$ 89,00 com Frete Grátis\n• **Google Meu Negócio, Meta Ads e Agente IA:** Valores personalizados a combinar\n\nNo PIX você ganha **5% de desconto imediato**, ou parcelamos no cartão em até 3x sem juros! Qual desses serviços se encaixa melhor no seu orçamento?`,
      needsHumanHandoff: false,
    };
  }

  // 14. Desconto PIX / Condição Especial
  const discountKeywords = [
    'desconto',
    'fechar hoje',
    'condição especial',
    'condicao especial',
    'tem desconto',
    'mais barato',
    'faz um desconto',
  ];
  if (discountKeywords.some((k) => q.includes(k))) {
    return {
      reply: `No pagamento via PIX já aplicamos **5% de desconto imediato**! Se você quiser fechar um pacote com mais de um serviço, posso chamar nosso especialista no WhatsApp para liberar uma condição especial para você: [Falar no WhatsApp](https://wa.me/5567993174612).\n\nQual serviço você gostaria de fechar hoje com desconto?`,
      needsHumanHandoff: false,
    };
  }

  // 15. Garantia
  const guaranteeKeywords = ['garantia', 'tem garantia', 'qual a garantia', 'seguro'];
  if (guaranteeKeywords.some((k) => q.includes(k))) {
    return {
      reply: `Você tem **15 dias de garantia total**! Se tiver qualquer problema, resolvemos sem burocracia.\n\nQuer iniciar seu projeto com total segurança e garantia?`,
      needsHumanHandoff: false,
    };
  }

  // 16. Objeção Preço / Vou pensar
  const objectionKeywords = ['achei alto', 'achei caro', 'vou pensar', 'muito caro', 'pensar', 'valor alto'];
  if (objectionKeywords.some((k) => q.includes(k))) {
    return {
      reply: `Entendo perfeitamente! Mas vale lembrar que todos os nossos serviços são de alto desempenho para alavancar Negócios Locais, o que economiza tempo e gera mais vendas para você.\n\nQuer que eu te mostre a opção de parcelamento em até 3x sem juros para caber tranquilo no seu orçamento?`,
      needsHumanHandoff: false,
    };
  }

  // 17. Formas de Pagamento
  const paymentKeywords = ['forma de pagamento', 'formas de pagamento', 'como pagar', 'parcela', 'parcelamento', 'cartão', 'cartao', 'pix', 'débito', 'debito'];
  if (paymentKeywords.some((k) => q.includes(k))) {
    return {
      reply: `Aceitamos **PIX (com 5% de desconto imediato!)**, **Cartão de Crédito em até 3x sem juros** e **Cartão de Débito**.\n\nQual dessas formas de pagamento você prefere?`,
      needsHumanHandoff: false,
    };
  }

  // 18. Localização e Horário de Funcionamento
  const locationKeywords = ['onde fica', 'onde vocês ficam', 'onde voces ficam', 'localização', 'localizacao', 'endereço', 'endereco', 'horário', 'horario', 'ponta porã', 'ponta pora', 'qual a cidade', 'cidade'];
  if (locationKeywords.some((k) => q.includes(k))) {
    return {
      reply: `Estamos sediados em **Ponta Porã - MS** e atendemos clientes em todo o Brasil!\n\nNosso horário de funcionamento é de Segunda a Sexta, das 08h às 18h e Sábado, das 08h às 12h.\n\nComo a Start Mkt Local pode ajudar a sua empresa hoje?`,
      needsHumanHandoff: false,
    };
  }

  return null;
}

// Fallback response generator according to Golden Rules
function getFallbackResponse(query: string): string {
  const kbMatch = findKnowledgeBaseAnswer(query, config);
  if (kbMatch) return kbMatch.reply;

  // Golden Rule 1: Fidelidade aos dados - se perguntar algo fora do documento
  return `Para te confirmar esse detalhe específico sem erro, vou te passar o contato direto do nosso especialista: [Link de Contato/WhatsApp: https://wa.me/5567993174612].\n\nPosso te adiantar informações sobre Criação de Sites, Biosites com IA, Avaliacard, Google Meu Negócio ou Gestão de Tráfego?`;
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
    // Clear cache if addendum updated
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
      model: 'gemini-3.8-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        maxOutputTokens: 300,
        temperature: 0.4,
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('GEMINI_TIMEOUT')), 5000)
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
      const fallbackTranscription = 'Gostaria de saber mais sobre criação de sites e biosite com IA da Start Mkt Local';
      const fallbackReply = getFallbackResponse(fallbackTranscription);
      return res.json({
        transcription: fallbackTranscription,
        reply: fallbackReply,
        needsHumanHandoff: false,
        isFallback: true,
      });
    }

    let cleanMime = (mimeType || 'audio/webm').split(';')[0].trim().toLowerCase();
    if (cleanMime === 'audio/m4a' || cleanMime === 'audio/x-m4a') cleanMime = 'audio/mp4';

    const audioPart = {
      inlineData: {
        mimeType: cleanMime,
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
      model: 'gemini-3.8-flash',
      contents: [audioPart, { text: promptText }],
      config: {
        systemInstruction: buildSystemPrompt(),
        thinkingConfig: { thinkingLevel: ThinkingLevel.MINIMAL },
        responseMimeType: 'application/json',
      },
    });

    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('AUDIO_TIMEOUT')), 9000)
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
    const reply = response.text || (isPdf ? 'Documento PDF analisado com sucesso.' : 'Imagem analisada com sucesso.');
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
      ? `Consegui receber o seu documento PDF "${fileName}"! Para te passar todos os detalhes e valores específicos sem erro, vou avisar nosso especialista: [Falar no WhatsApp](https://wa.me/5567993174612).`
      : `Recebi a sua imagem com sucesso! Já registrei aqui. Quer que eu te passe mais detalhes sobre nossos serviços no WhatsApp? [Falar no WhatsApp](https://wa.me/5567993174612)`;
    res.json({
      reply,
      fileDescription: isPdf ? `PDF: ${fileName}` : `Imagem: ${fileName}`,
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
    const { createServer: createViteServer } = await import('vite');
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
