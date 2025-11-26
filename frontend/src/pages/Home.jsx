import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, CheckCircle, Shield, Clock } from 'lucide-react';

const Home = () => {
    return (
        <div className="space-y-12">
            {/* Hero Section */}
            <section className="text-center py-16 bg-white rounded-2xl shadow-sm border border-gray-100">
                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6">
                    Filiação Digital Simplificada
                </h1>
                <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
                    Junte-se ao Sindicato de Professores de Luziânia de forma rápida, segura e 100% online. Sem papelada, sem burocracia.
                </p>
                <Link
                    to="/register"
                    className="inline-flex items-center px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl"
                >
                    Quero me Filiar
                    <ArrowRight className="ml-2" />
                </Link>
            </section>

            {/* Features */}
            <section className="grid md:grid-cols-3 gap-8">
                <FeatureCard
                    icon={<Clock className="text-blue-500" size={40} />}
                    title="Rápido e Fácil"
                    description="Preencha seus dados em poucos minutos e gere sua ficha automaticamente."
                />
                <FeatureCard
                    icon={<Shield className="text-green-500" size={40} />}
                    title="Seguro"
                    description="Seus dados são protegidos com criptografia de ponta a ponta."
                />
                <FeatureCard
                    icon={<CheckCircle className="text-purple-500" size={40} />}
                    title="100% Digital"
                    description="Assine digitalmente e envie tudo pela plataforma. Adeus papel!"
                />
            </section>
        </div>
    );
};

const FeatureCard = ({ icon, title, description }) => (
    <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
        <div className="mb-4">{icon}</div>
        <h3 className="text-xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600">{description}</p>
    </div>
);

export default Home;
