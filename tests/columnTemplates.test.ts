import { describe, it, expect } from 'vitest';
import { COLUMN_TEMPLATES, ColumnTemplate } from '../utils/columnTemplates';

describe('Column Templates', () => {
  it('should have at least 3 templates', () => {
    expect(COLUMN_TEMPLATES.length).toBeGreaterThanOrEqual(3);
  });

  it('should include contract review template', () => {
    const template = COLUMN_TEMPLATES.find(t => t.id === 'contract-review');
    expect(template).toBeDefined();
    expect(template!.columns.length).toBeGreaterThan(0);
  });

  it('should include deposition summary template', () => {
    const template = COLUMN_TEMPLATES.find(t => t.id === 'deposition-summary');
    expect(template).toBeDefined();
  });

  it('should include document chronology template', () => {
    const template = COLUMN_TEMPLATES.find(t => t.id === 'document-chronology');
    expect(template).toBeDefined();
  });

  it('all templates should have unique IDs', () => {
    const ids = COLUMN_TEMPLATES.map(t => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('all template columns should have required fields', () => {
    for (const template of COLUMN_TEMPLATES) {
      for (const col of template.columns) {
        expect(col.name).toBeTruthy();
        expect(col.type).toBeTruthy();
        expect(col.prompt).toBeTruthy();
        expect(['text', 'number', 'date', 'boolean', 'list']).toContain(col.type);
      }
    }
  });

  it('contract review should have parties and dates columns', () => {
    const template = COLUMN_TEMPLATES.find(t => t.id === 'contract-review')!;
    const names = template.columns.map(c => c.name.toLowerCase());
    expect(names.some(n => n.includes('part'))).toBe(true);
    expect(names.some(n => n.includes('date'))).toBe(true);
  });

  it('deposition summary should have deponent and key testimony fields', () => {
    const template = COLUMN_TEMPLATES.find(t => t.id === 'deposition-summary')!;
    const names = template.columns.map(c => c.name.toLowerCase());
    expect(names.some(n => n.includes('deponent') || n.includes('witness'))).toBe(true);
    expect(names.some(n => n.includes('admission') || n.includes('testimony'))).toBe(true);
  });
});
