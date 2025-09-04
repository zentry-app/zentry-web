import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Rutas que son para autenticación o la página principal que redirige si está logueado
const authFlowRoutes = ['/login', '/register', '/'];

// Rutas que no requieren autenticación
const publicRoutes = ['/login', '/register', '/access-denied'];

// Rutas que un usuario NO autenticado NO PUEDE visitar directamente (será redirigido a /login)
// Esto incluye la raíz si quieres que sea el punto de entrada al login.
// Y también las rutas protegidas como dashboard.
const protectedAppRoutes = ['/', '/dashboard']; // Añadimos '/' aquí

export function middleware(request: NextRequest) {
  const token = request.cookies.get('session');
  const { pathname } = request.nextUrl;

  // Permitir acceso a rutas públicas sin autenticación
  if (publicRoutes.includes(pathname)) {
    return NextResponse.next();
  }

  // Caso 1: Usuario autenticado
  if (token) {
    // Si está autenticado e intenta acceder a login, register, o la raíz (que ya sabemos lo redirigirá AuthContext),
    // lo enviamos a dashboard. Esto previene que vea esas páginas si ya está logueado.
    if (authFlowRoutes.includes(pathname)) {
      return NextResponse.redirect(new URL('/dashboard', request.url));
    }
    // Si está autenticado y va a cualquier otra ruta (que no sea login/register/raíz), se le permite.
    return NextResponse.next();
  }

  // Caso 2: Usuario NO autenticado
  if (!token) {
    // Si no está autenticado e intenta acceder a una ruta que requiere autenticación 
    // (definida en protectedAppRoutes, que incluye la raíz '/' o cualquier cosa que comience con '/dashboard')
    // lo enviamos a login.
    const requiresAuth = protectedAppRoutes.some(route => 
      pathname === route || (route !== '/' && pathname.startsWith(route))
    );

    if (requiresAuth) {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    // Si no está autenticado y va a /login o /register (o cualquier otra ruta no protegida explícitamente), se le permite.
    return NextResponse.next();
  }

  // Fallback por si alguna lógica no se cumple, aunque debería cubrirse arriba.
  return NextResponse.next();
}

// Configurar el matcher para excluir archivos estáticos
export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images (public images)
     * - manifest.json (PWA manifest file)
     * - sw.js (Service Worker file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|images|manifest.json|sw.js).*)',
  ],
}; 