import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, UserPlus } from 'lucide-react';
import api from '../../api';
import Loading from '../../components/Loading';

const Login = () => {
    const [credentials, setCredentials] = useState({ cpf: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setCredentials({ ...credentials, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        try {
            const response = await api.post('/auth/login', credentials);
            const { token, user } = response.data;

            localStorage.setItem('token', token);
            localStorage.setItem('user', JSON.stringify(user));

            if (user.changePasswordRequired) {
                navigate('/change-password');
                return;
            }

            if (user.role === 'admin') {
                navigate('/admin');
            } else {
                navigate('/professor');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 px-4">
            {loading && <Loading message="Autenticando..." />}

            <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
                <div className="text-center mb-8">
                    <h1 className="text-4xl font-bold text-white mb-2">Sinpro</h1>
                    <p className="text-blue-100">Portal do Professor</p>
                </div>

                {error && (
                    <div className="bg-red-500/20 border border-red-500/50 text-white p-3 rounded-lg mb-6 text-sm text-center backdrop-blur-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-blue-100 mb-1">CPF</label>
                        <input
                            type="text"
                            name="cpf"
                            value={credentials.cpf}
                            onChange={handleChange}
                            className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition"
                            placeholder="000.000.000-00"
                            required
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-blue-100 mb-1">Senha</label>
                        <input
                            type="password"
                            name="password"
                            value={credentials.password}
                            onChange={handleChange}
                            className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition"
                            placeholder="••••••••"
                            required
                        />
                    </div>

                    <div className="flex justify-end">
                        <Link to="/forgot-password" className="text-sm text-blue-200 hover:text-white transition">
                            Esqueceu a senha?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-white text-blue-700 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition shadow-lg flex justify-center items-center"
                    >
                        <LogIn className="mr-2" size={20} /> Entrar
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-white/10 text-center">
                    <p className="text-blue-100 mb-4">Ainda não é filiado?</p>
                    <Link
                        to="/register"
                        className="inline-flex items-center justify-center w-full px-4 py-3 border-2 border-white/30 text-white rounded-xl font-semibold hover:bg-white/10 transition"
                    >
                        <UserPlus className="mr-2" size={20} />
                        Filiar-se Agora
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default Login;
