"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Mail, MessageSquare, Phone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { fadeIn, staggerContainer, floatingAnimation } from "@/lib/animations";

const contactMethods = [
  {
    icon: Phone,
    title: "Llámanos",
    description: "Lun-Vie de 9am a 7pm",
    value: "+52 (81) 1234-5678",
    gradient: "from-primary-500 to-accent-500"
  },
  {
    icon: Mail,
    title: "Email",
    description: "Respuesta en 24 horas",
    value: "contacto@zentry.mx",
    gradient: "from-accent-500 to-indigo-500"
  },
  {
    icon: MessageSquare,
    title: "WhatsApp",
    description: "Respuesta inmediata",
    value: "+52 (81) 1234-5678",
    gradient: "from-indigo-500 to-primary-500"
  }
];

export function Contact() {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  return (
    <section ref={ref} id="contacto" className="py-24 bg-gradient-to-b from-background to-primary-50/5 relative overflow-hidden">
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
          className="text-center max-w-3xl mx-auto mb-16 space-y-4"
          variants={fadeIn}
        >
          <h2 className="text-3xl font-bold">
            ¿Necesitas{" "}
            <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
              ayuda
            </span>
            ? Contáctanos
          </h2>
          <p className="text-lg text-muted-foreground">
            Estamos aquí para ayudarte a mejorar la gestión de tu residencial. Contáctanos por cualquiera de estos medios
          </p>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
          <motion.div 
            className="space-y-8"
            variants={fadeIn}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
              {contactMethods.map((method) => (
                <Card 
                  key={method.title}
                  className="p-6 group hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl bg-gradient-to-r ${method.gradient} text-white group-hover:scale-110 transition-transform duration-300`}>
                      <method.icon className="w-6 h-6" />
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-semibold">{method.title}</h3>
                      <p className="text-sm text-muted-foreground">{method.description}</p>
                      <p className="font-medium text-primary">{method.value}</p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </motion.div>

          <motion.div 
            variants={fadeIn}
            className="relative"
          >
            <Card className="p-6 backdrop-blur-sm">
              <form className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Nombre</label>
                    <Input placeholder="Tu nombre completo" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Email</label>
                    <Input type="email" placeholder="tu@email.com" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Teléfono</label>
                  <Input placeholder="(55) 1234-5678" />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Mensaje</label>
                  <Textarea 
                    placeholder="Cuéntanos sobre tu residencial y cómo podemos ayudarte"
                    className="min-h-[120px]"
                  />
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-primary-500 to-accent-500 text-white hover:from-primary-600 hover:to-accent-600 shadow-md hover:shadow-lg transition-all duration-300"
                  size="lg"
                >
                  Enviar mensaje
                </Button>
              </form>
            </Card>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
} 