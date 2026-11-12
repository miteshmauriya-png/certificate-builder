import React, { useState, useEffect } from 'react';
import { X, Copy, Check, Eye, Code, FileText } from 'lucide-react';
import { certificateApi } from '../api/certificateApi';

interface PreviewModalProps {
  isOpen: boolean;
  templateId?: string;
  templateName: string;
  certificateHtml: string;
  canvasWidth: number;
  canvasHeight: number;
  onClose: () => void;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  templateId = 'preview_temp',
  templateName,
  certificateHtml,
  canvasWidth,
  canvasHeight,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [replaceTokens, setReplaceTokens] = useState(true);
  const [renderedPreview, setRenderedPreview] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!isOpen) return;

    setIsLoading(true);
    certificateApi
      .previewCertificate(templateId, certificateHtml, undefined, replaceTokens)
      .then((res) => {
        setRenderedPreview(res.previewHtml);
      })
      .catch((err) => {
        console.error('Preview error:', err);
        setRenderedPreview(certificateHtml);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [isOpen, certificateHtml, templateId, replaceTokens]);

  if (!isOpen) return null;

  const handleCopyCode = () => {
    navigator.clipboard.writeText(certificateHtml);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Build iframe document
  const iframeSrcDoc = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300..900;1,300..900&family=Playfair+Display:ital,wght@0,400..900;1,400..900&display=swap');
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body {
            background-color: #0b1329;
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 24px;
            font-family: 'Playfair Display', Georgia, serif;
          }
          .cert-container {
            box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.7);
            max-width: 100%;
            height: auto;
            border-radius: 6px;
            overflow: hidden;
          }
        </style>
      </head>
      <body>
        <div class="cert-container">
          ${renderedPreview || certificateHtml}
        </div>
      </body>
    </html>
  `;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-150">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl h-[88vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50/80 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
              <Eye className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900 text-sm">
                Certificate Preview: {templateName || 'Untitled Template'}
              </h3>
              <p className="text-xs text-slate-500">
                Resolution: {canvasWidth} × {canvasHeight}px
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Tab Toggle */}
            <div className="flex items-center bg-slate-200/80 rounded-lg p-0.5 text-xs font-medium">
              <button
                type="button"
                onClick={() => setActiveTab('preview')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                  activeTab === 'preview'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Visual Render</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('code')}
                className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 transition-all ${
                  activeTab === 'code'
                    ? 'bg-white text-slate-900 shadow-2xs font-semibold'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Code className="w-3.5 h-3.5" />
                <span>HTML Output String</span>
              </button>
            </div>

            {/* Close Button */}
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Sub-toolbar for Visual Render */}
        {activeTab === 'preview' && (
          <div className="px-6 py-2.5 bg-slate-100 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-3">
              <span className="font-medium text-slate-700">Token Mode:</span>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="tokenMode"
                  checked={replaceTokens}
                  onChange={() => setReplaceTokens(true)}
                  className="text-blue-600"
                />
                <span className="text-slate-700">Sample Real Data (Jane Doe, Nov 6 2026)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="tokenMode"
                  checked={!replaceTokens}
                  onChange={() => setReplaceTokens(false)}
                  className="text-blue-600"
                />
                <span className="text-slate-700">Literal Tokens (&#123;&#123;Name&#125;&#125;)</span>
              </label>
            </div>

            <span className="text-slate-500 italic text-[11px]">
              Rendered via backend POST /certificate-template/preview
            </span>
          </div>
        )}

        {/* Modal Body */}
        <div className="flex-1 overflow-hidden p-4 bg-slate-950 flex items-center justify-center relative">
          {isLoading ? (
            <div className="text-center text-slate-400">
              <div className="w-8 h-8 border-3 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
              <p className="text-xs">Generating preview...</p>
            </div>
          ) : activeTab === 'preview' ? (
            <iframe
              title="Certificate Preview"
              srcDoc={iframeSrcDoc}
              className="w-full h-full border-0 rounded-lg shadow-inner bg-slate-900"
            />
          ) : (
            <div className="w-full h-full flex flex-col bg-slate-900 rounded-lg overflow-hidden border border-slate-800">
              <div className="px-4 py-2 bg-slate-800/80 border-b border-slate-700 flex items-center justify-between text-xs text-slate-300">
                <span className="font-mono text-emerald-400">Standalone HTML String Fragment</span>
                <button
                  type="button"
                  onClick={handleCopyCode}
                  className="inline-flex items-center gap-1.5 px-3 py-1 bg-slate-700 hover:bg-slate-600 text-white rounded text-xs transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied!' : 'Copy HTML'}</span>
                </button>
              </div>
              <div className="flex-1 p-4 overflow-auto font-mono text-xs text-slate-300 leading-relaxed whitespace-pre-wrap select-all">
                {certificateHtml}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
