'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowDownCircle, AlertCircle, CheckCircle, Wallet, ArrowLeft, Bitcoin, Building2, AlertTriangle } from 'lucide-react';
import { api } from '@/lib/api';

export default function WithdrawalPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [balance, setBalance] = useState(0);
  const [kycStatus, setKycStatus] = useState('pending');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: '' as 'fiat' | 'crypto' | '',
    // Fiat
    iban: '',
    bic: '',
    bankName: '',
    accountHolder: '',
    // Crypto
    cryptoType: 'USDT',
    walletAddress: '',
    network: 'TRC20',
    metadata: {
      note: ''
    }
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      console.log('=== WITHDRAWAL PAGE - LOAD DATA ===');
      console.log('Token:', localStorage.getItem('accessToken')?.substring(0, 50) + '...');
      console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api');
      
      const [profile, dashboard] = await Promise.all([
        api.getProfile(),
        api.getDashboard()
      ]);
      
      console.log('✅ Data loaded:', profile.user.email, 'Balance:', dashboard.investment?.balance);
      
      setKycStatus(profile.user.kycStatus);
      setBalance(dashboard.investment?.balance || 0);
      
      if (profile.user.kycStatus !== 'approved') {
        setMessage({ 
          type: 'error', 
          text: 'Votre KYC doit être approuvé avant de pouvoir effectuer un retrait.' 
        });
      }
    } catch (error: any) {
      console.error('❌ Load data error:', error);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      
      if (error.response?.status === 401) {
        console.error('🔴 ERREUR 401 - Redirection vers login');
        setMessage({ 
          type: 'error', 
          text: 'Session expirée. Reconnectez-vous.' 
        });
        setTimeout(() => {
          router.push('/login?redirect=/dashboard/withdrawal');
        }, 2000);
      } else {
        setMessage({ 
          type: 'error', 
          text: error.response?.data?.error || 'Erreur lors du chargement des données' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      const amount = parseFloat(formData.amount);
      if (!amount || amount <= 0) {
        setMessage({ type: 'error', text: 'Veuillez entrer un montant valide' });
        return;
      }
      if (amount > balance) {
        setMessage({ type: 'error', text: 'Solde insuffisant' });
        return;
      }
      setMessage(null);
      setStep(2);
    } else if (step === 2) {
      if (!formData.paymentMethod) {
        setMessage({ type: 'error', text: 'Veuillez choisir une méthode de paiement' });
        return;
      }
      setMessage(null);
      setStep(3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (kycStatus !== 'approved') {
      setMessage({ type: 'error', text: 'Votre KYC doit être approuvé pour effectuer un retrait.' });
      return;
    }

    // Validation selon la méthode
    if (formData.paymentMethod === 'fiat') {
      if (!formData.iban || !formData.accountHolder) {
        setMessage({ type: 'error', text: 'Veuillez remplir toutes les informations bancaires' });
        return;
      }
    } else if (formData.paymentMethod === 'crypto') {
      if (!formData.walletAddress || !formData.cryptoType) {
        setMessage({ type: 'error', text: 'Veuillez remplir toutes les informations crypto' });
        return;
      }
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const metadata = formData.paymentMethod === 'fiat' 
        ? {
            iban: formData.iban,
            bic: formData.bic,
            bankName: formData.bankName,
            accountHolder: formData.accountHolder,
            note: formData.metadata.note
          }
        : {
            cryptoType: formData.cryptoType,
            walletAddress: formData.walletAddress,
            network: formData.network,
            note: formData.metadata.note
          };

      await api.createWithdrawal({
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        metadata
      });

      setMessage({ 
        type: 'success', 
        text: 'Demande de retrait créée avec succès. L\'admin va traiter votre demande sous 2-5 jours ouvrés.' 
      });
      
      setTimeout(() => {
        router.push('/dashboard/transactions');
      }, 3000);

    } catch (error: any) {
      console.error('Create withdrawal error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Erreur lors de la création du retrait' 
      });
    } finally {
      setSubmitting(false);
    }
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
    <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">Demander un retrait</h1>
        <p className="text-gray-400">
          Étape {step} sur 3 - {step === 1 ? 'Montant' : step === 2 ? 'Méthode de paiement' : 'Informations de paiement'}
        </p>
      </div>

      {/* Solde disponible */}
      <div className="card bg-accent/10 border-accent/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Wallet className="w-6 h-6 text-accent" />
            <div>
              <div className="text-sm text-gray-400">Solde disponible</div>
              <div className="text-2xl font-bold text-accent">{balance.toFixed(2)} €</div>
            </div>
          </div>
        </div>
      </div>

      {message && (
        <div className={`card ${message.type === 'success' ? 'bg-success/10 border-success/30' : 'bg-error/10 border-error/30'}`}>
          <div className="flex items-start space-x-3">
            {message.type === 'success' ? (
              <CheckCircle className="w-6 h-6 text-success flex-shrink-0 mt-1" />
            ) : (
              <AlertCircle className="w-6 h-6 text-error flex-shrink-0 mt-1" />
            )}
            <p className={message.type === 'success' ? 'text-success' : 'text-error'}>
              {message.text}
            </p>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="card space-y-6">
        {/* Étape 1 : Montant */}
        {step === 1 && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">
                Montant du retrait (€) <span className="text-error">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                max={balance}
                className="input text-2xl font-bold"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
                disabled={kycStatus !== 'approved'}
                autoFocus
              />
              <p className="text-sm text-gray-400 mt-2">
                Maximum : {balance.toFixed(2)} €
              </p>
            </div>

            <button
              type="button"
              onClick={handleNext}
              className="btn btn-primary w-full"
              disabled={kycStatus !== 'approved'}
            >
              Continuer
            </button>
          </>
        )}

        {/* Étape 2 : Méthode de paiement */}
        {step === 2 && (
          <>
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Choisissez votre méthode de paiement</h3>
              
              {/* Fiat */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, paymentMethod: 'fiat' })}
                className={`w-full p-6 rounded-lg border-2 transition-all ${
                  formData.paymentMethod === 'fiat'
                    ? 'border-accent bg-accent/10'
                    : 'border-white/10 hover:border-accent/50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <Building2 className="w-10 h-10 text-accent" />
                  <div className="text-left">
                    <div className="font-semibold text-lg">Virement bancaire (Fiat)</div>
                    <div className="text-sm text-gray-400">EUR - Délai 2-5 jours ouvrés</div>
                  </div>
                </div>
              </button>

              {/* Crypto */}
              <button
                type="button"
                onClick={() => setFormData({ ...formData, paymentMethod: 'crypto' })}
                className={`w-full p-6 rounded-lg border-2 transition-all ${
                  formData.paymentMethod === 'crypto'
                    ? 'border-accent bg-accent/10'
                    : 'border-white/10 hover:border-accent/50'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <Bitcoin className="w-10 h-10 text-accent" />
                  <div className="text-left">
                    <div className="font-semibold text-lg">Crypto-monnaie</div>
                    <div className="text-sm text-gray-400">USDT, USDC - Rapide (quelques heures)</div>
                  </div>
                </div>
              </button>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn btn-secondary flex-1"
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Retour
              </button>
              <button
                type="button"
                onClick={handleNext}
                className="btn btn-primary flex-1"
                disabled={!formData.paymentMethod}
              >
                Continuer
              </button>
            </div>
          </>
        )}

        {/* Étape 3 : Détails de paiement */}
        {step === 3 && (
          <>
            {/* Formulaire Fiat */}
            {formData.paymentMethod === 'fiat' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Informations bancaires</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nom du titulaire <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.accountHolder}
                    onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
                    placeholder="Jean Dupont"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    IBAN <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.iban}
                    onChange={(e) => setFormData({ ...formData, iban: e.target.value.toUpperCase() })}
                    placeholder="FR76 1234 5678 9012 3456 7890 123"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    BIC/SWIFT (optionnel)
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.bic}
                    onChange={(e) => setFormData({ ...formData, bic: e.target.value.toUpperCase() })}
                    placeholder="BNPAFRPP"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Nom de la banque (optionnel)
                  </label>
                  <input
                    type="text"
                    className="input"
                    value={formData.bankName}
                    onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
                    placeholder="BNP Paribas"
                  />
                </div>
              </div>
            )}

            {/* Formulaire Crypto */}
            {formData.paymentMethod === 'crypto' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Informations crypto</h3>
                
                <div className="card bg-warning/10 border-warning/30">
                  <div className="flex items-start space-x-3">
                    <AlertTriangle className="w-6 h-6 text-warning flex-shrink-0 mt-1" />
                    <div>
                      <p className="font-semibold text-warning mb-1">Attention</p>
                      <p className="text-sm text-gray-300">
                        Vérifiez bien l'adresse de votre wallet et le réseau sélectionné. 
                        Toute erreur entraînera une perte définitive des fonds.
                      </p>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Type de stablecoin <span className="text-error">*</span>
                  </label>
                  <select
                    className="input"
                    value={formData.cryptoType}
                    onChange={(e) => setFormData({ ...formData, cryptoType: e.target.value })}
                    required
                  >
                    <option value="USDT">USDT (Tether)</option>
                    <option value="USDC">USDC (USD Coin)</option>
                    <option value="DAI">DAI</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Réseau <span className="text-error">*</span>
                  </label>
                  <select
                    className="input"
                    value={formData.network}
                    onChange={(e) => setFormData({ ...formData, network: e.target.value })}
                    required
                  >
                    <option value="TRC20">TRC20 (Tron) - Frais faibles</option>
                    <option value="ERC20">ERC20 (Ethereum) - Frais élevés</option>
                    <option value="BEP20">BEP20 (BSC) - Frais moyens</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Adresse du wallet <span className="text-error">*</span>
                  </label>
                  <input
                    type="text"
                    className="input font-mono text-sm"
                    value={formData.walletAddress}
                    onChange={(e) => setFormData({ ...formData, walletAddress: e.target.value })}
                    placeholder="0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb"
                    required
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Double-vérifiez cette adresse avant de continuer
                  </p>
                </div>
              </div>
            )}

            {/* Note optionnelle */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Note pour l'administrateur (optionnel)
              </label>
              <textarea
                className="input min-h-[80px]"
                value={formData.metadata.note}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  metadata: { ...formData.metadata, note: e.target.value }
                })}
                placeholder="Informations complémentaires..."
              />
            </div>

            {/* Récapitulatif */}
            <div className="card bg-white/5">
              <h3 className="font-semibold mb-3">Récapitulatif</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Montant</span>
                  <span className="font-semibold">{parseFloat(formData.amount).toFixed(2)} €</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Méthode</span>
                  <span className="font-semibold">
                    {formData.paymentMethod === 'fiat' ? 'Virement bancaire' : 'Crypto-monnaie'}
                  </span>
                </div>
                {formData.paymentMethod === 'crypto' && (
                  <>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Stablecoin</span>
                      <span className="font-semibold">{formData.cryptoType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Réseau</span>
                      <span className="font-semibold">{formData.network}</span>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="btn btn-secondary flex-1"
                disabled={submitting}
              >
                <ArrowLeft className="w-5 h-5 mr-2" />
                Retour
              </button>
              <button
                type="submit"
                className="btn btn-primary flex-1"
                disabled={submitting}
              >
                {submitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Traitement...
                  </>
                ) : (
                  <>
                    <ArrowDownCircle className="w-5 h-5 mr-2" />
                    Confirmer le retrait
                  </>
                )}
              </button>
            </div>
          </>
        )}

        {kycStatus !== 'approved' && (
          <div className="card bg-warning/10 border-warning/30">
            <div className="flex items-start space-x-3">
              <AlertCircle className="w-6 h-6 text-warning flex-shrink-0 mt-1" />
              <div>
                <p className="font-semibold text-warning mb-1">KYC requis</p>
                <p className="text-sm text-gray-300 mb-2">
                  Vous devez compléter et faire approuver votre KYC avant de pouvoir effectuer un retrait.
                </p>
                <a href="/dashboard/kyc" className="text-sm text-accent hover:underline">
                  Compléter mon KYC →
                </a>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
