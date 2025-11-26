import React, { useState } from 'react';
import { Download, Upload, Check, AlertCircle, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api';
import Loading from '../../components/Loading';

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
        setFormData({ ...formData, [e.target.name]: e.target.value });
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
        <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-12 px-4 sm:px-6 lg:px-8 transition-colors duration-300">
            {loading && <Loading message="Processando..." />}

            <div className="max-w-3xl mx-auto">
                <Link to="/login" className="inline-flex items-center text-gray-500 hover:text-blue-600 dark:text-gray-400 dark:hover:text-blue-400 mb-8 transition">
                    <ArrowLeft className="mr-2" size={20} /> Voltar para Login
                </Link>

                <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-gray-700">
                    <div className="bg-blue-600 px-8 py-6">
                        <h2 className="text-2xl font-bold text-white">Filiação Digital</h2>
                        <p className="text-blue-100 mt-1">Siga os passos para se tornar um membro.</p>
                    </div>

                    <div className="p-8">
                        {/* Steps Indicator */}
                        <div className="flex items-center justify-center mb-10">
                            {[1, 2, 3].map((s) => (
                                <div key={s} className="flex items-center">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold transition-all ${step >= s ? 'bg-blue-600 text-white shadow-lg scale-110' : 'bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                                        }`}>
                                        {step > s ? <Check size={20} /> : s}
                                    </div>
                                    {s < 3 && (
                                        <div className={`w-16 h-1 bg-gray-200 dark:bg-gray-700 mx-2 rounded-full overflow-hidden`}>
                                            <div className={`h-full bg-blue-600 transition-all duration-500 ${step > s ? 'w-full' : 'w-0'}`}></div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>

                        {error && (
                            <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 p-4 rounded-xl mb-6 flex items-center">
                                <AlertCircle className="mr-2" size={20} /> {error}
                            </div>
                        )}

                        {step === 1 && (
                            <form onSubmit={handleRegister} className="space-y-6">
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="md:col-span-2">
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nome Completo</label>
                                        <input type="text" name="nome" onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">CPF</label>
                                        <input type="text" name="cpf" onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
                                        <input type="email" name="email" onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition" required />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Telefone</label>
                                        <input type="text" name="telefone" onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Matrícula</label>
                                        <input type="text" name="matricula" onChange={handleChange} className="w-full p-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none dark:text-white transition" />
                                    </div>
                                </div>
                                <button type="submit" className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg flex justify-center items-center">
                                    <Download className="mr-2" size={20} /> Gerar Ficha de Filiação
                                </button>
                            </form>
                        )}

                        {step === 2 && (
                            <div className="text-center py-8">
                                <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400">
                                    <Download size={32} />
                                </div>
                                <h3 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">Ficha Gerada!</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-md mx-auto">
                                    O download iniciou automaticamente. Assine o documento e faça o upload abaixo para concluir.
                                </p>

                                <form onSubmit={handleUpload} className="max-w-md mx-auto">
                                    <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-2xl p-8 mb-6 hover:border-blue-500 dark:hover:border-blue-400 transition cursor-pointer bg-gray-50 dark:bg-gray-700/30">
                                        <input type="file" onChange={(e) => setFile(e.target.files[0])} className="hidden" id="file-upload" />
                                        <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
                                            <Upload size={40} className="text-gray-400 mb-4" />
                                            <span className="text-gray-600 dark:text-gray-300 font-medium">{file ? file.name : 'Clique para selecionar o arquivo assinado'}</span>
                                        </label>
                                    </div>
                                    <button type="submit" disabled={!file} className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold hover:bg-blue-700 transition shadow-lg disabled:opacity-50 disabled:cursor-not-allowed">
                                        Enviar Ficha Assinada
                                    </button>
                                </form>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="text-center py-12">
                                <div className="w-24 h-24 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 dark:text-green-400 animate-bounce">
                                    <Check size={48} />
                                </div>
                                <h3 className="text-3xl font-bold text-gray-800 dark:text-white mb-4">Sucesso!</h3>
                                <p className="text-gray-600 dark:text-gray-400 mb-8 max-w-lg mx-auto text-lg">
                                    Seu cadastro foi enviado para análise. Assim que aprovado, você receberá sua senha de acesso por e-mail.
                                </p>
                                <Link to="/login" className="inline-block px-8 py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition shadow-lg">
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
