'use client';

import { useEffect, useState } from 'react';
import { Users, Wallet, TrendingUp, Calendar, Mail, Phone, CheckCircle, Clock, User, Trash2, X, Download } from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminInvestorsPage() {
  const [investors, setInvestors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showSuccessorModal, setShowSuccessorModal] = useState(false);
  const [successor, setSuccessor] = useState<any>(null);
  const [loadingSuccessor, setLoadingSuccessor] = useState(false);

  useEffect(() => {
    loadInvestors();
  }, []);

  const loadInvestors = async () => {
    try {
      const data = await api.getAllInvestors();
      setInvestors(data.investors || []);
    } catch (error) {
      console.error('Load investors error:', error);
    } finally {
      setLoading(false);
    }
  };

  const viewSuccessor = async (userId: string, userName: string) => {
    setSelectedUser({ id: userId, name: userName });
    setShowSuccessorModal(true);
    setLoadingSuccessor(true);
    try {
      const data = await api.getUserSuccessor(userId);
      setSuccessor(data.successor);
    } catch (error) {
      console.error('Load successor error:', error);
      setSuccessor(null);
    } finally {
      setLoadingSuccessor(false);
    }
  };

  const handleDeleteUser = async (userId: string, userName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${userName} ?\n\nCette action est irréversible et supprimera :\n- Le compte utilisateur\n- Tous ses investissements\n- Toutes ses transactions\n- Ses documents KYC\n- Son contrat`)) {
      return;
    }

    try {
      await api.deleteUser(userId);
      alert('Utilisateur supprimé avec succès');
      await loadInvestors();
    } catch (error: any) {
      console.error('Delete user error:', error);
      alert(error.response?.data?.error || 'Erreur lors de la suppression');
    }
  };

  const handleExportData = async () => {
    try {
      await api.exportAllData();
      alert('Export réussi ! Le fichier a été téléchargé.');
    } catch (error) {
      console.error('Export error:', error);
      alert('Erreur lors de l\'export des données');
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
          <h1 className="text-3xl font-bold mb-2">Investisseurs</h1>
          <p className="text-gray-400">
            Liste complète des investisseurs actifs ({investors.length}/50)
          </p>
        </div>
        <div className="card py-2 px-4">
          <div className="text-2xl font-bold">{investors.length}</div>
          <div className="text-xs text-gray-400">Investisseurs actifs</div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Capital total investi</span>
            <Wallet className="w-5 h-5 text-success" />
          </div>
          <div className="text-2xl font-bold">
            {investors.reduce((sum, inv) => sum + parseFloat(inv.total_deposited || 0), 0).toFixed(2)} €
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Gains distribués</span>
            <TrendingUp className="w-5 h-5 text-accent" />
          </div>
          <div className="text-2xl font-bold text-success">
            {investors.reduce((sum, inv) => sum + parseFloat(inv.total_gains || 0), 0).toFixed(2)} €
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400 text-sm">Solde total actuel</span>
            <Wallet className="w-5 h-5 text-accent" />
          </div>
          <div className="text-2xl font-bold">
            {investors.reduce((sum, inv) => sum + parseFloat(inv.balance || 0), 0).toFixed(2)} €
          </div>
        </div>
      </div>

      {/* Investors List */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-6">Liste des investisseurs</h2>
        
        {investors.length === 0 ? (
          <div className="text-center py-12">
            <Users className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-400">Aucun investisseur pour le moment</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Investisseur</th>
                  <th className="text-left py-3 px-4 text-sm font-semibold text-gray-400">Contact</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Solde actuel</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Total déposé</th>
                  <th className="text-right py-3 px-4 text-sm font-semibold text-gray-400">Gains totaux</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">KYC</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Inscription</th>
                  <th className="text-center py-3 px-4 text-sm font-semibold text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody>
                {investors.map((investor) => (
                  <tr key={investor.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                    <td className="py-4 px-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-accent/20 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-accent" />
                        </div>
                        <div>
                          <div className="font-medium">{investor.first_name} {investor.last_name}</div>
                          <div className="text-xs text-gray-400">ID: {investor.id.substring(0, 8)}</div>
                        </div>
                      </div>
                    </td>
                    
                    <td className="py-4 px-4">
                      <div className="space-y-1">
                        <div className="flex items-center space-x-2 text-sm">
                          <Mail className="w-3 h-3 text-gray-400" />
                          <span className="text-gray-300">{investor.email}</span>
                        </div>
                      </div>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="font-semibold">{parseFloat(investor.balance || 0).toFixed(2)} €</div>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="text-gray-300">{parseFloat(investor.total_deposited || 0).toFixed(2)} €</div>
                    </td>

                    <td className="py-4 px-4 text-right">
                      <div className="text-success font-medium">
                        +{parseFloat(investor.total_gains || 0).toFixed(2)} €
                      </div>
                    </td>

                    <td className="py-4 px-4 text-center">
                      {investor.kyc_status === 'approved' ? (
                        <span className="badge badge-success inline-flex">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          Vérifié
                        </span>
                      ) : (
                        <span className="badge badge-warning inline-flex">
                          <Clock className="w-3 h-3 mr-1" />
                          En attente
                        </span>
                      )}
                    </td>

                    <td className="py-4 px-4 text-center">
                      <div className="text-sm text-gray-400">
                        {new Date(investor.investment_date).toLocaleDateString('fr-FR')}
                      </div>
                    </td>

                    <td className="py-4 px-4">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => viewSuccessor(investor.id, `${investor.first_name} ${investor.last_name}`)}
                          className="p-2 hover:bg-accent/20 rounded text-accent"
                          title="Voir le successeur"
                        >
                          <User className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteUser(investor.id, `${investor.first_name} ${investor.last_name}`)}
                          className="p-2 hover:bg-destructive/20 rounded text-destructive"
                          title="Supprimer l'utilisateur"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Export / Actions */}
      <div className="flex justify-end space-x-4">
        <button 
          onClick={handleExportData}
          className="btn btn-accent"
        >
          <Download className="w-4 h-4 mr-2" />
          Exporter toutes les données (Backup)
        </button>
      </div>

      {/* Successor Modal */}
      {showSuccessorModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="card max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold">Successeur de {selectedUser?.name}</h2>
              <button
                onClick={() => setShowSuccessorModal(false)}
                className="p-2 hover:bg-white/10 rounded"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {loadingSuccessor ? (
              <div className="text-center py-8">
                <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-gray-400">Chargement...</p>
              </div>
            ) : successor ? (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Nom complet</div>
                    <div className="font-medium">{successor.first_name} {successor.last_name}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Relation</div>
                    <div className="font-medium">{successor.relationship}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Email</div>
                    <div className="font-medium">{successor.email}</div>
                  </div>
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-1">Téléphone</div>
                    <div className="font-medium">{successor.phone || 'Non renseigné'}</div>
                  </div>
                </div>

                {successor.social_media && Object.keys(successor.social_media).length > 0 && (
                  <div className="bg-white/5 rounded-lg p-4">
                    <div className="text-sm text-gray-400 mb-2">Réseaux sociaux</div>
                    <div className="space-y-1">
                      {successor.social_media.facebook && (
                        <div className="text-sm"><strong>Facebook:</strong> {successor.social_media.facebook}</div>
                      )}
                      {successor.social_media.instagram && (
                        <div className="text-sm"><strong>Instagram:</strong> {successor.social_media.instagram}</div>
                      )}
                      {successor.social_media.linkedin && (
                        <div className="text-sm"><strong>LinkedIn:</strong> {successor.social_media.linkedin}</div>
                      )}
                      {successor.social_media.other && (
                        <div className="text-sm"><strong>Autre:</strong> {successor.social_media.other}</div>
                      )}
                    </div>
                  </div>
                )}

                <div className="text-xs text-gray-500 text-center pt-4 border-t border-white/10">
                  Enregistré le {new Date(successor.created_at).toLocaleString('fr-FR')}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <User className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                <p className="text-gray-400">Aucun successeur enregistré</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
