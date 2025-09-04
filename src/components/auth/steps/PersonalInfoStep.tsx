'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Phone, Mail, AlertCircle } from 'lucide-react';
import { PersonalInfoData, RegistrationData } from '../MultiStepRegisterForm';

interface PersonalInfoStepProps {
  data: RegistrationData;
  onDataChange: (data: Partial<PersonalInfoData>) => void;
  onValidationChange: (isValid: boolean) => void;
  isLoading: boolean;
}

export function PersonalInfoStep({ 
  data, 
  onDataChange, 
  onValidationChange, 
  isLoading 
}: PersonalInfoStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const { firstName, paternalLastName, maternalLastName, phone, email } = data.personalInfo;

  // Validar campos en tiempo real
  useEffect(() => {
    const newErrors: Record<string, string> = {};

    // Validar nombre
    if (touched.firstName && (!firstName || firstName.trim().length < 2)) {
      newErrors.firstName = 'El nombre debe tener al menos 2 caracteres';
    }

    // Validar apellido paterno
    if (touched.paternalLastName && (!paternalLastName || paternalLastName.trim().length < 2)) {
      newErrors.paternalLastName = 'El apellido paterno debe tener al menos 2 caracteres';
    }

    // Validar apellido materno (OPCIONAL)
    if (touched.maternalLastName && maternalLastName && maternalLastName.trim().length < 2) {
      newErrors.maternalLastName = 'El apellido materno debe tener al menos 2 caracteres';
    }

    // Validar teléfono (OPCIONAL)
    if (touched.phone && phone && phone.length > 0 && phone.length < 10) {
      newErrors.phone = 'El teléfono debe tener al menos 10 dígitos';
    } else if (touched.phone && phone && phone.length > 0 && !/^\d+$/.test(phone.replace(/\s/g, ''))) {
      newErrors.phone = 'El teléfono solo debe contener números';
    }

    // Validar email
    if (touched.email && (!email || !email.includes('@'))) {
      newErrors.email = 'Por favor ingresa un email válido';
    }

    setErrors(newErrors);

    // Validar si puede proceder (solo campos obligatorios)
    const isValid = firstName && 
                   firstName.trim().length >= 2 &&
                   paternalLastName && 
                   paternalLastName.trim().length >= 2 &&
                   // maternalLastName es opcional
                   // phone es opcional
                   email && 
                   email.includes('@') &&
                   // Si se ingresó teléfono, debe ser válido
                   (!phone || (phone.length >= 10 && /^\d+$/.test(phone.replace(/\s/g, '')))) &&
                   // Si se ingresó apellido materno, debe ser válido
                   (!maternalLastName || maternalLastName.trim().length >= 2);

    onValidationChange(!!isValid);
  }, [firstName, paternalLastName, maternalLastName, phone, email, touched, onValidationChange]);

  // Sincronizar email con el paso anterior
  useEffect(() => {
    if (data.authMethod.email && !email) {
      onDataChange({ email: data.authMethod.email });
    }
  }, [data.authMethod.email, email, onDataChange]);

  // Verificar si los datos fueron pre-cargados
  const isDataPreloaded = data.authMethod.method === 'google' || data.authMethod.method === 'apple';

  const handleInputChange = (field: string, value: string) => {
    onDataChange({ [field]: value });
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  const handlePhoneChange = (value: string) => {
    // Formatear teléfono automáticamente
    const cleaned = value.replace(/\D/g, '');
    let formatted = cleaned;
    
    if (cleaned.length >= 6) {
      formatted = `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 10)}`;
    } else if (cleaned.length >= 3) {
      formatted = `${cleaned.slice(0, 3)} ${cleaned.slice(3)}`;
    }
    
    onDataChange({ phone: formatted });
    setTouched(prev => ({ ...prev, phone: true }));
  };

  const handleBlur = (field: string) => {
    setTouched(prev => ({ ...prev, [field]: true }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
          <User className="w-8 h-8 text-blue-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Información Personal
        </h3>
        <p className="text-gray-600">
          {isDataPreloaded 
            ? `Hemos pre-cargado tu información desde ${data.authMethod.method === 'google' ? 'Google' : 'Apple'}. Verifica y completa los datos restantes.`
            : 'Completa tus datos personales para continuar con el registro'
          }
        </p>
        {isDataPreloaded && (
          <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-700">
              ✅ Datos pre-cargados automáticamente desde {data.authMethod.method === 'google' ? 'Google' : 'Apple'}
            </p>
          </div>
        )}
      </div>

      {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="w-5 h-5" />
            Datos Personales
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Nombre */}
          <div className="space-y-2">
            <Label htmlFor="firstName">
              Nombre(s) *
            </Label>
            <Input
              id="firstName"
              type="text"
              placeholder="Tu nombre"
              value={firstName}
              onChange={(e) => handleInputChange('firstName', e.target.value)}
              onBlur={() => handleBlur('firstName')}
              className={errors.firstName ? 'border-red-500' : ''}
              disabled={isLoading}
            />
            {errors.firstName && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.firstName}
              </p>
            )}
          </div>

          {/* Apellidos */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="paternalLastName">
                Apellido Paterno *
              </Label>
              <Input
                id="paternalLastName"
                type="text"
                placeholder="Apellido paterno"
                value={paternalLastName}
                onChange={(e) => handleInputChange('paternalLastName', e.target.value)}
                onBlur={() => handleBlur('paternalLastName')}
                className={errors.paternalLastName ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.paternalLastName && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.paternalLastName}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="maternalLastName">
                Apellido Materno (opcional)
              </Label>
              <Input
                id="maternalLastName"
                type="text"
                placeholder="Apellido materno"
                value={maternalLastName}
                onChange={(e) => handleInputChange('maternalLastName', e.target.value)}
                onBlur={() => handleBlur('maternalLastName')}
                className={errors.maternalLastName ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.maternalLastName && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.maternalLastName}
                </p>
              )}
            </div>
          </div>

          {/* Teléfono */}
          <div className="space-y-2">
            <Label htmlFor="phone">
              Número de teléfono (opcional)
            </Label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="phone"
                type="tel"
                placeholder="555 123 4567"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                onBlur={() => handleBlur('phone')}
                className={`pl-10 ${errors.phone ? 'border-red-500' : ''}`}
                disabled={isLoading}
                maxLength={13}
              />
            </div>
            {errors.phone && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.phone}
              </p>
            )}
            <p className="text-sm text-gray-500">
              Formato: 555 123 4567 (solo números)
            </p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">
              Correo electrónico *
            </Label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                id="email"
                type="email"
                placeholder="tu@email.com"
                value={email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                onBlur={() => handleBlur('email')}
                className={`pl-10 ${errors.email ? 'border-red-500' : ''}`}
                disabled={isLoading}
              />
            </div>
            {errors.email && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.email}
              </p>
            )}
            {data.authMethod.method === 'google' || data.authMethod.method === 'apple' ? (
              <p className="text-sm text-blue-600">
                Este email se obtuvo automáticamente de tu cuenta
              </p>
            ) : (
              <p className="text-sm text-gray-500">
                Asegúrate de que sea correcto, lo usaremos para comunicarnos contigo
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Vista previa de datos */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Vista Previa</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-800">Nombre completo:</span>
              <span className="font-medium text-blue-900">
                {firstName && paternalLastName 
                  ? `${firstName} ${paternalLastName}${maternalLastName ? ' ' + maternalLastName : ''}`
                  : 'Pendiente'
                }
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-800">Teléfono:</span>
              <span className="font-medium text-blue-900">
                {phone || 'No especificado'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-blue-800">Email:</span>
              <span className="font-medium text-blue-900">
                {email || 'Pendiente'}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-yellow-900 mb-1">
              Información importante
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• <strong>Campos obligatorios:</strong> Nombre, Apellido Paterno y Email</li>
              <li>• <strong>Campos opcionales:</strong> Apellido Materno y Teléfono</li>
              <li>• El email será usado para confirmaciones y comunicaciones importantes</li>
              <li>• Si proporcionas un teléfono, podrás recibir notificaciones SMS</li>
              <li>• Puedes actualizar esta información después desde tu perfil</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 