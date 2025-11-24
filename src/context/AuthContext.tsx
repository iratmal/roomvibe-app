import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  id: number;
  email: string;
  role: 'user' | 'artist' | 'designer' | 'gallery' | 'admin';
  emailConfirmed: boolean;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: string) => Promise<any>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  impersonatedRole: string | null;
  setImpersonation: (role: 'user' | 'artist' | 'designer' | 'gallery' | null) => void;
  clearImpersonation: () => void;
  effectiveRole: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_URL = import.meta.env.DEV ? 'http://localhost:3001' : '';

export function AuthProvider({ children }: { children: React.ReactNode}) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [impersonatedRole, setImpersonatedRole] = useState<string | null>(() => {
    return sessionStorage.getItem('impersonatedRole');
  });

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch(`${API_URL}/api/auth/me`, {
        credentials: 'include',
      });

      if (response.ok) {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const data = await response.json();
          setUser(data.user);
          setToken('authenticated');
          
          if (data.user?.role !== 'admin') {
            sessionStorage.removeItem('impersonatedRole');
            setImpersonatedRole(null);
          }
        } else {
          console.error('Expected JSON response but got:', contentType);
          setUser(null);
          setToken(null);
        }
      } else {
        setUser(null);
        setToken(null);
      }
    } catch (err) {
      console.error('Failed to fetch user:', err);
      setUser(null);
      setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Expected JSON but got:', contentType);
        console.error('Response body:', text);
        throw new Error('Server returned an invalid response. Please try again or contact support.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Login failed');
      }

      setToken('authenticated');
      setUser(data.user);
      
      if (data.user?.role !== 'admin') {
        clearImpersonation();
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Login failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const register = async (email: string, password: string, role: string): Promise<any> => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role }),
        credentials: 'include',
      });

      const contentType = response.headers.get('content-type');
      
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Expected JSON but got:', contentType);
        console.error('Response body:', text.substring(0, 500));
        throw new Error('Server returned an invalid response. Please try again or contact support.');
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Registration failed');
      }

      setToken('authenticated');
      setUser(data.user);
      
      if (data.user?.role !== 'admin') {
        clearImpersonation();
      }

      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Registration failed';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      await fetch(`${API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      setUser(null);
      setToken(null);
      clearImpersonation();
    }
  };

  const clearError = () => setError(null);

  const setImpersonation = (role: 'user' | 'artist' | 'designer' | 'gallery' | null) => {
    if (user?.role !== 'admin') {
      console.warn('Only admin users can impersonate other roles');
      return;
    }
    
    if (role) {
      sessionStorage.setItem('impersonatedRole', role);
      setImpersonatedRole(role);
    } else {
      clearImpersonation();
    }
  };

  const clearImpersonation = () => {
    sessionStorage.removeItem('impersonatedRole');
    setImpersonatedRole(null);
  };

  const effectiveRole = (user?.role === 'admin' && impersonatedRole) 
    ? impersonatedRole 
    : (user?.role || 'user');

  return (
    <AuthContext.Provider value={{ 
      user, 
      token, 
      login, 
      register, 
      logout, 
      loading, 
      error, 
      clearError,
      impersonatedRole,
      setImpersonation,
      clearImpersonation,
      effectiveRole
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
