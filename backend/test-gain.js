// Test minimal pour identifier le problème
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/shepherd_capital'
});

async function testGain() {
  const client = await pool.connect();
  
  try {
    console.log('🔵 BEGIN');
    await client.query('BEGIN');
    
    // 1. Insert daily_gain
    console.log('📝 Insert daily_gain...');
    const gainResult = await client.query(
      `INSERT INTO daily_gains (gain_date, bankroll, gain_percentage, total_gain, redistributed_gain, admin_id)
       VALUES ($1, $2, $3, $4, $5, (SELECT id FROM users WHERE email = 'romindigo34@gmail.com'))
       RETURNING id`,
      ['2025-10-20', 600, 5, 30, 0]
    );
    console.log('✅ Daily gain inserted:', gainResult.rows[0].id);
    
    // 2. Insert shepherd_capital
    console.log('📝 Insert shepherd_capital...');
    const shepherdResult = await client.query(
      `INSERT INTO shepherd_capital (amount, description, transaction_type, category, admin_id)
       VALUES ($1, $2, 'deposit', 'Gain journalier', (SELECT id FROM users WHERE email = 'romindigo34@gmail.com'))
       RETURNING id`,
      [30, 'Test gain 5%']
    );
    console.log('✅ Shepherd capital inserted:', shepherdResult.rows[0].id);
    
    // 3. COMMIT
    console.log('🔄 COMMIT...');
    const commitResult = await client.query('COMMIT');
    console.log('✅ COMMIT result:', commitResult.command);
    
    client.release();
    console.log('🔓 Client released');
    
    // 4. Vérification IMMÉDIATE avec nouvelle connexion
    const verifyResult = await pool.query('SELECT COUNT(*) as count FROM daily_gains WHERE gain_date = $1', ['2025-10-20']);
    console.log('📊 Verification: daily_gains count =', verifyResult.rows[0].count);
    
    const verifyShepherd = await pool.query('SELECT COUNT(*) as count FROM shepherd_capital WHERE description = $1', ['Test gain 5%']);
    console.log('📊 Verification: shepherd_capital count =', verifyShepherd.rows[0].count);
    
  } catch (error) {
    console.error('❌ ERROR:', error.message);
    await client.query('ROLLBACK');
    client.release();
  } finally {
    await pool.end();
  }
}

testGain();
