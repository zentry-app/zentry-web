# Reglas de Firestore para Notificaciones de Mensajes

## 📋 Instrucciones

Estas son las reglas de seguridad de Firestore que debes agregar para que funcione el sistema de notificaciones de mensajes en tiempo real.

## 🗂️ Estructura de Datos

Las notificaciones están organizadas por residencial para mejor organización y escalabilidad:

```
residenciales/{residencialId}/messageNotifications/{notificationId}
```

## 🔧 Cómo aplicar las reglas

1. Ve a [Firebase Console](https://console.firebase.google.com/)
2. Selecciona tu proyecto
3. Ve a **Firestore Database** > **Reglas**
4. Agrega las siguientes reglas dentro de `match /residenciales/{residencialId}`

## 📝 Reglas a agregar

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    
    // Dentro de match /residenciales/{residencialId} {...}
    
    match /residenciales/{residencialId} {
      // ... tus reglas existentes de residenciales ...
      
      // ✨ REGLAS PARA NOTIFICACIONES DE MENSAJES (organizadas por residencial)
      match /messageNotifications/{notificationId} {
        // Permitir lectura solo al usuario propietario de la notificación
        allow read: if request.auth != null 
                    && request.auth.uid == resource.data.userId;
        
        // Permitir escritura (crear) a cualquier usuario autenticado
        // (para que los remitentes puedan crear notificaciones)
        allow create: if request.auth != null 
                      && request.resource.data.keys().hasAll(['userId', 'senderId', 'senderName', 'chatId', 'message', 'read', 'createdAt'])
                      && request.resource.data.read == false;
        
        // Permitir actualización solo al propietario de la notificación
        // (para marcar como leída)
        allow update: if request.auth != null 
                      && request.auth.uid == resource.data.userId
                      && request.resource.data.userId == resource.data.userId
                      && request.resource.data.senderId == resource.data.senderId
                      && request.resource.data.chatId == resource.data.chatId;
        
        // Permitir eliminación solo al propietario de la notificación
        allow delete: if request.auth != null 
                      && request.auth.uid == resource.data.userId;
      }
    }
  }
}
```

## 🎯 Explicación de las reglas

### Lectura (read)
- Solo el usuario destinatario (`userId`) puede leer sus propias notificaciones
- Esto garantiza la privacidad de los mensajes

### Creación (create)
- Cualquier usuario autenticado puede crear notificaciones
- Se valida que incluya todos los campos requeridos
- El campo `read` debe ser `false` inicialmente

### Actualización (update)
- Solo el destinatario puede actualizar sus notificaciones
- No se pueden cambiar los campos críticos (userId, senderId, chatId)
- Esto permite marcar como leída la notificación

### Eliminación (delete)
- Solo el destinatario puede eliminar sus propias notificaciones
- Esto permite limpiar el historial de notificaciones

## ✅ Verificación

Después de aplicar las reglas, verifica que:
1. Los usuarios pueden recibir notificaciones de nuevos mensajes
2. Las notificaciones aparecen en tiempo real en la campanita del navbar
3. Los usuarios pueden marcar notificaciones como leídas
4. Los usuarios pueden eliminar sus notificaciones
5. Los usuarios NO pueden ver notificaciones de otros usuarios

## 🚀 Características del Sistema

- ✅ Notificaciones en tiempo real con Firestore onSnapshot
- ✅ Badge con contador de mensajes no leídos
- ✅ Diálogo completo con lista de notificaciones
- ✅ Marcar como leído individual o todas a la vez
- ✅ Eliminar notificaciones individuales
- ✅ Redirección automática al chat al hacer clic
- ✅ Colores adaptativos a los temas (Light/Dark/Zentry)
- ✅ Animaciones y transiciones suaves
- ✅ Responsive y optimizado para mobile

## 📱 Uso del Sistema

### Para Usuarios:
1. Cuando alguien te envíe un mensaje, verás un punto rojo en la campanita
2. El número muestra cuántos mensajes sin leer tienes
3. Haz clic en la campanita para ver todas las notificaciones
4. Haz clic en una notificación para ir directamente al chat
5. Usa "Marcar como leído" o "Eliminar" según necesites
6. Usa "Marcar todas" para marcar todos los mensajes como leídos

### Para Desarrolladores:
El sistema se integra automáticamente cuando:
- Un usuario envía un mensaje en `/dashboard/mensajes`
- El sistema crea una notificación en `residenciales/{residencialId}/messageNotifications`
- El navbar escucha las notificaciones en tiempo real mediante `NotificationsContext`
- Las notificaciones se actualizan automáticamente sin recargar la página
- Los mensajes de Flutter también generan notificaciones automáticamente mediante `MessageListenerService`

## 🔒 Seguridad

- Las notificaciones son privadas por usuario
- Solo el propietario puede leer, actualizar y eliminar sus notificaciones
- Los campos críticos no se pueden modificar una vez creados
- Se valida la estructura de datos en la creación
