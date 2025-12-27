import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { User, FileText, Settings, LogOut, Home, MessageSquare } from 'lucide-react';

const Sidebar = () => {
    const navigate = useNavigate();

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const navItems = [
        { path: '/member', icon: Home, label: 'Início', end: true },
        { path: '/member/chat', icon: MessageSquare, label: 'Chats' },
        { path: '/member/profile', icon: User, label: 'Meu Cadastro' },
        { path: '/member/documents', icon: FileText, label: 'Meus Documentos' },
        { path: '/member/settings', icon: Settings, label: 'Configurações' },
    ];

    return (
        <aside className="w-64 glass border-r-0 flex flex-col transition-all duration-300 m-4 rounded-3xl h-[calc(100vh-2rem)] sticky top-4">
            <div className="p-8 border-b border-gray-200/30 flex items-center space-x-3">
                <img src="/src/assets/logo.svg" alt="Logo" className="w-10 h-10" />
                <div>
                    <h2 className="text-xl font-bold text-gray-900 tracking-tight">CERNE</h2>
                    <p className="text-[10px] text-gray-500 font-medium uppercase tracking-wider">System</p>
                </div>
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
