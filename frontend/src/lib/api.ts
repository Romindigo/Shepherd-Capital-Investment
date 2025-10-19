import axios, { AxiosInstance, AxiosError } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Intercepteur pour ajouter le token
    this.client.interceptors.request.use(
      (config) => {
        const token = this.getToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Intercepteur pour gérer les erreurs
    this.client.interceptors.response.use(
      (response) => response,
      async (error: AxiosError) => {
        const originalRequest = error.config as any;

        // Si erreur 401 et qu'on a un refresh token, essayer de refresh
        if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/auth/refresh') {
          originalRequest._retry = true;
          
          const refreshToken = this.getRefreshToken();
          if (refreshToken) {
            try {
              console.log('Tentative de refresh du token...');
              const response = await axios.post(`${API_URL}/auth/refresh`, {
                refreshToken,
              });
              
              const { accessToken } = response.data;
              this.setToken(accessToken);
              
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              console.log('Token rafraîchi avec succès');
              return this.client(originalRequest);
            } catch (refreshError) {
              console.error('Erreur de refresh du token:', refreshError);
              // Laisser passer l'erreur sans rediriger
            }
          }
        }
        
        // Retourner l'erreur pour que le composant puisse la gérer
        return Promise.reject(error);
      }
    );
  }

  // Token management
  private getToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('accessToken');
    }
    return null;
  }

  private getRefreshToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('refreshToken');
    }
    return null;
  }

  setToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('accessToken', token);
    }
  }

  setRefreshToken(token: string): void {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshToken', token);
    }
  }

  clearAuth(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('user');
    }
  }

  // Auth endpoints
  async register(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    const response = await this.client.post('/auth/register', data);
    if (response.data.accessToken) {
      this.setToken(response.data.accessToken);
      this.setRefreshToken(response.data.refreshToken);
    }
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    if (response.data.accessToken) {
      this.setToken(response.data.accessToken);
      this.setRefreshToken(response.data.refreshToken);
    }
    return response.data;
  }

  async logout() {
    const refreshToken = this.getRefreshToken();
    await this.client.post('/auth/logout', { refreshToken });
    this.clearAuth();
  }

  // User endpoints
  async getProfile() {
    const response = await this.client.get('/users/profile');
    return response.data;
  }

  async updateProfile(data: any) {
    const response = await this.client.put('/users/profile', data);
    return response.data;
  }

  async updateSuccessor(data: any) {
    const response = await this.client.put('/users/successor', data);
    return response.data;
  }

  async changePassword(currentPassword: string, newPassword: string) {
    const response = await this.client.put('/users/password', {
      currentPassword,
      newPassword,
    });
    return response.data;
  }

  async getNotifications(limit = 20, offset = 0) {
    const response = await this.client.get('/users/notifications', {
      params: { limit, offset },
    });
    return response.data;
  }

  async markNotificationsRead(notificationIds?: string[]) {
    const response = await this.client.put('/users/notifications/read', {
      notificationIds,
    });
    return response.data;
  }

  // Investment endpoints
  async getDashboard() {
    const response = await this.client.get('/investments/dashboard');
    return response.data;
  }

  async getCapitalEvolution(days = 30) {
    const response = await this.client.get('/investments/capital-evolution', {
      params: { days },
    });
    return response.data;
  }

  // Transaction endpoints
  async createDeposit(data: {
    amount: number;
    paymentMethod: string;
    currency?: string;
    metadata?: any;
  }) {
    const response = await this.client.post('/transactions/deposit', data);
    return response.data;
  }

  async createWithdrawal(data: {
    amount: number;
    paymentMethod: string;
    metadata?: any;
  }) {
    const response = await this.client.post('/transactions/withdrawal', data);
    return response.data;
  }

  async getTransactions(params?: any) {
    const response = await this.client.get('/transactions', { params });
    return response.data;
  }

  // KYC endpoints
  async uploadKYCDocument(file: File, documentType: string) {
    const formData = new FormData();
    formData.append('document', file);
    formData.append('documentType', documentType);

    const response = await this.client.post('/kyc/upload', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  }

  async getKYCDocuments() {
    const response = await this.client.get('/kyc/documents');
    return response.data;
  }

  async generateContract() {
    const response = await this.client.post('/kyc/contract/generate');
    return response.data;
  }

  async signContract(contractId: string, signatureData: string) {
    const response = await this.client.post('/kyc/contract/sign', {
      contractId,
      signatureData,
    });
    return response.data;
  }

  async getContract() {
    const response = await this.client.get('/kyc/contract');
    return response.data;
  }

  // Admin endpoints
  async getAdminStats() {
    const response = await this.client.get('/admin/stats');
    return response.data;
  }

  async getAllInvestors() {
    const response = await this.client.get('/admin/investors');
    return response.data;
  }

  async submitDailyGain(gainPercentage: number, gainDate: string) {
    const response = await this.client.post('/admin/daily-gain', {
      gainPercentage,
      gainDate,
    });
    return response.data;
  }

  async reviewKYC(userId: string, action: 'approve' | 'reject', rejectionReason?: string) {
    const response = await this.client.put(`/admin/kyc/${userId}`, {
      action,
      rejectionReason,
    });
    return response.data;
  }

  async reviewTransaction(transactionId: string, action: 'approve' | 'reject') {
    const response = await this.client.put(`/admin/transactions/${transactionId}`, {
      action,
    });
    return response.data;
  }

  async getShepherdCapital() {
    const response = await this.client.get('/admin/shepherd-capital');
    return response.data;
  }

  async addShepherdCapital(data: {
    amount: number;
    transactionType: 'deposit' | 'withdrawal' | 'adjustment';
    category?: string;
    description?: string;
  }) {
    const response = await this.client.post('/admin/shepherd-capital', data);
    return response.data;
  }

  async getUserKYCDocuments(userId: string) {
    const response = await this.client.get(`/admin/kyc/${userId}/documents`);
    return response.data;
  }

  async downloadKYCFile(filename: string) {
    const token = this.getToken();
    const url = `${API_URL}/kyc/files/${filename}`;
    
    // Ouvrir dans un nouvel onglet avec le token
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to download file');
    }
    
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    window.open(blobUrl, '_blank');
    
    // Libérer la mémoire après un court délai
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
  }

  async viewContract() {
    const token = this.getToken();
    const url = `${API_URL}/kyc/contract/download`;
    
    // Ouvrir le contrat dans un nouvel onglet avec authentification
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to view contract');
    }
    
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Ouvrir dans un nouvel onglet
    window.open(blobUrl, '_blank');
    
    // Libérer la mémoire après un court délai
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 1000);
  }

  async getUserSuccessor(userId: string) {
    const response = await this.client.get(`/admin/users/${userId}/successor`);
    return response.data;
  }

  async deleteUser(userId: string) {
    const response = await this.client.delete(`/admin/users/${userId}`);
    return response.data;
  }

  async exportAllData() {
    const token = this.getToken();
    const url = `${API_URL}/admin/export`;
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to export data');
    }
    
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Télécharger le fichier
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = `shepherd-capital-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Libérer la mémoire
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
  }

  async exportShepherdCapitalCSV(month?: number, year?: number) {
    const token = this.getToken();
    let url = `${API_URL}/admin/shepherd-capital/export-csv`;
    
    if (month && year) {
      url += `?month=${month}&year=${year}`;
    }
    
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to export CSV');
    }
    
    const blob = await response.blob();
    const blobUrl = window.URL.createObjectURL(blob);
    
    // Télécharger le fichier
    const a = document.createElement('a');
    a.href = blobUrl;
    const filename = month && year 
      ? `shepherd-capital-${year}-${String(month).padStart(2, '0')}.csv`
      : `shepherd-capital-export-${new Date().toISOString().split('T')[0]}.csv`;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Libérer la mémoire
    setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
  }
}

export const api = new ApiClient();
