"use client";

import { useState, useEffect, memo } from 'react';
import { cn } from '@/lib/utils';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { Navbar } from '@/components/dashboard/navbar';
import { Toaster } from '@/components/ui/sonner';
import { NotificationsProvider } from '@/contexts/NotificationsContext';
import { motion, AnimatePresence } from 'framer-motion';

// Configuración de la animación de resorte (spring) para un sentimiento premium "snappy"
const sidebarSpring = {
  type: "spring",
  stiffness: 400,
  damping: 40,
  restDelta: 0.001
} as const;

// Componente de barra lateral memoizado
const MemoizedSidebar = memo(({ isCollapsed, onToggle }: {
  isCollapsed: boolean,
  onToggle: () => void
}) => {
  return (
    <motion.aside
      initial={false}
      animate={{
        width: isCollapsed ? 80 : 256,
        opacity: 1,
        x: 0
      }}
      transition={sidebarSpring}
      className={cn(
        "hidden lg:block fixed top-20 bottom-6 left-6 z-30",
        "rounded-[2rem] overflow-hidden",
        "bg-white/40 backdrop-blur-2xl border border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.04)]",
        "dark:bg-[#020408]/90 dark:border-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.4)]",
        "ring-1 ring-white/20 ring-inset dark:ring-white/5",
        "zentry:bg-white/10 zentry:backdrop-blur-3xl zentry:border-white/20 zentry:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.15)] zentry:ring-white/10",
        "transition-all duration-300 hover:shadow-[0_8px_32px_rgba(0,0,0,0.08)] hover:border-white/60 dark:hover:border-white/20 zentry:hover:border-white/30"
      )}
    >
      <DashboardNav
        isCollapsed={isCollapsed}
        onCollapse={onToggle}
      />
    </motion.aside>
  );
});
MemoizedSidebar.displayName = "MemoizedSidebar";

// Componente de barra lateral móvil
const MobileMenu = memo(({ isOpen, onClose }: {
  isOpen: boolean,
  onClose: () => void
}) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.aside
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            className={cn(
              "fixed top-20 left-6 bottom-6 w-72 rounded-[2rem] overflow-hidden",
              "bg-white/85 backdrop-blur-2xl border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.1)]",
              "dark:bg-[#020408]/95 dark:border-white/10 dark:shadow-[0_8px_32px_rgba(0,0,0,0.5)]",
              "ring-1 ring-white/20 ring-inset dark:ring-white/5",
              "zentry:bg-white/10 zentry:backdrop-blur-3xl zentry:border-white/20 zentry:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1),0_8px_32px_rgba(0,0,0,0.3)] zentry:ring-white/10"
            )}
          >
            <DashboardNav
              isCollapsed={false}
              onCollapse={() => { }}
            />
          </motion.aside>
        </div>
      )}
    </AnimatePresence>
  );
});
MobileMenu.displayName = "MobileMenu";

/**
 * Componente Cliente que maneja el estado y la interactividad del Layout del Dashboard.
 */
export function DashboardLayoutClient({ children }: { children: React.ReactNode }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) return null;

  return (
    <NotificationsProvider>
      <div className="fixed top-0 left-0 right-0 z-50">
        <div className="bg-background/80 backdrop-blur-md border-b border-white/10">
          <Navbar onMenuClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} />
        </div>
      </div>

      <div className="pt-16 flex h-screen bg-slate-50 zentry:bg-blue-50/30">
        <MemoizedSidebar
          isCollapsed={isCollapsed}
          onToggle={() => setIsCollapsed(!isCollapsed)}
        />
        <MobileMenu
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />
        <motion.main
          layout
          initial={false}
          animate={{
            marginLeft: isCollapsed ? 120 : 296
          }}
          transition={sidebarSpring}
          className={cn(
            "flex-1 overflow-auto relative",
            "bg-premium px-8 pb-8 pt-10"
          )}
          style={{ height: '100vh' }}
        >
          <div className="h-full">
            <div className="relative h-full">
              <motion.div
                layout
                className="relative h-full rounded-[2rem] border border-white/30 bg-white/60 backdrop-blur-2xl shadow-[0_8px_32px_rgba(0,0,0,0.04)] overflow-hidden transition-all duration-300 dark:bg-[#05080f]/40 dark:border-white/5 dark:shadow-[0_8px_32px_rgba(0,0,0,0.3)] zentry:bg-white/10 zentry:border-white/15 zentry:shadow-[inset_0_1px_1px_rgba(255,255,255,0.05),0_8px_32px_rgba(0,0,0,0.1)]"
              >
                <div className="h-full w-full overflow-y-auto">
                  {children}
                </div>
              </motion.div>
            </div>
          </div>
        </motion.main>
      </div>
      <Toaster />
    </NotificationsProvider>
  );
} 