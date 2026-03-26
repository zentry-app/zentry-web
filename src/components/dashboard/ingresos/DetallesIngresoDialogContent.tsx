"use client";

import React, { useState, useEffect } from 'react';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Car,
  Clock,
  User,
  Calendar,
  Home,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  UserCircle,
  Mail,
  Shield,
  MapPin,
  ArrowRight,
  UserCheck,
  Zap,
  CheckCircle2,
  AlertCircle
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Ingreso, Timestamp as IngresoTimestamp } from "@/types/ingresos";
import { getUsuario, Usuario } from "@/lib/firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { motion } from "framer-motion";

interface DetallesIngresoDialogContentProps {
  selectedIngreso: Ingreso | null;
  formatDateToFull: (timestamp: IngresoTimestamp | Date | string) => string;
}

const capitalizeName = (name: string): string => {
  if (!name) return '';
  return name.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

const DetallesIngresoDialogContent: React.FC<DetallesIngresoDialogContentProps> = ({
  selectedIngreso,
  formatDateToFull,
}) => {
  const [usuarioGenerador, setUsuarioGenerador] = useState<Usuario | null>(null);
  const [loadingUsuario, setLoadingUsuario] = useState<boolean>(false);

  useEffect(() => {
    const cargarUsuarioGenerador = async () => {
      const userIdAnfitrion = selectedIngreso?.userId;
      if (!userIdAnfitrion) {
        setUsuarioGenerador(null);
        return;
      }

      setLoadingUsuario(true);
      try {
        const usuario = await getUsuario(userIdAnfitrion);
        setUsuarioGenerador(usuario);
      } catch (error) {
        console.error('Error al cargar usuario anfitrión:', error);
        setUsuarioGenerador(null);
      } finally {
        setLoadingUsuario(false);
      }
    };

    cargarUsuarioGenerador();
  }, [selectedIngreso?.userId]);

  if (!selectedIngreso) return null;

  const { visitData, vehicleInfo, exitDetails, status, physicalPass } = selectedIngreso;

  return (
    <div className="flex flex-col h-full max-h-[90vh]">
      {/* Header Premium con Gradiente */}
      <div className="relative p-10 pb-12 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full translate-y-1/2 -translate-x-1/2" />

        <div className="relative z-10 space-y-4">
          <div className="flex items-center justify-between">
            <Badge className="bg-primary hover:bg-primary text-white border-none font-black px-4 py-1.5 rounded-full text-[10px] tracking-[0.2em] shadow-lg shadow-primary/20 uppercase">
              Auditoría de Acceso
            </Badge>
            {physicalPass?.number && (
              <div className="bg-white/10 backdrop-blur-md border border-white/10 px-4 py-1.5 rounded-2xl flex items-center gap-2">
                <Zap className="h-3 w-3 text-yellow-400" />
                <span className="font-mono text-xs font-black">PASE #{physicalPass.number}</span>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h2 className="text-4xl font-extrabold tracking-tighter">
              {capitalizeName(visitData.name)}
            </h2>
            <div className="flex items-center gap-4 text-slate-300">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest">
                <Clock className="h-3.5 w-3.5 text-primary" />
                ID: {selectedIngreso.id.substring(0, 8)}...
              </div>
              <div className="h-1 w-1 bg-slate-600 rounded-full" />
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-widest">
                <Shield className="h-3.5 w-3.5 text-primary" />
                {selectedIngreso.entryMethod === 'moroso_vehicular' ? 'MOROSO VEHICULAR' : selectedIngreso.entryMethod === 'moroso_pedestrian' ? 'MOROSO PEATONAL' : selectedIngreso.entryMethod || 'REGISTRADO'}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-10 space-y-8 bg-slate-50/50 backdrop-blur-xl">

        {/* Alertas de Seguridad - Diseño Premium */}
        {status === 'completed' && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            {(!exitDetails?.suspiciousCargo && exitDetails?.passReturned !== false && exitDetails?.samePersonExit !== false && exitDetails?.exitInSameVehicle !== false) ? (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-[2rem] flex items-start gap-4 ring-1 ring-emerald-500/5">
                <div className="h-12 w-12 rounded-2xl bg-emerald-500 flex items-center justify-center text-white shadow-lg shadow-emerald-500/20">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-emerald-800 font-black text-sm uppercase tracking-widest">Acceso Seguro</p>
                  <p className="text-emerald-600/80 text-sm font-bold mt-0.5">El ciclo de visita se completó exitosamente sin incidencias detectadas.</p>
                </div>
              </div>
            ) : (
              <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-[2rem] flex items-start gap-4 ring-1 ring-red-500/5">
                <div className="h-12 w-12 rounded-2xl bg-red-500 flex items-center justify-center text-white shadow-lg shadow-red-500/20 animate-pulse">
                  <ShieldAlert className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <p className="text-red-800 font-black text-sm uppercase tracking-widest">Alerta de Seguridad</p>
                  <ul className="mt-2 space-y-1">
                    {exitDetails?.suspiciousCargo && <li className="text-red-600 text-xs font-bold flex items-center gap-2"><div className="h-1 w-1 bg-red-400 rounded-full" /> Carga sospechosa reportada</li>}
                    {exitDetails?.passReturned === false && <li className="text-red-600 text-xs font-bold flex items-center gap-2"><div className="h-1 w-1 bg-red-400 rounded-full" /> Pase no devuelto</li>}
                    {exitDetails?.samePersonExit === false && <li className="text-red-600 text-xs font-bold flex items-center gap-2"><div className="h-1 w-1 bg-red-400 rounded-full" /> Discrepancia de identidad en salida</li>}
                    {exitDetails?.exitInSameVehicle === false && <li className="text-red-600 text-xs font-bold flex items-center gap-2"><div className="h-1 w-1 bg-red-400 rounded-full" /> Cambio de vehículo detectado</li>}
                  </ul>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Auditoría de Entrada y Salida */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <ComparisonCard
            title="Sujeto de Acceso"
            icon={<UserCircle className="text-blue-500" />}
            entryData={capitalizeName(visitData.name)}
            exitData={status === 'completed' ? (exitDetails?.samePersonExit === false ? capitalizeName(exitDetails.differentPersonName || 'Otro') : 'Cerrado') : 'Pendiente'}
            isMismatch={exitDetails?.samePersonExit === false}
          />
          <ComparisonCard
            title="Unidad Vehicular"
            icon={<Car className="text-purple-500" />}
            entryData={vehicleInfo?.placa ? vehicleInfo.placa.toUpperCase() : 'Peatonal'}
            subEntry={vehicleInfo?.placa ? `${vehicleInfo.marca} ${vehicleInfo.modelo}` : undefined}
            exitData={status === 'completed' ? (exitDetails?.exitInSameVehicle === false ? (exitDetails.exitVehicleInfo?.placa || 'Desconocido') : 'Cerrado') : 'Pendiente'}
            isMismatch={exitDetails?.exitInSameVehicle === false}
          />
        </div>

        {/* Detalles Técnicos y Ubicación */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-none shadow-zentry bg-white rounded-[2rem] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                <Clock className="h-5 w-5" />
              </div>
              <p className="font-black text-sm uppercase tracking-widest text-slate-800">Cronología</p>
            </div>
            <div className="space-y-4">
              <TimelineItem
                label="Ingreso de Visitante"
                time={formatDateToFull(selectedIngreso.timestamp)}
                icon={<CheckCircle2 className="text-emerald-500" />}
                active
              />
              {status === 'completed' && (
                <TimelineItem
                  label="Salida de Visitante"
                  time={formatDateToFull(selectedIngreso.exitTimestamp || '')}
                  icon={<ArrowRight className="text-blue-500" />}
                  active
                />
              )}
            </div>
          </Card>

          <Card className="border-none shadow-zentry bg-white rounded-[2rem] p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="h-10 w-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-600">
                <MapPin className="h-5 w-5" />
              </div>
              <p className="font-black text-sm uppercase tracking-widest text-slate-800">Ubicación Destino</p>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Residencial</p>
                <p className="font-extrabold text-slate-800">{selectedIngreso._residencialNombre}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Domicilio</p>
                <p className="font-extrabold text-slate-800 flex items-center gap-2">
                  <Home className="h-4 w-4 text-primary" />
                  {capitalizeName(selectedIngreso.domicilio.calle)} #{selectedIngreso.domicilio.houseNumber}
                </p>
              </div>
            </div>
          </Card>
        </div>

        {/* Card de Anfitrión Premium */}
        {selectedIngreso.userId && (
          <Card className="border-none shadow-zentry bg-white rounded-[2.5rem] overflow-hidden">
            <div className="bg-slate-900 p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <UserCheck className="h-6 w-6 text-primary" />
                <p className="text-white font-black text-sm uppercase tracking-widest">Anfitrión Responsable</p>
              </div>
              <Badge variant="outline" className="border-white/20 text-white font-black px-4 py-1 rounded-full text-[9px]">
                GENERÓ CÓDIGO QR
              </Badge>
            </div>
            <CardContent className="p-8">
              {loadingUsuario ? (
                <div className="space-y-3">
                  <Skeleton className="h-6 w-1/2" />
                  <Skeleton className="h-4 w-1/3" />
                </div>
              ) : usuarioGenerador ? (
                <div className="flex flex-col md:flex-row gap-8">
                  <div className="flex-1 space-y-4">
                    <div>
                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Nombre del Residente</p>
                      <p className="text-xl font-extrabold text-slate-900">
                        {capitalizeName(usuarioGenerador.fullName || '')} {capitalizeName(usuarioGenerador.paternalLastName || '')}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-4">
                      <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 flex items-center gap-2">
                        <Mail className="h-4 w-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600">{usuarioGenerador.email}</span>
                      </div>
                      <div className="bg-slate-50 px-4 py-2 rounded-xl border border-slate-100 flex items-center gap-2">
                        <Shield className="h-4 w-4 text-slate-400" />
                        <span className="text-xs font-bold text-slate-600 capitalize">{usuarioGenerador.role === 'resident' ? 'Residente' : usuarioGenerador.role}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4 flex flex-col items-center gap-2">
                  <AlertCircle className="text-slate-200 h-10 w-10" />
                  <p className="text-slate-400 font-bold text-sm">El usuario generador ya no se encuentra en el sistema.</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

// Helper Components
function ComparisonCard({ title, icon, entryData, subEntry, exitData, isMismatch }: any) {
  return (
    <Card className={`border-none shadow-zentry bg-white rounded-[2rem] overflow-hidden ring-1 ${isMismatch ? 'ring-red-500/30' : 'ring-slate-100'}`}>
      <div className={`p-4 flex items-center gap-2 ${isMismatch ? 'bg-red-50' : 'bg-slate-50'}`}>
        {icon}
        <p className={`text-[10px] font-black uppercase tracking-widest ${isMismatch ? 'text-red-700' : 'text-slate-500'}`}>{title}</p>
      </div>
      <div className="p-6 grid grid-cols-2 gap-4 divide-x divide-slate-100">
        <div className="space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Entrada</p>
          <p className="font-extrabold text-slate-900 leading-tight">{entryData}</p>
          {subEntry && <p className="text-[9px] font-bold text-slate-400 uppercase">{subEntry}</p>}
        </div>
        <div className="pl-4 space-y-1">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Salida</p>
          <p className={`font-extrabold leading-tight ${isMismatch ? 'text-red-600' : 'text-slate-900 opacity-60'}`}>{exitData}</p>
        </div>
      </div>
    </Card>
  );
}

function TimelineItem({ label, time, icon, active }: any) {
  return (
    <div className="flex items-start gap-3">
      <div className={`mt-1 h-5 w-5 shrink-0 flex items-center justify-center`}>
        {icon}
      </div>
      <div>
        <p className="text-xs font-black text-slate-800">{label}</p>
        <p className="text-[11px] font-bold text-slate-400 uppercase">{time}</p>
      </div>
    </div>
  );
}

export default DetallesIngresoDialogContent;