// Configuración de Deploy para Zentry WEB
// Este archivo ayuda a mantener consistencia entre local y producción

module.exports = {
  // Configuración del proyecto
  project: {
    name: 'Zentry WEB',
    version: '2.1.1',
    environment: process.env.NODE_ENV || 'development'
  },

  // Configuración de Firebase
  firebase: {
    // Verificar que estos archivos existan antes del deploy
    requiredFiles: [
      'firebase.json',
      '.firebaserc',
      'src/lib/firebase/config.ts'
    ],
    
    // Configuraciones que deben ser iguales en local y producción
    config: {
      // Asegúrate de que estas configuraciones sean correctas
      apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
      authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
      projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
      appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID
    }
  },

  // Configuración de Next.js
  nextjs: {
    // Archivos de configuración críticos
    configFiles: [
      'next.config.mjs',
      'tsconfig.json',
      'tailwind.config.ts',
      'postcss.config.mjs'
    ],
    
    // Scripts que deben funcionar
    requiredScripts: [
      'build',
      'start',
      'dev'
    ]
  },

  // Verificaciones pre-deploy
  preDeploy: {
    // Comandos que deben ejecutarse antes del deploy
    commands: [
      'npm run build',
      'npm run lint', // si tienes linting configurado
      'npm run type-check' // si tienes type checking
    ],
    
    // Archivos que deben existir después del build
    buildArtifacts: [
      '.next',
      '.next/BUILD_ID',
      '.next/static'
    ]
  },

  // Verificaciones post-deploy
  postDeploy: {
    // URLs que deben funcionar después del deploy
    healthChecks: [
      '/', // Página principal
      '/dashboard', // Dashboard
      '/dashboard/usuarios', // Página de usuarios (crítica)
      '/login' // Página de login
    ],
    
    // Funcionalidades que deben funcionar
    criticalFeatures: [
      'Autenticación de usuarios',
      'Carga de usuarios desde Firestore',
      'Indicador visual de usuarios',
      'Botón de recarga de usuarios'
    ]
  },

  // Configuración de variables de entorno
  environment: {
    // Variables que deben estar definidas
    required: [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID'
    ],
    
    // Variables opcionales pero recomendadas
    recommended: [
      'NODE_ENV',
      'NEXT_PUBLIC_APP_URL',
      'NEXT_PUBLIC_APP_NAME'
    ]
  },

  // Configuración de caché y optimización
  optimization: {
    // Configuraciones que pueden afectar el comportamiento
    cache: {
      // Verificar que el caché no interfiera
      browserCache: true,
      cdnCache: true,
      staticAssets: true
    },
    
    // Optimizaciones que pueden cambiar el comportamiento
    build: {
      minification: true,
      treeShaking: true,
      codeSplitting: true
    }
  },

  // Checklist de deploy
  deployChecklist: [
    '✅ Todos los cambios están commitados en Git',
    '✅ Build local funciona correctamente',
    '✅ Variables de entorno están configuradas',
    '✅ Configuración de Firebase es correcta',
    '✅ No hay errores en la consola local',
    '✅ La página de usuarios funciona localmente',
    '✅ Se muestran todos los usuarios localmente',
    '✅ El indicador visual funciona correctamente',
    '✅ Los botones de recarga funcionan',
    '✅ Las funciones de Firestore funcionan'
  ],

  // Comandos útiles para debugging
  debugCommands: {
    // Verificar estado del proyecto
    status: 'git status',
    
    // Verificar build
    build: 'npm run build',
    
    // Verificar tipos (si tienes TypeScript)
    types: 'npx tsc --noEmit',
    
    // Verificar linting (si tienes ESLint)
    lint: 'npm run lint',
    
    // Verificar dependencias
    deps: 'npm audit',
    
    // Verificar configuración de Firebase
    firebase: 'firebase projects:list'
  },

  // URLs de verificación
  verificationUrls: {
    development: 'http://localhost:3000',
    production: 'https://tu-dominio.vercel.app', // Cambiar por tu URL real
    firebase: 'https://console.firebase.google.com'
  },

  // Contacto para problemas
  support: {
    developer: 'Gerardo Arroyo',
    email: 'tu-email@ejemplo.com', // Cambiar por tu email
    repository: 'https://github.com/tu-usuario/zentry-web' // Cambiar por tu repo
  }
};

// Función para verificar configuración
function verifyConfig() {
  const config = module.exports;
  
  console.log('🔍 Verificando configuración de deploy...');
  
  // Verificar variables de entorno requeridas
  const missingEnvVars = config.environment.required.filter(
    varName => !process.env[varName]
  );
  
  if (missingEnvVars.length > 0) {
    console.error('❌ Variables de entorno faltantes:', missingEnvVars);
    return false;
  }
  
  console.log('✅ Configuración verificada correctamente');
  return true;
}

// Exportar función de verificación
module.exports.verifyConfig = verifyConfig;
