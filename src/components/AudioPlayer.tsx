import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Sparkles, Loader2, VolumeX } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl?: string;
  text?: string;
  onGenerateAudio?: () => Promise<string | void>;
  label?: string;
  theme?: 'day' | 'night';
  variant?: 'chat' | 'whatsapp';
}

/**
 * Universal browser speech synthesis fallback for Portuguese (Brazil)
 */
function speakTextWithBrowser(
  text: string,
  rate: number = 1.0,
  onStart?: () => void,
  onEnd?: () => void
): boolean {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      window.speechSynthesis.cancel();
      // Clean markdown, links and special chars
      const clean = text
        .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
        .replace(/https?:\/\/[^\s]+/g, 'link')
        .replace(/[*_#`~•]/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.lang = 'pt-BR';
      utterance.rate = rate;
      utterance.pitch = 1.08; // Friendly pleasant female pitch

      // Try to find a Portuguese voice
      const voices = window.speechSynthesis.getVoices();
      const ptVoice = voices.find(
        (v) => v.lang.startsWith('pt') || v.name.includes('Brazil') || v.name.includes('Portuguese')
      );
      if (ptVoice) {
        utterance.voice = ptVoice;
      }

      utterance.onstart = () => {
        if (onStart) onStart();
      };
      utterance.onend = () => {
        if (onEnd) onEnd();
      };
      utterance.onerror = (e) => {
        console.warn('SpeechSynthesis error:', e);
        if (onEnd) onEnd();
      };

      window.speechSynthesis.speak(utterance);
      return true;
    } catch (e) {
      console.warn('Browser speech synthesis error:', e);
      return false;
    }
  }
  return false;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  text = '',
  onGenerateAudio,
  label = 'Ouvir resposta em áudio (Voz da LIA)',
  theme = 'night',
  variant = 'chat',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | undefined>(audioUrl);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [progress, setProgress] = useState(0);
  const [isUsingSpeechSynthesis, setIsUsingSpeechSynthesis] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioUrl) {
      setCurrentUrl(audioUrl);
    }
  }, [audioUrl]);

  // Clean up speech synthesis if component unmounts
  useEffect(() => {
    return () => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handlePlayToggle = async () => {
    // If currently speaking with speech synthesis, stop
    if (isUsingSpeechSynthesis) {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
      setIsUsingSpeechSynthesis(false);
      setIsPlaying(false);
      setProgress(0);
      return;
    }

    // If currently playing native audio element
    if (audioRef.current && currentUrl && isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
      return;
    }

    // 1. If we already have a real audio URL, play it
    if (currentUrl && audioRef.current) {
      try {
        await audioRef.current.play();
        setIsPlaying(true);
        return;
      } catch (playErr) {
        console.warn('HTMLAudioElement play failed, falling back to speech synthesis:', playErr);
      }
    }

    // 2. If we need to fetch audio from server
    if (!currentUrl && onGenerateAudio) {
      setIsLoading(true);
      try {
        const url = await onGenerateAudio();
        if (url && typeof url === 'string') {
          setCurrentUrl(url);
          if (audioRef.current) {
            audioRef.current.src = url;
            try {
              await audioRef.current.play();
              setIsPlaying(true);
              setIsLoading(false);
              return;
            } catch (playErr) {
              console.warn('Could not auto-play generated audio:', playErr);
            }
          }
        }
      } catch (err) {
        console.warn('TTS server generation failed:', err);
      } finally {
        setIsLoading(false);
      }
    }

    // 3. Robust Browser Speech Synthesis Fallback (Always audible on mobile and desktop)
    if (text) {
      setIsUsingSpeechSynthesis(true);
      setIsPlaying(true);
      const started = speakTextWithBrowser(
        text,
        playbackRate,
        () => {
          setIsPlaying(true);
          // Animate progress bar during speech
          let currentP = 0;
          const interval = setInterval(() => {
            currentP += 4;
            if (currentP > 95) clearInterval(interval);
            setProgress(Math.min(currentP, 95));
          }, 200);
        },
        () => {
          setIsPlaying(false);
          setIsUsingSpeechSynthesis(false);
          setProgress(0);
        }
      );

      if (!started) {
        setIsPlaying(false);
        setIsUsingSpeechSynthesis(false);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && !isUsingSpeechSynthesis) {
      const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(isNaN(p) ? 0 : p);
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(0);
  };

  const toggleSpeed = () => {
    const nextRate = playbackRate === 1 ? 1.5 : playbackRate === 1.5 ? 2 : 1;
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
    if (isUsingSpeechSynthesis && text && isPlaying) {
      window.speechSynthesis.cancel();
      speakTextWithBrowser(text, nextRate, undefined, () => {
        setIsPlaying(false);
        setIsUsingSpeechSynthesis(false);
        setProgress(0);
      });
    }
  };

  const isDay = theme === 'day';
  const isWhatsApp = variant === 'whatsapp';

  return (
    <div
      className={`mt-2 pt-2 border-t flex flex-col gap-1.5 ${
        isDay ? 'border-slate-200/80' : 'border-slate-700/60'
      }`}
    >
      <div className="flex items-center justify-between text-xs">
        <span
          className={`flex items-center gap-1.5 font-medium ${
            isDay ? 'text-slate-600' : 'text-slate-300'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
          <span className="text-[11px] font-semibold">{label}</span>
        </span>
        <button
          onClick={toggleSpeed}
          type="button"
          className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition active:scale-95 cursor-pointer ${
            isDay
              ? 'bg-slate-200 text-emerald-800 hover:bg-slate-300'
              : 'bg-slate-800 text-emerald-300 hover:bg-slate-700'
          }`}
          title="Velocidade da voz"
        >
          {playbackRate}x
        </button>
      </div>

      <div
        className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border transition-colors ${
          isWhatsApp
            ? isDay
              ? 'bg-[#e7fedb] border-emerald-300'
              : 'bg-[#1b272f] border-emerald-500/30'
            : isDay
            ? 'bg-slate-100/90 border-slate-200/90'
            : 'bg-slate-800/80 border-slate-700/60'
        }`}
      >
        <button
          onClick={handlePlayToggle}
          disabled={isLoading}
          type="button"
          className="w-7 h-7 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0 shadow-xs transition active:scale-95 disabled:opacity-50 cursor-pointer"
          title={isPlaying ? 'Pausar áudio' : 'Ouvir resposta por voz'}
        >
          {isLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-slate-950" />
          ) : isPlaying ? (
            <Pause className="w-3.5 h-3.5 fill-current" />
          ) : (
            <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
          )}
        </button>

        {/* Dynamic Waveform bars */}
        <div className="flex-1 flex items-center gap-0.5 h-5 px-1 overflow-hidden">
          {[
            35, 60, 85, 45, 95, 70, 40, 80, 100, 65, 50, 85, 90, 40, 60, 75,
            30, 90, 80, 50, 70, 45, 85, 60, 40, 75, 90, 55, 65, 45,
          ].map((height, i) => {
            const barProgress = (i / 30) * 100;
            const isPassed = barProgress <= progress;
            return (
              <div
                key={i}
                className={`w-1 rounded-full transition-all duration-100 ${
                  isPassed
                    ? 'bg-emerald-500'
                    : isDay
                    ? 'bg-slate-300'
                    : 'bg-slate-600'
                }`}
                style={{ height: `${isPlaying ? Math.max(20, (height * (progress % 100)) / 60) : height}%` }}
              />
            );
          })}
        </div>

        <button
          onClick={handlePlayToggle}
          type="button"
          className={`text-[11px] font-semibold flex items-center gap-1 shrink-0 transition active:scale-95 cursor-pointer ${
            isDay ? 'text-emerald-700 hover:text-emerald-800' : 'text-emerald-400 hover:text-emerald-300'
          }`}
        >
          {isPlaying ? (
            <span className="text-emerald-400 animate-pulse">Reproduzindo...</span>
          ) : (
            <>
              <Sparkles className="w-3 h-3" />
              <span>Ouvir</span>
            </>
          )}
        </button>
      </div>

      <audio
        ref={audioRef}
        src={currentUrl}
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleEnded}
        className="hidden"
      />
    </div>
  );
};
