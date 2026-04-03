'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Eye, EyeOff, Mail, Lock, Chrome } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { AuthMethodData, RegistrationData } from '../MultiStepRegisterForm';
import * as firebaseAuth from 'firebase/auth';
import { getAuthSafe } from '@/lib/firebase/config';

interface AuthMethodStepProps {
  data: RegistrationData;
  onDataChange: (data: Partial<AuthMethodData>) => void;
  onValidationChange: (isValid: boolean) => void;
  isLoading: boolean;
  onNext: () => void;
}

export function AuthMethodStep({ 
  data, 
  onDataChange, 
  onValidationChange, 
  isLoading, 
  onNext,
  onEmailAlreadyRegistered // (opcional, para mostrar modal global)
}: AuthMethodStepProps & { onEmailAlreadyRegistered?: (email: string, method: string) => void }) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const { toast } = useToast();
  const { getGoogleUserInfo, getAppleUserInfo } = useAuth();
  const [isLoadingState, setIsLoading] = useState(isLoading);
  const [emailCheckLoading, setEmailCheckLoading] = useState(false);
  const [emailAlreadyRegistered, setEmailAlreadyRegistered] = useState<null | { email: string; method: string }>(null);

  const { method, email, password, confirmPassword } = data.authMethod;

  // Validar campos en tiempo real
  useEffect(() => {
    const newErrors: Record<string, string> = {};

    // Validar email
    if (email && !email.includes('@')) {
      newErrors.email = 'Email inválido';
    }

    // Validar contraseña solo para método email
    if (method === 'email') {
      if (password && password.length < 6) {
        newErrors.password = 'Mínimo 6 caracteres';
      }
      
      if (password && !/[A-Z]/.test(password)) {
        newErrors.password = 'Debe contener al menos una mayúscula';
      }
      
      if (password && !/\d/.test(password)) {
        newErrors.password = 'Debe contener al menos un número';
      }

      if (confirmPassword && password !== confirmPassword) {
        newErrors.confirmPassword = 'Las contraseñas no coinciden';
      }
    }

    setErrors(newErrors);

    // Validar si puede proceder
    const isValid = method === 'google' || method === 'apple' || 
                   (email && 
                    email.includes('@') && 
                    (method !== 'email' || 
                     (password && 
                      password.length >= 6 && 
                      /[A-Z]/.test(password) && 
                      /\d/.test(password) && 
                      password === confirmPassword)));

    onValidationChange(!!isValid && Object.keys(newErrors).length === 0);
  }, [method, email, password, confirmPassword, onValidationChange]);

  const handleMethodChange = (newMethod: 'email' | 'google' | 'apple') => {
    onDataChange({ method: newMethod });
  };

  const handleInputChange = (field: string, value: string) => {
    onDataChange({ [field]: value });
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      console.error("[DEBUG] Iniciando Google SignIn");
      // Usar getGoogleUserInfo para registro (no hace login completo)
      const result = await getGoogleUserInfo();
      console.error("[DEBUG] RESULTADO GOOGLE:", result);
      if (result && result.userData) {
        const { firstName, paternalLastName, maternalLastName, email, fullName } = result.userData;
        console.error("[DEBUG] Datos de usuario obtenidos:", result.userData);
        // Actualizar los datos del método de autenticación
        onDataChange({
          method: 'google',
          email: email,
          password: '', // No necesario para Google
          confirmPassword: '', // No necesario para Google
          firstName: firstName,
          lastName: `${paternalLastName} ${maternalLastName}`.trim(),
          googleUser: result.user // Guardar referencia del usuario de Google
        });
        // También pre-cargar los datos en el paso de información personal
        if (data.personalInfo) {
          const personalInfoUpdate = {
            firstName: firstName,
            paternalLastName: paternalLastName,
            maternalLastName: maternalLastName,
            email: email,
            phone: data.personalInfo.phone || '',
          };
          console.log("[DEBUG] Actualizando datos personales:", personalInfoUpdate);
        }
        toast({
          title: "¡Información obtenida!",
          description: `Datos de Google obtenidos correctamente. Se han pre-cargado tu nombre y apellidos.`,
          variant: "default"
        });
        setTimeout(() => {
          onNext();
        }, 1500);
      } else {
        console.warn("[DEBUG] No se obtuvieron datos de usuario de Google");
      }
    } catch (error: any) {
      console.error('[DEBUG] Error con Google Sign-In:', error);
      toast({
        title: "Error de autenticación",
        description: "No se pudo obtener la información de Google. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      setIsLoading(true);
      console.log("[DEBUG] Iniciando Apple SignIn");
      // Usar getAppleUserInfo para registro (no hace login completo)
      const result = await getAppleUserInfo();
      console.log("[DEBUG] RESULTADO APPLE:", result);
      if (result && result.userData) {
        const { firstName, paternalLastName, maternalLastName, email, fullName } = result.userData;
        console.log("[DEBUG] Datos de usuario obtenidos:", result.userData);
        onDataChange({
          method: 'apple',
          email: email,
          password: '', // No necesario para Apple
          confirmPassword: '', // No necesario para Apple
          firstName: firstName,
          lastName: `${paternalLastName} ${maternalLastName}`.trim(),
          googleUser: result.user // Guardar referencia del usuario de Apple
        });
        toast({
          title: "¡Información obtenida!",
          description: `Datos de Apple obtenidos correctamente. Se han pre-cargado tu nombre y apellidos.`,
          variant: "default"
        });
        setTimeout(() => {
          onNext();
        }, 1500);
      } else {
        console.warn("[DEBUG] No se obtuvieron datos de usuario de Apple");
      }
    } catch (error: any) {
      console.error('[DEBUG] Error con Apple Sign-In:', error);
      toast({
        title: "Error de autenticación",
        description: "No se pudo obtener la información de Apple. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Validación de email en onBlur
  const handleEmailBlur = async () => {
    if (!email || !email.includes('@')) return;
    console.log('[DEBUG][handleEmailBlur] Iniciando validación de email (Cloud Function):', email);
    setEmailCheckLoading(true);
    try {
      const url = `https://us-central1-zentryapp-949f4.cloudfunctions.net/checkEmailProvider?email=${encodeURIComponent(email)}`;
      const res = await fetch(url);
      const data = await res.json();
      console.log('[DEBUG][handleEmailBlur] Respuesta de Cloud Function:', data);
      if (data.exists && data.providers && data.providers.length > 0) {
        const method = data.providers.includes('password') ? 'password' : data.providers[0];
        setEmailAlreadyRegistered({ email, method });
        if (onEmailAlreadyRegistered) onEmailAlreadyRegistered(email, method);
        toast({
          title: 'Este correo ya está registrado',
          description: method === 'password'
            ? 'Ingresa con tu correo y contraseña o recupera tu contraseña.'
            : `Ingresa usando el botón de ${method === 'google.com' ? 'Google' : 'Apple'} en la app móvil de Zentry.`,
          variant: 'destructive',
        });
        console.log('[DEBUG][handleEmailBlur] Correo registrado, método:', method);
      } else {
        setEmailAlreadyRegistered(null);
        console.log('[DEBUG][handleEmailBlur] Correo disponible');
      }
    } catch (err) {
      console.error('[DEBUG][handleEmailBlur] Error en validación de email (Cloud Function):', err);
    } finally {
      setEmailCheckLoading(false);
    }
  };

  // Mensaje personalizado según método
  const getEmailRegisteredMessage = (method: string) => {
    const normalized = method === 'email' ? 'password' : method;
    if (normalized === 'password') {
      return 'Este correo ya está registrado. Ingresa con tu correo y contraseña o recupera tu contraseña.';
    }
    if (normalized === 'google.com') {
      return 'Este correo ya está registrado. Ingresa usando el botón de Google en la app móvil de Zentry.';
    }
    if (normalized === 'apple.com') {
      return 'Este correo ya está registrado. Ingresa usando el botón de Apple en la app móvil de Zentry.';
    }
    return 'Este correo ya está registrado.';
  };

  const canProceed = method === 'google' || method === 'apple' || 
                     (email && 
                      email.includes('@') && 
                      (method !== 'email' || 
                       (password && 
                        password.length >= 6 && 
                        /[A-Z]/.test(password) && 
                        /\d/.test(password) && 
                        password === confirmPassword)));

  return (
    <div className="space-y-6">
      {/* Método de Autenticación */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          Elige tu método de autenticación
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Email y Contraseña */}
          <Card 
            className={`cursor-pointer transition-all duration-200 ${
              method === 'email' 
                ? 'ring-2 ring-blue-500 bg-blue-50' 
                : 'hover:shadow-md'
            }`}
            onClick={() => handleMethodChange('email')}
          >
            <CardContent className="p-4 text-center">
              <Mail className="w-8 h-8 mx-auto mb-2 text-blue-600" />
              <h4 className="font-medium text-gray-900">Email</h4>
              <p className="text-sm text-gray-600">
                Usar email y contraseña
              </p>
            </CardContent>
          </Card>

          {/* Google - Habilitado */}
          <Card 
            className={`cursor-pointer transition-all duration-200 ${
              method === 'google' 
                ? 'ring-2 ring-red-500 bg-red-50' 
                : 'hover:shadow-md'
            }`}
            onClick={() => handleMethodChange('google')}
          >
            <CardContent className="p-4 text-center">
              <Chrome className="w-8 h-8 mx-auto mb-2 text-red-600" />
              <h4 className="font-medium text-gray-900">Google</h4>
              <p className="text-sm text-gray-600">
                Registrarse con Google
              </p>
            </CardContent>
          </Card>

          {/* Apple - Habilitado */}
          <Card 
            className={`cursor-pointer transition-all duration-200 ${
              method === 'apple' 
                ? 'ring-2 ring-gray-900 bg-gray-50' 
                : 'hover:shadow-md'
            }`}
            onClick={() => handleMethodChange('apple')}
          >
            <CardContent className="p-4 text-center">
              <div className="w-8 h-8 mx-auto mb-2 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">🍎</span>
              </div>
              <h4 className="font-medium text-gray-900">Apple</h4>
              <p className="text-sm text-gray-600">
                Registrarse con Apple
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Formulario según el método seleccionado */}
      <div className="space-y-4">
        {method === 'email' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Email */}
              <div className="space-y-2">
                <Label htmlFor="email">
                  Correo electrónico *
                </Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="tu@email.com"
                  value={email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  onBlur={handleEmailBlur}
                  className={errors.email ? 'border-red-500' : ''}
                  disabled={isLoadingState || emailCheckLoading}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
                {emailAlreadyRegistered && (
                  <p className="text-sm text-red-600">
                    {getEmailRegisteredMessage(emailAlreadyRegistered.method)}
                  </p>
                )}
                {emailCheckLoading && (
                  <p className="text-sm text-gray-500">Verificando...</p>
                )}
              </div>

              {/* Contraseña */}
              <div className="space-y-2">
                <Label htmlFor="password">
                  Contraseña *
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Mínimo 6 caracteres"
                    value={password || ''}
                    onChange={(e) => handleInputChange('password', e.target.value)}
                    className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                    disabled={isLoadingState}
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-600">{errors.password}</p>
                )}
              </div>
            </div>

            {/* Confirmar Contraseña */}
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">
                Confirmar contraseña *
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirma tu contraseña"
                  value={confirmPassword || ''}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className={errors.confirmPassword ? 'border-red-500 pr-10' : 'pr-10'}
                  disabled={isLoadingState}
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-sm text-red-600">{errors.confirmPassword}</p>
              )}
            </div>

            {/* Requisitos de contraseña */}
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 mb-2">
                Requisitos de contraseña:
              </h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    password && password.length >= 6 ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  Mínimo 6 caracteres
                </li>
                <li className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    password && /[A-Z]/.test(password) ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  Al menos una mayúscula
                </li>
                <li className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${
                    password && /d/.test(password) ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                  Al menos un número
                </li>
              </ul>
            </div>
          </div>
        )}

        {method === 'google' && (
          <div className="text-center space-y-4">
            <div className="bg-red-50 p-6 rounded-lg">
              <Chrome className="w-12 h-12 mx-auto mb-4 text-red-600" />
              <h4 className="font-medium text-gray-900 mb-2">
                Registrarse con Google
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Usa tu cuenta de Google para crear tu cuenta en Zentry. 
                Tu información se obtendrá automáticamente de tu perfil de Google.
              </p>
              <Button
                onClick={handleGoogleSignIn}
                disabled={isLoadingState}
                className="bg-red-600 hover:bg-red-700 w-full"
              >
                {isLoadingState ? 'Conectando...' : 'Registrarse con Google'}
              </Button>
            </div>
            
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>¿Qué información obtendremos?</strong><br/>
                • Tu nombre completo<br/>
                • Tu dirección de correo electrónico<br/>
                • Tu foto de perfil (opcional)
              </p>
            </div>
          </div>
        )}

        {method === 'apple' && (
          <div className="text-center space-y-4">
            <div className="bg-gray-50 p-6 rounded-lg">
              <div className="w-12 h-12 mx-auto mb-4 bg-gray-900 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-2xl">🍎</span>
              </div>
              <h4 className="font-medium text-gray-900 mb-2">
                Registrarse con Apple
              </h4>
              <p className="text-sm text-gray-600 mb-4">
                Usa tu Apple ID para crear tu cuenta en Zentry.
                Tu información se obtendrá automáticamente de tu cuenta de Apple.
              </p>
              <Button
                onClick={handleAppleSignIn}
                disabled={isLoadingState}
                className="bg-gray-900 hover:bg-gray-800 w-full"
              >
                {isLoadingState ? 'Conectando...' : 'Registrarse con Apple'}
              </Button>
            </div>

            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>¿Qué información obtendremos?</strong><br/>
                • Tu nombre completo<br/>
                • Tu dirección de correo electrónico<br/>
                • Tu información de perfil
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Información de seguridad */}
      <div className="bg-gray-50 p-4 rounded-lg">
        <p className="text-sm text-gray-600">
          <strong>Seguridad:</strong> Tu información estará protegida y solo se utilizará para 
          crear tu cuenta en Zentry. Nunca compartiremos tus datos con terceros.
        </p>
      </div>
      <Button
        onClick={onNext}
        disabled={!canProceed || isLoadingState || emailCheckLoading || !!emailAlreadyRegistered}
        className="w-full mt-4"
      >
        Siguiente
      </Button>
    </div>
  );
}