
import React from 'react';
import { fetchPonteiroData } from '@/lib/data-service';
import { PonteiroDataTable } from '@/components/dashboard/data-table';
import { AiInsights } from '@/components/dashboard/ai-insights';
import { RefreshButton } from '@/components/dashboard/refresh-button';
import { LastUpdatedDisplay } from '@/components/dashboard/last-updated';
import { 
  Database, 
  LayoutDashboard, 
  Activity, 
  Globe,
  Settings,
  HelpCircle,
  LogOut
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardHeader, 
  CardTitle, 
  CardContent 
} from "@/components/ui/card";

export default async function DashboardPage() {
  const data = await fetchPonteiroData();
  // Geramos o timestamp no servidor como string ISO para o componente de cliente converter para local
  const lastUpdatedIso = new Date().toISOString();

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar Navigation */}
      <aside className="hidden lg:flex flex-col w-64 border-r border-border bg-card/30 backdrop-blur-sm">
        <div className="p-6">
          <div className="flex items-center gap-3">
            <div className="bg-primary p-2 rounded-lg shadow-lg shadow-primary/20">
              <Database className="h-6 w-6 text-white" />
            </div>
            <h1 className="font-headline font-bold text-xl tracking-tight text-foreground">
              Ponteiro<span className="text-accent">Scope</span>
            </h1>
          </div>
        </div>
        
        <div className="flex-1 px-4 space-y-8 mt-4">
          <nav className="space-y-1">
            <NavItem icon={LayoutDashboard} label="Painel" active />
            <NavItem icon={Activity} label="Monitoramento" />
            <NavItem icon={Globe} label="Fontes Públicas" />
          </nav>

          <div className="space-y-4">
            <p className="px-4 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Configurações</p>
            <nav className="space-y-1">
              <NavItem icon={Settings} label="Preferências" />
              <NavItem icon={HelpCircle} label="Documentação" />
            </nav>
          </div>
        </div>

        <div className="p-4 border-t border-border mt-auto">
          <Button variant="ghost" className="w-full justify-start text-muted-foreground hover:text-destructive hover:bg-destructive/10">
            <LogOut className="h-4 w-4 mr-3" />
            Sair
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-accent/10">
        <header className="sticky top-0 z-20 bg-background/80 backdrop-blur-md border-b border-border/50 px-8 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-sm font-medium text-muted-foreground">Visão Geral Analítica</h2>
            <div className="flex items-center gap-2">
               <h1 className="text-2xl font-bold">Tabela de Ponteiros</h1>
               <div className="flex items-center gap-1.5 ml-4 px-2 py-0.5 rounded-full bg-green-500/10 border border-green-500/20">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse"></span>
                  <span className="text-[10px] font-bold text-green-500 uppercase tracking-tighter">Dados em Tempo Real</span>
               </div>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
             <div className="hidden md:flex flex-col items-end mr-4 text-right">
                <span className="text-xs text-muted-foreground">Última Atualização</span>
                <span className="text-xs font-mono font-bold text-accent whitespace-nowrap">
                   <LastUpdatedDisplay date={lastUpdatedIso} />
                </span>
             </div>
             <RefreshButton />
          </div>
        </header>

        <div className="p-8 max-w-[1600px] mx-auto space-y-8">
          {/* Top Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Total de Funções" value={data.length.toString()} trend="+2.4%" color="primary" />
            <StatCard label="Sinais Únicos" value={new Set(data.map(d => d.Sinal)).size.toString()} trend="Estável" color="accent" />
            <StatCard label="Discrepâncias Críticas" value="12" trend="+3" color="destructive" />
            <StatCard label="Latência do Sistema" value="124ms" trend="-12ms" color="primary" />
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-8 items-start">
            {/* Table Area */}
            <section className="xl:col-span-2 space-y-6">
              <div className="bg-card/30 rounded-2xl border border-border/50 p-6 backdrop-blur-sm">
                <div className="mb-6">
                   <h3 className="text-lg font-bold">Registros de Ponteiros</h3>
                   <p className="text-sm text-muted-foreground">Extraído de ogmopgua.com.br</p>
                </div>
                <PonteiroDataTable data={data} />
              </div>
            </section>

            {/* AI Insights Area */}
            <aside className="space-y-6">
              <AiInsights data={data} />
              
              <Card className="bg-primary shadow-2xl shadow-primary/20 border-none overflow-hidden relative group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 transition-transform duration-500">
                  <Database className="h-32 w-32" />
                </div>
                <CardHeader>
                  <CardTitle className="text-primary-foreground">Relatórios Automáticos</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-primary-foreground/80 leading-relaxed">
                    Agende exportações semanais e relatórios de análise de IA enviados diretamente para sua empresa.
                  </p>
                  <Button variant="secondary" className="w-full font-bold shadow-lg">
                    Configurar Acesso
                  </Button>
                </CardContent>
              </Card>
            </aside>
          </div>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon: Icon, label, active = false }: { icon: any, label: string, active?: boolean }) {
  return (
    <button className={`flex items-center w-full px-4 py-3 rounded-xl text-sm font-medium transition-all group ${
      active 
        ? 'bg-accent/10 text-accent' 
        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
    }`}>
      <Icon className={`h-5 w-5 mr-3 transition-transform group-hover:scale-110 ${active ? 'text-accent' : 'text-muted-foreground'}`} />
      {label}
      {active && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-accent shadow-glow shadow-accent"></span>}
    </button>
  );
}

function StatCard({ label, value, trend, color }: { label: string, value: string, trend: string, color: string }) {
  const colorMap: Record<string, string> = {
    primary: 'border-l-primary',
    accent: 'border-l-accent',
    destructive: 'border-l-destructive',
  };
  
  return (
    <div className={`bg-card/50 border border-border border-l-4 ${colorMap[color]} p-6 rounded-xl shadow-lg hover:translate-y-[-2px] transition-all duration-300`}>
      <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">{label}</p>
      <div className="flex items-end justify-between mt-2">
        <h3 className="text-3xl font-bold font-mono">{value}</h3>
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
          trend.startsWith('+') ? 'bg-green-500/10 text-green-500' : 'bg-blue-500/10 text-blue-500'
        }`}>
          {trend}
        </span>
      </div>
    </div>
  );
}
