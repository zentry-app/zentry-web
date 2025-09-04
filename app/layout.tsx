import type { Metadata } from "next";
import { Inter } from 'next/font/google';
import { Poppins } from 'next/font/google';
import localFont from 'next/font/local';
import "./globals.css";
import { AuthProvider } from '@/contexts/AuthContext';
import { Toaster } from 'sonner';
import { ThemeProvider } from "next-themes";

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
  title: "Zentry - Gestión de Residenciales",
  description: "Zentry: Tu plataforma integral para la administración y seguridad de residenciales. Optimiza la gestión, comunicación y control de acceso.",
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
      </head>
      <body className={`${inter.variable} ${poppins.variable} ${geist.variable} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            {children}
            <Toaster />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
