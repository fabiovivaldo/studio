
import React from 'react';
import { fetchPonteiroData } from '@/lib/data-service';
import { DashboardContent } from '@/components/dashboard/dashboard-content';
import { DataArchiver } from '@/components/dashboard/data-archiver';
import { 
  Database, 
} from "lucide-react";

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
    </div>
  );
}
