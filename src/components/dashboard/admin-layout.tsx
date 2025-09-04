"use client";

import React from 'react';
import { useAdminRequired } from '@/lib/hooks';
import { Progress } from '@/components/ui/progress';
import { DashboardHeader } from '@/components/dashboard/dashboard-header';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import GlobalAdminNav from './global-admin-nav';
import { Separator } from '@/components/ui/separator';

interface AdminLayoutProps {
  children: React.ReactNode;
  title?: string;
  requireGlobalAdmin?: boolean;
}

/**
 * Layout para secciones de administración
 * Verifica que el usuario tenga permisos de administrador
 * @param children Contenido a mostrar
 * @param title Título opcional para mostrar en la cabecera
 * @param requireGlobalAdmin Si es true, solo permite acceso a administradores globales
 */
export function AdminLayout({ 
  children, 
  title,
  requireGlobalAdmin = false 
}: AdminLayoutProps) {
  // Usar el hook de protección para administradores
  const { isAdmin, isGlobalAdmin, isUserLoading } = useAdminRequired(requireGlobalAdmin);

  // Si está cargando, mostrar indicador de carga
  if (isUserLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="w-full max-w-xs mx-auto">
          <p className="text-center mb-2">Verificando permisos...</p>
          <Progress value={75} className="w-full" />
        </div>
      </div>
    );
  }

  // Si no es admin, no debería llegar aquí (el hook ya habría redirigido)
  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="max-w-md p-6 bg-white rounded-lg shadow-lg">
          <h2 className="text-xl font-bold text-red-600 mb-4">Acceso denegado</h2>
          <p className="text-gray-600">No tienes los permisos necesarios para acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  // Si es administrador, mostrar el contenido
  return (
    <>
      <div className="flex min-h-screen flex-col">
        <DashboardHeader heading="Panel de Administración" />
        <div className="container flex-1 items-start md:grid md:grid-cols-[220px_minmax(0,1fr)] md:gap-6 lg:grid-cols-[240px_minmax(0,1fr)] lg:gap-10">
          <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
            <div className="py-6 pr-6 lg:py-8">
              {requireGlobalAdmin || isGlobalAdmin ? (
                <GlobalAdminNav />
              ) : (
                <DashboardNav />
              )}
            </div>
          </aside>
          <main className="flex w-full flex-col overflow-hidden">
            {title && (
              <>
                <div className="flex-1 space-y-4 p-8 pt-6">
                  <div className="flex items-center justify-between space-y-2">
                    <h2 className="text-3xl font-bold tracking-tight">{title}</h2>
                  </div>
                  <Separator />
                </div>
              </>
            )}
            <div className="flex-1 space-y-4 p-4 pt-1 md:p-8 md:pt-6">
              {children}
            </div>
          </main>
        </div>
      </div>
    </>
  );
}

export default AdminLayout;