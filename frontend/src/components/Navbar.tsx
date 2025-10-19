'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Shield, Bell, User, LogOut, Settings, FileText, Menu, X, Users } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

export default function Navbar() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showMobileMenu, setShowMobileMenu] = useState(false);

  const handleLogout = async () => {
    try {
      await api.logout();
      logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <nav className="bg-white/5 backdrop-blur-lg border-b border-white/10 sticky top-0 z-50">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/dashboard" className="flex items-center space-x-2">
            <Shield className="w-8 h-8 text-accent" />
            <span className="text-xl font-bold hidden md:block">Shepherd Capital</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            <Link href="/dashboard" className="text-white/80 hover:text-white transition-colors">
              Dashboard
            </Link>
            <Link href="/dashboard/transactions" className="text-white/80 hover:text-white transition-colors">
              Transactions
            </Link>
            <Link href="/dashboard/kyc" className="text-white/80 hover:text-white transition-colors">
              KYC & Contrat
            </Link>
            <Link href="/dashboard/succession" className="text-white/80 hover:text-white transition-colors">
              Succession
            </Link>
          </div>

          {/* Right side */}
          <div className="flex items-center space-x-4">
            {/* Notifications */}
            <button className="relative p-2 hover:bg-white/10 rounded-lg transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-accent rounded-full"></span>
            </button>

            {/* User menu */}
            <div className="relative">
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                className="flex items-center space-x-2 p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                  <User className="w-5 h-5" />
                </div>
                <span className="hidden md:block text-sm">
                  {user?.firstName} {user?.lastName}
                </span>
              </button>

              {showUserMenu && (
                <div className="absolute right-0 mt-2 w-56 card animate-fadeIn">
                  <div className="py-2">
                    <div className="px-4 py-2 border-b border-white/10">
                      <div className="text-sm font-medium">{user?.firstName} {user?.lastName}</div>
                      <div className="text-xs text-gray-400">{user?.email}</div>
                    </div>
                    <Link
                      href="/dashboard/profile"
                      className="flex items-center space-x-2 px-4 py-2 hover:bg-white/10 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      <span>Paramètres</span>
                    </Link>
                    <Link
                      href="/dashboard/contract"
                      className="flex items-center space-x-2 px-4 py-2 hover:bg-white/10 transition-colors"
                    >
                      <FileText className="w-4 h-4" />
                      <span>Mon contrat</span>
                    </Link>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center space-x-2 px-4 py-2 hover:bg-white/10 transition-colors text-destructive"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Déconnexion</span>
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="md:hidden p-2 hover:bg-white/10 rounded-lg"
            >
              {showMobileMenu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {showMobileMenu && (
          <div className="md:hidden py-4 border-t border-white/10 animate-fadeIn">
            <Link href="/dashboard" className="block py-2 text-white/80 hover:text-white">
              Dashboard
            </Link>
            <Link href="/dashboard/transactions" className="block py-2 text-white/80 hover:text-white">
              Transactions
            </Link>
            <Link href="/dashboard/kyc" className="block py-2 text-white/80 hover:text-white">
              KYC & Contrat
            </Link>
            <Link href="/dashboard/succession" className="block py-2 text-white/80 hover:text-white">
              Succession
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
