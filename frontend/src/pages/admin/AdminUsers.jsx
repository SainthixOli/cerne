import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Users, UserPlus, MessageCircle } from 'lucide-react';
import api from '../../api';
import { maskCPF } from '../../utils/masks';

const AdminUsers = () => {
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({ nome: '', cpf: '', email: '', password: '' });
    const navigate = useNavigate();
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    const isSuperAdmin = user.role === 'super_admin';

    useEffect(() => {
        fetchAdmins();
    }, []);

    const fetchAdmins = async () => {
        try {
            const res = await api.get('/admin/users');
            setAdmins(res.data);
        } catch (error) {
            console.error(error);
            setLoading(false);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/users', formData);
            alert('Admin criado com sucesso!');
            setShowForm(false);
            setFormData({ nome: '', cpf: '', email: '', password: '' });
            fetchAdmins();
        } catch (error) {
            alert(error.response?.data?.error || 'Erro ao criar admin');
        }
    };

    const handleChange = (e) => {
        let { name, value } = e.target;
        if (name === 'cpf') value = maskCPF(value);
        setFormData({ ...formData, [name]: value });
    };

    const handleStartChat = (e, userId) => {
        e.stopPropagation(); // Evitar navegação para detalhes
        navigate('/admin/chat', { state: { startChatWith: userId } });
    };

    return (
        <div className="max-w-6xl mx-auto">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-800 dark:text-white flex items-center">
                        <Users className="mr-3 text-blue-600" /> Colaboradores
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Gerenciamento e Avaliação da Equipe.</p>
                </div>
                {isSuperAdmin && (
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition flex items-center"
                    >
                        <UserPlus size={18} className="mr-2" /> Novo Colaborador
                    </button>
                )}
            </header>

            {isSuperAdmin && showForm && (
                <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 mb-8 animate-fade-in">
                    <h3 className="text-lg font-bold mb-4 dark:text-white">Cadastrar Novo Colaborador</h3>
                    <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input
                            type="text"
                            name="nome"
                            placeholder="Nome Completo"
                            value={formData.nome}
                            onChange={handleChange}
                            className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600 outline-none dark:text-white"
                            required
                        />
                        <input
                            type="text"
                            name="cpf"
                            placeholder="CPF"
                            value={formData.cpf}
                            onChange={handleChange}
                            className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600 outline-none dark:text-white"
                            required
                        />
                        <input
                            type="email"
                            name="email"
                            placeholder="Email"
                            value={formData.email}
                            onChange={handleChange}
                            className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600 outline-none dark:text-white"
                            required
                        />
                        <input
                            type="password"
                            name="password"
                            placeholder="Senha Inicial"
                            value={formData.password}
                            onChange={handleChange}
                            className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border dark:border-gray-600 outline-none dark:text-white"
                            required
                        />
                        <div className="md:col-span-2 flex justify-end">
                            <button type="submit" className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700">
                                Salvar
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <table className="w-full text-left">
                    <thead className="bg-gray-50 dark:bg-gray-700/50 text-gray-600 dark:text-gray-400 font-medium text-sm uppercase">
                        <tr>
                            <th className="px-6 py-4">Nome</th>
                            <th className="px-6 py-4">CPF</th>
                            <th className="px-6 py-4">Email</th>
                            <th className="px-6 py-4">Função</th>
                            <th className="px-6 py-4">Status</th>
                            <th className="px-6 py-4 text-right">Ações</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-700">
                        {admins.map((admin) => (
                            <tr
                                key={admin.id}
                                onClick={() => navigate(`/admin/users/${admin.id}`)}
                                className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition cursor-pointer"
                            >
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white">{admin.nome_completo}</td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{admin.cpf}</td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{admin.email}</td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${admin.role === 'super_admin' ? 'bg-purple-100 text-purple-800' : 'bg-blue-100 text-blue-800'
                                        }`}>
                                        {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                        {admin.status_conta}
                                    </span>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <button
                                        onClick={(e) => handleStartChat(e, admin.id)}
                                        className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition"
                                        title="Iniciar Conversa"
                                    >
                                        <MessageCircle size={18} />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default AdminUsers;
