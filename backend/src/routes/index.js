const express = require('express');
const router = express.Router();
const affiliationController = require('../controllers/affiliationController');
const authController = require('../controllers/authController');
const documentController = require('../controllers/documentController');
const profileController = require('../controllers/profileController');
const reportsController = require('../controllers/reportsController');
const upload = require('../middlewares/upload');
const { authenticateToken, authenticateTokenOptional } = require('../middlewares/auth');

const { loginSchema, changePasswordSchema } = require('../validations/authValidation');
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

router.post('/auth/login', validate(loginSchema), authController.login);
router.post('/auth/change-password', authenticateToken, validate(changePasswordSchema), authController.changePassword);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);

router.post('/register', affiliationController.register);
router.post('/upload', upload.single('file'), affiliationController.uploadSignedForm);

router.get('/affiliations', authenticateToken, affiliationController.getAllAffiliations);
router.get('/affiliations/:userId/history', authenticateToken, affiliationController.getAffiliationHistory);
router.post('/affiliations/:id/approve', authenticateToken, affiliationController.approveAffiliation);
router.post('/affiliations/:id/reject', authenticateToken, affiliationController.rejectAffiliation);
router.post('/affiliations/:id/assume', authenticateToken, affiliationController.assumeAffiliation);
router.post('/affiliations/:id/transfer', authenticateToken, affiliationController.transferAffiliation);
router.post('/affiliations/:id/request-transfer', authenticateToken, affiliationController.requestTransfer);
router.post('/affiliations/:id/deny-transfer', authenticateToken, affiliationController.denyTransferRequest);
router.post('/affiliations/status', affiliationController.checkStatus); // Public
router.get('/affiliations/certificate', authenticateToken, affiliationController.getCertificate);

router.get('/documents/my', authenticateToken, documentController.getMyDocuments);
router.post('/documents', authenticateToken, upload.single('document'), documentController.uploadDocument);
router.post('/documents/template', authenticateToken, upload.single('document'), documentController.uploadTemplate);
router.get('/documents/:filename', documentController.serveDocument); // Segurança dentro do controlador ou adicione middleware se necessário

router.get('/profile', authenticateToken, profileController.getProfile);
router.put('/profile', authenticateToken, profileController.updateProfile);
router.post('/profile/photo', authenticateToken, upload.single('photo'), profileController.uploadPhoto);

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
router.post('/chat/start', authenticateToken, chatController.startConversation);
router.get('/chat/conversations', authenticateToken, chatController.listConversations);
router.get('/chat/:conversationId/messages', authenticateToken, chatController.getMessages);
router.post('/chat/:conversationId/messages', authenticateToken, chatController.sendMessage);
router.get('/chat/admins', authenticateToken, chatController.getAvailableAdmins);

const notificationController = require('../controllers/notificationController');
router.post('/notifications/broadcast', authenticateToken, notificationController.createBroadcast);
router.delete('/notifications/:id', authenticateToken, notificationController.deleteBroadcast);
router.post('/notifications/:id/approve', authenticateToken, notificationController.approveBroadcast); // Apenas Super Admin (validado no controller)
router.get('/notifications/pending', authenticateToken, notificationController.listPendingBroadcasts);
router.get('/notifications/my', authenticateToken, notificationController.listMyNotifications);

const settingsRoutes = require('./settingsRoutes');
router.use('/settings', settingsRoutes);

module.exports = router;
