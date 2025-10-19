-- Migration: Ajouter le capital propre Shepherd
-- Ce capital n'est pas redistribué aux investisseurs

-- Table pour le capital propre de Shepherd
CREATE TABLE IF NOT EXISTS shepherd_capital (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    amount DECIMAL(15, 2) DEFAULT 0.00 NOT NULL,
    description TEXT,
    transaction_type VARCHAR(20) CHECK (transaction_type IN ('deposit', 'withdrawal', 'adjustment')),
    category VARCHAR(50),
    admin_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger pour updated_at
CREATE TRIGGER update_shepherd_capital_updated_at BEFORE UPDATE ON shepherd_capital
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index
CREATE INDEX idx_shepherd_capital_created_at ON shepherd_capital(created_at);

-- Ajouter un enregistrement initial
INSERT INTO shepherd_capital (amount, description, transaction_type)
VALUES (0.00, 'Capital initial Shepherd', 'deposit');

-- Créer une vue pour le capital total de Shepherd
CREATE OR REPLACE VIEW shepherd_capital_summary AS
SELECT 
    COALESCE(SUM(CASE WHEN transaction_type IN ('deposit', 'adjustment') THEN amount ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN transaction_type = 'withdrawal' THEN amount ELSE 0 END), 0) as total_capital,
    COUNT(*) as total_transactions,
    MAX(created_at) as last_transaction_date
FROM shepherd_capital;
