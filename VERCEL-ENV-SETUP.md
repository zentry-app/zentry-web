# 🔧 Configuración de Variables de Entorno en Vercel

## 📋 Variables Generadas Automáticamente

### ✅ Variables de Firebase (Cliente) - Listas para copiar:

```
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAPKpz9Twt_n8Zgkk8mh4cFNuo4SipwG5c
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=zentryapp-949f4.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=zentryapp-949f4
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=zentryapp-949f4.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=905646843025
NEXT_PUBLIC_FIREBASE_APP_ID=1:905646843025:web:9b23d5c6d6d6c78f93cb30
```

### ✅ Variables de NextAuth - Listas para copiar:

```
NEXTAUTH_SECRET=xebe+9FDlbsmEPcgth+S0GB2mkQB9Oc/JaDd0i/uOyU=
NEXTAUTH_URL=https://zentry-web-2is8s7clv-gera09azs-projects.vercel.app
```

## 🔐 Variables de Firebase (Servidor) - Requieren configuración manual

### Paso 1: Obtener Service Account Key

1. **Ve a Firebase Console**: https://console.firebase.google.com/project/zentryapp-949f4/settings/serviceaccounts/adminsdk
2. **Haz clic en "Generate new private key"**
3. **Descarga el archivo JSON**
4. **Abre el archivo JSON** y copia todo el contenido

### Paso 2: Configurar en Vercel

Las siguientes variables necesitan el contenido del archivo JSON descargado:

```
FIREBASE_SERVICE_ACCOUNT_KEY=<CONTENIDO_COMPLETO_DEL_JSON>
FIREBASE_PROJECT_ID=zentryapp-949f4
FIREBASE_CLIENT_EMAIL=<EMAIL_DEL_JSON>
FIREBASE_PRIVATE_KEY=<PRIVATE_KEY_DEL_JSON>
FIREBASE_STORAGE_BUCKET=zentryapp-949f4.appspot.com
```

## 🚀 Pasos para Configurar en Vercel Dashboard

### Paso 1: Acceder al Dashboard
1. Ve a: https://vercel.com/dashboard
2. Selecciona tu proyecto: **zentry-web-app**

### Paso 2: Ir a Environment Variables
1. Haz clic en **Settings** (pestaña superior)
2. Haz clic en **Environment Variables** (menú lateral izquierdo)

### Paso 3: Agregar Variables de Firebase (Cliente)
Agrega estas variables una por una:

| Name | Value | Environment |
|------|-------|-------------|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | `AIzaSyAPKpz9Twt_n8Zgkk8mh4cFNuo4SipwG5c` | Production |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `zentryapp-949f4.firebaseapp.com` | Production |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `zentryapp-949f4` | Production |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET` | `zentryapp-949f4.appspot.com` | Production |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | `905646843025` | Production |
| `NEXT_PUBLIC_FIREBASE_APP_ID` | `1:905646843025:web:9b23d5c6d6d6c78f93cb30` | Production |

### Paso 4: Agregar Variables de NextAuth
| Name | Value | Environment |
|------|-------|-------------|
| `NEXTAUTH_SECRET` | `xebe+9FDlbsmEPcgth+S0GB2mkQB9Oc/JaDd0i/uOyU=` | Production |
| `NEXTAUTH_URL` | `https://zentry-web-2is8s7clv-gera09azs-projects.vercel.app` | Production |

### Paso 5: Agregar Variables de Firebase (Servidor)
**IMPORTANTE**: Usa el contenido del archivo JSON descargado de Firebase Console

| Name | Value | Environment |
|------|-------|-------------|
| `FIREBASE_SERVICE_ACCOUNT_KEY` | `{"type":"service_account","project_id":"zentryapp-949f4",...}` | Production |
| `FIREBASE_PROJECT_ID` | `zentryapp-949f4` | Production |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-xxxxx@zentryapp-949f4.iam.gserviceaccount.com` | Production |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n` | Production |
| `FIREBASE_STORAGE_BUCKET` | `zentryapp-949f4.appspot.com` | Production |

### Paso 6: Variables de Email (Opcionales)
Si tienes configurado email, agrega estas variables:

| Name | Value | Environment |
|------|-------|-------------|
| `RESEND_API_KEY` | `<TU_RESEND_API_KEY>` | Production |
| `SENDGRID_API_KEY` | `<TU_SENDGRID_API_KEY>` | Production |
| `GMAIL_USER` | `<TU_GMAIL>` | Production |
| `GMAIL_APP_PASSWORD` | `<TU_GMAIL_APP_PASSWORD>` | Production |
| `FROM_EMAIL` | `noreply@zentry.app` | Production |

## ✅ Verificación

Después de configurar todas las variables:

1. **Redeploy la aplicación**:
   ```bash
   vercel --prod
   ```

2. **Verificar funcionamiento**:
   - Página principal: https://zentry-web-2is8s7clv-gera09azs-projects.vercel.app
   - Login: https://zentry-web-2is8s7clv-gera09azs-projects.vercel.app/login
   - Dashboard: https://zentry-web-2is8s7clv-gera09azs-projects.vercel.app/dashboard

## 🐛 Solución de Problemas

### Error: "Firebase Admin not configured"
- Verificar que `FIREBASE_SERVICE_ACCOUNT_KEY` esté configurada correctamente
- Asegurar que el JSON esté completo y válido

### Error: "Invalid Firebase configuration"
- Verificar que todas las variables `NEXT_PUBLIC_FIREBASE_*` estén configuradas
- Asegurar que los valores coincidan con tu proyecto de Firebase

### Error: "NextAuth configuration error"
- Verificar que `NEXTAUTH_SECRET` y `NEXTAUTH_URL` estén configuradas
- Asegurar que `NEXTAUTH_URL` apunte a la URL correcta de producción

---

**¡Una vez configuradas todas las variables, tu aplicación estará completamente funcional!** 🎉
