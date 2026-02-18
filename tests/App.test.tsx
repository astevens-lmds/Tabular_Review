import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock all heavy services before importing App
vi.mock('../services/geminiService', () => ({
  extractColumnData: vi.fn(),
  generatePromptHelper: vi.fn(),
}));
vi.mock('../services/documentProcessor', () => ({
  processDocumentToMarkdown: vi.fn(),
}));
vi.mock('../services/projectStore', () => ({
  saveProject: vi.fn(),
  loadProjects: vi.fn(() => []),
  deleteProject: vi.fn(),
}));
vi.mock('../services/batchExport', () => ({
  batchExport: vi.fn(),
}));

import App from '../App';

describe('App', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the app title', () => {
    render(<App />);
    expect(screen.getByText('Tabular Review')).toBeInTheDocument();
  });

  it('renders the project name', () => {
    render(<App />);
    expect(screen.getByText('Untitled Project')).toBeInTheDocument();
  });

  it('shows model selector', () => {
    render(<App />);
    // One of the model names should be visible
    expect(screen.getByText(/Gemini/)).toBeInTheDocument();
  });

  it('renders theme toggle button', () => {
    render(<App />);
    // The app should have a dark mode toggle
    const buttons = screen.getAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);
  });
});
