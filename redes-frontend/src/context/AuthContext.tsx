import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { AuthUser, LoginCredentials, PasswordLoginResponse } from "../models/Auth";
import { ApiRequestError, AUTH_UNAUTHORIZED_EVENT } from "../services/api";
import {
  getCurrentSession,
  login as loginRequest,
  logout as logoutRequest,
  verifyFace as verifyFaceRequest,
} from "../services/authService";

interface AuthContextValue {
  user: AuthUser | null;
  isCheckingSession: boolean;
  login: (credentials: LoginCredentials) => Promise<PasswordLoginResponse>;
  verifyFace: () => Promise<AuthUser>;
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
    const result = await loginRequest(credentials);
    if (result.status === "AUTHENTICATED" && result.user) {
      setUser(result.user);
    }
    return result;
  }, []);

  const verifyFace = useCallback(async () => {
    const result = await verifyFaceRequest();
    setUser(result.user);
    return result.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, isCheckingSession, login, verifyFace, logout }),
    [user, isCheckingSession, login, verifyFace, logout],
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
