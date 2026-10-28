import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Smartphone,
  MessageSquare,
  QrCode,
  ExternalLink,
  Sparkles,
  Send,
  MessageCircle,
  HelpCircle,
} from 'lucide-react';
import { BusinessConfig } from '../services/api';

interface ShareTestModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: BusinessConfig;
  theme?: 'day' | 'night';
}

export const ShareTestModal: React.FC<ShareTestModalProps> = ({
  isOpen,
  onClose,
  config,
  theme = 'night',
}) => {
  const isDay = theme === 'day';
  const [selectedFormat, setSelectedFormat] = useState<'simulator' | 'chat'>('simulator');
  const [copied, setCopied] = useState(false);
  const [showQr, setShowQr] = useState(false);

  if (!isOpen) return null;

  // Compute live testing URL based on current active origin:
  const currentOrigin =
    typeof window !== 'undefined' && window.location.origin && window.location.origin !== 'null'
      ? window.location.origin
      : 'https://ais-dev-7sgxmz7eq6lbxylmnqafgi-702392667993.us-east1.run.app';

  const publicBaseUrl = currentOrigin;

  const testUrl =
    selectedFormat === 'simulator'
      ? `${publicBaseUrl}?tab=simulator`
      : `${publicBaseUrl}?tab=chat`;

  const shareText = `Olá! Criei a *${config.botName}*, assistente virtual inteligente da *${config.companyName}*.
Faça um teste conversando com ela por texto ou áudio aqui:
${testUrl}`;

  const whatsappShareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;

  const handleCopy = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(testUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&margin=10&data=${encodeURIComponent(
    testUrl
  )}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-2xl shadow-2xl border max-h-[92vh] flex flex-col overflow-hidden transition-colors ${
          isDay
            ? 'bg-white border-slate-200 text-slate-800'
            : 'bg-[#151722] border-slate-800 text-slate-100'
        }`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between p-4 border-b shrink-0 ${
            isDay ? 'border-slate-200 bg-slate-50/80' : 'border-slate-800 bg-[#1a1c2b]/60'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center text-slate-950 font-bold shadow-xs">
              <Share2 className="w-5 h-5 text-slate-950" />
            </div>
            <div>
              <h3 className={`font-bold text-base leading-tight ${isDay ? 'text-slate-900' : 'text-white'}`}>
                Link Público de Teste para Clientes
              </h3>
              <p className={`text-xs ${isDay ? 'text-slate-500' : 'text-slate-400'}`}>
                Envie para clientes ou amigos experimentarem a LIA
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`w-8 h-8 rounded-lg flex items-center justify-center transition cursor-pointer ${
              isDay ? 'hover:bg-slate-200 text-slate-500' : 'hover:bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-sm">
          {/* Format selector */}
          <div>
            <label className={`block text-xs font-semibold mb-2 ${isDay ? 'text-slate-600' : 'text-slate-300'}`}>
              Como você prefere que o cliente visualize?
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setSelectedFormat('simulator')}
                className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                  selectedFormat === 'simulator'
                    ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                    : isDay
                    ? 'border-slate-200 hover:border-slate-300 bg-slate-50'
                    : 'border-slate-800 hover:border-slate-700 bg-[#1c1e2d]'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-emerald-500">
                  <Smartphone className="w-4 h-4" />
                  <span>Simulador WhatsApp</span>
                </div>
                <p className={`text-[11px] leading-snug ${isDay ? 'text-slate-500' : 'text-slate-400'}`}>
                  Exibe a interface idêntica ao app do WhatsApp. Perfeito para celular!
                </p>
              </button>

              <button
                type="button"
                onClick={() => setSelectedFormat('chat')}
                className={`p-3 rounded-xl border text-left transition flex flex-col gap-1 cursor-pointer ${
                  selectedFormat === 'chat'
                    ? 'border-emerald-500 bg-emerald-500/10 ring-1 ring-emerald-500'
                    : isDay
                    ? 'border-slate-200 hover:border-slate-300 bg-slate-50'
                    : 'border-slate-800 hover:border-slate-700 bg-[#1c1e2d]'
                }`}
              >
                <div className="flex items-center gap-2 font-bold text-xs text-teal-400">
                  <MessageSquare className="w-4 h-4" />
                  <span>Chat Web Completo</span>
                </div>
                <p className={`text-[11px] leading-snug ${isDay ? 'text-slate-500' : 'text-slate-400'}`}>
                  Layout de chat amplo com botões de perguntas rápidas na lateral.
                </p>
              </button>
            </div>
          </div>

          {/* Public Link Box */}
          <div
            className={`p-3.5 rounded-xl border ${
              isDay ? 'bg-slate-50 border-slate-200' : 'bg-[#181a26] border-slate-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-xs font-semibold ${isDay ? 'text-slate-700' : 'text-slate-300'}`}>
                Link Ativo para Testar:
              </span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 px-2 py-0.5 rounded-full font-bold">
                Servidor Ativo
              </span>
            </div>

            <div className="flex items-center gap-2 mt-2">
              <input
                type="text"
                readOnly
                value={testUrl}
                className={`flex-1 font-mono text-xs px-3 py-2 rounded-lg border outline-none select-all truncate ${
                  isDay
                    ? 'bg-white border-slate-300 text-slate-800'
                    : 'bg-[#0f1016] border-slate-700 text-slate-200'
                }`}
              />

              <button
                onClick={handleCopy}
                className={`px-3 py-2 rounded-lg font-semibold text-xs transition flex items-center gap-1.5 shrink-0 cursor-pointer active:scale-95 ${
                  copied
                    ? 'bg-emerald-600 text-white'
                    : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold'
                }`}
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5" />
                    <span>Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copiar</span>
                  </>
                )}
              </button>
            </div>
            <p className={`text-[11px] mt-2 leading-relaxed ${isDay ? 'text-slate-500' : 'text-slate-400'}`}>
              💡 <strong>Atenção ao abrir em outro navegador:</strong> O link usa o servidor ativo (<code>ais-dev</code>). Se abrir no celular ou em outro navegador, abra com sua conta Google logada. Para liberar acesso público universal a clientes externos, use o botão <strong>Share (Compartilhar)</strong> na barra superior do Google AI Studio.
            </p>
          </div>

          {/* Quick Actions: WhatsApp & QR Code */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
            <a
              href={whatsappShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white font-bold text-xs shadow-md active:scale-98 transition text-center"
            >
              <MessageCircle className="w-4 h-4 shrink-0" />
              <span>Enviar pelo WhatsApp</span>
            </a>

            <button
              type="button"
              onClick={() => setShowQr(!showQr)}
              className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border text-xs font-semibold cursor-pointer active:scale-98 transition ${
                showQr
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-500'
                  : isDay
                  ? 'border-slate-300 hover:bg-slate-100 text-slate-700'
                  : 'border-slate-700 hover:bg-slate-800 text-slate-200'
              }`}
            >
              <QrCode className="w-4 h-4 shrink-0" />
              <span>{showQr ? 'Ocultar QR Code' : 'Mostrar QR Code'}</span>
            </button>
          </div>

          {/* QR Code Section */}
          {showQr && (
            <div
              className={`p-4 rounded-xl border flex flex-col items-center justify-center text-center animate-in zoom-in-95 duration-200 ${
                isDay ? 'bg-slate-50 border-slate-200' : 'bg-[#181a26] border-slate-800'
              }`}
            >
              <p className={`text-xs font-semibold mb-2 ${isDay ? 'text-slate-700' : 'text-slate-300'}`}>
                Aponte a câmera do celular para abrir o teste na hora:
              </p>
              <div className="p-2 bg-white rounded-xl shadow-md border border-slate-200 inline-block mb-2">
                <img
                  src={qrImageUrl}
                  alt="QR Code de teste"
                  className="w-48 h-48 rounded-lg object-contain"
                />
              </div>
              <span className={`text-[11px] ${isDay ? 'text-slate-500' : 'text-slate-400'}`}>
                Funciona em qualquer celular Android ou iPhone
              </span>
            </div>
          )}

          {/* Client Instructions / Highlights */}
          <div
            className={`p-3.5 rounded-xl border space-y-2 ${
              isDay ? 'bg-emerald-50/60 border-emerald-200/80' : 'bg-emerald-950/20 border-emerald-800/40'
            }`}
          >
            <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-700 dark:text-emerald-400">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>Como o cliente experimenta a LIA:</span>
            </div>
            <ul className={`text-[11px] space-y-1.5 ${isDay ? 'text-slate-600' : 'text-slate-300'}`}>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                <span>
                  <strong>Sem cadastros ou senhas:</strong> o cliente clica no link e já começa a conversar direto.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                <span>
                  <strong>Áudio e Voz:</strong> o cliente pode falar pelo microfone ou digitar perguntas sobre Cartão NFC, Superlimpo, Fachadas e Serviços.
                </span>
              </li>
              <li className="flex items-start gap-1.5">
                <span className="text-emerald-600 font-bold shrink-0">✓</span>
                <span>
                  <strong>Transbordo humano:</strong> quando o cliente pede para falar com alguém, a LIA direciona para o seu WhatsApp oficial ({config.businessPhone}).
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div
          className={`p-3 sm:p-4 border-t flex items-center justify-between shrink-0 ${
            isDay ? 'border-slate-200 bg-slate-50' : 'border-slate-800 bg-[#161824]'
          }`}
        >
          <a
            href={testUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={`inline-flex items-center gap-1 text-xs font-medium ${
              isDay ? 'text-slate-600 hover:text-emerald-600' : 'text-slate-400 hover:text-emerald-400'
            }`}
          >
            <ExternalLink className="w-3.5 h-3.5" />
            <span>Abrir em nova aba para testar</span>
          </a>

          <button
            onClick={onClose}
            className={`px-4 py-1.5 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              isDay
                ? 'bg-white border-slate-300 text-slate-700 hover:bg-slate-100'
                : 'bg-slate-800 border-slate-700 text-slate-200 hover:bg-slate-700'
            }`}
          >
            Fechar
          </button>
        </div>
      </div>
    </div>
  );
};
