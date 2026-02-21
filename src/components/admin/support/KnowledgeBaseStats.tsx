'use client';

import { KnowledgeBaseStats as KnowledgeBaseStatsType } from '@/types/support';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { BookOpen, TrendingUp, BarChart3 } from 'lucide-react';

interface KnowledgeBaseStatsProps {
  stats: KnowledgeBaseStatsType | null;
}

export function KnowledgeBaseStats({ stats }: KnowledgeBaseStatsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="border-none shadow-zentry-lg bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
            <CardHeader className="p-6 pb-2">
              <Skeleton className="h-4 w-24 rounded-lg" />
            </CardHeader>
            <CardContent className="p-6 pt-0">
              <Skeleton className="h-9 w-20 rounded-xl" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-none shadow-zentry-lg bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden hover-lift">
          <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
            <CardTitle className="text-sm font-bold text-slate-600">Total</CardTitle>
            <div className="h-10 w-10 rounded-2xl bg-blue-50 flex items-center justify-center">
              <BookOpen className="h-5 w-5 text-blue-500" />
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-3xl font-black text-slate-900">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-zentry-lg bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden hover-lift">
          <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
            <CardTitle className="text-sm font-bold text-slate-600">Activas</CardTitle>
            <div className="h-10 w-10 rounded-2xl bg-emerald-50 flex items-center justify-center">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-3xl font-black text-slate-900">{stats.activos}</div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-zentry-lg bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden hover-lift">
          <CardHeader className="flex flex-row items-center justify-between p-6 pb-2">
            <CardTitle className="text-sm font-bold text-slate-600">Inactivas</CardTitle>
            <div className="h-10 w-10 rounded-2xl bg-slate-100 flex items-center justify-center">
              <BarChart3 className="h-5 w-5 text-slate-500" />
            </div>
          </CardHeader>
          <CardContent className="p-6 pt-0">
            <div className="text-3xl font-black text-slate-900">{stats.inactivos}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-none shadow-zentry-lg bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-black">Más Utilizadas</CardTitle>
            <CardDescription className="text-slate-500 font-medium">Top 10 preguntas más utilizadas</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="space-y-3">
              {stats.masUtilizadas.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 rounded-xl bg-slate-50/80 text-center">No hay datos disponibles</p>
              ) : (
                stats.masUtilizadas.map((item) => (
                  <div key={item.knowledgeId} className="flex justify-between items-center gap-4 py-2.5 px-3 rounded-xl hover:bg-slate-50/80 transition-colors">
                    <span className="text-sm truncate flex-1 font-medium text-slate-700">{item.pregunta}</span>
                    <span className="text-sm font-bold text-primary shrink-0">{item.vecesUtilizada}</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-none shadow-zentry-lg bg-white/70 backdrop-blur-xl rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-xl font-black">Mejor Efectividad</CardTitle>
            <CardDescription className="text-slate-500 font-medium">Preguntas con mayor tasa de éxito</CardDescription>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <div className="space-y-3">
              {stats.mejorEfectividad.length === 0 ? (
                <p className="text-sm text-muted-foreground py-4 rounded-xl bg-slate-50/80 text-center">No hay datos disponibles</p>
              ) : (
                stats.mejorEfectividad.map((item) => (
                  <div key={item.knowledgeId} className="flex justify-between items-center gap-4 py-2.5 px-3 rounded-xl hover:bg-slate-50/80 transition-colors">
                    <span className="text-sm truncate flex-1 font-medium text-slate-700">{item.pregunta}</span>
                    <span className="text-sm font-bold text-emerald-600 shrink-0">{item.efectividad.toFixed(0)}%</span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
