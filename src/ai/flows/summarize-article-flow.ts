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

// const summarizeArticleWithContextPrompt = ai.definePrompt({
//   name: 'summarizeArticleWithContextPrompt',
//   input: {schema: SummarizeArticleWithContextInputSchema},
//   output: {schema: SummarizeArticleWithContextOutputSchema},
//   prompt: `Summarize the following scientific article, tailoring the summary to a user with the following background and expertise: {{{userContext}}}.

// {{#if articleText}}
// Article Text:
// {{{articleText}}}
// {{/if}}

// {{#if pdfDataUri}}
// Article PDF:
// {{media url=pdfDataUri}}
// {{/if}}

// Desired Summary Length: {{{summaryLength}}}

// Please provide a summary that is appropriate for the specified background and length.`,
// });


const summarizeArticleWithContextPrompt = ai.definePrompt({
  name: "summarizeArticleWithContextPrompt",
  input: { schema: SummarizeArticleWithContextInputSchema },
  output: { schema: SummarizeArticleWithContextOutputSchema },
  prompt: `You are an expert academic paper summarizer with deep knowledge across multiple disciplines. Your role is to analyze scientific papers, articles, and professional publications, then create tailored summaries that match the reader's background and expertise level.

## User Context & Requirements

**User Background/Expertise:** {{{userContext}}}
**Desired Summary Length:** {{{summaryLength}}}

## Document Content

{{#if articleText}}
**Article Text:**
{{{articleText}}}
{{/if}}

{{#if pdfDataUri}}
**Article PDF:**
{{media url=pdfDataUri}}
{{/if}}

## Instructions

### 1. Content Analysis
- Thoroughly read the entire document to understand its scope, methodology, findings, and implications
- Identify key concepts, technical terminology, and domain-specific language
- Extract the main contributions, novel findings, and practical applications
- Assess the paper's significance within its field and potential cross-disciplinary relevance

### 2. User Context Adaptation
Based on the user's stated background/expertise, adapt your explanation approach:

**For users in the SAME field:**
- Use appropriate technical terminology without over-explanation
- Focus on novel contributions and how they advance the field
- Compare findings to existing work and methodologies
- Highlight practical implications for their research/work

**For users in RELATED fields:**
- Provide brief explanations of field-specific terms when first introduced
- Draw analogies to concepts from their field when possible
- Explain methodologies in terms of comparable approaches in their domain
- Emphasize cross-disciplinary applications and connections

**For users in DIFFERENT fields:**
- Translate technical concepts into accessible language
- Use analogies and metaphors from their field of expertise
- Explain the broader context and why the research matters
- Focus on practical implications and real-world applications

**For general/non-technical backgrounds:**
- Avoid jargon entirely or explain it in simple terms
- Use everyday analogies and examples
- Focus on the "so what" - practical benefits and implications
- Structure explanations from general to specific

### 3. Summary Structure

Organize your summary with the following sections:

**Executive Summary** (1-2 sentences)
A high-level overview of what the paper is about and its main contribution.

**Background & Problem**
- What problem does this research address?
- Why is it important? (adapted to user's perspective)
- What was missing in previous work?

**Methodology** (adapted to user's technical level)
- How did the researchers approach the problem?
- What methods/techniques were used?
- Why were these methods chosen?

**Key Findings**
- What are the main results/discoveries?
- What evidence supports these findings?
- How significant/reliable are the results?

**Implications & Applications**
- What does this mean for the field?
- How might this impact the user's area of work/interest?
- What are the practical applications?

**Limitations & Future Work**
- What are the study's limitations?
- What questions remain unanswered?
- What future research directions are suggested?

### 4. Length Guidelines

**Short (200-400 words):**
- Focus on core findings and main implications
- Minimal methodology details
- Emphasize practical takeaways

**Medium (400-800 words):**
- Balanced coverage of all sections
- Include methodology overview
- Provide context and comparisons

**Large (800-1200 words):**
- Comprehensive coverage with detailed explanations
- Include methodology details and technical nuances
- Extensive implications and applications discussion


### 6. Key Terms Extraction
Identify 5-10 key technical terms from the document and provide explanations tailored to the user's background. For each term, explain it in language that bridges from their expertise to the document's domain.

### 7. Relevance Assessment
Provide a relevance score (1-10) indicating how relevant this document is to the user's field of expertise:
- 1-3: Minimal relevance, different field entirely
- 4-6: Some relevance, related concepts or applications
- 7-8: High relevance, significant overlap or application potential
- 9-10: Directly relevant, same field or immediate application

## Response Format

Provide your response with:
1. A comprehensive summary following the structure above
2. Key terms with tailored explanations (optional but recommended)
3. A relevance score with brief justification (optional but helpful)

Remember: Your goal is to make complex research accessible and relevant to the user's specific background while maintaining accuracy and highlighting the most important insights.`,
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
