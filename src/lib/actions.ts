'use server';

import { revalidatePath } from 'next/cache';

/**
 * Ação de servidor para revalidar o cache da página principal.
 * Isso força o Next.js a buscar novos dados do serviço de scraping.
 */
export async function refreshDashboard() {
  revalidatePath('/');
}
