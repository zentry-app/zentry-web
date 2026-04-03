'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  User, 
  Home, 
  FileText, 
  Mail, 
  Phone, 
  MapPin,
  Shield,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { RegistrationData } from '../MultiStepRegisterForm';

interface ConfirmationStepProps {
  data: RegistrationData;
  onDataChange: (data: { termsAccepted?: boolean; privacyAccepted?: boolean }) => void;
  onValidationChange: (isValid: boolean) => void;
  isLoading: boolean;
}

export function ConfirmationStep({ 
  data, 
  onDataChange, 
  onValidationChange, 
  isLoading 
}: ConfirmationStepProps) {
  const { termsAccepted, privacyAccepted } = data;

  // Validar aceptación de términos
  useEffect(() => {
    const isValid = termsAccepted && privacyAccepted;
    onValidationChange(isValid);
  }, [termsAccepted, privacyAccepted, onValidationChange]);

  const handleTermsChange = (checked: boolean) => {
    onDataChange({ termsAccepted: checked });
  };

  const handlePrivacyChange = (checked: boolean) => {
    onDataChange({ privacyAccepted: checked });
  };

  // Obtener método de autenticación legible
  const getAuthMethodText = () => {
    switch (data.authMethod.method) {
      case 'google':
        return 'Google';
      case 'apple':
        return 'Apple';
      default:
        return 'Email y contraseña';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Confirma tu Registro
        </h3>
        <p className="text-gray-600">
          Revisa todos tus datos antes de completar el registro
        </p>
      </div>

      {/* Resumen completo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Información Personal */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5 text-blue-600" />
              Información Personal
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Nombre completo:</span>
                <span className="font-medium">
                  {data.personalInfo.firstName} {data.personalInfo.paternalLastName} {data.personalInfo.maternalLastName}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Email:</span>
                <span className="font-medium">{data.personalInfo.email}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Teléfono:</span>
                <span className="font-medium">{data.personalInfo.phone}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Método de acceso:</span>
                <Badge variant="secondary">{getAuthMethodText()}</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Información Residencial */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Home className="w-5 h-5 text-green-600" />
              Información Residencial
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Residencial:</span>
                <span className="font-medium">{data.residential.residentialName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">ID Residencial:</span>
                <span className="font-medium font-mono">{data.residential.residentialId}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Dirección:</span>
                <span className="font-medium">
                  {data.residential.street} #{data.residential.houseNumber}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Tipo de propiedad:</span>
                <Badge variant="outline">
                  {data.residential.propertyType === 'owned' ? 'Propia' : 'Rentada'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Estado de Documentos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-purple-600" />
            Documentos Subidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                data.documents.identificationUploaded 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-gray-100 text-gray-400'
              }`}>
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">Identificación Oficial</p>
                <p className="text-sm text-gray-600">
                  {data.documents.identificationUploaded ? 'Subido correctamente' : 'Pendiente'}
                </p>
              </div>
              {data.documents.identificationUploaded && (
                <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                data.documents.proofUploaded 
                  ? 'bg-green-100 text-green-600' 
                  : 'bg-gray-100 text-gray-400'
              }`}>
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <p className="font-medium">Comprobante de Domicilio</p>
                <p className="text-sm text-gray-600">
                  {data.documents.proofUploaded ? 'Subido correctamente' : 'Pendiente'}
                </p>
              </div>
              {data.documents.proofUploaded && (
                <CheckCircle className="w-5 h-5 text-green-500 ml-auto" />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Términos y Condiciones */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-blue-600" />
            Términos y Condiciones
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Términos de Servicio */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="terms"
              checked={termsAccepted}
              onCheckedChange={handleTermsChange}
              disabled={isLoading}
            />
            <div className="flex-1">
              <label
                htmlFor="terms"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Acepto los{' '}
                <a
                  href="/terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Términos y Condiciones de Uso
                </a>
              </label>
            </div>
          </div>

          {/* Política de Privacidad */}
          <div className="flex items-start gap-3">
            <Checkbox
              id="privacy"
              checked={privacyAccepted}
              onCheckedChange={handlePrivacyChange}
              disabled={isLoading}
            />
            <div className="flex-1">
              <label
                htmlFor="privacy"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Acepto la{' '}
                <a
                  href="/privacy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 underline"
                >
                  Política de Privacidad
                </a>
              </label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Información del proceso */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">¿Qué sucede después?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                1
              </div>
              <div>
                <p className="font-medium text-blue-900">Revisión de documentos</p>
                <p className="text-sm text-blue-800">
                  El equipo de administración revisará tus documentos en un plazo de 24-48 horas
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                2
              </div>
              <div>
                <p className="font-medium text-blue-900">Notificación por email</p>
                <p className="text-sm text-blue-800">
                  Te enviaremos un correo con el resultado de la revisión
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">
                3
              </div>
              <div>
                <p className="font-medium text-blue-900">Acceso completo</p>
                <p className="text-sm text-blue-800">
                  Una vez aprobado, podrás acceder a todos los servicios de Zentry
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Advertencia final */}
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-yellow-900 mb-1">
              Antes de completar tu registro
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Verifica que todos tus datos sean correctos</li>
              <li>• Asegúrate de haber subido ambos documentos</li>
              <li>• Revisa que tu email esté escrito correctamente</li>
              <li>• Confirma que has aceptado los términos y condiciones</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Enlaces útiles */}
      <div className="text-center space-y-2">
        <p className="text-sm text-gray-600">
          ¿Necesitas ayuda? Consulta nuestros recursos:
        </p>
        <div className="flex justify-center gap-4 text-sm">
          <button className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
            Centro de Ayuda
            <ExternalLink className="w-3 h-3" />
          </button>
          <button className="text-blue-600 hover:text-blue-800 flex items-center gap-1">
            Contactar Soporte
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
} 