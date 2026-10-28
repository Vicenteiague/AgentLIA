import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Mic, Sparkles, CheckCheck } from 'lucide-react';

interface VoiceNoteBubbleProps {
  audioUrl?: string;
  transcription?: string;
  timestamp: string;
  isUser?: boolean;
  theme?: 'day' | 'night';
}

export const VoiceNoteBubble: React.FC<VoiceNoteBubbleProps> = ({
  audioUrl,
  transcription,
  timestamp,
  isUser = true,
  theme = 'night',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState('0:05');
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const isDay = theme === 'day';

  const handlePlayToggle = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((e) => {
        console.warn('Audio play error:', e);
      });
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const cur = audioRef.current.currentTime;
      const total = audioRef.current.duration || 5;
      const p = (cur / total) * 100;
      setProgress(isNaN(p) ? 0 : p);

      const mins = Math.floor(cur / 60);
      const secs = Math.floor(cur % 60);
      setDuration(`${mins}:${secs < 10 ? '0' : ''}${secs}`);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
    setDuration('0:05');
  };

  const toggleSpeed = () => {
    const next = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(next);
    if (audioRef.current) {
      audioRef.current.playbackRate = next;
    }
  };

  // 24 waveform bar heights for authentic WhatsApp look
  const waveformBars = [
    30, 45, 80, 60, 95, 75, 40, 90, 100, 65, 85, 45, 70, 90, 50, 80, 60, 40, 75, 85, 55, 65, 45, 30
  ];

  return (
    <div
      className={`rounded-2xl p-3 shadow-md max-w-[320px] sm:max-w-[340px] flex flex-col gap-2 ${
        isUser
          ? isDay
            ? 'bg-[#d9fdd3] text-slate-900 border border-emerald-200'
            : 'bg-[#005c4b] text-white border border-[#02735e]'
          : isDay
          ? 'bg-white text-slate-900 border border-slate-200'
          : 'bg-[#202c33] text-slate-100 border border-slate-700'
      }`}
    >
      {/* Voice Note Header */}
      <div className="flex items-center justify-between text-[11px] font-semibold opacity-90">
        <span className="flex items-center gap-1">
          <Mic className="w-3.5 h-3.5 text-emerald-500" />
          <span>Mensagem de Voz</span>
        </span>
        <button
          onClick={toggleSpeed}
          type="button"
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
            isDay ? 'bg-black/10 hover:bg-black/20 text-slate-800' : 'bg-white/10 hover:bg-white/20 text-white'
          }`}
        >
          {playbackRate}x
        </button>
      </div>

      {/* Audio Waveform Row */}
      <div className="flex items-center gap-2.5">
        {/* Play / Pause button */}
        <button
          onClick={handlePlayToggle}
          type="button"
          className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-sm transition active:scale-95 cursor-pointer ${
            isUser
              ? isDay
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
              : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950'
          }`}
          title={isPlaying ? 'Pausar áudio' : 'Ouvir mensagem de voz'}
        >
          {isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* Waveform Bars */}
        <div className="flex-1 flex items-center gap-0.5 h-7 px-1 overflow-hidden">
          {waveformBars.map((h, i) => {
            const barProgress = (i / waveformBars.length) * 100;
            const isPassed = barProgress <= progress;
            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-75 ${
                  isPassed
                    ? isUser
                      ? isDay
                        ? 'bg-emerald-700'
                        : 'bg-emerald-300'
                      : isDay
                      ? 'bg-emerald-600'
                      : 'bg-emerald-400'
                    : isUser
                    ? isDay
                      ? 'bg-emerald-900/20'
                      : 'bg-white/30'
                    : isDay
                    ? 'bg-slate-300'
                    : 'bg-slate-600'
                }`}
                style={{ height: `${h}%` }}
              />
            );
          })}
        </div>
      </div>

      {/* Transcription badge (Gemini interpretation) */}
      {transcription && (
        <div
          className={`p-2 rounded-xl text-xs flex flex-col gap-1 border ${
            isUser
              ? isDay
                ? 'bg-white/70 border-emerald-300/80 text-slate-800'
                : 'bg-black/25 border-emerald-400/30 text-emerald-100'
              : isDay
              ? 'bg-slate-100 border-slate-200 text-slate-800'
              : 'bg-slate-800/60 border-slate-700 text-slate-200'
          }`}
        >
          <div className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
            <Sparkles className="w-3 h-3" />
            <span>Áudio interpretado pelo Gemini:</span>
          </div>
          <p className="italic text-[11px] leading-snug">"{transcription}"</p>
        </div>
      )}

      {/* Footer Info */}
      <div className="flex items-center justify-between text-[10px] opacity-75 pt-0.5">
        <span>{duration}</span>
        <div className="flex items-center gap-1">
          <span>{timestamp}</span>
          {isUser && <CheckCheck className="w-3.5 h-3.5 text-blue-400 inline" />}
        </div>
      </div>

      {audioUrl && (
        <audio
          ref={audioRef}
          src={audioUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          className="hidden"
        />
      )}
    </div>
  );
};
