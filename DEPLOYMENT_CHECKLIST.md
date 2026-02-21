# Checklist de despliegue para mejor rendimiento Lighthouse

## Problema detectado

Las optimizaciones locales **no estaban desplegadas** porque:
1. **Las imágenes optimizadas no estaban en el commit** - El script `optimize-images` modificó los archivos pero no se hicieron commit
2. **Lighthouse ejecutado inmediatamente** - Vercel tarda 1-3 min en propagar el nuevo build; la caché puede servir contenido viejo

## Pasos para desplegar correctamente

### 1. Añadir y commitear las imágenes optimizadas

```bash
cd "/Users/gerardoarroyo/Desktop/Zentry WEB"

# Ver estado actual
git status public/assets

# Añadir TODAS las imágenes optimizadas
git add public/assets/

# Commit
git commit -m "perf: imágenes optimizadas para mejor puntuación Lighthouse"
```

### 2. Push y deploy

```bash
git push origin master
vercel --prod
```

### 3. Esperar antes de ejecutar Lighthouse

- **Espera 3-5 minutos** después de que Vercel termine el deploy
- Vercel CDN debe propagar el nuevo contenido
- Si ejecutas Lighthouse inmediatamente, puede medir el build anterior

### 4. Cómo ejecutar Lighthouse correctamente

1. **Modo incógnito** - Abre una ventana de incógnito (sin extensiones, sin caché)
2. **URL correcta** - https://www.zentrymx.com/
3. **Simulación móvil** - Lighthouse usa "Mobile" por defecto; es más estricto
4. **Una sola pestaña** - Cierra otras pestañas para recursos de CPU

### 5. Verificar que el deploy tiene los cambios

Después del deploy, verifica en el HTML fuente (Cmd+U o "Ver código fuente"):

- Debe haber: `<link rel="preconnect" href="https://zentryapp-949f4.firebaseapp.com">`
- Las imágenes deben cargar desde `/_next/image?url=...` (optimizadas) no directamente desde `/assets/`

## Cambios aplicados en este commit

- Firebase Auth diferido en landing (evita ~13s de bloqueo)
- Imágenes con `sizes` responsivos
- Preconnect a Firebase/Google
- Pathname null fix en AuthProvider
- Lazy load del shader Three.js

## Si el puntaje sigue bajo

Lighthouse simula una conexión 4G lenta. En condiciones reales (WiFi/fibra) la página carga más rápido. El puntaje objetivo razonable tras estas optimizaciones: **50-70** en móvil.
