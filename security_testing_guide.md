# Guia de Testes de Segurança Avançados - Sistema de Filiação

Este documento fornece um roteiro para testar a segurança do sistema, cobrindo vulnerabilidades comuns e verificações específicas para as funcionalidades implementadas (Chat, Notificações, Uploads).

## 1. Testes de Autenticação e Autorização

### 1.1 Controle de Acesso Baseado em Função (RBAC)
**Objetivo:** Verificar se usuários não autorizados não conseguem acessar recursos privilegiados.

*   **Teste 1: Acesso Admin por Professor**
    *   **Ação:** Logar como Professor. Tentar acessar `/api/admin/users` ou `/api/notifications/approve/:id`.
    *   **Resultado Esperado:** Retorno HTTP `403 Forbidden`.
*   **Teste 2: Aprovação de Broadcast**
    *   **Ação:** Logar como Admin (não Super Admin). Tentar aprovar um broadcast via POST `/api/notifications/:id/approve`.
    *   **Resultado Esperado:** Retorno HTTP `403 Forbidden`.
*   **Teste 3: Chat Cross-User**
    *   **Ação:** Como Professor A, tentar ler mensagens do chat do Professor B via GET `/api/affiliations/:id_B/chat`.
    *   **Resultado Esperado:** Retorno HTTP `403 Forbidden` ou lista vazia (se isolamento estiver correto).

### 1.2 Sessão e JWT
*   **Teste:** Tentar usar um token expirado.
*   **Resultado Esperado:** Retorno `401 Unauthorized` ou `403 Forbidden`.

## 2. Injeção de Código (SQL Injection & XSS)

### 2.1 SQL Injection
**Objetivo:** Garantir que entradas do usuário não manipulem queries SQL.

*   **Teste:** Nos campos de login (email), tentar inserir `' OR '1'='1`.
*   **Teste:** Na busca de filiados (`/api/affiliations?search=...`), inserir caracteres especiais SQL.
*   **Defesa:** O backend usa *Parameterized Queries* (`?` nos statements SQL) que previnem isso nativamente no SQLite.

### 2.2 Cross-Site Scripting (XSS)
**Objetivo:** Impedir execução de scripts maliciosos no navegador de outros usuários.

*   **Teste 1: Chat Message**
    *   **Ação:** Enviar mensagem no chat: `<script>alert('XSS')</script>` ou `<img src=x onerror=alert(1)>`.
    *   **Resultado Esperado:** O React deve "escapar" o HTML automaticamente, exibindo o texto do script e não executando-o.
*   **Teste 2: Broadcast Notification**
    *   **Ação:** Criar um Broadcast com título malicioso.
    *   **Resultado Esperado:** Ao ser exibido nos sinos de notificação dos usuários, o script não deve rodar.

## 3. Upload de Arquivos

### 3.1 Tipos de Arquivo e Execução
*   **Teste:** Tentar fazer upload de um arquivo `.php`, `.js` ou `.exe` como comprovante de filiação.
*   **Resultado Esperado:** O backend deve rejeitar (validação por mimetype no `multer`).
*   **Teste:** Tentar acessar o arquivo enviado diretamente via URL.
*   **Resultado Esperado:** O arquivo deve ser servido como `Content-Disposition: attachment` ou `inline` mas sem execução no servidor e sem permissão de script no cliente (headers de segurança).

## 4. Rate Limiting e DoS
*   **Check:** Verificar se há proteção contra força bruta no login.
*   **Recomendação:** Implementar `express-rate-limit` se ainda não houver.

## 5. Ferramentas Sugeridas
1.  **OWASP ZAP:** Scanner automático de vulnerabilidades web.
2.  **Burp Suite (Community):** Para interceptar requisições e testar manipulação de parâmetros.
3.  **Postman:** Para testar endpoints de API diretamente, ignorando o frontend.

## 6. Checklist Pós-Deploy
- [ ] Trocar `JWT_SECRET` por uma string longa e aleatória.
- [ ] Desativar logs de debug (`console.log`) em produção.
- [ ] Rodar auditoria do NPM (`npm audit`) para dependências vulneráveis.
