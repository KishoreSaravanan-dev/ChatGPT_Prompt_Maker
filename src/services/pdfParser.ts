/**
 * PDF Text Extraction Service
 * 
 * Extracts text from PDF files using pdfjs-dist
 * Optimized for prompt engineering knowledge bases
 */

import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

// Let Vite emit and serve the worker as a static asset URL.
pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

/**
 * Extracts all text from a PDF file
 * @param file - The PDF file to extract text from
 * @returns Promise<string> containing all extracted text
 */
export const extractPDFText = async (file: File): Promise<string> => {
  try {
    if (!file.type.includes("pdf")) {
      throw new Error("File must be a PDF");
    }

    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";

    // Extract text from each page
    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        // Combine text items from this page
        const pageText = content.items
          .map((item: any) => {
            // Handle different item types
            if (typeof item.str === "string") {
              return item.str;
            }
            return "";
          })
          .join(" ");

        // Add page separator
        if (pageText.trim()) {
          fullText += pageText + "\n";
        }
      } catch (pageError) {
        console.warn(`[PDF Parser] Error extracting page ${i}:`, pageError);
        // Continue with next page even if one fails
      }
    }

    if (!fullText.trim()) {
      throw new Error("No text could be extracted from PDF");
    }

    return fullText;
  } catch (error) {
    console.error("[PDF Parser] Error extracting PDF text:", error);
    throw error;
  }
};

/**
 * Extracts text and creates a summary for AI context
 * Includes page count and content preview
 */
export const extractPDFTextWithMetadata = async (file: File): Promise<{
  text: string;
  pageCount: number;
  fileName: string;
}> => {
  try {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

    let fullText = "";

    for (let i = 1; i <= pdf.numPages; i++) {
      try {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();

        const pageText = content.items
          .map((item: any) => (typeof item.str === "string" ? item.str : ""))
          .join(" ");

        if (pageText.trim()) {
          fullText += pageText + "\n";
        }
      } catch {
        // Continue on error
      }
    }

    return {
      text: fullText,
      pageCount: pdf.numPages,
      fileName: file.name,
    };
  } catch (error) {
    console.error("[PDF Parser] Error extracting metadata:", error);
    throw error;
  }
};


/**
 * Extracts and cleans PDF text for optimal AI processing
 * - Removes excessive whitespace
 * - Limits to first N characters for token efficiency
 * - Preserves key structure
 */
export const extractAndCleanPDFText = async (
  file: File,
  maxChars: number = 8000
): Promise<string> => {
  try {
    let text = await extractPDFText(file);

    // Clean up whitespace
    text = text
      .replace(/\s+/g, " ") // Multiple spaces → single space
      .replace(/\n\s*\n/g, "\n") // Multiple newlines → single newline
      .trim();

    // Limit to max characters but try to break at sentence boundary
    if (text.length > maxChars) {
      text = text.substring(0, maxChars);
      // Try to end at last period or newline
      const lastPeriod = text.lastIndexOf(".");
      const lastNewline = text.lastIndexOf("\n");
      const breakPoint = Math.max(lastPeriod, lastNewline);

      if (breakPoint > maxChars * 0.8) {
        // If period/newline is recent, use it
        text = text.substring(0, breakPoint + 1);
      }
    }

    return text;
  } catch (error) {
    console.error("[PDF Parser] Error cleaning PDF text:", error);
    throw error;
  }
};
