const db = require('../database/db');

// Créer une demande de dépôt
const createDeposit = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount, currency = 'EUR', paymentMethod, metadata } = req.body;

    // Vérifier le montant minimum
    if (amount < parseInt(process.env.MIN_DEPOSIT || 1000)) {
      return res.status(400).json({ 
        error: `Minimum deposit amount is ${process.env.MIN_DEPOSIT || 1000} €` 
      });
    }

    // Récupérer l'investment_id ou créer s'il n'existe pas
    let investmentResult = await db.query(
      'SELECT id FROM investments WHERE user_id = $1',
      [userId]
    );

    let investmentId;
    if (investmentResult.rows.length === 0) {
      // Créer automatiquement un compte d'investissement
      const newInvestment = await db.query(
        'INSERT INTO investments (user_id, balance) VALUES ($1, 0) RETURNING id',
        [userId]
      );
      investmentId = newInvestment.rows[0].id;
    } else {
      investmentId = investmentResult.rows[0].id;
    }

    // Créer la transaction
    const transaction = await db.query(
      `INSERT INTO transactions (user_id, investment_id, type, amount, currency, payment_method, status, description, metadata)
       VALUES ($1, $2, 'deposit', $3, $4, $5, 'pending', 'Dépôt en attente de validation', $6)
       RETURNING *`,
      [userId, investmentId, amount, currency, paymentMethod, metadata]
    );

    // Notification admin
    const admins = await db.query("SELECT id FROM users WHERE role = 'admin'");
    for (const admin of admins.rows) {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, 'Nouveau dépôt à valider', $2, 'info')`,
        [admin.id, `Un dépôt de ${amount} ${currency} est en attente de validation.`]
      );
    }

    res.status(201).json({
      message: 'Deposit request created successfully',
      transaction: transaction.rows[0]
    });

  } catch (error) {
    console.error('Create deposit error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Créer une demande de retrait
const createWithdrawal = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { amount, paymentMethod, metadata } = req.body;

    // Vérifier le solde disponible
    const investmentResult = await db.query(
      'SELECT id, balance FROM investments WHERE user_id = $1',
      [userId]
    );

    if (investmentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Investment account not found' });
    }

    const investment = investmentResult.rows[0];
    const balance = parseFloat(investment.balance);

    if (balance < amount) {
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Créer la transaction
    const transaction = await db.query(
      `INSERT INTO transactions (user_id, investment_id, type, amount, currency, payment_method, status, description, metadata)
       VALUES ($1, $2, 'withdrawal', $3, 'EUR', $4, 'pending', 'Retrait en attente de validation', $5)
       RETURNING *`,
      [userId, investment.id, amount, paymentMethod, metadata]
    );

    // Notification admin
    const admins = await db.query("SELECT id FROM users WHERE role = 'admin'");
    for (const admin of admins.rows) {
      await db.query(
        `INSERT INTO notifications (user_id, title, message, type)
         VALUES ($1, 'Nouveau retrait à valider', $2, 'info')`,
        [admin.id, `Un retrait de ${amount} € est en attente de validation.`]
      );
    }

    res.status(201).json({
      message: 'Withdrawal request created successfully',
      transaction: transaction.rows[0]
    });

  } catch (error) {
    console.error('Create withdrawal error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Historique des transactions
const getTransactions = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 50, offset = 0, type, status } = req.query;

    let query = 'SELECT * FROM transactions WHERE user_id = $1';
    const params = [userId];

    if (type) {
      params.push(type);
      query += ` AND type = $${params.length}`;
    }

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    params.push(limit);
    query += ` ORDER BY created_at DESC LIMIT $${params.length}`;
    
    params.push(offset);
    query += ` OFFSET $${params.length}`;

    const transactions = await db.query(query, params);

    res.json({
      transactions: transactions.rows,
      total: transactions.rows.length
    });

  } catch (error) {
    console.error('Get transactions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Détails d'une transaction
const getTransactionById = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { transactionId } = req.params;

    const transaction = await db.query(
      'SELECT * FROM transactions WHERE id = $1 AND user_id = $2',
      [transactionId, userId]
    );

    if (transaction.rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ transaction: transaction.rows[0] });

  } catch (error) {
    console.error('Get transaction by ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createDeposit,
  createWithdrawal,
  getTransactions,
  getTransactionById
};
