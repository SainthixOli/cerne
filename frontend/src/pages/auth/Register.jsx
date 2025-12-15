import React, { useState } from 'react';
import { Download, Upload, Check, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import Loading from '../../components/Loading';
import { maskCPF, maskPhone } from '../../utils/masks';
import ThemeToggle from '../../components/ThemeToggle';

const Register = () => {
    const [step, setStep] = useState(1);
    const [formData, setFormData] = useState({
        nome: '', cpf: '', email: '', telefone: '', matricula: ''
    });
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleChange = (e) => {
        let { name, value } = e.target;
        if (name === 'cpf') value = maskCPF(value);
        if (name === 'telefone') value = maskPhone(value);
        setFormData({ ...formData, [name]: value });
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.post('/register', formData, { responseType: 'blob' });
            const url = window.URL.createObjectURL(new Blob([response.data]));
            const link = document.createElement('a');
            link.href = url;
            link.setAttribute('download', `filiacao_${formData.nome}.pdf`);
            document.body.appendChild(link);
            link.click();
            setStep(2);
        } catch (err) {
            setError('Erro ao registrar. Verifique os dados.');
        } finally {
            setLoading(false);
        }
    };

    const handleUpload = async (e) => {
        e.preventDefault();
        if (!file) return;
        setLoading(true);
        const data = new FormData();
        data.append('file', file);
        data.append('cpf', formData.cpf);

        try {
            await api.post('/upload', data);
            setStep(3);
        } catch (err) {
            setError('Erro ao enviar arquivo.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen mesh-gradient-bg py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-500 relative overflow-hidden flex items-center justify-center">
            {/* Theme Toggle */}
            <div className="absolute top-6 right-6 z-20">
                <div className="glass p-2 rounded-full">
                    <ThemeToggle />
                </div>
            </div>

            {/* Decorative Floating Elements */}
            <div className="absolute top-20 left-10 w-72 h-72 bg-purple-400/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float"></div>
            <div className="absolute bottom-20 right-10 w-72 h-72 bg-blue-400/30 rounded-full mix-blend-multiply filter blur-xl opacity-70 animate-float" style={{ animationDelay: '2s' }}></div>

            {loading && <Loading message="Processando..." />}

            <div className="max-w-3xl w-full relative z-10">
                <Link to="/login" className="inline-flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mb-8 transition font-medium glass px-4 py-2 rounded-xl">
                    <ArrowLeft className="mr-2" size={20} /> Voltar para Login
                </Link>

                <div className="glass-panel overflow-hidden">
                    <div className="bg-gray-900/5 dark:bg-white/5 px-8 py-8 border-b border-gray-200/50 dark:border-white/10">
                        <h2 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Filiação Digital</h2>
                        <p className="text-gray-500 dark:text-gray-400 mt-2">Siga os passos para se tornar um membro.</p>
                    </div>

                    <div className="p-8">
                        {/* Steps Indicator */}
                        <div className="flex items-center justify-center mb-12">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex items-center">
                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold transition-all duration-300 ${step >= s
                                        ? 'bg-gray-900 text-white shadow-lg scale-110 dark:bg-white dark:text-black'
                                        : 'bg-gray-100 dark:bg-white/10 text-gray-400 dark:text-gray-500'
                                        }`}>
                                        {step > s ? <Check size={24} /> : s}
                                    </div>
                                    {s < 3 && (
                                        <div className={`w-20 h-1 bg-gray-200 dark:bg-white/10 mx-4 rounded-full overflow-hidden`}>
                                            <div className={`h-full bg-gray-900 dark:bg-white transition-all duration-500 ${step > s ? 'w-full' : 'w-0'}`}></div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {error && (
                            <div className="bg-red-50/80 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-300 p-4 rounded-2xl mb-8 flex items-center backdrop-blur-sm">
                                <AlertCircle className="mr-2" size={20} /> {error}
                            </div>
                        )}

                        {step === 1 && (
                            <form onSubmit={handleRegister} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2 space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 ml-1">Nome Completo <span className="text-red-500">*</span></label>
                                        <input type="text" name="nome" onChange={handleChange} className="input-field" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 ml-1">CPF <span className="text-red-500">*</span></label>
                                        <input type="text" name="cpf" value={formData.cpf} onChange={handleChange} className="input-field" placeholder="000.000.000-00" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 ml-1">Email <span className="text-red-500">*</span></label>
                                        <input type="email" name="email" onChange={handleChange} className="input-field" required />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 ml-1">Telefone</label>
                                        <input type="text" name="telefone" value={formData.telefone} onChange={handleChange} className="input-field" placeholder="(00) 00000-0000" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-gray-700 dark:text-gray-200 ml-1">Matrícula</label>
                                        <input type="text" name="matricula" onChange={handleChange} className="input-field" />
                                    </div>
                                </div>
                                <button type="submit" className="btn-primary w-full flex justify-center items-center text-lg py-4">
                                    <Download className="mr-2" size={20} /> Gerar Ficha de Filiação
                                </button>
                            </form>
                        )}

                        {step === 2 && (
                            <div className="text-center py-8">
                                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400 animate-bounce">
                                    <Download size={40} />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Ficha Gerada!</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                                    O download iniciou automaticamente. Assine o documento e faça o upload abaixo para concluir.
                                </p>

                                <form onSubmit={handleUpload} className="max-w-md mx-auto">
                                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-3xl p-10 mb-8 hover:border-blue-500 dark:hover:border-blue-400 transition-all cursor-pointer bg-white/50 dark:bg-white/5 hover:bg-white/80 dark:hover:bg-white/10 group">
                                        <input type="file" onChange={(e) => setFile(e.target.files[0])} className="hidden" id="file-upload" />
                                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                            <Upload size={48} className="text-gray-400 group-hover:text-blue-500 transition-colors mb-4" />
                                            <span className="text-gray-600 dark:text-gray-300 font-medium text-lg">{file ? file.name : 'Clique para selecionar o arquivo assinado'}</span>
                                        </label>
                                    </div>
                                    <button type="submit" disabled={!file} className="btn-primary w-full py-4 text-lg disabled:opacity-50 disabled:cursor-not-allowed">
                                        Enviar Ficha Assinada
                                    </button>
                                </form>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="text-center py-12">
                                <div className="w-28 h-28 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-8 text-green-600 dark:text-green-400 animate-pulse">
                                    <Check size={56} />
                                </div>
                                <h3 className="text-4xl font-bold text-gray-900 dark:text-white mb-4 tracking-tight">Sucesso!</h3>
                                <p className="text-gray-500 dark:text-gray-400 mb-10 max-w-lg mx-auto text-lg">
                                    Seu cadastro foi enviado para análise. Assim que aprovado, você receberá sua senha de acesso por e-mail.
                                </p>
                                <Link to="/login" className="btn-primary inline-flex items-center px-10 py-4 text-lg">
                                    Voltar para Login
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Register;
