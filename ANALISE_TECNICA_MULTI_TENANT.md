# 🔧 ANÁLISE TÉCNICA - MUDANÇAS NA STACK PARA MULTI-TENANT

**Data**: 27 de Abril de 2026  
**Versão**: 1.0  
**Objetivo**: Detalhar mudanças de tecnologia e arquitetura  

---

## 1. RESPOSTA DIRETA

**Pergunta**: "A stack vai mudar muito?"

**Resposta**: 
- ✅ **Tecnologias usadas**: NÃO mudam (Express, PostgreSQL, JWT continuam)
- ✅ **Padrões e patterns**: SIM, mudam bastante
- ✅ **Segurança**: SIM, vai fortalecer
- ✅ **CRUD**: Complexidade aumenta, lógica muda
- ⚠️ **Banco de dados**: Estrutura muda (adiciona tenant_id, indices, constraints)

**Resumo**: Você NÃO muda de tecnologia, mas muda como usa a tecnologia.

---

## 2. STACK ATUAL vs MULTI-TENANT

### 2.1 Componentes - Comparação

| Componente | Single-Tenant (Agora) | Multi-Tenant (Novo) | Mudança |
|---|---|---|---|
| **Linguagem** | Node.js 18.x | Node.js 18.x | ❌ Nenhuma |
| **Framework** | Express 4.22 | Express 4.22 | ❌ Nenhuma |
| **Banco** | PostgreSQL | PostgreSQL (múltiplos ou RLS) | ✅ Estrutura muda |
| **ORM** | Knex.js | Knex.js + tenant wrapper | ⚠️ Wrapper adicionado |
| **Auth** | JWT simples | JWT + tenant_id | ⚠️ JWT expandido |
| **Middlewares** | 5 middlewares | 7-8 middlewares | ✅ +2 middlewares |
| **Security** | Helmet, CORS, Rate Limit | ... + Row isolation | ✅ Camada adicionada |
| **Cache** | Nenhum | Redis (opcional) | ➕ Adicionado |
| **Logging** | Winston | Winston + tenant context | ⚠️ Aprimorado |

### 2.2 Visão Geral

```
ANTES (Single-Tenant)
┌─────────────────────────────────────┐
│ Express App                         │
│ ├─ auth                             │
│ ├─ JWT                              │
│ ├─ CORS                             │
│ └─ Controllers → Queries Diretas    │
└─ PostgreSQL (1 banco único)         │
└─ Dados de 1 sindicato só            │

DEPOIS (Multi-Tenant)
┌─────────────────────────────────────┐
│ Express App                         │
│ ├─ auth + tenant extraction         │
│ ├─ JWT + tenant_id                  │
│ ├─ CORS                             │
│ ├─ tenantMiddleware ← NOVO          │
│ ├─ TenantQueryBuilder ← NOVO        │
│ └─ Controllers → Queries Isoladas   │
├─ PostgreSQL (N bancos ou RLS)       │
├─ Dados separados por tenant_id      │
└─ Validação rigorosa de acesso       │
```

---

## 3. MUDANÇAS POR COMPONENTE

### 3.1 BANCO DE DADOS

#### ❌ NÃO MUDA:
- PostgreSQL continua (versão, ports, credenciais)
- Tipos de dados (VARCHAR, UUID, TIMESTAMP)
- Índices básicos (ainda usamos B-tree)

#### ✅ MUDA:
- **Estrutura**: Todas as tabelas ganham coluna `tenant_id`
- **Constraints**: Foreign keys agora incluem tenant_id
- **Índices**: Compostos com (tenant_id, id)
- **Row-Level Security** (opcional): policies por tenant

**Exemplo**:

```sql
-- ANTES (Single-Tenant)
CREATE TABLE affiliations (
  id UUID PRIMARY KEY,
  user_id UUID,
  status VARCHAR(50),
  created_at TIMESTAMP
);
CREATE INDEX idx_affiliations_user ON affiliations(user_id);

-- DEPOIS (Multi-Tenant)
CREATE TABLE affiliations (
  id UUID PRIMARY KEY,
  user_id UUID,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  status VARCHAR(50),
  created_at TIMESTAMP
);
CREATE INDEX idx_affiliations_tenant_user ON affiliations(tenant_id, user_id);
-- IMPORTANTE: índice começa com tenant_id!
```

**Por que?**: Quando você faz `WHERE tenant_id='abc' AND user_id='123'`, o BD precisa filtrar por tenant PRIMEIRO para performance.

---

### 3.2 ORM (Knex.js)

#### ❌ NÃO MUDA:
- Sintaxe Knex continua igual
- Migrations continuam funcionando
- Builder pattern é o mesmo

#### ✅ MUDA:
- Criamos **TenantQueryBuilder** wrapper
- Todas queries passam por este wrapper
- Wrapper **injeta tenant_id automaticamente**

**Antes**:
```javascript
// backend/src/repositories/affiliationRepository.js
async function getByUserId(userId) {
  return db('affiliations')
    .where('user_id', userId)
    .select();
}
```

**Depois**:
```javascript
// backend/src/repositories/affiliationRepository.js
const TenantQuery = require('../utils/TenantQuery');

async function getByUserId(userId, tenantId) {
  return TenantQuery.where('affiliations', {
    user_id: userId,
    tenant_id: tenantId  // ← Injetado automaticamente
  }).select();
}
```

**Ou com método estático helper**:
```javascript
async function getByUserId(userId, tenantId) {
  return Affiliation.forTenant(tenantId)
    .where('user_id', userId)
    .select();
}
```

---

### 3.3 AUTENTICAÇÃO (JWT)

#### ❌ NÃO MUDA:
- JWT continua sendo assinado com SECRET
- Expiração funciona igual
- Refresh token lógica igual

#### ✅ MUDA:
- JWT agora contém **tenant_id**
- Middleware valida tenant_id contra usuario

**Antes**:
```javascript
// Token payload
{
  iat: 1234567890,
  exp: 1234571490,
  userId: 'abc-def-ghi',
  role: 'SUPER_ADMIN'
}
```

**Depois**:
```javascript
// Token payload
{
  iat: 1234567890,
  exp: 1234571490,
  userId: 'abc-def-ghi',
  tenantId: 'tenant-xyz-123',  // ← NOVO
  role: 'SUPER_ADMIN'
}
```

**Impacto**: Login precisa de mudança MÍNIMA

```javascript
// ANTES
async login(email, password) {
  const user = await User.findOne({email});
  const token = jwt.sign({userId: user.id, role: user.role});
  return token;
}

// DEPOIS
async login(email, password, tenantId) {
  const user = await User.findOne({email, tenant_id: tenantId});
  const token = jwt.sign({
    userId: user.id,
    tenantId: user.tenant_id,  // ← Do banco
    role: user.role
  });
  return token;
}
```

---

### 3.4 MIDDLEWARES

#### ❌ NÃO MUDA:
- `auth.js` middleware lógica básica
- `errorHandler.js` formato
- `validate.js` schemas

#### ✅ MUDA:
- **Novo**: `tenantMiddleware.js`
- **Novo**: `tenantValidation.js` (validar tenant_id)
- Todos middlewares precisam rodar DEPOIS de tenantMiddleware

**Fluxo**:
```
Requisição
    ↓
1. auth.js (valida JWT)
    ↓
2. tenantMiddleware.js (extrai tenant_id) ← NOVO
    ↓
3. tenantValidation.js (valida acesso) ← NOVO
    ↓
4. validate.js (valida schema)
    ↓
5. Controller
```

---

### 3.5 CONTROLLERS

#### ❌ PERMANECE LÓGICA:
- Validações de negócio (status, campos obrigatórios)
- Tratamento de erros
- Transformação de dados

#### ✅ MUDA:
- TODAS queries passam tenant_id
- Nenhuma query sem tenant_id
- Validações mais rigorosas

**Antes**:
```javascript
// backend/src/controllers/affiliationController.js
async getAffiliations(req, res) {
  try {
    const affiliations = await Affiliation
      .where({status: 'ATIVO'})
      .select();
    res.json(affiliations);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
}
```

**Depois**:
```javascript
// backend/src/controllers/affiliationController.js
async getAffiliations(req, res) {
  try {
    // tenant_id vem do middleware
    const {id: tenantId} = req.tenant;
    
    const affiliations = await Affiliation
      .forTenant(tenantId)  // ← OBRIGATÓRIO
      .where({status: 'ATIVO'})
      .select();
    
    res.json(affiliations);
  } catch (error) {
    res.status(500).json({error: error.message});
  }
}
```

**Mudança**: ~30% de alteração em cada controller (adicionar `forTenant(tenantId)`)

---

### 3.6 SEGURANÇA

#### ❌ CONTINUAM (não mudam):
- Bcrypt para senha
- Rate limiting
- CORS whitelist
- CSRF protection
- Helmet headers

#### ✅ ADIÇÕES:
- **Row-Level Isolation**: Nenhuma query acessa outro tenant
- **Tenant ID Validation**: Verificação em TODA requisição
- **Cross-Tenant Audit**: Log de tentativas de acesso negado
- **Per-Tenant Rate Limits** (opcional): Limites por sindicato
- **Data Encryption per Tenant** (opcional): Chaves diferentes por tenant

**Novo Middleware de Segurança**:
```javascript
// backend/src/middlewares/tenantSecurity.js
async function tenantSecurityMiddleware(req, res, next) {
  const userTenantId = req.user.tenantId;
  const requestTenantId = req.headers['x-tenant-id'] || req.params.tenantId;

  // 1. Validar que IDs são UUIDs válidos
  if (!isValidUUID(requestTenantId)) {
    logger.warn('Invalid tenant ID format', {userId: req.user.id});
    return res.status(400).json({error: 'Invalid tenant'});
  }

  // 2. Validar que usuário pertence ao tenant solicitado
  if (userTenantId !== requestTenantId && req.user.role !== 'TECH_ADMIN') {
    logger.warn('Cross-tenant access attempt', {
      userId: req.user.id,
      userTenant: userTenantId,
      requestedTenant: requestTenantId
    });
    return res.status(403).json({error: 'Unauthorized'});
  }

  // 3. Validar que tenant existe
  const tenant = await Tenant.findById(requestTenantId);
  if (!tenant) {
    return res.status(404).json({error: 'Tenant not found'});
  }

  // 4. Validar que tenant está ativo (não suspenso)
  if (tenant.status !== 'ATIVO') {
    logger.warn('Access to inactive tenant', {tenant: requestTenantId});
    return res.status(403).json({error: 'Tenant inactive'});
  }

  req.tenant = {id: requestTenantId, ...tenant};
  next();
}
```

---

## 4. MUDANÇAS POR CAMADA

### 4.1 CAMADA DE DADOS (50% mudança)

```javascript
// ANTES
async function getDocument(documentId) {
  return db('documents')
    .where('id', documentId)
    .first();
}

// DEPOIS - ERRADO ❌ (vai quebrar!)
async function getDocument(documentId, tenantId) {
  return db('documents')
    .where('id', documentId)
    .where('tenant_id', tenantId)
    .first();
}

// DEPOIS - CORRETO ✅
async function getDocument(documentId, tenantId) {
  if (!tenantId) throw new Error('tenantId required');
  
  return db('documents')
    .where({
      id: documentId,
      tenant_id: tenantId
    })
    .first();
}
```

**Mudança**: ~50% das queries (adicionar WHERE tenant_id)

### 4.2 CAMADA DE CONTROLE (30% mudança)

```javascript
// ANTES
router.get('/documents/:id', auth, documentController.get);

// DEPOIS
router.get('/documents/:id', 
  auth,
  tenantMiddleware,  // ← NOVO
  tenantSecurity,     // ← NOVO
  documentController.get
);
```

**Mudança**: ~30% (adicionar middlewares)

### 4.3 CAMADA DE AUTENTICAÇÃO (20% mudança)

```javascript
// ANTES
function validateAuth(req, res, next) {
  const token = extractToken(req);
  const decoded = jwt.verify(token, SECRET);
  req.user = decoded;
  next();
}

// DEPOIS
function validateAuth(req, res, next) {
  const token = extractToken(req);
  const decoded = jwt.verify(token, SECRET);
  
  // Adicionar validação de tenant_id
  if (!decoded.tenantId) {
    return res.status(401).json({error: 'Invalid token'});
  }
  
  req.user = decoded;
  req.tenant = {id: decoded.tenantId};  // ← Pré-populate
  next();
}
```

**Mudança**: ~20% (validação adicional)

### 4.4 CAMADA DE NEGÓCIO (5% mudança)

**Validações de negócio NÃO mudam**:
```javascript
// Continua igual
if (affiliation.status === 'PENDENTE' && !affiliation.document_url) {
  throw new Error('Document required for pending affiliation');
}

// Continua igual
const newSalary = currentSalary * 1.05;
```

**Mudança**: ~5% (apenas adicionar tenant_id em algumas regras)

---

## 5. IMPACTO NO CRUD

### 5.1 CREATE

**Antes**:
```javascript
async create(data) {
  return db('affiliations').insert(data);
}
```

**Depois**:
```javascript
async create(data, tenantId) {
  if (!tenantId) throw new Error('tenantId required');
  
  return db('affiliations').insert({
    ...data,
    tenant_id: tenantId  // ← OBRIGATÓRIO
  });
}
```

**Mudança**: ⚠️ OBRIGATÓRIO adicionar tenant_id  
**Complexidade**: 🟢 BAIXA (1 linha)

### 5.2 READ

**Antes**:
```javascript
async findById(id) {
  return db('affiliations')
    .where('id', id)
    .first();
}
```

**Depois**:
```javascript
async findById(id, tenantId) {
  if (!tenantId) throw new Error('tenantId required');
  
  return db('affiliations')
    .where({id, tenant_id: tenantId})
    .first();
}
```

**Mudança**: ⚠️ OBRIGATÓRIO adicionar WHERE tenant_id  
**Complexidade**: 🟡 MÉDIA (validar isolamento)

### 5.3 UPDATE

**Antes**:
```javascript
async update(id, data) {
  return db('affiliations')
    .where('id', id)
    .update(data);
}
```

**Depois**:
```javascript
async update(id, data, tenantId) {
  if (!tenantId) throw new Error('tenantId required');
  
  return db('affiliations')
    .where({id, tenant_id: tenantId})  // ← CRÍTICO
    .update(data);
}
```

**Mudança**: 🔴 CRÍTICO - sem WHERE tenant_id, vaza dados!  
**Complexidade**: 🔴 ALTA (risco de segurança)

### 5.4 DELETE

**Antes**:
```javascript
async delete(id) {
  return db('affiliations')
    .where('id', id)
    .del();
}
```

**Depois**:
```javascript
async delete(id, tenantId) {
  if (!tenantId) throw new Error('tenantId required');
  
  // Soft delete recomendado
  return db('affiliations')
    .where({id, tenant_id: tenantId})
    .update({deleted_at: new Date()});
}
```

**Mudança**: 🔴 CRÍTICO - sem WHERE tenant_id, deleta outro tenant!  
**Complexidade**: 🔴 ALTA (risco de data loss)

---

## 6. STACK TÉCNICO - RESUMO DE MUDANÇAS

| Tecnologia | Versão | Mudança | Esforço |
|---|---|---|---|
| Node.js | 18.x | ❌ Nenhuma | 0h |
| Express | 4.22 | ❌ Nenhuma | 0h |
| PostgreSQL | 14+ | ⚠️ Schema | 4h |
| Knex.js | 2.5 | ⚠️ Wrapper | 8h |
| JWT | - | ⚠️ Payload | 2h |
| Redis | - | ➕ Novo (opcional) | 6h |
| Helmet | 7.x | ❌ Nenhuma | 0h |
| Winston | 3.x | ⚠️ Context | 3h |
| **TOTAL** | | | ~23h |

---

## 7. LÓGICA DE MAPEAMENTO DE ACESSO

### 7.1 Como Funciona o Isolamento

```
REQUISIÇÃO CHEGA
│
├─ Header: x-tenant-id = 'tenant-abc-123'
├─ JWT: tenantId = 'tenant-abc-123'
└─ Params: tenantId = 'tenant-xyz-789'

↓

MIDDLEWARE VALIDA
├─ Tenant existe? ✓
├─ Usuário pertence a este tenant? ✓
├─ Tenant está ativo? ✓
└─ IDs coincidem (header vs JWT)? ✓

↓

QUERY EXECUTA COM FILTRO
db('affiliations')
  .where({
    tenant_id: 'tenant-abc-123'  // ← ISOLADO
  })

↓

RESULTADO: Apenas dados de tenant-abc-123
```

### 7.2 Validação em 3 Camadas

```javascript
// CAMADA 1: Middleware (valida JWT + tenant_id)
app.use(auth);                    // JWT inválido? Rejeita
app.use(tenantMiddleware);        // Tenant_id inválido? Rejeita

// CAMADA 2: Route (valida acesso ao recurso)
router.get('/affiliations/:id', 
  (req, res) => {
    const affiliationTenantId = getFromDB(req.params.id);
    if (affiliationTenantId !== req.tenant.id) {
      // Outro tenant? Rejeita!
      return res.status(403);
    }
  }
);

// CAMADA 3: Query (filtra automaticamente)
db('affiliations')
  .where('tenant_id', req.tenant.id)  // Sempre filtra
  .select();
```

**Resultado**: 3 camadas de segurança = impossível vazar

---

## 8. MUDANÇAS DE SEGURANÇA

### 8.1 NOVA VULNERABILIDADE POSSÍVEL

```
❌ INSECURO (Sem tenant_id):
db('affiliations').where('id', affId).select();
// Qualquer pessoa consegue acessar qualquer ID!

✅ SEGURO (Com tenant_id):
db('affiliations')
  .where({
    id: affId,
    tenant_id: req.tenant.id
  })
  .select();
// Só acessa se pertencer ao seu tenant
```

### 8.2 NOVOS CONTROLES DE SEGURANÇA

```javascript
// 1. Rate limit POR tenant
const tenantRateLimiter = rateLimit({
  keyGenerator: (req) => req.tenant.id,  // ← Chave por tenant
  windowMs: 15 * 60 * 1000,
  max: 100
});

// 2. Logging de acesso negado
logger.warn('Cross-tenant access attempt blocked', {
  userId: req.user.id,
  userTenant: req.user.tenantId,
  requestedTenant: req.headers['x-tenant-id'],
  timestamp: new Date()
});

// 3. Audit de todas as operações por tenant
auditLog.record({
  tenantId: req.tenant.id,
  userId: req.user.id,
  action: 'UPDATE_AFFILIATION',
  resourceId: req.params.id,
  timestamp: new Date()
});
```

---

## 9. O QUE NÃO PRECISA MUDAR

✅ Você continua usando:
- Express.js
- PostgreSQL
- JWT
- Bcrypt
- Rate Limiting
- CORS
- Helmet
- Winston Logger
- Knex.js

❌ Você NÃO precisa:
- Mudar linguagem
- Mudar banco de dados
- Reimplementar autenticação do zero
- Reescrever tudo
- Usar tecnologias novas (GraphQL, gRPC, etc)

---

## 10. ESTIMATIVA DE TRABALHO POR COMPONENTE

| Componente | Esforço | Complexidade | Risco |
|---|---|---|---|
| Schema DB + Migrations | 8h | 🔴 ALTA | 🔴 CRÍTICO |
| Tenant Middlewares | 6h | 🟡 MÉDIA | 🟡 ALTO |
| TenantQueryBuilder | 8h | 🔴 ALTA | 🟡 ALTO |
| Update Controllers | 20h | 🟡 MÉDIA | 🟡 ALTO |
| Auth JWT | 4h | 🟢 BAIXA | 🟢 BAIXO |
| Tests & Validation | 12h | 🔴 ALTA | 🔴 CRÍTICO |
| Documentation | 4h | 🟢 BAIXA | 🟢 BAIXO |
| **TOTAL** | **62h** | | |

**= ~2 semanas para 1 dev**

---

## 11. MUDANÇA NA ARQUITETURA DE CONSULTAS

### 11.1 Pattern Antigo

```javascript
// Qualquer controller pode fazer qualquer query
// Risco: vaza dados entre usuários

affiliationService.getAll()  // Retorna TUDO
```

### 11.2 Pattern Novo

```javascript
// Middleware intercepta e injeta tenant_id
// Segurança: query é naturalmente isolada

affiliationService.getAll(tenantId)  // Retorna só do tenant
```

### 11.3 Exemplo Prático

```javascript
// ANTES: Objeto global, sem contexto de tenant
const affiliationService = {
  getAll: async () => {
    return db('affiliations').select();  // ❌ Todos os dados!
  },
  
  getById: async (id) => {
    return db('affiliations')
      .where('id', id)
      .first();  // ❌ Qualquer ID, de qualquer tenant!
  }
};

// DEPOIS: Service recebe tenantId em CADA método
const affiliationService = {
  getAll: async (tenantId) => {
    if (!tenantId) throw new Error('tenantId required');
    return db('affiliations')
      .where('tenant_id', tenantId)  // ✅ Isolado
      .select();
  },
  
  getById: async (id, tenantId) => {
    if (!tenantId) throw new Error('tenantId required');
    return db('affiliations')
      .where({id, tenant_id: tenantId})  // ✅ Isolado
      .first();
  }
};
```

---

## RESUMO FINAL

### 🟢 NÃO MUDA:
- Tecnologias/dependências
- Node.js, Express, PostgreSQL
- Padrão geral (MVC)

### 🟡 MUDA ESTRUTURA:
- Schema do BD (+tenant_id)
- Queries (sempre com WHERE tenant_id)
- JWT (agora com tenantId)
- Middlewares (+2 novos)

### 🔴 MUDA SEGURANÇA:
- Validação rigorosa de tenant
- Isolamento de dados (crítico)
- Logging de acessos negados
- Rate limiting por tenant

### ⏱️ TEMPO:
- ~62 horas de desenvolvimento
- ~2 semanas com 1 dev full-time
- Risco: ALTO (data isolation é crítico)

### 🎯 CONCLUSÃO:
**Você NOT muda de stack, mas muda COMO usa a stack.**

A lógica de isolamento de dados é a mudança principal, não a tecnologia. É sobre adicionar segurança em TUDO que você já faz.

