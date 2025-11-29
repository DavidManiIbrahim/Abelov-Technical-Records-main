import { createContext, useContext, useEffect, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

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

  const ensureUserProfile = async (u: User) => {
    try {
      const { data } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('id', u.id)
        .maybeSingle();
      if (!data) {
        await supabase.from('user_profiles').insert({ id: u.id, email: u.email });
      }
    } catch (e) {
      console.error('ensureUserProfile error', e);
    }
  };

  const fetchUserRoles = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId);
      if (error) throw error;
      const roles = (data as Array<{ role: string }> | null)?.map((r) => r.role) || [];
      setUserRoles(roles);
    } catch (err) {
      console.error('Failed to fetch user roles:', err);
      setUserRoles([]);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        ensureUserProfile(session.user);
        fetchUserRoles(session.user.id);
      }
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user?.id) {
        ensureUserProfile(session.user);
        fetchUserRoles(session.user.id);
      } else {
        setUserRoles([]);
      }
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  const signUp = async (email: string, password: string, userType: 'user' | 'admin' = 'user') => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });
    if (error) {
      console.error('SignUp error:', error);
      throw new Error(error.message || 'Failed to create account');
    }
    const newUser = data.user;
    if (newUser?.id) {
      try {
        await supabase.from('user_profiles').insert({ id: newUser.id, email });
      } catch (e) {
        console.error('Insert user_profiles failed (likely due to RLS or pending email confirmation)', e);
      }
      try {
        await supabase.from('user_roles').insert({ user_id: newUser.id, role: userType });
      } catch (e) {
        console.error('Insert user_roles failed (admin role may require elevated privileges)', e);
      }
    }
  };

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error('SignIn error:', error);
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password. Please check and try again.');
      }
      throw new Error(error.message || 'Failed to sign in');
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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
