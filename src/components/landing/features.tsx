"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { QrCode, Bell, Clock, Shield, Users, Smartphone, Home, History } from "lucide-react";
import { fadeIn, staggerContainer, bounceIn } from "@/lib/animations";
import { Card } from "@/components/ui/card";

const features = [
  {
    title: "Control de Acceso QR",
    description: "Genera códigos QR únicos para visitantes que facilitan un ingreso rápido y seguro al residencial.",
    icon: QrCode,
    color: "text-primary-500",
    gradient: "from-primary-500/20 to-primary-500/5",
    bgGradient: "from-primary-500 to-accent-500"
  },
  {
    title: "Notificaciones en Tiempo Real",
    description: "Recibe alertas instantáneas cuando tus visitantes llegan al residencial.",
    icon: Bell,
    color: "text-accent-500",
    gradient: "from-accent-500/20 to-accent-500/5",
    bgGradient: "from-accent-500 to-indigo-500"
  },
  {
    title: "Gestión de Residentes",
    description: "Administra fácilmente los perfiles de todos los residentes y sus vehículos autorizados.",
    icon: Users,
    color: "text-indigo-500",
    gradient: "from-indigo-500/20 to-indigo-500/5",
    bgGradient: "from-indigo-500 to-primary-500"
  },
  {
    title: "Acceso 24/7",
    description: "Controla los ingresos a cualquier hora del día, los 7 días de la semana, desde cualquier lugar.",
    icon: Clock,
    color: "text-emerald-500",
    gradient: "from-emerald-500/20 to-emerald-500/5",
    bgGradient: "from-emerald-500 to-teal-500"
  },
  {
    title: "Seguridad Avanzada",
    description: "Protege tu residencial con un sistema de verificación de identidad y registro detallado de ingresos.",
    icon: Shield,
    color: "text-rose-500",
    gradient: "from-rose-500/20 to-rose-500/5",
    bgGradient: "from-rose-500 to-pink-500"
  },
  {
    title: "App Móvil Intuitiva",
    description: "Gestiona todo desde nuestra aplicación fácil de usar, disponible para iOS y Android.",
    icon: Smartphone,
    color: "text-amber-500",
    gradient: "from-amber-500/20 to-amber-500/5",
    bgGradient: "from-amber-500 to-orange-500"
  }
];

export function Features() {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  return (
    <section ref={ref} id="caracteristicas" className="py-24 bg-gradient-to-b from-background to-primary-50/5">
      <motion.div 
        className="container mx-auto px-4"
        variants={staggerContainer}
        initial="initial"
        animate={inView ? "animate" : "initial"}
      >
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-16 space-y-4"
          variants={fadeIn}
        >
          <h2 className="text-4xl font-bold">
            Todo lo que necesitas para{" "}
            <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
              gestionar accesos
            </span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            ZENTRY te brinda todas las herramientas necesarias para controlar y monitorear 
            los ingresos a tu residencial de forma eficiente y segura.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              variants={bounceIn}
              custom={index}
              className="relative group"
            >
              <Card className="relative overflow-hidden h-full p-8 transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 bg-gradient-to-br from-background to-primary-50/10 backdrop-blur-sm border border-primary-100/20">
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-5 transition-opacity duration-500" />
                <div className={`absolute inset-0 bg-gradient-to-br ${feature.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className="relative space-y-6">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${feature.bgGradient} shadow-lg group-hover:shadow-xl transition-all duration-500 group-hover:scale-110`}>
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-2xl font-semibold">{feature.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
                  </div>

                  <div className="h-1.5 w-12 rounded-full bg-gradient-to-r from-primary-500/50 to-accent-500/50 group-hover:w-full transition-all duration-500" />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
} 