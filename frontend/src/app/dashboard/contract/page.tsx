'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FileText, Download, Calendar, User, Wallet } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function ContractPage() {
  const router = useRouter();
  const user = useAuthStore((state) => state.user);
  const [loading, setLoading] = useState(true);
  const [investment, setInvestment] = useState<any>(null);

  useEffect(() => {
    loadInvestment();
  }, []);

  const loadInvestment = async () => {
    try {
      const dashboard = await api.getDashboard();
      setInvestment(dashboard.investment);
    } catch (error: any) {
      console.error('Load investment error:', error);
      if (error.response?.status === 401) {
        router.push('/login?redirect=/dashboard/contract');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    // Créer un PDF simple (pourrait être amélioré avec une vraie librairie PDF)
    const contractContent = `
CONTRAT D'INVESTISSEMENT
Shepherd Capital Investment

Date: ${new Date().toLocaleDateString('fr-FR')}

INVESTISSEUR:
Nom: ${user?.firstName} ${user?.lastName}
Email: ${user?.email}

CAPITAL INVESTI:
Montant total: ${investment?.totalDeposited || 0} €
Solde actuel: ${investment?.balance || 0} €
Gains totaux: ${investment?.totalGains || 0} €

TERMES DU CONTRAT:
- Redistribution des gains: 50% pour l'investisseur, 50% pour Shepherd Capital
- Les gains sont calculés et distribués quotidiennement
- Les retraits sont soumis à validation de l'administrateur
- Montant minimum de dépôt: 1,000 €

Ce contrat est régi par les lois françaises.
    `;
    
    const blob = new Blob([contractContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `contrat-shepherd-capital-${user?.email}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
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
    <div className="max-w-4xl mx-auto space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mon Contrat d'Investissement</h1>
          <p className="text-gray-400">
            Consultez les détails de votre contrat avec Shepherd Capital
          </p>
        </div>
        <button
          onClick={handleDownload}
          className="btn btn-primary"
        >
          <Download className="w-5 h-5 mr-2" />
          Télécharger
        </button>
      </div>

      {/* Informations investisseur */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <User className="w-5 h-5 mr-2 text-accent" />
          Informations Investisseur
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 bg-white/5 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Nom complet</div>
            <div className="font-semibold">{user?.firstName} {user?.lastName}</div>
          </div>
          <div className="p-4 bg-white/5 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Email</div>
            <div className="font-semibold">{user?.email}</div>
          </div>
          <div className="p-4 bg-white/5 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Date d'adhésion</div>
            <div className="font-semibold flex items-center">
              <Calendar className="w-4 h-4 mr-2" />
              {investment?.createdAt ? new Date(investment.createdAt).toLocaleDateString('fr-FR') : 'N/A'}
            </div>
          </div>
          <div className="p-4 bg-white/5 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Statut KYC</div>
            <div className="font-semibold">
              <span className={`badge ${user?.kycStatus === 'approved' ? 'badge-success' : 'badge-warning'}`}>
                {user?.kycStatus === 'approved' ? 'Vérifié' : 'En attente'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Capital investi */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <Wallet className="w-5 h-5 mr-2 text-accent" />
          Capital et Performance
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 bg-accent/10 rounded-lg border border-accent/30">
            <div className="text-sm text-gray-400 mb-1">Capital investi</div>
            <div className="text-2xl font-bold text-accent">
              {investment?.totalDeposited?.toFixed(2) || '0.00'} €
            </div>
          </div>
          <div className="p-4 bg-success/10 rounded-lg border border-success/30">
            <div className="text-sm text-gray-400 mb-1">Gains totaux</div>
            <div className="text-2xl font-bold text-success">
              +{investment?.totalGains?.toFixed(2) || '0.00'} €
            </div>
          </div>
          <div className="p-4 bg-white/5 rounded-lg">
            <div className="text-sm text-gray-400 mb-1">Solde actuel</div>
            <div className="text-2xl font-bold">
              {investment?.balance?.toFixed(2) || '0.00'} €
            </div>
          </div>
        </div>
      </div>

      {/* Termes du contrat */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4 flex items-center">
          <FileText className="w-5 h-5 mr-2 text-accent" />
          Termes et Conditions
        </h2>
        <div className="space-y-4 text-gray-300">
          <div className="p-4 bg-white/5 rounded-lg">
            <h3 className="font-semibold text-white mb-2">1. Redistribution des gains</h3>
            <p className="text-sm">
              Les gains générés sont redistribués selon la répartition suivante :
            </p>
            <ul className="list-disc list-inside text-sm mt-2 space-y-1 ml-4">
              <li><strong>50%</strong> pour l'investisseur</li>
              <li><strong>50%</strong> pour Shepherd Capital (frais de gestion)</li>
            </ul>
          </div>

          <div className="p-4 bg-white/5 rounded-lg">
            <h3 className="font-semibold text-white mb-2">2. Calcul et distribution des gains</h3>
            <p className="text-sm">
              Les gains sont calculés quotidiennement sur le capital total géré par Shepherd Capital.
              La distribution est effectuée automatiquement et apparaît dans votre solde en temps réel.
            </p>
          </div>

          <div className="p-4 bg-white/5 rounded-lg">
            <h3 className="font-semibold text-white mb-2">3. Dépôts et retraits</h3>
            <ul className="list-disc list-inside text-sm space-y-1 ml-4">
              <li>Montant minimum de dépôt : <strong>1,000 €</strong></li>
              <li>Les dépôts sont soumis à validation de l'administrateur</li>
              <li>Les retraits peuvent être demandés à tout moment</li>
              <li>Les retraits sont traités sous 2-5 jours ouvrés après validation</li>
            </ul>
          </div>

          <div className="p-4 bg-white/5 rounded-lg">
            <h3 className="font-semibold text-white mb-2">4. KYC et vérification</h3>
            <p className="text-sm">
              Conformément aux réglementations en vigueur, tous les investisseurs doivent compléter 
              le processus de vérification d'identité (KYC) avant de pouvoir effectuer des dépôts ou retraits.
            </p>
          </div>

          <div className="p-4 bg-white/5 rounded-lg">
            <h3 className="font-semibold text-white mb-2">5. Risques</h3>
            <p className="text-sm">
              Tout investissement comporte des risques. Le capital investi peut varier à la hausse comme à la baisse.
              Les performances passées ne garantissent pas les résultats futurs.
            </p>
          </div>

          <div className="p-4 bg-white/5 rounded-lg">
            <h3 className="font-semibold text-white mb-2">6. Juridiction</h3>
            <p className="text-sm">
              Ce contrat est régi par les lois françaises. Tout litige sera soumis aux tribunaux compétents de France.
            </p>
          </div>
        </div>
      </div>

      {/* Signature */}
      <div className="card bg-white/5">
        <div className="text-center py-4">
          <p className="text-sm text-gray-400 mb-2">Contrat accepté le</p>
          <p className="font-semibold">
            {investment?.createdAt ? new Date(investment.createdAt).toLocaleDateString('fr-FR', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            }) : 'Date non disponible'}
          </p>
          <p className="text-xs text-gray-500 mt-4">
            Document généré le {new Date().toLocaleDateString('fr-FR')} à {new Date().toLocaleTimeString('fr-FR')}
          </p>
        </div>
      </div>
    </div>
  );
}
