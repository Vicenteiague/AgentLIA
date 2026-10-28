import React from 'react';
import { ExternalLink, Globe, Smartphone } from 'lucide-react';

interface FormattedMessageTextProps {
  text: string;
  isUser?: boolean;
  theme?: 'day' | 'night';
  variant?: 'chat' | 'whatsapp';
}

/**
 * Normalizes WhatsApp and generic URLs (e.g. removes double slashes in wa.me//55...)
 */
export function normalizeUrl(rawUrl: string): string {
  let url = rawUrl.trim();
  // Fix https://wa.me// -> https://wa.me/
  url = url.replace(/https?:\/\/wa\.me\/+/gi, 'https://wa.me/');
  // Ensure http/https
  if (!/^https?:\/\//i.test(url)) {
    url = `https://${url}`;
  }
  return url;
}

/**
 * Extracts all URLs found in the message for quick action buttons
 */
export function extractUrlsFromText(text: string): { label: string; url: string; type: 'whatsapp' | 'website' | 'other' }[] {
  const urls: { label: string; url: string; type: 'whatsapp' | 'website' | 'other' }[] = [];
  const seen = new Set<string>();

  // 1. Check markdown links [label](url)
  const mdRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)/g;
  let match;
  while ((match = mdRegex.exec(text)) !== null) {
    const rawLabel = match[1].trim();
    const clean = normalizeUrl(match[2].trim());
    if (!seen.has(clean)) {
      seen.add(clean);
      const isWa = clean.includes('wa.me') || clean.includes('whatsapp');
      urls.push({
        label: rawLabel.replace(/^https?:\/\//, ''),
        url: clean,
        type: isWa ? 'whatsapp' : 'website',
      });
    }
  }

  // 2. Check bare URLs (https?://...)
  const bareRegex = /(https?:\/\/[^\s\)]+)/g;
  while ((match = bareRegex.exec(text)) !== null) {
    const rawUrl = match[1].trim().replace(/[.,;:]+$/, '');
    const clean = normalizeUrl(rawUrl);
    if (!seen.has(clean)) {
      seen.add(clean);
      const isWa = clean.includes('wa.me') || clean.includes('whatsapp');
      let displayLabel = clean.replace(/^https?:\/\/(www\.)?/, '').replace(/\/$/, '');
      if (clean.includes('vicenteiaguebiositegoogleia')) displayLabel = 'Modelo Biosite IA';
      else if (clean.includes('avaliacard')) displayLabel = 'Avaliacard NFC';
      else if (clean.includes('startmktlocal')) displayLabel = 'Website Oficial';
      else if (isWa) displayLabel = 'WhatsApp Especialista';

      urls.push({
        label: displayLabel,
        url: clean,
        type: isWa ? 'whatsapp' : 'website',
      });
    }
  }

  return urls;
}

export const FormattedMessageText: React.FC<FormattedMessageTextProps> = ({
  text,
  isUser = false,
  theme = 'day',
  variant = 'chat',
}) => {
  const isWhatsApp = variant === 'whatsapp';
  const isNight = theme === 'night';

  // Parse text into tokens: Markdown Links, Bare URLs, Bold, and Plain Text
  const renderFormattedTokens = () => {
    // Regex covers:
    // 1: Markdown link: [text](url)
    // 2: Bare URL: https://...
    // 3: Markdown bold: **text**
    // 4: WhatsApp bold: *text*
    const combinedRegex = /\[([^\]]+)\]\((https?:\/\/[^\s\)]+)\)|(https?:\/\/[^\s\)]+[^\s.,;!?:)])|(\*\*([^*]+)\*\*)|(\*([^* \n][^*\n]*[^* \n]|\w)\*)/g;

    const elements: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;
    let keyIdx = 0;

    const linkClass = isWhatsApp
      ? isNight
        ? 'text-[#53bdeb] underline font-semibold hover:text-[#7fd4ff] inline-flex items-center gap-0.5 break-all cursor-pointer'
        : 'text-[#027eb5] underline font-semibold hover:text-[#015f8a] inline-flex items-center gap-0.5 break-all cursor-pointer'
      : isUser
      ? 'text-yellow-200 underline font-semibold hover:text-white inline-flex items-center gap-0.5 break-all cursor-pointer'
      : isNight
      ? 'text-cyan-400 underline font-semibold hover:text-cyan-300 inline-flex items-center gap-0.5 break-all cursor-pointer'
      : 'text-emerald-700 underline font-semibold hover:text-emerald-800 inline-flex items-center gap-0.5 break-all cursor-pointer';

    while ((match = combinedRegex.exec(text)) !== null) {
      // Plain text before match
      if (match.index > lastIndex) {
        elements.push(
          <span key={`txt-${keyIdx++}`}>
            {text.substring(lastIndex, match.index)}
          </span>
        );
      }

      if (match[1] && match[2]) {
        // [Label](url)
        const label = match[1];
        const rawUrl = match[2];
        const clean = normalizeUrl(rawUrl);
        elements.push(
          <a
            key={`md-link-${keyIdx++}`}
            href={clean}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
            onClick={(e) => e.stopPropagation()}
            title={`Abrir link: ${clean}`}
          >
            <span>{label}</span>
            <ExternalLink className="w-3 h-3 shrink-0 inline-block opacity-80" />
          </a>
        );
      } else if (match[3]) {
        // Bare URL: match[3]
        const rawUrl = match[3];
        const clean = normalizeUrl(rawUrl);
        elements.push(
          <a
            key={`url-link-${keyIdx++}`}
            href={clean}
            target="_blank"
            rel="noopener noreferrer"
            className={linkClass}
            onClick={(e) => e.stopPropagation()}
            title={`Abrir link: ${clean}`}
          >
            <span>{rawUrl}</span>
            <ExternalLink className="w-3 h-3 shrink-0 inline-block opacity-80" />
          </a>
        );
      } else if (match[4]) {
        // **bold**
        const boldText = match[5];
        elements.push(
          <strong key={`b-${keyIdx++}`} className="font-bold">
            {boldText}
          </strong>
        );
      } else if (match[6]) {
        // *bold*
        const boldText = match[7];
        elements.push(
          <strong key={`wb-${keyIdx++}`} className="font-bold">
            {boldText}
          </strong>
        );
      }

      lastIndex = combinedRegex.lastIndex;
    }

    if (lastIndex < text.length) {
      elements.push(
        <span key={`txt-${keyIdx++}`}>{text.substring(lastIndex)}</span>
      );
    }

    return elements;
  };

  const detectedUrls = extractUrlsFromText(text);

  return (
    <div className="flex flex-col gap-2">
      <div className="whitespace-pre-wrap font-normal break-words">
        {renderFormattedTokens()}
      </div>

      {/* Quick Action Buttons for Links (Easy 1-tap click on mobile) */}
      {!isUser && detectedUrls.length > 0 && (
        <div className="mt-1 pt-1.5 flex flex-wrap gap-1.5 border-t border-black/10 dark:border-white/10">
          {detectedUrls.map((item, idx) => (
            <a
              key={`action-btn-${idx}`}
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold shadow-xs transition active:scale-95 ${
                item.type === 'whatsapp'
                  ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                  : isWhatsApp
                  ? isNight
                    ? 'bg-[#182229] hover:bg-[#202c33] text-emerald-300 border border-emerald-500/30'
                    : 'bg-white hover:bg-slate-50 text-emerald-800 border border-slate-300'
                  : isNight
                  ? 'bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-cyan-500/30'
                  : 'bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300'
              }`}
            >
              {item.type === 'whatsapp' ? (
                <Smartphone className="w-3.5 h-3.5 shrink-0" />
              ) : (
                <Globe className="w-3.5 h-3.5 shrink-0" />
              )}
              <span className="truncate max-w-[200px]">{item.label}</span>
              <ExternalLink className="w-3 h-3 shrink-0 opacity-70" />
            </a>
          ))}
        </div>
      )}
    </div>
  );
};
