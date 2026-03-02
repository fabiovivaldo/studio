'use server';
/**
 * @fileOverview Fluxo Genkit para análise comparativa de insights.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ComparativeDataRowSchema = z.object({
  Data_Turno: z.string().describe('Data e turno da extração.'),
  Funcao: z.string().describe('Identificador da faina ou categoria.'),
  Sinal: z.string().describe('Sinal ou característica associada.'),
  Original_1: z.string().describe('Primeiro valor original.'),
  Temporario_1: z.string().describe('Primeiro valor temporário para comparação.'),
  Original_2: z.string().describe('Segundo valor original.'),
  Temporario_2: z.string().describe('Segundo valor temporário para comparação.'),
});

const ComparativeInsightsInputSchema = z.object({
  dataRows: z.array(ComparativeDataRowSchema).describe('Um array de linhas de dados extraídas da tabela.'),
});
export type ComparativeInsightsInput = z.infer<typeof ComparativeInsightsInputSchema>;

const ComparativeInsightsOutputSchema = z.object({
  insights: z.string().describe('Uma análise abrangente dos dados comparativos.'),
});
export type ComparativeInsightsOutput = z.infer<typeof ComparativeInsightsOutputSchema>;

export async function analyzeComparativeInsights(input: ComparativeInsightsInput): Promise<ComparativeInsightsOutput> {
  return comparativeInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'comparativeInsightsPrompt',
  input: {schema: ComparativeInsightsInputSchema},
  output: {schema: ComparativeInsightsOutputSchema},
  prompt: `Você é um analista de dados especialista em comparar valores numéricos para encontrar tendências e discrepâncias significativas.
Sua tarefa é analisar os dados, focando na comparação 'Original' vs 'Temporario' para cada 'Faina' na 'Data_Turno' especificada.

Identifique padrões, tendências ou discrepâncias significativas.
Forneça resumos concisos e explique os impactos potenciais em português.

Dados para análise:
{{#each dataRows}}
Data/Turno: {{{Data_Turno}}} | Faina: {{{Funcao}}} | Sinal: {{{Sinal}}}
  - Comparativo 1: Original({{{Original_1}}}) -> Temp({{{Temporario_1}}})
  - Comparativo 2: Original({{{Original_2}}}) -> Temp({{{Temporario_2}}})
{{/each}}

Análise:`,
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