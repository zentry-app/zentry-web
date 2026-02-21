# 🚀 Plan de Optimización de Rendimiento - Zentry Web

## 📊 Estado Actual (Unlighthouse Report)

### Problemas Críticos Identificados:
- ⏱️ **TTFB (Time to First Byte)**: 2,680ms (Objetivo: <600ms)
- 🎨 **Render Blocking CSS**: 480ms - layout.css (37 KiB)
- 🖼️ **Imágenes no optimizadas**: 79 KiB de ahorro potencial
- 📦 **JavaScript no utilizado**: 1,505 KiB (81% del bundle)
- 🎨 **CSS no utilizado**: 33.1 KiB (90% del CSS)
- 📊 **Payload total**: 5,082 KiB
- ⚡ **JavaScript execution time**: 4.7s
- 🧵 **Main thread work**: 5.3s

---

## 🎯 Estrategia de Optimización (Priorizada)

### Fase 1: Optimizaciones Rápidas (Impacto Alto, Esfuerzo Bajo)

#### 1.1 Optimización de Imágenes ⚡ CRÍTICO
**Problema**: Imágenes servidas en tamaños incorrectos
- HeroImage.webp: 640x640 mostrada en 300x300 → 28.4 KiB desperdiciados
- HomeImg.webp: 610x1219 mostrada en 294x560 → 24.0 KiB desperdiciados
- AdminWeb.webp: 750x436 mostrada en 328x219 → 13.7 KiB desperdiciados
- GuardiaImg.webp: 750x436 mostrada en 328x219 → 12.5 KiB desperdiciados

**Solución**:
```tsx
// Usar sizes correctos en Next.js Image
<Image
  src="/assets/HeroImage.webp"
  sizes="(max-width: 640px) 300px, (max-width: 768px) 400px, (max-width: 1024px) 500px, 750px"
  priority // Para LCP
/>
```

**Ahorro estimado**: 79 KiB, mejora LCP en ~200ms

---

#### 1.2 Optimización de CSS ⚡ CRÍTICO
**Problema**: 
- 33.1 KiB de CSS no utilizado (90%)
- CSS bloqueando render (480ms)

**Solución**:
1. **Implementar CSS Modules o Tailwind JIT** (ya tienes Tailwind)
2. **Purgar CSS no utilizado**:
```js
// tailwind.config.ts
export default {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  // Asegurar que purge está activo
}
```

3. **Inline Critical CSS**:
```js
// next.config.mjs
experimental: {
  optimizeCss: true, // Requiere critters
}
```

**Ahorro estimado**: 33 KiB, mejora FCP en ~480ms

---

#### 1.3 Code Splitting Agresivo ⚡ CRÍTICO
**Problema**: 
- app/page.js: 1,851 KiB (81% no utilizado = 1,505 KiB)
- app/layout.js: 1,567 KiB

**Solución**:
```tsx
// Lazy load componentes pesados
import dynamic from 'next/dynamic';

const HeavyComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <Skeleton />,
  ssr: false, // Si no es crítico para SEO
});

// Lazy load libraries
const Chart = dynamic(() => import('recharts').then(mod => mod.Chart), {
  ssr: false,
});
```

**Componentes a lazy load**:
- Recharts (gráficos)
- TipTap (editor)
- Three.js (si lo usas)
- react-zoom-pan-pinch
- react-parallax
- Cualquier componente de dashboard no visible en viewport inicial

**Ahorro estimado**: 1,200+ KiB, mejora TBT en ~2s

---

#### 1.4 Eliminar JavaScript Legacy ⚡ MEDIO
**Problema**: 10 KiB de polyfills innecesarios para navegadores modernos

**Solución**:
```js
// next.config.mjs
compiler: {
  // Eliminar transforms innecesarios
  emotion: false,
  reactRemoveProperties: process.env.NODE_ENV === 'production',
},

// Actualizar browserslist en package.json
"browserslist": {
  "production": [
    ">0.5%",
    "not dead",
    "not op_mini all",
    "not IE 11"
  ]
}
```

**Ahorro estimado**: 10 KiB

---

### Fase 2: Optimizaciones de Servidor (Impacto Alto, Esfuerzo Medio)

#### 2.1 Reducir TTFB ⚡ CRÍTICO
**Problema**: Server response de 2,672ms

**Causas posibles**:
1. Firebase queries lentas
2. No hay caché de datos
3. Renderizado server-side pesado

**Soluciones**:

**A. Implementar ISR (Incremental Static Regeneration)**:
```tsx
// app/page.tsx
export const revalidate = 60; // Revalidar cada 60 segundos

export default async function Page() {
  // Fetch data
}
```

**B. Implementar React Server Components con Streaming**:
```tsx
// app/page.tsx
import { Suspense } from 'react';

export default function Page() {
  return (
    <>
      <Hero /> {/* Renderiza inmediatamente */}
      <Suspense fallback={<Skeleton />}>
        <DashboardData /> {/* Stream cuando esté listo */}
      </Suspense>
    </>
  );
}
```

**C. Caché de Firebase**:
```ts
// lib/firebase-cache.ts
import { unstable_cache } from 'next/cache';

export const getCachedData = unstable_cache(
  async (id: string) => {
    const doc = await getDoc(doc(db, 'collection', id));
    return doc.data();
  },
  ['data-cache'],
  { revalidate: 60 }
);
```

**Ahorro estimado**: TTFB de 2,672ms → 600ms (mejora de 2s)

---

#### 2.2 Habilitar Compresión y Caché ⚡ ALTO
**Problema**: No hay compresión de texto visible

**Solución**:
```js
// next.config.mjs
async headers() {
  return [
    {
      source: '/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
    {
      source: '/_next/static/:path*',
      headers: [
        {
          key: 'Cache-Control',
          value: 'public, max-age=31536000, immutable',
        },
      ],
    },
  ];
},

// Vercel automáticamente comprime, pero asegúrate:
compress: true,
```

---

### Fase 3: Optimizaciones Avanzadas (Impacto Medio, Esfuerzo Alto)

#### 3.1 Optimizar Dependencies
**Problema**: Muchas dependencias pesadas

**Análisis de bundles pesados**:
```bash
npm run analyze
```

**Alternativas ligeras**:
- `date-fns` → `date-fns/esm` con tree-shaking
- `lodash` → `lodash-es` o funciones nativas
- `framer-motion` → `motion` (versión ligera)
- Eliminar `@tsparticles` si no es crítico
- Eliminar `three` si no es esencial

**Ejemplo**:
```tsx
// Antes
import { format } from 'date-fns';

// Después
import format from 'date-fns/format';
```

---

#### 3.2 Preconnect y Resource Hints
**Problema**: Preconnects no utilizados

**Solución**:
```tsx
// app/layout.tsx
export default function RootLayout({ children }) {
  return (
    <html>
      <head>
        {/* Eliminar preconnects no usados */}
        {/* <link rel="preconnect" href="https://zentryapp-949f4.firebaseapp.com" /> */}
        
        {/* Agregar preconnect a recursos reales */}
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
      </head>
      <body>{children}</body>
    </html>
  );
}
```

---

#### 3.3 Optimizar Fonts
**Problema**: Fonts pueden estar bloqueando render

**Solución**:
```tsx
// app/layout.tsx
import { Geist } from 'next/font/google';

const geist = Geist({
  subsets: ['latin'],
  display: 'swap', // Importante para evitar FOIT
  preload: true,
  variable: '--font-geist',
});
```

---

#### 3.4 Reducir Layout Shifts
**Problema**: CLS de 0.001 (bajo pero mejorable)

**Solución**:
```tsx
// Reservar espacio para imágenes
<div className="relative w-[300px] h-[300px]">
  <Image
    src="/assets/HeroImage.webp"
    fill
    className="object-cover"
    sizes="300px"
  />
</div>

// Evitar animaciones que causen shifts
<span className="animate-pulse text-sky-300">
  {/* Asegurar que el contenido tenga altura fija */}
</span>
```

---

## 📋 Checklist de Implementación

### Prioridad 1 (Hacer HOY) ⚡
- [ ] Optimizar tamaños de imágenes con `sizes` correctos
- [ ] Agregar `priority` a imagen LCP (HeroImage)
- [ ] Implementar lazy loading de componentes pesados
- [ ] Purgar CSS no utilizado
- [ ] Implementar ISR en páginas principales

### Prioridad 2 (Esta semana) 🔥
- [ ] Implementar React Server Components con Streaming
- [ ] Agregar caché a queries de Firebase
- [ ] Optimizar imports de date-fns y lodash
- [ ] Eliminar dependencies no usadas
- [ ] Configurar headers de caché correctos

### Prioridad 3 (Próxima semana) 📊
- [ ] Analizar bundles con `npm run analyze`
- [ ] Reemplazar libraries pesadas
- [ ] Optimizar fonts con `display: swap`
- [ ] Implementar preload de recursos críticos
- [ ] Reducir layout shifts

---

## 🎯 Objetivos de Rendimiento

### Antes:
- TTFB: 2,680ms
- FCP: ~3,000ms
- LCP: ~9,700ms
- TBT: ~4,500ms
- Bundle size: 5,082 KiB

### Después (Objetivo):
- TTFB: <600ms ✅
- FCP: <1,000ms ✅
- LCP: <2,500ms ✅
- TBT: <300ms ✅
- Bundle size: <2,000 KiB ✅

---

## 🔧 Comandos Útiles

```bash
# Analizar bundles
npm run analyze

# Build de producción
npm run build

# Verificar tamaño de bundles
npx next build --profile

# Lighthouse CI
npx unlighthouse --site http://localhost:3000

# Verificar imágenes
npx next-image-export-optimizer
```

---

## 📚 Recursos

- [Next.js Performance](https://nextjs.org/docs/app/building-your-application/optimizing)
- [Web Vitals](https://web.dev/vitals/)
- [Bundle Analysis](https://nextjs.org/docs/app/building-your-application/optimizing/bundle-analyzer)
