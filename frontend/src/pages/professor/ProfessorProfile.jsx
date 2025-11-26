import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, Briefcase, Save, Edit2 } from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';

const ProfessorProfile = () => {
    const [user, setUser] = useState(null);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchProfile();
    }, []);

    const fetchProfile = async () => {
        try {
            const response = await api.get('/profile');
            setUser(response.data);
            setFormData(response.data);
        } catch (error) {
            console.error('Error fetching profile:', error);
            toast.error('Erro ao carregar perfil');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSave = async () => {
        try {
            await api.put('/profile', formData);
            setUser(formData);
            setIsEditing(false);
            toast.success('Perfil atualizado com sucesso!');
        } catch (error) {
            console.error('Error updating profile:', error);
            toast.error('Erro ao atualizar perfil');
        }
    };

    if (loading) return <div className="text-center py-10 text-gray-500">Carregando perfil...</div>;
    if (!user) return null;

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Meu Cadastro</h1>

            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-blue-500 to-purple-600"></div>
                <div className="px-8 pb-8">
                    <div className="relative flex justify-between items-end -mt-12 mb-6">
                        <div className="w-24 h-24 bg-white dark:bg-gray-800 rounded-full p-1 shadow-lg">
                            <div className="w-full h-full bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center text-2xl font-bold text-gray-500 dark:text-gray-400">
                                {user.nome_completo?.charAt(0)}
                            </div>
                        </div>
                        <button
                            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                            className={`px-4 py-2 rounded-lg text-white transition shadow-md flex items-center ${isEditing ? 'bg-green-600 hover:bg-green-700' : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                        >
                            {isEditing ? <><Save size={18} className="mr-2" /> Salvar</> : <><Edit2 size={18} className="mr-2" /> Editar Dados</>}
                        </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Nome Completo</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="nome_completo"
                                        value={formData.nome_completo || ''}
                                        onChange={handleChange}
                                        className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none dark:text-white"
                                    />
                                ) : (
                                    <div className="flex items-center mt-1 text-gray-900 dark:text-white font-medium">
                                        <User size={18} className="mr-2 text-blue-500" />
                                        {user.nome_completo}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Email</label>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email || ''}
                                        onChange={handleChange}
                                        className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none dark:text-white"
                                    />
                                ) : (
                                    <div className="flex items-center mt-1 text-gray-900 dark:text-white font-medium">
                                        <Mail size={18} className="mr-2 text-blue-500" />
                                        {user.email || 'Não informado'}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Telefone</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="telefone"
                                        value={formData.telefone || ''}
                                        onChange={handleChange}
                                        className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none dark:text-white"
                                    />
                                ) : (
                                    <div className="flex items-center mt-1 text-gray-900 dark:text-white font-medium">
                                        <Phone size={18} className="mr-2 text-blue-500" />
                                        {user.telefone || 'Não informado'}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Função</label>
                                <div className="flex items-center mt-1 text-gray-900 dark:text-white font-medium">
                                    <Briefcase size={18} className="mr-2 text-blue-500" />
                                    Professor
                                </div>
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Matrícula</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="matricula_funcional"
                                        value={formData.matricula_funcional || ''}
                                        onChange={handleChange}
                                        className="w-full mt-1 p-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg outline-none dark:text-white"
                                    />
                                ) : (
                                    <div className="flex items-center mt-1 text-gray-900 dark:text-white font-medium">
                                        {user.matricula_funcional || 'Não informada'}
                                    </div>
                                )}
                            </div>
                            <div>
                                <label className="text-sm font-medium text-gray-500 dark:text-gray-400">Status da Conta</label>
                                <div className="flex items-center mt-1">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                        Ativo
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProfessorProfile;
