import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  DndContext,
  DragEndEvent,
  useSensor,
  useSensors,
  PointerSensor,
} from '@dnd-kit/core';
import { BuilderHeader } from './components/BuilderHeader';
import { TemplateDetailsForm } from './components/TemplateDetailsForm';
import { PlaceholderPalette } from './components/PlaceholderPalette';
import { BodyContentEditor } from './components/BodyContentEditor';
import { CanvasToolbar } from './components/CanvasToolbar';
import { CertificateCanvas } from './components/CertificateCanvas';
import { PropertiesPanel } from './components/PropertiesPanel';
import { PreviewModal } from './components/PreviewModal';
import {
  CanvasElement,
  Attachment,
  MasterPlaceholder,
  BuilderState,
  DEFAULT_TEXT_COLOR,
} from './types/certificate';
import { certificateApi } from './api/certificateApi';
import {
  buildCertificateHtml,
  clampWithinCanvas,
  convertPointerToCanvas,
  scaleElementsProportionally,
  calculateFitZoom,
  generateUid,
  sanitizeRichText,
} from './utils/certificateHtml';

export interface CertificateBuilderProps {
  initialTemplateId?: string;
  onSaved?: (templateId: string) => void;
  onPublished?: (templateId: string) => void;
}

export const CertificateBuilder: React.FC<CertificateBuilderProps> = ({
  initialTemplateId = 'tmpl_default_completion',
  onSaved,
  onPublished,
}) => {
  // Master placeholders from backend
  const [masterPlaceholders, setMasterPlaceholders] = useState<MasterPlaceholder[]>([]);
  const [isPlaceholdersLoading, setIsPlaceholdersLoading] = useState(true);

  // Core Builder State per Spec §4
  const [state, setState] = useState<BuilderState>({
    templateId: initialTemplateId,
    templateName: 'Certificate of Completion',
    description: 'Official certificate for course completion with signature and seal',
    background: null,
    canvasWidth: 1920,
    canvasHeight: 1358,
    elements: [],
    bodyContentHtml:
      '<p>This is to certify that</p><p><strong>{{Name}}</strong></p><p>has successfully completed the</p><p><strong>{{Course Name}}</strong></p>',
    selectedUid: null,
    zoom: 0.45,
    device: 'desktop',
    isDirty: false,
  });

  // UI modal and action state
  const [publicationStatus, setPublicationStatus] = useState<'draft' | 'published'>('draft');
  const [isSavingDraft, setIsSavingDraft] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Setup Dnd sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const showToast = (text: string, type: 'success' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  // 1. Initial Load: fetch master placeholders and template detail
  useEffect(() => {
    async function init() {
      try {
        setIsPlaceholdersLoading(true);
        // Master list
        const placeholders = await certificateApi.getPlaceholdersSelectList();
        setMasterPlaceholders(placeholders);

        // Load detail for initial template
        const detail = await certificateApi.getTemplateDetail(state.templateId);
        if (detail.template) {
          const tmpl = detail.template;
          setPublicationStatus(tmpl.publicationStatus || 'draft');

          // Map populated placeholders to CanvasElements
          const loadedElements: CanvasElement[] = (detail.placeholders || []).map((p: any) => {
            const master = placeholders.find((m) => m._id === p.placeholder);
            const isPlaceholderType = p.placeholder && p.placeholder.startsWith('ph_');
            const defaultText =
              p.label === 'Certificate Title'
                ? 'CERTIFICATE OF COMPLETION'
                : p.label === 'Certify Text'
                ? 'This is to certify that'
                : p.label === 'Completed Text'
                ? 'has successfully completed the'
                : p.label === 'Date Label'
                ? 'Date'
                : p.label === 'Signatory Label'
                ? 'Authorized Signatory'
                : p.label;

            return {
              uid: generateUid(isPlaceholderType ? 'ph' : 'txt'),
              type: isPlaceholderType ? 'placeholder' : 'text',
              placeholderId: isPlaceholderType ? p.placeholder : undefined,
              token: isPlaceholderType ? p.token || `{{${master?.placeholderKey || p.placeholder}}}` : undefined,
              label: p.label || master?.placeholderName || 'Text Block',
              text: isPlaceholderType ? undefined : p.text || defaultText,
              x: p.x,
              y: p.y,
              width: p.width,
              height: p.height,
              fontFamily: p.fontFamily || 'Playfair Display',
              fontSize: p.fontSize || 36,
              bold: !!p.bold,
              italic: !!p.italic,
              underline: !!p.underline,
              textAlign: p.textAlign || 'center',
              color: p.color || DEFAULT_TEXT_COLOR,
              zIndex: p.zIndex || 1,
              savedId: p._id,
            };
          });

          // Check if design JSON exists with text/body elements
          if (detail.design && Array.isArray(detail.design.designJson)) {
            const extraElements = detail.design.designJson.filter(
              (el: any) => el.type !== 'placeholder'
            );
            loadedElements.push(...extraElements);
          }

          setState((prev) => ({
            ...prev,
            templateId: tmpl._id,
            templateName: tmpl.templateName,
            description: tmpl.description || '',
            background: tmpl.templateBackgroundAttachment || null,
            canvasWidth: tmpl.canvasWidth || 1920,
            canvasHeight: tmpl.canvasHeight || 1358,
            bodyContentHtml: tmpl.bodyContentHtml || prev.bodyContentHtml,
            elements: loadedElements,
            selectedUid: loadedElements.length > 0 ? loadedElements[0].uid : null,
            isDirty: false,
          }));
        }
      } catch (err: any) {
        console.error('Failed to load initial data:', err);
      } finally {
        setIsPlaceholdersLoading(false);
      }
    }

    init();
  }, [state.templateId]);

  // Window beforeunload prompt if isDirty
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.isDirty]);

  // Keyboard navigation & deletion: nudge selected element or delete
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const active = document.activeElement;
      if (
        active &&
        (active.tagName === 'INPUT' ||
          active.tagName === 'TEXTAREA' ||
          active.tagName === 'SELECT' ||
          (active as HTMLElement).isContentEditable)
      ) {
        return;
      }

      if (!state.selectedUid) return;

      const delta = e.shiftKey ? 10 : 1;

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        updateElement(state.selectedUid, { x: Math.max(0, (selectedElement?.x || 0) - delta) });
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        updateElement(state.selectedUid, {
          x: Math.min(
            state.canvasWidth - (selectedElement?.width || 0),
            (selectedElement?.x || 0) + delta
          ),
        });
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        updateElement(state.selectedUid, { y: Math.max(0, (selectedElement?.y || 0) - delta) });
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        updateElement(state.selectedUid, {
          y: Math.min(
            state.canvasHeight - (selectedElement?.height || 0),
            (selectedElement?.y || 0) + delta
          ),
        });
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        deleteElement(state.selectedUid);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [state.selectedUid, state.elements, state.canvasWidth, state.canvasHeight]);

  // Update an element in state
  const updateElement = useCallback((uid: string, updates: Partial<CanvasElement>) => {
    setState((prev) => {
      const updated = prev.elements.map((el) => {
        if (el.uid === uid) {
          const next = { ...el, ...updates };
          const clamped = clampWithinCanvas(
            next.x,
            next.y,
            next.width,
            next.height,
            prev.canvasWidth,
            prev.canvasHeight
          );
          return { ...next, ...clamped };
        }
        return el;
      });
      return {
        ...prev,
        elements: updated,
        isDirty: true,
      };
    });
  }, []);

  // Delete an element
  const deleteElement = useCallback(
    async (uid: string) => {
      const target = state.elements.find((el) => el.uid === uid);
      if (target?.savedId) {
        try {
          await certificateApi.deletePlacedPlaceholder(target.savedId);
        } catch (err) {
          console.error('Failed to delete saved placeholder doc:', err);
        }
      }

      setState((prev) => ({
        ...prev,
        elements: prev.elements.filter((el) => el.uid !== uid),
        selectedUid: prev.selectedUid === uid ? null : prev.selectedUid,
        isDirty: true,
      }));
    },
    [state.elements]
  );

  // Set background image and resize canvas proportionally
  const handleSetBackground = useCallback(
    (bg: Attachment | null, newWidth: number, newHeight: number) => {
      setState((prev) => {
        const scaledElements = bg
          ? scaleElementsProportionally(
              prev.elements,
              prev.canvasWidth,
              prev.canvasHeight,
              newWidth,
              newHeight
            )
          : [];

        return {
          ...prev,
          background: bg,
          canvasWidth: newWidth,
          canvasHeight: newHeight,
          elements: scaledElements,
          selectedUid: scaledElements.length > 0 ? scaledElements[0].uid : null,
          isDirty: true,
        };
      });
    },
    []
  );

  // Toggle placeholder checkbox from palette
  const handleTogglePlaceholder = useCallback(
    async (ph: MasterPlaceholder, shouldAdd: boolean) => {
      if (shouldAdd) {
        const count = state.elements.length;
        const cascadeOffset = (count % 8) * 24;
        const defaultWidth = 600;
        const defaultHeight = 80;
        const defaultX = Math.round(state.canvasWidth / 2 - defaultWidth / 2 + cascadeOffset);
        const defaultY = Math.round(state.canvasHeight / 2 - defaultHeight / 2 + cascadeOffset);
        const maxZ = Math.max(...state.elements.map((e) => e.zIndex || 1), 1);

        const newEl: CanvasElement = {
          uid: generateUid('ph'),
          type: 'placeholder',
          placeholderId: ph._id,
          token: `{{${ph.placeholderKey}}}`,
          label: ph.placeholderName,
          x: Math.max(0, defaultX),
          y: Math.max(0, defaultY),
          width: defaultWidth,
          height: defaultHeight,
          fontFamily: 'Playfair Display',
          fontSize: 48,
          bold: true,
          italic: false,
          underline: false,
          textAlign: 'center',
          color: DEFAULT_TEXT_COLOR,
          zIndex: maxZ + 1,
        };

        setState((prev) => ({
          ...prev,
          elements: [...prev.elements, newEl],
          selectedUid: newEl.uid,
          isDirty: true,
        }));
      } else {
        const toRemove = state.elements.filter(
          (e) => e.type === 'placeholder' && e.placeholderId === ph._id
        );
        for (const el of toRemove) {
          if (el.savedId) {
            try {
              await certificateApi.deletePlacedPlaceholder(el.savedId);
            } catch (err) {
              console.error('Failed to delete placeholder:', err);
            }
          }
        }
        setState((prev) => ({
          ...prev,
          elements: prev.elements.filter(
            (e) => !(e.type === 'placeholder' && e.placeholderId === ph._id)
          ),
          selectedUid: toRemove.some((e) => e.uid === prev.selectedUid) ? null : prev.selectedUid,
          isDirty: true,
        }));
      }
    },
    [state.elements, state.canvasWidth, state.canvasHeight]
  );

  // Add another instance of an existing placeholder
  const handleAddPlaceholderInstance = useCallback(
    (ph: MasterPlaceholder) => {
      const count = state.elements.length;
      const cascadeOffset = (count % 8) * 24;
      const defaultWidth = 450;
      const defaultHeight = 60;
      const defaultX = Math.round(state.canvasWidth / 2 - defaultWidth / 2 + cascadeOffset);
      const defaultY = Math.round(state.canvasHeight / 2 - defaultHeight / 2 + cascadeOffset);
      const maxZ = Math.max(...state.elements.map((e) => e.zIndex || 1), 1);

      const newEl: CanvasElement = {
        uid: generateUid('ph'),
        type: 'placeholder',
        placeholderId: ph._id,
        token: `{{${ph.placeholderKey}}}`,
        label: ph.placeholderName,
        x: Math.max(0, defaultX),
        y: Math.max(0, defaultY),
        width: defaultWidth,
        height: defaultHeight,
        fontFamily: 'Playfair Display',
        fontSize: 36,
        bold: true,
        italic: false,
        underline: false,
        textAlign: 'center',
        color: DEFAULT_TEXT_COLOR,
        zIndex: maxZ + 1,
      };

      setState((prev) => ({
        ...prev,
        elements: [...prev.elements, newEl],
        selectedUid: newEl.uid,
        isDirty: true,
      }));
    },
    [state.elements, state.canvasWidth, state.canvasHeight]
  );

  // Dnd-kit drop handling from palette directly onto canvas
  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || over.id !== 'certificate-canvas-droppable') return;

      const data = active.data.current;
      if (!data || data.type !== 'placeholder') return;

      const ph: MasterPlaceholder = data.placeholder;
      const canvasDom = document.querySelector('[data-testid="certificate-canvas"]');
      if (!canvasDom) return;

      const rect = canvasDom.getBoundingClientRect();
      const pointerEvent = (event as any).activatorEvent;
      const clientX = pointerEvent?.clientX ?? rect.left + rect.width / 2;
      const clientY = pointerEvent?.clientY ?? rect.top + rect.height / 2;

      const { x: naturalX, y: naturalY } = convertPointerToCanvas(
        clientX,
        clientY,
        rect,
        state.zoom
      );

      const width = 500;
      const height = 70;
      const clamped = clampWithinCanvas(
        naturalX - width / 2,
        naturalY - height / 2,
        width,
        height,
        state.canvasWidth,
        state.canvasHeight
      );
      const maxZ = Math.max(...state.elements.map((e) => e.zIndex || 1), 1);

      const newEl: CanvasElement = {
        uid: generateUid('ph'),
        type: 'placeholder',
        placeholderId: ph._id,
        token: `{{${ph.placeholderKey}}}`,
        label: ph.placeholderName,
        x: clamped.x,
        y: clamped.y,
        width,
        height,
        fontFamily: 'Playfair Display',
        fontSize: 42,
        bold: true,
        italic: false,
        underline: false,
        textAlign: 'center',
        color: DEFAULT_TEXT_COLOR,
        zIndex: maxZ + 1,
      };

      setState((prev) => ({
        ...prev,
        elements: [...prev.elements, newEl],
        selectedUid: newEl.uid,
        isDirty: true,
      }));
    },
    [state.zoom, state.canvasWidth, state.canvasHeight, state.elements]
  );

  // Place or sync rich text body block to canvas
  const handleSyncBodyToCanvas = useCallback(
    (html: string) => {
      const clean = sanitizeRichText(html);
      setState((prev) => {
        const existingBodyIndex = prev.elements.findIndex((e) => e.type === 'body');
        const defaultWidth = 800;
        const defaultHeight = 160;
        const maxZ = Math.max(...prev.elements.map((e) => e.zIndex || 1), 1);

        if (existingBodyIndex >= 0) {
          const updated = [...prev.elements];
          updated[existingBodyIndex] = {
            ...updated[existingBodyIndex],
            text: clean,
          };
          return {
            ...prev,
            elements: updated,
            bodyContentHtml: clean,
            selectedUid: updated[existingBodyIndex].uid,
            isDirty: true,
          };
        } else {
          const newEl: CanvasElement = {
            uid: generateUid('body'),
            type: 'body',
            label: 'Body Content Block',
            text: clean,
            x: Math.round(prev.canvasWidth / 2 - defaultWidth / 2),
            y: Math.round(prev.canvasHeight * 0.45),
            width: defaultWidth,
            height: defaultHeight,
            fontFamily: 'Montserrat',
            fontSize: 22,
            bold: false,
            italic: false,
            underline: false,
            textAlign: 'center',
            color: '#1E293B',
            zIndex: maxZ + 1,
          };
          return {
            ...prev,
            elements: [...prev.elements, newEl],
            bodyContentHtml: clean,
            selectedUid: newEl.uid,
            isDirty: true,
          };
        }
      });
      showToast('Body content synced to certificate canvas');
    },
    []
  );

  // Reset zoom to fit current viewport
  const handleResetZoom = useCallback(() => {
    const container = document.querySelector('.max-h-\\[720px\\]');
    if (container) {
      const fit = calculateFitZoom(
        container.clientWidth,
        container.clientHeight,
        state.canvasWidth,
        state.canvasHeight,
        80
      );
      setState((prev) => ({ ...prev, zoom: fit }));
    } else {
      setState((prev) => ({ ...prev, zoom: 0.45 }));
    }
  }, [state.canvasWidth, state.canvasHeight]);

  // Current selected element
  const selectedElement = useMemo(
    () => state.elements.find((e) => e.uid === state.selectedUid) || null,
    [state.elements, state.selectedUid]
  );

  // Generate current deliverable HTML string
  const currentCertificateHtml = useMemo(
    () => buildCertificateHtml(state, state.elements),
    [state.canvasWidth, state.canvasHeight, state.background, state.elements]
  );

  // ========================
  // Save Draft Flow
  // ========================
  const handleSaveDraft = async () => {
    if (!state.templateName.trim()) {
      showToast('Template name is required', 'error');
      return;
    }

    try {
      setIsSavingDraft(true);

      const check = await certificateApi.checkTemplateName(state.templateName.trim(), state.templateId);
      if (!check.isValid) {
        showToast(check.message || 'Template name is already in use', 'error');
        setIsSavingDraft(false);
        return;
      }

      const placeholderElements = state.elements.filter((e) => e.type === 'placeholder');
      const savedTemplate = await certificateApi.saveTemplate({
        templateId: state.templateId,
        templateName: state.templateName.trim(),
        description: state.description,
        templateBackgroundAttachment: state.background,
        canvasWidth: state.canvasWidth,
        canvasHeight: state.canvasHeight,
        placeholderCount: placeholderElements.length,
        bodyContentHtml: state.bodyContentHtml,
      });

      const tmplId = savedTemplate._id || state.templateId || 'tmpl_default_completion';

      let updatedSavedDocs: any[] = [];
      if (placeholderElements.length > 0) {
        updatedSavedDocs = await certificateApi.bulkSavePlaceholders(tmplId, state.elements);
      }

      await certificateApi.saveDesign(tmplId, state.elements, currentCertificateHtml);

      setState((prev) => {
        const mappedElements = prev.elements.map((el) => {
          if (el.type === 'placeholder') {
            const match = updatedSavedDocs.find(
              (doc) => doc.placeholder === el.placeholderId && doc.x === Math.round(el.x)
            );
            if (match) {
              return { ...el, savedId: match._id };
            }
          }
          return el;
        });

        return {
          ...prev,
          templateId: tmplId,
          elements: mappedElements,
          isDirty: false,
        };
      });

      showToast('Draft and design layout saved successfully!');
      if (onSaved) onSaved(tmplId);
    } catch (err: any) {
      console.error('Save Draft error:', err);
      showToast(err.message || 'Failed to save draft', 'error');
    } finally {
      setIsSavingDraft(false);
    }
  };

  // ========================
  // Submit / Publish Flow
  // ========================
  const handleSubmitPublish = async () => {
    if (!state.templateName.trim()) {
      showToast('Template name is required to submit', 'error');
      return;
    }

    if (!state.background) {
      showToast('Please upload a background image before submitting', 'error');
      return;
    }

    const placeholderCount = state.elements.filter((e) => e.type === 'placeholder').length;
    if (placeholderCount === 0) {
      showToast('At least one placeholder must be placed on the canvas to publish', 'error');
      return;
    }

    try {
      setIsPublishing(true);
      await handleSaveDraft();

      const tmplId = state.templateId || 'tmpl_default_completion';
      await certificateApi.publishTemplate(tmplId);
      setPublicationStatus('published');
      setState((prev) => ({ ...prev, isDirty: false }));

      showToast('Certificate template published successfully! Ready for production rendering.');
      if (onPublished) onPublished(tmplId);
    } catch (err: any) {
      console.error('Publish error:', err);
      showToast(err.message || 'Failed to publish certificate template', 'error');
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
      {/* Builder Header */}
      <BuilderHeader
        isSavingDraft={isSavingDraft}
        isPublishing={isPublishing}
        isDirty={state.isDirty}
        publicationStatus={publicationStatus}
        onSaveDraft={handleSaveDraft}
        onSubmitPublish={handleSubmitPublish}
        onOpenPreview={() => setIsPreviewOpen(true)}
      />

      {/* Builder Canvas & Panels Grid */}
      <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
        <div className="flex-1 grid grid-cols-12 gap-5 p-5 overflow-y-auto lg:overflow-hidden bg-[#F4F7FB]">
          {/* Left Panel: Steps 1, 2, 3 */}
          <div className="col-span-12 lg:col-span-3 flex flex-col gap-4 overflow-y-auto pr-1">
            {/* Step 1: Template Details */}
            <TemplateDetailsForm
              templateName={state.templateName}
              templateId={state.templateId}
              description={state.description}
              background={state.background}
              canvasWidth={state.canvasWidth}
              canvasHeight={state.canvasHeight}
              onChangeName={(name) => setState((prev) => ({ ...prev, templateName: name, isDirty: true }))}
              onChangeDescription={(desc) =>
                setState((prev) => ({ ...prev, description: desc, isDirty: true }))
              }
              onSetBackground={handleSetBackground}
            />

            {/* Step 2: Placeholders */}
            <PlaceholderPalette
              masterPlaceholders={masterPlaceholders}
              elements={state.elements}
              isLoading={isPlaceholdersLoading}
              onTogglePlaceholder={handleTogglePlaceholder}
              onAddPlaceholderInstance={handleAddPlaceholderInstance}
            />

            {/* Step 3: Certificate Body Content */}
            <BodyContentEditor
              initialHtml={state.bodyContentHtml}
              availablePlaceholders={masterPlaceholders}
              onChangeHtml={(html) =>
                setState((prev) => ({ ...prev, bodyContentHtml: html, isDirty: true }))
              }
              onSyncBodyElementToCanvas={handleSyncBodyToCanvas}
            />
          </div>

          {/* Center Area: Toolbar, Canvas, and Note */}
          <div className="col-span-12 lg:col-span-6 flex flex-col h-full overflow-hidden">
            <CanvasToolbar
              device={state.device}
              zoom={state.zoom}
              onChangeDevice={(device) => setState((prev) => ({ ...prev, device }))}
              onChangeZoom={(zoom) => setState((prev) => ({ ...prev, zoom }))}
              onResetZoom={handleResetZoom}
            />

            <div className="flex-1 overflow-hidden">
              <CertificateCanvas
                background={state.background}
                canvasWidth={state.canvasWidth}
                canvasHeight={state.canvasHeight}
                elements={state.elements}
                selectedUid={state.selectedUid}
                zoom={state.zoom}
                device={state.device}
                onSelectElement={(uid) => setState((prev) => ({ ...prev, selectedUid: uid }))}
                onUpdateElement={updateElement}
                onDeleteElement={deleteElement}
                onUsePresetBackground={() =>
                  handleSetBackground(
                    {
                      attFileUrl: '/certificate-bg.svg',
                      attFileName: 'certificate-bg.jpg',
                      attFileSizeBytes: 180 * 1024,
                      attMimeType: 'image/svg+xml',
                      attUrlExpiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
                    },
                    1920,
                    1358
                  )
                }
              />
            </div>
          </div>

          {/* Right Panel: Text Properties */}
          <div className="col-span-12 lg:col-span-3 flex flex-col overflow-y-auto pl-1">
            <PropertiesPanel
              element={selectedElement}
              canvasWidth={state.canvasWidth}
              canvasHeight={state.canvasHeight}
              allElements={state.elements}
              onUpdateElement={updateElement}
              onDeselect={() => setState((prev) => ({ ...prev, selectedUid: null }))}
              onDeleteElement={deleteElement}
            />
          </div>
        </div>
      </DndContext>

      {/* Preview Modal */}
      <PreviewModal
        isOpen={isPreviewOpen}
        templateId={state.templateId}
        templateName={state.templateName}
        certificateHtml={currentCertificateHtml}
        canvasWidth={state.canvasWidth}
        canvasHeight={state.canvasHeight}
        onClose={() => setIsPreviewOpen(false)}
      />

      {/* Floating Toast Notification */}
      {toastMessage && (
        <div
          role="status"
          aria-live="polite"
          className={`fixed bottom-6 right-6 z-50 px-4 py-2.5 rounded-xl shadow-lg border text-xs font-semibold flex items-center gap-2 animate-in slide-in-from-bottom duration-200 ${
            toastMessage.type === 'error'
              ? 'bg-red-50 text-red-700 border-red-200 shadow-red-500/10'
              : 'bg-emerald-50 text-emerald-800 border-emerald-200 shadow-emerald-500/10'
          }`}
        >
          <span
            className={`w-2 h-2 rounded-full ${
              toastMessage.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
            }`}
          />
          <span>{toastMessage.text}</span>
        </div>
      )}
    </div>
  );
};
export default CertificateBuilder;
