
import React, { useEffect, useState } from 'react';
import api from '../api';
import { Star, Calendar, Activity, Zap, Award, Lightbulb, Clock, TrendingUp } from 'lucide-react';

const EvaluationHistory = ({ userId }) => {
    const [evaluations, setEvaluations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchEvaluations = async () => {
            if (!userId) return;
            try {
                const res = await api.get(`/admin/evaluation/${userId}`);
                setEvaluations(res.data);
            } catch (error) {
                console.error("Failed to load evaluations", error);
            } finally {
                setLoading(false);
            }
        };
        fetchEvaluations();
    }, [userId]);

    if (loading) return (
        <div className="flex gap-4 overflow-hidden">
            {[1, 2].map(i => (
                <div key={i} className="animate-pulse flex-1 h-48 bg-gray-100 dark:bg-white/5 rounded-2xl"></div>
            ))}
        </div>
    );

    if (evaluations.length === 0) return (
        <div className="text-center p-8 bg-gray-50/50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
                <Activity className="text-gray-400" size={32} />
            </div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Sem Avaliações Recebidas</h3>
            <p className="text-sm text-gray-500">Seu histórico de desempenho aparecerá aqui.</p>
        </div>
    );

    const getScoreColor = (score) => {
        if (score >= 4.5) return 'text-green-500 from-green-500 to-emerald-500';
        if (score >= 4.0) return 'text-blue-500 from-blue-500 to-indigo-500';
        if (score >= 3.0) return 'text-yellow-500 from-yellow-500 to-amber-500';
        return 'text-red-500 from-red-500 to-orange-500';
    };

    const ProgressBar = ({ value, label, icon: Icon, colorClass }) => (
        <div>
            <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-1.5 text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <Icon size={12} strokeWidth={3} /> {label}
                </div>
                <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{value}/5</span>
            </div>
            <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                <div
                    className={`h-full rounded-full bg-gradient-to-r ${colorClass}`}
                    style={{ width: `${(value / 5) * 100}%` }}
                ></div>
            </div>
        </div>
    );

    return (
        <div className="space-y-6">
            {evaluations.map((ev, index) => {
                const scoreColor = getScoreColor(ev.score);
                const bgGradient = ev.score >= 4.5
                    ? 'bg-gradient-to-br from-green-50/80 to-emerald-50/80 dark:from-green-900/10 dark:to-emerald-900/10 border-green-200 dark:border-green-900/50'
                    : 'bg-white/80 dark:bg-white/5 border-gray-200 dark:border-white/10';

                return (
                    <div key={ev.id} className={`p-6 rounded-2xl border backdrop-blur-sm transition-all hover:shadow-lg hover:scale-[1.01] duration-300 ${bgGradient}`}>
                        <div className="flex flex-col md:flex-row gap-6 items-start">
                            {/* Left: Score Badge */}
                            <div className="flex-shrink-0 flex flex-col items-center justify-center p-4 bg-white dark:bg-gray-900/50 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm min-w-[120px]">
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-wide mb-1">Geral</span>
                                <div className={`text-4xl font-black bg-clip-text text-transparent bg-gradient-to-br ${scoreColor}`}>
                                    {ev.score.toFixed(1)}
                                </div>
                                <div className="flex gap-0.5 mt-2">
                                    {[1, 2, 3, 4, 5].map(star => (
                                        <Star
                                            key={star}
                                            size={12}
                                            className={`${ev.score >= star ? `fill-current ${scoreColor.split(' ')[0]}` : 'text-gray-200 dark:text-gray-700'}`}
                                        />
                                    ))}
                                </div>
                            </div>

                            {/* Middle: Info & Criteria */}
                            <div className="flex-grow w-full">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h4 className="text-xl font-bold text-gray-900 dark:text-white capitalize">
                                            {new Date(ev.month_ref + '-02').toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                        </h4>
                                        <p className="text-sm text-gray-500">
                                            Avaliado por <span className="font-medium text-gray-700 dark:text-gray-300">{ev.evaluator_name || 'Super Admin'}</span>
                                        </p>
                                    </div>
                                    <div className="px-3 py-1 rounded-full bg-gray-100 dark:bg-white/10 text-xs font-bold text-gray-600 dark:text-gray-400">
                                        #{evaluations.length - index}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
                                    <ProgressBar
                                        value={ev.criteria_productivity || 0}
                                        label="Produtividade"
                                        icon={Zap}
                                        colorClass="from-blue-500 to-cyan-500"
                                    />
                                    <ProgressBar
                                        value={ev.criteria_quality || 0}
                                        label="Qualidade"
                                        icon={Award}
                                        colorClass="from-purple-500 to-pink-500"
                                    />
                                    <ProgressBar
                                        value={ev.criteria_proactivity || 0}
                                        label="Proatividade"
                                        icon={Lightbulb}
                                        colorClass="from-yellow-400 to-orange-500"
                                    />
                                    <ProgressBar
                                        value={ev.criteria_punctuality || 0}
                                        label="Assiduidade"
                                        icon={Clock}
                                        colorClass="from-green-500 to-teal-500"
                                    />
                                </div>

                                {ev.feedback && (
                                    <div className="bg-gray-50 dark:bg-black/30 p-4 rounded-xl border border-gray-100 dark:border-white/5 relative">
                                        <div className="absolute top-4 left-4 text-gray-200 dark:text-gray-700">
                                            <i className="fas fa-quote-left text-2xl"></i>
                                            {/* Using Lucide quote instead if fa not available, but styled box implies quote */}
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300 text-sm leading-relaxed italic relative z-10 pl-2 border-l-2 border-purple-500">
                                            "{ev.feedback}"
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
};

export default EvaluationHistory;
