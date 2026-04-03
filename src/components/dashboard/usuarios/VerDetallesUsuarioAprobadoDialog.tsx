import React, { useEffect, useState } from 'react';
import {
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, XCircle, RefreshCw, Mail, Phone, Home, Building, Users, User, BadgeCheck, Info, Star, User as UserIcon, CheckCircle, Copy, Hash, FileText } from "lucide-react";
import { Usuario } from '@/lib/firebase/firestore';
import { getDocumentURLSimplificado } from '@/lib/firebase/storage';
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

  const [identificacionUrl, setIdentificacionUrl] = useState<string | null>(null);
  const [comprobanteUrl, setComprobanteUrl] = useState<string | null>(null);
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
  }, [tipoVista, usuario.id, usuario.houseID, usuario.calle, usuario.houseNumber, usuario.residencialID, todosLosUsuarios]);

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
    <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white/95 backdrop-blur-2xl rounded-[2.5rem] border-none shadow-2xl ring-1 ring-white/50 flex flex-col h-[90vh]">
      {/* Premium Header */}
      <div className="relative bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-8 pb-10 shadow-lg z-10">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <svg className="w-64 h-64 text-white" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
          </svg>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
          <div className="h-24 w-24 rounded-[2rem] bg-indigo-500/20 backdrop-blur-md border border-white/20 flex items-center justify-center text-4xl font-black text-white shadow-2xl ring-4 ring-white/5">
            {usuario.fullName?.charAt(0) || "U"}
          </div>

          <div className="flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md">
                {usuario.fullName} <span className="text-indigo-200 opacity-60 font-light">{usuario.paternalLastName}</span>
              </h2>
              <div className="flex gap-2">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold backdrop-blur-sm uppercase tracking-wide">
                  <CheckCircle className="h-3.5 w-3.5" />
                  Aprobado
                </span>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-xs font-bold backdrop-blur-sm uppercase tracking-wide">
                  {rolLabel(usuario.role)}
                </span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-indigo-100/70 text-sm font-medium">
              {tipoVista === 'residentes' && (
                <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                  <Home className="h-4 w-4 text-indigo-300" />
                  <span>{domicilio}</span>
                </div>
              )}
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm">
                <Building className="h-4 w-4 text-indigo-300" />
                <span>{residencialNombre}</span>
              </div>
              <div className="flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-xl border border-white/10 backdrop-blur-sm group cursor-pointer hover:bg-white/10 transition-colors" onClick={copiarUID} title="Click para copiar UID">
                <Hash className="h-4 w-4 text-indigo-300" />
                <span className="font-mono opacity-80 group-hover:opacity-100">{usuario.id?.substring(0, 12)}...</span>
                {copiado && <CheckCircle className="h-3 w-3 text-green-400 ml-1 animate-in zoom-in" />}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Scrollable Content Area */}
      <div className="overflow-y-auto flex-1 bg-slate-50/50 p-6 md:p-8 space-y-6 scrollbar-thin scrollbar-thumb-slate-200 scrollbar-track-transparent">

        {/* Contact Info (Quick Access) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
            <div className="h-12 w-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600">
              <Mail className="h-6 w-6" />
            </div>
            <div className="overflow-hidden">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Correo Electrónico</div>
              <div className="text-sm font-semibold text-slate-700 truncate">{usuario.email}</div>
            </div>
          </div>

          {usuario.telefono && (
            <div className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
              <div className="h-12 w-12 rounded-2xl bg-purple-50 flex items-center justify-center text-purple-600">
                <Phone className="h-6 w-6" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">Teléfono</div>
                <div className="text-sm font-semibold text-slate-700">{usuario.telefono}</div>
              </div>
            </div>
          )}
        </div>

        {/* Tipo de Usuario Card (Solo Residentes) */}
        {tipoVista === 'residentes' && (
          <div className="bg-gradient-to-br from-indigo-50 to-white p-6 rounded-3xl border border-indigo-100 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 rounded-xl text-indigo-600">
                <UserIcon className="h-5 w-5" />
              </div>
              <h3 className="font-black text-indigo-900 text-lg tracking-tight">Tipo de Residente</h3>
            </div>

            {(() => {
              const principal = todosLosUsuarios.find(u => u.houseID === usuario.houseID && u.isPrimaryUser && u.status === 'approved');
              const esOwner = (usuario as any).isOwner === true || usuario.ownershipStatus === 'own';
              const esPrincipal = usuario.isPrimaryUser;
              const principalYaExiste = principal && principal.id !== usuario.id;

              return (
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                  <div className={`flex items-center gap-3 px-5 py-3 rounded-2xl border ${esOwner ? 'bg-blue-600 text-white border-blue-700 shadow-lg shadow-blue-200' :
                      esPrincipal ? 'bg-purple-600 text-white border-purple-700 shadow-lg shadow-purple-200' :
                        'bg-emerald-600 text-white border-emerald-700 shadow-lg shadow-emerald-200'
                    }`}>
                    {esOwner ? <Building className="h-5 w-5" /> : esPrincipal ? <Star className="h-5 w-5" /> : <UserIcon className="h-5 w-5" />}
                    <div>
                      <div className="font-bold text-sm leading-none">
                        {esOwner ? 'Propietario' : esPrincipal ? 'Inquilino Principal' : 'Inquilino Secundario'}
                      </div>
                      <div className="text-[10px] opacity-80 font-medium mt-1 uppercase tracking-wide">
                        {esOwner ? 'Dueño de la propiedad' : esPrincipal ? 'Responsable App' : 'Habitante Autorizado'}
                      </div>
                    </div>
                  </div>

                  {principalYaExiste && !esPrincipal && (
                    <div className="flex items-center gap-2 text-sm text-indigo-600 bg-indigo-50 px-3 py-2 rounded-xl border border-indigo-100">
                      <Info className="h-4 w-4" />
                      <span>Principal: <strong>{principal.fullName}</strong></span>
                    </div>
                  )}
                </div>
              );
            })()}
          </div>
        )}

        {/* Usuarios Ligados (Glass Card) */}
        {tipoVista === 'residentes' && (
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 p-6 opacity-5 pointer-events-none">
              <Users className="w-32 h-32 text-slate-900" />
            </div>

            <div className="flex items-center justify-between mb-6 relative z-10">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-slate-100 rounded-xl text-slate-700">
                  <Users className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg tracking-tight">Usuarios Vinculados</h3>
                  <p className="text-xs text-slate-500 font-medium">Otros residentes aprobados en el mismo domicilio</p>
                </div>
              </div>
              <span className="bg-slate-900 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg shadow-slate-200">
                {usuariosLigados.length}
              </span>
            </div>

            {loadingLigados ? (
              <div className="flex items-center justify-center p-8 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
                <RefreshCw className="h-6 w-6 animate-spin text-slate-400" />
                <span className="ml-3 text-sm font-medium text-slate-500">Buscando vinculaciones...</span>
              </div>
            ) : usuariosLigados.length === 0 ? (
              <div className="flex flex-col items-center justify-center p-8 bg-slate-50 rounded-2xl border border-slate-100 border-dashed text-center">
                <User className="h-8 w-8 text-slate-300 mb-2" />
                <span className="text-sm font-medium text-slate-400">No se encontraron otros usuarios vinculados.</span>
              </div>
            ) : (
              <div className="grid gap-3 relative z-10 max-h-[300px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-slate-200">
                {usuariosLigados.map(u => (
                  <div key={u.id} className="flex items-center justify-between p-4 bg-slate-50 hover:bg-white hover:shadow-md transition-all rounded-2xl border border-slate-100 group">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                        <AvatarFallback className="bg-slate-200 text-slate-600 font-bold text-sm">
                          {u.fullName?.charAt(0)}{u.paternalLastName?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-800 text-sm truncate">{u.fullName} {u.paternalLastName}</div>
                        <div className="text-xs text-slate-500 truncate flex items-center gap-1.5">
                          <span className={`w-1.5 h-1.5 rounded-full ${(u as any).isOwner ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                          {(u as any).isOwner ? 'Propietario' : 'Residente'}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      {u.email && (
                        <a href={`mailto:${u.email}`} className="p-2 bg-white rounded-xl text-slate-400 hover:text-blue-600 shadow-sm border border-slate-100 hover:border-blue-100 transition-colors">
                          <Mail className="h-4 w-4" />
                        </a>
                      )}
                      {u.telefono && (
                        <a href={`tel:${u.telefono}`} className="p-2 bg-white rounded-xl text-slate-400 hover:text-green-600 shadow-sm border border-slate-100 hover:border-green-100 transition-colors">
                          <Phone className="h-4 w-4" />
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Códigos de Inquilinos (Premium Card) */}
        {tipoVista === 'residentes' && ((usuario as any).isOwner === true || usuario.ownershipStatus === 'own') && (usuario as any).tenantCodes && (usuario as any).tenantCodes.length > 0 && (
          <TenantCodesSection
            codes={(usuario as any).tenantCodes}
            usuario={usuario}
            todosLosUsuarios={todosLosUsuarios}
          />
        )}

        {/* Sección Metadata e Info Técnica */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Info Registro */}
          <div className="bg-slate-900 text-slate-300 p-6 rounded-3xl shadow-lg relative overflow-hidden group">
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-500/20 rounded-full blur-3xl group-hover:bg-indigo-500/30 transition-all duration-500"></div>

            <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-6 relative z-10 flex items-center gap-2">
              <BadgeCheck className="h-4 w-4 text-emerald-400" />
              Metadata del Sistema
            </h3>

            <div className="space-y-4 relative z-10 text-xs font-mono">
              <div className="flex justify-between items-end border-b border-white/10 pb-2">
                <span className="opacity-60">ID Usuario (UID)</span>
                <span className="text-white truncate max-w-[150px]">{usuario.id}</span>
              </div>
              <div className="flex justify-between items-end border-b border-white/10 pb-2">
                <span className="opacity-60">Registrado</span>
                <span className="text-white">
                  {usuario.createdAt ? new Date(usuario.createdAt.toDate()).toLocaleDateString('es-ES', { dateStyle: 'long' }) : 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-end border-b border-white/10 pb-2">
                <span className="opacity-60">Aprobado</span>
                <span className="text-white">
                  {usuario.updatedAt ? new Date(usuario.updatedAt.toDate()).toLocaleDateString('es-ES', { dateStyle: 'long' }) : 'N/A'}
                </span>
              </div>
              {tipoVista === 'residentes' && (
                <div className="flex justify-between items-end border-b border-white/10 pb-2">
                  <span className="opacity-60">House ID Binding</span>
                  <span className="text-emerald-400 font-bold">{usuario.houseID || 'No vinculado'}</span>
                </div>
              )}
            </div>
          </div>

          {/* Documentos */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm flex flex-col justify-between">
            <div>
              <h3 className="font-black text-slate-900 text-lg mb-4 flex items-center gap-2">
                <FileText className="h-5 w-5 text-indigo-600" /> Documentación
              </h3>
              <p className="text-sm text-slate-500 font-medium leading-relaxed mb-6">
                Archivos digitales asociados a la cuenta. Disponibles para verificación visual inmediata.
              </p>
            </div>

            <div className="space-y-3">
              <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-indigo-50 hover:border-indigo-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white rounded-xl shadow-sm text-slate-400 group-hover:text-indigo-600">
                    <User className="h-4 w-4" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-900">Identificación Oficial</span>
                </div>
                {identificacionUrl ? (
                  <Button size="sm" variant="ghost" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 rounded-xl px-3 font-bold" onClick={() => window.open(identificacionUrl, '_blank')}>
                    Ver Archivo
                  </Button>
                ) : (
                  <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-1 rounded-md">PENDIENTE</span>
                )}
              </div>

              {((usuario as any).isOwner === true || usuario.ownershipStatus === 'own') && (
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100 flex items-center justify-between group hover:bg-indigo-50 hover:border-indigo-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-xl shadow-sm text-slate-400 group-hover:text-indigo-600">
                      <Home className="h-4 w-4" />
                    </div>
                    <span className="text-sm font-bold text-slate-700 group-hover:text-indigo-900">Comprobante Domicilio</span>
                  </div>
                  {comprobanteUrl ? (
                    <Button size="sm" variant="ghost" className="text-indigo-600 hover:text-indigo-700 hover:bg-indigo-100 rounded-xl px-3 font-bold" onClick={() => window.open(comprobanteUrl, '_blank')}>
                      Ver Archivo
                    </Button>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-200 px-2 py-1 rounded-md">PENDIENTE</span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Modern Footer */}
      <div className="p-6 bg-white border-t border-slate-100 flex justify-end items-center gap-4">
        <div className="mr-auto text-xs font-medium text-slate-400 hidden sm:block">
          ID: {usuario.uid?.substring(0, 8)} • Actualizado: {new Date().toLocaleDateString()}
        </div>
        <Button
          variant="outline"
          onClick={onClose}
          className="h-12 px-8 rounded-2xl border-slate-200 text-slate-600 font-bold hover:bg-slate-50 hover:text-slate-900 transition-all hover:scale-105 active:scale-95"
        >
          Cerrar Detalle
        </Button>
      </div>
    </DialogContent>
  );
};

// Helper component for Tenant Codes to avoid Hooks inside Render trap
const TenantCodesSection = ({ codes, usuario, todosLosUsuarios }: { codes: string[], usuario: Usuario, todosLosUsuarios: Usuario[] }) => {
  const [invitaciones, setInvitaciones] = useState<TenantInvitation[]>([]);
  const [loadingInvitaciones, setLoadingInvitaciones] = useState(true);

  useEffect(() => {
    let isActive = true;
    const cargarInvitaciones = async () => {
      try {
        setLoadingInvitaciones(true);
        const invitacionesData = await getTenantInvitations(usuario.residencialID);
        if (isActive) {
          const invitacionesDelPropietario = invitacionesData.filter(inv =>
            inv.ownerId === usuario.id &&
            codes.includes(inv.code)
          );
          setInvitaciones(invitacionesDelPropietario);
        }
      } catch (error) {
        console.error('Error cargando invitaciones:', error);
      } finally {
        if (isActive) setLoadingInvitaciones(false);
      }
    };
    cargarInvitaciones();
    return () => { isActive = false; };
  }, [usuario.id, usuario.residencialID, codes]);

  return (
    <div className="bg-gradient-to-br from-purple-50 to-white p-6 rounded-3xl border border-purple-100 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2 bg-purple-100 rounded-xl text-purple-600">
          <Home className="h-5 w-5" />
        </div>
        <div>
          <h3 className="font-black text-purple-900 text-lg tracking-tight">Códigos de Inquilinos</h3>
          <p className="text-xs text-purple-500 font-medium">Accesos generados para arrendamiento</p>
        </div>
      </div>

      {loadingInvitaciones ? (
        <div className="flex items-center justify-center p-6">
          <RefreshCw className="h-5 w-5 animate-spin text-purple-400" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {codes.map((codigo, index) => {
            const invitacion = invitaciones.find(inv => inv.code === codigo);
            const usuarioInquilino = todosLosUsuarios.find(u =>
              u.invitationCode === codigo && u.status === 'approved'
            );
            const isRegistrado = invitacion?.isUsed;
            const isAprobado = usuarioInquilino && usuarioInquilino.status === 'approved';

            return (
              <div key={index} className="bg-white p-4 rounded-2xl border border-purple-100 shadow-sm hover:shadow-md transition-all group">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-[10px] font-bold text-purple-400 uppercase tracking-widest">Código #{index + 1}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${isAprobado ? 'bg-emerald-100 text-emerald-700' : isRegistrado ? 'bg-blue-100 text-blue-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                    {isAprobado ? 'Activo' : isRegistrado ? 'Registrado' : 'Disponible'}
                  </span>
                </div>

                <div className="font-mono text-lg font-black text-slate-700 mb-3 bg-slate-50 px-3 py-1 rounded-lg text-center tracking-wider border border-slate-100 group-hover:bg-purple-50 group-hover:text-purple-700 group-hover:border-purple-100 transition-colors">
                  {codigo}
                </div>

                {usuarioInquilino ? (
                  <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100">
                    <div className="h-6 w-6 rounded-full bg-purple-100 flex items-center justify-center text-[10px] font-bold text-purple-700">
                      {usuarioInquilino.fullName?.charAt(0)}
                    </div>
                    <div className="text-xs font-bold text-slate-600 truncate">{usuarioInquilino.fullName}</div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-400 text-center mt-2 italic">Sin asignar</div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default VerDetallesUsuarioAprobadoDialog;
