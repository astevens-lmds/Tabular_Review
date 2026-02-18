import React, { useState, useEffect } from 'react';
import { Project, listProjects, saveProject, deleteProject } from '../services/projectStore';
import { X, Trash2, Download, Plus } from './Icons';

interface ProjectManagerProps {
  isOpen: boolean;
  onClose: () => void;
  onLoadProject: (project: Project) => void;
  onSaveCurrentProject: () => Project;
  currentProjectId: string | null;
}

export const ProjectManager: React.FC<ProjectManagerProps> = ({
  isOpen,
  onClose,
  onLoadProject,
  onSaveCurrentProject,
  currentProjectId,
}) => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      listProjects().then(p => { setProjects(p); setLoading(false); });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSave = async () => {
    const project = onSaveCurrentProject();
    await saveProject(project);
    setProjects(await listProjects());
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this project permanently?')) return;
    await deleteProject(id);
    setProjects(await listProjects());
  };

  const handleLoad = (project: Project) => {
    onLoadProject(project);
    onClose();
  };

  const formatDate = (ts: number) => new Date(ts).toLocaleDateString(undefined, {
    month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit'
  });

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-[560px] max-h-[70vh] flex flex-col pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-bold text-slate-800">Projects</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                Save Current
              </button>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Project List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            {loading ? (
              <p className="text-sm text-slate-400 text-center py-8">Loading...</p>
            ) : projects.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-slate-400 mb-1">No saved projects yet</p>
                <p className="text-xs text-slate-300">Click "Save Current" to save your work</p>
              </div>
            ) : (
              projects.map(p => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between p-4 rounded-xl border transition-colors cursor-pointer hover:bg-slate-50 ${
                    p.id === currentProjectId ? 'border-indigo-200 bg-indigo-50/30' : 'border-slate-100'
                  }`}
                  onClick={() => handleLoad(p)}
                >
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-semibold text-slate-800 truncate">{p.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {p.documents.length} doc{p.documents.length !== 1 ? 's' : ''} · {p.columns.length} col{p.columns.length !== 1 ? 's' : ''} · {formatDate(p.updatedAt)}
                    </p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); handleDelete(p.id); }}
                    className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};
