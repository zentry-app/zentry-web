import React, { useEffect, useState } from 'react';
import {
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, XCircle, RefreshCw, Mail, Phone, Home, Building, Users, User, BadgeCheck, Info, Star, User as UserIcon, CheckCircle } from "lucide-react";
import { Usuario } from '@/lib/firebase/firestore';
import { getDocumentURLSimplificado } from '@/lib/firebase/storage';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog as ConfirmDialog, DialogContent as ConfirmDialogContent, DialogHeader as ConfirmDialogHeader, DialogTitle as ConfirmDialogTitle, DialogFooter as ConfirmDialogFooter } from '@/components/ui/dialog';
import { actualizarUsuario, getTenantInvitations, TenantInvitation } from '@/lib/firebase/firestore';
import { toast } from 'sonner';

interface RevisarDocumentosDialogProps {
    usuario: Usuario;
    onClose: () => void;
    todosLosUsuarios: Usuario[];
    getResidencialNombre: (id: string) => string;
    onAprobarUsuario: (usuario: Usuario) => void;
    onRechazarUsuario: (usuario: Usuario, motivo: string) => void;
}

const RevisarDocumentosDialog: React.FC<RevisarDocumentosDialogProps> = ({
    usuario,
    onClose,
    todosLosUsuarios,
    getResidencialNombre,
    onAprobarUsuario,
    onRechazarUsuario
}) => {
    const identificacionPath = (usuario as any).identificacionPath || null;
    const comprobantePath = (usuario as any).comprobantePath || null;

    const [identificacionUrl, setIdentificacionUrl] = useState<string | null>(null);
    const [comprobanteUrl, setComprobanteUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    const [showAprobar, setShowAprobar] = useState(false);
    const [showRechazar, setShowRechazar] = useState(false);
    const [isAprobando, setIsAprobando] = useState(false);
    const [isRechazando, setIsRechazando] = useState(false);
    // Motivos de rechazo simplificados
    const motivos = [
        'El nombre del usuario no corresponde con la identificación.',
        'El comprobante de domicilio no corresponde con el domicilio registrado.',
        'Documentos ilegibles o incompletos.'
    ];
    const [motivoSeleccionado, setMotivoSeleccionado] = useState('');
    const [motivoOtro, setMotivoOtro] = useState('');

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        Promise.all([
            identificacionPath ? getDocumentURLSimplificado(identificacionPath) : Promise.resolve(null),
            comprobantePath ? getDocumentURLSimplificado(comprobantePath) : Promise.resolve(null)
        ]).then(([idUrl, compUrl]) => {
            if (isMounted) {
                setIdentificacionUrl(idUrl);
                setComprobanteUrl(compUrl);
                setLoading(false);
            }
        });
        return () => { isMounted = false; };
    }, [identificacionPath, comprobantePath]);

    // Filtrar usuarios aprobados ligados al mismo houseID (excepto el actual)
    const usuariosMismaCasa = (usuario.houseID && usuario.houseID !== "")
        ? todosLosUsuarios.filter(u => u.houseID === usuario.houseID && u.id !== usuario.id && u.status === 'approved')
        : [];

    // Helper para mostrar propietario/renta
    const ownershipLabel = (status?: string, isOwner?: boolean) => {
        if ((isOwner === true) || status === 'own') return 'Propietario';
        if ((isOwner === false) || status === 'rent') return 'Inquilino';
        return 'No especificado';
    };

    // Helper para mostrar domicilio
    const domicilio = usuario.calle || usuario.houseNumber
        ? `${usuario.calle || ''}${usuario.houseNumber ? ' #' + usuario.houseNumber : ''}`
        : 'No disponible';

    // Helper para mostrar residencial (nombre)
    const residencialNombre = getResidencialNombre ? getResidencialNombre(usuario.residencialID) : usuario.residencialID || 'No disponible';

    // Helper para mostrar rol legible
    const rolLabel = (rol: string) => {
        switch (rol) {
            case 'resident': return 'Residente';
            case 'admin': return 'Administrador';
            case 'security': return 'Seguridad';
            case 'guest': return 'Invitado';
            default: return rol;
        }
    };

    const handleAprobar = async () => {
        if (!usuario.id) return;
        setIsAprobando(true);
        const loadingToast = toast.loading('Aprobando usuario...');
        try {
            // ✅ CORREGIDO: Usar la función onAprobarUsuario en lugar de actualizarUsuario directamente
            // Esto asegura que se actualice la tabla principal
            await onAprobarUsuario(usuario);
            toast.dismiss(loadingToast);
            toast.success('Usuario aprobado correctamente');
            setShowAprobar(false);
            onClose();
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error('Error al aprobar usuario');
        } finally {
            setIsAprobando(false);
        }
    };

    const handleRechazar = async () => {
        if (!usuario.id) return;
        const motivo = motivoSeleccionado === 'Otro' ? motivoOtro : motivoSeleccionado;
        setIsRechazando(true);
        const loadingToast = toast.loading('Rechazando usuario...');
        try {
            // ✅ CORREGIDO: Usar la función onRechazarUsuario en lugar de actualizarUsuario directamente
            // Esto asegura que se actualice la tabla principal
            await onRechazarUsuario(usuario, motivo);
            toast.dismiss(loadingToast);
            toast.success('Usuario rechazado correctamente');
            setShowRechazar(false);
            onClose();
        } catch (error) {
            toast.dismiss(loadingToast);
            toast.error('Error al rechazar usuario');
        } finally {
            setIsRechazando(false);
        }
    };

    return (
        <DialogContent className="w-full max-w-full md:max-w-5xl max-h-[90vh] overflow-y-auto p-0">
            {/* Encabezado compacto */}
            <div className="flex flex-col gap-1 p-3 border-b bg-muted/60">
                <div className="flex items-center gap-2">
                    <Avatar className="h-10 w-10">
                        <AvatarImage src="" />
                        <AvatarFallback>{usuario.fullName?.charAt(0)}{usuario.paternalLastName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-base truncate">{usuario.fullName} {usuario.paternalLastName} {usuario.maternalLastName}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-xs font-semibold">{rolLabel(usuario.role)}</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs font-semibold">{ownershipLabel(usuario.ownershipStatus, (usuario as any).isOwner)}</span>
                </div>
                <div className="flex items-center gap-2 text-sm mt-1 flex-wrap">
                    <Home className="h-4 w-4 text-blue-700" />
                    <span className="font-medium text-blue-900 break-words">{domicilio}</span>
                    <Building className="h-4 w-4 text-blue-700 ml-2" />
                    <span className="font-medium text-blue-900 break-words">{residencialNombre}</span>
                    <Mail className="h-4 w-4 text-muted-foreground ml-2" />
                    <span className="break-all">{usuario.email}</span>
                    {usuario.telefono && <><Phone className="h-4 w-4 text-muted-foreground ml-2" /><span className="break-all">{usuario.telefono}</span></>}
                </div>
            </div>

            {/* Tipo de usuario - Detección automática */}
            <div className="w-full flex flex-col md:flex-row items-center gap-2 px-3 py-3 border-b">
                {(() => {
                    const principal = todosLosUsuarios.find(u => u.houseID === usuario.houseID && u.isPrimaryUser && u.status === 'approved');
                    const esOwner = (usuario as any).isOwner === true || usuario.ownershipStatus === 'own';
                    const esPrincipal = usuario.isPrimaryUser;
                    const [showInfo, setShowInfo] = useState(false);
                    const principalYaExiste = principal && principal.id !== usuario.id;

                    return (
                        <div className="flex items-center gap-3 w-full">
                            {/* Indicador automático de tipo de usuario */}
                            <div className="flex items-center gap-2">
                                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${esOwner
                                        ? 'bg-blue-50 border-blue-200 text-blue-800'
                                        : esPrincipal
                                            ? 'bg-purple-50 border-purple-200 text-purple-800'
                                            : 'bg-green-50 border-green-200 text-green-800'
                                    }`}>
                                    {esOwner ? (
                                        <>
                                            <Building className="h-4 w-4 text-blue-600" />
                                            <span className="font-medium text-sm">Propietario</span>
                                        </>
                                    ) : esPrincipal ? (
                                        <>
                                            <Star className="h-4 w-4 text-yellow-500" />
                                            <span className="font-medium text-sm">Inquilino Principal</span>
                                        </>
                                    ) : (
                                        <>
                                            <UserIcon className="h-4 w-4 text-green-600" />
                                            <span className="font-medium text-sm">Inquilino Secundario</span>
                                        </>
                                    )}
                                </div>

                                {/* Badge de información */}
                                <div className="text-xs text-muted-foreground">
                                    {esOwner
                                        ? "Dueño de la propiedad"
                                        : esPrincipal
                                            ? "Responsable de la aplicación"
                                            : "Usuario autorizado"
                                    }
                                </div>
                            </div>

                            {/* Botón de información */}
                            <div className="relative">
                                <button
                                    type="button"
                                    className="p-2 rounded-full hover:bg-muted transition-colors"
                                    onClick={() => setShowInfo(!showInfo)}
                                    title="Información sobre tipos de usuario"
                                >
                                    <Info className="h-5 w-5 text-blue-500" />
                                </button>
                                {showInfo && (
                                    <div className="absolute left-12 top-0 z-50 bg-white border rounded shadow-lg p-3 text-xs w-80 max-w-sm">
                                        <div className="grid grid-cols-1 gap-3">
                                            <div>
                                                <div className="font-semibold mb-1 text-blue-700">🧑‍💼 Usuario Principal</div>
                                                <div className="text-xs mb-1">Responsable legal de la cuenta y uso de la aplicación. Se asigna automáticamente según el orden de registro.</div>
                                            </div>
                                            <div>
                                                <div className="font-semibold mb-1 text-green-700">👤 Usuario Secundario</div>
                                                <div className="text-xs mb-1">Usuario autorizado vinculado al principal. Familiar o habitante de la misma dirección.</div>
                                            </div>
                                        </div>
                                        <div className="border-t pt-2 mt-2">
                                            <div className="font-semibold text-xs mb-1">ℹ️ Detección automática:</div>
                                            <div className="text-xs">
                                                <b>Primer inquilino registrado</b> → Principal<br />
                                                <b>Segundo inquilino registrado</b> → Secundario<br />
                                                <span className="text-muted-foreground">Se determina automáticamente al crear la invitación</span>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Información adicional si es necesario */}
                            {principalYaExiste && !esPrincipal && (
                                <span className="text-xs text-blue-600 ml-2">
                                    <Info className="h-3 w-3 inline mr-1" />
                                    Principal: <strong>{principal.fullName} {principal.paternalLastName}</strong>
                                </span>
                            )}
                        </div>
                    );
                })()}
            </div>

            {/* Usuarios aprobados ligados compacto (solo para inquilinos) */}
            {((usuario as any).isOwner === false || usuario.ownershipStatus === 'rent') && (
                <div className="w-full px-3 py-2">
                    <div className="flex items-center gap-2 font-semibold text-sm mb-1">
                        <Users className="h-4 w-4 text-blue-500" />
                        Usuarios aprobados ligados a este domicilio ({usuariosMismaCasa.length})
                    </div>
                    {usuariosMismaCasa.length === 0 ? (
                        <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 bg-muted rounded">
                            <User className="h-4 w-4" /> No hay otros usuarios aprobados ligados a este domicilio.
                        </div>
                    ) : (
                        <div className="border rounded p-1 bg-muted w-full overflow-x-auto">
                            <ul className="divide-y divide-muted-foreground/10">
                                {usuariosMismaCasa.map(u => (
                                    <li key={u.id} className="py-1 flex flex-row items-center gap-2 w-full text-xs">
                                        <Avatar className="h-6 w-6">
                                            <AvatarImage src="" />
                                            <AvatarFallback>{u.fullName?.charAt(0)}{u.paternalLastName?.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <span className="font-medium break-words">{u.fullName} {u.paternalLastName}</span>
                                        <span className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-1 py-0.5 rounded">{rolLabel(u.role)}</span>
                                        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-1 py-0.5 rounded">{ownershipLabel(u.ownershipStatus, (u as any).isOwner)}</span>
                                        <Mail className="h-3 w-3 ml-2" /> {u.email}
                                        {u.telefono && <><Phone className="h-3 w-3 ml-2" /> {u.telefono}</>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}

            {/* Códigos de inquilinos (solo para propietarios que rentan) */}
            {((usuario as any).isOwner === true || usuario.ownershipStatus === 'own') && (usuario as any).tenantCodes && (usuario as any).tenantCodes.length > 0 && (() => {
                // Estado para las invitaciones
                const [invitaciones, setInvitaciones] = useState<TenantInvitation[]>([]);
                const [loadingInvitaciones, setLoadingInvitaciones] = useState(true);

                // Cargar invitaciones cuando el componente se monta
                useEffect(() => {
                    const cargarInvitaciones = async () => {
                        try {
                            setLoadingInvitaciones(true);
                            const invitacionesData = await getTenantInvitations(usuario.residencialID);
                            const invitacionesDelPropietario = invitacionesData.filter(inv =>
                                inv.ownerId === usuario.id &&
                                (usuario as any).tenantCodes.includes(inv.code)
                            );
                            setInvitaciones(invitacionesDelPropietario);
                        } catch (error) {
                            console.error('Error cargando invitaciones:', error);
                        } finally {
                            setLoadingInvitaciones(false);
                        }
                    };

                    cargarInvitaciones();
                }, [usuario.id, usuario.residencialID]);

                return (
                    <div className="w-full px-3 py-2 border-t">
                        <div className="flex items-center gap-2 font-semibold text-sm mb-2">
                            <Home className="h-4 w-4 text-purple-500" />
                            Códigos de Inquilinos Autorizados ({(usuario as any).tenantCodes.length})
                        </div>

                        {loadingInvitaciones ? (
                            <div className="flex items-center justify-center py-4">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-purple-500"></div>
                                <span className="ml-2 text-sm text-gray-500">Cargando invitaciones...</span>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {(usuario as any).tenantCodes.map((codigo: string, index: number) => {
                                    // Buscar invitación para este código
                                    const invitacion = invitaciones.find(inv => inv.code === codigo);

                                    return (
                                        <div key={index} className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                                            <div className="flex items-center justify-between mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-medium text-purple-700">Código #{index + 1}</span>
                                                    <span className="font-mono text-sm font-bold text-purple-800">{codigo}</span>
                                                </div>
                                                <span className={`text-xs px-2 py-1 rounded-full ${invitacion?.isUsed
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-yellow-100 text-yellow-700'
                                                    }`}>
                                                    {invitacion?.isUsed ? '✅ Registrado' : '⏳ Pendiente'}
                                                </span>
                                            </div>

                                            {invitacion ? (
                                                <div className="flex items-center gap-2">
                                                    <Avatar className="h-6 w-6">
                                                        <AvatarFallback className="text-xs">
                                                            {invitacion.tenantName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?'}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-sm font-medium text-purple-900 truncate">
                                                            {invitacion.tenantName || 'Sin nombre'}
                                                        </p>
                                                        <p className="text-xs text-purple-600 truncate">
                                                            {invitacion.tenantEmail || 'Sin email'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex items-center gap-2 text-purple-600">
                                                    <UserIcon className="h-4 w-4" />
                                                    <span className="text-sm">Sin usar</span>
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                        <p className="text-xs text-purple-600 mt-3">
                            ℹ️ Estos códigos pueden ser usados por inquilinos para registrarse en esta propiedad
                        </p>
                    </div>
                );
            })()}

            {/* Documentos según tipo de usuario */}
            <div className="w-full mt-2 px-3 pb-3">
                {/* Badge informativo sobre tipo de usuario */}
                <div className="mb-4 flex items-center gap-2">
                    {((usuario as any).isOwner === true || usuario.ownershipStatus === 'own') ? (
                        <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 border border-blue-200 rounded-lg">
                            <Building className="h-4 w-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">Propietario</span>
                            <span className="text-xs text-blue-600">Requiere identificación + comprobante</span>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
                            <Home className="h-4 w-4 text-green-600" />
                            <span className="text-sm font-medium text-green-800">Inquilino</span>
                            <span className="text-xs text-green-600">Solo requiere identificación</span>
                        </div>
                    )}
                </div>

                <div className={`flex flex-col gap-4 ${((usuario as any).isOwner === true || usuario.ownershipStatus === 'own') ? 'md:flex-row' : ''}`}>
                    {/* Identificación (siempre se muestra) */}
                    <div className={`bg-white rounded-md p-1 flex flex-col items-center border min-h-[180px] shadow-sm ${((usuario as any).isOwner === true || usuario.ownershipStatus === 'own') ? 'flex-1' : 'w-full max-w-md mx-auto'}`}>
                        <div className="flex items-center w-full justify-between mb-1">
                            <p className="font-medium text-sm text-blue-900">Identificación Oficial</p>
                            {identificacionUrl && (
                                <div className="flex gap-1">
                                    <Button variant="outline" size="icon" onClick={() => window.open(identificacionUrl, '_blank')} title="Abrir en nueva pestaña"><ExternalLink className="h-4 w-4" /></Button>
                                </div>
                            )}
                        </div>
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-2">
                                <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground mb-1" />
                                <p className="text-xs text-muted-foreground">Cargando documento...</p>
                            </div>
                        ) : identificacionUrl ? (
                            <TransformWrapper initialScale={1} minScale={1} maxScale={5} wheel={{ step: 0.2 }}>
                                {({ zoomIn, zoomOut, resetTransform }) => (
                                    <>
                                        <div className="flex gap-1 mb-1 w-full justify-end">
                                            <Button variant="outline" size="icon" onClick={() => zoomIn()} title="Acercar">+</Button>
                                            <Button variant="outline" size="icon" onClick={() => zoomOut()} title="Alejar">-</Button>
                                            <Button variant="outline" size="icon" onClick={() => resetTransform()} title="Restablecer zoom">⟳</Button>
                                        </div>
                                        <div className="w-full max-w-full max-h-[30vh] md:max-h-[40vh] flex items-center justify-center overflow-hidden rounded border bg-gray-50">
                                            <TransformComponent>
                                                <img
                                                    src={identificacionUrl}
                                                    alt="Identificación"
                                                    className="w-full max-w-full max-h-[30vh] md:max-h-[40vh] object-contain select-none"
                                                    style={{ height: 'auto' }}
                                                    draggable={false}
                                                />
                                            </TransformComponent>
                                        </div>
                                    </>
                                )}
                            </TransformWrapper>
                        ) : (
                            <div className="flex flex-col items-center justify-center p-2 text-center">
                                <XCircle className="h-6 w-6 text-red-500 mb-1" />
                                <p className="text-xs text-muted-foreground mb-1">No se subió identificación o no se pudo cargar</p>
                            </div>
                        )}
                    </div>

                    {/* Comprobante de domicilio (solo para propietarios) */}
                    {((usuario as any).isOwner === true || usuario.ownershipStatus === 'own') ? (
                        <div className="flex-1 bg-white rounded-md p-1 flex flex-col items-center border min-h-[180px] shadow-sm">
                            <div className="flex items-center w-full justify-between mb-1">
                                <p className="font-medium text-sm text-blue-900">Comprobante de domicilio</p>
                                {comprobanteUrl && (
                                    <div className="flex gap-1">
                                        <Button variant="outline" size="icon" onClick={() => window.open(comprobanteUrl, '_blank')} title="Abrir en nueva pestaña"><ExternalLink className="h-4 w-4" /></Button>
                                    </div>
                                )}
                            </div>
                            {loading ? (
                                <div className="flex flex-col items-center justify-center p-2">
                                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground mb-1" />
                                    <p className="text-xs text-muted-foreground">Cargando documento...</p>
                                </div>
                            ) : comprobanteUrl ? (
                                <TransformWrapper initialScale={1} minScale={1} maxScale={5} wheel={{ step: 0.2 }}>
                                    {({ zoomIn, zoomOut, resetTransform }) => (
                                        <>
                                            <div className="flex gap-1 mb-1 w-full justify-end">
                                                <Button variant="outline" size="icon" onClick={() => zoomIn()} title="Acercar">+</Button>
                                                <Button variant="outline" size="icon" onClick={() => zoomOut()} title="Alejar">-</Button>
                                                <Button variant="outline" size="icon" onClick={() => resetTransform()} title="Restablecer zoom">⟳</Button>
                                            </div>
                                            <div className="w-full max-w-full max-h-[30vh] md:max-h-[40vh] flex items-center justify-center overflow-hidden rounded border bg-gray-50">
                                                <TransformComponent>
                                                    <img
                                                        src={comprobanteUrl}
                                                        alt="Comprobante de domicilio"
                                                        className="w-full max-w-full max-h-[30vh] md:max-h-[40vh] object-contain select-none"
                                                        style={{ height: 'auto' }}
                                                        draggable={false}
                                                    />
                                                </TransformComponent>
                                            </div>
                                        </>
                                    )}
                                </TransformWrapper>
                            ) : (
                                <div className="flex flex-col items-center justify-center p-2 text-center">
                                    <XCircle className="h-6 w-6 text-red-500 mb-1" />
                                    <p className="text-xs text-muted-foreground mb-1">No se subió comprobante o no se pudo cargar</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Mensaje informativo para inquilinos */
                        <div className="w-full max-w-md mx-auto mt-4">
                            <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-200 rounded-lg">
                                <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-green-800">Documentos completos</p>
                                    <p className="text-xs text-green-600 mt-1">
                                        Los inquilinos solo requieren identificación oficial.
                                        No es necesario subir comprobante de domicilio.
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Validación de email para inquilinos */}
                {usuario.ownershipStatus === 'rent' && !usuario.email && (
                    <div className="mt-4 w-full">
                        <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <XCircle className="h-5 w-5 text-red-600 flex-shrink-0" />
                            <div>
                                <p className="text-sm font-medium text-red-800">Email requerido</p>
                                <p className="text-xs text-red-600 mt-1">
                                    Los inquilinos deben tener un email válido para recibir invitaciones.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Botones de aprobar/rechazar al final del modal */}
            <div className="w-full flex flex-col md:flex-row gap-4 justify-center items-center mt-6 mb-2 px-3">
                <Button
                    variant="destructive"
                    size="lg"
                    className="flex-1 md:flex-none md:w-48"
                    onClick={() => setShowRechazar(true)}
                    disabled={isAprobando || isRechazando}
                >
                    {isRechazando ? 'Rechazando...' : 'Rechazar solicitud'}
                </Button>
                <Button
                    variant="default"
                    size="lg"
                    className="flex-1 md:flex-none md:w-48 bg-green-600 hover:bg-green-700 text-white"
                    onClick={() => setShowAprobar(true)}
                    disabled={isAprobando || isRechazando}
                >
                    {isAprobando ? 'Aprobando...' : 'Aprobar solicitud'}
                </Button>
            </div>

            {/* Dialogo de confirmación de aprobación */}
            <ConfirmDialog open={showAprobar} onOpenChange={setShowAprobar}>
                <ConfirmDialogContent>
                    <ConfirmDialogHeader>
                        <ConfirmDialogTitle>Confirmar aprobación</ConfirmDialogTitle>
                    </ConfirmDialogHeader>
                    <div className="py-4 text-center text-base">¿Estás seguro de aprobar a este usuario? Esta acción no se puede deshacer.</div>
                    <ConfirmDialogFooter>
                        <Button variant="outline" onClick={() => setShowAprobar(false)} disabled={isAprobando}>Cancelar</Button>
                        <Button
                            variant="default"
                            className="bg-green-600 hover:bg-green-700 text-white"
                            onClick={handleAprobar}
                            disabled={isAprobando}
                        >
                            {isAprobando ? 'Aprobando...' : 'Confirmar aprobación'}
                        </Button>
                    </ConfirmDialogFooter>
                </ConfirmDialogContent>
            </ConfirmDialog>

            {/* Dialogo de motivos de rechazo */}
            <ConfirmDialog open={showRechazar} onOpenChange={setShowRechazar}>
                <ConfirmDialogContent>
                    <ConfirmDialogHeader>
                        <ConfirmDialogTitle>Motivo de rechazo</ConfirmDialogTitle>
                    </ConfirmDialogHeader>
                    <div className="py-2">
                        <div className="flex flex-col gap-2">
                            {motivos.map((motivo, idx) => (
                                <label key={motivo} className="flex items-center gap-2 cursor-pointer">
                                    <input type="radio" name="motivoRechazo" value={motivo} checked={motivoSeleccionado === motivo} onChange={() => { setMotivoSeleccionado(motivo); setMotivoOtro(''); }} />
                                    <span className="text-sm">{motivo}</span>
                                </label>
                            ))}
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input type="radio" name="motivoRechazo" value="Otro" checked={motivoSeleccionado === 'Otro'} onChange={() => setMotivoSeleccionado('Otro')} />
                                <span className="text-sm">Otro</span>
                            </label>
                            {motivoSeleccionado === 'Otro' && (
                                <textarea className="w-full border rounded p-2 text-sm mt-1" rows={2} placeholder="Especifica el motivo..." value={motivoOtro} onChange={e => setMotivoOtro(e.target.value)} />
                            )}
                        </div>
                    </div>
                    <ConfirmDialogFooter>
                        <Button variant="outline" onClick={() => setShowRechazar(false)} disabled={isRechazando}>Cancelar</Button>
                        <Button
                            variant="destructive"
                            disabled={motivoSeleccionado === '' || (motivoSeleccionado === 'Otro' && motivoOtro.trim() === '') || isRechazando}
                            onClick={handleRechazar}
                        >
                            {isRechazando ? 'Rechazando...' : 'Confirmar rechazo'}
                        </Button>
                    </ConfirmDialogFooter>
                </ConfirmDialogContent>
            </ConfirmDialog>
        </DialogContent>
    );
};

export default RevisarDocumentosDialog; 