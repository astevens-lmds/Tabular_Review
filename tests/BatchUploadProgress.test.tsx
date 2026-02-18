import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BatchUploadProgress, UploadFileStatus } from '../components/BatchUploadProgress';
import React from 'react';

const makeFiles = (overrides: Partial<UploadFileStatus>[] = []): UploadFileStatus[] => {
  const defaults: UploadFileStatus[] = [
    { id: '1', name: 'contract.pdf', size: 102400, status: 'pending' },
    { id: '2', name: 'letter.docx', size: 51200, status: 'converting' },
    { id: '3', name: 'memo.txt', size: 2048, status: 'done' },
  ];
  return defaults.map((f, i) => ({ ...f, ...(overrides[i] || {}) }));
};

describe('BatchUploadProgress', () => {
  it('renders nothing when files array is empty', () => {
    const { container } = render(<BatchUploadProgress files={[]} onClose={() => {}} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows total file count', () => {
    render(<BatchUploadProgress files={makeFiles()} onClose={() => {}} />);
    expect(screen.getByText(/Uploading 3 files/)).toBeInTheDocument();
  });

  it('displays each file name', () => {
    render(<BatchUploadProgress files={makeFiles()} onClose={() => {}} />);
    expect(screen.getByText('contract.pdf')).toBeInTheDocument();
    expect(screen.getByText('letter.docx')).toBeInTheDocument();
    expect(screen.getByText('memo.txt')).toBeInTheDocument();
  });

  it('shows Dismiss button when all files are done', () => {
    const allDone = makeFiles().map(f => ({ ...f, status: 'done' as const }));
    const onClose = vi.fn();
    render(<BatchUploadProgress files={allDone} onClose={onClose} />);
    const btn = screen.getByText('Dismiss');
    fireEvent.click(btn);
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('does not show Dismiss button while uploads are in progress', () => {
    render(<BatchUploadProgress files={makeFiles()} onClose={() => {}} />);
    expect(screen.queryByText('Dismiss')).toBeNull();
  });

  it('shows error message for failed files', () => {
    const files = makeFiles();
    files[0] = { ...files[0], status: 'error', error: 'Network timeout' };
    render(<BatchUploadProgress files={files} onClose={() => {}} />);
    expect(screen.getByText('Network timeout')).toBeInTheDocument();
  });

  it('shows file sizes in KB', () => {
    render(<BatchUploadProgress files={makeFiles()} onClose={() => {}} />);
    expect(screen.getByText('100 KB')).toBeInTheDocument(); // 102400 / 1024
    expect(screen.getByText('2 KB')).toBeInTheDocument();   // 2048 / 1024
  });
});
