const jwt = require('jsonwebtoken');
const db = require('../database/db');

// Middleware pour vérifier le token JWT
const verifyToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Access denied. No token provided.' });
    }

    const token = authHeader.split(' ')[1];
    
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;
      next();
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ error: 'Token expired' });
      }
      return res.status(401).json({ error: 'Invalid token' });
    }
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware pour vérifier le rôle admin
const requireAdmin = (req, res, next) => {
  if (req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admin privileges required.' });
  }
  next();
};

// Middleware pour vérifier le KYC approuvé
const requireApprovedKYC = async (req, res, next) => {
  try {
    const result = await db.query(
      'SELECT kyc_status FROM users WHERE id = $1',
      [req.user.userId]
    );

    if (!result.rows.length) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (result.rows[0].kyc_status !== 'approved') {
      return res.status(403).json({ 
        error: 'KYC approval required',
        kyc_status: result.rows[0].kyc_status
      });
    }

    next();
  } catch (error) {
    console.error('KYC check error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Middleware pour vérifier que l'utilisateur accède à ses propres données
const requireSelfOrAdmin = (req, res, next) => {
  const requestedUserId = req.params.userId || req.params.id;
  
  if (req.user.role === 'admin' || req.user.userId === requestedUserId) {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. You can only access your own data.' });
  }
};

module.exports = {
  verifyToken,
  requireAdmin,
  requireApprovedKYC,
  requireSelfOrAdmin
};
