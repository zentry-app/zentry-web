# 🚀 Despliegue en Vercel - Zentry WEB

## ✅ Configuración Completada

Tu aplicación ya está configurada para desplegarse en Vercel. Se han realizado los siguientes cambios:

### 🔧 Cambios Realizados:

1. **`next.config.mjs`**: Removido `output: 'export'` para compatibilidad con Vercel
2. **`vercel.json`**: Configuración optimizada para Next.js
3. **`.vercelignore`**: Archivos excluidos del despliegue
4. **`scripts/deploy-vercel.sh`**: Script automatizado de despliegue
5. **`package.json`**: Nuevos scripts para Vercel

## 🚀 Pasos para Desplegar

### 1. Instalar Vercel CLI
```bash
npm install -g vercel
```

### 2. Iniciar Sesión
```bash
vercel login
```

### 3. Desplegar (Opción A - Automatizado)
```bash
npm run deploy:vercel
```

### 4. Desplegar (Opción B - Manual)
```bash
vercel --prod
```

## 🔑 Variables de Entorno Requeridas

**IMPORTANTE**: Configura estas variables en el dashboard de Vercel después del primer despliegue:

### Firebase (Cliente):
- `NEXT_PUBLIC_FIREBASE_API_KEY`
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
- `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
- `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
- `NEXT_PUBLIC_FIREBASE_APP_ID`

### Firebase (Servidor):
- `FIREBASE_SERVICE_ACCOUNT_KEY` (JSON completo)
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`
- `FIREBASE_STORAGE_BUCKET`

### NextAuth:
- `NEXTAUTH_SECRET` (generar con: `openssl rand -base64 32`)
- `NEXTAUTH_URL` (se configura automáticamente)

### Email (Opcional):
- `RESEND_API_KEY`
- `SENDGRID_API_KEY`
- `GMAIL_USER`
- `GMAIL_APP_PASSWORD`
- `FROM_EMAIL`

## 📋 Checklist Post-Despliegue

- [ ] Variables de entorno configuradas en Vercel Dashboard
- [ ] Autenticación funcionando (`/login`)
- [ ] Dashboard accesible (`/dashboard`)
- [ ] Gestión de usuarios funcionando (`/dashboard/usuarios`)
- [ ] API routes funcionando (`/api/auth/session`)
- [ ] Envío de emails funcionando (si configurado)

## 🐛 Solución de Problemas

### Error: "Build failed"
```bash
npm run build
```

### Error: "Environment variables missing"
- Verificar variables en Vercel Dashboard
- Asegurar nombres exactos

### Error: "Firebase connection failed"
- Verificar credenciales de Firebase
- Asegurar proyecto activo

## 📞 Soporte

Si tienes problemas:
1. Revisar logs en Vercel Dashboard
2. Verificar configuración local
3. Consultar documentación de Vercel

## 🔄 Despliegues Futuros

Para futuros cambios:
```bash
git push origin main
```
Vercel detectará automáticamente los cambios.

---

**¡Tu aplicación está lista para desplegarse en Vercel!** 🎉
