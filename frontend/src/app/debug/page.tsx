'use client';

import { useState, useEffect } from 'react';

export default function DebugPage() {
  const [debug, setDebug] = useState<any>({});

  useEffect(() => {
    const runDiagnostic = async () => {
      const token = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

      const info: any = {
        token: token ? token.substring(0, 50) + '...' : 'AUCUN TOKEN',
        refreshToken: refreshToken ? 'OUI' : 'NON',
        apiUrl: apiUrl,
        apiTest: 'En cours...'
      };

      setDebug(info);

      if (token) {
        try {
          const response = await fetch(`${apiUrl}/users/profile`, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            info.apiTest = '✅ API FONCTIONNE - User: ' + data.user.email;
          } else {
            info.apiTest = '❌ ERREUR ' + response.status + ' - ' + response.statusText;
          }
        } catch (error: any) {
          info.apiTest = '❌ ERREUR RÉSEAU: ' + error.message;
        }
      } else {
        info.apiTest = '❌ PAS DE TOKEN - CONNECTEZ-VOUS';
      }

      setDebug(info);
    };

    runDiagnostic();
  }, []);

  return (
    <div className="min-h-screen p-8 bg-gray-900 text-white">
      <h1 className="text-3xl font-bold mb-8">🔍 Diagnostic Frontend</h1>
      
      <div className="space-y-4 max-w-4xl">
        <div className="bg-gray-800 p-4 rounded">
          <h2 className="font-bold mb-2">URL de l'API</h2>
          <code className="text-green-400">{debug.apiUrl}</code>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="font-bold mb-2">Token dans localStorage</h2>
          <code className={debug.token === 'AUCUN TOKEN' ? 'text-red-400' : 'text-green-400'}>
            {debug.token}
          </code>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="font-bold mb-2">Refresh Token</h2>
          <code className={debug.refreshToken === 'NON' ? 'text-red-400' : 'text-green-400'}>
            {debug.refreshToken}
          </code>
        </div>

        <div className="bg-gray-800 p-4 rounded">
          <h2 className="font-bold mb-2">Test API /users/profile</h2>
          <code className={debug.apiTest?.includes('❌') ? 'text-red-400' : 'text-green-400'}>
            {debug.apiTest}
          </code>
        </div>

        <div className="bg-blue-900 p-4 rounded border border-blue-500">
          <h2 className="font-bold mb-2">💡 Actions suggérées :</h2>
          <ul className="list-disc list-inside space-y-2 text-sm">
            <li>Si "AUCUN TOKEN" → Allez sur /login et connectez-vous</li>
            <li>Si "ERREUR 401" → Le token a expiré, reconnectez-vous</li>
            <li>Si l'URL de l'API est sur le port 5000 → Le frontend n'a pas été redémarré</li>
            <li>Si "ERREUR RÉSEAU" → Le backend n'est pas démarré</li>
          </ul>
        </div>

        <div className="pt-4">
          <a href="/login" className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded font-semibold">
            Aller à la page de connexion
          </a>
        </div>
      </div>
    </div>
  );
}
