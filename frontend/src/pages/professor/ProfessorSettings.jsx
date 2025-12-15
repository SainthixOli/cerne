import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Moon, Sun, Lock, Bell, Shield, Key } from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';

const ProfessorSettings = () => {
    const { theme, toggleTheme } = useTheme();
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });

    const handleChangePassword = async () => {
        if (passwords.newPassword !== passwords.confirmPassword) {
            toast.error('As senhas não coincidem');
            return;
        }
        if (passwords.newPassword.length < 6) {
            toast.error('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        try {
            const user = JSON.parse(localStorage.getItem('user'));
            await api.post('/auth/change-password', {
                userId: user.id,
                newPassword: passwords.newPassword
            });
            toast.success('Senha alterada com sucesso!');
            setIsChangingPassword(false);
            setPasswords({ newPassword: '', confirmPassword: '' });
        } catch (error) {
            toast.error('Erro ao alterar senha');
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 tracking-tight">Configurações</h1>

            <div className="space-y-8">
                {/* Appearance */}
                <section className="glass-panel p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>

                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center relative z-10">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-400 mr-3">
                            <Sun size={20} />
                        </div>
                        Aparência
                    </h2>

                    <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10 relative z-10">
                        <div>
                            <p className="font-bold text-gray-900 dark:text-white">Tema do Sistema</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Atual: <span className="font-medium text-blue-500">{theme === 'light' ? 'Claro' : theme === 'dark' ? 'Escuro' : 'Black (OLED)'}</span>
                            </p>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className={`relative inline-flex h-8 w-14 items-center rounded-full transition-all focus:outline-none focus:ring-4 focus:ring-blue-500/20 ${theme !== 'light' ? 'bg-blue-600' : 'bg-gray-300'
                                }`}
                        >
                            <span
                                className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${theme !== 'light' ? 'translate-x-7' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </section>

                {/* Security */}
                <section className="glass-panel p-8 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>

                    <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-6 flex items-center relative z-10">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400 mr-3">
                            <Shield size={20} />
                        </div>
                        Segurança
                    </h2>

                    <div className="space-y-6 relative z-10">
                        <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-white/5 rounded-2xl border border-gray-100 dark:border-white/10">
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white flex items-center">
                                    <Key size={16} className="mr-2 text-gray-400" />
                                    Alterar Senha
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Atualize sua senha de acesso periodicamente</p>
                            </div>
                            <button
                                onClick={() => setIsChangingPassword(!isChangingPassword)}
                                className={`px-4 py-2 rounded-xl font-medium transition-all ${isChangingPassword
                                        ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                                        : 'bg-gray-100 text-gray-700 dark:bg-white/10 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20'
                                    }`}
                            >
                                {isChangingPassword ? 'Cancelar' : 'Alterar'}
                            </button>
                        </div>

                        {isChangingPassword && (
                            <div className="p-6 bg-gray-50/80 dark:bg-black/20 rounded-2xl border border-gray-100 dark:border-white/5 space-y-4 animate-fade-in">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">Nova Senha</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="password"
                                            value={passwords.newPassword}
                                            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                            className="input-field pl-10"
                                            placeholder="Mínimo 6 caracteres"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2 uppercase tracking-wider">Confirmar Senha</label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                        <input
                                            type="password"
                                            value={passwords.confirmPassword}
                                            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                            className="input-field pl-10"
                                            placeholder="Repita a nova senha"
                                        />
                                    </div>
                                </div>
                                <button
                                    onClick={handleChangePassword}
                                    className="btn-primary w-full py-3 flex justify-center items-center"
                                >
                                    Salvar Nova Senha
                                </button>
                            </div>
                        )}
                    </div>
                </section>
            </div>
        </div>
    );
};

export default ProfessorSettings;
