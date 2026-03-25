"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  HomeIcon,
  Building2,
  Users,
  Shield,
  Settings,
  MessageSquare,
  Bell,
  LogOut,
  BarChart3,
  Ticket,
  BookOpen,
  ArrowRightLeft,
  PenTool
} from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { AuthService } from "@/lib/services/auth-service"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

export function GlobalAdminNav() {
  const pathname = usePathname()
  const { toast } = useToast()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await AuthService.logout()
      router.push("/login")
    } catch (error: any) {
      toast({
        title: "Error",
        description: `Error al cerrar sesión: ${error.message}`,
        variant: "destructive",
      })
    }
  }

  return (
    <nav className="grid items-start gap-2">
      <Link href="/admin/dashboard" passHref>
        <Button
          variant={pathname === "/admin/dashboard" ? "default" : "ghost"}
          className="w-full justify-start"
        >
          <HomeIcon className="mr-2 h-4 w-4" />
          Panel de Control
        </Button>
      </Link>
      <Link href="/admin/residenciales" passHref>
        <Button
          variant={pathname === "/admin/residenciales" ? "default" : "ghost"}
          className="w-full justify-start"
        >
          <Building2 className="mr-2 h-4 w-4" />
          Residenciales
        </Button>
      </Link>
      <Link href="/admin/usuarios" passHref>
        <Button
          variant={pathname === "/admin/usuarios" ? "default" : "ghost"}
          className="w-full justify-start"
        >
          <Users className="mr-2 h-4 w-4" />
          Usuarios
        </Button>
      </Link>
      <Link href="/admin/administradores" passHref>
        <Button
          variant={pathname === "/admin/administradores" ? "default" : "ghost"}
          className="w-full justify-start"
        >
          <Shield className="mr-2 h-4 w-4" />
          Administradores
        </Button>
      </Link>
      <Link href="/admin/estadisticas" passHref>
        <Button
          variant={pathname === "/admin/estadisticas" ? "default" : "ghost"}
          className="w-full justify-start"
        >
          <BarChart3 className="mr-2 h-4 w-4" />
          Estadísticas
        </Button>
      </Link>
      <Link href="/admin/notificaciones" passHref>
        <Button
          variant={pathname === "/admin/notificaciones" ? "default" : "ghost"}
          className="w-full justify-start"
        >
          <Bell className="mr-2 h-4 w-4" />
          Notificaciones
        </Button>
      </Link>
      <Link href="/admin/mensajes" passHref>
        <Button
          variant={pathname === "/admin/mensajes" ? "default" : "ghost"}
          className="w-full justify-start"
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Mensajes
        </Button>
      </Link>
      <Link href="/admin/blog" passHref>
        <Button
          variant={pathname?.startsWith("/admin/blog") ? "default" : "ghost"}
          className="w-full justify-start"
        >
          <PenTool className="mr-2 h-4 w-4" />
          Blog
        </Button>
      </Link>

      <Button
        variant={pathname?.startsWith("/admin/support/tickets") ? "default" : "ghost"}
        className="w-full justify-start"
        asChild
      >
        <Link href="/admin/support/tickets">
          <Ticket className="mr-2 h-4 w-4" />
          Tickets de Soporte
        </Link>
      </Button>
      <Button
        variant={pathname?.startsWith("/admin/support/knowledge") ? "default" : "ghost"}
        className="w-full justify-start"
        asChild
      >
        <Link href="/admin/support/knowledge">
          <BookOpen className="mr-2 h-4 w-4" />
          Base de Conocimiento
        </Link>
      </Button>
      <Link href="/admin/migrate-user" passHref>
        <Button
          variant={pathname === "/admin/migrate-user" ? "default" : "ghost"}
          className="w-full justify-start"
        >
          <ArrowRightLeft className="mr-2 h-4 w-4" />
          Migrar Cuenta
        </Button>
      </Link>
      <Link href="/admin/configuracion" passHref>
        <Button
          variant={pathname === "/admin/configuracion" ? "default" : "ghost"}
          className="w-full justify-start"
        >
          <Settings className="mr-2 h-4 w-4" />
          Configuración
        </Button>
      </Link>
      <Button
        variant="ghost"
        className="w-full justify-start text-red-500 hover:text-red-600 hover:bg-red-50"
        onClick={handleLogout}
      >
        <LogOut className="mr-2 h-4 w-4" />
        Cerrar Sesión
      </Button>
    </nav>
  )
}

export default GlobalAdminNav 