import React from 'react';
import { fetchPonteiroData } from '@/lib/data-service';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { DataArchiver } from '@/components/dashboard/data-archiver';
import { AiInsights } from '@/components/dashboard/ai-insights';

export default async function DashboardPage() {
  const data = await fetchPonteiroData();
  const lastUpdatedIso = new Date().toISOString();
  
  const uniqueFainas = Array.from(new Set(data.map(d => d.Funcao))).sort();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <DataArchiver data={data} />
      <DashboardContent 
        initialData={data} 
        lastUpdatedIso={lastUpdatedIso} 
        uniqueFainas={uniqueFainas} 
      />
      <aside className="hidden lg:flex flex-col w-[420px] flex-shrink-0 border-l border-border/50 p-6 space-y-6">
        <AiInsights data={data} />
      </aside>
    </div>
  );
}
