import React, { useState } from 'react';
import { X, Save, Plus, Trash2, Bot, Sparkles, Building, Phone, Globe, Layers, RotateCcw } from 'lucide-react';
import { BusinessConfig, saveBusinessConfig, OFFICIAL_KNOWLEDGE_BASE } from '../services/api';

interface KnowledgeBaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BusinessConfig;
  theme?: 'day' | 'night';
  onConfigUpdated: (newConfig: BusinessConfig) => void;
}

export const KnowledgeBaseModal: React.FC<KnowledgeBaseModalProps> = ({
  isOpen,
  onClose,
  config,
  theme = 'night',
  onConfigUpdated,
}) => {
  const [formData, setFormData] = useState<BusinessConfig>(() => {
    const base = { ...config };
    if (!base.systemPromptAddendum || base.systemPromptAddendum.includes('Conectacard')) {
      base.systemPromptAddendum = OFFICIAL_KNOWLEDGE_BASE;
    }
    return base;
  });
  const [newQuestion, setNewQuestion] = useState('');
  const [isSaving, setIsSaving] = useState(false);

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl flex flex-col max-h-[90vh] overflow-hidden font-sans transition-colors ${
          isDay
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-[#181a26] border-slate-700 text-slate-100'
        }`}
      >
        {/* Modal Header */}
        <div
          className={`px-6 py-4 border-b flex items-center justify-between ${
            isDay ? 'border-slate-200' : 'border-slate-700/80'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-500 flex items-center justify-center">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className={`text-base font-bold ${isDay ? 'text-slate-900' : 'text-white'}`}>
                Base de Conhecimento & Personalização de {formData.botName}
              </h2>
              <p className={`text-xs ${isDay ? 'text-slate-500' : 'text-slate-400'}`}>
                Ajuste os dados da empresa, perguntas rápidas e diretrizes de IA.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition ${
              isDay
                ? 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                : 'bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-6 flex flex-col gap-5">
          {/* Section 1: Business Identity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          {/* Section 2: Links */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                value={formData.website || formData.websiteConectacard || 'https://www.startmktlocal.com.br/'}
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

          {/* Section 3: Quick Suggestion Questions */}
          <div className="flex flex-col gap-2">
            <label className={`text-xs font-semibold ${isDay ? 'text-slate-700' : 'text-slate-300'}`}>
              Sugestões de Perguntas Rápidas (Chips):
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
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
                placeholder="Ex: Qual o horário de atendimento?"
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

          {/* Section 4: Custom System Prompt Instructions */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <label
                className={`text-xs font-semibold flex items-center gap-1.5 ${
                  isDay ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Base de Conhecimento & Diretrizes da LIA:
              </label>
              <button
                type="button"
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    companyName: 'Start Mkt Local',
                    botName: 'LIA',
                    botRole: 'Especialista de atendimento e vendas',
                    businessPhone: '+55 67 99317-4512',
                    website: 'https://www.startmktlocal.com.br/',
                    catalogUrl: 'https://www.startmktlocal.com.br/',
                    systemPromptAddendum: OFFICIAL_KNOWLEDGE_BASE,
                  }))
                }
                className={`text-[11px] font-semibold px-2.5 py-1 rounded-lg border flex items-center gap-1 transition ${
                  isDay
                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-300'
                    : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                }`}
              >
                <RotateCcw className="w-3 h-3" /> Restaurar Base Oficial Start Mkt Local
              </button>
            </div>
            <textarea
              rows={8}
              value={formData.systemPromptAddendum}
              onChange={(e) => setFormData({ ...formData, systemPromptAddendum: e.target.value })}
              placeholder="Cole aqui a base de conhecimento completa da empresa..."
              className={`rounded-xl p-3 text-xs border focus:outline-none focus:border-emerald-500 resize-y font-mono leading-relaxed ${
                isDay
                  ? 'bg-slate-50 border-slate-200 text-slate-900'
                  : 'bg-[#10121a] border-slate-700 text-white'
              }`}
            />
            <p className={`text-[11px] ${isDay ? 'text-slate-500' : 'text-slate-400'}`}>
              Essa base de conhecimento é utilizada para todas as respostas inteligentes e regras de atendimento da LIA.
            </p>
          </div>

          {/* Modal Footer */}
          <div
            className={`pt-4 border-t flex items-center justify-end gap-3 ${
              isDay ? 'border-slate-200' : 'border-slate-700/80'
            }`}
          >
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 rounded-xl text-xs transition ${
                isDay
                  ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-5 py-2 rounded-xl text-xs flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              {isSaving ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
