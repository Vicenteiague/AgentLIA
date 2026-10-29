import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Phone,
  Video,
  MoreVertical,
  Paperclip,
  Smile,
  Mic,
  MicOff,
  CheckCheck,
  Bot,
  ExternalLink,
  ShieldCheck,
  Play,
  Pause,
  RotateCcw,
  Share2,
  Trash2,
  AlertCircle,
  X,
} from 'lucide-react';
import { BusinessConfig, ChatMessage, sendChatMessage, fetchAudioTts, sendChatAudio } from '../services/api';
import { VoiceNoteBubble } from './VoiceNoteBubble';
import { AudioPlayer } from './AudioPlayer';
import { FormattedMessageText } from './FormattedMessageText';
import { createSampleVoiceAudioUrl } from '../utils/audioHelper';

interface WhatsAppSimulatorProps {
  config: BusinessConfig;
  theme?: 'day' | 'night';
  onOpenShare?: () => void;
}

export const WhatsAppSimulator: React.FC<WhatsAppSimulatorProps> = ({
  config,
  theme = 'night',
  onOpenShare,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'wa-msg-1',
      role: 'assistant',
      text: `Olá! Eu sou a ${config.botName}, especialista de atendimento e vendas da **${config.companyName}**. Estou aqui para tirar dúvidas sobre nossos serviços de Marketing Digital e alavancar suas vendas. Como posso te ajudar hoje?`,
      timestamp: '08:35',
      status: 'read',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false);
  const recognitionRef = useRef<any>(null);
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // Ignore
        }
      }
    };
  }, []);

  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [micErrorNotice, setMicErrorNotice] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  const getBestMimeType = (): string => {
    if (typeof MediaRecorder === 'undefined') return 'audio/webm';
    const candidates = [
      'audio/webm;codecs=opus',
      'audio/webm',
      'audio/mp4',
      'audio/ogg;codecs=opus',
      'audio/ogg',
      'audio/wav',
    ];
    for (const mime of candidates) {
      if (MediaRecorder.isTypeSupported(mime)) return mime;
    }
    return '';
  };

  const startVoiceRecording = async () => {
    setMicErrorNotice(null);

    // Verify browser support
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setMicErrorNotice('Seu navegador não oferece suporte à captura de áudio direto.');
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      audioChunksRef.current = [];
      const chosenMime = getBestMimeType();
      const options = chosenMime ? { mimeType: chosenMime } : undefined;
      const mediaRecorder = options ? new MediaRecorder(stream, options) : new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
        const actualMime = mediaRecorder.mimeType || chosenMime || 'audio/webm';
        const audioBlob = new Blob(audioChunksRef.current, { type: actualMime });
        const audioUrl = URL.createObjectURL(audioBlob);

        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64Data = reader.result as string;
          await handleSendRecordedAudio(audioUrl, base64Data, actualMime);
        };
        reader.readAsDataURL(audioBlob);
      };

      // Collect data chunks every 250ms
      mediaRecorder.start(250);
      setIsRecordingAudio(true);
      setRecordingSeconds(0);
      timerRef.current = setInterval(() => {
        setRecordingSeconds((prev) => prev + 1);
      }, 1000);
    } catch (err: any) {
      console.warn('Erro ao acessar microfone:', err);
      const isPermission =
        err.name === 'NotAllowedError' ||
        err.name === 'PermissionDeniedError' ||
        err.name === 'SecurityError' ||
        err.message?.toLowerCase().includes('permission') ||
        err.message?.toLowerCase().includes('not allowed');

      if (isPermission) {
        setMicErrorNotice(
          'Permissão de microfone negada. Toque no ícone de permissões/cadeado da barra de endereço para permitir o microfone.'
        );
      } else {
        setMicErrorNotice(
          'Não foi possível iniciar o microfone no seu aparelho. Verifique se outro app está usando o microfone.'
        );
      }
    }
  };

  const cancelVoiceRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.ondataavailable = null;
      mediaRecorderRef.current.onstop = null;
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    setIsRecordingAudio(false);
    setRecordingSeconds(0);
  };

  const stopAndSendVoiceRecording = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
    }
    setIsRecordingAudio(false);
    setRecordingSeconds(0);
  };

  const handleSendRecordedAudio = async (
    audioUrl: string,
    base64Data: string,
    mimeType = 'audio/webm'
  ) => {
    const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const userAudioMsg: ChatMessage = {
      id: `wa-voice-${Date.now()}`,
      role: 'user',
      text: 'Mensagem de voz enviada',
      timestamp: timeStr,
      isVoiceNote: true,
      audioUrl: audioUrl,
      transcription: 'Interpretando áudio pelo Gemini...',
      status: 'sent',
    };

    setMessages((prev) => [...prev, userAudioMsg]);
    setIsLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role as 'user' | 'assistant',
        text: m.text,
      }));

      const res = await sendChatAudio(base64Data, mimeType, history);
      userAudioMsg.transcription = res.transcription;

      const liaAudioUrl = await fetchAudioTts(res.reply).catch(() => '');

      const botMsg: ChatMessage = {
        id: `wa-b-${Date.now()}`,
        role: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        needsHumanHandoff: res.needsHumanHandoff,
        audioUrl: liaAudioUrl,
        status: 'read',
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Erro áudio simulator:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (textToSend?: string) => {
    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const userMsg: ChatMessage = {
      id: `wa-u-${Date.now()}`,
      role: 'user',
      text,
      timestamp: timeStr,
      status: 'sent',
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role as 'user' | 'assistant',
        text: m.text,
      }));

      const res = await sendChatMessage(text, history);

      const botMsg: ChatMessage = {
        id: `wa-b-${Date.now()}`,
        role: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        needsHumanHandoff: res.needsHumanHandoff,
        status: 'read',
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        {
          id: `wa-err-${Date.now()}`,
          role: 'assistant',
          text: 'Desculpe, falha ao conectar com o serviço. Tente novamente!',
          timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendAudioSample = async (sampleQuestionText?: string) => {
    if (isLoading) return;

    const queryText =
      sampleQuestionText ||
      'Olá LIA! Gostaria de saber os valores para Criação de Sites e Biosite com IA.';

    const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const audioUrl = createSampleVoiceAudioUrl();

    const userAudioMsg: ChatMessage = {
      id: `wa-voice-${Date.now()}`,
      role: 'user',
      text: queryText,
      timestamp: timeStr,
      isVoiceNote: true,
      audioUrl: audioUrl,
      transcription: queryText,
      status: 'sent',
    };

    setMessages((prev) => [...prev, userAudioMsg]);
    setIsLoading(true);

    try {
      const history = messages.slice(-6).map((m) => ({
        role: m.role as 'user' | 'assistant',
        text: m.text,
      }));

      const res = await sendChatMessage(
        `[MENSAGEM DE ÁUDIO DO CLIENTE TRANSCRIÇÃO]: "${queryText}"`,
        history
      );

      const botMsg: ChatMessage = {
        id: `wa-b-${Date.now()}`,
        role: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        needsHumanHandoff: res.needsHumanHandoff,
        status: 'read',
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Erro áudio simulator:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const getDirectWhatsAppUrl = () => {
    const num = config.businessPhone.replace(/\D/g, '');
    return `https://wa.me/${num}?text=Olá,%20gostaria%20de%20conversar%20com%20a%20LIA%20sobre%20os%20serviços.`;
  };

  const isDay = theme === 'day';

  return (
    <div className="w-full max-w-md mx-auto flex flex-col font-sans">
      {/* Phone container frame */}
      <div
        className={`rounded-[36px] p-2.5 shadow-2xl border-4 overflow-hidden flex flex-col min-h-[680px] max-h-[85vh] transition-colors ${
          isDay
            ? 'bg-slate-300 border-slate-400/80 shadow-slate-300/60'
            : 'bg-slate-900 border-slate-700/80'
        }`}
      >
        {/* WhatsApp App Bar */}
        <div className="bg-[#075e54] text-white px-3.5 py-3 rounded-t-[26px] flex items-center justify-between shadow-md">
          <div className="flex items-center gap-2.5">
            <div className="relative">
              <div className="w-10 h-10 rounded-full overflow-hidden bg-slate-800 border border-white/30">
                <img
                  src="/lia-avatar.png"
                  alt="LIA Avatar"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <Bot className="w-5 h-5 text-emerald-300" />
              </div>
              <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-400 border-2 border-[#075e54] rounded-full"></span>
            </div>

            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <span className="font-semibold text-sm leading-tight">{config.botName}</span>
                <span className="bg-emerald-600/60 text-[10px] px-1.5 py-0.2 rounded font-medium text-emerald-200">
                  Business IA
                </span>
              </div>
              <span className="text-[11px] text-emerald-100/90 font-normal">
                {isLoading ? 'digitando...' : `Online • ${config.companyName}`}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 text-white/90">
            <button
              onClick={() => {
                setMessages([
                  {
                    id: `wa-init-${Date.now()}`,
                    role: 'assistant',
                    text: `Olá! Eu sou a ${config.botName}, especialista de atendimento e vendas da **${config.companyName}**. Como posso ajudar?`,
                    timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
                    status: 'read',
                  },
                ]);
              }}
              title="Reiniciar chat"
              className="p-1 hover:bg-white/10 rounded-full transition"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <Video className="w-4 h-4 cursor-pointer hover:opacity-80" />
            <Phone className="w-4 h-4 cursor-pointer hover:opacity-80" />
            <MoreVertical className="w-4 h-4 cursor-pointer hover:opacity-80" />
          </div>
        </div>

        {/* WhatsApp Chat Wallpaper & Body */}
        <div
          className={`flex-1 p-3 overflow-y-auto flex flex-col gap-2.5 relative transition-colors ${
            isDay ? 'bg-[#efeae2]' : 'bg-[#0b141a]'
          }`}
          style={{
            backgroundImage:
              'radial-gradient(circle at 50% 50%, rgba(0, 0, 0, 0.04) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }}
        >
          {/* Encryption Notice */}
          <div
            className={`self-center text-[10.5px] px-3 py-1.5 rounded-lg shadow-2xs max-w-[85%] text-center leading-tight flex items-center gap-1 border ${
              isDay
                ? 'bg-[#ffeecd] text-amber-900 border-amber-300/60'
                : 'bg-[#182229] text-amber-200 border-amber-300/40'
            }`}
          >
            <ShieldCheck className={`w-3.5 h-3.5 shrink-0 ${isDay ? 'text-amber-700' : 'text-amber-400'}`} />
            <span>As mensagens são protegidas com criptografia de ponta a ponta e inteligência artificial Google Gemini.</span>
          </div>

          {/* Quick Suggestions in WhatsApp */}
          <div className="flex items-center gap-1.5 overflow-x-auto py-1 scrollbar-none">
            <button
              onClick={() => handleSendAudioSample()}
              type="button"
              className={`shrink-0 text-xs px-2.5 py-1 rounded-full shadow-2xs border transition active:scale-95 whitespace-nowrap flex items-center gap-1 font-semibold ${
                isDay
                  ? 'bg-emerald-100 text-emerald-800 border-emerald-300 hover:bg-emerald-200'
                  : 'bg-emerald-900/40 text-emerald-300 border-emerald-700/60 hover:bg-emerald-900/60'
              }`}
            >
              <Mic className="w-3 h-3 text-emerald-500" />
              <span>🎙️ Áudio de Voz (Cliente)</span>
            </button>
            {config.quickQuestions.slice(0, 3).map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(q)}
                type="button"
                className={`shrink-0 text-xs px-2.5 py-1 rounded-full shadow-2xs border transition active:scale-95 whitespace-nowrap ${
                  isDay
                    ? 'bg-white text-slate-800 border-slate-300 hover:bg-slate-50'
                    : 'bg-[#1f2c34] text-slate-200 border-slate-700 hover:bg-[#283842]'
                }`}
              >
                {q}
              </button>
            ))}
          </div>

          {/* Messages */}
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex flex-col ${
                m.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              {m.isVoiceNote ? (
                <VoiceNoteBubble
                  isUser={m.role === 'user'}
                  audioUrl={m.audioUrl}
                  transcription={m.transcription}
                  timestamp={m.timestamp}
                  theme={theme}
                />
              ) : (
                <div
                  className={`max-w-[85%] rounded-lg p-2.5 shadow-2xs text-[13px] leading-relaxed relative ${
                    m.role === 'user'
                      ? isDay
                        ? 'bg-[#d9fdd3] text-slate-900 rounded-tr-none'
                        : 'bg-[#005c4b] text-slate-100 rounded-tr-none'
                      : isDay
                      ? 'bg-white text-slate-900 rounded-tl-none'
                      : 'bg-[#202c33] text-slate-100 rounded-tl-none'
                  }`}
                >
                  <FormattedMessageText
                    text={m.text}
                    isUser={m.role === 'user'}
                    theme={theme}
                    variant="whatsapp"
                  />

                  {/* Audio Player for LIA's voice in WhatsApp */}
                  {m.role === 'assistant' && (
                    <AudioPlayer
                      theme={theme}
                      variant="whatsapp"
                      text={m.text}
                      audioUrl={m.audioUrl}
                      onGenerateAudio={async () => {
                        const url = await fetchAudioTts(m.text);
                        m.audioUrl = url;
                        return url;
                      }}
                    />
                  )}

                {/* Human handoff card in WhatsApp */}
                {m.needsHumanHandoff && (
                  <div
                    className={`mt-2 pt-2 border-t flex flex-col gap-1.5 ${
                      isDay ? 'border-slate-200' : 'border-slate-700'
                    }`}
                  >
                    <span
                      className={`text-[11px] font-semibold ${
                        isDay ? 'text-emerald-700' : 'text-emerald-400'
                      }`}
                    >
                      👤 Transferência para Atendente
                    </span>
                    <a
                      href={getDirectWhatsAppUrl()}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-[#25d366] hover:bg-[#20bd5a] text-white text-xs font-semibold px-2.5 py-1.5 rounded flex items-center justify-center gap-1.5 transition active:scale-95 shadow-2xs"
                    >
                      <ExternalLink className="w-3 h-3" />
                      Chamar Atendente Humano
                    </a>
                  </div>
                )}

                <div
                  className={`flex items-center justify-end gap-1 text-[10px] mt-1 ${
                    isDay ? 'text-slate-500' : 'text-slate-400'
                  }`}
                >
                  <span>{m.timestamp}</span>
                  {m.role === 'user' && (
                    <CheckCheck className="w-3.5 h-3.5 text-[#53bdeb] inline" />
                  )}
                </div>
              </div>
            )}
          </div>
        ))}

          {/* Typing state in WhatsApp */}
          {isLoading && (
            <div
              className={`self-start px-3 py-2 rounded-lg rounded-tl-none shadow-2xs flex items-center gap-1.5 ${
                isDay ? 'bg-white text-slate-600' : 'bg-[#202c33] text-slate-400'
              }`}
            >
              <span className="text-xs">{config.botName} digitando</span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-bounce [animation-delay:-0.3s]"></span>
            </div>
          )}

          <div ref={endRef} />
        </div>

        {/* Mic Permission Warning Notice if blocked */}
        {micErrorNotice && (
          <div className="mx-2 mb-2 p-2.5 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex flex-col gap-1.5 animate-in fade-in duration-200">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-1.5 font-medium leading-tight">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
                <span>{micErrorNotice}</span>
              </div>
              <button
                onClick={() => setMicErrorNotice(null)}
                className="text-slate-400 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={() => {
                setMicErrorNotice(null);
                handleSendAudioSample();
              }}
              className="self-start text-[11px] font-bold px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 transition"
            >
              Testar com Áudio de Demonstração
            </button>
          </div>
        )}

        {/* WhatsApp Input Bar */}
        <div
          className={`px-2 py-2 flex items-center gap-2 rounded-b-[26px] ${
            isDay ? 'bg-[#f0f2f5]' : 'bg-[#202c33]'
          }`}
        >
          {isRecordingAudio ? (
            <div className="flex-1 flex items-center justify-between px-2 py-1">
              <div className="flex items-center gap-2 text-rose-500 font-semibold text-xs animate-pulse">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>Gravando áudio: {Math.floor(recordingSeconds / 60)}:{recordingSeconds % 60 < 10 ? '0' : ''}{recordingSeconds % 60}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={cancelVoiceRecording}
                  type="button"
                  className="p-1.5 text-slate-400 hover:text-rose-500 transition active:scale-95"
                  title="Cancelar gravação"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <button
                  onClick={stopAndSendVoiceRecording}
                  type="button"
                  className="w-8 h-8 rounded-full bg-[#00a884] hover:bg-[#008f6f] text-white flex items-center justify-center transition active:scale-95 shadow cursor-pointer"
                  title="Enviar áudio"
                >
                  <Send className="w-3.5 h-3.5 ml-0.5" />
                </button>
              </div>
            </div>
          ) : (
            <>
              <button
                type="button"
                className={`p-1 ${isDay ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Smile className="w-5 h-5" />
              </button>
              <button
                type="button"
                className={`p-1 ${isDay ? 'text-slate-500 hover:text-slate-700' : 'text-slate-400 hover:text-slate-200'}`}
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex-1 flex items-center"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Mensagem"
                  className={`w-full text-sm px-3 py-2 rounded-lg border-none focus:outline-none shadow-2xs ${
                    isDay
                      ? 'bg-white text-slate-900 placeholder-slate-400'
                      : 'bg-[#2a3942] text-slate-100 placeholder-slate-400'
                  }`}
                />
              </form>

              {input.trim() ? (
                <button
                  onClick={() => handleSend()}
                  type="button"
                  className="w-9 h-9 rounded-full bg-[#00a884] text-white flex items-center justify-center hover:bg-[#008f6f] transition active:scale-95 shadow cursor-pointer"
                >
                  <Send className="w-4 h-4 ml-0.5" />
                </button>
              ) : (
                <button
                  onClick={startVoiceRecording}
                  type="button"
                  className="w-9 h-9 rounded-full bg-[#00a884] text-white hover:bg-[#008f6f] flex items-center justify-center transition active:scale-95 shadow cursor-pointer"
                  title="Gravar áudio de voz"
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* External WhatsApp & Share buttons */}
      <div
        className={`mt-3 p-3 rounded-2xl border flex flex-col sm:flex-row items-center justify-between gap-2.5 text-xs transition-colors ${
          isDay
            ? 'bg-white border-slate-200 text-slate-700 shadow-sm'
            : 'bg-slate-800/80 border-slate-700/80 text-slate-300'
        }`}
      >
        <span className="font-medium text-center sm:text-left">
          Quer que outros clientes testem este simulador?
        </span>
        <div className="flex items-center gap-2 shrink-0">
          {onOpenShare && (
            <button
              onClick={onOpenShare}
              type="button"
              className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-500 border border-emerald-500/30 font-semibold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 cursor-pointer active:scale-95"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Enviar Link p/ Clientes</span>
            </button>
          )}
          <a
            href={getDirectWhatsAppUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-3 py-1.5 rounded-xl transition flex items-center gap-1.5 shadow-sm active:scale-95"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Abrir WhatsApp</span>
          </a>
        </div>
      </div>
    </div>
  );
};
