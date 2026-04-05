'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import {
  watchZentryLinkStatus,
  isZentryLinkOnline,
  formatLastSeen,
  ZentryLinkStatus,
} from '@/lib/firebase/zentrylink';

interface StatusWidgetProps {
  residencialDocId: string;
}

export function ZentryLinkStatusWidget({ residencialDocId }: StatusWidgetProps) {
  const [status, setStatus] = useState<ZentryLinkStatus | null>(null);
  const [loading, setLoading] = useState(true);

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
      <Card className="border-none shadow-zentry dark:shadow-none bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] dark:ring-1 dark:ring-white/5 h-full">
        <CardContent className="p-4 sm:p-6 flex items-center gap-2 animate-pulse">
          <div className="w-2.5 h-2.5 rounded-full bg-slate-200 dark:bg-slate-700" />
          <div className="h-4 w-32 bg-slate-200 dark:bg-slate-700 rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Link href="/dashboard/tags">
      <Card className="border-none shadow-zentry dark:shadow-none bg-white/70 dark:bg-slate-900/40 backdrop-blur-xl rounded-2xl sm:rounded-[2.5rem] dark:ring-1 dark:ring-white/5 h-full cursor-pointer hover:shadow-zentry-lg transition-shadow">
        <CardContent className="p-4 sm:p-6 space-y-1.5">
          {/* Header */}
          <div className="flex items-center gap-2">
            <span
              className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                online ? 'bg-emerald-500' : 'bg-red-500'
              }`}
            />
            <span className="text-xs font-black uppercase tracking-widest text-slate-400 dark:text-slate-500">
              ZentryLink
            </span>
            {status?.zkteco?.serialNumber && (
              <span className="text-xs text-slate-400 dark:text-slate-500 font-mono ml-auto">
                {status.zkteco.serialNumber}
              </span>
            )}
          </div>

          {/* State */}
          {online && status ? (
            <>
              <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                Tags activos: {status.stats.tagsActive} / {status.stats.tagsTotal}
              </p>
              {status.stats.lastAccess && (
                <p className="text-xs text-slate-400 dark:text-slate-500">
                  Último acceso: Pin {status.stats.lastAccess.pin} · {status.stats.lastAccess.door} ·{' '}
                  {formatLastSeen(status.stats.lastAccess.at)}
                </p>
              )}
            </>
          ) : (
            <p className="text-sm text-slate-400 dark:text-slate-500">
              {status?.lastSeen
                ? `Sin señal · ${formatLastSeen(status.lastSeen)}`
                : 'Sin señal'}
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
