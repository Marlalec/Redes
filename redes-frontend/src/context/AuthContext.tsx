import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser, LoginCredentials } from "../models/Auth";
import { ApiRequestError, AUTH_UNAUTHORIZED_EVENT } from "../services/api";
import {
  getCurrentSession,
  login as loginRequest,
  logout as logoutRequest,
} from "../services/authService";

interface AuthContextValue {
  user: AuthUser | null;
  isCheckingSession: boolean;
  login: (credentials: LoginCredentials) => Promise<AuthUser>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isCheckingSession, setIsCheckingSession] = useState(true);

  useEffect(() => {
    const controller = new AbortController();

    getCurrentSession(controller.signal)
      .then(setUser)
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        if (!(error instanceof ApiRequestError) || error.status !== 401) {
          console.error("No fue posible comprobar la sesión", error);
        }
        setUser(null);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsCheckingSession(false);
      });

    return () => controller.abort();
  }, []);

  useEffect(() => {
    const clearExpiredSession = () => setUser(null);
    window.addEventListener(AUTH_UNAUTHORIZED_EVENT, clearExpiredSession);
    return () => window.removeEventListener(AUTH_UNAUTHORIZED_EVENT, clearExpiredSession);
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const authenticatedUser = await loginRequest(credentials);
    setUser(authenticatedUser);
    return authenticatedUser;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, isCheckingSession, login, logout }),
    [user, isCheckingSession, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth debe utilizarse dentro de AuthProvider");
  }

  return context;
}
