'use client';

import Image from 'next/image';
import { useState, useEffect, useRef, useCallback } from 'react';

// Imágenes reales del flujo de acceso con QR
const qrGenerationImg = '/assets/PhoneImg.webp';
const qrScanningImg = '/assets/QRScanImg.webp';
const idScanningImg = '/assets/IdImg.webp';
const plateScanningImg = '/assets/CarImg.webp';
const accessGrantedImg = '/assets/PlumaImg.webp';

interface FeatureCardProps {
  title: string;
  boldText: string;
  description: string;
  imageSrc: string;
  alt: string;
}

const FeatureCard = ({ title, boldText, description, imageSrc, alt }: FeatureCardProps) => {
  return (
    <div className="flex-shrink-0 w-full bg-gray-50 rounded-[28px] p-6 shadow-sm transition-all duration-300 hover:shadow-md border border-gray-100 flex flex-col">
      <div className="mb-6">
        <h3 className="font-heading text-xl md:text-2xl mb-2">
          <span className="font-bold text-gray-900">{title}</span>{" "}
          <span className="font-normal text-gray-600">{boldText}</span>
        </h3>
        <p className="text-gray-600 font-body text-sm md:text-base">{description}</p>
      </div>
      <div className="relative w-full h-[320px] overflow-hidden rounded-[20px] border border-gray-200">
        <Image 
          src={imageSrc}
          alt={alt}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
    </div>
  );
};

const FeatureCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);
  const [isHovering, setIsHovering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const cursorFollowerRef = useRef<HTMLDivElement>(null);
  const arrowLeftRef = useRef<HTMLDivElement>(null);
  const arrowRightRef = useRef<HTMLDivElement>(null);
  const slidesContainerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  
  // Lista de características del flujo de acceso con QR
  const features = [
    {
      title: "Generación de QR",
      boldText: "único y seguro",
      description: "El residente genera y envía un código único al visitante.",
      imageSrc: qrGenerationImg,
      alt: "Teléfono mostrando generación de QR para visitante"
    },
    {
      title: "Escaneo en Caseta",
      boldText: "rápido y eficiente",
      description: "El guardia escanea el código en segundos.",
      imageSrc: qrScanningImg,
      alt: "Dispositivo escaneando código QR en caseta"
    },
    {
      title: "Escaneo de Identificación",
      boldText: "validación instantánea",
      description: "Se valida la credencial del visitante al instante.",
      imageSrc: idScanningImg,
      alt: "Escaneo de identificación del visitante"
    },
    {
      title: "Escaneo de Placas",
      boldText: "registro automático",
      description: "El sistema registra automáticamente las placas del vehículo.",
      imageSrc: plateScanningImg,
      alt: "Automóvil con placas siendo escaneadas"
    },
    {
      title: "Acceso Autorizado",
      boldText: "ingreso registrado",
      description: "La pluma se abre y el ingreso queda registrado.",
      imageSrc: accessGrantedImg,
      alt: "Barrera de acceso abriéndose con autorización"
    }
  ];

  // Número máximo de tarjetas visibles a la vez
  const maxVisibleCards = 3; // Reducido para mostrar menos cards a la vez y permitir ver los últimos
  // Índice máximo posible (ahora permitimos un paso adicional para ver completamente el último card)
  const maxIndex = features.length - maxVisibleCards;
  
  // Dimensiones de las tarjetas y separación
  const [cardWidth, setCardWidth] = useState(400); // Aumento del ancho inicial
  const [cardGap, setCardGap] = useState(24); // Gap entre tarjetas (equivalente a gap-6)

  // Detectar si es móvil
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Actualizar dimensiones en función del tamaño de la pantalla
  useEffect(() => {
    const updateDimensions = () => {
      if (window.innerWidth < 768) {
        setCardWidth(360); // Mayor en móvil
        setCardGap(24); // gap-6
      } else if (window.innerWidth < 1024) {
        setCardWidth(380); // Mayor en tablet
        setCardGap(32); // gap-8
      } else if (window.innerWidth < 1280) {
        setCardWidth(400); // Mayor en desktop pequeño
        setCardGap(32); // gap-8
      } else {
        setCardWidth(420); // Mayor en desktop grande
        setCardGap(32); // gap-8
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const nextSlide = useCallback(() => {
    // Modificado para permitir avanzar hasta que se vea el último elemento completo
    if (currentIndex >= maxIndex) return;
    setCurrentIndex((prevIndex) => Math.min(prevIndex + 1, maxIndex));
  }, [currentIndex, maxIndex]);

  const prevSlide = useCallback(() => {
    if (currentIndex <= 0) return;
    setCurrentIndex((prevIndex) => prevIndex - 1);
  }, [currentIndex]);

  useEffect(() => {
    // Solo aplicar el comportamiento de cursor follower en desktop
    if (isMobile) return;

    // Inicializar el cursor follower al cargar el componente
    const updateCursorFollower = (e: MouseEvent) => {
      if (!carouselRef.current || !cursorFollowerRef.current || !arrowLeftRef.current || !arrowRightRef.current) return;
      
      // Obtener dimensiones y posición del carrusel
      const rect = carouselRef.current.getBoundingClientRect();
      
      // Verificar si el cursor está dentro del carrusel
      const isInside = 
        e.clientX >= rect.left && 
        e.clientX <= rect.right && 
        e.clientY >= rect.top && 
        e.clientY <= rect.bottom;
        
      // Actualizar visibilidad del follower
      cursorFollowerRef.current.style.opacity = isInside ? '1' : '0';
      
      if (!isInside) return;
      
      // Posición del cursor relativa al carrusel
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      
      // Determinar si está en la mitad izquierda o derecha
      const isLeftHalf = x < rect.width / 2;
      const canGoBack = currentIndex > 0;
      const canGoForward = currentIndex < maxIndex;
      
      // Establecer posición del follower
      cursorFollowerRef.current.style.left = `${x}px`;
      cursorFollowerRef.current.style.top = `${y}px`;
      
      // Mostrar la flecha apropiada
      if (isLeftHalf && canGoBack) {
        arrowLeftRef.current.style.display = 'flex';
        arrowRightRef.current.style.display = 'none';
      } else if (!isLeftHalf && canGoForward) {
        arrowLeftRef.current.style.display = 'none';
        arrowRightRef.current.style.display = 'flex';
      } else if (isLeftHalf && !canGoBack) {
        arrowLeftRef.current.style.display = 'none';
        arrowRightRef.current.style.display = canGoForward ? 'flex' : 'none';
      } else {
        arrowLeftRef.current.style.display = canGoBack ? 'flex' : 'none';
        arrowRightRef.current.style.display = 'none';
      }
    };
    
    const handleClick = (e: MouseEvent) => {
      if (!carouselRef.current) return;
      
      const rect = carouselRef.current.getBoundingClientRect();
      
      // Verificar si el clic está dentro del carrusel
      const isInside = 
        e.clientX >= rect.left && 
        e.clientX <= rect.right && 
        e.clientY >= rect.top && 
        e.clientY <= rect.bottom;
        
      if (!isInside) return;
      
      // Posición del clic relativa al carrusel
      const x = e.clientX - rect.left;
      
      // Determinar si el clic es en la mitad izquierda o derecha
      const isLeftHalf = x < rect.width / 2;
      
      if (isLeftHalf && currentIndex > 0) {
        prevSlide();
      } else if (!isLeftHalf && currentIndex < maxIndex) {
        nextSlide();
      }
    };
    
    document.addEventListener('mousemove', updateCursorFollower);
    document.addEventListener('click', handleClick);
    
    return () => {
      document.removeEventListener('mousemove', updateCursorFollower);
      document.removeEventListener('click', handleClick);
    };
  }, [currentIndex, isMobile, maxIndex, nextSlide, prevSlide]);

  // Aplicar transformación basada en el índice actual (solo en desktop)
  useEffect(() => {
    if (slidesContainerRef.current && !isMobile) {
      // Calculamos la posición para asegurar que todos los cards sean visibles
      let translateX;
      
      if (currentIndex >= maxIndex) {
        // Para los últimos pasos, aseguramos que se vean los últimos cards completamente
        const totalWidth = features.length * (cardWidth + cardGap) - cardGap;
        const visibleWidth = maxVisibleCards * (cardWidth + cardGap) - cardGap;
        translateX = -(totalWidth - visibleWidth);
      } else {
        // Cálculo normal para los demás pasos
        translateX = -(currentIndex * (cardWidth + cardGap));
      }
      
      slidesContainerRef.current.style.transform = `translateX(${translateX}px)`;
    }
  }, [currentIndex, cardWidth, cardGap, features.length, maxVisibleCards, maxIndex, isMobile]);

  // Estilos específicos para garantizar que el scroll funcione en todos los tamaños de pantalla
  const carouselStyle = isMobile ? {
    paddingLeft: '0',
    paddingRight: '0',
  } : {
    paddingLeft: '1.5rem',
    paddingRight: 0,
    WebkitMaskImage: 'linear-gradient(to right, rgba(0, 0, 0, 1) 85%, rgba(0, 0, 0, 0) 100%)',
    maskImage: 'linear-gradient(to right, rgba(0, 0, 0, 1) 85%, rgba(0, 0, 0, 0) 100%)',
  };

  return (
    <section className="py-16 lg:py-24 bg-white isolate relative overflow-hidden">
      <div className="container mx-auto" ref={containerRef}>
        <div className="text-center mb-16 px-4">
          <h2 className="font-heading font-bold text-4xl lg:text-5xl mb-4">Acceso seguro y eficiente con QR</h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">Descubre cómo Zentry simplifica el ingreso de visitantes en tu residencial</p>
        </div>

        <div className="relative">
          <div 
            className={`relative ${isMobile ? 'overflow-x-auto' : 'overflow-x-visible cursor-pointer'}`}
            ref={carouselRef}
            style={carouselStyle}
          >
            <div 
              ref={slidesContainerRef}
              className={`flex gap-6 md:gap-8 ${isMobile ? 'overflow-visible px-4' : 'overflow-visible'} ${isMobile ? '' : 'transition-transform duration-500 ease-in-out'}`}
            >
              {features.map((feature, index) => (
                  <div 
                    key={index} 
                    className={`${isMobile ? 'min-w-[280px] w-[280px]' : 'min-w-[360px] w-[360px] md:min-w-[380px] md:w-[380px] lg:min-w-[400px] lg:w-[400px] xl:min-w-[420px] xl:w-[420px]'} flex-shrink-0`}
                  >
                    <FeatureCard {...feature} />
                  </div>
              ))}
            </div>
            
            {/* Navegación que sigue al cursor - Solo en desktop */}
            {!isMobile && (
              <div 
                ref={cursorFollowerRef}
                className="absolute z-30 pointer-events-none"
                style={{ 
                  transform: 'translate(-50%, -50%)',
                  opacity: 0,
                  transition: 'opacity 0.2s'
                }}
              >
                <div 
                  ref={arrowLeftRef}
                  className="bg-black text-white p-3 rounded-full shadow-md opacity-80 hidden items-center justify-center"
                  style={{ width: '48px', height: '48px' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </div>
                
                <div 
                  ref={arrowRightRef}
                  className="bg-black text-white p-3 rounded-full shadow-md opacity-80 hidden items-center justify-center"
                  style={{ width: '48px', height: '48px' }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeatureCarousel; 
