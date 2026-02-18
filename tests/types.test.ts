import { describe, it, expect } from 'vitest';
import { DocumentFile, Column, ExtractionCell, ExtractionResult } from '../types';

describe('Type Guards and Data Integrity', () => {
  it('should create valid DocumentFile objects', () => {
    const doc: DocumentFile = {
      id: 'test-1',
      name: 'test.pdf',
      type: 'application/pdf',
      size: 1024,
      content: btoa('test content'),
      mimeType: 'text/markdown',
    };
    expect(doc.id).toBe('test-1');
    expect(doc.name).toContain('.pdf');
  });

  it('should create valid Column objects', () => {
    const col: Column = {
      id: 'col-1',
      name: 'Party Name',
      type: 'text',
      prompt: 'Extract the party name',
      status: 'idle',
      width: 250,
    };
    expect(col.status).toBe('idle');
    expect(col.width).toBe(250);
  });

  it('should support all column types', () => {
    const types: Column['type'][] = ['text', 'number', 'date', 'boolean', 'list'];
    types.forEach(type => {
      const col: Column = { id: '1', name: 'test', type, prompt: 'p', status: 'idle' };
      expect(col.type).toBe(type);
    });
  });

  it('should support all column statuses', () => {
    const statuses: Column['status'][] = ['idle', 'extracting', 'completed', 'error'];
    statuses.forEach(status => {
      const col: Column = { id: '1', name: 'test', type: 'text', prompt: 'p', status };
      expect(col.status).toBe(status);
    });
  });

  it('should create valid ExtractionCell objects', () => {
    const cell: ExtractionCell = {
      value: 'Acme Corp',
      confidence: 'High',
      quote: 'Acme Corporation, Inc.',
      page: 1,
      reasoning: 'Found in header',
      status: 'verified',
    };
    expect(cell.confidence).toBe('High');
    expect(cell.status).toBe('verified');
  });

  it('should support nested ExtractionResult structure', () => {
    const result: ExtractionResult = {
      'doc-1': {
        'col-1': {
          value: 'test',
          confidence: 'Medium',
          quote: 'quote',
          page: 2,
          reasoning: 'reason',
        },
        'col-2': null,
      },
    };
    expect(result['doc-1']['col-1']?.value).toBe('test');
    expect(result['doc-1']['col-2']).toBeNull();
  });
});
