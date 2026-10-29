import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  RotateCcw,
  Sparkles,
  PhoneCall,
  CheckCheck,
  Mic,
  MicOff,
  Copy,
  Check,
  ExternalLink,
  Bot,
  Share2,
  Trash2,
  AlertCircle,
  X,
  Paperclip,
  FileText,
  Image as ImageIcon,
} from 'lucide-react';
import { BusinessConfig, ChatMessage, sendChatMessage, sendChatAudio, fetchAudioTts, sendChatMultimodal } from '../services/api';
import { AudioPlayer } from './AudioPlayer';
import { VoiceNoteBubble } from './VoiceNoteBubble';
import { FormattedMessageText } from './FormattedMessageText';
import { createSampleVoiceAudioUrl } from '../utils/audioHelper';

interface ChatInterfaceProps {
  config: BusinessConfig;
  theme?: 'day' | 'night';
  onOpenSettings?: () => void;
  onOpenWhatsAppSimulator?: () => void;
  onOpenShare?: () => void;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  config,
  theme = 'night',
  onOpenSettings,
  onOpenWhatsAppSimulator,
  onOpenShare,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-init-1',
      role: 'assistant',
      text: `Olá! Eu sou a ${config.botName}, especialista de atendimento e vendas da **${config.companyName}**. Estou aqui para tirar dúvidas sobre nosso catálogo de serviços e te ajudar a escolher a melhor solução para sua empresa. Como posso te ajudar hoje?`,
      timestamp: '08:35',
      status: 'read',
    },
  ]);

  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const isListeningRef = useRef(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-scroll to bottom of conversation
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Clean up any active speech recognition on unmount
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

  // Voice recording state
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingSeconds, setRecordingSeconds] = useState(0);
  const [micErrorNotice, setMicErrorNotice] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // File upload state for Images & PDFs
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [selectedFile, setSelectedFile] = useState<{
    file: File;
    base64: string;
    previewUrl: string;
    isPdf: boolean;
    fileName: string;
    fileSize: string;
  } | null>(null);

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

      // Emit chunks continuously
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
      id: `voice-${Date.now()}`,
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
        id: `bot-audio-${Date.now()}`,
        role: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        needsHumanHandoff: res.needsHumanHandoff,
        audioUrl: liaAudioUrl,
        status: 'read',
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Erro ao enviar áudio:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const fileSizeStr = (file.size / 1024).toFixed(1) + ' KB';

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      const previewUrl = URL.createObjectURL(file);
      setSelectedFile({
        file,
        base64,
        previewUrl,
        isPdf,
        fileName: file.name,
        fileSize: fileSizeStr,
      });
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSendFile = async () => {
    if (!selectedFile || isLoading) return;

    const fileData = selectedFile;
    setSelectedFile(null);

    const timeStr = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const userCaption = input.trim();
    setInput('');

    const userMsg: ChatMessage = {
      id: `file-${Date.now()}`,
      role: 'user',
      text: userCaption || (fileData.isPdf ? `Documento PDF: ${fileData.fileName}` : `Imagem enviada`),
      timestamp: timeStr,
      status: 'sent',
      fileUrl: fileData.previewUrl,
      fileName: fileData.fileName,
      fileType: fileData.isPdf ? 'pdf' : 'image',
      fileSize: fileData.fileSize,
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-6)
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          text: m.text,
        }));

      const res = await sendChatMultimodal(
        fileData.base64,
        fileData.file.type || (fileData.isPdf ? 'application/pdf' : 'image/jpeg'),
        fileData.fileName,
        userCaption,
        history
      );

      const liaAudioUrl = await fetchAudioTts(res.reply).catch(() => '');

      const botMsg: ChatMessage = {
        id: `bot-file-${Date.now()}`,
        role: 'assistant',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        needsHumanHandoff: res.needsHumanHandoff,
        audioUrl: liaAudioUrl,
        status: 'read',
      };

      setMessages((prev) => [...prev, botMsg]);
    } catch (err) {
      console.error('Erro ao enviar arquivo:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSend = async (textToSend?: string) => {
    if (selectedFile) {
      await handleSendFile();
      return;
    }

    const text = (textToSend || input).trim();
    if (!text || isLoading) return;

    const userMsgId = `user-${Date.now()}`;
    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });

    const newUserMsg: ChatMessage = {
      id: userMsgId,
      role: 'user',
      text: text,
      timestamp: nowTime,
      status: 'sent',
    };

    setMessages((prev) => [...prev, newUserMsg]);
    setInput('');
    setIsLoading(true);

    try {
      // Build history for context
      const history = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-6)
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          text: m.text,
        }));

      const response = await sendChatMessage(text, history);

      const botMsgId = `bot-${Date.now()}`;
      const newBotMsg: ChatMessage = {
        id: botMsgId,
        role: 'assistant',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        needsHumanHandoff: response.needsHumanHandoff,
        status: 'read',
      };

      setMessages((prev) => [...prev, newBotMsg]);
    } catch (error) {
      console.error('Erro ao enviar mensagem:', error);
      const errorMsg: ChatMessage = {
        id: `bot-err-${Date.now()}`,
        role: 'assistant',
        text: 'Desculpe, tive uma instabilidade momentânea ao processar sua pergunta. Por favor, tente novamente ou fale com nosso atendimento humano pelo WhatsApp!',
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        needsHumanHandoff: true,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  // Simulates a customer sending a real voice note
  const handleSendAudioSample = async (sampleQuestionText?: string) => {
    if (isLoading) return;

    const queryText =
      sampleQuestionText ||
      'Olá LIA! Gostaria de saber os valores para Criação de Sites e Biosite com IA.';

    const nowTime = new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    const audioUrl = createSampleVoiceAudioUrl();

    // Add customer voice note bubble
    const userAudioMsg: ChatMessage = {
      id: `user-voice-${Date.now()}`,
      role: 'user',
      text: queryText,
      timestamp: nowTime,
      isVoiceNote: true,
      audioUrl: audioUrl,
      transcription: queryText,
      status: 'sent',
    };

    setMessages((prev) => [...prev, userAudioMsg]);
    setIsLoading(true);

    try {
      const history = messages
        .filter((m) => m.role === 'user' || m.role === 'assistant')
        .slice(-6)
        .map((m) => ({
          role: m.role as 'user' | 'assistant',
          text: m.text,
        }));

      // Call multimodal audio API or chat
      const response = await sendChatMessage(
        `[MENSAGEM DE ÁUDIO DO CLIENTE TRANSCRIÇÃO]: "${queryText}"`,
        history
      );

      const botMsgId = `bot-${Date.now()}`;
      const newBotMsg: ChatMessage = {
        id: botMsgId,
        role: 'assistant',
        text: response.reply,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        needsHumanHandoff: response.needsHumanHandoff,
        status: 'read',
      };

      setMessages((prev) => [...prev, newBotMsg]);
    } catch (err) {
      console.error('Erro ao interpretar áudio:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestart = () => {
    setMessages([
      {
        id: `init-${Date.now()}`,
        role: 'assistant',
        text: `Olá! Eu sou a ${config.botName}, especialista de atendimento e vendas da **${config.companyName}**. Como posso ajudar você hoje?`,
        timestamp: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
        status: 'read',
      },
    ]);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const getWhatsAppHandoffUrl = () => {
    const cleanNumber = config.businessPhone.replace(/\D/g, '');
    const defaultText = encodeURIComponent(
      `Olá! Estava conversando com a assistente ${config.botName} e gostaria de falar com um atendente humano da equipe.`
    );
    return `https://wa.me/${cleanNumber}?text=${defaultText}`;
  };

  const isDay = theme === 'day';

  return (
    <div className="w-full max-w-md mx-auto flex flex-col font-sans min-h-[92vh] pb-6">
      {/* Top Greeting & Presentation Card - EXACT match of the screenshot */}
      <div
        className={`bg-white rounded-[28px] p-5 border text-slate-800 transition-all ${
          isDay
            ? 'shadow-xl shadow-slate-200/80 border-slate-200'
            : 'shadow-2xl shadow-black/40 border-white/20'
        }`}
      >
        {/* Header Avatar and Status */}
        <div className="flex items-start gap-3.5">
          {/* Avatar with image or fallback */}
          <div className="relative shrink-0">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-slate-900 border-2 border-slate-100 shadow-md flex items-center justify-center">
              <img
                src="/lia-avatar.png"
                alt="LIA Avatar"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback if image not rendered
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <div className="text-white text-center flex flex-col items-center justify-center p-1">
                <Bot className="w-8 h-8 text-cyan-400" />
                <span className="text-[10px] font-bold text-cyan-300">LIA</span>
              </div>
            </div>
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full"></span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-1 flex-wrap">
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
                Olá! Eu sou a {config.botName}
                <span className="text-lg">👋</span>
              </h1>
              {/* Online status badge matching screenshot */}
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-200/80">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Online
              </span>
            </div>

            <p className="text-xs font-medium text-slate-500 mt-0.5">
              {config.botRole}
            </p>
          </div>
        </div>

        {/* Introduction text */}
        <p className="text-[13px] leading-relaxed text-slate-600 mt-3.5">
          Estou aqui para tirar suas dúvidas, apresentar nossos serviços e ajudar você a encontrar a melhor solução. Pode perguntar!
        </p>

        {/* Suggestion Chips Box - Matching screenshot */}
        <div className="mt-4 bg-[#f2f6fa] rounded-2xl p-3.5 border border-slate-200/60">
          <p className="text-xs font-semibold text-slate-500 mb-2.5 flex items-center justify-between">
            <span>Sugestões de perguntas</span>
            <span className="text-[10px] text-slate-400 font-normal">Clique para enviar</span>
          </p>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => handleSendAudioSample()}
              disabled={isLoading}
              className="bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-[0.97] text-emerald-700 dark:text-emerald-300 text-xs font-semibold px-3.5 py-1.5 rounded-full border border-emerald-400/50 shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Mic className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>🎙️ Testar Áudio de Cliente</span>
            </button>
            {config.quickQuestions.map((q, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleSend(q)}
                disabled={isLoading}
                className="bg-white hover:bg-slate-50 active:scale-[0.97] text-slate-700 text-xs font-medium px-3.5 py-1.5 rounded-full border border-slate-200/90 shadow-2xs transition-all hover:border-slate-300 hover:text-slate-900 text-left disabled:opacity-50"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conversation Section Header */}
      <div
        className={`mt-6 mb-2 flex items-center justify-between px-2 text-xs font-semibold uppercase tracking-wider ${
          isDay ? 'text-slate-500' : 'text-slate-400'
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="text-emerald-500 text-sm">💬</span>
          <span className={isDay ? 'text-slate-700 font-bold' : 'text-slate-300'}>
            CONVERSA COM {config.botName}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onOpenShare && (
            <button
              onClick={onOpenShare}
              type="button"
              className={`flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xl transition cursor-pointer active:scale-95 ${
                isDay
                  ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300'
                  : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 border border-emerald-500/30'
              }`}
              title="Criar e enviar link de teste para clientes"
            >
              <Share2 className="w-3.5 h-3.5" />
              <span>Link p/ Clientes</span>
            </button>
          )}

          <button
            onClick={handleRestart}
            type="button"
            className={`flex items-center gap-1.5 text-xs transition capitalize font-medium cursor-pointer active:scale-95 ${
              isDay ? 'text-slate-500 hover:text-emerald-600' : 'text-slate-400 hover:text-emerald-400'
            }`}
            title="Reiniciar conversa"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Reiniciar
          </button>
        </div>
      </div>

      {/* Chat Messages Container */}
      <div
        className={`flex-1 rounded-[24px] p-4 border shadow-xl flex flex-col gap-3.5 min-h-[360px] overflow-y-auto transition-colors ${
          isDay
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-[#151722] border-[#272a3b] text-slate-100'
        }`}
      >
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex flex-col ${
              msg.role === 'user' ? 'items-end' : 'items-start'
            } transition-all duration-200`}
          >
            <div
              className={`flex items-start gap-2.5 max-w-[90%] ${
                msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              {/* Avatar on LIA messages */}
              {msg.role === 'assistant' && (
                <div
                  className={`w-8 h-8 rounded-full overflow-hidden shrink-0 mt-0.5 shadow-sm border ${
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
                  <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-cyan-500 bg-slate-900">
                    LIA
                  </div>
                </div>
              )}

              {/* Message Bubble */}
              {msg.isVoiceNote ? (
                <VoiceNoteBubble
                  isUser={msg.role === 'user'}
                  audioUrl={msg.audioUrl}
                  transcription={msg.transcription}
                  timestamp={msg.timestamp}
                  theme={theme}
                />
              ) : (
                <div
                  className={`relative rounded-2xl p-3.5 text-[13px] leading-relaxed shadow-sm ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white rounded-tr-xs'
                      : isDay
                      ? 'bg-[#f1f5f9] text-slate-800 rounded-tl-xs border border-slate-200'
                      : 'bg-[#222534] text-slate-100 rounded-tl-xs border border-[#31364d]'
                  }`}
                >
                  {/* Attached Image inside Chat bubble */}
                  {msg.fileUrl && msg.fileType === 'image' && (
                    <div className="mb-2.5 rounded-xl overflow-hidden border border-black/10">
                      <img
                        src={msg.fileUrl}
                        alt={msg.fileName || 'Imagem'}
                        className="max-h-60 w-full object-cover rounded-lg"
                      />
                    </div>
                  )}

                  {/* Attached PDF document inside Chat bubble */}
                  {msg.fileUrl && msg.fileType === 'pdf' && (
                    <a
                      href={msg.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mb-2.5 p-2.5 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center gap-3 text-left hover:bg-red-500/20 transition cursor-pointer"
                      title="Abrir Documento PDF"
                    >
                      <div className="w-10 h-10 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0">
                        <FileText className="w-5 h-5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-bold text-xs truncate text-red-500 dark:text-red-400">
                          {msg.fileName || 'documento.pdf'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Documento PDF • {msg.fileSize || 'Visualizar'}
                        </div>
                      </div>
                    </a>
                  )}

                  {/* Message Content with Clickable Links */}
                  <FormattedMessageText
                    text={msg.text}
                    isUser={msg.role === 'user'}
                    theme={theme}
                    variant="chat"
                  />

                  {/* Audio Generation / Player on LIA messages */}
                  {msg.role === 'assistant' && (
                    <AudioPlayer
                      theme={theme}
                      text={msg.text}
                      audioUrl={msg.audioUrl}
                      onGenerateAudio={async () => {
                        const url = await fetchAudioTts(msg.text);
                        msg.audioUrl = url;
                        return url;
                      }}
                    />
                  )}

                  {/* Human Handoff Quick Card if requested */}
                  {msg.needsHumanHandoff && (
                    <div
                      className={`mt-3 pt-3 border-t flex flex-col gap-2 ${
                        isDay ? 'border-slate-300' : 'border-slate-700/80'
                      }`}
                    >
                      <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                        <PhoneCall className="w-3.5 h-3.5" />
                        Atendimento Humano WhatsApp
                      </p>
                      <a
                        href={getWhatsAppHandoffUrl()}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-medium text-xs shadow-md transition active:scale-95"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        Falar no WhatsApp ({config.businessPhone})
                      </a>
                    </div>
                  )}

                  {/* Footer info: time, copy button, status */}
                  <div
                    className={`mt-2 flex items-center justify-end gap-1.5 text-[10px] ${
                      msg.role === 'user'
                        ? 'text-blue-200'
                        : isDay
                        ? 'text-slate-400'
                        : 'text-slate-400'
                    }`}
                  >
                    <button
                      onClick={() => handleCopy(msg.id, msg.text)}
                      type="button"
                      className={`transition p-0.5 ${
                        isDay ? 'hover:text-slate-700 text-slate-400' : 'hover:text-white text-slate-400'
                      }`}
                      title="Copiar mensagem"
                    >
                      {copiedId === msg.id ? (
                        <Check className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                    </button>
                    <span>{msg.timestamp}</span>
                    {msg.role === 'user' && (
                      <CheckCheck className="w-3.5 h-3.5 text-blue-200 inline" />
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isLoading && (
          <div className="flex items-center gap-2.5 text-xs py-1">
            <div
              className={`w-8 h-8 rounded-full overflow-hidden shrink-0 shadow-sm border ${
                isDay ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-700'
              }`}
            >
              <img src="/lia-avatar.png" alt="LIA" className="w-full h-full object-cover" />
            </div>
            <div
              className={`px-4 py-2.5 rounded-2xl rounded-tl-xs border flex items-center gap-1.5 ${
                isDay
                  ? 'bg-slate-100 border-slate-200 text-slate-700'
                  : 'bg-[#222534] border-[#31364d] text-slate-300'
              }`}
            >
              <span className="text-xs font-medium">{config.botName} está digitando</span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-bounce"></span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Mic Permission Warning Notice if blocked */}
      {micErrorNotice && (
        <div className="mt-2 p-3 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs flex flex-col gap-2 animate-in fade-in duration-200 shadow-md">
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2 font-medium leading-tight">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-amber-400" />
              <span>{micErrorNotice}</span>
            </div>
            <button
              onClick={() => setMicErrorNotice(null)}
              className="text-slate-400 hover:text-white p-0.5 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <button
            onClick={() => {
              setMicErrorNotice(null);
              handleSendAudioSample();
            }}
            className="self-start text-[11px] font-bold px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 transition cursor-pointer"
          >
            Testar com Áudio de Demonstração
          </button>
        </div>
      )}

      {/* Hidden File Input for Images and PDFs */}
      <input
        type="file"
        ref={fileInputRef}
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />

      {/* Selected Attachment Preview Bar */}
      {selectedFile && (
        <div className="mt-2 p-2.5 rounded-2xl bg-slate-100 dark:bg-[#181a26] border border-slate-300 dark:border-slate-700 flex items-center justify-between gap-2 animate-in fade-in duration-150 shadow-sm">
          <div className="flex items-center gap-2.5 min-w-0">
            {selectedFile.isPdf ? (
              <div className="w-9 h-9 rounded-xl bg-red-500 text-white flex items-center justify-center shrink-0 shadow-sm">
                <FileText className="w-5 h-5" />
              </div>
            ) : (
              <img
                src={selectedFile.previewUrl}
                alt="Preview"
                className="w-9 h-9 rounded-xl object-cover shrink-0 border"
              />
            )}
            <div className="min-w-0 text-left">
              <div className="text-xs font-bold truncate max-w-[220px] text-slate-800 dark:text-slate-200">
                {selectedFile.fileName}
              </div>
              <div className="text-[10px] text-slate-400">
                {selectedFile.isPdf ? 'Documento PDF' : 'Imagem'} • {selectedFile.fileSize}
              </div>
            </div>
          </div>
          <button
            onClick={() => setSelectedFile(null)}
            className="p-1.5 rounded-full text-slate-400 hover:text-rose-500 transition cursor-pointer"
            title="Remover anexo"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Floating Bottom Input Bar */}
      <div
        className={`mt-3 rounded-2xl p-2 border shadow-lg transition-colors ${
          isDay
            ? 'bg-white border-slate-200 text-slate-900'
            : 'bg-[#1c1e2b] border-[#2d3145] text-white'
        }`}
      >
        {isRecordingAudio ? (
          <div className="flex items-center justify-between px-2 py-1">
            <div className="flex items-center gap-2 text-rose-500 font-semibold text-xs animate-pulse">
              <span className="w-3 h-3 rounded-full bg-rose-500 animate-ping" />
              <span>
                Gravando sua voz: {Math.floor(recordingSeconds / 60)}:
                {recordingSeconds % 60 < 10 ? '0' : ''}
                {recordingSeconds % 60}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={cancelVoiceRecording}
                type="button"
                className="p-2 text-slate-400 hover:text-rose-500 rounded-xl transition active:scale-95 cursor-pointer"
                title="Cancelar gravação"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <button
                onClick={stopAndSendVoiceRecording}
                type="button"
                className="w-9 h-9 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center transition active:scale-95 font-bold shadow-md cursor-pointer"
                title="Enviar áudio"
              >
                <Send className="w-4 h-4 ml-0.5" />
              </button>
            </div>
          </div>
        ) : (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="flex items-center gap-2"
          >
            {/* Native Microphone Button */}
            <button
              type="button"
              onClick={startVoiceRecording}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition active:scale-95 cursor-pointer ${
                isDay
                  ? 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  : 'bg-[#272b3d] text-slate-300 hover:text-white hover:bg-[#32364c]'
              }`}
              title="Gravar mensagem de voz"
            >
              <Mic className="w-4 h-4 text-emerald-500" />
            </button>

            {/* Paperclip Button for Images and PDFs */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition active:scale-95 cursor-pointer ${
                selectedFile
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  : isDay
                  ? 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
                  : 'bg-[#272b3d] text-slate-300 hover:text-white hover:bg-[#32364c]'
              }`}
              title="Anexar Imagem ou Documento PDF"
            >
              <Paperclip className="w-4 h-4 text-emerald-500" />
            </button>

            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={selectedFile ? 'Adicionar legenda ao anexo...' : 'Digite sua mensagem, grave voz ou anexe PDF/imagem...'}
              disabled={isLoading}
              className={`flex-1 bg-transparent border-none text-sm focus:outline-none px-2 ${
                isDay
                  ? 'text-slate-900 placeholder-slate-400'
                  : 'text-white placeholder-slate-500'
              }`}
            />

            <button
              type="submit"
              disabled={(!input.trim() && !selectedFile) || isLoading}
              className="w-10 h-10 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-40 text-slate-950 font-bold flex items-center justify-center transition active:scale-95 shadow-md shrink-0 cursor-pointer"
              title={selectedFile ? 'Enviar anexo' : 'Enviar mensagem'}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        )}
      </div>

      {/* Quick shortcuts below input */}
      <div
        className={`mt-2.5 flex items-center justify-between px-2 text-[11px] ${
          isDay ? 'text-slate-500' : 'text-slate-400'
        }`}
      >
        <button
          onClick={onOpenWhatsAppSimulator}
          type="button"
          className={`transition flex items-center gap-1 underline underline-offset-2 ${
            isDay ? 'hover:text-emerald-600' : 'hover:text-emerald-400'
          }`}
        >
          <span>📱 Abrir Simulador WhatsApp</span>
        </button>

        <button
          onClick={onOpenSettings}
          type="button"
          className={`transition flex items-center gap-1 ${
            isDay ? 'hover:text-emerald-600' : 'hover:text-emerald-400'
          }`}
        >
          <Sparkles className="w-3 h-3 text-amber-500" />
          <span>Ajustar Respostas e Base</span>
        </button>
      </div>
    </div>
  );
};
