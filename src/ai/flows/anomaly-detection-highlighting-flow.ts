'use server';
/**
 * @fileOverview Fluxo Genkit para detecção de anomalias em dados tabulares.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const AnomalyDetectionInputSchema = z.array(
  z.object({
    Data_Turno: z.string().describe('Data e turno da extração.'),
    Funcao: z.string().describe('Nome da faina.'),
    Sinal: z.string().describe('Valor ou identificador do sinal.'),
    Original_1: z.string().describe('Valor original 1.'),
    Temporario_1: z.string().describe('Valor temporário 1.'),
    Original_2: z.string().describe('Valor original 2.'),
    Temporario_2: z.string().describe('Valor temporário 2.'),
  })
);
export type AnomalyDetectionInput = z.infer<typeof AnomalyDetectionInputSchema>;

const AnomalySchema = z.object({
  rowIndex: z.number().describe('O índice baseado em 0 da linha onde a anomalia foi encontrada.'),
  column: z.string().describe('O nome da coluna onde a anomalia foi detectada.'),
  value: z.string().describe('O valor anômalo detectado.'),
  explanation: z.string().describe('Uma breve explicação do porquê este valor é considerado uma anomalia.'),
});

const AnomalyDetectionOutputSchema = z.array(AnomalySchema).describe('Uma lista de anomalias detectadas.');
export type AnomalyDetectionOutput = z.infer<typeof AnomalyDetectionOutputSchema>;

export async function detectAnomalies(input: AnomalyDetectionInput): Promise<AnomalyDetectionOutput> {
  return anomalyDetectionFlow(input);
}

const anomalyDetectionPrompt = ai.definePrompt({
  name: 'anomalyDetectionPrompt',
  input: { schema: AnomalyDetectionInputSchema },
  output: { schema: AnomalyDetectionOutputSchema },
  prompt: `Você é um analista de dados especialista em identificar anomalias e discrepâncias em dados estruturados de ponteiros.
Sua tarefa é analisar os dados fornecidos e identificar quaisquer anomalias significativas nas colunas 'Original' vs 'Temporario' e no 'Sinal'.
Considere o contexto da 'Data_Turno' e o nome da 'Faina'.
Para cada anomalia, forneça o índice da linha, o nome da coluna, o valor anômalo e uma breve explicação em português.
Se não houver anomalias, retorne um array vazio.

Dados:
{{{JSON.stringify input}}}`,
  config: {
    temperature: 0.1,
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