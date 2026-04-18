'use server';

import { revalidatePath } from 'next/cache';
import { fetchShipData } from './ship-data-service';

/**
 * Ação de servidor para revalidar o cache da página principal.
 * Isso força o Next.js a buscar novos dados do serviço de scraping.
 */
export async function refreshDashboard() {
  revalidatePath('/');
}

/**
 * Ação de servidor para buscar os dados dos navios.
 */
export async function fetchShipDataAction() {
  return await fetchShipData();
}
