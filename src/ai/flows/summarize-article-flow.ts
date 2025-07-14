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

const SummarizeArticleWithContextInputSchema = z.object({
  articleText: z
    .string()
    .describe('The text content of the scientific article to summarize.'),
  userContext: z
    .string()
    .describe(
      'The user\u2019s background or field of expertise to tailor the summary.'
    ),
  summaryLength: z
    .enum(['short', 'medium', 'large'])
    .describe('The desired length of the summary (short, medium, large).'),
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

Article Text: {{{articleText}}}

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
