import React from 'react';
import { useDraggable } from '@dnd-kit/core';
import { GripVertical, Plus, Check } from 'lucide-react';
import { MasterPlaceholder, CanvasElement } from '../types/certificate';

interface DraggablePlaceholderPillProps {
  placeholder: MasterPlaceholder;
  isPlaced: boolean;
  placedCount: number;
  onToggle: (checked: boolean) => void;
  onAddAnother: () => void;
}

const DraggablePlaceholderPill: React.FC<DraggablePlaceholderPillProps> = ({
  placeholder,
  isPlaced,
  placedCount,
  onToggle,
  onAddAnother,
}) => {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: `palette-${placeholder._id}`,
    data: {
      type: 'placeholder',
      placeholder,
    },
  });

  return (
    <div
      className={`group relative flex items-center justify-between rounded-lg border px-3 py-2 text-xs transition-all ${
        isDragging
          ? 'opacity-40 border-blue-400 bg-blue-50/50'
          : isPlaced
          ? 'border-blue-200 bg-blue-50/40 text-blue-900 shadow-2xs'
          : 'border-slate-200 bg-white hover:border-slate-300 text-slate-700'
      }`}
    >
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        {/* Checkbox */}
        <button
          type="button"
          onClick={() => onToggle(!isPlaced)}
          aria-label={`Toggle ${placeholder.placeholderName}`}
          className={`w-4 h-4 rounded border flex items-center justify-center transition-colors shrink-0 ${
            isPlaced
              ? 'bg-blue-600 border-blue-600 text-white'
              : 'border-slate-300 hover:border-blue-400 bg-white'
          }`}
        >
          {isPlaced && <Check className="w-3 h-3 stroke-[3]" />}
        </button>

        <span className="font-medium truncate select-none">
          {placeholder.placeholderName}
        </span>

        {placedCount > 1 && (
          <span className="text-[10px] bg-blue-100 text-blue-700 font-semibold px-1.5 py-0.2 rounded-full">
            ×{placedCount}
          </span>
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {/* Add multiple instance button if placed */}
        {isPlaced && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onAddAnother();
            }}
            title="Place another instance of this token"
            className="p-1 text-blue-500 hover:text-blue-700 hover:bg-blue-100/60 rounded transition-colors opacity-70 group-hover:opacity-100"
          >
            <Plus className="w-3 h-3" />
          </button>
        )}

        {/* Drag handle for dnd-kit */}
        <div
          ref={setNodeRef}
          {...listeners}
          {...attributes}
          title="Drag and drop onto canvas"
          className="cursor-grab active:cursor-grabbing p-1 text-slate-400 hover:text-slate-700 rounded transition-colors touch-none"
        >
          <GripVertical className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  );
};

interface PlaceholderPaletteProps {
  masterPlaceholders: MasterPlaceholder[];
  elements: CanvasElement[];
  isLoading?: boolean;
  onTogglePlaceholder: (placeholder: MasterPlaceholder, shouldAdd: boolean) => void;
  onAddPlaceholderInstance: (placeholder: MasterPlaceholder) => void;
}

export const PlaceholderPalette: React.FC<PlaceholderPaletteProps> = ({
  masterPlaceholders,
  elements,
  isLoading = false,
  onTogglePlaceholder,
  onAddPlaceholderInstance,
}) => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs transition-all">
      {/* Step Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
            2
          </span>
          <h2 className="font-semibold text-slate-800 text-sm tracking-tight">
            Placeholders
          </h2>
        </div>
        <span className="text-[11px] font-medium text-slate-400">
          {elements.filter((e) => e.type === 'placeholder').length} Placed
        </span>
      </div>

      <p className="text-xs text-slate-500 mb-3.5">
        Select the placeholders you want to use and drag them to the certificate.
      </p>

      {isLoading ? (
        <div className="py-6 flex items-center justify-center gap-2 text-xs text-slate-400">
          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <span>Loading placeholders...</span>
        </div>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
          {masterPlaceholders.map((ph) => {
            const placedMatches = elements.filter(
              (e) => e.type === 'placeholder' && e.placeholderId === ph._id
            );
            const isPlaced = placedMatches.length > 0;

            return (
              <DraggablePlaceholderPill
                key={ph._id}
                placeholder={ph}
                isPlaced={isPlaced}
                placedCount={placedMatches.length}
                onToggle={(checked) => onTogglePlaceholder(ph, checked)}
                onAddAnother={() => onAddPlaceholderInstance(ph)}
              />
            );
          })}
        </div>
      )}

      <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
        <span>Click checkbox or drag pill</span>
        <span className="italic">Generates {`{{Token}}`}</span>
      </div>
    </div>
  );
};
