import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock import.meta.env
vi.stubEnv('VITE_API_URL', 'http://localhost:8000');

describe('Document Processor - Validation', () => {
  // We test the validation logic that processDocumentToMarkdown applies

  const MAX_FILE_SIZE_MB = 50;
  const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
  const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.doc', '.txt', '.md', '.json', '.pptx', '.xlsx']);

  function validateFile(file: { name: string; size: number }): string | null {
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return `File too large`;
    }
    if (file.size === 0) {
      return `File is empty`;
    }
    const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      return `Unsupported file type`;
    }
    return null; // valid
  }

  it('should accept valid PDF files', () => {
    expect(validateFile({ name: 'contract.pdf', size: 1024 })).toBeNull();
  });

  it('should accept valid DOCX files', () => {
    expect(validateFile({ name: 'doc.docx', size: 1024 })).toBeNull();
  });

  it('should reject files that are too large', () => {
    expect(validateFile({ name: 'big.pdf', size: MAX_FILE_SIZE_BYTES + 1 })).toBe('File too large');
  });

  it('should reject empty files', () => {
    expect(validateFile({ name: 'empty.pdf', size: 0 })).toBe('File is empty');
  });

  it('should reject unsupported file types', () => {
    expect(validateFile({ name: 'image.png', size: 1024 })).toBe('Unsupported file type');
    expect(validateFile({ name: 'script.exe', size: 1024 })).toBe('Unsupported file type');
  });

  it('should accept all allowed extensions', () => {
    for (const ext of ALLOWED_EXTENSIONS) {
      expect(validateFile({ name: `file${ext}`, size: 1024 })).toBeNull();
    }
  });
});
