import { createContext, useContext, useEffect, useState } from 'react';
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
      const u = JSON.parse(raw) as { id: string; email: string };
      setSession({ user: u });
      setUser(u);
      fetchUserRoles(u.id);
    }
    setLoading(false);
  }, []);

  const signUp = async (email: string, _password: string, _userType: 'user' | 'admin' = 'user') => {
    const user = { id: `user_${Date.now()}`, email };
    localStorage.setItem('app_user', JSON.stringify(user));
    setSession({ user });
    setUser(user);
    await fetchUserRoles(user.id);
  };

  const signIn = async (email: string, _password: string) => {
    const user = { id: `user_${Date.now()}`, email };
    localStorage.setItem('app_user', JSON.stringify(user));
    setSession({ user });
    setUser(user);
    await fetchUserRoles(user.id);
  };

  const signOut = async () => {
    setSession(null);
    setUser(null);
    setUserRoles([]);
    localStorage.removeItem('app_user');
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
