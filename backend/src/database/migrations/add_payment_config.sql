-- Table de configuration des méthodes de paiement

CREATE TABLE IF NOT EXISTS payment_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    config_key VARCHAR(100) UNIQUE NOT NULL,
    config_value JSONB NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger pour updated_at
CREATE TRIGGER update_payment_config_updated_at 
BEFORE UPDATE ON payment_config
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Configuration par défaut
INSERT INTO payment_config (config_key, config_value, is_active) VALUES
('bank_account', '{
    "accountHolder": "Shepherd Capital Investment",
    "iban": "",
    "bic": "",
    "bankName": "",
    "country": "FR"
}', false),

('stripe_config', '{
    "publicKey": "",
    "secretKey": "",
    "webhookSecret": ""
}', false),

('crypto_usdt', '{
    "name": "USDT",
    "networks": {
        "TRC20": {"address": "", "minAmount": 100},
        "ERC20": {"address": "", "minAmount": 100},
        "BEP20": {"address": "", "minAmount": 100}
    }
}', false),

('crypto_usdc', '{
    "name": "USDC",
    "networks": {
        "TRC20": {"address": "", "minAmount": 100},
        "ERC20": {"address": "", "minAmount": 100},
        "BEP20": {"address": "", "minAmount": 100}
    }
}', false),

('crypto_btc', '{
    "name": "BTC",
    "networks": {
        "Bitcoin": {"address": "", "minAmount": 0.001}
    }
}', false),

('crypto_eth', '{
    "name": "ETH",
    "networks": {
        "Ethereum": {"address": "", "minAmount": 0.01}
    }
}', false);
