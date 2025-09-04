#!/bin/bash

# Script de Despliegue Automatizado para Vercel
# Zentry WEB App

set -e  # Salir si hay algún error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Funciones de utilidad
print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "package.json" ]; then
    print_error "No se encontró package.json. Asegúrate de estar en el directorio raíz del proyecto."
    exit 1
fi

print_info "🚀 Iniciando despliegue en Vercel..."

# Verificar que Vercel CLI esté instalado
if ! command -v vercel &> /dev/null; then
    print_warning "Vercel CLI no está instalado. Instalando..."
    npm install -g vercel
fi

# Verificar que el usuario esté logueado en Vercel
if ! vercel whoami &> /dev/null; then
    print_warning "No estás logueado en Vercel. Iniciando sesión..."
    vercel login
fi

# Verificar que no haya cambios sin commitear
if [ -n "$(git status --porcelain)" ]; then
    print_warning "Hay cambios sin commitear. ¿Deseas continuar? (y/N)"
    read -r response
    if [[ ! "$response" =~ ^[Yy]$ ]]; then
        print_info "Despliegue cancelado. Commit los cambios antes de continuar."
        exit 1
    fi
fi

# Verificar dependencias
print_info "📦 Verificando dependencias..."
if [ ! -d "node_modules" ]; then
    print_warning "Instalando dependencias..."
    npm install
fi

# Verificar build local
print_info "🔨 Verificando build local..."
if npm run build; then
    print_success "Build local exitoso"
else
    print_error "Build local falló. Revisa los errores antes de continuar."
    exit 1
fi

# Verificar variables de entorno críticas
print_info "🔍 Verificando variables de entorno críticas..."
required_vars=(
    "NEXT_PUBLIC_FIREBASE_API_KEY"
    "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN"
    "NEXT_PUBLIC_FIREBASE_PROJECT_ID"
    "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET"
    "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID"
    "NEXT_PUBLIC_FIREBASE_APP_ID"
)

missing_vars=()
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        missing_vars+=("$var")
    fi
done

if [ ${#missing_vars[@]} -gt 0 ]; then
    print_warning "Variables de entorno faltantes:"
    for var in "${missing_vars[@]}"; do
        echo "  - $var"
    done
    print_info "Asegúrate de configurar estas variables en Vercel Dashboard antes del despliegue."
fi

# Desplegar en Vercel
print_info "🚀 Desplegando en Vercel..."
if vercel --prod --yes; then
    print_success "¡Despliegue exitoso!"
    
    # Obtener la URL del despliegue
    deployment_url=$(vercel ls --json | jq -r '.[0].url' 2>/dev/null || echo "No se pudo obtener la URL")
    
    if [ "$deployment_url" != "No se pudo obtener la URL" ]; then
        print_success "URL del despliegue: https://$deployment_url"
        echo "https://$deployment_url" > .vercel-url
    fi
    
    print_info "📋 Próximos pasos:"
    echo "1. Ve a https://vercel.com/dashboard"
    echo "2. Selecciona tu proyecto"
    echo "3. Ve a Settings → Environment Variables"
    echo "4. Configura todas las variables de entorno necesarias"
    echo "5. Revisa los logs para verificar que todo funcione correctamente"
    
else
    print_error "Despliegue falló. Revisa los logs para más detalles."
    exit 1
fi

print_success "🎉 ¡Despliegue completado! Revisa la URL proporcionada arriba."
