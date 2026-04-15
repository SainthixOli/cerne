/**
 * TESTE DE IMPORTAÇÃO - Validar que todos módulos carregam sem erro
 */

console.log('\n=== 🧪 TESTE DE IMPORTAÇÃO DOS MÓDULOS ===\n');

const tests = [];

// Teste 1: resourceOwnership
try {
    require('./src/middlewares/resourceOwnership');
    tests.push({ name: 'resourceOwnership', status: '✅' });
} catch (e) {
    tests.push({ name: 'resourceOwnership', status: '❌', error: e.message });
}

// Teste 2: upload
try {
    require('./src/middlewares/upload');
    tests.push({ name: 'upload', status: '✅' });
} catch (e) {
    tests.push({ name: 'upload', status: '❌', error: e.message });
}

// Teste 3: rateLimiting
try {
    require('./src/middlewares/rateLimiting');
    tests.push({ name: 'rateLimiting', status: '✅' });
} catch (e) {
    tests.push({ name: 'rateLimiting', status: '❌', error: e.message });
}

// Teste 4: csrf
try {
    require('./src/middlewares/csrf');
    tests.push({ name: 'csrf', status: '✅' });
} catch (e) {
    tests.push({ name: 'csrf', status: '❌', error: e.message });
}

// Teste 5: auth middleware (existente, mas testando integração)
try {
    require('./src/middlewares/auth');
    tests.push({ name: 'auth (existente)', status: '✅' });
} catch (e) {
    tests.push({ name: 'auth (existente)', status: '❌', error: e.message });
}

// Teste 6: errorHandler
try {
    require('./src/middlewares/errorHandler');
    tests.push({ name: 'errorHandler', status: '✅' });
} catch (e) {
    tests.push({ name: 'errorHandler', status: '❌', error: e.message });
}

// Exibir resultados
console.log('MÓDULOS TESTADOS:');
console.log('───────────────────────────────────────');

let passed = 0;
let failed = 0;

tests.forEach(test => {
    if (test.status === '✅') {
        console.log(`${test.status} ${test.name}`);
        passed++;
    } else {
        console.log(`${test.status} ${test.name}`);
        console.log(`   └─ Erro: ${test.error}`);
        failed++;
    }
});

console.log('───────────────────────────────────────');
console.log(`RESULTADO: ${passed}/${tests.length} módulos carregados com sucesso\n`);

if (failed === 0) {
    console.log('✅ TODOS OS MÓDULOS ESTÃO OPERACIONAIS!\n');
    process.exit(0);
} else {
    console.log(`❌ ${failed} módulo(s) com erro\n`);
    process.exit(1);
}
