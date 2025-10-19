const express = require('express');
const router = express.Router();
const investmentController = require('../controllers/investment.controller');
const { verifyToken, requireApprovedKYC } = require('../middleware/auth.middleware');

// Authentification requise
router.use(verifyToken);

// Dashboard (KYC non requis pour voir)
router.get('/dashboard', investmentController.getDashboard);
router.get('/capital-evolution', investmentController.getCapitalEvolution);

module.exports = router;
