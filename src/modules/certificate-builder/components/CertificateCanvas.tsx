import React, { useRef } from 'react';
import { useDroppable } from '@dnd-kit/core';
import { Info, Image as ImageIcon } from 'lucide-react';
import { CanvasElement, Attachment } from '../types/certificate';
import { PlaceholderElement } from './PlaceholderElement';

interface CertificateCanvasProps {
  background: Attachment | null;
  canvasWidth: number;
  canvasHeight: number;
  elements: CanvasElement[];
  selectedUid: string | null;
  zoom: number;
  device: 'desktop' | 'tablet' | 'mobile';
  onSelectElement: (uid: string | null) => void;
  onUpdateElement: (uid: string, updates: Partial<CanvasElement>) => void;
  onDeleteElement: (uid: string) => void;
  onUsePresetBackground?: () => void;
}

export const CertificateCanvas: React.FC<CertificateCanvasProps> = ({
  background,
  canvasWidth,
  canvasHeight,
  elements,
  selectedUid,
  zoom,
  device,
  onSelectElement,
  onUpdateElement,
  onDeleteElement,
  onUsePresetBackground,
}) => {
  const canvasRef = useRef<HTMLDivElement>(null);

  // Set up dnd-kit drop target
  const { setNodeRef, isOver } = useDroppable({
    id: 'certificate-canvas-droppable',
    data: {
      type: 'canvas',
    },
  });

  // Device width wrappers
  const getDeviceContainerClass = () => {
    switch (device) {
      case 'tablet':
        return 'max-w-[768px] mx-auto border-x border-slate-300/80 shadow-md';
      case 'mobile':
        return 'max-w-[390px] mx-auto border-x border-slate-300/80 shadow-md';
      default:
        return 'w-full';
    }
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Scrollable Viewport Frame */}
      <div
        className={`w-full overflow-auto bg-slate-100/80 rounded-2xl p-6 min-h-[560px] max-h-[720px] flex items-center justify-center border border-slate-200/80 transition-all ${getDeviceContainerClass()}`}
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onSelectElement(null);
          }
        }}
      >
        {!background ? (
          /* Empty State when no background is uploaded */
          <div className="flex flex-col items-center justify-center p-12 text-center bg-white rounded-xl border border-dashed border-slate-300 shadow-sm max-w-md">
            <div className="w-14 h-14 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-4">
              <ImageIcon className="w-7 h-7" />
            </div>
            <h3 className="font-semibold text-slate-800 text-base mb-1">
              No Background Image
            </h3>
            <p className="text-xs text-slate-500 mb-5 leading-relaxed">
              Upload a high-resolution background image in Step 1 to start positioning certificate tokens.
            </p>
            {onUsePresetBackground && (
              <button
                type="button"
                onClick={onUsePresetBackground}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium rounded-lg shadow-sm transition-colors"
              >
                Load Default Certificate Background
              </button>
            )}
          </div>
        ) : (
          /* Scaled Canvas Container */
          <div
            style={{
              width: `${canvasWidth * zoom}px`,
              height: `${canvasHeight * zoom}px`,
              position: 'relative',
              flexShrink: 0,
            }}
            className="transition-transform duration-75 ease-out select-none"
          >
            {/* The True Canvas element rendered at natural dimensions and scaled via CSS */}
            <div
              ref={(node) => {
                setNodeRef(node);
                (canvasRef as any).current = node;
              }}
              data-testid="certificate-canvas"
              onClick={(e) => {
                if (e.target === e.currentTarget) {
                  onSelectElement(null);
                }
              }}
              style={{
                width: `${canvasWidth}px`,
                height: `${canvasHeight}px`,
                transform: `scale(${zoom})`,
                transformOrigin: 'top left',
                backgroundImage: `url('${background.attFileUrl}')`,
                backgroundSize: '100% 100%',
                backgroundRepeat: 'no-repeat',
              }}
              className={`absolute top-0 left-0 bg-white rounded-lg shadow-xl overflow-hidden transition-shadow ${
                isOver ? 'ring-4 ring-blue-500/40 ring-offset-2' : ''
              }`}
            >
              {/* Overlay elements */}
              {elements.map((el) => (
                <PlaceholderElement
                  key={el.uid}
                  element={el}
                  isSelected={el.uid === selectedUid}
                  zoom={zoom}
                  onSelect={onSelectElement}
                  onUpdate={onUpdateElement}
                  onDelete={onDeleteElement}
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Note Banner below canvas matching screenshot */}
      <div className="bg-blue-50/70 border border-blue-200/80 rounded-xl p-3.5 flex items-start gap-3">
        <div className="w-5 h-5 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 mt-0.5">
          <Info className="w-3.5 h-3.5" />
        </div>
        <div className="text-xs text-blue-900 leading-relaxed">
          <span className="font-semibold">Note: </span>
          This is a preview of how your certificate will look. The actual certificate will be generated with the selected theme and your entered content.
        </div>
      </div>
    </div>
  );
};
