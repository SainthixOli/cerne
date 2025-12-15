const express = require('express');
const router = express.Router();
const affiliationController = require('../controllers/affiliationController');
const authController = require('../controllers/authController');
const documentController = require('../controllers/documentController');
const profileController = require('../controllers/profileController');
const reportsController = require('../controllers/reportsController');
const upload = require('../middlewares/upload');
const { authenticateToken } = require('../middlewares/auth');

router.post('/auth/login', authController.login);
router.post('/auth/change-password', authenticateToken, authController.changePassword);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);

router.post('/register', affiliationController.register);
router.post('/upload', upload.single('file'), affiliationController.uploadSignedForm);

router.get('/affiliations', authenticateToken, affiliationController.getAllAffiliations);
router.get('/affiliations/:userId/history', authenticateToken, affiliationController.getAffiliationHistory);
router.post('/affiliations/:id/approve', authenticateToken, affiliationController.approveAffiliation);
router.post('/affiliations/:id/reject', authenticateToken, affiliationController.rejectAffiliation);
router.post('/affiliations/status', affiliationController.checkStatus); // Public
router.get('/affiliations/certificate', authenticateToken, affiliationController.getCertificate);

router.get('/documents/my', authenticateToken, documentController.getMyDocuments);
router.post('/documents', authenticateToken, upload.single('document'), documentController.uploadDocument);
router.post('/documents/template', authenticateToken, upload.single('document'), documentController.uploadTemplate);
router.get('/documents/:filename', documentController.serveDocument); // Security inside controller or add middleware if needed

router.get('/profile', authenticateToken, profileController.getProfile);
router.put('/profile', authenticateToken, profileController.updateProfile);
router.post('/profile/photo', authenticateToken, upload.single('photo'), profileController.uploadPhoto);

router.get('/reports', authenticateToken, reportsController.getReports);

const adminController = require('../controllers/adminController');

router.get('/admin/audit', authenticateToken, adminController.getAuditLogs);
router.get('/admin/users', authenticateToken, adminController.listAdmins);
router.post('/admin/users', authenticateToken, adminController.createAdmin);

const systemController = require('../controllers/systemController');
router.get('/system/stats', authenticateToken, systemController.getSystemStats);
router.post('/system/console', authenticateToken, systemController.executeConsoleCommand);

module.exports = router;
