import { createContext, useContext, useEffect, useState } from 'react';

type LocalUser = { id: string; email: string };
type LocalSession = { user: LocalUser };
type StoredUser = { id: string; email: string; password: string; roles?: string[]; is_active?: boolean; created_at?: string };

interface AuthContextType {
  session: LocalSession | null;
  user: LocalUser | null;
  loading: boolean;
  userRoles: string[];
  isAdmin: boolean;
  signUp: (email: string, password: string, userType?: 'user' | 'admin') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<LocalSession | null>(null);
  const [user, setUser] = useState<LocalUser | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUserRoles = (userId: string) => {
    try {
      const raw = localStorage.getItem('users');
      const users: StoredUser[] = raw ? JSON.parse(raw) : [];
      const found = users.find((u) => u.id === userId);
      setUserRoles(found?.roles || []);
    } catch (err) {
      console.error('Failed to fetch user roles:', err);
      setUserRoles([]);
    }
  };

  useEffect(() => {
    try {
      const raw = localStorage.getItem('auth');
      const current = raw ? JSON.parse(raw) : null;
      if (current?.user) {
        setSession(current);
        setUser(current.user);
        fetchUserRoles(current.user.id);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const signUp = async (email: string, password: string, userType: 'user' | 'admin' = 'user') => {
    const raw = localStorage.getItem('users');
    const users: StoredUser[] = raw ? JSON.parse(raw) : [];
    if (users.some((u) => u.email === email)) {
      throw new Error('Email already registered');
    }
    const id = crypto.randomUUID ? crypto.randomUUID() : `U-${Date.now()}`;
    const created_at = new Date().toISOString();
    const userRecord: StoredUser = { id, email, password, roles: userType === 'admin' ? ['admin'] : ['user'], is_active: true, created_at };
    users.push(userRecord);
    localStorage.setItem('users', JSON.stringify(users));
  };

  const signIn = async (email: string, password: string) => {
    const raw = localStorage.getItem('users');
    const users: StoredUser[] = raw ? JSON.parse(raw) : [];
    const found = users.find((u) => u.email === email && u.password === password);
    if (!found) {
      throw new Error('Invalid email or password. Please check and try again.');
    }
    const localUser: LocalUser = { id: found.id, email: found.email };
    const sessionObj: LocalSession = { user: localUser };
    localStorage.setItem('auth', JSON.stringify(sessionObj));
    setSession(sessionObj);
    setUser(localUser);
    setUserRoles(found.roles || []);
  };

  const signOut = async () => {
    localStorage.removeItem('auth');
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
