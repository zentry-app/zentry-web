// Script de diagnóstico para ejecutar desde la consola del navegador
// Copia y pega este código en la consola de tu navegador en la página de usuarios

console.log('🔍 INICIANDO DIAGNÓSTICO DE USUARIOS DESDE CONSOLA...\n');

// Función para diagnosticar usuarios
async function diagnosticarUsuariosDesdeConsola() {
  try {
    // Verificar si estamos en la página correcta
    if (!window.location.pathname.includes('/dashboard/usuarios')) {
      console.error('❌ Este script debe ejecutarse en la página de usuarios (/dashboard/usuarios)');
      return;
    }

    console.log('1️⃣ VERIFICANDO ESTADO ACTUAL DE LA PÁGINA...');
    
    // Intentar acceder a las variables del componente React
    const reactRoot = document.querySelector('#__next') || document.querySelector('[data-reactroot]');
    if (!reactRoot) {
      console.log('⚠️ No se pudo encontrar el root de React');
    }

    // Buscar elementos que contengan información de usuarios
    const tablas = document.querySelectorAll('table');
    const filasUsuario = document.querySelectorAll('tr[data-user-id], tr:has(td)');
    
    console.log(`   Tablas encontradas: ${tablas.length}`);
    console.log(`   Filas de usuario encontradas: ${filasUsuario.length}`);
    
    // Buscar contadores o indicadores de usuarios
    const contadores = document.querySelectorAll('[class*="count"], [class*="total"], [class*="usuarios"]');
    console.log(`   Elementos con contadores: ${contadores.length}`);
    
    // Verificar si hay mensajes de error o loading
    const mensajesError = document.querySelectorAll('[class*="error"], [class*="loading"], [class*="empty"]');
    console.log(`   Elementos de estado: ${mensajesError.length}`);
    
    console.log('\n2️⃣ VERIFICANDO CONSOLA DEL NAVEGADOR...');
    
    // Mostrar logs recientes de la consola
    console.log('   Revisa los logs anteriores en la consola para ver:');
    console.log('   - 🔍 Mensajes de carga de usuarios');
    console.log('   - ✅ Usuarios obtenidos');
    console.log('   - ❌ Errores de carga');
    console.log('   - ⚠️ Advertencias');
    
    console.log('\n3️⃣ VERIFICANDO RED (Network)...');
    console.log('   Revisa la pestaña Network en las herramientas de desarrollador para ver:');
    console.log('   - Llamadas a Firestore');
    console.log('   - Tiempo de respuesta');
    console.log('   - Errores de red');
    
    console.log('\n4️⃣ VERIFICANDO ALMACENAMIENTO LOCAL...');
    
    // Verificar localStorage y sessionStorage
    const localStorageKeys = Object.keys(localStorage);
    const sessionStorageKeys = Object.keys(sessionStorage);
    
    console.log(`   Claves en localStorage: ${localStorageKeys.length}`);
    console.log(`   Claves en sessionStorage: ${sessionStorageKeys.length}`);
    
    // Buscar claves relacionadas con usuarios
    const clavesUsuario = [...localStorageKeys, ...sessionStorageKeys].filter(key => 
      key.toLowerCase().includes('user') || 
      key.toLowerCase().includes('usuario') ||
      key.toLowerCase().includes('auth')
    );
    
    if (clavesUsuario.length > 0) {
      console.log('   Claves relacionadas con usuarios:');
      clavesUsuario.forEach(clave => {
        try {
          const valor = localStorage.getItem(clave) || sessionStorage.getItem(clave);
          console.log(`     ${clave}: ${valor ? 'Presente' : 'Vacío'}`);
        } catch (e) {
          console.log(`     ${clave}: Error al leer`);
        }
      });
    }
    
    console.log('\n5️⃣ VERIFICANDO COOKIES...');
    
    // Verificar cookies
    const cookies = document.cookie.split(';').map(c => c.trim());
    console.log(`   Cookies encontradas: ${cookies.length}`);
    
    const cookiesAuth = cookies.filter(c => 
      c.toLowerCase().includes('auth') || 
      c.toLowerCase().includes('firebase') ||
      c.toLowerCase().includes('session')
    );
    
    if (cookiesAuth.length > 0) {
      console.log('   Cookies de autenticación:');
      cookiesAuth.forEach(cookie => {
        console.log(`     ${cookie}`);
      });
    }
    
    console.log('\n6️⃣ RECOMENDACIONES...');
    console.log('   💡 Si no ves usuarios:');
    console.log('     1. Verifica que estés logueado como admin');
    console.log('     2. Revisa que el residencial seleccionado sea correcto');
    console.log('     3. Verifica que no haya filtros activos');
    console.log('     4. Revisa la consola para errores');
    console.log('     5. Usa el botón "Recargar usuarios"');
    
    console.log('\n   💡 Para debugging avanzado:');
    console.log('     1. Abre las herramientas de desarrollador (F12)');
    console.log('     2. Ve a la pestaña Console');
    console.log('     3. Recarga la página');
    console.log('     4. Busca mensajes que empiecen con 🔍, ✅, ❌, ⚠️');
    
    console.log('\n   💡 Si el problema persiste:');
    console.log('     1. Limpia el caché del navegador');
    console.log('     2. Cierra y abre el navegador');
    console.log('     3. Verifica tu conexión a internet');
    console.log('     4. Contacta al administrador del sistema');
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  }
}

// Función para verificar usuarios específicos
async function verificarUsuarioEspecifico(email) {
  console.log(`🔍 Verificando usuario específico: ${email}`);
  
  try {
    // Buscar en la tabla actual
    const filas = document.querySelectorAll('tr');
    let encontrado = false;
    
    filas.forEach((fila, index) => {
      const celdas = fila.querySelectorAll('td');
      celdas.forEach(celda => {
        if (celda.textContent.includes(email)) {
          console.log(`✅ Usuario encontrado en fila ${index + 1}:`);
          console.log(`   Contenido de la fila: ${fila.textContent}`);
          encontrado = true;
        }
      });
    });
    
    if (!encontrado) {
      console.log(`❌ Usuario ${email} NO encontrado en la tabla actual`);
      console.log('   Posibles causas:');
      console.log('   - No está en el residencial seleccionado');
      console.log('   - Está filtrado por búsqueda o filtros');
      console.log('   - No se ha cargado completamente la tabla');
      console.log('   - El usuario no existe o fue eliminado');
    }
    
  } catch (error) {
    console.error('❌ Error verificando usuario:', error);
  }
}

// Función para mostrar estadísticas de la tabla
function mostrarEstadisticasTabla() {
  console.log('📊 ESTADÍSTICAS DE LA TABLA ACTUAL...');
  
  try {
    const tablas = document.querySelectorAll('table');
    console.log(`   Tablas encontradas: ${tablas.length}`);
    
    tablas.forEach((tabla, index) => {
      const filas = tabla.querySelectorAll('tr');
      const filasConDatos = Array.from(filas).filter(fila => 
        fila.querySelectorAll('td').length > 0
      );
      
      console.log(`   Tabla ${index + 1}:`);
      console.log(`     Total de filas: ${filas.length}`);
      console.log(`     Filas con datos: ${filasConDatos.length}`);
      
      if (filasConDatos.length > 0) {
        const primeraFila = filasConDatos[0];
        const celdas = primeraFila.querySelectorAll('td');
        console.log(`     Columnas por fila: ${celdas.length}`);
        
        // Mostrar encabezados si existen
        const encabezados = tabla.querySelectorAll('th');
        if (encabezados.length > 0) {
          console.log('     Encabezados:');
          encabezados.forEach((th, i) => {
            console.log(`       ${i + 1}: ${th.textContent.trim()}`);
          });
        }
      }
    });
    
  } catch (error) {
    console.error('❌ Error mostrando estadísticas:', error);
  }
}

// Ejecutar diagnóstico automáticamente
diagnosticarUsuariosDesdeConsola();

// Agregar funciones al objeto global para uso manual
window.diagnosticoUsuarios = {
  diagnosticar: diagnosticarUsuariosDesdeConsola,
  verificarUsuario: verificarUsuarioEspecifico,
  estadisticas: mostrarEstadisticasTabla
};

console.log('\n✅ Diagnóstico completado!');
console.log('💡 Usa estas funciones para debugging manual:');
console.log('   - window.diagnosticoUsuarios.diagnosticar()');
console.log('   - window.diagnosticoUsuarios.verificarUsuario("email@ejemplo.com")');
console.log('   - window.diagnosticoUsuarios.estadisticas()');
