"use client";

import Link from "next/link";
import { Facebook, Instagram, Linkedin, Mail, MapPin, Phone } from "lucide-react";

const navigation = {
  producto: [
    { name: "Características", href: "#caracteristicas" },
    { name: "Precios", href: "#precios" },
    { name: "Cómo funciona", href: "#como-funciona" },
    { name: "Testimonios", href: "#testimonios" },
  ],
  soporte: [
    { name: "Centro de ayuda", href: "/ayuda" },
    { name: "Documentación", href: "/docs" },
    { name: "FAQ", href: "/faq" },
    { name: "Contacto", href: "#contacto" },
  ],
  legal: [
    { name: "Términos y condiciones", href: "/terminos" },
    { name: "Política de privacidad", href: "/privacidad" },
    { name: "Aviso de privacidad", href: "/aviso-privacidad" },
    { name: "Eliminación de cuenta", href: "/eliminar-cuenta" },
  ],
  social: [
    { name: "Facebook", icon: Facebook, href: "https://facebook.com/zentryapp" },
    { name: "Instagram", icon: Instagram, href: "https://instagram.com/zentryapp" },
    { name: "LinkedIn", icon: Linkedin, href: "https://linkedin.com/company/zentryapp" },
  ],
};

export function Footer() {
  return (
    <footer className="bg-muted/50">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8">
          {/* Logo y descripción */}
          <div className="lg:col-span-2">
            <Link href="/" className="font-bold text-2xl">
              Zentry
            </Link>
            <p className="mt-4 text-sm text-muted-foreground max-w-sm">
              Simplifica la gestión de tu residencial con nuestra plataforma integral.
              Control de acceso, gestión de visitantes y más en una sola aplicación.
            </p>
            <div className="mt-6 space-y-2">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Phone className="h-4 w-4" />
                <span>+52 (81) 1234 5678</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4" />
                <span>contacto@zentry.mx</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <MapPin className="h-4 w-4" />
                <span>Monterrey, Nuevo León, México</span>
              </div>
            </div>
          </div>

          {/* Enlaces de navegación */}
          <div>
            <h3 className="font-semibold mb-4">Producto</h3>
            <ul className="space-y-2">
              {navigation.producto.map((item) => (
                <li key={item.name}>
                  <Link 
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Soporte</h3>
            <ul className="space-y-2">
              {navigation.soporte.map((item) => (
                <li key={item.name}>
                  <Link 
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold mb-4">Legal</h3>
            <ul className="space-y-2">
              {navigation.legal.map((item) => (
                <li key={item.name}>
                  <Link 
                    href={item.href}
                    className="text-sm text-muted-foreground hover:text-primary transition-colors"
                  >
                    {item.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Pie del footer */}
        <div className="mt-12 pt-8 border-t">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Zentry. Todos los derechos reservados.
            </p>
            <div className="flex items-center gap-4">
              {navigation.social.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  className="text-muted-foreground hover:text-primary transition-colors"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <span className="sr-only">{item.name}</span>
                  <item.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
} 