import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import { Poppins } from 'next/font/google';
import localFont from 'next/font/local';
import dynamic from 'next/dynamic';
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';
import { ThemeProvider } from "next-themes";

// Lazy load Chatbot - no es crítico para el render inicial
const Chatbot = dynamic(() => import("@/components/Chatbot"), {
  ssr: false,
});

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: "--font-inter",
  weight: ['400', '500', '600', '700'],
});

const poppins = Poppins({
  subsets: ["latin"],
  display: 'swap',
  weight: ['500', '700'],
  variable: '--font-heading',
});

const geist = localFont({
  src: [
    { path: './fonts/GeistVF.woff', weight: '100 900', style: 'normal' },
  ],
  variable: '--font-geist',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.zentrymx.com"),
  title: "Zentry | La App Residencial #1 para Administración y Seguridad",
  description: "Zentry es la mejor aplicación para residenciales y condominios. Control de acceso, pagos, comunicación y seguridad en una sola app residencial inteligente.",
  keywords: ["app residencial", "aplicación para residenciales", "administración de residenciales", "seguridad residencial", "control de acceso", "gestión de condominios", "app para vecinos", "pagos de mantenimiento", "Zentry", "software administración condominios"],
  authors: [{ name: "Zentry Team" }],

  robots: "index, follow",
  alternates: {
    canonical: "https://zentrymx.com",
  },
  openGraph: {
    type: "website",
    locale: "es_MX",
    url: "https://zentrymx.com",
    title: "Zentry | La App Residencial #1 para Administración y Seguridad",
    description: "Simplifica la gestión de tu residencial con la mejor aplicación para residenciales. Seguridad, comunicación y transparencia en la palma de tu mano.",
    siteName: "Zentry",
    images: [
      {
        url: "/assets/logo/zentry-logo-new.png",
        width: 1200,
        height: 630,
        alt: "Zentry - Gestión Residencial",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Zentry | La App Residencial #1 para Administración y Seguridad",
    description: "Optimiza la seguridad y comunicación de tu comunidad con la app residencial líder.",
    images: ["/assets/logo/zentry-logo-new.png"],
  },
  icons: {
    icon: [
      { url: '/zentry-favicon-transparent.ico?v=4', sizes: '32x32', type: 'image/x-icon' },
      { url: '/favicon-192x192.png?v=4', sizes: '192x192', type: 'image/png' },
      { url: '/favicon-512x512.png?v=4', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/favicon-192x192.png?v=4', sizes: '192x192', type: 'image/png' },
    ],
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="google-site-verification" content="jCZiDU3blxIneyRIcDgr3rbFgjR4juVd7b7fWD1h9tQ" />
        {/* 🚀 Preconnect a dominios que realmente usamos - ahorra hasta 710ms */}
        <link rel="preconnect" href="https://zentryapp-949f4.firebaseapp.com" />
        <link rel="preconnect" href="https://firebasestorage.googleapis.com" />
        <link rel="preconnect" href="https://apis.google.com" />
        <link rel="dns-prefetch" href="https://www.googleapis.com" />
        <link rel="dns-prefetch" href="https://firebasestorage.googleapis.com" />
        <link rel="icon" type="image/x-icon" href="/zentry-favicon-transparent.ico?v=4" />
        <link rel="icon" type="image/png" sizes="32x32" href="/favicon-192x192.png?v=4" />
        <link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png?v=4" />
        <link rel="icon" type="image/png" sizes="512x512" href="/favicon-512x512.png?v=4" />
        <link rel="apple-touch-icon" href="/favicon-192x192.png?v=4" />
      </head>
      <body className={`${inter.variable} ${poppins.variable} ${geist.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
          themes={["light", "dark", "zentry"]}
        >
          <AuthProvider>
            {children}
            <Chatbot />
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
