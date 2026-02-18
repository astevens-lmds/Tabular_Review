export interface PromptTemplate {
  id: string;
  name: string;
  description: string;
  prompt: string;
  columnType: 'text' | 'number' | 'date' | 'boolean' | 'list';
  tags: string[];
  createdAt: number;
  updatedAt: number;
  usageCount: number;
}

const STORAGE_KEY = 'tabular_review_prompt_templates';

// Built-in starter templates
const BUILT_IN_TEMPLATES: PromptTemplate[] = [
  {
    id: 'builtin_extract_date',
    name: 'Extract Date',
    description: 'Find and extract a specific date from the document',
    prompt: 'Find the {{date_description}} in this document. Return the date in YYYY-MM-DD format. If multiple dates are found, return the most relevant one.',
    columnType: 'date',
    tags: ['date', 'extraction'],
    createdAt: 0,
    updatedAt: 0,
    usageCount: 0,
  },
  {
    id: 'builtin_extract_amount',
    name: 'Extract Dollar Amount',
    description: 'Find monetary amounts in the document',
    prompt: 'Find the {{amount_description}} in this document. Return only the numeric value without currency symbols. If a range is given, return the maximum value.',
    columnType: 'number',
    tags: ['money', 'amount', 'extraction'],
    createdAt: 0,
    updatedAt: 0,
    usageCount: 0,
  },
  {
    id: 'builtin_yes_no',
    name: 'Yes/No Question',
    description: 'Answer a yes/no question about the document',
    prompt: 'Does this document {{question}}? Answer with "Yes" or "No" only. Base your answer strictly on what is stated in the document.',
    columnType: 'boolean',
    tags: ['boolean', 'question'],
    createdAt: 0,
    updatedAt: 0,
    usageCount: 0,
  },
  {
    id: 'builtin_extract_parties',
    name: 'Extract Parties/Names',
    description: 'List all parties or named entities',
    prompt: 'List all {{entity_type}} mentioned in this document. Return as a comma-separated list. Include full names and titles where available.',
    columnType: 'list',
    tags: ['names', 'parties', 'entities'],
    createdAt: 0,
    updatedAt: 0,
    usageCount: 0,
  },
  {
    id: 'builtin_summarize_section',
    name: 'Summarize Section',
    description: 'Summarize a specific section or clause',
    prompt: 'Summarize the {{section_description}} section of this document in 1-2 sentences. Focus on the key obligations, rights, or conditions described.',
    columnType: 'text',
    tags: ['summary', 'section'],
    createdAt: 0,
    updatedAt: 0,
    usageCount: 0,
  },
];

function loadTemplates(): PromptTemplate[] {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function saveTemplates(templates: PromptTemplate[]): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
}

export function getAllPromptTemplates(): PromptTemplate[] {
  const custom = loadTemplates();
  return [...BUILT_IN_TEMPLATES, ...custom];
}

export function getCustomPromptTemplates(): PromptTemplate[] {
  return loadTemplates();
}

export function savePromptTemplate(template: Omit<PromptTemplate, 'id' | 'createdAt' | 'updatedAt' | 'usageCount'>): PromptTemplate {
  const templates = loadTemplates();
  const newTemplate: PromptTemplate = {
    ...template,
    id: `pt_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    usageCount: 0,
  };
  templates.push(newTemplate);
  saveTemplates(templates);
  return newTemplate;
}

export function updatePromptTemplate(id: string, updates: Partial<PromptTemplate>): void {
  const templates = loadTemplates();
  const idx = templates.findIndex(t => t.id === id);
  if (idx !== -1) {
    templates[idx] = { ...templates[idx], ...updates, updatedAt: Date.now() };
    saveTemplates(templates);
  }
}

export function deletePromptTemplate(id: string): void {
  const templates = loadTemplates().filter(t => t.id !== id);
  saveTemplates(templates);
}

export function incrementTemplateUsage(id: string): void {
  // Works for both built-in tracking and custom
  const templates = loadTemplates();
  const idx = templates.findIndex(t => t.id === id);
  if (idx !== -1) {
    templates[idx].usageCount++;
    saveTemplates(templates);
  }
}
