'use client';

import Link from 'next/link';
import { Shield, TrendingUp, Lock, Users, BarChart3, FileCheck } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="container mx-auto px-4 py-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Shield className="w-8 h-8 text-accent" />
          <span className="text-2xl font-bold">Shepherd Capital</span>
        </div>
        <div className="flex items-center space-x-4">
          <Link href="/login" className="text-white/80 hover:text-white transition-colors">
            Connexion
          </Link>
          <Link href="/register" className="btn btn-primary">
            S'inscrire
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-4xl mx-auto animate-fadeIn">
          <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
            Investissement Professionnel & Sécurisé
          </h1>
          <p className="text-xl text-gray-300 mb-8 leading-relaxed">
            Rejoignez une plateforme d'investissement privée exclusive, limitée à 50 investisseurs.
            <br />
            Profitez d'une gestion professionnelle avec transparence et sécurité.
          </p>
          <div className="flex items-center justify-center space-x-4">
            <Link href="/register" className="btn btn-primary text-lg px-8 py-4">
              Commencer maintenant
            </Link>
            <Link href="#features" className="btn btn-secondary text-lg px-8 py-4">
              En savoir plus
            </Link>
          </div>
          
          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card">
              <TrendingUp className="w-8 h-8 text-accent mx-auto mb-3" />
              <div className="text-3xl font-bold">50%</div>
              <div className="text-gray-400">Gains redistribués</div>
            </div>
            <div className="card">
              <Users className="w-8 h-8 text-accent mx-auto mb-3" />
              <div className="text-3xl font-bold">Max 50</div>
              <div className="text-gray-400">Investisseurs privés</div>
            </div>
            <div className="card">
              <Lock className="w-8 h-8 text-accent mx-auto mb-3" />
              <div className="text-3xl font-bold">1000€</div>
              <div className="text-gray-400">Investissement minimum</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="container mx-auto px-4 py-20">
        <h2 className="text-4xl font-bold text-center mb-16">
          Une plateforme conçue pour vous
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="card hover:scale-105 transition-transform">
            <Shield className="w-12 h-12 text-accent mb-4" />
            <h3 className="text-xl font-semibold mb-3">Sécurité maximale</h3>
            <p className="text-gray-400">
              KYC complet, contrats personnalisés et chiffrement de toutes vos données sensibles.
            </p>
          </div>

          <div className="card hover:scale-105 transition-transform">
            <BarChart3 className="w-12 h-12 text-accent mb-4" />
            <h3 className="text-xl font-semibold mb-3">Gains quotidiens</h3>
            <p className="text-gray-400">
              50% des gains sont automatiquement redistribués chaque jour au prorata de votre capital.
            </p>
          </div>

          <div className="card hover:scale-105 transition-transform">
            <TrendingUp className="w-12 h-12 text-accent mb-4" />
            <h3 className="text-xl font-semibold mb-3">Transparence totale</h3>
            <p className="text-gray-400">
              Suivez l'évolution de votre capital en temps réel avec des graphiques détaillés.
            </p>
          </div>

          <div className="card hover:scale-105 transition-transform">
            <FileCheck className="w-12 h-12 text-accent mb-4" />
            <h3 className="text-xl font-semibold mb-3">Contrat personnalisé</h3>
            <p className="text-gray-400">
              Un contrat d'investissement généré automatiquement après validation de votre KYC.
            </p>
          </div>

          <div className="card hover:scale-105 transition-transform">
            <Users className="w-12 h-12 text-accent mb-4" />
            <h3 className="text-xl font-semibold mb-3">Successeur désigné</h3>
            <p className="text-gray-400">
              Protégez vos proches en désignant un héritier pour votre investissement.
            </p>
          </div>

          <div className="card hover:scale-105 transition-transform">
            <Lock className="w-12 h-12 text-accent mb-4" />
            <h3 className="text-xl font-semibold mb-3">Gestion professionnelle</h3>
            <p className="text-gray-400">
              Votre capital est géré par une équipe expérimentée de traders professionnels.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="card max-w-4xl mx-auto text-center bg-gradient-to-r from-accent/20 to-primary/20 border-accent/30">
          <h2 className="text-3xl font-bold mb-4">
            Prêt à commencer votre investissement ?
          </h2>
          <p className="text-gray-300 mb-8 text-lg">
            Créez votre compte en quelques minutes et rejoignez une communauté d'investisseurs privés.
          </p>
          <Link href="/register" className="btn btn-primary text-lg px-8 py-4">
            S'inscrire maintenant
          </Link>
          <div className="mt-6 text-sm text-gray-400">
            Places limitées : Maximum 50 investisseurs
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="container mx-auto px-4 py-8 border-t border-white/10 mt-20">
        <div className="flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center space-x-2 mb-4 md:mb-0">
            <Shield className="w-6 h-6 text-accent" />
            <span className="font-semibold">Shepherd Capital Investment</span>
          </div>
          <div className="text-gray-400 text-sm">
            © 2025 Shepherd Capital Investment. Tous droits réservés.
          </div>
        </div>
      </footer>
    </div>
  );
}
