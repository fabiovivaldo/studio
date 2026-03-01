'use server';
/**
 * @fileOverview This file implements a Genkit flow for summarizing tabular data.
 *
 * - summarizeDataOverview - A function that handles the data summary process.
 * - DataOverviewSummaryInput - The input type for the summarizeDataOverview function.
 * - DataOverviewSummaryOutput - The return type for the summarizeDataOverview function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

// Define the schema for a single data row
const DataRowSchema = z.object({
  Funcao: z.string().describe('The function name.'),
  Sinal: z.string().describe('The signal value.'),
  Original_1: z.string().describe('The first original pointer value.'),
  Temporario_1: z.string().describe('The first temporary pointer value.'),
  Original_2: z.string().describe('The second original pointer value.'),
  Temporario_2: z.string().describe('The second temporary pointer value.'),
});

// Define the input schema for the flow
const DataOverviewSummaryInputSchema = z
  .array(DataRowSchema)
  .describe('An array of data rows from the Ponteiros table.');
export type DataOverviewSummaryInput = z.infer<typeof DataOverviewSummaryInputSchema>;

// Define the output schema for the flow
const DataOverviewSummaryOutputSchema = z.object({
  summary: z.string().describe('A concise summary of the tabular data.'),
});
export type DataOverviewSummaryOutput = z.infer<typeof DataOverviewSummaryOutputSchema>;

// Helper function to pre-process data and generate a text overview for the LLM
function processDataForOverview(data: DataOverviewSummaryInput): string {
  if (!data || data.length === 0) {
    return "The dataset is empty. No data available for summarization.";
  }

  const totalRows = data.length;
  let summaryParts: string[] = [`Dataset contains ${totalRows} entries.\n`];

  // Helper to get value counts for a column
  const getValueCounts = (column: keyof z.infer<typeof DataRowSchema>) => {
    const counts = new Map<string, number>();
    data.forEach(row => {
      const value = String(row[column]); // Ensure string for map key
      counts.set(value, (counts.get(value) || 0) + 1);
    });
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1]);
  };

  // Analyze 'Sinal' column
  const sinalCounts = getValueCounts('Sinal');
  summaryParts.push(`\nSinal Column Analysis:\n`);
  summaryParts.push(`- Total unique values: ${sinalCounts.length}`);
  if (sinalCounts.length > 0) {
    summaryParts.push(`- Top 5 most frequent values:`);
    sinalCounts.slice(0, 5).forEach(([value, count]) => {
      summaryParts.push(`  - "${value}": ${count} occurrences (${((count / totalRows) * 100).toFixed(2)}%)`);
    });
  } else {
    summaryParts.push(`- No values found.`);
  }

  // Analyze 'Funcao' column
  const funcaoCounts = getValueCounts('Funcao');
  summaryParts.push(`\nFuncao Column Analysis:\n`);
  summaryParts.push(`- Total unique values: ${funcaoCounts.length}`);
  if (funcaoCounts.length > 0) {
    summaryParts.push(`- Top 5 most frequent values:`);
    funcaoCounts.slice(0, 5).forEach(([value, count]) => {
      summaryParts.push(`  - "${value}": ${count} occurrences (${((count / totalRows) * 100).toFixed(2)}%)`);
    });
  } else {
    summaryParts.push(`- No values found.`);
  }

  // Analyze pointer-like columns (Original_1, Temporario_1, Original_2, Temporario_2)
  const pointerColumns: Array<keyof z.infer<typeof DataRowSchema>> = ['Original_1', 'Temporario_1', 'Original_2', 'Temporario_2'];
  pointerColumns.forEach(col => {
    const colCounts = getValueCounts(col);
    summaryParts.push(`\n${col} Column Analysis:\n`);
    summaryParts.push(`- Total unique values: ${colCounts.length}`);
    if (colCounts.length > 0) {
      summaryParts.push(`- Most frequent value: "${colCounts[0][0]}" (${colCounts[0][1]} occurrences)`);
      summaryParts.push(`- Least frequent value: "${colCounts[colCounts.length - 1][0]}" (${colCounts[colCounts.length - 1][1]} occurrences)`);
    } else {
      summaryParts.push(`- No values found.`);
    }
  });

  return summaryParts.join('\n');
}

// Define the prompt for generating the summary
const dataOverviewSummaryPrompt = ai.definePrompt({
  name: 'dataOverviewSummaryPrompt',
  input: {
    schema: z.object({
      dataOverview: z.string().describe('A pre-processed text overview of the tabular data statistics.'),
    }),
  },
  output: { schema: DataOverviewSummaryOutputSchema },
  prompt: `You are an expert data analyst. Your task is to provide a concise summary of the provided tabular data overview. Highlight the main characteristics, common values, distributions, and any notable patterns or anomalies. Ensure the summary is easy to understand and provides quick insights.\n\nHere is the data overview:\n{{{dataOverview}}}`,
});

// Define the Genkit flow
const dataOverviewSummaryFlow = ai.defineFlow(
  {
    name: 'dataOverviewSummaryFlow',
    inputSchema: DataOverviewSummaryInputSchema,
    outputSchema: DataOverviewSummaryOutputSchema,
  },
  async (input) => {
    // Pre-process the input data into a text overview
    const dataOverview = processDataForOverview(input);

    // Call the prompt with the pre-processed overview
    const { output } = await dataOverviewSummaryPrompt({ dataOverview });
    
    if (!output) {
      throw new Error('Failed to generate data overview summary.');
    }

    return output;
  }
);

// Exported wrapper function
export async function summarizeDataOverview(input: DataOverviewSummaryInput): Promise<DataOverviewSummaryOutput> {
  return dataOverviewSummaryFlow(input);
}
