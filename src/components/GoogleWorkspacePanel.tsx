import React, { useState, useEffect } from 'react';
import {
  Calendar,
  FileSpreadsheet,
  MapPin,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  ExternalLink,
  RefreshCw,
  LogOut,
  AlertCircle,
  Sparkles,
  UserCheck,
  Send,
  Star,
  QrCode,
  Copy,
  Check,
  Globe,
  ShieldAlert,
} from 'lucide-react';
import { User } from 'firebase/auth';
import {
  initAuth,
  googleSignIn,
  logout,
  getAccessToken,
  listCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
  createLeadsSpreadsheet,
  appendLeadToSheet,
  fetchSheetLeads,
  CalendarEvent,
  LeadRow,
  activeFirebaseConfig,
} from '../services/googleWorkspace';
import { BusinessConfig } from '../services/api';

interface GoogleWorkspacePanelProps {
  config: BusinessConfig;
  theme: 'day' | 'night';
}

export const GoogleWorkspacePanel: React.FC<GoogleWorkspacePanelProps> = ({
  config,
  theme,
}) => {
  const isDay = theme === 'day';

  // Auth State
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [copiedDomain, setCopiedDomain] = useState(false);

  const currentDomain =
    typeof window !== 'undefined' && window.location.hostname
      ? window.location.hostname
      : 'agentelia.vercel.app';

  const copyCurrentDomain = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(currentDomain);
      setCopiedDomain(true);
      setTimeout(() => setCopiedDomain(false), 3000);
    }
  };

  const startDemoMode = () => {
    setIsDemoMode(true);
    setAuthError(null);
    setCurrentUser({
      displayName: 'Start Mkt Local (Modo Demonstração)',
      email: 'contato@startmktlocal.com.br',
      photoURL: '',
    } as any);
    setAccessToken('demo_access_token');
    setEvents([
      {
        id: 'demo-ev-1',
        summary: 'Consultoria Estratégica - Start Mkt Local',
        description: 'Alinhamento de implantação de Catálogo e Atendimento via IA LIA.',
        start: { dateTime: new Date(Date.now() + 86400000).toISOString() },
        end: { dateTime: new Date(Date.now() + 90000000).toISOString() },
        htmlLink: 'https://calendar.google.com',
      },
      {
        id: 'demo-ev-2',
        summary: 'Demonstração de Vendas - Super Limpo Produtos',
        description: 'Reunião comercial agendada pela LIA no WhatsApp.',
        start: { dateTime: new Date(Date.now() + 172800000).toISOString() },
        end: { dateTime: new Date(Date.now() + 176400000).toISOString() },
        htmlLink: 'https://calendar.google.com',
      },
    ]);
    const mockSheetId = 'demo-sheet-leads-lia';
    setSpreadsheetId(mockSheetId);
    setSheetUrl('https://docs.google.com/spreadsheets/d/demo-sheet-leads-lia/edit');
    setSheetRows([
      ['29/10/2026 14:20', 'Roberto Silva', '+55 67 99317-4612', 'Criação de Sites', 'Novo Lead (Qualificado)', 'Capturado via IA LIA • Atendimento Automático'],
      ['29/10/2026 15:45', 'Juliana Souza', '+55 67 99812-3344', 'Gestão de Tráfego', 'Agendamento Realizado', 'Capturado via IA LIA • Catálogo Interativo'],
      ['29/10/2026 17:10', 'Marcos Oliveira', '+55 67 99123-8899', 'Chatbot WhatsApp', 'Proposta Enviada', 'Capturado via IA LIA • Atendimento WhatsApp'],
    ]);
  };

  // Calendar State
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoadingEvents, setIsLoadingEvents] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [calendarSuccess, setCalendarSuccess] = useState<string | null>(null);

  // New Event Form
  const [newSummary, setNewSummary] = useState('Consultoria Estratégica - Start Mkt Local');
  const [newDate, setNewDate] = useState(() => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  });
  const [newTime, setNewTime] = useState('14:00');
  const [newAttendee, setNewAttendee] = useState('');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  // Sheets State
  const [spreadsheetId, setSpreadsheetId] = useState<string>(() => {
    return localStorage.getItem('lia_google_sheet_id') || '';
  });
  const [sheetUrl, setSheetUrl] = useState<string>(() => {
    return localStorage.getItem('lia_google_sheet_url') || '';
  });
  const [sheetRows, setSheetRows] = useState<string[][]>([]);
  const [isLoadingSheet, setIsLoadingSheet] = useState(false);
  const [sheetError, setSheetError] = useState<string | null>(null);
  const [sheetSuccess, setSheetSuccess] = useState<string | null>(null);
  const [isCreatingSheet, setIsCreatingSheet] = useState(false);

  // New Lead Form for Sheet
  const [leadName, setLeadName] = useState('Carlos Mendonça');
  const [leadPhone, setLeadPhone] = useState('+55 67 99988-7766');
  const [leadService, setLeadService] = useState('Criação de Sites');
  const [isAddingLead, setIsAddingLead] = useState(false);

  // Confirmation Modal state for mutations
  const [pendingAction, setPendingAction] = useState<{
    type: 'create_event' | 'delete_event' | 'create_sheet' | 'add_lead';
    title: string;
    description: string;
    payload?: any;
  } | null>(null);

  // Listen to auth
  useEffect(() => {
    const unsubscribe = initAuth(
      (user, token) => {
        if (!isDemoMode) {
          setCurrentUser(user);
          setAccessToken(token);
        }
      },
      () => {
        if (!isDemoMode) {
          setCurrentUser(null);
          setAccessToken(null);
        }
      }
    );
    return () => unsubscribe();
  }, [isDemoMode]);

  // When logged in, auto-load calendar events
  useEffect(() => {
    if (currentUser && accessToken && !isDemoMode) {
      loadCalendarEvents(accessToken);
      if (spreadsheetId) {
        loadSheetData(spreadsheetId, accessToken);
      }
    }
  }, [currentUser, accessToken, isDemoMode]);

  const handleSignIn = async () => {
    setIsLoggingIn(true);
    setAuthError(null);
    setIsDemoMode(false);
    try {
      const res = await googleSignIn();
      if (res) {
        setCurrentUser(res.user);
        setAccessToken(res.accessToken);
        loadCalendarEvents(res.accessToken);
      }
    } catch (err: any) {
      setAuthError(err.message || 'Erro ao conectar conta Google');
    } finally {
      setIsLoggingIn(false);
    }
  };

  const handleSignOut = async () => {
    if (!isDemoMode) {
      await logout();
    }
    setIsDemoMode(false);
    setCurrentUser(null);
    setAccessToken(null);
    setEvents([]);
  };

  const loadCalendarEvents = async (token?: string) => {
    if (isDemoMode) return;
    setIsLoadingEvents(true);
    setCalendarError(null);
    try {
      const activeToken = token || accessToken;
      if (!activeToken) return;
      const items = await listCalendarEvents(activeToken);
      setEvents(items);
    } catch (err: any) {
      setCalendarError(err.message || 'Falha ao carregar eventos da agenda');
    } finally {
      setIsLoadingEvents(false);
    }
  };

  const requestCreateEvent = () => {
    if (!newSummary.trim() || !newDate || !newTime) {
      alert('Por favor, informe o título, data e horário da reunião.');
      return;
    }

    const startDateTime = new Date(`${newDate}T${newTime}:00`).toISOString();
    const endDate = new Date(new Date(`${newDate}T${newTime}:00`).getTime() + 45 * 60000);
    const endDateTime = endDate.toISOString();

    setPendingAction({
      type: 'create_event',
      title: 'Confirmar Agendamento no Google Calendar',
      description: `Deseja agendar a consulta "${newSummary}" para ${new Date(
        startDateTime
      ).toLocaleString('pt-BR')} (duração: 45 minutos) na sua Google Agenda primária?`,
      payload: {
        summary: newSummary,
        description: `Agendamento realizado via IA LIA • Start Mkt Local\nCliente: ${
          newAttendee || 'Não informado'
        }`,
        startDateTime,
        endDateTime,
        attendeeEmail: newAttendee || undefined,
      },
    });
  };

  const requestDeleteEvent = (eventId: string, summary: string) => {
    setPendingAction({
      type: 'delete_event',
      title: 'Excluir Evento da Google Agenda?',
      description: `Você tem certeza que deseja remover o evento "${summary}" da sua agenda? Esta ação não pode ser desfeita.`,
      payload: { eventId },
    });
  };

  const requestCreateSheet = () => {
    setPendingAction({
      type: 'create_sheet',
      title: 'Criar Planilha de Leads no Google Sheets?',
      description:
        'Será criada uma nova planilha no seu Google Drive intitulada "Leads & Atendimentos LIA - Start Mkt Local" com as colunas estruturadas para receber contatos capturados pelo Chatbot e WhatsApp.',
    });
  };

  const requestAddLead = () => {
    if (!spreadsheetId) {
      alert('Primeiro crie ou selecione uma planilha do Google Sheets.');
      return;
    }
    setPendingAction({
      type: 'add_lead',
      title: 'Gravar Lead na Planilha Google Sheets?',
      description: `Adicionar o lead "${leadName}" (${leadPhone}) referente a "${leadService}" na planilha do Google Sheets?`,
      payload: {
        date: new Date().toLocaleString('pt-BR'),
        name: leadName,
        phone: leadPhone,
        service: leadService,
        status: 'Novo Lead (Qualificado)',
        notes: 'Capturado via IA LIA • Atendimento Automático',
      },
    });
  };

  const executeConfirmedAction = async () => {
    if (!pendingAction) return;
    const action = pendingAction;
    setPendingAction(null);

    // If running in interactive demo mode, simulate responses instantly
    if (isDemoMode) {
      if (action.type === 'create_event') {
        setIsCreatingEvent(true);
        const newEv: CalendarEvent = {
          id: `demo-${Date.now()}`,
          summary: action.payload.summary,
          description: action.payload.description,
          start: { dateTime: action.payload.startDateTime },
          end: { dateTime: action.payload.endDateTime },
          htmlLink: 'https://calendar.google.com',
        };
        setEvents((prev) => [newEv, ...prev]);
        setCalendarSuccess('Evento simulado criado com sucesso na Agenda!');
        setTimeout(() => setCalendarSuccess(null), 4000);
        setIsCreatingEvent(false);
      } else if (action.type === 'delete_event') {
        setEvents((prev) => prev.filter((ev) => ev.id !== action.payload.eventId));
        setCalendarSuccess('Evento removido da agenda!');
        setTimeout(() => setCalendarSuccess(null), 4000);
      } else if (action.type === 'create_sheet') {
        setIsCreatingSheet(true);
        const demoId = `demo-sheet-${Date.now()}`;
        setSpreadsheetId(demoId);
        setSheetUrl('https://docs.google.com/spreadsheets/d/demo/edit');
        setSheetSuccess('Planilha simulada de Leads criada com sucesso!');
        setTimeout(() => setSheetSuccess(null), 4000);
        setIsCreatingSheet(false);
      } else if (action.type === 'add_lead') {
        setIsAddingLead(true);
        setSheetRows((prev) => [
          [
            action.payload.date,
            action.payload.name,
            action.payload.phone,
            action.payload.service,
            action.payload.status,
            action.payload.notes,
          ],
          ...prev,
        ]);
        setSheetSuccess('Lead gravado com sucesso na planilha simulada!');
        setTimeout(() => setSheetSuccess(null), 4000);
        setIsAddingLead(false);
      }
      return;
    }

    try {
      if (action.type === 'create_event') {
        setIsCreatingEvent(true);
        setCalendarError(null);
        await createCalendarEvent(action.payload, accessToken || undefined);
        setCalendarSuccess('Evento criado com sucesso na sua Google Agenda!');
        setTimeout(() => setCalendarSuccess(null), 4000);
        await loadCalendarEvents();
      } else if (action.type === 'delete_event') {
        setCalendarError(null);
        await deleteCalendarEvent(action.payload.eventId, accessToken || undefined);
        setCalendarSuccess('Evento removido da agenda!');
        setTimeout(() => setCalendarSuccess(null), 4000);
        await loadCalendarEvents();
      } else if (action.type === 'create_sheet') {
        setIsCreatingSheet(true);
        setSheetError(null);
        const res = await createLeadsSpreadsheet(
          'Leads & Atendimentos LIA - Start Mkt Local',
          accessToken || undefined
        );
        setSpreadsheetId(res.spreadsheetId);
        setSheetUrl(res.spreadsheetUrl);
        localStorage.setItem('lia_google_sheet_id', res.spreadsheetId);
        localStorage.setItem('lia_google_sheet_url', res.spreadsheetUrl);
        setSheetSuccess('Planilha criada com sucesso no seu Google Drive!');
        setTimeout(() => setSheetSuccess(null), 4000);
        await loadSheetData(res.spreadsheetId);
      } else if (action.type === 'add_lead') {
        setIsAddingLead(true);
        setSheetError(null);
        await appendLeadToSheet(spreadsheetId, action.payload, accessToken || undefined);
        setSheetSuccess('Lead registrado com sucesso na sua planilha!');
        setTimeout(() => setSheetSuccess(null), 4000);
        await loadSheetData(spreadsheetId);
      }
    } catch (err: any) {
      alert(`Erro ao executar ação: ${err.message || 'Falha na conexão com Google'}`);
    } finally {
      setIsCreatingEvent(false);
      setIsCreatingSheet(false);
      setIsAddingLead(false);
    }
  };

  const loadSheetData = async (id: string, token?: string) => {
    if (isDemoMode) return;
    if (!id) return;
    setIsLoadingSheet(true);
    setSheetError(null);
    try {
      const activeToken = token || accessToken;
      if (!activeToken) return;
      const rows = await fetchSheetLeads(id, activeToken);
      setSheetRows(rows);
    } catch (err: any) {
      setSheetError(err.message || 'Não foi possível carregar dados da planilha.');
    } finally {
      setIsLoadingSheet(false);
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto py-2">
      {/* Header Banner */}
      <div
        className={`p-6 rounded-3xl border transition-all ${
          isDay
            ? 'bg-white border-slate-200 shadow-sm'
            : 'bg-[#13151f] border-slate-800 shadow-xl'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-lg shadow-emerald-500/20">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-extrabold tracking-tight">
                  Integração Google Workspace & Meu Negócio
                </h1>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  Google Verified
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDay ? 'text-slate-500' : 'text-slate-400'}`}>
                Conecte a IA LIA ao Google Agenda para marcar consultas e ao Google Sheets para gravar leads automaticamente.
              </p>
            </div>
          </div>

          {/* Google Auth Status / Button */}
          <div className="flex flex-col items-start md:items-end gap-2">
            {!currentUser ? (
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2">
                <button
                  onClick={handleSignIn}
                  disabled={isLoggingIn}
                  className="gsi-material-button flex items-center gap-3 px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-[#1a1c29] text-slate-800 dark:text-slate-100 font-semibold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  <svg
                    version="1.1"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 48 48"
                    className="w-4 h-4 shrink-0"
                  >
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    ></path>
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    ></path>
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    ></path>
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    ></path>
                  </svg>
                  <span>{isLoggingIn ? 'Conectando...' : 'Entrar com Google'}</span>
                </button>
                <button
                  type="button"
                  onClick={startDemoMode}
                  className="px-3 py-2 rounded-xl text-xs font-semibold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 flex items-center gap-1.5 transition cursor-pointer"
                  title="Testar recursos sem precisar de login"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Modo Demonstração</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {currentUser.photoURL ? (
                    <img
                      src={currentUser.photoURL}
                      alt={currentUser.displayName || ''}
                      className="w-8 h-8 rounded-full border border-emerald-500"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold text-xs">
                      {isDemoMode ? <Sparkles className="w-4 h-4" /> : currentUser.email?.[0]?.toUpperCase()}
                    </div>
                  )}
                  <div className="text-left">
                    <div className="text-xs font-bold leading-none truncate max-w-[180px] flex items-center gap-1.5">
                      <span>{currentUser.displayName || 'Conta Conectada'}</span>
                      {isDemoMode && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          Demo
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-emerald-500 font-medium truncate max-w-[180px]">
                      {currentUser.email}
                    </div>
                  </div>
                </div>
                <button
                  onClick={handleSignOut}
                  className="p-2 rounded-xl border border-slate-300 dark:border-slate-700 hover:bg-rose-500/10 hover:text-rose-400 transition cursor-pointer"
                  title={isDemoMode ? 'Sair do Modo Demonstração' : 'Desconectar Conta Google'}
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Auth Error Banner & Resolution Guide */}
        {authError && (
          <div className="mt-5">
            {authError.toLowerCase().includes('unauthorized-domain') ? (
              <div className="p-4 sm:p-5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-200">
                <div className="flex items-start gap-3">
                  <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-sm font-bold text-amber-300">
                          Domínio da Vercel precisa de autorização no Firebase
                        </h3>
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 font-mono">
                          auth/unauthorized-domain
                        </span>
                      </div>
                      <p className="text-xs text-amber-100/90 mt-1 leading-relaxed">
                        Por segurança, o Google/Firebase bloqueia o login quando o site roda em um domínio que ainda não foi cadastrado na lista de <strong>Domínios Autorizados</strong> do Firebase Authentication.
                      </p>
                    </div>

                    {/* Domain badge & copy button */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <span className="text-xs font-semibold text-slate-300">Seu domínio atual:</span>
                      <div className="flex items-center gap-2 bg-black/40 px-3 py-1.5 rounded-lg border border-amber-500/30 font-mono text-xs text-white">
                        <Globe className="w-3.5 h-3.5 text-amber-400" />
                        <span>{currentDomain}</span>
                        <button
                          type="button"
                          onClick={copyCurrentDomain}
                          className="ml-2 px-2.5 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-[11px] font-sans font-medium flex items-center gap-1 transition cursor-pointer"
                        >
                          {copiedDomain ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-400" />
                              <span className="text-emerald-400 font-bold">Copiado!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span>Copiar Domínio</span>
                            </>
                          )}
                        </button>
                      </div>
                    </div>

                    {/* Step-by-step instructions */}
                    <div className="bg-black/30 rounded-xl p-3 border border-amber-500/20 space-y-2 text-xs">
                      <div className="font-semibold text-amber-300">Como autorizar em 3 passos:</div>
                      <ol className="list-decimal list-inside space-y-1.5 text-slate-300">
                        <li>
                          Acesse o{' '}
                          <a
                            href={`https://console.firebase.google.com/project/${activeFirebaseConfig.projectId}/authentication/settings`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-amber-400 underline font-medium hover:text-amber-300 inline-flex items-center gap-1"
                          >
                            Firebase Console ➔ Authentication ➔ Settings <ExternalLink className="w-3 h-3" />
                          </a>
                        </li>
                        <li>
                          Na aba <strong>Configurações (Settings)</strong>, localize a seção <strong>Domínios autorizados (Authorized domains)</strong>.
                        </li>
                        <li>
                          Clique em <strong>Adicionar domínio</strong>, cole <code className="bg-black/50 px-1.5 py-0.5 rounded text-amber-300">{currentDomain}</code> e clique em <strong>Salvar</strong>.
                        </li>
                      </ol>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-2 flex flex-wrap items-center gap-3">
                      <button
                        type="button"
                        onClick={startDemoMode}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-bold text-xs shadow-md transition cursor-pointer"
                      >
                        <Sparkles className="w-4 h-4 text-emerald-200" />
                        <span>Ativar Modo Demonstração (Ver Recursos Sem Login)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setAuthError(null)}
                        className="text-xs text-slate-400 hover:text-white underline cursor-pointer"
                      >
                        Fechar aviso
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{authError}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Grid of Google Capabilities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1: GOOGLE CALENDAR */}
        <div
          className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
            isDay ? 'bg-white border-slate-200' : 'bg-[#13151f] border-slate-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-blue-500/15 text-blue-500 flex items-center justify-center font-bold">
                  <Calendar className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold flex items-center gap-1.5">
                    Google Agenda (Calendar)
                    <span className="text-[10px] font-normal px-2 py-0.2 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      Consultas
                    </span>
                  </h2>
                  <p className={`text-[11px] ${isDay ? 'text-slate-500' : 'text-slate-400'}`}>
                    Marque reuniões de consultoria diretamente na sua agenda.
                  </p>
                </div>
              </div>

              {currentUser && (
                <button
                  onClick={() => loadCalendarEvents()}
                  disabled={isLoadingEvents}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-white transition"
                  title="Atualizar eventos"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingEvents ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>

            {calendarSuccess && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{calendarSuccess}</span>
              </div>
            )}

            {calendarError && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{calendarError}</span>
              </div>
            )}

            {!currentUser ? (
              <div className="py-8 text-center border border-dashed rounded-2xl border-slate-300 dark:border-slate-800 my-2">
                <Calendar className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-slate-400 mb-3">
                  Faça login com sua conta Google acima para gerenciar os agendamentos.
                </p>
                <button
                  onClick={handleSignIn}
                  className="px-3 py-1.5 rounded-xl bg-blue-500 text-white font-bold text-xs hover:bg-blue-600 transition"
                >
                  Conectar Google Agenda
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Event Creation Form */}
                <div
                  className={`p-3.5 rounded-2xl border ${
                    isDay ? 'bg-slate-50 border-slate-200' : 'bg-[#181a26] border-slate-800'
                  }`}
                >
                  <h3 className="text-xs font-bold mb-2.5 flex items-center gap-1.5 text-blue-400">
                    <Plus className="w-3.5 h-3.5" />
                    Agendar Nova Reunião com Cliente
                  </h3>
                  <div className="space-y-2">
                    <input
                      type="text"
                      value={newSummary}
                      onChange={(e) => setNewSummary(e.target.value)}
                      placeholder="Título da reunião"
                      className={`w-full text-xs px-3 py-2 rounded-xl border outline-none ${
                        isDay
                          ? 'bg-white border-slate-300 text-slate-800'
                          : 'bg-[#11121a] border-slate-700 text-slate-200'
                      }`}
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <input
                        type="date"
                        value={newDate}
                        onChange={(e) => setNewDate(e.target.value)}
                        className={`text-xs px-2.5 py-1.5 rounded-xl border outline-none ${
                          isDay
                            ? 'bg-white border-slate-300 text-slate-800'
                            : 'bg-[#11121a] border-slate-700 text-slate-200'
                        }`}
                      />
                      <input
                        type="time"
                        value={newTime}
                        onChange={(e) => setNewTime(e.target.value)}
                        className={`text-xs px-2.5 py-1.5 rounded-xl border outline-none ${
                          isDay
                            ? 'bg-white border-slate-300 text-slate-800'
                            : 'bg-[#11121a] border-slate-700 text-slate-200'
                        }`}
                      />
                    </div>
                    <input
                      type="email"
                      value={newAttendee}
                      onChange={(e) => setNewAttendee(e.target.value)}
                      placeholder="E-mail do cliente (convite automático)"
                      className={`w-full text-xs px-3 py-2 rounded-xl border outline-none ${
                        isDay
                          ? 'bg-white border-slate-300 text-slate-800'
                          : 'bg-[#11121a] border-slate-700 text-slate-200'
                      }`}
                    />
                    <button
                      onClick={requestCreateEvent}
                      disabled={isCreatingEvent}
                      className="w-full mt-1 py-2 px-3 rounded-xl bg-blue-500 hover:bg-blue-600 text-white font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Agendar no Google Calendar</span>
                    </button>
                  </div>
                </div>

                {/* Upcoming Events List */}
                <div>
                  <h4 className="text-xs font-bold mb-2 flex items-center justify-between">
                    <span>Próximas Reuniões na Agenda</span>
                    <span className="text-[10px] text-slate-400">{events.length} eventos</span>
                  </h4>
                  {events.length === 0 ? (
                    <div className="p-3 text-center text-xs text-slate-400 border border-dashed rounded-xl border-slate-300 dark:border-slate-800">
                      Nenhum agendamento futuro encontrado.
                    </div>
                  ) : (
                    <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                      {events.map((evt) => {
                        const start = evt.start?.dateTime
                          ? new Date(evt.start.dateTime).toLocaleString('pt-BR', {
                              day: '2-digit',
                              month: '2-digit',
                              hour: '2-digit',
                              minute: '2-digit',
                            })
                          : evt.start?.date || '';
                        return (
                          <div
                            key={evt.id}
                            className={`p-2.5 rounded-xl border flex items-center justify-between text-xs transition ${
                              isDay
                                ? 'bg-slate-50 border-slate-200'
                                : 'bg-[#161824] border-slate-800/80'
                            }`}
                          >
                            <div className="min-w-0 pr-2">
                              <div className="font-semibold truncate">{evt.summary}</div>
                              <div className="text-[10px] text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-blue-400" />
                                <span>{start}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              {evt.htmlLink && (
                                <a
                                  href={evt.htmlLink}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="p-1 rounded text-slate-400 hover:text-blue-400"
                                  title="Abrir no Google Calendar"
                                >
                                  <ExternalLink className="w-3.5 h-3.5" />
                                </a>
                              )}
                              <button
                                onClick={() => requestDeleteEvent(evt.id, evt.summary)}
                                className="p-1 rounded text-slate-400 hover:text-rose-400"
                                title="Excluir evento"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* SECTION 2: GOOGLE SHEETS */}
        <div
          className={`p-5 rounded-3xl border transition-all flex flex-col justify-between ${
            isDay ? 'bg-white border-slate-200' : 'bg-[#13151f] border-slate-800'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-500/15 text-emerald-500 flex items-center justify-center font-bold">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-sm font-bold flex items-center gap-1.5">
                    Google Sheets (Planilhas de Leads)
                    <span className="text-[10px] font-normal px-2 py-0.2 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      CRM
                    </span>
                  </h2>
                  <p className={`text-[11px] ${isDay ? 'text-slate-500' : 'text-slate-400'}`}>
                    Armazene leads, contatos e serviços de interesse em tempo real.
                  </p>
                </div>
              </div>

              {currentUser && spreadsheetId && (
                <button
                  onClick={() => loadSheetData(spreadsheetId)}
                  disabled={isLoadingSheet}
                  className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-white transition"
                  title="Atualizar dados da planilha"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoadingSheet ? 'animate-spin' : ''}`} />
                </button>
              )}
            </div>

            {sheetSuccess && (
              <div className="mb-3 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{sheetSuccess}</span>
              </div>
            )}

            {sheetError && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{sheetError}</span>
              </div>
            )}

            {!currentUser ? (
              <div className="py-8 text-center border border-dashed rounded-2xl border-slate-300 dark:border-slate-800 my-2">
                <FileSpreadsheet className="w-8 h-8 text-slate-400 mx-auto mb-2 opacity-50" />
                <p className="text-xs text-slate-400 mb-3">
                  Faça login com o Google para salvar contatos em uma planilha automatizada.
                </p>
                <button
                  onClick={handleSignIn}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500 text-slate-950 font-bold text-xs hover:bg-emerald-400 transition"
                >
                  Conectar Google Sheets
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Spreadsheet Connection status */}
                {!spreadsheetId ? (
                  <div
                    className={`p-4 rounded-2xl border text-center ${
                      isDay ? 'bg-slate-50 border-slate-200' : 'bg-[#181a26] border-slate-800'
                    }`}
                  >
                    <FileSpreadsheet className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
                    <div className="text-xs font-bold mb-1">Nenhuma Planilha Conectada</div>
                    <p className="text-[11px] text-slate-400 mb-3">
                      Crie uma planilha no Google Drive para a LIA enviar contatos de clientes.
                    </p>
                    <button
                      onClick={requestCreateSheet}
                      disabled={isCreatingSheet}
                      className="px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 mx-auto transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{isCreatingSheet ? 'Criando Planilha...' : 'Criar Planilha de Leads'}</span>
                    </button>
                  </div>
                ) : (
                  <div
                    className={`p-3 rounded-2xl border flex items-center justify-between ${
                      isDay ? 'bg-emerald-50/60 border-emerald-200' : 'bg-emerald-500/10 border-emerald-500/30'
                    }`}
                  >
                    <div className="min-w-0 pr-2">
                      <div className="text-xs font-bold text-emerald-600 dark:text-emerald-400 truncate">
                        Leads & Atendimentos LIA
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono truncate max-w-[200px]">
                        ID: {spreadsheetId}
                      </div>
                    </div>
                    {sheetUrl && (
                      <a
                        href={sheetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1.5 rounded-lg bg-emerald-500 text-slate-950 font-bold text-[11px] flex items-center gap-1 hover:bg-emerald-400 transition shrink-0"
                      >
                        <ExternalLink className="w-3 h-3" />
                        <span>Abrir Sheets</span>
                      </a>
                    )}
                  </div>
                )}

                {/* Quick Add Lead Form */}
                {spreadsheetId && (
                  <div
                    className={`p-3.5 rounded-2xl border ${
                      isDay ? 'bg-slate-50 border-slate-200' : 'bg-[#181a26] border-slate-800'
                    }`}
                  >
                    <h3 className="text-xs font-bold mb-2 flex items-center gap-1.5 text-emerald-400">
                      <UserCheck className="w-3.5 h-3.5" />
                      Registrar Lead Manual ou Teste
                    </h3>
                    <div className="space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={leadName}
                          onChange={(e) => setLeadName(e.target.value)}
                          placeholder="Nome do cliente"
                          className={`text-xs px-2.5 py-1.5 rounded-xl border outline-none ${
                            isDay
                              ? 'bg-white border-slate-300 text-slate-800'
                              : 'bg-[#11121a] border-slate-700 text-slate-200'
                          }`}
                        />
                        <input
                          type="text"
                          value={leadPhone}
                          onChange={(e) => setLeadPhone(e.target.value)}
                          placeholder="Telefone / WhatsApp"
                          className={`text-xs px-2.5 py-1.5 rounded-xl border outline-none ${
                            isDay
                              ? 'bg-white border-slate-300 text-slate-800'
                              : 'bg-[#11121a] border-slate-700 text-slate-200'
                          }`}
                        />
                      </div>
                      <select
                        value={leadService}
                        onChange={(e) => setLeadService(e.target.value)}
                        className={`w-full text-xs px-2.5 py-1.5 rounded-xl border outline-none ${
                          isDay
                            ? 'bg-white border-slate-300 text-slate-800'
                            : 'bg-[#11121a] border-slate-700 text-slate-200'
                        }`}
                      >
                        <option value="Criação de Sites">Criação de Sites (R$ 500+)</option>
                        <option value="Gestor Google Meu Negócio">Gestor Google Meu Negócio</option>
                        <option value="Criação de Biosites com IA">Biosite com IA (R$ 167)</option>
                        <option value="Gestor de Tráfego Meta Ads">Gestor de Tráfego Meta Ads</option>
                        <option value="Agente de IA WhatsApp">Agente de IA WhatsApp</option>
                        <option value="Avaliacard Cartão NFC Google">Avaliacard NFC Google (R$ 89)</option>
                      </select>
                      <button
                        onClick={requestAddLead}
                        disabled={isAddingLead}
                        className="w-full py-1.5 px-3 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-1.5 transition cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Adicionar Linha na Planilha</span>
                      </button>
                    </div>
                  </div>
                )}

                {/* Recent Sheet Rows Preview */}
                {spreadsheetId && sheetRows.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold mb-1.5 flex items-center justify-between">
                      <span>Últimas Linhas na Planilha</span>
                      <span className="text-[10px] text-slate-400">{sheetRows.length} linhas</span>
                    </h4>
                    <div className="max-h-36 overflow-y-auto border rounded-xl overflow-hidden border-slate-200 dark:border-slate-800 text-[10px]">
                      <table className="w-full text-left">
                        <thead
                          className={`${
                            isDay ? 'bg-slate-100 text-slate-700' : 'bg-[#1c1e2b] text-slate-300'
                          }`}
                        >
                          <tr>
                            <th className="p-1.5">Data</th>
                            <th className="p-1.5">Cliente</th>
                            <th className="p-1.5">WhatsApp</th>
                            <th className="p-1.5">Serviço</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                          {sheetRows.slice(1).map((row, idx) => (
                            <tr key={idx} className="hover:bg-slate-500/5">
                              <td className="p-1.5 truncate max-w-[70px]">{row[0]}</td>
                              <td className="p-1.5 font-semibold truncate max-w-[80px]">{row[1]}</td>
                              <td className="p-1.5 truncate max-w-[80px]">{row[2]}</td>
                              <td className="p-1.5 truncate max-w-[100px] text-emerald-400 font-medium">
                                {row[3]}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* SECTION 3: GOOGLE MEU NEGÓCIO & AVALIACARD NFC */}
      <div
        className={`p-6 rounded-3xl border transition-all ${
          isDay ? 'bg-white border-slate-200 shadow-sm' : 'bg-[#13151f] border-slate-800 shadow-xl'
        }`}
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/15 text-amber-500 flex items-center justify-center font-bold">
              <MapPin className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold">
                  Google Meu Negócio & AvaliaCard NFC
                </h2>
                <span className="px-2 py-0.2 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  Reputação & Avaliações 5 Estrelas
                </span>
              </div>
              <p className={`text-xs mt-0.5 ${isDay ? 'text-slate-500' : 'text-slate-400'}`}>
                Como a IA LIA potencia o Google Meu Negócio dos seus clientes no Brasil todo.
              </p>
            </div>
          </div>

          <a
            href="https://avaliacard.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition shadow-sm"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Ver Modelo AvaliaCard</span>
          </a>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className={`p-4 rounded-2xl border ${
              isDay ? 'bg-slate-50 border-slate-200' : 'bg-[#181a26] border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-amber-400 mb-1.5">
              <Star className="w-4 h-4 fill-amber-400" />
              <span>AvaliaCard NFC (R$ 89,00)</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Cartão físico de aproximação NFC + QR Code. Ao aproximar o celular no balcão, abre diretamente a página de avaliação 5 estrelas do Google.
            </p>
          </div>

          <div
            className={`p-4 rounded-2xl border ${
              isDay ? 'bg-slate-50 border-slate-200' : 'bg-[#181a26] border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-blue-400 mb-1.5">
              <MapPin className="w-4 h-4" />
              <span>Gestão de Perfil Google</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Otimização de SEO local, fotos profissionais, respostas a clientes, catálogo e ranqueamento no topo do mapa para atrair clientes locais.
            </p>
          </div>

          <div
            className={`p-4 rounded-2xl border ${
              isDay ? 'bg-slate-50 border-slate-200' : 'bg-[#181a26] border-slate-800'
            }`}
          >
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-400 mb-1.5">
              <QrCode className="w-4 h-4" />
              <span>Respostas da LIA no Chat</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Quando o cliente pergunta por avaliações ou endereço, a LIA envia o link direto clicável do site oficial, WhatsApp e AvaliaCard.
            </p>
          </div>
        </div>
      </div>

      {/* MANDATORY USER CONFIRMATION MODAL FOR WORKSPACE MUTATIONS */}
      {pendingAction && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4">
          <div
            className={`max-w-md w-full p-6 rounded-3xl border shadow-2xl animate-in fade-in zoom-in duration-150 ${
              isDay ? 'bg-white border-slate-200 text-slate-900' : 'bg-[#181a26] border-slate-700 text-white'
            }`}
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-500 flex items-center justify-center">
                <AlertCircle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold leading-snug">{pendingAction.title}</h3>
            </div>

            <p className="text-xs text-slate-400 mb-6 leading-relaxed">
              {pendingAction.description}
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                onClick={() => setPendingAction(null)}
                className="px-4 py-2 rounded-xl border border-slate-300 dark:border-slate-700 text-xs font-semibold hover:bg-slate-100 dark:hover:bg-slate-800 transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                onClick={executeConfirmedAction}
                className="px-4 py-2 rounded-xl bg-blue-500 hover:bg-blue-600 text-white text-xs font-bold transition shadow-md cursor-pointer"
              >
                Confirmar e Executar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
