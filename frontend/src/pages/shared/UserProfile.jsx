import React, { useEffect, useState } from 'react';
import { User, Mail, Phone, Briefcase, Save, Edit2, Camera, Shield, BadgeCheck } from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';
import EvaluationHistory from '../../components/EvaluationHistory';

const UserProfile = () => {
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

    const handlePhotoUpload = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const data = new FormData();
        data.append('photo', file);

        try {
            const response = await api.post('/profile/photo', data);

            // The backend returns { message, photoUrl: 'uploads/filename.jpg' }
            // We need to ensure we save it correctly in state and localStorage
            const photoPath = response.data.photoUrl;

            // Update local state
            const updatedUser = { ...user, photo_url: photoPath };
            setUser(updatedUser);

            // Safe Update localStorage
            const storedUser = JSON.parse(localStorage.getItem('user') || '{}');
            localStorage.setItem('user', JSON.stringify({ ...storedUser, photo_url: photoPath }));

            // Force a custom event to notify other components (like Sidebar) if they listen to visible changes
            window.dispatchEvent(new Event('storage'));

            toast.success('Foto atualizada!');
        } catch (error) {
            console.error('Error uploading photo:', error);
            toast.error('Erro ao atualizar foto');
        }
    };

    // Helper to get image URL
    const getPhotoUrl = (path) => {
        if (!path) return null;
        if (path.startsWith('http')) return path;
        // Adjust this if your backend port is different or environment specific
        // Since we are likely proxying /api, we might need to proxy /uploads or use full URL
        return `http://localhost:3000/${path.replace(/\\/g, '/')}`;
    };

    if (loading) return (
        <div className="min-h-[50vh] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
    );

    if (!user) return null;

    const roleLabel = {
        'super_admin': 'Super Administrador',
        'admin': 'Administrador',
        'system_manager': 'Gerente do Sistema',
        'professor': 'Membro'
    }[user.role] || 'Usuário';

    return (
        <div className="max-w-4xl mx-auto animate-fade-in">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 tracking-tight">Meu Cadastro</h1>

            <div className="glass-panel overflow-hidden relative">
                {/* Header Background */}
                <div className="h-40 bg-gradient-to-r from-blue-600 to-purple-600 relative overflow-hidden">
                    <div className="absolute inset-0 bg-black/10 backdrop-blur-[2px]"></div>
                    <div className="absolute -bottom-10 -right-10 w-64 h-64 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute top-10 left-10 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                </div>

                <div className="px-8 pb-8 relative z-10">
                    <div className="flex flex-col md:flex-row justify-between items-end -mt-16 mb-8 gap-4">
                        <div className="relative group">
                            <div className="w-32 h-32 rounded-full p-1.5 glass bg-white/10 backdrop-blur-md shadow-2xl">
                                <div className="w-full h-full rounded-full overflow-hidden bg-gray-800 relative">
                                    {user.photo_url ? (
                                        <img src={getPhotoUrl(user.photo_url)} alt="Profile" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-700 to-gray-900 text-4xl font-bold text-white uppercase">
                                            {user.nome_completo?.charAt(0)}
                                        </div>
                                    )}

                                    {/* Upload Overlay */}
                                    <label htmlFor="photo-upload" className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer">
                                        <Camera className="text-white mb-1" size={24} />
                                        <span className="text-white text-xs font-medium">Alterar Foto</span>
                                    </label>
                                    <input
                                        type="file"
                                        id="photo-upload"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handlePhotoUpload}
                                    />
                                </div>
                            </div>
                            <div className="absolute bottom-2 right-2 w-6 h-6 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full shadow-sm"></div>
                        </div>

                        <div className="flex-grow md:ml-4 mb-2">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                                {user.nome_completo}
                                {user.role === 'super_admin' && <BadgeCheck className="text-blue-500" size={20} />}
                            </h2>
                            <p className="text-gray-500 dark:text-gray-400 font-medium flex items-center">
                                <Shield size={16} className="mr-1.5 text-blue-500" />
                                {roleLabel}
                            </p>
                        </div>

                        <button
                            onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                            className={`px-6 py-2.5 rounded-xl text-white font-medium transition-all shadow-lg flex items-center ${isEditing
                                ? 'bg-gradient-to-r from-green-500 to-emerald-600 hover:shadow-green-500/30'
                                : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:shadow-blue-500/30'
                                }`}
                        >
                            {isEditing ? <><Save size={18} className="mr-2" /> Salvar Alterações</> : <><Edit2 size={18} className="mr-2" /> Editar Perfil</>}
                        </button>
                    </div>

                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                            <div className="group">
                                <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Nome Completo</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="nome_completo"
                                        value={formData.nome_completo || ''}
                                        onChange={handleChange}
                                        className="input-field"
                                    />
                                ) : (
                                    <div className="flex items-center p-3 bg-gray-50/50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 mr-3">
                                            <User size={18} />
                                        </div>
                                        <span className="text-gray-900 dark:text-white font-medium">{user.nome_completo}</span>
                                    </div>
                                )}
                            </div>

                            <div className="group">
                                <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Email</label>
                                {isEditing ? (
                                    <input
                                        type="email"
                                        name="email"
                                        value={formData.email || ''}
                                        onChange={handleChange}
                                        className="input-field"
                                    />
                                ) : (
                                    <div className="flex items-center p-3 bg-gray-50/50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg text-purple-600 dark:text-purple-400 mr-3">
                                            <Mail size={18} />
                                        </div>
                                        <span className="text-gray-900 dark:text-white font-medium">{user.email || 'Não informado'}</span>
                                    </div>
                                )}
                            </div>

                            <div className="group">
                                <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Telefone</label>
                                {isEditing ? (
                                    <input
                                        type="text"
                                        name="telefone"
                                        value={formData.telefone || ''}
                                        onChange={handleChange}
                                        className="input-field"
                                    />
                                ) : (
                                    <div className="flex items-center p-3 bg-gray-50/50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                                        <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400 mr-3">
                                            <Phone size={18} />
                                        </div>
                                        <span className="text-gray-900 dark:text-white font-medium">{user.telefone || 'Não informado'}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <div className="group">
                                <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Função</label>
                                <div className="flex items-center p-3 bg-gray-50/50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                                    <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-600 dark:text-orange-400 mr-3">
                                        <Briefcase size={18} />
                                    </div>
                                    <span className="text-gray-900 dark:text-white font-medium">{roleLabel}</span>
                                </div>
                            </div>

                            {/* Matricula - Show if present or if Professor */}
                            {(user.role === 'professor' || user.matricula_funcional) && (
                                <div className="group">
                                    <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Matrícula</label>
                                    {isEditing ? (
                                        <input
                                            type="text"
                                            name="matricula_funcional"
                                            value={formData.matricula_funcional || ''}
                                            onChange={handleChange}
                                            className="input-field"
                                        />
                                    ) : (
                                        <div className="flex items-center p-3 bg-gray-50/50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5">
                                            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-gray-600 dark:text-gray-400 mr-3">
                                                <span className="font-mono font-bold text-xs">ID</span>
                                            </div>
                                            <span className="text-gray-900 dark:text-white font-medium">{user.matricula_funcional || 'Não informada'}</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            <div className="group">
                                <label className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2 block">Status da Conta</label>
                                <div className="flex items-center">
                                    <span className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-bold bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 border border-green-200 dark:border-green-800">
                                        <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                                        Ativo
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Performance Section for Admins */}
            {(user.role === 'admin' || user.role === 'system_manager') && (
                <div className="mt-8 animate-fade-in" style={{ animationDelay: '0.1s' }}>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        <BadgeCheck className="text-purple-500" /> Minhas Avaliações de Desempenho
                    </h3>
                    <div className="glass-panel p-6">
                        <EvaluationHistory userId={user.id} />
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserProfile;
