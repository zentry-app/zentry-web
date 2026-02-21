# 🏷️ Sistema de Badges Dinámicos en el Sidebar

## ✅ Implementación Completa

Se ha implementado un sistema de badges dinámicos en el menú del sidebar que muestra contadores en tiempo real para diferentes secciones del dashboard.

## 📊 Badges Implementados

| Sección | Badge | Color | Descripción |
|---------|-------|-------|-------------|
| **👥 Usuarios** | Verde | `bg-muted` | Muestra usuarios pendientes de aprobación |
| **💬 Mensajes** | Azul | `bg-primary` | Muestra mensajes no leídos |
| **📅 Reservas** | Normal | `bg-muted` | Muestra reservas pendientes de aprobación |
| **🚨 Alertas** | Rojo | `bg-destructive` | Muestra alertas de pánico activas |

## 🏗️ Arquitectura

### 1. Contexto de Notificaciones

Se creó un contexto centralizado que maneja TODAS las notificaciones:

```typescript
// src/contexts/NotificationsContext.tsx
export interface NotificationsContextType {
  messageNotifications: MessageNotification[];
  unreadMessagesCount: number;
  panicAlertsCount: number;
  pendingReservationsCount: number;
  pendingUsersCount: number;
  pendingPaymentsCount: number;
  totalCount: number;
  isLoading: boolean;
}
```

**Beneficios:**
- ✅ Un solo lugar para manejar los conteos
- ✅ Actualización automática cada 60 segundos
- ✅ Tiempo real para mensajes con `onSnapshot`
- ✅ Compartido entre navbar y sidebar
- ✅ Sin duplicación de lógica

### 2. Provider en el Layout

El `NotificationsProvider` envuelve todo el dashboard:

```typescript
// src/components/dashboard/dashboard-layout-client.tsx
return (
  <NotificationsProvider>
    <Navbar />
    <Sidebar />
    <Main>{children}</Main>
  </NotificationsProvider>
);
```

### 3. Navbar Actualizado

El navbar ya NO maneja su propio estado, usa el contexto:

```typescript
// src/components/dashboard/navbar.tsx
const {
  messageNotifications,
  panicAlertsCount,
  pendingReservationsCount,
  pendingUsersCount,
  pendingPaymentsCount,
  totalCount
} = useNotifications();
```

**Cambios:**
- ❌ Eliminados: estados locales, useEffects, función resolveResidencialDocId
- ✅ Simplificado: 130+ líneas eliminadas
- ✅ Mejorado: No más duplicación de lógica

### 4. Sidebar con Badges Dinámicos

El sidebar ahora obtiene los badges del contexto:

```typescript
// src/components/dashboard/dashboard-nav.tsx
const {
  unreadMessagesCount,
  panicAlertsCount,
  pendingReservationsCount,
  pendingUsersCount,
} = useNotifications();

const getDynamicBadge = (href: string): string | undefined => {
  switch (href) {
    case '/dashboard/usuarios':
      return pendingUsersCount > 0 ? pendingUsersCount.toString() : undefined;
    case '/dashboard/mensajes':
      return unreadMessagesCount > 0 ? unreadMessagesCount.toString() : undefined;
    case '/dashboard/reservas':
      return pendingReservationsCount > 0 ? pendingReservationsCount.toString() : undefined;
    case '/dashboard/alertas-panico':
      return panicAlertsCount > 0 ? panicAlertsCount.toString() : undefined;
    default:
      return undefined;
  }
};
```

**Prioridad de Badges:**
1. Badge dinámico (del contexto)
2. Badge estático (hardcodeado en el item)
3. Sin badge

## 🔄 Flujo de Datos

```
Firebase Firestore
      ↓
NotificationsContext (cada 60s)
      ↓
  ┌───────────────┐
  │               │
  ↓               ↓
Navbar        Sidebar
  │               │
  ├─ Bell Icon    ├─ Usuarios Badge
  ├─ Badge Total  ├─ Mensajes Badge
  └─ Dropdown     ├─ Reservas Badge
                  └─ Alertas Badge
```

## ✨ Características

### Actualización Automática
- **Mensajes**: Tiempo real con Firestore `onSnapshot`
- **Sistema**: Polling cada 60 segundos
- **Sin recargas**: Todo funciona sin refrescar la página

### Badges Inteligentes
- Solo se muestran si el conteo > 0
- Desaparecen automáticamente cuando se resuelven
- Colores consistentes con el tema activo

### Sincronización
- Navbar y sidebar siempre muestran los mismos conteos
- Un solo punto de verdad (el contexto)
- No hay desincronización posible

## 📝 Changelog

### Agregado
- ✅ `NotificationsContext.tsx`: Contexto centralizado
- ✅ Provider en dashboard layout
- ✅ Hook `useNotifications()` para consumir el contexto
- ✅ Badges dinámicos en sidebar (Usuarios, Mensajes, Reservas, Alertas)

### Modificado
- ✅ `navbar.tsx`: Usa contexto en lugar de estado local
- ✅ `dashboard-nav.tsx`: Implementa badges dinámicos
- ✅ `dashboard-layout-client.tsx`: Envuelve con NotificationsProvider

### Eliminado
- ❌ Badge hardcodeado `"24"` de Alertas
- ❌ Estados locales en navbar para notificaciones
- ❌ useEffects duplicados para cargar conteos
- ❌ Función `resolveResidencialDocId` duplicada

## 🎯 Resultados

### Antes
- ❌ Lógica duplicada en navbar y sidebar
- ❌ Badges hardcodeados estáticos
- ❌ Sin sincronización entre componentes
- ❌ 2 lugares diferentes cargando los mismos datos

### Después
- ✅ Lógica centralizada en el contexto
- ✅ Badges dinámicos en tiempo real
- ✅ Perfecta sincronización
- ✅ Un solo lugar cargando datos
- ✅ Código más limpio y mantenible

## 🚀 Extensibilidad

Para agregar un nuevo badge a otra sección del sidebar:

```typescript
// 1. En NotificationsContext, agregar el conteo si no existe
const [newItemCount, setNewItemCount] = useState(0);

// 2. En el useEffect del contexto, cargar el conteo
let newCount = 0;
// ... lógica para obtener el conteo ...
setNewItemCount(newCount);

// 3. Exportar en el contexto
return (
  <NotificationsContext.Provider
    value={{
      // ... otros valores ...
      newItemCount,
    }}
  >
    {children}
  </NotificationsContext.Provider>
);

// 4. En dashboard-nav.tsx, obtener del contexto
const { newItemCount } = useNotifications();

// 5. Agregar al switch de getDynamicBadge
case '/dashboard/nueva-seccion':
  return newItemCount > 0 ? newItemCount.toString() : undefined;
```

## 📱 Vista del Sidebar

```
┌──────────────────────────┐
│  PRINCIPAL               │
│  🏠 Dashboard            │
│  👥 Usuarios        [3]  │ ← Badge Verde
│  🏢 Residenciales        │
│                          │
│  GESTIÓN                 │
│  📅 Reservas        [2]  │ ← Badge Naranja
│  🏛️ Pagos               │
│  📢 Comunicados          │
│                          │
│  MONITOREO               │
│  📋 Ingresos             │
│  🚨 Alertas         [1]  │ ← Badge Rojo
│  💬 Mensajes        [5]  │ ← Badge Azul
│  🔔 Notificaciones       │
└──────────────────────────┘
```

## ✅ Testing

Para verificar que funciona correctamente:

1. **Usuarios Pendientes**:
   - Registra un nuevo usuario
   - El badge debe aparecer en "Usuarios" del sidebar
   - Aprueba el usuario
   - El badge debe desaparecer

2. **Mensajes**:
   - Envía un mensaje desde otra cuenta
   - El badge debe aparecer instantáneamente
   - Abre el chat
   - El badge debe desaparecer

3. **Reservas**:
   - Crea una reserva pendiente
   - El badge debe aparecer en "Reservas"
   - Aprueba/rechaza la reserva
   - El badge debe desaparecer

4. **Alertas**:
   - Activa una alerta de pánico
   - El badge debe aparecer en "Alertas"
   - Resuelve la alerta
   - El badge debe desaparecer

## 🎨 Personalización

Los badges se adaptan automáticamente a los 3 temas:

**Light Theme:**
- Badges con `bg-muted` (gris suave)
- Texto oscuro para contraste

**Dark Theme:**
- Badges con `bg-muted` (gris oscuro)
- Texto claro para contraste

**Zentry Theme:**
- Badges con `bg-white/20` (blanco transparente)
- Texto blanco para mantener la estética

## 🏆 Logros

- ✅ Sistema completamente funcional
- ✅ Código limpio y mantenible
- ✅ Sin duplicación de lógica
- ✅ Badges dinámicos en tiempo real
- ✅ Sincronización perfecta entre componentes
- ✅ Fácil de extender con nuevos badges
- ✅ Adaptado a todos los temas

¡El sistema de badges dinámicos está listo para producción! 🎉
