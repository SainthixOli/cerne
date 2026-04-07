import React, { useState } from 'react';
import { useTheme } from '../../contexts/ThemeContext';
import { Moon, Sun, Lock, Bell, Shield, Key, AlertCircle } from 'lucide-react';
import api from '../../api';
import toast from 'react-hot-toast';

const MemberSettings = () => {
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

    const [isDisaffiliating, setIsDisaffiliating] = useState(false);
    const [confirmationCheck, setConfirmationCheck] = useState(false);
    // Auth logic handled by direct API calls/localStorage for now in this component

    const handleDisaffiliation = async () => {
        try {
            await api.post('/affiliations/request-disaffiliation');
            toast.success('Solicitação enviada. Aguarde a aprovação.');
            setIsDisaffiliating(false);
            // Opcional: Redirecionar para home para ver o status atualizado?
            window.location.href = '/member';
        } catch (error) {
            toast.error(error.response?.data?.error || 'Erro ao processar.');
        }
    };

    return (
        <div className="max-w-4xl mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 tracking-tight">Configurações</h1>

            <div className="space-y-8">
                {/* Aparência */}
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

                {/* Segurança */}
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
                {/* Zona de Perigo */}
                {/* Zona de Perigo - Only if Active */}
                {JSON.parse(localStorage.getItem('user') || '{}').status_conta !== 'inativo' && (
                    <section className="glass-panel p-8 relative overflow-hidden border border-red-100 dark:border-red-900/30">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-red-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>

                        <h2 className="text-xl font-bold text-red-600 dark:text-red-400 mb-6 flex items-center relative z-10">
                            <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600 dark:text-red-400 mr-3">
                                <AlertCircle size={20} />
                            </div>
                            Zona de Perigo
                        </h2>

                        <div className="p-6 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/20 relative z-10">
                            <h3 className="font-bold text-gray-900 dark:text-white mb-2">Desfiliação</h3>
                            <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                Ao solicitar a desfiliação, sua conta será inativada e você perderá acesso aos benefícios de membro.
                                Você poderá solicitar a reativação futuramente fazendo login novamente.
                            </p>

                            <button
                                onClick={() => setIsDisaffiliating(true)}
                                className="bg-white dark:bg-white/10 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/50 hover:bg-red-50 dark:hover:bg-red-900/20 px-4 py-2 rounded-xl font-bold text-sm transition"
                            >
                                Solicitar Desfiliação
                            </button>
                        </div>
                    </section>
                )}
            </div>

            {/* Modal de Desfiliação Avançado */}
            {isDisaffiliating && (
                <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[9999] p-4 animate-in fade-in duration-300">
                    <div className="glass-panel p-0 max-w-2xl w-full shadow-2xl overflow-hidden relative border-red-500/30">
                        {/* Header com Gradiente Vermelho */}
                        <div className="bg-gradient-to-r from-red-600 to-orange-600 p-8 text-white relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-16 -mt-16"></div>
                            <h2 className="text-3xl font-bold mb-2 relative z-10 flex items-center">
                                <AlertCircle className="mr-3" size={32} />
                                Solicitar Desfiliação
                            </h2>
                            <p className="opacity-90 relative z-10">Sentiremos sua falta. Nos ajude a melhorar contando o motivo.</p>
                            <button
                                onClick={() => setIsDisaffiliating(false)}
                                className="absolute top-4 right-4 p-2 bg-white/20 hover:bg-white/30 rounded-full transition"
                            >
                                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            {/* Passo 1 warning */}
                            <div className="bg-red-50 dark:bg-red-900/10 border-l-4 border-red-500 p-4 rounded-r-xl">
                                <h4 className="font-bold text-red-700 dark:text-red-400 mb-1">Atenção!</h4>
                                <p className="text-sm text-gray-600 dark:text-gray-300">
                                    Ao confirmar, seu acesso será suspenso. Se desejar retornar, basta fazer login com seus dados atuais e clicar opção <strong>"Solicitar Reativação"</strong>. Seus dados serão preservados.
                                </p>
                            </div>

                            {/* Formulário */}
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Qual o motivo da saída?</label>
                                    <textarea
                                        className="input-field h-24 resize-none"
                                        placeholder="Conte-nos o que aconteceu (opcional)..."
                                    ></textarea>
                                </div>

                                <div>
                                    <label className="block text-sm font-bold text-gray-700 dark:text-gray-300 mb-2">Você pretende voltar futuramente?</label>
                                    <div className="flex gap-4">
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="return" className="text-red-500 focus:ring-red-500" />
                                            <span className="text-gray-700 dark:text-gray-300">Sim, pretendo.</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="return" className="text-red-500 focus:ring-red-500" />
                                            <span className="text-gray-700 dark:text-gray-300">Não, é definitivo.</span>
                                        </label>
                                        <label className="flex items-center gap-2 cursor-pointer">
                                            <input type="radio" name="return" className="text-red-500 focus:ring-red-500" />
                                            <span className="text-gray-700 dark:text-gray-300">Não sei.</span>
                                        </label>
                                    </div>
                                </div>
                            </div>

                            {/* Confirmação Final */}
                            <div className="pt-4 border-t border-gray-100 dark:border-white/10">
                                <label className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10 transition">
                                    <input
                                        type="checkbox"
                                        className="mt-1 w-5 h-5 text-red-600 rounded border-gray-300 focus:ring-red-500"
                                        checked={confirmationCheck}
                                        onChange={(e) => setConfirmationCheck(e.target.checked)}
                                    />
                                    <div className="text-sm">
                                        <span className="font-bold text-gray-900 dark:text-white block mb-1">Confirmar Desfiliação</span>
                                        <span className="text-gray-500 dark:text-gray-400">Estou ciente que perderei acesso aos benefícios imediatamente.</span>
                                    </div>
                                </label>
                            </div>

                            <div className="flex justify-end gap-3 mt-6">
                                <button
                                    onClick={() => setIsDisaffiliating(false)}
                                    className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 transition"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleDisaffiliation}
                                    disabled={!confirmationCheck}
                                    className={`px-8 py-3 rounded-xl font-bold text-white shadow-lg transition transform hover:-translate-y-1 ${confirmationCheck ? 'bg-gradient-to-r from-red-600 to-orange-600 hover:shadow-red-500/40' : 'bg-gray-300 dark:bg-gray-700 cursor-not-allowed'}`}
                                >
                                    Confirmar Desfiliação
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MemberSettings;
