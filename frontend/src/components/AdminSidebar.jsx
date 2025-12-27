import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, FileText, Settings, LogOut, BarChart, Activity, File, CheckCircle, MessageSquare } from 'lucide-react';

const AdminSidebar = () => {
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user'));
    const isSuperAdmin = user?.role === 'super_admin';

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    const navItems = [
        { path: '/admin', icon: LayoutDashboard, label: 'Dashboard', end: true },
        { path: '/admin/chat', icon: MessageSquare, label: 'Chats' },
        { path: '/admin/affiliates', icon: Users, label: 'Filiados' },
        { path: '/admin/reports', icon: BarChart, label: 'Relatórios' },
    ];

    return (
        <aside className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-colors duration-300">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center space-x-3">
                <img src="/src/assets/logo.svg" alt="Logo" className="w-10 h-10" />
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 tracking-tight">CERNE</h2>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider">Admin</p>
                </div>
            </div>

            <nav className="flex-grow p-4 space-y-2">
                {navItems.map((item) => (
                    <NavLink
                        key={item.path}
                        to={item.path}
                        end={item.end}
                        className={({ isActive }) =>
                            `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium shadow-sm'
                                : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                            }`
                        }
                    >
                        <item.icon size={20} />
                        <span>{item.label}</span>
                    </NavLink>
                ))}

                {isSuperAdmin && (
                    <>
                        <NavLink
                            to="/admin/audit"
                            className={({ isActive }) =>
                                `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                                }`
                            }
                        >
                            <Activity size={20} />
                            <span>Auditoria</span>
                        </NavLink>
                        <NavLink
                            to="/admin/documents"
                            className={({ isActive }) =>
                                `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                                }`
                            }
                        >
                            <File size={20} />
                            <span>Documentos</span>
                        </NavLink>
                        <NavLink
                            to="/admin/users"
                            className={({ isActive }) =>
                                `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                                    ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium shadow-sm'
                                    : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                                }`
                            }
                        >
                            <Users size={20} />
                            <span>Colaboradores</span>
                        </NavLink>
                    </>
                )}

                <NavLink
                    to="/admin/settings"
                    className={({ isActive }) =>
                        `flex items-center space-x-3 px-4 py-3 rounded-xl transition-all duration-200 ${isActive
                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-medium shadow-sm'
                            : 'text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700/50 hover:text-gray-900 dark:hover:text-gray-200'
                        }`
                    }
                >
                    <Settings size={20} />
                    <span>Configurações</span>
                </NavLink>
            </nav>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
                <button
                    onClick={handleLogout}
                    className="flex items-center space-x-3 px-4 py-3 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl w-full transition-all duration-200"
                >
                    <LogOut size={20} />
                    <span>Sair</span>
                </button>
            </div>
        </aside >
    );
};

export default AdminSidebar;
