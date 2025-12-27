import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, ArrowLeft, AlertCircle, CheckCircle, XCircle, MessageSquare, X } from 'lucide-react';
import api from '../../api';
import { maskCPF } from '../../utils/masks';
import Loading from '../../components/Loading';
import ChatComponent from '../../components/ChatComponent';

const CheckStatus = () => {
    const [cpf, setCpf] = useState('');
    const [statusData, setStatusData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(false);

    const handleCheck = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');
        setStatusData(null);
        setIsChatOpen(false);

        try {
            const response = await api.post('/affiliations/status', { cpf });
            setStatusData(response.data);
            // If there are messages and status is rejected/analysis, user might want to see them
        } catch (err) {
            setError(err.response?.data?.error || 'Erro ao consultar status');
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setCpf(maskCPF(e.target.value));
    };

    const toggleChat = () => {
        if (statusData) {
            setIsChatOpen(!isChatOpen);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-600 to-purple-700 px-4 py-12 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute top-10 left-10 w-64 h-64 bg-white/5 rounded-full blur-3xl"></div>
                <div className="absolute bottom-10 right-10 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl"></div>
            </div>

            {loading && <Loading message="Consultando base de dados..." />}

            {/* Main Container - Larger Size */}
            <div className={`transition-all duration-500 ease-in-out relative z-10 w-full ${statusData ? 'max-w-4xl' : 'max-w-md'}`}>

                <div className="bg-white/10 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col md:flex-row min-h-[500px]">

                    {/* Left Panel: Content */}
                    <div className={`flex-1 p-8 md:p-10 flex flex-col ${isChatOpen ? 'md:w-1/2' : 'w-full'} transition-all duration-300`}>
                        <div className="text-center mb-10">
                            <h1 className="text-3xl md:text-4xl font-bold text-white mb-2 tracking-tight">CERNE System</h1>
                            <p className="text-blue-100 font-medium tracking-wide text-sm uppercase opacity-80">Portal de Transparência</p>
                        </div>

                        {!statusData ? (
                            <div className="flex-1 flex flex-col justify-center">
                                <form onSubmit={handleCheck} className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="block text-sm font-semibold text-blue-50 ml-1">Informe seu CPF</label>
                                        <div className="relative group">
                                            <input
                                                type="text"
                                                value={cpf}
                                                onChange={handleChange}
                                                className="w-full p-4 pl-5 bg-black/20 border border-white/10 rounded-xl text-white placeholder-white/30 focus:ring-2 focus:ring-blue-400 focus:bg-black/30 outline-none transition-all font-mono text-lg tracking-wider"
                                                placeholder="000.000.000-00"
                                                required
                                            />
                                            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-400/20 to-purple-400/20 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"></div>
                                        </div>
                                    </div>
                                    <button
                                        type="submit"
                                        className="w-full bg-white text-blue-900 py-4 rounded-xl font-bold hover:bg-blue-50 hover:scale-[1.02] active:scale-[0.98] transition-all shadow-lg shadow-black/10 flex justify-center items-center text-lg"
                                    >
                                        <Search className="mr-2" size={22} /> Consultar Situação
                                    </button>
                                </form>
                                <div className="mt-8 text-center">
                                    <Link to="/login" className="text-blue-200 hover:text-white flex items-center justify-center transition-colors text-sm font-medium">
                                        <ArrowLeft size={16} className="mr-2" /> Voltar para o Login
                                    </Link>
                                </div>
                            </div>
                        ) : (
                            <div className="flex-1 flex flex-col animate-fade-in relative">
                                {/* Result Header with Chat Toggle */}
                                <div className="flex justify-between items-start mb-6">
                                    <div>
                                        <h2 className="text-2xl font-bold text-white mb-1">{statusData.nome}</h2>
                                        <p className="text-blue-200 text-sm">Atualizado recentemente</p>
                                    </div>

                                    {/* Chat Icon Logic */}
                                    <div className="relative group">
                                        <button
                                            onClick={toggleChat}
                                            className={`p-3 rounded-full transition-all duration-300 ${isChatOpen
                                                ? 'bg-white text-blue-600 shadow-glow'
                                                : statusData.message_count > 0
                                                    ? 'bg-white/20 text-white hover:bg-white/30 animate-pulse-slow'
                                                    : 'bg-black/10 text-gray-400 cursor-not-allowed'
                                                }`}
                                            disabled={statusData.message_count === 0}
                                            title={statusData.message_count > 0 ? `${statusData.message_count} mensagens` : "Nenhuma mensagem"}
                                        >
                                            <MessageSquare size={24} />
                                            {statusData.message_count > 0 && !isChatOpen && (
                                                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] w-5 h-5 flex items-center justify-center rounded-full border-2 border-blue-600 font-bold">
                                                    {statusData.message_count}
                                                </span>
                                            )}
                                            {statusData.message_count === 0 && (
                                                <div className="absolute bottom-0 right-0 bg-gray-500 rounded-full p-[2px] border border-blue-900">
                                                    <X size={10} className="text-white" />
                                                </div>
                                            )}
                                        </button>

                                        {/* Tooltip on Hover */}
                                        <div className="absolute -bottom-10 right-0 w-max opacity-0 group-hover:opacity-100 transition-opacity bg-black/80 text-white text-xs px-2 py-1 rounded pointer-events-none">
                                            {statusData.message_count > 0 ? 'Abrir conversa' : 'Nenhuma mensagem recebida'}
                                        </div>
                                    </div>
                                </div>

                                {/* Status Card */}
                                <div className="bg-white/95 backdrop-blur-md rounded-2xl p-6 shadow-xl mb-6 transform transition-all hover:shadow-2xl">
                                    <div className="flex items-center justify-between mb-4 border-b border-gray-100 pb-4">
                                        <span className="text-gray-500 font-medium uppercase text-xs tracking-wider">Situação Atual</span>
                                        {statusData.status === 'concluido' ? (
                                            <span className="flex items-center text-green-600 font-bold bg-green-50 px-3 py-1 rounded-full text-sm border border-green-100">
                                                <CheckCircle size={16} className="mr-1.5" /> Aprovado
                                            </span>
                                        ) : statusData.status === 'rejeitado' ? (
                                            <span className="flex items-center text-red-600 font-bold bg-red-50 px-3 py-1 rounded-full text-sm border border-red-100">
                                                <XCircle size={16} className="mr-1.5" /> Rejeitado
                                            </span>
                                        ) : (
                                            <span className="flex items-center text-yellow-600 font-bold bg-yellow-50 px-3 py-1 rounded-full text-sm border border-yellow-100">
                                                <AlertCircle size={16} className="mr-1.5" /> Em Análise
                                            </span>
                                        )}
                                    </div>

                                    <div className="text-gray-800">
                                        {statusData.observacoes ? (
                                            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                                                <p className="text-xs text-blue-500 font-bold mb-1 uppercase">Feedback da Auditoria</p>
                                                <p className="text-gray-700 leading-relaxed text-sm">{statusData.observacoes}</p>
                                            </div>
                                        ) : (
                                            <p className="text-gray-500 italic text-sm text-center py-2">Nenhuma observação registrada até o momento.</p>
                                        )}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-auto space-y-4">
                                    {statusData.status === 'concluido' && (
                                        <div className="space-y-3">
                                            <p className="text-center text-white/80 text-sm">
                                                Seu acesso foi liberado. Verifique seu email para a senha temporária.
                                            </p>
                                            <Link to="/login" className="block w-full bg-white text-blue-900 py-3 rounded-xl font-bold text-center hover:bg-blue-50 transition shadow-lg">
                                                Acessar Área do Membro
                                            </Link>
                                        </div>
                                    )}

                                    {statusData.status === 'rejeitado' && (
                                        <div className="space-y-3">
                                            <Link to="/register" className="block w-full bg-white/20 text-white py-3 rounded-xl font-bold text-center hover:bg-white/30 border border-white/30 transition backdrop-blur-md">
                                                Corrigir e Reenviar
                                            </Link>
                                        </div>
                                    )}

                                    <button
                                        onClick={() => { setStatusData(null); setIsChatOpen(false); }}
                                        className="w-full text-blue-200 hover:text-white py-2 text-sm transition-colors"
                                    >
                                        Realizar Nova Consulta
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Right Panel: Mini Chat Drawer */}
                    <div className={`bg-white transition-all duration-500 ease-in-out border-l border-gray-200 flex flex-col ${isChatOpen ? 'w-full md:w-[400px] opacity-100' : 'w-0 opacity-0 overflow-hidden'}`}>
                        {statusData && isChatOpen && (
                            <>
                                <div className="p-4 bg-gray-50 border-b border-gray-200 flex justify-between items-center shadow-sm">
                                    <div>
                                        <h3 className="font-bold text-gray-800">Suporte Online</h3>
                                        <p className="text-xs text-gray-500">Protocolo: #{String(statusData.id).slice(0, 8)}</p>
                                    </div>
                                    <button onClick={() => setIsChatOpen(false)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
                                        <X size={20} className="text-gray-500" />
                                    </button>
                                </div>
                                <div className="flex-1 overflow-hidden bg-gray-100">
                                    <ChatComponent filiacaoId={statusData.id} cpf={cpf} />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CheckStatus;
