import React, { useState } from 'react';
import { X, Download } from './Icons';
import { Project } from '../services/projectStore';
import {
  exportProjectToFile,
  importProjectFromFile,
  generateShareURL,
} from '../services/sharingService';

interface ShareMenuProps {
  isOpen: boolean;
  onClose: () => void;
  currentProject: () => Project;
  onImportProject: (project: Project) => void;
}

export const ShareMenu: React.FC<ShareMenuProps> = ({
  isOpen,
  onClose,
  currentProject,
  onImportProject,
}) => {
  const [shareURL, setShareURL] = useState('');
  const [copied, setCopied] = useState(false);
  const [importError, setImportError] = useState('');

  if (!isOpen) return null;

  const handleExportFile = () => {
    exportProjectToFile(currentProject());
  };

  const handleImportFile = async () => {
    setImportError('');
    try {
      const project = await importProjectFromFile();
      onImportProject(project);
      onClose();
    } catch (err: any) {
      setImportError(err.message || 'Import failed');
    }
  };

  const handleGenerateURL = () => {
    const url = generateShareURL(currentProject());
    setShareURL(url);
    setCopied(false);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(shareURL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-[480px] pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Share Project</h2>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
              <X className="w-4 h-4 text-slate-400" />
            </button>
          </div>

          <div className="p-6 space-y-5">
            {/* Export as File */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Export as File</h3>
              <p className="text-xs text-slate-500 mb-3">Download the full project (including documents) as a JSON file that others can import.</p>
              <button
                onClick={handleExportFile}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                Export Project File
              </button>
            </div>

            {/* Import from File */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Import from File</h3>
              <p className="text-xs text-slate-500 mb-3">Load a shared project file from a colleague.</p>
              <button
                onClick={handleImportFile}
                className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-xs font-semibold rounded-lg transition-colors"
              >
                Import Project File
              </button>
              {importError && <p className="text-xs text-red-500 mt-2">{importError}</p>}
            </div>

            {/* Share via URL */}
            <div>
              <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-2">Share via URL</h3>
              <p className="text-xs text-slate-500 mb-3">Generate a URL with column definitions (documents not included due to size).</p>
              {!shareURL ? (
                <button
                  onClick={handleGenerateURL}
                  className="px-4 py-2 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-600 text-xs font-semibold rounded-lg transition-colors"
                >
                  Generate Share Link
                </button>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      readOnly
                      value={shareURL}
                      className="flex-1 px-3 py-2 text-xs border border-slate-200 dark:border-slate-600 rounded-lg bg-slate-50 dark:bg-slate-800 text-slate-600 dark:text-slate-300 truncate"
                    />
                    <button
                      onClick={handleCopy}
                      className={`px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
                        copied
                          ? 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                          : 'bg-indigo-600 text-white hover:bg-indigo-700'
                      }`}
                    >
                      {copied ? 'Copied!' : 'Copy'}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400">Note: Only column definitions are included. Recipients will need to upload their own documents.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
};
