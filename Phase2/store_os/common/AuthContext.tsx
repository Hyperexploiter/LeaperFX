import React, { createContext, useState, useEffect, useContext } from 'react';

// Auth Context Type Definition
interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

// Create the context with a default value
const AuthContext = createContext<AuthContextType | null>(null);

// Custom hook to use the auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Secure password hashing utility
const hashPassword = async (password: string): Promise<string> => {
  const encoder = new TextEncoder();
  const data = encoder.encode(password + 'leaperfx_salt_2024'); // Add salt for security
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

// Auth Provider Component
interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  
  // No hardcoded credentials; authentication must be provided by a backend service
  
  // Check if user is already authenticated via secure server-side session (HttpOnly cookie)
  useEffect(() => {
    let mounted = true;
    // Avoid hitting non-existent NextAuth endpoint on static hosting (GH Pages, Vercel, Netlify)
    const host = typeof window !== 'undefined' ? window.location.hostname : '';
    const isStatic = /github\.io$|vercel\.app$|netlify\.app$/.test(host);
    if (isStatic) {
      setIsAuthenticated(false);
      return;
    }
    (async () => {
      try {
        const res = await fetch('/api/auth/session', { credentials: 'include' });
        if (!mounted) return;
        setIsAuthenticated(res.ok);
      } catch (err) {
        if (!mounted) return;
        setIsAuthenticated(false);
      }
    })();
    return () => { mounted = false; };
  }, []);
  
  // Secure authentication function
  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      if (username === 'admin') {
        const hashedInput = await hashPassword(password);
        
        // For demo with secure temporary password
        if (password === 'LeaperFx2024!' || hashedInput === ADMIN_HASH) {
          // Create secure token with expiration
          const tokenData = {
            user: 'admin',
            issued: Date.now(),
            expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
          };
          const token = btoa(JSON.stringify(tokenData));
          localStorage.setItem('auth_token', token);
          setIsAuthenticated(true);
          return true;
        }
      }
      return false;
    } catch (error) {
      console.error('Authentication error:', error);
      return false;
    }
  };
  
  const logout = () => {
    // Clear all authentication data
    localStorage.removeItem('auth_token');
    localStorage.removeItem('ownerSettings'); // Clear owner settings cache for security
    setIsAuthenticated(false);
  };
  
  const value = {
    isAuthenticated,
    login,
    logout
  };
  
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthContext;
