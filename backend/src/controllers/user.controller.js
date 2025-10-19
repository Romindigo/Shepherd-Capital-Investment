const db = require('../database/db');
const bcrypt = require('bcryptjs');

// Profil utilisateur
const getUserProfile = async (req, res) => {
  try {
    const userId = req.user.userId;

    const userResult = await db.query(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.is_verified, u.kyc_status, u.created_at,
              i.balance, i.total_deposited, i.total_withdrawn, i.total_gains
       FROM users u
       LEFT JOIN investments i ON u.id = i.user_id
       WHERE u.id = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userResult.rows[0];

    // Récupérer le successeur s'il existe
    const successorResult = await db.query(
      'SELECT * FROM successors WHERE user_id = $1',
      [userId]
    );

    res.json({
      user: {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        phone: user.phone,
        role: user.role,
        isVerified: user.is_verified,
        kycStatus: user.kyc_status,
        createdAt: user.created_at
      },
      investment: {
        balance: parseFloat(user.balance || 0),
        totalDeposited: parseFloat(user.total_deposited || 0),
        totalWithdrawn: parseFloat(user.total_withdrawn || 0),
        totalGains: parseFloat(user.total_gains || 0)
      },
      successor: successorResult.rows.length > 0 ? {
        firstName: successorResult.rows[0].first_name,
        lastName: successorResult.rows[0].last_name,
        email: successorResult.rows[0].email,
        phone: successorResult.rows[0].phone,
        socialMedia: successorResult.rows[0].social_media,
        relationship: successorResult.rows[0].relationship
      } : null
    });

  } catch (error) {
    console.error('Get user profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Mettre à jour le profil
const updateProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { firstName, lastName, phone } = req.body;

    await db.query(
      'UPDATE users SET first_name = $1, last_name = $2, phone = $3 WHERE id = $4',
      [firstName, lastName, phone, userId]
    );

    res.json({ message: 'Profile updated successfully' });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Ajouter ou mettre à jour le successeur
const updateSuccessor = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { firstName, lastName, email, phone, socialMedia, relationship } = req.body;

    // Vérifier si un successeur existe déjà
    const existingSuccessor = await db.query(
      'SELECT id FROM successors WHERE user_id = $1',
      [userId]
    );

    if (existingSuccessor.rows.length > 0) {
      // Mettre à jour
      await db.query(
        `UPDATE successors 
         SET first_name = $1, last_name = $2, email = $3, phone = $4, social_media = $5, relationship = $6
         WHERE user_id = $7`,
        [firstName, lastName, email, phone, socialMedia, relationship, userId]
      );
    } else {
      // Créer
      await db.query(
        `INSERT INTO successors (user_id, first_name, last_name, email, phone, social_media, relationship)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, firstName, lastName, email, phone, socialMedia, relationship]
      );
    }

    res.json({ message: 'Successor information saved successfully' });

  } catch (error) {
    console.error('Update successor error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Changer le mot de passe
const changePassword = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { currentPassword, newPassword } = req.body;

    // Récupérer le hash actuel
    const userResult = await db.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [userId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Vérifier le mot de passe actuel
    const isValid = await bcrypt.compare(currentPassword, userResult.rows[0].password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hasher le nouveau mot de passe
    const newPasswordHash = await bcrypt.hash(newPassword, 10);

    // Mettre à jour
    await db.query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [newPasswordHash, userId]
    );

    res.json({ message: 'Password changed successfully' });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Notifications de l'utilisateur
const getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, offset = 0 } = req.query;

    const notifications = await db.query(
      'SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3',
      [userId, limit, offset]
    );

    const unreadCount = await db.query(
      'SELECT COUNT(*) FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    );

    res.json({
      notifications: notifications.rows,
      unreadCount: parseInt(unreadCount.rows[0].count)
    });

  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Marquer les notifications comme lues
const markNotificationsAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { notificationIds } = req.body;

    if (notificationIds && notificationIds.length > 0) {
      await db.query(
        'UPDATE notifications SET is_read = true WHERE id = ANY($1) AND user_id = $2',
        [notificationIds, userId]
      );
    } else {
      // Marquer toutes comme lues
      await db.query(
        'UPDATE notifications SET is_read = true WHERE user_id = $1',
        [userId]
      );
    }

    res.json({ message: 'Notifications marked as read' });

  } catch (error) {
    console.error('Mark notifications as read error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getUserProfile,
  updateProfile,
  updateSuccessor,
  changePassword,
  getNotifications,
  markNotificationsAsRead
};
