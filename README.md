# 🚀 Enterprise Member Management System

![System Preview](docs/assets/img/logo.png)

> **Next-Generation Digital Onboarding & Management Platform.**
> A comprehensive, high-performance solution for managing member lifecycles, digital assets, and corporate communications.

---

## ✨ Project Overview

The **Enterprise Member Management System** is a state-of-the-art platform designed to streamline complex onboarding workflows and member administration. Built with a focus on **User Experience (UX)** and **Technical Robustness**, it replaces legacy paper-based processes with a secure, 100% digital ecosystem.

The interface features a premium **"Liquid Glass"** aesthetic, ensuring a modern and engaging experience across all devices, supported by a powerful and scalable backend.

### 🚀 Key Features

*   **📝 Digital Onboarding Wizard**: A frictionless, step-by-step registration flow with real-time validation and digital signature integration.
*   **🔐 Enterprise-Grade Security**:
    *   Stateless authentication via **JWT (JSON Web Tokens)**.
    *   **Bcrypt** password hashing.
    *   Role-Based Access Control (RBAC) for Members, Admins, and System Managers.
*   **🎨 Premium UI/UX**:
    *   **Liquid Glass Design**: Translucent panels, mesh gradients, and soft shadows.
    *   **Theme Engine**: Native support for Light, Dark, and OLED High-Contrast modes.
    *   **Responsive**: Flawless experience on Desktop, Tablet, and Mobile.
*   **📱 Member Portal**:
    *   Real-time status tracking.
    *   Secure document vault (Upload/Download).
    *   Profile and credential management.
*   **🛡️ Administration Suite**:
    *   **Dashboard**: High-level metrics, charts, and KPIs.
    *   **Workflow Automation**: One-click approvals and status updates.
    *   **System Monitor**: Real-time server metrics (CPU, Memory, Disk) and maintenance tools.
    *   **Data Export**: CSV generation for external reporting.

---

## 🛠️ Technical Architecture

This project follows a **Monolithic Modular Architecture**, balancing simplicity with scalability.

### Technology Stack

*   **Frontend**:
    *   **React.js**: Component-based UI library.
    *   **TailwindCSS**: Utility-first styling with custom "Glass" configuration.
    *   **Lucide React**: Modern, consistent icon set.
    *   **Axios**: Promise-based HTTP client.
*   **Backend**:
    *   **Node.js & Express**: High-performance server runtime.
    *   **SQLite**: Zero-configuration SQL database engine (Dev/Staging).
    *   **PDFKit**: Dynamic PDF generation engine.
*   **DevOps & Tooling**:
    *   **Vite**: Next-generation frontend tooling.
    *   **Nodemon**: Hot-reloading for backend development.

### Directory Structure

```bash
/
├── backend/
│   ├── src/
│   │   ├── controllers/   # Business Logic
│   │   ├── routes/        # API Endpoints
│   │   ├── services/      # External integrations (PDF, Email)
│   │   └── config/        # Database & Env Config
│   ├── db/                # SQLite Database File
│   └── uploads/           # Secure Document Storage
│
└── frontend/
    ├── src/
    │   ├── pages/         # View Components
    │   ├── components/    # Reusable UI Elements
    │   ├── contexts/      # Global State (Theme, Auth)
    │   └── assets/        # Static Resources
```

---

## 🚀 Getting Started

### Prerequisites

*   **Node.js** (v18 or higher)
*   **NPM** or **Yarn**

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/your-org/enterprise-member-system.git
    cd enterprise-member-system
    ```

2.  **Install Dependencies**
    ```bash
    # Install Backend Dependencies
    cd backend
    npm install

    # Install Frontend Dependencies
    cd ../frontend
    npm install
    ```

3.  **Start the Application**
    ```bash
    # Start Backend Server (Port 3000)
    cd backend
    npm run dev

    # Start Frontend Client (Port 5173)
    cd ../frontend
    npm run dev
    ```

4.  **Access the System**: Open `http://localhost:5173` in your browser.

---

## 🔧 System Management

The system includes a built-in **System Manager** role for technical oversight:

*   **Access**: Log in with System Manager credentials.
*   **Capabilities**:
    *   View real-time server health (CPU Load, RAM Usage).
    *   Execute maintenance commands via the built-in Web Console.
    *   Manage system-wide settings and logs.

---

## 📄 License

This project is proprietary software. All rights reserved.

---

*Engineered for Performance & Elegance.*
