"use client";

import React, { useState } from 'react';
import Image from 'next/image';

interface FAQItemProps {
  question: string;
  answer: string;
  isOpen: boolean;
  toggleOpen: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isOpen, toggleOpen }) => {
  return (
    <div className="border-b border-gray-200 last:border-b-0">
      <button 
        className="flex w-full justify-between items-center text-left focus:outline-none py-6 px-8"
        onClick={toggleOpen}
      >
        <div className="flex items-center">
          <span className="text-primary text-xl font-medium mr-4">
          {isOpen ? '−' : '+'}
        </span>
          <h3 className="text-base md:text-lg font-medium text-gray-800">{question}</h3>
        </div>
      </button>
      <div 
        className={`overflow-hidden transition-all duration-300 ${isOpen ? 'max-h-96 pb-6' : 'max-h-0'}`}
      >
        <p className="text-gray-600 pl-14 pr-10">{answer}</p>
      </div>
    </div>
  );
};

const FAQSection = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const faqs = [
    {
      question: "¿Cómo contrato Zentry para mi residencial?",
      answer: "Muy fácil: contáctanos y agendamos una demo sin costo. Te mostramos cómo funciona y personalizamos el plan según el tamaño de tu residencial."
    },
    {
      question: "¿Qué beneficios tiene para el comité o la administración?",
      answer: "Ahorro de tiempo en reportes, transparencia financiera con residentes, comunicación directa y control de accesos desde un solo lugar."
    },
    {
      question: "¿Y los residentes cómo lo usan?",
      answer: "Con la app móvil pueden generar accesos para visitantes, pagar cuotas, reservar áreas comunes y recibir notificaciones en tiempo real."
    },
    {
      question: "¿Qué pasa si el personal de caseta no sabe usar tecnología?",
      answer: "La interfaz de caseta es muy simple y diseñada para uso rápido. Además, ofrecemos capacitación inicial y soporte continuo."
    },
    {
      question: "¿Cuánto cuesta Zentry?",
      answer: "Ofrecemos planes flexibles según el número de casas y servicios requeridos. El comité paga una suscripción mensual y todos los residentes se benefician."
    },
    {
      question: "¿Qué soporte ofrecen?",
      answer: "Nuestro equipo está disponible por WhatsApp, correo y dentro de la app. Además, tenemos actualizaciones constantes sin costo extra."
    }
  ];

  return (
    <section className="w-full py-20 md:py-28 bg-white">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl md:text-5xl font-heading font-bold mb-8 text-center">
          Resolvemos tus dudas más comunes.
        </h2>

        <div className="bg-gray-50 rounded-[32px] overflow-hidden shadow-sm border border-gray-100 py-4">
          {faqs.map((faq, index) => (
            <FAQItem 
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              toggleOpen={() => toggleFAQ(index)}
            />
          ))}
        </div>

        {/* Cierre aspiracional */}
        <div className="text-center mt-16">
          <div className="text-4xl mb-4">💡</div>
          <p className="text-xl md:text-2xl text-gray-700 font-medium max-w-3xl mx-auto leading-relaxed">
            Zentry no es solo una app, es la forma más simple de administrar tu residencial con confianza, seguridad y transparencia.
          </p>
        </div>
      </div>
    </section>
  );
};

export default FAQSection; 