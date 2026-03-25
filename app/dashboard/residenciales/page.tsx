"use client";

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from "framer-motion";
import {
  Building,
  Search,
  Plus,
  RefreshCw,
  Loader2,
  Trash2,
  Filter,
  ArrowRightLeft,
  LayoutGrid
} from "lucide-react";
import { useGlobalAdminRequired } from '@/lib/hooks/useGlobalAdminRequired';
import {
  getResidenciales,
  eliminarResidencial,
  crearResidencial,
  actualizarResidencial,
  Residencial,
  suscribirseAResidenciales
} from "@/lib/firebase/firestore";
import { toast } from "sonner";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";

// New modular components
import { ResidencialCard } from "@/components/dashboard/residenciales/ResidencialCard";
import { ResidencialFormDialog } from "@/components/dashboard/residenciales/ResidencialFormDialog";
import { ResidencialesStats } from "@/components/dashboard/residenciales/ResidencialesStats";

// Schema (keep for logic)
const residencialSchema = z.object({
  id: z.string().optional(),
  residencialID: z.string()
    .length(6, "El código debe tener exactamente 6 caracteres")
    .regex(/^(?=.*[A-Z])(?=.*[0-9])[A-Z0-9]{6}$/, "El código debe contener al menos una letra y un número"),
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  direccion: z.string().min(5, "La dirección debe tener al menos 5 caracteres"),
  ciudad: z.string().min(3, "La ciudad debe tener al menos 3 caracteres"),
  estado: z.string().min(3, "El estado debe tener al menos 3 caracteres"),
  codigoPostal: z.string().min(5, "El código postal debe tener al menos 5 caracteres"),
  cuotaMantenimiento: z.coerce.number().min(0, "La cuota debe ser un número positivo"),
  maxCodigosQRMorosos: z.coerce.number().min(1, "El límite debe ser al menos 1").max(100, "El límite no puede ser mayor a 100").optional(),
  calles: z.array(z.string()).optional(),
  globalScreenRestrictions: z.object({
    visitas: z.boolean().default(true),
    eventos: z.boolean().default(true),
    mensajes: z.boolean().default(true),
    reservas: z.boolean().default(true),
    encuestas: z.boolean().default(true),
  }).optional(),
  cuentaPago: z.object({
    banco: z.string().min(3, "El banco debe tener al menos 3 caracteres").optional().or(z.literal("")),
    numeroCuenta: z.string().min(10, "El número de cuenta debe tener al menos 10 caracteres").optional().or(z.literal("")),
    clabe: z.string().min(18, "La CLABE debe tener al menos 18 caracteres").optional().or(z.literal("")),
    titular: z.string().min(5, "El titular debe tener al menos 5 caracteres").optional().or(z.literal("")),
  }).optional(),
});

type ResidencialFormValues = z.infer<typeof residencialSchema>;

export default function ResidencialesPage() {
  const [residenciales, setResidenciales] = useState<Residencial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Dialog states
  const [showFormDialog, setShowFormDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [formMode, setFormMode] = useState<"crear" | "editar">("crear");
  const [residencialSeleccionado, setResidencialSeleccionado] = useState<Residencial | null>(null);
  const [residencialAEliminar, setResidencialAEliminar] = useState<string | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);

  const { isGlobalAdminAllowed, isGlobalAdminLoading } = useGlobalAdminRequired();

  const form = useForm<ResidencialFormValues>({
    resolver: zodResolver(residencialSchema),
    defaultValues: {
      nombre: "",
      direccion: "",
      ciudad: "",
      estado: "",
      codigoPostal: "",
      cuotaMantenimiento: 0,
      maxCodigosQRMorosos: 5,
      calles: [],
      globalScreenRestrictions: {
        visitas: true,
        eventos: true,
        mensajes: true,
        reservas: true,
        encuestas: true,
      },
      cuentaPago: {
        banco: "",
        numeroCuenta: "",
        clabe: "",
        titular: "",
      },
    },
  });

  // Real-time subscription
  useEffect(() => {
    if (!isGlobalAdminAllowed) return;

    setIsLoading(true);
    const unsubscribe = suscribirseAResidenciales((data) => {
      setResidenciales(data);
      setIsLoading(false);
      setIsRefreshing(false);
    });

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, [isGlobalAdminAllowed]);

  // ID Generation
  const generarResidencialID = useCallback(() => {
    const caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let resultado = '';
    resultado += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
    resultado += '0123456789'[Math.floor(Math.random() * 10)];
    for (let i = 0; i < 4; i++) {
      resultado += caracteres.charAt(Math.floor(Math.random() * caracteres.length));
    }
    const idMezclado = resultado.split('').sort(() => 0.5 - Math.random()).join('');
    form.setValue("residencialID", idMezclado);
    return idMezclado;
  }, [form]);

  // Handlers
  const handleOpenCreate = () => {
    setFormMode("crear");
    setResidencialSeleccionado(null);
    form.reset({
      residencialID: "",
      nombre: "",
      direccion: "",
      ciudad: "",
      estado: "",
      codigoPostal: "",
      cuotaMantenimiento: 0,
      maxCodigosQRMorosos: 5,
      calles: [],
      globalScreenRestrictions: {
        visitas: true,
        eventos: true,
        mensajes: true,
        reservas: true,
        encuestas: true,
      },
      cuentaPago: {
        banco: "",
        numeroCuenta: "",
        clabe: "",
        titular: "",
      },
    });
    generarResidencialID();
    setShowFormDialog(true);
  };

  const handleOpenEdit = (residencial: Residencial) => {
    setFormMode("editar");
    setResidencialSeleccionado(residencial);
    form.reset({
      id: residencial.id,
      residencialID: residencial.residencialID || "",
      nombre: residencial.nombre,
      direccion: residencial.direccion,
      ciudad: residencial.ciudad,
      estado: residencial.estado,
      codigoPostal: residencial.codigoPostal,
      cuotaMantenimiento: residencial.cuotaMantenimiento,
      maxCodigosQRMorosos: residencial.maxCodigosQRMorosos || 5,
      calles: residencial.calles || [],
      globalScreenRestrictions: residencial.globalScreenRestrictions || {
        visitas: true,
        eventos: true,
        mensajes: true,
        reservas: true,
        encuestas: true,
      },
      cuentaPago: residencial.cuentaPago || {
        banco: "",
        numeroCuenta: "",
        clabe: "",
        titular: "",
      },
    });
    setShowFormDialog(true);
  };

  const handleOpenDelete = (id: string) => {
    setResidencialAEliminar(id);
    setShowDeleteDialog(true);
  };

  const onConfirmDelete = async () => {
    if (!residencialAEliminar) return;
    try {
      await eliminarResidencial(residencialAEliminar);
      toast.success("Residencial eliminado correctamente");
      setShowDeleteDialog(false);
    } catch (error) {
      console.error(error);
      toast.error("Error al eliminar el residencial");
    }
  };

  const onSubmit = async (values: ResidencialFormValues) => {
    setFormSubmitting(true);
    try {
      const cuentaPagoVacia = !values.cuentaPago ||
        (!values.cuentaPago.banco && !values.cuentaPago.numeroCuenta && !values.cuentaPago.clabe && !values.cuentaPago.titular);

      const items: any = { ...values };
      if (cuentaPagoVacia) delete items.cuentaPago;
      if (!items.calles) items.calles = [];

      if (formMode === "crear") {
        await crearResidencial(items);
        toast.success("Residencial creado con éxito");
      } else if (values.id) {
        await actualizarResidencial(values.id, items);
        toast.success("Residencial actualizado con éxito");
      }
      setShowFormDialog(false);
    } catch (error) {
      console.error(error);
      toast.error(`Error al ${formMode === "crear" ? "crear" : "actualizar"} el residencial`);
    } finally {
      setFormSubmitting(false);
    }
  };

  const filteredResidenciales = useMemo(() => {
    return residenciales.filter(r => {
      if (!searchTerm) return true;
      const term = searchTerm.toLowerCase();
      return (
        r.nombre.toLowerCase().includes(term) ||
        r.ciudad.toLowerCase().includes(term) ||
        r.residencialID?.toLowerCase().includes(term)
      );
    });
  }, [residenciales, searchTerm]);

  // Stats calculation
  const stats = useMemo(() => {
    const cities = new Set(residenciales.map(r => r.ciudad)).size;
    const totalCuota = residenciales.reduce((acc, r) => acc + (Number(r.cuotaMantenimiento) || 0), 0);
    const withBank = residenciales.filter(r => r.cuentaPago?.banco).length;
    return {
      total: residenciales.length,
      ciudades: cities,
      promedioCuota: residenciales.length ? totalCuota / residenciales.length : 0,
      conDatosBancarios: withBank
    };
  }, [residenciales]);

  if (isGlobalAdminLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-premium">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="font-black text-primary tracking-widest uppercase animate-pulse">Zentry Secure Cloud</p>
        </div>
      </div>
    );
  }

  if (!isGlobalAdminAllowed) return null;

  return (
    <div className="min-h-screen bg-premium p-4 lg:p-10 space-y-8 pb-20">
      {/* Header Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col xl:flex-row justify-between gap-6 items-start"
      >
        <div className="space-y-4 max-w-2xl">
          <Badge className="bg-primary/10 text-primary border-none font-black px-4 py-1 rounded-full flex gap-2 w-fit items-center shadow-sm">
            <span className="h-2 w-2 rounded-full bg-primary animate-ping" />
            Panel de Administración Global
          </Badge>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 leading-tight">
            Gestión de <span className="text-gradient-zentry">Residenciales</span>
          </h1>
          <p className="text-slate-600 font-bold text-base sm:text-lg max-w-lg">
            Control centralizado de infraestructura, vialidades y parámetros financieros de todos los recintos.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto">
          <Button
            variant="outline"
            className="rounded-2xl h-12 sm:h-14 px-6 font-black shadow-zentry bg-white/60 border-slate-300 text-slate-800 hover:bg-slate-50 transition-all w-full sm:w-auto"
            onClick={() => { setIsRefreshing(true); window.location.reload(); }}
          >
            <RefreshCw className={`mr-2 h-5 w-5 ${isRefreshing ? 'animate-spin' : ''}`} /> RELOAD
          </Button>
          <Button
            onClick={handleOpenCreate}
            className="rounded-2xl h-12 sm:h-14 px-8 font-black shadow-zentry-lg bg-slate-900 text-white hover:bg-slate-800 hover-lift transition-all gap-2 w-full sm:w-auto"
          >
            <Plus className="h-5 w-5" /> NUEVO RECINTO
          </Button>
        </div>
      </motion.div>

      {/* Stats Section */}
      <ResidencialesStats
        {...stats}
        isLoading={isLoading}
      />

      {/* Filters & Grid Section */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-white/50 backdrop-blur-xl p-3 sm:p-4 rounded-2xl sm:rounded-[2rem] border border-white/20 shadow-sm">
          <div className="relative w-full md:w-[400px]">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
            <Input
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por nombre, ciudad o ID..."
              className="pl-12 h-12 bg-white border border-slate-200 shadow-inner rounded-xl sm:rounded-2xl font-bold focus-visible:ring-primary/20 text-slate-900 w-full"
            />
          </div>

          <div className="flex flex-wrap sm:flex-nowrap bg-slate-200/50 p-1.5 rounded-2xl shadow-inner gap-1.5 w-full md:w-auto justify-center">
            <Badge className="bg-slate-900 text-white font-black px-4 py-2 rounded-xl flex gap-2 items-center text-[10px] sm:text-xs">
              <LayoutGrid className="h-3.5 w-3.5 sm:h-4 w-4" /> VISTA GRID
            </Badge>
            <div className="px-4 py-2 text-slate-500 font-black text-[9px] sm:text-[10px] flex items-center gap-2 uppercase tracking-tight">
              <ArrowRightLeft className="h-3 w-3" /> {filteredResidenciales.length} RESULTADOS
            </div>
          </div>
        </div>

        <AnimatePresence mode="popLayout">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 py-20">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-[300px] rounded-[2.5rem] bg-white/40 animate-pulse border border-slate-100 flex items-center justify-center">
                  <Building className="h-10 w-10 text-slate-200" />
                </div>
              ))}
            </div>
          ) : filteredResidenciales.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="py-32 text-center"
            >
              <div className="h-24 w-24 rounded-[2rem] bg-slate-100 flex items-center justify-center mx-auto mb-6 text-slate-300">
                <Search className="h-12 w-12" />
              </div>
              <h3 className="text-2xl font-black text-slate-900 mb-2">Sin resultados auditados</h3>
              <p className="text-slate-500 font-bold">No se encontraron residenciales con los criterios de búsqueda: "{searchTerm}"</p>
              <Button
                variant="outline"
                className="mt-6 rounded-2xl font-black border-slate-200"
                onClick={() => setSearchTerm("")}
              >
                LIMPIAR FILTROS
              </Button>
            </motion.div>
          ) : (
            <motion.div
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
              layout
            >
              {filteredResidenciales.map((residencial) => (
                <ResidencialCard
                  key={residencial.id}
                  residencial={residencial}
                  onEdit={handleOpenEdit}
                  onDelete={handleOpenDelete}
                  onViewDetails={handleOpenEdit}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modular Form Dialog */}
      <ResidencialFormDialog
        open={showFormDialog}
        onOpenChange={setShowFormDialog}
        formMode={formMode}
        form={form}
        onSubmit={onSubmit}
        onGenerateID={generarResidencialID}
        submitting={formSubmitting}
      />

      {/* Confirm Delete Dialog */}
      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="sm:max-w-[450px] border-none shadow-2xl rounded-[2.5rem] bg-white p-8">
          <div className="h-16 w-16 rounded-[1.5rem] bg-destructive/10 text-destructive flex items-center justify-center mx-auto mb-6">
            <Trash2 className="h-8 w-8" />
          </div>
          <DialogTitle className="text-2xl font-black text-center mb-2">Eliminar Residencial</DialogTitle>
          <DialogDescription className="text-center text-slate-500 font-bold mb-8">
            ¿Está seguro de eliminar permanentemente este recinto? Esta acción eliminará toda la infraestructura asociada y no se puede revertir.
          </DialogDescription>
          <div className="grid grid-cols-2 gap-4">
            <Button
              variant="ghost"
              className="rounded-2xl h-14 font-black text-slate-500 hover:bg-slate-100"
              onClick={() => setShowDeleteDialog(false)}
            >
              CANCELAR
            </Button>
            <Button
              variant="destructive"
              className="rounded-2xl h-14 font-black shadow-lg hover-lift"
              onClick={onConfirmDelete}
            >
              ELIMINAR AHORA
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}