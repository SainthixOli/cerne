import React, { useState, useEffect } from 'react';
import { Bell, Trash2 } from 'lucide-react';
import api from '../api';

const NotificationBell = () => {
    const [notifications, setNotifications] = useState([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isSuperAdmin = user.role === 'super_admin';

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications/my');
            setNotifications(res.data);
            setUnreadCount(res.data.length); // Simplificação: Considera todas "não lidas" se estão na lista
        } catch (error) {
            console.error(error);
        }
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (!window.confirm('Tem certeza que deseja apagar esta notificação para TODOS os usuários?')) return;
        try {
            await api.delete(`/notifications/${id}`);
            setNotifications(notifications.filter(n => n.id !== id));
            setUnreadCount(prev => Math.max(0, prev - 1));
        } catch (error) {
            console.error(error);
            alert('Erro ao apagar notificação');
        }
    };

    useEffect(() => {
        fetchNotifications();
        const interval = setInterval(fetchNotifications, 60000); // Poll a cada minuto
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            >
                <Bell size={20} className="text-gray-600 dark:text-gray-300" />
                {unreadCount > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center border-2 border-white dark:border-gray-800">
                        {unreadCount}
                    </span>
                )}
            </button>

            {showDropdown && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}></div>
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden animate-fade-in-up">
                        <div className="p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                            <h3 className="font-bold text-gray-700 dark:text-gray-200">Notificações</h3>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <p className="p-8 text-center text-gray-500 text-sm">Nenhuma notificação nova.</p>
                            ) : (
                                notifications.map(notif => (
                                    <div key={notif.id} className="p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group relative">
                                        <h4 className="font-bold text-sm text-gray-800 dark:text-white mb-1 pr-6">{notif.title}</h4>
                                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{notif.message}</p>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-[10px] text-gray-400">
                                                {new Date(notif.created_at).toLocaleString()}
                                            </span>
                                            {isSuperAdmin && (
                                                <button
                                                    onClick={(e) => handleDelete(e, notif.id)}
                                                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition"
                                                    title="Apagar para todos"
                                                >
                                                    <Trash2 size={14} />
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default NotificationBell;
