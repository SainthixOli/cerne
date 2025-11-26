import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Mail, ArrowLeft, CheckCircle } from 'lucide-react';
import api from '../../api';
import Loading from '../../components/Loading';

const ForgotPassword = () => {
    const [cpf, setCpf] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await api.post('/auth/forgot-password', { cpf });
            setSuccess(true);
        } catch (err) {
            setError('Erro ao processar solicitação. Tente novamente.');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
                <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8 text-center">
                    <div className="w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="text-green-600 dark:text-green-400" size={32} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Email Enviado!</h2>
                    <p className="text-gray-600 dark:text-gray-400 mb-6">
                        Se o CPF estiver cadastrado, você receberá um email com as instruções para redefinir sua senha.
                    </p>
                    <Link to="/login" className="text-blue-600 dark:text-blue-400 font-medium hover:underline">
                        Voltar para Login
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900 px-4">
            {loading && <Loading message="Enviando..." />}

            <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
                <Link to="/login" className="inline-flex items-center text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 mb-6 transition">
                    <ArrowLeft className="mr-2" size={20} /> Voltar
                </Link>

                <div className="text-center mb-8">
                    <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="text-blue-600 dark:text-blue-400" size={24} />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-800 dark:text-white">Recuperar Senha</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-2">Digite seu CPF para receber as instruções.</p>
                </div>

                {error && (
                    <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-3 rounded-lg mb-4 text-sm text-center">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPF</label>
                        <input
                            type="text"
                            value={cpf}
                            onChange={(e) => setCpf(e.target.value)}
                            className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition"
                            placeholder="000.000.000-00"
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition shadow-lg"
                    >
                        Enviar Instruções
                    </button>
                </form>
            </div>
        </div>
    );
};

export default ForgotPassword;
