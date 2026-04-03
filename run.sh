#!/bin/bash
# Zentry WEB - Launcher interactivo

DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$DIR"

# ── Paso 1: Ambiente ──
echo ""
echo "🔧 Zentry WEB - Selecciona ambiente:"
echo "  1) staging (default)"
echo "  2) prod"
echo ""
read -p "Opción [1]: " choice

case "$choice" in
  2)
    ENV="prod"
    ENV_FILE=".env.local.prod-backup"
    ;;
  *)
    ENV="staging"
    ENV_FILE=".env.staging.local"
    ;;
esac

# Verificar que el archivo env existe
if [ ! -f "$ENV_FILE" ]; then
  echo "⚠️  No se encontró $ENV_FILE"
  echo "   Usando .env.local actual sin cambios."
else
  # Backup del actual si no es symlink
  cp .env.local .env.local.backup 2>/dev/null
  cp "$ENV_FILE" .env.local
  echo "✅ Ambiente: $ENV (copiado $ENV_FILE → .env.local)"
fi

echo ""
echo "▶ Corriendo Zentry WEB en ambiente: $ENV"
echo ""

npm run dev
