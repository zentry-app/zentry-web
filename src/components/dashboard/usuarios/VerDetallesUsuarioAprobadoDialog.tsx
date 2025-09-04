import React, { useEffect, useState } from 'react';
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, XCircle, RefreshCw, Mail, Phone, Home, Building, Users, User, BadgeCheck, Info, Star, User as UserIcon, CheckCircle, Copy, Hash, FileText } from "lucide-react";
import { Usuario } from '@/lib/firebase/firestore';
import { getDocumentURLSimplificado } from '@/lib/firebase/storage';
import { TransformWrapper, TransformComponent } from 'react-zoom-pan-pinch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getTenantInvitations, TenantInvitation } from '@/lib/firebase/firestore';
import { db } from '@/lib/firebase/config';
import { collection, query, where, getDocs, limit as fbLimit } from 'firebase/firestore';

interface VerDetallesUsuarioAprobadoDialogProps {
  usuario: Usuario;
  onClose: () => void;
  todosLosUsuarios: Usuario[];
  getResidencialNombre: (id: string) => string;
  tipoVista?: 'residentes' | 'seguridad' | 'administradores'; // Controla qué información mostrar
}

const VerDetallesUsuarioAprobadoDialog: React.FC<VerDetallesUsuarioAprobadoDialogProps> = ({ 
  usuario, 
  onClose, 
  todosLosUsuarios, 
  getResidencialNombre,
  tipoVista = 'residentes'
}) => {
  const identificacionPath = (usuario as any).identificacionPath || null;
  const comprobantePath = (usuario as any).comprobantePath || null;

  const [identificacionUrl, setIdentificacionUrl] = useState<string|null>(null);
  const [comprobanteUrl, setComprobanteUrl] = useState<string|null>(null);
  const [loading, setLoading] = useState(true);
  const [copiado, setCopiado] = useState(false);

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

  // Usuarios ligados cargados directamente desde Firestore (independiente de la paginación)
  const [usuariosLigados, setUsuariosLigados] = useState<Usuario[]>([]);
  const [loadingLigados, setLoadingLigados] = useState<boolean>(false);

  useEffect(() => {
    let isActive = true;
    const cargarUsuariosLigados = async () => {
      if (tipoVista !== 'residentes') {
        setUsuariosLigados([]);
        return;
      }
      // Necesitamos al menos un identificador de domicilio
      const tieneHouseId = !!(usuario.houseID && usuario.houseID !== '');
      const tieneDireccion = !!(usuario.calle && usuario.houseNumber);
      if (!tieneHouseId && !tieneDireccion) {
        setUsuariosLigados([]);
        return;
      }
      setLoadingLigados(true);
      try {
        const usuariosRef = collection(db, 'usuarios');
        let encontrados: Usuario[] = [];

        // 1) Buscar por houseID (campo actual)
        if (tieneHouseId) {
          try {
            const q1 = query(usuariosRef, where('houseID', '==', usuario.houseID as string), fbLimit(50));
            const snap1 = await getDocs(q1);
            encontrados = snap1.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as unknown as Usuario[];
          } catch (e) {
            // Ignorar y continuar con fallback
          }
          // 1b) Fallback por campo legacy 'houseId'
          if (encontrados.length === 0) {
            try {
              const q1b = query(usuariosRef, where('houseId', '==', usuario.houseID as string), fbLimit(50));
              const snap1b = await getDocs(q1b);
              encontrados = snap1b.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as unknown as Usuario[];
            } catch (e) {
              // Ignorar y continuar
            }
          }
        }

        // 2) Fallback: por dirección exacta si no hubo resultados por houseID
        if (encontrados.length === 0 && tieneDireccion) {
          try {
            const q2 = query(
              usuariosRef,
              where('residencialID', '==', usuario.residencialID || ''),
              where('calle', '==', usuario.calle || ''),
              where('houseNumber', '==', usuario.houseNumber || ''),
            );
            const snap2 = await getDocs(q2);
            encontrados = snap2.docs.map(d => ({ id: d.id, ...(d.data() as any) })) as unknown as Usuario[];
          } catch (e) {
            // Puede requerir índice compuesto; si falla, intentamos con filtro local desde todosLosUsuarios
          }
        }

        // 3) Último fallback: usar todosLosUsuarios (paginados) para al menos mostrar algo
        if (encontrados.length === 0) {
          if (tieneHouseId) {
            encontrados = todosLosUsuarios.filter(u => u.houseID === usuario.houseID);
          } else if (tieneDireccion) {
            encontrados = todosLosUsuarios.filter(u => (
              (u.residencialID === usuario.residencialID) &&
              (u.calle === usuario.calle) &&
              (u.houseNumber === usuario.houseNumber)
            ));
          }
        }

        // Filtrar aprobado, excluir actual, deduplicar por id
        const depurados = Array.from(
          new Map(
            encontrados
              .filter(u => u.id !== usuario.id && u.status === 'approved')
              .map(u => [u.id, u])
          ).values()
        ) as Usuario[];

        if (isActive) {
          setUsuariosLigados(depurados);
        }
      } catch (error) {
        console.error('Error cargando usuarios ligados:', error);
        if (isActive) setUsuariosLigados([]);
      } finally {
        if (isActive) setLoadingLigados(false);
      }
    };
    cargarUsuariosLigados();
    return () => { isActive = false; };
  }, [tipoVista, usuario.id, usuario.houseID, usuario.calle, usuario.houseNumber, usuario.residencialID, db, todosLosUsuarios]);

  // Debug: Verificar que se estén detectando usuarios en la misma casa (FireStore based)
  console.log('🔍 [VerDetallesUsuarioAprobadoDialog] Usuarios ligados:', {
    usuarioId: usuario.id,
    houseID: usuario.houseID,
    tipoVista,
    count: usuariosLigados.length
  });

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

  // Función para copiar UID al portapapeles
  const copiarUID = async () => {
    try {
      await navigator.clipboard.writeText(usuario.id || '');
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch (error) {
      console.error('Error copiando UID:', error);
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
          {/* Información de propietario/inquilino - solo mostrar para residentes */}
          {tipoVista === 'residentes' && (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs font-semibold">{ownershipLabel(usuario.ownershipStatus, (usuario as any).isOwner)}</span>
          )}
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-green-100 text-green-800 text-xs font-semibold">
            <CheckCircle className="h-3 w-3 mr-1" />
            Aprobado
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm mt-1 flex-wrap">
          {/* Información de domicilio - solo mostrar para residentes */}
          {tipoVista === 'residentes' && (
            <>
          <Home className="h-4 w-4 text-blue-700" />
          <span className="font-medium text-blue-900 break-words">{domicilio}</span>
            </>
          )}
          <Building className="h-4 w-4 text-blue-700 ml-2" />
          <span className="font-medium text-blue-900 break-words">{residencialNombre}</span>
          <Mail className="h-4 w-4 text-muted-foreground ml-2" />
          <span className="break-all">{usuario.email}</span>
          {usuario.telefono && <><Phone className="h-4 w-4 text-muted-foreground ml-2" /><span className="break-all">{usuario.telefono}</span></>}
        </div>
        
        {/* UID para búsqueda en Firestore */}
        <div className="flex items-center gap-2 text-sm mt-1">
          <Hash className="h-4 w-4 text-gray-600" />
          <span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded">
            {usuario.id || 'Sin UID'}
          </span>
          <button
            onClick={copiarUID}
            className="p-1 hover:bg-gray-200 rounded transition-colors"
            title="Copiar UID"
          >
            <Copy className={`h-3 w-3 ${copiado ? 'text-green-600' : 'text-gray-500'}`} />
          </button>
          {copiado && (
            <span className="text-xs text-green-600">¡Copiado!</span>
          )}
        </div>
      </div>

      {/* Tipo de usuario - Detección automática - solo mostrar para residentes */}
      {tipoVista === 'residentes' && (
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
                <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 ${
                  esOwner 
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
      )}

      {/* Usuarios aprobados ligados compacto (solo para residentes; datos desde Firestore) */}
      {tipoVista === 'residentes' && (
        <div className="w-full px-3 py-2">
          <div className="flex items-center gap-2 font-semibold text-sm mb-1">
            <Users className="h-4 w-4 text-blue-500" />
            Usuarios aprobados ligados a este domicilio ({usuariosLigados.length})
          </div>
          {loadingLigados ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 bg-muted rounded">
              <RefreshCw className="h-4 w-4 animate-spin" /> Cargando usuarios ligados...
            </div>
          ) : usuariosLigados.length === 0 ? (
            <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 bg-muted rounded">
              <User className="h-4 w-4" /> No hay otros usuarios aprobados ligados a este domicilio.
            </div>
          ) : (
            <div className="border rounded p-1 bg-muted w-full overflow-x-auto">
              <ul className="divide-y divide-muted-foreground/10">
                {usuariosLigados.map(u => (
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

      {/* Códigos de inquilinos (solo para propietarios que rentan y residentes) */}
      {tipoVista === 'residentes' && ((usuario as any).isOwner === true || usuario.ownershipStatus === 'own') && (usuario as any).tenantCodes && (usuario as any).tenantCodes.length > 0 && (() => {
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
                  
                  // Buscar si hay un usuario registrado con este código de invitación
                  const usuarioInquilino = todosLosUsuarios.find(u => 
                    u.invitationCode === codigo && u.status === 'approved'
                  );
                  
                  // Determinar el estado del inquilino
                  const isRegistrado = invitacion?.isUsed;
                  const isAprobado = usuarioInquilino && usuarioInquilino.status === 'approved';
                  
                  return (
                    <div key={index} className="p-3 bg-purple-50 border border-purple-200 rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium text-purple-700">Código #{index + 1}</span>
                          <span className="font-mono text-sm font-bold text-purple-800">{codigo}</span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isAprobado 
                            ? 'bg-green-100 text-green-700' 
                            : isRegistrado
                              ? 'bg-blue-100 text-blue-700'
                              : 'bg-yellow-100 text-yellow-700'
                        }`}>
                          {isAprobado ? '✅ Aprobado' : isRegistrado ? '📝 Registrado' : '⏳ Pendiente'}
                        </span>
                      </div>
                      
                      {usuarioInquilino ? (
                        // Mostrar información del usuario aprobado
                        <div className="flex items-center gap-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {usuarioInquilino.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-purple-900 truncate">
                              {usuarioInquilino.fullName} {usuarioInquilino.paternalLastName} {usuarioInquilino.maternalLastName}
                            </p>
                            <p className="text-xs text-purple-600 truncate">
                              {usuarioInquilino.email || 'Sin email'}
                            </p>
                          </div>
                        </div>
                      ) : invitacion ? (
                        // Mostrar información de la invitación
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

      {/* Información adicional del usuario aprobado */}
      <div className="w-full mt-2 px-3 pb-3">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium text-green-800">Usuario Aprobado</span>
            <span className="text-xs text-green-600">Acceso completo al sistema</span>
          </div>
        </div>

        {/* Información de registro */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Info className="h-4 w-4 text-blue-600" />
              Información de Registro
            </h4>
            <div className="space-y-1 text-xs">
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha de registro:</span>
                <span className="font-medium">
                  {usuario.createdAt ? new Date(usuario.createdAt.toDate()).toLocaleDateString('es-ES') : 'No disponible'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Fecha de aprobación:</span>
                <span className="font-medium">
                  {usuario.updatedAt ? new Date(usuario.updatedAt.toDate()).toLocaleDateString('es-ES') : 'No disponible'}
                </span>
              </div>
              {/* House ID - solo mostrar para residentes */}
              {tipoVista === 'residentes' && (
              <div className="flex justify-between">
                <span className="text-gray-600">House ID:</span>
                <span className="font-mono text-xs">{usuario.houseID || 'No disponible'}</span>
              </div>
              )}
            </div>
          </div>
          
          {/* Usuarios en la Misma Casa - solo mostrar para residentes; datos desde Firestore */}
          {tipoVista === 'residentes' && (
          <div className="bg-gray-50 rounded-lg p-3">
            <h4 className="font-medium text-sm mb-2 flex items-center gap-2">
              <Users className="h-4 w-4 text-purple-600" />
              Usuarios en la Misma Casa
            </h4>
            <div className="space-y-1 text-xs">
                {loadingLigados ? (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground p-2 bg-muted rounded">
                    <RefreshCw className="h-4 w-4 animate-spin" /> Cargando usuarios...
                  </div>
                ) : usuariosLigados.length > 0 ? (
                  usuariosLigados.map((u, index) => (
                  <div key={u.id} className="flex items-center gap-2">
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="text-xs">
                        {u.fullName?.split(' ').map((n: string) => n[0]).join('').toUpperCase() || '?'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="truncate">
                      {u.fullName} {u.paternalLastName}
                    </span>
                  </div>
                ))
              ) : (
                <span className="text-gray-500">No hay otros usuarios registrados</span>
              )}
            </div>
          </div>
          )}
        </div>

        {/* Documentos del usuario - Sección discreta */}
        <div className="mt-4">
          <details className="bg-gray-50 rounded-lg">
            <summary className="p-3 cursor-pointer hover:bg-gray-100 transition-colors">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-gray-600" />
                <span className="font-medium text-sm text-gray-700">Documentos del Usuario</span>
                <span className="text-xs text-gray-500">(Click para expandir)</span>
              </div>
            </summary>
            <div className="p-3 border-t">
              <div className={`grid gap-4 ${((usuario as any).isOwner === true || usuario.ownershipStatus === 'own') ? 'md:grid-cols-2' : 'md:grid-cols-1'}`}>
                {/* Identificación */}
                <div className="bg-white rounded-md p-3 border shadow-sm">
                  <div className="flex items-center justify-between mb-2">
                    <h5 className="font-medium text-sm text-gray-900">Identificación Oficial</h5>
                    {identificacionUrl && (
                      <Button variant="outline" size="sm" onClick={() => window.open(identificacionUrl, '_blank')} title="Abrir en nueva pestaña">
                        <ExternalLink className="h-3 w-3 mr-1" />
                        Ver
                      </Button>
                    )}
                  </div>
                  {loading ? (
                    <div className="flex items-center justify-center py-4">
                      <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
                      <span className="text-xs text-muted-foreground">Cargando...</span>
                    </div>
                  ) : identificacionUrl ? (
                    <div className="w-full h-32 bg-gray-100 rounded border overflow-hidden">
                      <img
                        src={identificacionUrl}
                        alt="Identificación"
                        className="w-full h-full object-cover"
                        draggable={false}
                      />
                    </div>
                  ) : (
                    <div className="flex items-center justify-center py-4 text-center">
                      <XCircle className="h-4 w-4 text-red-500 mr-2" />
                      <span className="text-xs text-muted-foreground">No disponible</span>
                    </div>
                  )}
                </div>

                {/* Comprobante de domicilio (solo para propietarios) */}
                {((usuario as any).isOwner === true || usuario.ownershipStatus === 'own') && (
                  <div className="bg-white rounded-md p-3 border shadow-sm">
                    <div className="flex items-center justify-between mb-2">
                      <h5 className="font-medium text-sm text-gray-900">Comprobante de Domicilio</h5>
                      {comprobanteUrl && (
                        <Button variant="outline" size="sm" onClick={() => window.open(comprobanteUrl, '_blank')} title="Abrir en nueva pestaña">
                          <ExternalLink className="h-3 w-3 mr-1" />
                          Ver
                        </Button>
                      )}
                    </div>
                    {loading ? (
                      <div className="flex items-center justify-center py-4">
                        <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground mr-2" />
                        <span className="text-xs text-muted-foreground">Cargando...</span>
                      </div>
                    ) : comprobanteUrl ? (
                      <div className="w-full h-32 bg-gray-100 rounded border overflow-hidden">
                        <img
                          src={comprobanteUrl}
                          alt="Comprobante de domicilio"
                          className="w-full h-full object-cover"
                          draggable={false}
                        />
                      </div>
                    ) : (
                      <div className="flex items-center justify-center py-4 text-center">
                        <XCircle className="h-4 w-4 text-red-500 mr-2" />
                        <span className="text-xs text-muted-foreground">No disponible</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </details>
        </div>
      </div>

      {/* Botón de cerrar al final */}
      <div className="w-full flex justify-center items-center mt-6 mb-2 px-3">
        <Button variant="outline" size="lg" className="w-48" onClick={onClose}>
          Cerrar
        </Button>
      </div>
    </DialogContent>
  );
};

export default VerDetallesUsuarioAprobadoDialog; 