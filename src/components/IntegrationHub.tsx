import React, { useState, useEffect } from 'react';
import {
  Webhook,
  Copy,
  Check,
  Play,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  Code,
  Shield,
  Smartphone,
  Save,
  Radio,
  FileText,
} from 'lucide-react';
import {
  BusinessConfig,
  WebhookLog,
  fetchWebhookLogs,
  saveBusinessConfig,
  simulateWhatsAppIncomingMessage,
} from '../services/api';

interface IntegrationHubProps {
  config: BusinessConfig;
  theme?: 'day' | 'night';
  onConfigUpdated: (newConfig: BusinessConfig) => void;
}

export const IntegrationHub: React.FC<IntegrationHubProps> = ({
  config,
  theme = 'night',
  onConfigUpdated,
}) => {
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [isLoadingLogs, setIsLoadingLogs] = useState(false);

  // Form states
  const [verifyToken, setVerifyToken] = useState(config.whatsappVerifyToken);
  const [accessToken, setAccessToken] = useState(config.whatsappAccessToken);
  const [phoneNumberId, setPhoneNumberId] = useState(config.whatsappPhoneNumberId);
  const [businessPhone, setBusinessPhone] = useState(config.businessPhone);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Simulator state
  const [simPhone, setSimPhone] = useState('5567993174612');
  const [simMessage, setSimMessage] = useState('Olá! Gostaria de saber os valores para Criação de Sites e Biosite com IA');
  const [simIsAudio, setSimIsAudio] = useState(false);
  const [simLoading, setSimLoading] = useState(false);
  const [simResult, setSimResult] = useState<string | null>(null);

  const webhookUrl =
    typeof window !== 'undefined'
      ? `${window.location.origin}/api/webhook/whatsapp`
      : 'https://sua-url.com/api/webhook/whatsapp';

  const loadLogs = async () => {
    setIsLoadingLogs(true);
    try {
      const data = await fetchWebhookLogs();
      if (Array.isArray(data)) {
        setLogs(data);
      }
    } catch {
      // Ignored gracefully
    } finally {
      setIsLoadingLogs(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const handleCopy = (field: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedField(field);
    setTimeout(() => setCopiedField(null), 2000);
  };

  const handleSaveCredentials = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await saveBusinessConfig({
        whatsappVerifyToken: verifyToken,
        whatsappAccessToken: accessToken,
        whatsappPhoneNumberId: phoneNumberId,
        businessPhone: businessPhone,
      });
      onConfigUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar credenciais.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSimulateWebhook = async () => {
    if (!simMessage.trim() || simLoading) return;
    setSimLoading(true);
    setSimResult(null);

    try {
      const res = await simulateWhatsAppIncomingMessage(simPhone, simMessage, simIsAudio);
      setSimResult(res.reply);
      await loadLogs();
    } catch (err: any) {
      setSimResult(`Erro na simulação: ${err.message}`);
    } finally {
      setSimLoading(false);
    }
  };

  const isDay = theme === 'day';

  return (
    <div
      className={`w-full max-w-4xl mx-auto flex flex-col gap-6 font-sans pb-12 transition-colors ${
        isDay ? 'text-slate-800' : 'text-slate-100'
      }`}
    >
      {/* Header Banner */}
      <div
        className={`p-6 rounded-3xl border shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all ${
          isDay
            ? 'bg-gradient-to-r from-emerald-800 to-slate-900 border-emerald-600/30 text-white'
            : 'bg-gradient-to-r from-emerald-950 via-slate-900 to-indigo-950 border-emerald-500/30'
        }`}
      >
        <div>
          <div className="flex items-center gap-2 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Radio className="w-4 h-4 animate-pulse" />
            Meta WhatsApp Cloud API + Google Gemini
          </div>
          <h2 className="text-2xl font-extrabold text-white">
            Integração WhatsApp Business de {config.botName}
          </h2>
          <p className="text-sm text-slate-200 mt-1 max-w-xl">
            Conecte o número do seu WhatsApp Business oficial para que a LIA responda todas as consultas de clientes automaticamente utilizando o modelo Google Gemini.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 shrink-0">
          <span className="px-3 py-1.5 rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-xs font-semibold flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" />
            Webhook Ativo
          </span>
          <span className="px-3 py-1.5 rounded-xl bg-blue-500/20 text-blue-300 border border-blue-500/40 text-xs font-semibold flex items-center gap-1.5">
            <Shield className="w-4 h-4" />
            API Google Gemini Integrada
          </span>
        </div>
      </div>

      {/* Explanatory Step-by-Step Box */}
      <div
        className={`p-5 rounded-3xl border shadow-sm transition-all ${
          isDay
            ? 'bg-blue-50/70 border-blue-200 text-slate-800'
            : 'bg-[#151928] border-blue-500/30 text-slate-200'
        }`}
      >
        <div className="flex items-center gap-2 mb-3">
          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 animate-ping" />
          <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wide">
            Entenda o fluxo: Como a LIA se conecta com a Meta (WhatsApp Oficial)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
          <div
            className={`p-3.5 rounded-2xl border ${
              isDay
                ? 'bg-white/90 border-emerald-200 shadow-sm'
                : 'bg-[#1a2035] border-emerald-500/30'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-emerald-600 dark:text-emerald-400 mb-1.5">
              <span className="w-5 h-5 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs">1</span>
              <span>PARTE 1: Copiar DAQUI ➔ Colar na META</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Você copia a <strong>Callback URL</strong> e o <strong>Verify Token</strong> mostrados abaixo e cola no painel <strong>developers.facebook.com</strong> (em WhatsApp &gt; Configuração &gt; Webhook).
              <br />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                👉 Objetivo: Avisar a Meta para onde encaminhar as mensagens que os clientes enviarem.
              </span>
            </p>
          </div>

          <div
            className={`p-3.5 rounded-2xl border ${
              isDay
                ? 'bg-white/90 border-blue-200 shadow-sm'
                : 'bg-[#1a2035] border-blue-500/30'
            }`}
          >
            <div className="flex items-center gap-2 font-bold text-blue-600 dark:text-blue-400 mb-1.5">
              <span className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center text-xs">2</span>
              <span>PARTE 2: Pegar na META ➔ Salvar AQUI</span>
            </div>
            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
              Lá na Meta você pega o <strong>Phone Number ID</strong> e o <strong>Access Token</strong> e preenche no formulário abaixo clicando em "Salvar".
              <br />
              <span className="text-[11px] text-slate-500 dark:text-slate-400 italic">
                👉 Objetivo: Dar permissão para a LIA enviar a resposta de volta ao WhatsApp do cliente.
              </span>
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Webhook URLs & Meta Credentials */}
        <div className="flex flex-col gap-6">
          {/* Card 1: Webhook Endpoints */}
          <div
            className={`rounded-3xl p-5 border shadow-lg flex flex-col gap-4 transition-colors ${
              isDay
                ? 'bg-white border-slate-200 text-slate-800'
                : 'bg-[#181a25] border-[#2b2f42] text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3
                className={`text-base font-bold flex items-center gap-2 ${
                  isDay ? 'text-slate-900' : 'text-white'
                }`}
              >
                <Webhook className="w-5 h-5 text-emerald-500" />
                1. Webhook (Copie daqui ➔ Cole na Meta)
              </h3>
              <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                Entrada
              </span>
            </div>
            <p className={`text-xs ${isDay ? 'text-slate-500' : 'text-slate-400'}`}>
              Copie estes dados para a aba <strong>WhatsApp &gt; Configuration &gt; Webhook</strong> no painel de desenvolvedores da Meta.
            </p>

            {/* URL */}
            <div className="flex flex-col gap-1.5">
              <label
                className={`text-xs font-semibold ${
                  isDay ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                Callback URL (URL de Retorno):
              </label>
              <div
                className={`flex items-center rounded-xl px-3 py-2 border ${
                  isDay
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-[#10121a] border-slate-700'
                }`}
              >
                <input
                  type="text"
                  readOnly
                  value={webhookUrl}
                  className={`bg-transparent flex-1 text-xs font-mono focus:outline-none select-all ${
                    isDay ? 'text-emerald-700 font-semibold' : 'text-emerald-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => handleCopy('url', webhookUrl)}
                  className={`p-1 transition ${
                    isDay ? 'hover:text-emerald-600 text-slate-400' : 'hover:text-emerald-400 text-slate-400'
                  }`}
                  title="Copiar URL"
                >
                  {copiedField === 'url' ? (
                    <Check className="w-4 h-4 text-emerald-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            {/* Verify Token */}
            <div className="flex flex-col gap-1.5">
              <label
                className={`text-xs font-semibold ${
                  isDay ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                Verify Token (Token de Verificação):
              </label>
              <div
                className={`flex items-center rounded-xl px-3 py-2 border ${
                  isDay
                    ? 'bg-slate-50 border-slate-200'
                    : 'bg-[#10121a] border-slate-700'
                }`}
              >
                <input
                  type="text"
                  readOnly
                  value={verifyToken}
                  className={`bg-transparent flex-1 text-xs font-mono focus:outline-none select-all ${
                    isDay ? 'text-cyan-700 font-semibold' : 'text-cyan-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => handleCopy('token', verifyToken)}
                  className={`p-1 transition ${
                    isDay ? 'hover:text-cyan-600 text-slate-400' : 'hover:text-cyan-400 text-slate-400'
                  }`}
                  title="Copiar Token"
                >
                  {copiedField === 'token' ? (
                    <Check className="w-4 h-4 text-cyan-500" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>

            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                isDay
                  ? 'bg-amber-50/80 border-amber-200 text-amber-900'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
              }`}
            >
              <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
              <span>
                Certifique-se de assinar o evento <strong>messages</strong> na lista de campos do webhook no Meta App.
              </span>
            </div>
          </div>

          {/* Card 2: Meta API Credentials */}
          <form
            onSubmit={handleSaveCredentials}
            className={`rounded-3xl p-5 border shadow-lg flex flex-col gap-4 transition-colors ${
              isDay
                ? 'bg-white border-slate-200 text-slate-800'
                : 'bg-[#181a25] border-[#2b2f42] text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3
                className={`text-base font-bold flex items-center gap-2 ${
                  isDay ? 'text-slate-900' : 'text-white'
                }`}
              >
                <Smartphone className="w-5 h-5 text-blue-500" />
                2. Envio de Mensagens (Pegue na Meta ➔ Salve aqui)
              </h3>
              {saveSuccess ? (
                <span className="text-xs text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-semibold">
                  <Check className="w-3.5 h-3.5" /> Salvo!
                </span>
              ) : (
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                  Saída
                </span>
              )}
            </div>
            <p className={`text-xs ${isDay ? 'text-slate-500' : 'text-slate-400'}`}>
              Configure abaixo para que a LIA envie mensagens de resposta automaticamente pelo número oficial da sua empresa.
            </p>

            <div className="flex flex-col gap-1.5">
              <label
                className={`text-xs font-semibold ${
                  isDay ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                Número de Atendimento Humano (WhatsApp):
              </label>
              <input
                type="text"
                value={businessPhone}
                onChange={(e) => setBusinessPhone(e.target.value)}
                placeholder="+55 67 99317-4612"
                className={`rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-emerald-500 ${
                  isDay
                    ? 'bg-slate-50 text-slate-900 border-slate-200'
                    : 'bg-[#10121a] text-white border-slate-700'
                }`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className={`text-xs font-semibold ${
                  isDay ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                Phone Number ID (ID do Número no Meta):
              </label>
              <input
                type="text"
                value={phoneNumberId}
                onChange={(e) => setPhoneNumberId(e.target.value)}
                placeholder="Ex: 104928374928173"
                className={`rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-emerald-500 font-mono ${
                  isDay
                    ? 'bg-slate-50 text-slate-900 border-slate-200'
                    : 'bg-[#10121a] text-white border-slate-700'
                }`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <label
                className={`text-xs font-semibold ${
                  isDay ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                Permanent Access Token (Token de Acesso do Sistema Meta):
              </label>
              <input
                type="password"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                placeholder="EAAGm0PX4ZC9kBO..."
                className={`rounded-xl px-3 py-2 text-xs border focus:outline-none focus:border-emerald-500 font-mono ${
                  isDay
                    ? 'bg-slate-50 text-slate-900 border-slate-200'
                    : 'bg-[#10121a] text-white border-slate-700'
                }`}
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={isSaving}
                className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                {isSaving ? 'Salvando...' : 'Salvar Configurações'}
              </button>
            </div>
          </form>
        </div>

        {/* Right Column: Webhook Simulator & Real-time Logs */}
        <div className="flex flex-col gap-6">
          {/* Card 3: Interactive Webhook Test Simulator */}
          <div
            className={`rounded-3xl p-5 border shadow-lg flex flex-col gap-4 transition-colors ${
              isDay
                ? 'bg-white border-slate-200 text-slate-800'
                : 'bg-[#181a25] border-[#2b2f42] text-white'
            }`}
          >
            <h3
              className={`text-base font-bold flex items-center gap-2 ${
                isDay ? 'text-slate-900' : 'text-white'
              }`}
            >
              <Play className="w-5 h-5 text-amber-500" />
              Simulador de Disparo de Webhook
            </h3>
            <p className={`text-xs ${isDay ? 'text-slate-500' : 'text-slate-400'}`}>
              Simule um cliente enviando uma mensagem no WhatsApp para ver a LIA processando via Google Gemini e respondendo na hora.
            </p>

            <div className="flex flex-col gap-1.5">
              <label
                className={`text-xs font-semibold ${
                  isDay ? 'text-slate-700' : 'text-slate-300'
                }`}
              >
                Telefone do Cliente:
              </label>
              <input
                type="text"
                value={simPhone}
                onChange={(e) => setSimPhone(e.target.value)}
                className={`rounded-xl px-3 py-2 text-xs border focus:outline-none ${
                  isDay
                    ? 'bg-slate-50 text-slate-900 border-slate-200'
                    : 'bg-[#10121a] text-white border-slate-700'
                }`}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  className={`text-xs font-semibold ${
                    isDay ? 'text-slate-700' : 'text-slate-300'
                  }`}
                >
                  Mensagem do Cliente:
                </label>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => setSimIsAudio(false)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition ${
                      !simIsAudio
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : isDay
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    Texto
                  </button>
                  <button
                    type="button"
                    onClick={() => setSimIsAudio(true)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition flex items-center gap-1 ${
                      simIsAudio
                        ? 'bg-emerald-500 text-slate-950 font-bold'
                        : isDay
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    <span>🎙️ Áudio de Voz</span>
                  </button>
                </div>
              </div>
              <textarea
                rows={2}
                value={simMessage}
                onChange={(e) => setSimMessage(e.target.value)}
                placeholder={simIsAudio ? 'Texto que o cliente fala no áudio...' : 'Mensagem escrita...'}
                className={`rounded-xl px-3 py-2 text-xs border focus:outline-none resize-none ${
                  isDay
                    ? 'bg-slate-50 text-slate-900 border-slate-200'
                    : 'bg-[#10121a] text-white border-slate-700'
                }`}
              />
              {simIsAudio && (
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                  ✨ O webhook receberá payload com <code className="bg-black/10 dark:bg-white/10 px-1 py-0.5 rounded">type: "audio"</code> e o Gemini interpretará a voz diretamente.
                </span>
              )}
            </div>

            <button
              onClick={handleSimulateWebhook}
              disabled={simLoading}
              type="button"
              className="bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs flex items-center justify-center gap-2 transition active:scale-98 disabled:opacity-50"
            >
              <Play className="w-4 h-4 fill-current" />
              {simLoading ? 'Processando com Google Gemini...' : 'Disparar Mensagem no Webhook'}
            </button>

            {simResult && (
              <div
                className={`p-3.5 rounded-2xl border flex flex-col gap-1.5 ${
                  isDay
                    ? 'bg-emerald-50/80 border-emerald-300 text-slate-900'
                    : 'bg-[#10121a] border-emerald-500/40 text-slate-200'
                }`}
              >
                <span className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Resposta Automática da LIA (Google Gemini):
                </span>
                <p className="text-xs whitespace-pre-wrap leading-relaxed">
                  {simResult}
                </p>
              </div>
            )}
          </div>

          {/* Card 4: Webhook Logs */}
          <div
            className={`rounded-3xl p-5 border shadow-lg flex flex-col gap-3 transition-colors ${
              isDay
                ? 'bg-white border-slate-200 text-slate-800'
                : 'bg-[#181a25] border-[#2b2f42] text-white'
            }`}
          >
            <div className="flex items-center justify-between">
              <h3
                className={`text-base font-bold flex items-center gap-2 ${
                  isDay ? 'text-slate-900' : 'text-white'
                }`}
              >
                <FileText className="w-5 h-5 text-indigo-500" />
                Histórico & Logs do Webhook
              </h3>
              <button
                onClick={loadLogs}
                disabled={isLoadingLogs}
                type="button"
                className={`text-xs flex items-center gap-1 transition ${
                  isDay ? 'text-slate-500 hover:text-slate-800' : 'text-slate-400 hover:text-white'
                }`}
                title="Atualizar logs"
              >
                <RotateCcw className={`w-3.5 h-3.5 ${isLoadingLogs ? 'animate-spin' : ''}`} />
                Atualizar
              </button>
            </div>

            <div className="space-y-2 max-h-[220px] overflow-y-auto pr-1">
              {logs.length === 0 ? (
                <div
                  className={`p-4 text-center text-xs ${
                    isDay ? 'text-slate-400' : 'text-slate-500'
                  }`}
                >
                  Nenhum evento registrado ainda. Dispare uma simulação acima!
                </div>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className={`p-2.5 rounded-xl border text-xs flex flex-col gap-1 ${
                      isDay
                        ? 'bg-slate-50 border-slate-200'
                        : 'bg-[#10121a] border-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-emerald-600 dark:text-emerald-400 uppercase">
                        {log.type}
                      </span>
                      <span className={isDay ? 'text-slate-400' : 'text-slate-500'}>
                        {log.timestamp}
                      </span>
                    </div>

                    {log.senderPhone && (
                      <div className={isDay ? 'text-slate-700' : 'text-slate-300'}>
                        <span className={isDay ? 'text-slate-400' : 'text-slate-500'}>De:</span> {log.senderPhone}
                      </div>
                    )}

                    {log.message && (
                      <div className={`font-medium ${isDay ? 'text-slate-900' : 'text-slate-200'}`}>
                        "{log.message}"
                      </div>
                    )}

                    {log.response && (
                      <div className={`text-[11px] line-clamp-2 ${isDay ? 'text-emerald-700' : 'text-emerald-300/90'}`}>
                        ↳ LIA: {log.response}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
