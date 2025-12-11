import { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '@/lib/api';
type Session = { user: { id: string; email: string } } | null;
type User = { id: string; email: string } | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  userRoles: string[];
  isAdmin: boolean;
  signUp: (email: string, password: string, userType?: 'user' | 'admin') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserRoles = async (_userId: string) => {
    setUserRoles([]);
  };

  useEffect(() => {
    const raw = localStorage.getItem('app_user');
    if (raw) {
      try {
        const u = JSON.parse(raw) as { id?: string; email?: string };
        if (u && typeof u.id === 'string' && u.id && typeof u.email === 'string' && u.email) {
          setSession({ user: { id: u.id, email: u.email } });
          setUser({ id: u.id, email: u.email });
          fetchUserRoles(u.id);
        } else {
          localStorage.removeItem('app_user');
          localStorage.removeItem('isLoggedIn');
        }
      } catch {
        localStorage.removeItem('app_user');
        localStorage.removeItem('isLoggedIn');
      }
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, userType: 'user' | 'admin' = 'user') => {
    const res = await authAPI.signup(email, password, userType);
    return res;
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await authAPI.login(email, password);
      if (!result || !result.id) {
        localStorage.removeItem('app_user');
        localStorage.removeItem('isLoggedIn');
        throw new Error('Invalid credentials');
      }
      localStorage.setItem('app_user', JSON.stringify({ id: result.id, email: result.email }));
      localStorage.setItem('isLoggedIn', 'true');
      if (result.token) localStorage.setItem('auth_token', result.token);
      setSession({ user: { id: result.id, email: result.email } });
      setUser({ id: result.id, email: result.email });
      await fetchUserRoles(result.id);
    } catch (err) {
      localStorage.removeItem('app_user');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('auth_token');
      throw err;
    }
  };

  const signOut = async () => {
    setSession(null);
    setUser(null);
    setUserRoles([]);
    localStorage.removeItem('app_user');
    localStorage.removeItem('isLoggedIn');
    localStorage.removeItem('auth_token');
  };

  return (
    <AuthContext.Provider value={{ 
      session, 
      user, 
      loading, 
      userRoles, 
      isAdmin: userRoles.includes('admin'), 
      signUp, 
      signIn, 
      signOut 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};
