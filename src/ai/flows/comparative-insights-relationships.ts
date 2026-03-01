'use server';
/**
 * @fileOverview This file implements a Genkit flow that analyzes tabular data.
 *
 * - analyzeComparativeInsights - A function that analyzes the provided data for insights.
 * - ComparativeInsightsInput - The input type for the analyzeComparativeInsights function.
 * - ComparativeInsightsOutput - The return type for the analyzeComparativeInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ComparativeDataRowSchema = z.object({
  Funcao: z.string().describe('The function or category identifier.'),
  Sinal: z.string().describe('An associated signal or characteristic.'),
  Original_1: z.string().describe('The first original value.'),
  Temporario_1: z.string().describe('The first temporary value for comparison.'),
  Original_2: z.string().describe('The second original value.'),
  Temporario_2: z.string().describe('The second temporary value for comparison.'),
});

const ComparativeInsightsInputSchema = z.object({
  dataRows: z.array(ComparativeDataRowSchema).describe('An array of data rows extracted from the table.'),
});
export type ComparativeInsightsInput = z.infer<typeof ComparativeInsightsInputSchema>;

const ComparativeInsightsOutputSchema = z.object({
  insights: z.string().describe('A comprehensive analysis of the comparative data, highlighting relationships, trends, discrepancies, and potential reasons.'),
});
export type ComparativeInsightsOutput = z.infer<typeof ComparativeInsightsOutputSchema>;

export async function analyzeComparativeInsights(input: ComparativeInsightsInput): Promise<ComparativeInsightsOutput> {
  return comparativeInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'comparativeInsightsPrompt',
  input: {schema: ComparativeInsightsInputSchema},
  output: {schema: ComparativeInsightsOutputSchema},
  prompt: `You are an expert data analyst specializing in comparing numerical and categorical data to find relationships, trends, and significant differences.
Your task is to analyze the provided data, focusing on the 'Original_1' vs 'Temporario_1' and 'Original_2' vs 'Temporario_2' values for each 'Funcao'.

Identify any patterns, relationships, trends, or significant discrepancies between the 'Original' and 'Temporario' values.
Provide concise summaries and explain potential reasons for the observed behaviors or impacts.

Data for analysis:
{{#each dataRows}}
Funcao: {{{Funcao}}}
  - Sinal: {{{Sinal}}}
  - Original 1: {{{Original_1}}}
  - Temporario 1: {{{Temporario_1}}}
  - Original 2: {{{Original_2}}}
  - Temporario 2: {{{Temporario_2}}}
{{/each}}

Analysis:`,
});

const comparativeInsightsFlow = ai.defineFlow(
  {
    name: 'comparativeInsightsFlow',
    inputSchema: ComparativeInsightsInputSchema,
    outputSchema: ComparativeInsightsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
