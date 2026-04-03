"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  RefreshCw,
  Plus,
  Trash,
  Building,
  MapPin,
  Landmark,
  DollarSign,
  BriefcaseIcon,
  ShieldAlert,
  ShieldCheck,
  Lock,
} from "lucide-react";
import { UseFormReturn } from "react-hook-form";
import { z } from "zod";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";

// Same schema as in page.tsx for consistency
const residencialSchema = z.object({
  id: z.string().optional(),
  residencialID: z
    .string()
    .length(6, "El código debe tener exactamente 6 caracteres")
    .regex(
      /^(?=.*[A-Z])(?=.*[0-9])[A-Z0-9]{6}$/,
      "El código debe contener al menos una letra y un número",
    ),
  nombre: z.string().min(3, "El nombre debe tener al menos 3 caracteres"),
  direccion: z.string().min(5, "La dirección debe tener al menos 5 caracteres"),
  ciudad: z.string().min(3, "La ciudad debe tener al menos 3 caracteres"),
  estado: z.string().min(3, "El estado debe tener al menos 3 caracteres"),
  codigoPostal: z
    .string()
    .min(5, "El código postal debe tener al menos 5 caracteres"),
  cuotaMantenimiento: z.coerce
    .number()
    .min(0, "La cuota debe ser un número positivo"),
  maxCodigosQRMorosos: z.coerce
    .number()
    .min(1, "El límite debe ser al menos 1")
    .max(100, "El límite no puede ser mayor a 100")
    .optional(),
  calles: z.array(z.string()).optional(),
  globalScreenRestrictions: z
    .object({
      visitas: z.boolean().default(true),
      eventos: z.boolean().default(true),
      mensajes: z.boolean().default(true),
      reservas: z.boolean().default(true),
      encuestas: z.boolean().default(true),
    })
    .optional(),
  cuentaPago: z
    .object({
      banco: z
        .string()
        .min(3, "El banco debe tener al menos 3 caracteres")
        .optional()
        .or(z.literal("")),
      numeroCuenta: z
        .string()
        .min(10, "El número de cuenta debe tener al menos 10 caracteres")
        .optional()
        .or(z.literal("")),
      clabe: z
        .string()
        .min(18, "La CLABE debe tener al menos 18 caracteres")
        .optional()
        .or(z.literal("")),
      titular: z
        .string()
        .min(5, "El titular debe tener al menos 5 caracteres")
        .optional()
        .or(z.literal("")),
    })
    .optional(),
  datosFiscales: z
    .object({
      razonSocial: z.string().optional().or(z.literal("")),
      rfc: z.string().optional().or(z.literal("")),
      domicilioFiscal: z.string().optional().or(z.literal("")),
    })
    .optional(),
});

type ResidencialFormValues = z.infer<typeof residencialSchema>;

interface ResidencialFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  formMode: "crear" | "editar";
  form: UseFormReturn<ResidencialFormValues>;
  onSubmit: (values: ResidencialFormValues) => Promise<void>;
  onGenerateID: () => void;
  submitting: boolean;
}

export const ResidencialFormDialog = ({
  open,
  onOpenChange,
  formMode,
  form,
  onSubmit,
  onGenerateID,
  submitting,
}: ResidencialFormDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] border-none shadow-2xl rounded-[2.5rem] bg-white p-0 overflow-hidden">
        <DialogHeader className="p-8 pb-4 bg-slate-900 text-white">
          <div className="flex items-center gap-4">
            <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center">
              <Building className="h-6 w-6 text-primary" />
            </div>
            <div>
              <DialogTitle className="text-2xl font-black">
                {formMode === "crear"
                  ? "Nuevo Residencial"
                  : "Editar Residencial"}
              </DialogTitle>
              <DialogDescription className="text-slate-400 font-bold">
                {formMode === "crear"
                  ? "Configura la infraestructura base para un nuevo recinto."
                  : "Actualiza los parámetros y configuraciones del recinto."}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-0">
            <div className="p-8">
              <Tabs defaultValue="info" className="w-full">
                <TabsList className="bg-slate-100 p-1.5 rounded-2xl mb-6 grid grid-cols-5 w-full">
                  <TabsTrigger
                    value="info"
                    className="rounded-xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <Building className="w-3.5 h-3.5 mr-2" /> Info
                  </TabsTrigger>
                  <TabsTrigger
                    value="calles"
                    className="rounded-xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <MapPin className="w-3.5 h-3.5 mr-2" /> Calles
                  </TabsTrigger>
                  <TabsTrigger
                    value="accesos"
                    className="rounded-xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <ShieldAlert className="w-3.5 h-3.5 mr-2" /> Accesos
                  </TabsTrigger>
                  <TabsTrigger
                    value="banco"
                    className="rounded-xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <Landmark className="w-3.5 h-3.5 mr-2" /> Banco
                  </TabsTrigger>
                  <TabsTrigger
                    value="fiscal"
                    className="rounded-xl font-black text-xs uppercase tracking-widest data-[state=active]:bg-white data-[state=active]:shadow-sm"
                  >
                    <BriefcaseIcon className="w-3.5 h-3.5 mr-2" /> Fiscal
                  </TabsTrigger>
                </TabsList>

                <TabsContent
                  value="info"
                  className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="residencialID"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-black text-slate-700 uppercase tracking-widest text-[10px]">
                            Identificador Único
                          </FormLabel>
                          <div className="flex gap-2">
                            <FormControl>
                              <Input
                                {...field}
                                maxLength={6}
                                className="font-mono font-black h-12 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-primary/20 uppercase"
                              />
                            </FormControl>
                            <Button
                              type="button"
                              variant="outline"
                              size="icon"
                              className="h-12 w-12 rounded-2xl border-slate-200 hover:bg-primary/5 hover:text-primary transition-all shadow-sm shrink-0"
                              onClick={onGenerateID}
                              title="Generar nuevo código"
                            >
                              <RefreshCw className="h-5 w-5" />
                            </Button>
                          </div>
                          <FormMessage className="font-bold text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="nombre"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-black text-slate-700 uppercase tracking-widest text-[10px]">
                            Nombre del Recinto
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Ej: Residencial Las Nubes"
                              className="h-12 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-primary/20 font-bold"
                            />
                          </FormControl>
                          <FormMessage className="font-bold text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="direccion"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-black text-slate-700 uppercase tracking-widest text-[10px]">
                          Dirección Postal Completa
                        </FormLabel>
                        <FormControl>
                          <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                            <Input
                              {...field}
                              className="pl-12 h-12 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-primary/20 font-bold"
                            />
                          </div>
                        </FormControl>
                        <FormMessage className="font-bold text-xs" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField
                      control={form.control}
                      name="ciudad"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-black text-slate-700 uppercase tracking-widest text-[10px]">
                            Ciudad
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="h-12 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-primary/20 font-bold"
                            />
                          </FormControl>
                          <FormMessage className="font-bold text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="estado"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-black text-slate-700 uppercase tracking-widest text-[10px]">
                            Estado
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="h-12 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-primary/20 font-bold"
                            />
                          </FormControl>
                          <FormMessage className="font-bold text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="codigoPostal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-black text-slate-700 uppercase tracking-widest text-[10px]">
                            CP
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="h-12 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-primary/20 font-bold"
                            />
                          </FormControl>
                          <FormMessage className="font-bold text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                    <FormField
                      control={form.control}
                      name="cuotaMantenimiento"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-black text-slate-700 uppercase tracking-widest text-[10px]">
                            Cuota de Mantenimiento ($)
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                              <Input
                                {...field}
                                type="number"
                                step="0.01"
                                min="0"
                                className="pl-12 h-12 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-primary/20 font-black text-lg"
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            Monto mensual estándar para residentes.
                          </FormDescription>
                          <FormMessage className="font-bold text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxCodigosQRMorosos"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-black text-slate-700 uppercase tracking-widest text-[10px]">
                            Restricción QR Morosos
                          </FormLabel>
                          <FormControl>
                            <div className="relative">
                              <ShieldAlert className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500" />
                              <Input
                                type="number"
                                min="1"
                                max="100"
                                placeholder="5"
                                className="pl-12 h-12 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-primary/20 font-bold"
                                value={field.value ?? ""}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(
                                    value ? parseInt(value, 10) : undefined,
                                  );
                                }}
                                onBlur={field.onBlur}
                              />
                            </div>
                          </FormControl>
                          <FormDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            Límite diario de códigos para usuarios en morosidad.
                          </FormDescription>
                          <FormMessage className="font-bold text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent
                  value="calles"
                  className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none"
                >
                  <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-5 w-5 text-primary" />
                        <h3 className="text-sm font-black uppercase tracking-widest text-slate-800">
                          Directorio de Vialidades
                        </h3>
                      </div>
                      <Badge
                        variant="outline"
                        className="bg-white text-slate-500 border-slate-200 font-bold"
                      >
                        {form.watch("calles")?.length || 0} Registradas
                      </Badge>
                    </div>

                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 scrollbar-premium">
                      {form.watch("calles")?.map((calle, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 animate-in fade-in slide-in-from-right-2 duration-200"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          <div className="h-12 w-8 rounded-xl bg-slate-200 flex items-center justify-center shrink-0">
                            <span className="text-[10px] font-black text-slate-500">
                              {index + 1}
                            </span>
                          </div>
                          <Input
                            value={calle}
                            onChange={(e) => {
                              const nuevasCalles = [
                                ...(form.getValues("calles") || []),
                              ];
                              nuevasCalles[index] = e.target.value;
                              form.setValue("calles", nuevasCalles);
                            }}
                            placeholder="Nombre oficial de la vialidad"
                            className="h-12 rounded-2xl bg-white border-slate-200 font-bold"
                          />
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-12 w-12 rounded-2xl text-slate-400 hover:text-destructive hover:bg-destructive/5"
                            onClick={() => {
                              const nuevasCalles = [
                                ...(form.getValues("calles") || []),
                              ];
                              nuevasCalles.splice(index, 1);
                              form.setValue("calles", nuevasCalles);
                            }}
                          >
                            <Trash className="h-5 w-5" />
                          </Button>
                        </div>
                      ))}

                      {(!form.watch("calles") ||
                        form.watch("calles")?.length === 0) && (
                        <div className="text-center py-8">
                          <p className="text-sm font-medium text-slate-400 italic">
                            No hay vialidades registradas aún.
                          </p>
                        </div>
                      )}
                    </div>

                    <Button
                      type="button"
                      variant="outline"
                      className="w-full mt-6 h-14 rounded-2xl border-dashed border-2 border-slate-300 text-slate-500 font-black hover:border-primary hover:text-primary transition-all bg-white shadow-sm"
                      onClick={() => {
                        const callesActuales = form.getValues("calles") || [];
                        form.setValue("calles", [...callesActuales, ""]);
                      }}
                    >
                      <Plus className="h-5 w-5 mr-2" />
                      AÑADIR NUEVA VIALIDAD
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent
                  value="accesos"
                  className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none"
                >
                  <div className="bg-amber-50 p-6 rounded-[2rem] border border-amber-100 mb-4">
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-amber-600" />
                      <p className="text-xs text-amber-700 font-bold">
                        ⚠️ Estas configuraciones restringirán o permitirán
                        funciones a TODOS los residentes de este recinto.
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {[
                      {
                        key: "visitas",
                        label: "Módulo de Visitas",
                        description: "Registro y control de visitantes",
                      },
                      {
                        key: "eventos",
                        label: "Módulo de Eventos",
                        description:
                          "Creación y gestión de eventos comunitarios",
                      },
                      {
                        key: "mensajes",
                        label: "Comunicación",
                        description: "Envío de mensajes y boletines",
                      },
                      {
                        key: "reservas",
                        label: "Áreas Comunes",
                        description: "Reservas de espacios compartidos",
                      },
                      {
                        key: "encuestas",
                        label: "Participación",
                        description: "Votaciones y encuestas internas",
                      },
                    ].map((feature) => (
                      <FormField
                        key={feature.key}
                        control={form.control}
                        name={`globalScreenRestrictions.${feature.key}` as any}
                        render={({ field }) => (
                          <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 border border-slate-100 group hover:border-primary/20 transition-all">
                            <div>
                              <p className="font-black text-slate-900 text-sm uppercase tracking-widest">
                                {feature.label}
                              </p>
                              <p className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">
                                {feature.description}
                              </p>
                            </div>
                            <FormControl>
                              <div
                                className={`w-14 h-8 rounded-full p-1 cursor-pointer transition-colors duration-300 ${field.value ? "bg-primary shadow-[0_0_15px_-3px_rgba(13,139,255,0.5)]" : "bg-slate-300"}`}
                                onClick={() => field.onChange(!field.value)}
                              >
                                <motion.div
                                  className="w-6 h-6 bg-white rounded-full shadow-sm"
                                  animate={{ x: field.value ? 24 : 0 }}
                                  transition={{
                                    type: "spring",
                                    stiffness: 500,
                                    damping: 30,
                                  }}
                                />
                              </div>
                            </FormControl>
                          </div>
                        )}
                      />
                    ))}
                  </div>
                </TabsContent>

                <TabsContent
                  value="banco"
                  className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none"
                >
                  <div className="bg-emerald-50/50 p-6 rounded-[2rem] border border-emerald-100 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                        <Landmark className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-emerald-900">
                          Configuración Bancaria
                        </h3>
                        <p className="text-[10px] font-bold text-emerald-700/70 uppercase tracking-tighter">
                          Destino para cobros y cuotas de mantenimiento.
                        </p>
                      </div>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="cuentaPago.titular"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-black text-slate-700 uppercase tracking-widest text-[10px]">
                          Titular Legal de la Cuenta
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ej: Condominio Las Nubes A.C."
                            className="h-12 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500/20 font-bold"
                          />
                        </FormControl>
                        <FormMessage className="font-bold text-xs" />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="cuentaPago.banco"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-black text-slate-700 uppercase tracking-widest text-[10px]">
                          Institución Bancaria
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="BBVA, Banorte, etc."
                            className="h-12 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500/20 font-bold"
                          />
                        </FormControl>
                        <FormMessage className="font-bold text-xs" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="cuentaPago.numeroCuenta"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-black text-slate-700 uppercase tracking-widest text-[10px]">
                            Número de Cuenta
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="h-12 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500/20 font-mono font-bold"
                            />
                          </FormControl>
                          <FormMessage className="font-bold text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cuentaPago.clabe"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-black text-slate-700 uppercase tracking-widest text-[10px]">
                            CLABE Interbancaria (18 dígitos)
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              maxLength={18}
                              className="h-12 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-emerald-500/20 font-mono font-bold"
                            />
                          </FormControl>
                          <FormMessage className="font-bold text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>

                <TabsContent
                  value="fiscal"
                  className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300 outline-none"
                >
                  <div className="bg-blue-50/50 p-6 rounded-[2rem] border border-blue-100 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-blue-600 flex items-center justify-center">
                        <BriefcaseIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-sm font-black uppercase tracking-widest text-blue-900">
                          Datos Fiscales
                        </h3>
                        <p className="text-[10px] font-bold text-blue-700/70 uppercase tracking-tighter">
                          Informacion fiscal para recibos y comprobantes.
                        </p>
                      </div>
                    </div>
                  </div>

                  <FormField
                    control={form.control}
                    name="datosFiscales.razonSocial"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="font-black text-slate-700 uppercase tracking-widest text-[10px]">
                          Razon Social
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Ej: Asociacion de Vecinos AC"
                            className="h-12 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-blue-500/20 font-bold"
                          />
                        </FormControl>
                        <FormMessage className="font-bold text-xs" />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField
                      control={form.control}
                      name="datosFiscales.rfc"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-black text-slate-700 uppercase tracking-widest text-[10px]">
                            RFC
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="ABC123456XY0"
                              maxLength={13}
                              className="h-12 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-blue-500/20 font-mono font-bold uppercase"
                            />
                          </FormControl>
                          <FormDescription className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">
                            12 o 13 caracteres segun persona moral o fisica.
                          </FormDescription>
                          <FormMessage className="font-bold text-xs" />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="datosFiscales.domicilioFiscal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="font-black text-slate-700 uppercase tracking-widest text-[10px]">
                            Domicilio Fiscal
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Calle, Colonia, CP"
                              className="h-12 rounded-2xl bg-slate-50 border-slate-200 focus-visible:ring-blue-500/20 font-bold"
                            />
                          </FormControl>
                          <FormMessage className="font-bold text-xs" />
                        </FormItem>
                      )}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </div>

            <DialogFooter className="p-8 pt-4 bg-slate-50 border-t border-slate-100 flex gap-3">
              <Button
                variant="ghost"
                type="button"
                className="rounded-2xl h-14 px-8 font-black text-slate-500 hover:bg-slate-100"
                onClick={() => onOpenChange(false)}
                disabled={submitting}
              >
                CANCELAR
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-2xl h-14 px-10 font-black bg-slate-900 text-white hover:bg-slate-800 shadow-zentry-lg hover-lift transition-all gap-3"
              >
                {submitting ? (
                  <RefreshCw className="h-5 w-5 animate-spin" />
                ) : (
                  <Building className="h-5 w-5" />
                )}
                {formMode === "crear" ? "REGISTRAR RECINTO" : "GUARDAR CAMBIOS"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};
