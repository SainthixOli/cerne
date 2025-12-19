import React, { useEffect, useState } from 'react';
import {
    PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
    BarChart, Bar, XAxis, YAxis, CartesianGrid,
    LineChart, Line, AreaChart, Area
} from 'recharts';
import { FileText, Users, Clock, AlertCircle, Download, Loader } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../../api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const AdminReports = () => {
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await api.get('/reports');
                setData(res.data);
            } catch (error) {
                console.error("Error fetching reports:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!data) return null;

    const { summary, charts } = data;

    // Cores para os gráficos
    const COLORS = ['#10B981', '#F59E0B', '#EF4444', '#3B82F6'];

    // Formatar status para exibição
    const formatStatus = (status) => {
        const map = {
            'concluido': 'Aprovado',
            'em_processamento': 'Em Análise',
            'em_analise': 'Em Análise',
            'rejeitado': 'Rejeitado',
            'pendente_docs': 'Pendente Docs'
        };
        return map[status] || status;
    };

    const pieData = charts.status.map(item => ({
        name: formatStatus(item.status),
        value: item.count
    }));

    const handleExportPDF = async () => {
        setExporting(true);
        try {
            // Verificação defensiva de importação
            const PDFConstructor = jsPDF.jsPDF || jsPDF;
            const doc = new PDFConstructor();

            const pageWidth = doc.internal.pageSize.width;

            // --- Cabeçalho ---
            doc.setFillColor(30, 64, 175); // Blue 800
            doc.rect(0, 0, pageWidth, 40, 'F');

            doc.setTextColor(255, 255, 255);
            doc.setFontSize(22);
            doc.setFont('helvetica', 'bold');
            doc.text("Relatório Executivo de Filiação", 20, 20);

            doc.setFontSize(12);
            doc.setFont('helvetica', 'normal');
            doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')} às ${new Date().toLocaleTimeString('pt-BR')}`, 20, 30);
            doc.text("Empresa X - Setor de Associações", pageWidth - 20, 30, { align: 'right' });

            let yPos = 50;

            // --- Resumo Executivo (KPIs) ---
            doc.setTextColor(0, 0, 0); // Black
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            doc.text("1. Resumo Executivo", 20, yPos);
            yPos += 10;

            // Tabela de KPI
            autoTable(doc, {
                startY: yPos,
                head: [['Métrica', 'Valor']],
                body: [
                    ['Total de Solicitações', summary.total],
                    ['Aprovados', summary.approved],
                    ['Rejeitados', summary.rejected],
                    ['Tempo Médio de Aprovação', `${summary.avgApprovalHours} horas`]
                ],
                theme: 'grid',
                headStyles: { fillColor: [59, 130, 246] }, // Blue 500
                styles: { fontSize: 12, cellPadding: 5 },
                columnStyles: { 0: { fontStyle: 'bold', width: 80 } }
            });

            yPos = doc.lastAutoTable.finalY + 20;

            // --- Detalhamento por Status ---
            doc.setFontSize(14);
            doc.text("2. Detalhamento por Status", 20, yPos);
            yPos += 10;

            autoTable(doc, {
                startY: yPos,
                head: [['Status', 'Quantidade', 'Percentual']],
                body: pieData.map(item => [
                    item.name,
                    item.value,
                    `${((item.value / summary.total) * 100).toFixed(1)}%`
                ]),
                theme: 'striped',
                headStyles: { fillColor: [16, 185, 129] }, // Emerald 500
            });

            yPos = doc.lastAutoTable.finalY + 20;

            // --- Evolução Mensal ---
            doc.setFontSize(14);
            doc.text("3. Evolução Mensal (Últimos 12 Meses)", 20, yPos);
            yPos += 10;

            const monthlyRows = charts.monthly.map(m => [m.month, m.count]);

            autoTable(doc, {
                startY: yPos,
                head: [['Mês', 'Novas Solicitações']],
                body: monthlyRows,
                theme: 'striped',
                headStyles: { fillColor: [245, 158, 11] }, // Amber 500
            });

            // Nota: Incorporar gráficos como imagens requer capturá-los primeiro.
            // Como o usuário deseja "Documento Padrão", tabelas de dados são frequentemente preferidas para relatórios estritos.
            // Mas podemos adicionar um espaço reservado ou texto simples dizendo "Visuais disponíveis no painel".
            // Ou podemos tentar capturar apenas a div do gráfico.
            // Por enquanto, as tabelas fornecem os "dados brutos" adequados para reuniões.

            // --- Rodapé ---
            const pageCount = doc.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                doc.setPage(i);
                doc.setFontSize(10);
                doc.setTextColor(150);
                doc.text(`Página ${i} de ${pageCount}`, pageWidth / 2, doc.internal.pageSize.height - 10, { align: 'center' });
            }

            doc.save('Relatorio_Executivo_Profissional.pdf');
            toast.success('Relatório exportado com sucesso!');

        } catch (err) {
            console.error(err);
            toast.error('Erro ao exportar PDF. Verifique o console.');
        } finally {
            setExporting(false);
        }
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 pb-10" id="report-content">
            {/* Cabeçalho */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                        Relatórios Avançados
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400">
                        Análise detalhada de desempenho e métricas de filiação.
                    </p>
                </div>
                <button
                    onClick={handleExportPDF}
                    disabled={exporting}
                    className="btn-primary flex items-center gap-2 px-6 py-3 shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {exporting ? <Loader className="animate-spin" size={20} /> : <Download size={20} />}
                    {exporting ? 'Gerando PDF...' : 'Exportar PDF'}
                </button>
            </div>

            {/* Cartões de KPI */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="glass-panel p-6 flex items-center gap-4">
                    <div className="p-3 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl">
                        <Users size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Total de Solicitações</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{summary.total}</h3>
                    </div>
                </div>

                <div className="glass-panel p-6 flex items-center gap-4">
                    <div className="p-3 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-xl">
                        <FileText size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Aprovados</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{summary.approved}</h3>
                    </div>
                </div>

                <div className="glass-panel p-6 flex items-center gap-4">
                    <div className="p-3 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400 rounded-xl">
                        <Clock size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Tempo Médio (Aprovação)</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{summary.avgApprovalHours}h</h3>
                    </div>
                </div>

                <div className="glass-panel p-6 flex items-center gap-4">
                    <div className="p-3 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded-xl">
                        <AlertCircle size={24} />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium">Rejeitados</p>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{summary.rejected}</h3>
                    </div>
                </div>
            </div>

            {/* Linha de Gráficos 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Tendência Mensal (Gráfico de Linha) */}
                <div className="glass-panel p-6 lg:col-span-2">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Evolução de Filiações (Últimos 12 Meses)</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={charts.monthly}>
                                <defs>
                                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3} />
                                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                                <XAxis dataKey="month" stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                                <YAxis stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                                <Tooltip
                                    contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.8)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)' }}
                                />
                                <Area type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                </div>

                {/* Distribuição de Status (Gráfico de Pizza) */}
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Distribuição por Status</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={pieData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {pieData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip />
                                <Legend verticalAlign="bottom" height={36} />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>

            {/* Linha de Gráficos 2 */}
            <div className="grid grid-cols-1 gap-8">
                {/* Motivos de Rejeição (Gráfico de Barras) */}
                <div className="glass-panel p-6">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Principais Motivos de Rejeição</h3>
                    <div className="h-80">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart data={charts.rejectionReasons} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke="#E5E7EB" />
                                <XAxis type="number" stroke="#9CA3AF" />
                                <YAxis dataKey="reason" type="category" width={150} stroke="#9CA3AF" tick={{ fontSize: 12 }} />
                                <Tooltip cursor={{ fill: 'transparent' }} />
                                <Bar dataKey="count" fill="#EF4444" radius={[0, 4, 4, 0]} barSize={20} />
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminReports;
