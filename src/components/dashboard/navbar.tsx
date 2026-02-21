"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Bell, ChevronDown, Menu, X, Search, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Input } from "../ui/input";
import { UserNav } from "./user-nav";
import { ModeToggle } from "../mode-toggle";
import { SearchBar } from "./global-search/search-bar";
import { NotificationsDropdownContent } from "./notifications-dropdown";
import { useNotifications } from "@/contexts/NotificationsContext";

const navigation = [
  { name: "Inicio", href: "/dashboard" },
  { name: "Mi Pensión", href: "/dashboard/pension" },
  { name: "Documentos", href: "/dashboard/documentos" },
  { name: "Asesorías", href: "/dashboard/asesorias" },
];

/**
 * Componente de barra de navegación premium del dashboard
 */
export function Navbar({ onMenuClick }: { onMenuClick: () => void }) {
  const { user, logout } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();

  // Obtener notificaciones del contexto
  const {
    messageNotifications,
    panicAlertsCount,
    pendingReservationsCount,
    pendingUsersCount,
    pendingPaymentsCount,
    totalCount
  } = useNotifications();

  // Efecto de scroll para la navbar
  useMotionValueEvent(scrollY, "change", (latest) => {
    setIsScrolled(latest > 10);
  });

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
    }
  };

  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "US";

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled
          ? "bg-background/70 backdrop-blur-xl border-b border-border/40 shadow-xl dark:bg-primary/95 dark:border-white/10 dark:shadow-primary/10 zentry:bg-primary/95 zentry:backdrop-blur-xl zentry:border-white/10 zentry:shadow-2xl"
          : "bg-background dark:bg-primary zentry:bg-primary"
      )}
    >
      <div className="container h-16">
        <div className="flex h-full items-center justify-between gap-4">
          {/* Sección izquierda */}
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={onMenuClick}
              className="lg:hidden hover:bg-accent/50 rounded-xl dark:hover:bg-white/10 dark:text-white zentry:text-white zentry:hover:bg-white/20"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{
                type: "spring",
                stiffness: 200,
                damping: 15
              }}
              className="flex items-center lg:ml-4"
            >
              <Link href="/dashboard" className="flex items-center gap-2 group transition-transform hover:scale-105 active:scale-95">
                <Image
                  src="/assets/logo/ZentryLogo.png"
                  alt="Zentry Logo"
                  width={120}
                  height={40}
                  className="h-9 w-auto dark:brightness-0 dark:invert zentry:brightness-0 zentry:invert"
                />
              </Link>
            </motion.div>
          </div>

          {/* Barra de búsqueda central */}
          <div className="hidden md:flex relative max-w-md flex-1">
            <SearchBar />
          </div>

          {/* Elementos de la derecha */}
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="relative hover:bg-accent/50 rounded-xl transition-all duration-200 dark:hover:bg-white/10 dark:text-white zentry:text-white zentry:hover:bg-white/20"
                >
                  <Bell className="h-5 w-5 text-muted-foreground/80 dark:text-white zentry:text-white" />
                  {totalCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 min-w-5 px-1 flex items-center justify-center text-[10px] font-bold rounded-full bg-red-500 text-white ring-2 ring-background">
                      {totalCount > 99 ? '99+' : totalCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-96 p-0 rounded-2xl shadow-xl border-border/40 overflow-hidden">
                <NotificationsDropdownContent
                  messageNotifications={messageNotifications}
                  systemNotificationsCount={totalCount}
                  panicAlertsCount={panicAlertsCount}
                  pendingReservationsCount={pendingReservationsCount}
                  pendingUsersCount={pendingUsersCount}
                  pendingPaymentsCount={pendingPaymentsCount}
                />
              </DropdownMenuContent>
            </DropdownMenu>

            <ModeToggle />

            <div className="h-6 w-px bg-border/60 mx-1 hidden sm:block dark:bg-white/20 zentry:bg-white/30" />
            <UserNav />
          </div>
        </div>
      </div>
    </motion.header>
  );
} 