import React, { useState, useEffect } from 'react';
import {
  MessageSquare,
  Smartphone,
  Webhook,
  Settings,
  Sparkles,
  ExternalLink,
  Shield,
  Bot,
  Sun,
  Moon,
  Share2,
} from 'lucide-react';
import { BusinessConfig, fetchBusinessConfig } from './services/api';
import { ChatInterface } from './components/ChatInterface';
import { WhatsAppSimulator } from './components/WhatsAppSimulator';
import { IntegrationHub } from './components/IntegrationHub';
import { KnowledgeBaseModal } from './components/KnowledgeBaseModal';
import { ShareTestModal } from './components/ShareTestModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<'chat' | 'simulator' | 'integration'>('chat');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [theme, setTheme] = useState<'day' | 'night'>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('lia_theme_mode');
      if (saved === 'day' || saved === 'night') return saved;
    }
    return 'night';
  });

  const [config, setConfig] = useState<BusinessConfig>({
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
    systemPromptAddendum: '',
  });
  const [hasApiKey, setHasApiKey] = useState(true);

  // Sync theme with DOM and localStorage
  useEffect(() => {
    localStorage.setItem('lia_theme_mode', theme);
    if (theme === 'night') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'night' ? 'day' : 'night'));
  };

  useEffect(() => {
    fetchBusinessConfig()
      .then((data) => {
        if (data.config) {
          setConfig(data.config);
        }
        setHasApiKey(data.hasApiKey);
      })
      .catch((err) => console.error('Erro ao buscar config:', err));
  }, []);

  // Support direct public links for clients (e.g. ?tab=simulator)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tabParam = params.get('tab') || params.get('view');
      if (tabParam === 'simulator' || tabParam === 'whatsapp') {
        setActiveTab('simulator');
      } else if (tabParam === 'integration' || tabParam === 'api') {
        setActiveTab('integration');
      } else if (tabParam === 'chat') {
        setActiveTab('chat');
      }
    }
  }, []);

  const isDay = theme === 'day';

  return (
    <div
      className={`min-h-screen flex flex-col selection:bg-emerald-500 selection:text-slate-950 transition-colors duration-200 overflow-x-hidden w-full max-w-full ${
        isDay ? 'bg-[#f4f6fa] text-slate-800' : 'bg-[#0e0f14] text-slate-100'
      }`}
    >
      {/* Top Navigation Bar */}
      <header
        className={`sticky top-0 z-40 backdrop-blur-md px-3 sm:px-4 py-2.5 sm:py-3 border-b transition-colors overflow-x-hidden ${
          isDay
            ? 'bg-white/95 border-slate-200 shadow-2xs'
            : 'bg-[#13151f]/95 border-slate-800 shadow-md'
        }`}
      >
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-2.5 sm:gap-3">
          {/* Top Row: Logo, Title & Right Actions (always fits 100% on mobile) */}
          <div className="flex items-center justify-between w-full md:w-auto gap-2">
            {/* Logo / Brand */}
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-xl overflow-hidden shadow-sm flex items-center justify-center shrink-0 border ${
                  isDay ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-700'
                }`}
              >
                <img
                  src="/lia-avatar.png"
                  alt="LIA"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-500" />
              </div>

              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <span
                    className={`font-extrabold text-sm sm:text-base tracking-tight truncate ${
                      isDay ? 'text-slate-900' : 'text-white'
                    }`}
                  >
                    {config.botName}
                  </span>
                  <span
                    className={`px-1.5 py-0.2 rounded-full text-[9px] sm:text-[10px] font-bold border shrink-0 ${
                      isDay
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    }`}
                  >
                    WhatsApp Business
                  </span>
                </div>
                <span
                  className={`text-[10px] sm:text-[11px] block font-normal leading-tight truncate ${
                    isDay ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  {config.companyName}
                </span>
              </div>
            </div>

            {/* Mobile Actions: Share Link, Day/Night Toggle & Settings & WhatsApp Button */}
            <div className="flex items-center gap-1.5 shrink-0 md:hidden">
              <button
                onClick={() => setIsShareOpen(true)}
                className={`w-8 h-8 rounded-xl border transition flex items-center justify-center cursor-pointer active:scale-95 ${
                  isDay
                    ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300'
                    : 'bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 border-emerald-500/40'
                }`}
                title="Compartilhar Link de Teste com Clientes"
              >
                <Share2 className="w-4 h-4 text-emerald-500" />
              </button>

              {/* Day / Night Mode Switcher Button */}
              <button
                onClick={toggleTheme}
                className={`w-8 h-8 rounded-xl border transition flex items-center justify-center cursor-pointer active:scale-95 ${
                  isDay
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-[#1c1e2b] hover:bg-slate-800 text-amber-300 border-slate-800'
                }`}
                title={isDay ? 'Mudar para Modo Noite' : 'Mudar para Modo Dia'}
              >
                {isDay ? (
                  <Moon className="w-4 h-4 text-indigo-600 fill-indigo-100" />
                ) : (
                  <Sun className="w-4 h-4 text-amber-400 fill-amber-400" />
                )}
              </button>

              <button
                onClick={() => setIsSettingsOpen(true)}
                className={`w-8 h-8 rounded-xl border transition flex items-center justify-center ${
                  isDay
                    ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                    : 'bg-[#1c1e2b] hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
                }`}
                title="Configurações da LIA"
              >
                <Settings className="w-4 h-4 text-emerald-500" />
              </button>

              <a
                href={`https://wa.me/${config.businessPhone.replace(/\D/g, '')}?text=Olá!`}
                target="_blank"
                rel="noopener noreferrer"
                className={`w-8 h-8 rounded-xl border flex items-center justify-center transition ${
                  isDay
                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                    : 'bg-emerald-600/20 text-emerald-400 border-emerald-500/30'
                }`}
                title="Abrir no WhatsApp Oficial"
              >
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

          {/* Navigation Tabs (Full width grid on mobile, inline on desktop) */}
          <div
            className={`w-full md:w-auto grid grid-cols-3 md:flex items-center p-1 rounded-2xl border transition-colors shrink-0 ${
              isDay ? 'bg-slate-100 border-slate-200' : 'bg-[#1c1e2b] border-slate-800'
            }`}
          >
            <button
              onClick={() => setActiveTab('chat')}
              className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer text-center ${
                activeTab === 'chat'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : isDay
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">Chat LIA</span>
            </button>

            <button
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer text-center ${
                activeTab === 'simulator'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : isDay
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Smartphone className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">WhatsApp</span>
            </button>

            <button
              onClick={() => setActiveTab('integration')}
              className={`flex items-center justify-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer text-center ${
                activeTab === 'integration'
                  ? 'bg-emerald-500 text-slate-950 shadow-sm'
                  : isDay
                  ? 'text-slate-600 hover:text-slate-900'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Webhook className="w-3.5 h-3.5 shrink-0" />
              <span className="truncate">API</span>
            </button>
          </div>

          {/* Desktop Only Actions: Share Link, Theme Toggle, Settings & WhatsApp link */}
          <div className="hidden md:flex items-center gap-2 shrink-0">
            <button
              onClick={() => setIsShareOpen(true)}
              className={`px-3 py-1.5 rounded-xl border transition flex items-center gap-1.5 text-xs font-bold cursor-pointer active:scale-95 ${
                isDay
                  ? 'bg-emerald-500 hover:bg-emerald-600 text-white border-emerald-500 shadow-sm'
                  : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
              }`}
              title="Criar e Enviar Link Público para Clientes Testarem"
            >
              <Share2 className="w-3.5 h-3.5 shrink-0" />
              <span>Link para Clientes</span>
            </button>

            {/* Day / Night Mode Switcher Button */}
            <button
              onClick={toggleTheme}
              className={`px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 text-xs font-semibold cursor-pointer active:scale-95 ${
                isDay
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-[#1c1e2b] hover:bg-slate-800 text-amber-300 border-slate-800'
              }`}
              title={isDay ? 'Mudar para Modo Noite (Dark)' : 'Mudar para Modo Dia (Light)'}
            >
              {isDay ? (
                <>
                  <Moon className="w-4 h-4 text-indigo-600 fill-indigo-100" />
                  <span className="text-slate-700">Noite</span>
                </>
              ) : (
                <>
                  <Sun className="w-4 h-4 text-amber-400 fill-amber-400" />
                  <span className="text-amber-200">Dia</span>
                </>
              )}
            </button>

            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`px-2.5 py-1.5 rounded-xl border transition flex items-center gap-1.5 text-xs font-medium cursor-pointer ${
                isDay
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300'
                  : 'bg-[#1c1e2b] hover:bg-slate-800 text-slate-300 hover:text-white border-slate-800'
              }`}
              title="Configurações da LIA"
            >
              <Settings className="w-4 h-4 text-emerald-500" />
              <span>Ajustes</span>
            </button>

            <a
              href={`https://wa.me/${config.businessPhone.replace(/\D/g, '')}?text=Olá!`}
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                isDay
                  ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-200'
                  : 'bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border-emerald-500/30'
              }`}
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>WhatsApp</span>
            </a>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl w-full mx-auto p-4 md:p-6 flex flex-col justify-center">
        {activeTab === 'chat' && (
          <ChatInterface
            config={config}
            theme={theme}
            onOpenSettings={() => setIsSettingsOpen(true)}
            onOpenWhatsAppSimulator={() => setActiveTab('simulator')}
            onOpenShare={() => setIsShareOpen(true)}
          />
        )}

        {activeTab === 'simulator' && (
          <div className="py-2">
            <div className="text-center mb-4">
              <h2
                className={`text-lg font-bold flex items-center justify-center gap-2 ${
                  isDay ? 'text-slate-900' : 'text-white'
                }`}
              >
                <Smartphone className="w-5 h-5 text-emerald-500" />
                Simulador WhatsApp Business
              </h2>
              <p className={`text-xs max-w-md mx-auto ${isDay ? 'text-slate-500' : 'text-slate-400'}`}>
                Experimente a interação exatamente como ela acontece dentro do aplicativo oficial do WhatsApp no smartphone do cliente.
              </p>
            </div>
            <WhatsAppSimulator
              config={config}
              theme={theme}
              onOpenShare={() => setIsShareOpen(true)}
            />
          </div>
        )}

        {activeTab === 'integration' && (
          <IntegrationHub
            config={config}
            theme={theme}
            onConfigUpdated={(newCfg) => setConfig(newCfg)}
          />
        )}
      </main>

      {/* Footer */}
      <footer
        className={`border-t py-4 px-4 text-center text-xs transition-colors ${
          isDay ? 'border-slate-200 bg-white/50 text-slate-500' : 'border-slate-800/80 text-slate-500'
        }`}
      >
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span>{config.botName} Chatbot • {config.companyName}</span>
            <span className="w-1 h-1 rounded-full bg-slate-400"></span>
            <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 font-medium">
              <Shield className="w-3 h-3" /> Respostas automáticas via Google Gemini
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={toggleTheme}
              className={`font-medium transition flex items-center gap-1 ${
                isDay ? 'text-slate-600 hover:text-emerald-600' : 'text-slate-400 hover:text-emerald-400'
              }`}
            >
              {isDay ? <Moon className="w-3 h-3" /> : <Sun className="w-3 h-3" />}
              <span>{isDay ? 'Alternar para Modo Noite' : 'Alternar para Modo Dia'}</span>
            </button>
            <button
              onClick={() => setIsShareOpen(true)}
              className={`transition font-semibold flex items-center gap-1 ${
                isDay ? 'text-emerald-700 hover:text-emerald-800' : 'text-emerald-400 hover:text-emerald-300'
              }`}
            >
              <Share2 className="w-3 h-3" />
              <span>Link para Clientes</span>
            </button>
            <button
              onClick={() => setActiveTab('integration')}
              className={`transition ${isDay ? 'hover:text-emerald-600' : 'hover:text-emerald-400'}`}
            >
              Webhook WhatsApp
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`transition ${isDay ? 'hover:text-emerald-600' : 'hover:text-emerald-400'}`}
            >
              Base de Conhecimento
            </button>
          </div>
        </div>
      </footer>

      {/* Share Test Modal for Clients */}
      <ShareTestModal
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        config={config}
        theme={theme}
      />

      {/* Knowledge Base & Settings Modal */}
      <KnowledgeBaseModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        theme={theme}
        onConfigUpdated={(newCfg) => setConfig(newCfg)}
      />
    </div>
  );
}
