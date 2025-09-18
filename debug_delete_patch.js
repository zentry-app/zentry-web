// Parche temporal para debugging de eliminación de reservas
// Agregar este código en la consola del navegador para debugging

console.log('🔧 Aplicando parche de debugging para eliminación de reservas...');

// Interceptar la función original de eliminación
const originalConsoleLog = console.log;
const originalConsoleError = console.error;

// Función para debugging mejorado
function debugDeleteReservation() {
  console.log('🔍 === DIAGNÓSTICO DE ELIMINACIÓN DE RESERVAS ===');
  
  // Verificar estado del componente React
  const reactRoot = document.querySelector('#__next');
  if (reactRoot) {
    console.log('✅ React root encontrado');
  } else {
    console.log('❌ React root no encontrado');
  }
  
  // Verificar botones de eliminación
  const deleteButtons = document.querySelectorAll('button, [role="menuitem"]');
  const deleteButtonsFiltered = Array.from(deleteButtons).filter(btn => 
    btn.textContent?.includes('Eliminar') || 
    btn.textContent?.includes('Trash') ||
    btn.className?.includes('text-red-600')
  );
  
  console.log(`🗑️ Botones de eliminación encontrados: ${deleteButtonsFiltered.length}`);
  deleteButtonsFiltered.forEach((btn, index) => {
    console.log(`  ${index + 1}. Texto: "${btn.textContent?.trim()}", Clase: "${btn.className}"`);
  });
  
  // Verificar diálogos
  const dialogs = document.querySelectorAll('[role="dialog"]');
  console.log(`💬 Diálogos encontrados: ${dialogs.length}`);
  
  // Verificar si hay errores de JavaScript
  const errorLogs = [];
  const originalError = console.error;
  console.error = function(...args) {
    errorLogs.push(args);
    originalError.apply(console, args);
  };
  
  // Simular clic en el primer botón de eliminar encontrado
  if (deleteButtonsFiltered.length > 0) {
    console.log('🖱️ Simulando clic en el primer botón de eliminar...');
    const firstDeleteBtn = deleteButtonsFiltered[0];
    
    // Verificar si el botón está deshabilitado
    if (firstDeleteBtn.disabled) {
      console.log('⚠️ El botón está deshabilitado');
    } else {
      console.log('✅ El botón está habilitado, procediendo con el clic...');
      firstDeleteBtn.click();
      
      // Esperar un poco y verificar si se abrió el diálogo
      setTimeout(() => {
        const dialogsAfterClick = document.querySelectorAll('[role="dialog"]');
        console.log(`💬 Diálogos después del clic: ${dialogsAfterClick.length}`);
        
        if (dialogsAfterClick.length > dialogs.length) {
          console.log('✅ Diálogo de confirmación se abrió correctamente');
        } else {
          console.log('❌ Diálogo de confirmación NO se abrió');
        }
      }, 500);
    }
  } else {
    console.log('❌ No se encontraron botones de eliminación');
  }
  
  // Restaurar console.error
  console.error = originalError;
  
  console.log('🔍 === FIN DEL DIAGNÓSTICO ===');
}

// Función para verificar el estado de los estados React
function checkReactStates() {
  console.log('🔍 Verificando estados de React...');
  
  // Buscar elementos que puedan contener estados
  const reactElements = document.querySelectorAll('[data-reactroot], [data-react-helmet]');
  console.log(`⚛️ Elementos React encontrados: ${reactElements.length}`);
  
  // Verificar si hay algún error en el estado
  const errorElements = document.querySelectorAll('[data-error], .error, .text-red-500');
  console.log(`❌ Elementos de error encontrados: ${errorElements.length}`);
}

// Función para probar la eliminación paso a paso
async function testDeleteStepByStep() {
  console.log('🧪 === PRUEBA PASO A PASO DE ELIMINACIÓN ===');
  
  try {
    // Paso 1: Verificar que estamos en la página correcta
    const currentUrl = window.location.href;
    console.log(`📍 URL actual: ${currentUrl}`);
    
    if (!currentUrl.includes('/reservas')) {
      console.log('❌ No estamos en la página de reservas');
      return;
    }
    
    // Paso 2: Verificar que hay reservas en la página
    const reservationRows = document.querySelectorAll('tr, [data-reservation-id]');
    console.log(`📋 Filas de reservas encontradas: ${reservationRows.length}`);
    
    if (reservationRows.length === 0) {
      console.log('❌ No hay reservas visibles en la página');
      return;
    }
    
    // Paso 3: Buscar el menú desplegable de acciones
    const dropdownMenus = document.querySelectorAll('[role="menu"], .dropdown-menu');
    console.log(`📋 Menús desplegables encontrados: ${dropdownMenus.length}`);
    
    // Paso 4: Buscar específicamente el botón de eliminar
    const deleteMenuItems = document.querySelectorAll('[role="menuitem"]');
    const deleteItems = Array.from(deleteMenuItems).filter(item => 
      item.textContent?.includes('Eliminar') || 
      item.textContent?.includes('Trash')
    );
    
    console.log(`🗑️ Elementos de menú de eliminación: ${deleteItems.length}`);
    
    if (deleteItems.length > 0) {
      console.log('✅ Encontrado elemento de eliminación, simulando clic...');
      deleteItems[0].click();
      
      // Esperar y verificar resultado
      setTimeout(() => {
        const confirmDialogs = document.querySelectorAll('[role="dialog"]');
        console.log(`💬 Diálogos de confirmación: ${confirmDialogs.length}`);
        
        if (confirmDialogs.length > 0) {
          console.log('✅ Diálogo de confirmación apareció');
          
          // Buscar botón de confirmar eliminación
          const confirmButtons = document.querySelectorAll('button');
          const deleteConfirmBtn = Array.from(confirmButtons).find(btn => 
            btn.textContent?.includes('Eliminar') && 
            btn.className?.includes('destructive')
          );
          
          if (deleteConfirmBtn) {
            console.log('✅ Botón de confirmar eliminación encontrado');
            console.log('⚠️ NO hacer clic automáticamente por seguridad');
          } else {
            console.log('❌ Botón de confirmar eliminación NO encontrado');
          }
        } else {
          console.log('❌ Diálogo de confirmación NO apareció');
        }
      }, 1000);
    } else {
      console.log('❌ No se encontraron elementos de eliminación');
    }
    
  } catch (error) {
    console.error('❌ Error durante la prueba:', error);
  }
  
  console.log('🧪 === FIN DE LA PRUEBA ===');
}

// Exportar funciones para uso manual
window.debugDeleteReservation = debugDeleteReservation;
window.checkReactStates = checkReactStates;
window.testDeleteStepByStep = testDeleteStepByStep;

console.log('🔧 Parche aplicado. Funciones disponibles:');
console.log('- debugDeleteReservation(): Diagnóstico completo');
console.log('- checkReactStates(): Verificar estados de React');
console.log('- testDeleteStepByStep(): Prueba paso a paso');
console.log('');
console.log('💡 Ejecuta debugDeleteReservation() para comenzar el diagnóstico');
