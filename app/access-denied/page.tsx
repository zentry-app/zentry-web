"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { AlertTriangle, Home, ArrowLeft, Smartphone } from 'lucide-react';

export default function AccessDeniedPage() {
  const router = useRouter();

  const handleGoBack = () => {
    router.push('/login');
  };

  const handleGoToApp = () => {
    // Redirigir a la app móvil o página de descarga
    window.open('https://play.google.com/store/apps/details?id=com.zentry.app', '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Registro No Permitido
          </CardTitle>
          <CardDescription className="text-gray-600">
            La plataforma web es exclusiva para administradores
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-lg font-medium text-gray-800 mb-2">
              Hola, detectamos que eres un <strong>residente</strong>.
            </p>
            <p className="text-gray-600 leading-relaxed">
              No pudimos completar tu registro porque esta plataforma web está diseñada 
              exclusivamente para administradores. Como residente, debes usar la 
              <strong> aplicación móvil de Zentry</strong>.
            </p>
          </div>

          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="flex items-center mb-2">
              <Smartphone className="w-5 h-5 text-blue-600 mr-2" />
              <span className="font-medium text-blue-800">Para residentes</span>
            </div>
            <p className="text-blue-700 text-sm">
              Descarga la app móvil para acceder a todas las funciones de Zentry 
              diseñadas especialmente para residentes.
            </p>
          </div>

          <div className="flex flex-col space-y-3">
            <Button 
              onClick={handleGoToApp}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white"
            >
              <Smartphone className="w-4 h-4 mr-2" />
              Descargar App Móvil
            </Button>
            
            <Button 
              onClick={handleGoBack}
              variant="outline"
              className="w-full"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Volver al Inicio
            </Button>
          </div>

          <div className="text-center">
            <p className="text-xs text-gray-500">
              Si crees que esto es un error, contacta al administrador de tu residencial.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 