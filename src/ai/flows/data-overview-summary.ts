'use server';
/**
 * @fileOverview Fluxo Genkit para resumir os dados da tabela de ponteiros.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DataRowSchema = z.object({
  Data_Turno: z.string().describe('Data e turno da extração.'),
  Funcao: z.string().describe('O nome da faina.'),
  Sinal: z.string().describe('O valor do sinal.'),
  Original_1: z.string().describe('Primeiro valor de ponteiro original.'),
  Temporario_1: z.string().describe('Primeiro valor de ponteiro temporário.'),
  Original_2: z.string().describe('Segundo valor de ponteiro original.'),
  Temporario_2: z.string().describe('Segundo valor de ponteiro temporário.'),
});

const DataOverviewSummaryInputSchema = z
  .array(DataRowSchema)
  .describe('Um array de linhas de dados da tabela de Ponteiros.');
export type DataOverviewSummaryInput = z.infer<typeof DataOverviewSummaryInputSchema>;

const DataOverviewSummaryOutputSchema = z.object({
  summary: z.string().describe('Um resumo conciso dos dados tabulares.'),
});
export type DataOverviewSummaryOutput = z.infer<typeof DataOverviewSummaryOutputSchema>;

export async function summarizeDataOverview(input: DataOverviewSummaryInput): Promise<DataOverviewSummaryOutput> {
  return dataOverviewSummaryFlow(input);
}

const dataOverviewSummaryPrompt = ai.definePrompt({
  name: 'dataOverviewSummaryPrompt',
  input: {
    schema: z.object({
      dataOverview: z.string().describe('Uma visão geral textual das estatísticas dos dados.'),
    }),
  },
  output: { schema: DataOverviewSummaryOutputSchema },
  prompt: `Você é um analista de dados especialista. Sua tarefa é fornecer um resumo conciso da visão geral dos dados tabulares fornecida. Destaque as principais características, fainas, valores comuns, distribuições, a data/turno predominante e quaisquer padrões ou anomalias notáveis. Garanta que o resumo seja fácil de entender em português e forneça insights rápidos.

Aqui está a visão geral dos dados:
{{{dataOverview}}}`,
});

const dataOverviewSummaryFlow = ai.defineFlow(
  {
    name: 'dataOverviewSummaryFlow',
    inputSchema: DataOverviewSummaryInputSchema,
    outputSchema: DataOverviewSummaryOutputSchema,
  },
  async (input) => {
    const dataOverview = JSON.stringify(input.slice(0, 50)); // Enviando amostra para o contexto
    const { output } = await dataOverviewSummaryPrompt({ dataOverview });
    
    if (!output) {
      throw new Error('Falha ao gerar o resumo da visão geral dos dados.');
    }

    return output;
  }
);