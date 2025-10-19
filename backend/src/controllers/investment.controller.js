const db = require('../database/db');

// Tableau de bord de l'investisseur
const getDashboard = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Récupérer les infos d'investissement
    const investment = await db.query(
      'SELECT * FROM investments WHERE user_id = $1',
      [userId]
    );

    if (investment.rows.length === 0) {
      return res.status(404).json({ error: 'Investment not found' });
    }

    const investmentData = investment.rows[0];

    // Historique des gains (30 derniers jours)
    const gainsHistory = await db.query(
      `SELECT ig.*, dg.gain_date, dg.gain_percentage
       FROM investor_gains ig
       JOIN daily_gains dg ON ig.daily_gain_id = dg.id
       WHERE ig.user_id = $1
       ORDER BY dg.gain_date DESC
       LIMIT 30`,
      [userId]
    );

    // Transactions récentes
    const recentTransactions = await db.query(
      'SELECT * FROM transactions WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
      [userId]
    );

    // Stats globales
    const globalStats = await db.query('SELECT * FROM global_stats');

    res.json({
      investment: {
        balance: parseFloat(investmentData.balance),
        totalDeposited: parseFloat(investmentData.total_deposited),
        totalWithdrawn: parseFloat(investmentData.total_withdrawn),
        totalGains: parseFloat(investmentData.total_gains),
        isActive: investmentData.is_active
      },
      gainsHistory: gainsHistory.rows.map(g => ({
        date: g.gain_date,
        percentage: parseFloat(g.gain_percentage),
        amount: parseFloat(g.gain_amount),
        capitalInvested: parseFloat(g.capital_invested)
      })),
      recentTransactions: recentTransactions.rows,
      platform: {
        totalInvestors: globalStats.rows[0]?.total_investors || 0,
        maxInvestors: parseInt(process.env.MAX_INVESTORS || 50)
      }
    });

  } catch (error) {
    console.error('Get dashboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Graphique d'évolution du capital
const getCapitalEvolution = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { days = 30 } = req.query;

    // Récupérer l'évolution jour par jour
    const evolution = await db.query(
      `WITH RECURSIVE date_series AS (
        SELECT CURRENT_DATE - INTERVAL '1 day' * generate_series(0, $2) AS date
      )
      SELECT 
        ds.date,
        COALESCE(SUM(
          CASE 
            WHEN t.type = 'deposit' AND t.status = 'completed' THEN t.amount
            WHEN t.type = 'withdrawal' AND t.status = 'completed' THEN -t.amount
            WHEN t.type = 'gain' AND t.status = 'completed' THEN t.amount
            ELSE 0
          END
        ) OVER (ORDER BY ds.date), 0) as balance
      FROM date_series ds
      LEFT JOIN transactions t ON DATE(t.processed_at) = ds.date AND t.user_id = $1
      ORDER BY ds.date`,
      [userId, days - 1]
    );

    res.json({
      evolution: evolution.rows.map(e => ({
        date: e.date,
        balance: parseFloat(e.balance)
      }))
    });

  } catch (error) {
    console.error('Get capital evolution error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  getDashboard,
  getCapitalEvolution
};
