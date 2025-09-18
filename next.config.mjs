import withBundleAnalyzer from '@next/bundle-analyzer';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  trailingSlash: true,
  images: {
    domains: ['firebasestorage.googleapis.com'],
    unoptimized: true,
  },
  
  // Optimizaciones de rendimiento
  // reactStrictMode: false, // Desactivar modo estricto en producción para evitar doble renderizado
  
  // Optimización de compilación y carga
  // swcMinify: true, // Usar SWC para minificación (más rápido que Terser)
  
  // Optimizaciones específicas para mejorar carga y rendimiento
  compiler: {
    // Eliminar console.logs en producción
    removeConsole: process.env.NODE_ENV === 'production' ? {
      exclude: ['error', 'warn'], // Mantener errores y advertencias
    } : false,
  },
  
  // Mejorar el hot reloading y prevenir problemas de caché
  webpack: (config, { dev, isServer }) => {
    // Configuraciones para mejorar rendimiento
    if (dev) {
      // Configuraciones específicas para desarrollo
      config.watchOptions = {
        ...config.watchOptions,
        poll: 500,
        ignored: ['node_modules/**', '.git/**', '.next/**'],
      };
    } else {
      // Optimizaciones para producción
      if (!isServer) {
        // Optimizar paquetes para cliente
        config.optimization = {
          ...config.optimization,
          runtimeChunk: 'single',
          splitChunks: {
            chunks: 'all',
            maxInitialRequests: 25,
            minSize: 20000,
            cacheGroups: {
              default: false,
              vendors: false,
              framework: {
                name: 'framework',
                test: /[\\/]node_modules[\\/](react|react-dom|next|firebase)[\\/]/,
                priority: 40,
                enforce: true,
              },
              commons: {
                name: 'commons',
                minChunks: 2,
                priority: 20,
              },
              lib: {
                test: /[\\/]node_modules[\\/]/,
                name(module) {
                  const match = module.context.match(/[\\/]node_modules[\\/](.*?)([\\/]|$)/);
                  if (match && match[1]) {
                    const packageName = match[1];
                    return `npm.${packageName.replace('@', '')}`;
                  }
                  // Fallback si no se puede determinar el nombre del paquete
                  return 'npm.unknown'; 
                },
                priority: 10,
                minChunks: 1,
                reuseExistingChunk: true,
              },
            },
          },
        };
      }
    }
    return config;
  },
  
  // Optimizar generación de páginas para mejorar rendimiento
  experimental: {
    // Desactivar temporalmente las optimizaciones experimentales para resolver el problema de compilación
    // optimizeCss: true, // Comentado temporalmente para evitar error con 'critters'
    // turbo: {
    //   rules: {
    //     // Desactivar prefetch para rutas que no se usan frecuentemente
    //     '/(api|admin|dashboard/usuarios)/(.*)': {
    //       prefetch: false,
    //     },
    //   },
    // },
    // Aplicar lazy loading agresivo
    // optimizePackageImports: [
    //   '@headlessui/react',
    //   '@radix-ui/react-avatar',
    //   '@radix-ui/react-dropdown-menu',
    //   '@radix-ui/react-dialog',
    //   '@radix-ui/react-slot',
    //   '@radix-ui/react-popover',
    //   '@radix-ui/react-select',
    //   '@radix-ui/react-tabs',
    //   'lucide-react',
    //   'date-fns',
    //   'react-day-picker',
    //   'sonner',
    //   'clsx',
    // ],
  },
  
  // Configuración de páginas en caché
  onDemandEntries: {
    maxInactiveAge: 15 * 1000,
    pagesBufferLength: 5,
  },
  
  // Optimizar tiempos de compilación reduciendo comprobaciones innecesarias
  typescript: {
    // No verificar tipos durante la compilación para mejorar velocidad
    // Usar verificación externa en lugar de durante la compilación
    ignoreBuildErrors: true,
  },
  
  // Optimización de ESLint
  eslint: {
    // No ejecutar verificación de ESLint durante la compilación
    ignoreDuringBuilds: true,
  },
  
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'Cross-Origin-Opener-Policy', value: 'unsafe-none' },
          { key: 'Cross-Origin-Embedder-Policy', value: 'unsafe-none' },
        ],
      },
    ];
  },
};

// Condicionalmente envolver la configuración con el analizador de bundles
const bundleAnalyzer = withBundleAnalyzer({
  enabled: process.env.ANALYZE === 'true',
});

export default bundleAnalyzer(nextConfig);
