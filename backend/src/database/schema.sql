-- Shepherd Capital Investment Database Schema

-- Extension pour UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table des utilisateurs
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20),
    role VARCHAR(20) DEFAULT 'investor' CHECK (role IN ('investor', 'admin')),
    is_active BOOLEAN DEFAULT true,
    is_verified BOOLEAN DEFAULT false,
    kyc_status VARCHAR(20) DEFAULT 'pending' CHECK (kyc_status IN ('pending', 'submitted', 'approved', 'rejected')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des successeurs (héritiers)
CREATE TABLE successors (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    social_media JSONB,
    relationship VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table KYC documents
CREATE TABLE kyc_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    document_type VARCHAR(50) NOT NULL CHECK (document_type IN ('identity', 'proof_of_address')),
    file_url VARCHAR(500) NOT NULL,
    encrypted_file_path TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    uploaded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    reviewed_at TIMESTAMP,
    reviewed_by UUID REFERENCES users(id)
);

-- Table des contrats
CREATE TABLE contracts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    contract_number VARCHAR(50) UNIQUE NOT NULL,
    contract_pdf_url VARCHAR(500) NOT NULL,
    signed BOOLEAN DEFAULT false,
    signature_data TEXT,
    signed_at TIMESTAMP,
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des investissements (portefeuilles)
CREATE TABLE investments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    balance DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,
    total_deposited DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,
    total_withdrawn DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,
    total_gains DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Table des transactions
CREATE TABLE transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    investment_id UUID REFERENCES investments(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL CHECK (type IN ('deposit', 'withdrawal', 'gain', 'fee')),
    amount DECIMAL(15, 2) NOT NULL,
    currency VARCHAR(10) DEFAULT 'EUR',
    payment_method VARCHAR(20) CHECK (payment_method IN ('fiat', 'crypto', 'bank_transfer')),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected', 'cancelled')),
    description TEXT,
    metadata JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    processed_at TIMESTAMP,
    processed_by UUID REFERENCES users(id)
);

-- Table des gains journaliers (historique)
CREATE TABLE daily_gains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    gain_date DATE NOT NULL UNIQUE,
    bankroll DECIMAL(15, 2) NOT NULL,
    gain_percentage DECIMAL(5, 2) NOT NULL,
    total_gain DECIMAL(15, 2) NOT NULL,
    redistributed_gain DECIMAL(15, 2) NOT NULL,
    admin_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des gains individuels par investisseur
CREATE TABLE investor_gains (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    daily_gain_id UUID REFERENCES daily_gains(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    investment_id UUID REFERENCES investments(id) ON DELETE CASCADE,
    capital_invested DECIMAL(15, 2) NOT NULL,
    gain_percentage DECIMAL(5, 2) NOT NULL,
    gain_amount DECIMAL(15, 2) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table des notifications
CREATE TABLE notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) CHECK (type IN ('info', 'success', 'warning', 'error', 'gain', 'transaction')),
    is_read BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table de sessions (refresh tokens)
CREATE TABLE refresh_tokens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes pour optimisation
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_investments_user_id ON investments(user_id);
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_daily_gains_date ON daily_gains(gain_date);
CREATE INDEX idx_investor_gains_user_id ON investor_gains(user_id);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_kyc_documents_user_id ON kyc_documents(user_id);

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers pour updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_successors_updated_at BEFORE UPDATE ON successors
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_investments_updated_at BEFORE UPDATE ON investments
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insertion de l'administrateur par défaut (Max)
-- Password: Admin@123 (CHANGER EN PRODUCTION)
INSERT INTO users (email, password_hash, first_name, last_name, role, is_verified, kyc_status)
VALUES (
    'max@shepherdcapital.com',
    '$2a$10$YourHashedPasswordHere', -- À remplacer par un vrai hash bcrypt
    'Max',
    'Administrator',
    'admin',
    true,
    'approved'
);

-- Vues utiles

-- Vue: Statistiques globales
CREATE VIEW global_stats AS
SELECT
    (SELECT COUNT(*) FROM users WHERE role = 'investor' AND is_active = true) as total_investors,
    (SELECT COALESCE(SUM(balance), 0) FROM investments WHERE is_active = true) as total_bankroll,
    (SELECT COALESCE(SUM(total_deposited), 0) FROM investments) as total_deposited,
    (SELECT COALESCE(SUM(total_withdrawn), 0) FROM investments) as total_withdrawn,
    (SELECT COALESCE(SUM(total_gains), 0) FROM investments) as total_gains_distributed;

-- Vue: Investisseurs actifs avec leurs investissements
CREATE VIEW active_investors AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.kyc_status,
    i.balance,
    i.total_deposited,
    i.total_gains,
    i.created_at as investment_date
FROM users u
JOIN investments i ON u.id = i.user_id
WHERE u.role = 'investor' 
  AND u.is_active = true 
  AND i.is_active = true
  AND u.kyc_status = 'approved';
