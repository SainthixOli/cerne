import React from 'react';
import { useNavigate } from 'react-router-dom';
import { User, Lock, ArrowRight, ShieldCheck } from 'lucide-react'; // Importei ShieldCheck pra ficar mais legal

export function Login() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-slate-100 to-slate-200">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-100">
        
        <div className="p-8 text-center border-b border-slate-50">
          <div className="w-16 h-16 bg-blue-100 rounded-xl mx-auto flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-blue-600">S</span>
          </div>
          <h1 className="text-2xl font-bold text-slate-800">Área de Acesso</h1>
          <p className="text-slate-500 mt-2 text-sm">Sindicato dos Professores</p>
        </div>

        <form className="p-8 space-y-6">
          {/* Inputs de Login (CPF/Senha) aqui... mantive igual ao anterior */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">CPF ou Email</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input type="text" placeholder="000.000.000-00" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">Senha</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
              <input type="password" placeholder="••••••••" className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all" />
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {/* BOTÃO 1: Entrar como Professor */}
            <button 
              onClick={(e) => { e.preventDefault(); navigate('/dashboard'); }}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              Entrar como Professor
              <ArrowRight className="w-5 h-5" />
            </button>

            <div className="relative flex py-2 items-center">
              <div className="flex-grow border-t border-slate-200"></div>
              <span className="flex-shrink mx-4 text-slate-400 text-xs">OU</span>
              <div className="flex-grow border-t border-slate-200"></div>
            </div>

            {/* BOTÃO 2: Área Administrativa (Admin) */}
            <button 
              onClick={(e) => { e.preventDefault(); navigate('/admin'); }}
              className="w-full bg-slate-800 hover:bg-slate-900 text-white font-medium py-3 rounded-lg flex items-center justify-center gap-2 transition-all active:scale-95"
            >
              <ShieldCheck className="w-5 h-5" />
              Login Admin
            </button>
          </div>
        </form>
        
      </div>
    </div>
  );
}