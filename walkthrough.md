# Walkthrough - Sistema de Filiação Digital do Sindicato

## Overview
This system automates the affiliation process for the "Sindicato de Professores de Luziânia". It includes a backend API for PDF generation and file management, and a React frontend for the user interface.

## Features Implemented

### 1. Registration Flow
- **User Input**: A multi-step form collects personal and professional data.
- **PDF Generation**: The backend generates a PDF with the user's data ready for signature.
- **Download**: The user can download the generated PDF.

### 2. Digital Signature & Upload
- **Upload**: The user uploads the signed PDF (simulating the digital signature process).
- **Storage**: The file is saved to the server (simulating cloud storage).

### 3. Admin Dashboard
- **List View**: Admins can view all affiliation requests.
- **Approval**: Admins can approve requests (optimistic UI update).

## Verification Results

### Backend
- **Startup**: Verified that the server starts on port 3000.
- **Dependencies**: All dependencies installed correctly.
- **Supabase**: Configured to use a mock client if credentials are not provided, ensuring easy local development.

### Frontend
- **Build**: `vite build` completed successfully.
- **Routing**: Routes for Home, Register, and Admin are configured.
- **UI**: Tailwind CSS is integrated for styling.

## How to Run

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

## Next Steps
- **Supabase Connection**: Add real credentials to `.env` to connect to the database.
- **Authentication**: Implement real login for the Admin Dashboard.
- **Email Notifications**: Send emails upon registration.
