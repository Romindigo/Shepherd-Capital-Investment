require('dotenv').config();
const fs = require('fs').promises;
const path = require('path');
const { pool } = require('./db');
const bcrypt = require('bcryptjs');

async function migrate() {
  console.log('🚀 Starting database migration...');
  
  try {
    // Lire le fichier schema.sql
    const schemaPath = path.join(__dirname, 'schema.sql');
    const schema = await fs.readFile(schemaPath, 'utf8');
    
    // Exécuter le schéma
    console.log('📝 Creating database schema...');
    await pool.query(schema);
    
    console.log('✅ Database schema created successfully');
    
    // Créer l'admin par défaut avec un mot de passe hashé
    console.log('👤 Creating default admin user...');
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    
    try {
      await pool.query(
        `INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified, kyc_status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (email) DO NOTHING`,
        ['max@shepherdcapital.com', adminPassword, 'Max', 'Administrator', 'admin', true, 'approved']
      );
      console.log('✅ Default admin user created (email: max@shepherdcapital.com, password: Admin@123)');
      console.log('⚠️  IMPORTANT: Change this password in production!');
    } catch (error) {
      console.log('ℹ️  Admin user already exists, skipping...');
    }
    
    console.log('');
    console.log('✅ Migration completed successfully!');
    console.log('');
    console.log('Next steps:');
    console.log('1. Update .env file with your configuration');
    console.log('2. Change the default admin password');
    console.log('3. Start the backend server: npm run dev');
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

migrate();
