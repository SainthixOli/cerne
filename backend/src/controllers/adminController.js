const { getDb } = require('../config/database');
const auditService = require('../services/auditService');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

exports.getAuditLogs = async (req, res) => {
    try {
        // Ensure only super_admin can access
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Acesso negado. Apenas Super Admin.' });
        }
        const logs = await auditService.getLogs();
        res.json(logs);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createAdmin = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Acesso negado. Apenas Super Admin.' });
        }

        const { nome, cpf, email, password } = req.body;
        const db = await getDb();

        const existing = await db.get('SELECT id FROM profiles WHERE cpf = ?', [cpf]);
        if (existing) {
            return res.status(400).json({ error: 'CPF já cadastrado.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const id = uuidv4();

        await db.run(
            `INSERT INTO profiles(id, nome_completo, cpf, email, password_hash, role, status_conta)
             VALUES(?, ?, ?, ?, ?, 'admin', 'ativo')`,
            [id, nome, cpf, email, hashedPassword]
        );

        await auditService.logAction(req.user.id, 'CREATE_ADMIN', id, { nome, cpf });

        res.status(201).json({ message: 'Novo Admin criado com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.listAdmins = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Acesso negado.' });
        }
        const db = await getDb();
        const admins = await db.all("SELECT id, nome_completo, cpf, email, role, status_conta FROM profiles WHERE role IN ('admin', 'super_admin')");
        res.json(admins);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
