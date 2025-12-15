import React from 'react';
import {
  LayoutDashboard,
  UserCircle,
  FileText,
  Settings,
  LogOut,
  AlertCircle,
  CheckCircle,
  Menu
} from 'lucide-react';

export function Dashboard({ onLogout }) {
  return (
    <div className="min-h-screen mesh-gradient-bg flex">

      {/* --- MENU LATERAL (SIDEBAR) --- */}
      <aside className="w-64 glass border-r border-white/10 hidden md:flex flex-col backdrop-blur-md">
        <div className="p-6 border-b border-white/10 flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg">
            S
          </div>
          <span className="font-bold text-gray-900 dark:text-white text-lg tracking-tight">Sindicato</span>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <a href="#" className="flex items-center gap-3 px-4 py-3 bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl font-bold border border-blue-500/20">
            <LayoutDashboard size={20} />
            Início
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-white/10 hover:text-gray-900 dark:hover:text-white rounded-xl transition-all">
            <UserCircle size={20} />
            Meus Dados
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-white/10 hover:text-gray-900 dark:hover:text-white rounded-xl transition-all">
            <FileText size={20} />
            Filiação
          </a>
          <a href="#" className="flex items-center gap-3 px-4 py-3 text-gray-600 dark:text-gray-400 hover:bg-white/10 hover:text-gray-900 dark:hover:text-white rounded-xl transition-all">
            <Settings size={20} />
            Configurações
          </a>
        </nav>

        <div className="p-4 border-t border-white/10">
          <button
            onClick={onLogout}
            className="flex items-center gap-3 px-4 py-3 text-red-500 hover:bg-red-500/10 w-full rounded-xl transition-all font-medium"
          >
            <LogOut size={20} />
            Sair
          </button>
        </div>
      </aside>

      {/* --- CONTEÚDO PRINCIPAL --- */}
      <main className="flex-1 p-8 overflow-y-auto">

        {/* Cabeçalho Mobile/Desktop */}
        <div className="flex justify-between items-center mb-8 glass p-4 rounded-2xl">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Bem-vindo, Professor Oliver!</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">Matrícula: 2025-9876 • EM Prof. Pardal</p>
          </div>
          <div className="h-12 w-12 rounded-full overflow-hidden border-2 border-white/20 shadow-lg ring-2 ring-blue-500/20">
            {/* Foto fake de perfil */}
            <img src="https://github.com/shadcn.png" alt="Perfil" className="w-full h-full object-cover" />
          </div>
        </div>

        {/* Status da Filiação (Exemplo de card de aviso) */}
        <div className="glass-panel p-6 mb-8 flex items-start gap-4 border-l-4 border-l-amber-500 relative overflow-hidden">
          <div className="absolute inset-0 bg-amber-500/5 z-0"></div>
          <AlertCircle className="text-amber-500 shrink-0 mt-1 relative z-10" />
          <div className="relative z-10">
            <h3 className="font-bold text-amber-600 dark:text-amber-400 text-lg">Cadastro Pendente de Atualização</h3>
            <p className="text-gray-600 dark:text-gray-300 text-sm mt-1 leading-relaxed">
              Identificamos que seu comprovante de residência está desatualizado. Por favor, envie o novo documento para regularizar sua filiação.
            </p>
            <button className="mt-3 text-sm font-bold text-amber-600 dark:text-amber-400 underline hover:text-amber-700 dark:hover:text-amber-300">
              Resolver agora
            </button>
          </div>
        </div>

        {/* Grid de Ações Rápidas */}
        <div className="grid md:grid-cols-3 gap-6">

          {/* Card 1 */}
          <div className="glass-panel p-6 hover:-translate-y-2 transition-transform duration-300 cursor-pointer group">
            <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <UserCircle size={28} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Atualizar Cadastro</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Edite seus dados pessoais, endereço e escola de lotação.</p>
          </div>

          {/* Card 2 */}
          <div className="glass-panel p-6 hover:-translate-y-2 transition-transform duration-300 cursor-pointer group">
            <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <CheckCircle size={28} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Status da Filiação</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Visualize sua ficha assinada e o histórico de aprovação.</p>
          </div>

          {/* Card 3 */}
          <div className="glass-panel p-6 hover:-translate-y-2 transition-transform duration-300 cursor-pointer group">
            <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <FileText size={28} />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white text-lg">Holerites e Docs</h3>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">Envie ou baixe documentos importantes para o sindicato.</p>
          </div>

        </div>
      </main>
    </div>
  );
}