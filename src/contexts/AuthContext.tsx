import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { authAPI } from '@/lib/api';
import { persistentState } from '@/utils/storage';

type Session = { user: { id: string; email: string; roles?: string[] } } | null;
type User = { 
  id: string; 
  email: string; 
  roles?: string[];
  username?: string;
  profile_image?: string;
} | null;

interface AuthContextType {
  session: Session | null;
  user: User | null;
  loading: boolean;
  userRoles: string[];
  isAdmin: boolean;
  signUp: (email: string, password: string, userType?: 'user' | 'admin') => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
  updateUser: (updates: Partial<NonNullable<User>>) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Session persistence keys
const SESSION_STORAGE_KEY = 'auth_session';
const USER_STORAGE_KEY = 'auth_user';
const ROLES_STORAGE_KEY = 'auth_roles';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [userRoles, setUserRoles] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  // Save session data to localStorage
  const saveSessionToStorage = useCallback((sessionData: Session, userData: User, rolesData: string[]) => {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionData));
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(userData));
      localStorage.setItem(ROLES_STORAGE_KEY, JSON.stringify(rolesData));
    } catch (error) {
      console.warn('Failed to save session to localStorage:', error);
    }
  }, []);

  // Update local user state manually (e.g. after profile update)
  const updateUser = useCallback((updates: Partial<NonNullable<User>>) => {
    if (!user) return;
    const updatedUser = { ...user, ...updates };
    setUser(updatedUser);
    
    // Update localStorage
    try {
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(updatedUser));
    } catch (error) {
      console.warn('Failed to update user in localStorage:', error);
    }
  }, [user]);

  // Load session data from localStorage
  const loadSessionFromStorage = useCallback(() => {
    try {
      const sessionData = localStorage.getItem(SESSION_STORAGE_KEY);
      const userData = localStorage.getItem(USER_STORAGE_KEY);
      const rolesData = localStorage.getItem(ROLES_STORAGE_KEY);

      if (sessionData && userData && rolesData) {
        return {
          session: JSON.parse(sessionData) as Session,
          user: JSON.parse(userData) as User,
          roles: JSON.parse(rolesData) as string[]
        };
      }
    } catch (error) {
      console.warn('Failed to load session from localStorage:', error);
    }
    return null;
  }, []);

  // Clear session data from localStorage
  const clearSessionFromStorage = useCallback(() => {
    try {
      localStorage.removeItem(SESSION_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(ROLES_STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear session from localStorage:', error);
    }
  }, []);

  // On app load, restore session from localStorage first, then verify with backend
  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        // First try to restore from localStorage for immediate UI update
        const cachedSession = loadSessionFromStorage();
        if (cachedSession && isMounted) {
          setSession(cachedSession.session);
          setUser(cachedSession.user);
          setUserRoles(cachedSession.roles);
        }

        // Then verify with backend
        try {
          const me = await authAPI.me();
          if (me && me.id && isMounted) {
            const roles = (me.roles as string[]) || [];
            const sessionData = { user: { id: me.id, email: me.email, roles } };
            const userData = { 
              id: me.id, 
              email: me.email, 
              roles,
              username: me.username,
              profile_image: me.profile_image
            };

            setSession(sessionData);
            setUser(userData);
            setUserRoles(roles);

            // Update localStorage with fresh data
            saveSessionToStorage(sessionData, userData, roles);
          } else if (isMounted) {
            // Backend session invalid, clear everything
            setSession(null);
            setUser(null);
            setUserRoles([]);
            clearSessionFromStorage();
          }
        } catch (apiError: unknown) {
          console.warn('Session verification failed:', apiError);

          if (isMounted) {
            // If it's a 401 (unauthorized), clear the session
            const errMsg = (apiError as any).message || '';
            if (errMsg.includes('Unauthorized') || errMsg.includes('401')) {
              setSession(null);
              setUser(null);
              setUserRoles([]);
              clearSessionFromStorage();
            }
            // For other errors, keep the cached session but log the issue
            else if (cachedSession) {
              console.log('Keeping cached session due to API error');
              // Session remains as loaded from localStorage
            } else {
              // No cached session and API failed, clear everything
              setSession(null);
              setUser(null);
              setUserRoles([]);
              clearSessionFromStorage();
            }
          }
        }
      } catch (err) {
        console.warn('Session restoration failed:', err);

        if (isMounted) {
          // If backend check fails, clear local session
          setSession(null);
          setUser(null);
          setUserRoles([]);
          clearSessionFromStorage();
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []); // Empty dependency array - this effect should only run once on mount

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
      const sessionData = { user: { id: result.id, email: result.email, roles } };
      const userData = { 
        id: result.id, 
        email: result.email, 
        roles,
        username: result.username,
        profile_image: result.profile_image
      };

      setSession(sessionData);
      setUser(userData);
      setUserRoles(roles);

      // Save to localStorage for persistence
      localStorage.setItem('auth_token', result.token);
      saveSessionToStorage(sessionData, userData, roles);
    } catch (err) {
      await authAPI.logout();
      throw err;
    }
  };

  const signOut = async () => {
    setSession(null);
    setUser(null);
    setUserRoles([]);

    // Clear localStorage session data
    localStorage.removeItem('auth_token');
    clearSessionFromStorage();

    // Clear all user-related persistent data
    persistentState.clearUserData();

    // Try to logout on backend, but don't fail if it doesn't work
    try {
      await authAPI.logout();
    } catch (error) {
      console.warn('Logout API call failed:', error);
      // Continue with local logout even if backend logout fails
    }
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
      signOut,
      updateUser
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
