"use server";

import { summarizeArticleWithContext, SummarizeArticleWithContextInput } from "@/ai/flows/summarize-article-flow";

export async function generateSummaryAction(input: SummarizeArticleWithContextInput): Promise<{ summary?: string; error?: string }> {
  try {
    // Basic validation
    if ((!input.articleText && !input.pdfDataUri) || !input.userContext || !input.summaryLength) {
        return { error: "Missing required fields for summarization." };
    }

    const result = await summarizeArticleWithContext(input);

    if (!result.summary) {
        return { error: "The AI failed to generate a summary. The article may be too short or the context too ambiguous. Please try again." };
    }
    
    return { summary: result.summary };
  } catch (error) {
    console.error("Summarization Error:", error);
    // You can inspect the error object to provide more specific messages if needed
    return { error: "An unexpected server error occurred while generating the summary. Please try again later." };
  }
}
