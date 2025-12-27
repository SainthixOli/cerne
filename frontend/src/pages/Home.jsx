import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Shield, Clock, Zap } from 'lucide-react';

const Home = () => {
    return (
        <div className="space-y-12 max-w-6xl mx-auto">
            {/* Hero Section */}
            <section className="text-center py-20 glass-panel relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/10 to-purple-600/10 z-0"></div>
                <div className="absolute -top-20 -right-20 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl"></div>
                <div className="absolute -bottom-20 -left-20 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl"></div>

                <div className="relative z-10 px-6">
                    <div className="inline-flex items-center px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 font-bold text-sm mb-8 animate-fade-in">
                        <Zap size={16} className="mr-2" />
                        Nova Plataforma Digital
                    </div>

                    <h1 className="text-5xl md:text-7xl font-extrabold text-gray-900 dark:text-white mb-8 tracking-tight leading-tight">
                        Filiação Digital <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">Simplificada</span>
                    </h1>

                    <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto mb-10 leading-relaxed">
                        Junte-se ao <strong>CERNE System</strong> de forma rápida, segura e 100% online.
                        Sem papelada, sem burocracia, com a modernidade que você merece.
                    </p>

                    <div className="flex flex-col sm:flex-row justify-center gap-4">
                        <Link
                            to="/register"
                            className="btn-primary px-8 py-4 text-lg shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transform hover:-translate-y-1 transition-all duration-300"
                        >
                            Quero me Filiar
                            <ArrowRight className="ml-2" />
                        </Link>
                        <Link
                            to="/login"
                            className="px-8 py-4 glass text-gray-700 dark:text-white font-bold rounded-xl hover:bg-white/20 transition-all duration-300"
                        >
                            Já sou Membro
                        </Link>
                    </div>
                </div>
            </section>

            {/* Features */}
            <section className="grid md:grid-cols-3 gap-8">
                <FeatureCard
                    icon={<Clock className="text-blue-500" size={32} />}
                    title="Rápido e Fácil"
                    description="Preencha seus dados em poucos minutos e gere sua ficha automaticamente."
                    color="blue"
                />
                <FeatureCard
                    icon={<Shield className="text-green-500" size={32} />}
                    title="Seguro"
                    description="Seus dados são protegidos com criptografia de ponta a ponta."
                    color="green"
                />
                <FeatureCard
                    icon={<CheckCircle className="text-purple-500" size={32} />}
                    title="100% Digital"
                    description="Assine digitalmente e envie tudo pela plataforma. Adeus papel!"
                    color="purple"
                />
            </section>
        </div>
    );
};

const FeatureCard = ({ icon, title, description, color }) => (
    <div className="glass-panel p-8 hover:-translate-y-2 transition-transform duration-300 group">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 bg-${color}-100 dark:bg-${color}-900/30 group-hover:scale-110 transition-transform duration-300`}>
            {icon}
        </div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-3">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{description}</p>
    </div>
);

export default Home;
