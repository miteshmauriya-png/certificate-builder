/**
 * Certificate Builder Module
 * 
 * Standalone, decoupled certificate template builder module.
 * Provides complete visual editor, drag-resize placeholders, rich text content,
 * live preview, backend persistence contracts, and standalone HTML string generator.
 */

export { CertificateBuilder, default } from './CertificateBuilder';
export type { CertificateBuilderProps } from './CertificateBuilder';

// Types
export * from './types/certificate';

// API Client
export { certificateApi } from './api/certificateApi';

// Utilities
export {
  buildCertificateHtml,
  clampWithinCanvas,
  convertPointerToCanvas,
  calculateFitZoom,
  scaleElementsProportionally,
  normalizeDimensions,
  sanitizeRichText,
  escapeHtml,
  generateUid,
} from './utils/certificateHtml';

// Components
export { BuilderHeader } from './components/BuilderHeader';
export { TemplateDetailsForm } from './components/TemplateDetailsForm';
export { PlaceholderPalette } from './components/PlaceholderPalette';
export { BodyContentEditor } from './components/BodyContentEditor';
export { CanvasToolbar } from './components/CanvasToolbar';
export { CertificateCanvas } from './components/CertificateCanvas';
export { PlaceholderElement } from './components/PlaceholderElement';
export { PropertiesPanel } from './components/PropertiesPanel';
export { PreviewModal } from './components/PreviewModal';
