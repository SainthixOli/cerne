# 🚀 Sistema Corporativo de Gestão de Membros

![Prévia do Sistema](docs/assets/img/logo1.png)

> **Plataforma de Gestão e Onboarding Digital de Próxima Geração.**
> Uma solução completa e de alta performance para gerenciar o ciclo de vida de membros, ativos digitais e comunicações corporativas.

[🇺🇸 Read in English](README.md) | [🇧🇷 Leia em Português](README.pt-br.md)

---

## ✨ Visão Geral do Projeto

O **Sistema Corporativo de Gestão de Membros** é uma plataforma de ponta projetada para simplificar fluxos de trabalho complexos de onboarding e administração de membros. Construído com foco na **Experiência do Usuário (UX)** e **Robustez Técnica**, ele substitui processos legados baseados em papel por um ecossistema 100% digital e seguro.

A interface apresenta uma estética premium **"Liquid Glass"** (Vidro Líquido), garantindo uma experiência moderna e envolvente em todos os dispositivos, suportada por um backend poderoso e escalável.

### 🚀 Funcionalidades Principais

*   **📝 Assistente de Onboarding Digital**: Um fluxo de cadastro passo a passo sem atritos, com validação em tempo real e integração de assinatura digital.
*   **🔐 Segurança de Nível Corporativo**:
    *   Autenticação stateless via **JWT (JSON Web Tokens)**.
    *   Hashing de senha com **Bcrypt**.
    *   Controle de Acesso Baseado em Função (RBAC) para Membros, Admins e Gerentes de Sistema.
*   **🎨 UI/UX Premium**:
    *   **Design Liquid Glass**: Painéis translúcidos, gradientes em malha (mesh) e sombras suaves.
    *   **Motor de Temas**: Suporte nativo para modos Claro, Escuro e OLED (Alto Contraste).
    *   **Responsivo**: Experiência impecável em Desktop, Tablet e Mobile.
*   **📱 Portal do Membro**:
    *   Acompanhamento de status em tempo real.
    *   Cofre de documentos seguro (Upload/Download).
    *   Gerenciamento de perfil e credenciais.
*   **🛡️ Suíte Administrativa**:
    *   **Dashboard**: Métricas de alto nível, gráficos e KPIs.
    *   **Automação de Fluxo de Trabalho**: Aprovações e atualizações de status com um clique.
    *   **Monitor do Sistema**: Métricas do servidor em tempo real (CPU, Memória, Disco) e ferramentas de manutenção.
    *   **Exportação de Dados**: Geração de CSV para relatórios externos.

---

## 🛠️ Arquitetura Técnica

Este projeto segue uma **Arquitetura Monolítica Modular**, equilibrando simplicidade com escalabilidade.

### Stack Tecnológica

*   **Frontend**:
    *   **React.js**: Biblioteca de UI baseada em componentes.
    *   **TailwindCSS**: Estilização utility-first com configuração customizada "Glass".
    *   **Lucide React**: Conjunto de ícones moderno e consistente.
    *   **Axios**: Cliente HTTP baseado em Promises.
*   **Backend**:
    *   **Node.js & Express**: Runtime de servidor de alta performance.
    *   **SQLite**: Motor de banco de dados SQL zero-configuração (Dev/Staging).
    *   **PDFKit**: Motor de geração dinâmica de PDF.
*   **DevOps & Ferramentas**:
    *   **Vite**: Ferramentas de frontend de próxima geração.
    *   **Nodemon**: Hot-reloading para desenvolvimento backend.

### Estrutura de Diretórios

```bash
/
├── backend/
│   ├── src/
│   │   ├── controllers/   # Lógica de Negócios
│   │   ├── routes/        # Endpoints da API
│   │   ├── services/      # Integrações externas (PDF, Email)
│   │   └── config/        # Configuração de Banco de Dados e Env
│   ├── db/                # Arquivo do Banco de Dados SQLite
│   └── uploads/           # Armazenamento Seguro de Documentos
│
└── frontend/
    ├── src/
    │   ├── pages/         # Componentes de Visualização (Pages)
    │   ├── components/    # Elementos de UI Reutilizáveis
    │   ├── contexts/      # Estado Global (Tema, Auth)
    │   └── assets/        # Recursos Estáticos
```

---

## 🚀 Começando

### Pré-requisitos

*   **Node.js** (v18 ou superior)
*   **NPM** ou **Yarn**

### Instalação

1.  **Clone o repositório**
    ```bash
    git clone https://github.com/sua-org/sistema-gestao-membros.git
    cd sistema-gestao-membros
    ```

2.  **Instale as Dependências**
    ```bash
    # Instalar Dependências do Backend
    cd backend
    npm install

    # Instalar Dependências do Frontend
    cd ../frontend
    npm install
    ```

3.  **Inicie a Aplicação**
    ```bash
    # Iniciar Servidor Backend (Porta 3000)
    cd backend
    npm run dev

    # Iniciar Cliente Frontend (Porta 5173)
    cd ../frontend
    npm run dev
    ```

4.  **Acesse o Sistema**: Abra `http://localhost:5173` no seu navegador.

---

## 🔧 Gerenciamento do Sistema

O sistema inclui uma função integrada de **Gerente de Sistema** para supervisão técnica:

*   **Acesso**: Faça login com credenciais de Gerente de Sistema.
*   **Capacidades**:
    *   Visualizar saúde do servidor em tempo real (Carga de CPU, Uso de RAM).
    *   Executar comandos de manutenção via Console Web integrado.
    *   Gerenciar configurações e logs de todo o sistema.

---

## 📄 Licença

Este projeto é software proprietário. Todos os direitos reservados.

---

*Engenharia para Performance & Elegância.*
