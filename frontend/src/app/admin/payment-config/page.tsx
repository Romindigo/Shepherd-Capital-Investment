'use client';

import { useState, useEffect } from 'react';
import { Save, Check, CreditCard, Building2, Bitcoin, Plus, Trash2 } from 'lucide-react';

interface PaymentConfig {
  id: string;
  config_key: string;
  config_value: any;
  is_active: boolean;
}

export default function PaymentConfigPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [configs, setConfigs] = useState<PaymentConfig[]>([]);
  
  const [bankConfig, setBankConfig] = useState({
    accountHolder: '',
    iban: '',
    bic: '',
    bankName: '',
    country: 'FR',
    isActive: false
  });
  
  const [stripeConfig, setStripeConfig] = useState({
    publicKey: '',
    secretKey: '',
    webhookSecret: '',
    isActive: false
  });
  
  const [cryptoConfigs, setCryptoConfigs] = useState<any[]>([]);

  useEffect(() => {
    loadConfigs();
  }, []);

  const loadConfigs = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5001/api/payment-config/all', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to load configs');

      const data = await response.json();
      setConfigs(data.configs);

      // Organiser les configs
      data.configs.forEach((config: PaymentConfig) => {
        if (config.config_key === 'bank_account') {
          setBankConfig({
            ...config.config_value,
            isActive: config.is_active
          });
        } else if (config.config_key === 'stripe_config') {
          setStripeConfig({
            ...config.config_value,
            isActive: config.is_active
          });
        } else if (config.config_key.startsWith('crypto_')) {
          setCryptoConfigs(prev => [...prev, {
            key: config.config_key,
            ...config.config_value,
            isActive: config.is_active
          }]);
        }
      });
    } catch (error) {
      console.error('Load configs error:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des configurations' });
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = async (configKey: string, configValue: any, isActive: boolean) => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5001/api/payment-config/${configKey}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ configValue, isActive })
      });

      if (!response.ok) throw new Error('Failed to save config');

      return true;
    } catch (error) {
      console.error('Save config error:', error);
      throw error;
    }
  };

  const handleSaveBank = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { isActive, ...configValue } = bankConfig;
      await saveConfig('bank_account', configValue, isActive);
      
      setMessage({ type: 'success', text: 'Configuration bancaire sauvegardée !' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveStripe = async () => {
    setSaving(true);
    setMessage(null);

    try {
      const { isActive, ...configValue } = stripeConfig;
      await saveConfig('stripe_config', configValue, isActive);
      
      setMessage({ type: 'success', text: 'Configuration Stripe sauvegardée !' });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCrypto = async (cryptoKey: string) => {
    setSaving(true);
    setMessage(null);

    try {
      const crypto = cryptoConfigs.find(c => c.key === cryptoKey);
      if (!crypto) return;

      const { key, isActive, ...configValue } = crypto;
      await saveConfig(cryptoKey, configValue, isActive);
      
      setMessage({ type: 'success', text: `Configuration ${crypto.name} sauvegardée !` });
      setTimeout(() => setMessage(null), 3000);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de la sauvegarde' });
    } finally {
      setSaving(false);
    }
  };

  const updateCryptoNetwork = (cryptoKey: string, network: string, field: string, value: string) => {
    setCryptoConfigs(prev => prev.map(crypto => {
      if (crypto.key === cryptoKey) {
        return {
          ...crypto,
          networks: {
            ...crypto.networks,
            [network]: {
              ...crypto.networks[network],
              [field]: value
            }
          }
        };
      }
      return crypto;
    }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold mb-2">Configuration des paiements</h1>
        <p className="text-gray-400">
          Configurez les méthodes de paiement disponibles pour vos investisseurs
        </p>
      </div>

      {message && (
        <div className={`card ${message.type === 'success' ? 'bg-success/10 border-success/30' : 'bg-error/10 border-error/30'}`}>
          <div className="flex items-center space-x-3">
            {message.type === 'success' ? (
              <Check className="w-6 h-6 text-success" />
            ) : (
              <span className="text-error">❌</span>
            )}
            <p className={message.type === 'success' ? 'text-success' : 'text-error'}>
              {message.text}
            </p>
          </div>
        </div>
      )}

      {/* Configuration Virement Bancaire */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <Building2 className="w-8 h-8 text-accent" />
            <div>
              <h2 className="text-xl font-semibold">Virement Bancaire</h2>
              <p className="text-sm text-gray-400">Coordonnées bancaires pour les dépôts</p>
            </div>
          </div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <span className="text-sm text-gray-400">Actif</span>
            <input
              type="checkbox"
              checked={bankConfig.isActive}
              onChange={(e) => setBankConfig({ ...bankConfig, isActive: e.target.checked })}
              className="w-5 h-5"
            />
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Titulaire du compte</label>
            <input
              type="text"
              className="input"
              value={bankConfig.accountHolder}
              onChange={(e) => setBankConfig({ ...bankConfig, accountHolder: e.target.value })}
              placeholder="Shepherd Capital Investment"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nom de la banque</label>
            <input
              type="text"
              className="input"
              value={bankConfig.bankName}
              onChange={(e) => setBankConfig({ ...bankConfig, bankName: e.target.value })}
              placeholder="BNP Paribas"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">IBAN</label>
            <input
              type="text"
              className="input font-mono"
              value={bankConfig.iban}
              onChange={(e) => setBankConfig({ ...bankConfig, iban: e.target.value.toUpperCase() })}
              placeholder="FR76 1234 5678 9012 3456 7890 123"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">BIC/SWIFT</label>
            <input
              type="text"
              className="input font-mono"
              value={bankConfig.bic}
              onChange={(e) => setBankConfig({ ...bankConfig, bic: e.target.value.toUpperCase() })}
              placeholder="BNPAFRPP"
            />
          </div>
        </div>

        <button
          onClick={handleSaveBank}
          disabled={saving}
          className="btn btn-primary"
        >
          <Save className="w-5 h-5 mr-2" />
          Sauvegarder
        </button>
      </div>

      {/* Configuration Stripe */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <CreditCard className="w-8 h-8 text-accent" />
            <div>
              <h2 className="text-xl font-semibold">Stripe (Carte bancaire)</h2>
              <p className="text-sm text-gray-400">Paiement par carte bancaire via Stripe</p>
            </div>
          </div>
          <label className="flex items-center space-x-2 cursor-pointer">
            <span className="text-sm text-gray-400">Actif</span>
            <input
              type="checkbox"
              checked={stripeConfig.isActive}
              onChange={(e) => setStripeConfig({ ...stripeConfig, isActive: e.target.checked })}
              className="w-5 h-5"
            />
          </label>
        </div>

        <div className="space-y-4 mb-4">
          <div>
            <label className="block text-sm font-medium mb-2">Public Key (Publishable Key)</label>
            <input
              type="text"
              className="input font-mono text-sm"
              value={stripeConfig.publicKey}
              onChange={(e) => setStripeConfig({ ...stripeConfig, publicKey: e.target.value })}
              placeholder="pk_live_..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Secret Key</label>
            <input
              type="password"
              className="input font-mono text-sm"
              value={stripeConfig.secretKey}
              onChange={(e) => setStripeConfig({ ...stripeConfig, secretKey: e.target.value })}
              placeholder="sk_live_..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Webhook Secret</label>
            <input
              type="password"
              className="input font-mono text-sm"
              value={stripeConfig.webhookSecret}
              onChange={(e) => setStripeConfig({ ...stripeConfig, webhookSecret: e.target.value })}
              placeholder="whsec_..."
            />
          </div>
        </div>

        <button
          onClick={handleSaveStripe}
          disabled={saving}
          className="btn btn-primary"
        >
          <Save className="w-5 h-5 mr-2" />
          Sauvegarder
        </button>
      </div>

      {/* Configuration Crypto */}
      {cryptoConfigs.map((crypto) => (
        <div key={crypto.key} className="card">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center space-x-3">
              <Bitcoin className="w-8 h-8 text-accent" />
              <div>
                <h2 className="text-xl font-semibold">{crypto.name}</h2>
                <p className="text-sm text-gray-400">Adresses de réception {crypto.name}</p>
              </div>
            </div>
            <label className="flex items-center space-x-2 cursor-pointer">
              <span className="text-sm text-gray-400">Actif</span>
              <input
                type="checkbox"
                checked={crypto.isActive}
                onChange={(e) => {
                  setCryptoConfigs(prev => prev.map(c => 
                    c.key === crypto.key ? { ...c, isActive: e.target.checked } : c
                  ));
                }}
                className="w-5 h-5"
              />
            </label>
          </div>

          <div className="space-y-4 mb-4">
            {Object.keys(crypto.networks).map((network) => (
              <div key={network} className="p-4 bg-white/5 rounded-lg">
                <h3 className="font-semibold mb-3">{network}</h3>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">Adresse</label>
                    <input
                      type="text"
                      className="input font-mono text-sm"
                      value={crypto.networks[network].address}
                      onChange={(e) => updateCryptoNetwork(crypto.key, network, 'address', e.target.value)}
                      placeholder={network.includes('TRC') ? 'T...' : '0x...'}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Montant minimum</label>
                    <input
                      type="number"
                      step="0.01"
                      className="input"
                      value={crypto.networks[network].minAmount}
                      onChange={(e) => updateCryptoNetwork(crypto.key, network, 'minAmount', e.target.value)}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => handleSaveCrypto(crypto.key)}
            disabled={saving}
            className="btn btn-primary"
          >
            <Save className="w-5 h-5 mr-2" />
            Sauvegarder
          </button>
        </div>
      ))}
    </div>
  );
}
