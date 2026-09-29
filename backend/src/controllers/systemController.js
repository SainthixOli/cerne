const os = require('os');
const { sendError } = require('../utils/apiResponse');
const systemRepository = require('../repositories/systemRepository');

exports.getSystemStats = async (req, res) => {
    try {
        if (req.user.role !== 'system_manager') {
            return res.status(403).json({ error: 'Acesso negado.' });
        }

        // 1. Tamanho do Banco de Dados
        const dbSizeMB = ((await systemRepository.databaseSizeBytes()) / (1024 * 1024)).toFixed(2);

        // 3. Uso de Memória
        const memoryUsage = process.memoryUsage();
        const memoryUsageMB = (memoryUsage.rss / (1024 * 1024)).toFixed(2);

        // 4. Carga da CPU (Aproximado com base na Média de Carga / Contagem de Núcleos)
        const cpus = os.cpus().length;
        const loadAvg = os.loadavg()[0];
        const cpuLoadPercent = Math.min(100, (loadAvg / cpus) * 100).toFixed(1);

        // 5. Contagens do Banco de Dados
        const counts = await systemRepository.counts(req.tenantId);

        res.json({
            storage: {
                database: `${dbSizeMB} MB`,
                uploads: 'Object storage privado',
                total: `${dbSizeMB} MB + objetos privados`
            },
            performance: {
                memory: `${memoryUsageMB} MB`,
                uptime: `${(process.uptime() / 60).toFixed(2)} minutes`,
                cpuLoad: `${cpuLoadPercent}%`
            },
            counts: {
                users: counts.users,
                affiliations: counts.affiliations,
                documents: counts.documents
            }
        });

    } catch (error) {
        console.error(error);
        return sendError(res, 500, undefined, 'SYSTEM_STATS_FAILED');
    }
};
exports.executeConsoleCommand = async (req, res) => {
    const { command } = req.body;
    const allowedCommands = ['status', 'help', 'logs', 'version', 'clear'];

    if (!allowedCommands.includes(command.split(' ')[0])) {
        return res.json({ output: `Command not found: ${command}` });
    }

    try {
        if (command === 'status') {
            await systemRepository.ping();

            return res.json({
                output: `System Status:\n[OK] Database Active\n[OK] Private Object Storage Configured\n[OK] Uptime: ${process.uptime().toFixed(0)}s`
            });
        }

        if (command === 'logs') {
            const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware
            const logs = await systemRepository.recentAffiliations(tenantId);
            const output = logs.map(l => `[${l.data_solicitacao}] User: ${l.user_id} Status: ${l.status}`).join('\n') || 'No recent logs.';
            return res.json({ output });
        }

        if (command === 'help') return res.json({ output: 'Available: status, logs, help' });

        return res.json({ output: '' });

    } catch (error) {
        return sendError(res, 500, undefined, 'CONSOLE_COMMAND_FAILED');
    }
};
