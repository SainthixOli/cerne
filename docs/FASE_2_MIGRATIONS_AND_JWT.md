# 🚀 FASE 2 - EXECUTAR MIGRATIONS & PREPARAR JWT

**Status**: 🟡 EM PREPARAÇÃO (Próximo passo)  
**Duração estimada**: 2-3 dias  
**Data de início**: 8 de Maio de 2026  

---

## 📋 Tarefas da FASE 2

### Tarefa 1: Executar Migrations (Banco de Dados Local)

#### 1.1 Verificar Status das Migrations

```bash
# Entrar na pasta backend
cd backend

# Listar todas as migrations e seu status
npx knex migrate:status

# Saída esperada:
# ✓ 20250105000001_initial_schema.js
# ✓ 20250105000002_audit_schema.js
# ✓ 20260129_add_protocol_fields.js
# ✓ 20260203_add_transfer_status.js
# ✓ 20260203_restore_missing_columns.js
# ✓ 20260203_update_status_check.js
# ⊙ 20260507_001_create_tenants_table.js        [PENDING]
# ⊙ 20260507_002_add_tenant_id_to_main_tables.js [PENDING]
# ⊙ 20260507_003_add_tenant_id_to_communication_tables.js [PENDING]
# ⊙ 20260507_004_add_tenant_id_to_audit_and_system_tables.js [PENDING]
```

#### 1.2 Executar Migrations Pendentes

```bash
# Executar todas as migrations pendentes
npx knex migrate:latest

# Saída esperada:
# Batch 3
# ✓ 20260507_001_create_tenants_table.js
# ✓ 20260507_002_add_tenant_id_to_main_tables.js
# ✓ 20260507_003_add_tenant_id_to_communication_tables.js
# ✓ 20260507_004_add_tenant_id_to_audit_and_system_tables.js
```

#### 1.3 Verificar Schema Criado

```bash
# Verificar tabela 'tenants'
npx knex raw "SELECT * FROM tenants;" 2>/dev/null || echo "Nenhum tenant ainda"

# Verificar coluna tenant_id em 'filiacoes'
npx knex raw "PRAGMA table_info(filiacoes);" | grep tenant_id

# Saída esperada:
# 12|tenant_id|INTEGER|0||0
```

---

### Tarefa 2: Criar Seed de Teste

#### 2.1 Criar arquivo seed

**Arquivo**: `backend/db/seeds/seed_initial_tenant.js`

```javascript
const { nanoid } = require('nanoid');

exports.seed = async (knex) => {
    // 1. Limpar tabelas (apenas para development)
    if (process.env.NODE_ENV === 'development') {
        // Não limpar - apenas popular se não existir
    }

    // 2. Verificar se tenant já existe
    const existingTenant = await knex('tenants').where('slug', 'sindicato-principal').first();
    if (existingTenant) {
        console.log('✅ Tenant "sindicato-principal" já existe, pulando seed');
        return;
    }

    // 3. Criar tenant principal
    const [tenantId] = await knex('tenants').insert({
        name: 'Sindicato Principal',
        slug: 'sindicato-principal',
        status: 'active',
        plan: 'pro',
        database_url: null,  // Multi-tenant mesmo banco
        storage_used_gb: 0,
        users_count: 0,
        technical_admin_id: null
    });

    console.log(`✅ Tenant criado com ID: ${tenantId}`);

    // 4. Atualizar todos os registros existentes com tenant_id = tenantId
    // (Para dados legado que não têm tenant_id)
    
    await knex('profiles').whereNull('tenant_id').update({ tenant_id: tenantId });
    console.log('✅ Profiles atualizados com tenant_id');

    await knex('filiacoes').whereNull('tenant_id').update({ tenant_id: tenantId });
    console.log('✅ Filiacoes atualizadas com tenant_id');

    await knex('documentos').whereNull('tenant_id').update({ tenant_id: tenantId });
    console.log('✅ Documentos atualizados com tenant_id');

    await knex('conversations').whereNull('tenant_id').update({ tenant_id: tenantId });
    console.log('✅ Conversations atualizadas com tenant_id');

    await knex('messages').whereNull('tenant_id').update({ tenant_id: tenantId });
    console.log('✅ Messages atualizadas com tenant_id');

    await knex('filiation_chat').whereNull('tenant_id').update({ tenant_id: tenantId });
    console.log('✅ Filiation_chat atualizadas com tenant_id');

    await knex('notifications').whereNull('tenant_id').update({ tenant_id: tenantId });
    console.log('✅ Notifications atualizadas com tenant_id');

    await knex('admin_evaluations').whereNull('tenant_id').update({ tenant_id: tenantId });
    console.log('✅ Admin_evaluations atualizadas com tenant_id');

    await knex('system_settings').whereNull('tenant_id').update({ tenant_id: tenantId });
    console.log('✅ System_settings atualizadas com tenant_id');

    // 5. Associar super admin
    // Pegar primeiro admin existente
    const superAdmin = await knex('profiles')
        .where('role', 'admin')
        .orWhere('role', 'system_admin')
        .first();

    if (superAdmin) {
        await knex('tenant_super_admins').insert({
            tenant_id: tenantId,
            user_id: superAdmin.id
        });
        console.log(`✅ Super admin ${superAdmin.id} associado ao tenant`);
    }

    console.log('\n✅ Seed concluído - Tenant pronto para multi-tenant!');
};
```

#### 2.2 Executar Seed

```bash
# Executar seed de teste
npx knex seed:run --specific seed_initial_tenant.js

# Saída esperada:
# ✅ Tenant criado com ID: 1
# ✅ Profiles atualizados com tenant_id
# ✅ Filiacoes atualizadas com tenant_id
# ... (mais actualizações)
# ✅ Super admin XYZ associado ao tenant
# ✅ Seed concluído - Tenant pronto para multi-tenant!
```

---

### Tarefa 3: Modificar JWT para incluir tenantId

#### 3.1 Atualizar authService.js

**Arquivo**: `backend/src/services/authService.js`

```javascript
// ANTES:
async function generateToken(user) {
    return jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role
    }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
}

// DEPOIS:
async function generateToken(user) {
    // Buscar tenant do usuário
    const superAdminRecord = await knex('tenant_super_admins')
        .where('user_id', user.id)
        .first();

    // Se usuário não tiver tenant, usar tenant padrão (1)
    const tenantId = superAdminRecord?.tenant_id || 1;

    return jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: tenantId  // ✅ NOVO: adicionar tenantId ao JWT
    }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
}

// TAMBÉM: Atualizar função de refresh token
async function refreshToken(oldToken) {
    const decoded = jwt.decode(oldToken);
    
    // Gerar novo token com tenantId
    const user = await knex('profiles').where('id', decoded.id).first();
    return generateToken(user);
}
```

#### 3.2 Atualizar authController.js

```javascript
// ANTES:
const token = await generateToken(user);
res.json({ 
    token,
    user: { id: user.id, email: user.email, role: user.role }
});

// DEPOIS:
const superAdminRecord = await knex('tenant_super_admins')
    .where('user_id', user.id)
    .first();

const token = await generateToken(user);
res.json({ 
    token,
    user: { 
        id: user.id, 
        email: user.email, 
        role: user.role,
        tenantId: superAdminRecord?.tenant_id || 1  // ✅ NOVO
    }
});
```

---

### Tarefa 4: Integrar Middlewares nas Routes

#### 4.1 Atualizar backend/src/routes/index.js

```javascript
// No topo do arquivo, importar middlewares
const { tenantMiddleware, validateTenantIdPresent } = require('../middlewares/tenantMiddleware');
const { validateResourceTenant, ensureTenantIsolation } = require('../middlewares/tenantValidation');
const { auditTenantAction, tenantRateLimit, detectSuspiciousActivity } = require('../middlewares/tenantSecurity');

// Aplicar rate limiting por tenant em TODAS as rotas
router.use(tenantRateLimit(1000, 60000)); // 1000 req/min por tenant

// ROTAS DE AFFILIAÇÃO - Exemplo completo
router.get('/affiliations',
    authenticate,
    tenantMiddleware,
    ensureTenantIsolation,
    affiliationController.getAll
);

router.get('/affiliations/:id',
    authenticate,
    tenantMiddleware,
    validateResourceTenant('filiacoes', 'id'),
    affiliationController.getById
);

router.post('/affiliations',
    authenticate,
    tenantMiddleware,
    auditTenantAction('CREATE_FILIACAO', (req) => `Created filiation for ${req.body.user_name}`),
    detectSuspiciousActivity,
    affiliationController.create
);

router.put('/affiliations/:id',
    authenticate,
    tenantMiddleware,
    validateResourceTenant('filiacoes', 'id'),
    auditTenantAction('UPDATE_FILIACAO', (req) => `Updated filiation ${req.params.id}`),
    detectSuspiciousActivity,
    affiliationController.update
);

router.delete('/affiliations/:id',
    authenticate,
    tenantMiddleware,
    validateResourceTenant('filiacoes', 'id'),
    auditTenantAction('DELETE_FILIACAO', (req) => `Deleted filiation ${req.params.id}`),
    detectSuspiciousActivity,
    affiliationController.delete
);

// ROTAS DE DOCUMENTO
router.get('/documents',
    authenticate,
    tenantMiddleware,
    ensureTenantIsolation,
    documentController.getAll
);

router.get('/documents/:id',
    authenticate,
    tenantMiddleware,
    validateResourceTenant('documentos', 'id'),
    documentController.getById
);

// ... aplicar mesmo padrão para TODAS as rotas
```

---

### Tarefa 5: Testar Multi-Tenant (Local)

#### 5.1 Teste de Isolamento de Dados

```bash
# Terminal 1: Iniciar servidor
cd backend && npm start

# Terminal 2: Fazer requisição

# 1. Login e obter token
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "password"
  }'

# Resposta esperada:
# {
#   "token": "eyJhbGc...",
#   "user": {
#     "id": "user-123",
#     "email": "admin@example.com",
#     "role": "admin",
#     "tenantId": 1  ✅ NOVO
#   }
# }

# 2. Usar token para acessar dados com tenant_id
curl -H "Authorization: Bearer TOKEN_AQUI" \
  http://localhost:3001/affiliations

# Resposta esperada: Apenas filiacoes com tenant_id = 1
```

#### 5.2 Teste de Cross-Tenant Bloqueado

```bash
# Se existir tenant_id = 2, tentar acessar com token do tenant 1 deve falhar
curl -H "Authorization: Bearer TOKEN_TENANT_1" \
  http://localhost:3001/affiliations/FILIACAO_ID_TENANT_2

# Resposta esperada (403):
# {
#   "error": "Access denied",
#   "message": "The resource belongs to a different tenant"
# }
```

---

### Tarefa 6: Criar Script de Validação

**Arquivo**: `backend/scripts/validate_migration_phase2.js`

```javascript
const knex = require('../config/database');

async function validatePhase2() {
    console.log('🔍 Validando FASE 2 - Migrations e Estrutura\n');

    try {
        // 1. Verificar tabela 'tenants'
        const tenants = await knex('tenants').count('* as count').first();
        console.log(`✅ Tabela 'tenants' existe e tem ${tenants.count} registros`);

        // 2. Verificar tenant_id em todas as tabelas
        const tables = [
            'profiles', 'filiacoes', 'documentos',
            'conversations', 'messages', 'filiation_chat',
            'notifications', 'admin_evaluations', 'system_settings'
        ];

        for (const table of tables) {
            const columns = await knex.raw(`PRAGMA table_info(${table})`);
            const hasTenantId = columns.some(col => col.name === 'tenant_id');
            
            if (hasTenantId) {
                const count = await knex(table).whereNotNull('tenant_id').count('* as count').first();
                console.log(`✅ ${table}: tenant_id presente (${count.count} registros com tenant_id)`);
            } else {
                console.log(`❌ ${table}: tenant_id FALTA`);
            }
        }

        // 3. Verificar audit_logs
        const auditLogsExists = await knex.schema.hasTable('audit_logs');
        console.log(auditLogsExists ? `✅ Tabela 'audit_logs' criada` : `❌ Tabela 'audit_logs' FALTA`);

        // 4. Verificar índices
        console.log('\n📊 Índices de tenant_id:');
        const profileIndexes = await knex.raw("PRAGMA index_list(profiles)");
        console.log(`Profiles: ${profileIndexes.length} índices`);

        console.log('\n✅ FASE 2 Validação Completa!');
    } catch (error) {
        console.error('❌ Erro na validação:', error.message);
        process.exit(1);
    }

    process.exit(0);
}

validatePhase2();
```

**Executar validação**:
```bash
node backend/scripts/validate_migration_phase2.js
```

---

## 🎯 Checklist de FASE 2

- [ ] Migrations executadas (`npx knex migrate:latest`)
- [ ] Seed de tenant criado e executado
- [ ] JWT modificado para incluir `tenantId`
- [ ] Middlewares de tenant integrados em TODAS as rotas
- [ ] Testes locais passando (isolamento de dados)
- [ ] Script de validação executado com sucesso
- [ ] Documentação atualizada com novos padrões
- [ ] Push para GitHub

---

## 📝 Resultado Esperado após FASE 2

Depois de completar FASE 2, teremos:

✅ **Banco de dados**: 11 tabelas com `tenant_id` + 2 novas tabelas (`audit_logs`, `security_alerts`)  
✅ **JWT**: Inclui `tenantId` do usuário  
✅ **Middlewares**: 3 camadas de segurança funcionando  
✅ **Rotas**: Todas integradas com tenant middleware  
✅ **Dados**: 100% isolados por tenant  
✅ **Auditoria**: Todas as ações registradas com tenant_id  

---

## 🔗 Próxima Fase

**FASE 3**: Modificar os 78 queries para garantir isolamento de dados
- Modificar Controllers (23 queries)
- Modificar Services (20+ queries)
- Modificar Repositories (14 queries)
- Adicionar testes unitários

---

## ⚠️ Notas Importantes

1. **Dados Legado**: Todos os dados existentes ganham `tenant_id = 1` (tenant "principal")
2. **Rollback**: Cada migration tem função `down()` para reverter se necessário
3. **Rate Limiting**: Global de 1000 req/min por tenant (ajustável)
4. **Auditoria**: Todos os DELETE, UPDATE, POST são registrados
5. **Cross-Tenant**: Impossível acessar dados de outro tenant (bloqueado em middleware)

---

**Fase 2 Status**: 🟡 EM PREPARAÇÃO  
**Data de Conclusão Prevista**: 10 de Maio de 2026  
**Próximo Passo**: Executar primeira tarefa (verificar migrations)
