# 🌐 CERNE - Union Management of the Future

<div align="center">
  <img src="frontend/src/assets/logo.svg" alt="CERNE Logo" width="220" />
  <br />
  
  ![Version](https://img.shields.io/badge/version-2.0.0-blue.svg?style=for-the-badge)
  ![Status](https://img.shields.io/badge/status-stable-success.svg?style=for-the-badge)
  ![License](https://img.shields.io/badge/license-MIT-green.svg?style=for-the-badge)
  ![Node](https://img.shields.io/badge/node-v18+-339933.svg?style=for-the-badge&logo=node.js&logoColor=white)
  ![React](https://img.shields.io/badge/react-v18-61DAFB.svg?style=for-the-badge&logo=react&logoColor=black)

  ### **The Ultimate Platform for Member Management, Documents, and Communication.**
  *Corporate Security • Premium Design • Total Auditing*
  
  [🇺🇸 English](README.md) | [🇧🇷 Português](README.pt-br.md)
  
  ---
  
  <p align="center">
    <a href="#-overview">Overview</a> •
    <a href="#-features">Features</a> •
    <a href="#-technical-architecture">Architecture</a> •
    <a href="#-installation">Installation</a> •
    <a href="#-contributing">Contributing</a> •
    <a href="#-author">Author</a>
  </p>
</div>

---

## ✨ Overview

The **CERNE System** was born from a real need: to transform union bureaucracy into a fluid, secure, and transparent digital experience. We abandoned manual spreadsheets and paper processes to create a complete **SaaS ecosystem**.

Focused on high-level **User Experience (UX)**, the system utilizes a modern _"Liquid Glass"_ aesthetic, combined with robust security engineering that ensures the integrity of sensitive data for thousands of members.

### 🖼️ Preview
> <div align="center">
>   <img src="landing-page/src/assets/dashboard_admin_pro.png" alt="Admin Dashboard" width="100%" />
>   <br /><br />
>   <div style="display: flex; gap: 10px;">
>     <img src="landing-page/src/assets/login.png" alt="Login Screen" width="48%" />
>     <img src="landing-page/src/assets/techadmin_dashboard.png" alt="Tech Admin" width="48%" />
>   </div>
> </div>

---

## 🚀 Features

### 🏛️ Core Module (Member Management)
*   **Digital Onboarding:** Step-by-step registration with real-time validation (ID, ZIP Code).
*   **Lifecycle:** Status control (Pending, Active, Suspended, Disabled).
*   **Digital ID:** Automatic credential generation with QR Code.
*   **Document Management:** Secure upload of PDFs and images with versioning.

### 🔐 Security & Auditing (Enterprise Grade)
*   **Immutable Logbook:** Total action traceability (Who? What? When? Where?).
*   **Chat Shield:** Active content filter (RegEx) that blocks offensive messages in real-time.
*   **Encryption:** Passwords hashed with **Bcrypt** and communication via JWT Tokens (Stateless).
*   **Basic WAF:** Rate limiting and input sanitization against SQL Injection and XSS.

### 💬 Communication & Support
*   **Real-Time Chat:** WebSockets for instant communication between Admins and Support.
*   **Global Notifications:** Broadcast warning system for all users.
*   **Integrated Helpdesk:** Ticket opening and tracking.

### 📊 Control Panels
*   **Admin Dashboard:** Metrics, Affiliation KPIs, and quick shortcuts.
*   **Tech Admin Panel:** Server health monitoring (CPU, Memory, Database).

---

## 🛠️ Technical Architecture

The project follows a **Monolithic Modular Architecture**, ideal for scaling without the unnecessary complexity of microservices at the start.

### Tech Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React.js, TailwindCSS (Glassmorphism), Framer Motion, Axios, Lucide React |
| **Backend** | Node.js, Express, Socket.io (Realtime), PDFKit |
| **Database** | SQLite (Dev) / PostgreSQL (Prod) - Managed by **Knex.js** |
| **Security** | Helmet, CORS, Rate-Limit, Bcrypt, JWT, **Joi Validation** |
| **DevOps** | Docker, Docker Compose, Jest (Testing), Winston (Logging) |

### 📂 Directory Structure (Backend)
```bash
/backend
├── src/
│   ├── config/        # Database & Environment Config
│   ├── controllers/   # Request Handlers
│   ├── middlewares/   # Auth, Validation, Error Handling
│   ├── models/        # Data Access Layer (Knex)
│   ├── routes/        # API Endpoints
│   ├── services/      # Business Logic (Email, PDF)
│   ├── utils/         # Helpers
│   ├── validations/   # Joi Schemas
│   └── app.js         # App Entry Point
├── db/                # Migrations & Seeds
├── tests/             # Integration Tests
└── logs/              # Application Logs
```

---

## ⚡ Installation and Execution

### Option 1: Docker (Recommended)
Run the entire stack with a single command.

```bash
docker-compose up --build
```
Access:
- Frontend: http://localhost:8080
- Backend: http://localhost:3333

### Option 2: Manual Installation

#### Prerequisites
*   **Node.js** (v18 or higher)
*   **NPM** or **Yarn**

#### Backend Setup
1.  Navigate to folder: `cd backend`
2.  Install dependencies: `npm install`
3.  Configure Env: `cp .env.example .env`
4.  **Run Migrations**: `npm run db:migrate`
5.  Start Server: `npm run dev`

#### Frontend Setup
1.  Navigate to folder: `cd frontend`
2.  Install dependencies: `npm install`
3.  Start App: `npm run dev`

#### Landing Page
1.  Navigate to folder: `cd landing-page`
2.  Install dependencies: `npm install`
3.  Start App: `npm run dev`

---

## 🤝 Contributing

Contributions are welcome! This is an **Open Source** project focused on learning and innovation.

1.  **Fork** the project.
2.  Create a Branch for your Feature (`git checkout -b feature/AmazingFeature`).
3.  Commit (`git commit -m 'Add some AmazingFeature'`).
4.  Push to Branch (`git push origin feature/AmazingFeature`).
5.  Open a **Pull Request**.

---

## 👤 Author

<div align="center">
  <img src="https://github.com/SainthixOli.png" width="100px;"/>
  <br />
  <sub><b>Oliver Arthur</b></sub>
  <br />
  <i>Software Engineering Student @ Uniceplac</i>
  <br />
  <br />

  [![Linkedin Badge](https://img.shields.io/badge/-Oliver_Arthur-blue?style=flat-square&logo=Linkedin&logoColor=white&link=https://www.linkedin.com/in/oliver-arthur-souza-pinheiro-677b24376/)](https://www.linkedin.com/in/oliver-arthur-souza-pinheiro-677b24376/) 
  [![Gmail Badge](https://img.shields.io/badge/-oliverarthursouzapinheiro@gmail.com-c14438?style=flat-square&logo=Gmail&logoColor=white&link=mailto:oliverarthursouzapinheiro@gmail.com)](mailto:oliverarthursouzapinheiro@gmail.com)
</div>

---

<p align="center">
  Made with 💙 and lots of coffee by Oliver Arthur.
</p>
