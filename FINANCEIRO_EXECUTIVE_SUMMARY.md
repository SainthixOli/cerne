# 📈 SUMÁRIO EXECUTIVO: MÓDULO FINANCEIRO

## 🎯 O Que Precisamos Construir?

Sindicatos recebem 4 tipos de contribuição. **Sem rastreamento, o sindicato é financeiramente invisível e politicamente vulnerável.**

```
RECEITA (Entrada de $)        DESPESA (Saída de $)         INDICADORES (Saúde)
├─ Sindical    [30-40%]       ├─ Admin/Pessoal   [40-55%]  ├─ ROL (lucro operacional)
├─ Assistencial [15-25%]      ├─ Legal           [15-25%]  ├─ IAF (autonomia)
├─ Confederativa [10-15%]     ├─ Mobilização     [10-20%]  ├─ IS_e (meses de caixa)
├─ Mensal      [20-35%]       ├─ Transferências  [10-15%]  ├─ PE_a (break-even)
└─ Patrimônio  [5-15%]        └─ Social Action   [5-15%]   └─ TE (coleta efetiva)
```

---

## 🏗️ Arquitetura: 3 Camadas

### **Camada 1: Banco de Dados (9 novas tabelas)**

```sql
revenue_categories          ← Tipos de receita
revenue_entries             ← Cada pagamento de membro
expense_categories          ← Tipos de despesa
expense_entries             ← Cada gasto (com workflow de aprovação)
budget_annual               ← Orçamento planejado por categoria
financial_health_indicators ← Cache das 5 fórmulas (atualizado diariamente)
financial_audit_log         ← Log compliance (quem? quando? o quê?)
pyramid_distributions       ← Controle da repartição (60/15/5/10/10)
database_provisioning       ← Reserva para negociações (data-base)
```

**Isolamento Multi-Tenant:** Cada sindicato vê APENAS seus dados (mesma pattern que FASE 3-4)

---

### **Camada 2: Backend Services (8 serviços)**

```javascript
├─ financialRevenueService       // Registrar receita, validar coleta
├─ financialExpenseService       // Registrar despesa, workflow de aprovação
├─ financialIndicatorService     // Calcular 5 fórmulas (ROL, IAF, IS_e, PE_a, TE)
├─ financialReportService        // Montar DRE, Balanço, Cashflow
├─ financialExportService        // Excel, PDF, CSV
├─ financialAuditService         // Log compliance, rastreabilidade
├─ pyramidDistributionService    // Auto-calcular 60/15/5/10/10
└─ financialComplianceService    // Validação de imunidade fiscal
```

---

### **Camada 3: Frontend (5 seções)**

```
┌────────────────────────────────────────────────────────┐
│ DASHBOARD: Status Saúde (🟢 Saudável / 🟡 Atenção / 🔴)
│ ├─ ROL, IAF, IS_e, PE_a, TE (5 números críticos)
│ ├─ Gráficos de receita vs. despesa
│ └─ Alertas automáticos
├────────────────────────────────────────────────────────┤
│ RECEITAS: Registrar contribuições de membros
│ ├─ Novo pagamento: data, membro, valor, tipo
│ ├─ Status: Pago / Pendente / Atrasado
│ └─ Histórico por membro
├────────────────────────────────────────────────────────┤
│ DESPESAS: Workflow de aprovação
│ ├─ Novo gasto: categoria, valor, descrição, comprovante
│ ├─ Status: Pendente aprovação → Aprovado → Pago
│ └─ Orçamento vs. Realizado (por categoria)
├────────────────────────────────────────────────────────┤
│ RELATÓRIOS: Exportação
│ ├─ DRE → Excel, PDF
│ ├─ Balanço Patrimonial → Excel, PDF
│ ├─ Cashflow → Excel, PDF
│ ├─ Arrecadação por Membro → Excel
│ └─ Auditoria Fiscal → PDF
├────────────────────────────────────────────────────────┤
│ CONFIGURAÇÃO: Orçamento, categorias, permissões
│ └─ Apenas Admin
└────────────────────────────────────────────────────────┘
```

---

## 📊 As 5 Fórmulas (Núcleo da Saúde Financeira)

| # | Nome | Fórmula | Benchmark | Interpretação |
|---|------|---------|-----------|---------------|
| 1 | **ROL** (Net Operating Result) | Receita - Despesa | > 0 | Estou ganhando mais que gastando? |
| 2 | **IAF** (Financial Autonomy) | Receita Previsível / Custos Fixos | ≥ 1.0 | Minha receita cobre meus custos? |
| 3 | **IS_e** (Solvency Index) | Caixa / Custos Fixos Mensais | ≥ 6.0 meses | Quantos meses posso sobreviver? |
| 4 | **PE_a** (Break-Even Members) | Custos Fixos / (Taxa - Custo/Membro) | < Membros Atuais | Mínimo de membros para não falir? |
| 5 | **TE** (Collection Efficiency) | Recebido / Faturado | ≥ 0.85 (85%) | % de contribuições que realmente entram? |

**Status Visual:**
- 🟢 **SAUDÁVEL:** ROL > 0, IAF ≥ 1.0, IS_e ≥ 6.0, TE > 0.85
- 🟡 **ATENÇÃO:** Qualquer indicador abaixo do benchmark
- 🔴 **CRÍTICO:** Vários indicadores muito abaixo

---

## 🔄 Fluxos Principais

### Fluxo 1: Membro Paga Contribuição
```
1. Admin registra: Data, Membro, Valor, Tipo (Sindical/Assistencial/etc.)
2. Sistema auto-calcula repartição: 60% Local, 15% Fed, 5% Conf, 10% Central, 10% Gov
3. Registra em audit_log (quem? quando? quanto?)
4. Atualiza TE (Collection Efficiency Rate)
```

### Fluxo 2: Despesa Necessária
```
1. Responsável abre formulário: Categoria, Valor, Descrição, Comprovante
2. Status: "Aguardando Aprovação"
3. Aprovador (Tesoureiro/Admin) revisa:
   - Comprovante válido? ✓
   - Categoria tem orçamento? ✓
   - Valor razoável? ✓
4. Aprova → Status "Aprovado" → Pagamento liberado
5. Log em audit_log + atualiza ROL
```

### Fluxo 3: Gerar Relatório Mensal
```
1. Sistema gera automaticamente (1º dia do mês):
   - Somar receitas do mês anterior
   - Somar despesas do mês anterior
   - Calcular 5 fórmulas (ROL, IAF, IS_e, PE_a, TE)
   - Status de saúde (🟢/🟡/🔴)
2. Disponível para:
   - Tesoureiro (view + export)
   - Conselho Fiscal (auditoria)
   - Assembleia (votação)
3. Exportar em Excel/PDF
```

### Fluxo 4: Provisioning para Data-Base
```
1. Após anunciar data-base (ex: março):
   - Tesoureiro estima custos legais (histórico + previsão)
   - Cria "reserva" em database_provisioning
   - Bloqueia essa $ de outras alocações
2. Durante negociação: Monitora despesas legais vs. reserva
3. Após data-base: Relatório de used vs. planned
```

---

## 🛡️ Segurança & Conformidade

### Multi-Tenant Isolation
```javascript
// CADA sindicato vê APENAS seus dados
const tenantId = req.tenantId;
await db('revenue_entries')
  .where('tenant_id', tenantId)      // ← CRÍTICO
  .where('status', 'received');
```

### RBAC (Role-Based Access Control)
```
financial_manager  → Pode: ver tudo, aprovar despesas, editar orçamento
treasurer         → Pode: ver tudo + gerenciar usuários
fiscal_council    → Pode: ver tudo + auditoria (read-only)
admin             → Pode: TUDO
member            → Pode: ver próprio histórico de pagamento
```

### Auditoria Rigorosa
```
- Toda operação financeira é registrada
- Quem? Quando? O quê? Por quê?
- Impossível deletar histórico
- Relatório para Conselho Fiscal
```

### Validação de Imunidade Fiscal
```
- Lei: Sindicato DEVE reinvestir 100% do surplus
- Sistema valida: Nenhum centavo foi distribuído indevidamente
- Se violado: ⚠️ Sindicato perde imunidade → paga IR/INSS
```

---

## 📱 API Endpoints (Resumo)

```javascript
// RECEITAS
POST   /api/v1/financial/revenue-entries              // Registrar receita
GET    /api/v1/financial/revenue-entries?status=pending
GET    /api/v1/financial/member/:id/contribution-history

// DESPESAS
POST   /api/v1/financial/expense-entries              // Registrar despesa
PUT    /api/v1/financial/expense-entries/:id/approve  // Aprovar
PUT    /api/v1/financial/expense-entries/:id/reject   // Rejeitar

// INDICADORES
GET    /api/v1/financial/health-indicators/latest     // Últimos valores
GET    /api/v1/financial/health-status               // Status geral

// RELATÓRIOS
GET    /api/v1/financial/reports/dre?format=excel
GET    /api/v1/financial/reports/balance-sheet
GET    /api/v1/financial/reports/cashflow

// AUDITORIA
GET    /api/v1/financial/audit-log
GET    /api/v1/financial/compliance/tax-immunity-check
```

---

## 📅 Cronograma Estimado

| Fase | O Quê | Duração |
|------|-------|---------|
| 1 | Design DB + Migrations | 2-3 sem |
| 2 | API: Receitas + Despesas + Indicadores | 3-4 sem |
| 3 | Dashboard + Gráficos | 3-4 sem |
| 4 | Relatórios + Export | 2 sem |
| 5 | Auditoria + Compliance | 2 sem |
| 6 | Testes + Validação | 2 sem |
| **TOTAL** | | **14-18 semanas** |

---

## ✨ Benefícios Esperados

### Para o Sindicato
✅ Transparência fiscal (cumpre lei)  
✅ Independência financeira comprovada  
✅ Dados para assembleias e votações  
✅ Prevenção de fraude interna  
✅ Planejamento estratégico informado

### Para a Plataforma CERNE
✅ Completa de filiações → administração sindical  
✅ Nova fonte de value-add (premium feature?)  
✅ Diferencial competitivo  
✅ Dados para analytics de saúde sindical (agregado)

### Para Membros
✅ Rastreabilidade de contribuições  
✅ Confiança na gestão  
✅ Relatórios de arrecadação

---

## 🚀 Próximos Passos

1. **Revisar este planejamento** com stakeholders
2. **Refinar requerimentos:** 
   - Quais relatórios específicos?
   - Precisa integração com banco?
   - Quais impuestos/tributos considerar?
3. **Validar com advogado:** Compliance fiscal
4. **Aprovação final** e início da implementação

---

**Status:** PRONTO PARA REVISÃO  
**Documento de Referência:** FINANCEIRO_PLANNING.md (completo)  
**Data:** 1º de junho de 2026
