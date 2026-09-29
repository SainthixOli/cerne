import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Bell, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../api';
import { useAuth } from '../auth/useAuth';

const notificationKeys = { all: ['notifications'] };

async function fetchNotifications() {
    const response = await api.get('/notifications/my', { silent: true });
    return response.data;
}

export default function NotificationBell() {
    const [showDropdown, setShowDropdown] = useState(false);
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const { data: notifications = [] } = useQuery({
        queryKey: notificationKeys.all,
        queryFn: fetchNotifications,
        refetchInterval: 60_000
    });
    const removeNotification = useMutation({
        mutationFn: (id) => api.delete(`/notifications/${id}`),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationKeys.all }),
        onError: (error) => toast.error(error.message)
    });

    const handleDelete = (event, id) => {
        event.stopPropagation();
        if (window.confirm('Tem certeza que deseja apagar esta notificação para TODOS os usuários?')) {
            removeNotification.mutate(id);
        }
    };

    return (
        <div className="relative">
            <button
                onClick={() => setShowDropdown((visible) => !visible)}
                className="relative p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                aria-label="Notificações"
            >
                <Bell size={20} className="text-gray-600 dark:text-gray-300" />
                {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center border-2 border-white dark:border-gray-800">
                        {notifications.length}
                    </span>
                )}
            </button>

            {showDropdown && (
                <>
                    <button className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} aria-label="Fechar notificações" />
                    <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden">
                        <div className="p-3 border-b dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50">
                            <h3 className="font-bold text-gray-700 dark:text-gray-200">Notificações</h3>
                        </div>
                        <div className="max-h-96 overflow-y-auto">
                            {notifications.length === 0 ? (
                                <p className="p-8 text-center text-gray-500 text-sm">Nenhuma notificação nova.</p>
                            ) : notifications.map((notification) => (
                                <div key={notification.id} className="p-4 border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition group relative">
                                    <h4 className="font-bold text-sm text-gray-800 dark:text-white mb-1 pr-6">{notification.title}</h4>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">{notification.message}</p>
                                    <div className="flex justify-between items-center mt-2">
                                        <span className="text-[10px] text-gray-400">{new Date(notification.created_at).toLocaleString()}</span>
                                        {user?.role === 'super_admin' && (
                                            <button onClick={(event) => handleDelete(event, notification.id)} className="p-1 text-red-400 hover:text-red-600" aria-label="Apagar notificação">
                                                <Trash2 size={14} />
                                            </button>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
