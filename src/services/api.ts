import type { PromptResult } from "../types";
import { generatePromptWithRunAnywhere } from "./runanywhere";

/**
 * Upload PDF file
 * Currently handles the file acceptance, but processes at frontend level
 * In future: Send to backend processing service
 */
export const uploadPdf = async (file: File): Promise<void> => {
  try {
    if (!file.type.includes("pdf")) {
      throw new Error("Invalid file type. PDF only.");
    }
    
    // File is stored in App state for context
    // In a real implementation, you could:
    // 1. Extract text from PDF using pdfjs-dist
    // 2. Send to backend for processing
    // 3. Store extracted context for use in prompt generation
    
    console.log(`[API] PDF uploaded: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`);
  } catch (error) {
    console.error("[API] PDF upload failed:", error);
    throw error;
  }
};

/**
 * Generate optimized prompt using RunAnywhere SDK
 *
 * This function:
 * 1. Takes user's situation description and optional PDF knowledge
 * 2. Sends to local RunAnywhere model with PDF context
 * 3. Returns structured prompt with explanation
 */
export const generatePrompt = async (
  situation: string,
  pdfContext?: string
): Promise<PromptResult> => {
  // Log if PDF context is being used
  if (pdfContext) {
    console.log(
      `[API] Generating prompt with PDF context (${pdfContext.length} chars)`
    );
  }

  return generatePromptWithRunAnywhere(situation, pdfContext);
};
