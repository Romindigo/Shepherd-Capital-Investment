'use client';

import { useState, useEffect } from 'react';
import { Check, X, Clock, Eye, Search } from 'lucide-react';

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: string;
  currency: string;
  payment_method: string;
  status: string;
  description: string;
  metadata: any;
  created_at: string;
  user?: {
    email: string;
    firstName: string;
    lastName: string;
  };
}

export default function AdminTransactionsPage() {
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [filter, setFilter] = useState<'all' | 'pending' | 'completed' | 'rejected'>('all');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [processing, setProcessing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

  useEffect(() => {
    loadTransactions();
  }, []);

  const loadTransactions = async () => {
    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch('http://localhost:5001/api/admin/transactions', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) throw new Error('Failed to load transactions');

      const data = await response.json();
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Load transactions error:', error);
      setMessage({ type: 'error', text: 'Erreur lors du chargement des transactions' });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (transactionId: string) => {
    setProcessing(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5001/api/admin/transactions/${transactionId}/approve`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to approve transaction');

      setMessage({ type: 'success', text: 'Transaction approuvée avec succès !' });
      loadTransactions();
      setSelectedTransaction(null);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors de l\'approbation' });
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async (transactionId: string) => {
    setProcessing(true);
    setMessage(null);

    try {
      const token = localStorage.getItem('accessToken');
      const response = await fetch(`http://localhost:5001/api/admin/transactions/${transactionId}/reject`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) throw new Error('Failed to reject transaction');

      setMessage({ type: 'success', text: 'Transaction rejetée' });
      loadTransactions();
      setSelectedTransaction(null);
    } catch (error) {
      setMessage({ type: 'error', text: 'Erreur lors du rejet' });
    } finally {
      setProcessing(false);
    }
  };

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const getStatusBadge = (status: string) => {
    const styles = {
      pending: 'bg-warning/20 text-warning border-warning/30',
      completed: 'bg-success/20 text-success border-success/30',
      rejected: 'bg-error/20 text-error border-error/30'
    };

    const labels = {
      pending: 'En attente',
      completed: 'Validée',
      rejected: 'Rejetée'
    };

    return (
      <span className={`px-3 py-1 rounded-full text-xs font-semibold border ${styles[status as keyof typeof styles]}`}>
        {labels[status as keyof typeof labels]}
      </span>
    );
  };

  const getTypeBadge = (type: string) => {
    const styles = {
      deposit: 'bg-blue-900 text-blue-300',
      withdrawal: 'bg-purple-900 text-purple-300',
      gain: 'bg-green-900 text-green-300'
    };

    const labels = {
      deposit: 'Dépôt',
      withdrawal: 'Retrait',
      gain: 'Gain'
    };

    return (
      <span className={`px-2 py-1 rounded text-xs font-semibold ${styles[type as keyof typeof styles]}`}>
        {labels[type as keyof typeof labels]}
      </span>
    );
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
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gestion des transactions</h1>
          <p className="text-gray-400">
            Validez ou rejetez les dépôts et retraits
          </p>
        </div>
      </div>

      {message && (
        <div className={`card ${message.type === 'success' ? 'bg-success/10 border-success/30' : 'bg-error/10 border-error/30'}`}>
          <p className={message.type === 'success' ? 'text-success' : 'text-error'}>
            {message.text}
          </p>
        </div>
      )}

      {/* Filtres */}
      <div className="flex space-x-2">
        {['all', 'pending', 'completed', 'rejected'].map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f as any)}
            className={`px-4 py-2 rounded-lg transition-colors ${
              filter === f
                ? 'bg-accent text-white'
                : 'bg-white/5 hover:bg-white/10'
            }`}
          >
            {f === 'all' && 'Toutes'}
            {f === 'pending' && 'En attente'}
            {f === 'completed' && 'Validées'}
            {f === 'rejected' && 'Rejetées'}
            <span className="ml-2 text-xs opacity-70">
              ({transactions.filter(t => f === 'all' || t.status === f).length})
            </span>
          </button>
        ))}
      </div>

      {/* Liste des transactions */}
      <div className="grid grid-cols-1 gap-4">
        {filteredTransactions.length === 0 ? (
          <div className="card text-center py-12">
            <p className="text-gray-400">Aucune transaction</p>
          </div>
        ) : (
          filteredTransactions.map((transaction) => (
            <div key={transaction.id} className="card hover:border-accent/50 transition-colors">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    transaction.type === 'deposit' ? 'bg-blue-900' : 'bg-purple-900'
                  }`}>
                    {transaction.type === 'deposit' ? '↓' : '↑'}
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {getTypeBadge(transaction.type)}
                      {getStatusBadge(transaction.status)}
                    </div>
                    <div className="text-sm text-gray-400">
                      {transaction.user?.firstName} {transaction.user?.lastName} ({transaction.user?.email})
                    </div>
                    <div className="text-xs text-gray-500">
                      {new Date(transaction.created_at).toLocaleString('fr-FR')}
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-2xl font-bold">
                      {parseFloat(transaction.amount).toFixed(2)} {transaction.currency}
                    </div>
                    <div className="text-xs text-gray-400">
                      via {transaction.payment_method}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => setSelectedTransaction(transaction)}
                    className="btn btn-secondary"
                  >
                    <Eye className="w-4 h-4" />
                  </button>

                  {transaction.status === 'pending' && (
                    <>
                      <button
                        onClick={() => handleApprove(transaction.id)}
                        disabled={processing}
                        className="btn btn-primary"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleReject(transaction.id)}
                        disabled={processing}
                        className="btn bg-error hover:bg-error/80"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Modal de détails */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setSelectedTransaction(null)}>
          <div className="card max-w-2xl w-full" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Détails de la transaction</h2>
              <button onClick={() => setSelectedTransaction(null)} className="text-gray-400 hover:text-white">
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-sm text-gray-400">Type</div>
                  <div className="font-semibold">{getTypeBadge(selectedTransaction.type)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Statut</div>
                  <div className="font-semibold">{getStatusBadge(selectedTransaction.status)}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Montant</div>
                  <div className="font-semibold text-xl">
                    {parseFloat(selectedTransaction.amount).toFixed(2)} {selectedTransaction.currency}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Méthode</div>
                  <div className="font-semibold">{selectedTransaction.payment_method}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Utilisateur</div>
                  <div className="font-semibold">
                    {selectedTransaction.user?.firstName} {selectedTransaction.user?.lastName}
                  </div>
                  <div className="text-xs text-gray-400">{selectedTransaction.user?.email}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400">Date</div>
                  <div className="font-semibold">
                    {new Date(selectedTransaction.created_at).toLocaleString('fr-FR')}
                  </div>
                </div>
              </div>

              {selectedTransaction.metadata && (
                <div className="pt-4 border-t border-white/10">
                  <div className="text-sm text-gray-400 mb-2">Informations complémentaires</div>
                  <div className="bg-white/5 p-4 rounded-lg space-y-2 text-sm">
                    {/* FIAT */}
                    {selectedTransaction.metadata.iban && (
                      <>
                        <div><strong>Titulaire :</strong> {selectedTransaction.metadata.accountHolder}</div>
                        <div><strong>IBAN :</strong> {selectedTransaction.metadata.iban}</div>
                        {selectedTransaction.metadata.bic && <div><strong>BIC :</strong> {selectedTransaction.metadata.bic}</div>}
                        {selectedTransaction.metadata.bankName && <div><strong>Banque :</strong> {selectedTransaction.metadata.bankName}</div>}
                      </>
                    )}
                    
                    {/* CRYPTO */}
                    {selectedTransaction.metadata.walletAddress && (
                      <>
                        <div><strong>Crypto :</strong> {selectedTransaction.metadata.cryptoType}</div>
                        <div><strong>Réseau :</strong> {selectedTransaction.metadata.network}</div>
                        <div className="break-all"><strong>Adresse :</strong> {selectedTransaction.metadata.walletAddress}</div>
                        {selectedTransaction.metadata.transactionHash && (
                          <div className="break-all"><strong>Hash :</strong> {selectedTransaction.metadata.transactionHash}</div>
                        )}
                      </>
                    )}

                    {selectedTransaction.metadata.note && (
                      <div className="pt-2 border-t border-white/10">
                        <strong>Note :</strong> {selectedTransaction.metadata.note}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {selectedTransaction.status === 'pending' && (
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => handleApprove(selectedTransaction.id)}
                    disabled={processing}
                    className="btn btn-primary flex-1"
                  >
                    <Check className="w-5 h-5 mr-2" />
                    Approuver
                  </button>
                  <button
                    onClick={() => handleReject(selectedTransaction.id)}
                    disabled={processing}
                    className="btn bg-error hover:bg-error/80 flex-1"
                  >
                    <X className="w-5 h-5 mr-2" />
                    Rejeter
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
