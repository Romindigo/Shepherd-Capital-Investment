'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowUpCircle } from 'lucide-react';

export default function DepositSimplePage() {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [amount, setAmount] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setMessage('');

    try {
      const token = localStorage.getItem('accessToken');
      
      console.log('=== DEPOSIT SIMPLE TEST ===');
      console.log('Token:', token ? token.substring(0, 50) + '...' : 'AUCUN');
      console.log('Amount:', amount);
      
      if (!token) {
        setMessage('❌ ERREUR: Aucun token trouvé. Reconnectez-vous.');
        setTimeout(() => router.push('/login'), 2000);
        return;
      }

      console.log('Sending request to API...');
      const response = await fetch('http://localhost:5001/api/transactions/deposit', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          amount: parseFloat(amount),
          paymentMethod: 'bank_transfer',
          currency: 'EUR'
        })
      });

      console.log('Response status:', response.status);
      console.log('Response OK:', response.ok);

      let data;
      try {
        data = await response.json();
        console.log('Response data:', data);
      } catch (e) {
        console.error('Failed to parse JSON:', e);
        data = { error: 'Invalid JSON response' };
      }

      if (response.ok) {
        setMessage(`✅ Demande de dépôt créée ! Transaction ID: ${data.transaction?.id || 'N/A'}`);
        console.log('✅ SUCCESS');
        setTimeout(() => router.push('/dashboard/transactions'), 3000);
      } else {
        const errorMsg = `❌ ERREUR ${response.status}: ${data.error || 'Unknown error'}`;
        setMessage(errorMsg);
        console.error(errorMsg);
      }
    } catch (error: any) {
      const errorMsg = `❌ ERREUR RÉSEAU: ${error.message}`;
      setMessage(errorMsg);
      console.error('Network error:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dépôt Simplifié (Test)</h1>
        <p className="text-gray-400">Version simple pour tester l'API directement</p>
      </div>

      {message && (
        <div className={`p-4 rounded ${message.includes('✅') ? 'bg-green-900' : 'bg-red-900'}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-gray-800 p-6 rounded-lg space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">
            Montant (€) - Minimum 1000€
          </label>
          <input
            type="number"
            step="0.01"
            min="1000"
            className="w-full bg-gray-700 border border-gray-600 rounded px-4 py-2"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="1000.00"
            required
          />
        </div>

        <div className="bg-blue-900 p-3 rounded text-sm">
          <strong>Info:</strong> Cette page teste directement l'API sans vérifications complexes.
          Si ça fonctionne ici mais pas sur la page normale, le problème vient du frontend.
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 px-6 py-3 rounded font-semibold flex items-center justify-center"
        >
          {submitting ? (
            <>
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
              Test en cours...
            </>
          ) : (
            <>
              <ArrowUpCircle className="w-5 h-5 mr-2" />
              Tester le dépôt
            </>
          )}
        </button>

        <div className="text-xs text-gray-400 space-y-1">
          <div>Token: {localStorage.getItem('accessToken') ? '✅ Présent' : '❌ Absent'}</div>
          <div>API: http://localhost:5001/api</div>
        </div>
      </form>
    </div>
  );
}
