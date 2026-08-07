import React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Link from '@tiptap/extension-link';
import TextStyle from '@tiptap/extension-text-style';
import Color from '@tiptap/extension-color';
import TextAlign from '@tiptap/extension-text-align';
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  List,
  ListOrdered,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Link as LinkIcon,
  RotateCcw,
  RotateCw,
  RemoveFormatting,
} from 'lucide-react';

export interface TiptapEditorProps {
  contentHtml: string;
  onChangeHtml: (html: string) => void;
}

export const TiptapEditor: React.FC<TiptapEditorProps> = ({ contentHtml, onChangeHtml }) => {
  const [showLinkModal, setShowLinkModal] = React.useState(false);
  const [linkUrl, setLinkUrl] = React.useState('');

  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
      TextStyle,
      Color,
      Link.configure({
        openOnClick: false,
        autolink: true,
        linkOnPaste: true,
        HTMLAttributes: {
          target: '_blank',
          rel: 'noopener noreferrer',
          class: 'text-[#0878e8] dark:text-sky-400 underline hover:opacity-80 transition-opacity',
        },
      }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
    ],
    content: contentHtml,
    onUpdate: ({ editor }) => {
      onChangeHtml(editor.getHTML());
    },
  });

  if (!editor) return null;

  const handleOpenLinkModal = () => {
    const previousUrl = editor.getAttributes('link').href || '';
    setLinkUrl(previousUrl);
    setShowLinkModal(true);
  };

  const handleSetLink = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    let url = linkUrl.trim();
    if (!url) {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      setShowLinkModal(false);
      return;
    }

    if (!/^https?:\/\//i.test(url) && !/^mailto:/i.test(url) && !/^tel:/i.test(url)) {
      url = `https://${url}`;
    }

    editor.chain().focus().extendMarkRange('link').setLink({ href: url, target: '_blank' }).run();
    setShowLinkModal(false);
    setLinkUrl('');
  };

  const handleUnsetLink = () => {
    editor.chain().focus().extendMarkRange('link').unsetLink().run();
    setShowLinkModal(false);
    setLinkUrl('');
  };

  return (
    <div className="flex flex-col border border-slate-200 dark:border-slate-800 rounded-xl bg-white dark:bg-slate-900 overflow-hidden focus-within:ring-2 focus-within:ring-mexo-500/20 focus-within:border-mexo-600 transition-all relative">
      {/* Formatting Toolbar */}
      <div className="flex items-center flex-wrap gap-1 px-3 py-1.5 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 select-none">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
            editor.isActive('bold') ? 'bg-slate-200 dark:bg-slate-700 text-mexo-600' : 'text-slate-600 dark:text-slate-400'
          }`}
          title="Bold (Ctrl+B)"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
            editor.isActive('italic') ? 'bg-slate-200 dark:bg-slate-700 text-mexo-600' : 'text-slate-600 dark:text-slate-400'
          }`}
          title="Italic (Ctrl+I)"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
            editor.isActive('underline') ? 'bg-slate-200 dark:bg-slate-700 text-mexo-600' : 'text-slate-600 dark:text-slate-400'
          }`}
          title="Underline (Ctrl+U)"
        >
          <UnderlineIcon className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={handleOpenLinkModal}
          className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
            editor.isActive('link') ? 'bg-slate-200 dark:bg-slate-700 text-mexo-600 font-bold' : 'text-slate-600 dark:text-slate-400'
          }`}
          title="Insert Link (Ctrl+K)"
        >
          <LinkIcon className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
            editor.isActive('bulletList') ? 'bg-slate-200 dark:bg-slate-700 text-mexo-600' : 'text-slate-600 dark:text-slate-400'
          }`}
          title="Bulleted List"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={`p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 ${
            editor.isActive('orderedList') ? 'bg-slate-200 dark:bg-slate-700 text-mexo-600' : 'text-slate-600 dark:text-slate-400'
          }`}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('left').run()}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
          title="Align Left"
        >
          <AlignLeft className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('center').run()}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
          title="Align Center"
        >
          <AlignCenter className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setTextAlign('right').run()}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
          title="Align Right"
        >
          <AlignRight className="w-4 h-4" />
        </button>

        <div className="h-4 w-px bg-slate-300 dark:bg-slate-700 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
          title="Undo"
        >
          <RotateCcw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
          title="Redo"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
          className="p-1.5 rounded hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-400"
          title="Remove Formatting"
        >
          <RemoveFormatting className="w-4 h-4" />
        </button>
      </div>

      {/* Link Popover Dialog */}
      {showLinkModal && (
        <form
          onSubmit={handleSetLink}
          className="absolute top-11 left-3 z-20 p-2.5 bg-slate-900 text-white rounded-xl shadow-2xl border border-slate-700 flex items-center space-x-2 animate-in fade-in zoom-in-95 duration-150"
        >
          <input
            type="url"
            autoFocus
            placeholder="Paste URL (e.g. https://google.com)"
            value={linkUrl}
            onChange={(e) => setLinkUrl(e.target.value)}
            className="px-3 py-1.5 text-xs bg-slate-800 text-white rounded-lg border border-slate-700 outline-none focus:border-mexo-500 w-56 sm:w-64 font-mono"
          />
          <button
            type="submit"
            className="px-3 py-1.5 text-xs font-bold bg-mexo-600 hover:bg-mexo-700 text-white rounded-lg transition-colors"
          >
            Apply
          </button>
          {editor.isActive('link') && (
            <button
              type="button"
              onClick={handleUnsetLink}
              className="px-2.5 py-1.5 text-xs font-semibold bg-rose-600/80 hover:bg-rose-600 text-white rounded-lg transition-colors"
            >
              Unlink
            </button>
          )}
          <button
            type="button"
            onClick={() => setShowLinkModal(false)}
            className="px-2 py-1.5 text-xs text-slate-400 hover:text-white"
          >
            Cancel
          </button>
        </form>
      )}

      {/* Tiptap Editable Area */}
      <EditorContent editor={editor} className="p-3 min-h-[160px] text-sm text-slate-900 dark:text-slate-100 font-sans" />
    </div>
  );
};
