const auditService = require('../services/auditService');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const { sendError } = require('../utils/apiResponse');
const adminRepository = require('../repositories/adminRepository');

exports.getAuditLogs = async (req, res) => {
    try {
        const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware
        let logs;

        if (req.user.role === 'super_admin') {
            // Super Admin: Vê tudo (do seu tenant)
            logs = await auditService.getLogs(tenantId); // Retorna tudo do tenant
        } else {
            logs = await auditService.getLogsForAdmin(req.user.id, tenantId);
        }
        res.json(logs);
    } catch (error) {
        return sendError(res, 500, undefined, 'AUDIT_LOG_READ_FAILED');
    }
};

exports.createAdmin = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Acesso negado. Apenas Super Admin.' });
        }

        const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware
        const { nome, cpf, email, password } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const id = uuidv4();
        const created = await adminRepository.createAdmin({
            id, name: nome, cpf, email, passwordHash: hashedPassword,
            tenantId, actorId: req.user.id
        });
        if (!created) return res.status(400).json({ error: 'CPF já cadastrado.' });

        res.status(201).json({ message: 'Novo Admin criado com sucesso.' });
    } catch (error) {
        return sendError(res, 500, undefined, 'ADMIN_CREATION_FAILED');
    }
};

exports.listAdmins = async (req, res) => {
    try {
        if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
            return res.status(403).json({ error: 'Acesso negado.' });
        }
        const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware
        const admins = await adminRepository.listAdmins(tenantId);
        res.json(admins);
    } catch (error) {
        return sendError(res, 500, undefined, 'ADMIN_LIST_FAILED');
    }
};

exports.getAdminPerformance = async (req, res) => {
    const { adminId, month } = req.query; // formato de mês 'AAAA-MM'
    const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Acesso negado.' });
        }
        const stats = await adminRepository.getPerformance(adminId, month, tenantId);

        res.json(stats || { approved: 0, rejected: 0 });
    } catch (error) {
        return sendError(res, 500, undefined, 'PERFORMANCE_READ_FAILED');
    }
};

exports.saveEvaluation = async (req, res) => {
    const { adminId, month, score, feedback } = req.body;
    const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware
    try {
        if (req.user.role !== 'super_admin') {
            return res.status(403).json({ error: 'Acesso negado.' });
        }
        const evaluatorId = req.user.id;
        await adminRepository.saveEvaluation({
            admin_id: adminId,
            evaluator_id: evaluatorId,
            month_ref: month,
            score,
            feedback,
            criteria_productivity: req.body.criteria_productivity || 0,
            criteria_quality: req.body.criteria_quality || 0,
            criteria_proactivity: req.body.criteria_proactivity || 0,
            criteria_punctuality: req.body.criteria_punctuality || 0,
            visible_to_collaborator: Boolean(req.body.visible),
            tenant_id: tenantId
        }, evaluatorId);

        res.json({ message: 'Avaliação salva com sucesso.' });
    } catch (error) {
        return sendError(res, 500, undefined, 'EVALUATION_SAVE_FAILED');
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
        const evaluations = await adminRepository.listEvaluations(
            adminId, tenantId, req.user.role === 'super_admin');

        res.json(evaluations);
    } catch (error) {
        return sendError(res, 500, undefined, 'EVALUATION_READ_FAILED');
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

        const updated = await adminRepository.updateAdminStatus(
            adminId, status, tenantId, req.user.id);
        if (!updated) return res.status(404).json({ error: 'Administrador não encontrado.' });

        res.json({ message: `Status atualizado para ${status}.` });
    } catch (error) {
        return sendError(res, 500, undefined, 'ADMIN_STATUS_UPDATE_FAILED');
    }
};
