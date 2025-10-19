const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const transactionController = require('../controllers/transaction.controller');
const { verifyToken, requireApprovedKYC } = require('../middleware/auth.middleware');

// Authentification requise
router.use(verifyToken);

// Créer des transactions (KYC requis)
router.post('/deposit', requireApprovedKYC, [
  body('amount').isFloat({ min: 1000 }),
  body('paymentMethod').isIn(['fiat', 'crypto', 'bank_transfer']),
  body('currency').optional().isIn(['EUR', 'USD', 'BTC', 'ETH'])
], transactionController.createDeposit);

router.post('/withdrawal', requireApprovedKYC, [
  body('amount').isFloat({ min: 0.01 }),
  body('paymentMethod').isIn(['fiat', 'crypto', 'bank_transfer'])
], transactionController.createWithdrawal);

// Historique
router.get('/', transactionController.getTransactions);
router.get('/:transactionId', transactionController.getTransactionById);

module.exports = router;
