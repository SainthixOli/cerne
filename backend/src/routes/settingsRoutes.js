const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken } = require('../middlewares/auth');
const { requireRole, allowPublic } = require('../middlewares/requireRole');
const { adminOperationLimiter } = require('../middlewares/rateLimiting');
const publicTenant = require('../middlewares/publicTenant');
const { tenantMiddleware } = require('../middlewares/tenantMiddleware');
const validate = require('../middlewares/validate');
const { settingParamsSchema, updateSettingSchema } = require('../validations/schemas');

// Reading remains public for registration terms; changing global settings is super-admin only.

router.get('/', allowPublic, publicTenant, settingsController.getSettings);
router.put('/:key', authenticateToken, requireRole('super_admin'), adminOperationLimiter,
    validate({ params: settingParamsSchema, body: updateSettingSchema }), tenantMiddleware,
    settingsController.updateSetting);

module.exports = router;
