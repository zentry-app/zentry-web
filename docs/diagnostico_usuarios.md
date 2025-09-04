# 🔍 Diagnóstico de Usuarios que No Aparecen

## Problema Descrito
Algunos usuarios (incluyendo el usuario administrador) aparecen y desaparecen de manera inconsistente en la tabla de usuarios.

## Posibles Causas

### 1. **Límites de Consulta**
- **Problema**: La función `getUsuarios` tiene un límite por defecto de 50 usuarios
- **Solución**: Se ha implementado la opción `getAll: true` para obtener todos los usuarios

### 2. **Filtrado por Residencial**
- **Problema**: Si eres admin de un residencial específico, solo ves usuarios de ese residencial
- **Solución**: Verificar que estés viendo el residencial correcto

### 3. **Estado de Usuarios**
- **Problema**: Solo se muestran usuarios con estado "approved"
- **Solución**: Verificar el estado de tu usuario en la base de datos

### 4. **Problemas de Carga**
- **Problema**: La tabla puede no cargar completamente
- **Solución**: Usar el botón "Recargar usuarios" o revisar la consola

## 🔧 Soluciones Implementadas

### 1. **Nuevas Funciones de Firestore**
```typescript
// Obtener todos los usuarios sin límite
await getUsuarios({ getAll: true });

// Obtener todos los usuarios de un residencial específico
await getUsuariosPorResidencial(residencialId, { getAll: true });

// Nueva función con paginación automática
await getAllUsuarios();
```

### 2. **Indicador Visual de Usuarios**
Se agregó un panel que muestra:
- **Total en BD**: Usuarios totales en la base de datos
- **Del residencial**: Usuarios del residencial seleccionado
- **Mostrando**: Usuarios que se están mostrando actualmente
- **Advertencia**: Si no se están mostrando todos los usuarios

### 3. **Botón de Recarga**
- Botón "Recargar usuarios" que fuerza una recarga completa
- Útil cuando la tabla no muestra todos los usuarios esperados

## 🚀 Pasos para Diagnosticar

### Paso 1: Verificar la Consola del Navegador
1. Abre las herramientas de desarrollador (F12)
2. Ve a la pestaña Console
3. Recarga la página
4. Busca mensajes que empiecen con:
   - 🔍 (Buscando usuarios)
   - ✅ (Usuarios obtenidos)
   - ❌ (Errores)
   - ⚠️ (Advertencias)

### Paso 2: Usar el Script de Diagnóstico
1. Ve a la página de usuarios
2. Abre la consola (F12)
3. Copia y pega el contenido de `scripts/diagnostico_consola.js`
4. Ejecuta las funciones disponibles:
   ```javascript
   // Diagnóstico automático
   window.diagnosticoUsuarios.diagnosticar()
   
   // Verificar usuario específico
   window.diagnosticoUsuarios.verificarUsuario("tu@email.com")
   
   // Estadísticas de la tabla
   window.diagnosticoUsuarios.estadisticas()
   ```

### Paso 3: Verificar el Residencial Seleccionado
1. Asegúrate de que el residencial seleccionado sea correcto
2. Si eres admin global, prueba seleccionar "Todos los residenciales"
3. Si eres admin de residencial, verifica que esté seleccionado tu residencial

### Paso 4: Usar el Botón de Recarga
1. Haz clic en "Recargar usuarios"
2. Espera a que termine la carga
3. Verifica si aparecen más usuarios

## 📊 Verificación de Datos

### Verificar Usuario Específico
```javascript
// En la consola del navegador
window.diagnosticoUsuarios.verificarUsuario("tu@email.com")
```

### Verificar Estado de la Tabla
```javascript
// En la consola del navegador
window.diagnosticoUsuarios.estadisticas()
```

### Verificar Logs de Carga
Busca en la consola mensajes como:
```
🔍 Cargando TODOS los usuarios para admin global...
✅ Total de usuarios cargados: 150
🔍 Cargando usuarios del residencial: RES001
✅ Usuarios del residencial: 45
```

## 🐛 Problemas Comunes y Soluciones

### Problema: "No veo ningún usuario"
**Solución**:
1. Verifica que estés logueado como admin
2. Revisa que no haya filtros activos
3. Usa el botón "Recargar usuarios"
4. Revisa la consola para errores

### Problema: "Veo menos usuarios de los esperados"
**Solución**:
1. Verifica el residencial seleccionado
2. Revisa si hay filtros de búsqueda activos
3. Usa el botón "Recargar usuarios"
4. Verifica el indicador de usuarios en la parte superior

### Problema: "Mi usuario no aparece"
**Solución**:
1. Verifica que tu usuario esté en el residencial correcto
2. Verifica que tu usuario tenga estado "approved"
3. Usa la función de verificación específica:
   ```javascript
   window.diagnosticoUsuarios.verificarUsuario("tu@email.com")
   ```

## 🔍 Debugging Avanzado

### Verificar Llamadas a Firestore
1. Ve a la pestaña Network en las herramientas de desarrollador
2. Recarga la página
3. Busca llamadas a Firestore
4. Verifica que no haya errores 4xx o 5xx

### Verificar Estado de Autenticación
1. En la consola, verifica:
   ```javascript
   // Verificar si hay usuario autenticado
   console.log('Usuario actual:', window.currentUser);
   
   // Verificar claims del usuario
   console.log('Claims del usuario:', window.userClaims);
   ```

### Verificar Caché del Navegador
1. Limpia el caché del navegador
2. Cierra y abre el navegador
3. Intenta acceder nuevamente

## 📞 Contacto y Soporte

Si el problema persiste después de seguir estos pasos:

1. **Recopila información**:
   - Screenshots de la consola
   - Logs de error
   - Estado de la tabla
   - Usuario que no aparece

2. **Contacta al administrador** del sistema con:
   - Descripción del problema
   - Pasos para reproducirlo
   - Información recopilada

## 📝 Notas Técnicas

### Cambios Implementados
- ✅ Función `getUsuarios` con opción `getAll: true`
- ✅ Función `getAllUsuarios` con paginación automática
- ✅ Función `getUsuariosPorResidencial` mejorada
- ✅ Indicador visual de usuarios
- ✅ Botón de recarga manual
- ✅ Script de diagnóstico para consola

### Archivos Modificados
- `src/lib/firebase/firestore.ts` - Funciones de consulta
- `app/dashboard/usuarios/page.tsx` - Interfaz de usuario
- `scripts/diagnostico_consola.js` - Script de diagnóstico
- `docs/diagnostico_usuarios.md` - Esta documentación

### Dependencias
- Firebase Firestore
- React hooks (useState, useEffect, useCallback, useMemo)
- Next.js
- Tailwind CSS
