# Sistema de Control de Morosos

## Descripción General

El sistema de control de morosos permite a los administradores marcar usuarios como morosos, lo que automáticamente restringe sus funcionalidades y limita la generación de códigos QR.

## Funcionalidades Implementadas

### 1. Cambio de Estado de Moroso

**Ubicación**: `src/lib/firebase/firestore.ts` - Función `cambiarEstadoMoroso`

**Comportamiento**:
- **Al marcar como moroso**: 
  - Se desactivan automáticamente todas las funciones del usuario
  - Se limita la generación de códigos QR a 5 por día
- **Al desmarcar como moroso**:
  - Se restauran todas las funciones por defecto (habilitadas)
  - Se elimina el límite de códigos QR (ilimitados)

### 2. Interfaz de Usuario

#### Tabla de Usuarios
- **Toggle visual**: Fondo verde cuando está activado (moroso)
- **Actualización en tiempo real**: Los cambios se reflejan inmediatamente

#### Modal de Edición
- **Indicador visual**: Tarjeta roja que indica el estado de moroso
- **Controles editables**: Las funciones se pueden modificar, pero se deshabilitan automáticamente al guardar para usuarios morosos
- **Límite configurable**: Los códigos QR se pueden modificar, pero se limitan automáticamente a 5 por día al guardar para usuarios morosos
- **Mensajes informativos**: Explican que las restricciones se aplicarán automáticamente al guardar

## Estructura de Datos

### Campos del Usuario
```typescript
interface Usuario {
  // ... otros campos
  isMoroso?: boolean;                    // Estado de moroso
  features?: UserFeatures;               // Control de funciones
  max_codigos_qr_diarios?: number;      // Límite de códigos QR
}

interface UserFeatures {
  visitas: boolean;      // Permitir visitas
  eventos: boolean;      // Permitir eventos
  mensajes: boolean;     // Permitir mensajes
  reservas: boolean;     // Permitir reservas
  encuestas: boolean;    // Permitir encuestas
}
```

## Flujo de Funcionamiento

1. **Administrador marca usuario como moroso**
2. **Sistema automáticamente**:
   - Desactiva todas las funciones (`features.* = false`)
   - Establece límite de códigos QR a 5 (`max_codigos_qr_diarios = 5`)
3. **Interfaz se actualiza**:
   - Toggle muestra fondo verde
   - Modal de edición permite editar controles, pero aplica restricciones al guardar
   - Se muestran mensajes informativos sobre restricciones automáticas

## Beneficios

- **Control automático**: No requiere configuración manual adicional
- **Consistencia**: Todos los usuarios morosos tienen las mismas restricciones
- **Transparencia**: El usuario y administradores ven claramente el estado
- **Seguridad**: Previene el uso de funcionalidades por usuarios morosos

## Consideraciones Técnicas

- **Actualización en tiempo real**: Los cambios se reflejan inmediatamente en toda la interfaz
- **Validación inteligente**: Los controles se pueden editar, pero las restricciones se aplican automáticamente al guardar para usuarios morosos
- **Logging**: Se registran todas las operaciones para auditoría
- **Manejo de errores**: Errores se capturan y reportan apropiadamente

## Uso Recomendado

1. **Marcar como moroso**: Cuando un usuario tenga pagos pendientes o incumpla reglas
2. **Revisar estado**: Verificar regularmente la lista de usuarios morosos
3. **Desmarcar**: Cuando el usuario regularice su situación
4. **Monitoreo**: Revisar logs para auditoría de cambios

## Futuras Mejoras

- [ ] Notificaciones automáticas al marcar/desmarcar como moroso
- [ ] Historial de cambios de estado
- [ ] Configuración personalizable de restricciones por residencial
- [ ] Reportes de usuarios morosos
- [ ] Integración con sistema de pagos para detección automática
