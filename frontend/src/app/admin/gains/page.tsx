'use client';

import { useState } from 'react';
import { TrendingUp, Calendar, Percent, CheckCircle, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminGainsPage() {
  const [gainData, setGainData] = useState({
    gainPercentage: '',
    gainDate: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await api.submitDailyGain(
        parseFloat(gainData.gainPercentage),
        gainData.gainDate
      );
      setResult(response);
      setGainData({ ...gainData, gainPercentage: '' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la soumission du gain');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold mb-2">Saisie du gain journalier</h1>
        <p className="text-gray-400">
          Saisissez le pourcentage de gain du jour pour distribution automatique
        </p>
      </div>

      {/* Messages */}
      {error && (
        <div className="card bg-destructive/10 border-destructive/30">
          <div className="flex items-center space-x-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        </div>
      )}

      {result && (
        <div className="card bg-success/10 border-success/30">
          <div className="flex items-center space-x-2 mb-4">
            <CheckCircle className="w-6 h-6 text-success" />
            <h3 className="text-lg font-semibold text-success">Gain distribué avec succès !</h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-sm text-gray-400">Bankroll totale</div>
              <div className="text-2xl font-bold">{result.summary.bankroll} €</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-sm text-gray-400">Gain total</div>
              <div className="text-2xl font-bold text-success">+{result.summary.totalGain} €</div>
            </div>
            <div className="bg-white/5 rounded-lg p-4">
              <div className="text-sm text-gray-400">Redistribué (50%)</div>
              <div className="text-2xl font-bold text-accent">{result.summary.redistributedGain} €</div>
            </div>
          </div>

          <div className="text-sm text-gray-400 mb-3">
            Distribution effectuée à {result.summary.investorsCount} investisseur(s)
          </div>

          {/* Distribution Details */}
          <div className="bg-white/5 rounded-lg p-4 max-h-80 overflow-y-auto">
            <h4 className="font-semibold mb-3">Détails de la distribution</h4>
            <div className="space-y-2">
              {result.distributions?.map((dist: any, index: number) => (
                <div key={index} className="flex items-center justify-between p-2 bg-white/5 rounded">
                  <div>
                    <div className="font-medium">{dist.name}</div>
                    <div className="text-xs text-gray-400">
                      Capital: {dist.capitalInvested} € ({dist.sharePercentage}%)
                    </div>
                  </div>
                  <div className="text-success font-semibold">
                    +{dist.gainAmount} €
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Form */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-6">Nouveau gain journalier</h2>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Date du gain</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="date"
                required
                className="input pl-10"
                value={gainData.gainDate}
                onChange={(e) => setGainData({ ...gainData, gainDate: e.target.value })}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Date à laquelle le gain a été réalisé
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Pourcentage de gain (%)</label>
            <div className="relative">
              <Percent className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="number"
                step="0.01"
                required
                className="input pl-10"
                placeholder="Ex: 2.5"
                value={gainData.gainPercentage}
                onChange={(e) => setGainData({ ...gainData, gainPercentage: e.target.value })}
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">
              Le gain peut être positif ou négatif. 50% sera automatiquement redistribué aux investisseurs.
            </p>
          </div>

          <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
            <h3 className="font-semibold text-accent mb-2">Calcul automatique</h3>
            <ul className="text-sm text-gray-300 space-y-1">
              <li>• Le système calculera automatiquement les gains pour chaque investisseur</li>
              <li>• 50% des gains seront redistribués au prorata du capital investi</li>
              <li>• Les comptes seront crédités instantanément</li>
              <li>• Les investisseurs recevront une notification automatique</li>
            </ul>
          </div>

          <button
            type="submit"
            disabled={loading || !gainData.gainPercentage}
            className="btn btn-primary w-full text-lg"
          >
            <TrendingUp className="w-5 h-5 mr-2" />
            {loading ? 'Distribution en cours...' : 'Distribuer le gain'}
          </button>
        </form>
      </div>

      {/* Info */}
      <div className="card bg-white/5">
        <h3 className="font-semibold mb-3">Comment ça marche ?</h3>
        <div className="space-y-2 text-sm text-gray-400">
          <p>
            <strong className="text-white">1. Saisie :</strong> Entrez le pourcentage de gain réalisé par la bankroll commune.
          </p>
          <p>
            <strong className="text-white">2. Calcul automatique :</strong> Le système calcule le montant total du gain 
            (Bankroll × Pourcentage), puis prend 50% pour redistribution.
          </p>
          <p>
            <strong className="text-white">3. Répartition :</strong> Chaque investisseur reçoit sa part proportionnelle 
            au capital qu'il a investi.
          </p>
          <p>
            <strong className="text-white">4. Crédit instantané :</strong> Les gains sont automatiquement ajoutés 
            au solde de chaque investisseur.
          </p>
        </div>
      </div>
    </div>
  );
}
