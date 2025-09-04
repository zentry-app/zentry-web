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
} from "lucide-react";
import React from "react";
import { useAuth, UserClaims } from "@/contexts/AuthContext";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AuthService } from "@/lib/services/auth-service";
import { useToast } from "@/components/ui/use-toast";
import { useRouter } from "next/navigation";

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
        title: "Comunicados",
        href: "/dashboard/comunicados",
        icon: <FileText className="h-5 w-5" />,
        color: "text-violet-500",
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
        badge: "24",
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
        title: "Reportes",
        href: "/dashboard/reportes",
        icon: <FileSpreadsheet className="h-5 w-5" />,
        color: "text-teal-500",
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
export function DashboardNav({ isCollapsed = false, onCollapse }: DashboardNavProps) {
  const pathname = usePathname();
  const { user, logout, userClaims } = useAuth();
  const { toast } = useToast();
  const router = useRouter();

  const filteredNavSections = React.useMemo(() => {
    if (!userClaims) return [];

    return baseNavSections.map(section => ({
      ...section,
      items: section.items.filter(item => {
        if (item.requiresGlobalAdmin) {
          return userClaims.isGlobalAdmin === true;
        }
        return true;
      }),
    })).filter(section => section.items.length > 0);
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

  const NavItem = ({ item, isActive, isCollapsed }: { 
    item: NavItem, 
    isActive: boolean,
    isCollapsed: boolean 
  }) => {
    return (
      <Link
        href={item.href}
        prefetch={false}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
          isActive ? "bg-muted font-medium text-primary" : "text-muted-foreground hover:bg-muted hover:text-primary",
          isCollapsed && "justify-center p-2"
        )}
      >
        <div className={cn("flex-shrink-0", item.color)}>
          {item.icon}
        </div>
        {!isCollapsed && (
          <>
            <div className="flex-grow text-sm">{item.title}</div>
            {item.badge && (
              <Badge variant="outline" className="ml-auto flex-shrink-0 h-5 px-1.5">
                {item.badge}
              </Badge>
            )}
          </>
        )}
      </Link>
    );
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col py-2">
      <div className="flex h-[52px] items-center justify-end px-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => onCollapse && onCollapse()}
          className="h-7 w-7 rounded-full hover:bg-accent/50"
          aria-label="Toggle sidebar"
        >
          <motion.div
            initial={false}
            animate={{ rotate: isCollapsed ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronLeft className="h-4 w-4" />
          </motion.div>
        </Button>
      </div>

      <div className="flex-1 px-3">
        <div className="space-y-4">
          {filteredNavSections.map((section, i) => (
            <div key={i} className={cn("py-2", isCollapsed && "px-2")}>
              {!isCollapsed && <div className="mb-2 px-4 text-xs font-semibold text-muted-foreground">{section.title}</div>}
              <div className="space-y-1">
                {section.items.map((item, j) => (
                  <NavItem
                    key={j}
                    item={item}
                    isActive={pathname === item.href}
                    isCollapsed={isCollapsed}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="mt-auto px-3 py-2">
        <div
          className={cn(
            "flex items-center gap-3 rounded-lg border bg-card p-3 shadow-sm transition-all duration-200 hover:shadow-md",
            isCollapsed && "justify-center p-2"
          )}
        >
          <Avatar className="h-8 w-8 border-2 border-background">
            <AvatarImage
              src={user?.photoURL || ""}
              alt={user?.email || ""}
              referrerPolicy="no-referrer"
            />
            <AvatarFallback className="bg-primary/10">{userInitials}</AvatarFallback>
          </Avatar>
          {!isCollapsed && (
            <div className="flex flex-col space-y-0.5 overflow-hidden">
              <p className="text-sm font-medium leading-none truncate">
                {user?.displayName || user?.email}
              </p>
              <p className="text-xs text-muted-foreground truncate">
                {user?.email}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default DashboardNav; 