const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const kycController = require('../controllers/kyc.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Authentification requise
router.use(verifyToken);

// Upload KYC documents
router.post('/upload', kycController.upload.single('document'), kycController.uploadKYCDocument);

// Get user's KYC documents
router.get('/documents', kycController.getKYCDocuments);

// Serve KYC file (secure)
router.get('/files/:filename', kycController.serveKYCFile);

// Contract management
router.post('/contract/generate', kycController.generateContract);
router.get('/contract', kycController.getContract);
router.get('/contract/download', kycController.downloadContract);
router.post('/contract/sign', [
  body('contractId').isUUID(),
  body('signatureData').notEmpty()
], kycController.signContract);

module.exports = router;
