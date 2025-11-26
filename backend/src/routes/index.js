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

router.post('/register', affiliationController.register);
router.post('/upload', upload.single('file'), affiliationController.uploadSignedForm);

router.get('/affiliations', authenticateToken, affiliationController.getAllAffiliations);
router.post('/affiliations/:id/approve', authenticateToken, affiliationController.approveAffiliation);

router.get('/documents/my', authenticateToken, documentController.getMyDocuments);
router.get('/documents/:filename', documentController.serveDocument); // Security inside controller or add middleware if needed

router.get('/profile', authenticateToken, profileController.getProfile);
router.put('/profile', authenticateToken, profileController.updateProfile);

router.get('/reports', authenticateToken, reportsController.getReports);

module.exports = router;
