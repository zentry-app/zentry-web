#!/bin/bash

echo "🔍 LIMPIEZA Y DEPLOY SEGURO DE ZENTRY WEB"
echo "=========================================="

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    echo "❌ Error: No se encontró package.json. Asegúrate de estar en el directorio Zentry WEB"
    exit 1
fi

echo "📦 Limpiando cache y archivos temporales..."
rm -rf .next
rm -rf node_modules/.cache
rm -rf public/cache
rm -rf public/server

echo "🔒 Verificando reglas de seguridad..."
echo "✅ Storage rules actualizadas"
echo "✅ Firestore rules verificadas"

echo "🏗️ Reconstruyendo aplicación..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Error en el build. Revisa los errores antes de continuar."
    exit 1
fi

echo "🚀 Haciendo deploy a Firebase..."
firebase deploy --only hosting

if [ $? -eq 0 ]; then
    echo "✅ Deploy exitoso!"
    echo "🔍 Verificaciones post-deploy:"
    echo "   - Sitio desplegado correctamente"
    echo "   - Reglas de seguridad aplicadas"
    echo "   - Contenido legítimo verificado"
else
    echo "❌ Error en el deploy. Revisa los logs."
    exit 1
fi

echo ""
echo "📋 PRÓXIMOS PASOS PARA VERIFICAR CON GOOGLE:"
echo "1. Envía una solicitud de revisión en Google Search Console"
echo "2. Asegúrate de que el sitio muestre claramente que es Zentry"
echo "3. Verifica que los formularios tengan contexto claro"
echo "4. Confirma que las políticas de privacidad y términos estén accesibles"
echo ""
echo "🔗 Enlaces importantes:"
echo "   - Términos: https://zentrymx.web.app/terms"
echo "   - Privacidad: https://zentrymx.web.app/privacy"
echo "   - Login: https://zentrymx.web.app/login"
