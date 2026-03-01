"use client";

import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription 
} from "@/components/ui/card";
import { 
  BrainCircuit, 
  Sparkles, 
  AlertTriangle, 
  BarChart3, 
  RefreshCcw,
  CheckCircle2
} from "lucide-react";
import { PonteiroData } from "@/lib/data-service";
import { summarizeDataOverview } from "@/ai/flows/data-overview-summary";
import { detectAnomalies, AnomalyDetectionOutput } from "@/ai/flows/anomaly-detection-highlighting-flow";
import { analyzeComparativeInsights } from "@/ai/flows/comparative-insights-relationships.ts";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";

interface AiInsightsProps {
  data: PonteiroData[];
}

export function AiInsights({ data }: AiInsightsProps) {
  const [activeTab, setActiveTab] = useState<'summary' | 'anomalies' | 'comparative'>('summary');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    summary?: string;
    anomalies?: AnomalyDetectionOutput;
    comparative?: string;
  }>({});

  const generateInsight = async (type: typeof activeTab) => {
    if (data.length === 0) return;
    setLoading(true);
    setActiveTab(type);
    
    try {
      if (type === 'summary') {
        const res = await summarizeDataOverview(data);
        setResults(prev => ({ ...prev, summary: res.summary }));
      } else if (type === 'anomalies') {
        const res = await detectAnomalies(data);
        setResults(prev => ({ ...prev, anomalies: res }));
      } else if (type === 'comparative') {
        const res = await analyzeComparativeInsights({ dataRows: data });
        setResults(prev => ({ ...prev, comparative: res.insights }));
      }
    } catch (err) {
      console.error("AI Flow error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card className="bg-card border-border/50 shadow-xl overflow-hidden group">
      <CardHeader className="border-b border-border/50 bg-accent/5">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <BrainCircuit className="h-5 w-5 text-accent animate-pulse-slow" />
              Intelligent Data Insights
            </CardTitle>
            <CardDescription className="text-xs">
              Powered by Generative AI for real-time analysis
            </CardDescription>
          </div>
          <Sparkles className="h-5 w-5 text-accent/30" />
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="flex flex-col h-[500px]">
          {/* Controls */}
          <div className="flex border-b border-border/50">
            {[
              { id: 'summary', icon: BarChart3, label: 'Overview' },
              { id: 'anomalies', icon: AlertTriangle, label: 'Anomalies' },
              { id: 'comparative', icon: CheckCircle2, label: 'Comparative' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => generateInsight(tab.id as any)}
                className={`flex-1 flex flex-col items-center gap-1.5 py-4 text-[10px] font-bold uppercase tracking-widest transition-all
                  ${activeTab === tab.id ? 'text-accent bg-accent/10 border-b-2 border-accent' : 'text-muted-foreground hover:bg-muted/30'}
                `}
              >
                <tab.icon className={`h-4 w-4 ${activeTab === tab.id ? 'text-accent' : 'text-muted-foreground'}`} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Result View */}
          <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-accent/20">
            {loading ? (
              <div className="space-y-4">
                <Skeleton className="h-4 w-[250px] bg-muted" />
                <Skeleton className="h-24 w-full bg-muted" />
                <Skeleton className="h-4 w-[200px] bg-muted" />
                <Skeleton className="h-16 w-full bg-muted" />
              </div>
            ) : (
              <div className="prose prose-sm prose-invert max-w-none">
                {activeTab === 'summary' && (
                  results.summary ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{results.summary}</p>
                  ) : (
                    <div className="text-center py-12 space-y-4">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
                      <p className="text-muted-foreground">Click 'Overview' to generate a data summary.</p>
                      <Button onClick={() => generateInsight('summary')} variant="secondary" size="sm">
                        Analyze Now
                      </Button>
                    </div>
                  )
                )}

                {activeTab === 'anomalies' && (
                  results.anomalies ? (
                    results.anomalies.length > 0 ? (
                      <div className="space-y-4">
                        {results.anomalies.map((anomaly, idx) => (
                          <div key={idx} className="p-3 border border-destructive/30 bg-destructive/5 rounded-lg space-y-2">
                            <div className="flex items-center justify-between">
                              <Badge variant="destructive" className="text-[10px] uppercase">Anomaly</Badge>
                              <span className="text-[10px] font-mono text-muted-foreground">Row {anomaly.rowIndex} • {anomaly.column}</span>
                            </div>
                            <p className="text-xs font-semibold text-destructive">Value: {anomaly.value}</p>
                            <p className="text-xs italic text-muted-foreground">{anomaly.explanation}</p>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-12 space-y-2">
                        <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto opacity-50" />
                        <p className="text-green-500 font-medium">No significant anomalies detected.</p>
                      </div>
                    )
                  ) : (
                    <div className="text-center py-12 space-y-4">
                      <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
                      <p className="text-muted-foreground">Run anomaly detection on current data set.</p>
                      <Button onClick={() => generateInsight('anomalies')} variant="secondary" size="sm">
                        Detect Anomalies
                      </Button>
                    </div>
                  )
                )}

                {activeTab === 'comparative' && (
                  results.comparative ? (
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{results.comparative}</p>
                  ) : (
                    <div className="text-center py-12 space-y-4">
                      <BrainCircuit className="h-12 w-12 text-muted-foreground mx-auto opacity-20" />
                      <p className="text-muted-foreground">Analyze relationships between original and temporary values.</p>
                      <Button onClick={() => generateInsight('comparative')} variant="secondary" size="sm">
                        Generate Insights
                      </Button>
                    </div>
                  )
                )}
              </div>
            )}
          </div>

          <div className="p-4 border-t border-border/50 bg-muted/30 flex justify-between items-center">
            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">System Online</span>
            <Button 
                variant="ghost" 
                size="icon" 
                className="h-8 w-8 hover:bg-accent/20"
                onClick={() => generateInsight(activeTab)}
            >
              <RefreshCcw className={`h-4 w-4 text-accent ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}