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
import { Bell, ChevronDown, Menu, X, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { motion, useScroll, useMotionValueEvent } from "framer-motion";
import { Input } from "../ui/input";
import { UserNav } from "./user-nav";
import { ModeToggle } from "../mode-toggle";
import { db } from '@/lib/firebase/config';
import { collection, getDocs, query, where, orderBy, doc, getDoc, limit as fbLimit } from 'firebase/firestore';
import { getUsuariosPendientes, getAlertasPanicoActivas } from '@/lib/firebase/firestore';

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
  const { user, logout, userClaims } = useAuth();
  const [isScrolled, setIsScrolled] = useState(false);
  const { scrollY } = useScroll();
  const [searchFocused, setSearchFocused] = useState(false);
  const [notifCount, setNotifCount] = useState<number | null>(null);

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

  // Resolver docId del residencial a partir de código o docId
  const resolveResidencialDocId = async (residencialId: string): Promise<string | null> => {
    try {
      const snapById = await getDoc(doc(db, 'residenciales', residencialId));
      if (snapById.exists()) return residencialId;
    } catch {}
    try {
      const resRef = collection(db, 'residenciales');
      const qByCode = query(resRef, where('residencialID', '==', residencialId), fbLimit(1));
      const snap = await getDocs(qByCode);
      if (!snap.empty) return snap.docs[0].id;
    } catch {}
    return null;
  };

  // Cargar conteos críticos para admin de residencial
  useEffect(() => {
    let timer: NodeJS.Timeout | null = null;

    const loadCounts = async () => {
      try {
        if (!userClaims) { setNotifCount(null); return; }
        const esGlobal = userClaims.isGlobalAdmin === true;
        const esAdminResid = userClaims.role === 'admin' && !esGlobal;
        if (!esAdminResid) { setNotifCount(null); return; }
        const codigoResidencial = userClaims.managedResidencials?.[0] || userClaims.residencialId;
        if (!codigoResidencial) { setNotifCount(null); return; }
        const docId = await resolveResidencialDocId(codigoResidencial);
        // Conteo de alertas de pánico activas
        let panicCount = 0;
        if (docId) {
          try {
            const alertas = await getAlertasPanicoActivas(docId);
            panicCount = Array.isArray(alertas) ? alertas.length : 0;
          } catch { panicCount = 0; }
        }
        // Conteo de reservas pendientes
        let reservasCount = 0;
        if (docId) {
          try {
            const reservationsRef = collection(db, 'residenciales', docId, 'reservaciones');
            const qRes = query(reservationsRef, where('status', '==', 'pendiente'), orderBy('fecha', 'desc'));
            const snapRes = await getDocs(qRes);
            reservasCount = snapRes.size;
          } catch { reservasCount = 0; }
        }
        // Conteo de usuarios pendientes (filtrar por código residencial)
        let usersCount = 0;
        try {
          const pend = await getUsuariosPendientes({ limit: 200 });
          usersCount = pend.filter((u: any) => u.residencialID === codigoResidencial).length;
        } catch { usersCount = 0; }
        setNotifCount(panicCount + reservasCount + usersCount);
      } catch {
        setNotifCount(null);
      }
    };

    loadCounts();
    timer = setInterval(loadCounts, 60000);
    return () => { if (timer) clearInterval(timer); };
  }, [userClaims]);

  return (
    <motion.header 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-300",
        isScrolled 
          ? "bg-background/80 backdrop-blur-md border-b shadow-sm" 
          : "bg-background"
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
              className="lg:hidden hover:bg-accent/50"
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
              <Link href="/dashboard" className="flex items-center gap-2 group">
                <Image
                  src="/images/logos/Logo version azul.png"
                  alt="Zentry Logo"
                  width={32}
                  height={32}
                  className="h-8 w-auto"
                />
                <h1 className="text-xl font-bold hidden sm:block text-foreground group-hover:text-primary transition-colors">
                  Zentry
                </h1>
              </Link>
            </motion.div>
          </div>

          {/* Barra de búsqueda central */}
          <motion.div 
            className={cn(
              "hidden md:flex relative max-w-md flex-1 transition-all duration-300",
              searchFocused ? "scale-105" : "scale-100"
            )}
            layout
          >
            <div className="relative w-full">
              <Search className={cn(
                "absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 transition-colors duration-200",
                searchFocused ? "text-primary" : "text-muted-foreground"
              )} />
              <Input 
                placeholder="Buscar trámites, documentos, asesorías..." 
                className={cn(
                  "w-full pl-10 pr-4 transition-all duration-300",
                  searchFocused ? "ring-2 ring-primary/20 border-primary" : "",
                  "bg-accent/50 border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                )}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setSearchFocused(false)}
              />
            </div>
          </motion.div>

          {/* Elementos de la derecha */}
          <div className="flex items-center gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="relative hover:bg-accent/50"
                >
                  <Bell className="h-5 w-5" />
                  {notifCount !== null && notifCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-gradient-to-r from-blue-600 to-cyan-400 text-[10px] font-medium text-white flex items-center justify-center">
                      {notifCount}
                    </span>
                  )}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-72 p-2">
                {(notifCount ?? 0) === 0 ? (
                  <div className="text-sm text-muted-foreground px-2 py-1.5">
                    No hay notificaciones por ahora
                  </div>
                ) : (
                  <div className="text-sm px-2 py-1.5">
                    Tienes {notifCount} notificaciones
                  </div>
                )}
              </DropdownMenuContent>
            </DropdownMenu>

            <ModeToggle />

            <div className="h-6 w-px bg-border mx-1 hidden sm:block" />
            <UserNav />
          </div>
        </div>
      </div>
    </motion.header>
  );
} 