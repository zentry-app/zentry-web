"use client";

import { useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import {
    collection,
    query,
    orderBy,
    limit,
    onSnapshot,
    getDocs,
    writeBatch,
    Timestamp
} from 'firebase/firestore';
import { httpsCallable } from 'firebase/functions';
import { db, app } from '@/lib/firebase/config';
import { getFunctions } from 'firebase/functions';
import { getResidenciales, getUsuariosPorResidencial, getUsuario } from '@/lib/firebase/firestore';
import type { Residencial } from '@/lib/firebase/firestore';
import type { Usuario } from '@/lib/firebase/firestore';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Activity,
    CheckCircle2,
    Clock,
    Eye,
    XCircle,
    Search,
    Smartphone,
    Pause,
    Play,
    Trash2,
    TestTube2
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { useToast } from '@/components/ui/use-toast';

interface NotificationLog {
    trackingId: string;
    type: string;
    status: 'sent' | 'delivered' | 'opened' | 'failed';
    userId: string;
    title: string;
    body: string;
    metadata?: any;
    sentAt: Timestamp | null;
    deliveredAt?: Timestamp | null;
    openedAt?: Timestamp | null;
    platform?: string;
    devicePlatform?: 'android' | 'ios' | 'unknown'; // Plataforma reportada por el dispositivo
    topic?: string;
    messageId?: string;
}

const BATCH_SIZE = 500;
const SIN_USUARIO_VALUE = '__none__';

export default function GlobalNotificationsMonitor() {
    const [logs, setLogs] = useState<NotificationLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isPaused, setIsPaused] = useState(true); // Pausado por defecto; solo activar para pruebas
    const [clearConfirmOpen, setClearConfirmOpen] = useState(false);
    const [clearing, setClearing] = useState(false);
    const { toast } = useToast();
    const unsubscribeRef = useRef<(() => void) | null>(null);
    const pathname = usePathname();

    // Siempre pausado al entrar (o volver) a esta página; solo activar manualmente para pruebas
    useEffect(() => {
        if (pathname?.includes('notificaciones')) setIsPaused(true);
    }, [pathname]);

    // Simulador de ingresos (pruebas)
    const [residenciales, setResidenciales] = useState<Residencial[]>([]);
    const [selectedResidencialId, setSelectedResidencialId] = useState<string>('');
    const [usuarios, setUsuarios] = useState<Usuario[]>([]);
    const [selectedUserId, setSelectedUserId] = useState<string>(SIN_USUARIO_VALUE);
    const [tipoIngreso, setTipoIngreso] = useState<'evento' | 'qr_unico' | 'visita_autorizada'>('evento');
    const [loadingResidenciales, setLoadingResidenciales] = useState(false);
    const [loadingUsuarios, setLoadingUsuarios] = useState(false);
    const [simulating, setSimulating] = useState(false);
    const [userNamesMap, setUserNamesMap] = useState<Record<string, string>>({});

    // Cargar nombres de usuarios destinatarios (para mostrar en columna Destinatario)
    const logUserIds = logs.map((l) => l.userId).filter((id) => id && id.length >= 10 && id !== 'unknown');
    const uniqueUserIds = Array.from(new Set(logUserIds));
    useEffect(() => {
        if (uniqueUserIds.length === 0) return;
        let cancelled = false;
        const toFetch = uniqueUserIds.filter((id) => !userNamesMap[id]);
        if (toFetch.length === 0) return;
        Promise.all(
            toFetch.map((uid) =>
                getUsuario(uid)
                    .then((u) => ({ uid, name: (u?.fullName || (u as any)?.nombre || '').trim() || '' }))
                    .catch(() => ({ uid, name: '' }))
            )
        ).then((results) => {
            if (cancelled) return;
            setUserNamesMap((prev) => {
                const next = { ...prev };
                results.forEach(({ uid, name }) => { if (name) next[uid] = name; });
                return next;
            });
        });
        return () => { cancelled = true; };
    }, [uniqueUserIds.join(',')]);

    // Cargar residenciales para el simulador
    useEffect(() => {
        let cancelled = false;
        setLoadingResidenciales(true);
        getResidenciales()
            .then((list) => {
                if (!cancelled) setResidenciales(list);
            })
            .catch(() => {
                if (!cancelled) setResidenciales([]);
            })
            .finally(() => {
                if (!cancelled) setLoadingResidenciales(false);
            });
        return () => { cancelled = true; };
    }, []);

    const selectedResidencial = residenciales.find((r) => r.id === selectedResidencialId);
    // Cargar usuarios del residencial seleccionado
    useEffect(() => {
        if (!selectedResidencialId || !selectedResidencial?.residencialID) {
            setUsuarios([]);
            setSelectedUserId(SIN_USUARIO_VALUE);
            return;
        }
        let cancelled = false;
        setLoadingUsuarios(true);
        getUsuariosPorResidencial(selectedResidencial.residencialID, { getAll: true })
            .then((list) => {
                if (!cancelled) setUsuarios(list);
            })
            .catch(() => {
                if (!cancelled) setUsuarios([]);
            })
            .finally(() => {
                if (!cancelled) setLoadingUsuarios(false);
            });
        return () => { cancelled = true; };
    }, [selectedResidencialId, selectedResidencial?.residencialID]);

    useEffect(() => {
        if (isPaused) {
            if (unsubscribeRef.current) {
                unsubscribeRef.current();
                unsubscribeRef.current = null;
            }
            setLoading(false);
            return () => { unsubscribeRef.current = null; };
        }

        const q = query(
            collection(db, 'notification_logs'),
            orderBy('sentAt', 'desc'),
            limit(50)
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const newLogs = snapshot.docs.map(d => ({
                trackingId: d.id,
                ...d.data()
            })) as NotificationLog[];
            setLogs(newLogs);
            setLoading(false);
            setError(null);
            console.log("[GlobalNotificationsMonitor] Recibidos", newLogs.length, "logs de notification_logs");
        }, (err: any) => {
            console.error("[GlobalNotificationsMonitor] Error en onSnapshot:", err?.code, err?.message, err);
            setError(err?.message || "Error al cargar el rastreo de notificaciones");
            setLoading(false);
            setLogs([]);
        });

        unsubscribeRef.current = unsubscribe;
        return () => {
            unsubscribe();
            unsubscribeRef.current = null;
            setError(null);
        };
    }, [isPaused]);

    async function clearNotificationLogs() {
        setClearing(true);
        setClearConfirmOpen(false);
        try {
            const colRef = collection(db, 'notification_logs');
            let totalDeleted = 0;

            while (true) {
                const snapshot = await getDocs(query(colRef, limit(BATCH_SIZE)));
                if (snapshot.empty) break;

                const batch = writeBatch(db);
                snapshot.docs.forEach((d) => batch.delete(d.ref));
                await batch.commit();
                totalDeleted += snapshot.docs.length;
            }

            setLogs([]);
            toast({
                title: 'Colección limpiada',
                description: totalDeleted > 0
                    ? `Se eliminaron ${totalDeleted} registros de notification_logs.`
                    : 'No había registros que eliminar.',
            });
        } catch (err: any) {
            console.error("[GlobalNotificationsMonitor] Error al limpiar:", err);
            toast({
                title: 'Error al limpiar',
                description: err?.message || 'No se pudo eliminar la colección.',
                variant: 'destructive',
            });
        } finally {
            setClearing(false);
        }
    }

    async function handleSimularIngreso() {
        console.log('[Simular ingreso] Clic recibido', { selectedResidencialId, tipoIngreso, selectedUserId });
        if (!selectedResidencialId) {
            toast({
                title: 'Selecciona un residencial',
                description: 'Elige un residencial para simular el ingreso.',
                variant: 'destructive',
            });
            return;
        }
        setSimulating(true);
        try {
            const functionsRegion = getFunctions(app, 'us-central1');
            const simulateIngreso = httpsCallable<
                { residencialDocId: string; userId: string | null; tipoIngreso: 'evento' | 'qr_unico' | 'visita_autorizada' },
                { success: boolean; ingresoId: string }
            >(functionsRegion, 'simulateIngresoForTesting');
            console.log('[Simular ingreso] Llamando a la función…');
            const res = await simulateIngreso({
                residencialDocId: selectedResidencialId,
                userId: (selectedUserId && selectedUserId !== SIN_USUARIO_VALUE) ? selectedUserId : null,
                tipoIngreso,
            });
            const data = res.data;
            console.log('[Simular ingreso] Respuesta:', data);
            if (data?.success && data?.ingresoId) {
                toast({
                    title: 'Ingreso simulado correctamente',
                    description: `ID: ${data.ingresoId}`,
                });
            } else {
                toast({
                    title: 'Simulación completada',
                    description: 'No se devolvió ID del ingreso.',
                });
            }
        } catch (err: any) {
            const msg = err?.message ?? err?.details ?? err?.code ?? 'Error al simular ingreso';
            console.error('[Simular ingreso] Error:', err);
            toast({
                title: 'Error al simular ingreso',
                description: String(msg),
                variant: 'destructive',
            });
        } finally {
            setSimulating(false);
        }
    }

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'opened':
                return <Badge className="bg-green-500 hover:bg-green-600"><Eye className="w-3 h-3 mr-1" /> Leída</Badge>;
            case 'delivered':
                return <Badge className="bg-blue-500 hover:bg-blue-600"><CheckCircle2 className="w-3 h-3 mr-1" /> Entregada</Badge>;
            case 'sent':
                return <Badge variant="secondary"><Clock className="w-3 h-3 mr-1" /> Enviada</Badge>;
            case 'failed':
                return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" /> Fallida</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const formatTime = (timestamp: Timestamp | null | undefined) => {
        if (!timestamp) return '-';
        // Verificar si es un Timestamp de Firestore
        const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp as any);
        return format(date, 'dd/MM/yyyy HH:mm:ss', { locale: es });
    };

    const calculateLatency = (start: Timestamp | null | undefined, end: Timestamp | null | undefined) => {
        if (!start || !end) return null;
        const startDate = start.toDate ? start.toDate() : new Date(start as any);
        const endDate = end.toDate ? end.toDate() : new Date(end as any);
        return endDate.getTime() - startDate.getTime();
    };

    const filteredLogs = logs.filter(log =>
        (log.userId && log.userId.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.title && log.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (log.type && log.type.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Monitor de Notificaciones (Global)</h1>
                    <p className="text-muted-foreground">Rastreo end-to-end en tiempo real de notificaciones push</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant={isPaused ? "default" : "outline"}
                        size="sm"
                        onClick={() => setIsPaused((p) => !p)}
                    >
                        {isPaused ? (
                            <>
                                <Play className="w-4 h-4 mr-2" />
                                Reanudar
                            </>
                        ) : (
                            <>
                                <Pause className="w-4 h-4 mr-2" />
                                Pausar
                            </>
                        )}
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => setClearConfirmOpen(true)}
                        disabled={clearing || (isPaused && logs.length === 0)}
                    >
                        <Trash2 className="w-4 h-4 mr-2" />
                        Limpiar colección
                    </Button>
                </div>
            </div>

            {isPaused && (
                <div className="mb-6 p-4 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400">
                    <p className="font-medium">Monitor pausado</p>
                    <p className="text-sm mt-1">Las actualizaciones en tiempo real están detenidas. Haz clic en &quot;Reanudar&quot; para volver a escuchar.</p>
                </div>
            )}

            {error && (
                <div className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
                    <p className="font-medium">Error al cargar el monitor</p>
                    <p className="text-sm mt-1">{error}</p>
                    <p className="text-xs mt-2 text-muted-foreground">
                        Verifica que tu usuario tenga rol de administrador global (isGlobalAdmin) para acceder a notification_logs.
                    </p>
                </div>
            )}

            <Card className="mb-6">
                <CardHeader className="pb-2">
                    <CardTitle className="flex items-center gap-2 text-base">
                        <TestTube2 className="w-4 h-4" />
                        Simular ingreso (pruebas)
                    </CardTitle>
                    <p className="text-sm text-muted-foreground">
                        Crea un ingreso de prueba en el residencial seleccionado para validar notificaciones.
                    </p>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                        <div className="space-y-2">
                            <Label>Residencial</Label>
                            <Select
                                value={selectedResidencialId}
                                onValueChange={(v) => { setSelectedResidencialId(v); setSelectedUserId(SIN_USUARIO_VALUE); }}
                                disabled={loadingResidenciales}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={loadingResidenciales ? 'Cargando…' : 'Selecciona residencial'} />
                                </SelectTrigger>
                                <SelectContent>
                                    {residenciales.map((r) => (
                                        <SelectItem key={r.id} value={r.id!}>
                                            {r.nombre || r.residencialID || r.id}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Usuario</Label>
                            <Select
                                value={selectedUserId}
                                onValueChange={setSelectedUserId}
                                disabled={!selectedResidencialId || loadingUsuarios}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder={loadingUsuarios ? 'Cargando…' : !selectedResidencialId ? 'Primero elige residencial' : 'Sin usuario específico'} />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value={SIN_USUARIO_VALUE}>Sin usuario específico</SelectItem>
                                    {usuarios.map((u) => (
                                        <SelectItem key={u.uid} value={u.uid}>
                                            {u.fullName ? `${u.fullName}${u.email ? ` (${u.email})` : ''}` : u.email || u.uid}
                                        </SelectItem>
                                    ))}
                                    {selectedResidencialId && !loadingUsuarios && usuarios.length === 0 && (
                                        <span className="px-2 py-1.5 text-sm text-muted-foreground">Sin usuarios en este residencial</span>
                                    )}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Tipo de ingreso</Label>
                            <Select value={tipoIngreso} onValueChange={(v: 'evento' | 'qr_unico' | 'visita_autorizada') => setTipoIngreso(v)}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="evento">Evento</SelectItem>
                                    <SelectItem value="qr_unico">QR de 1 solo uso</SelectItem>
                                    <SelectItem value="visita_autorizada">Visita autorizada</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="flex flex-col gap-1 items-end justify-end">
                            <Button
                                type="button"
                                onClick={() => handleSimularIngreso()}
                                disabled={simulating || !selectedResidencialId}
                                className="w-full sm:w-auto"
                            >
                                {simulating ? 'Creando…' : 'Simular ingreso'}
                            </Button>
                            {!selectedResidencialId && residenciales.length > 0 && (
                                <span className="text-xs text-muted-foreground">Elige un residencial arriba para habilitar</span>
                            )}
                        </div>
                    </div>
                </CardContent>
            </Card>

            <div className="grid gap-6 md:grid-cols-4 mb-6">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total (Últimas 50)</CardTitle>
                        <Activity className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{logs.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Leídas / Abiertas</CardTitle>
                        <Eye className="h-4 w-4 text-green-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">
                            {logs.filter(l => l.status === 'opened').length}
                        </div>
                        <p className="text-xs text-muted-foreground">Confirmación de lectura</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Entregadas</CardTitle>
                        <Smartphone className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-600">
                            {logs.filter(l => l.status === 'delivered').length}
                        </div>
                        <p className="text-xs text-muted-foreground">Recibidas en dispositivo</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Enviadas</CardTitle>
                        <Clock className="h-4 w-4 text-gray-500" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-gray-600">
                            {logs.filter(l => l.status === 'sent').length}
                        </div>
                        <p className="text-xs text-muted-foreground">Procesadas por el servidor</p>
                    </CardContent>
                </Card>
            </div>

            <div className="flex items-center mb-4">
                <div className="relative w-full max-w-sm">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Buscar por usuario, título o tipo..."
                        className="pl-8"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            <div className="rounded-md border bg-card">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Estado</TableHead>
                            <TableHead>Plat.</TableHead>
                            <TableHead>Título / Mensaje</TableHead>
                            <TableHead>Destinatario</TableHead>
                            <TableHead>Tipo</TableHead>
                            <TableHead>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="cursor-help underline decoration-dotted">Enviada</span>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-[280px]">
                                            <strong>1. Enviada:</strong> El servidor envió la notificación push en este momento.
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </TableHead>
                            <TableHead>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="cursor-help underline decoration-dotted">Entregada</span>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-[280px]">
                                            <strong>2. Entregada:</strong> El dispositivo <strong>recibió</strong> la notificación. Se registra si la app estaba en primer plano o (solo Android) al recibir en segundo plano. En iOS con la app en segundo plano no se puede registrar hasta que el usuario abre; si luego abre, puede mostrarse la hora de apertura como referencia.
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </TableHead>
                            <TableHead>
                                <TooltipProvider>
                                    <Tooltip>
                                        <TooltipTrigger asChild>
                                            <span className="cursor-help underline decoration-dotted">Leída</span>
                                        </TooltipTrigger>
                                        <TooltipContent side="top" className="max-w-[280px]">
                                            <strong>3. Leída:</strong> El destinatario <strong>tocó</strong> la notificación y abrió la app (desde el banner o el centro de notificaciones).
                                        </TooltipContent>
                                    </Tooltip>
                                </TooltipProvider>
                            </TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {loading ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-10">
                                    <div className="flex justify-center items-center">
                                        <Clock className="h-6 w-6 animate-spin mr-2" />
                                        Cargando datos en tiempo real...
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredLogs.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="text-center py-10">
                                    No se encontraron registros recientes
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredLogs.map((log) => {
                                const latencyDelivered = calculateLatency(log.sentAt, log.deliveredAt);
                                const latencyOpened = calculateLatency(log.sentAt, log.openedAt);

                                return (
                                    <TableRow key={log.trackingId}>
                                        <TableCell>{getStatusBadge(log.status)}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-1">
                                                {log.devicePlatform === 'android' ? (
                                                    <Smartphone className="w-4 h-4 text-green-600" />
                                                ) : log.devicePlatform === 'ios' ? (
                                                    <Smartphone className="w-4 h-4 text-gray-400" />
                                                ) : (
                                                    <Clock className="w-4 h-4 text-muted-foreground opacity-30" />
                                                )}
                                                <span className="text-[10px] capitalize text-muted-foreground">
                                                    {log.devicePlatform || '-'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="font-medium text-sm">{log.title}</div>
                                            <div className="text-xs text-muted-foreground truncate max-w-[200px]" title={log.body}>{log.body}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="text-xs font-medium">
                                                {userNamesMap[log.userId] ? (
                                                    <>
                                                        {userNamesMap[log.userId]}
                                                        <span className="block text-[10px] text-muted-foreground font-normal truncate max-w-[120px]" title={log.userId}>{log.userId}</span>
                                                    </>
                                                ) : (
                                                    <span title={log.userId}>{log.userId}</span>
                                                )}
                                            </div>
                                            {log.topic && <Badge variant="outline" className="text-[10px] h-5 mt-1">{log.topic}</Badge>}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary" className="font-mono text-[10px]">{log.type}</Badge>
                                        </TableCell>
                                        <TableCell className="text-xs font-mono">{formatTime(log.sentAt)}</TableCell>
                                        <TableCell className="text-xs font-mono">
                                            {log.deliveredAt ? (
                                                <span className="text-blue-600">
                                                    {formatTime(log.deliveredAt)}
                                                    {latencyDelivered !== null && (
                                                        <span className="block text-[10px] text-muted-foreground">
                                                            +{latencyDelivered}ms
                                                        </span>
                                                    )}
                                                </span>
                                            ) : log.openedAt ? (
                                                <span className="text-muted-foreground" title="En iOS en segundo plano no se registra la entrega; se muestra la hora de apertura como referencia">
                                                    {formatTime(log.openedAt)}
                                                    {latencyOpened !== null && (
                                                        <span className="block text-[10px] text-muted-foreground">
                                                            +{latencyOpened}ms
                                                        </span>
                                                    )}
                                                    <span className="block text-[10px] italic">(al abrir)</span>
                                                </span>
                                            ) : '-'}
                                        </TableCell>
                                        <TableCell className="text-xs font-mono">
                                            {log.openedAt ? (
                                                <span className="text-green-600">
                                                    {formatTime(log.openedAt)}
                                                    {latencyOpened !== null && (
                                                        <span className="block text-[10px] text-muted-foreground">
                                                            +{latencyOpened}ms
                                                        </span>
                                                    )}
                                                </span>
                                            ) : '-'}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </div>

            <AlertDialog open={clearConfirmOpen} onOpenChange={setClearConfirmOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>¿Limpiar colección notification_logs?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Se eliminarán todos los documentos de la colección <strong>notification_logs</strong>.
                            Esta acción no se puede deshacer. El monitor quedará vacío hasta que lleguen nuevas notificaciones.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={clearing}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={(e) => {
                                e.preventDefault();
                                clearNotificationLogs();
                            }}
                            disabled={clearing}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {clearing ? 'Eliminando...' : 'Sí, limpiar todo'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
