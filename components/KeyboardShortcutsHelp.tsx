import React from 'react';
import { SHORTCUT_DESCRIPTIONS } from '../hooks/useKeyboardShortcuts';
import { X, Keyboard } from './Icons';

interface KeyboardShortcutsHelpProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KeyboardShortcutsHelp: React.FC<KeyboardShortcutsHelpProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-[400px] pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <Keyboard className="w-4 h-4 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-800">Keyboard Shortcuts</h2>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>
          <div className="p-5 space-y-3">
            {SHORTCUT_DESCRIPTIONS.map((s, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-slate-600">{s.description}</span>
                <kbd className="px-2 py-1 bg-slate-100 text-slate-700 text-xs font-mono rounded border border-slate-200">
                  {s.keys}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
