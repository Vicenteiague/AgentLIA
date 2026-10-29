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
  'por', 'para', 'com', 'sem', 'sob', 'sobre', 'que', 'se',
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
 * Builds the official baseline topics with full semantics, rich entities, and precise responses.
 */
function getBaselineTopics(cfg: BusinessConfig): SemanticTopic[] {
  const whatsappUrl = `https://wa.me/${cfg.businessPhone.replace(/\D/g, '') || '5567993174612'}`;
  const websiteUrl = cfg.website || 'https://www.startmktlocal.com.br/';

  return [
    {
      id: 'identidade_apresentacao',
      category: 'Identidade & Contato',
      title: 'Apresentação & Saudação da LIA',
      summary: 'Saudação oficial, apresentação da LIA e propósito da Start Mkt Local.',
      keywords: [
        'oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'tudo bem',
        'quem e voce', 'quem e lia', 'start mkt', 'o que voces fazem',
        'apresentacao', 'sobre a empresa', 'agencia de marketing', 'ponta pora',
      ],
      entities: {
        'Agente': cfg.botName,
        'Empresa': cfg.companyName,
        'Papel': cfg.botRole,
        'Localização': 'Ponta Porã - MS (atendemos todo o Brasil)',
      },
      directAnswer: `Olá! Eu sou a **${cfg.botName}**, especialista de atendimento e vendas da **${cfg.companyName}**.\n\nAjudamos empresas de todo o Brasil a venderem mais com Sites, Biosites com IA, Google Meu Negócio, Tráfego Pago e Agentes de WhatsApp.\n\nQual dessas soluções você gostaria de conhecer hoje?`,
      suggestedQueries: [
        'Olá, tudo bem?',
        'Quem é você?',
        'O que a Start Mkt Local faz?',
      ],
      priority: 85,
    },
    {
      id: 'website_agencia',
      category: 'Links Oficiais',
      title: 'Website Oficial da Empresa',
      summary: 'Link oficial do site da Start Mkt Local para apresentação institucional.',
      keywords: [
        'site oficial', 'website oficial', 'qual o site', 'qual seu site', 'qual a pagina',
        'site da agencia', 'site da empresa', 'site de voces', 'link do site', 'link da empresa',
        'passa o site', 'manda o site', 'ver o site', 'endereco do site', 'startmktlocal',
      ],
      entities: {
        'Website': websiteUrl,
        'Empresa': cfg.companyName,
      },
      directAnswer: `O website oficial da **${cfg.companyName}** é: [${websiteUrl}](${websiteUrl}).\n\nLá você pode conferir nossos serviços, portfólio e diferenciais! Você também pode falar direto com nosso especialista no WhatsApp: [${whatsappUrl}](${whatsappUrl}).\n\nQual serviço da nossa agência você gostaria de conhecer melhor?`,
      suggestedQueries: [
        'Qual o site de vocês?',
        'Manda o link da agência',
        'Onde vejo o site oficial?',
      ],
      priority: 95,
    },
    {
      id: 'todos_os_links',
      category: 'Links Oficiais',
      title: 'Todos os Links Clicáveis Oficiais',
      summary: 'Todos os links clicáveis (Site, WhatsApp, Biosite IA, AvaliaCard).',
      keywords: [
        'links', 'todos os links', 'links clicaveis', 'manda os links', 'passa os links',
        'quais os links', 'canais oficiais', 'redes',
      ],
      entities: {
        'Website': websiteUrl,
        'WhatsApp': whatsappUrl,
        'Biosite': 'https://vicenteiaguebiositegoogleia.vercel.app/',
        'AvaliaCard': 'https://avaliacard.vercel.app/',
      },
      directAnswer: `Aqui estão todos os links oficiais da **${cfg.companyName}** clicáveis:\n\n🌐 **Website Oficial:**\n[${websiteUrl}](${websiteUrl})\n\n💬 **WhatsApp do Especialista:**\n[${whatsappUrl}](${whatsappUrl})\n\n📱 **Modelo Biosite IA:**\n[https://vicenteiaguebiositegoogleia.vercel.app/](https://vicenteiaguebiositegoogleia.vercel.app/)\n\n⭐ **Website Avaliacard NFC:**\n[https://avaliacard.vercel.app/](https://avaliacard.vercel.app/)\n\nQual deles você gostaria de conferir primeiro?`,
      suggestedQueries: [
        'Quais são os links oficiais?',
        'Me passa os links clicáveis',
      ],
      priority: 90,
    },
    {
      id: 'atendimento_humano_whatsapp',
      category: 'Identidade & Contato',
      title: 'Atendimento Humano & WhatsApp Especialista',
      summary: 'Handoff direto para falar com atendente ou consultor humano no WhatsApp.',
      keywords: [
        'falar com alguem', 'falar com especialista', 'atendente', 'humano',
        'falar com humano', 'consultor', 'suporte', 'telefone', 'numero',
        'whatsapp', 'qual o whatsapp', 'contato', 'chamar no whats',
      ],
      entities: {
        'Telefone': cfg.businessPhone,
        'WhatsApp': whatsappUrl,
        'Horário': 'Seg a Sex: 08h às 18h | Sáb: 08h às 12h',
      },
      directAnswer: `Com certeza! Vou te conectar direto com nosso especialista da **${cfg.companyName}**.\n\nClique no link para conversar agora no WhatsApp: [WhatsApp Especialista](${whatsappUrl}) ou ligue **${cfg.businessPhone}**.\n\nNosso atendimento funciona de Seg a Sex (08h às 18h) e Sáb (08h às 12h). Como posso adiantar seu atendimento?`,
      suggestedQueries: [
        'Quero falar com uma pessoa',
        'Qual o WhatsApp do especialista?',
        'Tem telefone para suporte?',
      ],
      priority: 92,
      needsHumanHandoff: true,
    },
    {
      id: 'servico_criacao_sites',
      category: 'Catálogo & Preços',
      title: 'Criação de Sites Profissionais',
      summary: 'Desenvolvimento de sites rápidos, modernos e otimizados para conversão.',
      keywords: [
        'criacao de sites', 'criar site', 'fazer site', 'desenvolver site', 'landing page',
        'site institucional', 'site profissional', 'site para minha empresa',
        'quanto custa site', 'preco site', 'valor site', '500',
      ],
      entities: {
        'Valor': 'A partir de R$ 500,00',
        'Prazo': '7 dias',
        'Indicação': 'Empresas em geral que buscam presença digital forte',
        'Benefício': 'Destaque no meio digital e alta conversão',
      },
      directAnswer: `Nosso serviço de **Criação de Sites** oferece:\n\n✨ **O que inclui:** Site moderno, ultra-rápido, responsivo (perfeito no celular) e pronto para destacar sua empresa no meio digital.\n⏱️ **Prazo de entrega:** 7 dias.\n💰 **Valor:** A partir de **R$ 500,00**.\n\nVocê já tem alguma ideia ou logotipo em mente para o site da sua empresa?`,
      suggestedQueries: [
        'Quanto custa para criar um site?',
        'Qual o prazo para fazer um site?',
        'O que inclui a criação de sites?',
      ],
      priority: 88,
    },
    {
      id: 'servico_gmn',
      category: 'Catálogo & Preços',
      title: 'Gestor Google Meu Negócio',
      summary: 'Criação, otimização e gestão estratégica de perfis de empresas no Google.',
      keywords: [
        'google meu negocio', 'gmn', 'perfil do google', 'google maps', 'aparecer no google',
        'otimizacao google', 'gestor de google', 'gerenciamento google', 'empresas no google',
      ],
      entities: {
        'Valor': 'A combinar (conforme tamanho do negócio)',
        'Indicação': 'Empresas de todo o Brasil que recebem clientes locais',
        'O que inclui': 'Criação, verificação, otimização SEO local e gestão de avaliações',
      },
      directAnswer: `Com a **Gestão do Google Meu Negócio**, colocamos sua empresa no topo das pesquisas locais e do Google Maps quando clientes da sua região procurarem pelos seus serviços!\n\n📍 **O que inclui:** Criação, otimização de categorias, fotos, postagens e gestão contínua do perfil no Google.\n💰 **Valor:** R$ A combinar (condições especiais para pacotes).\n\nSua empresa já possui perfil no Google Maps ou começaremos do zero?`,
      suggestedQueries: [
        'Como funciona o Google Meu Negócio?',
        'Quanto custa gerenciar o Google Meu Negócio?',
        'Vocês colocam minha empresa no Google Maps?',
      ],
      priority: 87,
    },
    {
      id: 'servico_biosite_ia',
      category: 'Catálogo & Preços',
      title: 'Biosite com Atendimento Virtual de IA',
      summary: 'Biosite interativo com agente de IA treinado atendendo 24 horas.',
      keywords: [
        'biosite', 'biosite ia', 'atendimento virtual', 'vicente iague', 'bio do instagram',
        'link da bio', 'linktree', 'biosite com inteligencia artificial', '167', '50',
      ],
      entities: {
        'Valor': 'R$ 167,00 + R$ 50,00/mês de manutenção da IA',
        'Modelo Exemplo': 'https://vicenteiaguebiositegoogleia.vercel.app/',
        'Indicação': 'Empresas de todo o Brasil',
        'Diferencial': 'Atendimento 24 horas tirando dúvidas e capturando leads',
      },
      directAnswer: `O **Biosite com Atendimento Virtual de IA** é ideal para o link da bio do Instagram e WhatsApp:\n\n🤖 **O que inclui:** Criação do Biosite moderno + agente de IA integrado atendendo seus clientes 24 horas por dia, tirando dúvidas instantaneamente!\n🔗 **Modelo de Demonstração:** [https://vicenteiaguebiositegoogleia.vercel.app/](https://vicenteiaguebiositegoogleia.vercel.app/)\n💰 **Valor:** R$ 167,00 + R$ 50,00/mês de manutenção da IA.\n\nQuer ver como ficaria com os dados da sua empresa?`,
      suggestedQueries: [
        'Quanto custa o Biosite com IA?',
        'Tem exemplo de Biosite funcionando?',
        'O que é o Biosite com atendimento virtual?',
      ],
      priority: 89,
    },
    {
      id: 'servico_meta_ads',
      category: 'Catálogo & Preços',
      title: 'Gestor de Tráfego Meta Ads (Instagram & Facebook)',
      summary: 'Campanhas de anúncios estratégicos no Facebook e Instagram para atrair clientes.',
      keywords: [
        'meta ads', 'trafego pago', 'anuncios', 'anunciar no instagram', 'anunciar no facebook',
        'campanhas', 'gestor de trafego', 'impulsionar', 'gerar leads', 'vender no instagram',
      ],
      entities: {
        'Valor': 'A combinar (planos personalizados)',
        'Indicação': 'Empresas de todo o Brasil',
        'O que inclui': 'Planejamento de criativos, segmentação de público qualificado e otimização de ROI',
      },
      directAnswer: `Com nosso serviço de **Gestor de Tráfego Meta Ads**, nós criamos e gerenciamos campanhas de alta performance no Facebook e Instagram para levar clientes prontos para comprar diretamente ao seu WhatsApp!\n\n🎯 **O que inclui:** Segmentação de público local, criação de campanhas e otimização diária de resultados.\n💰 **Valor:** R$ A combinar.\n\nQual é o principal serviço ou produto que você quer divulgar agora?`,
      suggestedQueries: [
        'Vocês fazem anúncios no Instagram?',
        'Como funciona a gestão de tráfego pago?',
        'Quanto custa o Meta Ads?',
      ],
      priority: 86,
    },
    {
      id: 'servico_agente_ia_whatsapp',
      category: 'Catálogo & Preços',
      title: 'Criação de Agente de IA para WhatsApp',
      summary: 'Automação inteligente no WhatsApp com respostas humanizadas e agendamento.',
      keywords: [
        'agente ia whatsapp', 'bot whatsapp', 'inteligencia artificial whatsapp',
        'robo de whatsapp', 'atendimento automatico', 'ia para whatsapp',
        'agente virtual', 'automacao de mensagens', 'chatbot whatsapp',
      ],
      entities: {
        'Valor': 'R$ A combinar',
        'Indicação': 'Empresas de todo o Brasil que recebem muitas mensagens',
        'O que inclui': 'Agente treinado com conhecimento total do negócio, áudio e integração',
      },
      directAnswer: `Criamos **Agentes de IA Personalizados para Atendimento no WhatsApp** da sua empresa!\n\n🚀 **Diferencial:** Não é um robô travado de botões! A IA responde como uma atendente humana experiente, conhece todo o catálogo, esclarece dúvidas e encaminha para fechamento.\n💰 **Valor:** R$ A combinar.\n\nQuantas mensagens você costuma receber por dia no seu WhatsApp?`,
      suggestedQueries: [
        'Vocês criam inteligência artificial para WhatsApp?',
        'Como funciona o bot de IA para empresas?',
        'O agente de IA consegue responder áudio e dúvidas?',
      ],
      priority: 89,
    },
    {
      id: 'servico_avaliacard_nfc',
      category: 'Catálogo & Preços',
      title: 'AvaliaCard NFC & QR Code Google 5 Estrelas',
      summary: 'Cartão físico com tecnologia NFC e QR Code para avaliações rápidas no balcão.',
      keywords: [
        'avaliacard', 'cartao nfc', 'avaliacao google', 'avaliar no balcao', 'nfc',
        'qr code google', 'cartao de aproximacao', '5 estrelas google', '89', 'frete gratis',
      ],
      entities: {
        'Valor': 'R$ 89,00 + Frete Grátis',
        'Website Oficial': 'https://avaliacard.vercel.app/',
        'Indicação': 'Comércios, clínicas, restaurantes e balcões em geral',
        'Como funciona': 'O cliente aproxima o celular no cartão NFC e a página de 5 estrelas abre na hora',
      },
      directAnswer: `O **AvaliaCard NFC** é o jeito mais rápido de multiplicar suas avaliações 5 estrelas no Google!\n\n⭐ **Como funciona:** O cliente aproxima o celular do cartão físico no seu balcão e a tela de avaliação do Google abre na mesma hora.\n🚚 **Valor:** Apenas **R$ 89,00 com Frete Grátis** para todo o Brasil!\n🌐 **Saiba mais e peça o seu:** [https://avaliacard.vercel.app/](https://avaliacard.vercel.app/)\n\nQuer que eu reserve um AvaliaCard com a marca da sua empresa?`,
      suggestedQueries: [
        'O que é o AvaliaCard?',
        'Quanto custa o cartão NFC?',
        'O frete do AvaliaCard é grátis?',
      ],
      priority: 91,
    },
    {
      id: 'faq_desconto_pagamento',
      category: 'FAQ & Objeções',
      title: 'Desconto & Formas de Pagamento',
      summary: '5% de desconto no PIX e parcelamento no cartão em até 3x sem juros.',
      keywords: [
        'desconto', 'pix', 'parcelar', 'cartao de credito', 'parcelamento',
        'formas de pagamento', 'como pagar', 'sem juros', 'desconto se fechar hoje',
      ],
      entities: {
        'Desconto PIX': '5% de desconto imediato',
        'Cartão': 'Até 3x sem juros',
        'Débito': 'Aceito',
      },
      directAnswer: `No pagamento via **PIX já aplicamos 5% de desconto imediato**! 💰\n\nTambém parcelamos no cartão de crédito em até **3x sem juros** ou aceitamos débito. Se você quiser fechar um pacote com mais de um serviço, posso chamar nosso especialista no WhatsApp para liberar uma condição exclusiva!\n\nQual forma de pagamento é mais confortável para você?`,
      suggestedQueries: [
        'Vocês dão desconto no PIX?',
        'Quais as formas de pagamento?',
        'Dá para parcelar no cartão?',
      ],
      priority: 85,
    },
    {
      id: 'faq_garantia',
      category: 'FAQ & Objeções',
      title: 'Garantia de 15 Dias',
      summary: 'Garantia total de 15 dias sem burocracia para tranquilidade do cliente.',
      keywords: [
        'garantia', 'e seguro', 'se eu nao gostar', 'prazo de garantia',
        'politica de garantia', 'reembolso', 'confiavel',
      ],
      entities: {
        'Prazo de Garantia': '15 dias de garantia total',
        'Política': 'Resolução rápida sem burocracia',
      },
      directAnswer: `Você conta com **15 dias de garantia total**! Se tiver qualquer dúvida ou ajuste necessário, resolvemos de imediato sem nenhuma burocracia para garantir 100% da sua satisfação.\n\nPodemos dar o primeiro passo no seu projeto hoje?`,
      suggestedQueries: [
        'Como funciona a garantia?',
        'Tenho garantia se contratar?',
      ],
      priority: 84,
    },
    {
      id: 'faq_valor_alto',
      category: 'FAQ & Objeções',
      title: 'Objeção: Achei Caro / Vou Pensar',
      summary: 'Enfatiza retorno sobre investimento, economia de tempo e opção de parcelamento.',
      keywords: [
        'achei caro', 'ta caro', 'vou pensar', 'valor alto', 'muito caro',
        'depois eu vejo', 'orcamento apertado',
      ],
      entities: {
        'Argumento': 'Soluções de alto rendimento que geram retorno financeiro rápido',
        'Flexibilidade': 'Parcelamento em até 3x sem juros',
      },
      directAnswer: `Entendo perfeitamente! Mas vale lembrar que todas as nossas ferramentas foram pensadas para trazer clientes pagantes e economizar horas do seu dia, se pagando logo no primeiro mês.\n\nQuer que eu simule as opções de parcelamento sem juros para caber com folga no seu orçamento?`,
      suggestedQueries: [
        'Achei o valor alto',
        'Vou pensar e te aviso',
      ],
      priority: 83,
    },
    {
      id: 'integracoes_google',
      category: 'Integrações Google',
      title: 'Integrações Google (Agenda & Sheets)',
      summary: 'Agendamento sincronizado no Google Calendar e registro automático de leads no Google Sheets.',
      keywords: [
        'google agenda', 'calendar', 'agendamento', 'agendar reuniao', 'planilha',
        'google sheets', 'sincronizar leads', 'drive', 'integracao google',
      ],
      entities: {
        'Google Agenda': 'Agendamento direto de apresentações e reuniões',
        'Google Sheets': 'Gravação automática de contatos e leads',
        'Acesso': 'Disponível na aba Google Workspace do aplicativo',
      },
      directAnswer: `Sim! Temos integração completa com as ferramentas do Google Workspace:\n\n📅 **Google Agenda:** Agendamos reuniões e apresentações diretamente na sua Google Agenda.\n📊 **Google Sheets:** Todos os novos leads e contatos são salvos automaticamente em planilhas compartilhadas no Google Drive.\n\nVocê gostaria de agendar uma demonstração rápida com nosso especialista para esta semana?`,
      suggestedQueries: [
        'Vocês integram com Google Agenda?',
        'Os contatos vão para o Google Sheets?',
        'Como funciona o agendamento de reuniões?',
      ],
      priority: 85,
    },
  ];
}

/**
 * Parses user-provided knowledge base text (Markdown or plain text) into structured semantic topics.
 */
export function buildSemanticIndex(rawText: string, config: BusinessConfig): SemanticIndex {
  const baseTopics = getBaselineTopics(config);
  const text = rawText || config.systemPromptAddendum || OFFICIAL_KNOWLEDGE_BASE;

  const topicsMap = new Map<string, SemanticTopic>();
  baseTopics.forEach((t) => topicsMap.set(t.id, t));

  // If text has custom content or differs from standard, parse dynamically
  if (text.trim()) {
    const sections = text.split(/(?=\n#+\s+)/g);

    sections.forEach((sec, idx) => {
      const trimmed = sec.trim();
      if (!trimmed) return;

      const headerMatch = trimmed.match(/^#+\s+(.+)$/m);
      const title = headerMatch ? headerMatch[1].replace(/^[0-9.]+\s*/, '').trim() : `Seção ${idx + 1}`;
      
      // Determine category
      let category: SemanticTopic['category'] = 'Tópicos Personalizados';
      const lowTitle = title.toLowerCase();
      if (lowTitle.includes('identidade') || lowTitle.includes('contato') || lowTitle.includes('quem somos')) {
        category = 'Identidade & Contato';
      } else if (lowTitle.includes('produto') || lowTitle.includes('serviço') || lowTitle.includes('catalogo') || lowTitle.includes('preço')) {
        category = 'Catálogo & Preços';
      } else if (lowTitle.includes('faq') || lowTitle.includes('duvidas') || lowTitle.includes('objeç')) {
        category = 'FAQ & Objeções';
      } else if (lowTitle.includes('link') || lowTitle.includes('site') || lowTitle.includes('redes')) {
        category = 'Links Oficiais';
      } else if (lowTitle.includes('google') || lowTitle.includes('agenda') || lowTitle.includes('planilha')) {
        category = 'Integrações Google';
      } else if (lowTitle.includes('regra') || lowTitle.includes('guardrail') || lowTitle.includes('diretriz')) {
        category = 'Políticas & Guardrails';
      }

      // Extract key-value entities like "- **Preço:** R$ 100" or "Valor: R$ 50"
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

      // Extract keywords
      const textKeywords = extractKeywords(`${title} ${trimmed}`);

      // Build custom topic if significant content
      const slugId = `custom_sec_${idx}_${normalizeSemanticText(title).replace(/\s+/g, '_').slice(0, 24)}`;
      
      // Check if it should enrich or complement existing baseline
      const existing = Array.from(topicsMap.values()).find(
        (t) => normalizeSemanticText(t.title) === normalizeSemanticText(title)
      );

      if (existing) {
        existing.keywords = Array.from(new Set([...existing.keywords, ...textKeywords]));
        existing.entities = { ...existing.entities, ...entities };
      } else if (trimmed.length > 40) {
        // Create concise direct answer from the section
        const lines = trimmed
          .split('\n')
          .filter((l) => !l.startsWith('#') && l.trim().length > 0)
          .slice(0, 5)
          .join('\n');

        topicsMap.set(slugId, {
          id: slugId,
          category,
          title,
          summary: lines.slice(0, 120) + (lines.length > 120 ? '...' : ''),
          keywords: textKeywords,
          entities,
          directAnswer: `Olá! Sobre **${title}**:\n\n${lines}\n\nPosso te ajudar com mais algum detalhe sobre isso?`,
          suggestedQueries: [`Sobre ${title}`, `Informações de ${title}`],
          priority: 70,
        });
      }
    });
  }

  const topicsList = Array.from(topicsMap.values()).sort((a, b) => b.priority - a.priority);
  const totalKeywords = topicsList.reduce((acc, t) => acc + t.keywords.length, 0);
  const categories = Array.from(new Set(topicsList.map((t) => t.category)));

  // Generate a simple hash to track modifications
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
 * High-performance semantic matcher (<5ms). Computes token overlap, exact phrase match,
 * intent priority, and returns the highest-scoring candidate.
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
      reply: 'Como posso te ajudar hoje?',
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

    // 1. Exact phrase match in keywords (Massive Boost)
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

    // 2. Token overlap against topic keywords
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

    // 3. Entity key-value matching
    for (const [key, val] of Object.entries(topic.entities)) {
      const normK = normalizeSemanticText(key);
      const normV = normalizeSemanticText(val);
      if (normQuery.includes(normK) || normQuery.includes(normV)) {
        score += 20;
        currentMatchedKw.push(key);
      }
    }

    // 4. Topic Title relevance
    const normTitle = normalizeSemanticText(topic.title);
    if (normQuery.includes(normTitle)) {
      score += 35;
    }

    // Priority tie-breaker
    score += (topic.priority || 50) * 0.1;

    if (score > bestScore) {
      bestScore = score;
      bestTopic = topic;
      bestMatchedKeywords = Array.from(new Set(currentMatchedKw));
    }
  }

  const duration = Math.round((performance.now() - startTime) * 100) / 100;
  // Normalized confidence percentage capped at 100
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

  // Fallback for general queries without strict semantic index lock
  const defaultWhatsApp = config?.businessPhone
    ? `https://wa.me/${config.businessPhone.replace(/\D/g, '')}`
    : 'https://wa.me/5567993174612';

  return {
    isMatch: false,
    confidence: confidence,
    topic: bestTopic,
    matchedKeywords: bestMatchedKeywords,
    matchedIntent: 'Consulta Geral / Sem correspondência direta',
    reply: `Entendi sua dúvida! Para te passar as informações detalhadas e personalizadas para a sua empresa, vou te conectar com nosso especialista no WhatsApp:\n\n👉 [Falar com Especialista Start Mkt Local](${defaultWhatsApp})\n\nOu me diga se prefere saber sobre **Sites**, **Google Meu Negócio**, **Biosite IA** ou **AvaliaCard NFC**!`,
    needsHumanHandoff: false,
    executionTimeMs: duration,
  };
}
