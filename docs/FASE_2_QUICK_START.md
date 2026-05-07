# 🚀 FASE 2 - QUICK START

**Status**: Pronto para começar  
**Tempo estimado**: 2-3 dias  
**Data de início**: 8 de Maio de 2026

---

## ⚡ TL;DR - Resumo em 10 segundos

✅ **FASE 1** concluída: Criamos 4 migrations + 3 middlewares + 13 tabelas com isolamento  
🟡 **FASE 2** próximo: Executar migrations, modificar JWT, testar isolamento localmente  
⏳ **FASE 3+**: Modificar 78 queries, criar dashboard, testes e deploy  

---

## 🎯 Tarefas de FASE 2

### 1️⃣ Executar Migrations (30 min)

```bash
cd backend

# Verificar status
npx knex migrate:status

# Executar todas as pending migrations
npx knex migrate:latest
```

**Esperado**:
```
✓ Batch 3
✓ 20260507_001_create_tenants_table.js
✓ 20260507_002_add_tenant_id_to_main_tables.js
✓ 20260507_003_add_tenant_id_to_communication_tables.js
✓ 20260507_004_add_tenant_id_to_audit_and_system_tables.js
```

---

### 2️⃣ Criar e Executar Seed (45 min)

**Copiar esse arquivo para `backend/db/seeds/seed_initial_tenant.js`:**

```javascript
const knex = require('knex')(require('../../knexfile').development);

exports.seed = async (knex) => {
    const existingTenant = await knex('tenants').where('slug', 'sindicato-principal').first();
    if (existingTenant) return;

    const [tenantId] = await knex('tenants').insert({
        name: 'Sindicato Principal',
        slug: 'sindicato-principal',
        status: 'active',
        plan: 'pro'
    });

    // Atualizar dados legado
    await knex('profiles').whereNull('tenant_id').update({ tenant_id: tenantId });
    await knex('filiacoes').whereNull('tenant_id').update({ tenant_id: tenantId });
    await knex('documentos').whereNull('tenant_id').update({ tenant_id: tenantId });
    
    console.log(`✅ Tenant criado: ${tenantId}`);
};
```

**Executar**:
```bash
npx knex seed:run --specific seed_initial_tenant.js
```

---

### 3️⃣ Modificar JWT (1h)

**Arquivo**: `backend/src/services/authService.js`

```javascript
// ADICIONAR ao final do arquivo:

async function addTenantIdToToken(user) {
    const superAdmin = await knex('tenant_super_admins')
        .where('user_id', user.id)
        .first();
    
    return superAdmin?.tenant_id || 1;
}

// MODIFICAR generateToken():
async function generateToken(user) {
    const tenantId = await addTenantIdToToken(user);
    
    return jwt.sign({
        id: user.id,
        email: user.email,
        role: user.role,
        tenantId: tenantId  // ✅ NOVO
    }, process.env.JWT_SECRET, {
        expiresIn: '7d'
    });
}
```

---

### 4️⃣ Integrar Middlewares nas Rotas (1.5h)

**Arquivo**: `backend/src/routes/index.js`

Adicionar no topo:
```javascript
const { tenantMiddleware } = require('../middlewares/tenantMiddleware');
const { ensureTenantIsolation, validateResourceTenant } = require('../middlewares/tenantValidation');
const { auditTenantAction } = require('../middlewares/tenantSecurity');
```

Depois, envolver rotas assim:

```javascript
// ANTES:
router.get('/affiliations', authenticate, affiliationController.getAll);

// DEPOIS:
router.get('/affiliations',
    authenticate,
    tenantMiddleware,
    ensureTenantIsolation,
    affiliationController.getAll
);

// PARA ROTAS COM ID:
router.get('/affiliations/:id',
    authenticate,
    tenantMiddleware,
    validateResourceTenant('filiacoes', 'id'),
    affiliationController.getById
);

// PARA MODIFICAÇÕES (POST/PUT/DELETE):
router.post('/affiliations',
    authenticate,
    tenantMiddleware,
    auditTenantAction('CREATE_FILIACAO', 'Created new affiliation'),
    affiliationController.create
);
```

---

### 5️⃣ Testar Localmente (1h)

```bash
# Terminal 1: Iniciar servidor
cd backend && npm start

# Terminal 2: Fazer requisição
# Login
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@example.com","password":"pass"}' | jq

# Copiar o token, depois:
TOKEN="seu_token_aqui"

# Acessar dados (deve retornar apenas tenant_id = 1)
curl -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/affiliations | jq
```

**Esperado**: Apenas dados com `tenant_id = 1`

---

### 6️⃣ Validação Final (30 min)

**Arquivo**: `backend/scripts/validate_phase2.js`

```javascript
const knex = require('../config/database');

async function validate() {
    console.log('🔍 Validando FASE 2...\n');

    // 1. Tabelas criadas
    const tenants = await knex('tenants').count('* as count').first();
    console.log(`✅ Tenants: ${tenants.count}`);

    // 2. tenant_id em todas as tabelas
    const tables = ['profiles', 'filiacoes', 'documentos', 'conversations', 'messages'];
    for (const table of tables) {
        const count = await knex(table).whereNotNull('tenant_id').count('* as count').first();
        console.log(`✅ ${table}: ${count.count} com tenant_id`);
    }

    console.log('\n✅ FASE 2 validada com sucesso!');
    process.exit(0);
}

validate().catch(e => {
    console.error('❌ Erro:', e.message);
    process.exit(1);
});
```

**Executar**:
```bash
node backend/scripts/validate_phase2.js
```

---

## ✅ Checklist de FASE 2

- [ ] Migrations executadas (`npx knex migrate:latest`)
- [ ] Seed criado e executado
- [ ] JWT modificado com `tenantId`
- [ ] Middlewares integrados em rotas de affiliação
- [ ] Teste de login com novo JWT (contém tenantId)
- [ ] Teste de acesso a dados (isolados por tenant)
- [ ] Script de validação executado
- [ ] Todos os commits feitos com `git push`

---

## 🎯 Resultado Esperado

Após FASE 2 completa:

✅ Banco de dados com 11 tabelas isoladas  
✅ JWT contém `tenantId` do usuário  
✅ Middlewares validam tenant em cada requisição  
✅ Dados 100% isolados por tenant  
✅ Pronto para FASE 3 (modificar 78 queries)  

---

## 🚨 Se algo der errado

### Erro: "Column 'tenant_id' not found"

→ Migrations não foram executadas. Execute `npx knex migrate:latest`

### Erro: "tenantId undefined in JWT"

→ JWT ainda não foi modificado. Adicione `tenantId` em `generateToken()`

### Erro: "Access denied - resource belongs to different tenant"

→ Middleware funcionando! Você está tentando acessar tenant errado.

### Erro no seed

→ Execute `npx knex seed:run --specific seed_initial_tenant.js` direto

---

## 📚 Documentação Completa

Para detalhes completos, ver:
- `docs/FASE_2_MIGRATIONS_AND_JWT.md` - Guia completo (600+ linhas)
- `docs/FASE_1_DATABASE_ARCHITECTURE.md` - Arquitetura (850+ linhas)
- `docs/STATUS_ROADMAP_MULTITENANT.md` - Status geral e progresso

---

## 🔜 Próxima Fase

**FASE 3**: Modificar 78 queries para isolamento de dados
- Começar por Models (User.js - 6 queries)
- Depois Controllers (23 queries)
- Depois Services (20+ queries)
- Testes e validação

---

**Pronto?** Comece com a Tarefa 1: Executar migrations! 🚀
