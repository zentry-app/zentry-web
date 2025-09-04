# 🔧 Configuración de Variables de Entorno para Tags Management

## 📋 Variables Requeridas

### Zentry Web
```bash
# Tags Management
NEXT_PUBLIC_TAGS_SYNC_ENABLED=true
NEXT_PUBLIC_TAGS_REFRESH_INTERVAL=10000

# Firebase Collections
# Para staging usar sufijo _stg, para producción sin sufijo
TAGS_COLLECTION=tags
JOBS_COLLECTION=panelJobs
AUDIT_COLLECTION=auditLogs

# Environment
NODE_ENV=development
```

### ZentryLink (Windows)
```bash
# Worker de Tags (por defecto deshabilitado)
ENABLE_TAGS_WORKER=false

# Colecciones Firestore
TAGS_COLLECTION=tags
JOBS_COLLECTION=panelJobs
AUDIT_COLLECTION=auditLogs

# Configuración del Worker
TAGS_WORKER_INTERVAL=5000
TAGS_CLEANUP_DAYS=7
```

## 🚀 Configuración por Entorno

### Desarrollo/Staging
- `TAGS_COLLECTION=tags_stg`
- `JOBS_COLLECTION=panelJobs_stg`
- `AUDIT_COLLECTION=auditLogs_stg`
- `ENABLE_TAGS_WORKER=false` (por defecto)

### Producción
- `TAGS_COLLECTION=tags`
- `JOBS_COLLECTION=panelJobs`
- `AUDIT_COLLECTION=auditLogs`
- `ENABLE_TAGS_WORKER=false` (activar solo después de pruebas)

## ⚠️ Importante
- **NUNCA** activar `ENABLE_TAGS_WORKER=true` en producción sin pruebas previas
- Mantener staging y producción completamente separados
- Verificar que las colecciones no interfieran con la lógica de plumas existente
