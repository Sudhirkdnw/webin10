'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Link as LinkIcon,
  Image as ImageIcon,
  Minus,
  Code,
  Undo2,
  Redo2,
  RemoveFormatting,
  Eye,
  Edit3,
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  label?: string;
}

export function RichTextEditor({
  value,
  onChange,
  placeholder = 'Type your document text here...',
  minHeight = '360px',
  label,
}: RichTextEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [sourceCode, setSourceCode] = useState(value || '');
  const [formatBlock, setFormatBlock] = useState('p');

  // Sync prop changes into editor DOM only when external change differs
  useEffect(() => {
    if (!editorRef.current) return;
    if (editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || '';
    }
    setSourceCode(value || '');
  }, [value]);

  const handleInput = useCallback(() => {
    if (!editorRef.current) return;
    const html = editorRef.current.innerHTML;
    onChange(html);
    setSourceCode(html);
  }, [onChange]);

  // Execute standard formatting commands
  const execCmd = (command: string, arg: string | undefined = undefined) => {
    if (isSourceMode) return;
    document.execCommand(command, false, arg);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  const handleHeadingChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setFormatBlock(val);
    execCmd('formatBlock', val);
  };

  const handleInsertLink = () => {
    const url = prompt('Enter Web Link URL (e.g. https://webin10.com):', 'https://');
    if (url && url !== 'https://') {
      execCmd('createLink', url);
    }
  };

  const handleInsertImage = () => {
    const url = prompt('Enter Image URL:', 'https://');
    if (url && url !== 'https://') {
      execCmd('insertImage', url);
    }
  };

  const toggleSourceMode = () => {
    if (isSourceMode) {
      // Switching back to visual
      if (editorRef.current) {
        editorRef.current.innerHTML = sourceCode;
      }
      onChange(sourceCode);
      setIsSourceMode(false);
    } else {
      // Switching to source code
      setSourceCode(editorRef.current?.innerHTML || '');
      setIsSourceMode(true);
    }
  };

  const handleSourceCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setSourceCode(val);
    onChange(val);
  };

  // Word & Character count calculation
  const textContent = (value || '').replace(/<[^>]*>?/gm, '').trim();
  const wordCount = textContent ? textContent.split(/\s+/).length : 0;
  const charCount = textContent.length;

  return (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-xs focus-within:border-indigo-500 focus-within:ring-1 focus-within:ring-indigo-500/20 transition-all">
      {/* Top Controls Toolbar */}
      <div className="bg-slate-50 border-b border-slate-200 px-3 py-2 flex flex-wrap items-center gap-1.5 text-slate-700 select-none">
        {/* Format Dropdown (H1, H2, H3, P) */}
        <select
          value={formatBlock}
          onChange={handleHeadingChange}
          disabled={isSourceMode}
          className="text-xs font-semibold bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 hover:border-slate-300 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:opacity-40 cursor-pointer mr-1"
        >
          <option value="p">Normal (Paragraph)</option>
          <option value="h1">Heading 1 (Main Title)</option>
          <option value="h2">Heading 2 (Section)</option>
          <option value="h3">Heading 3 (Sub-Section)</option>
          <option value="blockquote">Quote Block</option>
          <option value="pre">Code / Monospace</option>
        </select>

        <div className="h-5 w-px bg-slate-200 mx-1" />

        {/* Text Style: Bold, Italic, Underline, Strike */}
        <button
          type="button"
          onClick={() => execCmd('bold')}
          disabled={isSourceMode}
          title="Bold (Ctrl+B)"
          className="p-1.5 rounded-lg hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 transition-colors"
        >
          <Bold className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => execCmd('italic')}
          disabled={isSourceMode}
          title="Italic (Ctrl+I)"
          className="p-1.5 rounded-lg hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 transition-colors"
        >
          <Italic className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => execCmd('underline')}
          disabled={isSourceMode}
          title="Underline (Ctrl+U)"
          className="p-1.5 rounded-lg hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 transition-colors"
        >
          <Underline className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => execCmd('strikeThrough')}
          disabled={isSourceMode}
          title="Strikethrough"
          className="p-1.5 rounded-lg hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 transition-colors"
        >
          <Strikethrough className="w-3.5 h-3.5" />
        </button>

        <div className="h-5 w-px bg-slate-200 mx-1" />

        {/* Alignment */}
        <button
          type="button"
          onClick={() => execCmd('justifyLeft')}
          disabled={isSourceMode}
          title="Align Left"
          className="p-1.5 rounded-lg hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 transition-colors"
        >
          <AlignLeft className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => execCmd('justifyCenter')}
          disabled={isSourceMode}
          title="Align Center"
          className="p-1.5 rounded-lg hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 transition-colors"
        >
          <AlignCenter className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => execCmd('justifyRight')}
          disabled={isSourceMode}
          title="Align Right"
          className="p-1.5 rounded-lg hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 transition-colors"
        >
          <AlignRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => execCmd('justifyFull')}
          disabled={isSourceMode}
          title="Justify Text"
          className="p-1.5 rounded-lg hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 transition-colors"
        >
          <AlignJustify className="w-3.5 h-3.5" />
        </button>

        <div className="h-5 w-px bg-slate-200 mx-1" />

        {/* Lists */}
        <button
          type="button"
          onClick={() => execCmd('insertUnorderedList')}
          disabled={isSourceMode}
          title="Bulleted List"
          className="p-1.5 rounded-lg hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 transition-colors"
        >
          <List className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => execCmd('insertOrderedList')}
          disabled={isSourceMode}
          title="Numbered List"
          className="p-1.5 rounded-lg hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 transition-colors"
        >
          <ListOrdered className="w-3.5 h-3.5" />
        </button>

        <div className="h-5 w-px bg-slate-200 mx-1" />

        {/* Link, Image, Divider */}
        <button
          type="button"
          onClick={handleInsertLink}
          disabled={isSourceMode}
          title="Insert Link"
          className="p-1.5 rounded-lg hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 transition-colors"
        >
          <LinkIcon className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={handleInsertImage}
          disabled={isSourceMode}
          title="Insert Image"
          className="p-1.5 rounded-lg hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 transition-colors"
        >
          <ImageIcon className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => execCmd('insertHorizontalRule')}
          disabled={isSourceMode}
          title="Horizontal Line"
          className="p-1.5 rounded-lg hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 transition-colors"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => execCmd('removeFormat')}
          disabled={isSourceMode}
          title="Clear Formatting"
          className="p-1.5 rounded-lg hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 transition-colors"
        >
          <RemoveFormatting className="w-3.5 h-3.5" />
        </button>

        <div className="h-5 w-px bg-slate-200 mx-1" />

        {/* Undo / Redo */}
        <button
          type="button"
          onClick={() => execCmd('undo')}
          disabled={isSourceMode}
          title="Undo"
          className="p-1.5 rounded-lg hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 transition-colors"
        >
          <Undo2 className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => execCmd('redo')}
          disabled={isSourceMode}
          title="Redo"
          className="p-1.5 rounded-lg hover:bg-slate-200 active:bg-slate-300 disabled:opacity-40 transition-colors"
        >
          <Redo2 className="w-3.5 h-3.5" />
        </button>

        <div className="ml-auto flex items-center gap-1">
          {/* HTML Source Toggle Button */}
          <button
            type="button"
            onClick={toggleSourceMode}
            title={isSourceMode ? 'Switch to Visual Editor' : 'Edit HTML Source Code'}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors ${
              isSourceMode
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'bg-white border border-slate-200 text-slate-700 hover:bg-slate-100'
            }`}
          >
            {isSourceMode ? <Eye className="w-3.5 h-3.5" /> : <Code className="w-3.5 h-3.5" />}
            <span>{isSourceMode ? 'Visual Editor' : '</> HTML Source'}</span>
          </button>
        </div>
      </div>

      {/* Editor Body */}
      {isSourceMode ? (
        <textarea
          value={sourceCode}
          onChange={handleSourceCodeChange}
          placeholder="Enter raw HTML content here..."
          style={{ minHeight }}
          className="w-full p-5 font-mono text-xs bg-slate-900 text-emerald-400 focus:outline-none resize-y leading-relaxed"
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          style={{ minHeight }}
          className="p-6 focus:outline-none text-slate-800 text-sm leading-relaxed overflow-y-auto prose prose-slate max-w-none"
          data-placeholder={placeholder}
        />
      )}

      {/* Footer Info Bar */}
      <div className="bg-slate-50 border-t border-slate-100 px-4 py-2 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-3">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{charCount} characters</span>
          <span>•</span>
          <span>~{Math.max(1, Math.ceil(wordCount / 200))} min read</span>
        </div>

        <div className="flex items-center gap-2">
          {isSourceMode ? (
            <span className="text-indigo-600 font-semibold font-mono">HTML Source View Active</span>
          ) : (
            <span className="text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              Live Visual Document Ready
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
