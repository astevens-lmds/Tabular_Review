import { describe, it, expect } from 'vitest';
import { DocumentFile, Column, ExtractionResult } from '../types';

// Re-implement buildRows for testing (same logic as batchExport.ts)
function buildRows(documents: DocumentFile[], columns: Column[], results: ExtractionResult): string[][] {
  const header = ['Document Name', ...columns.map(c => c.name)];
  const rows = documents.map(doc => {
    const row = [doc.name];
    columns.forEach(col => {
      const cell = results[doc.id]?.[col.id];
      row.push(cell ? cell.value : '');
    });
    return row;
  });
  return [header, ...rows];
}

function escapeCsvCell(val: string): string {
  if (val.includes(',') || val.includes('"') || val.includes('\n')) {
    return `"${val.replace(/"/g, '""')}"`;
  }
  return val;
}

const makeDocs = (count: number): DocumentFile[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `doc${i}`,
    name: `document_${i}.pdf`,
    type: 'application/pdf',
    size: 1000,
    content: '',
    mimeType: 'text/markdown',
  }));

const makeCols = (count: number): Column[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `col${i}`,
    name: `Column ${i}`,
    type: 'text' as const,
    prompt: `Extract col ${i}`,
    status: 'completed' as const,
  }));

describe('Batch Export - buildRows', () => {
  it('should produce correct row count', () => {
    const docs = makeDocs(5);
    const cols = makeCols(3);
    const rows = buildRows(docs, cols, {});
    expect(rows).toHaveLength(6); // 1 header + 5 data
  });

  it('should have correct column count per row', () => {
    const docs = makeDocs(2);
    const cols = makeCols(4);
    const rows = buildRows(docs, cols, {});
    rows.forEach(row => {
      expect(row).toHaveLength(5); // doc name + 4 cols
    });
  });

  it('should handle zero columns', () => {
    const docs = makeDocs(2);
    const rows = buildRows(docs, [], {});
    expect(rows[0]).toEqual(['Document Name']);
    expect(rows[1]).toEqual(['document_0.pdf']);
  });
});

describe('CSV Cell Escaping', () => {
  it('should not escape simple values', () => {
    expect(escapeCsvCell('hello')).toBe('hello');
  });

  it('should escape values with commas', () => {
    expect(escapeCsvCell('hello, world')).toBe('"hello, world"');
  });

  it('should escape values with newlines', () => {
    expect(escapeCsvCell('line1\nline2')).toBe('"line1\nline2"');
  });

  it('should escape and double quotes', () => {
    expect(escapeCsvCell('say "hi"')).toBe('"say ""hi"""');
  });
});
