#!/bin/bash

# Script para generar variables de entorno para Vercel
# Zentry WEB App

set -e

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_header() {
    echo -e "${BLUE}🔧 $1${NC}"
}

# Configuración de Firebase (obtenida del archivo config.ts)
FIREBASE_API_KEY="AIzaSyAPKpz9Twt_n8Zgkk8mh4cFNuo4SipwG5c"
FIREBASE_AUTH_DOMAIN="zentryapp-949f4.firebaseapp.com"
FIREBASE_PROJECT_ID="zentryapp-949f4"
FIREBASE_STORAGE_BUCKET="zentryapp-949f4.appspot.com"
FIREBASE_MESSAGING_SENDER_ID="905646843025"
FIREBASE_APP_ID="1:905646843025:web:9b23d5c6d6d6c78f93cb30"

# URL de producción
PRODUCTION_URL="https://zentry-web-2is8s7clv-gera09azs-projects.vercel.app"

print_header "Generando Variables de Entorno para Vercel"
echo ""

print_info "📋 Variables de Firebase (Cliente) - NEXT_PUBLIC_*"
echo ""

echo "NEXT_PUBLIC_FIREBASE_API_KEY=$FIREBASE_API_KEY"
echo "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$FIREBASE_AUTH_DOMAIN"
echo "NEXT_PUBLIC_FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID"
echo "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$FIREBASE_STORAGE_BUCKET"
echo "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$FIREBASE_MESSAGING_SENDER_ID"
echo "NEXT_PUBLIC_FIREBASE_APP_ID=$FIREBASE_APP_ID"
echo ""

print_info "🔐 Variables de NextAuth"
echo ""

# Generar NEXTAUTH_SECRET
NEXTAUTH_SECRET=$(openssl rand -base64 32)
echo "NEXTAUTH_SECRET=$NEXTAUTH_SECRET"
echo "NEXTAUTH_URL=$PRODUCTION_URL"
echo ""

print_warning "⚠️  Variables de Firebase (Servidor) - Requieren configuración manual"
echo ""
echo "FIREBASE_SERVICE_ACCOUNT_KEY=<JSON_COMPLETO_DE_LA_CUENTA_DE_SERVICIO>"
echo "FIREBASE_PROJECT_ID=$FIREBASE_PROJECT_ID"
echo "FIREBASE_CLIENT_EMAIL=<EMAIL_DE_LA_CUENTA_DE_SERVICIO>"
echo "FIREBASE_PRIVATE_KEY=<CLAVE_PRIVADA_DE_LA_CUENTA_DE_SERVICIO>"
echo "FIREBASE_STORAGE_BUCKET=$FIREBASE_STORAGE_BUCKET"
echo ""

print_info "📧 Variables de Email (Opcionales)"
echo ""
echo "RESEND_API_KEY=<TU_RESEND_API_KEY>"
echo "SENDGRID_API_KEY=<TU_SENDGRID_API_KEY>"
echo "GMAIL_USER=<TU_GMAIL>"
echo "GMAIL_APP_PASSWORD=<TU_GMAIL_APP_PASSWORD>"
echo "FROM_EMAIL=noreply@zentry.app"
echo ""

print_header "Instrucciones para Configurar en Vercel"
echo ""

echo "1. Ve a: https://vercel.com/dashboard"
echo "2. Selecciona tu proyecto: zentry-web-app"
echo "3. Ve a Settings → Environment Variables"
echo "4. Agrega cada variable una por una"
echo "5. Para las variables de Firebase Server, necesitas:"
echo "   - Ir a Firebase Console → Project Settings → Service Accounts"
echo "   - Generar nueva clave privada"
echo "   - Copiar el contenido JSON completo a FIREBASE_SERVICE_ACCOUNT_KEY"
echo ""

print_success "🎉 Variables generadas correctamente"
echo ""
print_info "💡 Tip: Copia y pega las variables una por una en Vercel Dashboard"
