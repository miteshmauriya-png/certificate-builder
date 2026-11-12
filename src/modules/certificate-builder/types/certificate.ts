export type ElementType = "placeholder" | "text" | "body";

export interface CanvasElement {
  uid: string;                // client-side uuid
  type: ElementType;          // placeholder = token from backend list, text = static label, body = rich text block
  placeholderId?: string;     // backend master placeholder _id (type === "placeholder")
  token?: string;             // "{{Name}}"
  label?: string;             // "Name" — shown in palette/panel
  text?: string;              // for type text/body
  x: number;
  y: number;                  // px, relative to canvas at NATURAL image size (never scaled coords)
  width: number;
  height: number;
  fontFamily: string;
  fontSize: number;           // px
  bold: boolean;
  italic: boolean;
  underline: boolean;
  textAlign: "left" | "center" | "right";
  color: string;              // hex, default "#0B3D91"
  zIndex: number;
  savedId?: string;           // backend CertificateTemplatePlaceholder _id once persisted
}

export interface Attachment {
  attFileUrl: string;
  attFileName: string;
  attFileSizeBytes?: number;
  attMimeType?: string;
  attUrlExpiresAt?: string;
}

export interface MasterPlaceholder {
  _id: string;
  placeholderName: string;
  placeholderKey: string;     // e.g. "Name", "Course Name"
  category?: string;
  sampleValue?: string;
}

export interface CertificateTemplate {
  _id?: string;
  templateName: string;
  description: string;
  templateBackgroundAttachment: Attachment | null;
  templatePreviewAttachment?: Attachment | null;
  canvasWidth: number;
  canvasHeight: number;
  placeholderCount: number;
  bodyContentHtml?: string;
  publicationStatus?: "draft" | "published";
  publishedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface BuilderState {
  templateId?: string;
  templateName: string;
  description: string;
  background: Attachment | null;
  canvasWidth: number;        // = background natural width (cap 2480px, scale proportionally if larger)
  canvasHeight: number;
  elements: CanvasElement[];
  bodyContentHtml: string;    // sanitized HTML from step 3 editor
  selectedUid: string | null;
  zoom: number;               // 0.25–2
  device: "desktop" | "tablet" | "mobile";
  isDirty: boolean;
}

export const SUPPORTED_FONTS = [
  "Playfair Display",
  "Montserrat",
  "Arial",
  "Georgia",
  "Times New Roman",
  "Courier New",
] as const;

export const DEFAULT_TEXT_COLOR = "#0B3D91";
