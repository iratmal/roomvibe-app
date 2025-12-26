import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { PlanLimits, PlanType } from '../config/planLimits';

interface UserUsage {
  artworks: number;
  projects: number;
  wallPhotos: number;
}

export interface UserEntitlements {
  artist_access: boolean;
  designer_access: boolean;
  gallery_access: boolean;
}

interface User {
  id: number;
  email: string;
  role: 'user' | 'artist' | 'designer' | 'gallery' | 'admin';
  isAdmin?: boolean;
  emailConfirmed: boolean;
  subscriptionStatus?: string;
  subscriptionPlan?: string;
  effectivePlan?: PlanType;
  planLimits?: PlanLimits;
  usage?: UserUsage;
  entitlements?: UserEntitlements;
  onboardingCompleted?: boolean;
}

export interface ViewerData {
  id: number;
  email: string;
  role: string;
  isAdmin: boolean;
  emailConfirmed: boolean;
  createdAt?: string;
  subscriptionStatus: string;
  subscriptionPlan: string;
  effectivePlan: PlanType;
  planLimits: PlanLimits;
  entitlements: UserEntitlements;
  onboardingCompleted: boolean;
  usage: UserUsage;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, role: string, tosAccepted?: boolean, marketingOptIn?: boolean) => Promise<any>;
  logout: () => void;
  loading: boolean;
  error: string | null;
  clearError: () => void;
  impersonatedRole: string | null;
  setImpersonation: (role: 'user' | 'artist' | 'designer' | 'gallery' | 'allin' | null) => void;
  clearImpersonation: () => void;
  effectiveRole: string;
  hasEntitlement: (entitlement: 'artist_access' | 'designer_access' | 'gallery_access') => boolean;
  hasAnyEntitlement: () => boolean;
  completeOnboarding: () => Promise<void>;
  viewer: ViewerData | null;
  impersonatedUserId: number | null;
  isImpersonating: boolean;
  startImpersonation: (userId: number) => Promise<void>;
  stopImpersonation: () => void;
  loadViewerById: (userId: number) => Promise<ViewerData | null>;
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
  const [viewer, setViewer] = useState<ViewerData | null>(null);
  const [impersonatedUserId, setImpersonatedUserId] = useState<number | null>(() => {
    const stored = sessionStorage.getItem('impersonatedUserId');
    return stored ? parseInt(stored, 10) : null;
  });

  useEffect(() => {
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    if (user?.role === 'admin' && impersonatedUserId) {
      loadViewerById(impersonatedUserId);
    }
  }, [user, impersonatedUserId]);

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
            sessionStorage.removeItem('impersonatedUserId');
            setImpersonatedRole(null);
            setImpersonatedUserId(null);
            setViewer(null);
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

  const register = async (email: string, password: string, role: string, tosAccepted: boolean = false, marketingOptIn: boolean = false): Promise<any> => {
    setError(null);
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, role, tosAccepted, marketingOptIn }),
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

  const setImpersonation = (role: 'user' | 'artist' | 'designer' | 'gallery' | 'allin' | null) => {
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
    sessionStorage.removeItem('impersonatedUserId');
    setImpersonatedRole(null);
    setImpersonatedUserId(null);
    setViewer(null);
  };

  const loadViewerById = useCallback(async (userId: number): Promise<ViewerData | null> => {
    if (!user?.isAdmin && user?.role !== 'admin') {
      console.warn('Only admin users can load viewer data');
      return null;
    }

    try {
      const response = await fetch(`${API_URL}/api/admin/impersonate/user/${userId}`, {
        credentials: 'include',
      });

      if (!response.ok) {
        console.error('Failed to load viewer data');
        return null;
      }

      const data = await response.json();
      setViewer(data.viewer);
      return data.viewer;
    } catch (err) {
      console.error('Error loading viewer data:', err);
      return null;
    }
  }, [user]);

  const startImpersonation = async (userId: number) => {
    if (user?.role !== 'admin') {
      console.warn('Only admin users can impersonate');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/admin/impersonate/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
        credentials: 'include',
      });

      if (!response.ok) {
        const data = await response.json();
        console.error('Failed to start impersonation:', data.error);
        return;
      }

      const data = await response.json();
      sessionStorage.setItem('impersonatedUserId', String(userId));
      setImpersonatedUserId(userId);
      setViewer(data.viewer);
      
      const role = data.viewer.effectivePlan === 'allaccess' ? 'allin' : 
                   data.viewer.effectivePlan === 'user' ? 'user' :
                   data.viewer.effectivePlan;
      sessionStorage.setItem('impersonatedRole', role);
      setImpersonatedRole(role);
    } catch (err) {
      console.error('Error starting impersonation:', err);
    }
  };

  const stopImpersonation = async () => {
    try {
      await fetch(`${API_URL}/api/admin/impersonate/stop`, {
        method: 'POST',
        credentials: 'include',
      });
    } catch (err) {
      console.error('Error stopping impersonation:', err);
    }
    clearImpersonation();
    window.location.hash = '#/dashboard';
  };

  const effectiveRole = (user?.role === 'admin' && impersonatedRole) 
    ? impersonatedRole 
    : (user?.role || 'user');

  const hasEntitlement = (entitlement: 'artist_access' | 'designer_access' | 'gallery_access'): boolean => {
    if (viewer) {
      return viewer.entitlements[entitlement] || false;
    }
    if (!user) return false;
    if (user.isAdmin || user.role === 'admin') return true;
    return user.entitlements?.[entitlement] || false;
  };

  const hasAnyEntitlement = (): boolean => {
    if (viewer) {
      return (
        viewer.entitlements.artist_access ||
        viewer.entitlements.designer_access ||
        viewer.entitlements.gallery_access
      );
    }
    if (!user) return false;
    if (user.isAdmin || user.role === 'admin') return true;
    return (
      (user.entitlements?.artist_access || false) ||
      (user.entitlements?.designer_access || false) ||
      (user.entitlements?.gallery_access || false)
    );
  };

  const completeOnboarding = async (): Promise<void> => {
    try {
      const response = await fetch(`${API_URL}/api/auth/complete-onboarding`, {
        method: 'POST',
        credentials: 'include',
      });

      if (response.ok) {
        setUser(prevUser => prevUser ? { ...prevUser, onboardingCompleted: true } : null);
      }
    } catch (err) {
      console.error('Failed to complete onboarding:', err);
    }
  };

  const isImpersonating = !!(user?.role === 'admin' && impersonatedUserId && viewer);

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
      effectiveRole,
      hasEntitlement,
      hasAnyEntitlement,
      completeOnboarding,
      viewer,
      impersonatedUserId,
      isImpersonating,
      startImpersonation,
      stopImpersonation,
      loadViewerById,
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

export function useViewer() {
  const { user, viewer, isImpersonating } = useAuth();
  
  if (isImpersonating && viewer) {
    return {
      viewer,
      isImpersonating: true,
      effectivePlan: viewer.effectivePlan,
      planLimits: viewer.planLimits,
      entitlements: viewer.entitlements,
      usage: viewer.usage,
      email: viewer.email,
      id: viewer.id,
    };
  }

  return {
    viewer: user ? {
      id: user.id,
      email: user.email,
      role: user.role,
      isAdmin: user.isAdmin || false,
      emailConfirmed: user.emailConfirmed,
      subscriptionStatus: user.subscriptionStatus || 'free',
      subscriptionPlan: user.subscriptionPlan || 'user',
      effectivePlan: user.effectivePlan || 'user' as PlanType,
      planLimits: user.planLimits || {} as PlanLimits,
      entitlements: user.entitlements || { artist_access: false, designer_access: false, gallery_access: false },
      onboardingCompleted: user.onboardingCompleted || false,
      usage: user.usage || { artworks: 0, projects: 0, wallPhotos: 0 },
    } as ViewerData : null,
    isImpersonating: false,
    effectivePlan: user?.effectivePlan || 'user' as PlanType,
    planLimits: user?.planLimits || {} as PlanLimits,
    entitlements: user?.entitlements || { artist_access: false, designer_access: false, gallery_access: false },
    usage: user?.usage || { artworks: 0, projects: 0, wallPhotos: 0 },
    email: user?.email || '',
    id: user?.id || 0,
  };
}
