const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://www.mytickerlist.com/api';

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'user';
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const auth = {
  async login(username: string, password: string): Promise<AuthResponse> {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    return response.json();
  },

  getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken') || sessionStorage.getItem('authToken');
  },

  getUser(): User | null {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user') || sessionStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  isAuthenticated(): boolean {
    return !!this.getToken();
  },

  isAdmin(): boolean {
    const user = this.getUser();
    return user?.role === 'admin';
  },

  logout(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('authToken');
    localStorage.removeItem('user');
    localStorage.removeItem('rememberMe');
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
  }
};

export async function apiRequest(endpoint: string, options: RequestInit = {}) {
  const token = auth.getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>)
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers
  });

  if (response.status === 401) {
    auth.logout();
    window.location.href = '/login';
    return;
  }

  return response.json();
}