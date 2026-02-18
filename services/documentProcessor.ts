

const MAX_FILE_SIZE_MB = 50;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;
const ALLOWED_EXTENSIONS = new Set(['.pdf', '.docx', '.doc', '.txt', '.md', '.json', '.pptx', '.xlsx']);

export const processDocumentToMarkdown = async (file: File): Promise<string> => {
  // Client-side validation
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`File "${file.name}" is too large (${(file.size / 1024 / 1024).toFixed(1)} MB). Maximum size is ${MAX_FILE_SIZE_MB} MB.`);
  }

  if (file.size === 0) {
    throw new Error(`File "${file.name}" is empty.`);
  }

  const ext = '.' + (file.name.split('.').pop()?.toLowerCase() || '');
  if (!ALLOWED_EXTENSIONS.has(ext)) {
    throw new Error(`File type "${ext}" is not supported. Allowed: ${Array.from(ALLOWED_EXTENSIONS).join(', ')}`);
  }

  try {
    const formData = new FormData();
    formData.append('file', file);

    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    const response = await fetch(`${apiUrl}/convert`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      let detail = response.statusText;
      try {
        const errBody = await response.json();
        detail = errBody.detail || detail;
      } catch {
        // ignore JSON parse errors
      }
      throw new Error(`Conversion failed (${response.status}): ${detail}`);
    }

    const data = await response.json();
    return data.markdown || "";

  } catch (error) {
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw new Error(`Cannot connect to backend server. Is it running at ${import.meta.env.VITE_API_URL || 'http://localhost:8000'}?`);
    }
    if (error instanceof Error) {
      throw error;
    }
    throw new Error(`Failed to convert ${file.name}: Unknown error`);
  }
};

