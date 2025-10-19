const express = require('express');
const router = express.Router();
const paymentConfigController = require('../controllers/payment-config.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');

// Routes publiques (utilisateurs authentifiés)
router.get('/active', verifyToken, paymentConfigController.getActivePaymentMethods);

// Routes admin
router.get('/all', verifyToken, requireAdmin, paymentConfigController.getAllPaymentConfigs);
router.put('/:configKey', verifyToken, requireAdmin, paymentConfigController.updatePaymentConfig);
router.patch('/:configKey/toggle', verifyToken, requireAdmin, paymentConfigController.togglePaymentMethod);

module.exports = router;
