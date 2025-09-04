import { DashboardLayoutClient } from '@/components/dashboard/dashboard-layout-client';

/**
 * Layout principal del dashboard (Componente de Servidor).
 * Mantiene la estructura estática y delega la interactividad
 * al DashboardLayoutClient.
 */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex flex-col">
      <DashboardLayoutClient>{children}</DashboardLayoutClient>
    </div>
  );
} 