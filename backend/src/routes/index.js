const express = require('express');
const router = express.Router();
const affiliationController = require('../controllers/affiliationController');
const authController = require('../controllers/authController');
const documentController = require('../controllers/documentController');
const profileController = require('../controllers/profileController');
const reportsController = require('../controllers/reportsController');
const { upload, validateAndSaveUpload, saveUploadToDisk, SIZE_LIMITS } = require('../middlewares/upload');
const { authenticateToken, authenticateTokenOptional, checkAdmin } = require('../middlewares/auth');  // ✅ NOVO: importar checkAdmin
const { checkResourceOwnership, checkDocumentOwnership } = require('../middlewares/resourceOwnership');
// 🏢 NOVO: Importar middlewares de tenant
const { tenantMiddleware } = require('../middlewares/tenantMiddleware');
const { ensureTenantIsolation, validateResourceTenant } = require('../middlewares/tenantValidation');
const { auditTenantAction } = require('../middlewares/tenantSecurity');
const {
    globalLimiter,
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
    requestTransferSchema,
    requestDisaffiliationSchema,
    requestReactivationSchema,
    updateProfileSchema,
    createAdminSchema,
    updateAdminStatusSchema,
    saveEvaluationSchema,
    startConversationSchema,
    sendMessageSchema,
    createBroadcastSchema,
    approveBroadcastSchema,
    executeConsoleCommandSchema
} = require('../validations/schemas');
const validate = require('../middlewares/validate');

const { runHealthCheck } = require('../utils/healthCheck');

router.get('/health', async (req, res) => {
    const isHealthy = await runHealthCheck();
    if (isHealthy) {
        res.status(200).json({ status: 'UP', uptime: process.uptime() });
    } else {
        res.status(503).json({ status: 'DOWN' });
    }
});

router.post('/auth/login', authLimiter, authController.login);
router.post('/auth/change-password', authenticateToken, changePasswordLimiter, authController.changePassword);
router.post('/auth/forgot-password', passwordResetLimiter, authController.forgotPassword);
router.post('/auth/reset-password', passwordResetLimiter, authController.resetPassword);

router.post('/register', publicLimiter, affiliationController.register);
router.post('/upload', 
    publicLimiter,
    uploadLimiter,
    upload.single('file'), 
    validateAndSaveUpload('file', SIZE_LIMITS.DOCUMENT),
    saveUploadToDisk(),
    affiliationController.uploadSignedForm
);

router.get('/affiliations', authenticateToken, tenantMiddleware, ensureTenantIsolation, affiliationController.getAllAffiliations);
router.get('/affiliations/:userId/history', authenticateToken, tenantMiddleware, checkResourceOwnership('userId'), affiliationController.getAffiliationHistory);
router.post('/affiliations/:id/approve', authenticateToken, tenantMiddleware, validateResourceTenant('filiacoes', 'id'), sensibleOperationLimiter, affiliationController.approveAffiliation);
router.post('/affiliations/:id/reject', authenticateToken, tenantMiddleware, validateResourceTenant('filiacoes', 'id'), sensibleOperationLimiter, affiliationController.rejectAffiliation);
router.post('/affiliations/:id/assume', authenticateToken, tenantMiddleware, validateResourceTenant('filiacoes', 'id'), adminOperationLimiter, affiliationController.assumeAffiliation);
router.post('/affiliations/:id/transfer', authenticateToken, tenantMiddleware, validateResourceTenant('filiacoes', 'id'), sensibleOperationLimiter, affiliationController.transferAffiliation);
router.post('/affiliations/:id/request-transfer', authenticateToken, tenantMiddleware, validateResourceTenant('filiacoes', 'id'), adminOperationLimiter, affiliationController.requestTransfer);
router.post('/affiliations/:id/deny-transfer', authenticateToken, tenantMiddleware, validateResourceTenant('filiacoes', 'id'), sensibleOperationLimiter, affiliationController.denyTransferRequest);
router.post('/affiliations/status', publicLimiter, affiliationController.checkStatus); // Public - sem tenant
router.get('/affiliations/certificate', authenticateToken, tenantMiddleware, ensureTenantIsolation, affiliationController.getCertificate);

// Desfiliação / Reativação
router.post('/affiliations/request-disaffiliation', authenticateToken, tenantMiddleware, affiliationController.requestDisaffiliation);
router.post('/affiliations/request-reactivation', authenticateToken, tenantMiddleware, affiliationController.requestReactivation);
router.post('/affiliations/:id/approve-disaffiliation', authenticateToken, tenantMiddleware, validateResourceTenant('filiacoes', 'id'), affiliationController.approveDisaffiliation);
router.post('/affiliations/:id/approve-reactivation', authenticateToken, tenantMiddleware, validateResourceTenant('filiacoes', 'id'), affiliationController.approveReactivation);

router.get('/documents/my', authenticateToken, tenantMiddleware, ensureTenantIsolation, documentController.getMyDocuments);
router.post('/documents', 
    authenticateToken,
    tenantMiddleware,
    ensureTenantIsolation,
    upload.single('document'), 
    validateAndSaveUpload('document', SIZE_LIMITS.DOCUMENT),
    saveUploadToDisk(),
    documentController.uploadDocument
);
router.post('/documents/template', 
    authenticateToken,
    tenantMiddleware,
    ensureTenantIsolation,
    upload.single('document'), 
    validateAndSaveUpload('document', SIZE_LIMITS.TEMPLATE),
    saveUploadToDisk(),
    documentController.uploadTemplate
);
router.get('/documents/:filename', authenticateToken, tenantMiddleware, checkDocumentOwnership, documentController.serveDocument);

router.get('/profile', authenticateToken, tenantMiddleware, checkResourceOwnership('id'), profileController.getProfile);
router.put('/profile', authenticateToken, tenantMiddleware, checkResourceOwnership('id'), profileController.updateProfile);
router.post('/profile/photo', 
    authenticateToken,
    tenantMiddleware,
    checkResourceOwnership('id'),
    upload.single('photo'), 
    validateAndSaveUpload('photo', SIZE_LIMITS.PHOTO),
    saveUploadToDisk(),
    profileController.uploadPhoto
);

router.get('/reports', authenticateToken, tenantMiddleware, ensureTenantIsolation, reportsController.getReports);

const adminController = require('../controllers/adminController');

router.get('/admin/audit', authenticateToken, tenantMiddleware, ensureTenantIsolation, adminController.getAuditLogs);
router.get('/admin/users', authenticateToken, tenantMiddleware, ensureTenantIsolation, adminController.listAdmins);
router.post('/admin/users', authenticateToken, tenantMiddleware, adminController.createAdmin);
router.put('/admin/users/:adminId/status', authenticateToken, tenantMiddleware, validateResourceTenant('profiles', 'adminId'), adminController.updateAdminStatus);

const systemController = require('../controllers/systemController');
router.get('/system/stats', authenticateToken, tenantMiddleware, ensureTenantIsolation, systemController.getSystemStats);
router.post('/system/console', authenticateToken, tenantMiddleware, checkAdmin, systemController.executeConsoleCommand);  // ✅ NOVO: usar checkAdmin middleware

// Avaliação e Desempenho do Admin
router.get('/admin/performance', authenticateToken, tenantMiddleware, ensureTenantIsolation, adminController.getAdminPerformance);
router.post('/admin/evaluation', authenticateToken, tenantMiddleware, adminController.saveEvaluation);
router.get('/admin/evaluation/:adminId', authenticateToken, tenantMiddleware, adminController.getEvaluations);

// Chat de Filiação
router.get('/affiliations/:id/chat', authenticateTokenOptional, affiliationController.getChatMessages);
router.post('/affiliations/:id/chat', authenticateTokenOptional, affiliationController.sendChatMessage);

const chatController = require('../controllers/chatController');
router.post('/chat/start', authenticateToken, tenantMiddleware, sensibleOperationLimiter, chatController.startConversation);
router.get('/chat/conversations', authenticateToken, tenantMiddleware, ensureTenantIsolation, chatController.listConversations);
router.get('/chat/:conversationId/messages', authenticateToken, tenantMiddleware, validateResourceTenant('conversations', 'conversationId'), chatController.getMessages);
router.post('/chat/:conversationId/messages', authenticateToken, tenantMiddleware, validateResourceTenant('conversations', 'conversationId'), sensibleOperationLimiter, chatController.sendMessage);
router.get('/chat/admins', authenticateToken, tenantMiddleware, ensureTenantIsolation, chatController.getAvailableAdmins);

const notificationController = require('../controllers/notificationController');
router.post('/notifications/broadcast', authenticateToken, tenantMiddleware, adminOperationLimiter, notificationController.createBroadcast);
router.delete('/notifications/:id', authenticateToken, tenantMiddleware, validateResourceTenant('notifications', 'id'), adminOperationLimiter, notificationController.deleteBroadcast);
router.post('/notifications/:id/approve', authenticateToken, tenantMiddleware, validateResourceTenant('notifications', 'id'), adminOperationLimiter, notificationController.approveBroadcast);
router.get('/notifications/pending', authenticateToken, tenantMiddleware, ensureTenantIsolation, notificationController.listPendingBroadcasts);
router.get('/notifications/my', authenticateToken, tenantMiddleware, ensureTenantIsolation, notificationController.listMyNotifications);

const settingsRoutes = require('./settingsRoutes');
router.use('/settings', settingsRoutes);

// Security Alerts Routes (Phase 2 - Admin Técnico Dashboard)
const securityRoutes = require('./securityRoutes');
router.use('/admin/security', securityRoutes);

module.exports = router;
