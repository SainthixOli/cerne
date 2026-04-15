const express = require('express');
const router = express.Router();
const affiliationController = require('../controllers/affiliationController');
const authController = require('../controllers/authController');
const documentController = require('../controllers/documentController');
const profileController = require('../controllers/profileController');
const reportsController = require('../controllers/reportsController');
const { upload, validateAndSaveUpload, saveUploadToDisk, SIZE_LIMITS } = require('../middlewares/upload');
const { authenticateToken, authenticateTokenOptional } = require('../middlewares/auth');
const { checkResourceOwnership, checkDocumentOwnership } = require('../middlewares/resourceOwnership');
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

router.get('/affiliations', authenticateToken, affiliationController.getAllAffiliations);
router.get('/affiliations/:userId/history', authenticateToken, checkResourceOwnership('userId'), affiliationController.getAffiliationHistory);
router.post('/affiliations/:id/approve', authenticateToken, sensibleOperationLimiter, affiliationController.approveAffiliation);
router.post('/affiliations/:id/reject', authenticateToken, sensibleOperationLimiter, affiliationController.rejectAffiliation);
router.post('/affiliations/:id/assume', authenticateToken, adminOperationLimiter, affiliationController.assumeAffiliation);
router.post('/affiliations/:id/transfer', authenticateToken, sensibleOperationLimiter, affiliationController.transferAffiliation);
router.post('/affiliations/:id/request-transfer', authenticateToken, adminOperationLimiter, affiliationController.requestTransfer);
router.post('/affiliations/:id/deny-transfer', authenticateToken, sensibleOperationLimiter, affiliationController.denyTransferRequest);
router.post('/affiliations/status', publicLimiter, affiliationController.checkStatus); // Public
router.get('/affiliations/certificate', authenticateToken, affiliationController.getCertificate);

// Desfiliação / Reativação
router.post('/affiliations/request-disaffiliation', authenticateToken, affiliationController.requestDisaffiliation);
router.post('/affiliations/request-reactivation', authenticateToken, affiliationController.requestReactivation);
router.post('/affiliations/:id/approve-disaffiliation', authenticateToken, affiliationController.approveDisaffiliation);
router.post('/affiliations/:id/approve-reactivation', authenticateToken, affiliationController.approveReactivation);

router.get('/documents/my', authenticateToken, documentController.getMyDocuments);
router.post('/documents', 
    authenticateToken, 
    upload.single('document'), 
    validateAndSaveUpload('document', SIZE_LIMITS.DOCUMENT),
    saveUploadToDisk(),
    documentController.uploadDocument
);
router.post('/documents/template', 
    authenticateToken, 
    upload.single('document'), 
    validateAndSaveUpload('document', SIZE_LIMITS.TEMPLATE),
    saveUploadToDisk(),
    documentController.uploadTemplate
);
router.get('/documents/:filename', authenticateToken, checkDocumentOwnership, documentController.serveDocument);

router.get('/profile', authenticateToken, checkResourceOwnership('id'), profileController.getProfile);
router.put('/profile', authenticateToken, checkResourceOwnership('id'), profileController.updateProfile);
router.post('/profile/photo', 
    authenticateToken, 
    checkResourceOwnership('id'),
    upload.single('photo'), 
    validateAndSaveUpload('photo', SIZE_LIMITS.PHOTO),
    saveUploadToDisk(),
    profileController.uploadPhoto
);

router.get('/reports', authenticateToken, reportsController.getReports);

const adminController = require('../controllers/adminController');

router.get('/admin/audit', authenticateToken, adminController.getAuditLogs);
router.get('/admin/users', authenticateToken, adminController.listAdmins);
router.post('/admin/users', authenticateToken, adminController.createAdmin);
router.put('/admin/users/:adminId/status', authenticateToken, adminController.updateAdminStatus);

const systemController = require('../controllers/systemController');
router.get('/system/stats', authenticateToken, systemController.getSystemStats);
router.post('/system/console', authenticateToken, systemController.executeConsoleCommand);

// Avaliação e Desempenho do Admin
router.get('/admin/performance', authenticateToken, adminController.getAdminPerformance);
router.post('/admin/evaluation', authenticateToken, adminController.saveEvaluation);
router.get('/admin/evaluation/:adminId', authenticateToken, adminController.getEvaluations);

// Chat de Filiação
router.get('/affiliations/:id/chat', authenticateTokenOptional, affiliationController.getChatMessages);
router.post('/affiliations/:id/chat', authenticateTokenOptional, affiliationController.sendChatMessage);

const chatController = require('../controllers/chatController');
router.post('/chat/start', authenticateToken, sensibleOperationLimiter, chatController.startConversation);
router.get('/chat/conversations', authenticateToken, chatController.listConversations);
router.get('/chat/:conversationId/messages', authenticateToken, chatController.getMessages);
router.post('/chat/:conversationId/messages', authenticateToken, sensibleOperationLimiter, chatController.sendMessage);
router.get('/chat/admins', authenticateToken, chatController.getAvailableAdmins);

const notificationController = require('../controllers/notificationController');
router.post('/notifications/broadcast', authenticateToken, adminOperationLimiter, notificationController.createBroadcast);
router.delete('/notifications/:id', authenticateToken, adminOperationLimiter, notificationController.deleteBroadcast);
router.post('/notifications/:id/approve', authenticateToken, adminOperationLimiter, notificationController.approveBroadcast); // Apenas Super Admin (validado no controller)
router.get('/notifications/pending', authenticateToken, notificationController.listPendingBroadcasts);
router.get('/notifications/my', authenticateToken, notificationController.listMyNotifications);

const settingsRoutes = require('./settingsRoutes');
router.use('/settings', settingsRoutes);

const securityRoutes = require('./securityRoutes');
router.use('/admin/security', securityRoutes);

module.exports = router;
