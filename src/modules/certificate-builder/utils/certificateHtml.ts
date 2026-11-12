import DOMPurify from 'dompurify';
import { BuilderState, CanvasElement } from '../types/certificate';

/**
 * Escapes characters for safe HTML inclusion
 */
export function escapeHtml(str: unknown): string {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/**
 * Core Deliverable: Generates a standalone HTML fragment string with literal {{Token}} placeholders
 * absolutely positioned over the background image. The frontend NEVER replaces tokens.
 */
export function buildCertificateHtml(
  template: Pick<BuilderState, 'canvasWidth' | 'canvasHeight' | 'background'>,
  elements: CanvasElement[]
): string {
  const bgUrl = template.background?.attFileUrl || '';

  const sorted = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  const nodes = sorted
    .map((el) => {
      const justifyContent =
        el.textAlign === 'left'
          ? 'flex-start'
          : el.textAlign === 'right'
          ? 'flex-end'
          : 'center';

      const style = [
        'position:absolute',
        `left:${Math.round(el.x)}px`,
        `top:${Math.round(el.y)}px`,
        `width:${Math.round(el.width)}px`,
        `height:${Math.round(el.height)}px`,
        'display:flex',
        'align-items:center',
        `justify-content:${justifyContent}`,
        `font-family:${el.fontFamily || 'Playfair Display'}, serif`,
        `font-size:${el.fontSize || 24}px`,
        `font-weight:${el.bold ? 'bold' : 'normal'}`,
        `font-style:${el.italic ? 'italic' : 'normal'}`,
        `text-decoration:${el.underline ? 'underline' : 'none'}`,
        `color:${el.color || '#0B3D91'}`,
        `text-align:${el.textAlign || 'center'}`,
        `z-index:${el.zIndex || 1}`,
        'box-sizing:border-box',
        'word-break:break-word',
        'overflow:hidden',
      ].join(';');

      // Text/body content is sanitized upstream, token remains literal {{Token}}
      const content = el.type === 'placeholder' ? escapeHtml(el.token) : (el.text || '');
      return `<div data-token="${escapeHtml(el.token || '')}" style="${style}">${content}</div>`;
    })
    .join('');

  return (
    `<div style="position:relative;width:${template.canvasWidth}px;height:${template.canvasHeight}px;` +
    `background-image:url('${bgUrl}');background-size:100% 100%;background-repeat:no-repeat;overflow:hidden;">` +
    nodes +
    `</div>`
  );
}

/**
 * Clamp coordinates and dimensions so elements never go outside canvas bounds
 */
export function clampWithinCanvas(
  x: number,
  y: number,
  width: number,
  height: number,
  canvasWidth: number,
  canvasHeight: number
): { x: number; y: number; width: number; height: number } {
  const boundedWidth = Math.max(20, Math.min(width, canvasWidth));
  const boundedHeight = Math.max(16, Math.min(height, canvasHeight));
  const boundedX = Math.max(0, Math.min(x, canvasWidth - boundedWidth));
  const boundedY = Math.max(0, Math.min(y, canvasHeight - boundedHeight));

  return {
    x: boundedX,
    y: boundedY,
    width: boundedWidth,
    height: boundedHeight,
  };
}

/**
 * Converts screen/pointer coordinates into natural canvas pixel coordinates accounting for zoom and canvas offset
 */
export function convertPointerToCanvas(
  pointerX: number,
  pointerY: number,
  canvasRect: { left: number; top: number; width: number; height: number },
  zoom: number
): { x: number; y: number } {
  const safeZoom = zoom > 0 ? zoom : 1;
  const rawX = (pointerX - canvasRect.left) / safeZoom;
  const rawY = (pointerY - canvasRect.top) / safeZoom;
  return {
    x: Math.round(rawX),
    y: Math.round(rawY),
  };
}

/**
 * Calculates responsive proportional fit zoom level for canvas viewport
 */
export function calculateFitZoom(
  containerWidth: number,
  containerHeight: number,
  canvasWidth: number,
  canvasHeight: number,
  padding = 64
): number {
  if (!canvasWidth || !canvasHeight || !containerWidth || !containerHeight) return 1;
  const availableWidth = Math.max(100, containerWidth - padding);
  const availableHeight = Math.max(100, containerHeight - padding);
  const zoomX = availableWidth / canvasWidth;
  const zoomY = availableHeight / canvasHeight;
  const fitZoom = Math.min(zoomX, zoomY, 1);
  return Math.max(0.2, Math.min(2, Math.round(fitZoom * 100) / 100));
}

/**
 * Scale element coordinates when canvas dimensions change (e.g. background image replaced)
 */
export function scaleElementsProportionally(
  elements: CanvasElement[],
  oldWidth: number,
  oldHeight: number,
  newWidth: number,
  newHeight: number
): CanvasElement[] {
  if (!oldWidth || !oldHeight || !newWidth || !newHeight) return elements;
  const scaleX = newWidth / oldWidth;
  const scaleY = newHeight / oldHeight;

  return elements.map((el) => {
    const newX = Math.round(el.x * scaleX);
    const newY = Math.round(el.y * scaleY);
    const newW = Math.max(20, Math.round(el.width * scaleX));
    const newH = Math.max(16, Math.round(el.height * scaleY));
    const clamped = clampWithinCanvas(newX, newY, newW, newH, newWidth, newHeight);

    return {
      ...el,
      ...clamped,
      fontSize: Math.max(8, Math.round(el.fontSize * Math.min(scaleX, scaleY))),
    };
  });
}

/**
 * Normalize natural image dimensions: cap width at 2480px, scale height proportionally
 */
export function normalizeDimensions(
  naturalWidth: number,
  naturalHeight: number
): { width: number; height: number } {
  const MAX_WIDTH = 2480;
  if (naturalWidth > MAX_WIDTH) {
    const scale = MAX_WIDTH / naturalWidth;
    return {
      width: MAX_WIDTH,
      height: Math.round(naturalHeight * scale),
    };
  }
  return {
    width: Math.max(200, naturalWidth),
    height: Math.max(150, naturalHeight),
  };
}

/**
 * Safely sanitizes rich text HTML block using DOMPurify
 */
export function sanitizeRichText(html: string): string {
  if (typeof window === 'undefined') {
    return html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  }
  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: ['b', 'i', 'u', 'strong', 'em', 'p', 'span', 'br', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3'],
    ALLOWED_ATTR: ['href', 'target', 'rel', 'style', 'class'],
  });
}

/**
 * Client-side unique ID generator
 */
export function generateUid(prefix = 'el'): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 8)}`;
}
