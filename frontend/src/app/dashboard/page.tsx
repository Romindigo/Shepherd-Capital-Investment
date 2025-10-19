'use client';

import { useEffect, useState } from 'react';
import { TrendingUp, Wallet, ArrowUpCircle, ArrowDownCircle, Users, CheckCircle, Clock } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function DashboardPage() {
  const user = useAuthStore((state) => state.user);
  const [dashboard, setDashboard] = useState<any>(null);
  const [evolution, setEvolution] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
    loadEvolution();
  }, []);

  const loadDashboard = async () => {
    try {
      const data = await api.getDashboard();
      setDashboard(data);
    } catch (error) {
      console.error('Load dashboard error:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadEvolution = async () => {
    try {
      const data = await api.getCapitalEvolution(30);
      setEvolution(data.evolution || []);
    } catch (error) {
      console.error('Load evolution error:', error);
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

  const kycApproved = user?.kycStatus === 'approved';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold mb-2">
          Bienvenue, {user?.firstName} !
        </h1>
        <p className="text-gray-400">
          Voici un aperçu de votre portefeuille d'investissement
        </p>
      </div>

      {/* KYC Alert */}
      {!kycApproved && (
        <div className="card bg-yellow-500/10 border-yellow-500/30">
          <div className="flex items-start space-x-3">
            <Clock className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-yellow-500 mb-1">KYC en attente</h3>
              <p className="text-sm text-gray-300 mb-3">
                Votre vérification d'identité est en cours. Une fois approuvée, vous pourrez effectuer des dépôts et commencer à investir.
              </p>
              <a href="/dashboard/kyc" className="text-sm text-accent hover:underline font-medium">
                Compléter mon KYC →
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Solde total</span>
            <Wallet className="w-5 h-5 text-accent" />
          </div>
          <div className="text-3xl font-bold mb-1">
            {dashboard?.investment.balance?.toFixed(2) || '0.00'} €
          </div>
          <div className="text-sm text-gray-400">
            Disponible pour retrait
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total déposé</span>
            <ArrowUpCircle className="w-5 h-5 text-success" />
          </div>
          <div className="text-3xl font-bold mb-1">
            {dashboard?.investment.totalDeposited?.toFixed(2) || '0.00'} €
          </div>
          <div className="text-sm text-gray-400">
            Capital investi
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Gains totaux</span>
            <TrendingUp className="w-5 h-5 text-accent" />
          </div>
          <div className="text-3xl font-bold mb-1 text-success">
            +{dashboard?.investment.totalGains?.toFixed(2) || '0.00'} €
          </div>
          <div className="text-sm text-gray-400">
            Depuis le début
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Total retiré</span>
            <ArrowDownCircle className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-3xl font-bold mb-1">
            {dashboard?.investment.totalWithdrawn?.toFixed(2) || '0.00'} €
          </div>
          <div className="text-sm text-gray-400">
            Retraits effectués
          </div>
        </div>
      </div>

      {/* Chart */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-6">Évolution du capital (30 jours)</h2>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={evolution}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
              <XAxis 
                dataKey="date" 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.5)' }}
              />
              <YAxis 
                stroke="rgba(255,255,255,0.5)"
                tick={{ fill: 'rgba(255,255,255,0.5)' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(30, 41, 59, 0.95)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '8px',
                  color: '#fff',
                }}
              />
              <Line 
                type="monotone" 
                dataKey="balance" 
                stroke="#3b82f6" 
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Actions & Info */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Actions rapides */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Actions rapides</h2>
          <div className="space-y-3">
            <a
              href="/dashboard/deposit"
              className={`btn btn-primary w-full ${!kycApproved && 'opacity-50 cursor-not-allowed'}`}
              onClick={(e) => !kycApproved && e.preventDefault()}
            >
              <ArrowUpCircle className="w-5 h-5 mr-2" />
              Déposer des fonds
            </a>
            <a
              href="/dashboard/withdrawal"
              className={`btn btn-secondary w-full ${!kycApproved && 'opacity-50 cursor-not-allowed'}`}
              onClick={(e) => !kycApproved && e.preventDefault()}
            >
              <ArrowDownCircle className="w-5 h-5 mr-2" />
              Demander un retrait
            </a>
          </div>
          {!kycApproved && (
            <p className="text-xs text-gray-400 mt-3 text-center">
              KYC requis pour ces actions
            </p>
          )}
        </div>

        {/* Info plateforme */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Informations plateforme</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-gray-400">Investisseurs actifs</span>
              <span className="font-semibold">
                {dashboard?.platform.totalInvestors || 0} / {dashboard?.platform.maxInvestors || 50}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-gray-400">Statut KYC</span>
              <span className={`badge ${kycApproved ? 'badge-success' : 'badge-warning'}`}>
                {kycApproved ? 'Vérifié' : 'En attente'}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-gray-400">Gains redistribués</span>
              <span className="font-semibold text-success">50%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent gains */}
      {dashboard?.gainsHistory && dashboard.gainsHistory.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Gains récents</h2>
          <div className="space-y-2">
            {dashboard.gainsHistory.slice(0, 5).map((gain: any, index: number) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white/5 rounded-lg hover:bg-white/10 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-success/20 rounded-full flex items-center justify-center">
                    <TrendingUp className="w-5 h-5 text-success" />
                  </div>
                  <div>
                    <div className="font-medium">
                      Gain journalier (+{gain.percentage}%)
                    </div>
                    <div className="text-sm text-gray-400">
                      {new Date(gain.date).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-success">
                    +{gain.amount?.toFixed(2)} €
                  </div>
                  <div className="text-xs text-gray-400">
                    Capital: {gain.capitalInvested?.toFixed(2)} €
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Security message */}
      <div className="card bg-accent/10 border-accent/30">
        <div className="flex items-start space-x-3">
          <CheckCircle className="w-6 h-6 text-accent flex-shrink-0 mt-1" />
          <div>
            <h3 className="font-semibold text-accent mb-1">Sécurité & Transparence</h3>
            <p className="text-sm text-gray-300">
              Chez Shepherd Capital Investment, vos investissements sont gérés avec rigueur, sécurité et transparence. 
              Tous vos gains sont calculés automatiquement et crédités quotidiennement.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
