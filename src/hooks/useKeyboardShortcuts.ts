import { useEffect } from 'react';
import { useComposeStore } from '../store/composeStore';
import { useUIStore } from '../store/uiStore';
import { useMailStore } from '../store/mailStore';

export const useKeyboardShortcuts = () => {
  const { openCompose } = useComposeStore();
  const { setKeyboardShortcutsOpen, addToast } = useUIStore();
  const { selectedMessageIds, archiveMessages, deleteMessages, toggleStar } = useMailStore();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore hotkeys when typing in form controls
      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.tagName === 'SELECT' ||
          target.isContentEditable)
      ) {
        return;
      }

      // Hotkey: '?' -> Open Keyboard Shortcuts modal
      if (e.key === '?') {
        e.preventDefault();
        setKeyboardShortcutsOpen(true);
        return;
      }

      // Hotkey: 'c' or 'C' -> Open Compose window
      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        openCompose();
        addToast({ message: 'Compose shortcut triggered (C)', type: 'info' });
        return;
      }

      // Hotkey: '/' -> Focus Search Input
      if (e.key === '/') {
        e.preventDefault();
        const searchInput = document.querySelector<HTMLInputElement>(
          'input[placeholder*="Search"], input[type="search"]'
        );
        if (searchInput) {
          searchInput.focus();
          searchInput.select();
        }
        return;
      }

      // Hotkeys requiring selected messages
      if (selectedMessageIds.length > 0) {
        // 'e' or 'E' -> Archive
        if (e.key === 'e' || e.key === 'E') {
          e.preventDefault();
          archiveMessages(selectedMessageIds);
          addToast({ message: `${selectedMessageIds.length} message(s) archived`, type: 'success' });
          return;
        }

        // '#' or 'Delete' -> Delete
        if (e.key === '#' || e.key === 'Delete') {
          e.preventDefault();
          deleteMessages(selectedMessageIds);
          addToast({ message: `${selectedMessageIds.length} message(s) deleted`, type: 'info' });
          return;
        }

        // 's' or 'S' -> Toggle star on selected
        if (e.key === 's' || e.key === 'S') {
          e.preventDefault();
          selectedMessageIds.forEach((id) => toggleStar(id));
          addToast({ message: `Toggled star status on selected mail`, type: 'info' });
          return;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [openCompose, setKeyboardShortcutsOpen, selectedMessageIds, archiveMessages, deleteMessages, toggleStar, addToast]);
};
