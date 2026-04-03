'use client';

import { TicketStats as TicketStatsType } from '@/types/support';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import {
  BarChart3,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  AlertTriangle,
  Timer,
} from 'lucide-react';

interface TicketStatsProps {
  stats: TicketStatsType | null;
}

function formatHours(hours: number): string {
  if (hours === 0) return '0 h';
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) return `${hours.toFixed(1)} h`;
  const days = Math.floor(hours / 24);
  const remainingHours = Math.round(hours % 24);
  return remainingHours > 0 ? `${days} d ${remainingHours} h` : `${days} d`;
}

export function TicketStats({ stats }: TicketStatsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="border-none shadow-zentry-lg bg-white/70 backdrop-blur-xl rounded-2xl overflow-hidden">
            <CardHeader className="p-6 pb-2">
              <Skeleton className="h-4 w-24 rounded" />
            </CardHeader>
            <CardContent className="p-6 pt-2">
              <Skeleton className="h-8 w-16 rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total',
      value: stats.total,
      icon: BarChart3,
      color: 'text-blue-500',
    },
    {
      title: 'Abiertos',
      value: stats.abiertos,
      icon: AlertCircle,
      color: 'text-blue-500',
    },
    {
      title: 'En Proceso',
      value: stats.enProceso,
      icon: Clock,
      color: 'text-yellow-500',
    },
    {
      title: 'Resueltos',
      value: stats.resueltos,
      icon: CheckCircle2,
      color: 'text-green-500',
    },
    {
      title: 'Cerrados',
      value: stats.cerrados,
      icon: XCircle,
      color: 'text-gray-500',
    },
    {
      title: 'Vencidos',
      value: stats.vencidos,
      icon: AlertTriangle,
      color: stats.vencidos > 0 ? 'text-red-500' : 'text-gray-400',
    },
  ];

  const timeCards = [
    {
      title: 'Tiempo Prom. Resolución',
      value: formatHours(stats.tiempoPromedioResolucion),
      description: 'Desde creación hasta resolución',
      icon: Clock,
      color: 'text-purple-500',
    },
    {
      title: 'Tiempo Prom. Primera Respuesta',
      value: formatHours(stats.tiempoPromedioPrimeraRespuesta),
      description: 'Desde creación hasta primer cambio de estado',
      icon: Timer,
      color: 'text-indigo-500',
    },
  ];

  const cardClass = 'border-none shadow-zentry-lg bg-white/70 backdrop-blur-xl rounded-2xl overflow-hidden';

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className={cardClass}>
              <CardHeader className="p-6 flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-semibold text-slate-700">{stat.title}</CardTitle>
                <Icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className={`text-2xl font-bold ${stat.title === 'Vencidos' && (stats.vencidos ?? 0) > 0 ? 'text-red-500' : ''}`}>
                  {stat.value}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {timeCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.title} className={cardClass}>
              <CardHeader className="p-6 flex flex-row items-center justify-between pb-2">
                <div>
                  <CardTitle className="text-sm font-semibold text-slate-700">{card.title}</CardTitle>
                  <CardDescription className="text-xs text-slate-500">{card.description}</CardDescription>
                </div>
                <Icon className={`h-5 w-5 ${card.color}`} />
              </CardHeader>
              <CardContent className="px-6 pb-6">
                <div className="text-2xl font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className={cardClass}>
          <CardHeader className="p-6">
            <CardTitle className="text-lg font-bold">Tickets por Categoría</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="space-y-3">
              {Object.entries(stats.ticketsPorCategoria).map(([categoria, count]) => (
                <div key={categoria} className="flex justify-between items-center">
                  <span className="text-sm capitalize text-slate-600">{categoria}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className={cardClass}>
          <CardHeader className="p-6">
            <CardTitle className="text-lg font-bold">Tickets por Prioridad</CardTitle>
          </CardHeader>
          <CardContent className="px-6 pb-6">
            <div className="space-y-3">
              {Object.entries(stats.ticketsPorPrioridad).map(([prioridad, count]) => (
                <div key={prioridad} className="flex justify-between items-center">
                  <span className="text-sm capitalize text-slate-600">{prioridad}</span>
                  <span className="font-semibold">{count}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
