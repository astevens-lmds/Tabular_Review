import React, { useState, useEffect } from 'react';
import { X, Trash2, Plus } from './Icons';
import {
  PromptTemplate,
  getAllPromptTemplates,
  savePromptTemplate,
  deletePromptTemplate,
} from '../services/promptTemplateStore';
import { ColumnType } from '../types';

interface PromptTemplateManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onUseTemplate: (prompt: string, columnType: ColumnType) => void;
}

export const PromptTemplateManager: React.FC<PromptTemplateManagerProps> = ({
  isOpen,
  onClose,
  onUseTemplate,
}) => {
  const [templates, setTemplates] = useState<PromptTemplate[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDescription, setNewDescription] = useState('');
  const [newPrompt, setNewPrompt] = useState('');
  const [newType, setNewType] = useState<ColumnType>('text');
  const [newTags, setNewTags] = useState('');
  const [filterTag, setFilterTag] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTemplates(getAllPromptTemplates());
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const allTags = [...new Set(templates.flatMap(t => t.tags))].sort();

  const filtered = filterTag
    ? templates.filter(t => t.tags.includes(filterTag))
    : templates;

  const handleCreate = () => {
    if (!newName.trim() || !newPrompt.trim()) return;
    savePromptTemplate({
      name: newName.trim(),
      description: newDescription.trim(),
      prompt: newPrompt.trim(),
      columnType: newType,
      tags: newTags.split(',').map(t => t.trim()).filter(Boolean),
    });
    setTemplates(getAllPromptTemplates());
    setIsCreating(false);
    setNewName('');
    setNewDescription('');
    setNewPrompt('');
    setNewTags('');
  };

  const handleDelete = (id: string) => {
    if (id.startsWith('builtin_')) return; // Can't delete built-ins
    deletePromptTemplate(id);
    setTemplates(getAllPromptTemplates());
  };

  const typeColors: Record<ColumnType, string> = {
    text: 'bg-blue-50 text-blue-700',
    number: 'bg-purple-50 text-purple-700',
    date: 'bg-green-50 text-green-700',
    boolean: 'bg-amber-50 text-amber-700',
    list: 'bg-pink-50 text-pink-700',
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-[650px] max-h-[80vh] flex flex-col pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Prompt Templates</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCreating(!isCreating)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                New Template
              </button>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Tag Filter */}
          {allTags.length > 0 && (
            <div className="px-6 py-2 border-b border-slate-100 dark:border-slate-700 flex items-center gap-1.5 flex-wrap">
              <button
                onClick={() => setFilterTag('')}
                className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${!filterTag ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                All
              </button>
              {allTags.map(tag => (
                <button
                  key={tag}
                  onClick={() => setFilterTag(tag === filterTag ? '' : tag)}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium transition-colors ${tag === filterTag ? 'bg-indigo-100 text-indigo-700' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
                >
                  {tag}
                </button>
              ))}
            </div>
          )}

          {/* Create Form */}
          {isCreating && (
            <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-700 space-y-3 bg-slate-50 dark:bg-slate-800/50">
              <input
                type="text"
                placeholder="Template name"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <input
                type="text"
                placeholder="Description (optional)"
                value={newDescription}
                onChange={e => setNewDescription(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <textarea
                placeholder="Prompt text (use {{placeholder}} for variables)"
                value={newPrompt}
                onChange={e => setNewPrompt(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <div className="flex gap-3">
                <select
                  value={newType}
                  onChange={e => setNewType(e.target.value as ColumnType)}
                  className="px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="text">Text</option>
                  <option value="number">Number</option>
                  <option value="date">Date</option>
                  <option value="boolean">Boolean</option>
                  <option value="list">List</option>
                </select>
                <input
                  type="text"
                  placeholder="Tags (comma-separated)"
                  value={newTags}
                  onChange={e => setNewTags(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button onClick={() => setIsCreating(false)} className="px-3 py-1.5 text-xs text-slate-500 hover:text-slate-700">Cancel</button>
                <button
                  onClick={handleCreate}
                  disabled={!newName.trim() || !newPrompt.trim()}
                  className="px-4 py-1.5 text-xs font-semibold bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                >
                  Save Template
                </button>
              </div>
            </div>
          )}

          {/* Template List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {filtered.length === 0 ? (
              <p className="text-sm text-slate-400 text-center py-8">No templates found</p>
            ) : (
              filtered.map(t => (
                <div
                  key={t.id}
                  className="p-4 rounded-xl border border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer group"
                  onClick={() => { onUseTemplate(t.prompt, t.columnType); onClose(); }}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{t.name}</h3>
                        <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${typeColors[t.columnType]}`}>
                          {t.columnType}
                        </span>
                        {t.id.startsWith('builtin_') && (
                          <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded">built-in</span>
                        )}
                      </div>
                      {t.description && (
                        <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>
                      )}
                      <p className="text-xs text-slate-400 mt-1 font-mono truncate">{t.prompt}</p>
                      {t.tags.length > 0 && (
                        <div className="flex gap-1 mt-1.5">
                          {t.tags.map(tag => (
                            <span key={tag} className="text-[10px] bg-slate-100 dark:bg-slate-700 text-slate-500 px-1.5 py-0.5 rounded">{tag}</span>
                          ))}
                        </div>
                      )}
                    </div>
                    {!t.id.startsWith('builtin_') && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDelete(t.id); }}
                        className="p-1.5 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};
