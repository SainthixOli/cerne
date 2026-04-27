# 🗺️ ROADMAP - Arquitetura Multi-Tenant CERNE

**Data**: 27 de Abril de 2026  
**Versão**: 1.0  
**Complexidade Global**: 🔴 MUITO ALTA (Redesign arquitetural)  
**Tempo Estimado**: 6-8 semanas  

---

## 📊 VISÃO GERAL DO ROADMAP

```
FASE 0: Preparação (1 semana)
│
├─ FASE 1: Arquitetura de Dados (2 semanas)
│
├─ FASE 2: Autenticação Multi-Tenant (1.5 semanas)
│
├─ FASE 3: Isolamento de Dados (2 semanas)
│
├─ FASE 4: Dashboard Admin Técnico (2 semanas)
│
└─ FASE 5: Testes & Deploym (1 semana)
```

---

## FASE 0: PREPARAÇÃO (1 semana)

### 0.1 Análise de Impacto
- **Tempo**: 2 dias
- **Tasks**:
  - [ ] Mapeamento de todas as tabelas que precisam de tenant_id
  - [ ] Identificar pontos de acesso a BD (controllers, services)
  - [ ] Listar todas as queries que precisarão de filtro
  - [ ] Documentar dependências atuais
- **Entregável**: Documento de mapeamento

### 0.2 Design de Banco de Dados
- **Tempo**: 3 dias  
- **Tasks**:
  - [ ] Decidir: Banco por tenant vs RLS vs Híbrido
  - [ ] Desenhar ER-diagram com tenant_id
  - [ ] Criar scripts de migração
  - [ ] Planejar estratégia de backup/restore por tenant
- **Entregável**: Schema SQL pronto

### 0.3 Setup de Ambiente
- **Tempo**: 2 dias
- **Tasks**:
  - [ ] Criar branch `feature/multi-tenant-phase1`
  - [ ] Setup PostgreSQL com múltiplos bancos (se Opção 2)
  - [ ] Configurar variáveis de ambiente
  - [ ] Criar script de seed para teste
- **Entregável**: Ambiente pronto para desenvolvimento

**✅ FIM DA FASE 0**

---

## FASE 1: ARQUITETURA DE DADOS (2 semanas)

### 1.1 Criar Tabelas de Tenant
- **Tempo**: 3 dias
- **Complexidade**: 🟡 MÉDIA
- **Tasks**:
  - [ ] Criar tabela `tenants` (id, name, slug, plan, status, created_at)
  - [ ] Criar tabela `tenant_super_admins`
  - [ ] Criar índices (tenant_id, status, created_at)
  - [ ] Escrever migrações Knex
  - [ ] Testes unitários para modelos
- **Entregável**: Migrações aprovadas

**Subtask 1.1.1**: Implementação
```javascript
// backend/db/migrations/20260427_create_tenants_table.js
exports.up = function(knex) {
  return knex.schema
    .createTable('tenants', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name', 255).notNullable();
      table.string('slug', 100).unique();
      table.enum('plan', ['free', 'professional', 'enterprise']).defaultTo('professional');
      table.enum('status', ['ATIVO', 'SUSPENSO', 'INATIVO']).defaultTo('ATIVO');
      table.text('database_url').nullable();
      table.decimal('storage_used_gb', 10, 2).defaultTo(0);
      table.integer('users_count').defaultTo(0);
      table.uuid('technical_admin_id');
      table.timestamps(true, true);
      table.index('status');
      table.index('created_at');
    })
    .createTable('tenant_super_admins', (table) => {
      table.uuid('id').primary();
      table.uuid('tenant_id').notNullable().references('tenants.id');
      table.uuid('user_id').notNullable();
      table.string('email', 255);
      table.timestamp('created_at').defaultTo(knex.fn.now());
      table.index('tenant_id');
    });
};
```

### 1.2 Adicionar tenant_id a Tabelas Existentes
- **Tempo**: 4 dias
- **Complexidade**: 🔴 ALTA (risco de data loss)
- **Tasks**:
  - [ ] Criar migração para adicionar coluna `tenant_id` em `users`
  - [ ] Criar migração para adicionar coluna `tenant_id` em `affiliations`
  - [ ] Criar migração para adicionar coluna `tenant_id` em `documents`
  - [ ] Criar migração para adicionar coluna `tenant_id` em `chat_messages`
  - [ ] Adicionar foreign keys
  - [ ] Criar índices compostos (tenant_id, id)
  - [ ] Teste de rollback em ambiente de teste
- **Entregável**: Migrações testeadas em staging

**Subtask 1.2.1**: Estratégia de Migração (Zero-Downtime)
```javascript
// Passo 1: Adicionar coluna nullable
exports.up = function(knex) {
  return knex.schema
    .alterTable('users', (table) => {
      table.uuid('tenant_id');
    });
};

// Passo 2: Popular com tenant_id padrão (após UX)
UPDATE users SET tenant_id = 'default-tenant-uuid' WHERE tenant_id IS NULL;

// Passo 3: Tornar NOT NULL e adicionar FK
ALTER TABLE users 
  ALTER COLUMN tenant_id SET NOT NULL,
  ADD FOREIGN KEY (tenant_id) REFERENCES tenants(id);
```

### 1.3 Criar Modelo Tenant
- **Tempo**: 2 dias
- **Complexidade**: 🟡 MÉDIA
- **Tasks**:
  - [ ] Criar `backend/src/models/Tenant.js`
  - [ ] Implementar CRUD básico
  - [ ] Adicionar validações (name, slug, plan)
  - [ ] Implementar calcular storage_used_gb (query)
  - [ ] Testes: criar, editar, deletar (lógico)
- **Entregável**: Model completo com testes

**✅ FIM DA FASE 1**

---

## FASE 2: AUTENTICAÇÃO MULTI-TENANT (1.5 semanas)

### 2.1 Criar Middleware de Tenant
- **Tempo**: 3 dias
- **Complexidade**: 🟡 MÉDIA  
- **Tasks**:
  - [ ] Criar `backend/src/middlewares/tenantMiddleware.js`
  - [ ] Extrair tenant_id de: header, JWT claims, params
  - [ ] Validar tenant_id contra tenant_id do usuário
  - [ ] Rejeitar requisições inválidas com 403
  - [ ] Adicionar logging de acesso negado
  - [ ] Testes: acesso autorizado, acesso negado, tenant inválido
- **Entregável**: Middleware pronto e testado

```javascript
// backend/src/middlewares/tenantMiddleware.js
const tenantMiddleware = async (req, res, next) => {
  try {
    // Extrair tenant_id de múltiplas fontes
    const tenantId = req.headers['x-tenant-id'] || 
                     req.user?.tenant_id ||
                     req.params.tenantId;

    if (!tenantId) {
      return res.status(400).json({ 
        error: 'Missing tenant identification' 
      });
    }

    // Validar que o tenant existe
    const tenant = await Tenant.findById(tenantId);
    if (!tenant) {
      return res.status(404).json({ 
        error: 'Tenant not found' 
      });
    }

    // Validar que o usuário tem acesso a esse tenant
    if (req.user && req.user.tenant_id !== tenantId) {
      logger.warn(`Unauthorized tenant access attempt`, {
        userId: req.user.id,
        requestedTenant: tenantId,
        userTenant: req.user.tenant_id
      });
      return res.status(403).json({ 
        error: 'Access denied to this tenant' 
      });
    }

    // Anexar ao request
    req.tenant = { 
      id: tenantId, 
      name: tenant.name,
      plan: tenant.plan 
    };
    
    next();
  } catch (error) {
    logger.error('Tenant middleware error', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = tenantMiddleware;
```

### 2.2 Modificar JWT para incluir Tenant
- **Tempo**: 2 dias
- **Complexidade**: 🟡 MÉDIA
- **Tasks**:
  - [ ] Modificar `authController.js` - adicionar tenant_id no JWT
  - [ ] Atualizar `auth.js` middleware - extrair tenant_id do JWT
  - [ ] Adicionar validação de tenant_id vs. usuário
  - [ ] Testes: login com tenant_id, logout, refresh token
- **Entregável**: JWT atualizado

```javascript
// Antes: JWT payload
{ userId: '123', role: 'admin' }

// Depois: JWT payload
{ userId: '123', tenantId: 'abc-def-ghi', role: 'admin' }
```

### 2.3 Criar Controler de Administração de Sindicatos
- **Tempo**: 3 dias
- **Complexidade**: 🔴 ALTA
- **Tasks**:
  - [ ] Criar `backend/src/controllers/tenantAdminController.js`
  - [ ] Implementar: createTenant, editTenant, deleteTenant (soft)
  - [ ] Implementar: listTenants (apenas para admin técnico)
  - [ ] Implementar: createSuperAdmin (criar admin do sindicato)
  - [ ] Implementar: resetSuperAdminPassword
  - [ ] Testes: CRUD, validações, permissões
- **Entregável**: Controller completo

**✅ FIM DA FASE 2**

---

## FASE 3: ISOLAMENTO DE DADOS (2 semanas)

### 3.1 Query Isolation Layer
- **Tempo**: 5 dias
- **Complexidade**: 🔴 ALTA
- **Tasks**:
  - [ ] Criar `backend/src/utils/queryBuilder.js`
  - [ ] Implementar filtro automático de tenant_id
  - [ ] Atualizar todos os models para usar query builder
  - [ ] Adicionar validações (nenhuma query sem tenant_id)
  - [ ] Testes: queries isoladas, cross-tenant rejection
- **Entregável**: Query builder pronto

```javascript
// backend/src/utils/queryBuilder.js
class TenantQuery {
  static async find(model, where = {}, tenantId) {
    if (!tenantId) throw new Error('tenantId required');
    return model.where({...where, tenant_id: tenantId});
  }

  static async create(model, data, tenantId) {
    if (!tenantId) throw new Error('tenantId required');
    return model.insert({...data, tenant_id: tenantId});
  }
}

// Uso:
const affiliations = await TenantQuery.find(
  Affiliation, 
  {status: 'ATIVO'}, 
  req.tenant.id
);
```

### 3.2 Atualizar Controllers para Multi-Tenant
- **Tempo**: 5 dias
- **Complexidade**: 🔴 ALTA
- **Tasks**:
  - [ ] Atualizar `affiliationController.js`
  - [ ] Atualizar `documentController.js`
  - [ ] Atualizar `chatController.js`
  - [ ] Atualizar `profileController.js`
  - [ ] Adicionar validações rigorosas
  - [ ] Testes: cada controller com multi-tenant
- **Entregável**: Todos os controllers updated

**Exemplo de antes/depois**:

```javascript
// ANTES (Single-tenant)
async getMyAffiliations(req, res) {
  const affiliations = await Affiliation
    .where({user_id: req.user.id})
    .select();
  res.json(affiliations);
}

// DEPOIS (Multi-tenant)
async getMyAffiliations(req, res) {
  const affiliations = await Affiliation
    .where({
      user_id: req.user.id,
      tenant_id: req.tenant.id  // OBRIGATÓRIO
    })
    .select();
  res.json(affiliations);
}
```

### 3.3 Validação de Tenant em Rotas
- **Tempo**: 3 dias
- **Complexidade**: 🟡 MÉDIA
- **Tasks**:
  - [ ] Adicionar middleware de tenant em TODAS as rotas
  - [ ] Verificar proteção: nenhuma rota sem validação
  - [ ] Criar testes de integração: route security
  - [ ] Documentar padrão de rota (x-tenant-id header)
- **Entregável**: Rotas protegidas

**Padrão de Rota**:
```javascript
router.get('/affiliations', 
  auth, 
  tenantMiddleware,  // ← OBRIGATÓRIO
  affiliationController.getMyAffiliations
);
```

**✅ FIM DA FASE 3**

---

## FASE 4: DASHBOARD ADMIN TÉCNICO (2 semanas)

### 4.1 Backend - Endpoints de Admin Técnico
- **Tempo**: 5 dias
- **Complexidade**: 🔴 ALTA
- **Tasks**:
  - [ ] `GET /admin/tenants` - listar todos sindicatos
  - [ ] `POST /admin/tenants` - criar novo sindicato
  - [ ] `PUT /admin/tenants/:id` - editar sindicato
  - [ ] `DELETE /admin/tenants/:id` - desativar sindicato (soft delete)
  - [ ] `GET /admin/tenants/:id/stats` - estatísticas (users, armazenamento)
  - [ ] `GET /admin/tenants/:id/logs` - auditoria de um sindicato
  - [ ] `POST /admin/tenants/:id/super-admin` - criar super admin
  - [ ] `POST /admin/tenants/:id/super-admin/reset-password` - resetar senha
  - [ ] Testes: CRUD, stats, logs, permissões
- **Entregável**: Endpoints prontos e testados

```javascript
// backend/src/controllers/techAdminController.js

class TechAdminController {
  // Listar todos os sindicatos
  async listTenants(req, res) {
    // Apenas admin técnico
    if (req.user.role !== 'TECH_ADMIN') {
      return res.status(403).json({error: 'Unauthorized'});
    }
    
    const tenants = await Tenant.select()
      .leftJoin('users', 'users.id', 'tenants.technical_admin_id');
    res.json(tenants);
  }

  // Criar novo sindicato
  async createTenant(req, res) {
    const {name, plan} = req.body;
    
    const tenant = await Tenant.create({
      name,
      slug: name.toLowerCase().replace(/\s+/g, '-'),
      plan: plan || 'professional',
      status: 'ATIVO',
      technical_admin_id: req.user.id
    });

    // Criar super admin padrão
    const superAdmin = await User.create({
      tenant_id: tenant.id,
      email: `admin@${tenant.slug}.sindicato.local`,
      role: 'SUPER_ADMIN',
      temporary_password: generateSecurePassword()
    });

    // Enviar credenciais por email
    await emailService.sendTenantCredentials(superAdmin);

    res.status(201).json(tenant);
  }

  // Estatísticas de um sindicato
  async getTenantStats(req, res) {
    const {tenantId} = req.params;
    
    const stats = await db('users')
      .where({tenant_id: tenantId})
      .count('* as total_users')
      .first();
    
    const storage = await calculateTenantStorage(tenantId);
    const usage = await getAuditLogCount(tenantId);

    res.json({
      users: stats.total_users,
      storage_gb: storage,
      audit_events: usage
    });
  }
}
```

### 4.2 Frontend - Dashboard Admin Técnico
- **Tempo**: 5 dias
- **Complexidade**: 🟡 MÉDIA
- **Tasks**:
  - [ ] Criar página `/admin/tenants` - listar sindicatos
  - [ ] Criar modal de criar novo sindicato
  - [ ] Criar página `/admin/tenants/:id` - detalhes
  - [ ] Criar gráficos de stats (users, storage)
  - [ ] Criar logs viewer (auditoria)
  - [ ] Implementar filtros e busca
  - [ ] Responsividade mobile
- **Entregável**: Interface completa

### 4.3 Monitoramento & Alertas
- **Tempo**: 3 dias
- **Complexidade**: 🟡 MÉDIA
- **Tasks**:
  - [ ] Implementar verificação de saúde (health check por tenant)
  - [ ] Criar alertas: sindicato acima do limite de storage
  - [ ] Criar alertas: anomalia de segurança detectada
  - [ ] Implementar notificações (email, dashboard)
  - [ ] Testes: alertas disparam corretamente
- **Entregável**: Sistema de alertas

**✅ FIM DA FASE 4**

---

## FASE 5: TESTES & DEPLOY (1 semana)

### 5.1 Testes Automatizados
- **Tempo**: 2 dias
- **Complexidade**: 🟡 MÉDIA
- **Tasks**:
  - [ ] Testes de integração: multi-tenant isolation
  - [ ] Testes: cross-tenant data leakage (CRÍTICO)
  - [ ] Testes de performance: 1000 tenants
  - [ ] Testes de segurança: JWT bypass, tenant bypass
  - [ ] Coverage mínimo: 80%
- **Entregável**: Suite de testes

```javascript
// Tests: Isolamento de tenant
describe('Multi-Tenant Isolation', () => {
  it('deve rejeitar acesso a outro tenant', async () => {
    const user1 = await createUser({tenant_id: tenant1.id});
    const user2 = await createUser({tenant_id: tenant2.id});

    const req = {
      user: user1,
      tenant: {id: tenant2.id}
    };

    // Deve lançar erro
    expect(() => affiliationController.get(req))
      .toThrow('Unauthorized tenant access');
  });
});
```

### 5.2 Documentação
- **Tempo**: 1 dia
- **Complexidade**: 🟢 BAIXA
- **Tasks**:
  - [ ] Documentar API endpoints para admin técnico
  - [ ] Documentar fluxo de criação de novo sindicato
  - [ ] Documentar troubleshooting
  - [ ] Criar runbook de deployment
- **Entregável**: Documentação completa

### 5.3 Deploy em Staging
- **Tempo**: 1.5 dias
- **Complexidade**: 🟡 MÉDIA
- **Tasks**:
  - [ ] Deploy em staging
  - [ ] Criar 3 tenants de teste
  - [ ] Testar fluxo completo
  - [ ] Performance teste (load test)
  - [ ] Resolver bugs
- **Entregável**: Aprovação para produção

### 5.4 Deploy em Produção
- **Tempo**: 1 dia
- **Complexidade**: 🔴 ALTA (risco de downtime)
- **Tasks**:
  - [ ] Backup completo antes
  - [ ] Deploy com blue-green
  - [ ] Monitoramento intensivo (24h)
  - [ ] Plano de rollback preparado
  - [ ] Notificar clientes
- **Entregável**: Produção live

**✅ FIM DA FASE 5**

---

## 📈 ESTIMATIVA DE TEMPO POR ROLE

| Role | Fase 1 | Fase 2 | Fase 3 | Fase 4 | Fase 5 | **TOTAL** |
|---|---|---|---|---|---|---|
| **Backend Engineer** | 4d | 5d | 6d | 5d | 1d | **21 dias** |
| **Frontend Engineer** | - | - | - | 5d | 0.5d | **5.5 dias** |
| **DevOps/Infrastructure** | 2d | - | - | - | 2d | **4 dias** |
| **QA/Tester** | 2d | 2d | 2d | 1d | 2d | **9 dias** |
| **Tech Lead/Review** | 1d/semana | 1d/semana | 1d/semana | 1d/semana | 1d | **5 dias** |

**TOTAL WORK**: ~6-8 semanas para 1 engenheiro full-stack  
**PARALELO**: ~4 semanas com time de 2+ pessoas

---

## 💾 CHECKLIST DE DEPLOYMENT

- [ ] Backup de BD antes de migração
- [ ] Migrações testadas em staging
- [ ] Nenhuma query sem tenant_id
- [ ] JWT contém tenant_id
- [ ] Middleware de tenant em TODAS as rotas
- [ ] Testes de cross-tenant access (DEVE FALHAR)
- [ ] Performance teste ok
- [ ] Logs configurados
- [ ] Alertas configurados
- [ ] Documentação completa
- [ ] Plano de rollback pronto

---

## 🚨 RISCOS CRÍTICOS

| Risco | Probabilidade | Impacto | Mitigação |
|---|---|---|---|
| Data leakage entre tenants | 🟡 MÉDIA | 🔴 CRÍTICO | Revisão rigorosa de código, testes |
| Performance degradation | 🟡 MÉDIA | 🟡 ALTO | Load testing, índices, caching |
| Migração BD falha | 🟢 BAIXA | 🔴 CRÍTICO | Backup, teste em staging, rollback plan |
| Admin técnico acesso negado | 🟢 BAIXA | 🟡 ALTO | Controle de acesso, documentação |

---

## 🎯 PRÓXIMOS PASSOS

1. ✅ **Aprove este roadmap** (você)
2. ⏳ **Criar branch `feature/multi-tenant-phase1`**
3. ⏳ **Iniciar Fase 0: Preparação**
4. ⏳ **Semanal: Review de progresso**

---

**Documentação Relacionada**:
- [REQUISITOS_MULTI_TENANT.md](./REQUISITOS_MULTI_TENANT.md)
- [Arquitetura de Banco](./docs/ARCHITECTURE.md)

**Última Atualização**: 27 de Abril de 2026  
**Status**: 🟡 Planejamento (Aguardando aprovação)

