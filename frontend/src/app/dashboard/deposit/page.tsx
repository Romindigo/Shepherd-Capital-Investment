'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpCircle, AlertCircle, CheckCircle, Copy, ArrowLeft, Bitcoin, Building2, Check } from 'lucide-react';
import { api } from '@/lib/api';

export default function DepositPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [kycStatus, setKycStatus] = useState('pending');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [step, setStep] = useState(1);
  const [copied, setCopied] = useState('');
  const [formData, setFormData] = useState({
    amount: '',
    paymentMethod: '' as 'fiat' | 'crypto' | '',
    cryptoType: 'USDT',
    network: 'TRC20',
    metadata: {
      note: '',
      transactionHash: '' // Pour les crypto
    }
  });

  // Coordonnées bancaires de Shepherd Capital (à configurer)
  const shepherdBankInfo = {
    accountHolder: 'Shepherd Capital Investment',
    iban: 'FR76 1234 5678 9012 3456 7890 123',
    bic: 'BNPAFRPP',
    bankName: 'BNP Paribas',
    reference: `DEP-${Date.now()}`
  };

  // Adresses crypto de Shepherd Capital (à configurer)
  const shepherdCryptoAddresses = {
    USDT: {
      TRC20: 'TYourTronAddressHere123456789',
      ERC20: '0xYourEthereumAddressHere123456789',
      BEP20: '0xYourBSCAddressHere123456789'
    },
    USDC: {
      TRC20: 'TYourTronAddressHere123456789',
      ERC20: '0xYourEthereumAddressHere123456789',
      BEP20: '0xYourBSCAddressHere123456789'
    }
  };

  useEffect(() => {
    checkKYC();
  }, []);

  const checkKYC = async () => {
    try {
      console.log('=== DEPOSIT PAGE - CHECK KYC ===');
      console.log('Token:', localStorage.getItem('accessToken')?.substring(0, 50) + '...');
      console.log('API URL:', process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api');
      
      const profile = await api.getProfile();
      console.log('✅ Profile loaded:', profile.user.email, 'KYC:', profile.user.kycStatus);
      
      setKycStatus(profile.user.kycStatus);
      
      if (profile.user.kycStatus !== 'approved') {
        setMessage({ 
          type: 'error', 
          text: 'Votre KYC doit être approuvé avant de pouvoir effectuer un dépôt.' 
        });
      }
    } catch (error: any) {
      console.error('❌ Check KYC error:', error);
      console.error('Error status:', error.response?.status);
      console.error('Error message:', error.message);
      
      if (error.response?.status === 401) {
        console.error('🔴 ERREUR 401 - Redirection vers login');
        setMessage({ 
          type: 'error', 
          text: 'Session expirée. Reconnectez-vous.' 
        });
        setTimeout(() => {
          router.push('/login?redirect=/dashboard/deposit');
        }, 2000);
      } else {
        setMessage({ 
          type: 'error', 
          text: error.response?.data?.error || 'Erreur lors de la vérification du KYC' 
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleNext = () => {
    if (step === 1) {
      const amount = parseFloat(formData.amount);
      if (!amount || amount < 1000) {
        setMessage({ type: 'error', text: 'Le montant minimum de dépôt est de 1,000 €' });
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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (kycStatus !== 'approved') {
      setMessage({ type: 'error', text: 'Votre KYC doit être approuvé pour effectuer un dépôt.' });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const metadata = formData.paymentMethod === 'fiat' 
        ? {
            reference: shepherdBankInfo.reference,
            note: formData.metadata.note
          }
        : {
            cryptoType: formData.cryptoType,
            network: formData.network,
            transactionHash: formData.metadata.transactionHash,
            destinationAddress: shepherdCryptoAddresses[formData.cryptoType as 'USDT' | 'USDC'][formData.network as 'TRC20' | 'ERC20' | 'BEP20'],
            note: formData.metadata.note
          };

      await api.createDeposit({
        amount: parseFloat(formData.amount),
        paymentMethod: formData.paymentMethod,
        metadata
      });

      setMessage({ 
        type: 'success', 
        text: 'Demande de dépôt créée avec succès ! Effectuez le paiement selon les instructions. Votre compte sera crédité après validation par l\'admin.' 
      });
      
      setTimeout(() => {
        router.push('/dashboard/transactions');
      }, 5000);

    } catch (error: any) {
      console.error('Create deposit error:', error);
      setMessage({ 
        type: 'error', 
        text: error.response?.data?.error || 'Erreur lors de la création du dépôt' 
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
        <h1 className="text-3xl font-bold mb-2">Déposer des fonds</h1>
        <p className="text-gray-400">
          Étape {step} sur 3 - {step === 1 ? 'Montant' : step === 2 ? 'Méthode de paiement' : 'Instructions de paiement'}
        </p>
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
                Montant du dépôt (€) <span className="text-error">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="1000"
                className="input text-2xl font-bold"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                placeholder="0.00"
                required
                disabled={kycStatus !== 'approved'}
                autoFocus
              />
              <p className="text-sm text-gray-400 mt-2">
                Montant minimum : 1,000 €
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

        {/* Étape 3 : Instructions de paiement */}
        {step === 3 && (
          <>
            {/* Instructions Fiat */}
            {formData.paymentMethod === 'fiat' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Instructions de virement bancaire</h3>
                
                <div className="card bg-accent/10 border-accent/30 space-y-3">
                  <p className="text-sm text-gray-300">
                    Effectuez un virement bancaire vers le compte suivant :
                  </p>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <div className="text-xs text-gray-400">Bénéficiaire</div>
                        <div className="font-mono text-sm">{shepherdBankInfo.accountHolder}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(shepherdBankInfo.accountHolder, 'holder')}
                        className="p-2 hover:bg-white/10 rounded transition-colors"
                      >
                        {copied === 'holder' ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <div className="text-xs text-gray-400">IBAN</div>
                        <div className="font-mono text-sm">{shepherdBankInfo.iban}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(shepherdBankInfo.iban, 'iban')}
                        className="p-2 hover:bg-white/10 rounded transition-colors"
                      >
                        {copied === 'iban' ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                      <div>
                        <div className="text-xs text-gray-400">BIC/SWIFT</div>
                        <div className="font-mono text-sm">{shepherdBankInfo.bic}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(shepherdBankInfo.bic, 'bic')}
                        className="p-2 hover:bg-white/10 rounded transition-colors"
                      >
                        {copied === 'bic' ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-warning/20 rounded-lg border border-warning/30">
                      <div>
                        <div className="text-xs text-warning font-semibold">Référence OBLIGATOIRE</div>
                        <div className="font-mono text-sm font-bold">{shepherdBankInfo.reference}</div>
                      </div>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(shepherdBankInfo.reference, 'ref')}
                        className="p-2 hover:bg-white/10 rounded transition-colors"
                      >
                        {copied === 'ref' ? (
                          <Check className="w-4 h-4 text-success" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <p className="text-xs text-warning">
                    ⚠️ Important : Indiquez la référence "{shepherdBankInfo.reference}" dans le libellé du virement pour que nous puissions identifier votre paiement.
                  </p>
                </div>
              </div>
            )}

            {/* Instructions Crypto */}
            {formData.paymentMethod === 'crypto' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Instructions de paiement crypto</h3>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Stablecoin <span className="text-error">*</span>
                  </label>
                  <select
                    className="input"
                    value={formData.cryptoType}
                    onChange={(e) => setFormData({ ...formData, cryptoType: e.target.value })}
                    required
                  >
                    <option value="USDT">USDT (Tether)</option>
                    <option value="USDC">USDC (USD Coin)</option>
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

                <div className="card bg-accent/10 border-accent/30">
                  <p className="text-sm text-gray-300 mb-3">
                    Envoyez <strong>{formData.cryptoType}</strong> sur le réseau <strong>{formData.network}</strong> à l'adresse suivante :
                  </p>

                  <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                    <div className="flex-1 mr-3">
                      <div className="text-xs text-gray-400 mb-1">Adresse de dépôt</div>
                      <div className="font-mono text-sm break-all">
                        {shepherdCryptoAddresses[formData.cryptoType as 'USDT' | 'USDC'][formData.network as 'TRC20' | 'ERC20' | 'BEP20']}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => copyToClipboard(
                        shepherdCryptoAddresses[formData.cryptoType as 'USDT' | 'USDC'][formData.network as 'TRC20' | 'ERC20' | 'BEP20'],
                        'crypto'
                      )}
                      className="p-2 hover:bg-white/10 rounded transition-colors flex-shrink-0"
                    >
                      {copied === 'crypto' ? (
                        <Check className="w-4 h-4 text-success" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </button>
                  </div>

                  <div className="mt-3 p-3 bg-warning/20 rounded-lg border border-warning/30">
                    <p className="text-xs text-warning font-semibold mb-1">⚠️ Attention</p>
                    <ul className="text-xs text-gray-300 space-y-1">
                      <li>• Vérifiez bien le réseau sélectionné</li>
                      <li>• N'envoyez que des {formData.cryptoType} sur {formData.network}</li>
                      <li>• Double-vérifiez l'adresse avant d'envoyer</li>
                      <li>• Attendez les confirmations réseau</li>
                    </ul>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Hash de transaction (après envoi)
                  </label>
                  <input
                    type="text"
                    className="input font-mono text-sm"
                    value={formData.metadata.transactionHash}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      metadata: { ...formData.metadata, transactionHash: e.target.value }
                    })}
                    placeholder="0x... ou hash TRX"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Facultatif mais recommandé pour accélérer la validation
                  </p>
                </div>
              </div>
            )}

            {/* Note */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Note (optionnel)
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

            <div className="card bg-success/10 border-success/30">
              <p className="text-sm text-gray-300">
                ✓ Après avoir effectué le paiement, cliquez sur "Confirmer la demande" ci-dessous. 
                Votre compte sera crédité dès que l'admin aura validé la transaction.
              </p>
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
                    <ArrowUpCircle className="w-5 h-5 mr-2" />
                    Confirmer la demande
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
                  Vous devez compléter et faire approuver votre KYC avant de pouvoir effectuer un dépôt.
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
