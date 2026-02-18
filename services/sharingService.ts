import { Project } from './projectStore';

export interface SharedProjectBundle {
  version: 1;
  exportedAt: number;
  project: {
    name: string;
    columns: Project['columns'];
    results: Project['results'];
    documents: {
      id: string;
      name: string;
      type: string;
      size: number;
      mimeType: string;
      // content omitted for URL shares (too large), included for file export
      content?: string;
    }[];
  };
}

/**
 * Export a project to a JSON file for sharing.
 */
export function exportProjectToFile(project: Project): void {
  const bundle: SharedProjectBundle = {
    version: 1,
    exportedAt: Date.now(),
    project: {
      name: project.name,
      columns: project.columns,
      results: project.results,
      documents: project.documents.map(d => ({
        id: d.id,
        name: d.name,
        type: d.type,
        size: d.size,
        mimeType: d.mimeType,
        content: d.content,
      })),
    },
  };

  const json = JSON.stringify(bundle, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_shared.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Import a project from a shared JSON file.
 */
export function importProjectFromFile(): Promise<Project> {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) {
        reject(new Error('No file selected'));
        return;
      }

      try {
        const text = await file.text();
        const bundle: SharedProjectBundle = JSON.parse(text);

        if (bundle.version !== 1) {
          throw new Error(`Unsupported share format version: ${bundle.version}`);
        }

        const project: Project = {
          id: `proj_import_${Date.now()}`,
          name: `${bundle.project.name} (Imported)`,
          columns: bundle.project.columns,
          results: bundle.project.results,
          documents: bundle.project.documents.map(d => ({
            id: d.id,
            name: d.name,
            type: d.type,
            size: d.size,
            mimeType: d.mimeType,
            content: d.content || '',
          })),
          createdAt: bundle.exportedAt,
          updatedAt: Date.now(),
        };

        resolve(project);
      } catch (err) {
        reject(new Error(`Failed to parse shared project: ${err}`));
      }
    };

    input.click();
  });
}

/**
 * Generate a shareable URL encoding project metadata (columns + results, no documents).
 * Documents are excluded since they're too large for URL encoding.
 */
export function generateShareURL(project: Project): string {
  const payload = {
    n: project.name,
    c: project.columns.map(c => ({
      id: c.id,
      name: c.name,
      type: c.type,
      prompt: c.prompt,
    })),
  };

  const json = JSON.stringify(payload);
  const encoded = btoa(unescape(encodeURIComponent(json)));
  const url = new URL(window.location.href);
  url.searchParams.set('shared', encoded);
  return url.toString();
}

/**
 * Parse a shared project from URL parameters.
 * Returns column definitions that can be loaded into a new project.
 */
export function parseShareURL(): { name: string; columns: Project['columns'] } | null {
  const url = new URL(window.location.href);
  const encoded = url.searchParams.get('shared');
  if (!encoded) return null;

  try {
    const json = decodeURIComponent(escape(atob(encoded)));
    const payload = JSON.parse(json);

    return {
      name: payload.n || 'Shared Project',
      columns: (payload.c || []).map((c: any, i: number) => ({
        id: c.id || `col_shared_${i}`,
        name: c.name,
        type: c.type || 'text',
        prompt: c.prompt || '',
        status: 'idle' as const,
        width: 250,
      })),
    };
  } catch {
    return null;
  }
}
