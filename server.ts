import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';

const app = express();
function getPort(): number {
  const portArgIndex = process.argv.indexOf('--port');
  if (portArgIndex !== -1 && process.argv[portArgIndex + 1]) {
    const p = parseInt(process.argv[portArgIndex + 1], 10);
    if (!isNaN(p)) return p;
  }
  // Port 8080 is reserved by nginx in the container; app must run on port 3000
  if (process.env.APP_PORT) {
    return parseInt(process.env.APP_PORT, 10);
  }
  if (process.env.PORT && process.env.PORT !== '8080') {
    return parseInt(process.env.PORT, 10);
  }
  return 3000;
}

const PORT = getPort();
const isProduction = process.env.NODE_ENV === 'production';

// Body parsers with large limit for image upload / base64 attachments
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));

// Static public directory
app.use(express.static(path.resolve(process.cwd(), 'public')));

// Mock Auth Middleware: verifySystemUser
function verifySystemUser(req: Request, res: Response, next: NextFunction) {
  // Simulates system user verification (Bearer token or session)
  const authHeader = req.headers.authorization;
  // Always accept in demo admin app, attach user
  (req as any).user = {
    _id: 'user_admin_1',
    name: 'Admin User',
    email: 'admin@system.io',
    role: 'superadmin',
  };
  next();
}

app.use(verifySystemUser);

// In-Memory Database store
interface StoredPlaceholder {
  _id: string;
  placeholderName: string;
  placeholderKey: string;
  category?: string;
  sampleValue?: string;
}

interface StoredTemplate {
  _id: string;
  templateName: string;
  description: string;
  templateBackgroundAttachment: {
    attFileUrl: string;
    attFileName: string;
    attFileSizeBytes?: number;
    attMimeType?: string;
    attUrlExpiresAt?: string;
  } | null;
  templatePreviewAttachment?: {
    attFileUrl: string;
    attFileName: string;
  } | null;
  canvasWidth: number;
  canvasHeight: number;
  placeholderCount: number;
  bodyContentHtml?: string;
  publicationStatus: 'draft' | 'published';
  publishedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface StoredPlacedPlaceholder {
  _id: string;
  certificateTemplate: string;
  placeholder: string; // placeholderId
  token?: string;
  label?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fontFamily: string;
  fontSize: number;
  bold: boolean;
  italic: boolean;
  underline: boolean;
  textAlign: 'left' | 'center' | 'right';
  color: string;
  zIndex: number;
}

interface StoredDesign {
  certificateTemplate: string;
  designJson: any[];
  certificateHtml: string;
  updatedAt: string;
}

// Initial master placeholders matching spec & screenshot
const masterPlaceholders: StoredPlaceholder[] = [
  { _id: 'ph_name', placeholderName: 'Name', placeholderKey: 'Name', sampleValue: 'Jane Doe' },
  { _id: 'ph_course', placeholderName: 'Course Name', placeholderKey: 'Course Name', sampleValue: 'Advanced Full-Stack Engineering' },
  { _id: 'ph_date', placeholderName: 'Date', placeholderKey: 'Date', sampleValue: 'November 6, 2026' },
  { _id: 'ph_instructor', placeholderName: 'Instructor', placeholderKey: 'Instructor', sampleValue: 'Dr. Evelyn Reed' },
  { _id: 'ph_cert_id', placeholderName: 'Certificate ID', placeholderKey: 'Certificate ID', sampleValue: 'CERT-2026-98421' },
  { _id: 'ph_org', placeholderName: 'Organization', placeholderKey: 'Organization', sampleValue: 'Global Tech Academy' },
  { _id: 'ph_grade', placeholderName: 'Grade', placeholderKey: 'Grade', sampleValue: 'Grade A+ (Distinction)' },
];

const templates = new Map<string, StoredTemplate>();
const placedPlaceholders = new Map<string, StoredPlacedPlaceholder>();
const designs = new Map<string, StoredDesign>();

// Seed default template matching screenshot
const defaultTemplateId = 'tmpl_default_completion';
templates.set(defaultTemplateId, {
  _id: defaultTemplateId,
  templateName: 'Certificate of Completion',
  description: 'Official certificate for course completion with signature and seal',
  templateBackgroundAttachment: {
    attFileUrl: '/certificate-bg.svg',
    attFileName: 'certificate-bg.jpg',
    attFileSizeBytes: 1024 * 180,
    attMimeType: 'image/svg+xml',
    attUrlExpiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
  },
  canvasWidth: 1920,
  canvasHeight: 1358,
  placeholderCount: 4,
  bodyContentHtml: '<p>This is to certify that</p><p><strong>{{Name}}</strong></p><p>has successfully completed the</p><p><strong>{{Course Name}}</strong></p>',
  publicationStatus: 'draft',
  publishedAt: null,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
});

// Seed placeholders for the default template
const defaultPlaceholders: StoredPlacedPlaceholder[] = [
  {
    _id: 'pl_name',
    certificateTemplate: defaultTemplateId,
    placeholder: 'ph_name',
    token: '{{Name}}',
    label: 'Name',
    x: 420,
    y: 530,
    width: 1080,
    height: 100,
    fontFamily: 'Playfair Display',
    fontSize: 64,
    bold: true,
    italic: true,
    underline: false,
    textAlign: 'center',
    color: '#0B3D91',
    zIndex: 10,
  },
  {
    _id: 'pl_course',
    certificateTemplate: defaultTemplateId,
    placeholder: 'ph_course',
    token: '{{Course Name}}',
    label: 'Course Name',
    x: 460,
    y: 740,
    width: 1000,
    height: 70,
    fontFamily: 'Playfair Display',
    fontSize: 42,
    bold: true,
    italic: false,
    underline: false,
    textAlign: 'center',
    color: '#0B3D91',
    zIndex: 9,
  },
  {
    _id: 'pl_date',
    certificateTemplate: defaultTemplateId,
    placeholder: 'ph_date',
    token: '{{Date}}',
    label: 'Date',
    x: 280,
    y: 1100,
    width: 340,
    height: 50,
    fontFamily: 'Montserrat',
    fontSize: 24,
    bold: false,
    italic: false,
    underline: false,
    textAlign: 'center',
    color: '#1E293B',
    zIndex: 8,
  },
  {
    _id: 'pl_instructor',
    certificateTemplate: defaultTemplateId,
    placeholder: 'ph_instructor',
    token: '{{Instructor}}',
    label: 'Instructor',
    x: 1300,
    y: 1100,
    width: 340,
    height: 50,
    fontFamily: 'Montserrat',
    fontSize: 24,
    bold: false,
    italic: false,
    underline: false,
    textAlign: 'center',
    color: '#1E293B',
    zIndex: 7,
  },
  // Static labels matching mockup
  {
    _id: 'pl_title',
    certificateTemplate: defaultTemplateId,
    placeholder: 'static_title',
    token: '',
    label: 'Certificate Title',
    x: 420,
    y: 280,
    width: 1080,
    height: 60,
    fontFamily: 'Playfair Display',
    fontSize: 44,
    bold: true,
    italic: false,
    underline: false,
    textAlign: 'center',
    color: '#0B3D91',
    zIndex: 6,
  },
  {
    _id: 'pl_certify_text',
    certificateTemplate: defaultTemplateId,
    placeholder: 'static_certify',
    token: '',
    label: 'Certify Text',
    x: 420,
    y: 440,
    width: 1080,
    height: 40,
    fontFamily: 'Montserrat',
    fontSize: 24,
    bold: false,
    italic: false,
    underline: false,
    textAlign: 'center',
    color: '#334155',
    zIndex: 5,
  },
  {
    _id: 'pl_completed_text',
    certificateTemplate: defaultTemplateId,
    placeholder: 'static_completed',
    token: '',
    label: 'Completed Text',
    x: 420,
    y: 670,
    width: 1080,
    height: 40,
    fontFamily: 'Montserrat',
    fontSize: 22,
    bold: false,
    italic: false,
    underline: false,
    textAlign: 'center',
    color: '#334155',
    zIndex: 4,
  },
  {
    _id: 'pl_date_lbl',
    certificateTemplate: defaultTemplateId,
    placeholder: 'static_date_lbl',
    token: '',
    label: 'Date Label',
    x: 280,
    y: 1160,
    width: 340,
    height: 35,
    fontFamily: 'Montserrat',
    fontSize: 20,
    bold: false,
    italic: false,
    underline: false,
    textAlign: 'center',
    color: '#64748B',
    zIndex: 3,
  },
  {
    _id: 'pl_sign_lbl',
    certificateTemplate: defaultTemplateId,
    placeholder: 'static_sign_lbl',
    token: '',
    label: 'Signatory Label',
    x: 1300,
    y: 1160,
    width: 340,
    height: 35,
    fontFamily: 'Montserrat',
    fontSize: 20,
    bold: false,
    italic: false,
    underline: false,
    textAlign: 'center',
    color: '#64748B',
    zIndex: 2,
  },
];

defaultPlaceholders.forEach((p) => placedPlaceholders.set(p._id, p));

// ========================
// API Endpoints
// ========================

// 1. Master placeholder list
app.post('/certificate-template/placeholder/selectList', (req: Request, res: Response) => {
  return res.json({
    success: true,
    data: masterPlaceholders.map(({ _id, placeholderName, placeholderKey }) => ({
      _id,
      placeholderName,
      placeholderKey,
    })),
  });
});

// 2. Check template name uniqueness
app.post('/certificate-template/checkTemplateName', (req: Request, res: Response) => {
  const { templateName, excludeId } = req.body;
  if (!templateName || !templateName.trim()) {
    return res.json({ isValid: false, message: 'Template name is required' });
  }

  const trimmed = templateName.trim().toLowerCase();
  for (const t of templates.values()) {
    if (t.templateName.trim().toLowerCase() === trimmed && t._id !== excludeId) {
      return res.json({ isValid: false, message: 'A template with this name already exists' });
    }
  }

  return res.json({ isValid: true, message: 'Template name is available' });
});

// 3. Create / update template
app.post('/certificate-template/', (req: Request, res: Response) => {
  const {
    templateId,
    templateName,
    description,
    templateBackgroundAttachment,
    canvasWidth,
    canvasHeight,
    placeholderCount,
    bodyContentHtml,
  } = req.body;

  if (!templateName || !templateName.trim()) {
    return res.status(400).json({ success: false, message: 'Template name is required' });
  }

  const id = templateId || `tmpl_${Date.now()}`;
  const now = new Date().toISOString();
  const existing = templates.get(id);

  const updated: StoredTemplate = {
    _id: id,
    templateName: templateName.trim(),
    description: description || '',
    templateBackgroundAttachment: templateBackgroundAttachment || null,
    templatePreviewAttachment: existing?.templatePreviewAttachment || null,
    canvasWidth: canvasWidth || 1920,
    canvasHeight: canvasHeight || 1358,
    placeholderCount: typeof placeholderCount === 'number' ? placeholderCount : 0,
    bodyContentHtml: bodyContentHtml ?? existing?.bodyContentHtml ?? '',
    publicationStatus: existing?.publicationStatus || 'draft',
    publishedAt: existing?.publishedAt || null,
    createdAt: existing?.createdAt || now,
    updatedAt: now,
  };

  templates.set(id, updated);
  return res.json({
    success: true,
    data: updated,
    message: templateId ? 'Template updated successfully' : 'Template created successfully',
  });
});

// 4. Bulk save placed placeholders
app.post('/certificate-template/placeholder/bulkSave', (req: Request, res: Response) => {
  const items = Array.isArray(req.body) ? req.body : req.body.placeholders || [];

  const saved: StoredPlacedPlaceholder[] = [];
  for (const item of items) {
    const id = item._id || item.savedId || `pl_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const doc: StoredPlacedPlaceholder = {
      _id: id,
      certificateTemplate: item.certificateTemplate,
      placeholder: item.placeholder || item.placeholderId,
      token: item.token,
      label: item.label,
      x: item.x,
      y: item.y,
      width: item.width,
      height: item.height,
      fontFamily: item.fontFamily,
      fontSize: item.fontSize,
      bold: !!item.bold,
      italic: !!item.italic,
      underline: !!item.underline,
      textAlign: item.textAlign || 'center',
      color: item.color || '#0B3D91',
      zIndex: item.zIndex || 1,
    };
    placedPlaceholders.set(id, doc);
    saved.push(doc);
  }

  return res.json({
    success: true,
    data: saved,
    message: `Saved ${saved.length} placeholders`,
  });
});

// 5. Save design (layout + HTML)
app.post('/certificate-template/design', (req: Request, res: Response) => {
  const { certificateTemplate, designJson, certificateHtml } = req.body;
  if (!certificateTemplate) {
    return res.status(400).json({ success: false, message: 'certificateTemplate ID is required' });
  }

  const designRecord: StoredDesign = {
    certificateTemplate,
    designJson: Array.isArray(designJson) ? designJson : [],
    certificateHtml: certificateHtml || '',
    updatedAt: new Date().toISOString(),
  };

  designs.set(certificateTemplate, designRecord);

  // Also update placeholderCount on template
  const tmpl = templates.get(certificateTemplate);
  if (tmpl) {
    tmpl.placeholderCount = designRecord.designJson.filter((e) => e.type === 'placeholder').length;
    tmpl.updatedAt = new Date().toISOString();
  }

  return res.json({
    success: true,
    data: designRecord,
    message: 'Design layout and HTML saved successfully',
  });
});

// 6. Delete one placed placeholder
app.delete('/certificate-template/placeholder/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const existed = placedPlaceholders.delete(id);
  return res.json({
    success: true,
    deleted: existed,
    message: existed ? 'Placeholder deleted' : 'Placeholder not found',
  });
});

// 7. Load template for editing
app.post('/certificate-template/detail', (req: Request, res: Response) => {
  const { templateId } = req.body;
  const id = templateId || defaultTemplateId;
  const template = templates.get(id);

  if (!template) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }

  // Populate virtual certificateTemplatePlaceholders
  const templatePlaceholders: StoredPlacedPlaceholder[] = [];
  for (const p of placedPlaceholders.values()) {
    if (p.certificateTemplate === id) {
      templatePlaceholders.push(p);
    }
  }

  const design = designs.get(id);

  return res.json({
    success: true,
    data: {
      ...template,
      certificateTemplatePlaceholders: templatePlaceholders,
      design: design || null,
    },
  });
});

// 8. Preview endpoint
app.post('/certificate-template/preview', (req: Request, res: Response) => {
  const { templateId, certificateHtml, sampleData } = req.body;
  
  // Default sample substitutions for testing real output
  const data: Record<string, string> = {
    Name: 'Jane Doe',
    'Course Name': 'Certified Full-Stack Architect',
    Date: new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }),
    Instructor: 'Prof. Alexander Wright',
    'Certificate ID': 'CERT-7739-XP',
    Organization: 'Tech Institute of Excellence',
    Grade: 'Grade A+ (High Honors)',
    ...(sampleData || {}),
  };

  let renderedHtml = certificateHtml || '';
  if (req.body.replaceTokens !== false) {
    // Regex matching {{Token}} per spec §8
    renderedHtml = renderedHtml.replace(/\{\{\s*([^}]+?)\s*\}\}/g, (match: string, tokenKey: string) => {
      const key = tokenKey.trim();
      return data[key] !== undefined ? data[key] : match;
    });
  }

  return res.json({
    success: true,
    data: {
      templateId,
      previewHtml: renderedHtml,
      sampleData: data,
    },
  });
});

// 9. Publish template
app.post('/certificate-template/publish', (req: Request, res: Response) => {
  const { templateId } = req.body;
  const template = templates.get(templateId);

  if (!template) {
    return res.status(404).json({ success: false, message: 'Template not found' });
  }

  if (!template.templateBackgroundAttachment?.attFileUrl) {
    return res.status(400).json({ success: false, message: 'Background image is required to publish' });
  }

  // Count placed placeholders for this template
  let count = 0;
  for (const p of placedPlaceholders.values()) {
    if (p.certificateTemplate === templateId) count++;
  }

  if (count === 0 && template.placeholderCount === 0) {
    return res.status(400).json({ success: false, message: 'At least one placeholder must be placed on the canvas to publish' });
  }

  template.publicationStatus = 'published';
  template.publishedAt = new Date().toISOString();
  template.updatedAt = new Date().toISOString();

  return res.json({
    success: true,
    data: template,
    message: 'Certificate template published successfully!',
  });
});

// 10. Background image upload endpoint
app.post('/certificate-template/upload', (req: Request, res: Response) => {
  const { dataUrl, fileName, fileSize, mimeType } = req.body;

  if (!dataUrl) {
    return res.status(400).json({ success: false, message: 'No file data received' });
  }

  // In production / Cloud this would upload to S3/GCS. Here we generate an attachment response.
  const attachment = {
    attFileUrl: dataUrl,
    attFileName: fileName || 'uploaded-certificate.png',
    attFileSizeBytes: fileSize || dataUrl.length,
    attMimeType: mimeType || 'image/png',
    attUrlExpiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
  };

  return res.json({
    success: true,
    data: attachment,
  });
});

// 11. List templates endpoint
app.get('/certificate-template/list', (req: Request, res: Response) => {
  return res.json({
    success: true,
    data: Array.from(templates.values()),
  });
});

// ========================
// Vite Integration
// ========================
async function startServer() {
  if (!isProduction) {
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: false,
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
