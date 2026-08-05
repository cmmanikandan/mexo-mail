import React from 'react';
import { MexoModal } from '../common/MexoModal';
import { Keyboard } from 'lucide-react';

export const KeyboardShortcutsModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({
  isOpen,
  onClose,
}) => {
  const shortcuts = [
    { key: 'C', description: 'Compose new message' },
    { key: '/', description: 'Focus search & open filters' },
    { key: '?', description: 'Open Keyboard Shortcuts cheat sheet' },
    { key: 'E', description: 'Archive selected messages' },
    { key: '# or Del', description: 'Delete selected messages' },
    { key: 'S', description: 'Star / Unstar selected message' },
    { key: 'Esc', description: 'Close compose or modal popup' },
  ];

  return (
    <MexoModal isOpen={isOpen} onClose={onClose} title="Keyboard Shortcuts" maxWidth="sm">
      <div className="space-y-3">
        <div className="flex items-center space-x-2 text-xs font-bold text-[#0878e8]">
          <Keyboard className="w-4 h-4" />
          <span>Productivity Hotkeys</span>
        </div>
        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          {shortcuts.map((sc) => (
            <div key={sc.key} className="flex items-center justify-between py-2 text-xs">
              <span className="text-slate-600 dark:text-slate-400 font-medium">{sc.description}</span>
              <kbd className="px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 font-mono font-extrabold text-[#0878e8]">
                {sc.key}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </MexoModal>
  );
};
