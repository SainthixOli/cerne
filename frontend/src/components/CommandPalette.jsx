import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Search, Command, User, FileText, MessageCircle, LogOut, Moon, Sun } from 'lucide-react';
import { useAuth } from '../auth/useAuth';

const MotionDiv = motion.div;

const CommandPalette = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState('');
    const navigate = useNavigate();
    const { user, logout } = useAuth();

    useEffect(() => {
        const handleKeyDown = (e) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                setIsOpen((prev) => !prev);
            }
            if (e.key === 'Escape') {
                setIsOpen(false);
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    const actions = [
        ...(user?.role === 'admin' || user?.role === 'super_admin' ? [
        { icon: <User size={18} />, label: 'Gerenciar Filiados', action: () => navigate('/admin/affiliates') },
        { icon: <FileText size={18} />, label: 'Meus Protocolos', action: () => navigate('/admin/affiliates?filter=meus') },
        { icon: <MessageCircle size={18} />, label: 'Chat Administrativo', action: () => navigate('/admin/users') }, // Assuming users page for chhat
        ] : []),
        { icon: <LogOut size={18} />, label: 'Sair do Sistema', action: async () => { await logout(); navigate('/login', { replace: true }); } },
    ];

    const filteredActions = actions.filter(action =>
        action.label.toLowerCase().includes(query.toLowerCase())
    );

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[20vh] px-4">
                    <MotionDiv
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setIsOpen(false)}
                        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
                    />

                    <MotionDiv
                        initial={{ opacity: 0, scale: 0.95, y: -20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -20 }}
                        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-xl shadow-2xl border border-gray-200 dark:border-white/10 overflow-hidden relative z-10"
                    >
                        <div className="flex items-center border-b border-gray-100 dark:border-white/5 px-4 py-3">
                            <Search className="text-gray-400 mr-3" size={20} />
                            <input
                                autoFocus
                                type="text"
                                placeholder="O que você procura?..."
                                className="flex-1 bg-transparent outline-none text-gray-700 dark:text-gray-200 placeholder-gray-400"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                            />
                            <div className="text-xs bg-gray-100 dark:bg-white/10 px-2 py-1 rounded text-gray-500 font-mono">ESC</div>
                        </div>

                        <div className="max-h-[300px] overflow-y-auto py-2">
                            {filteredActions.length > 0 ? (
                                filteredActions.map((action, i) => (
                                    <button
                                        key={i}
                                        onClick={() => {
                                            action.action();
                                            setIsOpen(false);
                                        }}
                                        className="w-full text-left px-4 py-3 flex items-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 text-gray-600 dark:text-gray-300 transition-colors"
                                    >
                                        {action.icon}
                                        <span>{action.label}</span>
                                    </button>
                                ))
                            ) : (
                                <div className="px-4 py-8 text-center text-gray-400">
                                    Nenhum resultado encontrado for "{query}"
                                </div>
                            )}
                        </div>

                        <div className="bg-gray-50 dark:bg-white/5 px-4 py-2 border-t border-gray-100 dark:border-white/5 flex justify-between items-center text-xs text-gray-500">
                            <div className="flex gap-2">
                                <span>Navigate</span>
                                <span className="font-bold">↑↓</span>
                            </div>
                            <div className="flex gap-2">
                                <span>Select</span>
                                <span className="font-bold">↵</span>
                            </div>
                        </div>
                    </MotionDiv>
                </div>
            )}
        </AnimatePresence>
    );
};

export default CommandPalette;
