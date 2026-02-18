import { DocumentFile, ExtractionCell, Column } from "../types";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

// Helper for delay
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Generic retry wrapper
async function withRetry<T>(operation: () => Promise<T>, retries = 5, initialDelay = 1000): Promise<T> {
  let currentTry = 0;
  while (true) {
    try {
      return await operation();
    } catch (error: unknown) {
      currentTry++;
      
      // Check for Rate Limit / Quota errors
      const err = error as Record<string, unknown>;
      const errMessage = err?.message as string | undefined;
      const isRateLimit = 
        err?.status === 429 || 
        err?.code === 429 ||
        errMessage?.includes('429') || 
        errMessage?.includes('RESOURCE_EXHAUSTED') ||
        errMessage?.includes('quota');

      if (isRateLimit && currentTry <= retries) {
        const delay = initialDelay * Math.pow(2, currentTry - 1) + (Math.random() * 1000);
        console.warn(`Rate limit hit. Retrying attempt ${currentTry} in ${delay.toFixed(0)}ms...`);
        await wait(delay);
        continue;
      }
      
      throw error;
    }
  }
}

// Schema for Extraction (sent to backend which forwards to Gemini)
const extractionSchema = {
  type: "OBJECT",
  properties: {
    value: {
      type: "STRING",
      description: "The extracted answer. Keep it concise.",
    },
    confidence: {
      type: "STRING",
      enum: ["High", "Medium", "Low"],
      description: "Confidence level of the extraction.",
    },
    quote: {
      type: "STRING",
      description: "Verbatim text from the document supporting the answer. Must be exact substring.",
    },
    page: {
      type: "INTEGER",
      description: "The page number where the information was found (approximate if not explicit).",
    },
    reasoning: {
      type: "STRING",
      description: "A short explanation of why this value was selected.",
    },
  },
  required: ["value", "confidence", "quote", "reasoning"],
};

export const extractColumnData = async (
  doc: DocumentFile,
  column: Column,
  modelId: string
): Promise<ExtractionCell> => {
  return withRetry(async () => {
    let docText = "";
    try {
      docText = decodeURIComponent(escape(atob(doc.content)));
    } catch {
      docText = atob(doc.content);
    }

    let formatInstruction = "";
    switch (column.type) {
      case 'date':
        formatInstruction = "Format the date as YYYY-MM-DD.";
        break;
      case 'boolean':
        formatInstruction = "Return 'true' or 'false' as the value string.";
        break;
      case 'number':
        formatInstruction = "Return a clean number string, removing currency symbols if needed.";
        break;
      case 'list':
        formatInstruction = "Return the items as a comma-separated string.";
        break;
      default:
        formatInstruction = "Keep the text concise.";
    }

    const prompt = `Task: Extract specific information from the provided document.
      
      Column Name: "${column.name}"
      Extraction Instruction: ${column.prompt}
      
      Format Requirements:
      - ${formatInstruction}
      - Provide a confidence score (High/Medium/Low).
      - Include the exact quote from the text where the answer is found.
      - Provide a brief reasoning.
      `;

    const response = await fetch(`${API_URL}/api/gemini`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelId,
        contents: {
          role: "user",
          parts: [
            { text: `DOCUMENT CONTENT:\n${docText}` },
            { text: prompt },
          ],
        },
        config: {
          responseMimeType: "application/json",
          responseSchema: extractionSchema,
          systemInstruction: "You are a precise data extraction agent. You must extract data exactly as requested.",
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      const error: any = new Error(`Gemini API error: ${response.status}`);
      error.status = response.status;
      error.message = errorText;
      throw error;
    }

    const data = await response.json();
    
    // Extract text from Google's response format
    const responseText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!responseText) {
      throw new Error("Empty response from model");
    }

    const json = JSON.parse(responseText);

    return {
      value: String(json.value || ""),
      confidence: (json.confidence as any) || "Low",
      quote: json.quote || "",
      page: json.page || 1,
      reasoning: json.reasoning || "",
      status: "needs_review",
    };
  });
};

export const generatePromptHelper = async (
  name: string,
  type: string,
  currentPrompt: string | undefined,
  modelId: string
): Promise<string> => {
  const prompt = `I need to configure a Large Language Model to extract a specific data field from business documents.
    
    Field Name: "${name}"
    Field Type: "${type}"
    ${currentPrompt ? `Draft Prompt: "${currentPrompt}"` : ""}
    
    Please write a clear, effective prompt that I can send to the LLM to get the best extraction results for this field. 
    The prompt should describe what to look for and how to handle edge cases if applicable.
    Return ONLY the prompt text, no conversational filler.`;

  try {
    const response = await fetch(`${API_URL}/api/gemini`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelId,
        contents: {
          role: "user",
          parts: [{ text: prompt }],
        },
      }),
    });

    if (!response.ok) throw new Error("Prompt generation failed");

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
    return text?.trim() || currentPrompt || `Extract the ${name} from the document.`;
  } catch (error) {
    console.error("Prompt generation error:", error);
    return currentPrompt || `Extract the ${name} from the document.`;
  }
};

export const analyzeDataWithChat = async (
  message: string,
  context: { documents: DocumentFile[]; columns: Column[]; results: Record<string, Record<string, ExtractionCell>> },
  history: Array<{ role: string; parts: Array<{ text: string }> }>,
  modelId: string
): Promise<string> => {
  let dataContext = "CURRENT EXTRACTION DATA:\n";
  dataContext += `Documents: ${context.documents.map((d) => d.name).join(", ")}\n`;
  dataContext += `Columns: ${context.columns.map((c) => c.name).join(", ")}\n\n`;
  dataContext += "DATA TABLE (CSV Format):\n";

  const headers = ["Document Name", ...context.columns.map((c) => c.name)].join(",");
  dataContext += headers + "\n";

  context.documents.forEach((doc) => {
    const row = [doc.name];
    context.columns.forEach((col) => {
      const cell = context.results[doc.id]?.[col.id];
      const val = cell ? cell.value.replace(/,/g, " ") : "N/A";
      row.push(val);
    });
    dataContext += row.join(",") + "\n";
  });

  const systemInstruction = `You are an intelligent data analyst assistant. 
    You have access to a dataset extracted from documents (provided in context).
    
    ${dataContext}
    
    Instructions:
    1. Answer the user's question based strictly on the provided data table.
    2. If comparing documents, mention them by name.
    3. If the data is missing or N/A, state that clearly.
    4. Keep answers professional and concise.`;

  try {
    const response = await fetch(`${API_URL}/api/gemini/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        model: modelId,
        message: message,
        systemInstruction: systemInstruction,
        history: history,
      }),
    });

    if (!response.ok) throw new Error("Chat request failed");

    const data = await response.json();
    return data.text || "No response generated.";
  } catch (error) {
    console.error("Chat analysis error:", error);
    return "I apologize, but I encountered an error while analyzing the data. Please try again.";
  }
};
