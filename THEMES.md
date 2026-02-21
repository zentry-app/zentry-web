# 🎨 Sistema de Temas de Zentry

Este proyecto cuenta con **3 temas** distintos que los usuarios pueden seleccionar según su preferencia:

## Temas Disponibles

### 1. 🌞 Tema Claro (Light)
- **Descripción**: Tema pálido y minimalista con tonos blancos y grises suaves
- **Características**:
  - Fondo blanco puro
  - Texto oscuro para máxima legibilidad
  - Bordes sutiles
  - Ideal para ambientes con buena iluminación
  - Menor fatiga visual en entornos brillantes

### 2. 🎨 Tema Zentry (Colorido - NUEVO)
- **Descripción**: Tema intermedio vibrante basado en los colores del logo de Zentry
- **Características**:
  - **Navbar**: Azul vibrante (#0D8BFF) con logo blanco
  - **Fondo**: Azul muy bajito (98% lightness) para contrastar con cards blancos
  - **Sidebar**: Azul del logo con iconos en colores llamativos
  - **Iconos coloridos** con efecto de glow:
    - 🏠 Home: Azul Zentry
    - 👥 Usuarios: Verde vibrante
    - 🏢 Residenciales: Púrpura
    - 🗺️ Áreas Comunes: Amarillo
    - 📅 Reservas: Rosa
    - 🏷️ Tags: Cyan
    - 📋 Ingresos: Naranja
    - 💰 Pagos: Verde
    - 🛡️ Guardias: Rojo
  - **Cards**: Blancos con bordes azules sutiles
  - **Paleta de colores vibrantes** para charts y elementos visuales
  - Ideal para quienes buscan una interfaz moderna y energética

### 3. 🌙 Tema Oscuro (Dark)
- **Descripción**: Tema muy oscuro y elegante para ambientes con poca luz
- **Características**:
  - Fondo negro/gris muy oscuro
  - Texto blanco/gris claro
  - Azul Zentry más brillante para contraste
  - Reduce fatiga visual en ambientes oscuros
  - Ahorra batería en pantallas OLED

## Cómo Cambiar de Tema

Los usuarios pueden cambiar el tema desde el botón de tema en la barra de navegación superior:

1. Click en el icono de sol/luna/paleta en la navbar
2. Seleccionar entre:
   - ☀️ **Claro** - Tema pálido
   - 🎨 **Zentry** - Tema colorido (NUEVO)
   - 🌙 **Oscuro** - Tema muy oscuro
   - 💻 **Sistema** - Sigue la preferencia del sistema operativo

## Implementación Técnica

### Variables CSS

Cada tema define sus propias variables CSS en `app/globals.css`:

```css
:root { /* Tema Claro */ }
.dark { /* Tema Oscuro */ }
.zentry { /* Tema Zentry - NUEVO */ }
```

### Uso en Componentes

Los componentes utilizan clases condicionales con el prefijo del tema:

```tsx
className={cn(
  "bg-background text-foreground",           // Por defecto
  "dark:bg-dark-background dark:text-white", // Dark theme
  "zentry:bg-primary zentry:text-white"      // Zentry theme
)}
```

### Iconos Coloridos en Tema Zentry

El tema Zentry incluye variables especiales para iconos coloridos:

```css
--icon-home: 211 100% 53%;      /* Azul Zentry */
--icon-users: 142 76% 36%;      /* Verde */
--icon-building: 262 83% 58%;   /* Púrpura */
--icon-map: 45 93% 47%;         /* Amarillo */
/* ... más colores */
```

Estos colores se aplican automáticamente a los iconos del sidebar cuando el tema Zentry está activo.

## Paleta de Colores del Tema Zentry

### Colores Principales
- **Primary**: `#0D8BFF` (Azul del logo)
- **Background**: `hsl(211, 100%, 98%)` (Azul muy bajito)
- **Card**: `#FFFFFF` (Blanco puro)

### Colores de Iconos
- **Azul**: `hsl(211, 100%, 53%)` - Home, Settings
- **Verde**: `hsl(142, 76%, 36%)` - Usuarios, Pagos
- **Púrpura**: `hsl(262, 83%, 58%)` - Residenciales
- **Amarillo**: `hsl(45, 93%, 47%)` - Áreas Comunes
- **Rosa**: `hsl(346, 77%, 50%)` - Reservas, Guardias
- **Cyan**: `hsl(180, 77%, 40%)` - Tags
- **Naranja**: `hsl(30, 100%, 50%)` - Ingresos

## Características Especiales del Tema Zentry

### 1. Navbar con Glassmorphism
- Fondo azul vibrante con efecto de vidrio esmerilado
- Logo invertido a blanco para contraste
- Iconos blancos con hover effects

### 2. Sidebar Colorido
- Fondo azul del logo
- Texto blanco para legibilidad
- Iconos con colores vibrantes y efecto glow
- Hover states con fondo blanco semi-transparente

### 3. Fondo con Gradiente Sutil
- Gradiente azul muy suave en el fondo principal
- Cards blancos que destacan sobre el fondo
- Bordes con tinte azul

### 4. Efectos Visuales
- Drop shadows en iconos activos
- Transiciones suaves entre estados
- Efectos de hover elegantes
- Animaciones sutiles

## Persistencia del Tema

El tema seleccionado se guarda automáticamente en `localStorage` y se restaura cuando el usuario vuelve a la aplicación.

## Accesibilidad

Todos los temas cumplen con los estándares WCAG 2.1 AA para contraste de color:
- ✅ Texto sobre fondos: ratio mínimo 4.5:1
- ✅ Elementos interactivos: ratio mínimo 3:1
- ✅ Iconos importantes: colores distinguibles

## Recomendaciones de Uso

- **Tema Claro**: Oficinas, espacios bien iluminados, lecturas largas
- **Tema Zentry**: Uso general, presentaciones, interfaz moderna
- **Tema Oscuro**: Trabajo nocturno, ambientes oscuros, ahorro de energía

---

**Nota**: El tema Zentry es el tema recomendado para mostrar la identidad visual de la marca.
