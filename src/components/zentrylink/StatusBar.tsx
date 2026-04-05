'use client';

import { useEffect, useState } from 'react';
import { RefreshCw, Wifi, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  watchZentryLinkStatus,
  isZentryLinkOnline,
  formatLastSeen,
  ZentryLinkStatus,
} from '@/lib/firebase/zentrylink';

interface StatusBarProps {
  residencialDocId: string;
  onRefresh?: () => void;
}

export function ZentryLinkStatusBar({ residencialDocId, onRefresh }: StatusBarProps) {
  const [status, setStatus] = useState<ZentryLinkStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setNow] = useState(Date.now());

  // Tick every 10s so "hace Xs" stays fresh
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 10_000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const unsub = watchZentryLinkStatus(residencialDocId, (s) => {
      setStatus(s);
      setLoading(false);
    });
    return unsub;
  }, [residencialDocId]);

  const online = isZentryLinkOnline(status);

  if (loading) {
    return (
      <div className="h-10 bg-slate-100 dark:bg-slate-800/60 rounded-xl animate-pulse" />
    );
  }

  if (!online) {
    return (
      <div className="flex items-center gap-2 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-2.5 text-sm">
        <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0" />
        <span className="text-amber-700 dark:text-amber-400 font-medium">
          ZentryLink sin conexión
          {status?.lastSeen ? ` · ${formatLastSeen(status.lastSeen)}` : ''}
        </span>
        <span className="text-amber-600 dark:text-amber-500 ml-1 hidden sm:inline">
          — Los cambios de hardware no estarán disponibles
        </span>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 px-4 py-2.5 text-sm">
      <Wifi className="w-4 h-4 text-emerald-500 flex-shrink-0" />
      <span className="text-emerald-700 dark:text-emerald-400 font-medium">Online</span>
      {status?.zkteco?.serialNumber && (
        <span className="text-emerald-600 dark:text-emerald-500 font-mono text-xs">
          {status.zkteco.serialNumber}
        </span>
      )}
      {status?.stats && (
        <span className="text-emerald-600 dark:text-emerald-500 hidden sm:inline">
          {status.stats.tagsActive} activos · última señal {formatLastSeen(status.lastSeen)}
        </span>
      )}
      {onRefresh && (
        <Button
          variant="ghost"
          size="sm"
          className="ml-auto h-7 px-2 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-100 dark:hover:bg-emerald-900/40"
          onClick={onRefresh}
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span className="ml-1 text-xs">Refrescar</span>
        </Button>
      )}
    </div>
  );
}
