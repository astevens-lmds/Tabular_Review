import { describe, it, expect } from 'vitest';
import { ExtractionCell } from '../types';

// Verification scoring logic (mirrors what VerificationSidebar uses)
function getConfidenceColor(confidence: ExtractionCell['confidence']): string {
  switch (confidence) {
    case 'High': return 'green';
    case 'Medium': return 'yellow';
    case 'Low': return 'red';
    default: return 'gray';
  }
}

function isVerified(cell: ExtractionCell): boolean {
  return cell.status === 'verified';
}

function needsReview(cell: ExtractionCell): boolean {
  return cell.status === 'needs_review' || !cell.status;
}

describe('Verification Scoring', () => {
  const makeCell = (overrides: Partial<ExtractionCell> = {}): ExtractionCell => ({
    value: 'test',
    confidence: 'High',
    quote: 'test quote',
    page: 1,
    reasoning: 'test reasoning',
    status: 'needs_review',
    ...overrides,
  });

  it('should return green for High confidence', () => {
    expect(getConfidenceColor('High')).toBe('green');
  });

  it('should return yellow for Medium confidence', () => {
    expect(getConfidenceColor('Medium')).toBe('yellow');
  });

  it('should return red for Low confidence', () => {
    expect(getConfidenceColor('Low')).toBe('red');
  });

  it('should identify verified cells', () => {
    const cell = makeCell({ status: 'verified' });
    expect(isVerified(cell)).toBe(true);
    expect(needsReview(cell)).toBe(false);
  });

  it('should identify cells needing review', () => {
    const cell = makeCell({ status: 'needs_review' });
    expect(isVerified(cell)).toBe(false);
    expect(needsReview(cell)).toBe(true);
  });

  it('should treat undefined status as needs_review', () => {
    const cell = makeCell({ status: undefined });
    expect(needsReview(cell)).toBe(true);
  });
});
