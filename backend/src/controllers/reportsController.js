const { getDb } = require('../config/database');

exports.getReports = async (req, res) => {
    try {
        const db = await getDb();

        // 1. Estatísticas Totais
        const total = await db.get('SELECT COUNT(*) as count FROM filiacoes');
        const pending = await db.get("SELECT COUNT(*) as count FROM filiacoes WHERE status IN ('em_analise', 'em_processamento')");
        const approved = await db.get("SELECT COUNT(*) as count FROM filiacoes WHERE status = 'concluido'");
        const rejected = await db.get("SELECT COUNT(*) as count FROM filiacoes WHERE status = 'rejeitado'");
        const todayCount = await db.get("SELECT COUNT(*) as count FROM filiacoes WHERE date(data_solicitacao) = date('now')");

        // 2. Estatísticas Mensais (Gráfico de Linha)
        // Agrupar por AAAA-MM
        const monthlyStats = await db.all(`
            SELECT strftime('%Y-%m', data_solicitacao) as month, COUNT(*) as count 
            FROM filiacoes 
            GROUP BY month 
            ORDER BY month ASC 
            LIMIT 12
        `);

        // 3. Distribuição de Status (Gráfico de Pizza)
        const statusDistribution = await db.all(`
            SELECT status, COUNT(*) as count 
            FROM filiacoes 
            GROUP BY status
        `);

        // 4. Tempo Médio de Aprovação (Gráfico de Barras - Contexto simulado se data_aprovacao for nula, mas tentamos calcular)
        // SQLite não tem diff fácil, então buscamos linhas e calculamos em JS ou usamos julianday
        const approvalTimes = await db.all(`
            SELECT 
                (julianday(data_aprovacao) - julianday(data_solicitacao)) * 24 as hours_diff
            FROM filiacoes 
            WHERE status = 'concluido' AND data_aprovacao IS NOT NULL
        `);

        const avgApprovalHours = approvalTimes.length > 0
            ? (approvalTimes.reduce((acc, curr) => acc + curr.hours_diff, 0) / approvalTimes.length).toFixed(1)
            : 0;

        // 5. Motivos de Rejeição (Gráfico de Barras)
        // Agrupamos pelo texto. Se for texto livre, pode ser bagunçado, mas é um começo.
        // Limitamos aos top 5 motivos comuns.
        const rejectionReasons = await db.all(`
            SELECT observacoes_admin as reason, COUNT(*) as count 
            FROM filiacoes 
            WHERE status = 'rejeitado' 
            GROUP BY reason 
            ORDER BY count DESC 
            LIMIT 5
        `);

        res.json({
            summary: {
                total: total.count,
                pending: pending.count,
                approved: approved.count,
                rejected: rejected.count,
                today: todayCount?.count || 0,
                avgApprovalHours: avgApprovalHours
            },
            charts: {
                monthly: monthlyStats,
                status: statusDistribution,
                rejectionReasons: rejectionReasons
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao gerar relatórios' });
    }
};
