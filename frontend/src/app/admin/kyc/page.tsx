'use client';

import { useEffect, useState } from 'react';
import { FileCheck, User, CheckCircle, XCircle, Clock } from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminKYCPage() {
  const [pendingUsers, setPendingUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);
  const [userDocuments, setUserDocuments] = useState<{[key: string]: any[]}>({});
  const [loadingDocs, setLoadingDocs] = useState<{[key: string]: boolean}>({});

  useEffect(() => {
    loadPendingKYC();
  }, []);

  const loadUserDocuments = async (userId: string) => {
    if (userDocuments[userId]) return; // Already loaded
    
    setLoadingDocs(prev => ({ ...prev, [userId]: true }));
    try {
      const data = await api.getUserKYCDocuments(userId);
      setUserDocuments(prev => ({ ...prev, [userId]: data.documents || [] }));
    } catch (error) {
      console.error('Load user documents error:', error);
      setUserDocuments(prev => ({ ...prev, [userId]: [] }));
    } finally {
      setLoadingDocs(prev => ({ ...prev, [userId]: false }));
    }
  };

  const loadPendingKYC = async () => {
    try {
      // Dans une vraie app, il faudrait un endpoint spécifique pour les KYC en attente
      // Pour l'instant on simule avec la liste des investisseurs
      const data = await api.getAllInvestors();
      // Filtrer uniquement ceux avec KYC en attente
      const pending = (data.investors || []).filter(
        (inv: any) => inv.kyc_status === 'submitted' || inv.kyc_status === 'pending'
      );
      setPendingUsers(pending);
    } catch (error) {
      console.error('Load pending KYC error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReview = async (userId: string, action: 'approve' | 'reject', reason?: string) => {
    setProcessing(userId);
    try {
      await api.reviewKYC(userId, action, reason);
      await loadPendingKYC();
    } catch (error) {
      console.error('Review KYC error:', error);
      alert('Erreur lors de la validation');
    } finally {
      setProcessing(null);
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
        <h1 className="text-3xl font-bold mb-2">Validation KYC</h1>
        <p className="text-gray-400">
          Vérifiez et validez les documents KYC des investisseurs
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">En attente</span>
            <Clock className="w-5 h-5 text-yellow-500" />
          </div>
          <div className="text-3xl font-bold">{pendingUsers.length}</div>
        </div>
      </div>

      {/* Pending KYC List */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-6">KYC en attente de validation</h2>
        
        {pendingUsers.length === 0 ? (
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
            <p className="text-gray-400">Aucun KYC en attente</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingUsers.map((user) => (
              <div key={user.id} className="border border-white/10 rounded-lg p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center">
                      <User className="w-6 h-6 text-accent" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">
                        {user.first_name} {user.last_name}
                      </h3>
                      <p className="text-sm text-gray-400">{user.email}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        Inscrit le {new Date(user.investment_date).toLocaleDateString('fr-FR')}
                      </p>
                    </div>
                  </div>
                  
                  <span className="badge badge-warning">
                    <Clock className="w-3 h-3 mr-1" />
                    En attente
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  {!userDocuments[user.id] && !loadingDocs[user.id] && (
                    <button
                      onClick={() => loadUserDocuments(user.id)}
                      className="col-span-2 text-sm text-accent hover:underline"
                    >
                      Charger les documents →
                    </button>
                  )}
                  
                  {loadingDocs[user.id] && (
                    <div className="col-span-2 text-sm text-gray-400">Chargement des documents...</div>
                  )}
                  
                  {userDocuments[user.id] && userDocuments[user.id].length === 0 && (
                    <div className="col-span-2 text-sm text-gray-400">Aucun document téléchargé</div>
                  )}
                  
                  {userDocuments[user.id] && userDocuments[user.id].map((doc: any) => (
                    <div key={doc.id} className="bg-white/5 rounded-lg p-4">
                      <div className="text-sm text-gray-400 mb-1">
                        {doc.document_type === 'identity' ? 'Pièce d\'identité' : 'Justificatif de domicile'}
                      </div>
                      <div className="font-medium">Document téléchargé</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {new Date(doc.uploaded_at).toLocaleDateString('fr-FR')}
                      </div>
                      <button
                        onClick={async () => {
                          try {
                            await api.downloadKYCFile(doc.file_url);
                          } catch (error) {
                            console.error('Download file error:', error);
                            alert('Erreur lors de l\'ouverture du document');
                          }
                        }}
                        className="text-sm text-accent hover:underline mt-2 inline-block"
                      >
                        Voir le document →
                      </button>
                    </div>
                  ))}
                </div>

                <div className="flex items-center space-x-3 pt-4 border-t border-white/10">
                  <button
                    onClick={() => handleReview(user.id, 'approve')}
                    disabled={processing === user.id}
                    className="btn btn-primary flex-1"
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {processing === user.id ? 'Traitement...' : 'Approuver'}
                  </button>
                  
                  <button
                    onClick={() => {
                      const reason = prompt('Raison du rejet :');
                      if (reason) {
                        handleReview(user.id, 'reject', reason);
                      }
                    }}
                    disabled={processing === user.id}
                    className="btn btn-secondary flex-1 border border-destructive/30 hover:bg-destructive/10"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Rejeter
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="card bg-white/5">
        <h3 className="font-semibold mb-3">Points de vérification</h3>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>✓ Vérifier que la pièce d'identité est valide et en cours de validité</li>
          <li>✓ S'assurer que le justificatif de domicile date de moins de 3 mois</li>
          <li>✓ Vérifier la cohérence des informations (nom, prénom, adresse)</li>
          <li>✓ Les documents doivent être clairs et lisibles</li>
          <li>✓ Une fois approuvé, l'investisseur pourra effectuer des dépôts</li>
        </ul>
      </div>
    </div>
  );
}
