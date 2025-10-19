'use client';

import { useEffect, useState } from 'react';
import { Users, Heart, Phone, Mail, Link as LinkIcon, Save, AlertCircle, CheckCircle } from 'lucide-react';
import { api } from '@/lib/api';

export default function SuccessionPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    relationship: '',
    socialMedia: {
      facebook: '',
      instagram: '',
      linkedin: '',
      other: ''
    }
  });

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const profile = await api.getProfile();
      if (profile.successor) {
        setFormData({
          firstName: profile.successor.firstName || '',
          lastName: profile.successor.lastName || '',
          email: profile.successor.email || '',
          phone: profile.successor.phone || '',
          relationship: profile.successor.relationship || '',
          socialMedia: profile.successor.socialMedia || {
            facebook: '',
            instagram: '',
            linkedin: '',
            other: ''
          }
        });
      }
    } catch (error) {
      console.error('Load profile error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      await api.updateSuccessor({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        relationship: formData.relationship,
        socialMedia: formData.socialMedia
      });
      setMessage({ type: 'success', text: 'Informations du successeur enregistrées avec succès' });
    } catch (error: any) {
      console.error('Update successor error:', error);
      const errorMessage = error.response?.data?.error || error.message || 'Erreur lors de l\'enregistrement';
      setMessage({ type: 'error', text: errorMessage });
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
        <h1 className="text-3xl font-bold mb-2">Plan de Succession</h1>
        <p className="text-gray-400">
          Désignez un successeur pour votre investissement en cas d'imprévu
        </p>
      </div>

      {/* Alert Message */}
      {message && (
        <div className={`card ${message.type === 'success' ? 'bg-success/10 border-success/30' : 'bg-destructive/10 border-destructive/30'}`}>
          <div className="flex items-center space-x-2">
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 text-success" />
            ) : (
              <AlertCircle className="w-5 h-5 text-destructive" />
            )}
            <span className={`text-sm ${message.type === 'success' ? 'text-success' : 'text-destructive'}`}>
              {message.text}
            </span>
          </div>
        </div>
      )}

      {/* Info Card */}
      <div className="card bg-accent/10 border-accent/30">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-accent/20 rounded-full flex items-center justify-center flex-shrink-0">
            <Heart className="w-6 h-6 text-accent" />
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-accent mb-2">Pourquoi désigner un successeur ?</h3>
            <p className="text-sm text-gray-300">
              En cas d'imprévu, votre successeur désigné pourra récupérer votre capital et vos dividendes. 
              Nous le contacterons avec les informations que vous aurez fournies pour lui permettre de 
              récupérer ses fonds en toute sécurité.
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="card space-y-6">
        <h2 className="text-xl font-semibold mb-4">Informations du successeur</h2>

        {/* Personal Info */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium mb-2">Prénom *</label>
            <input
              type="text"
              required
              className="input"
              value={formData.firstName}
              onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
              placeholder="Jean"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Nom *</label>
            <input
              type="text"
              required
              className="input"
              value={formData.lastName}
              onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
              placeholder="Dupont"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-2">Lien de parenté *</label>
          <input
            type="text"
            required
            className="input"
            value={formData.relationship}
            onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
            placeholder="Ex: Époux/Épouse, Enfant, Parent, Frère/Sœur..."
          />
          <p className="text-xs text-gray-400 mt-1">
            Indiquez votre relation avec le successeur désigné
          </p>
        </div>

        {/* Contact Info */}
        <div className="border-t border-white/10 pt-6">
          <h3 className="font-semibold mb-4">Coordonnées de contact</h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                <Mail className="w-4 h-4 inline mr-2" />
                Email *
              </label>
              <input
                type="email"
                required
                className="input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="successeur@email.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                <Phone className="w-4 h-4 inline mr-2" />
                Téléphone
              </label>
              <input
                type="tel"
                className="input"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+33 6 12 34 56 78"
              />
            </div>
          </div>
        </div>

        {/* Social Media */}
        <div className="border-t border-white/10 pt-6">
          <h3 className="font-semibold mb-2">
            <LinkIcon className="w-4 h-4 inline mr-2" />
            Réseaux sociaux (optionnel)
          </h3>
          <p className="text-sm text-gray-400 mb-4">
            Ces informations supplémentaires nous aideront à contacter votre successeur si nécessaire
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Facebook</label>
              <input
                type="text"
                className="input"
                value={formData.socialMedia.facebook}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  socialMedia: { ...formData.socialMedia, facebook: e.target.value }
                })}
                placeholder="https://facebook.com/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Instagram</label>
              <input
                type="text"
                className="input"
                value={formData.socialMedia.instagram}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  socialMedia: { ...formData.socialMedia, instagram: e.target.value }
                })}
                placeholder="@username"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">LinkedIn</label>
              <input
                type="text"
                className="input"
                value={formData.socialMedia.linkedin}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  socialMedia: { ...formData.socialMedia, linkedin: e.target.value }
                })}
                placeholder="https://linkedin.com/in/..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Autre</label>
              <input
                type="text"
                className="input"
                value={formData.socialMedia.other}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  socialMedia: { ...formData.socialMedia, other: e.target.value }
                })}
                placeholder="Autre moyen de contact"
              />
            </div>
          </div>
        </div>

        {/* Submit Button */}
        <div className="border-t border-white/10 pt-6">
          <button
            type="submit"
            disabled={saving}
            className="btn btn-primary w-full text-lg"
          >
            <Save className="w-5 h-5 mr-2" />
            {saving ? 'Enregistrement...' : 'Enregistrer les informations'}
          </button>
        </div>
      </form>

      {/* Security Note */}
      <div className="card bg-white/5">
        <h3 className="font-semibold mb-3">Note de sécurité</h3>
        <ul className="space-y-2 text-sm text-gray-400">
          <li>✓ Toutes vos informations sont cryptées et sécurisées</li>
          <li>✓ Votre successeur sera contacté uniquement en cas de nécessité</li>
          <li>✓ Vous pouvez modifier ces informations à tout moment</li>
          <li>✓ Le successeur devra fournir des documents justificatifs pour récupérer les fonds</li>
        </ul>
      </div>
    </div>
  );
}
