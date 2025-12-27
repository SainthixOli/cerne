import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../api';
import { Send, User, Clock, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

const ChatManager = ({ role }) => {
    const [conversations, setConversations] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [viewMode, setViewMode] = useState('personal'); // 'personal' or 'all'
    const location = useLocation();

    // Get real user role from storage, not just route context
    const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
    const userRole = currentUser.role || role; // Fallback to prop if missing

    // Audio ref for notifications
    const notificationSound = useRef(null);

    useEffect(() => {
        notificationSound.current = new Audio("data:audio/mp3;base64,//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7cQBMNJjoDbET4QOgle43PMhq8zgqszoq1yskdsGTvPHaryz+5EcRcDlEhMgrGO8xv//7kt/lDcUQ7hE0cibIAbp5pBEAv8AAP/7kQAA//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7cQBMNJjoDbET4QOgle43PMhq8zgqszoq1yskdsGTvPHaryz+5EcRcDlEhMgrGO8xv//7kt/lDcUQ7hE0cibIAbp5pBEAv8AAP/7kQAA//uQRAAAAWMSLwUIYAAsYkXgoQwAEaYLWfkWgAI0wWs/ItAAAGDgYtAgAyN+QWaAAihwMWm4G8QQRDiMcCBcH3Cc+CDv/7cQBMNJjoDbET4QOgle43PMhq8zgqszoq1yskdsGTvPHaryz+5EcRcDlEhMgrGO8xv//7kt/lDcUQ7hE0cibIAbp5pBEAv8AAP/7kQAA");
        notificationSound.current.volume = 0.5;
    }, []);

    // Initial Load & Handle Redirect
    useEffect(() => {
        const init = async () => {
            console.log('ChatManager Init. State:', location.state);
            // Always fetch list first
            await fetchConversations(true);

            // Check for redirect state
            if (location.state?.startChatWith) {
                console.log('Found startChatWith:', location.state.startChatWith);
                const { startChatWith } = location.state;
                handleStartChat(startChatWith);

                // Optional: Clear state to prevent re-triggering if simply refreshing? 
                // React Router state persists on refresh, but we might want to be careful.
                // For now, idempotent handleStartChat is fine.
            }
        };
        init();
    }, [location, viewMode]); // Added location dependency

    const handleStartChat = async (userId) => {
        try {
            // Force personal mode when starting a chat
            if (viewMode === 'all') setViewMode('personal');

            // Updated to be silent as requested
            const res = await api.post('/chat/start', { userId }, { silent: true });
            const conversation = res.data;

            // Refetch list to ensure we have the latest state including the new chat
            const listRes = await api.get('/chat/conversations', { silent: true });
            setConversations(listRes.data);

            // Find and select
            const target = listRes.data.find(c => c.id === conversation.id) || conversation;
            setSelectedChat(target);
        } catch (error) {
            console.error(error);
            toast.error('Erro ao iniciar conversa');
        }
    };

    // Polling for messages
    useEffect(() => {
        if (selectedChat) {
            fetchMessages(selectedChat.id, true); // Initial load ALSO SILENT
            const interval = setInterval(() => fetchMessages(selectedChat.id, true), 3000); // Silent poll
            return () => clearInterval(interval);
        }
    }, [selectedChat]);

    // Polling for conversations list
    useEffect(() => {
        const interval = setInterval(() => fetchConversations(true), 10000);
        return () => clearInterval(interval);
    }, [viewMode]);

    // Scroll handling
    const messagesContainerRef = useRef(null);

    useEffect(() => {
        if (messages.length > 0) {
            scrollToBottom();
        }
    }, [messages.length, selectedChat?.id]);

    const scrollToBottom = () => {
        if (messagesContainerRef.current) {
            const { scrollHeight, clientHeight } = messagesContainerRef.current;
            messagesContainerRef.current.scrollTo({
                top: scrollHeight - clientHeight,
                behavior: 'smooth'
            });
        }
    };

    const fetchConversations = async (silent = false) => {
        try {
            const params = {};
            if (viewMode === 'all') params.mode = 'all';

            const res = await api.get('/chat/conversations', { params, silent });
            setConversations(res.data);
        } catch (error) {
            console.error('Error fetching conversations:', error);
        }
    };

    const fetchMessages = async (chatId, silent = false) => {
        try {
            const res = await api.get(`/chat/${chatId}/messages`, { silent });
            setMessages(res.data);
        } catch (error) {
            console.error('Error fetching messages:', error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedChat) return;

        try {
            await api.post(`/chat/${selectedChat.id}/messages`, {
                content: newMessage
            }, { silent: true });
            setNewMessage('');
            fetchMessages(selectedChat.id, true);
            fetchConversations(true); // Update last message in list
        } catch (error) {
            console.error(error);
            toast.error('Erro ao enviar mensagem');
        }
    };

    const handleStartSupportChat = async () => {
        try {
            const res = await api.get('/chat/admins', { silent: true });
            const admins = res.data;
            if (admins.length === 0) {
                toast.error('Nenhum atendente disponível no momento.');
                return;
            }
            // Start with first available
            handleStartChat(admins[0].id);
            toast.success(`Iniciando atendimento...`);
        } catch (e) {
            console.error(e);
            toast.error('Erro ao buscar atendentes.');
        }
    };

    const getMessageOpacity = () => 'opacity-100';

    // Determinar se é Read Only (Modo Espectador do Super Admin)
    const isSpectator = viewMode === 'all' && userRole === 'super_admin';

    // Helper to get user info locally
    // const currentUser = JSON.parse(localStorage.getItem('user') || '{}'); // Moved to top

    return (
        // Changed outer height to simple h-full if parent controls it, or keep calc but ensure overflow hidden
        <div className="flex h-[calc(100vh-140px)] bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-100 dark:border-gray-700 overflow-hidden relative isolate z-0">
            {/* Sidebar List - Fixed Width, Full Height, Internal Scroll */}
            <div className="w-1/3 border-r dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex flex-col h-full shrink-0">
                <div className="p-4 border-b dark:border-gray-700 bg-white dark:bg-gray-800 shrink-0">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-bold text-gray-700 dark:text-gray-200">Conversas</h2>
                        {userRole !== 'admin' && userRole !== 'super_admin' && (
                            <button
                                onClick={handleStartSupportChat}
                                className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-full hover:bg-blue-700 transition shadow-sm font-medium"
                            >
                                + Suporte
                            </button>
                        )}
                    </div>

                    {/* Super Admin Tabs */}
                    {userRole === 'super_admin' && (
                        <div className="flex bg-gray-100 dark:bg-gray-700 p-1 rounded-lg mb-2">
                            <button
                                onClick={() => { setViewMode('personal'); setSelectedChat(null); }}
                                className={`flex-1 text-xs font-bold py-1.5 rounded-md transition ${viewMode === 'personal' ? 'bg-white dark:bg-gray-600 shadow-sm text-blue-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                            >
                                Meus Chats (Privado)
                            </button>
                            <button
                                onClick={() => { setViewMode('all'); setSelectedChat(null); }}
                                className={`flex-1 text-xs font-bold py-1.5 rounded-md transition ${viewMode === 'all' ? 'bg-white dark:bg-gray-600 shadow-sm text-purple-600 dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                            >
                                Monitorar (Todos)
                            </button>
                        </div>
                    )}
                    <button
                        onClick={async () => {
                            const email = prompt("Digite o email do usuário para iniciar conversa:");
                            if (email) {
                                try {
                                    // Logic handled by backend search usually, here relying on prompt MVP
                                    toast.success('Buscando usuário...');
                                } catch (e) { }
                            }
                        }}
                        className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition hidden"
                    >
                    </button>
                    {(userRole === 'admin' || userRole === 'super_admin') && (
                        <div className="text-xs text-blue-500 font-bold px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                            Admin
                        </div>
                    )}
                </div>
                <div className="overflow-y-auto flex-1 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700">
                    {conversations.length === 0 ? (
                        <div className="p-8 text-center flex flex-col items-center justify-center h-full">
                            <p className="text-gray-500 text-sm mb-4">Nenhuma conversa encontrada.</p>
                            {(userRole === 'admin' || userRole === 'super_admin') && viewMode === 'personal' && (
                                <p className="text-xs text-gray-400">
                                    Vá em <b>Filiados</b> ou <b>Colaboradores</b> e clique no ícone de mensagem para iniciar uma conversa.
                                </p>
                            )}
                        </div>
                    ) : (
                        conversations.map(chat => (
                            <div
                                key={chat.id}
                                onClick={() => setSelectedChat(chat)}
                                className={`p-4 cursor-pointer hover:bg-white dark:hover:bg-gray-700 transition border-b dark:border-gray-700 ${selectedChat?.id === chat.id ? 'bg-white dark:bg-gray-700 border-l-4 border-l-blue-500' : ''}`}
                            >
                                <div className="flex justify-between items-start">
                                    <div className="overflow-hidden">
                                        <h3 className="font-medium text-gray-900 dark:text-white truncate">
                                            {isSpectator && chat.admin_name ? `${chat.peer_name} (com ${chat.admin_name})` : chat.peer_name || 'Usuário'}
                                        </h3>
                                        {isSpectator && (
                                            <span className="text-[10px] bg-purple-100 text-purple-600 px-1.5 rounded uppercase font-bold tracking-wider">Monitorando</span>
                                        )}
                                    </div>
                                    <span className="text-[10px] text-gray-400 whitespace-nowrap ml-2">
                                        {new Date(chat.last_updated).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-1">
                                    {chat.last_message || 'Inicie a conversa...'}
                                </p>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Chat Window - Flex Col, Internal Scroll */}
            <div className="w-2/3 flex flex-col h-full bg-[#fafafa] dark:bg-gray-900 relative">
                {selectedChat ? (
                    <>
                        {/* Header - Fixed Height */}
                        <div className={`p-4 ${isSpectator ? 'bg-purple-50 dark:bg-purple-900/10' : 'bg-white dark:bg-gray-800'} border-b dark:border-gray-700 flex justify-between items-center shadow-sm z-10 shrink-0 h-20`}>
                            <div className="flex items-center">
                                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-300 font-bold mr-3 shadow-sm">
                                    {(selectedChat.peer_name || 'U')[0]}
                                </div>
                                <div>
                                    <h3 className="font-bold text-gray-800 dark:text-white text-base">{selectedChat.peer_name}</h3>
                                    {isSpectator ? (
                                        <p className="text-xs text-purple-600 font-bold flex items-center">
                                            <User size={12} className="mr-1" /> Modo Espectador (Apenas Leitura)
                                        </p>
                                    ) : (
                                        <p className="text-xs text-green-500 flex items-center font-medium">
                                            <span className="block w-2 h-2 bg-green-500 rounded-full mr-1 animate-pulse"></span> Online
                                        </p>
                                    )}
                                </div>
                            </div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center bg-gray-100 dark:bg-gray-800 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700">
                                <Clock size={12} className="mr-1" /> Expira em 7 dias
                            </div>
                        </div>

                        {/* Messages - Scrollable Area */}
                        <div
                            ref={messagesContainerRef}
                            className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-gray-700 scroll-smooth"
                        >
                            {Array.isArray(messages) && messages.map((msg) => {
                                const isMe = msg.sender_id === currentUser.id;

                                // In spectator mode, 'isMe' is only true if I actually sent it (e.g. if I am also the admin handling it, or if I sent it in my own chat loop). 
                                // Ideally, in spectator mode, we might want to differentiate Admin vs User clearly if neither is 'me'.
                                // For now, standard logic works: if I didn't send it, it's on left.

                                return (
                                    <div key={msg.id} className={`flex flex-col ${getMessageOpacity(msg.created_at)}`}>
                                        <div className={`p-3 px-4 rounded-2xl max-w-[70%] text-sm shadow-sm relative group ${isMe
                                            ? 'bg-blue-600 text-white self-end rounded-tr-none'
                                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 self-start rounded-tl-none border border-gray-100 dark:border-gray-700'
                                            }`}>
                                            {!isMe && <p className="font-bold text-[10px] text-blue-600 dark:text-blue-400 mb-1 uppercase tracking-wider">{msg.sender_name}</p>}
                                            <p className="leading-relaxed">{msg.content}</p>
                                            <div className={`text-[10px] text-right mt-1 ${isMe ? 'text-blue-200' : 'text-gray-400'}`}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Input Area - Hidden if Spectator */}
                        {isSpectator ? (
                            <div className="p-4 bg-gray-50 dark:bg-gray-800/50 border-t dark:border-gray-700 shrink-0 text-center text-gray-500 text-sm font-medium">
                                Você está visualizando este chat como Administrador. <br /> A resposta está desabilitada para preservar a privacidade do atendimento.
                            </div>
                        ) : (
                            <form onSubmit={handleSendMessage} className="p-4 bg-white dark:bg-gray-800 border-t dark:border-gray-700 shrink-0">
                                <div className="flex gap-3">
                                    <input
                                        type="text"
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        placeholder="Digite sua mensagem..."
                                        className="flex-1 p-3.5 bg-gray-100 dark:bg-gray-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/50 dark:text-white transition placeholder-gray-400 dark:placeholder-gray-500 border border-transparent focus:border-blue-500 shadow-inner"
                                    />
                                    <button
                                        type="submit"
                                        disabled={!newMessage.trim()}
                                        className="p-3.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition transform active:scale-95 shadow-lg shadow-blue-600/20"
                                    >
                                        <Send size={20} />
                                    </button>
                                </div>
                            </form>
                        )}
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
                        <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 shadow-sm border border-gray-100 dark:border-gray-700">
                            <Send size={40} className="text-gray-300 dark:text-gray-600 ml-1" />
                        </div>
                        <h3 className="font-bold text-lg text-gray-800 dark:text-white mb-2">
                            {viewMode === 'all' ? 'Monitoramento de Chats' : 'Suas Conversas'}
                        </h3>
                        <p className="text-gray-500 text-sm max-w-xs text-center">Selecione uma conversa ao lado.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatManager;
