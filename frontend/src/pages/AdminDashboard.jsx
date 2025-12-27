import React from 'react';
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

  // Dados falsos para simular professores pedindo filiação
  const solicitacoes = [
    { id: 1, nome: 'Carlos Eduardo', escola: 'EM Prof. Pardal', data: '25/11/2025', status: 'Pendente' },
    { id: 2, nome: 'Ana Clara Souza', escola: 'CIEP 123', data: '24/11/2025', status: 'Pendente' },
    { id: 3, nome: 'Roberto Firmino', escola: 'EM Rio de Janeiro', data: '24/11/2025', status: 'Análise' },
  ];

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
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-white/10 hover:text-gray-900 dark:hover:text-white rounded-xl transition-all">
            <Users size={20} />
            Professores
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-white/10 hover:text-gray-900 dark:hover:text-white rounded-xl transition-all">
            <FileCheck size={20} />
            Aprovações
          </a>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={() => navigate('/')}
            className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 w-full rounded-xl transition-all font-medium"
          >
            <LogOut size={20} />
            Sair do Admin
          </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8 glass p-4 rounded-2xl">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Solicitações de Filiação</h1>
          <button className="btn-primary px-4 py-2 text-sm">
            Baixar Relatório
          </button>
        </div>

        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="glass-panel p-6 hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Pendentes</p>
              <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600 dark:text-yellow-400">
                <FileCheck size={20} />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">12</h3>
          </div>
          <div className="glass-panel p-6 hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Aprovados Hoje</p>
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600 dark:text-green-400">
                <CheckCircle size={20} />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-green-600 dark:text-green-400">05</h3>
          </div>
          <div className="glass-panel p-6 hover:-translate-y-1 transition-transform duration-300">
            <div className="flex items-center justify-between mb-4">
              <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Total de Filiados</p>
              <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg text-blue-600 dark:text-blue-400">
                <Users size={20} />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-blue-600 dark:text-blue-400">1.240</h3>
          </div>
        </div>

        {/* TABELA DE SOLICITAÇÕES */}
        <div className="glass-panel overflow-hidden">
          <div className="p-6 border-b border-gray-100 dark:border-white/10">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Últimos Pedidos</h3>
          </div>
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 dark:bg-white/5 text-gray-500 dark:text-gray-400 text-sm uppercase">
              <tr>
                <th className="p-4 font-medium">Nome do Professor</th>
                <th className="p-4 font-medium">Escola</th>
                <th className="p-4 font-medium">Data</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-white/5">
              {solicitacoes.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                  <td className="p-4 font-medium text-gray-900 dark:text-white">{item.nome}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">{item.escola}</td>
                  <td className="p-4 text-gray-600 dark:text-gray-400">{item.data}</td>
                  <td className="p-4">
                    <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 px-3 py-1 rounded-full text-xs font-bold border border-yellow-200 dark:border-yellow-800">
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition" title="Ver Detalhes">
                      <Eye size={18} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-green-600 dark:hover:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition" title="Aprovar">
                      <CheckCircle size={18} />
                    </button>
                    <button className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition" title="Recusar">
                      <XCircle size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </main>
    </div>
  );
}