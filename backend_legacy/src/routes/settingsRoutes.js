const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken } = require('../middlewares/auth');

// Public or Protected? Ideally protected for Admin, but maybe Public for fetching terms during registration?
// For now, let's keep it open for fetching terms (Register page needs it) but protected for updates.

router.get('/', settingsController.getSettings);
router.put('/:key', authenticateToken, settingsController.updateSetting);

module.exports = router;
