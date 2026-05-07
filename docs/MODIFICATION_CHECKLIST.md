# ✅ MODIFICATION CHECKLIST - 78 QUERIES A MODIFICAR

**Data**: 7 de Maio de 2026  
**Total de Queries**: 78  
**Criticidade**: 3 CRÍTICA | 50 ALTA | 25 MÉDIA  
**Status**: 🟡 EM PROGRESSO  

---

## 📊 RESUMO

| Aspecto | Valor |
|--------|-------|
| Total de queries a modificar | 78 |
| Arquivos afetados | 12 |
| Tabelas impactadas | 11 |
| Esforço estimado | 35-40 horas |
| Prioridade de início | affiliationRepository.js |

---

## 🔴 CRÍTICAS (3 queries - FAZER PRIMEIRO!)

### 1. DELETE FROM filiation_chat
- **Arquivo**: `repositories/affiliationRepository.js` - Line 49
- **Atual**: `DELETE FROM filiation_chat WHERE filiacao_id = ?`
- **Modificar para**: `DELETE FROM filiation_chat WHERE filiacao_id = ? AND tenant_id = ?`
- **Status**: 🔴 NÃO INICIADO
- **Impacto**: DELETE sem filtro = perder dados de outros tenants

```javascript
// ANTES
return db.run('DELETE FROM filiation_chat WHERE filiacao_id = ?', [affiliationId]);

// DEPOIS
return db.run(
    'DELETE FROM filiation_chat WHERE filiacao_id = ? AND tenant_id = ?', 
    [affiliationId, tenantId]
);
```

### 2. INSERT INTO audit_logs
- **Arquivo**: `services/auditService.js` - Line 7
- **Atual**: `INSERT INTO audit_logs (admin_id, action_type, target_id, details) VALUES (?, ?, ?, ?)`
- **Modificar para**: Adicionar `tenant_id` no INSERT
- **Status**: 🔴 NÃO INICIADO
- **Impacto**: Auditoria de segurança quebrada

```javascript
// ANTES
`INSERT INTO audit_logs (admin_id, action_type, target_id, details) VALUES (?, ?, ?, ?)`

// DEPOIS
`INSERT INTO audit_logs (tenant_id, admin_id, action_type, target_id, details) VALUES (?, ?, ?, ?, ?)`
```

### 3. Consulta agregada de audit_logs
- **Arquivo**: `services/auditService.js` - Line 20
- **Atual**: `FROM audit_logs a WHERE ...`
- **Modificar para**: Adicionar filtro `a.tenant_id = ?`
- **Status**: 🔴 NÃO INICIADO
- **Impacto**: Relatórios de segurança podem expor dados

---

## 🟠 ALTA PRIORIDADE - AGRUPAR POR ARQUIVO

### affiliationRepository.js (14 queries)

| # | Line | Operation | Table | Status | Query |
|---|------|-----------|-------|--------|-------|
| 1 | 5 | SELECT | profiles | 🔴 | `SELECT id FROM profiles WHERE id = ?` |
| 2 | 10 | SELECT | filiacoes | 🔴 | `SELECT id, user_id FROM filiacoes WHERE id = ?` |
| 3 | 15 | SELECT | profiles | 🔴 | `SELECT * FROM profiles WHERE id = ?` |
| 4 | 49 | DELETE | filiation_chat | 🔴 | `DELETE FROM filiation_chat WHERE filiacao_id = ?` |
| 5 | 55 | INSERT | filiation_chat | 🔴 | `INSERT INTO filiation_chat (...)` |
| 6 | 61 | SELECT | filiation_chat | 🔴 | `SELECT * FROM filiation_chat WHERE filiacao_id = ?` |
| 7 | 67 | SELECT | documentos | 🔴 | `SELECT * FROM documentos WHERE user_id = ?` |
| 8 | 73 | INSERT | documentos | 🔴 | `INSERT INTO documentos (...)` |
| 9 | 79 | SELECT | filiacoes | 🔴 | `SELECT * FROM filiacoes WHERE user_id = ?` |
| 10 | 85 | UPDATE | filiacoes | 🔴 | `UPDATE filiacoes SET status = ?` |
| 11 | 91 | SELECT | filiacoes | 🔴 | `SELECT * FROM filiacoes WHERE status = ?` |
| 12 | 97 | SELECT | profiles | 🔴 | `SELECT * FROM profiles WHERE role = 'admin'` |
| 13 | 103 | UPDATE | profiles | 🔴 | `UPDATE profiles SET status_conta = ?` |
| 14 | 109 | DELETE | filiacoes | 🔴 | `DELETE FROM filiacoes WHERE id = ?` |

**Padrão de Modificação**:
```javascript
// ANTES
db.get('SELECT * FROM filiacoes WHERE id = ?', [id])

// DEPOIS
db.get('SELECT * FROM filiacoes WHERE id = ? AND tenant_id = ?', [id, tenantId])
```

### affiliationController.js (14 queries)
- **Status**: 🔴 NÃO INICIADO
- **Padrão**: Adicionar `req.user.tenantId` a todas as queries
- **Crítico**: Validar que user_id pertence ao tenant

### chatController.js (11 queries)
- **Status**: 🔴 NÃO INICIADO
- **Crítico**: Conversas são sensíveis, validar tenant em 100%

### reportsController.js (9 queries)
- **Status**: 🔴 NÃO INICIADO
- **Crítico**: Relatórios não devem expor dados de outro tenant

### adminController.js (7 queries)
- **Status**: 🔴 NÃO INICIADO
- **Padrão**: Filtros de admin devem validar tenant

### models/User.js (6 queries)
- **Status**: 🔴 NÃO INICIADO
- **Crítico**: Base de todas as queries de usuário

---

## 🟡 MÉDIA PRIORIDADE (25 queries)

### Por arquivo:
| Arquivo | Qty | Status |
|---------|-----|--------|
| systemController.js | 4 | 🔴 |
| notificationController.js | 4 | 🔴 |
| documentController.js | 4 | 🔴 |
| settingsController.js | 2 | 🔴 |
| auditService.js | 2 | 🔴 |
| pdfService.js | 1 | 🔴 |
| UNKNOWN | 6 | 🔴 |

---

## 📋 PADRÕES DE MODIFICAÇÃO

### Padrão 1: SELECT Simples

```javascript
// ANTES
db.get('SELECT * FROM profiles WHERE email = ?', [email])

// DEPOIS - com validação
// Garantir que req.user.tenantId está disponível
db.get(
    'SELECT * FROM profiles WHERE email = ? AND tenant_id = ?', 
    [email, req.user.tenantId]
)
```

### Padrão 2: INSERT com tenant_id

```javascript
// ANTES
await db.run(
    'INSERT INTO filiacoes (user_id, status) VALUES (?, ?)',
    [userId, status]
)

// DEPOIS
// Validar que userId pertence ao tenant
const user = await db.get(
    'SELECT * FROM profiles WHERE id = ? AND tenant_id = ?',
    [userId, req.user.tenantId]
);
if (!user) throw new Error('User not found in tenant');

await db.run(
    'INSERT INTO filiacoes (tenant_id, user_id, status) VALUES (?, ?, ?)',
    [req.user.tenantId, userId, status]
)
```

### Padrão 3: UPDATE com validação

```javascript
// ANTES
await db.run('UPDATE profiles SET nome = ? WHERE id = ?', [nome, id])

// DEPOIS
// Validar ownership do recurso
const profile = await db.get(
    'SELECT * FROM profiles WHERE id = ? AND tenant_id = ?',
    [id, req.user.tenantId]
);
if (!profile) throw new Error('Profile not found in tenant');

await db.run(
    'UPDATE profiles SET nome = ? WHERE id = ? AND tenant_id = ?',
    [nome, id, req.user.tenantId]
)
```

### Padrão 4: DELETE com validação cruzada

```javascript
// ANTES
await db.run('DELETE FROM filiation_chat WHERE filiacao_id = ?', [filiacaoId])

// DEPOIS
// Validar que filiação pertence ao tenant
const filiacao = await db.get(
    'SELECT * FROM filiacoes WHERE id = ? AND tenant_id = ?',
    [filiacaoId, req.user.tenantId]
);
if (!filiacao) throw new Error('Filiação not found in tenant');

await db.run(
    'DELETE FROM filiation_chat WHERE filiacao_id = ? AND tenant_id = ?',
    [filiacaoId, req.user.tenantId]
)
```

---

## 🛠️ PLANO DE EXECUÇÃO

### Fase 1: Preparação (Hoje)
- [ ] Revisar este documento
- [ ] Preparar branch `feature/multi-tenant-phase-1`
- [ ] Validar padrões de modificação

### Fase 2: Implementação (Dias 1-3)
- [ ] Modificar models/User.js (6 queries) - 2 horas
- [ ] Modificar repositories/affiliationRepository.js (14 queries) - 4 horas
- [ ] Testes unitários para repository - 2 horas
- [ ] Validar integridade de dados - 1 hora

### Fase 3: Controllers (Dias 4-5)
- [ ] Modificar affiliationController.js (14 queries) - 4 horas
- [ ] Modificar chatController.js (11 queries) - 3 horas
- [ ] Testes de integração - 2 horas

### Fase 4: Services (Dia 6)
- [ ] Modificar services (20+ queries) - 5 horas
- [ ] Validação final - 1 hora

### Fase 5: Review (Dia 7)
- [ ] Code review completo
- [ ] Testes end-to-end
- [ ] Aprovação para staging

---

## ✅ CHECKLIST DE VALIDAÇÃO

Após modificar cada arquivo:

- [ ] Todas as queries têm filtro tenant_id
- [ ] Sem queries com SELECT * (usar campos específicos)
- [ ] Todas as queries têm validação de ownership
- [ ] Testes unitários passam 100%
- [ ] Nenhuma query vaza dados de outro tenant
- [ ] Performance de queries está ok (< 100ms)

---

## 🚨 TESTES CRÍTICOS

Após implementação, executar:

```bash
# Teste 1: Validar isolamento
npm test -- --grep "tenant isolation"

# Teste 2: Validar ownership
npm test -- --grep "resource ownership"

# Teste 3: Validar performance
npm test -- --grep "query performance"

# Teste 4: Validar segurança
npm test -- --grep "cross-tenant access"
```

---

## 📈 PROGRESSO

| Etapa | Total | Completo | % | ETA |
|-------|-------|----------|---|-----|
| Models (User.js) | 6 | 0 | 0% | 9-mai |
| Repository | 14 | 0 | 0% | 10-mai |
| Controllers | 35 | 0 | 0% | 12-mai |
| Services | 20 | 0 | 0% | 13-mai |
| **TOTAL** | **78** | **0** | **0%** | **14-mai** |

---

## 🎯 PRÓXIMOS PASSOS

1. **Hoje (7-mai)**: ✅ Auditoria completa + Checklist
2. **Amanhã (8-mai)**: 🔴 Começar models/User.js
3. **10-mai**: 🔴 Implementar repository
4. **12-mai**: 🔴 Implementar controllers
5. **14-mai**: 🔴 Review e validação

---

**Status Final**: 🟡 Preparação Concluída - Pronto para Implementação  
**Última Atualização**: 7 de Maio de 2026  
**Próxima Review**: Fim do Dia 8 de Maio
