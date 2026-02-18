import React from 'react';
import { COLUMN_TEMPLATES, ColumnTemplate } from '../utils/columnTemplates';
import { X, LayoutTemplate } from './Icons';

interface ColumnTemplateMenuProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyTemplate: (template: ColumnTemplate) => void;
}

export const ColumnTemplateMenu: React.FC<ColumnTemplateMenuProps> = ({
  isOpen,
  onClose,
  onApplyTemplate,
}) => {
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-[520px] max-h-[60vh] flex flex-col pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4 text-indigo-600" />
              <h2 className="text-lg font-bold text-slate-800">Column Templates</h2>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {COLUMN_TEMPLATES.map(template => (
              <div
                key={template.id}
                className="p-4 rounded-xl border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 cursor-pointer transition-all"
                onClick={() => { onApplyTemplate(template); onClose(); }}
              >
                <h3 className="text-sm font-bold text-slate-800">{template.name}</h3>
                <p className="text-xs text-slate-500 mt-1">{template.description}</p>
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {template.columns.map((col, i) => (
                    <span key={i} className="px-2 py-0.5 bg-slate-100 text-slate-600 text-[10px] font-medium rounded-full">
                      {col.name}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
