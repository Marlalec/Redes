import { useCallback, useState, type FormEvent } from "react";
import { Navigate, useLocation, useNavigate } from "react-router";
import { LoginFacePreview } from "../../components/LoginFacePreview/LoginFacePreview";
import { useAuth } from "../../context/AuthContext";
import { getErrorMessage } from "../../services/api";
import { cancelFaceVerification } from "../../services/authService";

interface LoginLocationState {
  from?: string;
}

type LoginPhase = "credentials" | "face";

export function LoginPage() {
  const { user, isCheckingSession, login, verifyFace } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [phase, setPhase] = useState<LoginPhase>("credentials");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const showPreviewError = useCallback((message: string) => setError(message), []);

  if (!isCheckingSession && user) {
    return <Navigate to="/" replace />;
  }

  const finishLogin = () => {
    const state = location.state as LoginLocationState | null;
    const requestedPath = state?.from;
    const safeDestination =
      requestedPath?.startsWith("/") && !requestedPath.startsWith("//")
        ? requestedPath
        : "/";
    navigate(safeDestination, { replace: true });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsSubmitting(true);

    try {
      const result = await login({ email: email.trim(), password });
      setPassword("");
      if (result.status === "FACE_REQUIRED") {
        setPhase("face");
      } else {
        finishLogin();
      }
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFaceVerification = async () => {
    setError(null);
    setIsSubmitting(true);
    try {
      await verifyFace();
      finishLogin();
    } catch (requestError: unknown) {
      setError(getErrorMessage(requestError));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleBack = async () => {
    setIsSubmitting(true);
    try {
      await cancelFaceVerification();
    } catch {
      // El desafío también expira automáticamente en el servidor.
    } finally {
      setPhase("credentials");
      setPassword("");
      setError(null);
      setIsSubmitting(false);
    }
  };

  return (
    <main className="login-page">
      <section className="login-welcome" aria-labelledby="login-welcome-title">
        <div className="login-brand">
          <span className="brand__mark" aria-hidden="true"><span /><span /><span /></span>
          <span className="brand__text"><strong>OSI Dev</strong><small>Explorer</small></span>
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
          {phase === "credentials" ? (
            <>
              <div className="login-card__heading">
                <span className="login-card__icon" aria-hidden="true">✓</span>
                <div><span className="eyebrow">Acceso seguro</span><h2 id="login-title">Iniciar sesión</h2></div>
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

                {error ? <LoginError message={error} /> : null}

                <button className="button button--login" type="submit" disabled={isSubmitting}>
                  {isSubmitting ? "Verificando…" : "Entrar al explorador"}
                  <span aria-hidden="true">→</span>
                </button>
              </form>

              <p className="login-card__help">
                La verificación facial solo se solicita si ya registraste tu rostro.
              </p>
            </>
          ) : (
            <div className="face-login-step">
              <div className="login-card__heading">
                <span className="login-card__icon login-card__icon--face" aria-hidden="true">◎</span>
                <div><span className="eyebrow">Segundo factor</span><h2 id="login-title">Verifica tu rostro</h2></div>
              </div>
              <p className="login-card__intro">
                Contraseña correcta para <strong>{email}</strong>. Ubícate frente a la cámara JOOAN.
              </p>

              {isSubmitting ? (
                <LoginFacePreview isVerifying onError={showPreviewError} />
              ) : null}

              <ol className="face-login-instructions">
                <li>Mantén un solo rostro visible y con buena iluminación.</li>
                <li>Mira al frente y mueve lentamente la cabeza a ambos lados.</li>
                <li>La captura tarda normalmente entre 3 y 14 segundos.</li>
              </ol>

              {error ? <LoginError message={error} /> : null}

              <button className="button button--login" type="button" onClick={handleFaceVerification} disabled={isSubmitting}>
                {isSubmitting ? "Analizando en la cámara…" : "Verificar mi rostro"}
                <span aria-hidden="true">◎</span>
              </button>
              <button className="face-login-back" type="button" onClick={handleBack} disabled={isSubmitting}>
                Volver a correo y contraseña
              </button>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function LoginError({ message }: { message: string }) {
  return (
    <div className="login-error" role="alert">
      <span aria-hidden="true">!</span>
      <p>{message}</p>
    </div>
  );
}
