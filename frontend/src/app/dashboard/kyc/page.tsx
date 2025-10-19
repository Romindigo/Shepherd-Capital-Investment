'use client';

import { useEffect, useState } from 'react';
import { Upload, FileText, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function KYCPage() {
  const user = useAuthStore((state) => state.user);
  const [documents, setDocuments] = useState<any[]>([]);
  const [contract, setContract] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    loadKYCData();
  }, []);

  const loadKYCData = async () => {
    try {
      const [docsData, contractData] = await Promise.allSettled([
        api.getKYCDocuments(),
        api.getContract(),
      ]);

      if (docsData.status === 'fulfilled') {
        setDocuments(docsData.value.documents || []);
      }

      if (contractData.status === 'fulfilled') {
        setContract(contractData.value.contract);
      }
    } catch (error) {
      console.error('Load KYC data error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, documentType: string) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError('');
    setSuccess('');

    try {
      await api.uploadKYCDocument(file, documentType);
      setSuccess('Document téléchargé avec succès !');
      loadKYCData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors du téléchargement');
    } finally {
      setUploading(false);
    }
  };

  const handleGenerateContract = async () => {
    setLoading(true);
    setError('');
    try {
      await api.generateContract();
      setSuccess('Contrat généré avec succès !');
      loadKYCData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la génération du contrat');
    } finally {
      setLoading(false);
    }
  };

  const handleSignContract = async () => {
    if (!contract) return;
    
    setLoading(true);
    setError('');
    try {
      const signatureData = `signed-by-${user?.id}-${Date.now()}`;
      await api.signContract(contract.id, signatureData);
      setSuccess('Contrat signé avec succès !');
      loadKYCData();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la signature');
    } finally {
      setLoading(false);
    }
  };

  const getDocumentStatus = (type: string) => {
    const doc = documents.find(d => d.document_type === type);
    return doc?.status || 'pending';
  };

  const hasDocument = (type: string) => {
    return documents.some(d => d.document_type === type);
  };

  const kycApproved = user?.kycStatus === 'approved';
  const kycSubmitted = user?.kycStatus === 'submitted';

  return (
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold mb-2">KYC & Vérification</h1>
        <p className="text-gray-400">
          Complétez votre vérification d'identité pour débloquer toutes les fonctionnalités
        </p>
      </div>

      {/* Status Banner */}
      {kycApproved ? (
        <div className="card bg-success/10 border-success/30">
          <div className="flex items-center space-x-3">
            <CheckCircle className="w-8 h-8 text-success" />
            <div>
              <h3 className="font-semibold text-success text-lg">KYC Approuvé !</h3>
              <p className="text-sm text-gray-300">
                Votre identité a été vérifiée. Vous pouvez maintenant effectuer des dépôts et retraits.
              </p>
            </div>
          </div>
        </div>
      ) : kycSubmitted ? (
        <div className="card bg-yellow-500/10 border-yellow-500/30">
          <div className="flex items-center space-x-3">
            <Clock className="w-8 h-8 text-yellow-500" />
            <div>
              <h3 className="font-semibold text-yellow-500 text-lg">KYC en cours de vérification</h3>
              <p className="text-sm text-gray-300">
                Vos documents sont en cours de vérification par notre équipe. Cela peut prendre 24-48h.
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="card bg-accent/10 border-accent/30">
          <div className="flex items-center space-x-3">
            <AlertCircle className="w-8 h-8 text-accent" />
            <div>
              <h3 className="font-semibold text-accent text-lg">KYC requis</h3>
              <p className="text-sm text-gray-300">
                Veuillez télécharger vos documents pour commencer la vérification.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div className="card bg-destructive/10 border-destructive/30">
          <div className="flex items-center space-x-2">
            <XCircle className="w-5 h-5 text-destructive" />
            <span className="text-sm text-destructive">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="card bg-success/10 border-success/30">
          <div className="flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-success" />
            <span className="text-sm text-success">{success}</span>
          </div>
        </div>
      )}

      {/* Document Upload Section */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-6">Documents requis</h2>
        
        <div className="space-y-6">
          {/* Identity Document */}
          <div className="border border-white/10 rounded-lg p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Pièce d'identité</h3>
                <p className="text-sm text-gray-400">
                  Passeport ou carte d'identité nationale en cours de validité
                </p>
              </div>
              <div>
                {getDocumentStatus('identity') === 'approved' && (
                  <span className="badge badge-success">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Approuvé
                  </span>
                )}
                {getDocumentStatus('identity') === 'pending' && (
                  <span className="badge badge-warning">
                    <Clock className="w-3 h-3 mr-1" />
                    En attente
                  </span>
                )}
                {getDocumentStatus('identity') === 'rejected' && (
                  <span className="badge badge-error">
                    <XCircle className="w-3 h-3 mr-1" />
                    Rejeté
                  </span>
                )}
              </div>
            </div>

            {!hasDocument('identity') && !kycApproved && (
              <div className="relative">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e, 'identity')}
                  disabled={uploading}
                  className="hidden"
                  id="identity-upload"
                />
                <label
                  htmlFor="identity-upload"
                  className="btn btn-secondary w-full cursor-pointer"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Téléchargement...' : 'Télécharger la pièce d\'identité'}
                </label>
              </div>
            )}
          </div>

          {/* Proof of Address */}
          <div className="border border-white/10 rounded-lg p-4">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="font-semibold mb-1">Justificatif de domicile</h3>
                <p className="text-sm text-gray-400">
                  Facture (électricité, eau, téléphone) de moins de 3 mois
                </p>
              </div>
              <div>
                {getDocumentStatus('proof_of_address') === 'approved' && (
                  <span className="badge badge-success">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Approuvé
                  </span>
                )}
                {getDocumentStatus('proof_of_address') === 'pending' && (
                  <span className="badge badge-warning">
                    <Clock className="w-3 h-3 mr-1" />
                    En attente
                  </span>
                )}
                {getDocumentStatus('proof_of_address') === 'rejected' && (
                  <span className="badge badge-error">
                    <XCircle className="w-3 h-3 mr-1" />
                    Rejeté
                  </span>
                )}
              </div>
            </div>

            {!hasDocument('proof_of_address') && !kycApproved && (
              <div className="relative">
                <input
                  type="file"
                  accept="image/*,.pdf"
                  onChange={(e) => handleFileUpload(e, 'proof_of_address')}
                  disabled={uploading}
                  className="hidden"
                  id="address-upload"
                />
                <label
                  htmlFor="address-upload"
                  className="btn btn-secondary w-full cursor-pointer"
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {uploading ? 'Téléchargement...' : 'Télécharger le justificatif'}
                </label>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Contract Section */}
      {kycApproved && (
        <div className="card">
          <h2 className="text-xl font-semibold mb-6">Contrat d'investissement</h2>
          
          {contract ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-white/5 rounded-lg">
                <div className="flex items-center space-x-3">
                  <FileText className="w-8 h-8 text-accent" />
                  <div>
                    <div className="font-semibold">Contrat #{contract.contract_number}</div>
                    <div className="text-sm text-gray-400">
                      Généré le {new Date(contract.generated_at).toLocaleDateString('fr-FR')}
                    </div>
                  </div>
                </div>
                {contract.signed ? (
                  <span className="badge badge-success">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Signé
                  </span>
                ) : (
                  <span className="badge badge-warning">
                    <Clock className="w-3 h-3 mr-1" />
                    Non signé
                  </span>
                )}
              </div>

              {!contract.signed && (
                <div className="space-y-3">
                  <p className="text-sm text-gray-400">
                    Veuillez lire attentivement le contrat avant de le signer électroniquement.
                  </p>
                  <button
                    onClick={handleSignContract}
                    disabled={loading}
                    className="btn btn-primary w-full"
                  >
                    Signer électroniquement le contrat
                  </button>
                </div>
              )}

              {/* Bouton pour voir le contrat */}
              <div className="text-center">
                <button 
                  onClick={async () => {
                    try {
                      await api.viewContract();
                    } catch (error) {
                      console.error('View contract error:', error);
                      alert('Erreur lors de l\'affichage du contrat');
                    }
                  }}
                  className="btn btn-secondary"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Voir le contrat
                </button>
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">
                Votre contrat d'investissement n'a pas encore été généré.
              </p>
              <button
                onClick={handleGenerateContract}
                disabled={loading}
                className="btn btn-primary"
              >
                Générer mon contrat
              </button>
            </div>
          )}
        </div>
      )}

      {/* Info */}
      <div className="card bg-white/5">
        <h3 className="font-semibold mb-3">Informations importantes</h3>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>• Les documents doivent être clairs et lisibles</li>
          <li>• Formats acceptés : JPEG, PNG, PDF (max 10 MB)</li>
          <li>• La vérification prend généralement 24-48 heures</li>
          <li>• Le contrat sera généré automatiquement après approbation du KYC</li>
          <li>• Toutes vos données sont chiffrées et sécurisées</li>
        </ul>
      </div>
    </div>
  );
}
