import { Attachment, MasterPlaceholder, CertificateTemplate, CanvasElement } from '../types/certificate';

const BASE_URL = '';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    'Content-Type': 'application/json',
    Authorization: 'Bearer mock_admin_token',
    ...(options.headers || {}),
  };

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  const json = await response.json();
  if (!response.ok || json.success === false) {
    throw new Error(json.message || `Request failed with status ${response.status}`);
  }
  return json;
}

export const certificateApi = {
  // Master placeholder list
  async getPlaceholdersSelectList(): Promise<MasterPlaceholder[]> {
    const res = await request<{ success: boolean; data: MasterPlaceholder[] }>(
      '/certificate-template/placeholder/selectList',
      { method: 'POST', body: JSON.stringify({}) }
    );
    return res.data;
  },

  // Check template name uniqueness
  async checkTemplateName(templateName: string, excludeId?: string): Promise<{ isValid: boolean; message?: string }> {
    return request<{ isValid: boolean; message?: string }>(
      '/certificate-template/checkTemplateName',
      { method: 'POST', body: JSON.stringify({ templateName, excludeId }) }
    );
  },

  // Create or update template doc
  async saveTemplate(templateData: Partial<CertificateTemplate> & { templateId?: string }): Promise<CertificateTemplate> {
    const res = await request<{ success: boolean; data: CertificateTemplate }>(
      '/certificate-template/',
      { method: 'POST', body: JSON.stringify(templateData) }
    );
    return res.data;
  },

  // Bulk save placed placeholders
  async bulkSavePlaceholders(
    templateId: string,
    elements: CanvasElement[]
  ): Promise<any[]> {
    const placeholderElements = elements.filter((el) => el.type === 'placeholder');
    const payload = placeholderElements.map((el) => ({
      _id: el.savedId,
      certificateTemplate: templateId,
      placeholder: el.placeholderId,
      token: el.token,
      label: el.label,
      x: Math.round(el.x),
      y: Math.round(el.y),
      width: Math.round(el.width),
      height: Math.round(el.height),
      fontFamily: el.fontFamily,
      fontSize: el.fontSize,
      bold: el.bold,
      italic: el.italic,
      underline: el.underline,
      textAlign: el.textAlign,
      color: el.color,
      zIndex: el.zIndex,
    }));

    const res = await request<{ success: boolean; data: any[] }>(
      '/certificate-template/placeholder/bulkSave',
      { method: 'POST', body: JSON.stringify(payload) }
    );
    return res.data;
  },

  // Save design layout and generated HTML
  async saveDesign(
    templateId: string,
    elements: CanvasElement[],
    certificateHtml: string
  ): Promise<{ certificateTemplate: string; designJson: any[]; certificateHtml: string }> {
    const res = await request<{ success: boolean; data: any }>(
      '/certificate-template/design',
      {
        method: 'POST',
        body: JSON.stringify({
          certificateTemplate: templateId,
          designJson: elements,
          certificateHtml,
        }),
      }
    );
    return res.data;
  },

  // Delete placed placeholder
  async deletePlacedPlaceholder(id: string): Promise<boolean> {
    const res = await request<{ success: boolean; deleted: boolean }>(
      `/certificate-template/placeholder/${id}`,
      { method: 'DELETE' }
    );
    return res.deleted;
  },

  // Load template detail
  async getTemplateDetail(templateId?: string): Promise<{
    template: CertificateTemplate;
    placeholders: any[];
    design?: any;
  }> {
    const res = await request<{ success: boolean; data: any }>(
      '/certificate-template/detail',
      { method: 'POST', body: JSON.stringify({ templateId }) }
    );
    return {
      template: res.data,
      placeholders: res.data.certificateTemplatePlaceholders || [],
      design: res.data.design,
    };
  },

  // Preview certificate
  async previewCertificate(
    templateId: string,
    certificateHtml: string,
    sampleData?: Record<string, string>,
    replaceTokens = true
  ): Promise<{ previewHtml: string; sampleData: Record<string, string> }> {
    const res = await request<{ success: boolean; data: { previewHtml: string; sampleData: Record<string, string> } }>(
      '/certificate-template/preview',
      {
        method: 'POST',
        body: JSON.stringify({ templateId, certificateHtml, sampleData, replaceTokens }),
      }
    );
    return res.data;
  },

  // Publish template
  async publishTemplate(templateId: string): Promise<CertificateTemplate> {
    const res = await request<{ success: boolean; data: CertificateTemplate }>(
      '/certificate-template/publish',
      { method: 'POST', body: JSON.stringify({ templateId }) }
    );
    return res.data;
  },

  // Upload image
  async uploadImage(
    dataUrl: string,
    fileName: string,
    fileSize: number,
    mimeType: string
  ): Promise<Attachment> {
    const res = await request<{ success: boolean; data: Attachment }>(
      '/certificate-template/upload',
      {
        method: 'POST',
        body: JSON.stringify({ dataUrl, fileName, fileSize, mimeType }),
      }
    );
    return res.data;
  },

  // List templates
  async getTemplatesList(): Promise<CertificateTemplate[]> {
    const res = await request<{ success: boolean; data: CertificateTemplate[] }>(
      '/certificate-template/list'
    );
    return res.data;
  },
};
