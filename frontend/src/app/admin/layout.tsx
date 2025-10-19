'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Link from 'next/link';
import { Shield, LayoutDashboard, Users, TrendingUp, FileCheck, LogOut, Wallet, ArrowLeftRight, Settings } from 'lucide-react';
import { api } from '@/lib/api';

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { user, isAuthenticated, setUser, logout } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      
      console.log('Admin layout - checking auth...');
      console.log('Token:', token ? 'OUI' : 'NON');
      console.log('isAuthenticated from store:', isAuthenticated);
      console.log('User role:', user?.role);
      
      if (!token) {
        console.log('❌ No token - redirecting to login');
        router.push('/login');
        return;
      }

      // Si on a un token mais que le store dit non authentifié ou pas le bon rôle
      if (!isAuthenticated || !user || user.role !== 'admin') {
        console.log('Token exists but store needs update - fetching profile...');
        try {
          const response = await fetch('http://localhost:5001/api/users/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Profile loaded:', data.user.email, 'Role:', data.user.role);
            
            if (data.user.role !== 'admin') {
              console.log('❌ Not admin - redirecting');
              router.push('/dashboard');
              return;
            }
            
            setUser(data.user);
          } else {
            console.log('❌ Token invalid - redirecting to login');
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            router.push('/login');
            return;
          }
        } catch (error) {
          console.error('Error fetching profile:', error);
          router.push('/login');
          return;
        }
      }

      setChecking(false);
    };

    checkAuth();
  }, [isAuthenticated, user, router, setUser]);

  const handleLogout = async () => {
    try {
      await api.logout();
      logout();
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Vérification admin...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white/5 backdrop-blur-lg border-r border-white/10 p-6 flex flex-col">
        <div className="flex items-center space-x-2 mb-8">
          <Shield className="w-8 h-8 text-accent" />
          <div>
            <div className="font-bold">Shepherd Capital</div>
            <div className="text-xs text-gray-400">Admin Panel</div>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          <Link
            href="/admin/dashboard"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
          >
            <LayoutDashboard className="w-5 h-5" />
            <span>Dashboard</span>
          </Link>
          
          <Link
            href="/admin/investors"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Users className="w-5 h-5" />
            <span>Investisseurs</span>
          </Link>
          
          <Link
            href="/admin/gains"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
          >
            <TrendingUp className="w-5 h-5" />
            <span>Gains journaliers</span>
          </Link>
          
          <Link
            href="/admin/shepherd-capital"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Wallet className="w-5 h-5" />
            <span>Capital Shepherd</span>
          </Link>
          
          <Link
            href="/admin/kyc"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
          >
            <FileCheck className="w-5 h-5" />
            <span>Validation KYC</span>
          </Link>
          
          <Link
            href="/admin/transactions"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
          >
            <ArrowLeftRight className="w-5 h-5" />
            <span>Transactions</span>
          </Link>
          
          <Link
            href="/admin/payment-config"
            className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors"
          >
            <Settings className="w-5 h-5" />
            <span>Config. paiements</span>
          </Link>
        </nav>

        <div className="border-t border-white/10 pt-4">
          <div className="px-4 py-2 text-sm text-gray-400">
            Connecté en tant que
          </div>
          <div className="px-4 py-2 text-sm font-medium">
            {user?.firstName} {user?.lastName}
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-3 px-4 py-3 rounded-lg hover:bg-white/10 transition-colors text-destructive w-full mt-2"
          >
            <LogOut className="w-5 h-5" />
            <span>Déconnexion</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-y-auto">
        {children}
      </main>
    </div>
  );
}
