import { describe, it, expect } from 'vitest';
import { Column, ExtractionResult, DocumentFile } from '../types';

// Extract the CSV export logic from App.tsx for testability
function generateCSV(
  documents: DocumentFile[],
  columns: Column[],
  results: ExtractionResult,
  projectName: string
): string {
  const headerRow = ['Document Name', ...columns.map(c => c.name)];
  const rows = documents.map(doc => {
    const rowData = [doc.name];
    columns.forEach(col => {
      const cell = results[doc.id]?.[col.id];
      const val = cell ? cell.value.replace(/"/g, '""') : '';
      rowData.push(`"${val}"`);
    });
    return rowData.join(',');
  });
  return [headerRow.join(','), ...rows].join('\n');
}

describe('CSV Export', () => {
  const columns: Column[] = [
    { id: 'col1', name: 'Party Name', type: 'text', prompt: 'Extract party', status: 'completed' },
    { id: 'col2', name: 'Amount', type: 'number', prompt: 'Extract amount', status: 'completed' },
  ];

  const docs: DocumentFile[] = [
    { id: 'doc1', name: 'contract.pdf', type: 'application/pdf', size: 1000, content: '', mimeType: 'text/markdown' },
    { id: 'doc2', name: 'agreement.docx', type: 'application/docx', size: 2000, content: '', mimeType: 'text/markdown' },
  ];

  it('should generate correct CSV headers', () => {
    const csv = generateCSV(docs, columns, {}, 'Test');
    const lines = csv.split('\n');
    expect(lines[0]).toBe('Document Name,Party Name,Amount');
  });

  it('should include document names in rows', () => {
    const csv = generateCSV(docs, columns, {}, 'Test');
    const lines = csv.split('\n');
    expect(lines[1]).toContain('contract.pdf');
    expect(lines[2]).toContain('agreement.docx');
  });

  it('should populate cell values from results', () => {
    const results: ExtractionResult = {
      doc1: {
        col1: { value: 'Acme Corp', confidence: 'High', quote: 'Acme Corp', page: 1, reasoning: 'Found in header', status: 'needs_review' },
        col2: { value: '50000', confidence: 'Medium', quote: '$50,000', page: 2, reasoning: 'Found in section 3', status: 'needs_review' },
      },
    };
    const csv = generateCSV(docs, columns, results, 'Test');
    const lines = csv.split('\n');
    expect(lines[1]).toBe('contract.pdf,"Acme Corp","50000"');
  });

  it('should escape double quotes in values', () => {
    const results: ExtractionResult = {
      doc1: {
        col1: { value: 'He said "hello"', confidence: 'High', quote: 'test', page: 1, reasoning: 'test', status: 'needs_review' },
        col2: null,
      },
    };
    const csv = generateCSV(docs, columns, results, 'Test');
    const lines = csv.split('\n');
    expect(lines[1]).toContain('"He said ""hello"""');
  });

  it('should handle empty results gracefully', () => {
    const csv = generateCSV(docs, columns, {}, 'Test');
    const lines = csv.split('\n');
    expect(lines[1]).toBe('contract.pdf,"",""');
  });

  it('should handle no documents', () => {
    const csv = generateCSV([], columns, {}, 'Test');
    const lines = csv.split('\n');
    expect(lines).toHaveLength(1); // header only
  });
});
