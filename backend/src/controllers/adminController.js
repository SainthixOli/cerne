const { getDb } = require('../config/database');
const auditService = require('../services/auditService');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

exports.getAuditLogs = async (req, res) => {
    try {
        const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware
        const db = await getDb();
        let logs;

        if (req.user.role === 'super_admin') {
            // Super Admin: Vê tudo (do seu tenant)
            logs = await auditService.getLogs(tenantId); // Retorna tudo do tenant
        } else {
            // Regular Admin: Vê suas ações E ações onde ele foi o alvo (ex: Transferência)
            // Query direta é mais rápido para agora.
            logs = await db.all(`
                SELECT a.*, p.nome_completo as admin_name 
                FROM audit_logs a
                LEFT JOIN profiles p ON a.admin_id = p.id AND p.tenant_id = ?
                WHERE a.tenant_id = ? AND (a.admin_id = ? 
                OR a.details LIKE ?)
                ORDER BY a.created_at DESC
            `, [tenantId, tenantId, req.user.id, `%"to":"${req.user.id}"%`]);
        }
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

        const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware
        const { nome, cpf, email, password } = req.body;
        const db = await getDb();

        const existing = await db.get('SELECT id FROM profiles WHERE cpf = ? AND tenant_id = ?', [cpf, tenantId]);
        if (existing) {
            return res.status(400).json({ error: 'CPF já cadastrado.' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const id = uuidv4();

        await db.run(
            `INSERT INTO profiles(id, nome_completo, cpf, email, password_hash, role, status_conta, tenant_id)
             VALUES(?, ?, ?, ?, ?, 'admin', 'ativo', ?)`,
            [id, nome, cpf, email, hashedPassword, tenantId]
        );

        await auditService.logAction(req.user.id, 'CREATE_ADMIN', id, { nome, cpf }, tenantId);

        res.status(201).json({ message: 'Novo Admin criado com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.listAdmins = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado.' });
        }
        const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware
        const db = await getDb();
        const admins = await db.all("SELECT id, nome_completo, cpf, email, role, status_conta FROM profiles WHERE role IN ('admin', 'super_admin') AND tenant_id = ?", [tenantId]);
        res.json(admins);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getAdminPerformance = async (req, res) => {
    const { adminId, month } = req.query; // formato de mês 'AAAA-MM'
    const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware
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
            AND tenant_id = ?
        `, [adminId, month, tenantId]);

        res.json(stats || { approved: 0, rejected: 0 });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.saveEvaluation = async (req, res) => {
    const { adminId, month, score, feedback } = req.body;
    const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Acesso negado.' });
        }
        const db = await getDb();
        const evaluatorId = req.user.id;

        await db.run(`
            INSERT INTO admin_evaluations (
                admin_id, evaluator_id, month_ref, score, feedback,
                criteria_productivity, criteria_quality, criteria_proactivity, criteria_punctuality,
                visible_to_collaborator, tenant_id
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(admin_id, month_ref, tenant_id) DO UPDATE SET
            score = excluded.score,
            feedback = excluded.feedback,
            evaluator_id = excluded.evaluator_id,
            criteria_productivity = excluded.criteria_productivity,
            criteria_quality = excluded.criteria_quality,
            criteria_proactivity = excluded.criteria_proactivity,
            criteria_punctuality = excluded.criteria_punctuality,
            visible_to_collaborator = excluded.visible_to_collaborator
        `, [
            adminId, evaluatorId, month, score, feedback,
            req.body.criteria_productivity || 0,
            req.body.criteria_quality || 0,
            req.body.criteria_proactivity || 0,
            req.body.criteria_punctuality || 0,
            req.body.visible ? 1 : 0,
            tenantId
        ]);

        // Auditoria
        await auditService.logAction(evaluatorId, 'EVALUATE_ADMIN', adminId, { month, score }, tenantId);

        res.json({ message: 'Avaliação salva com sucesso.' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getEvaluations = async (req, res) => {
    const { adminId } = req.params;
    const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware
    console.log(`[AdminController] getEvaluations. Requester: ${req.user.id} (${req.user.role}), Target: ${adminId}`);
    try {
        if (req.user.role !== 'super_admin' && req.user.id !== adminId) {
            // Admins podem ver suas próprias? O usuário não disse estritamente, mas implicou.
            // Então sim, o Admin deve ver os seus.
            return res.status(403).json({ error: 'Acesso negado.' });
        }
        const db = await getDb();

        let query = `
            SELECT e.*, p.nome_completo as evaluator_name
            FROM admin_evaluations e
            LEFT JOIN profiles p ON e.evaluator_id = p.id AND p.tenant_id = ?
            WHERE e.admin_id = ? AND e.tenant_id = ?
        `;

        // If not super_admin, only show visible evaluations
        if (req.user.role !== 'super_admin') {
            query += ` AND e.visible_to_collaborator = 1`;
        }

        query += ` ORDER BY e.month_ref DESC`;

        const evaluations = await db.all(query, [tenantId, adminId, tenantId]);

        res.json(evaluations);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateAdminStatus = async (req, res) => {
    const { adminId } = req.params;
    const { status } = req.body; // 'ativo' or 'inativo'
    const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware

    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Acesso negado. Apenas Super Admin.' });
        }

        if (!['ativo', 'inativo'].includes(status)) {
            return res.status(400).json({ error: 'Status inválido. Use "ativo" ou "inativo".' });
        }

        const db = await getDb();
        await db.run('UPDATE profiles SET status_conta = ? WHERE id = ? AND tenant_id = ?', [status, adminId, tenantId]);

        await auditService.logAction(req.user.id, 'UPDATE_ADMIN_STATUS', adminId, { status }, tenantId);

        res.json({ message: `Status atualizado para ${status}.` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
