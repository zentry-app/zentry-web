"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Star, Quote } from "lucide-react";
import { Card } from "@/components/ui/card";
import { fadeIn, staggerContainer, floatingAnimation } from "@/lib/animations";
import Image from "next/image";

const testimonials = [
  {
    name: "Carlos Ramírez",
    role: "Administrador de Torre Obispado",
    image: "/images/testimonials/carlos.jpg",
    content: "Zentry ha transformado la manera en que gestionamos nuestro residencial. El control de acceso y la gestión de visitantes nunca había sido tan eficiente.",
    rating: 5
  },
  {
    name: "Laura Martínez",
    role: "Administradora de Residencial del Valle",
    image: "/images/testimonials/laura.jpg",
    content: "La plataforma es muy intuitiva y nos ha ayudado a mejorar significativamente la seguridad. Los residentes están muy satisfechos con el sistema.",
    rating: 5
  },
  {
    name: "Miguel Ángel Torres",
    role: "Gerente de Torre Ejecutiva",
    image: "/images/testimonials/miguel.jpg",
    content: "El soporte técnico es excelente y las actualizaciones constantes hacen que la plataforma sea cada vez mejor. Una inversión que vale la pena.",
    rating: 5
  }
];

export function Testimonials() {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  return (
    <section ref={ref} id="testimonios" className="py-24 bg-gradient-to-b from-primary-50/5 to-background relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        <motion.div 
          className="absolute top-1/3 -right-64 w-[500px] h-[500px] bg-primary-500/5 rounded-full blur-3xl"
          variants={floatingAnimation}
          animate="animate"
        />
        <motion.div 
          className="absolute bottom-1/3 -left-64 w-[500px] h-[500px] bg-accent-500/5 rounded-full blur-3xl"
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
            Lo que dicen nuestros{" "}
            <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
              clientes
            </span>
          </h2>
          <p className="text-lg text-muted-foreground">
            Experiencias reales de administradores que han mejorado la gestión de sus residenciales
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <motion.div
              key={testimonial.name}
              variants={fadeIn}
              custom={index}
              className="relative group"
            >
              <Card className="relative h-full p-6 overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-primary-500/10 to-accent-500/10 rounded-bl-[100px] transition-all duration-300 group-hover:scale-150 group-hover:opacity-50" />
                
                <div className="relative space-y-4">
                  <Quote className="w-10 h-10 text-primary-500/20" />
                  
                  <p className="text-muted-foreground italic">
                    "{testimonial.content}"
                  </p>

                  <div className="flex items-center gap-3 pt-4">
                    <div className="relative w-12 h-12 rounded-full overflow-hidden bg-muted">
                      <Image
                        src={testimonial.image}
                        alt={testimonial.name}
                        width={48}
                        height={48}
                        className="object-cover"
                        unoptimized
                        priority
                      />
                    </div>
                    
                    <div>
                      <h4 className="font-semibold">{testimonial.name}</h4>
                      <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-0.5">
                    {Array.from({ length: testimonial.rating }).map((_, i) => (
                      <Star
                        key={i}
                        className="w-4 h-4 fill-primary-500 text-primary-500"
                      />
                    ))}
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>

        <motion.div 
          className="mt-16 text-center"
          variants={fadeIn}
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-50/50 text-primary-900/80 text-sm">
            <Star className="w-4 h-4 fill-primary-500 text-primary-500" />
            <span>4.9/5 promedio de satisfacción</span>
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
} 