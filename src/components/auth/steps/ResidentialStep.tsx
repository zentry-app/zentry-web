'use client';

import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Home, MapPin, Search, CheckCircle, AlertCircle, Users } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ResidentialData, RegistrationData } from '../MultiStepRegisterForm';
import ResidentialService from '@/lib/services/registration-residential-service';

interface ResidentialStepProps {
  data: RegistrationData;
  onDataChange: (data: Partial<ResidentialData>) => void;
  onValidationChange: (isValid: boolean) => void;
  isLoading: boolean;
}

export function ResidentialStep({ 
  data, 
  onDataChange, 
  onValidationChange, 
  isLoading 
}: ResidentialStepProps) {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isValidating, setIsValidating] = useState(false);
  const [residentialInfo, setResidentialInfo] = useState<any>(null);
  const [availableStreets, setAvailableStreets] = useState<string[]>([]);
  const [userCount, setUserCount] = useState<any>(null);
  const { toast } = useToast();

  const { 
    residentialId, 
    residentialName, 
    street, 
    houseNumber, 
    propertyType, 
    houseId 
  } = data.residential;

  // Memoizar la función de actualización para evitar recreaciones innecesarias
  const updateResidentialData = useCallback((updates: Partial<ResidentialData>) => {
    onDataChange(updates);
  }, [onDataChange]);

  // Validar ID de residencial
  useEffect(() => {
    const validateResidential = async () => {
      if (residentialId && residentialId.length === 6) {
        setIsValidating(true);
        try {
          const validation = await ResidentialService.validateResidentialId(residentialId);
          
          if (validation.isValid && validation.data) {
            setResidentialInfo(validation.data);
            setAvailableStreets(validation.data.calles);
            // Solo actualizar si el nombre ha cambiado para evitar bucles
            if (residentialName !== validation.data.nombre) {
              updateResidentialData({ residentialName: validation.data.nombre });
            }
            setErrors(prev => ({ ...prev, residentialId: '' }));
          } else {
            setResidentialInfo(null);
            setAvailableStreets([]);
            // Solo limpiar si hay datos que limpiar
            if (residentialName || street || houseNumber) {
              updateResidentialData({ residentialName: '', street: '', houseNumber: '' });
            }
            setErrors(prev => ({ 
              ...prev, 
              residentialId: validation.error || 'ID de residencial no válido' 
            }));
          }
        } catch (error) {
          setErrors(prev => ({ 
            ...prev, 
            residentialId: 'Error al validar el residencial' 
          }));
        } finally {
          setIsValidating(false);
        }
      } else if (residentialId && residentialId.length > 0) {
        setErrors(prev => ({ 
          ...prev, 
          residentialId: 'El ID debe tener exactamente 6 caracteres' 
        }));
      } else {
        setErrors(prev => ({ ...prev, residentialId: '' }));
        setResidentialInfo(null);
        setAvailableStreets([]);
      }
    };

    validateResidential();
  }, [residentialId, residentialName, street, houseNumber, updateResidentialData]);

  // Validar dirección completa
  useEffect(() => {
    const validateAddress = async () => {
      if (residentialId && street && houseNumber) {
        try {
          const userCountResult = await ResidentialService.countUsersInHouse(
            residentialId,
            street,
            houseNumber
          );
          setUserCount(userCountResult);
          
          if (!userCountResult.canRegister) {
            setErrors(prev => ({ 
              ...prev, 
              houseNumber: `Esta casa ya tiene ${userCountResult.maxAllowed} usuarios registrados` 
            }));
          } else {
            setErrors(prev => ({ ...prev, houseNumber: '' }));
          }
        } catch (error) {
          console.error('Error al validar dirección:', error);
        }
      }
    };

    validateAddress();
  }, [residentialId, street, houseNumber]);

  // Generar houseId automáticamente cuando se selecciona tipo de propiedad
  useEffect(() => {
    if (propertyType && residentialId && street && houseNumber) {
      const newHouseId = ResidentialService.generateHouseId(residentialId, street, houseNumber);
      updateResidentialData({ houseId: newHouseId });
    }
  }, [propertyType, residentialId, street, houseNumber, updateResidentialData]);

  // Validar formulario completo
  useEffect(() => {
    const newErrors = { ...errors };

    if (!residentialId) {
      newErrors.residentialId = 'El ID del residencial es obligatorio';
    }

    if (!street) {
      newErrors.street = 'Debes seleccionar una calle';
    }

    if (!houseNumber) {
      newErrors.houseNumber = 'El número de casa es obligatorio';
    }

    if (!propertyType) {
      newErrors.propertyType = 'Debes seleccionar el tipo de propiedad';
    }

    const isValid = residentialId && 
                   residentialId.length === 6 &&
                   street && 
                   houseNumber && 
                   propertyType &&
                   residentialInfo &&
                   (!userCount || userCount.canRegister) &&
                   Object.values(newErrors).every(error => !error);

    onValidationChange(!!isValid);
  }, [residentialId, street, houseNumber, propertyType, residentialInfo, userCount, errors, onValidationChange]);

  const handleInputChange = (field: string, value: string) => {
    updateResidentialData({ [field]: value });
    
    // Limpiar errores relacionados
    if (field === 'residentialId') {
      setErrors(prev => ({ ...prev, residentialId: '' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
          <Home className="w-8 h-8 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-gray-900 mb-2">
          Información Residencial
        </h3>
        <p className="text-gray-600">
          Ingresa los datos de tu residencia para completar el registro
        </p>
      </div>

      {/* Formulario */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Datos de tu Residencia
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* ID del Residencial */}
          <div className="space-y-2">
            <Label htmlFor="residentialId">
              ID del Residencial *
            </Label>
            <div className="relative">
              <Input
                id="residentialId"
                type="text"
                placeholder="Ingresa el ID de 6 caracteres"
                value={residentialId}
                onChange={(e) => handleInputChange('residentialId', e.target.value.toUpperCase())}
                className={`uppercase ${errors.residentialId ? 'border-red-500' : ''}`}
                disabled={isLoading}
                maxLength={6}
              />
              {isValidating && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                </div>
              )}
              {residentialInfo && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                </div>
              )}
            </div>
            {errors.residentialId && (
              <p className="text-sm text-red-600 flex items-center gap-1">
                <AlertCircle className="w-4 h-4" />
                {errors.residentialId}
              </p>
            )}
            <p className="text-sm text-gray-500">
              Solicita este ID a la administración de tu residencial
            </p>
          </div>

          {/* Información del Residencial */}
          {residentialInfo && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-green-900 mb-1">
                    Residencial Encontrado
                  </h4>
                  <p className="text-green-800 font-medium">{residentialInfo.nombre}</p>
                  <p className="text-sm text-green-700">
                    {availableStreets.length} calles disponibles
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Calle */}
          {availableStreets.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="street">
                Calle *
              </Label>
              <Select 
                value={street} 
                onValueChange={(value) => updateResidentialData({ street: value, houseNumber: '' })}
                disabled={isLoading}
              >
                <SelectTrigger className={errors.street ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecciona tu calle" />
                </SelectTrigger>
                <SelectContent>
                  {availableStreets.map((streetName) => (
                    <SelectItem key={streetName} value={streetName}>
                      {streetName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.street && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.street}
                </p>
              )}
            </div>
          )}

          {/* Número de Casa */}
          {street && (
            <div className="space-y-2">
              <Label htmlFor="houseNumber">
                Número de Casa *
              </Label>
              <Input
                id="houseNumber"
                type="text"
                placeholder="Ej: 123, 45A, Lote 7"
                value={houseNumber}
                onChange={(e) => handleInputChange('houseNumber', e.target.value)}
                className={errors.houseNumber ? 'border-red-500' : ''}
                disabled={isLoading}
              />
              {errors.houseNumber && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.houseNumber}
                </p>
              )}
            </div>
          )}

          {/* Información de usuarios en la casa */}
          {userCount && (
            <div className={`p-4 rounded-lg border ${
              userCount.canRegister 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <div className="flex items-start gap-3">
                <Users className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                  userCount.canRegister ? 'text-blue-600' : 'text-red-600'
                }`} />
                <div>
                  <h4 className={`font-medium mb-1 ${
                    userCount.canRegister ? 'text-blue-900' : 'text-red-900'
                  }`}>
                    Usuarios en esta casa
                  </h4>
                  <p className={`text-sm ${
                    userCount.canRegister ? 'text-blue-800' : 'text-red-800'
                  }`}>
                    {userCount.count} de {userCount.maxAllowed} usuarios registrados
                    {userCount.ownerCount > 0 && (
                      <span className="block text-xs opacity-75">
                        (Propietarios: {userCount.ownerCount}, Inquilinos: {userCount.tenantCount})
                      </span>
                    )}
                  </p>
                  {userCount.canRegister ? (
                    <p className="text-sm text-blue-700 mt-1">
                      ✅ Puedes registrarte en esta casa
                    </p>
                  ) : (
                    <p className="text-sm text-red-700 mt-1">
                      ❌ Esta casa ya tiene el máximo de usuarios permitidos
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Tipo de Propiedad */}
          {houseNumber && (
            <div className="space-y-2">
              <Label htmlFor="propertyType">
                Tipo de Propiedad *
              </Label>
              <Select 
                value={propertyType} 
                onValueChange={(value) => updateResidentialData({ propertyType: value as 'owned' | 'rented' })}
                disabled={isLoading}
              >
                <SelectTrigger className={errors.propertyType ? 'border-red-500' : ''}>
                  <SelectValue placeholder="Selecciona el tipo de propiedad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="owned">Propia</SelectItem>
                  <SelectItem value="rented">Rentada</SelectItem>
                </SelectContent>
              </Select>
              {errors.propertyType && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="w-4 h-4" />
                  {errors.propertyType}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resumen */}
      {residentialInfo && street && houseNumber && propertyType && (
        <Card className="bg-blue-50 border-blue-200">
          <CardHeader>
            <CardTitle className="text-blue-900">Resumen de tu Residencia</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-800">Residencial:</span>
                <span className="font-medium text-blue-900">{residentialName}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-800">Dirección:</span>
                <span className="font-medium text-blue-900">{street} #{houseNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-blue-800">Tipo:</span>
                <Badge variant="secondary">
                  {propertyType === 'owned' ? 'Propia' : 'Rentada'}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Información adicional */}
      <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
        <div className="flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
          <div>
            <h4 className="font-medium text-yellow-900 mb-1">
              Información importante
            </h4>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• El ID del residencial debe ser proporcionado por la administración</li>
              <li>• Se permiten hasta 3 usuarios por casa (1 propietario + 2 inquilinos)</li>
              <li>• El House ID es opcional pero recomendado para identificación rápida</li>
              <li>• Verifica que la dirección sea correcta antes de continuar</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
} 