import React, { useState, useEffect, useRef } from 'react';
import { Upload, X, Check, AlertCircle, Image as ImageIcon, Sparkles } from 'lucide-react';
import { Attachment } from '../types/certificate';
import { certificateApi } from '../api/certificateApi';
import { normalizeDimensions } from '../utils/certificateHtml';

interface TemplateDetailsFormProps {
  templateName: string;
  templateId?: string;
  description: string;
  background: Attachment | null;
  canvasWidth: number;
  canvasHeight: number;
  onChangeName: (val: string) => void;
  onChangeDescription: (val: string) => void;
  onSetBackground: (bg: Attachment | null, naturalW: number, naturalH: number) => void;
}

export const TemplateDetailsForm: React.FC<TemplateDetailsFormProps> = ({
  templateName,
  templateId,
  description,
  background,
  canvasWidth,
  canvasHeight,
  onChangeName,
  onChangeDescription,
  onSetBackground,
}) => {
  const [nameStatus, setNameStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [nameError, setNameError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Debounced uniqueness check (300ms)
  useEffect(() => {
    if (!templateName.trim()) {
      setNameStatus('idle');
      setNameError(null);
      return;
    }

    setNameStatus('checking');
    const timer = setTimeout(async () => {
      try {
        const res = await certificateApi.checkTemplateName(templateName.trim(), templateId);
        if (res.isValid) {
          setNameStatus('valid');
          setNameError(null);
        } else {
          setNameStatus('invalid');
          setNameError(res.message || 'Template name is already in use');
        }
      } catch (err: any) {
        setNameStatus('idle');
        setNameError(err.message || 'Failed to validate name');
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [templateName, templateId]);

  // Decode image file and compute natural width and height
  const processImageFile = (file: File) => {
    setUploadError(null);

    // Validate mime type: jpg or png
    const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(jpe?g|png|svg)$/i)) {
      setUploadError('Please upload a JPG or PNG image (max 5MB)');
      return;
    }

    // Validate size: <= 5MB
    if (file.size > 5 * 1024 * 1024) {
      setUploadError('Image file size exceeds the 5MB limit');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      const img = new Image();
      img.onload = async () => {
        const { width, height } = normalizeDimensions(img.naturalWidth || 1920, img.naturalHeight || 1358);
        try {
          const attachment = await certificateApi.uploadImage(dataUrl, file.name, file.size, file.type);
          onSetBackground(attachment, width, height);
        } catch {
          // Fallback to direct dataUrl attachment
          onSetBackground(
            {
              attFileUrl: dataUrl,
              attFileName: file.name,
              attFileSizeBytes: file.size,
              attMimeType: file.type,
              attUrlExpiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
            },
            width,
            height
          );
        }
      };
      img.onerror = () => {
        setUploadError('Failed to load image. Please verify file format.');
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processImageFile(e.target.files[0]);
    }
  };

  const handleRemoveBackground = () => {
    onSetBackground(null, 1920, 1358);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUsePresetBackground = () => {
    onSetBackground(
      {
        attFileUrl: '/certificate-bg.svg',
        attFileName: 'certificate-bg.jpg',
        attFileSizeBytes: 180 * 1024,
        attMimeType: 'image/svg+xml',
        attUrlExpiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
      },
      1920,
      1358
    );
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs transition-all">
      {/* Step Header */}
      <div className="flex items-center gap-2.5 mb-4">
        <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
          1
        </span>
        <h2 className="font-semibold text-slate-800 text-sm tracking-tight">
          Template Details
        </h2>
      </div>

      <div className="space-y-4 text-xs">
        {/* Template Name */}
        <div>
          <label htmlFor="template-name-input" className="block font-medium text-slate-700 mb-1.5">
            Template Name <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <input
              id="template-name-input"
              type="text"
              value={templateName}
              onChange={(e) => onChangeName(e.target.value)}
              placeholder="e.g. Certificate of Completion"
              className={`w-full px-3.5 py-2 rounded-lg border text-xs text-slate-800 placeholder-slate-400 bg-white focus:outline-none transition-colors ${
                nameStatus === 'invalid'
                  ? 'border-red-400 focus:ring-2 focus:ring-red-200'
                  : nameStatus === 'valid'
                  ? 'border-emerald-400 focus:ring-2 focus:ring-emerald-200'
                  : 'border-slate-300 focus:ring-2 focus:ring-blue-100 focus:border-blue-500'
              }`}
            />
            <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center">
              {nameStatus === 'checking' && (
                <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              )}
              {nameStatus === 'valid' && <Check className="w-4 h-4 text-emerald-500" />}
              {nameStatus === 'invalid' && <AlertCircle className="w-4 h-4 text-red-500" />}
            </div>
          </div>
          {nameError && (
            <p className="text-[11px] text-red-500 mt-1 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {nameError}
            </p>
          )}
        </div>

        {/* Description (Optional) */}
        <div>
          <label htmlFor="template-description-input" className="block font-medium text-slate-700 mb-1.5">
            Description
          </label>
          <textarea
            id="template-description-input"
            rows={2}
            value={description}
            onChange={(e) => onChangeDescription(e.target.value)}
            placeholder="Add brief description or purpose of this template"
            className="w-full px-3 py-1.5 rounded-lg border border-slate-300 text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-colors resize-none"
          />
        </div>

        {/* Upload Background Image */}
        <div>
          <label className="block font-medium text-slate-700 mb-1.5">
            Upload Background Image <span className="text-red-500">*</span>
          </label>

          {background ? (
            /* Thumbnail View with Remove Button matching screenshot */
            <div className="flex items-center gap-3 p-2.5 rounded-lg border border-slate-200 bg-slate-50/70">
              <div className="relative w-24 h-16 rounded border border-slate-300 overflow-hidden bg-white shrink-0 shadow-2xs group">
                <img
                  src={background.attFileUrl}
                  alt={background.attFileName}
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={handleRemoveBackground}
                  title="Remove image"
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-slate-800/80 hover:bg-red-600 text-white flex items-center justify-center transition-colors shadow-xs"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-slate-800 truncate text-xs">
                  {background.attFileName}
                </p>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Natural: {canvasWidth} × {canvasHeight}px
                </p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center text-[10px] text-emerald-600 font-medium">
                    <Check className="w-3 h-3 mr-0.5" /> Ready
                  </span>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="text-[11px] text-blue-600 hover:text-blue-700 font-medium hover:underline"
                  >
                    Replace
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Drag & Drop Upload Area matching screenshot */
            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-blue-500 bg-blue-50/70'
                  : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/80'
              }`}
            >
              <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-600 mx-auto flex items-center justify-center mb-2">
                <Upload className="w-4 h-4" />
              </div>
              <p className="font-medium text-blue-600 hover:underline text-xs">
                Click to upload or drag and drop
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Supported formats: JPG, PNG (Max 5MB)
              </p>
            </div>
          )}

          {/* Quick preset background button */}
          {!background && (
            <div className="mt-2.5 flex items-center justify-between pt-1">
              <span className="text-[11px] text-slate-400">Need a sample background?</span>
              <button
                type="button"
                onClick={handleUsePresetBackground}
                className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 bg-blue-50/80 hover:bg-blue-100/80 px-2 py-1 rounded transition-colors"
              >
                <Sparkles className="w-3 h-3 text-amber-500" />
                Use Classic Blue & Gold
              </button>
            </div>
          )}

          {uploadError && (
            <p className="text-[11px] text-red-500 mt-1.5 flex items-center gap-1">
              <AlertCircle className="w-3 h-3 shrink-0" />
              {uploadError}
            </p>
          )}

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/svg+xml"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      </div>
    </div>
  );
};
