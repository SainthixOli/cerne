import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  FileCheck, 
  LogOut, 
  CheckCircle, 
  XCircle, 
  Eye 
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
    <div className="min-h-screen bg-slate-100 flex">
      
      {/* SIDEBAR DO ADMIN (Mais escura pra diferenciar) */}
      <aside className="w-64 bg-slate-900 text-slate-300 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">
            ADM
          </div>
          <div>
            <span className="font-bold text-white block">Sindicato</span>
            <span className="text-xs text-slate-400">Painel Gestor</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-blue-600 text-white rounded-lg font-medium">
            <LayoutDashboard size={20} />
            Visão Geral
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors">
            <Users size={20} />
            Professores
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 hover:bg-slate-800 rounded-lg transition-colors">
            <FileCheck size={20} />
            Aprovações
          </a>
        </nav>

        <div className="p-4 border-t border-slate-800">
          <button 
            onClick={() => navigate('/')}
            className="flex items-center gap-3 px-4 py-3 text-red-400 hover:bg-slate-800 w-full rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Sair do Admin
          </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-bold text-slate-800">Solicitações de Filiação</h1>
          <button className="bg-slate-900 text-white px-4 py-2 rounded-lg text-sm hover:bg-slate-800">
            Baixar Relatório
          </button>
        </div>

        {/* CARDS DE RESUMO */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-slate-500 text-sm">Pendentes</p>
            <h3 className="text-3xl font-bold text-slate-800">12</h3>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-slate-500 text-sm">Aprovados Hoje</p>
            <h3 className="text-3xl font-bold text-green-600">05</h3>
          </div>
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <p className="text-slate-500 text-sm">Total de Filiados</p>
            <h3 className="text-3xl font-bold text-blue-600">1.240</h3>
          </div>
        </div>

        {/* TABELA DE SOLICITAÇÕES */}
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-100">
            <h3 className="font-bold text-slate-800">Últimos Pedidos</h3>
          </div>
          <table className="w-full text-left">
            <thead className="bg-slate-50 text-slate-500 text-sm uppercase">
              <tr>
                <th className="p-4 font-medium">Nome do Professor</th>
                <th className="p-4 font-medium">Escola</th>
                <th className="p-4 font-medium">Data</th>
                <th className="p-4 font-medium">Status</th>
                <th className="p-4 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {solicitacoes.map((item) => (
                <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                  <td className="p-4 font-medium text-slate-800">{item.nome}</td>
                  <td className="p-4 text-slate-600">{item.escola}</td>
                  <td className="p-4 text-slate-600">{item.data}</td>
                  <td className="p-4">
                    <span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs font-bold">
                      {item.status}
                    </span>
                  </td>
                  <td className="p-4 text-right flex justify-end gap-2">
                    <button className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg" title="Ver Detalhes">
                      <Eye size={18} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-green-600 hover:bg-green-50 rounded-lg" title="Aprovar">
                      <CheckCircle size={18} />
                    </button>
                    <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg" title="Recusar">
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