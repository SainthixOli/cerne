# 📋 Requisitos - Sistema Multi-Tenant CERNE

**Data**: 27 de Abril de 2026  
**Versão**: 1.0  
**Status**: Planejamento  

---

## 1. VISÃO GERAL

O CERNE evoluirá de uma aplicação **single-tenant** (um sindicato) para uma **arquitetura multi-tenant** (múltiplos sindicatos). Isso permite vender a solução para diferentes sindicatos com dados e acesso isolados.

### Stakeholders
- **Admin Técnico**: Super-admin global (gerencia toda a plataforma e sindicatos)
- **Super Admin do Sindicato**: Admin máximo de um sindicato específico
- **Admin Operacional**: Gerenciador de membros dentro de um sindicato
- **Filiados**: Usuários finais de cada sindicato

---

## 2. CASOS DE USO

### 2.1 Admin Técnico - Gestão de Sindicatos

| ID | Caso de Uso | Descrição |
|---|---|---|
| **UC-001** | Criar Novo Sindicato | Admin técnico cria novo sindicato com nome, plano e configurações |
| **UC-002** | Editar Sindicato | Modificar dados, plano, status do sindicato |
| **UC-003** | Listar Sindicatos | Visualizar todos os sindicatos com status e estatísticas |
| **UC-004** | Desativar Sindicato | Suspender operações de um sindicato (compliance/segurança) |
| **UC-005** | Exportar Auditoria | Gerar relatório de todas as ações de um sindicato |
| **UC-006** | Monitorar Uso de Recursos | Ver armazenamento, usuários, requisições por sindicato |

### 2.2 Admin Técnico - Gestão de Admins

| ID | Caso de Uso | Descrição |
|---|---|---|
| **UC-007** | Criar Super Admin do Sindicato | Criar primeira conta de admin para novo sindicato |
| **UC-008** | Redefinir Senha | Resetar senha de super admin de um sindicato |
| **UC-009** | Revogar Acesso | Remover acesso de um super admin (desligamento) |
| **UC-010** | Auditar Ações Admin | Ver histórico de ações de admins específicos |

### 2.3 Admin Técnico - Monitoramento

| ID | Caso de Uso | Descrição |
|---|---|---|
| **UC-011** | Dashboard Técnico | Visão consolidada de saúde de todos os sindicatos |
| **UC-012** | Alertas de Segurança | Receber notificações de anomalias por sindicato |
| **UC-013** | Relatório de Performance | Métricas de velocidade e disponibilidade |
| **UC-014** | Verificar Logs Globais | Acessar logs de qualquer sindicato para troubleshooting |

---

## 3. REQUISITOS FUNCIONAIS

### 3.1 Isolamento de Dados (RF-001)
- **RF-001.1**: Cada sindicato deve ter dados completamente isolados
- **RF-001.2**: Um usuário de sindicato A NÃO pode acessar dados de sindicato B
- **RF-001.3**: Queries devem sempre filtrar por tenant_id automaticamente
- **RF-001.4**: Banco de dados deve ter constraints para garantir isolamento

### 3.2 Identificação de Tenant (RF-002)
- **RF-002.1**: Cada requisição deve incluir identificação do sindicato (tenant_id)
- **RF-002.2**: Tenant_id pode vir de: JWT claims, header, URL, subdomínio
- **RF-002.3**: Validar tenant_id contra usuário autenticado
- **RF-002.4**: Rejeitar requisições com tenant_id inválido

### 3.3 Gestão de Planos (RF-003)
- **RF-003.1**: Criar planos (Free, Professional, Enterprise)
- **RF-003.2**: Cada plano tem limites (usuários, armazenamento, requisições/mês)
- **RF-003.3**: Monitorar consumo e alertar quando próximo do limite
- **RF-003.4**: Downgrade automático se limite ultrapassado

### 3.4 Criação de Sindicatos (RF-004)
- **RF-004.1**: Admin técnico cria novo sindicato
- **RF-004.2**: Sistema gera dados iniciais (super admin, BD, configurações)
- **RF-004.3**: Sindicato começa em estado "ATIVO"
- **RF-004.4**: Enviar credenciais de super admin por email seguro

### 3.5 Acesso Baseado em Tenant (RF-005)
- **RF-005.1**: Rotas administrativas verificam tenant_id
- **RF-005.2**: Super admin de sindicato A só vê dados do sindicato A
- **RF-005.3**: Admin técnico pode acessar TODOS os sindicatos (modo audit)
- **RF-005.4**: Filiados só acessam sua conta dentro do sindicato

### 3.6 Auditoria Multi-Tenant (RF-006)
- **RF-006.1**: Log de TODAS as ações com tenant_id e usuário
- **RF-006.2**: Rastrear criação, edição, exclusão em cada sindicato
- **RF-006.3**: Admin técnico pode filtrar auditoria por sindicato
- **RF-006.4**: Retenção de logs por no mínimo 12 meses

---

## 4. REQUISITOS NÃO-FUNCIONAIS

### 4.1 Performance (RNF-001)
- **RNF-001.1**: Query isolation < 50ms overhead
- **RNF-001.2**: Suportar até 1000 sindicatos simultâneos
- **RNF-001.3**: Cache em memória para tenant_id frequentes

### 4.2 Segurança (RNF-002)
- **RNF-002.1**: Validação rigorosa de tenant_id em TODA requisição
- **RNF-002.2**: Criptografia de dados sensíveis por tenant
- **RNF-002.3**: Rate limiting por tenant
- **RNF-002.4**: Isolamento de secrets por tenant

### 4.3 Escalabilidade (RNF-003)
- **RNF-003.1**: Suportar crescimento horizontal (múltiplas instâncias)
- **RNF-003.2**: Banco de dados particionado por tenant (opcional, fase 2)
- **RNF-003.3**: Cache distribuído (Redis) para dados compartilhados

### 4.4 Recuperação de Desastres (RNF-004)
- **RNF-004.1**: Backup automático por tenant
- **RNF-004.2**: Restore independente de um sindicato sem afetar outros
- **RNF-004.3**: RTO: 4 horas, RPO: 1 hora

### 4.5 Conformidade (RNF-005)
- **RNF-005.1**: LGPD - Direito ao esquecimento por tenant
- **RNF-005.2**: Possibilidade de exportar dados de um sindicato
- **RNF-005.3**: Logs auditáveis para compliance

---

## 5. ARQUITETURA PROPOSTA

### 5.1 Estratégia de Isolamento de Dados

```
OPÇÃO 1: Row-Level Security (RLS) com PostgreSQL
├─ Um banco de dados compartilhado
├─ Todas as tabelas têm coluna tenant_id
├─ RLS policy garante isolamento no BD
└─ ✅ Mais simples, ❌ Menos seguro

OPÇÃO 2: Banco de Dados por Tenant (Recommended)
├─ Um BD por sindicato
├─ Admin técnico tem acesso a múltiplos BDs
├─ Melhor isolamento, melhor performance
└─ ✅ Mais seguro, ❌ Mais complexo

OPÇÃO 3: Híbrido
├─ Dados compartilhados (users globais, planos) = BD central
├─ Dados específicos (membros, filiações) = BD por tenant
└─ Balanço entre complexidade e segurança
```

**Recomendação**: OPÇÃO 2 (Banco por Tenant) para segurança máxima

### 5.2 Fluxo de Autenticação Multi-Tenant

```
Usuário Faz Login
    ↓
Valida credenciais no BD do Sindicato (tenant_id)
    ↓
JWT incluir: user_id, tenant_id, role
    ↓
Middleware valida JWT e tenant_id em TODA requisição
    ↓
Query automaticamente filtra por tenant_id
```

### 5.3 Middleware de Tenant

```typescript
// Pseudocódigo
async function tenantMiddleware(req, res, next) {
  const tenantId = req.headers['x-tenant-id'] || 
                   req.user?.tenant_id ||
                   req.params.tenantId;
  
  // Validar tenant_id
  if (!tenantId) return res.status(400).json({error: 'Missing tenant'});
  
  // Verificar se usuário tem acesso a esse tenant
  const hasAccess = await checkTenantAccess(req.user.id, tenantId);
  if (!hasAccess) return res.status(403).json({error: 'Access denied'});
  
  // Anexar ao request
  req.tenant = { id: tenantId, db: getTenantDB(tenantId) };
  next();
}
```

---

## 6. MUDANÇAS DE BANCO DE DADOS

### 6.1 Nova Tabela: `tenants`

```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  plan VARCHAR(50) DEFAULT 'professional',
  status VARCHAR(50) DEFAULT 'ATIVO' -- ATIVO, SUSPENSO, INATIVO
  database_url TEXT, -- Se BD separado
  storage_used_gb DECIMAL(10, 2) DEFAULT 0,
  users_count INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP,
  technical_admin_id UUID -- Referência ao admin técnico
);

CREATE TABLE tenant_super_admins (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### 6.2 Modificações em Tabelas Existentes

```sql
-- Adicionar tenant_id a todos os dados de usuários
ALTER TABLE users ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE affiliations ADD COLUMN tenant_id UUID REFERENCES tenants(id);
ALTER TABLE documents ADD COLUMN tenant_id UUID REFERENCES tenants(id);

-- Criar índices para performance
CREATE INDEX idx_users_tenant_id ON users(tenant_id);
CREATE INDEX idx_affiliations_tenant_id ON affiliations(tenant_id);
CREATE INDEX idx_documents_tenant_id ON documents(tenant_id);
```

---

## 7. MUDANÇAS DE CÓDIGO

### 7.1 Controllers

**Antes (Single-tenant)**:
```javascript
async getAffiliations(req, res) {
  const affiliations = await Affiliation.find();
  res.json(affiliations);
}
```

**Depois (Multi-tenant)**:
```javascript
async getAffiliations(req, res) {
  const { tenantId } = req.tenant;
  const affiliations = await Affiliation.where({tenant_id: tenantId}).find();
  res.json(affiliations);
}
```

### 7.2 Modelos

Adicionar hook para filtrar automaticamente por tenant:

```javascript
// Model base
class BaseModel {
  static async find(where = {}) {
    // Injetar tenant_id automaticamente
    const tenantId = getCurrentTenantId();
    return db.query({...where, tenant_id: tenantId});
  }
}
```

---

## 8. PLANOS DE SINDICATO

| Plano | Usuários | Armazenamento | Requisições/mês | Suporte |
|---|---|---|---|---|
| **Free** | 50 | 5GB | 50k | Chat |
| **Professional** | 500 | 100GB | 500k | Email + Phone |
| **Enterprise** | Ilimitado | 1TB | Ilimitado | Dedicado |

---

## 9. RISCOS E MITIGAÇÃO

| Risco | Impacto | Mitigação |
|---|---|---|
| Vazamento de dados entre tenants | CRÍTICO | Row-level security + validação rigorosa |
| Performance com N sindicatos | ALTO | Índices, cache, possível particionamento |
| Erro em migração de BD | CRÍTICO | Backup antes, teste em staging |
| Admin técnico sobrecarga | MÉDIO | Automação, alertas proativos |

---

## 10. DEPENDÊNCIAS E TECNOLOGIAS

- **Backend**: Node.js + Express (mantém)
- **BD**: PostgreSQL ou múltiplas instâncias
- **Cache**: Redis para dados globais
- **Auth**: JWT com tenant_id
- **Logging**: Winston com filtro por tenant
- **Monitoramento**: Prometheus/Grafana por tenant

---

## 11. PRÓXIMOS PASSOS

1. ✅ Documentar requisitos (ESTE DOCUMENTO)
2. ⏳ Criar roadmap detalhado com tasks
3. ⏳ Desenhar arquitetura de BD
4. ⏳ Criar protótipo de middleware
5. ⏳ Implementação fase por fase

---

**Aprovação**: Pendente  
**Revisor Técnico**: Oliver Arthur  
**Data de Revisão**: -

