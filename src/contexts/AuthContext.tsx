import { createContext, useContext, useEffect, useState } from 'react';
import { authAPI } from '@/lib/api';

type Session = { user: { id: string; email: string; roles?: string[] } } | null;
type User = { id: string; email: string; roles?: string[] } | null;

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

  // On app load, restore session from backend (not localStorage)
  useEffect(() => {
    (async () => {
      try {
        const me = await authAPI.me();
        if (me && me.id) {
          const roles = (me.roles as string[]) || [];
          setSession({ user: { id: me.id, email: me.email, roles } });
          setUser({ id: me.id, email: me.email, roles });
          setUserRoles(roles);
        }
      } catch {
        // No valid session on backend; user is logged out
        await authAPI.logout();
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signUp = async (email: string, password: string, userType: 'user' | 'admin' = 'user') => {
    const user = await authAPI.signup(email, password, userType);
    // After signup, user must login separately
    return user;
  };

  const signIn = async (email: string, password: string) => {
    try {
      const result = await authAPI.login(email, password);
      if (!result || !result.id) {
        throw new Error('Invalid credentials');
      }
      const roles = (result.roles as string[]) || [];
      setSession({ user: { id: result.id, email: result.email, roles } });
      setUser({ id: result.id, email: result.email, roles });
      setUserRoles(roles);
    } catch (err) {
      await authAPI.logout();
      throw err;
    }
  };

  const signOut = async () => {
    setSession(null);
    setUser(null);
    setUserRoles([]);
    await authAPI.logout();
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
