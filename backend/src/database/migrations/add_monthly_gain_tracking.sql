-- Migration: Ajouter le suivi mensuel des gains

-- Table pour le tracking mensuel
CREATE TABLE IF NOT EXISTS monthly_gain_summary (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    month INTEGER NOT NULL CHECK (month BETWEEN 1 AND 12),
    year INTEGER NOT NULL CHECK (year >= 2020),
    total_bankroll DECIMAL(15, 2) DEFAULT 0.00,
    total_gain_amount DECIMAL(15, 2) DEFAULT 0.00,
    total_gain_percentage DECIMAL(10, 4) DEFAULT 0.00,
    investor_gains DECIMAL(15, 2) DEFAULT 0.00,
    shepherd_gains DECIMAL(15, 2) DEFAULT 0.00,
    number_of_gain_entries INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(month, year)
);

-- Trigger pour updated_at
CREATE TRIGGER update_monthly_gain_summary_updated_at 
BEFORE UPDATE ON monthly_gain_summary
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Index
CREATE INDEX idx_monthly_gain_summary_date ON monthly_gain_summary(year, month);

-- Vue pour faciliter les requêtes
CREATE OR REPLACE VIEW monthly_gain_report AS
SELECT 
    month,
    year,
    TO_CHAR(TO_DATE(year || '-' || month || '-01', 'YYYY-MM-DD'), 'Month YYYY') as period_name,
    total_bankroll,
    total_gain_amount,
    total_gain_percentage,
    investor_gains,
    shepherd_gains,
    number_of_gain_entries,
    updated_at as last_updated
FROM monthly_gain_summary
ORDER BY year DESC, month DESC;
