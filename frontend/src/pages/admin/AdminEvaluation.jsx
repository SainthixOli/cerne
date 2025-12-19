import React, { useState, useEffect } from 'react';
import api from '../../api';
import { toast } from 'react-hot-toast';

const AdminEvaluation = () => {
    const [admins, setAdmins] = useState([]);
    const [selectedAdmin, setSelectedAdmin] = useState(null);
    const [month, setMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM
    const [stats, setStats] = useState({ approved: 0, rejected: 0 });
    const [evaluation, setEvaluation] = useState({ score: 5, feedback: '' });
    const [loadingStats, setLoadingStats] = useState(false);

    useEffect(() => {
        loadAdmins();
    }, []);

    useEffect(() => {
        if (selectedAdmin && month) {
            loadPerformance();
        }
    }, [selectedAdmin, month]);

    const loadAdmins = () => {
        api.get('/admin/users')
            .then(res => setAdmins(res.data.filter(u => u.role === 'admin'))) // Only evaluate Admins, not Super Admins
            .catch(err => console.error(err));
    };

    const loadPerformance = () => {
        setLoadingStats(true);
        api.get(`/admin/performance?adminId=${selectedAdmin}&month=${month}`)
            .then(res => {
                setStats(res.data);
                setLoadingStats(false);
            })
            .catch(err => {
                console.error(err);
                setLoadingStats(false);
            });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/evaluation', {
                adminId: selectedAdmin,
                month,
                score: evaluation.score,
                feedback: evaluation.feedback
            });
            toast.success('Avaliação salva com sucesso!');
        } catch (error) {
            toast.error('Erro ao salvar avaliação.');
        }
    };

    return (

        <div className="p-6 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-6">Avaliação de Administradores</h1>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Selecione o Administrador</label>
                    <select
                        className="w-full p-2 border rounded"
                        onChange={(e) => setSelectedAdmin(e.target.value)}
                        value={selectedAdmin || ''}
                    >
                        <option value="">Selecione...</option>
                        {admins.map(admin => (
                            <option key={admin.id} value={admin.id}>{admin.nome_completo} ({admin.email})</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Mês de Referência</label>
                    <input
                        type="month"
                        className="w-full p-2 border rounded"
                        value={month}
                        onChange={(e) => setMonth(e.target.value)}
                    />
                </div>
            </div>

            {selectedAdmin && (
                <div className="bg-white p-6 rounded shadow mb-8">
                    <h2 className="text-lg font-bold mb-4">Desempenho em {month}</h2>
                    {loadingStats ? <p>Carregando estatísticas...</p> : (
                        <div className="flex gap-8">
                            <div className="text-center">
                                <p className="text-3xl font-bold text-green-600">{stats.approved}</p>
                                <p className="text-sm text-gray-500">Aprovações</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-red-600">{stats.rejected}</p>
                                <p className="text-sm text-gray-500">Rejeições</p>
                            </div>
                            <div className="text-center">
                                <p className="text-3xl font-bold text-blue-600">{stats.approved + stats.rejected}</p>
                                <p className="text-sm text-gray-500">Total Analisado</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {selectedAdmin && (
                <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow">
                    <h2 className="text-lg font-bold mb-4">Realizar Avaliação</h2>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Nota (1 a 5)</label>
                        <div className="flex gap-4">
                            {[1, 2, 3, 4, 5].map(star => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setEvaluation({ ...evaluation, score: star })}
                                    className={`p-2 rounded-full ${evaluation.score >= star ? 'text-yellow-400' : 'text-gray-300'}`}
                                >
                                    ★
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">Feedback / Observações</label>
                        <textarea
                            className="w-full p-2 border rounded h-32"
                            value={evaluation.feedback}
                            onChange={(e) => setEvaluation({ ...evaluation, feedback: e.target.value })}
                            placeholder="Descreva os pontos fortes e o que precisa melhorar..."
                        />
                    </div>

                    <button
                        type="submit"
                        className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
                    >
                        Salvar Avaliação
                    </button>
                </form>
            )}
        </div>

    );
};

export default AdminEvaluation;
