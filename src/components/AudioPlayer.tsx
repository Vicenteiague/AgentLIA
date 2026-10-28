import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause, Volume2, Sparkles, Loader2 } from 'lucide-react';

interface AudioPlayerProps {
  audioUrl?: string;
  onGenerateAudio?: () => Promise<string | void>;
  label?: string;
  theme?: 'day' | 'night';
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({
  audioUrl,
  onGenerateAudio,
  label = 'Ouvir resposta em áudio (Voz da LIA)',
  theme = 'night',
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [currentUrl, setCurrentUrl] = useState<string | undefined>(audioUrl);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [progress, setProgress] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (audioUrl) {
      setCurrentUrl(audioUrl);
    }
  }, [audioUrl]);

  const handlePlayToggle = async () => {
    if (!currentUrl && onGenerateAudio) {
      setIsLoading(true);
      try {
        const url = await onGenerateAudio();
        if (url) {
          setCurrentUrl(url);
          setTimeout(() => {
            if (audioRef.current) {
              audioRef.current.play();
              setIsPlaying(true);
            }
          }, 100);
        }
      } catch (err) {
        console.error('Erro ao gerar voz:', err);
      } finally {
        setIsLoading(false);
      }
      return;
    }

    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play();
        setIsPlaying(true);
      }
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
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
  };

  const isDay = theme === 'day';

  return (
    <div
      className={`mt-2.5 pt-2 border-t flex flex-col gap-1.5 ${
        isDay ? 'border-slate-200' : 'border-slate-700/50'
      }`}
    >
      <div className="flex items-center justify-between text-xs">
        <span
          className={`flex items-center gap-1.5 font-medium ${
            isDay ? 'text-slate-600' : 'text-slate-300'
          }`}
        >
          <Volume2 className="w-3.5 h-3.5 text-emerald-500" />
          {label}
        </span>
        {currentUrl && (
          <button
            onClick={toggleSpeed}
            type="button"
            className={`px-1.5 py-0.5 rounded text-[11px] font-bold transition ${
              isDay
                ? 'bg-slate-200 text-emerald-700 hover:bg-slate-300'
                : 'bg-slate-800 text-emerald-400 hover:bg-slate-700'
            }`}
          >
            {playbackRate}x
          </button>
        )}
      </div>

      <div
        className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-colors ${
          isDay
            ? 'bg-slate-100/90 border-slate-200/90'
            : 'bg-slate-800/80 border-slate-700/60'
        }`}
      >
        <button
          onClick={handlePlayToggle}
          disabled={isLoading}
          type="button"
          className="w-8 h-8 rounded-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 flex items-center justify-center shrink-0 shadow-sm transition active:scale-95 disabled:opacity-50"
          title={isPlaying ? 'Pausar áudio' : 'Ouvir áudio da LIA'}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
          ) : isPlaying ? (
            <Pause className="w-4 h-4 fill-current" />
          ) : (
            <Play className="w-4 h-4 fill-current ml-0.5" />
          )}
        </button>

        {/* WhatsApp-style waveform simulation */}
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
                    ? isDay
                      ? 'bg-emerald-600'
                      : 'bg-emerald-400'
                    : isDay
                    ? 'bg-slate-300'
                    : 'bg-slate-600'
                }`}
                style={{ height: `${height}%` }}
              />
            );
          })}
        </div>

        {!currentUrl && !isLoading && (
          <span
            className={`text-[11px] font-medium flex items-center gap-1 shrink-0 ${
              isDay ? 'text-emerald-700' : 'text-emerald-400/90'
            }`}
          >
            <Sparkles className="w-3 h-3" />
            Gerar voz
          </span>
        )}
      </div>

      {currentUrl && (
        <audio
          ref={audioRef}
          src={currentUrl}
          onTimeUpdate={handleTimeUpdate}
          onEnded={handleEnded}
          className="hidden"
        />
      )}
    </div>
  );
};
