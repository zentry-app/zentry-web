// Script de diagnóstico avanzado para el problema del diálogo
// Ejecutar en la consola del navegador

console.log('🔍 === DIAGNÓSTICO AVANZADO DEL DIÁLOGO ===');

// Función para verificar el estado del DOM
function checkDialogInDOM() {
  console.log('🔍 Verificando elementos en el DOM...');
  
  // Buscar todos los elementos con role="dialog"
  const dialogs = document.querySelectorAll('[role="dialog"]');
  console.log(`💬 Diálogos encontrados en DOM: ${dialogs.length}`);
  
  dialogs.forEach((dialog, index) => {
    const rect = dialog.getBoundingClientRect();
    const styles = window.getComputedStyle(dialog);
    
    console.log(`📋 Diálogo ${index + 1}:`, {
      visible: styles.display !== 'none' && styles.visibility !== 'hidden',
      opacity: styles.opacity,
      zIndex: styles.zIndex,
      position: styles.position,
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
      textContent: dialog.textContent?.substring(0, 100) + '...'
    });
  });
  
  // Buscar específicamente el diálogo de eliminación
  const deleteDialogs = document.querySelectorAll('[role="dialog"]');
  const deleteDialog = Array.from(deleteDialogs).find(dialog => 
    dialog.textContent?.includes('Eliminar reserva') || 
    dialog.textContent?.includes('¿Estás seguro')
  );
  
  if (deleteDialog) {
    console.log('✅ Diálogo de eliminación encontrado en DOM');
    const rect = deleteDialog.getBoundingClientRect();
    const styles = window.getComputedStyle(deleteDialog);
    
    console.log('📊 Detalles del diálogo de eliminación:', {
      display: styles.display,
      visibility: styles.visibility,
      opacity: styles.opacity,
      zIndex: styles.zIndex,
      position: styles.position,
      transform: styles.transform,
      width: rect.width,
      height: rect.height,
      top: rect.top,
      left: rect.left,
      isVisible: rect.width > 0 && rect.height > 0
    });
  } else {
    console.log('❌ Diálogo de eliminación NO encontrado en DOM');
  }
  
  // Verificar overlays
  const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
  console.log(`🎭 Overlays encontrados: ${overlays.length}`);
  
  overlays.forEach((overlay, index) => {
    const styles = window.getComputedStyle(overlay);
    console.log(`🎭 Overlay ${index + 1}:`, {
      display: styles.display,
      opacity: styles.opacity,
      zIndex: styles.zIndex
    });
  });
  
  // Verificar portals
  const portals = document.querySelectorAll('[data-radix-portal]');
  console.log(`🚪 Portals encontrados: ${portals.length}`);
  
  return {
    dialogsCount: dialogs.length,
    deleteDialogFound: !!deleteDialog,
    overlaysCount: overlays.length,
    portalsCount: portals.length
  };
}

// Función para forzar la visibilidad del diálogo
function forceDialogVisibility() {
  console.log('🔧 Intentando forzar visibilidad del diálogo...');
  
  const dialogs = document.querySelectorAll('[role="dialog"]');
  const deleteDialog = Array.from(dialogs).find(dialog => 
    dialog.textContent?.includes('Eliminar reserva')
  );
  
  if (deleteDialog) {
    console.log('✅ Diálogo encontrado, aplicando estilos forzados...');
    
    // Aplicar estilos para forzar visibilidad
    deleteDialog.style.display = 'block';
    deleteDialog.style.visibility = 'visible';
    deleteDialog.style.opacity = '1';
    deleteDialog.style.zIndex = '9999';
    deleteDialog.style.position = 'fixed';
    deleteDialog.style.top = '50%';
    deleteDialog.style.left = '50%';
    deleteDialog.style.transform = 'translate(-50%, -50%)';
    deleteDialog.style.backgroundColor = 'white';
    deleteDialog.style.border = '2px solid red';
    deleteDialog.style.padding = '20px';
    deleteDialog.style.borderRadius = '8px';
    deleteDialog.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
    
    console.log('🎨 Estilos aplicados al diálogo');
    
    // También verificar y mostrar overlays
    const overlays = document.querySelectorAll('[data-radix-dialog-overlay]');
    overlays.forEach(overlay => {
      overlay.style.display = 'block';
      overlay.style.opacity = '0.8';
      overlay.style.zIndex = '9998';
    });
    
    console.log('🎭 Overlays también forzados a ser visibles');
  } else {
    console.log('❌ No se encontró el diálogo de eliminación para forzar visibilidad');
  }
}

// Función para crear un diálogo de prueba
function createTestDialog() {
  console.log('🧪 Creando diálogo de prueba...');
  
  // Crear overlay
  const overlay = document.createElement('div');
  overlay.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.8);
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  // Crear contenido del diálogo
  const dialog = document.createElement('div');
  dialog.style.cssText = `
    background: white;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 20px rgba(0,0,0,0.3);
    max-width: 400px;
    width: 90%;
  `;
  
  dialog.innerHTML = `
    <h3 style="margin: 0 0 15px 0; color: #333;">🧪 Diálogo de Prueba</h3>
    <p style="margin: 0 0 20px 0; color: #666;">Este es un diálogo de prueba para verificar que los diálogos pueden mostrarse correctamente.</p>
    <div style="display: flex; gap: 10px; justify-content: flex-end;">
      <button onclick="this.closest('.test-dialog').remove()" style="padding: 8px 16px; border: 1px solid #ccc; background: white; border-radius: 4px; cursor: pointer;">Cancelar</button>
      <button onclick="alert('¡Diálogo de prueba funcionando!'); this.closest('.test-dialog').remove()" style="padding: 8px 16px; background: #dc3545; color: white; border: none; border-radius: 4px; cursor: pointer;">Confirmar</button>
    </div>
  `;
  
  overlay.appendChild(dialog);
  overlay.className = 'test-dialog';
  document.body.appendChild(overlay);
  
  console.log('✅ Diálogo de prueba creado');
}

// Función para verificar estilos CSS conflictivos
function checkCSSConflicts() {
  console.log('🎨 Verificando conflictos CSS...');
  
  // Verificar si hay estilos que oculten diálogos
  const allStyles = Array.from(document.styleSheets);
  let conflictFound = false;
  
  allStyles.forEach((styleSheet, index) => {
    try {
      const rules = Array.from(styleSheet.cssRules || styleSheet.rules || []);
      rules.forEach(rule => {
        if (rule.selectorText && (
          rule.selectorText.includes('[role="dialog"]') ||
          rule.selectorText.includes('.dialog') ||
          rule.selectorText.includes('[data-radix-dialog]')
        )) {
          console.log(`🎨 Regla CSS encontrada: ${rule.selectorText}`, {
            display: rule.style.display,
            visibility: rule.style.visibility,
            opacity: rule.style.opacity
          });
          
          if (rule.style.display === 'none' || rule.style.visibility === 'hidden') {
            console.log('⚠️ Posible conflicto CSS detectado');
            conflictFound = true;
          }
        }
      });
    } catch (e) {
      // Ignorar errores de CORS
    }
  });
  
  if (!conflictFound) {
    console.log('✅ No se encontraron conflictos CSS obvios');
  }
  
  return conflictFound;
}

// Ejecutar diagnóstico completo
console.log('🚀 Ejecutando diagnóstico completo...');

const domCheck = checkDialogInDOM();
const cssConflicts = checkCSSConflicts();

console.log('📊 Resumen del diagnóstico:', {
  ...domCheck,
  cssConflicts
});

// Exportar funciones para uso manual
window.checkDialogInDOM = checkDialogInDOM;
window.forceDialogVisibility = forceDialogVisibility;
window.createTestDialog = createTestDialog;
window.checkCSSConflicts = checkCSSConflicts;

console.log('');
console.log('🔧 Funciones disponibles:');
console.log('- checkDialogInDOM(): Verificar estado del DOM');
console.log('- forceDialogVisibility(): Forzar visibilidad del diálogo');
console.log('- createTestDialog(): Crear diálogo de prueba');
console.log('- checkCSSConflicts(): Verificar conflictos CSS');
console.log('');
console.log('💡 Próximo paso: Ejecuta checkDialogInDOM() para ver el estado actual');
