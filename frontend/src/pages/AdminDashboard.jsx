import React from 'react';
import api from '../api';
import { useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  FileCheck,
  LogOut,
  CheckCircle,
  XCircle,
  Eye,
  Shield
} from 'lucide-react';

export function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = React.useState({
    pending: 0,
    approvedToday: 0,
    total: 0
  });
  const [recentRequests, setRecentRequests] = React.useState([]);
  const [recentActivity, setRecentActivity] = React.useState([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState(null);

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Fetching dashboard data...');
      // 1. Fetch Affiliations (Requests)
      const resAffiliations = await api.get('/affiliations');
      console.log('Affiliations response:', resAffiliations.status, resAffiliations.data);
      const allAffiliations = resAffiliations.data || [];

      // Calculate Stats
      const pendingCount = allAffiliations.filter(a => a.status === 'pendente_docs' || a.status === 'em_analise' || a.status === 'em_processamento').length;
      const today = new Date().toISOString().split('T')[0];
      const approvedTodayCount = allAffiliations.filter(a => a.status === 'concluido' && a.data_aprovacao && a.data_aprovacao.startsWith(today)).length;
      const totalCount = allAffiliations.length;

      setStats({
        pending: pendingCount,
        approvedToday: approvedTodayCount,
        total: totalCount
      });

      // Filter Recent Requests (Last 5)
      const sortedRequests = [...allAffiliations].sort((a, b) => new Date(b.data_solicitacao) - new Date(a.data_solicitacao));
      setRecentRequests(sortedRequests.slice(0, 5));

      // 2. Fetch Audit Logs (Recent Activity)
      try {
        const resAudit = await api.get('/admin/audit');
        setRecentActivity(resAudit.data.slice(0, 5) || []);
      } catch (err) {
        console.warn('Could not fetch audit logs:', err);
        // Don't set global error for this, just leave activity empty
      }

    } catch (err) {
      console.error('Error loading dashboard:', err);
      setError(err.message || 'Erro ao carregar dados');
      if (err.response && err.response.status === 401) {
        setError('Sessão expirada. Por favor, faça login novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen mesh-gradient-bg flex">

      {/* SIDEBAR DO ADMIN */}
      <aside className="w-64 glass border-r border-white/10 hidden md:flex flex-col backdrop-blur-md">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
            ADM
          </div>
          <div>
            <span className="font-bold text-gray-900 dark:text-white block">CERNE System</span>
            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">Painel Gestor</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-xl font-bold shadow-lg shadow-blue-500/30">
            <LayoutDashboard size={20} />
            Visão Geral
          </a>
          <a href="#" onClick={() => navigate('/admin/users')} className="flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-white/10 hover:text-gray-900 dark:hover:text-white rounded-xl transition-all">
            <Users size={20} />
            Colaboradores
          </a>
          <a href="#" onClick={() => navigate('/admin/filiados')} className="flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-white/10 hover:text-gray-900 dark:hover:text-white rounded-xl transition-all">
            <FileCheck size={20} />
            Filiações
          </a>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => {
              localStorage.removeItem('token');
              localStorage.removeItem('user');
              navigate('/login');
            }}
            className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 w-full rounded-xl transition-all font-medium"
          >
            <LogOut size={20} />
            Sair do Admin
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8 glass p-4 rounded-2xl">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Painel de Controle</h1>
          <button className="btn-primary px-4 py-2 text-sm" onClick={fetchDashboardData}>
            Atualizar Dados
          </button>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-6" role="alert">
            <strong className="font-bold">Ops! </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-panel p-6 hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Pendentes</p>
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-400">
                <FileCheck size={20} />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
              {loading ? <span className="animate-pulse">...</span> : stats.pending}
            </h3>
          </div>
          <div className="glass-panel p-6 hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Aprovados Hoje</p>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                <CheckCircle size={20} />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-green-600 dark:text-green-400">
              {loading ? <span className="animate-pulse">...</span> : stats.approvedToday}
            </h3>
          </div>
          <div className="glass-panel p-6 hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total de Filiados</p>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <Users size={20} />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400">
              {loading ? <span className="animate-pulse">...</span> : stats.total}
            </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* COLUNA ESQUERDA: PEDIDOS RECENTES */}
          <div className="lg:col-span-2 glass-panel overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-white/10 flex justify-between items-center">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg">Últimos Pedidos</h3>
              <button onClick={() => navigate('/admin/filiados')} className="text-sm text-blue-500 hover:underline">Ver todos</button>
            </div>

            {loading ? (
              <div className="p-8 space-y-4">
                {[1, 2, 3].map(i => <div key={i} className="h-10 bg-gray-100 dark:bg-white/5 rounded animate-pulse" />)}
              </div>
            ) : recentRequests.length === 0 ? (
              <div className="p-12 text-center text-gray-400">Nenhum pedido recente.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-gray-50/50 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-sm uppercase">
                    <tr>
                      <th className="p-4 font-medium">Nome</th>
                      <th className="p-4 font-medium">CPF</th>
                      <th className="p-4 font-medium">Status</th>
                      <th className="p-4 font-medium text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                    {recentRequests.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                        <td className="p-4 font-medium text-gray-900 dark:text-white">{item.nome}</td>
                        <td className="p-4 text-gray-600 dark:text-gray-400 text-sm">{item.cpf}</td>
                        <td className="p-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-bold border ${item.status === 'concluido' ? 'bg-green-100 text-green-700 border-green-200' :
                            item.status === 'rejeitado' ? 'bg-red-100 text-red-700 border-red-200' :
                              'bg-yellow-100 text-yellow-700 border-yellow-200'
                            }`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="p-4 text-right">
                          <button
                            onClick={() => navigate(`/admin/filiados`)}
                            className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition" title="Ver Detalhes">
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* COLUNA DIREITA: ATIVIDADE RECENTE (AUDIT LOGS) */}
          <div className="glass-panel overflow-hidden">
            <div className="p-6 border-b border-gray-100 dark:border-white/10">
              <h3 className="font-bold text-gray-900 dark:text-white text-lg flex items-center gap-2">
                <Shield size={18} className="text-purple-500" />
                Atividade Recente
              </h3>
            </div>
            <div className="p-0">
              {recentActivity.length === 0 ? (
                <div className="p-8 text-center text-gray-400 text-sm">
                  Nenhuma atividade recente ou acesso restrito.
                </div>
              ) : (
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {recentActivity.map((log) => (
                    <div key={log.id} className="p-4 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border-l-2 border-transparent hover:border-blue-500">
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                          {log.actionFriendly}
                        </p>
                        <span className="text-[10px] text-gray-400 bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full">
                          {new Date(log.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        por <span className="font-bold text-blue-600 dark:text-blue-400">{log.admin_name || 'Admin'}</span>
                      </p>
                      {log.detailsObj && (log.detailsObj.user_name || log.detailsObj.month) && (
                        <div className="mt-2 text-xs text-gray-400 bg-gray-50 dark:bg-black/20 p-2 rounded border border-gray-100 dark:border-white/5">
                          {log.detailsObj.user_name && <div>Alvo: {log.detailsObj.user_name}</div>}
                          {log.detailsObj.month && <div>Ref: {log.detailsObj.month} (Nota: {log.detailsObj.score})</div>}
                          {log.detailsObj.reason && <div className="text-red-400">Motivo: {log.detailsObj.reason}</div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="p-4 border-t border-gray-100 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
              <button className="text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white uppercase tracking-wider w-full text-center">
                Ver Log Completo
              </button>
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}