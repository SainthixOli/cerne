import React, { useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { Lock, CheckCircle, AlertCircle } from 'lucide-react';
import api from '../../api';
import Loading from '../../components/Loading';

const ResetPassword = () => {
    const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const token = searchParams.get('token');

    const handleChange = (e) => {
        setPasswords({ ...passwords, [e.target.name]: e.target.value });
    };

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
            await api.post('/auth/reset-password', {
                token,
                newPassword: passwords.newPassword
            });

            setSuccess(true);
            setTimeout(() => {
                navigate('/login');
            }, 3000);

        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao redefinir senha. O link pode ter expirado.');
        } finally {
            setLoading(false);
        }
    };

    if (!token) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <AlertCircle className="text-red-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Link Inválido</h2>
                    <p className="text-gray-600 mb-6">O link de redefinição de senha é inválido ou está faltando.</p>
                    <Link to="/login" className="text-blue-600 font-medium hover:underline">
                        Voltar para Login
                    </Link>
                </div>
            </div>
        );
    }

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
                <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="text-green-600" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 mb-2">Senha Redefinida!</h2>
                    <p className="text-gray-600">Sua senha foi alterada com sucesso. Redirecionando para o login...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 px-4">
            {loading && <Loading message="Redefinindo senha..." />}

            <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8">
                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Lock className="text-blue-600" size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800">Redefinir Senha</h1>
                    <p className="text-gray-500 mt-2">Crie uma nova senha para sua conta.</p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Nova Senha</label>
                        <input
                            type="password"
                            name="newPassword"
                            value={passwords.newPassword}
                            onChange={handleChange}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="••••••••"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Confirmar Nova Senha</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            value={passwords.confirmPassword}
                            onChange={handleChange}
                            className="w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition"
                    >
                        Redefinir Senha
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ResetPassword;
