# 📊 PLANEJAMENTO: MÓDULO DE GESTÃO FINANCEIRA - CERNE SISTEMA

**Data:** 1º de junho de 2026  
**Status:** PLANEJAMENTO (Fase de Concepção)  
**Documento Base:** Union Financial Health Guide (PDF)  
**Escopo:** Multi-tenant Financial Management System

---

## 📋 SUMÁRIO EXECUTIVO

O **CERNE Sistema** passou pela transformação segura para multi-tenant (FASE 1-4). Agora, a adição de um **Módulo de Gestão Financeira** transformará o sistema de simples gestor de filiações para uma **plataforma completa de administração sindical**.

**Justificativa:**
- Sindicatos recebem contribuições de membros (sindical, assistencial, confederativa, mensal)
- Sem rastreamento financeiro, sindicatos não conseguem comprovar saúde fiscal
- Lei exige transparência fiscal e auditoria externa
- Pilar de autonomia política é independência financeira

---

## 🏗️ PARTE 1: ANÁLISE DO DOCUMENTO "UNION FINANCIAL HEALTH GUIDE"

### 1.1 Estrutura de Receitas (Inflows)

| **Tipo** | **Natureza** | **% Típico** | **Descrição** |
|----------|-----------|-----------|-----------|
| **Sindical Contribution** | Facultativa | 30-40% | Autorização prévia do trabalhador. Base do modelo. |
| **Assistencial Contribution** | Negociada | 15-25% | Custeio de dissídios (negociações coletivas). |
| **Confederativa Contribution** | Mandatory (formal members) | 10-15% | Sistema confederativo tripartite. |
| **Union Monthly Fee** | Voluntária | 20-35% | Serviços diretos + fidelização. **Mais sustentável.** |
| **Asset Income** | Investimentos | 5-15% | Aluguel de imóveis, juros, rendimentos. |

### 1.2 A "Repartição Oficial" (Pyramid Split)

```
RECEITA SINDICAL = 100%
  ├─ 60% → Local Union (base)
  ├─ 15% → Federation (estado)
  ├─ 5%  → Confederation (nacional)
  ├─ 10% → Union Central (central dos sindicatos)
  └─ 10% → Government (FGTS - Special Account)
```

**Implicação:** Local union retém apenas 60% do que coleta.

### 1.3 Estrutura de Despesas (Outflows) - Estratégia de Alocação

| **Categoria** | **% Típico** | **Tipo** | **Descrição** |
|--------------|-----------|--------|-----------|
| **Admin & Pessoal** | 40-55% | Operacional/Fixo | Salários, aluguel, utilidades. Eficiência aqui = mais $ para luta. |
| **Legal Services** | 15-25% | Finalistico/Semivariável | Defesa de direitos, negociações coletivas. **Core do sindicato.** |
| **Communication & Mobilization** | 10-20% | Variável/Discricionária | Visibilidade, greves, campanhas. |
| **Statutory Transfers** | 10-15% | Fixo/Compulsório | Pagamentos a entidades superiores. |
| **Social Action & Leisure** | 5-15% | Variável/Discricionária | Clínicas, clubes de férias, benefícios. |

### 1.4 As 5 Fórmulas Vitais de Saúde Financeira

#### **Fórmula 1: ROL - Net Operating Result**
```
ROL = (R_ass + R_neg + R_pat + R_ext) - (C_adm + C_oper + C_mob + C_rep)
    = (Sindical + Assistencial + Patrimônio + Extra) - (Todos os custos)

✓ Interpretação: Estou ganhando mais que gastando?
✓ Alerta: ROL negativo = depletando reservas apenas para existir
```

#### **Fórmula 2: IAF - Financial Autonomy Index**
```
IAF = (R_ass + R_pat) / (C_adm + C_oper)
    = (Receita previsível) / (Custos básicos)

✓ Interpretação: Minha receita mensal cobre meus custos fixos?
✓ Alerta: IAF < 1.0 = vulnerável. Sindicato "à mercê" da próxima negociação
✓ Benchmarkk: IAF ≥ 1.0 (independência mínima)
```

#### **Fórmula 3: IS_e - Solvency Index (Emergency Reserve)**
```
IS_e = (AL_con + AF_liq) / (C_fix_mensal)
     = (Caixa em mão) / (Gastos fixos mensais)

✓ Interpretação: Quantos meses posso sobreviver sem receita?
✓ Benchmark: IS_e ≥ 6.0 (6 meses de sobrevivência)
✓ Cenário crítico: Greve massiva, batalha legal.
```

#### **Fórmula 4: PE_a - Affiliation Break-even Point**
```
PE_a = CF / (M_med - CV_med)
     = (Custos fixos) / (Taxa média por membro - Custo de servir)

✓ Interpretação: Mínimo de membros para não ter deficit estrutural?
✓ Alerta: Membros atuais < PE_a = DEFICIT ESTRUTURAL
```

#### **Fórmula 5: TE - Collection Efficiency Rate**
```
TE = (Total Efetivamente Recebido) / (Total Faturado/Esperado)

✓ Interpretação: % de contribuições que realmente entram?
✓ Alerta: TE < 0.85 (85%) = dados sujos ou processo quebrado
✓ Benchmark: TE ≥ 0.85
```

### 1.5 Riscos: Profissional vs. Patronal

| **Dimensão** | **Sindicatos Profissionais (Trabalhadores)** | **Sindicatos Patronais (Empregadores)** |
|-------------|------|------|
| Base de Receita | Milhares (pulverizado) | Poucas empresas grandes (concentrado) |
| Vulnerabilidade | Desemprego, rotatividade | Fusões, saúde do setor |
| Ativos | Liquidez alta, imóveis (clubes) | Ativos institucionais, fundos LT |

---

## 🎯 PARTE 2: REQUISITOS DO MÓDULO FINANCEIRO

### 2.1 Necessidades Funcionais (O QUE fazer)

#### **A. Gestão de Receitas**
- [ ] Registrar diferentes tipos de contribuição (Sindical, Assistencial, Confederativa, Mensal)
- [ ] Rastrear data, valor, membro/empresa, método de pagamento
- [ ] Calcular automaticamente repartição (60/15/5/10/10)
- [ ] Gestão de pagamentos recebidos vs. pendentes
- [ ] Histórico de pagamentos por membro
- [ ] Alertas para contribuições vencidas

#### **B. Gestão de Despesas**
- [ ] Categorizar gastos (Admin, Legal, Mobilização, Transferências, Social)
- [ ] Registrar data, descrição, valor, categoria, responsável
- [ ] Orçamento por categoria (planejamento vs. realizado)
- [ ] Aprovação de despesas (workflow)
- [ ] Recibos e comprovantes (attachments)

#### **C. Cálculo Automático das 5 Fórmulas**
- [ ] ROL (em tempo real)
- [ ] IAF (em tempo real)
- [ ] IS_e (cálculo mensal)
- [ ] PE_a (cálculo trimestral)
- [ ] TE (cálculo mensal)

#### **D. Dashboard de Saúde Financeira**
- [ ] Status visual (🟢 Saudável / 🟡 Atenção / 🔴 Crítico)
- [ ] Gráficos de receita vs. despesa (últimos 12 meses)
- [ ] Distribuição de gastos (pizza chart)
- [ ] Evolução das 5 fórmulas (linha chart)
- [ ] Alertas automáticos

#### **E. Relatórios Exportáveis**
- [ ] DRE (Demonstração de Resultado do Exercício) → Excel
- [ ] Balanço Patrimonial → Excel
- [ ] Fluxo de Caixa → Excel
- [ ] Relatório de Arrecadação por Membro → Excel
- [ ] Auditoria Fiscal (para Conselho Fiscal) → PDF

#### **F. Auditoria e Conformidade**
- [ ] Log de todas as operações financeiras (quem? quando? o quê?)
- [ ] Rastreabilidade de modificações
- [ ] Relatório para Conselho Fiscal (auditoria interna)
- [ ] Validação de imunidade fiscal (reinvestimento 100% do surplus)

#### **G. Ciclo "Data-Base" (Negociações)**
- [ ] Provisioning (reserva para períodos de negociação)
- [ ] Rastreamento de custos legais durante dissídios
- [ ] Previsão de impacto orçamentário

---

## 🗄️ PARTE 3: ARQUITETURA DE BANCO DE DADOS

### 3.1 Novas Tabelas (Multi-Tenant)

```sql
-- 1. Categorias de Receita
CREATE TABLE revenue_categories (
  id INT PRIMARY KEY,
  tenant_id INT NOT NULL,
  name VARCHAR(100),          -- "Sindical", "Assistencial", etc.
  type VARCHAR(50),           -- "fixed" | "variable" | "asset_income"
  percentage DECIMAL(5,2),    -- % do total que esta categoria representa
  description TEXT,
  active BOOLEAN,
  created_at TIMESTAMP,
  UNIQUE(tenant_id, name),
  FOREIGN KEY(tenant_id) REFERENCES tenants(id)
);

-- 2. Registros de Receita
CREATE TABLE revenue_entries (
  id INT PRIMARY KEY,
  tenant_id INT NOT NULL,
  category_id INT NOT NULL,
  member_id INT,              -- Pode ser NULL para receitas de patrimônio
  amount DECIMAL(12,2),
  received_date DATE,
  due_date DATE,
  status VARCHAR(50),         -- "pending" | "received" | "overdue"
  payment_method VARCHAR(50), -- "boleto" | "pix" | "cash" | "bank_transfer"
  reference VARCHAR(255),     -- Descrição/identificação
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY(tenant_id) REFERENCES tenants(id),
  FOREIGN KEY(category_id) REFERENCES revenue_categories(id),
  INDEX(tenant_id, status),
  INDEX(member_id, status)
);

-- 3. Categorias de Despesa
CREATE TABLE expense_categories (
  id INT PRIMARY KEY,
  tenant_id INT NOT NULL,
  name VARCHAR(100),          -- "Admin & Pessoal", "Legal", etc.
  type VARCHAR(50),           -- "operational" | "finalistic" | "discretionary"
  min_percentage DECIMAL(5,2), -- Mínimo recomendado
  max_percentage DECIMAL(5,2), -- Máximo recomendado
  description TEXT,
  active BOOLEAN,
  created_at TIMESTAMP,
  UNIQUE(tenant_id, name),
  FOREIGN KEY(tenant_id) REFERENCES tenants(id)
);

-- 4. Registros de Despesa
CREATE TABLE expense_entries (
  id INT PRIMARY KEY,
  tenant_id INT NOT NULL,
  category_id INT NOT NULL,
  amount DECIMAL(12,2),
  expense_date DATE,
  description VARCHAR(255),
  responsible_id INT,         -- Quem registrou
  approval_status VARCHAR(50), -- "pending" | "approved" | "rejected"
  approved_by INT,            -- Admin que aprovou
  approved_at TIMESTAMP,
  payment_status VARCHAR(50), -- "pending" | "paid" | "partial"
  notes TEXT,
  attachment_url TEXT,        -- Comprovante/recibo
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  FOREIGN KEY(tenant_id) REFERENCES tenants(id),
  FOREIGN KEY(category_id) REFERENCES expense_categories(id),
  FOREIGN KEY(responsible_id) REFERENCES profiles(id),
  FOREIGN KEY(approved_by) REFERENCES profiles(id),
  INDEX(tenant_id, approval_status),
  INDEX(tenant_id, expense_date)
);

-- 5. Orçamento Anual
CREATE TABLE budget_annual (
  id INT PRIMARY KEY,
  tenant_id INT NOT NULL,
  year INT,
  category_id INT NOT NULL,
  planned_amount DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(tenant_id, year, category_id),
  FOREIGN KEY(tenant_id) REFERENCES tenants(id),
  FOREIGN KEY(category_id) REFERENCES expense_categories(id)
);

-- 6. Indicadores de Saúde Financeira (Cache)
CREATE TABLE financial_health_indicators (
  id INT PRIMARY KEY,
  tenant_id INT NOT NULL,
  period_date DATE,           -- Primeiro dia do mês
  rol_value DECIMAL(14,2),    -- ROL calculado
  iaf_value DECIMAL(5,2),     -- IAF calculado
  is_e_value DECIMAL(5,2),    -- IS_e calculado
  pe_a_value INT,             -- PE_a (número de membros)
  te_value DECIMAL(5,2),      -- TE (%)
  health_status VARCHAR(50),  -- "healthy" | "attention" | "critical"
  notes TEXT,
  created_at TIMESTAMP,
  UNIQUE(tenant_id, period_date),
  FOREIGN KEY(tenant_id) REFERENCES tenants(id),
  INDEX(tenant_id, period_date)
);

-- 7. Auditoria Financeira (Log Compliance)
CREATE TABLE financial_audit_log (
  id INT PRIMARY KEY,
  tenant_id INT NOT NULL,
  action_type VARCHAR(100),   -- "revenue_recorded" | "expense_approved" etc.
  entity_type VARCHAR(50),    -- "revenue_entry" | "expense_entry"
  entity_id INT,
  old_value TEXT,             -- JSON
  new_value TEXT,             -- JSON
  user_id INT,
  reason TEXT,                -- Por que foi alterado?
  created_at TIMESTAMP,
  FOREIGN KEY(tenant_id) REFERENCES tenants(id),
  FOREIGN KEY(user_id) REFERENCES profiles(id),
  INDEX(tenant_id, created_at),
  INDEX(entity_type, entity_id)
);

-- 8. Repartição Confederativa (Pyramid Split) - Registro
CREATE TABLE pyramid_distributions (
  id INT PRIMARY KEY,
  tenant_id INT NOT NULL,
  revenue_entry_id INT NOT NULL,
  local_union_amount DECIMAL(12,2),   -- 60%
  federation_amount DECIMAL(12,2),    -- 15%
  confederation_amount DECIMAL(12,2), -- 5%
  union_central_amount DECIMAL(12,2), -- 10%
  government_amount DECIMAL(12,2),    -- 10%
  distribution_date DATE,
  status VARCHAR(50),                 -- "pending" | "distributed"
  created_at TIMESTAMP,
  FOREIGN KEY(tenant_id) REFERENCES tenants(id),
  FOREIGN KEY(revenue_entry_id) REFERENCES revenue_entries(id),
  INDEX(tenant_id, distribution_date)
);

-- 9. Provisioning (Reserva para Data-Base)
CREATE TABLE database_provisioning (
  id INT PRIMARY KEY,
  tenant_id INT NOT NULL,
  year INT,
  reserved_amount DECIMAL(12,2),
  used_amount DECIMAL(12,2),
  remaining_amount DECIMAL(12,2),
  notes TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  UNIQUE(tenant_id, year),
  FOREIGN KEY(tenant_id) REFERENCES tenants(id)
);
```

### 3.2 Tabelas Relacionadas Existentes (Ajustes)

```sql
-- A tabela filiacoes pode ter campo para rastrear status de pagamento
ALTER TABLE filiacoes ADD COLUMN (
  contribution_status VARCHAR(50), -- "paid" | "pending" | "overdue"
  last_contribution_date DATE,
  next_contribution_due DATE
) AFTER tenant_id;

-- A tabela profiles pode ter flags para acesso financeiro
ALTER TABLE profiles ADD COLUMN (
  financial_manager BOOLEAN DEFAULT FALSE,
  fiscal_council_member BOOLEAN DEFAULT FALSE,
  can_approve_expenses BOOLEAN DEFAULT FALSE
) AFTER role;
```

---

## 🔄 PARTE 4: FLUXOS DE NEGÓCIO (Use Cases)

### 4.1 Fluxo: Registrar Contribuição de Membro

```
ATOR: Admin financeiro / Sistema automático
GATILHO: Membro paga; ou boleto é processado

PASSOS:
1. Receber entrada de receita (data, membro, valor, tipo)
2. Validar se membro está ativo
3. Registrar em revenue_entries com status "received"
4. Calcular repartição (60/15/5/10/10)
5. Registrar em pyramid_distributions
6. Gerar comprovante/recibo
7. Atualizar TE (Collection Efficiency Rate)
8. Log em financial_audit_log

RESULTADO:
- Receita registrada e rastreável
- Repartição automática calculada
- Saúde financeira atualizada
```

### 4.2 Fluxo: Solicitar Aprovação de Despesa

```
ATOR: Responsável de área (Legal, Admin, etc.)
GATILHO: Necessidade de gastos > threshold (ex: R$ 500)

PASSOS:
1. Preencher expense_entry (categoria, valor, descrição, comprovante)
2. Validar se categoria tem orçamento disponível
3. Registrar com approval_status = "pending"
4. Notificar aprovador (Admin principal / Tesoureiro)
5. Aprovar / Rejeitar (com motivo)
6. Se aprovado: liberar pagamento, registrar em audit log
7. Atualizar ROL e other indicators

RESULTADO:
- Despesa auditada antes de pagamento
- Rastreabilidade completa
- Controle de orçamento por categoria
```

### 4.3 Fluxo: Gerar Relatório DRE (Fim de Mês)

```
ATOR: Tesoureiro / Sistema automático (1º dia útil do mês)
GATILHO: Final de período

PASSOS:
1. Somar todas as revenue_entries do mês anterior (por categoria)
2. Somar todas as expense_entries do mês anterior (por categoria)
3. Calcular: ROL, IAF, IS_e, TE
4. Gerar período_date em financial_health_indicators
5. Comparar com orçamento (budget_annual)
6. Gerar relatório visual (frontend) + export Excel
7. Preparar para Conselho Fiscal e Assembleia

RESULTADO:
- Transparência fiscal
- Dados para decisão estratégica
- Cumprimento legal (auditoria)
```

### 4.4 Fluxo: Provisioning para Data-Base (Negociação Coletiva)

```
ATOR: Tesoureiro / Conselho Fiscal
GATILHO: Próxima data-base anunciada (ex: Data-base anual em março)

PASSOS:
1. Calcular custos legais históricos da data-base anterior
2. Estimar custos para próxima data-base
3. Reservar amount em database_provisioning
4. Bloquear esse valor de outras alocações
5. Monitorar uso durante a negociação
6. Relatório pós-data-base (used vs. reserved)

RESULTADO:
- Sindicato entra em negociação com "guerra preparada"
- Sem desperas surpresa que quebrem o caixa
```

---

## 📱 PARTE 5: ENDPOINTS DA API (REST)

### 5.1 Revenue Management

```
POST   /api/v1/financial/revenue-categories
       Criar categoria de receita (Admin)

GET    /api/v1/financial/revenue-categories
       Listar categorias (por tenant)

POST   /api/v1/financial/revenue-entries
       Registrar receita de membro
       Body: { category_id, member_id, amount, received_date, payment_method }

GET    /api/v1/financial/revenue-entries?status=pending&month=2026-06
       Listar receitas (filtrado)

GET    /api/v1/financial/revenue-entries/:id
       Detalhe de receita

PUT    /api/v1/financial/revenue-entries/:id
       Editar receita (apenas si status=pending)

GET    /api/v1/financial/member/:member_id/contribution-history
       Histórico de contribuições de um membro
```

### 5.2 Expense Management

```
POST   /api/v1/financial/expense-categories
       Criar categoria de despesa

GET    /api/v1/financial/expense-categories
       Listar categorias

POST   /api/v1/financial/expense-entries
       Registrar despesa
       Body: { category_id, amount, description, responsible_id, attachment }

GET    /api/v1/financial/expense-entries?approval_status=pending
       Listar despesas aguardando aprovação

PUT    /api/v1/financial/expense-entries/:id/approve
       Aprovar despesa
       Body: { approved_by, notes }

PUT    /api/v1/financial/expense-entries/:id/reject
       Rejeitar despesa

GET    /api/v1/financial/expense-entries/:id/download
       Download de comprovante/recibo
```

### 5.3 Financial Indicators

```
GET    /api/v1/financial/health-indicators/latest
       Últimos indicadores (ROL, IAF, IS_e, PE_a, TE)

GET    /api/v1/financial/health-indicators/history?months=12
       Histórico de indicadores (para gráficos)

GET    /api/v1/financial/health-status
       Status geral de saúde (🟢 / 🟡 / 🔴)
```

### 5.4 Budgeting

```
POST   /api/v1/financial/budget/year/:year
       Definir orçamento anual por categoria
       Body: { category_id, planned_amount } (array)

GET    /api/v1/financial/budget/year/:year
       Visualizar orçamento vs. realizado

GET    /api/v1/financial/budget/variances?year=2026
       Relatório de variações orçamentárias
```

### 5.5 Reporting & Export

```
GET    /api/v1/financial/reports/dre?month=2026-06&format=json|excel|pdf
       DRE - Demonstração de Resultado

GET    /api/v1/financial/reports/balance-sheet?month=2026-06&format=excel
       Balanço Patrimonial

GET    /api/v1/financial/reports/cashflow?month=2026-06
       Fluxo de Caixa

GET    /api/v1/financial/reports/arrecadacao?year=2026&format=excel
       Relatório de Arrecadação por Membro

GET    /api/v1/financial/reports/fiscal-council?month=2026-06
       Relatório para Conselho Fiscal (auditoria)
```

### 5.6 Pyramid Distribution

```
POST   /api/v1/financial/pyramid-distributions
       Registrar distribuição confederativa

GET    /api/v1/financial/pyramid-distributions?status=pending
       Distribuições aguardando confirmação

PUT    /api/v1/financial/pyramid-distributions/:id/confirm
       Confirmar pagamento de repartição
```

### 5.7 Audit & Compliance

```
GET    /api/v1/financial/audit-log?entity_type=expense_entry&days=30
       Log de auditoria financeira

GET    /api/v1/financial/compliance/tax-immunity-check
       Validação de imunidade fiscal (% reinvestimento)

GET    /api/v1/financial/compliance/director-bonus-check
       Verificação de retiradas ilícitas
```

---

## 🖥️ PARTE 6: INTERFACE DO USUÁRIO (Frontend)

### 6.1 Dashboard Principal (Financial Health)

```
┌─────────────────────────────────────────────────────────────┐
│  GESTÃO FINANCEIRA - [NOME SINDICATO]                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  STATUS: 🟢 SAUDÁVEL    |  ROL: R$ 45.230,50 ✅           │
│  IAF: 1.42 ✅           |  IS_e: 7.2 meses ✅              │
│  PE_a: 180 membros ✅   |  TE: 92.5% ✅                    │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Receita vs. Despesa (Últimos 12 meses)                │ │
│  │         [Gráfico de Linhas]                           │ │
│  │         Receita (verde) vs. Despesa (vermelho)        │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │ Distribuição │  │ Receita Este │  │ Provisioning │      │
│  │   de Gastos  │  │     Mês      │  │  Data-Base   │      │
│  │  [Pizza]     │  │   [Gauge]    │  │  [Progress]  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                              │
│  🔴 ALERTAS:                                               │
│  • Despesa de legal services 15% acima do orçamento       │
│  • 3 membros com contribuição 60+ dias em atraso         │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 Seção: Receitas

```
┌─────────────────────────────────────────────────────────────┐
│ RECEITAS / ARRECADAÇÃO                                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ [+ Nova Receita]  [Filtrar] [Exportar Excel]               │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Data      │ Tipo         │ Membro      │ Valor   │ St. │
│ ├──────────────────────────────────────────────────────┤   │
│ │ 01/06/26  │ Sindical     │ João Silva  │ R$ 100  │ ✅  │
│ │ 02/06/26  │ Assistencial │ Maria Sup.  │ R$ 150  │ ✅  │
│ │ 03/06/26  │ Mensal       │ Pedro Costa │ R$ 200  │ ⏳  │
│ │ ...                                               │     │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ Resumo do Mês:                                              │
│ • Sindical: R$ 5.230,50 (92% arrecadado)                  │
│ • Assistencial: R$ 1.850,00 (85% arrecadado)              │
│ • Mensal: R$ 2.100,00 (88% arrecadado)                    │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.3 Seção: Despesas (com Workflow de Aprovação)

```
┌─────────────────────────────────────────────────────────────┐
│ DESPESAS                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ [+ Nova Despesa]  [Filtrar Categoria] [Status]             │
│                                                              │
│ ⏳ AGUARDANDO APROVAÇÃO (3)                                 │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Data │ Descrição          │ Categoria │ Valor  │ Ação   │
│ ├──────────────────────────────────────────────────────┤   │
│ │ 01/06│ Passagem aérea CEO │ Legal     │ R$ 1.2k│ ✓ ✗   │
│ │ 02/06│ Aluguel sala        │ Admin     │ R$ 3.5k│ ✓ ✗   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ ✅ APROVADAS                                                │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ Data │ Descrição          │ Categoria │ Valor │ Pago? │
│ ├──────────────────────────────────────────────────────┤   │
│ │ 31/05│ Fornecedor X       │ Admin     │ R$ 800│ ✅     │
│ │ 30/05│ Processo trabalhista│ Legal     │ R$ 5k │ ✅    │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
│ Orçamento vs. Realizado (Junho):                            │
│ • Admin: R$ 5.000 (orçado) | R$ 4.300 (gasto) = 86%       │
│ • Legal: R$ 3.000 (orçado) | R$ 6.200 (gasto) = 207% ⚠️   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

### 6.4 Seção: Relatórios & Exportação

```
┌─────────────────────────────────────────────────────────────┐
│ RELATÓRIOS & EXPORTAÇÃO                                     │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ Período: [Jun 2026] [Exportar]                             │
│                                                              │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ □ DRE (Demonstração de Resultado do Exercício)      │   │
│ │   └─ Download: PDF | Excel | CSV                    │   │
│ │                                                      │   │
│ │ □ Balanço Patrimonial                               │   │
│ │   └─ Download: PDF | Excel | CSV                    │   │
│ │                                                      │   │
│ │ □ Fluxo de Caixa (Cash Flow)                        │   │
│ │   └─ Download: PDF | Excel | CSV                    │   │
│ │                                                      │   │
│ │ □ Arrecadação por Membro                            │   │
│ │   └─ Download: PDF | Excel | CSV                    │   │
│ │                                                      │   │
│ │ □ Relatório Fiscal (Conselho Fiscal)                │   │
│ │   └─ Download: PDF | Enviar para email              │   │
│ │                                                      │   │
│ │ □ Validação de Imunidade Fiscal                     │   │
│ │   └─ Status: ✅ Conforme (100% reinvestido)         │   │
│ │                                                      │   │
│ │ □ Auditoria Financeira (Log)                        │   │
│ │   └─ Ver detalhes de todas as operações             │   │
│ │                                                      │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 PARTE 7: SEGURANÇA & CONFORMIDADE

### 7.1 Isolamento Multi-Tenant

```javascript
// Cada sindicato vê APENAS seus dados financeiros

const tenantId = req.tenantId; // Middleware de autenticação

// Query: Todas as despesas são filtradas por tenant_id
const expenses = await db('expense_entries')
  .where('tenant_id', tenantId)
  .where('approval_status', 'pending');

// Validação: Prevenir cross-tenant data leak
app.get('/api/financial/expense/:id', (req, res) => {
  const { id } = req.params;
  const { tenantId } = req;
  
  const expense = await db('expense_entries')
    .where('id', id)
    .where('tenant_id', tenantId) // CRÍTICO
    .first();
  
  if (!expense) return res.status(403).json({ error: 'Forbidden' });
  return res.json(expense);
});
```

### 7.2 Roles & Permissions

```javascript
// Enum de roles financeiros
FINANCIAL_ROLES = {
  'financial_manager': ['view_all', 'approve_expenses', 'edit_budget', 'export_reports'],
  'treasurer': ['view_all', 'approve_expenses', 'edit_budget', 'export_reports', 'manage_users'],
  'fiscal_council': ['view_all', 'audit_log', 'download_reports'],
  'admin': ['view_all', 'modify_all'],
  'member': ['view_own_contribution_history'],
};

// Middleware de verificação
async function canApproveExpense(req, res, next) {
  const { userId, tenantId } = req;
  const user = await db('profiles')
    .where('id', userId)
    .where('tenant_id', tenantId)
    .first();
  
  if (user.can_approve_expenses || user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Insufficient permissions' });
  }
}
```

### 7.3 Auditoria Financeira Rigorosa

```javascript
// Cada operação financeira é registrada
async function logFinancialAction(tenantId, action, entity, oldValue, newValue, userId) {
  await db('financial_audit_log').insert({
    tenant_id: tenantId,
    action_type: action,           // "expense_approved" | "budget_adjusted"
    entity_type: entity,            // "expense_entry" | "revenue_entry"
    entity_id: entity.id,
    old_value: JSON.stringify(oldValue),
    new_value: JSON.stringify(newValue),
    user_id: userId,
    created_at: new Date()
  });
}
```

### 7.4 Validação de Imunidade Fiscal

```javascript
// Sindicatos precisam reinvestir 100% do surplus (lei)
async function validateTaxImmunity(tenantId, year) {
  const revenues = await calculateTotalRevenue(tenantId, year);
  const expenses = await calculateTotalExpenses(tenantId, year);
  const surplus = revenues - expenses;
  
  // Verificar: NENHUM centavo foi distribuído
  const illegitimateDistributions = await db('profiles')
    .where('tenant_id', tenantId)
    .where('illegal_bonus_received', '>', 0)
    .count();
  
  if (illegitimateDistributions > 0) {
    // ⚠️ Sindicato perde imunidade fiscal!
    return { compliant: false, risk: 'HIGH' };
  }
  
  return { compliant: true, surplus_reinvested: surplus };
}
```

---

## 📊 PARTE 8: ESTRUTURA DE SERVIÇOS (Backend)

### 8.1 Serviços a Serem Criados

```
backend/src/services/
├── financialRevenueService.js       # Lógica de receitas
├── financialExpenseService.js       # Lógica de despesas
├── financialIndicatorService.js     # Cálculo das 5 fórmulas
├── financialReportService.js        # Geração de relatórios
├── financialExportService.js        # Export Excel/PDF
├── financialAuditService.js         # Log de auditoria
├── pyramidDistributionService.js    # Repartição confederativa
└── financialComplianceService.js    # Validações legais
```

### 8.2 Serviço de Indicadores (Exemplo de Implementação)

```javascript
// financialIndicatorService.js

class FinancialIndicatorService {
  
  // Fórmula 1: ROL
  async calculateROL(tenantId, month) {
    const revenues = await this.getTotalRevenue(tenantId, month);
    const expenses = await this.getTotalExpenses(tenantId, month);
    return revenues - expenses;
  }
  
  // Fórmula 2: IAF
  async calculateIAF(tenantId, month) {
    const predictableRevenue = await db('revenue_entries')
      .where('tenant_id', tenantId)
      .where('category_id', 'in', [MONTHLY_FEE, ASSET_INCOME])
      .sum('amount');
    
    const basicExpenses = await db('expense_entries')
      .where('tenant_id', tenantId)
      .where('category_id', 'in', [ADMIN, OPERATIONAL])
      .sum('amount');
    
    return predictableRevenue / basicExpenses;
  }
  
  // Fórmula 3: IS_e (Solvency Index)
  async calculateISe(tenantId) {
    const cash = await db('financial_statements')
      .where('tenant_id', tenantId)
      .sum('current_assets');
    
    const monthlyFixed = await db('expense_entries')
      .where('tenant_id', tenantId)
      .where('category_id', 'in', [ADMIN, OPERATIONAL, STATUTORY])
      .avg('amount');
    
    return cash / monthlyFixed;
  }
  
  // Fórmula 4: PE_a (Break-even)
  async calculatePEa(tenantId) {
    const fixedCosts = await this.getFixedCosts(tenantId);
    const avgMemberFee = await this.getAvgMemberFee(tenantId);
    const avgServiceCost = await this.getAvgServiceCostPerMember(tenantId);
    
    return fixedCosts / (avgMemberFee - avgServiceCost);
  }
  
  // Fórmula 5: TE (Collection Efficiency)
  async calculateTE(tenantId, month) {
    const received = await db('revenue_entries')
      .where('tenant_id', tenantId)
      .where('status', 'received')
      .sum('amount');
    
    const billed = await db('filiacoes')
      .where('tenant_id', tenantId)
      .where('contribution_status', 'in', ['paid', 'pending', 'overdue'])
      .sum('contribution_amount');
    
    return received / billed;
  }
  
  // Status de Saúde Geral
  async getHealthStatus(tenantId) {
    const iaf = await this.calculateIAF(tenantId);
    const ise = await this.calculateISe(tenantId);
    const te = await this.calculateTE(tenantId);
    
    if (iaf >= 1.0 && ise >= 6.0 && te > 0.85) {
      return 'healthy'; // 🟢
    } else if (iaf >= 0.8 && ise >= 3.0 && te > 0.75) {
      return 'attention'; // 🟡
    } else {
      return 'critical'; // 🔴
    }
  }
}
```

---

## 🗓️ PARTE 9: CRONOGRAMA DE IMPLEMENTAÇÃO (Proposto)

### Fase 1: Foundation (2-3 semanas)
- [ ] Design final do banco de dados
- [ ] Criação de migrations
- [ ] Testes de schema multi-tenant
- [ ] Setup dos serviços base

### Fase 2: Core Features (3-4 semanas)
- [ ] API: Gestão de receitas
- [ ] API: Gestão de despesas
- [ ] API: Cálculo de indicadores
- [ ] Testes unitários

### Fase 3: Frontend Dashboard (3-4 semanas)
- [ ] Dashboard principal
- [ ] Seção de receitas
- [ ] Seção de despesas
- [ ] Gráficos e visualizações

### Fase 4: Relatórios & Export (2 semanas)
- [ ] Serviço de exportação Excel/PDF
- [ ] DRE, Balanço, Cashflow
- [ ] Relatórios customizados

### Fase 5: Auditoria & Compliance (2 semanas)
- [ ] Validações de imunidade fiscal
- [ ] Log de auditoria
- [ ] Relatórios para Conselho Fiscal

### Fase 6: Testes & Validação (2 semanas)
- [ ] Testes de integração multi-tenant
- [ ] Testes de segurança
- [ ] Performance
- [ ] UAT com representantes reais

**Timeline Total:** 14-18 semanas (~3-4 meses)

---

## ✅ PARTE 10: CHECKLIST DE VALIDAÇÃO

### Pré-Implementação
- [ ] Documento aprovado por stakeholders
- [ ] Requerimentos financeiros refinados com advogado
- [ ] Decidido: Qual sistema tributário será suportado?
- [ ] Integrações externas decididas (banco, gateway de pagamento)?

### Pós-Implementação
- [ ] Todas as 5 fórmulas calculam corretamente
- [ ] Dados isolados por tenant (sem leaks)
- [ ] Auditoria rastreando todas as operações
- [ ] Relatórios gerados corretamente (validar manualmente)
- [ ] Export Excel funcionando
- [ ] Permissões RBAC funcionando
- [ ] Performance aceitável (< 2s para queries)
- [ ] Segurança: SQL injection prevented, IDOR prevented

---

## 🎯 CONCLUSÃO

Este documento estabelece a **base arquitetural** para transformar o CERNE Sistema de simples gestor de filiações para uma **plataforma completa de administração sindical**.

**Próximos Passos:**
1. ✅ Este planejamento é revisado com stakeholders
2. ✅ Requerimentos são refinados
3. ⏳ **Implementação começa** (quando aprovado)

---

**Prepared by:** GitHub Copilot  
**Date:** 1º de junho de 2026  
**Status:** READY FOR REVIEW & REFINEMENT
