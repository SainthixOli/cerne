# Política de Segurança

## Relatando Vulnerabilidades

Prezamos pela segurança de nossos usuários e dados. Se você descobrir uma vulnerabilidade de segurança, por favor nos reporte imediatamente.

**NÃO crie issues públicas no GitHub para vulnerabilidades de segurança.**

Envie um email para: oliverarthursouzapinheiro@gmail.com

### O que incluir no seu reporte:
- Descrição da vulnerabilidade.
- Passos para reproduzir (POC - Proof of Concept).
- Impacto potencial.

## Boas Práticas de Segurança Implementadas

Este projeto segue diretrizes de segurança modernas, incluindo:

1.  **Autenticação**:
    - Hash de senhas forte utilizando `bcrypt`.
    - Tokens de sessão via `JWT` com tempo de expiração curto (1 hora).

2.  **Proteção de Dados**:
    - Conexões seguras (HTTPS em produção).
    - Validação estrita de entradas para prevenir SQL Injection e XSS.
    - Sanitização de dados sensíveis em logs.

3.  **Controle de Acesso**:
    - RBAC (Role-Based Access Control).
    - Rotas protegidas por middleware de autenticação.

## Diretrizes de Desenvolvimento

- Nunca commitar chaves secretas (`.env`).
- Manter dependências atualizadas (`npm audit`).
- Utilizar validação de schema (Joi/Zod) em todos os endpoints.
