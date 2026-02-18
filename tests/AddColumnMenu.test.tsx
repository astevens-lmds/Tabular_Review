import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AddColumnMenu } from '../components/AddColumnMenu';
import React from 'react';

vi.mock('../services/geminiService', () => ({
  generatePromptHelper: vi.fn(),
}));

const mockRect = {
  top: 100, bottom: 140, left: 200, right: 400, width: 200, height: 40,
  x: 200, y: 100, toJSON: () => {},
} as DOMRect;

const defaultProps = {
  triggerRect: mockRect,
  onClose: vi.fn(),
  onSave: vi.fn(),
  modelId: 'gemini-2.5-flash',
};

describe('AddColumnMenu', () => {
  it('renders label and prompt fields', () => {
    render(<AddColumnMenu {...defaultProps} />);
    expect(screen.getByPlaceholderText(/Persons mentioned/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Describe what data/i)).toBeInTheDocument();
  });

  it('shows Create Column button', () => {
    render(<AddColumnMenu {...defaultProps} />);
    expect(screen.getByText('Create Column')).toBeInTheDocument();
  });

  it('disables save when name and prompt are empty', () => {
    render(<AddColumnMenu {...defaultProps} />);
    const btn = screen.getByText('Create Column');
    expect(btn).toBeDisabled();
  });

  it('shows Update Column when initialData is provided', () => {
    render(
      <AddColumnMenu
        {...defaultProps}
        initialData={{ name: 'Test', type: 'text', prompt: 'Extract test' }}
        onDelete={vi.fn()}
      />
    );
    expect(screen.getByText('Update Column')).toBeInTheDocument();
  });

  it('shows Delete button when editing', () => {
    const onDelete = vi.fn();
    render(
      <AddColumnMenu
        {...defaultProps}
        initialData={{ name: 'Test', type: 'text', prompt: 'Extract test' }}
        onDelete={onDelete}
      />
    );
    expect(screen.getByText('Delete')).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<AddColumnMenu {...defaultProps} onClose={onClose} />);
    // The backdrop is the first fixed div
    const backdrop = document.querySelector('.fixed.inset-0.z-40') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });
});
