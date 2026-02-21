# 🔔 Sistema Unificado de Notificaciones

## 📋 Descripción General

El sistema de notificaciones está diseñado para mostrar TODOS los tipos de notificaciones en un solo dropdown elegante en el navbar superior. Actualmente soporta:

- ✉️ **Mensajes Nuevos**: Notificaciones en tiempo real de mensajes del chat
- 🚨 **Alertas de Pánico**: Alertas activas que requieren atención inmediata (rojo)
- 📅 **Reservas Pendientes**: Solicitudes de reserva esperando aprobación (azul)
- 👥 **Nuevos Usuarios**: Usuarios registrados pendientes de aprobación (verde)
- 💰 **Pagos Pendientes**: Transferencias y pagos en efectivo por validar (morado)

## 🎨 Características

### ✨ Diseño

- **Dropdown Premium**: Estilo moderno con gradientes y efectos suaves
- **Categorización**: Las notificaciones se agrupan por tipo (Mensajes, Administración, etc.)
- **Badge Dinámico**: Muestra el número total de notificaciones pendientes
- **Adaptativo**: Se ajusta automáticamente a los 3 temas (Light, Dark, Zentry)
- **Iconos Contextuales**: Cada tipo de notificación tiene su propio icono y color
- **Estado Vacío Hermoso**: Mensaje positivo cuando no hay notificaciones

### ⚡ Funcionalidad

- **Tiempo Real**: Las notificaciones de mensajes aparecen instantáneamente
- **Click para Acción**: Cada notificación redirige a la página correspondiente
- **Auto-marcado**: Los mensajes se marcan como leídos automáticamente al hacer clic
- **Scroll Inteligente**: Maneja listas largas de notificaciones con scroll
- **Límite Visual**: Muestra solo las primeras 5 de cada tipo con opción de "ver más"

## 📁 Arquitectura

### Archivos Principales

```
src/
├── components/dashboard/
│   ├── navbar.tsx                          # Navbar con campanita
│   └── notifications-dropdown.tsx          # Contenido del dropdown (MODULAR)
├── lib/services/
│   └── message-notifications-service.ts    # Servicio de notificaciones de mensajes
└── app/dashboard/mensajes/
    └── page.tsx                            # Página de mensajes
```

### Flujo de Datos

```
Firebase Firestore (messageNotifications)
        ↓
onSnapshot listener (tiempo real)
        ↓
navbar.tsx (estado: messageNotifications)
        ↓
notifications-dropdown.tsx (renderiza)
        ↓
Usuario hace clic
        ↓
Marca como leído + redirige
```

## 🔧 Cómo Agregar Nuevos Tipos de Notificaciones

### Paso 1: Crear el Servicio (si es necesario)

Si tu notificación viene de Firestore y necesita tiempo real, crea un servicio similar a `message-notifications-service.ts`:

```typescript
// Ejemplo: src/lib/services/reservation-notifications-service.ts
export interface ReservationNotification {
  id: string;
  userId: string;
  reservationId: string;
  userName: string;
  amenity: string;
  date: Timestamp;
  read: boolean;
  createdAt: Timestamp;
}

export class ReservationNotificationsService {
  static subscribeToNotifications(
    residencialId: string,
    onUpdate: (notifications: ReservationNotification[]) => void
  ): () => void {
    const notificationsRef = collection(db, 'residenciales', residencialId, 'reservationNotifications');
    const q = query(
      notificationsRef,
      where('read', '==', false),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as ReservationNotification[];
      onUpdate(notifications);
    });
  }
}
```

### Paso 2: Agregar Estado en el Navbar

En `src/components/dashboard/navbar.tsx`:

```typescript
// Agregar el import
import { ReservationNotificationsService } from "@/lib/services/reservation-notifications-service";

// Agregar estado
const [reservationNotifications, setReservationNotifications] = useState<ReservationNotification[]>([]);

// Agregar suscripción en useEffect
useEffect(() => {
  if (!residencialId) return;

  const unsubscribe = ReservationNotificationsService.subscribeToNotifications(
    residencialId,
    (notifications) => {
      setReservationNotifications(notifications);
    }
  );

  return () => unsubscribe();
}, [residencialId]);
```

### Paso 3: Actualizar el Componente Dropdown

En `src/components/dashboard/notifications-dropdown.tsx`:

```typescript
// 1. Agregar la prop
interface NotificationsDropdownProps {
  messageNotifications: MessageNotification[];
  systemNotificationsCount: number;
  reservationNotifications?: ReservationNotification[]; // NUEVO
}

// 2. Agregar el icono
import { Calendar } from "lucide-react";

// 3. Agregar la sección en el render (después de mensajes)
{reservationNotifications && reservationNotifications.length > 0 && (
  <>
    <div className="px-4 py-2.5 bg-muted/30 sticky top-0 z-10">
      <div className="flex items-center gap-2">
        <Calendar className="h-3.5 w-3.5 text-primary" />
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
          Reservas ({reservationNotifications.length})
        </p>
      </div>
    </div>
    {reservationNotifications.slice(0, 5).map((notif) => (
      <div
        key={notif.id}
        onClick={() => handleReservationClick(notif)}
        className="px-4 py-3 hover:bg-primary/5 cursor-pointer transition-all duration-200 border-b border-border/50 group"
      >
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-500/10 group-hover:bg-blue-500/20 rounded-xl flex-shrink-0 transition-colors">
            <Calendar className="h-4 w-4 text-blue-500" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-foreground truncate">
              Nueva Reserva
            </p>
            <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
              {notif.userName} - {notif.amenity}
            </p>
          </div>
          <span className="h-2 w-2 bg-blue-500 rounded-full flex-shrink-0 mt-2 animate-pulse" />
        </div>
      </div>
    ))}
  </>
)}
```

### Paso 4: Pasar las Props desde el Navbar

En `src/components/dashboard/navbar.tsx`:

```typescript
<NotificationsDropdownContent
  messageNotifications={messageNotifications}
  systemNotificationsCount={notifCount ?? 0}
  reservationNotifications={reservationNotifications} // NUEVO
/>
```

### Paso 5: Actualizar el Badge Total

En `notifications-dropdown.tsx`, actualiza el cálculo del total:

```typescript
const totalNotifications = 
  unreadMessages.length + 
  systemNotificationsCount + 
  (reservationNotifications?.length ?? 0); // NUEVO
```

## 🎨 Personalización de Colores por Tipo

Cada tipo de notificación puede tener su propio color:

```typescript
// Mensajes - Primary (Azul Zentry)
<div className="p-2 bg-primary/10 rounded-xl">
  <MessageSquare className="h-4 w-4 text-primary" />
</div>

// Administración - Orange (Alerta)
<div className="p-2 bg-orange-500/10 rounded-xl">
  <AlertTriangle className="h-4 w-4 text-orange-500" />
</div>

// Reservas - Blue
<div className="p-2 bg-blue-500/10 rounded-xl">
  <Calendar className="h-4 w-4 text-blue-500" />
</div>

// Usuarios - Green
<div className="p-2 bg-green-500/10 rounded-xl">
  <Users className="h-4 w-4 text-green-500" />
</div>

// Alertas - Red
<div className="p-2 bg-red-500/10 rounded-xl">
  <Shield className="h-4 w-4 text-red-500" />
</div>
```

## 📊 Ejemplos de Tipos de Notificaciones

### 1. Notificaciones de Mensajes (✅ IMPLEMENTADO)
- Aparecen en tiempo real cuando alguien te envía un mensaje
- Se marcan como leídas automáticamente al hacer clic
- Redirigen al chat específico

### 2. Notificaciones Administrativas (✅ IMPLEMENTADO)
- Contador de elementos pendientes (usuarios, reservas, alertas)
- Redirige al dashboard principal

### 3. Futuras Expansiones (SUGERENCIAS)

**Reservas Pendientes:**
```typescript
{
  type: 'reservation',
  icon: Calendar,
  color: 'blue',
  title: 'Nueva Reserva',
  message: 'Juan Pérez - Alberca - 25/01/2026',
  action: '/dashboard/reservas'
}
```

**Nuevos Usuarios:**
```typescript
{
  type: 'user',
  icon: Users,
  color: 'green',
  title: 'Nuevo Usuario',
  message: 'María González solicitó acceso',
  action: '/dashboard/usuarios'
}
```

**Alertas de Pánico:**
```typescript
{
  type: 'panic',
  icon: Shield,
  color: 'red',
  title: '🚨 Alerta de Pánico',
  message: 'Casa #123 activó botón de pánico',
  action: '/dashboard/alertas'
}
```

**Pagos Pendientes:**
```typescript
{
  type: 'payment',
  icon: DollarSign,
  color: 'purple',
  title: 'Pago Pendiente',
  message: 'Validar pago de Casa #45',
  action: '/dashboard/pagos'
}
```

## 🔒 Seguridad

Las reglas de Firestore ya están configuradas para las notificaciones de mensajes. Si agregas nuevos tipos:

```javascript
// firestore.rules
match /residenciales/{residencialId}/reservationNotifications/{notifId} {
  allow read: if request.auth != null 
              && request.auth.uid == resource.data.userId;
  allow create: if request.auth != null;
  allow update: if request.auth != null 
                && request.auth.uid == resource.data.userId;
  allow delete: if request.auth != null 
                && request.auth.uid == resource.data.userId;
}
```

## 🚀 Beneficios del Sistema Actual

✅ **Modular**: Fácil agregar nuevos tipos de notificaciones
✅ **Escalable**: Maneja múltiples tipos sin afectar el rendimiento
✅ **Tiempo Real**: Actualizaciones instantáneas con Firestore
✅ **Responsive**: Funciona perfectamente en móvil y desktop
✅ **Accesible**: Navegación por teclado y screen readers
✅ **Hermoso**: Diseño profesional que se adapta a todos los temas
✅ **Intuitivo**: UX claro con iconos y colores distintivos

## 📱 Uso para el Usuario

1. **Ver notificaciones**: Click en la campanita
2. **Leer detalle**: Las notificaciones muestran preview del contenido
3. **Tomar acción**: Click en cualquier notificación redirige a la página correspondiente
4. **Estado claro**: Badge numérico muestra cuántas notificaciones hay
5. **Categorizado**: Las notificaciones están agrupadas por tipo para fácil navegación

¡El sistema está listo para crecer con tu aplicación! 🎉
