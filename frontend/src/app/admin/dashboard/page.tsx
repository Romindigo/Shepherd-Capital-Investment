'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Users, Wallet, TrendingUp, Clock, ArrowUpCircle, FileCheck } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '@/lib/api';

export default function AdminDashboardPage() {
  const router = useRouter();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      const data = await api.getAdminStats();
      setStats(data);
    } catch (error) {
      console.error('Load stats error:', error);
    } finally {
      setLoading(false);
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
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard Administrateur</h1>
        <p className="text-gray-400">Vue d'ensemble de la plateforme Shepherd Capital Investment</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Investisseurs actifs</span>
            <Users className="w-5 h-5 text-accent" />
          </div>
          <div className="text-3xl font-bold mb-1">
            {stats?.stats.total_investors || 0} / 50
          </div>
          <div className="text-sm text-gray-400">
            {50 - (stats?.stats.total_investors || 0)} places restantes
          </div>
        </div>

        <div className="card bg-gradient-to-br from-accent/20 to-primary/10 border-accent/30">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Capital Shepherd</span>
            <Wallet className="w-5 h-5 text-accent" />
          </div>
          <div className="text-3xl font-bold mb-1 text-accent">
            {parseFloat(stats?.shepherdCapital || 0).toFixed(2)} €
          </div>
          <div className="text-sm text-gray-400">
            Capital propre société
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Bankroll investisseurs</span>
            <Wallet className="w-5 h-5 text-success" />
          </div>
          <div className="text-3xl font-bold mb-1">
            {parseFloat(stats?.stats.total_bankroll || 0).toFixed(2)} €
          </div>
          <div className="text-sm text-gray-400">
            Capital clients
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Gains distribués</span>
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <div className="text-3xl font-bold mb-1 text-success">
            {parseFloat(stats?.stats.total_gains_distributed || 0).toFixed(2)} €
          </div>
          <div className="text-sm text-gray-400">
            Aux investisseurs
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">En attente</span>
            <Clock className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold mb-1">
            {stats?.pendingTransactions || 0} + {stats?.pendingKYC || 0}
          </div>
          <div className="text-sm text-gray-400">
            Transactions & KYC
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => router.push('/admin/gains')}
          className="card hover:scale-105 transition-transform cursor-pointer bg-accent/10 border-accent/30 text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold">Saisir gain journalier</h3>
              <p className="text-sm text-gray-400">Distribution automatique</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push('/admin/kyc')}
          className="card hover:scale-105 transition-transform cursor-pointer text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-yellow-500/20 rounded-full flex items-center justify-center">
              <FileCheck className="w-6 h-6 text-yellow-500" />
            </div>
            <div>
              <h3 className="font-semibold">Valider KYC</h3>
              <p className="text-sm text-gray-400">{stats?.pendingKYC || 0} en attente</p>
            </div>
          </div>
        </button>

        <button
          onClick={() => router.push('/admin/investors')}
          className="card hover:scale-105 transition-transform cursor-pointer text-left"
        >
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 bg-success/20 rounded-full flex items-center justify-center">
              <Users className="w-6 h-6 text-success" />
            </div>
            <div>
              <h3 className="font-semibold">Voir investisseurs</h3>
              <p className="text-sm text-gray-400">{stats?.stats.total_investors || 0} actifs</p>
            </div>
          </div>
        </button>
      </div>

      {/* Recent Gains Chart */}
      {stats?.recentGains && stats.recentGains.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-6">Historique des gains (30 derniers jours)</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.recentGains.reverse()}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="gain_date" 
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
                  dataKey="gain_percentage" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981', r: 4 }}
                  name="Gain (%)"
                />
                <Line 
                  type="monotone" 
                  dataKey="redistributed_gain" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  name="Montant redistribué (€)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Statistiques dépôts/retraits</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-gray-400">Total déposé</span>
              <span className="font-semibold text-success">
                {parseFloat(stats?.stats.total_deposited || 0).toFixed(2)} €
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-gray-400">Total retiré</span>
              <span className="font-semibold text-destructive">
                {parseFloat(stats?.stats.total_withdrawn || 0).toFixed(2)} €
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
              <span className="text-gray-400">Différence nette</span>
              <span className="font-semibold">
                {(parseFloat(stats?.stats.total_deposited || 0) - parseFloat(stats?.stats.total_withdrawn || 0)).toFixed(2)} €
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Actions requises</h2>
          <div className="space-y-3">
            <a
              href="/admin/kyc"
              className="flex items-center justify-between p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg hover:bg-yellow-500/20 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <FileCheck className="w-5 h-5 text-yellow-500" />
                <span>KYC en attente</span>
              </div>
              <span className="badge badge-warning">{stats?.pendingKYC || 0}</span>
            </a>
            
            <a
              href="/admin/transactions"
              className="flex items-center justify-between p-3 bg-accent/10 border border-accent/30 rounded-lg hover:bg-accent/20 transition-colors"
            >
              <div className="flex items-center space-x-3">
                <ArrowUpCircle className="w-5 h-5 text-accent" />
                <span>Transactions en attente</span>
              </div>
              <span className="badge badge-info">{stats?.pendingTransactions || 0}</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
