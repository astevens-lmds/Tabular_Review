import { describe, it, expect, vi, beforeEach } from 'vitest';
import { DocumentFile, Column, ExtractionResult } from '../types';

// Use vi.hoisted to create mocks that can be referenced in vi.mock factories
const { mockSave, mockText, mockSetFontSize, mockSetTextColor, mockAutoTable } = vi.hoisted(() => ({
  mockSave: vi.fn(),
  mockText: vi.fn(),
  mockSetFontSize: vi.fn(),
  mockSetTextColor: vi.fn(),
  mockAutoTable: vi.fn(),
}));

vi.mock('jspdf', () => {
  function MockJsPDF() {
    return {
      save: mockSave,
      text: mockText,
      setFontSize: mockSetFontSize,
      setTextColor: mockSetTextColor,
    };
  }
  return { default: vi.fn(MockJsPDF) };
});

vi.mock('jspdf-autotable', () => ({ default: mockAutoTable }));

import { batchExport } from '../services/batchExport';
import jsPDF from 'jspdf';

const docs: DocumentFile[] = [
  { id: 'd1', name: 'test.pdf', type: 'application/pdf', size: 1000, content: 'dGVzdA==', mimeType: 'text/markdown' },
];

const cols: Column[] = [
  { id: 'c1', name: 'Party Name', type: 'text', prompt: 'Extract party name', status: 'completed' },
];

const results: ExtractionResult = {
  d1: { c1: { value: 'Acme Corp', confidence: 'High', quote: '"Acme Corp"', page: 1, reasoning: 'Found in header' } },
};

describe('PDF Export', () => {
  beforeEach(() => { vi.clearAllMocks(); });

  it('creates a PDF document with correct title', () => {
    batchExport({ documents: docs, columns: cols, results, projectName: 'My Project', format: 'pdf' });
    expect(mockText).toHaveBeenCalledWith('My Project', 14, 18);
  });

  it('calls autoTable with correct header and body', () => {
    batchExport({ documents: docs, columns: cols, results, projectName: 'Test', format: 'pdf' });
    expect(mockAutoTable).toHaveBeenCalledOnce();
    const tableOpts = mockAutoTable.mock.calls[0][1];
    expect(tableOpts.head).toEqual([['Document Name', 'Party Name']]);
    expect(tableOpts.body).toEqual([['test.pdf', 'Acme Corp']]);
  });

  it('saves with sanitized filename', () => {
    batchExport({ documents: docs, columns: cols, results, projectName: 'My Project!', format: 'pdf' });
    expect(mockSave).toHaveBeenCalledWith('my_project__export.pdf');
  });

  it('uses landscape orientation for many columns', () => {
    const manyCols: Column[] = Array.from({ length: 6 }, (_, i) => ({
      id: `c${i}`, name: `Col ${i}`, type: 'text' as const, prompt: '', status: 'completed' as const,
    }));
    batchExport({ documents: docs, columns: manyCols, results, projectName: 'Wide', format: 'pdf' });
    expect(jsPDF).toHaveBeenCalledWith({ orientation: 'landscape' });
  });
});
