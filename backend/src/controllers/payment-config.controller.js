const db = require('../database/db');

// Récupérer toutes les configurations de paiement (pour l'admin)
const getAllPaymentConfigs = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT * FROM payment_config ORDER BY config_key'
    );
    
    res.json({
      configs: result.rows
    });
  } catch (error) {
    console.error('Get payment configs error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Récupérer les configurations actives (pour les utilisateurs)
const getActivePaymentMethods = async (req, res) => {
  try {
    const result = await db.query(
      'SELECT config_key, config_value FROM payment_config WHERE is_active = true'
    );
    
    // Organiser les données
    const methods = {
      bankAccount: null,
      stripe: null,
      cryptos: []
    };
    
    result.rows.forEach(row => {
      if (row.config_key === 'bank_account') {
        methods.bankAccount = row.config_value;
      } else if (row.config_key === 'stripe_config') {
        methods.stripe = {
          publicKey: row.config_value.publicKey,
          // Ne pas exposer la secretKey ni le webhookSecret
        };
      } else if (row.config_key.startsWith('crypto_')) {
        methods.cryptos.push(row.config_value);
      }
    });
    
    res.json(methods);
  } catch (error) {
    console.error('Get active payment methods error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Mettre à jour une configuration
const updatePaymentConfig = async (req, res) => {
  try {
    const { configKey } = req.params;
    const { configValue, isActive } = req.body;
    
    // Vérifier que la config existe
    const existing = await db.query(
      'SELECT id FROM payment_config WHERE config_key = $1',
      [configKey]
    );
    
    if (existing.rows.length === 0) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    
    // Mettre à jour
    const result = await db.query(
      `UPDATE payment_config 
       SET config_value = $1, is_active = $2, updated_at = CURRENT_TIMESTAMP
       WHERE config_key = $3
       RETURNING *`,
      [configValue, isActive, configKey]
    );
    
    res.json({
      message: 'Payment configuration updated successfully',
      config: result.rows[0]
    });
  } catch (error) {
    console.error('Update payment config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Activer/désactiver une méthode de paiement
const togglePaymentMethod = async (req, res) => {
  try {
    const { configKey } = req.params;
    const { isActive } = req.body;
    
    const result = await db.query(
      `UPDATE payment_config 
       SET is_active = $1, updated_at = CURRENT_TIMESTAMP
       WHERE config_key = $2
       RETURNING *`,
      [isActive, configKey]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Configuration not found' });
    }
    
    res.json({
      message: `Payment method ${isActive ? 'activated' : 'deactivated'} successfully`,
      config: result.rows[0]
    });
  } catch (error) {
    console.error('Toggle payment method error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getAllPaymentConfigs,
  getActivePaymentMethods,
  updatePaymentConfig,
  togglePaymentMethod
};
