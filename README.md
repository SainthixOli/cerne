# 🏛️ Sistema de Filiação Digital - Sinpro

![Logo Sinpro](docs/assets/img/logo.png)

> **Modernidade e agilidade para o professor.**
> Um sistema completo para gestão de filiações, documentos e comunicação entre o sindicato e seus associados.

---

## ✨ Sobre o Projeto

O **Sistema de Filiação Digital** foi desenvolvido para simplificar e modernizar o processo de adesão de novos professores ao sindicato. Com uma interface **premium**, suporte a **temas (Claro, Escuro e OLED)** e um fluxo totalmente digital, eliminamos a burocracia do papel.

### 🚀 Funcionalidades Principais

*   **📝 Filiação 100% Online**: Preenchimento de dados, geração automática da ficha em PDF e assinatura digital.
*   **🔐 Segurança de Ponta**: Autenticação via JWT, senhas criptografadas (Bcrypt) e fluxo de troca de senha obrigatória no primeiro acesso.
*   **🎨 Experiência Premium**: Interface moderna com *Glassmorphism*, animações fluidas e 3 opções de temas.
*   **📱 Painel do Professor**:
    *   Acompanhamento do status da filiação em tempo real.
    *   Gestão de documentos (upload/download).
    *   Edição de dados cadastrais.
*   **🛡️ Painel Administrativo**:
    *   Visão geral com métricas e gráficos.
    *   Aprovação de novos filiados com um clique.
    *   Visualização segura de documentos enviados.
    *   Exportação de dados para CSV.

---

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído com as melhores tecnologias do mercado para garantir performance e escalabilidade:

*   **Frontend**: React.js, TailwindCSS, Lucide Icons, React Router, React Hot Toast.
*   **Backend**: Node.js, Express, SQLite (Dev), Supabase (Prod), PDFKit, Nodemailer.
*   **Arquitetura**: REST API, MVC, JWT Auth.

---

## 📸 Capturas de Tela

| Login Moderno | Dashboard Professor | Modo Escuro |
|:---:|:---:|:---:|
| *Interface de acesso segura e elegante* | *Tudo o que o professor precisa em um só lugar* | *Conforto visual para uso noturno* |

---

## 🚀 Como Rodar o Projeto

### Pré-requisitos

*   Node.js (v18+)
*   NPM ou Yarn

### Instalação

1.  **Clone o repositório**
    ```bash
    git clone https://github.com/seu-usuario/filiacao-sindicato.git
    cd filiacao-sindicato
    ```

2.  **Instale as dependências**
    ```bash
    # Backend
    cd backend
    npm install
    
    # Frontend (em outro terminal)
    cd ../frontend
    npm install
    ```

3.  **Execute o projeto**
    ```bash
    # Backend
    npm run dev
    
    # Frontend
    npm run dev
    ```

4.  **Acesse**: `http://localhost:5173`

---



---

Desenvolvido com 💙 para o **Sinpro**.
