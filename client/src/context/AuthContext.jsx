import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getSession, loginRequest } from '../services/authService';
import { TOKEN_STORAGE_KEY, USER_STORAGE_KEY } from '../utils/constants';

const AuthContext = createContext(null);

const readStoredUser = () => {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState(readStoredUser);
  const [initializing, setInitializing] = useState(Boolean(localStorage.getItem(TOKEN_STORAGE_KEY)));

  const clearSession = useCallback(() => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }, []);

  const persistSession = useCallback((nextToken, nextUser) => {
    localStorage.setItem(TOKEN_STORAGE_KEY, nextToken);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(nextUser));
    setToken(nextToken);
    setUser(nextUser);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);

    if (!storedToken) {
      setInitializing(false);
      return () => {
        cancelled = true;
      };
    }

    setInitializing(true);
    getSession()
      .then((data) => {
        if (cancelled) return;
        persistSession(storedToken, data.user);
      })
      .catch(() => {
        if (cancelled) return;
        clearSession();
      })
      .finally(() => {
        if (!cancelled) setInitializing(false);
      });

    return () => {
      cancelled = true;
    };
  }, [persistSession, clearSession]);

  useEffect(() => {
    const handleUnauthorized = () => clearSession();
    window.addEventListener('qubenix:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('qubenix:unauthorized', handleUnauthorized);
  }, [clearSession]);

  const login = useCallback(
    async (credentials) => {
      const data = await loginRequest(credentials);
      persistSession(data.token, data.user);
      return data.user;
    },
    [persistSession],
  );

  const refreshUser = useCallback(async () => {
    const data = await getSession();
    setUser(data.user);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(data.user));
    return data.user;
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      initializing,
      isAuthenticated: Boolean(user && token),
      isAdmin: user?.role === 'admin',
      isIntern: user?.role === 'intern',
      login,
      logout: clearSession,
      refreshUser,
    }),
    [user, token, initializing, login, clearSession, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside an AuthProvider');
  return context;
};
