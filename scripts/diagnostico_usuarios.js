const { initializeApp } = require('firebase/app');
const { getFirestore, collection, getDocs, query, where, orderBy, limit } = require('firebase/firestore');

// Configuración de Firebase (necesitarás tu propia configuración)
const firebaseConfig = {
  // Aquí va tu configuración de Firebase
  // apiKey, authDomain, projectId, etc.
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

async function diagnosticarUsuarios() {
  console.log('🔍 INICIANDO DIAGNÓSTICO DE USUARIOS...\n');
  
  try {
    // 1. Contar total de usuarios en la colección
    console.log('1️⃣ CONTANDO TOTAL DE USUARIOS...');
    const usuariosRef = collection(db, 'usuarios');
    const snapshotTotal = await getDocs(usuariosRef);
    console.log(`   Total de usuarios en colección: ${snapshotTotal.size}\n`);
    
    // 2. Contar usuarios por estado
    console.log('2️⃣ CONTANDO USUARIOS POR ESTADO...');
    const estados = ['pending', 'approved', 'rejected', 'inactive'];
    for (const estado of estados) {
      const q = query(usuariosRef, where('status', '==', estado));
      const snap = await getDocs(q);
      console.log(`   ${estado}: ${snap.size} usuarios`);
    }
    console.log();
    
    // 3. Contar usuarios por rol
    console.log('3️⃣ CONTANDO USUARIOS POR ROL...');
    const roles = ['admin', 'resident', 'security', 'guest'];
    for (const rol of roles) {
      const q = query(usuariosRef, where('role', '==', rol));
      const snap = await getDocs(q);
      console.log(`   ${rol}: ${snap.size} usuarios`);
    }
    console.log();
    
    // 4. Contar usuarios por residencial
    console.log('4️⃣ CONTANDO USUARIOS POR RESIDENCIAL...');
    const residenciales = new Map();
    snapshotTotal.forEach(doc => {
      const data = doc.data();
      const residencialId = data.residencialID || 'sin_residencial';
      residenciales.set(residencialId, (residenciales.get(residencialId) || 0) + 1);
    });
    
    console.log('   Usuarios por residencial:');
    residenciales.forEach((count, residencialId) => {
      console.log(`     ${residencialId}: ${count} usuarios`);
    });
    console.log();
    
    // 5. Verificar usuarios con campos faltantes
    console.log('5️⃣ VERIFICANDO USUARIOS CON CAMPOS FALTANTES...');
    let usuariosSinEmail = 0;
    let usuariosSinNombre = 0;
    let usuariosSinResidencial = 0;
    
    snapshotTotal.forEach(doc => {
      const data = doc.data();
      if (!data.email) usuariosSinEmail++;
      if (!data.fullName) usuariosSinNombre++;
      if (!data.residencialID) usuariosSinResidencial++;
    });
    
    console.log(`   Sin email: ${usuariosSinEmail}`);
    console.log(`   Sin nombre: ${usuariosSinNombre}`);
    console.log(`   Sin residencial: ${usuariosSinResidencial}`);
    console.log();
    
    // 6. Mostrar algunos usuarios de ejemplo
    console.log('6️⃣ MUESTRAS DE USUARIOS...');
    const usuariosEjemplo = snapshotTotal.docs.slice(0, 5);
    usuariosEjemplo.forEach((doc, index) => {
      const data = doc.data();
      console.log(`   Usuario ${index + 1}:`);
      console.log(`     ID: ${doc.id}`);
      console.log(`     Email: ${data.email || 'N/A'}`);
      console.log(`     Nombre: ${data.fullName || 'N/A'}`);
      console.log(`     Rol: ${data.role || 'N/A'}`);
      console.log(`     Estado: ${data.status || 'N/A'}`);
      console.log(`     Residencial: ${data.residencialID || 'N/A'}`);
      console.log(`     Creado: ${data.createdAt ? data.createdAt.toDate() : 'N/A'}`);
      console.log('');
    });
    
    // 7. Verificar límites de consultas
    console.log('7️⃣ VERIFICANDO LÍMITES DE CONSULTAS...');
    const qLimit50 = query(usuariosRef, orderBy('createdAt', 'desc'), limit(50));
    const snapLimit50 = await getDocs(qLimit50);
    console.log(`   Consulta con límite 50: ${snapLimit50.size} usuarios`);
    
    const qLimit100 = query(usuariosRef, orderBy('createdAt', 'desc'), limit(100));
    const snapLimit100 = await getDocs(qLimit100);
    console.log(`   Consulta con límite 100: ${snapLimit100.size} usuarios`);
    
    const qLimit1000 = query(usuariosRef, orderBy('createdAt', 'desc'), limit(1000));
    const snapLimit1000 = await getDocs(qLimit1000);
    console.log(`   Consulta con límite 1000: ${snapLimit1000.size} usuarios`);
    console.log();
    
    // 8. Recomendaciones
    console.log('8️⃣ RECOMENDACIONES...');
    if (snapshotTotal.size > 50) {
      console.log('   ⚠️  Tienes más de 50 usuarios, pero la función getUsuarios solo carga 50 por defecto');
      console.log('   💡  Considera aumentar el límite o implementar paginación');
    }
    
    if (residenciales.size > 1) {
      console.log('   ⚠️  Tienes usuarios en múltiples residenciales');
      console.log('   💡  Verifica que estés viendo el residencial correcto');
    }
    
    console.log('   💡  Revisa la consola del navegador para ver logs de carga de usuarios');
    console.log('   💡  Verifica que tu usuario tenga el estado "approved"');
    
  } catch (error) {
    console.error('❌ Error durante el diagnóstico:', error);
  }
}

// Ejecutar diagnóstico
diagnosticarUsuarios().then(() => {
  console.log('✅ Diagnóstico completado');
  process.exit(0);
}).catch(error => {
  console.error('❌ Error fatal:', error);
  process.exit(1);
});
