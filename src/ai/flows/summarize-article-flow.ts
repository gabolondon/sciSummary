'use server';
/**
 * @fileOverview Summarizes a scientific article based on user context and desired length.
 *
 * - summarizeArticleWithContext - A function that handles the article summarization process.
 * - SummarizeArticleWithContextInput - The input type for the summarizeArticleWithContext function.
 * - SummarizeArticleWithContextOutput - The return type for the summarizeArticleWithContext function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeArticleWithContextInputSchema = z
  .object({
    articleText: z
      .string()
      .optional()
      .describe('The text content of the scientific article to summarize.'),
    pdfDataUri: z
      .string()
      .optional()
      .describe(
        "A PDF of a scientific article, as a data URI that must include a MIME type and use Base64 encoding. Expected format: 'data:<mimetype>;base64,<encoded_data>'."
      ),
    userContext: z
      .string()
      .describe(
        'The user’s background or field of expertise to tailor the summary.'
      ),
    summaryLength: z
      .enum(['short', 'medium', 'large'])
      .describe('The desired length of the summary (short, medium, large).'),
  })
  .refine(data => data.articleText || data.pdfDataUri, {
    message: 'Either articleText or pdfDataUri must be provided.',
    path: ['articleText'],
  });

export type SummarizeArticleWithContextInput = z.infer<
  typeof SummarizeArticleWithContextInputSchema
>;

const SummarizeArticleWithContextOutputSchema = z.object({
  summary: z.string().describe('The summarized article text.'),
});
export type SummarizeArticleWithContextOutput = z.infer<
  typeof SummarizeArticleWithContextOutputSchema
>;

export async function summarizeArticleWithContext(
  input: SummarizeArticleWithContextInput
): Promise<SummarizeArticleWithContextOutput> {
  return summarizeArticleWithContextFlow(input);
}

const summarizeArticleWithContextPrompt = ai.definePrompt({
  name: 'summarizeArticleWithContextPrompt',
  input: {schema: SummarizeArticleWithContextInputSchema},
  output: {schema: SummarizeArticleWithContextOutputSchema},
  prompt: `Summarize the following scientific article, tailoring the summary to a user with the following background and expertise: {{{userContext}}}.

{{#if articleText}}
Article Text:
{{{articleText}}}
{{/if}}

{{#if pdfDataUri}}
Article PDF:
{{media url=pdfDataUri}}
{{/if}}

Desired Summary Length: {{{summaryLength}}}

Please provide a summary that is appropriate for the specified background and length.`,
});

const summarizeArticleWithContextFlow = ai.defineFlow(
  {
    name: 'summarizeArticleWithContextFlow',
    inputSchema: SummarizeArticleWithContextInputSchema,
    outputSchema: SummarizeArticleWithContextOutputSchema,
  },
  async input => {
    const {output} = await summarizeArticleWithContextPrompt(input);
    return output!;
  }
);
