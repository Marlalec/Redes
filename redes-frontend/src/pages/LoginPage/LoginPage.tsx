import { useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../services/api";

interface LoginLocationState {
  from?: string;
}

export function LoginPage() {
  const { user, isCheckingSession, login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isCheckingSession && user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      await login({ email: email.trim(), password });
      const state = location.state as LoginLocationState | null;
      const requestedPath = state?.from;
      const safeDestination =
        requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
          ? requestedPath
          : "/";
      navigate(safeDestination, { replace: true });
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-welcome" aria-labelledby="login-welcome-title">
        <div className="login-brand">
          <span className="brand__mark" aria-hidden="true">
            <span />
            <span />
            <span />
          </span>
          <span className="brand__text">
            <strong>OSI Dev</strong>
            <small>Explorer</small>
          </span>
        </div>

        <div className="login-welcome__copy">
          <span className="eyebrow">Aprende redes paso a paso</span>
          <h1 id="login-welcome-title">Tu laboratorio de redes, ahora más cercano.</h1>
          <p>
            Explora las capas OSI, protocolos y puertos dentro de una aplicación
            conectada de verdad con Spring Boot y SQL Server.
          </p>
        </div>

        <ul className="login-benefits" aria-label="Contenido disponible">
          <li><span>7</span><div><strong>Capas OSI</strong><small>Explicadas con ejemplos</small></div></li>
          <li><span>15</span><div><strong>Protocolos</strong><small>Consulta y comparación</small></div></li>
          <li><span>13</span><div><strong>Puertos</strong><small>Aplicados al desarrollo</small></div></li>
        </ul>
      </section>

      <section className="login-access" aria-labelledby="login-title">
        <div className="login-card">
          <div className="login-card__heading">
            <span className="login-card__icon" aria-hidden="true">✓</span>
            <div>
              <span className="eyebrow">Acceso seguro</span>
              <h2 id="login-title">Iniciar sesión</h2>
            </div>
          </div>
          <p className="login-card__intro">
            Ingresa con las credenciales creadas al iniciar el ambiente.
          </p>

          <form className="login-form" onSubmit={handleSubmit}>
            <label className="form-field" htmlFor="login-email">
              <span>Correo electrónico</span>
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                placeholder="admin@osidev.local"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                disabled={isSubmitting}
              />
            </label>

            <label className="form-field" htmlFor="login-password">
              <span>Contraseña</span>
              <span className="password-control">
                <input
                  id="login-password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Escribe tu contraseña"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  required
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
                  disabled={isSubmitting}
                >
                  {showPassword ? "Ocultar" : "Mostrar"}
                </button>
              </span>
            </label>

            {error ? (
              <div className="login-error" role="alert">
                <span aria-hidden="true">!</span>
                <p>{error}</p>
              </div>
            ) : null}

            <button className="button button--login" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Verificando…" : "Entrar al explorador"}
              <span aria-hidden="true">→</span>
            </button>
          </form>

          <p className="login-card__help">
            Docker muestra estas credenciales al terminar y también las conserva
            en el archivo local <code>.env</code>.
          </p>
        </div>
      </section>
    </main>
  );
}
