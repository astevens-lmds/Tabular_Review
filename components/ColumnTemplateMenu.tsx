import React, { useState } from 'react';
import { COLUMN_TEMPLATES, ColumnTemplate } from '../utils/columnTemplates';
import { X, LayoutTemplate, ChevronDown } from './Icons';

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
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const typeColor = (type: string) => {
    switch (type) {
      case 'text': return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'date': return 'bg-amber-100 text-amber-700 dark:bg-amber-900 dark:text-amber-300';
      case 'boolean': return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300';
      case 'number': return 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300';
      case 'list': return 'bg-rose-100 text-rose-700 dark:bg-rose-900 dark:text-rose-300';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-600 w-[600px] max-h-[70vh] flex flex-col pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
            <div className="flex items-center gap-2">
              <LayoutTemplate className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-200">Column Templates</h2>
            </div>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <p className="px-6 pt-3 text-xs text-slate-500 dark:text-slate-400">
            Pre-built column sets for common legal review workflows. Click a template to preview, then apply.
          </p>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {COLUMN_TEMPLATES.map(template => {
              const isExpanded = expandedId === template.id;
              return (
                <div
                  key={template.id}
                  className="rounded-xl border border-slate-100 dark:border-slate-600 hover:border-indigo-200 dark:hover:border-indigo-500 transition-all overflow-hidden"
                >
                  {/* Template header */}
                  <div
                    className="p-4 cursor-pointer hover:bg-indigo-50/30 dark:hover:bg-indigo-950/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : template.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">{template.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">{template.description}</p>
                      </div>
                      <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {template.columns.map((col, i) => (
                        <span key={i} className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${typeColor(col.type)}`}>
                          {col.name}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Expanded preview */}
                  {isExpanded && (
                    <div className="border-t border-slate-100 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-900/50">
                      <div className="p-4 space-y-2">
                        <h4 className="text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                          {template.columns.length} Columns
                        </h4>
                        {template.columns.map((col, i) => (
                          <div key={i} className="flex items-start gap-3 p-2 rounded-lg bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700">
                            <span className={`px-1.5 py-0.5 text-[9px] font-bold rounded ${typeColor(col.type)} flex-shrink-0 mt-0.5`}>
                              {col.type.toUpperCase()}
                            </span>
                            <div className="min-w-0">
                              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300">{col.name}</p>
                              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-2">{col.prompt}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 flex justify-end">
                        <button
                          onClick={(e) => { e.stopPropagation(); onApplyTemplate(template); onClose(); }}
                          className="px-4 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-lg transition-colors shadow-sm"
                        >
                          Apply Template
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </>
  );
};
