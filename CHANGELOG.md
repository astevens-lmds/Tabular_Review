# Changelog

All notable changes to **Tabular Review** are documented here.

## Wave 10 — Dark Mode, Confidence Colors & Keyboard Shortcuts

### Dark Mode (PR #10, #14)
- CSS variables-based dark mode (`--bg-primary`, `--bg-secondary`, `--text-primary`, etc.)
- Toggle button in header with Sun/Moon icons
- Persists preference in `localStorage` (`tabular-review-theme`)
- Respects `prefers-color-scheme` system setting on first visit
- Smooth 150ms transitions on background, border, and color changes
- Comprehensive dark overrides for Tailwind utility classes (`.dark .bg-white`, etc.)
- Custom scrollbar styling for dark mode

### Confidence Color Coding (PR #13)
- Verification cells colored by confidence level:
  - **High (>80%):** green left border + emerald background tint + green dot
  - **Medium (50–80%):** yellow left border + amber background tint + amber dot
  - **Low (<50%):** red left border + red background tint + red dot
- Colors work correctly in both light and dark modes
- Verified cells show a checkmark icon instead of the confidence dot

### Keyboard Shortcuts (PR #11, #15)
- `?` — Show keyboard shortcuts help modal
- `Ctrl+E` — Export as CSV
- `Ctrl+N` — New column
- `Ctrl+S` — Save project
- `Ctrl+/` — Toggle chat sidebar
- `Ctrl+D` — Toggle dark mode
- `Ctrl+P` — Open projects manager
- `Ctrl+W` — Toggle text wrap
- `Ctrl+Enter` — Run analysis
- `Escape` — Close sidebar/modal
- Shortcuts suppressed when typing in inputs/textareas (except Escape)

### Column Reordering (PR #12)
- Drag-and-drop column reordering in the data grid

## Wave 9 — Templates & Export

### Column Templates (PR #9)
- Pre-built column templates for legal review tasks
- Template menu accessible from header

### Batch Export (PR #8)
- Export results as CSV or Excel (XLSX)
- Export menu dropdown in header

## Wave 8 — Project Management

### Multi-Document Projects (PR #7)
- IndexedDB-based project persistence
- Save/load/manage multiple projects
- Project manager modal

## Wave 7 — API & Infrastructure

### API Documentation (PR #6)
- Added API documentation section to README

### Rate Limiting (PR #5)
- Rate limiting on `/convert` endpoint

### Self-Hosted CSS (PR #4)
- Replaced CDN Tailwind and Google Fonts with self-hosted assets

### Code Cleanup (PR #3)
- Removed unused `DocumentUpload.tsx` component

## Wave 2 — Core Improvements (PR #2)
- Input validation and error handling
- Progress indicators for extraction
- TypeScript type refinements

## Wave 1 — Initial Release (PR #1)
- Docker support with backend and frontend configurations
- Document upload and markdown conversion
- Gemini-powered column extraction
- Data grid with verification sidebar
- Chat interface for AI-assisted analysis
