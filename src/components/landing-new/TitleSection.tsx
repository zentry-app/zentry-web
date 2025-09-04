"use client";

import React from 'react';
import Image from 'next/image';

const TitleSection = () => {
  return (
    <section className="relative pt-8 pb-4 md:pt-12 md:pb-6 overflow-hidden">
      <div className="container mx-auto px-6 text-center">
        <h1 className="inline-flex flex-wrap items-center justify-center gap-4 md:gap-6">
          <span className="text-4xl md:text-5xl lg:text-6xl font-bold">
            <span>
              Zentry
            </span>
          </span>
          
          <span className="text-3xl md:text-4xl lg:text-5xl font-medium text-gray-900">
            es una app móvil pensada para <span className="italic font-bold">ti</span>
          </span>
        </h1>
      </div>
    </section>
  );
};

export default TitleSection; 