import { BusinessConfig, OFFICIAL_KNOWLEDGE_BASE } from '../services/api';

export interface SemanticEntity {
  key: string;
  value: string;
}

export interface SemanticTopic {
  id: string;
  category:
    | 'Identidade & Contato'
    | 'Catálogo & Preços'
    | 'FAQ & Objeções'
    | 'Links Oficiais'
    | 'Integrações Google'
    | 'Políticas & Guardrails'
    | 'Tópicos Personalizados';
  title: string;
  summary: string;
  keywords: string[];
  entities: Record<string, string>;
  directAnswer: string;
  suggestedQueries: string[];
  priority: number;
  needsHumanHandoff?: boolean;
}

export interface SemanticIndex {
  topics: SemanticTopic[];
  indexedAt: string;
  totalKeywords: number;
  categories: string[];
  hash: string;
}

export interface SemanticMatchResult {
  isMatch: boolean;
  confidence: number; // 0 to 100%
  topic: SemanticTopic | null;
  matchedKeywords: string[];
  matchedIntent: string;
  reply: string;
  needsHumanHandoff: boolean;
  executionTimeMs: number;
}

// Stop words in Portuguese that should not bias matching
const STOP_WORDS = new Set([
  'a', 'o', 'as', 'os', 'um', 'uma', 'uns', 'umas',
  'de', 'da', 'do', 'das', 'dos', 'em', 'na', 'no', 'nas', 'nos',
  'por', 'para', 'pra', 'pro', 'com', 'sem', 'sob', 'sobre', 'que', 'se',
  'e', 'ou', 'mas', 'como', 'me', 'te', 'lhe', 'nos', 'vos',
  'eu', 'voce', 'você', 'ele', 'ela', 'eles', 'elas',
  'muito', 'mais', 'menos', 'ja', 'já', 'favor', 'por favor',
]);

/**
 * Normalizes text for clean token extraction: lowers case, strips accents, removes punctuation.
 */
export function normalizeSemanticText(text: string): string {
  if (!text) return '';
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .replace(/[^a-z0-9\s]/g, ' ') // replace non-alphanumeric with space
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Tokenizes text into unique meaningful words.
 */
export function extractKeywords(text: string): string[] {
  const norm = normalizeSemanticText(text);
  const words = norm.split(' ');
  const valid = words.filter((w) => w.length >= 2 && !STOP_WORDS.has(w));
  return Array.from(new Set(valid));
}

/**
 * Builds the official baseline topics with humanized WhatsApp tone and pure URLs.
 */
function getBaselineTopics(cfg: BusinessConfig): SemanticTopic[] {
  const whatsappUrl = `https://wa.me/${cfg.businessPhone.replace(/\D/g, '') || '5567993174612'}`;
  const websiteUrl = cfg.website || 'https://www.startmktlocal.com.br/';

  return [
    {
      id: 'identidade_apresentacao',
      category: 'Identidade & Contato',
      title: 'Apresentação & Saudação da LIA',
      summary: 'Saudação humanizada da LIA e descoberta do nome e negócio do cliente.',
      keywords: [
        'oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'tudo bem',
        'quem e voce', 'quem e lia', 'start mkt', 'apresentacao', 'sobre a empresa',
      ],
      entities: {
        'Agente': cfg.botName,
        'Empresa': cfg.companyName,
        'Papel': cfg.botRole,
        'Localização': 'Ponta Porã (MS) - Atende todo o Brasil',
      },
      directAnswer: `Oi! Tudo bem? 😊 Eu sou a ${cfg.botName}, da ${cfg.companyName}.\nPosso te ajudar com site, Google Meu Negócio, anúncios e mais.\nQual é o seu nome e o que você tá buscando pro seu negócio?`,
      suggestedQueries: [
        'Oi, tudo bem?',
        'Quem é você?',
        'Você é um robô?',
      ],
      priority: 85,
    },
    {
      id: 'pergunta_robo',
      category: 'Identidade & Contato',
      title: 'Pergunta se é Robô / Assistente Virtual',
      summary: 'Transparência sobre ser a assistente virtual da Start Mkt Local e oferta de humano.',
      keywords: [
        'voce e um robo', 'voce e robo', 'e um robo', 'robo', 'inteligencia artificial',
        'atendente de verdade', 'pessoa de verdade', 'assistente virtual', 'bot',
      ],
      entities: {
        'Identidade': `Assistente virtual da ${cfg.companyName}`,
        'Especialista Humano': whatsappUrl,
      },
      directAnswer: `Sou sim! Eu sou a assistente virtual aqui da ${cfg.companyName}, treinada pra te ajudar rapidinho pelo WhatsApp. 😊\n\nMas se você preferir falar direto com nosso especialista humano, eu te passo pra ele agora mesmo. Quer continuar comigo ou prefere falar com ele?`,
      suggestedQueries: [
        'Você é um robô?',
        'Estou falando com uma IA?',
      ],
      priority: 94,
    },
    {
      id: 'website_agencia',
      category: 'Links Oficiais',
      title: 'Site Oficial da Start Mkt Local',
      summary: 'Link oficial puro da agência Start Mkt Local.',
      keywords: [
        'site oficial', 'website oficial', 'qual o site da agencia', 'qual seu site',
        'site da agencia', 'site da empresa', 'site de voces', 'link do site', 'startmktlocal',
      ],
      entities: {
        'Website': websiteUrl,
        'WhatsApp': whatsappUrl,
      },
      directAnswer: `Claro! O site oficial aqui da ${cfg.companyName} é esse aqui:\n${websiteUrl}\n\nMe conta, qual é o seu negócio e o que você quer melhorar hoje?`,
      suggestedQueries: [
        'Qual o site de vocês?',
        'Me passa o site da agência',
      ],
      priority: 95,
    },
    {
      id: 'atendimento_humano_whatsapp',
      category: 'Identidade & Contato',
      title: 'Atendimento Humano & WhatsApp Especialista',
      summary: 'Encaminhamento direto para o especialista humano no WhatsApp.',
      keywords: [
        'falar com alguem', 'falar com especialista', 'atendente', 'humano',
        'falar com humano', 'consultor', 'suporte', 'telefone', 'numero',
        'whatsapp', 'qual o whatsapp', 'contato', 'chamar no whats',
      ],
      entities: {
        'Telefone': cfg.businessPhone,
        'WhatsApp': whatsappUrl,
        'Horário': 'Segunda a sexta, 08h às 18h | Sábado, 08h às 12h',
      },
      directAnswer: `Beleza! Você pode chamar nosso especialista direto no WhatsApp por esse link:\n${whatsappUrl}\n\nNosso horário é de segunda a sexta das 08h às 18h e sábado das 08h às 12h. Qual é o seu nome pra eu já deixar avisado por aqui?`,
      suggestedQueries: [
        'Quero falar com especialista',
        'Me passa o WhatsApp de atendimento',
      ],
      priority: 92,
      needsHumanHandoff: true,
    },
    {
      id: 'servico_criacao_sites',
      category: 'Catálogo & Preços',
      title: 'Criação de Sites',
      summary: 'Criação de sites para empresas em geral, entrega em 7 dias, a partir de R$ 500,00.',
      keywords: [
        'criacao de sites', 'criar site', 'fazer site', 'desenvolver site', 'landing page',
        'quanto custa um site', 'quanto custa site', 'preco site', 'valor site', '500', 'prazo site',
      ],
      entities: {
        'Para quem': 'Empresas em geral',
        'Benefício': 'Destaque no meio digital',
        'Prazo': '7 dias',
        'Valor': 'A partir de R$ 500,00',
      },
      directAnswer: `Oi! Tudo bem? Aqui na ${cfg.companyName} os sites começam a partir de R$ 500,00 e ficam prontos em 7 dias.\n\nMe conta, qual é o seu negócio? Assim eu vejo o que faz mais sentido pra você.`,
      suggestedQueries: [
        'Oi, quanto custa um site?',
        'Qual o prazo para criar um site?',
      ],
      priority: 90,
    },
    {
      id: 'servico_gmn',
      category: 'Catálogo & Preços',
      title: 'Gestão de Google Meu Negócio',
      summary: 'Criação e gestão do perfil da empresa no Google para todo o Brasil.',
      keywords: [
        'google meu negocio', 'gmn', 'perfil do google', 'google maps', 'aparecer no google',
        'gestor de google', 'gerenciamento google', 'empresas no google', 'ficha do google',
      ],
      entities: {
        'Para quem': 'Empresas de todo o Brasil',
        'Inclui': 'Criação e gestão do perfil da empresa no Google',
        'Valor': 'A combinar',
      },
      directAnswer: `Show! Com a Gestão de Google Meu Negócio a gente cria e cuida do perfil da sua empresa pra você se destacar nas buscas do Google.\n\nComo o valor é a combinar de acordo com o tamanho do projeto, me conta: qual é o ramo do seu negócio?`,
      suggestedQueries: [
        'Como funciona o Google Meu Negócio?',
        'Quero aparecer no Google',
      ],
      priority: 88,
    },
    {
      id: 'servico_biosite_ia',
      category: 'Catálogo & Preços',
      title: 'Biosite com Atendimento Virtual',
      summary: 'Biosite com atendimento 24h por agente de IA treinado para a empresa.',
      keywords: [
        'biosite', 'biosite ia', 'biositesai', 'atendimento virtual', 'bio do instagram',
        'link da bio', '167', '50', 'modelo de biosite', 'superlimpo',
      ],
      entities: {
        'Valor': 'R$ 167,00 + R$ 50,00 por mês de manutenção do agente de IA',
        'Modelo': 'https://biositesaisuperlimpo.netlify.app/',
        'Inclui': 'Biosite com atendimento 24h por agente de IA treinado',
      },
      directAnswer: `Boa! O Biosite vem com um agente de IA que atende seus clientes 24h sabendo tudo da sua empresa. O valor é R$ 167,00 + R$ 50,00 por mês de manutenção.\n\nOlha só um modelo funcionando na prática: https://biositesaisuperlimpo.netlify.app/\n\nO que você achou dessa ideia pro seu negócio?`,
      suggestedQueries: [
        'Como funciona o Biosite com IA?',
        'Tem modelo de Biosite pra ver?',
      ],
      priority: 89,
    },
    {
      id: 'servico_meta_ads',
      category: 'Catálogo & Preços',
      title: 'Gestão de Tráfego (Meta Ads)',
      summary: 'Criação de campanhas de marketing no Meta Ads para empresas de todo o Brasil.',
      keywords: [
        'meta ads', 'trafego pago', 'gestao de trafego', 'anuncios', 'anunciar no instagram',
        'anunciar no facebook', 'campanhas', 'gestor de trafego',
      ],
      entities: {
        'Para quem': 'Empresas de todo o Brasil',
        'Inclui': 'Criação de campanhas de marketing no Meta Ads',
        'Valor': 'A combinar',
      },
      directAnswer: `Show! Na Gestão de Tráfego a gente cria campanhas no Meta Ads pra atrair clientes certos pro seu negócio.\n\nO valor é a combinar porque depende do tamanho do projeto. Quer que eu chame nosso especialista no WhatsApp pra montar uma proposta pra você?`,
      suggestedQueries: [
        'Como funciona o tráfego pago no Meta Ads?',
        'Vocês fazem anúncios?',
      ],
      priority: 87,
    },
    {
      id: 'servico_agente_ia_whatsapp',
      category: 'Catálogo & Preços',
      title: 'Agente de IA para WhatsApp',
      summary: 'Agente de IA no WhatsApp da empresa responsável pelo atendimento.',
      keywords: [
        'agente de ia', 'agente ia whatsapp', 'ia para whatsapp', 'ia no whatsapp',
        'atendimento no whatsapp', 'chatbot whatsapp',
      ],
      entities: {
        'Para quem': 'Empresas de todo o Brasil',
        'Inclui': 'Agente de IA no WhatsApp com conhecimento total do negócio',
        'Valor': 'A combinar',
      },
      directAnswer: `Boa escolha! A gente coloca um Agente de IA direto no WhatsApp da sua empresa, sabendo tudo do seu negócio pra atender seus clientes.\n\nComo o valor depende do tamanho do projeto, quer que eu te passe o contato do nosso especialista pra montar sua proposta?`,
      suggestedQueries: [
        'Como funciona o Agente de IA para WhatsApp?',
        'Quanto custa o Agente de IA no WhatsApp?',
      ],
      priority: 88,
    },
    {
      id: 'servico_avaliacard_nfc',
      category: 'Catálogo & Preços',
      title: 'AvaliaCard (Cartão e Placa de Avaliação do Google)',
      summary: 'AvaliaCard (Cartão de Avaliação do Google / Placa de Avaliação do Google) com NFC e QR Code por R$ 89,00 com frete grátis.',
      keywords: [
        'avaliacard', 'avalia card', 'cartao de avaliacao do google', 'placa de avaliacao do google',
        'cartao de avaliacao', 'placa de avaliacao', 'placa do google', 'plaquinha do google',
        'cartao nfc', 'placa nfc', 'avaliacao google', 'nfc', 'qr code google', '89', 'frete gratis',
      ],
      entities: {
        'Produto': 'AvaliaCard (Cartão de Avaliação do Google / Placa de Avaliação do Google)',
        'Inclui': 'Cartão/Placa NFC e QR Code com link direto para avaliação do Google',
        'Valor': 'R$ 89,00 com frete grátis',
        'Site': 'https://avaliacard.vercel.app/',
      },
      directAnswer: `Show! O AvaliaCard (nosso Cartão e Placa de Avaliação do Google) tem NFC e QR Code que levam seu cliente direto pra página de avaliação do Google da sua empresa. Ele custa R$ 89,00 com frete grátis pra todo o Brasil!\n\nVocê pode ver todos os detalhes aqui: https://avaliacard.vercel.app/\n\nQuer pedir o seu agora?`,
      suggestedQueries: [
        'Quanto custa o Cartão de Avaliação do Google?',
        'Tem Placa de Avaliação do Google?',
      ],
      priority: 91,
    },
    {
      id: 'faq_desconto_pagamento',
      category: 'FAQ & Objeções',
      title: 'Objeção: Desconto & PIX',
      summary: '5% de desconto no PIX na hora, cartão até 3x sem juros e condição especial para pacotes.',
      keywords: [
        'desconto', 'tem desconto', 'desconto no pix', 'pix', 'parcelar',
        'cartao de credito', 'parcelamento', 'formas de pagamento', 'como pagar', 'sem juros',
      ],
      entities: {
        'PIX': '5% de desconto na hora',
        'Cartão de Crédito': 'Até 3x sem juros',
        'Cartão de Débito': 'Aceito',
      },
      directAnswer: `No PIX já te dou 5% de desconto na hora! Se quiser fechar mais de um serviço, posso chamar nosso especialista no WhatsApp pra liberar uma condição especial. Quer que eu te passe o contato?`,
      suggestedQueries: [
        'Tem desconto no PIX?',
        'Quais são as formas de pagamento?',
      ],
      priority: 92,
    },
    {
      id: 'faq_garantia',
      category: 'FAQ & Objeções',
      title: 'Objeção: Garantia de 15 Dias',
      summary: '15 dias de garantia total sem burocracia.',
      keywords: [
        'garantia', 'tem garantia', 'qual a garantia', 'e seguro', 'se nao ficar bom',
      ],
      entities: {
        'Garantia': '15 dias de garantia total',
      },
      directAnswer: `Você tem 15 dias de garantia total. Se qualquer coisa não ficar como combinado, a gente resolve sem burocracia. Quer seguir com a gente?`,
      suggestedQueries: [
        'Qual é a garantia?',
        'Tem garantia se eu contratar?',
      ],
      priority: 90,
    },
    {
      id: 'faq_valor_alto',
      category: 'FAQ & Objeções',
      title: 'Objeção: Valor Alto / Vou Pensar',
      summary: 'Quebra de objeção sobre preço alto ou indecisão, oferecendo parcelamento em 3x sem juros.',
      keywords: [
        'achei caro', 'ta caro', 'vou pensar', 'valor alto', 'muito caro',
        'depois eu vejo', 'orcamento apertado',
      ],
      entities: {
        'Parcelamento': 'Até 3x sem juros no cartão',
        'Desconto': '5% no PIX',
      },
      directAnswer: `Entendo total! Só lembro que nossos serviços são feitos pra turbinar negócios locais e te ajudar a vender mais.\n\nPosso te mostrar o parcelamento em até 3x sem juros pra caber no seu orçamento?`,
      suggestedQueries: [
        'Achei caro, vou pensar.',
        'Dá pra parcelar?',
      ],
      priority: 93,
    },
    {
      id: 'guardrail_fora_escopo',
      category: 'Políticas & Guardrails',
      title: 'Fora do Escopo / Encaminhamento ao Especialista',
      summary: 'Regra inegociável para perguntas fora da base de conhecimento.',
      keywords: [
        'logomarca', 'logo', 'identidade visual', 'cartao de visita', 'panfleto',
        'hospedagem', 'dominio', 'tiktok', 'youtube', 'email marketing', 'prazo do meta ads',
      ],
      entities: {
        'Regra': 'Nunca inventar preços, prazos ou serviços fora do documento',
        'Contato': whatsappUrl,
      },
      directAnswer: `Para te confirmar esse detalhe específico sem erro, vou te passar o contato direto do nosso especialista: ${whatsappUrl}`,
      suggestedQueries: [
        'Vocês fazem logomarca?',
        'Qual o prazo do Meta Ads?',
      ],
      priority: 96,
      needsHumanHandoff: true,
    },
  ];
}

/**
 * Parses user-provided knowledge base text into structured semantic topics.
 */
export function buildSemanticIndex(rawText: string, config: BusinessConfig): SemanticIndex {
  const baseTopics = getBaselineTopics(config);
  const text = rawText || config.systemPromptAddendum || OFFICIAL_KNOWLEDGE_BASE;

  const topicsMap = new Map<string, SemanticTopic>();
  baseTopics.forEach((t) => topicsMap.set(t.id, t));

  if (text.trim()) {
    const sections = text.split(/(?=\n#+\s+)/g);

    sections.forEach((sec, idx) => {
      const trimmed = sec.trim();
      if (!trimmed) return;

      const headerMatch = trimmed.match(/^#+\s+(.+)$/m);
      const title = headerMatch ? headerMatch[1].replace(/^[0-9.]+\s*/, '').trim() : `Seção ${idx + 1}`;

      let category: SemanticTopic['category'] = 'Tópicos Personalizados';
      const lowTitle = title.toLowerCase();
      if (lowTitle.includes('identidade') || lowTitle.includes('contato') || lowTitle.includes('dados') || lowTitle.includes('robô') || lowTitle.includes('robo')) {
        category = 'Identidade & Contato';
      } else if (lowTitle.includes('produto') || lowTitle.includes('serviço') || lowTitle.includes('catalogo') || lowTitle.includes('preço')) {
        category = 'Catálogo & Preços';
      } else if (lowTitle.includes('faq') || lowTitle.includes('duvidas') || lowTitle.includes('objeç')) {
        category = 'FAQ & Objeções';
      } else if (lowTitle.includes('link') || lowTitle.includes('site') || lowTitle.includes('redes')) {
        category = 'Links Oficiais';
      } else if (lowTitle.includes('google') || lowTitle.includes('agenda') || lowTitle.includes('planilha')) {
        category = 'Integrações Google';
      } else if (lowTitle.includes('regra') || lowTitle.includes('guardrail') || lowTitle.includes('fala') || lowTitle.includes('fluxo')) {
        category = 'Políticas & Guardrails';
      }

      const entities: Record<string, string> = {};
      const entityRegex = /[-*]?\s*(?:\*\*)?([A-Za-zÀ-ÿ0-9\s/]+?)(?:\*\*)?:\s*([^\n\r]+)/g;
      let eMatch;
      while ((eMatch = entityRegex.exec(trimmed)) !== null) {
        const k = eMatch[1].trim();
        const v = eMatch[2].trim();
        if (k.length > 1 && v.length > 0 && !k.toLowerCase().startsWith('http')) {
          entities[k] = v;
        }
      }

      const textKeywords = extractKeywords(`${title} ${trimmed}`);
      const slugId = `custom_sec_${idx}_${normalizeSemanticText(title).replace(/\s+/g, '_').slice(0, 24)}`;

      const existing = Array.from(topicsMap.values()).find(
        (t) => normalizeSemanticText(t.title) === normalizeSemanticText(title)
      );

      if (existing) {
        existing.keywords = Array.from(new Set([...existing.keywords, ...textKeywords]));
        existing.entities = { ...existing.entities, ...entities };
      } else if (trimmed.length > 40) {
        const lines = trimmed
          .split('\n')
          .filter((l) => !l.startsWith('#') && l.trim().length > 0)
          .slice(0, 4)
          .join('\n');

        topicsMap.set(slugId, {
          id: slugId,
          category,
          title,
          summary: lines.slice(0, 120) + (lines.length > 120 ? '...' : ''),
          keywords: textKeywords,
          entities,
          directAnswer: `${lines}\n\nComo posso te ajudar com isso no seu negócio?`,
          suggestedQueries: [`Sobre ${title}`],
          priority: 70,
        });
      }
    });
  }

  const topicsList = Array.from(topicsMap.values()).sort((a, b) => b.priority - a.priority);
  const totalKeywords = topicsList.reduce((acc, t) => acc + t.keywords.length, 0);
  const categories = Array.from(new Set(topicsList.map((t) => t.category)));

  let hashVal = 0;
  for (let i = 0; i < text.length; i++) {
    hashVal = (hashVal << 5) - hashVal + text.charCodeAt(i);
    hashVal |= 0;
  }

  return {
    topics: topicsList,
    indexedAt: new Date().toLocaleTimeString('pt-BR'),
    totalKeywords,
    categories,
    hash: `idx_${Math.abs(hashVal).toString(36)}`,
  };
}

/**
 * High-performance semantic matcher (<5ms).
 */
export function matchSemanticQuery(
  rawQuery: string,
  index: SemanticIndex,
  config?: Partial<BusinessConfig>
): SemanticMatchResult {
  const startTime = performance.now();
  const query = rawQuery.trim();
  const normQuery = normalizeSemanticText(query);
  const queryTokens = extractKeywords(query);

  if (!query || queryTokens.length === 0) {
    return {
      isMatch: false,
      confidence: 0,
      topic: null,
      matchedKeywords: [],
      matchedIntent: 'Nenhuma entrada detectada',
      reply: 'Oi! Tudo bem? Qual é o seu nome e o que você tá buscando pro seu negócio?',
      needsHumanHandoff: false,
      executionTimeMs: Math.round(performance.now() - startTime),
    };
  }

  let bestTopic: SemanticTopic | null = null;
  let bestScore = 0;
  let bestMatchedKeywords: string[] = [];

  for (const topic of index.topics) {
    let score = 0;
    const currentMatchedKw: string[] = [];

    for (const kw of topic.keywords) {
      const normKw = normalizeSemanticText(kw);
      if (normQuery === normKw) {
        score += 80;
        currentMatchedKw.push(kw);
      } else if (normQuery.includes(normKw) && normKw.length >= 3) {
        score += 45;
        currentMatchedKw.push(kw);
      }
    }

    let tokenOverlapCount = 0;
    const topicNormKeywords = topic.keywords.map(normalizeSemanticText);

    for (const qToken of queryTokens) {
      if (topicNormKeywords.some((k) => k.includes(qToken) || qToken.includes(k))) {
        tokenOverlapCount++;
        currentMatchedKw.push(qToken);
      }
    }

    if (queryTokens.length > 0) {
      const overlapRatio = tokenOverlapCount / queryTokens.length;
      score += overlapRatio * 40;
    }

    for (const [key, val] of Object.entries(topic.entities)) {
      const normK = normalizeSemanticText(key);
      const normV = normalizeSemanticText(val);
      if (normQuery.includes(normK) || normQuery.includes(normV)) {
        score += 20;
        currentMatchedKw.push(key);
      }
    }

    const normTitle = normalizeSemanticText(topic.title);
    if (normQuery.includes(normTitle)) {
      score += 35;
    }

    score += (topic.priority || 50) * 0.1;

    if (score > bestScore) {
      bestScore = score;
      bestTopic = topic;
      bestMatchedKeywords = Array.from(new Set(currentMatchedKw));
    }
  }

  const duration = Math.round((performance.now() - startTime) * 100) / 100;
  const confidence = Math.min(100, Math.round((bestScore / 110) * 100));

  if (bestTopic && confidence >= 35) {
    return {
      isMatch: true,
      confidence,
      topic: bestTopic,
      matchedKeywords: bestMatchedKeywords,
      matchedIntent: bestTopic.title,
      reply: bestTopic.directAnswer,
      needsHumanHandoff: Boolean(bestTopic.needsHumanHandoff),
      executionTimeMs: duration,
    };
  }

  const defaultWhatsApp = config?.businessPhone
    ? `https://wa.me/${config.businessPhone.replace(/\D/g, '')}`
    : 'https://wa.me/5567993174612';

  return {
    isMatch: false,
    confidence: confidence,
    topic: bestTopic,
    matchedKeywords: bestMatchedKeywords,
    matchedIntent: 'Fora do Escopo / Encaminhamento ao Especialista',
    reply: `Para te confirmar esse detalhe específico sem erro, vou te passar o contato direto do nosso especialista: ${defaultWhatsApp}`,
    needsHumanHandoff: true,
    executionTimeMs: duration,
  };
}
