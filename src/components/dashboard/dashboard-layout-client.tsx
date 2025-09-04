"use client";

import { useState, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { Navbar } from '@/components/dashboard/navbar';
import { Toaster } from '@/components/ui/sonner';

// Componente de barra lateral memoizado para evitar rerenderizaciones
const MemoizedSidebar = memo(({ isCollapsed, onToggle }: { 
  isCollapsed: boolean,
  onToggle: () => void
}) => {
  return (
    <aside
      className={cn(
        "hidden lg:block border-r fixed top-16 bottom-0 left-0 transition-all duration-300",
        "bg-background z-30",
        isCollapsed ? "w-[78px]" : "w-[240px]"
      )}
    >
      <DashboardNav
        isCollapsed={isCollapsed}
        onCollapse={onToggle}
      />
    </aside>
  );
});
MemoizedSidebar.displayName = "MemoizedSidebar";

// Componente de barra lateral móvil memoizado
const MobileMenu = memo(({ isOpen, onClose }: {
  isOpen: boolean,
  onClose: () => void
}) => {
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div 
        className="absolute inset-0 bg-black/20 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside
        className={cn(
          "fixed top-16 left-0 bottom-0 w-60 border-r",
          "bg-background"
        )}
      >
        <DashboardNav
          isCollapsed={false}
          onCollapse={() => {}}
        />
      </aside>
    </div>
  );
});
MobileMenu.displayName = "MobileMenu";

/**
 * Componente Cliente que maneja el estado y la interactividad del Layout del Dashboard.
 * El layout principal (servidor) delega la parte interactiva a este componente.
 */
export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    // Puedes mostrar un esqueleto de layout aquí si lo deseas, 
    // pero el `loading.tsx` general se encargará de la carga inicial.
    return null; 
  }

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="bg-background border-b">
          <Navbar onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        </div>
      </div>

      <div className="pt-16 flex h-screen">
        <MemoizedSidebar 
          isCollapsed={isCollapsed} 
          onToggle={() => setIsCollapsed(!isCollapsed)} 
        />
        <MobileMenu 
          isOpen={isMobileMenuOpen} 
          onClose={() => setIsMobileMenuOpen(false)} 
        />
        <main 
          className={cn(
            "flex-1 overflow-auto relative",
            "lg:ml-[240px] transition-all duration-300",
            isCollapsed && "lg:ml-[78px]"
          )}
          style={{ height: 'calc(100vh - 4rem)' }}
        >
          <div className="px-4 py-4 lg:px-8">
            <div className="relative">
              <div className="relative rounded-lg border bg-background shadow-sm">
                <div className="p-6">
                  {children}
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
      <Toaster />
    </>
  );
} 