import React, { useState, useEffect } from 'react';
import { X, Trash2 } from './Icons';
import { ExtractionEvent, getExtractionHistory, clearHistory } from '../services/extractionHistory';

interface ExtractionHistoryProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ExtractionHistory: React.FC<ExtractionHistoryProps> = ({ isOpen, onClose }) => {
  const [events, setEvents] = useState<ExtractionEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    if (isOpen) {
      setLoading(true);
      getExtractionHistory(200).then(e => { setEvents(e); setLoading(false); });
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const filtered = filter
    ? events.filter(e =>
        e.documentName.toLowerCase().includes(filter.toLowerCase()) ||
        e.columnName.toLowerCase().includes(filter.toLowerCase()) ||
        e.extractedValue.toLowerCase().includes(filter.toLowerCase())
      )
    : events;

  const handleClear = async () => {
    if (!window.confirm('Clear all extraction history?')) return;
    await clearHistory();
    setEvents([]);
  };

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleString(undefined, {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
    });
  };

  const confidenceColor = (c: string) => {
    if (c === 'High') return 'text-emerald-600 bg-emerald-50';
    if (c === 'Medium') return 'text-amber-600 bg-amber-50';
    return 'text-red-600 bg-red-50';
  };

  return (
    <>
      <div className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-700 w-[700px] max-h-[80vh] flex flex-col pointer-events-auto animate-in fade-in zoom-in-95 duration-200">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100">Extraction History</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleClear}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold rounded-lg transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Clear All
              </button>
              <button onClick={onClose} className="p-1.5 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg">
                <X className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="px-6 py-3 border-b border-slate-100 dark:border-slate-700">
            <input
              type="text"
              placeholder="Filter by document, column, or value..."
              value={filter}
              onChange={e => setFilter(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-1">
            {loading ? (
              <p className="text-sm text-slate-400 text-center py-8">Loading...</p>
            ) : filtered.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-sm text-slate-400">No extraction history yet</p>
                <p className="text-xs text-slate-300 mt-1">History is recorded when you run analysis</p>
              </div>
            ) : (
              filtered.map(e => (
                <div key={e.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-slate-700 dark:text-slate-200 truncate">{e.columnName}</span>
                      <span className="text-[10px] text-slate-400">→</span>
                      <span className="text-xs text-slate-500 truncate">{e.documentName}</span>
                    </div>
                    <p className="text-sm text-slate-800 dark:text-slate-100 mt-0.5 truncate">{e.extractedValue || '(empty)'}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${confidenceColor(e.confidence)}`}>
                        {e.confidence}
                      </span>
                      <span className="text-[10px] text-slate-400">{e.model}</span>
                      <span className="text-[10px] text-slate-400">by {e.user}</span>
                    </div>
                  </div>
                  <span className="text-[10px] text-slate-400 whitespace-nowrap flex-shrink-0">{formatTime(e.timestamp)}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  );
};
