#!/bin/bash

echo "🚀 Iniciando deploy a Firebase Hosting..."

# Limpiar builds anteriores
echo "🧹 Limpiando builds anteriores..."
rm -rf .next
rm -rf out

# Crear directorio temporal sin API routes
echo "📁 Creando build temporal sin API routes..."
mkdir -p temp-build

# Copiar archivos necesarios excluyendo API routes
cp -r app temp-build/ 2>/dev/null || true
cp -r src temp-build/ 2>/dev/null || true
cp -r public temp-build/ 2>/dev/null || true
cp package.json temp-build/
cp next.config.mjs temp-build/
cp tailwind.config.ts temp-build/
cp tsconfig.json temp-build/
cp postcss.config.mjs temp-build/
cp components.json temp-build/ 2>/dev/null || true
cp .env.local temp-build/ 2>/dev/null || true

# Remover directorio API del build temporal
rm -rf temp-build/app/api

echo "🔧 Ejecutando build en directorio temporal..."
cd temp-build

# Instalar dependencias y hacer build
npm install --silent
npm run build

# Copiar resultado de vuelta
echo "📋 Copiando resultado de build..."
cp -r out ../out

# Volver al directorio original
cd ..

# Limpiar directorio temporal
echo "🧹 Limpiando archivos temporales..."
rm -rf temp-build

# Verificar que index.html existe
if [ ! -f "out/index.html" ]; then
    echo "❌ Error: index.html no se generó correctamente"
    exit 1
fi

echo "✅ Build completado exitosamente!"
echo "📁 Archivos estáticos generados en: ./out"
echo "📄 index.html encontrado"

# Deploy a Firebase
echo "🚀 Desplegando a Firebase Hosting..."
firebase deploy --only hosting

echo "🎉 Deploy completado!"
