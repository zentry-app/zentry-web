# Guía de Despliegue en Vercel - Zentry WEB

## 📋 Prerrequisitos

1. **Cuenta de Vercel**: Crear una cuenta en [vercel.com](https://vercel.com)
2. **CLI de Vercel**: Instalar Vercel CLI globalmente
3. **Variables de entorno**: Configurar las variables necesarias

## 🚀 Pasos para el Despliegue

### 1. Instalar Vercel CLI
```bash
npm install -g vercel
```

### 2. Iniciar sesión en Vercel
```bash
vercel login
```

### 3. Configurar Variables de Entorno

Antes de desplegar, necesitas configurar las siguientes variables de entorno en Vercel:

#### Variables Requeridas (Firebase):
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

#### Variables del Servidor (Firebase Admin):
- `FIREBASE_SERVICE_ACCOUNT_KEY` (JSON completo de la cuenta de servicio)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_STORAGE_BUCKET`

#### Variables de Email (Opcional):
- `RESEND_API_KEY` (para Resend)
- `SENDGRID_API_KEY` (para SendGrid)
- `GMAIL_USER` (para Gmail)
- `GMAIL_APP_PASSWORD` (para Gmail)
- `FROM_EMAIL`

#### Variables de NextAuth:
- `NEXTAUTH_SECRET` (generar con: `openssl rand -base64 32`)
- `NEXTAUTH_URL` (se configurará automáticamente en Vercel)

### 4. Desplegar la Aplicación

#### Opción A: Despliegue Automático (Recomendado)
```bash
# En la raíz del proyecto
vercel
```

#### Opción B: Despliegue Manual
```bash
# Construir la aplicación
npm run build

# Desplegar
vercel --prod
```

### 5. Configurar Variables de Entorno en Vercel Dashboard

1. Ve a tu proyecto en [vercel.com/dashboard](https://vercel.com/dashboard)
2. Selecciona tu proyecto
3. Ve a "Settings" → "Environment Variables"
4. Agrega todas las variables mencionadas arriba

### 6. Configurar Dominio Personalizado (Opcional)

1. En el dashboard de Vercel, ve a "Settings" → "Domains"
2. Agrega tu dominio personalizado
3. Configura los registros DNS según las instrucciones

## 🔧 Configuración Específica

### Configuración de Next.js
- ✅ `output: 'export'` removido para compatibilidad con Vercel
- ✅ `unoptimized: false` para optimización de imágenes
- ✅ Configuración de webpack optimizada

### Configuración de Vercel
- ✅ Runtime de Node.js 18.x para API routes
- ✅ Configuración de funciones optimizada

## 🧪 Verificación Post-Despliegue

### URLs de Verificación:
- `/` - Página principal
- `/login` - Página de login
- `/dashboard` - Dashboard principal
- `/dashboard/usuarios` - Gestión de usuarios
- `/api/auth/session` - Verificar autenticación

### Funcionalidades Críticas a Verificar:
- ✅ Autenticación de usuarios
- ✅ Carga de datos desde Firestore
- ✅ Funcionamiento de API routes
- ✅ Envío de emails
- ✅ Gestión de usuarios

## 🐛 Solución de Problemas

### Error: "Build failed"
```bash
# Verificar build local
npm run build

# Verificar tipos
npx tsc --noEmit

# Verificar linting
npm run lint
```

### Error: "Environment variables missing"
- Verificar que todas las variables estén configuradas en Vercel
- Asegurarse de que los nombres coincidan exactamente

### Error: "Firebase connection failed"
- Verificar configuración de Firebase
- Asegurarse de que las credenciales sean correctas
- Verificar que el proyecto esté activo

### Error: "API routes not working"
- Verificar que las variables del servidor estén configuradas
- Asegurarse de que el runtime sea Node.js 18.x

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs en Vercel Dashboard
2. Verifica la configuración local
3. Consulta la documentación de Vercel
4. Contacta al equipo de desarrollo

## 🔄 Despliegues Futuros

Para futuros despliegues, simplemente:
```bash
git push origin main
```
Vercel detectará automáticamente los cambios y desplegará la nueva versión.

O manualmente:
```bash
vercel --prod
```
