#!/bin/bash
# Script para matar procesos de Next.js
echo "🔍 Buscando procesos de Next.js..."
PROCESSES=$(ps aux | grep -E "(next|npm.*dev)" | grep -v grep | awk "{print \$2}")
if [ -n "$PROCESSES" ]; then
    echo "📋 Procesos encontrados: $PROCESSES"
    echo "💀 Matando procesos..."
    echo $PROCESSES | xargs kill -9
    echo "✅ Procesos eliminados"
else
    echo "ℹ️  No se encontraron procesos de Next.js"
fi

# Limpiar puerto 3000
PORT_PROCESSES=$(lsof -ti:3000)
if [ -n "$PORT_PROCESSES" ]; then
    echo "🔌 Limpiando puerto 3000..."
    echo $PORT_PROCESSES | xargs kill -9
    echo "✅ Puerto 3000 liberado"
else
    echo "ℹ️  Puerto 3000 ya está libre"
fi

# Limpiar caché
echo "🧹 Limpiando caché de Next.js..."
rm -rf .next
echo "✅ Caché limpiada"

echo "🎉 Limpieza completa!"

