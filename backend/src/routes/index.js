const express = require('express');
const router = express.Router();
const affiliationController = require('../controllers/affiliationController');
const authController = require('../controllers/authController');
const documentController = require('../controllers/documentController');
const profileController = require('../controllers/profileController');
const reportsController = require('../controllers/reportsController');
const { upload, validateAndSaveUpload, saveUploadToStorage, SIZE_LIMITS } = require('../middlewares/upload');
const { authenticateToken } = require('../middlewares/auth');
const { requireRole, allowPublic } = require('../middlewares/requireRole');
const publicTenant = require('../middlewares/publicTenant');
const { checkResourceOwnership } = require('../middlewares/resourceOwnership');
const { requireUploadGrant } = require('../services/uploadGrant');
const { authorizeConversation } = require('../middlewares/conversationAccess');
// 🏢 NOVO: Importar middlewares de tenant
const { tenantMiddleware } = require('../middlewares/tenantMiddleware');
const { ensureTenantIsolation, validateResourceTenant } = require('../middlewares/tenantValidation');
const {
    authLimiter,
    passwordResetLimiter,
    changePasswordLimiter,
    adminOperationLimiter,
    uploadLimiter,
    publicLimiter,
    sensibleOperationLimiter,
} = require('../middlewares/rateLimiting');

const {
    loginSchema,
    changePasswordSchema,
    registerSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    affiliationStatusSchema,
    approveAffiliationSchema,
    rejectAffiliationSchema,
    transferAffiliationSchema,
    affiliationIdParamsSchema,
    userIdParamsSchema,
    documentIdParamsSchema,
    emptyBodySchema,
    affiliationChatSchema,
    updateProfileSchema,
    createAdminSchema,
    updateAdminStatusSchema,
    saveEvaluationSchema,
    startConversationSchema,
    sendMessageSchema,
    createBroadcastSchema,
    executeConsoleCommandSchema,
    adminIdParamsSchema,
    performanceQuerySchema,
    emptyQuerySchema,
    conversationParamsSchema,
    conversationQuerySchema,
    notificationIdParamsSchema
} = require('../validations/schemas');
const validate = require('../middlewares/validate');

const { checkReadiness } = require('../utils/healthCheck');

const ALL_ROLES = ['professor', 'admin', 'super_admin', 'system_manager'];
const MEMBER_ROLES = ['professor', 'admin', 'super_admin'];
const ADMIN_ROLES = ['admin', 'super_admin'];

router.get('/health/live', allowPublic, (_req, res) => {
    res.status(200).json({ status: 'UP', uptime: process.uptime() });
});
router.get('/health/ready', allowPublic, async (_req, res) => {
    const health = await checkReadiness();
    res.status(health.ready ? 200 : 503).json({ status: health.ready ? 'UP' : 'DOWN' });
});
router.get('/health', allowPublic, async (_req, res) => {
    const health = await checkReadiness();
    res.status(health.ready ? 200 : 503).json({
        status: health.ready ? 'UP' : 'DOWN',
        uptime: process.uptime()
    });
});

router.post('/auth/login', allowPublic, authLimiter, validate({ body: loginSchema }), publicTenant, authController.login);
router.get('/auth/session', authenticateToken, requireRole(...ALL_ROLES), authController.session);
router.post('/auth/logout', allowPublic, validate({ body: emptyBodySchema }), authController.logout);
router.post('/auth/change-password', authenticateToken, requireRole(...ALL_ROLES), changePasswordLimiter, validate({ body: changePasswordSchema }), authController.changePassword);
router.post('/auth/forgot-password', allowPublic, passwordResetLimiter, validate({ body: forgotPasswordSchema }), publicTenant, authController.forgotPassword);
router.post('/auth/reset-password', allowPublic, passwordResetLimiter, validate({ body: resetPasswordSchema }), publicTenant, authController.resetPassword);

router.post('/register', allowPublic, publicLimiter, validate({ body: registerSchema }), publicTenant, affiliationController.register);
router.post('/upload', 
    allowPublic,
    publicLimiter,
    uploadLimiter,
    publicTenant,
    requireUploadGrant,
    upload.single('file'),
    validate({ body: emptyBodySchema }),
    validateAndSaveUpload('file', SIZE_LIMITS.DOCUMENT),
    saveUploadToStorage(),
    affiliationController.uploadSignedForm
);

router.get('/affiliations', authenticateToken, requireRole(...ADMIN_ROLES), validate({ query: emptyQuerySchema }), tenantMiddleware, ensureTenantIsolation, affiliationController.getAllAffiliations);
router.get('/affiliations/:userId/history', authenticateToken, requireRole(...MEMBER_ROLES), validate({ params: userIdParamsSchema }), tenantMiddleware, checkResourceOwnership('userId'), affiliationController.getAffiliationHistory);
router.post('/affiliations/:id/approve', authenticateToken, requireRole(...ADMIN_ROLES), sensibleOperationLimiter, validate({ params: affiliationIdParamsSchema, body: approveAffiliationSchema }), tenantMiddleware, validateResourceTenant('filiacoes', 'id'), affiliationController.approveAffiliation);
router.post('/affiliations/:id/reject', authenticateToken, requireRole(...ADMIN_ROLES), sensibleOperationLimiter, validate({ params: affiliationIdParamsSchema, body: rejectAffiliationSchema }), tenantMiddleware, validateResourceTenant('filiacoes', 'id'), affiliationController.rejectAffiliation);
router.post('/affiliations/:id/assume', authenticateToken, requireRole(...ADMIN_ROLES), adminOperationLimiter, validate({ params: affiliationIdParamsSchema, body: emptyBodySchema }), tenantMiddleware, validateResourceTenant('filiacoes', 'id'), affiliationController.assumeAffiliation);
router.post('/affiliations/:id/transfer', authenticateToken, requireRole('super_admin'), sensibleOperationLimiter, validate({ params: affiliationIdParamsSchema, body: transferAffiliationSchema }), tenantMiddleware, validateResourceTenant('filiacoes', 'id'), affiliationController.transferAffiliation);
router.post('/affiliations/:id/request-transfer', authenticateToken, requireRole(...ADMIN_ROLES), adminOperationLimiter, validate({ params: affiliationIdParamsSchema, body: emptyBodySchema }), tenantMiddleware, validateResourceTenant('filiacoes', 'id'), affiliationController.requestTransfer);
router.post('/affiliations/:id/deny-transfer', authenticateToken, requireRole('super_admin'), sensibleOperationLimiter, validate({ params: affiliationIdParamsSchema, body: emptyBodySchema }), tenantMiddleware, validateResourceTenant('filiacoes', 'id'), affiliationController.denyTransferRequest);
router.post('/affiliations/status', allowPublic, publicLimiter, validate({ body: affiliationStatusSchema }), publicTenant, affiliationController.checkStatus);
router.get('/affiliations/certificate', authenticateToken, requireRole(...MEMBER_ROLES), tenantMiddleware, ensureTenantIsolation, affiliationController.getCertificate);

// Desfiliação / Reativação
router.post('/affiliations/request-disaffiliation', authenticateToken, requireRole('professor'), validate({ body: emptyBodySchema }), tenantMiddleware, affiliationController.requestDisaffiliation);
router.post('/affiliations/request-reactivation', authenticateToken, requireRole('professor'), validate({ body: emptyBodySchema }), tenantMiddleware, affiliationController.requestReactivation);
router.post('/affiliations/:id/approve-disaffiliation', authenticateToken, requireRole(...ADMIN_ROLES), validate({ params: affiliationIdParamsSchema, body: emptyBodySchema }), tenantMiddleware, validateResourceTenant('filiacoes', 'id'), affiliationController.approveDisaffiliation);
router.post('/affiliations/:id/approve-reactivation', authenticateToken, requireRole(...ADMIN_ROLES), validate({ params: affiliationIdParamsSchema, body: emptyBodySchema }), tenantMiddleware, validateResourceTenant('filiacoes', 'id'), affiliationController.approveReactivation);

router.get('/documents/my', authenticateToken, requireRole(...MEMBER_ROLES), tenantMiddleware, ensureTenantIsolation, documentController.getMyDocuments);
router.post('/documents', 
    authenticateToken,
    requireRole(...MEMBER_ROLES),
    tenantMiddleware,
    ensureTenantIsolation,
    upload.single('document'),
    validate({ body: emptyBodySchema }),
    validateAndSaveUpload('document', SIZE_LIMITS.DOCUMENT),
    saveUploadToStorage(),
    documentController.uploadDocument
);
router.post('/documents/template', 
    authenticateToken,
    requireRole(...ADMIN_ROLES),
    tenantMiddleware,
    ensureTenantIsolation,
    upload.single('document'),
    validate({ body: emptyBodySchema }),
    validateAndSaveUpload('document', SIZE_LIMITS.TEMPLATE),
    saveUploadToStorage(),
    documentController.uploadTemplate
);
router.get('/documents/:documentId', authenticateToken, requireRole(...MEMBER_ROLES), validate({ params: documentIdParamsSchema }), tenantMiddleware, documentController.serveDocument);

router.get('/profile', authenticateToken, requireRole(...ALL_ROLES), tenantMiddleware, profileController.getProfile);
router.put('/profile', authenticateToken, requireRole(...ALL_ROLES), validate({ body: updateProfileSchema }), tenantMiddleware, profileController.updateProfile);
router.get('/profile/photo', authenticateToken, requireRole(...ALL_ROLES), tenantMiddleware, profileController.servePhoto);
router.post('/profile/photo', 
    authenticateToken,
    requireRole(...ALL_ROLES),
    tenantMiddleware,
    upload.single('photo'),
    validate({ body: emptyBodySchema }),
    validateAndSaveUpload('photo', SIZE_LIMITS.PHOTO, ['image/jpeg', 'image/jpg', 'image/png']),
    saveUploadToStorage(),
    profileController.uploadPhoto
);

router.get('/reports', authenticateToken, requireRole(...ADMIN_ROLES), tenantMiddleware, ensureTenantIsolation, reportsController.getReports);

const adminController = require('../controllers/adminController');

router.get('/admin/audit', authenticateToken, requireRole(...ADMIN_ROLES), tenantMiddleware, ensureTenantIsolation, adminController.getAuditLogs);
router.get('/admin/users', authenticateToken, requireRole(...ADMIN_ROLES), tenantMiddleware, ensureTenantIsolation, adminController.listAdmins);
router.post('/admin/users', authenticateToken, requireRole('super_admin'), adminOperationLimiter, validate({ body: createAdminSchema }), tenantMiddleware, adminController.createAdmin);
router.put('/admin/users/:adminId/status', authenticateToken, requireRole('super_admin'), adminOperationLimiter, validate({ params: adminIdParamsSchema, body: updateAdminStatusSchema }), tenantMiddleware, validateResourceTenant('profiles', 'adminId'), adminController.updateAdminStatus);

const systemController = require('../controllers/systemController');
router.get('/system/stats', authenticateToken, requireRole('system_manager'), tenantMiddleware, ensureTenantIsolation, systemController.getSystemStats);
router.post('/system/console', authenticateToken, requireRole('system_manager'), sensibleOperationLimiter, validate({ body: executeConsoleCommandSchema }), tenantMiddleware, systemController.executeConsoleCommand);

// Avaliação e Desempenho do Admin
router.get('/admin/performance', authenticateToken, requireRole('super_admin'), validate({ query: performanceQuerySchema }), tenantMiddleware, ensureTenantIsolation, adminController.getAdminPerformance);
router.post('/admin/evaluation', authenticateToken, requireRole('super_admin'), adminOperationLimiter, validate({ body: saveEvaluationSchema }), tenantMiddleware, adminController.saveEvaluation);
router.get('/admin/evaluation/:adminId', authenticateToken, requireRole(...ADMIN_ROLES), validate({ params: adminIdParamsSchema }), tenantMiddleware, adminController.getEvaluations);

// Chat de Filiação
router.get('/affiliations/:id/chat', authenticateToken, requireRole(...MEMBER_ROLES), validate({ params: affiliationIdParamsSchema }), tenantMiddleware, validateResourceTenant('filiacoes', 'id'), affiliationController.getChatMessages);
router.post('/affiliations/:id/chat', authenticateToken, requireRole(...MEMBER_ROLES), sensibleOperationLimiter, validate({ params: affiliationIdParamsSchema, body: affiliationChatSchema }), tenantMiddleware, validateResourceTenant('filiacoes', 'id'), affiliationController.sendChatMessage);

const chatController = require('../controllers/chatController');
router.post('/chat/start', authenticateToken, requireRole(...MEMBER_ROLES), sensibleOperationLimiter, validate({ body: startConversationSchema }), tenantMiddleware, chatController.startConversation);
router.get('/chat/conversations', authenticateToken, requireRole(...MEMBER_ROLES), validate({ query: conversationQuerySchema }), tenantMiddleware, ensureTenantIsolation, chatController.listConversations);
router.get('/chat/:conversationId/messages', authenticateToken, requireRole(...MEMBER_ROLES), validate({ params: conversationParamsSchema }), tenantMiddleware, authorizeConversation({ write: false }), chatController.getMessages);
router.post('/chat/:conversationId/messages', authenticateToken, requireRole(...MEMBER_ROLES), sensibleOperationLimiter, validate({ params: conversationParamsSchema, body: sendMessageSchema }), tenantMiddleware, authorizeConversation({ write: true }), chatController.sendMessage);
router.get('/chat/admins', authenticateToken, requireRole(...MEMBER_ROLES), tenantMiddleware, ensureTenantIsolation, chatController.getAvailableAdmins);

const notificationController = require('../controllers/notificationController');
router.post('/notifications/broadcast', authenticateToken, requireRole(...ADMIN_ROLES), adminOperationLimiter, validate({ body: createBroadcastSchema }), tenantMiddleware, notificationController.createBroadcast);
router.delete('/notifications/:id', authenticateToken, requireRole('super_admin'), adminOperationLimiter, validate({ params: notificationIdParamsSchema }), tenantMiddleware, validateResourceTenant('notifications', 'id'), notificationController.deleteBroadcast);
router.post('/notifications/:id/approve', authenticateToken, requireRole('super_admin'), adminOperationLimiter, validate({ params: notificationIdParamsSchema, body: emptyBodySchema }), tenantMiddleware, validateResourceTenant('notifications', 'id'), notificationController.approveBroadcast);
router.get('/notifications/pending', authenticateToken, requireRole('super_admin'), tenantMiddleware, ensureTenantIsolation, notificationController.listPendingBroadcasts);
router.get('/notifications/my', authenticateToken, requireRole(...MEMBER_ROLES), tenantMiddleware, ensureTenantIsolation, notificationController.listMyNotifications);

const settingsRoutes = require('./settingsRoutes');
router.use('/settings', settingsRoutes);

// Security Alerts Routes (Phase 2 - Admin Técnico Dashboard)
const securityRoutes = require('./securityRoutes');
router.use('/admin/security', securityRoutes);

module.exports = router;
