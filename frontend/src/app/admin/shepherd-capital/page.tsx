'use client';

import { useEffect, useState } from 'react';
import { Wallet, Plus, Minus, TrendingUp, Calendar, Download, FileSpreadsheet } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from '@/lib/api';

export default function ShepherdCapitalPage() {
  const [summary, setSummary] = useState<any>(null);
  const [history, setHistory] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    transactionType: 'deposit' as 'deposit' | 'withdrawal' | 'adjustment',
    category: '',
    description: ''
  });
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1);
  const [exportYear, setExportYear] = useState(new Date().getFullYear());
  const [chartData, setChartData] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const data = await api.getShepherdCapital();
      setSummary(data.summary);
      setHistory(data.history);
      
      // Préparer les données pour le graphique
      const chart: { date: string; balance: number; fullDate: string }[] = [];
      let balance = 0;
      
      // Inverser pour calculer du plus ancien au plus récent
      const reversed = [...data.history].reverse();
      reversed.forEach((transaction: any) => {
        const amount = parseFloat(transaction.amount);
        if (transaction.transaction_type === 'withdrawal') {
          balance -= amount;
        } else {
          balance += amount;
        }
        
        chart.push({
          date: new Date(transaction.created_at).toLocaleDateString('fr-FR'),
          balance: parseFloat(balance.toFixed(2)),
          fullDate: transaction.created_at
        });
      });
      
      setChartData(chart);
    } catch (error) {
      console.error('Load Shepherd capital error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.addShepherdCapital({
        amount: parseFloat(formData.amount),
        transactionType: formData.transactionType,
        category: formData.category,
        description: formData.description
      });
      setShowModal(false);
      setFormData({ amount: '', transactionType: 'deposit', category: '', description: '' });
      await loadData();
    } catch (error) {
      console.error('Add capital error:', error);
      alert('Erreur lors de l\'ajout du capital');
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
          <h1 className="text-3xl font-bold mb-2">Capital Propre Shepherd</h1>
          <p className="text-gray-400">
            Capital de la société qui n'est pas redistribué aux investisseurs
          </p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => setShowExportModal(true)}
            className="btn btn-secondary"
          >
            <FileSpreadsheet className="w-4 h-4 mr-2" />
            Exporter CSV
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="btn btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Ajouter une transaction
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="card bg-gradient-to-r from-accent/20 to-primary/20 border-accent/30">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
              <Wallet className="w-6 h-6 text-accent" />
            </div>
            <div>
              <div className="text-sm text-gray-400">Capital Total Shepherd</div>
              <div className="text-3xl font-bold">{parseFloat(summary?.total_capital || 0).toFixed(2)} €</div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-400">Transactions</div>
            <div className="text-2xl font-semibold">{summary?.total_transactions || 0}</div>
          </div>
        </div>
        <div className="text-xs text-gray-400">
          Ce capital est utilisé pour la gestion du fonds et n'est pas inclus dans la redistribution des gains aux investisseurs.
        </div>
      </div>

      {/* Evolution Chart */}
      {chartData.length > 0 && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-6">Évolution du capital</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                <XAxis 
                  dataKey="date" 
                  stroke="rgba(255,255,255,0.5)"
                  tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                  interval="preserveStartEnd"
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
                  formatter={(value: any) => [`${parseFloat(value).toFixed(2)} €`, 'Capital']}
                />
                <Line 
                  type="monotone" 
                  dataKey="balance" 
                  stroke="#3b82f6" 
                  strokeWidth={3}
                  dot={{ fill: '#3b82f6', r: 4 }}
                  name="Capital (€)"
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* History */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-6">Historique des transactions</h2>
        
        {history.length === 0 ? (
          <div className="text-center py-12">
            <Wallet className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400">Aucune transaction enregistrée</p>
          </div>
        ) : (
          <div className="space-y-3">
            {history.map((transaction) => (
              <div key={transaction.id} className="border border-white/10 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    transaction.transaction_type === 'deposit' ? 'bg-success/20' :
                    transaction.transaction_type === 'withdrawal' ? 'bg-destructive/20' :
                    'bg-accent/20'
                  }`}>
                    {transaction.transaction_type === 'deposit' && <Plus className="w-5 h-5 text-success" />}
                    {transaction.transaction_type === 'withdrawal' && <Minus className="w-5 h-5 text-destructive" />}
                    {transaction.transaction_type === 'adjustment' && <TrendingUp className="w-5 h-5 text-accent" />}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <div className="font-medium">
                        {transaction.transaction_type === 'deposit' && 'Dépôt'}
                        {transaction.transaction_type === 'withdrawal' && 'Retrait'}
                        {transaction.transaction_type === 'adjustment' && 'Ajustement'}
                      </div>
                      {transaction.category && (
                        <span className="text-xs bg-accent/20 text-accent px-2 py-1 rounded">
                          {transaction.category}
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-400">{transaction.description || 'Aucune description'}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(transaction.created_at).toLocaleString('fr-FR')}
                    </div>
                  </div>
                </div>
                <div className={`text-xl font-bold ${
                  transaction.transaction_type === 'deposit' ? 'text-success' :
                  transaction.transaction_type === 'withdrawal' ? 'text-destructive' :
                  'text-accent'
                }`}>
                  {transaction.transaction_type === 'withdrawal' ? '-' : '+'}{parseFloat(transaction.amount).toFixed(2)} €
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Nouvelle transaction</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Type de transaction</label>
                <select
                  className="input"
                  value={formData.transactionType}
                  onChange={(e) => setFormData({ ...formData, transactionType: e.target.value as any })}
                >
                  <option value="deposit">Dépôt</option>
                  <option value="withdrawal">Retrait</option>
                  <option value="adjustment">Ajustement</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Montant (€)</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  className="input"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Catégorie (optionnel)</label>
                <select
                  className="input"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="">Sélectionner une catégorie</option>
                  <option value="Gain journalier">Gain journalier</option>
                  <option value="Véhicule location">Véhicule location</option>
                  <option value="Immobilier">Immobilier</option>
                  <option value="Matériel">Matériel</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Frais généraux">Frais généraux</option>
                  <option value="Investissement">Investissement</option>
                  <option value="Autre">Autre</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Description (optionnel)</label>
                <textarea
                  className="input"
                  rows={3}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Détails de la transaction..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="btn btn-primary flex-1"
                >
                  Valider
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Export CSV Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="card max-w-md w-full">
            <h2 className="text-2xl font-bold mb-6">Exporter en CSV</h2>
            <div className="space-y-4">
              <p className="text-gray-400 text-sm">
                Sélectionnez un mois pour exporter les transactions, ou laissez vide pour exporter tout l'historique.
              </p>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Mois</label>
                  <select
                    className="input"
                    value={exportMonth}
                    onChange={(e) => setExportMonth(parseInt(e.target.value))}
                  >
                    <option value="0">Tous les mois</option>
                    <option value="1">Janvier</option>
                    <option value="2">Février</option>
                    <option value="3">Mars</option>
                    <option value="4">Avril</option>
                    <option value="5">Mai</option>
                    <option value="6">Juin</option>
                    <option value="7">Juillet</option>
                    <option value="8">Août</option>
                    <option value="9">Septembre</option>
                    <option value="10">Octobre</option>
                    <option value="11">Novembre</option>
                    <option value="12">Décembre</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Année</label>
                  <input
                    type="number"
                    className="input"
                    value={exportYear}
                    onChange={(e) => setExportYear(parseInt(e.target.value))}
                    min="2020"
                    max="2030"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowExportModal(false)}
                  className="btn btn-secondary flex-1"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    try {
                      if (exportMonth === 0) {
                        await api.exportShepherdCapitalCSV();
                      } else {
                        await api.exportShepherdCapitalCSV(exportMonth, exportYear);
                      }
                      setShowExportModal(false);
                      alert('Export réussi !');
                    } catch (error) {
                      console.error('Export error:', error);
                      alert('Erreur lors de l\'export');
                    }
                  }}
                  className="btn btn-primary flex-1"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Télécharger
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
