import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { User, FileText, Settings, LogOut, Home } from 'lucide-react';

const Sidebar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const navItems = [
        { path: '/professor', icon: Home, label: 'Início', end: true },
        { path: '/professor/profile', icon: User, label: 'Meu Cadastro' },
        { path: '/professor/documents', icon: FileText, label: 'Meus Documentos' },
        { path: '/professor/settings', icon: Settings, label: 'Configurações' },
    ];

    return (
        <aside className="w-64 glass border-r-0 flex flex-col transition-all duration-300 m-4 rounded-3xl h-[calc(100vh-2rem)] sticky top-4">
            <div className="p-8 border-b border-gray-200/30">
                <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Empresa X</h2>
                <p className="text-xs text-gray-500 font-medium mt-1 uppercase tracking-wider">Área do Membro</p>
            </div>

            <nav className="flex-grow p-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-3 rounded-2xl transition-all duration-300 ${isActive
                                ? 'bg-gray-900 text-white shadow-lg shadow-gray-900/20 scale-105'
                                : 'text-gray-500 hover:bg-white/50 hover:text-gray-900 hover:shadow-sm'
                            }`
                        }
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}
            </nav>

            <div className="p-6 border-t border-gray-200/30 mt-auto">
                <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-4 py-3 text-red-500 hover:bg-red-50/50 hover:text-red-600 rounded-2xl w-full transition-all duration-300 font-medium"
                >
                    <LogOut size={20} />
                    <span>Sair</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;
