import React, { useState, useMemo } from 'react';
import {
  X,
  Save,
  Plus,
  Trash2,
  Bot,
  Sparkles,
  Building,
  Phone,
  Globe,
  Layers,
  RotateCcw,
  Search,
  CheckCircle2,
  Zap,
  Database,
  ArrowRight,
  ExternalLink,
  SlidersHorizontal,
  ChevronRight,
  Cpu,
  BookOpen,
  FileCode,
} from 'lucide-react';
import {
  BusinessConfig,
  saveBusinessConfig,
  OFFICIAL_KNOWLEDGE_BASE,
  buildSemanticIndex,
  matchSemanticQuery,
  SemanticTopic,
  SemanticMatchResult,
} from '../services/api';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BusinessConfig;
  theme?: 'day' | 'night';
  onConfigUpdated: (newConfig: BusinessConfig) => void;
}

type TabType = 'index' | 'tester' | 'markdown' | 'identity';

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({
  isOpen,
  onClose,
  config,
  theme = 'night',
  onConfigUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<TabType>('index');
  const [formData, setFormData] = useState<BusinessConfig>(() => {
    const base = { ...config };
    if (!base.systemPromptAddendum || base.systemPromptAddendum.includes('Conectacard')) {
      base.systemPromptAddendum = OFFICIAL_KNOWLEDGE_BASE;
    }
    return base;
  });

  const [newQuestion, setNewQuestion] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Semantic Index state & filters
  const [searchFilter, setSearchFilter] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [expandedTopicId, setExpandedTopicId] = useState<string | null>(null);

  // Live Semantic Tester state
  const [testQuery, setTestQuery] = useState('');
  const [testResult, setTestResult] = useState<SemanticMatchResult | null>(null);

  // Compile semantic index in real-time based on current formData
  const semanticIndex = useMemo(() => {
    return buildSemanticIndex(formData.systemPromptAddendum, formData);
  }, [formData.systemPromptAddendum, formData]);

  // Run test when testQuery changes
  const handleRunTest = (queryToTest: string) => {
    const q = queryToTest.trim();
    if (!q) {
      setTestResult(null);
      return;
    }
    const result = matchSemanticQuery(q, semanticIndex, formData);
    setTestResult(result);
  };

  // Filtered topics for the Index view
  const filteredTopics = useMemo(() => {
    return semanticIndex.topics.filter((topic) => {
      const matchCat = selectedCategory === 'all' || topic.category === selectedCategory;
      if (!matchCat) return false;

      if (!searchFilter.trim()) return true;
      const q = searchFilter.toLowerCase();
      const inTitle = topic.title.toLowerCase().includes(q);
      const inSummary = topic.summary.toLowerCase().includes(q);
      const inKeywords = topic.keywords.some((k) => k.toLowerCase().includes(q));
      const inEntities = Object.entries(topic.entities).some(
        ([k, v]) => k.toLowerCase().includes(q) || v.toLowerCase().includes(q)
      );

      return inTitle || inSummary || inKeywords || inEntities;
    });
  }, [semanticIndex, selectedCategory, searchFilter]);

  if (!isOpen) return null;

  const handleAddQuestion = () => {
    if (!newQuestion.trim()) return;
    setFormData((prev) => ({
      ...prev,
      quickQuestions: [...prev.quickQuestions, newQuestion.trim()],
    }));
    setNewQuestion('');
  };

  const handleRemoveQuestion = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      quickQuestions: prev.quickQuestions.filter((_, i) => i !== index),
    }));
  };

  const handleInsertServiceTemplate = () => {
    const template = `\n\n## Produto/Serviço Novo: Nome do Serviço
- **Para quem é indicado:** Empresas de todo o Brasil
- **O que inclui:** Descrição detalhada dos diferenciais e entregáveis
- **Prazo de entrega:** 5 dias úteis
- **Valor:** R$ A combinar`;

    setFormData((prev) => ({
      ...prev,
      systemPromptAddendum: prev.systemPromptAddendum + template,
    }));
    setActiveTab('markdown');
  };

  const handleInsertFaqTemplate = () => {
    const template = `\n\n**P: Pergunta frequente do cliente aqui?**
R: Resposta direta, sem enrolação, com proposta de valor e terminando com pergunta de próximo passo.`;

    setFormData((prev) => ({
      ...prev,
      systemPromptAddendum: prev.systemPromptAddendum + template,
    }));
    setActiveTab('markdown');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await saveBusinessConfig(formData);
      onConfigUpdated(updated);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar as configurações.');
    } finally {
      setIsSaving(false);
    }
  };

  const isDay = theme === 'day';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-4xl rounded-3xl border shadow-2xl flex flex-col max-h-[92vh] overflow-hidden font-sans transition-colors ${
          isDay
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-[#141622] border-slate-700/80 text-slate-100'
        }`}
      >
        {/* Modal Top Header */}
        <div
          className={`px-5 py-3.5 border-b flex items-center justify-between ${
            isDay ? 'border-slate-200 bg-slate-50/80' : 'border-slate-800 bg-[#11131c]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-sm sm:text-base font-bold ${isDay ? 'text-slate-900' : 'text-white'}`}>
                  Índice Semântico & Base de Conhecimento ({formData.botName})
                </h2>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <Zap className="w-3 h-3" /> Ultra-preciso (&lt;5ms)
                </span>
              </div>
              <p className={`text-xs ${isDay ? 'text-slate-500' : 'text-slate-400'}`}>
                Indexação de tópicos, entidades chave-valor e prevenção de respostas genéricas.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Fechar"
            className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
              isDay
                ? 'bg-slate-200/70 hover:bg-slate-300 text-slate-600'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Global Statistics Banner */}
        <div
          className={`px-5 py-2.5 border-b text-xs flex flex-wrap items-center justify-between gap-3 ${
            isDay ? 'bg-emerald-50/60 border-slate-200 text-slate-700' : 'bg-emerald-950/20 border-slate-800 text-slate-300'
          }`}
        >
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium">
              <Database className="w-3.5 h-3.5 text-emerald-500" />
              <strong>{semanticIndex.topics.length}</strong> Tópicos Indexados
            </span>
            <span className="flex items-center gap-1.5 font-medium">
              <Sparkles className="w-3.5 h-3.5 text-cyan-500" />
              <strong>{semanticIndex.totalKeywords}</strong> Palavras-Chave Mapeadas
            </span>
            <span className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Zero Respostas Genéricas
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  companyName: 'Start Mkt Local',
                  botName: 'LIA',
                  botRole: 'Especialista de atendimento e vendas',
                  businessPhone: '+55 67 99317-4612',
                  website: 'https://www.startmktlocal.com.br/',
                  catalogUrl: 'https://www.startmktlocal.com.br/',
                  systemPromptAddendum: OFFICIAL_KNOWLEDGE_BASE,
                }));
              }}
              className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border flex items-center gap-1 transition ${
                isDay
                  ? 'bg-white hover:bg-slate-100 text-slate-700 border-slate-300'
                  : 'bg-slate-800/80 hover:bg-slate-700 text-slate-200 border-slate-700'
              }`}
            >
              <RotateCcw className="w-3 h-3 text-amber-400" /> Restaurar Oficial
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div
          className={`px-5 border-b flex gap-1 overflow-x-auto no-scrollbar ${
            isDay ? 'bg-slate-100/70 border-slate-200' : 'bg-[#0f111a] border-slate-800'
          }`}
        >
          <button
            type="button"
            onClick={() => setActiveTab('index')}
            className={`px-3.5 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'index'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Database className="w-3.5 h-3.5" />
            Índice Semântico ({semanticIndex.topics.length})
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('tester')}
            className={`px-3.5 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'tester'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            Testador em Tempo Real
            {testResult && testResult.isMatch && (
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('markdown')}
            className={`px-3.5 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'markdown'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            Editor da Base (Markdown)
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('identity')}
            className={`px-3.5 py-2.5 text-xs font-semibold flex items-center gap-1.5 border-b-2 transition whitespace-nowrap ${
              activeTab === 'identity'
                ? 'border-emerald-500 text-emerald-600 dark:text-emerald-400'
                : 'border-transparent text-slate-500 hover:text-slate-300'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            Identidade & Links
          </button>
        </div>

        {/* Tab Contents */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {/* TAB 1: ÍNDICE SEMÂNTICO */}
          {activeTab === 'index' && (
            <div className="flex flex-col gap-4">
              {/* Filter and Search Bar */}
              <div className="flex flex-col sm:flex-row gap-2.5 items-stretch sm:items-center justify-between">
                <div className="relative flex-1">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-slate-400" />
                  <input
                    type="text"
                    value={searchFilter}
                    onChange={(e) => setSearchFilter(e.target.value)}
                    placeholder="Filtrar por tópico, palavra-chave, preço ou entidade..."
                    className={`w-full pl-8 pr-3 py-2 text-xs rounded-xl border focus:outline-none focus:border-emerald-500 ${
                      isDay
                        ? 'bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400'
                        : 'bg-[#0d0f17] border-slate-700 text-white placeholder:text-slate-500'
                    }`}
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                  <button
                    type="button"
                    onClick={() => setSelectedCategory('all')}
                    className={`text-[11px] px-2.5 py-1.5 rounded-lg border font-medium transition whitespace-nowrap ${
                      selectedCategory === 'all'
                        ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                        : isDay
                        ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                        : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                    }`}
                  >
                    Todos ({semanticIndex.topics.length})
                  </button>
                  {semanticIndex.categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`text-[11px] px-2.5 py-1.5 rounded-lg border font-medium transition whitespace-nowrap ${
                        selectedCategory === cat
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-bold'
                          : isDay
                          ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Topics Grid */}
              <div className="grid grid-cols-1 gap-3">
                {filteredTopics.map((topic) => {
                  const isExpanded = expandedTopicId === topic.id;
                  const categoryBadgeColor =
                    topic.category === 'Catálogo & Preços'
                      ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                      : topic.category === 'Links Oficiais'
                      ? 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
                      : topic.category === 'FAQ & Objeções'
                      ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                      : topic.category === 'Integrações Google'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                      : 'bg-purple-500/10 text-purple-400 border-purple-500/20';

                  return (
                    <div
                      key={topic.id}
                      className={`rounded-2xl border p-4 transition ${
                        isDay
                          ? 'bg-white border-slate-200 hover:border-slate-300 shadow-2xs'
                          : 'bg-[#10121c] border-slate-800 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span
                              className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${categoryBadgeColor}`}
                            >
                              {topic.category}
                            </span>
                            <h3 className={`text-xs sm:text-sm font-bold ${isDay ? 'text-slate-900' : 'text-white'}`}>
                              {topic.title}
                            </h3>
                            {topic.needsHumanHandoff && (
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">
                                Transfere para Humano
                              </span>
                            )}
                          </div>
                          <p className={`text-xs ${isDay ? 'text-slate-600' : 'text-slate-300'} mb-2.5`}>
                            {topic.summary}
                          </p>

                          {/* Entities (Key-Value) */}
                          {Object.keys(topic.entities).length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2.5">
                              {Object.entries(topic.entities).map(([key, val]) => (
                                <span
                                  key={key}
                                  className={`text-[11px] px-2 py-0.5 rounded-lg border flex items-center gap-1 ${
                                    isDay
                                      ? 'bg-slate-100 text-slate-700 border-slate-200'
                                      : 'bg-slate-800/80 text-slate-300 border-slate-700/80'
                                  }`}
                                >
                                  <span className="font-semibold text-emerald-500">{key}:</span> {val}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Keywords Chips */}
                          <div className="flex flex-wrap items-center gap-1">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mr-1">
                              Keywords:
                            </span>
                            {topic.keywords.slice(0, 7).map((kw, i) => (
                              <span
                                key={i}
                                className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  isDay
                                    ? 'bg-slate-100 text-slate-600'
                                    : 'bg-slate-800 text-slate-400'
                                }`}
                              >
                                #{kw}
                              </span>
                            ))}
                            {topic.keywords.length > 7 && (
                              <span className="text-[10px] text-slate-400 font-medium">
                                +{topic.keywords.length - 7} mais
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Action buttons on card */}
                        <div className="flex flex-col gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => {
                              const sampleQuery =
                                topic.suggestedQueries[0] || `Como funciona ${topic.title}?`;
                              setTestQuery(sampleQuery);
                              handleRunTest(sampleQuery);
                              setActiveTab('tester');
                            }}
                            className="text-[11px] font-semibold px-2.5 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 transition"
                          >
                            <Zap className="w-3 h-3" /> Testar
                          </button>
                          <button
                            type="button"
                            onClick={() => setExpandedTopicId(isExpanded ? null : topic.id)}
                            className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                              isDay
                                ? 'bg-slate-100 text-slate-600 border-slate-200'
                                : 'bg-slate-800 text-slate-400 border-slate-700'
                            }`}
                          >
                            {isExpanded ? 'Ocultar' : 'Ver Resposta'}
                          </button>
                        </div>
                      </div>

                      {/* Expanded Direct Answer Preview */}
                      {isExpanded && (
                        <div
                          className={`mt-3 pt-3 border-t text-xs font-mono whitespace-pre-line leading-relaxed ${
                            isDay
                              ? 'border-slate-200 bg-slate-50/70 p-3 rounded-xl text-slate-800'
                              : 'border-slate-800 bg-[#0a0c12] p-3 rounded-xl text-slate-200'
                          }`}
                        >
                          <div className="text-[10px] font-sans font-bold text-emerald-500 uppercase tracking-wider mb-1">
                            Resposta Direta Gerada (WhatsApp Format):
                          </div>
                          {topic.directAnswer}
                        </div>
                      )}
                    </div>
                  );
                })}

                {filteredTopics.length === 0 && (
                  <div className="text-center py-8 text-xs text-slate-400">
                    Nenhum tópico encontrado para os filtros atuais.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: TESTADOR EM TEMPO REAL */}
          {activeTab === 'tester' && (
            <div className="flex flex-col gap-4">
              <div
                className={`p-4 rounded-2xl border ${
                  isDay ? 'bg-emerald-50/40 border-emerald-200' : 'bg-emerald-950/10 border-emerald-900/40'
                }`}
              >
                <div className="flex items-center gap-2 mb-1.5">
                  <Zap className="w-4 h-4 text-emerald-500" />
                  <h3 className={`text-xs sm:text-sm font-bold ${isDay ? 'text-slate-900' : 'text-white'}`}>
                    Simulador & Testador de Precisão Semântica
                  </h3>
                </div>
                <p className={`text-xs ${isDay ? 'text-slate-600' : 'text-slate-300'}`}>
                  Digite uma pergunta real que um cliente faria no WhatsApp. O índice semântico recupera a resposta exata em &lt;5ms sem risco de alucinação ou respostas genéricas.
                </p>
              </div>

              {/* Input + Action */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={testQuery}
                  onChange={(e) => {
                    setTestQuery(e.target.value);
                    handleRunTest(e.target.value);
                  }}
                  placeholder="Ex: quanto custa o biosite? / qual o site da empresa? / tem desconto?"
                  className={`flex-1 px-3.5 py-2.5 text-xs rounded-xl border focus:outline-none focus:border-emerald-500 ${
                    isDay
                      ? 'bg-slate-50 border-slate-200 text-slate-900'
                      : 'bg-[#0d0f17] border-slate-700 text-white'
                  }`}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleRunTest(testQuery);
                    }
                  }}
                />
                <button
                  type="button"
                  onClick={() => handleRunTest(testQuery)}
                  className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center gap-1.5 transition active:scale-95"
                >
                  <Zap className="w-3.5 h-3.5" /> Analisar
                </button>
              </div>

              {/* Preset suggestion chips */}
              <div className="flex flex-col gap-1.5">
                <span className="text-[11px] font-semibold text-slate-400">Sugestões de teste rápido:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Qual o site de vocês?',
                    'Quanto custa para criar um site?',
                    'Como funciona o AvaliaCard NFC?',
                    'Quanto custa o Biosite com IA?',
                    'Vocês dão desconto no PIX?',
                    'Vocês agendam no Google Agenda?',
                    'Quero falar com uma pessoa',
                    'Achei o valor alto',
                  ].map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setTestQuery(preset);
                        handleRunTest(preset);
                      }}
                      className={`text-[11px] px-2.5 py-1 rounded-lg border transition ${
                        testQuery === preset
                          ? 'bg-emerald-500 text-slate-950 border-emerald-400 font-semibold'
                          : isDay
                          ? 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
                          : 'bg-slate-800/80 text-slate-300 border-slate-700 hover:bg-slate-700'
                      }`}
                    >
                      {preset}
                    </button>
                  ))}
                </div>
              </div>

              {/* Test Result Inspection Box */}
              {testResult ? (
                <div
                  className={`p-4 rounded-2xl border flex flex-col gap-3 transition ${
                    testResult.isMatch
                      ? isDay
                        ? 'bg-white border-emerald-200 shadow-sm'
                        : 'bg-[#10141f] border-emerald-500/30'
                      : isDay
                      ? 'bg-slate-50 border-slate-200'
                      : 'bg-[#10121a] border-slate-800'
                  }`}
                >
                  {/* Result Header & Score */}
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-xs font-bold px-2.5 py-1 rounded-lg border flex items-center gap-1.5 ${
                          testResult.confidence >= 80
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : testResult.confidence >= 40
                            ? 'bg-amber-500/10 text-amber-400 border-amber-500/30'
                            : 'bg-slate-700/30 text-slate-400 border-slate-700'
                        }`}
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Confiança Semântica: {testResult.confidence}%
                      </span>

                      <span className="text-[11px] text-slate-400 font-mono">
                        Latência: {testResult.executionTimeMs}ms
                      </span>
                    </div>

                    <div className="text-xs">
                      {testResult.isMatch ? (
                        <span className="text-emerald-500 font-bold flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Tópico Oficial Correspondente
                        </span>
                      ) : (
                        <span className="text-amber-500 font-semibold">
                          Consulta Ampla / Redirecionamento Humano
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Matched Details */}
                  {testResult.topic && (
                    <div
                      className={`text-xs p-3 rounded-xl border flex flex-col gap-1.5 ${
                        isDay ? 'bg-slate-50 border-slate-200' : 'bg-[#0b0d14] border-slate-800'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-400">Tópico Ativado:</span>
                        <span className="font-bold text-emerald-500">{testResult.topic.title}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-400">Categoria:</span>
                        <span className="text-slate-300">{testResult.topic.category}</span>
                      </div>
                      {testResult.matchedKeywords.length > 0 && (
                        <div className="flex items-center gap-1 flex-wrap pt-1 border-t border-slate-800">
                          <span className="font-semibold text-slate-400 mr-1">Palavras Detectadas:</span>
                          {testResult.matchedKeywords.map((kw, i) => (
                            <span
                              key={i}
                              className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-mono"
                            >
                              {kw}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Generated WhatsApp Style Reply */}
                  <div className="flex flex-col gap-1.5">
                    <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Resposta que a LIA entregará no WhatsApp:
                    </span>
                    <div
                      className={`p-3.5 rounded-2xl text-xs font-sans whitespace-pre-line leading-relaxed border ${
                        isDay
                          ? 'bg-emerald-50 border-emerald-200 text-slate-900'
                          : 'bg-[#0f1717] border-emerald-900/60 text-slate-100 shadow-inner'
                      }`}
                    >
                      {testResult.reply}
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 text-xs text-slate-400">
                  Digite uma pergunta acima ou clique em uma das sugestões para testar o índice semântico.
                </div>
              )}
            </div>
          )}

          {/* TAB 3: EDITOR DA BASE (MARKDOWN) */}
          {activeTab === 'markdown' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className={`text-xs sm:text-sm font-bold ${isDay ? 'text-slate-900' : 'text-white'}`}>
                    Base de Conhecimento Estruturada (Markdown)
                  </h3>
                  <p className={`text-[11px] ${isDay ? 'text-slate-500' : 'text-slate-400'}`}>
                    O índice semântico analisa tópicos (#), seções chave-valor (Produto:, Valor:, Prazo:) e perguntas frequentes (**P:**) em tempo real.
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={handleInsertServiceTemplate}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border flex items-center gap-1 transition ${
                      isDay
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    <Plus className="w-3 h-3 text-emerald-400" /> + Inserir Serviço
                  </button>
                  <button
                    type="button"
                    onClick={handleInsertFaqTemplate}
                    className={`text-[11px] font-medium px-2.5 py-1 rounded-lg border flex items-center gap-1 transition ${
                      isDay
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                        : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
                    }`}
                  >
                    <Plus className="w-3 h-3 text-amber-400" /> + Inserir FAQ
                  </button>
                </div>
              </div>

              <textarea
                rows={14}
                value={formData.systemPromptAddendum}
                onChange={(e) => setFormData({ ...formData, systemPromptAddendum: e.target.value })}
                placeholder="Cole aqui a base de conhecimento completa da empresa..."
                className={`rounded-2xl p-3.5 text-xs border focus:outline-none focus:border-emerald-500 resize-y font-mono leading-relaxed ${
                  isDay
                    ? 'bg-slate-50 border-slate-200 text-slate-900'
                    : 'bg-[#0d0f17] border-slate-800 text-white'
                }`}
              />

              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span>Caracteres: {formData.systemPromptAddendum.length}</span>
                <span className="flex items-center gap-1 text-emerald-500 font-medium">
                  <CheckCircle2 className="w-3 h-3" /> Reindexação automática ativa
                </span>
              </div>
            </div>
          )}

          {/* TAB 4: IDENTIDADE & LINKS */}
          {activeTab === 'identity' && (
            <div className="flex flex-col gap-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                <div className="flex flex-col gap-1.5">
                  <label
                    className={`text-xs font-semibold flex items-center gap-1.5 ${
                      isDay ? 'text-slate-700' : 'text-slate-300'
                    }`}
                  >
                    <Building className="w-3.5 h-3.5 text-emerald-500" />
                    Nome da Empresa:
                  </label>
                  <input
                    type="text"
                    value={formData.companyName}
                    onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                    className={`rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-emerald-500 ${
                      isDay
                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                        : 'bg-[#10121a] border-slate-700 text-white'
                    }`}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    className={`text-xs font-semibold flex items-center gap-1.5 ${
                      isDay ? 'text-slate-700' : 'text-slate-300'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5 text-blue-500" />
                    Nome do Bot:
                  </label>
                  <input
                    type="text"
                    value={formData.botName}
                    onChange={(e) => setFormData({ ...formData, botName: e.target.value })}
                    className={`rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-emerald-500 ${
                      isDay
                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                        : 'bg-[#10121a] border-slate-700 text-white'
                    }`}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    className={`text-xs font-semibold flex items-center gap-1.5 ${
                      isDay ? 'text-slate-700' : 'text-slate-300'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5 text-purple-500" />
                    Papel / Cargo:
                  </label>
                  <input
                    type="text"
                    value={formData.botRole}
                    onChange={(e) => setFormData({ ...formData, botRole: e.target.value })}
                    className={`rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-emerald-500 ${
                      isDay
                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                        : 'bg-[#10121a] border-slate-700 text-white'
                    }`}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    className={`text-xs font-semibold flex items-center gap-1.5 ${
                      isDay ? 'text-slate-700' : 'text-slate-300'
                    }`}
                  >
                    <Phone className="w-3.5 h-3.5 text-emerald-500" />
                    WhatsApp de Atendimento Humano:
                  </label>
                  <input
                    type="text"
                    value={formData.businessPhone}
                    onChange={(e) => setFormData({ ...formData, businessPhone: e.target.value })}
                    className={`rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-emerald-500 ${
                      isDay
                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                        : 'bg-[#10121a] border-slate-700 text-white'
                    }`}
                    required
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    className={`text-xs font-semibold flex items-center gap-1.5 ${
                      isDay ? 'text-slate-700' : 'text-slate-300'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 text-cyan-500" />
                    Website Oficial:
                  </label>
                  <input
                    type="text"
                    value={formData.website || 'https://www.startmktlocal.com.br/'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        website: e.target.value,
                        websiteConectacard: e.target.value,
                      })
                    }
                    className={`rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-emerald-500 ${
                      isDay
                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                        : 'bg-[#10121a] border-slate-700 text-white'
                    }`}
                  />
                </div>

                <div className="flex flex-col gap-1.5">
                  <label
                    className={`text-xs font-semibold flex items-center gap-1.5 ${
                      isDay ? 'text-slate-700' : 'text-slate-300'
                    }`}
                  >
                    <Globe className="w-3.5 h-3.5 text-amber-500" />
                    Modelo de Biosite / Portfólio:
                  </label>
                  <input
                    type="text"
                    value={formData.catalogUrl || 'https://vicenteiaguebiositegoogleia.vercel.app/'}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        catalogUrl: e.target.value,
                        websiteSuperlimpo: e.target.value,
                      })
                    }
                    className={`rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-emerald-500 ${
                      isDay
                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                        : 'bg-[#10121a] border-slate-700 text-white'
                    }`}
                  />
                </div>
              </div>

              {/* Quick Questions Chips */}
              <div className="flex flex-col gap-2 pt-2 border-t border-slate-800">
                <label className={`text-xs font-semibold ${isDay ? 'text-slate-700' : 'text-slate-300'}`}>
                  Sugestões de Perguntas Rápidas (Chips de WhatsApp):
                </label>
                <div className="flex flex-wrap gap-1.5 mb-1.5">
                  {formData.quickQuestions.map((q, idx) => (
                    <span
                      key={idx}
                      className={`text-xs px-3 py-1 rounded-full border flex items-center gap-1.5 ${
                        isDay
                          ? 'bg-slate-100 text-slate-800 border-slate-200'
                          : 'bg-slate-800 text-slate-200 border-slate-700'
                      }`}
                    >
                      {q}
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(idx)}
                        className="hover:text-rose-500 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newQuestion}
                    onChange={(e) => setNewQuestion(e.target.value)}
                    placeholder="Ex: Como funciona o Google Meu Negócio?"
                    className={`flex-1 rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-emerald-500 ${
                      isDay
                        ? 'bg-slate-50 border-slate-200 text-slate-900'
                        : 'bg-[#10121a] border-slate-700 text-white'
                    }`}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddQuestion();
                      }
                    }}
                  />
                  <button
                    type="button"
                    onClick={handleAddQuestion}
                    className={`px-3 py-2 rounded-xl text-xs flex items-center gap-1 transition ${
                      isDay
                        ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                        : 'bg-slate-700 hover:bg-slate-600 text-white'
                    }`}
                  >
                    <Plus className="w-3.5 h-3.5" /> Adicionar
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div
          className={`px-5 py-3.5 border-t flex items-center justify-between gap-3 ${
            isDay ? 'border-slate-200 bg-slate-50/80' : 'border-slate-800 bg-[#11131c]'
          }`}
        >
          <div className="text-[11px] text-slate-400 hidden sm:block">
            {semanticIndex.topics.length} tópicos semânticos prontos para responder sem respostas genéricas.
          </div>

          <div className="flex items-center gap-2.5 ml-auto">
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs transition ${
                isDay
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-2 transition active:scale-95 disabled:opacity-50 shadow-md shadow-emerald-500/20"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
