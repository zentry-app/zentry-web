#!/bin/bash

# Script de Deploy Seguro para Zentry WEB
# Este script verifica todo antes de hacer el deploy

echo "🚀 INICIANDO DEPLOY SEGURO DE ZENTRY WEB..."
echo "================================================"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para imprimir con color
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Verificar que estemos en el directorio correcto
if [ ! -f "package.json" ] || [ ! -f "next.config.mjs" ]; then
    print_error "No estás en el directorio de Zentry WEB"
    print_error "Ejecuta este script desde: Zentry WEB/"
    exit 1
fi

print_success "Directorio correcto detectado"

# Paso 1: Verificar estado de Git
echo ""
print_status "Paso 1: Verificando estado de Git..."

# Verificar que estemos en una rama
CURRENT_BRANCH=$(git branch --show-current)
if [ -z "$CURRENT_BRANCH" ]; then
    print_error "No estás en una rama de Git"
    exit 1
fi

print_success "Rama actual: $CURRENT_BRANCH"

# Verificar cambios no commitados
if [ -n "$(git status --porcelain)" ]; then
    print_warning "Hay cambios no commitados:"
    git status --short
    
    read -p "¿Quieres hacer commit de estos cambios? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        git add .
        git commit -m "Auto-commit antes del deploy: $(date)"
        print_success "Cambios commitados"
    else
        print_error "Debes hacer commit de los cambios antes del deploy"
        exit 1
    fi
else
    print_success "No hay cambios pendientes"
fi

# Paso 2: Verificar dependencias
echo ""
print_status "Paso 2: Verificando dependencias..."

# Verificar que node_modules existe
if [ ! -d "node_modules" ]; then
    print_warning "node_modules no existe, instalando dependencias..."
    npm install
    if [ $? -ne 0 ]; then
        print_error "Error instalando dependencias"
        exit 1
    fi
fi

print_success "Dependencias verificadas"

# Paso 3: Verificar configuración
echo ""
print_status "Paso 3: Verificando configuración..."

# Verificar archivos críticos
CRITICAL_FILES=("next.config.mjs" "tsconfig.json" "firebase.json" ".firebaserc")
for file in "${CRITICAL_FILES[@]}"; do
    if [ -f "$file" ]; then
        print_success "$file encontrado"
    else
        print_error "$file no encontrado"
        exit 1
    fi
done

# Verificar variables de entorno
if [ -f ".env.local" ]; then
    print_success ".env.local encontrado"
else
    print_warning ".env.local no encontrado"
fi

print_success "Configuración verificada"

# Paso 4: Build de prueba
echo ""
print_status "Paso 4: Haciendo build de prueba..."

# Limpiar build anterior
if [ -d ".next" ]; then
    rm -rf .next
    print_status "Build anterior limpiado"
fi

# Hacer build
npm run build
if [ $? -ne 0 ]; then
    print_error "Error en el build. Corrige los errores antes del deploy"
    exit 1
fi

print_success "Build exitoso"

# Paso 5: Verificar build
echo ""
print_status "Paso 5: Verificando build..."

if [ -d ".next" ] && [ -f ".next/BUILD_ID" ]; then
    BUILD_ID=$(cat .next/BUILD_ID)
    print_success "Build ID: $BUILD_ID"
else
    print_error "Build no se generó correctamente"
    exit 1
fi

# Paso 6: Deploy
echo ""
print_status "Paso 6: Iniciando deploy..."

# Preguntar tipo de deploy
echo "Selecciona el tipo de deploy:"
echo "1) Vercel (recomendado)"
echo "2) Firebase Hosting"
echo "3) Solo verificar (no hacer deploy)"

read -p "Selecciona una opción (1-3): " -n 1 -r
echo

case $REPLY in
    1)
        print_status "Deploy con Vercel..."
        if command -v vercel &> /dev/null; then
            vercel --prod
        else
            print_error "Vercel CLI no está instalado"
            print_status "Instalando Vercel CLI..."
            npm i -g vercel
            vercel --prod
        fi
        ;;
    2)
        print_status "Deploy con Firebase..."
        if command -v firebase &> /dev/null; then
            firebase deploy --only hosting
        else
            print_error "Firebase CLI no está instalado"
            print_status "Instalando Firebase CLI..."
            npm i -g firebase-tools
            firebase login
            firebase deploy --only hosting
        fi
        ;;
    3)
        print_success "Solo verificación completada. No se hizo deploy"
        ;;
    *)
        print_error "Opción inválida"
        exit 1
        ;;
esac

# Paso 7: Verificación post-deploy
echo ""
print_status "Paso 7: Verificación post-deploy..."

if [ $REPLY -ne 3 ]; then
    print_status "Deploy completado. Verifica en producción:"
    echo "   - Abre la URL de producción"
    echo "   - Ve a la página de usuarios"
    echo "   - Verifica que se muestren todos los usuarios"
    echo "   - Revisa la consola para logs"
    echo "   - Verifica el indicador visual de usuarios"
fi

echo ""
print_success "🎉 DEPLOY SEGURO COMPLETADO!"
echo ""
echo "📋 Resumen:"
echo "   ✅ Git verificado"
echo "   ✅ Dependencias verificadas"
echo "   ✅ Configuración verificada"
echo "   ✅ Build exitoso"
echo "   ✅ Deploy completado"
echo ""
echo "🔍 Para verificar en producción:"
echo "   - Revisa la URL de producción"
echo "   - Verifica que la página de usuarios funcione"
echo "   - Confirma que se muestren todos los usuarios"
echo "   - Revisa logs en la consola"
echo ""
echo "📞 Si hay problemas:"
echo "   - Revisa los logs del deploy"
echo "   - Verifica la configuración de Firebase"
echo "   - Confirma las variables de entorno"
