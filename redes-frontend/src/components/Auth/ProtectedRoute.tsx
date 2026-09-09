import { Navigate, Outlet, useLocation } from "react-router";
import { useAuth } from "../../context/AuthContext";

export function ProtectedRoute() {
  const { user, isCheckingSession } = useAuth();
  const location = useLocation();

  if (isCheckingSession) {
    return (
      <main className="session-loader" aria-live="polite">
        <span className="session-loader__mark" aria-hidden="true">
          <i />
          <i />
          <i />
        </span>
        <strong>Preparando tu espacio de aprendizaje…</strong>
      </main>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return <Outlet />;
}
