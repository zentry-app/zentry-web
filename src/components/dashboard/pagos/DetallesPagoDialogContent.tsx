import React from 'react';
import {
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Pago } from "@/types/pagos"; // Actualizar import
import { CreditCard, MapPin, Calendar, DollarSign, User, Building, FileText, Hash, Shield, Home, Globe } from "lucide-react";

interface DetallesPagoDialogContentProps {
  selectedPago: Pago | null;
  getStatusLabel: (status: string) => string;
  getStatusColor: (status: string) => string;
  formatDate: (timestamp: any) => string;
  formatAmount: (amount: number, currency?: string, paymentMethod?: string) => string;
}

const DetallesPagoDialogContent: React.FC<DetallesPagoDialogContentProps> = ({
  selectedPago,
  getStatusLabel,
  getStatusColor,
  formatDate,
  formatAmount,
}) => {
  if (!selectedPago) return null;

  // Debug log para verificar datos
  if (process.env.NODE_ENV === 'development') {
    console.log('📋 Datos del pago seleccionado:', selectedPago);
  }

  return (
    <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5 text-green-500" />
          Detalles del Pago - {selectedPago.paymentIntentId || "Sin ID"}
        </DialogTitle>
        <DialogDescription>
          Información completa de la transacción y domicilio del pagador
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-6">
        {/* Estado y Monto Principal */}
        <div className="bg-gradient-to-r from-green-50 to-blue-50 p-4 rounded-lg border">
          <div className="flex items-center justify-between">
            <Badge className={getStatusColor(selectedPago.status)} variant="secondary">
              {getStatusLabel(selectedPago.status)}
            </Badge>
            <div className="text-right">
              <div className="text-3xl font-bold text-green-600">
                {formatAmount(selectedPago.amount, selectedPago.currency, selectedPago.paymentMethod)}
              </div>
              <div className="text-sm text-gray-500">
                Moneda: {selectedPago.currency || "MXN"}
              </div>
            </div>
          </div>
        </div>

        <Separator />

        {/* DOMICILIO - Sección destacada */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-xl font-bold flex items-center gap-2 text-blue-800 mb-4">
            <Home className="h-6 w-6" />
            🏠 DOMICILIO DEL PAGADOR
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white p-3 rounded-md border">
              <label className="text-sm font-bold text-blue-700">📍 Dirección Completa</label>
              <p className="mt-1 text-lg font-semibold text-gray-800">
                {selectedPago.userAddress?.calle || "Sin calle"} #{selectedPago.userAddress?.houseNumber || "S/N"}
              </p>
            </div>
            <div className="bg-white p-3 rounded-md border">
              <label className="text-sm font-bold text-blue-700 flex items-center gap-1">
                <Globe className="h-4 w-4" />
                País
              </label>
              <p className="mt-1 text-lg font-semibold text-gray-800">
                {selectedPago.userAddress?.pais || "Sin país"}
              </p>
            </div>
            <div className="bg-white p-3 rounded-md border">
              <label className="text-sm font-bold text-blue-700 flex items-center gap-1">
                <Building className="h-4 w-4" />
                Residencial
              </label>
              <p className="mt-1 text-lg font-semibold text-gray-800">
                {selectedPago.userAddress?.residencialID || "Sin residencial"}
              </p>
            </div>
            <div className="bg-white p-3 rounded-md border">
              <label className="text-sm font-bold text-blue-700">🏢 Residencial Registrado</label>
              <p className="mt-1 text-lg font-semibold text-gray-800">
                {selectedPago._residencialNombre || selectedPago.residentialId || "Desconocido"}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Información del Usuario */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <User className="h-5 w-5" />
            Información del Usuario
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-3 rounded-md">
              <label className="text-sm font-medium text-gray-500">👤 Nombre Completo</label>
              <p className="mt-1 font-semibold text-gray-800">{selectedPago.userName || "Sin nombre"}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <label className="text-sm font-medium text-gray-500">📧 Email</label>
              <p className="mt-1 text-gray-800">{selectedPago.userEmail || "Sin email"}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <label className="text-sm font-medium text-gray-500">🆔 ID Usuario</label>
              <p className="mt-1 text-xs font-mono bg-white p-2 rounded border">
                {selectedPago.userId || "Sin ID"}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Información del Pago */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Método de Pago
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-gray-50 p-3 rounded-md">
              <label className="text-sm font-medium text-gray-500">💳 Método</label>
              <p className="mt-1 font-semibold">{selectedPago.paymentMethod || "Sin método"}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <label className="text-sm font-medium text-gray-500">🏦 Marca</label>
              <p className="mt-1 font-semibold">{selectedPago.paymentMethodDetails?.brand || "Sin marca"}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <label className="text-sm font-medium text-gray-500">🔢 Últimos 4 dígitos</label>
              <p className="mt-1 font-mono text-lg">•••• {selectedPago.paymentMethodDetails?.last4 || "0000"}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <label className="text-sm font-medium text-gray-500">💰 Tipo de Tarjeta</label>
              <p className="mt-1 capitalize font-semibold">{selectedPago.paymentMethodDetails?.funding || "Sin tipo"}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <label className="text-sm font-medium text-gray-500">📅 Vencimiento</label>
              <p className="mt-1 font-mono text-lg">
                {selectedPago.paymentMethodDetails?.exp_month 
                  ? String(selectedPago.paymentMethodDetails.exp_month).padStart(2, '0') + "/" + selectedPago.paymentMethodDetails.exp_year
                  : "Sin fecha"}
              </p>
            </div>
          </div>
        </div>

        <Separator />

        {/* Información de la Transacción */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Detalles de la Transacción
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-md">
              <label className="text-sm font-medium text-gray-500">📝 Descripción</label>
              <p className="mt-1 font-semibold">{selectedPago.description || "Sin descripción"}</p>
            </div>
            <div className="bg-gray-50 p-3 rounded-md">
              <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Fecha y Hora del Pago
              </label>
              <p className="mt-1 font-semibold">{formatDate(selectedPago.timestamp)}</p>
            </div>
          </div>
          
          <div className="bg-gray-50 p-3 rounded-md">
            <label className="text-sm font-medium text-gray-500 flex items-center gap-1">
              <Hash className="h-4 w-4" />
              ID de Transacción (Stripe)
            </label>
            <p className="mt-1 text-sm font-mono bg-white p-3 rounded border break-all">
              {selectedPago.paymentIntentId || "Sin ID de transacción"}
            </p>
          </div>
        </div>

        {/* Estado de Seguridad */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-2 text-green-800">
            <Shield className="h-5 w-5" />
            <span className="font-medium">🔒 Transacción Segura</span>
          </div>
          <p className="text-sm text-green-700 mt-1">
            Este pago fue procesado de forma segura a través de Stripe. Todos los datos están encriptados y protegidos.
          </p>
        </div>

        {/* Resumen de Validación */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h4 className="font-medium text-blue-800 mb-2">📊 Resumen de Datos</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
            <div className={`p-2 rounded ${selectedPago.userName ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              Usuario: {selectedPago.userName ? '✅' : '❌'}
            </div>
            <div className={`p-2 rounded ${selectedPago.userAddress?.calle ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              Domicilio: {selectedPago.userAddress?.calle ? '✅' : '❌'}
            </div>
            <div className={`p-2 rounded ${selectedPago.paymentMethod ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
              Pago: {selectedPago.paymentMethod ? '✅' : '❌'}
            </div>
            <div className={`p-2 rounded ${selectedPago.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
              Estado: {selectedPago.status === 'completed' ? '✅' : '⏳'}
            </div>
          </div>
        </div>
      </div>
    </DialogContent>
  );
};

export default DetallesPagoDialogContent; 