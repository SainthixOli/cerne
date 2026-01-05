# Arquitetura do Sistema - CERNE v2.0

## Visão Geral
O projeto CERNE é uma aplicação web de gestão sindical construída com foco em robustez, escalabilidade e manutenibilidade. A arquitetura segue o padrão **MVC (Model-View-Controller)** adaptado para uma API RESTful consumida por uma Single Page Application (SPA).

## Tecnologias Principais

### Frontend
- **Framework**: React.js
- **Estilização**: TailwindCSS
- **Gerenciamento de Estado**: Context API
- **Comunicação com API**: Axios

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Banco de Dados**: SQLite (Desenvolvimento) / PostgreSQL (Produção - Planejado)
- **Autenticação**: JWT (JSON Web Tokens) com bcrypt para hash de senhas

## Estrutura de Diretórios (Backend)

O backend é organizado de forma modular em `src/`:

- **`config/`**: Configurações de ambiente, banco de dados e constantes.
- **`controllers/`**: Controladores que lidam com requisições HTTP e respostas.
  - *Regra*: Não devem conter SQL direto. Devem orquestrar chamadas para Services ou Models.
- **`models/`**: Camada de acesso a dados (DAO/Repository Pattern).
  - *Regra*: Responsáveis por executar queries SQL. Abstraem o banco de dados.
- **`services/`**: Lógica de negócio complexa.
  - *Regra*: Usado quando uma operação envolve múltiplos models ou regras de negócio que não cabem no controller.
- **`middlewares/`**: Funções intermediárias (Auth, Logging, Validação).
- **`routes/`**: Definição de endpoints e mapeamento para controllers.

## Fluxo de Autenticação e Segurança
1. O usuário envia credenciais.
2. `AuthController` recebe request.
3. Chama `UserModel` para buscar usuário pelo CPF.
4. Valida senha com `bcrypt`.
5. Gera token JWT assinado.
6. Middleware de autenticação (`authMiddleware`) valida o token em rotas protegidas.

## Estratégia de Banco de Dados
O sistema utiliza uma camada de abstração básica nos Models para permitir a troca fácil entre SQLite (local) e PostgreSQL (produção) através do uso de drivers compatíveis ou builders de query (Knex/Sequelize) futuro.

## Versionamento
O projeto segue o Semantic Versioning (SemVer) a partir da versão 2.0.0.
