const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const userController = require('../controllers/user.controller');
const { verifyToken } = require('../middleware/auth.middleware');

// Toutes les routes nécessitent l'authentification
router.use(verifyToken);

// Profile
router.get('/profile', userController.getUserProfile);
router.put('/profile', [
  body('firstName').optional().trim().notEmpty(),
  body('lastName').optional().trim().notEmpty(),
  body('phone').optional().trim()
], userController.updateProfile);

// Successor
router.put('/successor', [
  body('firstName').trim().notEmpty(),
  body('lastName').trim().notEmpty(),
  body('email').isEmail(),
  body('phone').optional().trim(),
  body('relationship').optional().trim()
], userController.updateSuccessor);

// Password
router.put('/password', [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 })
], userController.changePassword);

// Notifications
router.get('/notifications', userController.getNotifications);
router.put('/notifications/read', userController.markNotificationsAsRead);

module.exports = router;
