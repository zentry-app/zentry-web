import React from 'react';
import { Dialog as HeadlessDialog } from '@headlessui/react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from 'lucide-react';
import { Usuario } from '@/lib/firebase/firestore'; // Asumiendo que la interfaz Usuario está aquí
import { Timestamp } from 'firebase/firestore'; // Para el tipo Timestamp

// Props que el componente DetallesUsuarioDialog necesitará
interface DetallesUsuarioDialogProps {
  usuarioSeleccionado: Usuario | null;
  showDialog: boolean;
  onClose: () => void;
  getResidencialNombre: (id: string) => string;
  getEstadoBadge: (estado: Usuario['status']) => React.ReactNode;
  getRolBadge: (rol: Usuario['role']) => React.ReactNode;
  mostrarDocumento: (ruta: string, nombre: string) => void;
}

const DetallesUsuarioDialog: React.FC<DetallesUsuarioDialogProps> = ({
  usuarioSeleccionado,
  showDialog,
  onClose,
  getResidencialNombre,
  getEstadoBadge,
  getRolBadge,
  mostrarDocumento,
}) => {
  if (!usuarioSeleccionado) return null;

  const formatearFecha = (timestamp: Timestamp | null | undefined) => {
    if (!timestamp) return "No disponible";
    return new Date(timestamp.seconds * 1000).toLocaleString();
  };

  const notificationSettings = usuarioSeleccionado.notificationSettings || {
    doNotDisturb: false,
    doNotDisturbEnd: "",
    doNotDisturbStart: "",
    emergencies: true,
    events: true,
    packages: true,
    visitors: true
  };

  return (
    <HeadlessDialog
      as="div"
      open={showDialog}
      onClose={onClose}
      className="relative z-50"
    >
      <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm transition-all duration-300" aria-hidden="true" />

      <div className="fixed inset-0 flex items-center justify-center p-4">
        <HeadlessDialog.Panel className="mx-auto w-full max-w-4xl rounded-[2.5rem] bg-white/95 backdrop-blur-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] border-none ring-1 ring-white/50">

          {/* Header con gradiente */}
          <div className="relative bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-8 pb-10">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <svg className="w-32 h-32 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z" />
              </svg>
            </div>

            <div className="relative z-10 flex flex-col md:flex-row gap-6 items-start md:items-center">
              <div className="h-20 w-20 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-3xl font-black text-white shadow-xl">
                {usuarioSeleccionado.fullName?.charAt(0) || "U"}
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-3">
                  <h2 className="text-3xl font-black text-white tracking-tight">
                    {usuarioSeleccionado.fullName}
                  </h2>
                  <div className="opacity-90 scale-90 origin-left">
                    {getEstadoBadge(usuarioSeleccionado.status)}
                  </div>
                </div>
                <p className="text-blue-200 font-medium flex items-center gap-2">
                  <span className="opacity-80">ID:</span> <span className="font-mono bg-white/10 px-2 py-0.5 rounded text-sm">{usuarioSeleccionado.uid?.substring(0, 8)}...</span>
                </p>
                <div className="flex gap-2 pt-1 opacity-90 scale-90 origin-left">
                  {getRolBadge(usuarioSeleccionado.role)}
                </div>
              </div>
            </div>
          </div>

          {/* Contenido Scrollable */}
          <div className="overflow-y-auto flex-1 p-6 md:p-8 space-y-6 bg-slate-50/50">

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Información básica */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-600 p-1.5 rounded-lg text-xs">👤</span> Información Personal
                </h3>
                <div className="space-y-3">
                  <InfoRow label="Nombre Completo" value={`${usuarioSeleccionado.fullName || ''} ${usuarioSeleccionado.paternalLastName || ''} ${usuarioSeleccionado.maternalLastName || ''}`} />
                  <InfoRow label="Correo Electrónico" value={usuarioSeleccionado.email} />
                  <InfoRow label="Teléfono" value={usuarioSeleccionado.telefono} />
                </div>
              </div>

              {/* Información de residencia */}
              <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                  <span className="bg-indigo-100 text-indigo-600 p-1.5 rounded-lg text-xs">🏠</span> Residencia
                </h3>
                <div className="space-y-3">
                  <InfoRow label="Residencial" value={getResidencialNombre(usuarioSeleccionado.residencialID)} isHighlight />
                  <InfoRow label="Calle" value={usuarioSeleccionado.calle} />
                  <div className="flex gap-4">
                    <div className="flex-1"><InfoRow label="Número" value={usuarioSeleccionado.houseNumber} /></div>
                    <div className="flex-1"><InfoRow label="House ID" value={usuarioSeleccionado.houseID} isMono /></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Configuración */}
              <div className="md:col-span-2 bg-white p-6 rounded-3xl shadow-sm border border-slate-100 hover:shadow-md transition-all">
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                  <span className="bg-amber-100 text-amber-600 p-1.5 rounded-lg text-xs">🔔</span> Preferencias de Notificación
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  <PreferenceItem label="No Molestar" active={notificationSettings.doNotDisturb} />
                  <PreferenceItem label="Emergencias" active={notificationSettings.emergencies} />
                  <PreferenceItem label="Eventos" active={notificationSettings.events} />
                  <PreferenceItem label="Paquetería" active={notificationSettings.packages} />
                  <PreferenceItem label="Visitantes" active={notificationSettings.visitors} />
                </div>
                {notificationSettings.doNotDisturb && (
                  <div className="mt-4 p-3 bg-amber-50 rounded-xl text-xs font-medium text-amber-800 border border-amber-100 inline-block">
                    Horario Silencio: {notificationSettings.doNotDisturbStart} - {notificationSettings.doNotDisturbEnd}
                  </div>
                )}
              </div>

              {/* Info Técnica breve */}
              <div className="bg-slate-900 text-slate-300 p-6 rounded-3xl shadow-lg shadow-slate-900/10">
                <h3 className="text-sm font-bold text-white uppercase tracking-widest mb-4 opacity-80">Metadata</h3>
                <div className="space-y-4 text-xs">
                  <div>
                    <span className="block opacity-60 mb-1">Registro</span>
                    <span className="font-mono text-white">{formatearFecha(usuarioSeleccionado.createdAt)}</span>
                  </div>
                  <div>
                    <span className="block opacity-60 mb-1">Última Actividad</span>
                    <span className="font-mono text-white">{formatearFecha(usuarioSeleccionado.updatedAt)}</span>
                  </div>
                  <div>
                    <span className="block opacity-60 mb-1">Método</span>
                    <span className="inline-block px-2 py-1 bg-white/10 rounded-md text-white border border-white/10">
                      {usuarioSeleccionado.registrationMethod || 'N/A'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Documentos */}
            {(usuarioSeleccionado.identificacionUrl || usuarioSeleccionado.comprobanteUrl) && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-6 rounded-3xl border border-blue-100">
                <h3 className="text-lg font-black text-slate-800 mb-4 flex items-center gap-2">
                  <span className="bg-blue-200 text-blue-700 p-1.5 rounded-lg text-xs">📂</span> Documentación
                </h3>
                <div className="flex flex-wrap gap-4">
                  {usuarioSeleccionado.identificacionUrl && (
                    <Button
                      variant="outline"
                      onClick={() => mostrarDocumento(usuarioSeleccionado.identificacionUrl || "", "Identificación")}
                      className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50 h-10 px-4 rounded-xl shadow-sm hover:shadow"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Identificación
                    </Button>
                  )}

                  {usuarioSeleccionado.comprobanteUrl && (
                    <Button
                      variant="outline"
                      onClick={() => mostrarDocumento(usuarioSeleccionado.comprobanteUrl || "", "Comprobante")}
                      className="bg-white border-blue-200 text-blue-700 hover:bg-blue-50 h-10 px-4 rounded-xl shadow-sm hover:shadow"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver Comprobante
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="p-6 bg-white border-t border-slate-100 flex justify-end">
            <Button
              onClick={onClose}
              className="rounded-xl h-12 px-8 font-bold bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-colors"
            >
              Cerrar Detalle
            </Button>
          </div>
        </HeadlessDialog.Panel>
      </div>
    </HeadlessDialog>
  );
};

// Helper Components for Cleaner Code
const InfoRow = ({ label, value, isMono = false, isHighlight = false }: { label: string, value: any, isMono?: boolean, isHighlight?: boolean }) => (
  <div className="flex flex-col">
    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">{label}</span>
    <span className={`text-sm ${isMono ? 'font-mono' : 'font-medium'} ${isHighlight ? 'text-blue-600 font-bold' : 'text-slate-700'}`}>
      {value || <span className="text-slate-300 italic">No asignado</span>}
    </span>
  </div>
);

const PreferenceItem = ({ label, active }: { label: string, active: boolean }) => (
  <div className={`flex items-center gap-2 p-2 rounded-xl border ${active ? 'bg-green-50 border-green-100 text-green-700' : 'bg-slate-50 border-slate-100 text-slate-400 opacity-60'}`}>
    <div className={`w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-slate-300'}`} />
    <span className="text-xs font-bold">{label}</span>
  </div>
);

export default DetallesUsuarioDialog; 