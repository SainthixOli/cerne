import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api';
import { toast } from 'react-hot-toast';
import { Mail, Shield, CheckCircle, ArrowLeft, Activity } from 'lucide-react';

const AdminCollaboratorDetail = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [admin, setAdmin] = useState(null);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // Formato: AAAA-MM
    const [stats, setStats] = useState({ approved: 0, rejected: 0 });
    const [evaluation, setEvaluation] = useState({ score: 5, feedback: '' });
    const [loading, setLoading] = useState(true);
    const [statsLoading, setStatsLoading] = useState(false);

    const handleToggleStatus = async () => {
        if (!admin) return;
        const newStatus = admin.status_conta === 'ativo' ? 'inativo' : 'ativo';
        if (!window.confirm(`Tem certeza que deseja alterar o status para ${newStatus.toUpperCase()}?`)) return;

        try {
            await api.put(`/admin/users/${id}/status`, { status: newStatus });
            setAdmin({ ...admin, status_conta: newStatus });
            toast.success(`Status atualizado para ${newStatus.toUpperCase()}`);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao atualizar status.');
        }
    };

    useEffect(() => {
        const fetchAdmin = async () => {
            try {
                // Buscar todos para encontrar um (mais simples sem novo endpoint)
                const res = await api.get('/admin/users');
                const found = res.data.find(u => u.id === id);
                if (found) {
                    setAdmin(found);
                } else {
                    toast.error('Colaborador não encontrado.');
                    navigate('/admin/users');
                }
            } catch (error) {
                console.error(error);
                toast.error('Erro ao carregar dados.');
            } finally {
                setLoading(false);
            }
        };
        fetchAdmin();
    }, [id, navigate]);

    useEffect(() => {
        if (admin && month) {
            loadPerformance();
        }
    }, [admin, month]);

    const loadPerformance = () => {
        setStatsLoading(true);
        api.get(`/admin/performance?adminId=${id}&month=${month}`)
            .then(res => {
                setStats(res.data);
                setStatsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setStatsLoading(false);
            });
    };

    const handleEvaluationSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/evaluation', {
                adminId: id,
                month,
                score: evaluation.score,
                feedback: evaluation.feedback
            });
            toast.success('Avaliação salva com sucesso!');
        } catch (error) {
            toast.error('Erro ao salvar avaliação.');
        }
    };

    if (loading) return <div className="p-8"><div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full"></div></div>;
    if (!admin) return null;

    return (
        <div className="max-w-6xl mx-auto space-y-8 pb-10">
            {/* Cabeçalho / Cartão de Perfil */}
            <div className="glass-panel p-8 relative overflow-hidden">
                <button onClick={() => navigate('/admin/users')} className="mb-4 flex items-center text-gray-500 hover:text-gray-800 transition">
                    <ArrowLeft size={20} className="mr-1" /> Voltar
                </button>
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                    <div className="flex items-center gap-6">
                        <div className="w-24 h-24 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 text-3xl font-bold">
                            {admin.nome_completo.charAt(0)}
                        </div>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{admin.nome_completo}</h1>
                            <div className="flex items-center gap-4 mt-2 text-gray-500 dark:text-gray-400">
                                <span className="flex items-center gap-1"><Mail size={16} /> {admin.email}</span>
                                <span className="flex items-center gap-1"><Shield size={16} /> {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className={`px-4 py-2 rounded-full text-sm font-bold ${admin.status_conta === 'ativo' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            {admin.status_conta.toUpperCase()}
                        </span>
                        <button
                            onClick={handleToggleStatus}
                            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg text-sm font-bold transition text-gray-700 dark:text-gray-300"
                        >
                            {admin.status_conta === 'ativo' ? 'Desativar' : 'Ativar'}
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Estatísticas de Desempenho */}
                <div className="glass-panel p-8">
                    <div className="flex justify-between items-center mb-6">
                        <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                            <Activity className="text-blue-500" /> Desempenho
                        </h2>
                        <input
                            type="month"
                            className="p-2 border rounded-lg bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                            value={month}
                            onChange={(e) => setMonth(e.target.value)}
                        />
                    </div>

                    {statsLoading ? (
                        <div className="animate-pulse h-32 bg-gray-100 dark:bg-gray-800 rounded-xl"></div>
                    ) : (
                        <div className="grid grid-cols-3 gap-4">
                            <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-xl text-center border border-green-100 dark:border-green-800/30">
                                <span className="block text-3xl font-bold text-green-600 dark:text-green-400">{stats.approved}</span>
                                <span className="text-xs font-bold text-green-800/70 dark:text-green-300 uppercase tracking-wider">Aprovações</span>
                            </div>
                            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-xl text-center border border-red-100 dark:border-red-800/30">
                                <span className="block text-3xl font-bold text-red-600 dark:text-red-400">{stats.rejected}</span>
                                <span className="text-xs font-bold text-red-800/70 dark:text-red-300 uppercase tracking-wider">Rejeições</span>
                            </div>
                            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl text-center border border-blue-100 dark:border-blue-800/30">
                                <span className="block text-3xl font-bold text-blue-600 dark:text-blue-400">{stats.approved + stats.rejected}</span>
                                <span className="text-xs font-bold text-blue-800/70 dark:text-blue-300 uppercase tracking-wider">Total</span>
                            </div>
                        </div>
                    )}
                </div>

                {/* Formulário de Avaliação */}
                <div className="glass-panel p-8">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <CheckCircle className="text-purple-500" /> Avaliação Mensal
                    </h2>

                    <form onSubmit={handleEvaluationSubmit} className="space-y-6">
                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Nota de Desempenho</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <button
                                        key={star}
                                        type="button"
                                        onClick={() => setEvaluation({ ...evaluation, score: star })}
                                        className={`w-10 h-10 rounded-lg flex items-center justify-center text-xl transition-all ${evaluation.score >= star
                                            ? 'bg-yellow-400 text-yellow-900 scale-110 shadow-lg shadow-yellow-400/30'
                                            : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                                            }`}
                                    >
                                        ★
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">Feedback & Observações</label>
                            <textarea
                                className="w-full p-4 border rounded-xl bg-gray-50 dark:bg-gray-700 dark:border-gray-600 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                                rows="4"
                                value={evaluation.feedback}
                                onChange={(e) => setEvaluation({ ...evaluation, feedback: e.target.value })}
                                placeholder="Escreva um parecer sobre o desempenho deste colaborador..."
                            />
                        </div>

                        <button
                            type="submit"
                            className="w-full btn-primary py-3 rounded-xl shadow-lg shadow-blue-600/20"
                        >
                            Salvar Avaliação
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default AdminCollaboratorDetail;
