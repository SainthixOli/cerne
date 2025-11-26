const { getDb } = require('../config/database');

exports.getReports = async (req, res) => {
    try {
        const db = await getDb();

        // Total stats
        const total = await db.get('SELECT COUNT(*) as count FROM filiacoes');
        const pending = await db.get("SELECT COUNT(*) as count FROM filiacoes WHERE status IN ('em_analise', 'em_processamento')");
        const approved = await db.get("SELECT COUNT(*) as count FROM filiacoes WHERE status = 'concluido'");

        // Mock "Today" for now as we don't have created_at in filiacoes in the schema provided explicitly or it might be data_solicitacao
        // Let's assume data_solicitacao is the date
        const today = new Date().toISOString().split('T')[0];
        const newToday = await db.get("SELECT COUNT(*) as count FROM filiacoes WHERE date(data_solicitacao) = ?", [today]);

        res.json({
            total: total.count,
            pending: pending.count,
            approved: approved.count,
            today: newToday.count
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Erro ao gerar relatórios' });
    }
};
