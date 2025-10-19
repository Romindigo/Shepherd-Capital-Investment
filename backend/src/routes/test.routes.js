const express = require('express');
const router = express.Router();
const db = require('../database/db');

// Route de test pour identifier le problème
router.post('/test-gain', async (req, res) => {
  const client = await db.pool.connect();
  
  try {
    console.log('TEST: BEGIN');
    await client.query('BEGIN');
    
    console.log('TEST: Insert daily_gain');
    const gainResult = await client.query(
      `INSERT INTO daily_gains (gain_date, bankroll, gain_percentage, total_gain, redistributed_gain, admin_id)
       VALUES ($1, $2, $3, $4, $5, (SELECT id FROM users WHERE email = 'romindigo34@gmail.com'))
       RETURNING id`,
      ['2025-10-22', 600, 5, 30, 0]
    );
    console.log('TEST: Daily gain inserted:', gainResult.rows[0].id);
    
    console.log('TEST: Insert shepherd_capital');
    const shepherdResult = await client.query(
      `INSERT INTO shepherd_capital (amount, description, transaction_type, category, admin_id)
       VALUES ($1, $2, 'deposit', 'Gain journalier', (SELECT id FROM users WHERE email = 'romindigo34@gmail.com'))
       RETURNING id`,
      [30, 'Test via route']
    );
    console.log('TEST: Shepherd capital inserted:', shepherdResult.rows[0].id);
    
    console.log('TEST: COMMIT');
    await client.query('COMMIT');
    console.log('TEST: COMMIT done');
    
    client.release();
    console.log('TEST: Client released');
    
    // Vérification
    const verify = await db.query('SELECT COUNT(*) as count FROM daily_gains WHERE gain_date = $1', ['2025-10-22']);
    console.log('TEST: Verification count =', verify.rows[0].count);
    
    res.json({ success: true, count: verify.rows[0].count });
    
  } catch (error) {
    console.error('TEST ERROR:', error);
    await client.query('ROLLBACK');
    client.release();
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
