import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { DataGrid } from '../components/DataGrid';
import { DocumentFile, Column, ExtractionResult } from '../types';
import React from 'react';

const mockDoc: DocumentFile = {
  id: 'doc1', name: 'contract.pdf', type: 'application/pdf',
  size: 1024, content: 'base64data', mimeType: 'application/pdf',
};

const mockCol: Column = {
  id: 'col1', name: 'Party Name', type: 'text',
  prompt: 'Extract party name', status: 'completed',
};

const mockResults: ExtractionResult = {
  doc1: {
    col1: { value: 'Acme Corp', confidence: 'High', quote: 'Acme Corp...', page: 1, reasoning: 'Found in header' },
  },
};

const defaultProps = {
  documents: [mockDoc],
  columns: [mockCol],
  results: mockResults,
  onAddColumn: vi.fn(),
  onEditColumn: vi.fn(),
  onCellClick: vi.fn(),
  onDocClick: vi.fn(),
  onRemoveDoc: vi.fn(),
  selectedCell: null,
};

describe('DataGrid', () => {
  it('renders document name', () => {
    render(<DataGrid {...defaultProps} />);
    expect(screen.getByText('contract.pdf')).toBeInTheDocument();
  });

  it('renders column header', () => {
    render(<DataGrid {...defaultProps} />);
    expect(screen.getByText('Party Name')).toBeInTheDocument();
  });

  it('renders cell value', () => {
    render(<DataGrid {...defaultProps} />);
    expect(screen.getByText('Acme Corp')).toBeInTheDocument();
  });

  it('renders empty state when no documents', () => {
    render(<DataGrid {...defaultProps} documents={[]} />);
    // Should still render the table structure
    expect(screen.getByText('Party Name')).toBeInTheDocument();
  });
});
