const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const adminController = require('../controllers/admin.controller');
const { verifyToken, requireAdmin } = require('../middleware/auth.middleware');

// Toutes les routes nécessitent l'authentification et le rôle admin
router.use(verifyToken);
router.use(requireAdmin);

// Dashboard
router.get('/stats', adminController.getGlobalStats);
router.get('/investors', adminController.getAllInvestors);

// Daily gain submission
router.post('/daily-gain', [
  body('gainPercentage').isFloat({ min: -100, max: 1000 }),
  body('gainDate').isDate()
], adminController.submitDailyGain);

// Alias pour la route gains (utilisée par le frontend)
router.post('/gains', [
  body('gainPercentage').isFloat({ min: -100, max: 1000 }),
  body('gainDate').isDate()
], adminController.submitDailyGain);

// KYC review
router.put('/kyc/:userId', [
  body('action').isIn(['approve', 'reject']),
  body('rejectionReason').optional().trim()
], adminController.reviewKYC);

// Transaction review
router.put('/transactions/:transactionId', [
  body('action').isIn(['approve', 'reject'])
], adminController.reviewTransaction);

// Shepherd Capital management
router.get('/shepherd-capital', adminController.getShepherdCapital);
router.post('/shepherd-capital', [
  body('amount').isFloat({ min: 0 }),
  body('transactionType').isIn(['deposit', 'withdrawal', 'adjustment']),
  body('category').optional().trim(),
  body('description').optional().trim()
], adminController.addShepherdCapital);
router.get('/shepherd-capital/export-csv', adminController.exportShepherdCapitalCSV);

// Get KYC documents for a specific user
router.get('/kyc/:userId/documents', adminController.getUserKYCDocuments);

// Get successor information for a specific user
router.get('/users/:userId/successor', adminController.getUserSuccessor);

// Delete a user
router.delete('/users/:userId', adminController.deleteUser);

// Export all data (backup)
router.get('/export', adminController.exportAllData);

// Monthly gain tracking
router.get('/monthly-gains', adminController.getMonthlyGainReport);

// Transactions management
router.get('/transactions', adminController.getAllTransactions);
router.put('/transactions/:transactionId/approve', adminController.approveTransaction);
router.put('/transactions/:transactionId/reject', adminController.rejectTransaction);

module.exports = router;
