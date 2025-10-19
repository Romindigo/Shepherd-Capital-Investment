'use client';

import { useEffect, useState } from 'react';
import { ArrowUpCircle, ArrowDownCircle, TrendingUp, Clock, CheckCircle, XCircle, Filter } from 'lucide-react';
import { api } from '@/lib/api';

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    loadTransactions();
  }, [filter]);

  const loadTransactions = async () => {
    try {
      const params: any = {};
      if (filter !== 'all') {
        params.type = filter;
      }
      const data = await api.getTransactions(params);
      setTransactions(data.transactions || []);
    } catch (error) {
      console.error('Load transactions error:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'deposit':
        return <ArrowUpCircle className="w-5 h-5 text-success" />;
      case 'withdrawal':
        return <ArrowDownCircle className="w-5 h-5 text-destructive" />;
      case 'gain':
        return <TrendingUp className="w-5 h-5 text-accent" />;
      default:
        return <Clock className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'deposit':
        return 'Dépôt';
      case 'withdrawal':
        return 'Retrait';
      case 'gain':
        return 'Gain';
      case 'fee':
        return 'Frais';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return (
          <span className="badge badge-success">
            <CheckCircle className="w-3 h-3 mr-1" />
            Complété
          </span>
        );
      case 'pending':
        return (
          <span className="badge badge-warning">
            <Clock className="w-3 h-3 mr-1" />
            En attente
          </span>
        );
      case 'rejected':
        return (
          <span className="badge badge-error">
            <XCircle className="w-3 h-3 mr-1" />
            Rejeté
          </span>
        );
      default:
        return (
          <span className="badge badge-info">
            {status}
          </span>
        );
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
    <div className="space-y-8 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Transactions</h1>
          <p className="text-gray-400">Historique complet de vos opérations</p>
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-5 h-5 text-gray-400" />
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="input py-2"
          >
            <option value="all">Toutes</option>
            <option value="deposit">Dépôts</option>
            <option value="withdrawal">Retraits</option>
            <option value="gain">Gains</option>
          </select>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <a
          href="/dashboard/deposit"
          className="card hover:scale-105 transition-transform cursor-pointer"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
              <ArrowUpCircle className="w-6 h-6 text-success" />
            </div>
            <div>
              <h3 className="font-semibold">Effectuer un dépôt</h3>
              <p className="text-sm text-gray-400">Ajouter des fonds à votre portefeuille</p>
            </div>
          </div>
        </a>

        <a
          href="/dashboard/withdrawal"
          className="card hover:scale-105 transition-transform cursor-pointer"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-destructive/20 rounded-full flex items-center justify-center">
              <ArrowDownCircle className="w-6 h-6 text-destructive" />
            </div>
            <div>
              <h3 className="font-semibold">Demander un retrait</h3>
              <p className="text-sm text-gray-400">Retirer vos gains ou capital</p>
            </div>
          </div>
        </a>
      </div>

      {/* Transactions List */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-6">Historique des transactions</h2>
        
        {transactions.length === 0 ? (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-gray-400">Aucune transaction pour le moment</p>
          </div>
        ) : (
          <div className="space-y-3">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center space-x-4 flex-1">
                  <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                    {getTypeIcon(transaction.type)}
                  </div>
                  
                  <div className="flex-1">
                    <div className="font-medium">{getTypeLabel(transaction.type)}</div>
                    <div className="text-sm text-gray-400">
                      {new Date(transaction.created_at).toLocaleDateString('fr-FR', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                    {transaction.description && (
                      <div className="text-xs text-gray-500 mt-1">{transaction.description}</div>
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className={`font-semibold ${
                      transaction.type === 'deposit' || transaction.type === 'gain' 
                        ? 'text-success' 
                        : 'text-destructive'
                    }`}>
                      {transaction.type === 'deposit' || transaction.type === 'gain' ? '+' : '-'}
                      {parseFloat(transaction.amount || 0).toFixed(2)} {transaction.currency || 'EUR'}
                    </div>
                    <div className="text-xs text-gray-400">
                      {transaction.payment_method && `via ${transaction.payment_method}`}
                    </div>
                  </div>
                  
                  {getStatusBadge(transaction.status)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
