import React from 'react';
import { Rnd } from 'react-rnd';
import { X } from 'lucide-react';
import { CanvasElement } from '../types/certificate';

interface PlaceholderElementProps {
  element: CanvasElement;
  isSelected: boolean;
  zoom: number;
  onSelect: (uid: string) => void;
  onUpdate: (uid: string, updates: Partial<CanvasElement>) => void;
  onDelete: (uid: string) => void;
}

export const PlaceholderElement: React.FC<PlaceholderElementProps> = ({
  element,
  isSelected,
  zoom,
  onSelect,
  onUpdate,
  onDelete,
}) => {
  const isPlaceholder = element.type === 'placeholder';

  // Handle styles
  const handleStyle: React.CSSProperties = {
    width: '10px',
    height: '10px',
    backgroundColor: '#2563EB',
    border: '1.5px solid #FFFFFF',
    borderRadius: '2px',
    boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
    zIndex: 100,
  };

  const resizeHandleStyles = isSelected
    ? {
        topLeft: { ...handleStyle, top: '-5px', left: '-5px' },
        topRight: { ...handleStyle, top: '-5px', right: '-5px' },
        bottomLeft: { ...handleStyle, bottom: '-5px', left: '-5px' },
        bottomRight: { ...handleStyle, bottom: '-5px', right: '-5px' },
        top: { ...handleStyle, top: '-5px', left: '50%', transform: 'translateX(-50%)' },
        bottom: { ...handleStyle, bottom: '-5px', left: '50%', transform: 'translateX(-50%)' },
        left: { ...handleStyle, left: '-5px', top: '50%', transform: 'translateY(-50%)' },
        right: { ...handleStyle, right: '-5px', top: '50%', transform: 'translateY(-50%)' },
      }
    : undefined;

  return (
    <Rnd
      bounds="parent"
      scale={zoom}
      size={{ width: element.width, height: element.height }}
      position={{ x: element.x, y: element.y }}
      onDragStart={() => onSelect(element.uid)}
      onDragStop={(_e, d) => {
        onUpdate(element.uid, {
          x: Math.round(d.x),
          y: Math.round(d.y),
        });
      }}
      onResizeStop={(_e, _direction, ref, _delta, position) => {
        onUpdate(element.uid, {
          width: Math.round(ref.offsetWidth),
          height: Math.round(ref.offsetHeight),
          x: Math.round(position.x),
          y: Math.round(position.y),
        });
      }}
      enableResizing={isSelected ? undefined : false}
      resizeHandleStyles={resizeHandleStyles}
      style={{
        zIndex: element.zIndex,
      }}
      className={`group select-none cursor-move transition-shadow ${
        isSelected ? 'z-50' : ''
      }`}
    >
      <div
        onClick={(e) => {
          e.stopPropagation();
          onSelect(element.uid);
        }}
        className={`w-full h-full relative flex items-center p-1 transition-all ${
          isSelected
            ? 'border-2 border-dashed border-blue-600 bg-blue-500/5'
            : 'hover:border hover:border-dashed hover:border-blue-400/60'
        }`}
        style={{
          justifyContent:
            element.textAlign === 'left'
              ? 'flex-start'
              : element.textAlign === 'right'
              ? 'flex-end'
              : 'center',
          fontFamily: `${element.fontFamily}, serif`,
          fontSize: `${element.fontSize}px`,
          fontWeight: element.bold ? 'bold' : 'normal',
          fontStyle: element.italic ? 'italic' : 'normal',
          textDecoration: element.underline ? 'underline' : 'none',
          color: element.color,
          textAlign: element.textAlign,
        }}
      >
        {/* Render text or literal token */}
        {isPlaceholder ? (
          <span className="truncate tracking-wide pointer-events-none drop-shadow-2xs">
            {element.token}
          </span>
        ) : (
          <div
            className="w-full h-full overflow-hidden pointer-events-none"
            dangerouslySetInnerHTML={{ __html: element.text || '' }}
          />
        )}

        {/* Delete button (X) when selected */}
        {isSelected && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(element.uid);
            }}
            title="Delete element"
            className="absolute -top-3.5 -right-3.5 w-6 h-6 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-md transition-transform hover:scale-110 z-50 focus:outline-none"
          >
            <X className="w-3.5 h-3.5 stroke-[2.5]" />
          </button>
        )}
      </div>
    </Rnd>
  );
};
