'use client';

import { useState, useEffect, useCallback } from 'react';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, ArrowRight, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { 
  AuthMethodStep, 
  PersonalInfoStep, 
  ResidentialStep, 
  DocumentsStep, 
  ConfirmationStep 
} from './steps';
import { useAuth } from '@/contexts/AuthContext';

// Tipos para los datos del formulario
export interface AuthMethodData {
  method: 'email' | 'google' | 'apple';
  email: string;
  password: string;
  confirmPassword: string;
  firstName?: string;
  lastName?: string;
  googleUser?: any; // Firebase User object
}

export interface PersonalInfoData {
  firstName: string;
  paternalLastName: string;
  maternalLastName: string;
  phone: string;
  email: string;
  password?: string;
  confirmPassword?: string;
}

export interface ResidentialData {
  residentialId: string;
  residentialName: string;
  street: string;
  houseNumber: string;
  propertyType: 'owned' | 'rented';
  houseId: string;
}

export interface DocumentsData {
  identification: File | null;
  proofOfAddress: File | null;
  identificationPreview: string;
  proofPreview: string;
  identificationUploaded: boolean;
  proofUploaded: boolean;
  identificationUrl?: string;
  proofUrl?: string;
}

export interface RegistrationData {
  authMethod: AuthMethodData;
  personalInfo: PersonalInfoData;
  residential: ResidentialData;
  documents: DocumentsData;
  termsAccepted: boolean;
  privacyAccepted: boolean;
}

// Configuración de los pasos
const STEPS = [
  { id: 1, title: 'Método de Autenticación', description: 'Elige cómo crear tu cuenta' },
  { id: 2, title: 'Información Personal', description: 'Completa tus datos personales' },
  { id: 3, title: 'Información Residencial', description: 'Datos de tu residencia' },
  { id: 4, title: 'Documentos', description: 'Sube tus documentos' },
  { id: 5, title: 'Confirmación', description: 'Revisa y confirma tu registro' }
];

interface MultiStepRegisterFormProps {
  onRegistrationComplete?: (data: RegistrationData) => void;
  onCancel?: () => void;
}

export function MultiStepRegisterForm({ 
  onRegistrationComplete, 
  onCancel 
}: MultiStepRegisterFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [canProceed, setCanProceed] = useState(false);
  const [dataRestored, setDataRestored] = useState(false);
  const [registrationCompleted, setRegistrationCompleted] = useState(false);
  const { toast } = useToast();
  const { user, userData, loading } = useAuth();

  // Estados para los datos del formulario
  const [registrationData, setRegistrationData] = useState<RegistrationData>({
    authMethod: {
      method: 'email',
      email: '',
      password: '',
      confirmPassword: ''
    },
    personalInfo: {
      firstName: '',
      paternalLastName: '',
      maternalLastName: '',
      phone: '',
      email: '',
      password: '',
      confirmPassword: ''
    },
    residential: {
      residentialId: '',
      residentialName: '',
      street: '',
      houseNumber: '',
      propertyType: 'owned',
      houseId: ''
    },
    documents: {
      identification: null,
      proofOfAddress: null,
      identificationPreview: '',
      proofPreview: '',
      identificationUploaded: false,
      proofUploaded: false
    },
    termsAccepted: false,
    privacyAccepted: false
  });

  // Claves para localStorage
  const STORAGE_KEY = 'zentry_registration_data';
  const STEP_KEY = 'zentry_registration_step';

  // Cargar datos del localStorage al inicializar
  useEffect(() => {
    // No restaurar datos si el registro ya se completó
    if (registrationCompleted) return;
    
    const restoreData = () => {
      try {
        console.log('[MultiStepRegisterForm] 🔄 Iniciando restauración de datos...');
        
        const savedData = localStorage.getItem(STORAGE_KEY);
        const savedStep = localStorage.getItem(STEP_KEY);
        
        if (savedData) {
          console.log('[MultiStepRegisterForm] 📥 Datos encontrados en localStorage');
          const parsedData = JSON.parse(savedData);
          console.log('[MultiStepRegisterForm] 📋 Datos parseados:', parsedData);
          
          // Restaurar datos (excepto archivos que no se pueden serializar)
          setRegistrationData(prev => {
            const newData = {
              ...prev,
              authMethod: {
                ...prev.authMethod,
                ...parsedData.authMethod
              },
              personalInfo: {
                ...prev.personalInfo,
                ...parsedData.personalInfo
              },
              residential: {
                ...prev.residential,
                ...parsedData.residential
              },
              documents: {
                ...prev.documents,
                // Mantener archivos como null pero restaurar el resto
                identificationPreview: parsedData.documents?.identificationPreview || '',
                proofPreview: parsedData.documents?.proofPreview || '',
                identificationUploaded: parsedData.documents?.identificationUploaded || false,
                proofUploaded: parsedData.documents?.proofUploaded || false
              },
              termsAccepted: parsedData.termsAccepted || false,
              privacyAccepted: parsedData.privacyAccepted || false
            };
            
            console.log('[MultiStepRegisterForm] ✅ Datos restaurados:', newData);
            return newData;
          });
          
          setDataRestored(true);
          
          // Mostrar notificación de datos restaurados
          toast({
            title: "Datos restaurados",
            description: "Se han recuperado los datos de tu registro anterior",
            duration: 3000
          });
        } else {
          console.log('[MultiStepRegisterForm] ℹ️ No se encontraron datos guardados');
        }
        
        if (savedStep) {
          const stepNumber = parseInt(savedStep);
          if (stepNumber > 1 && stepNumber <= STEPS.length) {
            console.log(`[MultiStepRegisterForm] 📍 Restaurando paso ${stepNumber}`);
            setCurrentStep(stepNumber);
          }
        }
      } catch (error) {
        console.error('[MultiStepRegisterForm] ❌ Error al restaurar datos:', error);
        toast({
          title: "Error al restaurar datos",
          description: "Hubo un problema al recuperar tus datos guardados",
          variant: "destructive"
        });
      }
    };

    restoreData();
  }, [toast, registrationCompleted]);

  // Guardar datos en localStorage cuando cambien (con debounce)
  useEffect(() => {
    if (!dataRestored || registrationCompleted) return; // No guardar si el registro se completó
    
    const saveData = () => {
      try {
        // Crear una copia de los datos sin los archivos (no serializables)
        const dataToSave = {
          ...registrationData,
          documents: {
            ...registrationData.documents,
            identification: null, // No guardar archivo
            proofOfAddress: null   // No guardar archivo
          }
        };
        
        localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
        localStorage.setItem(STEP_KEY, currentStep.toString());
        
        console.log(`[MultiStepRegisterForm] 💾 Datos guardados (paso ${currentStep}):`, dataToSave);
      } catch (error) {
        console.error('[MultiStepRegisterForm] ❌ Error al guardar datos:', error);
      }
    };

    // Debounce para evitar guardar demasiado frecuentemente
    const timeoutId = setTimeout(saveData, 500);
    return () => clearTimeout(timeoutId);
  }, [registrationData, currentStep, dataRestored, registrationCompleted]);

  // Limpiar localStorage al completar registro
  const clearStoredData = () => {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STEP_KEY);
      console.log('[MultiStepRegisterForm] 🗑️ Datos del localStorage limpiados');
    } catch (error) {
      console.error('[MultiStepRegisterForm] ❌ Error al limpiar localStorage:', error);
    }
  };

  // Calcular progreso
  const progress = (currentStep / STEPS.length) * 100;

  // La verificación de rate limiting ahora se hace en el AuthContext
  useEffect(() => {
    // No necesitamos hacer verificación previa aquí
  }, []);

  // Efecto para pre-cargar datos personales desde Google/Apple
  useEffect(() => {
    const { method, firstName, lastName, email } = registrationData.authMethod;
    
    // Si se usó Google o Apple y tenemos datos de nombre
    if ((method === 'google' || method === 'apple') && firstName && email) {
      // Separar el lastName en apellidos paterno y materno
      const lastNameParts = (lastName || '').trim().split(' ');
      const paternalLastName = lastNameParts[0] || '';
      const maternalLastName = lastNameParts.slice(1).join(' ') || '';
      
      // Pre-cargar los datos personales
      setRegistrationData(prev => ({
        ...prev,
        personalInfo: {
          ...prev.personalInfo,
          firstName: firstName,
          paternalLastName: paternalLastName,
          maternalLastName: maternalLastName,
          email: email,
          // Mantener teléfono y contraseñas si ya existen
          phone: prev.personalInfo.phone,
          password: prev.personalInfo.password,
          confirmPassword: prev.personalInfo.confirmPassword
        }
      }));
    }
  }, [registrationData.authMethod.method, registrationData.authMethod.firstName, registrationData.authMethod.lastName, registrationData.authMethod.email]);

  // Efecto para detectar usuario autenticado con Google tras redirect y pre-cargar datos
  useEffect(() => {
    // Verificar si hay un usuario de Google y el formulario está vacío
    if (
      user &&
      user.providerData?.[0]?.providerId === 'google.com' &&
      !registrationData.authMethod.email
    ) {
      console.error('[MultiStepRegisterForm] Usuario de Google detectado tras redirect/recarga, pre-cargando datos...');
      
      const displayName = user.displayName || '';
      const email = user.email || '';
      
      const nameParts = displayName.trim().split(' ');
      let firstName = nameParts[0] || '';
      let paternalLastName = nameParts.length > 1 ? nameParts[1] : '';
      let maternalLastName = nameParts.length > 2 ? nameParts.slice(2).join(' ') : '';

      // Actualizar el estado del formulario con los datos de Google
      setRegistrationData(prev => ({
        ...prev,
        authMethod: {
          ...prev.authMethod,
          method: 'google',
          email: email,
          fullName: displayName
        },
        personalInfo: {
          ...prev.personalInfo,
          firstName: firstName,
          paternalLastName: paternalLastName,
          maternalLastName: maternalLastName
        }
      }));

      // Avanzar automáticamente al siguiente paso
      console.error('[MultiStepRegisterForm] Avanzando al paso 2 automáticamente...');
      setCurrentStep(2);
    }
  }, [user, registrationData.authMethod.email]);

  // Actualizar datos del paso actual
  const updateStepData = useCallback((stepData: any) => {
    setRegistrationData(prev => {
      switch (currentStep) {
        case 1: {
          // Sincronizar password y confirmPassword a personalInfo si el método es email
          const nextAuthMethod = { ...prev.authMethod, ...stepData };
          let nextPersonalInfo = { ...prev.personalInfo };
          if (nextAuthMethod.method === 'email') {
            nextPersonalInfo = {
              ...nextPersonalInfo,
              password: nextAuthMethod.password || '',
              confirmPassword: nextAuthMethod.confirmPassword || ''
            };
          }
          return { ...prev, authMethod: nextAuthMethod, personalInfo: nextPersonalInfo };
        }
        case 2:
          return { ...prev, personalInfo: { ...prev.personalInfo, ...stepData } };
        case 3:
          return { ...prev, residential: { ...prev.residential, ...stepData } };
        case 4:
          return { ...prev, documents: { ...prev.documents, ...stepData } };
        case 5:
          return { ...prev, ...stepData };
        default:
          return prev;
      }
    });
  }, [currentStep]);

  // Validar paso actual
  const validateCurrentStep = async (): Promise<boolean> => {
    try {
      switch (currentStep) {
        case 1:
          return validateAuthMethod();
        case 2:
          return validatePersonalInfo();
        case 3:
          return await validateResidential();
        case 4:
          return validateDocuments();
        case 5:
          return validateConfirmation();
        default:
          return false;
      }
    } catch (error) {
      console.error('Error al validar paso:', error);
      return false;
    }
  };

  const validateAuthMethod = (): boolean => {
    const { method, email, password, confirmPassword } = registrationData.authMethod;
    
    if (!email || !email.includes('@')) {
      toast({
        title: "Error de validación",
        description: "Por favor ingresa un email válido",
        variant: "destructive"
      });
      return false;
    }

    if (method === 'email') {
      if (!password || password.length < 6) {
        toast({
          title: "Error de validación",
          description: "La contraseña debe tener al menos 6 caracteres",
          variant: "destructive"
        });
        return false;
      }

      if (password !== confirmPassword) {
        toast({
          title: "Error de validación",
          description: "Las contraseñas no coinciden",
          variant: "destructive"
        });
        return false;
      }

      // Validar fortaleza de contraseña
      const hasUpperCase = /[A-Z]/.test(password);
      const hasNumber = /\d/.test(password);
      
      if (!hasUpperCase || !hasNumber) {
        toast({
          title: "Error de validación",
          description: "La contraseña debe contener al menos una mayúscula y un número",
          variant: "destructive"
        });
        return false;
      }
    }

    return true;
  };

  const validatePersonalInfo = (): boolean => {
    const { firstName, paternalLastName, maternalLastName, phone, email } = registrationData.personalInfo;
    
    if (!firstName.trim() || !paternalLastName.trim()) {
      toast({
        title: "Error de validación",
        description: "Por favor completa tu nombre y apellido paterno",
        variant: "destructive"
      });
      return false;
    }

    // Validar apellido materno solo si se proporcionó
    if (maternalLastName && maternalLastName.trim().length < 2) {
      toast({
        title: "Error de validación",
        description: "Si proporcionas apellido materno, debe tener al menos 2 caracteres",
        variant: "destructive"
      });
      return false;
    }

    // Validar teléfono solo si se proporcionó
    if (phone && (phone.length < 10 || !/^\d+$/.test(phone.replace(/\s/g, '')))) {
      toast({
        title: "Error de validación",
        description: "Si proporcionas teléfono, debe ser un número válido de al menos 10 dígitos",
        variant: "destructive"
      });
      return false;
    }

    if (!email || !email.includes('@')) {
      toast({
        title: "Error de validación",
        description: "Por favor ingresa un email válido",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const validateResidential = async (): Promise<boolean> => {
    const { residentialId, street, houseNumber } = registrationData.residential;
    
    if (!residentialId.trim() || residentialId.length !== 6) {
      toast({
        title: "Error de validación",
        description: "El ID del residencial debe tener 6 caracteres",
        variant: "destructive"
      });
      return false;
    }

    if (!street.trim() || !houseNumber.trim()) {
      toast({
        title: "Error de validación",
        description: "Por favor completa la dirección completa",
        variant: "destructive"
      });
      return false;
    }

    // La validación completa del residencial se hace en el AuthContext
    // Aquí solo validamos que los campos no estén vacíos

    return true;
  };

  const validateDocuments = (): boolean => {
    const { identificationUploaded, proofUploaded } = registrationData.documents;
    
    if (!identificationUploaded || !proofUploaded) {
      toast({
        title: "Error de validación",
        description: "Por favor sube ambos documentos requeridos",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  const validateConfirmation = (): boolean => {
    const { termsAccepted, privacyAccepted } = registrationData;
    
    if (!termsAccepted || !privacyAccepted) {
      toast({
        title: "Error de validación",
        description: "Debes aceptar los términos y condiciones y la política de privacidad",
        variant: "destructive"
      });
      return false;
    }

    return true;
  };

  // Navegar al siguiente paso
  const nextStep = () => {
    if (currentStep < 5) {
      setCurrentStep(currentStep + 1);
    }
  };

  // Navegar al paso anterior
  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Completar registro
  const handleRegistrationComplete = async () => {
    try {
      setIsLoading(true);
      setRegistrationCompleted(true); // Marcar como completado para evitar reinicializaciones
      
      console.log('[MultiStepRegisterForm] 🎯 Iniciando proceso de registro completado');

      // Limpiar datos guardados del localStorage ANTES de llamar el callback
      clearStoredData();

      // Llamar callback si existe
      if (onRegistrationComplete) {
        console.log('[MultiStepRegisterForm] 📞 Llamando callback de registro completado');
        onRegistrationComplete(registrationData);
      }

    } catch (error: any) {
      console.error('[MultiStepRegisterForm] ❌ Error en registro:', error);
      setRegistrationCompleted(false); // Resetear si hay error
      toast({
        title: "Error en el registro",
        description: error.message || "Ocurrió un error inesperado. Intenta nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Renderizar paso actual
  const renderCurrentStep = () => {
    const stepProps = {
      data: registrationData,
      onDataChange: updateStepData,
      onValidationChange: setCanProceed,
      isLoading
    };

    switch (currentStep) {
      case 1:
        return <AuthMethodStep {...stepProps} onNext={nextStep} />;
      case 2:
        return <PersonalInfoStep {...stepProps} />;
      case 3:
        return <ResidentialStep {...stepProps} />;
      case 4:
        return <DocumentsStep {...stepProps} />;
      case 5:
        return <ConfirmationStep {...stepProps} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Banner de datos restaurados */}
        {dataRestored && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CheckCircle className="w-5 h-5 text-green-600" />
                <div>
                  <p className="text-green-800 font-medium">Datos restaurados</p>
                  <p className="text-green-700 text-sm">
                    Se han recuperado los datos de tu registro anterior. Puedes continuar desde donde lo dejaste.
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  clearStoredData();
                  window.location.reload();
                }}
                className="text-green-700 border-green-300 hover:bg-green-100"
              >
                Empezar de nuevo
              </Button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">
            Registro en Zentry
          </h1>
          <p className="text-gray-600 text-lg">
            Completa tu registro para acceder a todos los servicios
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <span className="text-sm font-medium text-gray-700">
              Paso {currentStep} de {STEPS.length}
            </span>
            <span className="text-sm font-medium text-gray-700">
              {Math.round(progress)}% completado
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Steps Indicator */}
        <div className="hidden md:flex justify-between items-center mb-8">
          {STEPS.map((step) => (
            <div
              key={step.id}
              className={`flex flex-col items-center ${
                step.id <= currentStep ? 'text-blue-600' : 'text-gray-400'
              }`}
            >
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${
                  step.id < currentStep
                    ? 'bg-green-500 text-white'
                    : step.id === currentStep
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-500'
                }`}
              >
                {step.id < currentStep ? (
                  <CheckCircle className="w-6 h-6" />
                ) : (
                  step.id
                )}
              </div>
              <span className="text-xs font-medium text-center max-w-20">
                {step.title}
              </span>
            </div>
          ))}
        </div>

        {/* Main Content */}
        <Card className="shadow-xl">
          <CardHeader className="text-center">
            <CardTitle className="text-xl md:text-2xl">
              {STEPS[currentStep - 1].title}
            </CardTitle>
            <p className="text-gray-600">
              {STEPS[currentStep - 1].description}
            </p>
          </CardHeader>
          <CardContent>
            {renderCurrentStep()}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between items-center mt-8">
          <Button
            variant="outline"
            onClick={currentStep === 1 ? onCancel : prevStep}
            disabled={isLoading}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            {currentStep === 1 ? 'Cancelar' : 'Anterior'}
          </Button>

          <Button
            onClick={currentStep === STEPS.length ? handleRegistrationComplete : nextStep}
            disabled={!canProceed || isLoading}
            className="flex items-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Procesando...
              </>
            ) : currentStep === STEPS.length ? (
              <>
                Completar Registro
                <CheckCircle className="w-4 h-4" />
              </>
            ) : (
              <>
                Siguiente
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 