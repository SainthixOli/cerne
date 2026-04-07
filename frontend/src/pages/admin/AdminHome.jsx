import React, { useEffect, useState } from 'react';
import { Users, FileText, AlertCircle, TrendingUp, Activity, HardDrive, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../../api';

const AdminHome = () => {
    const [stats, setStats] = useState({
        total: 0,
        pending: 0,
        approved: 0,
        today: 0
    });
    const [recentActivity, setRecentActivity] = useState([]);
    const [user] = useState(() => JSON.parse(localStorage.getItem('user')));

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Fetch System Stats (Reports)
                const resReports = await api.get('/reports');
                const reportData = resReports.data?.summary || resReports.data || {};

                // 2. Fetch Audit Logs for "Recent Activity"
                let logs = [];
                try {
                    const resAudit = await api.get('/admin/audit');
                    logs = resAudit.data || [];
                } catch (e) { console.warn('Audit fetch failed', e); }

                // Map friendly names for logs
                const actionMap = {
                    'APPROVE_AFFILIATION': 'Aprovou Filiação',
                    'REJECT_AFFILIATION': 'Rejeitou Filiação',
                    'CREATE_ADMIN': 'Criou Admin',
                    'EVALUATE_ADMIN': 'Avaliação de Desempenho',
                    'UPDATE_ADMIN_STATUS': 'Alterou Status',
                    'TRANSFER_AFFILIATION': 'Transferiu Atendimento'
                };

                const formattedLogs = logs.map(log => ({
                    ...log,
                    actionFriendly: actionMap[log.action_type] || log.action_type,
                    detailsObj: typeof log.details === 'string' ? JSON.parse(log.details) : log.details
                }));

                setRecentActivity(formattedLogs.slice(0, 5));

                // 3. Update Stats State
                setStats({
                    total: reportData.total || 0,
                    pending: reportData.pending || 0,
                    approved: reportData.approved || 0,
                    today: reportData.today || 0
                });

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            }
        };

        fetchData();
    }, []);

    const cards = [
        { title: 'Total de Membros', value: stats.total, icon: Users, color: 'blue' },
        { title: 'Pendentes de Análise', value: stats.pending, icon: AlertCircle, color: 'yellow' },
        { title: 'Aprovados', value: stats.approved, icon: FileText, color: 'green' },
        { title: 'Novos Hoje', value: stats.today, icon: TrendingUp, color: 'purple' },
    ];

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex flex-col md:flex-row justify-between items-end md:items-center gap-4">
                <div>
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-white tracking-tight">Dashboard</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1 font-medium">Visão geral do CERNE System.</p>
                </div>
                <div className="glass px-4 py-2 rounded-full text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></span>
                    Sistema Operacional
                </div>
            </div>

            {/* Main Layout Grid - Visible to ALL Admins */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

                {/* Left Column: Activity Log */}
                <div className="glass-panel p-0 relative overflow-hidden group h-full flex flex-col min-h-[400px]">
                    <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-white/5">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                            <Activity className="mr-2 text-blue-500" size={24} />
                            Minha Atividade Recente
                        </h2>
                        <span className="text-xs font-mono text-gray-400">AUDIT LOG</span>
                    </div>

                    <div className="flex-1 overflow-y-auto">
                        {recentActivity.length === 0 ? (
                            <div className="p-8 text-center text-gray-400 text-sm flex flex-col items-center justify-center h-full">
                                <Activity size={32} className="mb-2 opacity-20" />
                                Nenhuma atividade recente registrada.
                            </div>
                        ) : (
                            <div className="divide-y divide-gray-100 dark:divide-gray-800">
                                {recentActivity.map((log) => (
                                    <div key={log.id} className="p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-blue-500">
                                        <div className="flex justify-between items-start">
                                            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                                                {log.actionFriendly}
                                            </p>
                                            <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                                                {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString().slice(0, 5)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-500 mt-1">
                                            por <span className="font-bold text-blue-600 dark:text-blue-400">{log.admin_name || 'Admin'}</span>
                                        </p>
                                        {log.detailsObj && (log.detailsObj.user_name || log.detailsObj.to_name) && (
                                            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-white/5 p-2 rounded">
                                                {log.detailsObj.user_name && <div>Alvo: <strong>{log.detailsObj.user_name}</strong></div>}
                                                {log.detailsObj.to_name && <div>Para: <strong>{log.detailsObj.to_name}</strong></div>}
                                                {log.detailsObj.reason && <div className="text-red-400 mt-1">Motivo: {log.detailsObj.reason}</div>}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Right Column: Pending Tasks (Affiliations + Broadcasts) */}
                <PendingTasksWidget user={user} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {cards.map((card, index) => (
                    <div key={index} className="glass-panel p-6 hover:-translate-y-1 transition-transform duration-300">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">{card.title}</p>
                                <h3 className="text-4xl font-bold text-gray-900 dark:text-white mt-2 tracking-tight">{card.value}</h3>
                            </div>
                            <div className={`p-3 rounded-2xl bg-${card.color}-50 dark:bg-${card.color}-900/20 text-${card.color}-600 dark:text-${card.color}-400 shadow-sm`}>
                                <card.icon size={24} />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

const PendingTasksWidget = ({ user }) => {
    const [tasks, setTasks] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const loadTasks = async () => {
        setLoading(true);
        try {
            let combinedTasks = [];

            // 1. Fetch Affiliations (My Tasks)
            const resAff = await api.get('/affiliations');
            const myAffiliations = (resAff.data || []).filter(item => {
                // Filter: Assigned to ME and NOT completed/rejected
                // STRICT CHECK: Status cannot be 'concluido' or 'rejeitado'
                const isAssignedToMe = item.responsavel_admin_id === user.id;
                const isNotConcluded = !['concluido', 'rejeitado'].includes(item.status);

                return isAssignedToMe && isNotConcluded;
            });

            const affiliationTasks = myAffiliations.map(a => ({
                id: a.id,
                type: 'affiliation',
                title: `Filiação: ${a.nome}`,
                subtitle: `CPF: ${a.cpf}`,
                status: a.status,
                status_atendimento: a.status_atendimento,
                date: a.data_solicitacao,
                waitingSince: Math.floor((new Date() - new Date(a.data_solicitacao)) / (1000 * 60 * 60 * 24)) // Days waiting
            }));

            combinedTasks = [...affiliationTasks];

            // 2. Fetch Notifications (Super Admin Only)
            if (user.role === 'super_admin') {
                try {
                    const resNotif = await api.get('/notifications/pending');
                    const notificationTasks = (resNotif.data || []).map(n => ({
                        id: n.id,
                        type: 'notification',
                        title: `Broadcast: ${n.title}`,
                        subtitle: `Por: ${n.author_name}`,
                        message: n.message,
                        target: n.target_group
                    }));
                    combinedTasks = [...combinedTasks, ...notificationTasks];
                } catch (e) { console.warn('Failed to fetch pending notifications'); }
            }

            setTasks(combinedTasks);
        } catch (error) {
            console.error('Error loading tasks:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadTasks();
    }, [user.id]);

    const handleApproveBroadcast = async (id) => {
        try {
            await api.post(`/notifications/${id}/approve`);
            alert('Notificação aprovada!');
            loadTasks();
        } catch (error) {
            alert('Erro ao aprovar');
        }
    };

    return (
        <div className="glass-panel p-0 h-full flex flex-col min-h-[400px]">
            <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center bg-white/5">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center">
                    <AlertCircle className="mr-2 text-yellow-500" size={24} />
                    Tarefas Pendentes
                </h2>
                <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold px-2 py-1 rounded-full">{tasks.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
                {loading ? (
                    <div className="p-8 space-y-4">
                        {[1, 2, 3].map(i => <div key={i} className="h-16 bg-gray-50 dark:bg-white/5 rounded-xl animate-pulse" />)}
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-gray-400 text-center opacity-70 p-8">
                        <CheckCircle size={48} className="mb-4 text-green-500" />
                        <p className="text-lg font-medium">Tudo em dia!</p>
                        <p className="text-sm">Você não tem pendências no momento.</p>
                    </div>
                ) : (
                    <div className="p-4 space-y-3">
                        {tasks.map((task, idx) => (
                            <div key={`${task.type}-${task.id}-${idx}`} className="p-4 bg-white dark:bg-white/5 border border-gray-100 dark:border-white/5 rounded-xl hover:shadow-md transition relative group">

                                {task.type === 'affiliation' ? (
                                    // AFFILIATION CARD
                                    <>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-lg">
                                                    <Users size={16} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800 dark:text-white text-sm">{task.title}</h4>
                                                    <p className="text-xs text-gray-500">{task.subtitle}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/10 px-2 py-1 rounded-full border border-orange-100 dark:border-orange-500/20">
                                                {task.waitingSince} dias na fila
                                            </span>
                                        </div>
                                        <div className="flex justify-end mt-3">
                                            <button
                                                onClick={() => navigate(`/admin/affiliates`)}
                                                className="text-xs font-bold text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 px-3 py-1.5 rounded-lg transition"
                                            >
                                                Ver Detalhes &rarr;
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    // NOTIFICATION CARD
                                    <>
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-lg">
                                                    <Activity size={16} />
                                                </div>
                                                <div>
                                                    <h4 className="font-bold text-gray-800 dark:text-white text-sm">{task.title}</h4>
                                                    <p className="text-xs text-gray-500">{task.subtitle}</p>
                                                </div>
                                            </div>
                                            <span className="text-[10px] uppercase font-bold text-gray-500 border px-1 rounded">
                                                {task.target}
                                            </span>
                                        </div>
                                        <p className="text-xs text-gray-600 dark:text-gray-300 mb-3 line-clamp-2 pl-11">{task.message}</p>
                                        <div className="flex justify-end">
                                            <button
                                                onClick={() => handleApproveBroadcast(task.id)}
                                                className="px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white text-xs font-bold rounded-lg transition shadow-sm flex items-center"
                                            >
                                                <CheckCircle size={12} className="mr-1" /> Aprovar Broadcast
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

export default AdminHome;
