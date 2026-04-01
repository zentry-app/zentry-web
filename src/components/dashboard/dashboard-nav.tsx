"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  Home,
  Settings,
  Bell,
  User,
  BarChart3,
  Users,
  Smartphone,
  MessageSquare,
  Download,
  Building,
  Key,
  Calendar,
  FileText,
  Shield,
  Tag,
  Map,
  Landmark,
  AlertTriangle,
  FileSpreadsheet,
  HomeIcon,
  Building2,
  LayoutDashboard,
  LogOut,
  ClipboardList,
  BookOpen,
  Ticket,
  ArrowRightLeft,
  PenTool,
  Activity,
  ReceiptText,
} from "lucide-react";
import React from "react";
import { useAuth, UserClaims } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AuthService } from "@/lib/services/auth-service";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";
import { useNotifications } from "@/contexts/NotificationsContext";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
  color?: string;
  requiresGlobalAdmin?: boolean;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const baseNavSections: NavSection[] = [
  {
    title: "Principal",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: <Home className="h-5 w-5" />,
        color: "text-blue-500",
      },
      {
        title: "Usuarios",
        href: "/dashboard/usuarios",
        icon: <Users className="h-5 w-5" />,
        color: "text-green-500",
      },
      {
        title: "Residenciales",
        href: "/dashboard/residenciales",
        icon: <Building className="h-5 w-5" />,
        color: "text-purple-500",
        requiresGlobalAdmin: true,
      },
    ],
  },
  {
    title: "Gestión",
    items: [
      {
        title: "Áreas Comunes",
        href: "/dashboard/areas-comunes",
        icon: <Map className="h-5 w-5" />,
        color: "text-indigo-500",
      },
      {
        title: "Reservas",
        href: "/dashboard/reservas",
        icon: <BookOpen className="h-5 w-5" />,
        color: "text-orange-500",
      },
      {
        title: "Guardias",
        href: "/dashboard/guardias",
        icon: <Shield className="h-5 w-5" />,
        color: "text-yellow-500",
      },
      {
        title: "Tags de Acceso",
        href: "/dashboard/tags",
        icon: <Tag className="h-5 w-5" />,
        color: "text-emerald-500",
      },
      {
        title: "Pagos",
        href: "/dashboard/pagos",
        icon: <Landmark className="h-5 w-5" />,
        color: "text-pink-500",
      },
      {
        title: "Propiedades",
        href: "/dashboard/propiedades",
        icon: <Building2 className="h-5 w-5" />,
        color: "text-orange-500",
      },
      {
        title: "Comunicados",
        href: "/dashboard/comunicados",
        icon: <FileText className="h-5 w-5" />,
        color: "text-violet-500",
      },
      {
        title: "Encuestas",
        href: "/dashboard/encuestas",
        icon: <BarChart3 className="h-5 w-5" />,
        color: "text-cyan-500",
      },
      {
        title: "Migrar Cuenta",
        href: "/dashboard/migrate-user",
        icon: <ArrowRightLeft className="h-5 w-5" />,
        color: "text-amber-500",
        requiresGlobalAdmin: true,
      },
      {
        title: "Blog & Contenido",
        href: "/dashboard/blog",
        icon: <PenTool className="h-5 w-5" />,
        color: "text-rose-500",
        requiresGlobalAdmin: true,
      },
    ],
  },
  {
    title: "Monitoreo",
    items: [
      {
        title: "Ingresos",
        href: "/dashboard/ingresos",
        icon: <ClipboardList className="h-5 w-5" />,
        color: "text-blue-500",
      },
      {
        title: "Alertas",
        href: "/dashboard/alertas-panico",
        icon: <AlertTriangle className="h-5 w-5" />,
        color: "text-orange-500",
      },
      {
        title: "Eventos",
        href: "/dashboard/eventos",
        icon: <Calendar className="h-5 w-5" />,
        color: "text-cyan-500",
      },
      {
        title: "Notificaciones",
        href: "/dashboard/notificaciones",
        icon: <Bell className="h-5 w-5" />,
        color: "text-red-500",
      },
      {
        title: "Mensajes",
        href: "/dashboard/mensajes",
        icon: <MessageSquare className="h-5 w-5" />,
        color: "text-teal-500",
      },
      {
        title: "Tickets de Soporte",
        href: "/dashboard/support/tickets",
        icon: <Ticket className="h-5 w-5" />,
        color: "text-purple-500",
        requiresGlobalAdmin: true,
      },
      {
        title: "Base de Conocimiento",
        href: "/dashboard/support/knowledge",
        icon: <BookOpen className="h-5 w-5" />,
        color: "text-indigo-500",
        requiresGlobalAdmin: true,
      },
      {
        title: "Reportes",
        href: "/dashboard/reportes",
        icon: <ClipboardList className="h-5 w-5" />,
        color: "text-rose-500",
      },
    ],
  },
  {
    title: "Análisis",
    items: [
      {
        title: "Estadísticas",
        href: "/dashboard/estadisticas",
        icon: <BarChart3 className="h-5 w-5" />,
        color: "text-blue-600",
      },
      {
        title: "Cotizaciones",
        href: "/dashboard/cotizaciones",
        icon: <FileSpreadsheet className="h-5 w-5" />,
        color: "text-indigo-600",
        requiresGlobalAdmin: true,
      },
      {
        title: "Notas de Venta",
        href: "/dashboard/ventas",
        icon: <ReceiptText className="h-5 w-5" />,
        color: "text-emerald-600",
        requiresGlobalAdmin: true,
      },
      {
        title: "Uso y Costos Firebase",
        href: "/dashboard/firebase-usage",
        icon: <Activity className="h-5 w-5" />,
        color: "text-orange-500",
        requiresGlobalAdmin: true,
      },
    ],
  },
];

const bottomNavItems: NavItem[] = [
  {
    title: "Actualizaciones",
    href: "/dashboard/actualizaciones",
    icon: <Download className="h-5 w-5" />,
    color: "text-pink-500",
    badge: "Nueva",
  },
  {
    title: "Configuración",
    href: "/dashboard/configuracion",
    icon: <Settings className="h-5 w-5" />,
    color: "text-gray-500",
  },
];

interface DashboardNavProps {
  isCollapsed?: boolean;
  onCollapse?: () => void;
}

/**
 * Componente de navegación lateral del dashboard
 * @param isCollapsed - Estado de colapso del sidebar
 * @param onCollapse - Función para manejar el colapso del sidebar
 */
export function DashboardNav({
  isCollapsed = false,
  onCollapse,
}: DashboardNavProps) {
  const pathname = usePathname();
  const { user, logout, userClaims } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  // Obtener conteos de notificaciones del contexto
  const {
    unreadMessagesCount,
    panicAlertsCount,
    pendingReservationsCount,
    pendingUsersCount,
    pendingPaymentsCount,
  } = useNotifications();

  // Función para obtener el badge dinámico según la ruta
  const getDynamicBadge = (href: string): string | undefined => {
    switch (href) {
      case "/dashboard/usuarios":
        return pendingUsersCount > 0 ? pendingUsersCount.toString() : undefined;
      case "/dashboard/mensajes":
        return unreadMessagesCount > 0
          ? unreadMessagesCount.toString()
          : undefined;
      case "/dashboard/reservas":
        return pendingReservationsCount > 0
          ? pendingReservationsCount.toString()
          : undefined;
      case "/dashboard/alertas-panico":
        return panicAlertsCount > 0 ? panicAlertsCount.toString() : undefined;
      case "/dashboard/pagos":
        return pendingPaymentsCount > 0
          ? pendingPaymentsCount.toString()
          : undefined;
      default:
        return undefined;
    }
  };

  const filteredNavSections = React.useMemo(() => {
    if (!userClaims) return [];

    return baseNavSections
      .map((section) => ({
        ...section,
        items: section.items.filter((item) => {
          if (item.requiresGlobalAdmin) {
            return userClaims.isGlobalAdmin === true;
          }
          return true;
        }),
      }))
      .filter((section) => section.items.length > 0);
  }, [userClaims]);

  const userInitials = user?.email
    ? user.email.substring(0, 2).toUpperCase()
    : "US";

  const handleLogout = async () => {
    try {
      await AuthService.logout();
      router.push("/login");
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al cerrar sesión: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  // Variantes para animaciones escalonadas (staggered)
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.1,
      },
    },
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className="h-full flex flex-col py-2">
        <ScrollArea className="flex-1 px-4 min-h-0">
          <div className="space-y-6 pb-4 mt-2">
            {filteredNavSections.map((section, i) => (
              <motion.div
                key={section.title}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className={cn(isCollapsed && "px-1 text-center")}
              >
                {!isCollapsed ? (
                  <div className="flex items-center justify-between mb-3 mt-4 first:mt-2 px-3">
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="text-[11px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500/80 zentry:text-white/60"
                    >
                      {section.title}
                    </motion.div>
                    {i === 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onCollapse && onCollapse()}
                        className={cn(
                          "h-7 w-7 rounded-lg transition-all duration-300",
                          "hover:bg-slate-200/50 hover:shadow-sm text-slate-400 hover:text-slate-800",
                          "dark:hover:bg-slate-800/80 dark:text-slate-500 dark:hover:text-slate-300",
                          "zentry:text-white/80 zentry:hover:bg-white/15 zentry:hover:text-white zentry:hover:shadow-[0_4px_12px_rgba(0,0,0,0.08)]",
                          "border border-transparent hover:border-slate-300/50 dark:hover:border-slate-700/50 zentry:hover:border-white/10",
                        )}
                        aria-label="Toggle sidebar"
                      >
                        <ChevronLeft strokeWidth={2} className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                ) : (
                  i === 0 && (
                    <div className="flex justify-center mb-6 mt-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => onCollapse && onCollapse()}
                        className={cn(
                          "h-10 w-10 rounded-xl transition-all duration-300 bg-white shadow-sm ring-1 ring-slate-200/50",
                          "hover:bg-slate-50 text-slate-600 hover:text-slate-900",
                          "dark:bg-slate-900/60 dark:ring-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 dark:backdrop-blur-md",
                          "zentry:bg-white/10 zentry:ring-white/20 zentry:text-white/80 zentry:hover:text-white zentry:hover:bg-white/15",
                        )}
                        aria-label="Toggle sidebar"
                      >
                        <ChevronLeft
                          strokeWidth={2.5}
                          className="h-[18px] w-[18px] rotate-180"
                        />
                      </Button>
                    </div>
                  )
                )}

                <div className="space-y-1">
                  {section.items.map((item, j) => (
                    <NavItemComponent
                      key={`${i}-${j}`}
                      item={item}
                      isActive={
                        pathname === item.href ||
                        (item.href !== "/dashboard" &&
                          pathname?.startsWith(item.href + "/"))
                      }
                      isCollapsed={isCollapsed}
                      badge={getDynamicBadge(item.href) || item.badge}
                    />
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollArea>

        <div className="mt-auto shrink-0 px-4 py-5 border-t border-slate-200/50 dark:border-slate-800/80 zentry:border-white/15">
          <motion.div
            whileHover={{ y: -2 }}
            className={cn(
              "group relative flex items-center gap-3 rounded-[1.25rem] border border-slate-200/40 bg-white/40 backdrop-blur-xl p-2 shadow-sm transition-all duration-300",
              "hover:shadow-md hover:border-slate-300/60 hover:bg-white/80",
              "dark:border-slate-800/60 dark:bg-slate-900/40 dark:hover:bg-slate-800/80 dark:hover:border-slate-700/80",
              "zentry:bg-white/10 zentry:border-white/15 zentry:hover:bg-white/20 zentry:hover:border-white/25 zentry:shadow-none zentry:hover:shadow-[0_8px_32px_rgba(0,0,0,0.2)] zentry:shadow-[inset_0_1px_1px_rgba(255,255,255,0.1)]",
              isCollapsed && "justify-center p-2 rounded-2xl mx-auto w-12 h-12",
            )}
          >
            <div className="relative flex-shrink-0">
              <Avatar className="h-9 w-9 ring-2 ring-white dark:ring-slate-900 zentry:ring-white/10 shadow-sm transition-transform group-hover:scale-105">
                <AvatarImage
                  src={user?.photoURL || "/assets/avatars/premium-user.png"}
                  alt={user?.email || ""}
                  referrerPolicy="no-referrer"
                />
                <AvatarFallback className="bg-primary/5 text-primary font-bold text-xs dark:bg-primary/20 dark:text-primary zentry:bg-white/20 zentry:text-white">
                  {userInitials}
                </AvatarFallback>
              </Avatar>
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2.5, repeat: Infinity }}
                className="absolute -bottom-0.5 -right-0.5 w-[12px] h-[12px] bg-emerald-500 border-2 border-white dark:border-slate-900 zentry:border-slate-800 rounded-full shadow-sm"
              />
            </div>
            <AnimatePresence mode="wait">
              {!isCollapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  className="flex flex-col space-y-0.5 overflow-hidden whitespace-nowrap"
                >
                  <p className="text-[13px] font-bold leading-tight truncate text-slate-700 group-hover:text-primary transition-colors dark:text-slate-300 dark:group-hover:text-primary zentry:text-white">
                    {user?.displayName || user?.email?.split("@")[0]}
                  </p>
                  <p className="text-[11px] font-medium text-slate-500 truncate dark:text-slate-500 zentry:text-white/60">
                    {userClaims?.isGlobalAdmin
                      ? "Super Admin"
                      : "Administrador"}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </TooltipProvider>
  );
}

const itemVariants = {
  hidden: { x: -20, opacity: 0 },
  visible: {
    x: 0,
    opacity: 1,
    transition: { type: "spring", stiffness: 300, damping: 24 },
  },
} as const;

const NavItemComponent = React.memo(
  ({
    item,
    isActive,
    isCollapsed,
    badge,
  }: {
    item: NavItem;
    isActive: boolean;
    isCollapsed: boolean;
    badge?: string;
  }) => {
    const navItemContent = (
      <Link
        href={item.href}
        prefetch={[
          "/dashboard",
          "/dashboard/usuarios",
          "/dashboard/ingresos",
          "/dashboard/pagos",
        ].includes(item.href)}
        className={cn(
          "group relative flex items-center gap-3 rounded-[12px] px-3 py-2.5 transition-all duration-200 outline-none w-full",
          !isActive &&
            "text-slate-500/90 hover:bg-slate-100/80 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-100 zentry:text-white/60 zentry:hover:bg-white/10 zentry:hover:text-white",
          isActive &&
            "text-slate-900 font-semibold shadow-[0_2px_8px_rgba(0,0,0,0.04)] bg-white ring-1 ring-slate-200/50 dark:bg-primary/10 dark:text-primary dark:ring-primary/20 dark:shadow-none zentry:bg-white/20 zentry:text-white zentry:ring-white/20",
          isCollapsed && "justify-center p-0 mx-auto w-10 h-10",
        )}
      >
        <div
          className={cn(
            "relative z-10 flex items-center w-full",
            isCollapsed ? "justify-center" : "gap-3",
          )}
        >
          <div
            className={cn(
              "flex-shrink-0 transition-colors duration-200",
              isActive
                ? "text-primary dark:text-primary zentry:text-white"
                : "text-slate-400 group-hover:text-slate-600 dark:text-slate-500 dark:group-hover:text-slate-200 zentry:text-white/60 zentry:group-hover:text-white",
            )}
          >
            {React.cloneElement(item.icon as React.ReactElement, {
              strokeWidth: isActive ? 2 : 1.5,
              className: "w-[18px] h-[18px] flex-shrink-0",
            })}
          </div>

          <AnimatePresence mode="wait">
            {!isCollapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="flex items-center flex-grow overflow-hidden whitespace-nowrap"
              >
                <div className="flex-grow text-[13.5px] font-medium tracking-wide truncate">
                  {item.title}
                </div>
                {badge && (
                  <Badge
                    className={cn(
                      "ml-auto flex-shrink-0 h-5 min-w-[20px] px-1.5 text-[10px] font-bold border-none shadow-none rounded-md flex items-center justify-center transition-colors",
                      item.href.includes("alertas-panico") &&
                        "bg-red-500/10 text-red-600 dark:bg-red-500/20 dark:text-red-400",
                      item.href.includes("mensajes") &&
                        "bg-blue-500/10 text-blue-600 dark:bg-blue-500/20 dark:text-blue-400",
                      item.href.includes("usuarios") &&
                        "bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/20 dark:text-emerald-400",
                      item.href.includes("reservas") &&
                        "bg-amber-500/10 text-amber-600 dark:bg-amber-500/20 dark:text-amber-400",
                      item.href.includes("pagos") &&
                        "bg-pink-500/10 text-pink-600 dark:bg-pink-500/20 dark:text-pink-400",
                      !item.href.includes("alertas-panico") &&
                        !item.href.includes("mensajes") &&
                        !item.href.includes("usuarios") &&
                        !item.href.includes("reservas") &&
                        !item.href.includes("pagos") &&
                        (isActive
                          ? "bg-primary/20 text-primary dark:bg-primary/20 dark:text-primary zentry:bg-white/20 zentry:text-white"
                          : "bg-slate-100 text-slate-500 dark:bg-slate-800/60 dark:text-slate-400 zentry:bg-white/10 zentry:text-white"),
                    )}
                  >
                    {badge}
                  </Badge>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Link>
    );

    if (isCollapsed) {
      return (
        <Tooltip>
          <TooltipTrigger asChild>
            <motion.div
              initial="hidden"
              animate="visible"
              variants={itemVariants}
              className="w-full"
            >
              {navItemContent}
            </motion.div>
          </TooltipTrigger>
          <TooltipContent
            side="right"
            sideOffset={16}
            className="font-semibold text-xs rounded-lg shadow-xl border-slate-100/50 zentry:bg-slate-900 zentry:text-white zentry:border-slate-800 px-3 py-1.5"
          >
            {item.title}
            {badge && (
              <span className="ml-2 bg-primary/10 text-primary text-[9px] px-1.5 py-0.5 rounded-md font-bold">
                {badge}
              </span>
            )}
          </TooltipContent>
        </Tooltip>
      );
    }

    return (
      <motion.div
        initial="hidden"
        animate="visible"
        variants={itemVariants}
        className="w-full"
      >
        {navItemContent}
      </motion.div>
    );
  },
);
NavItemComponent.displayName = "NavItemComponent";

export default DashboardNav;
