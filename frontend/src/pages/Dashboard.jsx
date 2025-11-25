import React from 'react';
import { 
  LayoutDashboard, 
  UserCircle, 
  FileText, 
  Settings, 
  LogOut, 
  AlertCircle,
  CheckCircle 
} from 'lucide-react';

export function Dashboard({ onLogout }) {
  return (
    <div className="min-h-screen bg-slate-100 flex">
      
      {/* --- MENU LATERAL (SIDEBAR) --- */}
      <aside className="w-64 bg-white border-r border-slate-200 hidden md:flex flex-col">
        <div className="p-6 border-b border-slate-100 flex items-center gap-3">
          <div className="w-10 h-10 bg-brand-100 rounded-lg flex items-center justify-center text-brand-600 font-bold">
            S
          </div>
          <span className="font-bold text-slate-800">Sindicato</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-brand-50 text-brand-700 rounded-lg font-medium">
            <LayoutDashboard size={20} />
            Início
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
            <UserCircle size={20} />
            Meus Dados
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
            <FileText size={20} />
            Filiação
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-slate-600 hover:bg-slate-50 rounded-lg transition-colors">
            <Settings size={20} />
            Configurações
          </a>
        </nav>

        <div className="p-4 border-t border-slate-100">
          <button 
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 text-red-600 hover:bg-red-50 w-full rounded-lg transition-colors"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main className="flex-1 p-8 overflow-y-auto">
        
        {/* Cabeçalho Mobile/Desktop */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Bem-vindo, Professor Oliver!</h1>
            <p className="text-slate-500">Matrícula: 2025-9876 • EM Prof. Pardal</p>
          </div>
          <div className="h-10 w-10 bg-slate-200 rounded-full overflow-hidden border-2 border-white shadow-sm">
             {/* Foto fake de perfil */}
             <img src="https://github.com/shadcn.png" alt="Perfil" />
          </div>
        </div>

        {/* Status da Filiação (Exemplo de card de aviso) */}
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-8 flex items-start gap-4">
          <AlertCircle className="text-amber-600 shrink-0 mt-1" />
          <div>
            <h3 className="font-bold text-amber-900">Cadastro Pendente de Atualização</h3>
            <p className="text-amber-700 text-sm mt-1">
              Identificamos que seu comprovante de residência está desatualizado. Por favor, envie o novo documento para regularizar sua filiação.
            </p>
            <button className="mt-3 text-sm font-semibold text-amber-800 underline hover:text-amber-900">
              Resolver agora
            </button>
          </div>
        </div>

        {/* Grid de Ações Rápidas */}
        <div className="grid md:grid-cols-3 gap-6">
          
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center mb-4">
              <UserCircle size={24} />
            </div>
            <h3 className="font-bold text-slate-800">Atualizar Cadastro</h3>
            <p className="text-slate-500 text-sm mt-2">Edite seus dados pessoais, endereço e escola de lotação.</p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-lg flex items-center justify-center mb-4">
              <CheckCircle size={24} />
            </div>
            <h3 className="font-bold text-slate-800">Status da Filiação</h3>
            <p className="text-slate-500 text-sm mt-2">Visualize sua ficha assinada e o histórico de aprovação.</p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow cursor-pointer">
            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center mb-4">
              <FileText size={24} />
            </div>
            <h3 className="font-bold text-slate-800">Holerites e Docs</h3>
            <p className="text-slate-500 text-sm mt-2">Envie ou baixe documentos importantes para o sindicato.</p>
          </div>

        </div>
      </main>
    </div>
  );
}