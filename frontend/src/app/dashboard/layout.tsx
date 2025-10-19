'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import Navbar from '@/components/Navbar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, setUser } = useAuthStore();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('accessToken');
      
      console.log('Dashboard layout - checking auth...');
      console.log('Token:', token ? 'OUI' : 'NON');
      console.log('isAuthenticated from store:', isAuthenticated);
      
      if (!token) {
        console.log('❌ No token - redirecting to login');
        router.push('/login');
        return;
      }

      // Si on a un token mais que le store dit non authentifié, 
      // essayons de récupérer le profil
      if (!isAuthenticated) {
        console.log('Token exists but store says not authenticated - fetching profile...');
        try {
          const response = await fetch('http://localhost:5001/api/users/profile', {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          if (response.ok) {
            const data = await response.json();
            console.log('✅ Profile loaded, updating store');
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
  }, [isAuthenticated, router, setUser]);

  if (checking) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Vérification...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        {children}
      </main>
    </div>
  );
}
