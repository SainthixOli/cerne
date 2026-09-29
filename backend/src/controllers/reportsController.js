const reportRepository = require('../repositories/reportRepository');

exports.getReports = async (req, res) => {
    try {
        const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware
        const [summary, monthlyStats, statusDistribution, rejectionReasons] = await Promise.all([
            reportRepository.summary(tenantId),
            reportRepository.monthly(tenantId),
            reportRepository.statusDistribution(tenantId),
            reportRepository.rejectionReasons(tenantId)
        ]);

        res.json({
            summary: {
                total: summary.total,
                pending: summary.pending,
                approved: summary.approved,
                rejected: summary.rejected,
                today: summary.today,
                avgApprovalHours: summary.avg_approval_hours
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
