# 📋 FASE 0: MAPEAMENTO COMPLETO - PREPARAÇÃO MULTI-TENANT

**Data**: 7 de Maio de 2026  
**Status**: 🟡 EM PROGRESSO  
**Objetivo**: Mapear TODAS as mudanças necessárias antes de implementar  

---

## 1. ANÁLISE DE TABELAS: O QUE PRECISA MUDAR

### 1.1 Tabelas Principais (Total: 11 tabelas)

| Tabela | Colunas Atuais | +tenant_id | Criticidade | Dependências |
|--------|---|---|---|---|
| `profiles` | id, nome_completo, cpf, email, role, status_conta | ✅ SIM | 🔴 CRÍTICA | Base para filtros |
| `filiacoes` | id, user_id, status, data_solicitacao | ✅ SIM | 🔴 CRÍTICA | Ligada a profiles |
| `documentos` | id, user_id, filiacao_id, url_arquivo | ✅ SIM | 🔴 CRÍTICA | Ligada a filiacoes |
| `conversations` | id, admin_id, user_id | ✅ SIM | 🟠 ALTA | Chat direto |
| `messages` | id, conversation_id, sender_id, content | ✅ SIM | 🟠 ALTA | Ligada a conversations |
| `notifications` | id, title, target_group, created_by | ✅ SIM | 🟠 ALTA | Broadcast por tenant |
| `filiation_chat` | id, filiacao_id, sender_id, message | ✅ SIM | 🟠 ALTA | Chat de filiação |
| `admin_evaluations` | id, admin_id, month_ref, score | ✅ SIM | 🟡 MÉDIA | Avaliações admin |
| `system_settings` | key, value | ⚠️ PARCIAL | 🟡 MÉDIA | Por tenant |
| `audit_logs` (se existir) | *(criar)* | ✅ SIM | 🟠 ALTA | Conformidade |
| `security_alerts` (se existir) | *(criar)* | ✅ SIM | 🟠 ALTA | Segurança |

### 1.2 Novas Tabelas Necessárias

#### Tabela: `tenants`
```sql
CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    status TEXT CHECK(status IN ('ATIVO', 'SUSPENSO', 'INATIVO')) DEFAULT 'ATIVO',
    plan TEXT CHECK(plan IN ('free', 'professional', 'enterprise')) DEFAULT 'professional',
    database_url TEXT,
    storage_used_gb DECIMAL(10,2) DEFAULT 0,
    users_count INTEGER DEFAULT 0,
    technical_admin_id UUID REFERENCES profiles(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX(status),
    INDEX(created_at)
);
```

#### Tabela: `tenant_super_admins`
```sql
CREATE TABLE tenant_super_admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    INDEX(tenant_id),
    UNIQUE(tenant_id, user_id)
);
```

---

## 2. MAPEAMENTO DE QUERIES: MODIFICAÇÕES NECESSÁRIAS

### 2.1 Controllers Afetados (Total: 10 arquivos)

#### Controllers/Files to Modify

| Arquivo | Queries | Status |
|---------|---------|--------|
| `affiliationController.js` | 12+ | 🔴 NÃO INICIADO |
| `authController.js` | 8+ | 🔴 NÃO INICIADO |
| `adminController.js` | 15+ | 🔴 NÃO INICIADO |
| `profileController.js` | 6+ | 🔴 NÃO INICIADO |
| `documentController.js` | 8+ | 🔴 NÃO INICIADO |
| `chatController.js` | 10+ | 🔴 NÃO INICIADO |
| `notificationController.js` | 6+ | 🔴 NÃO INICIADO |
| `systemController.js` | 4+ | 🔴 NÃO INICIADO |
| `settingsController.js` | 3+ | 🔴 NÃO INICIADO |
| `reportsController.js` | 5+ | 🔴 NÃO INICIADO |

**Total de queries a modificar**: ~77 queries

### 2.2 Services Afetados (Total: 10 arquivos)

| Arquivo | Queries | Status |
|---------|---------|--------|
| `affiliationQueryService.js` | 8+ | 🔴 NÃO INICIADO |
| `affiliationReviewService.js` | 6+ | 🔴 NÃO INICIADO |
| `affiliationTransferService.js` | 7+ | 🔴 NÃO INICIADO |
| `affiliationChatService.js` | 5+ | 🔴 NÃO INICIADO |
| `auditService.js` | 4+ | 🔴 NÃO INICIADO |
| `emailService.js` | 2+ | 🔴 NÃO INICIADO |
| `securityAlertService.js` | 3+ | 🔴 NÃO INICIADO |
| `pdfService.js` | 1+ | 🔴 NÃO INICIADO |
| `mfaManager.js` | 2+ | 🔴 NÃO INICIADO |
| `encryptionManager.js` | 1+ | 🔴 NÃO INICIADO |

**Total de queries a modificar**: ~39 queries

### 2.3 Models Afetados (Total: 1 arquivo)

| Arquivo | Queries | Status |
|---------|---------|--------|
| `User.js` | 8+ | 🔴 NÃO INICIADO |

**Total de queries a modificar**: ~8 queries

---

## 3. PADRÃO DE MODIFICAÇÃO

### Exemplo 1: Query Simples SELECT

**ANTES**:
```javascript
const user = await db.get('SELECT * FROM profiles WHERE email = ?', [email]);
```

**DEPOIS**:
```javascript
const user = await db.get(
    'SELECT * FROM profiles WHERE email = ? AND tenant_id = ?', 
    [email, req.user.tenantId]
);
```

### Exemplo 2: INSERT com tenant_id

**ANTES**:
```javascript
await db.run(
    `INSERT INTO filiacoes (user_id, status) VALUES (?, ?)`,
    [userId, 'em_processamento']
);
```

**DEPOIS**:
```javascript
await db.run(
    `INSERT INTO filiacoes (tenant_id, user_id, status) VALUES (?, ?, ?)`,
    [tenantId, userId, 'em_processamento']
);
```

### Exemplo 3: UPDATE com validação tenant

**ANTES**:
```javascript
await db.run(
    `UPDATE profiles SET nome_completo = ? WHERE id = ?`,
    [nome, profileId]
);
```

**DEPOIS**:
```javascript
// Validar que o perfil pertence ao tenant
const profile = await db.get(
    'SELECT * FROM profiles WHERE id = ? AND tenant_id = ?',
    [profileId, tenantId]
);
if (!profile) throw new Error('Profile not found in tenant');

await db.run(
    `UPDATE profiles SET nome_completo = ? WHERE id = ? AND tenant_id = ?`,
    [nome, profileId, tenantId]
);
```

---

## 4. PLANO DE AÇÃO FASE 0 (1 Semana)

### Semana 1: Preparação

#### Dia 1: Auditoria Completa
- [ ] Verificar TODAS as queries no backend
- [ ] Criar script que identifica queries sem tenant_id
- [ ] Documentar criticidade de cada query
- **Entregável**: Lista completa de 124 queries + criticidade

#### Dia 2: Design de Banco de Dados
- [ ] Revisar schema proposto para tenants
- [ ] Definir estratégia de UUIDs vs INTs
- [ ] Criar ER diagram com tenant_id
- [ ] Definir índices necessários
- **Entregável**: SQL pronto para migrations

#### Dia 3: Setup de Ambiente
- [ ] Criar branch `feature/multi-tenant-phase-1`
- [ ] Configurar variáveis de ambiente (TENANT_ID, etc)
- [ ] Criar script de seed para testes multi-tenant
- [ ] Setup de PostgreSQL/SQLite com múltiplos bancos (se Opção 2)
- **Entregável**: Ambiente pronto

#### Dia 4-5: Documentação
- [ ] Criar MODIFICATION_CHECKLIST.md (lista de 124 queries)
- [ ] Documentar padrões de modificação
- [ ] Criar scripts de migração
- [ ] Backup strategy
- **Entregável**: Documentação técnica

#### Dia 6-7: Review e Aprovação
- [ ] Review com stakeholders
- [ ] Aprovação de arquitetura
- [ ] Preparar Fase 1
- **Entregável**: Aprovação para iniciar Fase 1

---

## 5. CHECKLIST DE PREPARAÇÃO

### 5.1 Auditoria
- [ ] Todas as 11 tabelas mapeadas
- [ ] Todas as 124+ queries identificadas
- [ ] Criticidade de cada query definida
- [ ] Dependências mapeadas

### 5.2 Banco de Dados
- [ ] Schema das novas tabelas (tenants, tenant_super_admins) criado
- [ ] Índices definidos
- [ ] Foreign keys planejadas
- [ ] Estratégia de migração definida

### 5.3 Código
- [ ] Branch `feature/multi-tenant-phase-1` criada
- [ ] Variáveis de ambiente configuradas
- [ ] Script de seed funcional
- [ ] Padrões de modificação documentados

### 5.4 Documentação
- [ ] MODIFICATION_CHECKLIST.md criado
- [ ] Exemplos de queries antes/depois
- [ ] Guia de migração escrito
- [ ] Rollback strategy documentada

---

## 6. RISCOS E MITIGAÇÃO

| Risco | Impacto | Mitigação |
|-------|---------|-----------|
| Query mal modificada quebra produção | 🔴 CRÍTICO | Testes unitários + staging |
| Dados de outro tenant visíveis | 🔴 CRÍTICO | Validação cruzada em 100% queries |
| Migração sem rollback | 🔴 CRÍTICO | Backup + scripts de reversão |
| Performance degradada | 🟠 ALTA | Índices + load testing |
| Inconsistência de dados | 🟠 ALTA | Validação em camadas |

---

## 7. PRÓXIMOS PASSOS

✅ **Dia 1 (Hoje)**:
1. Executar script de auditoria de queries
2. Gerar lista completa de 124 queries
3. Criar documento MODIFICATION_CHECKLIST.md

⏳ **Dia 2-7**:
1. Implementar padrões de modificação
2. Criar migrations Knex
3. Setup de ambiente multi-tenant
4. Review final

---

## 8. STATUS ATUAL

| Tarefa | Status | Responsável | Prazo |
|--------|--------|-------------|-------|
| Auditoria de tabelas | ✅ COMPLETO | Agent | 7-mai |
| Mapeamento de queries | 🟡 50% | Agent | 7-mai |
| Design de DB | 🟡 50% | Agent | 7-mai |
| Setup de ambiente | 🔴 NÃO INICIADO | Agent | 8-mai |
| Documentação completa | 🔴 NÃO INICIADO | Agent | 9-mai |

---

**Data Atualização**: 7 de Maio de 2026  
**Próxima Review**: Fim do Dia 7 de Maio
