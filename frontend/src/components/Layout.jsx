import React from 'react';
import { Link } from 'react-router-dom';
import { FileText, LogIn, Menu } from 'lucide-react';

const Layout = ({ children }) => {
    return (
        <div className="min-h-screen flex flex-col bg-gray-50">
            <header className="bg-blue-700 text-white shadow-md">
                <div className="container mx-auto px-4 py-4 flex justify-between items-center">
                    <Link to="/" className="flex items-center space-x-2 text-xl font-bold">
                        <FileText size={28} />
                        <span>Sinpro Luziânia</span>
                    </Link>
                    <nav className="hidden md:flex space-x-6">
                        <Link to="/" className="hover:text-blue-200 transition">Início</Link>
                        <Link to="/register" className="hover:text-blue-200 transition">Filiação</Link>
                        <Link to="/admin" className="hover:text-blue-200 transition">Admin</Link>
                    </nav>
                    <div className="md:hidden">
                        <Menu />
                    </div>
                </div>
            </header>

            <main className="flex-grow container mx-auto px-4 py-8">
                {children}
            </main>

            <footer className="bg-gray-800 text-gray-400 py-6">
                <div className="container mx-auto px-4 text-center">
                    <p>&copy; 2024 Sindicato de Professores de Luziânia. Todos os direitos reservados.</p>
                </div>
            </footer>
        </div>
    );
};

export default Layout;
