'use server';
/**
 * @fileOverview This file implements a Genkit flow for detecting anomalies in tabular data.
 *
 * - detectAnomalies - A function that analyzes input data for anomalies.
 * - AnomalyDetectionInput - The input type for the detectAnomalies function.
 * - AnomalyDetectionOutput - The return type for the detectAnomalies function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnomalyDetectionInputSchema = z.array(
  z.object({
    Funcao: z.string().describe('Function name.'),
    Sinal: z.string().describe('Signal value or identifier.'),
    Original_1: z.string().describe('Original value 1.'),
    Temporario_1: z.string().describe('Temporary value 1.'),
    Original_2: z.string().describe('Original value 2.'),
    Temporario_2: z.string().describe('Temporary value 2.'),
  }).describe('A row of extracted tabular data.')
);
export type AnomalyDetectionInput = z.infer<typeof AnomalyDetectionInputSchema>;

const AnomalySchema = z.object({
  rowIndex: z.number().describe('The 0-based index of the row where the anomaly was found.'),
  column: z.string().describe('The name of the column where the anomaly was detected.'),
  value: z.string().describe('The anomalous value detected in the specified column.'),
  explanation: z.string().describe('A brief explanation of why this value is considered an anomaly.'),
});

const AnomalyDetectionOutputSchema = z.array(AnomalySchema).describe('A list of detected anomalies.');
export type AnomalyDetectionOutput = z.infer<typeof AnomalyDetectionOutputSchema>;

export async function detectAnomalies(input: AnomalyDetectionInput): Promise<AnomalyDetectionOutput> {
  return anomalyDetectionFlow(input);
}

const anomalyDetectionPrompt = ai.definePrompt({
  name: 'anomalyDetectionPrompt',
  input: { schema: AnomalyDetectionInputSchema },
  output: { schema: AnomalyDetectionOutputSchema },
  prompt: `You are an expert data analyst specializing in identifying anomalies and outliers in structured data.
Your task is to analyze the provided tabular data and identify any statistically significant anomalies or outliers in the 'Sinal', 'Original_1', 'Temporario_1', 'Original_2', and 'Temporario_2' columns.
For each anomaly, provide the 0-based row index, the column name, the anomalous value, and a brief explanation of why it is considered an anomaly.
Focus on values that deviate significantly from typical patterns or ranges within their respective columns. If no anomalies are found, return an empty array.

The data is provided below in JSON format.
Data:
{{{JSON.stringify input}}}`,
  config: {
    temperature: 0.2,
  },
});

const anomalyDetectionFlow = ai.defineFlow(
  {
    name: 'anomalyDetectionFlow',
    inputSchema: AnomalyDetectionInputSchema,
    outputSchema: AnomalyDetectionOutputSchema,
  },
  async (input) => {
    const { output } = await anomalyDetectionPrompt(input);
    return output!;
  }
);
