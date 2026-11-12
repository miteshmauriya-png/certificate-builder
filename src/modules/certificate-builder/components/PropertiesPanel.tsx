import React from 'react';
import {
  PenTool,
  User,
  X,
  Minus,
  Plus,
  ArrowUp,
  ArrowDown,
  ChevronsUp,
  Trash2,
  Sliders,
} from 'lucide-react';
import { CanvasElement, SUPPORTED_FONTS } from '../types/certificate';
import { clampWithinCanvas } from '../utils/certificateHtml';

interface PropertiesPanelProps {
  element: CanvasElement | null;
  canvasWidth: number;
  canvasHeight: number;
  allElements: CanvasElement[];
  onUpdateElement: (uid: string, updates: Partial<CanvasElement>) => void;
  onDeselect: () => void;
  onDeleteElement: (uid: string) => void;
}

export const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  element,
  canvasWidth,
  canvasHeight,
  allElements,
  onUpdateElement,
  onDeselect,
  onDeleteElement,
}) => {
  if (!element) {
    return (
      <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs transition-all text-center">
        <div className="flex items-center gap-2 mb-4">
          <PenTool className="w-4 h-4 text-blue-600" />
          <h2 className="font-semibold text-slate-800 text-sm tracking-tight">
            Text Properties
          </h2>
        </div>
        <div className="py-12 px-4 flex flex-col items-center justify-center text-center">
          <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
            <Sliders className="w-6 h-6" />
          </div>
          <p className="text-xs font-medium text-slate-700 mb-1">
            No Element Selected
          </p>
          <p className="text-[11px] text-slate-400 max-w-[200px] leading-relaxed">
            Click on any placeholder or text box on the certificate canvas to edit its typography, position, and styling.
          </p>
        </div>
      </div>
    );
  }

  const handleFontSizeChange = (delta: number) => {
    const next = Math.max(8, Math.min(200, (element.fontSize || 24) + delta));
    onUpdateElement(element.uid, { fontSize: next });
  };

  const handlePositionChange = (axis: 'x' | 'y', delta: number) => {
    const nextX = axis === 'x' ? element.x + delta : element.x;
    const nextY = axis === 'y' ? element.y + delta : element.y;
    const clamped = clampWithinCanvas(
      nextX,
      nextY,
      element.width,
      element.height,
      canvasWidth,
      canvasHeight
    );
    onUpdateElement(element.uid, { [axis]: clamped[axis] });
  };

  const handleBringToFront = () => {
    const maxZ = Math.max(...allElements.map((e) => e.zIndex || 1), 1);
    onUpdateElement(element.uid, { zIndex: maxZ + 1 });
  };

  const handleLayerShift = (delta: number) => {
    const nextZ = Math.max(1, (element.zIndex || 1) + delta);
    onUpdateElement(element.uid, { zIndex: nextZ });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs transition-all space-y-4">
      {/* Panel Header */}
      <div className="flex items-center justify-between pb-1 border-b border-slate-100">
        <div className="flex items-center gap-2">
          <PenTool className="w-4 h-4 text-blue-600" />
          <h2 className="font-semibold text-slate-800 text-sm tracking-tight">
            Text Properties
          </h2>
        </div>
        <button
          type="button"
          onClick={() => onDeleteElement(element.uid)}
          title="Delete selected element"
          className="p-1 rounded text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      </div>

      {/* Selected Placeholder Input matching screenshot */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">
          Selected Placeholder
        </label>
        <div className="relative flex items-center">
          <div className="absolute left-3 text-slate-400 pointer-events-none">
            <User className="w-4 h-4" />
          </div>
          <input
            type="text"
            readOnly
            value={element.token || element.label || 'Static Block'}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-8 py-2 text-xs font-semibold text-slate-800 focus:outline-none cursor-default"
          />
          <button
            type="button"
            onClick={onDeselect}
            title="Deselect"
            className="absolute right-2.5 p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Font Family Dropdown matching screenshot */}
      <div>
        <label htmlFor="font-family-select" className="block text-xs font-medium text-slate-700 mb-1.5">
          Font Family
        </label>
        <div className="relative">
          <select
            id="font-family-select"
            value={element.fontFamily}
            onChange={(e) => onUpdateElement(element.uid, { fontFamily: e.target.value })}
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-500 cursor-pointer"
          >
            {SUPPORTED_FONTS.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Font Size Stepper matching screenshot */}
      <div>
        <label htmlFor="font-size-input" className="block text-xs font-medium text-slate-700 mb-1.5">
          Font Size
        </label>
        <div className="flex items-center rounded-lg border border-slate-300 bg-white overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => handleFontSizeChange(-2)}
            title="Decrease font size"
            className="px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors border-r border-slate-200 focus:outline-none"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>

          <input
            id="font-size-input"
            type="number"
            min={8}
            max={200}
            value={element.fontSize}
            onChange={(e) => {
              const val = Number(e.target.value);
              if (!isNaN(val)) {
                onUpdateElement(element.uid, { fontSize: Math.max(8, Math.min(200, val)) });
              }
            }}
            className="w-full text-center py-2 text-xs font-semibold text-slate-800 focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />

          <button
            type="button"
            onClick={() => handleFontSizeChange(2)}
            title="Increase font size"
            className="px-3 py-2 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-colors border-l border-slate-200 focus:outline-none"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Text Style: Bold, Italic, Alignments matching screenshot */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">
          Text Style
        </label>
        <div className="flex items-center gap-2">
          {/* Bold & Italic & Underline */}
          <div className="flex items-center rounded-lg border border-slate-300 bg-white p-0.5 shadow-2xs">
            <button
              type="button"
              onClick={() => onUpdateElement(element.uid, { bold: !element.bold })}
              title="Bold"
              className={`px-3 py-1.5 rounded text-xs font-bold transition-all ${
                element.bold
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              B
            </button>
            <button
              type="button"
              onClick={() => onUpdateElement(element.uid, { italic: !element.italic })}
              title="Italic"
              className={`px-3 py-1.5 rounded text-xs italic font-serif transition-all ${
                element.italic
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              I
            </button>
            <button
              type="button"
              onClick={() => onUpdateElement(element.uid, { underline: !element.underline })}
              title="Underline"
              className={`px-2.5 py-1.5 rounded text-xs underline transition-all ${
                element.underline
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-700 hover:bg-slate-100'
              }`}
            >
              U
            </button>
          </div>

          {/* Alignment Group */}
          <div className="flex items-center rounded-lg border border-slate-300 bg-white p-0.5 shadow-2xs ml-auto">
            <button
              type="button"
              onClick={() => onUpdateElement(element.uid, { textAlign: 'left' })}
              title="Align Left"
              className={`p-1.5 rounded transition-all ${
                element.textAlign === 'left'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="text-xs font-bold">L</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdateElement(element.uid, { textAlign: 'center' })}
              title="Align Center"
              className={`p-1.5 rounded transition-all ${
                element.textAlign === 'center'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="text-xs font-bold">C</span>
            </button>
            <button
              type="button"
              onClick={() => onUpdateElement(element.uid, { textAlign: 'right' })}
              title="Align Right"
              className={`p-1.5 rounded transition-all ${
                element.textAlign === 'right'
                  ? 'bg-blue-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:bg-slate-100'
              }`}
            >
              <span className="text-xs font-bold">R</span>
            </button>
          </div>
        </div>
      </div>

      {/* Text Color matching screenshot */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">
          Text Color
        </label>
        <div className="flex items-center gap-2 border border-slate-300 rounded-lg p-1.5 bg-white shadow-2xs">
          <input
            type="color"
            value={element.color}
            onChange={(e) => onUpdateElement(element.uid, { color: e.target.value })}
            className="w-7 h-7 rounded border border-slate-200 cursor-pointer p-0 bg-transparent"
          />
          <input
            type="text"
            value={element.color}
            onChange={(e) => onUpdateElement(element.uid, { color: e.target.value })}
            className="w-full text-xs font-mono font-medium text-slate-800 uppercase focus:outline-none"
          />
          {/* Color Presets */}
          <div className="flex items-center gap-1 pr-1">
            {['#0B3D91', '#1E293B', '#D97706', '#047857', '#9333EA'].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => onUpdateElement(element.uid, { color: preset })}
                className="w-4 h-4 rounded-full border border-slate-300 shrink-0 hover:scale-110 transition-transform"
                style={{ backgroundColor: preset }}
                title={`Select ${preset}`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Position X and Y matching screenshot */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">
          Position (Natural px)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {/* X Input */}
          <div className="flex items-center rounded-lg border border-slate-300 bg-white px-2 py-1.5 shadow-2xs">
            <span className="text-xs font-semibold text-slate-400 mr-2">X</span>
            <input
              type="number"
              value={element.x}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (!isNaN(val)) {
                  const clamped = clampWithinCanvas(
                    val,
                    element.y,
                    element.width,
                    element.height,
                    canvasWidth,
                    canvasHeight
                  );
                  onUpdateElement(element.uid, { x: clamped.x });
                }
              }}
              className="w-full text-xs font-semibold text-slate-800 focus:outline-none"
            />
            <div className="flex flex-col ml-1">
              <button
                type="button"
                onClick={() => handlePositionChange('x', 5)}
                className="text-slate-400 hover:text-slate-700 text-[10px] leading-3"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => handlePositionChange('x', -5)}
                className="text-slate-400 hover:text-slate-700 text-[10px] leading-3"
              >
                ▼
              </button>
            </div>
          </div>

          {/* Y Input */}
          <div className="flex items-center rounded-lg border border-slate-300 bg-white px-2 py-1.5 shadow-2xs">
            <span className="text-xs font-semibold text-slate-400 mr-2">Y</span>
            <input
              type="number"
              value={element.y}
              onChange={(e) => {
                const val = Number(e.target.value);
                if (!isNaN(val)) {
                  const clamped = clampWithinCanvas(
                    element.x,
                    val,
                    element.width,
                    element.height,
                    canvasWidth,
                    canvasHeight
                  );
                  onUpdateElement(element.uid, { y: clamped.y });
                }
              }}
              className="w-full text-xs font-semibold text-slate-800 focus:outline-none"
            />
            <div className="flex flex-col ml-1">
              <button
                type="button"
                onClick={() => handlePositionChange('y', 5)}
                className="text-slate-400 hover:text-slate-700 text-[10px] leading-3"
              >
                ▲
              </button>
              <button
                type="button"
                onClick={() => handlePositionChange('y', -5)}
                className="text-slate-400 hover:text-slate-700 text-[10px] leading-3"
              >
                ▼
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Layer Controls matching screenshot */}
      <div>
        <label className="block text-xs font-medium text-slate-700 mb-1.5">
          Layer (z-index: {element.zIndex})
        </label>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleLayerShift(1)}
            title="Layer Up"
            className="p-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors shadow-2xs"
          >
            <ArrowUp className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => handleLayerShift(-1)}
            title="Layer Down"
            className="p-2 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 transition-colors shadow-2xs"
          >
            <ArrowDown className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={handleBringToFront}
            className="flex-1 py-2 px-3 rounded-lg border border-slate-300 hover:bg-slate-100 text-xs font-medium text-slate-700 transition-colors shadow-2xs flex items-center justify-center gap-1.5"
          >
            <ChevronsUp className="w-3.5 h-3.5 text-blue-600" />
            <span>Bring to Front</span>
          </button>
        </div>
      </div>
    </div>
  );
};
