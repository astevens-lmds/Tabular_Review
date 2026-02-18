import { useEffect } from 'react';

export interface ShortcutAction {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  description: string;
  action: () => void;
}

export const SHORTCUT_DESCRIPTIONS = [
  { keys: 'Ctrl+N', description: 'New column' },
  { keys: 'Ctrl+Enter', description: 'Run analysis' },
  { keys: 'Ctrl+E', description: 'Export CSV' },
  { keys: 'Ctrl+S', description: 'Save project' },
  { keys: 'Ctrl+/', description: 'Toggle chat' },
  { keys: 'Ctrl+D', description: 'Toggle dark mode' },
  { keys: 'Ctrl+P', description: 'Open projects' },
  { keys: 'Ctrl+W', description: 'Toggle text wrap' },
  { keys: 'Escape', description: 'Close sidebar/modal' },
  { keys: '?', description: 'Show shortcuts help' },
];

export function useKeyboardShortcuts(shortcuts: ShortcutAction[]) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't fire shortcuts when typing in inputs
      const target = e.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
        // Allow Escape even in inputs
        if (e.key !== 'Escape') return;
      }

      for (const shortcut of shortcuts) {
        const ctrlMatch = shortcut.ctrl ? (e.ctrlKey || e.metaKey) : !(e.ctrlKey || e.metaKey);
        const shiftMatch = shortcut.shift ? e.shiftKey : !e.shiftKey;
        const altMatch = shortcut.alt ? e.altKey : !e.altKey;
        
        if (e.key === shortcut.key && ctrlMatch && shiftMatch && altMatch) {
          e.preventDefault();
          shortcut.action();
          return;
        }
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [shortcuts]);
}
