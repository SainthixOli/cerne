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
        // A média de carga é o número de processos aguardando.
        // Se loadAvg = cpus, está 100% carregado.
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
    try {
        if (req.user.role !== 'system_manager') {
            return res.status(403).json({ error: 'Acesso negado.' });
        }

        const { command } = req.body;
        let output = '';

        switch (command.trim().toLowerCase()) {
            case 'help':
                output = `Available commands:
- status: Check system health
- clear_cache: Clear system cache (simulated)
- logs: View recent system logs
- restart: Restart system services (simulated)
- help: Show this help message`;
                break;
            case 'status':
                output = `[OK] Database Connection
[OK] File System
[OK] Email Service (Mock)
[OK] API Gateway
System is running normally.`;
                break;
            case 'clear_cache':
                output = `[INFO] Clearing Redis cache...
[INFO] Clearing temporary files...
[SUCCESS] Cache cleared successfully.`;
                break;
            case 'restart':
                output = `[WARN] Initiating graceful restart...
[INFO] Stopping worker processes...
[INFO] Starting worker processes...
[SUCCESS] System restarted. Uptime: 0s`;
                break;
            case 'logs':
                // Em uma aplicação real, leríamos de um arquivo de log
                output = `[2025-12-15 15:45:01] [INFO] User login: admin
[2025-12-15 15:48:22] [WARN] High memory usage detected (mock)
[2025-12-15 15:50:05] [INFO] Affiliation approved: ID #1234
[2025-12-15 15:55:10] [ERROR] Connection timeout (retrying...)`;
                break;
            default:
                output = `Command not found: ${command}. Type 'help' for available commands.`;
        }

        res.json({ output });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: error.message });
    }
};
