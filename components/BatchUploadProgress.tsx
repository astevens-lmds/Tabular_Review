import React from 'react';
import { Loader2, FilePlus } from './Icons';

export interface UploadFileStatus {
  id: string;
  name: string;
  size: number;
  status: 'pending' | 'converting' | 'done' | 'error';
  error?: string;
}

interface BatchUploadProgressProps {
  files: UploadFileStatus[];
  onClose: () => void;
}

export const BatchUploadProgress: React.FC<BatchUploadProgressProps> = ({ files, onClose }) => {
  if (files.length === 0) return null;

  const completed = files.filter(f => f.status === 'done').length;
  const errors = files.filter(f => f.status === 'error').length;
  const total = files.length;
  const allDone = completed + errors === total;
  const progress = ((completed + errors) / total) * 100;

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-600 overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
      {/* Header */}
      <div className="px-4 py-3 bg-slate-50 dark:bg-slate-700 border-b border-slate-200 dark:border-slate-600 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FilePlus className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
          <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">
            Uploading {total} file{total !== 1 ? 's' : ''}
          </span>
        </div>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {completed}/{total} done{errors > 0 ? `, ${errors} failed` : ''}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-slate-100 dark:bg-slate-600">
        <div
          className={`h-full transition-all duration-300 ease-out ${errors > 0 ? 'bg-amber-500' : 'bg-indigo-500'}`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* File list */}
      <div className="max-h-48 overflow-y-auto">
        {files.map(file => (
          <div key={file.id} className="px-4 py-2 flex items-center gap-3 border-b border-slate-100 dark:border-slate-700 last:border-b-0">
            {/* Status indicator */}
            <div className="flex-shrink-0">
              {file.status === 'pending' && (
                <div className="w-4 h-4 rounded-full border-2 border-slate-300 dark:border-slate-500" />
              )}
              {file.status === 'converting' && (
                <Loader2 className="w-4 h-4 text-indigo-600 dark:text-indigo-400 animate-spin" />
              )}
              {file.status === 'done' && (
                <div className="w-4 h-4 rounded-full bg-emerald-500 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
              {file.status === 'error' && (
                <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                  <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </div>
              )}
            </div>

            {/* File info */}
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-slate-700 dark:text-slate-300 truncate">{file.name}</p>
              {file.error && (
                <p className="text-[10px] text-red-500 truncate">{file.error}</p>
              )}
            </div>

            {/* File size */}
            <span className="text-[10px] text-slate-400 flex-shrink-0">
              {(file.size / 1024).toFixed(0)} KB
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      {allDone && (
        <div className="px-4 py-2 bg-slate-50 dark:bg-slate-700 border-t border-slate-200 dark:border-slate-600 flex justify-end">
          <button
            onClick={onClose}
            className="text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 dark:hover:text-indigo-300 px-3 py-1 rounded-md hover:bg-indigo-50 dark:hover:bg-slate-600 transition-colors"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
};
