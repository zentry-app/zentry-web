"use client";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { 
  AlertCircle, 
  CheckCircle, 
  Info, 
  XCircle,
  Clock,
  RefreshCw
} from "lucide-react";

interface ValidationMessageProps {
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  description?: string;
  children?: React.ReactNode;
}

export function ValidationMessage({ 
  type, 
  title, 
  description, 
  children 
}: ValidationMessageProps) {
  const getIcon = () => {
    switch (type) {
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-orange-600" />;
      case 'info':
        return <Info className="h-4 w-4 text-blue-600" />;
      case 'success':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
    }
  };

  const getAlertClass = () => {
    switch (type) {
      case 'error':
        return "border-red-200 bg-red-50";
      case 'warning':
        return "border-orange-200 bg-orange-50";
      case 'info':
        return "border-blue-200 bg-blue-50";
      case 'success':
        return "border-green-200 bg-green-50";
    }
  };

  const getTextClass = () => {
    switch (type) {
      case 'error':
        return "text-red-800";
      case 'warning':
        return "text-orange-800";
      case 'info':
        return "text-blue-800";
      case 'success':
        return "text-green-800";
    }
  };

  return (
    <Alert className={getAlertClass()}>
      {getIcon()}
      <AlertDescription className={getTextClass()}>
        <div className="font-medium">{title}</div>
        {description && <div className="text-sm mt-1">{description}</div>}
        {children}
      </AlertDescription>
    </Alert>
  );
}

interface StatusBadgeProps {
  status: 'active' | 'disabled' | 'pending' | 'error' | 'done';
  size?: 'sm' | 'md' | 'lg';
}

export function StatusBadge({ status, size = 'md' }: StatusBadgeProps) {
  const getConfig = () => {
    switch (status) {
      case 'active':
        return {
          label: 'Activo',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle
        };
      case 'disabled':
        return {
          label: 'Desactivado',
          variant: 'secondary' as const,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: XCircle
        };
      case 'pending':
        return {
          label: 'Pendiente',
          variant: 'outline' as const,
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: Clock
        };
      case 'error':
        return {
          label: 'Error',
          variant: 'destructive' as const,
          className: 'bg-red-100 text-red-800 border-red-200',
          icon: XCircle
        };
      case 'done':
        return {
          label: 'Aplicado',
          variant: 'default' as const,
          className: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle
        };
    }
  };

  const config = getConfig();
  const Icon = config.icon;

  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'text-xs px-2 py-1';
      case 'md':
        return 'text-sm px-3 py-1';
      case 'lg':
        return 'text-base px-4 py-2';
    }
  };

  return (
    <Badge 
      variant={config.variant}
      className={`${config.className} ${getSizeClass()} flex items-center gap-1`}
    >
      <Icon className="h-3 w-3" />
      {config.label}
    </Badge>
  );
}

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
}

export function LoadingSpinner({ size = 'md', text }: LoadingSpinnerProps) {
  const getSizeClass = () => {
    switch (size) {
      case 'sm':
        return 'h-4 w-4';
      case 'md':
        return 'h-6 w-6';
      case 'lg':
        return 'h-8 w-8';
    }
  };

  return (
    <div className="flex items-center gap-2">
      <RefreshCw className={`${getSizeClass()} animate-spin text-blue-600`} />
      {text && <span className="text-sm text-muted-foreground">{text}</span>}
    </div>
  );
}

interface FieldValidationProps {
  isValid: boolean;
  errorMessage?: string;
  successMessage?: string;
  children: React.ReactNode;
}

export function FieldValidation({ 
  isValid, 
  errorMessage, 
  successMessage, 
  children 
}: FieldValidationProps) {
  return (
    <div className="space-y-1">
      {children}
      {!isValid && errorMessage && (
        <div className="text-xs text-red-600 flex items-center gap-1">
          <XCircle className="h-3 w-3" />
          {errorMessage}
        </div>
      )}
      {isValid && successMessage && (
        <div className="text-xs text-green-600 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          {successMessage}
        </div>
      )}
    </div>
  );
}

interface ConfirmationDialogProps {
  title: string;
  description: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  variant?: 'default' | 'destructive';
}

export function ConfirmationDialog({
  title,
  description,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  variant = 'default'
}: ConfirmationDialogProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">{title}</h3>
            <p className="text-sm text-muted-foreground mt-1">{description}</p>
          </div>
          
          <div className="flex justify-end gap-2">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium text-white rounded-md ${
                variant === 'destructive' 
                  ? 'bg-red-600 hover:bg-red-700' 
                  : 'bg-blue-600 hover:bg-blue-700'
              }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

interface ToastMessageProps {
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  description?: string;
}

export function ToastMessage({ type, title, description }: ToastMessageProps) {
  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'error':
        return <XCircle className="h-5 w-5 text-red-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-orange-600" />;
      case 'info':
        return <Info className="h-5 w-5 text-blue-600" />;
    }
  };

  return (
    <div className="flex items-start gap-3 p-4 bg-white border rounded-lg shadow-lg">
      {getIcon()}
      <div>
        <div className="font-medium text-gray-900">{title}</div>
        {description && (
          <div className="text-sm text-gray-600 mt-1">{description}</div>
        )}
      </div>
    </div>
  );
}
