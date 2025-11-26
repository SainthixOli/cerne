import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Moon, Sun, Lock, Bell } from 'lucide-react';
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
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white mb-8">Configurações</h1>

            <div className="space-y-6">
                {/* Appearance */}
                <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                        <Sun className="mr-2" size={20} /> Aparência
                    </h2>
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-medium text-gray-900 dark:text-white">Tema do Sistema</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Atual: {theme === 'light' ? 'Claro' : theme === 'dark' ? 'Escuro' : 'Black (OLED)'}
                            </p>
                        </div>
                        <button
                            onClick={toggleTheme}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${theme !== 'light' ? 'bg-blue-600' : 'bg-gray-200'
                                }`}
                        >
                            <span
                                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${theme !== 'light' ? 'translate-x-6' : 'translate-x-1'
                                    }`}
                            />
                        </button>
                    </div>
                </section>

                {/* Security */}
                <section className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
                    <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4 flex items-center">
                        <Lock className="mr-2" size={20} /> Segurança
                    </h2>
                    <div className="space-y-4">
                        <div className="flex items-center justify-between py-2">
                            <div>
                                <p className="font-medium text-gray-900 dark:text-white">Alterar Senha</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Atualize sua senha de acesso</p>
                            </div>
                            <button
                                onClick={() => setIsChangingPassword(!isChangingPassword)}
                                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
                            >
                                {isChangingPassword ? 'Cancelar' : 'Alterar'}
                            </button>
                        </div>

                        {isChangingPassword && (
                            <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700/30 rounded-xl space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nova Senha</label>
                                    <input
                                        type="password"
                                        value={passwords.newPassword}
                                        onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                                        className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg outline-none dark:text-white"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar Senha</label>
                                    <input
                                        type="password"
                                        value={passwords.confirmPassword}
                                        onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                                        className="w-full p-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg outline-none dark:text-white"
                                    />
                                </div>
                                <button
                                    onClick={handleChangePassword}
                                    className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition"
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
