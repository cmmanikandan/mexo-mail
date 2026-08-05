import React, { useState } from 'react';
import { db, ComposeTemplate } from '../../services/db';
import { useUIStore } from '../../store/uiStore';
import { FileText, Plus, Trash2, ChevronDown } from 'lucide-react';
import * as DropdownMenu from '@radix-ui/react-dropdown-menu';

interface TemplatesDropdownProps {
  onSelectTemplate: (template: ComposeTemplate) => void;
  currentSubject: string;
  currentBodyHtml: string;
}

export const TemplatesDropdown: React.FC<TemplatesDropdownProps> = ({
  onSelectTemplate,
  currentSubject,
  currentBodyHtml,
}) => {
  const { addToast } = useUIStore();
  const [templates, setTemplates] = useState<ComposeTemplate[]>(db.getTemplates());
  const [isSaving, setIsSaving] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState('');

  const refreshTemplates = () => {
    setTemplates(db.getTemplates());
  };

  const handleSaveAsTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTemplateName.trim()) {
      addToast({ message: 'Please enter a template name.', type: 'warning' });
      return;
    }

    db.saveTemplate({
      name: newTemplateName.trim(),
      subject: currentSubject,
      bodyHtml: currentBodyHtml,
    });

    addToast({ message: `Template "${newTemplateName}" saved!`, type: 'success' });
    setNewTemplateName('');
    setIsSaving(false);
    refreshTemplates();
  };

  const handleDeleteTemplate = (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    db.deleteTemplate(id);
    addToast({ message: `Template "${name}" deleted.`, type: 'info' });
    refreshTemplates();
  };

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button
          type="button"
          className="p-2 text-slate-500 hover:text-mexo-600 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-xl transition-colors flex items-center space-x-1"
          title="Templates & Canned Responses"
        >
          <FileText className="w-4 h-4" />
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="w-64 bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200 dark:border-slate-700 p-2 z-[9999] animate-in fade-in slide-in-from-top-1 duration-150"
          align="start"
          side="top"
          sideOffset={8}
        >
          <div className="px-2.5 py-1.5 text-[10px] font-extrabold uppercase text-slate-400 tracking-widest border-b border-slate-100 dark:border-slate-800 mb-1">
            Templates & Canned Responses
          </div>

          <div className="max-h-48 overflow-y-auto space-y-0.5 my-1">
            {templates.length === 0 ? (
              <div className="px-3 py-3 text-xs text-slate-400 text-center">
                No templates saved yet. Save current message as a template below.
              </div>
            ) : (
              templates.map((tpl) => (
                <DropdownMenu.Item
                  key={tpl.id}
                  onClick={() => onSelectTemplate(tpl)}
                  className="flex items-center justify-between px-2.5 py-2 text-xs font-medium rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer outline-none select-none text-slate-700 dark:text-slate-200"
                >
                  <span className="truncate flex-1 pr-2">{tpl.name}</span>
                  <button
                    onClick={(e) => handleDeleteTemplate(e, tpl.id, tpl.name)}
                    className="p-1 text-slate-400 hover:text-rose-500 rounded transition-colors"
                    title="Delete template"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </DropdownMenu.Item>
              ))
            )}
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-1.5 mt-1">
            {isSaving ? (
              <form onSubmit={handleSaveAsTemplate} className="p-1.5 space-y-2">
                <input
                  type="text"
                  placeholder="Template Name"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                  className="w-full px-2.5 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-[#0878e8]"
                  autoFocus
                />
                <div className="flex items-center justify-end space-x-1.5">
                  <button
                    type="button"
                    onClick={() => setIsSaving(false)}
                    className="px-2 py-1 text-[11px] font-semibold text-slate-500 hover:text-slate-700"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-[11px] font-bold bg-[#0878e8] text-white rounded-lg hover:bg-[#0668cc]"
                  >
                    Save
                  </button>
                </div>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setIsSaving(true)}
                className="w-full flex items-center px-2.5 py-1.5 text-xs font-semibold text-[#0878e8] hover:bg-blue-50 dark:hover:bg-slate-800 rounded-xl transition-colors"
              >
                <Plus className="w-3.5 h-3.5 mr-1.5" /> Save current text as template
              </button>
            )}
          </div>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
};
