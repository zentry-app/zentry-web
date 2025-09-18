// Script de diagnóstico para probar la eliminación de reservas
// Ejecutar en la consola del navegador en la página de reservas

console.log('🔍 Iniciando diagnóstico de eliminación de reservas...');

// Función para probar la eliminación
async function testDeleteReservation() {
  try {
    console.log('📋 Verificando configuración de Firebase...');
    
    // Verificar si Firebase está disponible
    if (typeof window !== 'undefined' && window.firebase) {
      console.log('✅ Firebase está disponible');
    } else {
      console.log('❌ Firebase no está disponible en window');
    }
    
    // Verificar si hay reservas disponibles
    const reservations = document.querySelectorAll('[data-reservation-id]');
    console.log(`📊 Reservas encontradas en DOM: ${reservations.length}`);
    
    if (reservations.length === 0) {
      console.log('⚠️ No se encontraron reservas en el DOM');
      return;
    }
    
    // Verificar si los botones de eliminación están presentes
    const deleteButtons = document.querySelectorAll('[data-testid="delete-reservation"], .text-red-600');
    console.log(`🗑️ Botones de eliminación encontrados: ${deleteButtons.length}`);
    
    // Verificar diálogos de confirmación
    const deleteDialogs = document.querySelectorAll('[role="dialog"]');
    console.log(`💬 Diálogos encontrados: ${deleteDialogs.length}`);
    
    // Verificar errores en la consola
    console.log('🔍 Revisando errores recientes...');
    
    // Función para interceptar errores
    const originalError = console.error;
    const errors = [];
    console.error = function(...args) {
      errors.push(args);
      originalError.apply(console, args);
    };
    
    console.log('✅ Diagnóstico completado. Revisa los logs arriba para más detalles.');
    
    return {
      reservationsCount: reservations.length,
      deleteButtonsCount: deleteButtons.length,
      dialogsCount: deleteDialogs.length,
      errors: errors
    };
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  }
}

// Ejecutar diagnóstico
testDeleteReservation();

// Función para simular clic en eliminar
function simulateDeleteClick() {
  const deleteButton = document.querySelector('.text-red-600');
  if (deleteButton) {
    console.log('🖱️ Simulando clic en botón de eliminar...');
    deleteButton.click();
  } else {
    console.log('❌ No se encontró botón de eliminar');
  }
}

// Función para verificar el estado del diálogo
function checkDialogState() {
  const dialogs = document.querySelectorAll('[role="dialog"]');
  dialogs.forEach((dialog, index) => {
    const isVisible = dialog.style.display !== 'none' && !dialog.hasAttribute('hidden');
    console.log(`💬 Diálogo ${index + 1}: ${isVisible ? 'visible' : 'oculto'}`);
  });
}

console.log('📝 Funciones disponibles:');
console.log('- testDeleteReservation(): Ejecutar diagnóstico completo');
console.log('- simulateDeleteClick(): Simular clic en eliminar');
console.log('- checkDialogState(): Verificar estado de diálogos');
