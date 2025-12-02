import { createContext, useContext, useEffect, useState } from 'react';
type Session = { user: { id: string; email: string } } | null;
type User = { id: string; email: string } | null;
import { convex } from '@/lib/convexClient';
type SignInResult = { user: { id: string; email: string }; roles: string[] };

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

  const fetchUserRoles = async (userId: string) => {
    try {
      const roles = await convex.query('users:getRoles', { userId });
      const list = (roles as Array<{ role: string }> | null)?.map((r) => r.role) || [];
      setUserRoles(list);
    } catch (err) {
      console.error('Failed to fetch user roles:', err);
      setUserRoles([]);
    }
  };

  useEffect(() => {
    setLoading(false);
  }, []);

  const signUp = async (email: string, password: string, userType: 'user' | 'admin' = 'user') => {
    const user = await convex.mutation('users:signUp', { email, password, role: userType });
    setSession({ user });
    setUser(user);
    await fetchUserRoles(user.id);
  };

  const signIn = async (email: string, password: string) => {
    try {
      const res = await convex.query('users:signIn', { email, password });
      const { user: u, roles } = res as SignInResult;
      setSession({ user: u });
      setUser(u);
      setUserRoles(roles || []);
    } catch (e) {
      if (e?.message?.includes('Invalid')) {
        throw new Error('Invalid email or password. Please check and try again.');
      }
      const msg = e instanceof Error ? e.message : 'Failed to sign in';
      throw new Error(msg);
    }
  };

  const signOut = async () => {
    setSession(null);
    setUser(null);
    setUserRoles([]);
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
