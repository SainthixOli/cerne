const fs = require('fs');
const path = require('path');
const os = require('os');
const { getDb } = require('../config/database');

const getFolderSize = (dirPath) => {
    let size = 0;
    if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
            const filePath = path.join(dirPath, file);
            const stats = fs.statSync(filePath);
            if (stats.isDirectory()) {
                size += getFolderSize(filePath);
            } else {
                size += stats.size;
            }
        }
    }
    return size;
};

exports.getSystemStats = async (req, res) => {
    try {
        if (req.user.role !== 'system_manager') {
            return res.status(403).json({ error: 'Acesso negado.' });
        }

        const dbPath = path.resolve(__dirname, '../../db/database.sqlite');
        const uploadsPath = path.resolve(__dirname, '../../uploads');

        // 1. Tamanho do Banco de Dados
        const dbStats = fs.statSync(dbPath);
        const dbSizeMB = (dbStats.size / (1024 * 1024)).toFixed(2);

        // 2. Tamanho da Pasta de Uploads
        const uploadsSize = getFolderSize(uploadsPath);
        const uploadsSizeMB = (uploadsSize / (1024 * 1024)).toFixed(2);

        // 3. Uso de Memória
        const memoryUsage = process.memoryUsage();
        const memoryUsageMB = (memoryUsage.rss / (1024 * 1024)).toFixed(2);

        // 4. Carga da CPU (Aproximado com base na Média de Carga / Contagem de Núcleos)
        const cpus = os.cpus().length;
        const loadAvg = os.loadavg()[0];
        const cpuLoadPercent = Math.min(100, (loadAvg / cpus) * 100).toFixed(1);

        // 5. Contagens do Banco de Dados
        const db = await getDb();
        const userCount = await db.get('SELECT COUNT(*) as count FROM profiles');
        const affiliationCount = await db.get('SELECT COUNT(*) as count FROM filiacoes');
        const documentCount = await db.get('SELECT COUNT(*) as count FROM documentos');

        res.json({
            storage: {
                database: `${dbSizeMB} MB`,
                uploads: `${uploadsSizeMB} MB`,
                total: `${(parseFloat(dbSizeMB) + parseFloat(uploadsSizeMB)).toFixed(2)} MB`
            },
            performance: {
                memory: `${memoryUsageMB} MB`,
                uptime: `${(process.uptime() / 60).toFixed(2)} minutes`,
                cpuLoad: `${cpuLoadPercent}%`
            },
            counts: {
                users: userCount.count,
                affiliations: affiliationCount.count,
                documents: documentCount.count
            }
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
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
            const uploadsDir = path.resolve(__dirname, '../../uploads');
            let uploadsWritable = false;
            try {
                require('fs').accessSync(uploadsDir, require('fs').constants.W_OK);
                uploadsWritable = true;
            } catch (e) { uploadsWritable = false; }

            const db = await getDb();
            await db.get('SELECT 1');

            return res.json({
                output: `System Status:\n[OK] Database Active\n[${uploadsWritable ? 'OK' : 'FAIL'}] Uploads Writable\n[OK] Uptime: ${process.uptime().toFixed(0)}s`
            });
        }

        if (command === 'logs') {
            const db = await getDb();
            const logs = await db.all(`SELECT data_solicitacao, user_id, status FROM filiacoes ORDER BY data_solicitacao DESC LIMIT 5`);
            const output = logs.map(l => `[${l.data_solicitacao}] User: ${l.user_id} Status: ${l.status}`).join('\n') || 'No recent logs.';
            return res.json({ output });
        }

        if (command === 'help') return res.json({ output: 'Available: status, logs, help' });

        return res.json({ output: '' });

    } catch (error) {
        res.status(500).json({ output: `Error: ${error.message}` });
    }
};
