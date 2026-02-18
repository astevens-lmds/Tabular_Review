import { Column } from '../types';

export interface ColumnTemplate {
  id: string;
  name: string;
  description: string;
  columns: Omit<Column, 'id' | 'status'>[];
}

export const COLUMN_TEMPLATES: ColumnTemplate[] = [
  {
    id: 'contract-review',
    name: 'Contract Review',
    description: 'Standard fields for reviewing contracts and agreements',
    columns: [
      { name: 'Parties', type: 'text', prompt: 'Identify all parties to this agreement, including their full legal names and roles (e.g., Buyer, Seller, Licensor).', width: 300 },
      { name: 'Effective Date', type: 'date', prompt: 'What is the effective date of this agreement?', width: 200 },
      { name: 'Termination Date', type: 'date', prompt: 'What is the termination or expiration date of this agreement? If it auto-renews, note that.', width: 200 },
      { name: 'Governing Law', type: 'text', prompt: 'What jurisdiction\'s laws govern this agreement?', width: 200 },
      { name: 'Key Obligations', type: 'text', prompt: 'Summarize the key obligations of each party in 2-3 sentences.', width: 400 },
      { name: 'Termination Clause', type: 'text', prompt: 'Describe the termination provisions. Under what conditions can each party terminate? What notice is required? Are there penalties for early termination?', width: 400 },
      { name: 'Indemnification', type: 'boolean', prompt: 'Does this agreement contain an indemnification clause?', width: 150 },
      { name: 'Limitation of Liability', type: 'text', prompt: 'Extract the limitation of liability clause, including any caps or exclusions.', width: 350 },
      { name: 'Assignment Clause', type: 'text', prompt: 'Can the agreement be assigned? Summarize any restrictions on assignment.', width: 300 },
    ]
  },
  {
    id: 'deposition-summary',
    name: 'Deposition Summary',
    description: 'Key fields for summarizing deposition transcripts',
    columns: [
      { name: 'Witness / Deponent', type: 'text', prompt: 'What is the full name of the person being deposed (the witness)?', width: 200 },
      { name: 'Deposition Date', type: 'date', prompt: 'On what date was the deposition taken?', width: 180 },
      { name: 'Topic / Subject Matter', type: 'text', prompt: 'What is the primary topic or subject matter of this deposition? Summarize in 1-2 sentences.', width: 300 },
      { name: 'Key Testimony', type: 'text', prompt: 'Summarize the most important testimony and key admissions or damaging statements made by the witness.', width: 400 },
      { name: 'Page References', type: 'list', prompt: 'List the most important page and line references (e.g., "p. 45:3-12") for key testimony passages.', width: 250 },
      { name: 'Representing Counsel', type: 'text', prompt: 'Who are the attorneys present and which parties do they represent?', width: 300 },
      { name: 'Exhibits Referenced', type: 'list', prompt: 'List all exhibit numbers referenced during the deposition.', width: 250 },
      { name: 'Objections Noted', type: 'text', prompt: 'Summarize any significant objections made and on what grounds.', width: 350 },
      { name: 'Follow-up Needed', type: 'text', prompt: 'Identify areas where follow-up questioning or investigation may be needed.', width: 350 },
    ]
  },
  {
    id: 'document-chronology',
    name: 'Document Chronology',
    description: 'Build a timeline from a collection of documents',
    columns: [
      { name: 'Document Date', type: 'date', prompt: 'What is the date of this document? Use the most prominent date (execution date, letter date, etc.).', width: 180 },
      { name: 'Document Type', type: 'text', prompt: 'What type of document is this? (e.g., Letter, Agreement, Email, Memo, Filing, Order)', width: 200 },
      { name: 'Author/From', type: 'text', prompt: 'Who authored or sent this document?', width: 200 },
      { name: 'Recipient/To', type: 'text', prompt: 'Who is the recipient or addressee of this document?', width: 200 },
      { name: 'Subject/Re', type: 'text', prompt: 'What is the subject or "Re:" line of this document?', width: 300 },
      { name: 'Key Facts', type: 'text', prompt: 'Summarize the key facts or information conveyed in this document in 2-3 sentences.', width: 400 },
      { name: 'Significance', type: 'text', prompt: 'Why is this document significant to the case or matter? Note any legal implications.', width: 350 },
    ]
  },
  {
    id: 'due-diligence',
    name: 'Due Diligence',
    description: 'Common fields for M&A or investment due diligence review',
    columns: [
      { name: 'Entity Name', type: 'text', prompt: 'What is the full legal name of the entity referenced in this document?', width: 250 },
      { name: 'Document Category', type: 'text', prompt: 'Categorize this document (e.g., Corporate, Financial, IP, Employment, Litigation, Regulatory).', width: 200 },
      { name: 'Material Terms', type: 'text', prompt: 'Extract the material terms or key provisions of this document.', width: 400 },
      { name: 'Red Flags', type: 'text', prompt: 'Identify any potential red flags, risks, or concerns raised by this document.', width: 350 },
      { name: 'Change of Control', type: 'boolean', prompt: 'Does this document contain a change of control provision that could be triggered by a transaction?', width: 180 },
      { name: 'Consent Required', type: 'boolean', prompt: 'Does this document require consent or notification for assignment or change of control?', width: 180 },
    ]
  },
];
