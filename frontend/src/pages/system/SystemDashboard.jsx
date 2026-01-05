import React, { useEffect, useState } from 'react';
import { Server, Database, HardDrive, Activity, Users, FileText, AlertTriangle, BookOpen, Terminal, Power, RefreshCw, Trash2, X, Cpu, Layers, Shield } from 'lucide-react';
import api from '../../api';
import { useNavigate } from 'react-router-dom';

const SystemDashboard = () => {
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [command, setCommand] = useState('');
    const [consoleHistory, setConsoleHistory] = useState([]);
    const [healthLogs, setHealthLogs] = useState([]);
    const [showManual, setShowManual] = useState(false);
    const navigate = useNavigate();

    const handleCommand = async (e) => {
        if (e.key === 'Enter') {
            const cmd = command.trim();
            if (!cmd) return;

            const newHistory = [...consoleHistory, { type: 'input', content: cmd }];
            setConsoleHistory(newHistory);
            setCommand('');

            if (cmd.toLowerCase() === 'clear') {
                setConsoleHistory([]);
                return;
            }

            try {
                const res = await api.post('/system/console', { command: cmd });
                setConsoleHistory([...newHistory, { type: 'output', content: res.data.output }]);
            } catch (error) {
                setConsoleHistory([...newHistory, { type: 'output', content: 'Error executing command.' }]);
            }
        }
    };

    const runQuickCommand = async (cmd) => {
        setCommand(cmd);
        const newHistory = [...consoleHistory, { type: 'input', content: cmd }];
        setConsoleHistory(newHistory);
        try {
            const res = await api.post('/system/console', { command: cmd });
            setConsoleHistory([...newHistory, { type: 'output', content: res.data.output }]);
        } catch (error) {
            setConsoleHistory([...newHistory, { type: 'output', content: 'Error executing command.' }]);
        }
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const res = await api.get('/system/stats');
                setStats(res.data);
            } catch (error) {
                console.error(error);
                // alert('Erro ao carregar status do sistema'); // Remove alert to avoid spam
            } finally {
                setLoading(false);
            }
        };

        const checkHealth = async () => {
            try {
                const start = Date.now();
                const res = await api.get('/health');
                const latency = Date.now() - start;
                const timestamp = new Date().toLocaleTimeString();

                const log = {
                    time: timestamp,
                    status: res.data.status,
                    latency: `${latency}ms`,
                    uptime: `${Math.floor(res.data.uptime)}s`,
                    type: 'success'
                };

                setHealthLogs(prev => [log, ...prev].slice(0, 50)); // Keep last 50 logs
            } catch (error) {
                const timestamp = new Date().toLocaleTimeString();
                const log = {
                    time: timestamp,
                    status: 'DOWN',
                    latency: '-',
                    uptime: '-',
                    type: 'error'
                };
                setHealthLogs(prev => [log, ...prev].slice(0, 50));
            }
        };

        fetchStats();
        checkHealth();

        // Poll stats every 30s
        const statsInterval = setInterval(fetchStats, 30000);
        // Poll health every 5s for "Matrix" feel
        const healthInterval = setInterval(checkHealth, 5000);

        return () => {
            clearInterval(statsInterval);
            clearInterval(healthInterval);
        };
    }, []);

    const logout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        navigate('/login');
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center mesh-gradient-bg text-white">
            <div className="glass p-8 rounded-2xl flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-bold text-lg">Inicializando Sistema...</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen mesh-gradient-bg text-gray-100 p-8 font-sans transition-colors duration-500 relative">
            <header className="flex justify-between items-center mb-12 glass p-6 rounded-2xl sticky top-4 z-20">
                <div className="flex items-center">
                    <div className="p-3 bg-gray-900/50 rounded-xl mr-4 border border-white/10">
                        <Activity className="text-green-400 animate-pulse" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-white tracking-tight">SYSTEM MONITOR</h1>
                        <p className="text-gray-400 text-sm font-medium">Infraestrutura e Recursos</p>
                    </div>
                </div>
                <button onClick={logout} className="px-6 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl transition flex items-center font-bold">
                    <Power size={18} className="mr-2" /> LOGOUT
                </button>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                {/* Storage Card */}
                <div className="glass-panel p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <h2 className="text-xl font-bold text-blue-300 mb-6 flex items-center relative z-10">
                        <HardDrive className="mr-3" /> ARMAZENAMENTO
                    </h2>
                    <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                            <span className="text-gray-400 text-sm">Database (SQLite)</span>
                            <span className="font-mono font-bold text-white">{stats?.storage.database}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                            <span className="text-gray-400 text-sm">Uploads (Docs)</span>
                            <span className="font-mono font-bold text-white">{stats?.storage.uploads}</span>
                        </div>
                        <div className="h-px bg-gradient-to-r from-transparent via-white/20 to-transparent my-4"></div>
                        <div className="flex justify-between text-lg items-center">
                            <span className="text-gray-300 font-medium">Total Usado</span>
                            <span className="font-bold text-green-400 font-mono">{stats?.storage.total}</span>
                        </div>
                    </div>
                </div>

                {/* Performance Card */}
                <div className="glass-panel p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <h2 className="text-xl font-bold text-purple-300 mb-6 flex items-center relative z-10">
                        <Server className="mr-3" /> PERFORMANCE
                    </h2>
                    <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                            <span className="text-gray-400 text-sm">Memória RAM</span>
                            <span className="font-mono font-bold text-white">{stats?.performance.memory}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                            <span className="text-gray-400 text-sm">Uptime</span>
                            <span className="font-mono font-bold text-white">{stats?.performance.uptime}</span>
                        </div>
                        <div className="flex justify-between items-center p-3 bg-white/5 rounded-lg border border-white/5">
                            <span className="text-gray-400 text-sm">Carga CPU</span>
                            <span className={`font-mono font-bold ${parseFloat(stats?.performance.cpuLoad) > 80 ? 'text-red-400' : 'text-green-400'}`}>
                                {stats?.performance.cpuLoad}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Database Stats Card */}
                <div className="glass-panel p-6 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/20 rounded-full blur-2xl -mr-10 -mt-10"></div>
                    <h2 className="text-xl font-bold text-orange-300 mb-6 flex items-center relative z-10">
                        <Database className="mr-3" /> DADOS
                    </h2>
                    <div className="space-y-4 relative z-10">
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 flex items-center text-sm"><Users size={16} className="mr-2" /> Usuários</span>
                            <span className="font-bold text-2xl text-white">{stats?.counts.users}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 flex items-center text-sm"><FileText size={16} className="mr-2" /> Filiações</span>
                            <span className="font-bold text-2xl text-white">{stats?.counts.affiliations}</span>
                        </div>
                        <div className="flex justify-between items-center">
                            <span className="text-gray-400 flex items-center text-sm"><FileText size={16} className="mr-2" /> Documentos</span>
                            <span className="font-bold text-2xl text-white">{stats?.counts.documents}</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* System Console */}
                <div className="glass-panel p-1 border border-white/10 shadow-2xl bg-black/40 backdrop-blur-xl">
                    <div className="bg-gray-900/80 rounded-t-xl p-3 flex items-center justify-between border-b border-white/5">
                        <div className="flex items-center space-x-2">
                            <Terminal size={16} className="text-gray-400" />
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">System Console</span>
                        </div>
                        <div className="flex space-x-1.5">
                            <div className="w-3 h-3 rounded-full bg-red-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-yellow-500/50"></div>
                            <div className="w-3 h-3 rounded-full bg-green-500/50"></div>
                        </div>
                    </div>
                    <div className="bg-black/90 p-6 rounded-b-xl font-mono text-sm h-80 overflow-y-auto custom-scrollbar" onClick={() => document.getElementById('console-input').focus()}>
                        <div className="text-gray-500 mb-2">CERNE System Console [v1.0.0]</div>
                        <div className="text-gray-500 mb-6">Type 'help' for available commands.</div>

                        {consoleHistory.map((line, i) => (
                            <div key={i} className="whitespace-pre-wrap mb-2 animate-fade-in">
                                {line.type === 'input' ? (
                                    <div className="flex">
                                        <span className="text-green-500 font-bold mr-2">➜</span>
                                        <span className="text-white font-bold">{line.content}</span>
                                    </div>
                                ) : (
                                    <div className="text-gray-300 pl-6 border-l-2 border-gray-800 ml-1">{line.content}</div>
                                )}
                            </div>
                        ))}

                        <div className="flex items-center mt-4">
                            <span className="text-green-500 font-bold mr-2 animate-pulse">➜</span>
                            <input
                                id="console-input"
                                type="text"
                                value={command}
                                onChange={(e) => setCommand(e.target.value)}
                                onKeyDown={handleCommand}
                                className="bg-transparent border-none outline-none text-white w-full placeholder-gray-700"
                                placeholder="Aguardando comando..."
                                autoComplete="off"
                            />
                        </div>
                    </div>
                </div>

                {/* Health Monitor */}
                <div className="glass-panel p-1 border border-white/10 shadow-2xl bg-black/40 backdrop-blur-xl">
                    <div className="bg-gray-900/80 rounded-t-xl p-3 flex items-center justify-between border-b border-white/5">
                        <div className="flex items-center space-x-2">
                            <Activity size={16} className="text-blue-400 animate-pulse" />
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Health Monitor (Real-time)</span>
                        </div>
                        <div className="flex space-x-1.5">
                            <div className="w-2 h-2 rounded-full bg-blue-500/50 animate-ping"></div>
                        </div>
                    </div>
                    <div className="bg-black/95 p-4 rounded-b-xl font-mono text-xs h-80 overflow-y-auto custom-scrollbar">
                        <div className="grid grid-cols-4 gap-4 mb-2 text-gray-500 border-b border-white/5 pb-2 uppercase tracking-wide">
                            <div>Timestamp</div>
                            <div>Status</div>
                            <div>Latency</div>
                            <div>Uptime</div>
                        </div>
                        <div className="space-y-1">
                            {healthLogs.map((log, i) => (
                                <div key={i} className={`grid grid-cols-4 gap-4 ${log.type === 'success' ? 'text-green-400/80' : 'text-red-400/80'} hover:bg-white/5 p-1 rounded transition`}>
                                    <div className="text-gray-500">{log.time}</div>
                                    <div className="font-bold">{log.status}</div>
                                    <div>{log.latency}</div>
                                    <div>{log.uptime}</div>
                                </div>
                            ))}
                            {healthLogs.length === 0 && <div className="text-gray-600 italic">Initializing stream...</div>}
                        </div>
                    </div>
                </div>
            </div>

            {/* Maintenance Tools */}
            <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="glass-panel p-6 border border-red-500/20">
                    <h3 className="text-red-400 font-bold mb-6 flex items-center text-lg">
                        <AlertTriangle className="mr-2" /> Ferramentas de Manutenção
                    </h3>
                    <div className="flex space-x-4">
                        <button
                            onClick={() => runQuickCommand('clear_cache')}
                            className="px-4 py-3 bg-gray-700/50 hover:bg-gray-600/50 text-white rounded-xl transition border border-white/10 flex items-center"
                        >
                            <Trash2 size={18} className="mr-2" /> Limpar Cache
                        </button>
                        <button
                            onClick={() => runQuickCommand('restart')}
                            className="px-4 py-3 bg-red-500/10 hover:bg-red-500/20 text-red-200 rounded-xl transition border border-red-500/30 flex items-center"
                        >
                            <RefreshCw size={18} className="mr-2" /> Reiniciar Serviços
                        </button>
                    </div>
                </div>

                <div className="glass-panel p-6 border border-blue-500/20">
                    <h3 className="text-blue-400 font-bold mb-6 flex items-center text-lg">
                        <BookOpen className="mr-2" /> Documentação
                    </h3>
                    <button
                        onClick={() => setShowManual(true)}
                        className="px-4 py-3 bg-blue-500/10 hover:bg-blue-500/20 text-blue-200 rounded-xl transition border border-blue-500/30 flex items-center"
                    >
                        <FileText size={18} className="mr-2" /> Ler Manual Técnico
                    </button>
                </div>
            </div>

            {/* Manual Modal */}
            {showManual && (
                <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
                    <div className="glass-panel max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col shadow-2xl border border-white/10">
                        <div className="p-6 border-b border-white/10 flex justify-between items-center bg-white/5">
                            <h2 className="text-2xl font-bold text-white flex items-center">
                                <BookOpen className="mr-3 text-blue-400" /> Manual Técnico do Sistema
                            </h2>
                            <button
                                onClick={() => setShowManual(false)}
                                className="p-2 hover:bg-white/10 rounded-full transition text-gray-400 hover:text-white"
                            >
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 overflow-y-auto custom-scrollbar space-y-8 text-gray-300">
                            {/* Architecture Section */}
                            <section>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                    <Layers className="mr-2 text-purple-400" /> Arquitetura do Sistema
                                </h3>
                                <div className="bg-black/30 p-6 rounded-xl border border-white/5">
                                    <p className="mb-4">
                                        O sistema utiliza uma arquitetura <strong>Monolítica Modular</strong> baseada em JavaScript (Node.js + React).
                                    </p>
                                    <ul className="list-disc pl-5 space-y-2 text-sm">
                                        <li><strong>Frontend:</strong> React.js com TailwindCSS para estilização e Axios para comunicação HTTP.</li>
                                        <li><strong>Backend:</strong> Node.js com Express.</li>
                                        <li><strong>Banco de Dados:</strong> SQLite (arquivo local `database.sqlite`) para persistência leve e rápida.</li>
                                        <li><strong>Autenticação:</strong> JWT (JSON Web Tokens) com controle de sessão stateless.</li>
                                    </ul>
                                </div>
                            </section>

                            {/* Directory Structure */}
                            <section>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                    <HardDrive className="mr-2 text-blue-400" /> Estrutura de Diretórios
                                </h3>
                                <div className="bg-black/30 p-6 rounded-xl border border-white/5 font-mono text-sm">
                                    <div className="mb-2"><span className="text-blue-400">/backend</span></div>
                                    <div className="pl-4 border-l border-gray-700 ml-2">
                                        <div>├── <span className="text-yellow-400">src/controllers</span> <span className="text-gray-500">// Lógica de negócios</span></div>
                                        <div>├── <span className="text-yellow-400">src/routes</span> <span className="text-gray-500">// Definição de endpoints API</span></div>
                                        <div>├── <span className="text-yellow-400">db/database.sqlite</span> <span className="text-gray-500">// Arquivo do banco de dados</span></div>
                                        <div>└── <span className="text-yellow-400">uploads/</span> <span className="text-gray-500">// Armazenamento de documentos</span></div>
                                    </div>
                                    <div className="mt-4 mb-2"><span className="text-blue-400">/frontend</span></div>
                                    <div className="pl-4 border-l border-gray-700 ml-2">
                                        <div>├── <span className="text-yellow-400">src/pages</span> <span className="text-gray-500">// Componentes de página</span></div>
                                        <div>├── <span className="text-yellow-400">src/components</span> <span className="text-gray-500">// Componentes reutilizáveis</span></div>
                                        <div>└── <span className="text-yellow-400">src/contexts</span> <span className="text-gray-500">// Gestão de estado global</span></div>
                                    </div>
                                </div>
                            </section>

                            {/* Maintenance */}
                            <section>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                    <Shield className="mr-2 text-green-400" /> Procedimentos de Manutenção
                                </h3>
                                <div className="grid md:grid-cols-2 gap-4">
                                    <div className="bg-black/30 p-5 rounded-xl border border-white/5">
                                        <h4 className="font-bold text-white mb-2">Backup do Banco de Dados</h4>
                                        <p className="text-sm mb-2">O banco SQLite é um arquivo único.</p>
                                        <code className="block bg-black/50 p-2 rounded text-xs text-green-400">cp backend/db/database.sqlite backup/db_$(date +%F).sqlite</code>
                                    </div>
                                    <div className="bg-black/30 p-5 rounded-xl border border-white/5">
                                        <h4 className="font-bold text-white mb-2">Limpeza de Logs/Cache</h4>
                                        <p className="text-sm mb-2">Use o botão "Limpar Cache" no painel para remover arquivos temporários da pasta `uploads/temp`.</p>
                                    </div>
                                </div>
                            </section>

                            {/* Troubleshooting */}
                            <section>
                                <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                                    <AlertTriangle className="mr-2 text-red-400" /> Troubleshooting
                                </h3>
                                <div className="bg-red-900/10 p-6 rounded-xl border border-red-500/20">
                                    <ul className="space-y-3 text-sm">
                                        <li className="flex items-start">
                                            <span className="font-bold text-red-400 mr-2 min-w-[80px]">Erro 500:</span>
                                            <span>Verifique os logs do servidor via terminal ou console do sistema. Geralmente indica falha na conexão com o banco ou erro de sintaxe.</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="font-bold text-red-400 mr-2 min-w-[80px]">Lentidão:</span>
                                            <span>Verifique a "Carga CPU" no painel. Se estiver acima de 90%, considere reiniciar o serviço ou verificar processos zumbis.</span>
                                        </li>
                                        <li className="flex items-start">
                                            <span className="font-bold text-red-400 mr-2 min-w-[80px]">Upload Falhou:</span>
                                            <span>Verifique as permissões da pasta `backend/uploads` e o limite de tamanho de arquivo no Nginx/Express.</span>
                                        </li>
                                    </ul>
                                </div>
                            </section>
                        </div>

                        <div className="p-6 border-t border-white/10 bg-white/5 flex justify-end">
                            <button
                                onClick={() => setShowManual(false)}
                                className="px-6 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition font-medium"
                            >
                                Fechar Manual
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SystemDashboard;
