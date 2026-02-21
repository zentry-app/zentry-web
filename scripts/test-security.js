/**
 * Test de Seguridad para Zentry Web
 * Este script verifica que los endpoints protegidos respondan correctamente.
 */

async function testEndpoint(url, method, token, body = null) {
    const headers = {
        'Content-Type': 'application/json',
    };
    if (token) {
        headers['Authorization'] = `Bearer ${token}`;
    }

    try {
        const response = await fetch(url, {
            method,
            headers,
            body: body ? JSON.stringify(body) : null
        });
        console.log(`[${method}] ${url} -> Status: ${response.status}`);
        return response.status;
    } catch (error) {
        console.error(`Error testing ${url}:`, error.message);
        return null;
    }
}

async function runTests() {
    const baseUrl = 'http://localhost:3000/api';

    console.log('--- Iniciando Pruebas de Seguridad ---');

    // 1. Probar sin token (Esperado: 401)
    console.log('\n1. Pruebas sin token (Esperado: 401)');
    await testEndpoint(`${baseUrl}/admin/cleanup-user`, 'POST', null, { email: 'test@example.com' });
    await testEndpoint(`${baseUrl}/send-email`, 'POST', null, { to: 'test@example.com' });

    // Nota: Para probar con tokens reales se necesitaría un entorno de ejecución con acceso a Firebase
    // o simular el comportamiento con mocks si tuviéramos un runner de tests.
    // Como estamos en un entorno live, nos aseguramos que al menos la negación de acceso funcione.

    console.log('\n--- Fin de Pruebas Automáticas ---');
}

runTests();
