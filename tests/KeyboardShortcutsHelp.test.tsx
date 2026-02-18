import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { KeyboardShortcutsHelp } from '../components/KeyboardShortcutsHelp';
import React from 'react';

describe('KeyboardShortcutsHelp', () => {
  it('renders nothing when isOpen is false', () => {
    const { container } = render(<KeyboardShortcutsHelp isOpen={false} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('renders modal when isOpen is true', () => {
    render(<KeyboardShortcutsHelp isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Keyboard Shortcuts')).toBeInTheDocument();
  });

  it('displays shortcut keys', () => {
    render(<KeyboardShortcutsHelp isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Ctrl+N')).toBeInTheDocument();
    expect(screen.getByText('Ctrl+Enter')).toBeInTheDocument();
  });

  it('displays shortcut descriptions', () => {
    render(<KeyboardShortcutsHelp isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('New column')).toBeInTheDocument();
    expect(screen.getByText('Toggle dark mode')).toBeInTheDocument();
  });

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn();
    render(<KeyboardShortcutsHelp isOpen={true} onClose={onClose} />);
    const backdrop = document.querySelector('.fixed.inset-0.z-50.bg-black\\/30') as HTMLElement;
    fireEvent.click(backdrop);
    expect(onClose).toHaveBeenCalled();
  });
});
