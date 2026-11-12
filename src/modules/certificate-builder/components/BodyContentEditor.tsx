import React, { useRef, useState, useEffect } from 'react';
import {
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Link as LinkIcon,
  ChevronDown,
  Layers,
  Sparkles,
} from 'lucide-react';
import { MasterPlaceholder } from '../types/certificate';
import { sanitizeRichText } from '../utils/certificateHtml';

interface BodyContentEditorProps {
  initialHtml: string;
  availablePlaceholders: MasterPlaceholder[];
  onChangeHtml: (html: string) => void;
  onSyncBodyElementToCanvas: (html: string) => void;
}

export const BodyContentEditor: React.FC<BodyContentEditorProps> = ({
  initialHtml,
  availablePlaceholders,
  onChangeHtml,
  onSyncBodyElementToCanvas,
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const [tokenDropdownOpen, setTokenDropdownOpen] = useState(false);
  const [charCount, setCharCount] = useState(0);

  // Initialize content on load or external update
  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== initialHtml) {
      editorRef.current.innerHTML = initialHtml || '';
      updateCharCount();
    }
  }, [initialHtml]);

  const updateCharCount = () => {
    if (editorRef.current) {
      const text = editorRef.current.innerText || '';
      setCharCount(text.trim().length);
    }
  };

  const handleInput = () => {
    if (!editorRef.current) return;
    const rawHtml = editorRef.current.innerHTML;
    const cleanHtml = sanitizeRichText(rawHtml);
    updateCharCount();
    onChangeHtml(cleanHtml);
  };

  const executeCommand = (command: string, value: string | undefined = undefined) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  const handleInsertToken = (tokenKey: string) => {
    const tokenString = `{{${tokenKey}}}`;
    const selection = window.getSelection();
    if (selection && selection.rangeCount > 0 && editorRef.current?.contains(selection.anchorNode)) {
      const range = selection.getRangeAt(0);
      range.deleteContents();
      const textNode = document.createTextNode(` ${tokenString} `);
      range.insertNode(textNode);
      range.setStartAfter(textNode);
      range.setEndAfter(textNode);
      selection.removeAllRanges();
      selection.addRange(range);
    } else {
      if (editorRef.current) {
        editorRef.current.innerHTML += ` <span>${tokenString}</span> `;
      }
    }
    setTokenDropdownOpen(false);
    handleInput();
  };

  const handleFormatBlock = (tag: string) => {
    executeCommand('formatBlock', `<${tag}>`);
  };

  const handleAddLink = () => {
    const url = prompt('Enter destination URL:', 'https://');
    if (url) {
      executeCommand('createLink', url);
    }
  };

  const handleSyncToCanvas = () => {
    if (editorRef.current) {
      const cleanHtml = sanitizeRichText(editorRef.current.innerHTML);
      onSyncBodyElementToCanvas(cleanHtml);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200/90 p-5 shadow-xs transition-all">
      {/* Step Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2.5">
          <span className="w-6 h-6 rounded-full bg-blue-600 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs">
            3
          </span>
          <h2 className="font-semibold text-slate-800 text-sm tracking-tight">
            Certificate Body Content
          </h2>
        </div>
      </div>

      <p className="text-xs text-slate-500 mb-3.5">
        Add the content for your certificate. You can use the selected placeholders in the text.
      </p>

      {/* Editor Box */}
      <div className="border border-slate-300 rounded-lg overflow-hidden focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
        {/* Rich Text Toolbar matching screenshot */}
        <div className="bg-slate-50/90 border-b border-slate-200 p-1.5 flex flex-wrap items-center gap-1 text-slate-700">
          {/* Paragraph Style Dropdown */}
          <select
            onChange={(e) => handleFormatBlock(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded px-2 py-1 text-slate-700 focus:outline-none cursor-pointer"
            defaultValue="p"
          >
            <option value="p">Paragraph</option>
            <option value="h1">Heading 1</option>
            <option value="h2">Heading 2</option>
            <option value="h3">Heading 3</option>
          </select>

          <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>

          {/* Bold */}
          <button
            type="button"
            onClick={() => executeCommand('bold')}
            title="Bold"
            className="p-1 rounded hover:bg-slate-200 text-slate-700 transition-colors font-bold"
          >
            <Bold className="w-3.5 h-3.5" />
          </button>

          {/* Italic */}
          <button
            type="button"
            onClick={() => executeCommand('italic')}
            title="Italic"
            className="p-1 rounded hover:bg-slate-200 text-slate-700 transition-colors italic"
          >
            <Italic className="w-3.5 h-3.5" />
          </button>

          {/* Underline */}
          <button
            type="button"
            onClick={() => executeCommand('underline')}
            title="Underline"
            className="p-1 rounded hover:bg-slate-200 text-slate-700 transition-colors underline"
          >
            <Underline className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>

          {/* Lists */}
          <button
            type="button"
            onClick={() => executeCommand('insertUnorderedList')}
            title="Bullet list"
            className="p-1 rounded hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <List className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={() => executeCommand('insertOrderedList')}
            title="Numbered list"
            className="p-1 rounded hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <ListOrdered className="w-3.5 h-3.5" />
          </button>

          {/* Link */}
          <button
            type="button"
            onClick={handleAddLink}
            title="Insert link"
            className="p-1 rounded hover:bg-slate-200 text-slate-700 transition-colors"
          >
            <LinkIcon className="w-3.5 h-3.5" />
          </button>

          <div className="w-[1px] h-4 bg-slate-200 mx-1"></div>

          {/* Insert Token Dropdown */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setTokenDropdownOpen(!tokenDropdownOpen)}
              className="inline-flex items-center gap-1 text-[11px] font-medium bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 rounded px-2 py-0.5 transition-colors"
            >
              <Sparkles className="w-3 h-3 text-blue-500" />
              <span>Insert Token</span>
              <ChevronDown className="w-3 h-3" />
            </button>

            {tokenDropdownOpen && (
              <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-slate-200 py-1 z-30 max-h-48 overflow-y-auto">
                <div className="px-2.5 py-1 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                  Available Tokens
                </div>
                {availablePlaceholders.map((ph) => (
                  <button
                    key={ph._id}
                    type="button"
                    onClick={() => handleInsertToken(ph.placeholderKey)}
                    className="w-full text-left px-3 py-1.5 text-xs text-slate-700 hover:bg-blue-50 hover:text-blue-700 flex items-center justify-between transition-colors"
                  >
                    <span>{ph.placeholderName}</span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {`{{${ph.placeholderKey}}}`}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Contenteditable Area */}
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          className="min-h-[110px] p-3 text-xs text-slate-800 leading-relaxed focus:outline-none bg-white font-sans"
          style={{ wordBreak: 'break-word' }}
        />

        {/* Char Counter Bar */}
        <div className="bg-slate-50 px-3 py-1.5 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-400">
          <button
            type="button"
            onClick={handleSyncToCanvas}
            title="Places or updates this rich text block directly onto the canvas"
            className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:text-blue-700 hover:underline"
          >
            <Layers className="w-3 h-3" />
            <span>Place / Sync to Canvas</span>
          </button>
          <span>{charCount}/1000</span>
        </div>
      </div>
    </div>
  );
};
