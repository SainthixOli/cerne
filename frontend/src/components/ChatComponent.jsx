import React, { useState, useEffect, useRef } from 'react';
import api from '../api';
import { toast } from 'react-hot-toast';
import { Send, User, Shield } from 'lucide-react';

const ChatComponent = ({ filiacaoId, cpf = null }) => {
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [loading, setLoading] = useState(true);
    const messagesEndRef = useRef(null);

    const loadMessages = () => {
        const headers = cpf ? { 'x-cpf': cpf } : {};
        api.get(`/affiliations/${filiacaoId}/chat`, { headers, silent: true })
            .then(res => {
                setMessages(res.data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                if (!cpf) toast.error('Erro ao carregar chat'); // Apenas alertar se não estiver consultando silenciosamente
                setLoading(false);
            });
    };

    useEffect(() => {
        loadMessages();
        const interval = setInterval(loadMessages, 3000); // Consultar a cada 3s para sensação de rapidez
        return () => clearInterval(interval);
    }, [filiacaoId, cpf]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const handleSend = async (e) => {
        e.preventDefault();
        if (!newMessage.trim()) return;

        try {
            const headers = cpf ? { 'x-cpf': cpf } : {};
            await api.post(`/affiliations/${filiacaoId}/chat`, { message: newMessage }, { headers, silent: true });
            setNewMessage('');
            loadMessages();
        } catch (error) {
            toast.error('Erro ao enviar mensagem.');
        }
    };

    if (loading && messages.length === 0) return <div className="p-4 text-center text-white/50 animate-pulse">Carregando conversa...</div>;

    return (
        <div className="flex flex-col h-[500px] w-full max-w-2xl mx-auto bg-white/10 dark:bg-black/40 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-3xl shadow-2xl overflow-hidden font-sans">
            {/* Header */}
            <div className="p-4 bg-white/5 border-b border-white/10 flex items-center justify-between backdrop-blur-md sticky top-0 z-10">
                <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center p-[2px]">
                        <div className="w-full h-full rounded-full bg-black/50 flex items-center justify-center text-white font-bold text-xs">
                            <Shield size={16} />
                        </div>
                    </div>
                    <div>
                        <h3 className="font-bold text-white text-sm">Suporte & Filação</h3>
                        <div className="flex items-center space-x-1">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
                            <span className="text-xs text-blue-200/70">Online</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {messages.length === 0 && (
                    <div className="text-center mt-20 opacity-50 space-y-2">
                        <div className="text-4xl">👋</div>
                        <p className="text-white/60 text-sm">Nenhuma mensagem ainda.</p>
                        <p className="text-white/40 text-xs">Inicie a conversa abaixo.</p>
                    </div>
                )}

                {messages.map((msg, index) => {
                    const isAdmin = msg.sender_role === 'admin' || msg.sender_role === 'super_admin';

                    // "Me" logic: 
                    // Se forneci um CPF (visualização pública), "Eu" é o Usuário (papel do remetente != admin).
                    // Se não forneci CPF (visualização admin ou usuário logado), confiamos no contexto.
                    // Heurística: Se a prop cpf for passada, o visualizador é USUÁRIO.
                    // Se não for passada, assumimos que o visualizador é Usuário Logado OU Admin.
                    // Vamos usar o localStorage para verificar o papel se o cpf for nulo.

                    let isMe = false;
                    if (cpf) {
                        // Acesso Público: Eu sou Usuário. Então, se a msg NÃO for admin, sou eu.
                        isMe = !isAdmin;
                    } else {
                        // Acesso Logado
                        const user = JSON.parse(localStorage.getItem('user') || '{}');
                        const myId = user.id;
                        isMe = msg.sender_id === myId;
                    }

                    return (
                        <div key={msg.id} className={`flex w-full ${isMe ? 'justify-end' : 'justify-start'} animate-fade-in-up`}>
                            <div className={`flex max-w-[80%] ${isMe ? 'flex-row-reverse' : 'flex-row'} items-end gap-2`}>
                                {/* Avatar */}
                                <div className={`w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold text-white shadow-lg 
                                    ${isAdmin ? 'bg-gradient-to-br from-gray-700 to-gray-900' : 'bg-gradient-to-br from-blue-500 to-indigo-600'}`}>
                                    {isAdmin ? 'A' : 'U'}
                                </div>

                                {/* Bubble */}
                                <div className={`px-4 py-3 rounded-2xl shadow-sm text-sm leading-relaxed relative group transition-all duration-200 hover:scale-[1.01] 
                                    ${isMe
                                        ? 'bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-br-none'
                                        : 'bg-white/10 text-gray-100 backdrop-blur-sm border border-white/10 rounded-bl-none'
                                    }`}>
                                    {!isMe && <p className="text-[10px] font-bold opacity-50 mb-1 uppercase tracking-wider">{msg.sender_name}</p>}
                                    {msg.message}
                                    <span className="text-[10px] opacity-40 ml-2 inline-block translate-y-0.5">
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </span>
                                </div>
                            </div>
                        </div>
                    );
                })}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-white/5 border-t border-white/10 backdrop-blur-md">
                <div className="relative flex items-center gap-2">
                    <input
                        type="text"
                        className="w-full bg-black/20 text-white placeholder-white/30 border border-white/10 rounded-full py-3 px-5 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent transition-all shadow-inner"
                        placeholder="Digite sua mensagem..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                    />
                    <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className="p-3 bg-blue-600 hover:bg-blue-500 text-white rounded-full shadow-lg shadow-blue-600/20 transform hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                    >
                        <Send size={18} />
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ChatComponent;
