import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { LogIn, UserPlus, Eye, EyeOff } from 'lucide-react';
import api from '../../api';
import Loading from '../../components/Loading';
import { maskCPF } from '../../utils/masks';
import ThemeToggle from '../../components/ThemeToggle';

import { brand } from '../../config/brand';

const Login = () => {
    // ... (state hooks remain same)
    const [credentials, setCredentials] = useState({ cpf: '', password: '' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        let { name, value } = e.target;
        if (name === 'cpf') value = maskCPF(value);
        setCredentials({ ...credentials, [name]: value });
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

            if (user.role === 'admin' || user.role === 'super_admin') {
                navigate('/admin');
            } else if (user.role === 'system_manager') {
                navigate('/system');
            } else {
                navigate('/member');
            }
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center mesh-gradient-bg px-4 relative overflow-hidden transition-colors duration-500">
            {/* Theme Toggle */}
            <div className="absolute top-6 right-6 z-20">
                <div className="glass p-2 rounded-full">
                    <ThemeToggle />
                </div>
            </div>

            {/* Decorative Floating Elements */}
            <div className="absolute top-20 left-20 w-64 h-64 bg-purple-400/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
            <div className="absolute bottom-20 right-20 w-64 h-64 bg-blue-400/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '2s' }}></div>

            {loading && <Loading message="Autenticando..." />}

            <div className="max-w-md w-full glass-panel p-8 relative z-10 flex flex-col">
                <div className="text-center mb-10">
                    <div className="relative inline-flex items-center justify-center w-32 h-32 mb-6">
                        {/* Orbiting Dot Container */}
                        <div className="absolute inset-0 animate-spin-slow rounded-full border border-blue-500/10 dark:border-white/5">
                            <div className="h-4 w-4 bg-gradient-to-r from-blue-500 to-cyan-400 rounded-full shadow-[0_0_15px_rgba(59,130,246,0.6)] absolute -top-2 left-1/2 -translate-x-1/2"></div>
                        </div>
                        {/* Main Logo from Config */}
                        <img src={brand.client.logo} alt="Logo" className="w-20 h-20 relative z-10 drop-shadow-2xl" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2 tracking-tight">{brand.client.name} <span className="block text-sm font-light text-gray-400 mt-1">{brand.system.name} System</span></h1>
                    <p className="text-gray-500 dark:text-gray-300 font-medium">Portal do Membro</p>
                </div>

                {error && (
                    <div className="bg-red-50/80 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 p-4 rounded-2xl mb-6 text-sm text-center backdrop-blur-sm shadow-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 ml-1">CPF</label>
                        <input
                            type="text"
                            name="cpf"
                            value={credentials.cpf}
                            onChange={handleChange}
                            className="input-field dark:bg-black/20 dark:border-white/10 dark:text-white dark:placeholder-gray-500"
                            placeholder="000.000.000-00"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 ml-1">Senha</label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                name="password"
                                value={credentials.password}
                                onChange={handleChange}
                                className="input-field pr-12 dark:bg-black/20 dark:border-white/10 dark:text-white dark:placeholder-gray-500"
                                placeholder="••••••••"
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    <div className="flex justify-end">
                        <Link to="/forgot-password" className="text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors">
                            Esqueceu a senha?
                        </Link>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full flex justify-center items-center group dark:bg-white dark:text-black dark:hover:bg-gray-200"
                    >
                        <LogIn className="mr-2 group-hover:translate-x-1 transition-transform" size={20} />
                        Entrar
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-gray-200/50 dark:border-white/10 text-center">
                    <p className="text-gray-500 dark:text-gray-400 mb-4 text-sm">Ainda não é membro?</p>
                    <Link
                        to="/register"
                        className="btn-secondary w-full inline-flex justify-center items-center dark:bg-white/5 dark:text-white dark:border-white/10 dark:hover:bg-white/10"
                    >
                        Filiar-se Agora
                    </Link>
                </div>
                <div className="mt-8 border-t border-gray-200/50 dark:border-white/10 pt-6">
                    <div className="bg-gray-50 dark:bg-white/5 p-4 rounded-2xl border border-gray-100 dark:border-white/10 text-center">
                        <p className="text-gray-500 dark:text-gray-400 mb-3 text-sm font-medium">Já fez seu pedido?</p>
                        <Link
                            to="/check-status"
                            className="block w-full py-3 px-4 bg-cyan-500 hover:bg-cyan-400 text-white font-bold rounded-xl shadow-lg shadow-cyan-500/30 transform transition hover:-translate-y-0.5 active:scale-95"
                        >
                            Consultar Situação do Pedido
                        </Link>
                    </div>
                </div>

                {/* Powered By Footer */}
                <div className="mt-auto pt-8 text-center opacity-50 text-[10px] text-gray-400 dark:text-gray-600">
                    {brand.system.footerText}
                    <div className="mt-1">v{brand.system.version}</div>
                </div>
            </div>
        </div>
    );
};

export default Login;
