"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { UserCheck, Smartphone, QrCode, Bell } from "lucide-react";
import { fadeIn, staggerContainer, floatingAnimation } from "@/lib/animations";

const steps = [
  {
    title: "Registro Sencillo",
    description: "Crea tu cuenta como administrador del residencial o como residente en pocos minutos.",
    icon: UserCheck,
    color: "text-primary-500",
    gradient: "from-primary-500 to-accent-500"
  },
  {
    title: "Configura tu Residencial",
    description: "Añade los datos de tu residencial, áreas comunes y registra a los residentes autorizados.",
    icon: Smartphone,
    color: "text-accent-500",
    gradient: "from-accent-500 to-indigo-500"
  },
  {
    title: "Genera Accesos",
    description: "Crea códigos QR para visitantes o autoriza vehículos para un ingreso rápido y seguro.",
    icon: QrCode,
    color: "text-indigo-500",
    gradient: "from-indigo-500 to-primary-500"
  },
  {
    title: "Monitorea en Tiempo Real",
    description: "Recibe notificaciones instantáneas y visualiza todos los ingresos a tu residencial.",
    icon: Bell,
    color: "text-primary-500",
    gradient: "from-primary-500 to-accent-500"
  }
];

export function HowItWorks() {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  return (
    <section ref={ref} id="como-funciona" className="py-24 bg-gradient-to-b from-primary-50/5 to-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          className="absolute top-1/4 -right-64 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-3xl"
          variants={floatingAnimation}
          animate="animate"
        />
        <motion.div 
          className="absolute bottom-1/4 -left-64 w-[500px] h-[500px] bg-accent-500/5 rounded-full blur-3xl"
          variants={floatingAnimation}
          animate="animate"
          transition={{ delay: 0.5 }}
        />
      </div>

      <motion.div 
        className="container mx-auto px-4"
        variants={staggerContainer}
        initial="initial"
        animate={inView ? "animate" : "initial"}
      >
        <motion.div 
          className="text-center max-w-3xl mx-auto mb-20 space-y-4"
          variants={fadeIn}
        >
          <h2 className="text-4xl font-bold">
            Proceso{" "}
            <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
              simple y efectivo
            </span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            En solo cuatro pasos podrás gestionar todos los accesos a tu residencial de forma segura
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative">
          {/* Línea conectora */}
          <div className="absolute top-24 left-0 right-0 h-0.5 bg-gradient-to-r from-primary-200/0 via-primary-200 to-primary-200/0 hidden lg:block" />
          
          {steps.map((step, index) => (
            <motion.div
              key={step.title}
              variants={fadeIn}
              custom={index}
              className="relative group"
            >
              {/* Línea vertical */}
              {index < steps.length - 1 && (
                <div className="hidden lg:block absolute top-24 -right-4 w-8 h-0.5 bg-gradient-to-r from-primary-200 to-accent-200" />
              )}
              
              <div className="relative p-8 rounded-3xl bg-white/50 backdrop-blur-sm border border-primary-100/20 shadow-lg hover:shadow-xl transition-all duration-500 group-hover:-translate-y-1">
                {/* Número del paso */}
                <div className="absolute -top-6 left-8 w-12 h-12 rounded-2xl bg-gradient-to-r from-primary-500 to-accent-500 text-white flex items-center justify-center text-lg font-bold shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500">
                  {index + 1}
                </div>

                <div className="space-y-6 pt-4">
                  <div className={`inline-flex p-4 rounded-2xl bg-gradient-to-r ${step.gradient} text-white shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all duration-500`}>
                    <step.icon className="w-6 h-6" />
                  </div>
                  
                  <div className="space-y-3">
                    <h3 className="text-2xl font-semibold">{step.title}</h3>
                    <p className="text-muted-foreground leading-relaxed">{step.description}</p>
                  </div>

                  <div className="h-1.5 w-12 rounded-full bg-gradient-to-r from-primary-500/50 to-accent-500/50 group-hover:w-full transition-all duration-500" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
} 