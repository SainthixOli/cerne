const { getDb } = require('../config/database');
const auditService = require('../services/auditService');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

exports.getAuditLogs = async (req, res) => {
    try {
        // Garantir que apenas super_admin possa acessar
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

exports.getAdminPerformance = async (req, res) => {
    const { adminId, month } = req.query; // formato de mês 'AAAA-MM'
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Acesso negado.' });
        }
        const db = await getDb();

        // Contar aprovações e rejeições para este administrador no mês (com base na data de aprovação)
        const stats = await db.get(`
            SELECT 
                SUM(CASE WHEN status = 'concluido' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN status = 'rejeitado' THEN 1 ELSE 0 END) as rejected
            FROM filiacoes 
            WHERE aprovado_por_admin_id = ? 
            AND strftime('%Y-%m', data_aprovacao) = ?
        `, [adminId, month]);

        res.json(stats || { approved: 0, rejected: 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.saveEvaluation = async (req, res) => {
    const { adminId, month, score, feedback } = req.body;
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Acesso negado.' });
        }
        const db = await getDb();
        const evaluatorId = req.user.id;

        await db.run(`
            INSERT INTO admin_evaluations (admin_id, evaluator_id, month_ref, score, feedback)
            VALUES (?, ?, ?, ?, ?)
            ON CONFLICT(admin_id, month_ref) DO UPDATE SET
            score = excluded.score,
            feedback = excluded.feedback,
            evaluator_id = excluded.evaluator_id
        `, [adminId, evaluatorId, month, score, feedback]);

        // Auditoria
        await auditService.logAction(evaluatorId, 'EVALUATE_ADMIN', adminId, { month, score });

        res.json({ message: 'Avaliação salva com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getEvaluations = async (req, res) => {
    const { adminId } = req.params;
    try {
        if (req.user.role !== 'super_admin' && req.user.id !== adminId) {
            // Admins podem ver suas próprias? O usuário não disse estritamente, mas implicou.
            // Então sim, o Admin deve ver os seus.
            return res.status(403).json({ error: 'Acesso negado.' });
        }
        const db = await getDb();
        const evaluations = await db.all(`
            SELECT e.*, p.nome_completo as evaluator_name
            FROM admin_evaluations e
            LEFT JOIN profiles p ON e.evaluator_id = p.id
            WHERE e.admin_id = ?
            ORDER BY e.month_ref DESC
        `, [adminId]);

        res.json(evaluations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateAdminStatus = async (req, res) => {
    const { adminId } = req.params;
    const { status } = req.body; // 'ativo' or 'inativo'

    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Acesso negado. Apenas Super Admin.' });
        }

        if (!['ativo', 'inativo'].includes(status)) {
            return res.status(400).json({ error: 'Status inválido. Use "ativo" ou "inativo".' });
        }

        const db = await getDb();
        await db.run('UPDATE profiles SET status_conta = ? WHERE id = ?', [status, adminId]);

        await auditService.logAction(req.user.id, 'UPDATE_ADMIN_STATUS', adminId, { status });

        res.json({ message: `Status atualizado para ${status}.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
