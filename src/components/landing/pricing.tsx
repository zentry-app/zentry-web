"use client";

import { motion } from "framer-motion";
import { useInView } from "react-intersection-observer";
import { Check, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { fadeIn, staggerContainer, bounceIn } from "@/lib/animations";
import Link from "next/link";

const plans = [
  {
    name: "Básico",
    description: "Ideal para residenciales pequeños",
    price: "999",
    features: [
      "Hasta 50 residentes",
      "Control de acceso básico",
      "Gestión de visitantes",
      "Notificaciones en tiempo real",
      "Soporte por correo"
    ],
    gradient: "from-primary-500/20 to-primary-500/5",
    buttonGradient: "from-primary-500 to-accent-500",
    popular: false
  },
  {
    name: "Estándar",
    description: "Perfecto para residenciales medianos",
    price: "1,999",
    features: [
      "Hasta 200 residentes",
      "Todo lo del plan Básico",
      "Panel de administración avanzado",
      "Registro de documentos",
      "Reportes mensuales",
      "Soporte prioritario"
    ],
    gradient: "from-accent-500/20 to-accent-500/5",
    buttonGradient: "from-accent-500 to-indigo-500",
    popular: true
  },
  {
    name: "Premium",
    description: "Para grandes desarrollos residenciales",
    price: "3,999",
    features: [
      "Residentes ilimitados",
      "Todo lo del plan Estándar",
      "API personalizada",
      "Integración con sistemas existentes",
      "Soporte 24/7",
      "Configuración personalizada"
    ],
    gradient: "from-indigo-500/20 to-indigo-500/5",
    buttonGradient: "from-indigo-500 to-primary-500",
    popular: false
  }
];

export function Pricing() {
  const { ref, inView } = useInView({
    threshold: 0.1,
    triggerOnce: true
  });

  return (
    <section ref={ref} id="precios" className="py-24 bg-gradient-to-b from-background to-primary-50/5">
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
            Planes diseñados para{" "}
            <span className="bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
              tu residencial
            </span>
          </h2>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Elige el plan que mejor se adapte al tamaño y necesidades de tu desarrollo residencial
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {plans.map((plan, index) => (
            <motion.div
              key={plan.name}
              variants={bounceIn}
              custom={index}
              className="relative group pt-8"
            >
              <Card className={`relative h-full p-8 backdrop-blur-sm border border-primary-100/20 bg-white/50 transition-all duration-500 hover:shadow-2xl ${plan.popular ? "scale-105 shadow-xl" : "shadow-lg"}`}>
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-accent-500 to-primary-500 text-white text-sm font-medium rounded-2xl shadow-lg flex items-center gap-2 whitespace-nowrap z-10">
                    <Sparkles className="w-4 h-4" />
                    <span>Más Popular</span>
                  </div>
                )}

                <div className="absolute inset-[1px] rounded-lg bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className={`absolute inset-[1px] rounded-lg bg-gradient-to-br ${plan.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <div className="relative space-y-8">
                  <div className="space-y-3">
                    <h3 className="text-2xl font-bold">{plan.name}</h3>
                    <p className="text-muted-foreground">{plan.description}</p>
                  </div>

                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold">$</span>
                    <span className="text-6xl font-bold bg-gradient-to-r from-primary-600 to-accent-500 bg-clip-text text-transparent">
                      {plan.price}
                    </span>
                    <span className="text-lg text-muted-foreground">MXN</span>
                  </div>

                  <ul className="space-y-4">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-3">
                        <div className={`p-1.5 rounded-full bg-gradient-to-r ${plan.buttonGradient} shadow-lg group-hover:shadow-xl transition-all duration-500`}>
                          <Check className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-muted-foreground">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button 
                    className={`w-full h-14 bg-gradient-to-r ${plan.buttonGradient} text-white shadow-lg group-hover:shadow-xl transition-all duration-500 rounded-2xl text-lg font-medium`}
                    asChild
                  >
                    <Link href="/register">
                      Comenzar ahora
                    </Link>
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </section>
  );
} 