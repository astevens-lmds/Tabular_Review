import React, { useState, useRef } from 'react';
import { DataGrid } from './components/DataGrid';
import { VerificationSidebar } from './components/VerificationSidebar';
import { ChatInterface } from './components/ChatInterface';
import { AddColumnMenu } from './components/AddColumnMenu';
import { extractColumnData } from './services/geminiService';
import { processDocumentToMarkdown } from './services/documentProcessor';
import { DocumentFile, Column, ExtractionResult, SidebarMode, ColumnType } from './types';
import { MessageSquare, Table, Square, FilePlus, LayoutTemplate, ChevronDown, Zap, Cpu, Brain, Trash2, Play, Download, WrapText, Loader2, FolderOpen, Moon, Sun } from './components/Icons';
import { ProjectManager } from './components/ProjectManager';
import { Project, saveProject } from './services/projectStore';
import { ColumnTemplateMenu } from './components/ColumnTemplateMenu';
import { ColumnTemplate } from './utils/columnTemplates';
import { batchExport } from './services/batchExport';
import { SAMPLE_COLUMNS } from './utils/sampleData';
import { useTheme } from './hooks/useTheme';
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts';
import { KeyboardShortcutsHelp } from './components/KeyboardShortcutsHelp';

// Available Models
const MODELS = [
  { id: 'gemini-3-pro-preview', name: 'Gemini 3 Pro', description: 'Deepest Reasoning', icon: Brain },
  { id: 'gemini-2.5-pro-preview', name: 'Gemini 2.5 Pro', description: 'Balanced', icon: Cpu },
  { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', description: 'Fastest', icon: Zap },
];

const MAX_COLUMNS = 50;
const MAX_DOCUMENTS = 200;
const MAX_PROMPT_LENGTH = 5000;

const App: React.FC = () => {
  // Theme
  const { theme, toggleTheme } = useTheme();
  
  // State
  const [documents, setDocuments] = useState<DocumentFile[]>([]);
  const [projectName, setProjectName] = useState('Untitled Project');
  const [isEditingProjectName, setIsEditingProjectName] = useState(false);

  // Start with empty columns for a clean slate
  const [columns, setColumns] = useState<Column[]>([]);
  const [results, setResults] = useState<ExtractionResult>({});
  
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('none');
  const [selectedCell, setSelectedCell] = useState<{ docId: string; colId: string } | null>(null);
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);
  
  // Verification Sidebar Expansion State
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false);
  
  // Model State
  const [selectedModel, setSelectedModel] = useState<string>(MODELS[0].id);
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false);

  // Add/Edit Column Menu State
  const [addColumnAnchor, setAddColumnAnchor] = useState<DOMRect | null>(null);
  const [editingColumnId, setEditingColumnId] = useState<string | null>(null);

  // Extraction Control
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [extractionProgress, setExtractionProgress] = useState<{ completed: number; total: number }>({ completed: 0, total: 0 });
  const abortControllerRef = useRef<AbortController | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Text Wrap State
  const [isTextWrapEnabled, setIsTextWrapEnabled] = useState(false);

  // Export Menu State
  const [isExportMenuOpen, setIsExportMenuOpen] = useState(false);

  // Project Manager State
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);

  // Column Template State
  const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);

  // Keyboard Shortcuts Help State
  const [isShortcutsHelpOpen, setIsShortcutsHelpOpen] = useState(false);

  // Keyboard Shortcuts
  useKeyboardShortcuts([
    {
      key: '?',
      description: 'Show shortcuts help',
      action: () => setIsShortcutsHelpOpen(true),
    },
    {
      key: 'e',
      ctrl: true,
      description: 'Export CSV',
      action: () => { if (documents.length > 0) batchExport({ documents, columns, results, projectName, format: 'csv' }); },
    },
    {
      key: 'n',
      ctrl: true,
      description: 'New column',
      action: () => {
        // Simulate clicking add column by creating a rect at center of screen
        const rect = new DOMRect(window.innerWidth / 2 - 150, 80, 300, 40);
        setAddColumnAnchor(rect);
        setEditingColumnId(null);
      },
    },
    {
      key: 's',
      ctrl: true,
      description: 'Save project',
      action: () => {
        const project = handleSaveCurrentProject();
        saveProject(project).then(() => {
          // Brief visual feedback could be added here
          console.log('Project saved');
        });
      },
    },
    {
      key: 'Escape',
      description: 'Close sidebar/modal',
      action: () => {
        if (isShortcutsHelpOpen) { setIsShortcutsHelpOpen(false); return; }
        if (addColumnAnchor) { handleCloseMenu(); return; }
        if (sidebarMode !== 'none') { setSidebarMode('none'); setSelectedCell(null); setPreviewDocId(null); return; }
      },
    },
    {
      key: '/',
      ctrl: true,
      description: 'Toggle chat',
      action: () => toggleChat(),
    },
    {
      key: 'd',
      ctrl: true,
      description: 'Toggle dark mode',
      action: () => toggleTheme(),
    },
    {
      key: 'p',
      ctrl: true,
      description: 'Open projects',
      action: () => setIsProjectManagerOpen(true),
    },
    {
      key: 'w',
      ctrl: true,
      description: 'Toggle text wrap',
      action: () => setIsTextWrapEnabled(prev => !prev),
    },
    {
      key: 'Enter',
      ctrl: true,
      description: 'Run analysis',
      action: () => handleRunAnalysis(),
    },
  ]);

  // Handlers
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      const fileList: File[] = Array.from(event.target.files);
      processUploadedFiles(fileList);
      // Reset input
      event.target.value = '';
    }
  };

  const processUploadedFiles = async (fileList: File[]) => {
    if (documents.length + fileList.length > MAX_DOCUMENTS) {
      alert(`Cannot add ${fileList.length} files. Maximum is ${MAX_DOCUMENTS} documents (currently ${documents.length}).`);
      return;
    }
    setIsConverting(true);
    try {
        const processedFiles: DocumentFile[] = [];

        for (const file of fileList) {
          // Use local deterministic processor (markitdown style)
          const markdownContent = await processDocumentToMarkdown(file);
          
          // Encode to Base64 to match our storage format (mimicking the sample data structure)
          // This keeps the rest of the app (which expects base64 strings for "content") happy
          const contentBase64 = btoa(unescape(encodeURIComponent(markdownContent)));

          processedFiles.push({
            id: Math.random().toString(36).substring(2, 9),
            name: file.name,
            type: file.type,
            size: file.size,
            content: contentBase64,
            mimeType: 'text/markdown' // Force to markdown so the viewer treats it as text
          });
        }

        setDocuments(prev => [...prev, ...processedFiles]);
    } catch (error) {
        console.error("Failed to process files:", error);
        const message = error instanceof Error ? error.message : "Unknown error";
        alert(`Error processing files: ${message}\n\nPlease check that the backend server is running and the files are valid.`);
    } finally {
        setIsConverting(false);
    }
  };

  const handleLoadSample = () => {
    const sampleCols = SAMPLE_COLUMNS;

    // setDocuments([]); // Keep existing documents
    setColumns(sampleCols);
    setResults({}); // Reset results as columns have changed
    setSidebarMode('none');
    setProjectName('PE Side Letters Review');
    setPreviewDocId(null);
    setSelectedCell(null);
  };

  const handleClearAll = () => {
    // Only confirm if actual analysis work (results) exists.
    // If just documents are loaded, clear immediately for better UX.
    const hasWork = Object.keys(results).length > 0;
    
    if (hasWork && !window.confirm("Are you sure you want to clear the project? Analysis results will be lost.")) {
      return;
    }

    // Abort processing
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setIsProcessing(false);

    // Reset State completely
    setDocuments([]);
    setColumns([]);
    setResults({});
    setSidebarMode('none');
    setSelectedCell(null);
    setPreviewDocId(null);
    setProjectName('Untitled Project');
    setAddColumnAnchor(null);
    setEditingColumnId(null);

    // Reset file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveDoc = (docId: string) => {
    setDocuments(prev => prev.filter(d => d.id !== docId));
    setResults(prev => {
      const next = { ...prev };
      delete next[docId];
      return next;
    });
    if (selectedCell?.docId === docId) {
      setSidebarMode('none');
      setSelectedCell(null);
    }
    if (previewDocId === docId) {
      setPreviewDocId(null);
      setSidebarMode('none');
    }
  };

  const handleSaveColumn = (colDef: { name: string; type: ColumnType; prompt: string }) => {
    // Validate limits
    if (!editingColumnId && columns.length >= MAX_COLUMNS) {
      alert(`Maximum of ${MAX_COLUMNS} columns allowed.`);
      return;
    }
    if (colDef.prompt.length > MAX_PROMPT_LENGTH) {
      alert(`Prompt is too long (${colDef.prompt.length} chars). Maximum is ${MAX_PROMPT_LENGTH} characters.`);
      return;
    }
    if (editingColumnId) {
      // Update existing column
      setColumns(prev => prev.map(c => c.id === editingColumnId ? { ...c, ...colDef } : c));
      setEditingColumnId(null);
    } else {
      // Create new column
      const newCol: Column = {
        id: `col_${Date.now()}`,
        name: colDef.name,
        type: colDef.type,
        prompt: colDef.prompt,
        status: 'idle',
        width: 250 // Default width
      };
      setColumns(prev => [...prev, newCol]);
    }
    setAddColumnAnchor(null);
  };
  
  const handleDeleteColumn = () => {
    if (editingColumnId) {
        setColumns(prev => prev.filter(c => c.id !== editingColumnId));
        // Clean up results for this column
        setResults(prev => {
            const next = { ...prev };
            Object.keys(next).forEach(docId => {
                if (next[docId] && next[docId][editingColumnId]) {
                    // We create a copy of the doc results to avoid mutation
                    const docResults = { ...next[docId] };
                    delete docResults[editingColumnId];
                    next[docId] = docResults;
                }
            });
            return next;
        });
        
        if (selectedCell?.colId === editingColumnId) {
            setSelectedCell(null);
            setSidebarMode('none');
        }
        
        setEditingColumnId(null);
        setAddColumnAnchor(null);
    }
  };

  const handleEditColumn = (colId: string, rect: DOMRect) => {
    setEditingColumnId(colId);
    setAddColumnAnchor(rect);
  };
  
  const handleColumnResize = (colId: string, newWidth: number) => {
    setColumns(prev => prev.map(c => c.id === colId ? { ...c, width: newWidth } : c));
  };

  const handleColumnReorder = (fromIndex: number, toIndex: number) => {
    setColumns(prev => {
      const updated = [...prev];
      const [moved] = updated.splice(fromIndex, 1);
      updated.splice(toIndex, 0, moved);
      return updated;
    });
  };

  const handleCloseMenu = () => {
    setAddColumnAnchor(null);
    setEditingColumnId(null);
  };

  const handleStopExtraction = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsProcessing(false);
    }
  };

  const handleRunAnalysis = () => {
    if (documents.length === 0 || columns.length === 0) return;
    processExtraction(documents, columns);
  };

  const handleExport = (format: 'csv' | 'xlsx') => {
    if (documents.length === 0) return;
    batchExport({ documents, columns, results, projectName, format });
  };

  const processExtraction = async (docsToProcess: DocumentFile[], colsToProcess: Column[]) => {
    // Cancel any previous run
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Start new run
    const controller = new AbortController();
    abortControllerRef.current = controller;
    setIsProcessing(true);

    try {
      // Mark all target columns as extracting initially
      setColumns(prev => prev.map(c => colsToProcess.some(target => target.id === c.id) ? { ...c, status: 'extracting' } : c));

      // 1. Flatten all tasks: Create a list of {doc, col} pairs for every cell that needs processing
      const tasks: { doc: DocumentFile; col: Column }[] = [];
      
      for (const doc of docsToProcess) {
          for (const col of colsToProcess) {
             // Only add task if result doesn't exist or we want to force overwrite
             if (!results[doc.id]?.[col.id]) {
                 tasks.push({ doc, col });
             }
          }
      }

      // Track progress
      setExtractionProgress({ completed: 0, total: tasks.length });

      // 2. Process EVERYTHING concurrently (Simultaneous)
      const promises = tasks.map(async ({ doc, col }) => {
          if (controller.signal.aborted) return;
          try {
              const data = await extractColumnData(doc, col, selectedModel);
              if (controller.signal.aborted) return;

              setResults(prev => ({
                  ...prev,
                  [doc.id]: {
                      ...(prev[doc.id] || {}),
                      [col.id]: data
                  }
              }));
              setExtractionProgress(prev => ({ ...prev, completed: prev.completed + 1 }));
          } catch (e) {
              console.error(`Failed to extract ${col.name} for ${doc.name}`, e);
              setExtractionProgress(prev => ({ ...prev, completed: prev.completed + 1 }));
          }
      });

      await Promise.all(promises);

      // Mark all columns as completed if finished successfully without abort
      if (!controller.signal.aborted) {
          setColumns(prev => prev.map(c => colsToProcess.some(target => target.id === c.id) ? { ...c, status: 'completed' } : c));
      }

    } finally {
      // If we are still the active controller (cleanup)
      if (abortControllerRef.current === controller) {
        setIsProcessing(false);
        abortControllerRef.current = null;
        
        // Reset extracting status if stopped early (aborted)
        setColumns(prev => prev.map(c => c.status === 'extracting' ? { ...c, status: 'idle' } : c));
      }
    }
  };

  const handleCellClick = (docId: string, colId: string) => {
    const cell = results[docId]?.[colId];
    if (cell) {
      setSelectedCell({ docId, colId });
      setPreviewDocId(null);
      setSidebarMode('verify');
      setIsSidebarExpanded(false); // Reset to narrow "Answer Only" view
    }
  };

  const handleDocumentClick = (docId: string) => {
    setSelectedCell(null);
    setPreviewDocId(docId);
    setSidebarMode('verify');
    setIsSidebarExpanded(true); // Document preview should be wide
  };

  const handleVerifyCell = () => {
    if (!selectedCell) return;
    const { docId, colId } = selectedCell;
    
    setResults(prev => ({
      ...prev,
      [docId]: {
        ...prev[docId],
        [colId]: {
          ...prev[docId][colId]!,
          status: 'verified'
        }
      }
    }));
  };

  const toggleChat = () => {
    if (sidebarMode === 'chat') {
      setSidebarMode('none');
    } else {
      setSidebarMode('chat');
      setSelectedCell(null);
      setPreviewDocId(null);
      setIsSidebarExpanded(false); // Chat usually is standard width
    }
  };

  // Project Management
  const handleSaveCurrentProject = (): Project => {
    const id = currentProjectId || `proj_${Date.now()}`;
    const project: Project = {
      id,
      name: projectName,
      documents,
      columns,
      results,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setCurrentProjectId(id);
    return project;
  };

  const handleLoadProject = (project: Project) => {
    setDocuments(project.documents);
    setColumns(project.columns);
    setResults(project.results);
    setProjectName(project.name);
    setCurrentProjectId(project.id);
    setSidebarMode('none');
    setSelectedCell(null);
    setPreviewDocId(null);
  };

  // Column Templates
  const handleApplyTemplate = (template: ColumnTemplate) => {
    const newCols = template.columns.map((col, i) => ({
      ...col,
      id: `col_tmpl_${Date.now()}_${i}`,
      status: 'idle' as const,
    }));
    setColumns(prev => [...prev, ...newCols]);
    setResults({}); // Reset results since columns changed
  };

  // Render Helpers
  const getSidebarData = () => {
    // Priority 1: Selected Cell (Inspecting result)
    if (selectedCell) {
      return {
        cell: results[selectedCell.docId]?.[selectedCell.colId] || null,
        document: documents.find(d => d.id === selectedCell.docId) || null,
        column: columns.find(c => c.id === selectedCell.colId) || null
      };
    }
    // Priority 2: Previewed Document (Reading mode)
    if (previewDocId) {
      return {
        cell: null,
        document: documents.find(d => d.id === previewDocId) || null,
        column: null
      };
    }
    return null;
  };

  const sidebarData = getSidebarData();
  const currentModel = MODELS.find(m => m.id === selectedModel) || MODELS[0];

  // Calculate Sidebar Width
  const getSidebarWidthClass = () => {
      if (sidebarMode === 'none') return 'w-0 translate-x-10 opacity-0 overflow-hidden';
      
      // Chat is fixed width
      if (sidebarMode === 'chat') return 'w-[400px] translate-x-0';
      
      // Verify Mode depends on expansion
      if (isSidebarExpanded) return 'w-[900px] translate-x-0'; // Wide Inspector
      return 'w-[400px] translate-x-0'; // Narrow Analyst
  };

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Hidden File Input */}
      <input 
        type="file" 
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        className="hidden"
        accept=".pdf,.txt,.md,.json,.docx"
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="relative z-50 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 h-16 flex items-center justify-between px-6 shadow-sm">
          <div className="flex items-center gap-4 min-w-0">
            <h1 className="text-lg font-bold text-slate-800 tracking-tight whitespace-nowrap">Tabular Review</h1>
            <div className="h-4 w-px bg-slate-300 mx-2 flex-shrink-0"></div>
            {isEditingProjectName ? (
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                onBlur={() => setIsEditingProjectName(false)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') setIsEditingProjectName(false);
                }}
                className="text-sm font-medium text-slate-800 border-b border-indigo-500 outline-none bg-transparent min-w-[150px]"
                autoFocus
              />
            ) : (
              <p 
                className="text-sm text-slate-500 font-medium cursor-text hover:text-slate-800 hover:bg-slate-50 px-2 py-1 rounded transition-all select-none truncate max-w-[200px] sm:max-w-[300px]"
                onDoubleClick={() => setIsEditingProjectName(true)}
                title="Double click to rename"
              >
                {projectName}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3 flex-shrink-0">
             {/* Projects Button */}
             <button 
                onClick={() => setIsProjectManagerOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold rounded-md transition-all active:scale-95"
                title="Manage Projects"
             >
                <FolderOpen className="w-3.5 h-3.5" />
                Projects
             </button>

             {/* Dark Mode Toggle */}
             <button 
                onClick={toggleTheme}
                className="flex items-center gap-2 px-3 py-1.5 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-600 text-xs font-semibold rounded-md transition-all active:scale-95"
                title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
             >
                {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                {theme === 'dark' ? 'Light' : 'Dark'}
             </button>

             {/* Chat Button */}
             <button 
                onClick={toggleChat}
                className={`flex items-center gap-2 px-3 py-1.5 border border-slate-200 text-xs font-semibold rounded-md transition-all active:scale-95 ${
                  sidebarMode === 'chat' 
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-200' 
                  : 'bg-white hover:bg-slate-50 text-slate-600'
                }`}
                title="AI Analyst"
             >
                <MessageSquare className="w-3.5 h-3.5" />
                Chat
             </button>

             {/* Clear Button */}
             <button 
                onClick={handleClearAll}
                className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-red-50 text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 text-xs font-semibold rounded-md transition-all active:scale-95"
                title="Clear Project"
             >
                <Trash2 className="w-3.5 h-3.5" />
                Clear
             </button>

             {/* Load Sample Button */}
             <button 
                onClick={handleLoadSample}
                className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold rounded-md transition-all active:scale-95"
                title="Load Sample Columns"
             >
                <LayoutTemplate className="w-3.5 h-3.5" />
                Load Sample
             </button>

             {/* Column Templates Button */}
             <button 
                onClick={() => setIsTemplateMenuOpen(true)}
                className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold rounded-md transition-all active:scale-95"
                title="Column Templates"
             >
                <LayoutTemplate className="w-3.5 h-3.5" />
                Templates
             </button>

             {/* Export Button with Dropdown */}
             <div className="relative">
               <button 
                  onClick={() => setIsExportMenuOpen(!isExportMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold rounded-md transition-all active:scale-95"
                  title="Export data"
               >
                  <Download className="w-3.5 h-3.5" />
                  Export
                  <ChevronDown className="w-3 h-3 opacity-60" />
               </button>
               {isExportMenuOpen && (
                 <>
                   <div className="fixed inset-0 z-40" onClick={() => setIsExportMenuOpen(false)} />
                   <div className="absolute right-0 top-full mt-2 w-44 bg-white rounded-xl shadow-xl border border-slate-100 p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                     <button
                       onClick={() => { handleExport('csv'); setIsExportMenuOpen(false); }}
                       className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-xs font-medium text-slate-700"
                     >
                       Export as CSV
                     </button>
                     <button
                       onClick={() => { handleExport('xlsx'); setIsExportMenuOpen(false); }}
                       className="w-full text-left px-3 py-2 rounded-lg hover:bg-slate-50 text-xs font-medium text-slate-700"
                     >
                       Export as Excel
                     </button>
                   </div>
                 </>
               )}
             </div>
             
             {/* Text Wrap Button */}
             <button 
                onClick={() => setIsTextWrapEnabled(!isTextWrapEnabled)}
                className={`flex items-center gap-2 px-3 py-1.5 border border-slate-200 text-xs font-semibold rounded-md transition-all active:scale-95 ${
                  isTextWrapEnabled 
                  ? 'bg-indigo-50 text-indigo-600 border-indigo-200' 
                  : 'bg-white hover:bg-slate-50 text-slate-600'
                }`}
                title="Toggle Text Wrap"
             >
                <WrapText className={`w-3.5 h-3.5`} />
                Wrap
             </button>

             {/* Add Document Button */}
             <button 
                onClick={() => !isConverting && fileInputRef.current?.click()}
                disabled={isConverting}
                className={`flex items-center gap-2 px-3 py-1.5 bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 text-xs font-semibold rounded-md transition-all active:scale-95 ${isConverting ? 'opacity-70 cursor-wait' : ''}`}
                title="Add Documents"
             >
                {isConverting ? (
                    <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                        <span>Converting...</span>
                    </>
                ) : (
                    <>
                        <FilePlus className="w-3.5 h-3.5" />
                        <span>Add Document</span>
                    </>
                )}
             </button>

             <div className="h-6 w-px bg-slate-200 mx-1"></div>

             {/* Model Selector */}
             <div className="relative">
                <button 
                onClick={() => !isProcessing && setIsModelMenuOpen(!isModelMenuOpen)}
                disabled={isProcessing}
                className={`flex items-center gap-2 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-md border border-indigo-100 transition-all ${!isProcessing ? 'hover:bg-indigo-100 active:scale-95' : 'opacity-60 cursor-not-allowed'}`}
                >
                  <div className="flex items-center gap-2">
                    <currentModel.icon className="w-3.5 h-3.5" />
                    <span className="text-xs font-semibold">{currentModel.name}</span>
                  </div>
                  <ChevronDown className="w-3 h-3 opacity-60" />
                </button>
                
                {isModelMenuOpen && (
                  <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsModelMenuOpen(false)}></div>
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-xl border border-slate-100 p-1 z-50 animate-in fade-in zoom-in-95 duration-100">
                    {MODELS.map(model => (
                      <button
                        key={model.id}
                        onClick={() => {
                          setSelectedModel(model.id);
                          setIsModelMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 rounded-lg flex items-center gap-3 transition-colors ${
                          selectedModel === model.id ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50 text-slate-700'
                        }`}
                      >
                        <div className={`p-1.5 rounded-md ${selectedModel === model.id ? 'bg-white shadow-sm' : 'bg-slate-100'}`}>
                          <model.icon className="w-4 h-4" />
                        </div>
                        <div>
                          <div className="text-xs font-bold">{model.name}</div>
                          <div className="text-[10px] opacity-70">{model.description}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  </>
                )}
              </div>

             {/* Run / Stop Button */}
             {isProcessing ? (
                <button 
                  onClick={handleStopExtraction}
                  className="flex items-center gap-2 px-4 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-semibold rounded-md transition-all active:scale-95"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  Stop
                </button>
             ) : (
                <button 
                  onClick={handleRunAnalysis}
                  disabled={documents.length === 0 || columns.length === 0}
                  className="flex items-center gap-2 px-4 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white border border-emerald-600 text-xs font-bold rounded-md transition-all active:scale-95 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  Run Analysis
                </button>
             )}
          </div>
        </header>

        {/* Extraction Progress Bar */}
        {isProcessing && extractionProgress.total > 0 && (
          <div className="bg-white border-b border-slate-200 px-6 py-2">
            <div className="flex items-center gap-3">
              <div className="flex-1 bg-slate-100 rounded-full h-2 overflow-hidden">
                <div 
                  className="bg-indigo-500 h-full rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${(extractionProgress.completed / extractionProgress.total) * 100}%` }}
                />
              </div>
              <span className="text-xs font-semibold text-slate-500 whitespace-nowrap">
                {extractionProgress.completed} / {extractionProgress.total} cells
              </span>
            </div>
          </div>
        )}

        {/* Workspace */}
        <main className="flex-1 flex overflow-hidden relative">
          {/* Conversion Overlay */}
          {isConverting && (
            <div className="absolute inset-0 z-50 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center animate-in fade-in duration-200">
                <div className="bg-white p-8 rounded-2xl shadow-2xl border border-indigo-100 flex flex-col items-center max-w-md text-center">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-indigo-100 rounded-full animate-ping opacity-75"></div>
                        <div className="relative bg-indigo-50 p-4 rounded-full">
                            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                        </div>
                    </div>
                    <h3 className="text-xl font-bold text-slate-800 mb-2">Converting Documents</h3>
                    <p className="text-slate-500">Using local Docling engine to preserve formatting and structure...</p>
                </div>
            </div>
          )}

          <div className="flex-1 flex flex-col min-w-0 bg-white">
             <DataGrid 
                documents={documents} 
                columns={columns} 
                results={results}
                onAddColumn={(rect) => setAddColumnAnchor(rect)}
                onEditColumn={handleEditColumn}
                onColumnResize={handleColumnResize}
                onColumnReorder={handleColumnReorder}
                onCellClick={handleCellClick}
                onDocClick={handleDocumentClick}
                onRemoveDoc={handleRemoveDoc}
                selectedCell={selectedCell}
                isTextWrapEnabled={isTextWrapEnabled}
                onDropFiles={(files) => processUploadedFiles(files)}
             />
          </div>

          {/* Add/Edit Column Menu */}
          {addColumnAnchor && (
            <AddColumnMenu 
              triggerRect={addColumnAnchor}
              onClose={handleCloseMenu}
              onSave={handleSaveColumn}
              onDelete={handleDeleteColumn}
              modelId={selectedModel}
              initialData={editingColumnId ? columns.find(c => c.id === editingColumnId) : undefined}
            />
          )}

          {/* Right Sidebar Container (Animated Width) */}
          <div 
            className={`transition-all duration-300 ease-in-out border-l border-slate-200 bg-white shadow-xl z-30 relative ${getSidebarWidthClass()}`}
          >
            <div className="w-full h-full absolute right-0 top-0 flex flex-col">
                {sidebarMode === 'verify' && sidebarData && (
                    <VerificationSidebar 
                        cell={sidebarData.cell}
                        document={sidebarData.document}
                        column={sidebarData.column}
                        onClose={() => { setSidebarMode('none'); setSelectedCell(null); setPreviewDocId(null); }}
                        onVerify={handleVerifyCell}
                        isExpanded={isSidebarExpanded}
                        onExpand={setIsSidebarExpanded}
                    />
                )}
                {sidebarMode === 'chat' && (
                    <ChatInterface 
                        documents={documents}
                        columns={columns}
                        results={results}
                        onClose={() => setSidebarMode('none')}
                        modelId={selectedModel}
                    />
                )}
            </div>
          </div>
        </main>
      </div>

      {/* Column Template Menu */}
      <ColumnTemplateMenu
        isOpen={isTemplateMenuOpen}
        onClose={() => setIsTemplateMenuOpen(false)}
        onApplyTemplate={handleApplyTemplate}
      />

      {/* Keyboard Shortcuts Help */}
      <KeyboardShortcutsHelp
        isOpen={isShortcutsHelpOpen}
        onClose={() => setIsShortcutsHelpOpen(false)}
      />

      {/* Project Manager Modal */}
      <ProjectManager
        isOpen={isProjectManagerOpen}
        onClose={() => setIsProjectManagerOpen(false)}
        onLoadProject={handleLoadProject}
        onSaveCurrentProject={handleSaveCurrentProject}
        currentProjectId={currentProjectId}
      />
    </div>
  );
};

export default App;