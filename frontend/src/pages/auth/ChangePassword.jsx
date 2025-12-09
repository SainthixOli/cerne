import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, CheckCircle } from 'lucide-react';
import api from '../../api';

const ChangePassword = () => {
    const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (passwords.newPassword !== passwords.confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }
        if (passwords.newPassword.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        setLoading(true);
        setError('');

        try {
            const user = JSON.parse(localStorage.getItem('user'));
            await api.post('/auth/change-password', {
                userId: user.id,
                newPassword: passwords.newPassword
            });

            setSuccess(true);
            // Update local storage to remove flag
            user.changePasswordRequired = false;
            localStorage.setItem('user', JSON.stringify(user));

            setTimeout(() => {
                if (user.role === 'admin' || user.role === 'super_admin') navigate('/admin');
                else if (user.role === 'system_manager') navigate('/system');
                else navigate('/professor');
            }, 2000);

        } catch (err) {
            setError('Erro ao alterar senha. Tente novamente.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="text-green-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Senha Alterada!</h2>
                    <p className="text-gray-600">Redirecionando para o painel...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 px-4">
            <div className="max-w-md w-full bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl p-8 border border-white/20">
                <div className="text-center mb-8">
                    <div className="bg-white/20 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="text-white" size={32} />
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2">Definir Nova Senha</h1>
                    <p className="text-blue-100">Por segurança, você precisa alterar sua senha temporária.</p>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-white p-3 rounded-xl mb-6 text-sm text-center backdrop-blur-sm animate-shake">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-blue-100 mb-1 ml-1">Nova Senha</label>
                        <input
                            type="password"
                            value={passwords.newPassword}
                            onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                            className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:ring-2 focus:ring-white/50 focus:border-transparent outline-none transition"
                            placeholder="Mínimo 6 caracteres"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-blue-100 mb-1 ml-1">Confirmar Nova Senha</label>
                        <input
                            type="password"
                            value={passwords.confirmPassword}
                            onChange={(e) => setPasswords({ ...passwords, confirmPassword: e.target.value })}
                            className="w-full p-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200/50 focus:ring-2 focus:ring-white/50 focus:border-transparent outline-none transition"
                            placeholder="Repita a senha"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-blue-700 py-4 rounded-xl font-bold hover:bg-blue-50 transition shadow-lg transform hover:scale-[1.02] active:scale-[0.98] mt-4"
                    >
                        {loading ? 'Salvando...' : 'Atualizar Senha e Entrar'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ChangePassword;
