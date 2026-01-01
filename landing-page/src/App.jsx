
import React, { useEffect, useState, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import { FaShieldAlt, FaRocket, FaUserShield, FaChartLine, FaComments, FaBolt, FaLock, FaDatabase, FaGithub, FaUniversalAccess } from 'react-icons/fa';
import logo from './assets/logo.svg';

// Import Screenshots
import dashboardImg from './assets/dashboard_admin_pro.png';
import auditoriaImg from './assets/auditoria_superadmin.png';
import chatImg from './assets/chat_superadmin_adm.png';
import filiadoImg from './assets/filiado_dashboard.png';
import gerenciadorImg from './assets/gerenciador_filiados_superadmin.png';
import techadminImg from './assets/techadmin_dashboard.png';
import loginImg from './assets/login.png';
import presentationVideo from './assets/video_presentation_updated.mp4';





function App() {
  const [scrollY, setScrollY] = useState(0);
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  useEffect(() => {
    const handleScroll = () => setScrollY(window.scrollY);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="min-h-screen text-slate-100 relative overflow-hidden font-sans selection:bg-blue-500/30">

      {/* Progress Bar */}
      <motion.div
        className="fixed top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 to-purple-500 origin-left z-[100]"
        style={{ scaleX }}
      />

      {/* Dynamic Background Blobs */}
      <div className="glow-blob bg-blue-600 top-[-20%] left-[-10%] mix-blend-screen"></div>
      <div className="glow-blob bg-purple-600 top-[20%] right-[-10%] animation-delay-2000 mix-blend-screen"></div>
      <div className="glow-blob bg-pink-600 bottom-[-20%] left-[20%] animation-delay-4000 mix-blend-screen"></div>

      {/* Navbar - Glassmorphism */}
      <nav className={`fixed w-full z-50 transition-all duration-300 ${scrollY > 50 ? 'bg-slate-900/80 backdrop-blur-md border-b border-white/5 py-3' : 'py-6'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center space-x-3 group cursor-pointer"
          >
            <div className="relative">
              <div className="absolute inset-0 bg-blue-500 blur-lg opacity-50 group-hover:opacity-100 transition duration-500"></div>
              <img src={logo} alt="CERNE" className="h-10 w-10 relative z-10 brightness-200" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-white group-hover:text-blue-300 transition">CERNE</span>
          </motion.div>

          <div className="hidden md:flex space-x-8">
            {['Origem', 'Arquitetura', 'Segurança', 'Módulos'].map((item, i) => (
              <motion.a
                key={item}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                href={`#${item.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, "")}`}
                className="text-sm font-medium text-slate-300 hover:text-white hover:scale-105 transition-all"
              >
                {item}
              </motion.a>
            ))}
          </div>
          <motion.a
            href="https://github.com/SainthixOli/filiacao_sindicato"
            target="_blank"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="hidden md:flex items-center gap-2 text-xs font-mono text-slate-300 px-4 py-2 border border-white/5 rounded-full hover:bg-white/5 hover:border-white/20 transition-all"
          >
            <FaGithub size={16} />
            github.com/SainthixOli
          </motion.a>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-32 pb-20">

        {/* HERO SECTION */}
        <main className="text-center relative z-10 min-h-[80vh] flex flex-col justify-center items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="inline-flex items-center px-4 py-2 rounded-full glass-panel mb-8"
          >
            <span className="w-2 h-2 rounded-full bg-blue-400 mr-2 animate-pulse"></span>
            <span className="text-xs font-medium tracking-wide text-blue-300 uppercase">Tech Showcase</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-6xl md:text-8xl font-black mb-8 tracking-tight leading-tight"
          >
            Gestão Sindical <br />
            <span className="text-gradient drop-shadow-2xl">Reimaginada</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8, delay: 0.4 }}
            className="text-lg md:text-xl text-slate-400 max-w-2xl mx-auto mb-12 leading-relaxed"
          >
            Uma solução SaaS completa nascida de uma necessidade real. Transformando a burocracia de filiação em uma experiência digital segura, auditável e escalável.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
            className="flex flex-col sm:flex-row justify-center gap-5 mb-20"
          >
            <a href="https://github.com/SainthixOli/filiacao_sindicato" target="_blank" className="px-8 py-4 bg-white text-slate-900 rounded-full font-bold text-lg hover:bg-blue-50 transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:scale-105">
              <FaGithub /> Acessar Repositório
            </a>
            <a href="#arquitetura" className="px-8 py-4 glass-panel rounded-full font-bold text-lg hover:bg-white/5 border border-white/10 hover:border-white/30 transition-all flex items-center gap-3">
              <FaChartLine /> Ver Arquitetura
            </a>
          </motion.div>

          {/* 3D DASHBOARD PREVIEW */}
          <motion.div
            initial={{ opacity: 0, rotateX: 20, y: 100 }}
            animate={{ opacity: 1, rotateX: 0, y: 0 }}
            transition={{ type: "spring", stiffness: 50, damping: 20, delay: 0.8 }}
            className="relative mx-auto max-w-6xl mt-8 perspective-1000 group w-full"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-blue-500/20 to-purple-500/20 blur-3xl -z-10 rounded-full opacity-40 group-hover:opacity-60 transition duration-700"></div>
            <div className="glass-panel p-2 rounded-2xl border border-white/10 shadow-2xl transform transition-transform duration-700 ease-out hover:scale-[1.01]">
              <div className="bg-slate-900/90 rounded-xl overflow-hidden aspect-video flex items-center justify-center relative border border-white/5 group">
                <img src={dashboardImg} alt="Dashboard Admin" className="w-full h-full object-cover opacity-90 hover:opacity-100 transition duration-500" />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900/50 via-transparent to-transparent"></div>
              </div>
            </div>
          </motion.div>
        </main>

        {/* ORIGIN STORY SECTION */}
        <section id="origem" className="py-32 border-b border-white/5">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 relative">
              <div className="absolute -inset-4 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[2rem] opacity-20 blur-2xl"></div>
              <img src={loginImg} alt="Tela de Login" className="relative rounded-[1.5rem] border border-white/10 shadow-2xl rotate-[-2deg] hover:rotate-0 transition duration-500" />
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-block px-4 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-sm font-mono mb-6">context_origin.md</div>
              <h2 className="text-4xl md:text-5xl font-bold mb-6">A Solução para um Problema Real</h2>
              <div className="space-y-6 text-lg text-slate-400 leading-relaxed">
                <p>
                  A ideia do <span className="text-white font-semibold">CERNE</span> nasceu da observação direta de uma necessidade crítica em um Sindicato de Professores.
                </p>
                <p>
                  Notei que a gestão ainda era refém de planilhas manuais, processos de filiação burocráticos e falta de transparência nos dados. Não existia um sistema que unisse <span className="text-white">gestão de membros</span>, <span className="text-white">comunicação segura</span> e <span className="text-white">auditoria</span> em um único lugar.
                </p>
                <p>
                  O desafio foi transformar essa lacuna em algo palpável. Desenvolvi uma arquitetura que não apenas digitaliza o processo, mas traz segurança de nível empresarial para instituições que lidam com dados sensíveis de milhares de profissionais.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* SECURITY DEEP DIVE */}
        <section id="seguranca" className="py-32 relative">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-[500px] bg-green-500/5 blur-[120px] -z-10"></div>

          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-bold mb-6">Engenharia de Segurança</h2>
            <p className="text-xl text-slate-400 max-w-3xl mx-auto">
              Testado exaustivamente. Projetado para resistir.
              Nossa prioridade zero foi blindar os dados dos filiados.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mb-16">
            <div className="glass-card p-10 rounded-3xl border border-green-500/20 bg-green-900/5">
              <FaShieldAlt className="text-5xl text-green-400 mb-6" />
              <h3 className="text-2xl font-bold mb-4">Pentesting & Auditoria</h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                Utilizamos ferramentas de mercado como <span className="text-white font-mono">OWASP ZAP</span> (Zed Attack Proxy) para realizar varreduras de vulnerabilidade ativas (DAST).
                O código passou por análise estática (SAST) com ESLint Security Plugin para blindagem contra padrões inseguros.
              </p>
              <div className="flex gap-3 flex-wrap">
                <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-md text-xs font-mono text-green-400">OWASP ZAP</span>
                <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-md text-xs font-mono text-green-400">SAST/DAST</span>
                <span className="px-3 py-1 bg-green-500/10 border border-green-500/20 rounded-md text-xs font-mono text-green-400">Penetration Testing</span>
              </div>
            </div>

            <div className="glass-card p-10 rounded-3xl border border-purple-500/20 bg-purple-900/5">
              <FaLock className="text-5xl text-purple-400 mb-6" />
              <h3 className="text-2xl font-bold mb-4">Criptografia & Dados</h3>
              <p className="text-slate-400 leading-relaxed mb-6">
                Nenhuma senha é salva em texto plano. Utilizamos <span className="text-white font-mono">Bcrypt</span> com salt rounds adaptativos para hashing irreversível.
                A comunicação é forçada via HTTPS em produção, e segredos de ambiente (Tokens, Chaves de API) são injetados em tempo de execução, fora do código-fonte.
              </p>
              <div className="flex gap-3 flex-wrap">
                <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-md text-xs font-mono text-purple-400">Bcrypt Hashing</span>
                <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-md text-xs font-mono text-purple-400">JWT Seguro</span>
                <span className="px-3 py-1 bg-purple-500/10 border border-purple-500/20 rounded-md text-xs font-mono text-purple-400">Sanitização SQL</span>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            <SecurityDetailCard
              title="Helmet Protection"
              desc="Headers HTTP configurados para prevenir Clickjacking (X-Frame-Options) e injeção de scripts (XSS-Protection)."
            />
            <SecurityDetailCard
              title="Input Sanitization"
              desc="Todas as entradas de usuário passam por filtros rigorosos no backend para neutralizar tentativas de SQL Injection."
            />
            <SecurityDetailCard
              title="Rate Limiting"
              desc="Camada de proteção contra força bruta e ataques de negação de serviço (DDoS) na API de autenticação."
            />
          </div>
        </section>

        {/* ACCESSIBILITY & USABILITY */}
        <section className="py-32 border-y border-white/5">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div>
              <div className="inline-block px-4 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm font-mono mb-6">UX / UI Design</div>
              <h2 className="text-4xl font-bold mb-6">Inclusão Digital na Prática</h2>
              <p className="text-lg text-slate-400 leading-relaxed mb-6">
                Sabemos que nem todo filiado é um expert em tecnologia. Por isso, a <span className="text-white">Área do Filiado</span> foi desenhada com foco total em acessibilidade.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-start text-slate-300">
                  <FaUniversalAccess className="mt-1 mr-3 text-orange-500" />
                  <span>Interface limpa, com botões grandes e navegação intuitiva.</span>
                </li>
                <li className="flex items-start text-slate-300">
                  <FaUniversalAccess className="mt-1 mr-3 text-orange-500" />
                  <span>Feedback visual claro para cada ação (sucesso/erro).</span>
                </li>
                <li className="flex items-start text-slate-300">
                  <FaUniversalAccess className="mt-1 mr-3 text-orange-500" />
                  <span>Responsividade total para acesso via Celulares simples.</span>
                </li>
              </ul>
            </div>
            <div className="relative">
              <div className="absolute -inset-4 bg-orange-500/20 blur-3xl rounded-[2rem]"></div>
              <img src={filiadoImg} alt="Dashboard do Filiado" className="relative rounded-2xl border border-white/10 shadow-2xl" />
            </div>
          </div>
        </section>

        {/* DETAILED FEATURES SECTIONS */}
        <section id="modulos" className="space-y-40 py-20">

          {/* FEATURE 1: MEMBER MANAGEMENT */}
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 relative group">
              <div className="absolute -inset-4 bg-blue-600/20 blur-3xl rounded-[2rem] opacity-50 group-hover:opacity-75 transition duration-500"></div>
              <img src={gerenciadorImg} alt="Gestão de Filiados" className="relative rounded-2xl border border-white/10 shadow-2xl transition duration-500 group-hover:scale-[1.01]" />
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-mono mb-6">
                <FaUserShield />
                <span>CORE MODULE</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-6">Gestão de Filiados Centralizada</h3>
              <div className="space-y-6 text-slate-400 leading-relaxed">
                <p>
                  O coração do sistema. Abandonamos as planilhas estáticas para um gerenciador dinâmico que oferece <span className="text-white font-medium">controle total do ciclo de vida do membro</span>.
                </p>
                <p>
                  Desde o pré-cadastro até a homologação, cada etapa é validada. O painel permite busca indexada instantânea, edição granular de dados cadastrais e visualização rápida de status (Ativo, Pendente, Suspenso).
                </p>
                <ul className="space-y-2 mt-4 text-sm font-mono text-slate-500">
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>CRUD Otimizado</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>Filtros Avançados</li>
                  <li className="flex items-center gap-2"><div className="w-1.5 h-1.5 bg-blue-500 rounded-full"></div>Exportação de Relatórios</li>
                </ul>
              </div>
            </div>
          </div>

          {/* FEATURE 2: SECURE CHAT */}
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 text-xs font-mono mb-6">
                <FaComments />
                <span>SECURE COMMUNICATION</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-6">Chat Seguro & Moderado</h3>
              <div className="space-y-6 text-slate-400 leading-relaxed">
                <p>
                  A comunicação interna exige privacidade e respeito. Implementamos um canal direto de suporte e interação entre Admins e Super Admins via <span className="text-white font-medium">WebSockets</span> para latência zero.
                </p>
                <p>
                  O diferencial técnico reside no <span className="text-white font-medium">Filtro de Conteúdo Ativo</span>. Um motor baseado em Expressões Regulares (RegEx) e listas de bloqueio intercepta e sanitiza mensagens em tempo real, impedindo o envio de ofensas, palavras de baixo calão ou conteúdo impróprio antes mesmo de atingir o servidor.
                </p>
                <div className="p-4 rounded-lg bg-red-900/10 border border-red-500/20 mt-4">
                  <div className="flex items-center gap-2 text-red-400 font-bold text-xs uppercase mb-2">
                    <FaShieldAlt /> Protection Layer
                  </div>
                  <p className="text-xs text-red-200/70 mono">
                    &gt; Message intercepted: "Conteúdo Inadequado Detectado"<br />
                    &gt; Action: Block & Log Event
                  </p>
                </div>
              </div>
            </div>
            <div className="order-2 relative group">
              <div className="absolute -inset-4 bg-pink-600/20 blur-3xl rounded-[2rem] opacity-50 group-hover:opacity-75 transition duration-500"></div>
              <img src={chatImg} alt="Chat Seguro" className="relative rounded-2xl border border-white/10 shadow-2xl transition duration-500 group-hover:rotate-1" />
            </div>
          </div>

          {/* FEATURE 3: AUDIT LOGS */}
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-2 md:order-1 relative group">
              <div className="absolute -inset-4 bg-orange-600/20 blur-3xl rounded-[2rem] opacity-50 group-hover:opacity-75 transition duration-500"></div>
              <img src={auditoriaImg} alt="Logs de Auditoria" className="relative rounded-2xl border border-white/10 shadow-2xl transition duration-500 group-hover:scale-[1.01]" />
            </div>
            <div className="order-1 md:order-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-mono mb-6">
                <FaDatabase />
                <span>IMMUTABLE LEDGER</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-6">Rastreabilidade & Auditoria</h3>
              <div className="space-y-6 text-slate-400 leading-relaxed">
                <p>
                  Segurança não é apenas prevenção, é rastreabilidade. Cada ação crítica no sistema (Login, Edição de Perfil, Exclusão de Documento) gera um <span className="text-white font-medium">Log de Evento Imutável</span>.
                </p>
                <p>
                  A arquitetura foi desenhada para que Super Admins tenham visão de raio-X sobre o que acontece na plataforma. Quem fez? Quando? De qual IP? Tudo registrado para garantir accountability e conformidade.
                </p>
                <div className="grid grid-cols-2 gap-4 mt-6">
                  <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                    <div className="text-2xl font-bold text-white mb-1">100%</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Ações Logadas</div>
                  </div>
                  <div className="p-4 bg-white/5 rounded-lg border border-white/5">
                    <div className="text-2xl font-bold text-white mb-1">SHA-256</div>
                    <div className="text-xs text-slate-500 uppercase tracking-wider">Integridade</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* FEATURE 4: TECH ADMIN */}
          <div className="grid md:grid-cols-2 gap-16 items-center">
            <div className="order-1">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-mono mb-6">
                <FaBolt />
                <span>SYSTEM HEALTH</span>
              </div>
              <h3 className="text-3xl md:text-4xl font-bold mb-6">Painel Tech Admin</h3>
              <div className="space-y-6 text-slate-400 leading-relaxed">
                <p>
                  Para o responsável técnico, a opacidade é o inimigo. Desenvolvemos um dashboard exclusivo que oferece <span className="text-white font-medium">observabilidade em tempo real</span> da infraestrutura.
                </p>
                <p>
                  Monitore a saúde do banco de dados, verifique a integridade das variáveis de ambiente e acompanhe métricas de performance (latência, uso de memória) em uma interface unificada. Facilitando a manutenção preventiva e o troubleshooting.
                </p>
                <div className="flex gap-4 mt-4">
                  <span className="px-3 py-2 bg-slate-800 rounded border border-white/5 text-xs font-mono text-green-400">✅ DB Connection</span>
                  <span className="px-3 py-2 bg-slate-800 rounded border border-white/5 text-xs font-mono text-green-400">✅ Env Vars</span>
                  <span className="px-3 py-2 bg-slate-800 rounded border border-white/5 text-xs font-mono text-yellow-400">⚠️ Memory Usage</span>
                </div>
              </div>
            </div>
            <div className="order-2 relative group">
              <div className="absolute -inset-4 bg-cyan-600/20 blur-3xl rounded-[2rem] opacity-50 group-hover:opacity-75 transition duration-500"></div>
              <img src={techadminImg} alt="Tech Admin Dashboard" className="relative rounded-2xl border border-white/10 shadow-2xl transition duration-500 group-hover:scale-[1.01]" />
            </div>
          </div>

        </section>

        {/* DISCLAIMER / SHOWCASE NOTE */}
        <section className="py-12 px-6 mb-20">
          <div className="max-w-4xl mx-auto p-[1px] bg-gradient-to-r from-transparent via-blue-500/50 to-transparent">
            <div className="bg-slate-900/90 backdrop-blur-xl rounded-lg p-8 text-center">
              <h4 className="flex items-center justify-center gap-2 text-blue-300 font-bold mb-4 uppercase tracking-widest text-sm">
                <FaRocket /> Nota do Desenvolvedor
              </h4>
              <p className="text-slate-400 leading-relaxed max-w-2xl mx-auto">
                Esta página é um <span className="text-white">Technical Showcase</span>. A aplicação real é muito mais vasta, contendo dezenas de interfaces, fluxos de recuperação de senha, geração de documentos PDF, dashboards financeiros e muito mais.
                <br /><br />
                O projeto é <strong>Open Source</strong>. Você é encorajado a explorar o código completo, testar a aplicação localmente e contribuir.
              </p>
            </div>
          </div>
        </section>

        {/* DEVELOPER SECTION */}
        <section className="py-20 border-t border-white/5">
          <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-12 items-center">

            {/* VIDEO */}
            <div className="relative group flex justify-center">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-purple-600 rounded-[2.5rem] blur opacity-30 group-hover:opacity-70 transition duration-500 w-full max-w-[340px] mx-auto"></div>
              <div className="relative rounded-[2rem] overflow-hidden shadow-2xl border-8 border-slate-900 bg-slate-900 aspect-[9/16] max-w-[340px] w-full mx-auto">
                <video
                  className="w-full h-full object-cover"
                  controls
                  src={presentationVideo}
                  poster={loginImg}
                >
                  Seu navegador não suporta a visualização deste vídeo.
                </video>
              </div>
            </div>

            {/* BIO */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-mono mb-6">
                <FaUserShield />
                <span>THE MIND BEHIND</span>
              </div>
              <h2 className="text-4xl font-bold mb-6">Sobre o Desenvolvedor</h2>
              <p className="text-xl text-white font-medium mb-2">Oliver Arthur</p>
              <p className="text-slate-400 mb-6 font-mono text-sm leading-relaxed">
                Software Engineering Student @ Uniceplac <br />
                4º Semestre (Indo para)
              </p>
              <div className="space-y-4 text-slate-400 leading-relaxed">
                <p>
                  Olá! Eu sou o criador do <span className="text-white">CERNE</span>. Estudo Engenharia de Software e estou indo para o quarto semestre na Faculdade Uniceplac.
                </p>
                <p>
                  Este projeto é a materialização dos meus estudos em arquitetura de software, segurança e desenvolvimento fullstack.
                </p>
                <p>
                  Fique à vontade para ver o vídeo ao lado onde explico um pouco mais sobre a visão deste projeto.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* FINAL CTA */}
        <section className="text-center py-24 px-6 rounded-[3rem] relative overflow-hidden glass-card border border-blue-500/30">
          <div className="absolute inset-0 bg-blue-600/10 blur-3xl"></div>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            whileInView={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", duration: 0.8 }}
            className="relative z-10"
          >
            <h2 className="text-5xl md:text-6xl font-black mb-6 tracking-tight">Código Aberto</h2>
            <p className="text-xl text-slate-300 mb-10 max-w-2xl mx-auto">
              Explore o código fonte, contribua ou faça um fork do projeto no GitHub.
            </p>
            <a href="https://github.com/SainthixOli/filiacao_sindicato" target="_blank" className="inline-flex bg-white text-slate-900 px-12 py-5 rounded-full font-bold text-xl hover:bg-blue-50 transition transform hover:scale-105 shadow-[0_0_40px_rgba(255,255,255,0.3)] items-center gap-3">
              <FaGithub size={24} /> Acessar no GitHub
            </a>
          </motion.div>
        </section>

        <footer className="mt-20 pt-10 border-t border-white/5 text-center text-slate-500 text-sm">
          <p>© 2024 CERNE Tecnologia. Desenvolvido por SainthixOli.</p>
        </footer>

      </div>
    </div>
  );
}

function SecurityDetailCard({ title, desc }) {
  return (
    <div className="p-6 rounded-xl bg-white/5 border border-white/5 hover:bg-white/10 transition">
      <h4 className="text-green-400 font-bold mb-2 font-mono text-sm">{title}</h4>
      <p className="text-slate-400 text-sm leading-relaxed">{desc}</p>
    </div>
  )
}

function BentoCard({ title, desc, icon, image, className = "" }) {
  return (
    <div className={`glass-card relative overflow-hidden rounded-3xl border border-white/10 group ${className}`}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-900/90 z-10"></div>
      <img src={image} alt={title} className="absolute inset-0 w-full h-full object-cover transition duration-700 group-hover:scale-110 opacity-60 group-hover:opacity-40" />

      <div className="relative z-20 p-8 h-full flex flex-col justify-end">
        <div className="w-12 h-12 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center text-xl text-white mb-4 border border-white/20">
          {icon}
        </div>
        <h3 className="text-2xl font-bold mb-2 text-white">{title}</h3>
        <p className="text-slate-300 text-sm leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}

export default App;

