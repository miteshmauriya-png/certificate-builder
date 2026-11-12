import React from 'react';
import { Save, Send, Eye, RefreshCw, CheckCircle2 } from 'lucide-react';

interface BuilderHeaderProps {
  isSavingDraft: boolean;
  isPublishing: boolean;
  isDirty: boolean;
  publicationStatus?: 'draft' | 'published';
  onSaveDraft: () => void;
  onSubmitPublish: () => void;
  onOpenPreview: () => void;
  onResetTemplate?: () => void;
}

export const BuilderHeader: React.FC<BuilderHeaderProps> = ({
  isSavingDraft,
  isPublishing,
  isDirty,
  publicationStatus = 'draft',
  onSaveDraft,
  onSubmitPublish,
  onOpenPreview,
}) => {
  return (
    <div className="bg-white border-b border-slate-200/90 px-6 py-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4 shrink-0 shadow-xs">
      <div>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1.5" aria-label="Breadcrumb">
          <span className="hover:text-blue-600 cursor-pointer">Home</span>
          <span className="text-slate-300">/</span>
          <span className="hover:text-blue-600 cursor-pointer">Certificate Master</span>
          <span className="text-slate-300">/</span>
          <span className="text-blue-600 font-semibold">Create Certificate</span>
        </nav>

        {/* Page Title & Subtitle */}
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Create Certificate
          </h1>
          {publicationStatus === 'published' ? (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Published
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200">
              Draft
            </span>
          )}
          {isDirty && (
            <span className="text-[11px] font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Unsaved changes
            </span>
          )}
        </div>
        <p className="text-sm text-slate-500 mt-0.5">
          Design your certificate by adding template name, background image, placeholders and content.
        </p>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Preview Button */}
        <button
          type="button"
          onClick={onOpenPreview}
          className="inline-flex items-center gap-2 px-3.5 py-2 text-sm font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <Eye className="w-4 h-4 text-slate-600" />
          <span>Preview</span>
        </button>

        {/* Save Draft Button */}
        <button
          type="button"
          disabled={isSavingDraft}
          onClick={onSaveDraft}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-blue-600 bg-white border border-blue-600 rounded-lg hover:bg-blue-50/70 active:bg-blue-100 disabled:opacity-60 transition-colors shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {isSavingDraft ? (
            <RefreshCw className="w-4 h-4 animate-spin text-blue-600" />
          ) : (
            <Save className="w-4 h-4 text-blue-600" />
          )}
          <span>{isSavingDraft ? 'Saving...' : 'Save Draft'}</span>
        </button>

        {/* Submit Button */}
        <button
          type="button"
          disabled={isPublishing}
          onClick={onSubmitPublish}
          className="inline-flex items-center gap-2 px-5 py-2 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-lg hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 transition-colors shadow-sm shadow-blue-500/20 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
        >
          {isPublishing ? (
            <RefreshCw className="w-4 h-4 animate-spin text-white" />
          ) : (
            <Send className="w-4 h-4 text-white" />
          )}
          <span>{isPublishing ? 'Publishing...' : 'Submit'}</span>
        </button>
      </div>
    </div>
  );
};
