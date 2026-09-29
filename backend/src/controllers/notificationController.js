const { v4: uuidv4 } = require('uuid');
const { sendError } = require('../utils/apiResponse');
const notificationRepository = require('../repositories/notificationRepository');
const knex = require('../config/connection');
const outboxService = require('../services/outboxService');

exports.createBroadcast = async (req, res) => {
    const { title, message, target_group } = req.body;
    const createdBy = req.user.id; // Admin
    const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware

    // Se for Super Admin, já aprova automaticamente?
    // Regra: "Admin manda, Super Admin aprova". Mas se quem manda É o Super Admin, faz sentido auto-aprovar.
    const isSuper = req.user.role === 'super_admin';
    const status = isSuper ? 'approved' : 'pending';
    const approvedBy = isSuper ? createdBy : null;

    try {
        const id = uuidv4();
        await knex.transaction(async (trx) => {
            await notificationRepository.create({
                id, title, message, target_group: target_group || 'all', status,
                created_by: createdBy, approved_by: approvedBy, tenant_id: tenantId
            }, trx);
            if (status === 'approved') {
                await outboxService.enqueue({
                    tenantId,
                    eventType: 'NOTIFICATION_APPROVED',
                    payload: { notificationId: id },
                    transaction: trx
                });
            }
        });

        res.status(201).json({ message: 'Broadcast created.', status });
    } catch (error) {
        return sendError(res, 500, undefined, 'BROADCAST_CREATE_FAILED');
    }
};

exports.listMyNotifications = async (req, res) => {
    const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware
    const role = req.user.role; // 'professor', 'admin', 'super_admin'

    try {
        const group = role === 'professor' ? 'professors' : 'admins';
        const notifications = await notificationRepository.listApprovedForGroup(group, tenantId);
        res.json(notifications);
    } catch (error) {
        return sendError(res, 500, undefined, 'NOTIFICATION_LIST_FAILED');
    }
};

exports.listPendingBroadcasts = async (req, res) => {
    // Apenas Super Admin vê isso
    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Access denied' });
    const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware

    try {
        const pending = await notificationRepository.listPending(tenantId);
        res.json(pending);
    } catch (error) {
        return sendError(res, 500, undefined, 'BROADCAST_LIST_FAILED');
    }
};

exports.approveBroadcast = async (req, res) => {
    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Access denied' });
    const { id } = req.params;
    const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware
    const superAdminId = req.user.id;

    try {
        await knex.transaction(async (trx) => {
            const updated = await notificationRepository.approve(id, superAdminId, tenantId, trx);
            if (updated !== 1) throw Object.assign(new Error('Broadcast not found'), { statusCode: 404 });
            await outboxService.enqueue({
                tenantId,
                eventType: 'NOTIFICATION_APPROVED',
                payload: { notificationId: id },
                transaction: trx
            });
        });
        res.json({ message: 'Broadcast approved and sent.' });
    } catch (error) {
        return sendError(res, 500, undefined, 'BROADCAST_APPROVAL_FAILED');
    }
};
exports.deleteBroadcast = async (req, res) => {
    if (req.user.role !== 'super_admin') return res.status(403).json({ error: 'Access denied' });
    const { id } = req.params;
    const tenantId = req.tenantId;  // ✅ NOVO: tenantId do middleware

    try {
        await notificationRepository.remove(id, tenantId);
        res.json({ message: 'Broadcast deleted successfully.' });
    } catch (error) {
        return sendError(res, 500, undefined, 'BROADCAST_DELETE_FAILED');
    }
};
