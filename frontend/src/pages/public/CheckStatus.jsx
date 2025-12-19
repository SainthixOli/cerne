import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowLeft, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import api from '../../api';
import { maskCPF } from '../../utils/masks';
import Loading from '../../components/Loading';
import ChatComponent from '../../components/ChatComponent';

const CheckStatus = () => {
    const [cpf, setCpf] = useState('');
    const [statusData, setStatusData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleCheck = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setStatusData(null);

        try {
            const response = await api.post('/affiliations/status', { cpf });
            setStatusData(response.data);
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao consultar status');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setCpf(maskCPF(e.target.value));
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 px-4">
            {loading && <Loading message="Consultando..." />}

            <div className="max-w-md w-full bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 border border-white/20">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-white mb-2">Consultar Situação</h1>
                    <p className="text-blue-100">Verifique o status da sua filiação</p>
                </div>

                {!statusData ? (
                    <form onSubmit={handleCheck} className="space-y-6">
                        <div>
                            <label className="block text-sm font-medium text-blue-100 mb-1">CPF</label>
                            <input
                                type="text"
                                value={cpf}
                                onChange={handleChange}
                                className="w-full p-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-blue-200 focus:ring-2 focus:ring-blue-400 focus:border-transparent outline-none transition"
                                placeholder="000.000.000-00"
                                required
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full bg-white text-blue-700 py-3.5 rounded-xl font-bold hover:bg-blue-50 transition shadow-lg flex justify-center items-center"
                        >
                            <Search className="mr-2" size={20} /> Consultar
                        </button>
                    </form>
                ) : (
                    <div className="bg-white rounded-xl p-6 shadow-lg animate-fade-in">
                        <h3 className="text-xl font-bold text-gray-800 mb-2">{statusData.nome}</h3>

                        <div className="flex items-center mb-4">
                            <span className="text-gray-600 mr-2">Status:</span>
                            {statusData.status === 'concluido' ? (
                                <span className="flex items-center text-green-600 font-bold">
                                    <CheckCircle size={18} className="mr-1" /> Aprovado
                                </span>
                            ) : statusData.status === 'rejeitado' ? (
                                <span className="flex items-center text-red-600 font-bold">
                                    <XCircle size={18} className="mr-1" /> Rejeitado
                                </span>
                            ) : (
                                <span className="flex items-center text-yellow-600 font-bold">
                                    <AlertCircle size={18} className="mr-1" /> Em Análise
                                </span>
                            )}
                        </div>

                        {statusData.observacoes && (
                            <div className="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-100">
                                <p className="text-xs text-gray-500 uppercase font-bold mb-1">Observações do Admin:</p>
                                <p className="text-gray-700">{statusData.observacoes}</p>
                            </div>
                        )}

                        {statusData.status === 'concluido' && (
                            <div className="text-center">
                                <p className="text-sm text-gray-600 mb-4">
                                    Sua conta foi criada! Verifique seu email para obter a senha temporária.
                                </p>
                                <Link to="/login" className="block w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition">
                                    Ir para Login
                                </Link>
                            </div>
                        )}

                        {statusData.status === 'rejeitado' && (
                            <div className="mt-8 animate-fade-in-up">
                                <div className="text-center mb-6">
                                    <p className="text-sm text-gray-600 mb-2">
                                        Sua solicitação precisa de atenção. Converse com nosso suporte abaixo.
                                    </p>
                                </div>

                                {/* Puts Chat in a "darker" container context if needed, or just let it float */}
                                <div className="bg-gray-900 rounded-3xl p-1 shadow-inner overflow-hidden">
                                    <ChatComponent filiacaoId={statusData.id} cpf={cpf} />
                                </div>

                                <div className="mt-6 text-center">
                                    <p className="text-xs text-gray-400 mb-2">Após alinhar com o suporte:</p>
                                    <Link to="/register" className="inline-block px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium text-sm">
                                        Enviar Nova Solicitação
                                    </Link>
                                </div>
                            </div>
                        )}

                        <button
                            onClick={() => setStatusData(null)}
                            className="mt-4 text-sm text-gray-500 hover:text-gray-700 underline w-full text-center"
                        >
                            Nova Consulta
                        </button>
                    </div>
                )}

                <div className="mt-8 text-center">
                    <Link to="/login" className="text-blue-200 hover:text-white flex items-center justify-center transition">
                        <ArrowLeft size={16} className="mr-2" /> Voltar para Login
                    </Link>
                </div>
            </div>
        </div>
    );
};

export default CheckStatus;
