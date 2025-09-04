'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { MultiStepRegisterForm, RegistrationData } from '@/components/auth/MultiStepRegisterForm';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Home, CheckCircle, Mail, User, Clock } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { UserRole } from '@/types/models';
import { useAuth } from '@/contexts/AuthContext';
import { getRedirectResultSafe } from '@/lib/firebase/config';

export default function RegisterPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationSuccess, setRegistrationSuccess] = useState(false);
  const [registrationData, setRegistrationData] = useState<any>(null);
  const { logout, user, userData, setUser } = useAuth();
  // Agregar estado para error de usuario ya registrado
  const [userAlreadyExists, setUserAlreadyExists] = useState<null | { email: string; method?: string }>(null);

  // Función unificada para registro usando Cloud Function
  const registerUserUnified = async (data: RegistrationData) => {
    const authMethod = data.authMethod.method;
    
    console.log(`🚀 Iniciando registro unificado con método: ${authMethod}`);

    // Preparar datos para la Cloud Function
    const registrationData = {
      authMethod: authMethod,
      email: data.personalInfo.email,
      fullName: data.personalInfo.firstName,
      paternalLastName: data.personalInfo.paternalLastName || '',
      maternalLastName: data.personalInfo.maternalLastName || '',
      password: authMethod === 'email' ? data.personalInfo.password : null,
      residencialId: data.residential.residentialId,
      houseNumber: data.residential.houseNumber,
      identificacionUrl: data.documents.identificationUrl || null,
      comprobanteUrl: data.documents.proofUrl || null,
    };

    console.log('📤 Enviando datos a Cloud Function:', { ...registrationData, password: '***' });

    try {
      // Llamar a la Cloud Function de registro público
      const response = await fetch('https://us-central1-zentryapp-949f4.cloudfunctions.net/publicRegistration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(registrationData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error de Cloud Function:', errorText);
        throw new Error(`Error en el registro: ${response.status}`);
      }

      const result = await response.json();
      console.log('✅ Usuario registrado exitosamente:', result);
      
      // Agregar información sobre si era un usuario existente
      if (result.wasExistingUser) {
        console.log('ℹ️ Usuario existente - registro completado');
      }
      
      return result;

    } catch (error: any) {
      console.error('❌ Error llamando a Cloud Function:', error);
      
      // Fallback: si la Cloud Function falla, mostrar mensaje informativo
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet e intenta nuevamente.');
      }
      
      throw new Error(error.message || 'Error interno del servidor');
    }
  };

  const handleRegistrationComplete = async (data: RegistrationData) => {
    try {
      setIsRegistering(true);
      
      console.log('📝 Datos de registro completos:', data);
      console.log('📋 Estructura de documents:', data.documents);
      
      // Validar datos según el método
      const authMethod = data.authMethod.method;
      if (authMethod === 'email' && !data.personalInfo.password) {
        throw new Error('La contraseña es requerida para el registro con email');
      }
      
      // Usar la función unificada de registro
      const result = await registerUserUnified(data);
      console.log('✅ Usuario registrado exitosamente:', result);
      
      // Guardar datos para mostrar en la pantalla de éxito
      setRegistrationData({
        result,
        authMethod: data.authMethod.method,
        email: data.personalInfo.email,
        fullName: data.personalInfo.firstName
      });
      
      // Mostrar pantalla de éxito en lugar de redirigir
      setRegistrationSuccess(true);
      
    } catch (error: any) {
      console.error('❌ Error en el registro:', error);
      // Interceptar error de usuario ya registrado
      if (error.message && (error.message.includes('ya está registrado') || error.message.includes('already-exists'))) {
        setUserAlreadyExists({ email: data.personalInfo.email, method: data.authMethod.method });
        return;
      }
      toast({
        title: "Error en el registro",
        description: error.message || "Hubo un problema al crear tu cuenta. Por favor intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleCancel = () => {
    router.push('/');
  };

  // Logout automático tras registro exitoso
  useEffect(() => {
    if (registrationSuccess) {
      // Cerrar sesión de Firebase para evitar login automático
      logout().catch(() => {});
    }
  }, [registrationSuccess, logout]);

  // Forzar logout al montar la página de registro para evitar sesión persistente
  useEffect(() => {
    // Forzar logout al montar la página de registro para evitar sesión persistente
    logout().catch(() => {});
  }, []);

  // Workaround para manejar redirect de Google en producción
  useEffect(() => {
    const handleRedirectResult = async () => {
      try {
        // Verificar si venimos de un redirect
        const url = new URL(window.location.href);
        const fromRedirect = url.searchParams.get('redirected');

        if (!fromRedirect) {
          // Intentar obtener el resultado del redirect
          const result = await getRedirectResultSafe();
          if (result && result.user) {
            console.error('[RegisterPage] Usuario detectado tras redirect, forzando recarga...');
            // Hay un resultado de redirect, forzar recarga con parámetro
            url.searchParams.set('redirected', '1');
            window.location.replace(url.toString());
            return;
          }
        } else {
          console.error('[RegisterPage] Página recargada tras redirect, JS activo.');
          // Intentar obtener el resultado del redirect nuevamente
          const result = await getRedirectResultSafe();
          if (result && result.user) {
            console.error('[RegisterPage] Usuario de redirect encontrado:', result.user);
            setUser(result.user);
          }
        }
      } catch (error) {
        console.error('[RegisterPage] Error al manejar redirect:', error);
      }
    };

    handleRedirectResult();
  }, [setUser]);

  // Mostrar modal/pantalla especial si el usuario ya existe
  if (userAlreadyExists) {
    return (
      <div className="w-full max-w-lg mx-auto my-20 p-8 bg-white rounded-2xl shadow-lg text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-yellow-100 rounded-full flex items-center justify-center">
          <span className="text-3xl text-yellow-600">⚠️</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Este correo ya está registrado</h2>
        <p className="text-gray-700 mb-4">El correo <span className="font-mono">{userAlreadyExists.email}</span> ya fue registrado previamente.</p>
        {userAlreadyExists.method === 'email' && (
          <>
            <p className="mb-2">Puedes acceder usando tu correo y contraseña.</p>
            <a href="/login" className="inline-block px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold mb-2">Ir a Iniciar Sesión</a>
            <p className="text-sm text-gray-600">¿Olvidaste tu contraseña? <a href="/reset-password" className="text-blue-600 underline">Recupérala aquí</a></p>
          </>
        )}
        {userAlreadyExists.method === 'google' && (
          <>
            <p className="mb-2">Este correo está vinculado a Google. Accede desde la app móvil usando Google.</p>
          </>
        )}
        {userAlreadyExists.method === 'apple' && (
          <>
            <p className="mb-2">Este correo está vinculado a Apple. Accede desde la app móvil usando Apple.</p>
          </>
        )}
        {!['email','google','apple'].includes(userAlreadyExists.method || '') && (
          <p className="mb-2">Por favor, accede usando el método de autenticación correspondiente.</p>
        )}
        <button onClick={() => setUserAlreadyExists(null)} className="mt-6 px-4 py-2 bg-gray-200 rounded-lg">Volver</button>
      </div>
    );
  }

  // Mostrar instrucciones si el usuario es residente (ya registrado)
  if (user && userData && userData.role === 'resident') {
    const authMethod = user.providerData?.[0]?.providerId;
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
        <div className="w-full max-w-md mx-auto my-12 p-8 bg-white rounded-2xl shadow-lg text-center">
          <h2 className="text-2xl font-bold mb-2 text-blue-900">Este correo ya está registrado</h2>
          <p className="mb-4 text-gray-700">Ya tienes una cuenta como residente en Zentry.</p>
          <div className="mb-6">
            <span className="font-semibold text-blue-800">Método de acceso: </span>
            <span className="text-blue-700">
              {authMethod === 'password' && 'Correo y contraseña'}
              {authMethod === 'google.com' && 'Google'}
              {authMethod === 'apple.com' && 'Apple'}
              {!authMethod && 'No detectado'}
            </span>
          </div>
          {authMethod === 'password' && (
            <>
              <p className="mb-2 text-gray-600">Ingresa con tu correo y contraseña en la app móvil.</p>
              <a href="/login" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg mb-2">Iniciar sesión</a>
              <br />
              <a href="/recuperar-contrasena" className="text-blue-700 underline text-sm">¿Olvidaste tu contraseña?</a>
            </>
          )}
          {(authMethod === 'google.com' || authMethod === 'apple.com') && (
            <>
              <p className="mb-4 text-gray-600">Ingresa usando el botón de <b>{authMethod === 'google.com' ? 'Google' : 'Apple'}</b> en la app móvil de Zentry.</p>
              <a href="https://play.google.com/store/apps/details?id=com.zentry.app" target="_blank" rel="noopener noreferrer" className="inline-block bg-blue-600 text-white px-4 py-2 rounded-lg">Descargar App Móvil</a>
            </>
          )}
          <div className="mt-6">
            <a href="/login" className="text-blue-700 underline">Volver al inicio</a>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Header con navegación */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo y título */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/')}
                className="flex items-center gap-2"
              >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Volver al inicio</span>
              </Button>
              <div className="h-8 w-px bg-gray-300" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Home className="w-5 h-5 text-white" />
                </div>
                <h1 className="text-xl font-bold text-gray-900">
                  Zentry
                </h1>
              </div>
            </div>

            {/* Enlaces de ayuda */}
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/help')}
                className="hidden sm:flex"
              >
                Centro de Ayuda
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => router.push('/login')}
              >
                ¿Ya tienes cuenta?
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="relative">
        {/* Elementos decorativos de fondo */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-purple-400/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-indigo-400/10 rounded-full blur-3xl" />
        </div>

        {/* Formulario de registro */}
        <div className="relative z-10">
          {registrationSuccess ? (
            // Pantalla de éxito del registro
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
              <div className="w-full max-w-2xl mx-auto my-12 p-8 bg-white rounded-2xl shadow-lg">
                <div className="text-center">
                  {/* Icono de éxito */}
                  <div className="w-20 h-20 mx-auto mb-6 bg-green-100 rounded-full flex items-center justify-center">
                    <CheckCircle className="w-12 h-12 text-green-600" />
                  </div>
                  
                  {/* Título principal */}
                  <h1 className="text-3xl font-bold text-gray-900 mb-4">
                    ¡Registro Completado Exitosamente!
                  </h1>
                  
                  {/* Mensaje de confirmación */}
                  <p className="text-lg text-gray-600 mb-8">
                    {registrationData?.result?.wasExistingUser 
                      ? 'Tu registro ha sido completado exitosamente y está pendiente de aprobación por el administrador.'
                      : 'Tu cuenta ha sido creada y está pendiente de aprobación por el administrador.'
                    }
                  </p>
                  
                  {/* Información adicional para usuarios existentes */}
                  {registrationData?.result?.wasExistingUser && (
                    <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-start gap-3">
                        <div className="w-5 h-5 text-blue-600 mt-0.5">
                          ℹ️
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-blue-800">
                            Registro completado
                          </p>
                          <p className="text-sm text-blue-700 mt-1">
                            Detectamos que ya tenías una cuenta parcialmente creada. Hemos completado 
                            tu registro con la información proporcionada.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Información del usuario */}
                  <div className="bg-gray-50 rounded-lg p-6 mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      Información de tu cuenta
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                      <div className="flex items-center gap-3">
                        <User className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-500">Nombre</p>
                          <p className="font-medium text-gray-900">
                            {registrationData?.fullName}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Mail className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium text-gray-900">
                            {registrationData?.email}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Clock className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-500">Estado</p>
                          <p className="font-medium text-amber-600">
                            Pendiente de aprobación
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <CheckCircle className="w-5 h-5 text-blue-600" />
                        <div>
                          <p className="text-sm text-gray-500">Método de registro</p>
                          <p className="font-medium text-gray-900 capitalize">
                            {registrationData?.authMethod === 'email' ? 'Email' : 
                             registrationData?.authMethod === 'google' ? 'Google' : 'Apple'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Información adicional para usuarios de email */}
                      {registrationData?.authMethod === 'email' && (
                        <div className="mt-4 p-4 bg-amber-50 rounded-lg border border-amber-200">
                          <div className="flex items-start gap-3">
                            <div className="w-5 h-5 text-amber-600 mt-0.5">
                              ⚠️
                            </div>
                            <div>
                              <p className="text-sm font-medium text-amber-800">
                                Contraseña temporal asignada
                              </p>
                              <p className="text-sm text-amber-700 mt-1">
                                Se te ha asignado una contraseña temporal. Deberás cambiarla 
                                en tu primer inicio de sesión por seguridad.
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  {/* Próximos pasos */}
                  <div className="bg-blue-50 rounded-lg p-6 mb-8">
                    <h3 className="text-lg font-semibold text-blue-900 mb-3">
                      ¿Qué sigue ahora?
                    </h3>
                    <div className="text-left space-y-3">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                          1
                        </div>
                        <div>
                          <p className="font-medium text-blue-900">Revisión de documentos</p>
                          <p className="text-sm text-blue-700">
                            El administrador revisará tus documentos y información personal
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                          2
                        </div>
                        <div>
                          <p className="font-medium text-blue-900">Aprobación de cuenta</p>
                          <p className="text-sm text-blue-700">
                            Recibirás una notificación cuando tu cuenta sea aprobada
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold mt-0.5">
                          3
                        </div>
                        <div>
                          <p className="font-medium text-blue-900">Acceso completo</p>
                          <p className="text-sm text-blue-700">
                            Podrás iniciar sesión y acceder a todas las funcionalidades
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                  
                  {/* Botones de acción */}
                  <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button
                      onClick={() => router.push('/login')}
                      className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      Ir al Login
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => router.push('/')}
                      className="px-8 py-3"
                    >
                      Volver al Inicio
                    </Button>
                  </div>
                  
                  {/* Información adicional */}
                  <div className="mt-8 p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-600">
                      <strong>Tiempo estimado de aprobación:</strong> 1-2 días hábiles<br />
                      <strong>¿Necesitas ayuda?</strong> Contacta a soporte@zentry.com
                    </p>
                  </div>
                </div>
              </div>
            </div>
          ) : isRegistering ? (
            // Pantalla de carga durante el registro
            <div className="min-h-screen flex items-center justify-center p-4">
              <Card className="w-full max-w-md">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
                  </div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-2">
                    Completando tu registro...
                  </h2>
                  <p className="text-gray-600 mb-4">
                    Estamos procesando tu información y creando tu cuenta
                  </p>
                  <div className="space-y-2 text-sm text-gray-500">
                    <p>✓ Validando documentos</p>
                    <p>✓ Creando cuenta de usuario</p>
                    <p>⏳ Finalizando registro</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            // Formulario multi-paso
            <MultiStepRegisterForm
              onRegistrationComplete={handleRegistrationComplete}
              onCancel={handleCancel}
            />
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white/80 backdrop-blur-sm border-t border-gray-200 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Información de la empresa */}
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-6 h-6 bg-blue-600 rounded flex items-center justify-center">
                  <Home className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-gray-900">Zentry</span>
              </div>
              <p className="text-sm text-gray-600">
                La plataforma integral para la gestión de residenciales. 
                Conectamos comunidades y simplificamos la vida en conjunto.
              </p>
            </div>

            {/* Enlaces útiles */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Enlaces Útiles</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>
                  <button 
                    onClick={() => router.push('/help')}
                    className="hover:text-blue-600 transition-colors"
                  >
                    Centro de Ayuda
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => router.push('/terms')}
                    className="hover:text-blue-600 transition-colors"
                  >
                    Términos y Condiciones
                  </button>
                </li>
                <li>
                  <button 
                    onClick={() => router.push('/privacy')}
                    className="hover:text-blue-600 transition-colors"
                  >
                    Política de Privacidad
                  </button>
                </li>
              </ul>
            </div>

            {/* Contacto */}
            <div>
              <h3 className="font-medium text-gray-900 mb-4">Contacto</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>soporte@zentry.com</li>
                <li>+1 (555) 123-4567</li>
                <li>Lunes a Viernes: 9:00 AM - 6:00 PM</li>
              </ul>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
            <p>&copy; 2024 Zentry. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
} 