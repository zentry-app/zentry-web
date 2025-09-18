// Solución temporal para el problema de eliminación de reservas
// Este código debe agregarse al componente de reservas para debugging

// Función mejorada de eliminación con debugging
const deleteReservationWithDebug = async (reservationId: string) => {
  console.log('🔍 [DEBUG] Iniciando eliminación de reserva:', reservationId);
  
  try {
    // Verificar que la reserva existe
    const reservation = reservations.find(r => r.id === reservationId);
    if (!reservation) {
      console.error('❌ [DEBUG] Reserva no encontrada:', reservationId);
      toast({ title: 'Error', description: 'Reserva no encontrada.', variant: 'destructive' });
      return;
    }
    
    console.log('✅ [DEBUG] Reserva encontrada:', reservation);
    
    // Verificar permisos de usuario
    if (!user || !userClaims) {
      console.error('❌ [DEBUG] Usuario no autenticado o sin claims');
      toast({ title: 'Error', description: 'No tienes permisos para eliminar reservas.', variant: 'destructive' });
      return;
    }
    
    console.log('✅ [DEBUG] Usuario autenticado:', user.email);
    
    // Crear batch de eliminación
    const batch = writeBatch(db);
    const residentialRef = doc(db, 'residenciales', reservation.residencialId, 'reservaciones', reservationId);
    const userRef = doc(db, 'usuarios', reservation.userId, 'reservaciones', reservationId);
    
    console.log('📝 [DEBUG] Referencias creadas:', {
      residential: residentialRef.path,
      user: userRef.path
    });
    
    batch.delete(residentialRef);
    batch.delete(userRef);
    
    console.log('🔄 [DEBUG] Ejecutando batch de eliminación...');
    await batch.commit();
    
    console.log('✅ [DEBUG] Batch ejecutado exitosamente');
    
    // Actualizar estado local
    setReservations(prev => {
      const filtered = prev.filter(r => r.id !== reservationId);
      console.log('📊 [DEBUG] Reservas actualizadas:', filtered.length);
      return filtered;
    });
    
    toast({ title: 'Eliminada', description: 'La reserva fue eliminada correctamente.' });
    console.log('🎉 [DEBUG] Eliminación completada exitosamente');
    
  } catch (error) {
    console.error('❌ [DEBUG] Error eliminando reserva:', error);
    
    // Proporcionar información más detallada del error
    if (error.code) {
      console.error('📋 [DEBUG] Código de error:', error.code);
    }
    if (error.message) {
      console.error('📋 [DEBUG] Mensaje de error:', error.message);
    }
    
    toast({ 
      title: 'Error', 
      description: `No se pudo eliminar la reserva: ${error.message || 'Error desconocido'}`, 
      variant: 'destructive' 
    });
  }
};

// Función para verificar el estado del diálogo
const checkDeleteDialogState = () => {
  console.log('🔍 [DEBUG] Estado del diálogo de eliminación:', {
    deleteDialogOpen,
    deleteTargetId,
    reservationsCount: reservations.length
  });
  
  // Verificar si el diálogo está en el DOM
  const dialogElement = document.querySelector('[role="dialog"]');
  if (dialogElement) {
    console.log('✅ [DEBUG] Diálogo encontrado en DOM');
    console.log('📋 [DEBUG] Estilos del diálogo:', {
      display: dialogElement.style.display,
      visibility: dialogElement.style.visibility,
      opacity: dialogElement.style.opacity
    });
  } else {
    console.log('❌ [DEBUG] Diálogo NO encontrado en DOM');
  }
};

// Función para simular la apertura del diálogo
const simulateDeleteDialog = (reservationId: string) => {
  console.log('🧪 [DEBUG] Simulando apertura de diálogo para:', reservationId);
  
  setDeleteTargetId(reservationId);
  setDeleteDialogOpen(true);
  
  // Verificar después de un breve delay
  setTimeout(() => {
    checkDeleteDialogState();
  }, 100);
};

// Exportar funciones para debugging
if (typeof window !== 'undefined') {
  window.deleteReservationWithDebug = deleteReservationWithDebug;
  window.checkDeleteDialogState = checkDeleteDialogState;
  window.simulateDeleteDialog = simulateDeleteDialog;
}
