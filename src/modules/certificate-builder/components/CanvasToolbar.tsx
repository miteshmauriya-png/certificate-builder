import React from 'react';
import { Monitor, Tablet, Smartphone, RotateCcw } from 'lucide-react';

interface CanvasToolbarProps {
  device: 'desktop' | 'tablet' | 'mobile';
  zoom: number;
  onChangeDevice: (dev: 'desktop' | 'tablet' | 'mobile') => void;
  onChangeZoom: (zoom: number) => void;
  onResetZoom: () => void;
}

export const CanvasToolbar: React.FC<CanvasToolbarProps> = ({
  device,
  zoom,
  onChangeDevice,
  onChangeZoom,
  onResetZoom,
}) => {
  const zoomPercentages = [25, 50, 75, 100, 125, 150, 200];
  const currentPercent = Math.round(zoom * 100);

  return (
    <div className="flex items-center justify-between pb-3 select-none">
      {/* Device Viewport Toggle matching screenshot */}
      <div className="flex items-center gap-1 bg-white border border-slate-200/90 rounded-lg p-1 shadow-2xs">
        <button
          type="button"
          onClick={() => onChangeDevice('desktop')}
          title="Desktop Preview (100%)"
          aria-label="Desktop preview mode"
          className={`p-1.5 rounded transition-all ${
            device === 'desktop'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Monitor className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onChangeDevice('tablet')}
          title="Tablet Preview (768px)"
          aria-label="Tablet preview mode"
          className={`p-1.5 rounded transition-all ${
            device === 'tablet'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Tablet className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => onChangeDevice('mobile')}
          title="Mobile Preview (375px)"
          aria-label="Mobile preview mode"
          className={`p-1.5 rounded transition-all ${
            device === 'mobile'
              ? 'bg-blue-600 text-white shadow-2xs'
              : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <Smartphone className="w-4 h-4" />
        </button>
      </div>

      {/* Zoom Selector & Reset Button matching screenshot */}
      <div className="flex items-center gap-2">
        <div className="relative">
          <select
            value={zoomPercentages.includes(currentPercent) ? currentPercent : 'custom'}
            onChange={(e) => {
              if (e.target.value !== 'custom') {
                onChangeZoom(Number(e.target.value) / 100);
              }
            }}
            aria-label="Canvas zoom level"
            className="appearance-none bg-white border border-slate-200/90 rounded-lg pl-3 pr-7 py-1.5 text-xs font-semibold text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 shadow-2xs cursor-pointer"
          >
            {zoomPercentages.map((p) => (
              <option key={p} value={p}>
                {p}%
              </option>
            ))}
            {!zoomPercentages.includes(currentPercent) && (
              <option value="custom">{currentPercent}% (Fit)</option>
            )}
          </select>
          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-[10px]">
            ▼
          </div>
        </div>

        <button
          type="button"
          onClick={onResetZoom}
          title="Reset canvas fit to view"
          className="px-3 py-1.5 bg-white border border-slate-200/90 hover:bg-slate-50 rounded-lg text-xs font-semibold text-slate-700 transition-colors shadow-2xs flex items-center gap-1.5 focus:outline-none focus:ring-2 focus:ring-blue-100"
        >
          <RotateCcw className="w-3 h-3 text-slate-500" />
          <span>Reset</span>
        </button>
      </div>
    </div>
  );
};
