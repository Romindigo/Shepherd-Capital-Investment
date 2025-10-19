'use client';

import { useEffect, useState } from 'react';
import { User, Mail, Phone, Shield, Users as UsersIcon, Save, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';

export default function ProfilePage() {
  const user = useAuthStore((state) => state.user);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const [profileForm, setProfileForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  });

  const [successorForm, setSuccessorForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    relationship: '',
    socialMedia: { facebook: '', instagram: '', linkedin: '' },
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const data = await api.getProfile();
      setProfile(data);
      
      setProfileForm({
        firstName: data.user.firstName || '',
        lastName: data.user.lastName || '',
        phone: data.user.phone || '',
      });

      if (data.successor) {
        setSuccessorForm({
          firstName: data.successor.firstName || '',
          lastName: data.successor.lastName || '',
          email: data.successor.email || '',
          phone: data.successor.phone || '',
          relationship: data.successor.relationship || '',
          socialMedia: data.successor.socialMedia || { facebook: '', instagram: '', linkedin: '' },
        });
      }
    } catch (error) {
      console.error('Load profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.updateProfile(profileForm);
      setSuccess('Profil mis à jour avec succès');
      loadProfile();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateSuccessor = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');
    setSuccess('');

    try {
      await api.updateSuccessor(successorForm);
      setSuccess('Informations du successeur mises à jour');
      loadProfile();
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors de la mise à jour');
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('Les mots de passe ne correspondent pas');
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    setSaving(true);

    try {
      await api.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      setSuccess('Mot de passe changé avec succès');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erreur lors du changement de mot de passe');
    } finally {
      setSaving(false);
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
    <div className="max-w-4xl mx-auto space-y-8 animate-fadeIn">
      <div>
        <h1 className="text-3xl font-bold mb-2">Mon Profil</h1>
        <p className="text-gray-400">Gérez vos informations personnelles et votre successeur</p>
      </div>

      {/* Messages */}
      {error && (
        <div className="card bg-destructive/10 border-destructive/30">
          <span className="text-sm text-destructive">{error}</span>
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

      {/* Profile Info */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <User className="w-6 h-6 mr-2 text-accent" />
          Informations personnelles
        </h2>
        
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Prénom</label>
              <input
                type="text"
                className="input"
                value={profileForm.firstName}
                onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nom</label>
              <input
                type="text"
                className="input"
                value={profileForm.lastName}
                onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Email</label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="email"
                className="input pl-10 bg-white/10 cursor-not-allowed"
                value={profile?.user.email}
                disabled
              />
            </div>
            <p className="text-xs text-gray-400 mt-1">L'email ne peut pas être modifié</p>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Téléphone</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="tel"
                className="input pl-10"
                value={profileForm.phone}
                onChange={(e) => setProfileForm({ ...profileForm, phone: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
          </button>
        </form>
      </div>

      {/* Successor */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-2 flex items-center">
          <UsersIcon className="w-6 h-6 mr-2 text-accent" />
          Désignation du successeur
        </h2>
        <p className="text-sm text-gray-400 mb-6">
          En cas de décès, cette personne sera contactée pour récupérer votre investissement
        </p>
        
        <form onSubmit={handleUpdateSuccessor} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Prénom du successeur</label>
              <input
                type="text"
                className="input"
                value={successorForm.firstName}
                onChange={(e) => setSuccessorForm({ ...successorForm, firstName: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Nom du successeur</label>
              <input
                type="text"
                className="input"
                value={successorForm.lastName}
                onChange={(e) => setSuccessorForm({ ...successorForm, lastName: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                className="input"
                value={successorForm.email}
                onChange={(e) => setSuccessorForm({ ...successorForm, email: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Téléphone</label>
              <input
                type="tel"
                className="input"
                value={successorForm.phone}
                onChange={(e) => setSuccessorForm({ ...successorForm, phone: e.target.value })}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Lien de parenté</label>
            <input
              type="text"
              className="input"
              placeholder="Ex: Conjoint(e), Enfant, Parent..."
              value={successorForm.relationship}
              onChange={(e) => setSuccessorForm({ ...successorForm, relationship: e.target.value })}
            />
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary">
            <Save className="w-4 h-4 mr-2" />
            {saving ? 'Enregistrement...' : 'Enregistrer le successeur'}
          </button>
        </form>
      </div>

      {/* Change Password */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-6 flex items-center">
          <Shield className="w-6 h-6 mr-2 text-accent" />
          Changer le mot de passe
        </h2>
        
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Mot de passe actuel</label>
            <input
              type="password"
              className="input"
              value={passwordForm.currentPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nouveau mot de passe</label>
            <input
              type="password"
              className="input"
              value={passwordForm.newPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Confirmer le nouveau mot de passe</label>
            <input
              type="password"
              className="input"
              value={passwordForm.confirmPassword}
              onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
            />
          </div>

          <button type="submit" disabled={saving} className="btn btn-primary">
            <Shield className="w-4 h-4 mr-2" />
            {saving ? 'Changement...' : 'Changer le mot de passe'}
          </button>
        </form>
      </div>
    </div>
  );
}
