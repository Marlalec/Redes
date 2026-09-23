import { useCallback, useEffect, useState } from "react";
import { ErrorState } from "../../components/Feedback/Feedback";
import { FaceCapturePreview } from "../../components/FaceCapturePreview/FaceCapturePreview";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { useApiResource } from "../../hooks/useApiResource";
import { getErrorMessage } from "../../services/api";
import {
  deleteFaceEnrollment,
  enrollFace,
  getFaceEnrollmentStatus,
} from "../../services/authService";

export function FaceSecurityPage() {
  const loadStatus = useCallback(
    (signal: AbortSignal) => getFaceEnrollmentStatus(signal),
    [],
  );
  const { data, isLoading, error: loadError, reload } = useApiResource(loadStatus);
  const [consent, setConsent] = useState(false);
  const [operation, setOperation] = useState<"enroll" | "delete" | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [operationError, setOperationError] = useState<string | null>(null);

  useEffect(() => {
    if (!deleteDialogOpen) return;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setDeleteDialogOpen(false);
    };
    document.addEventListener("keydown", closeOnEscape);
    return () => document.removeEventListener("keydown", closeOnEscape);
  }, [deleteDialogOpen]);

  const handleEnroll = async () => {
    if (!consent) {
      setOperationError("Debes aceptar el tratamiento de la plantilla facial.");
      return;
    }
    setOperation("enroll");
    setMessage(null);
    setOperationError(null);
    try {
      const response = await enrollFace();
      setMessage(`${response.message}. Se procesaron ${response.samples} muestras.`);
      setConsent(false);
      reload();
    } catch (requestError: unknown) {
      setOperationError(getErrorMessage(requestError));
    } finally {
      setOperation(null);
    }
  };

  const handleDelete = async () => {
    setDeleteDialogOpen(false);
    setOperation("delete");
    setMessage(null);
    setOperationError(null);
    try {
      await deleteFaceEnrollment();
      setMessage("La plantilla facial fue eliminada.");
      reload();
    } catch (requestError: unknown) {
      setOperationError(getErrorMessage(requestError));
    } finally {
      setOperation(null);
    }
  };

  return (
    <div className="page-container page-section face-security-page">
      <PageHeader
        eyebrow="Privacidad y acceso"
        title="Seguridad facial"
        description="Registra tu rostro como segundo factor para proteger el inicio de sesión de este usuario."
      >
        {data ? (
          <span className={`face-status-badge${data.enrolled ? " face-status-badge--active" : ""}`}>
            <span aria-hidden="true" />
            {data.enrolled ? "Rostro activo" : "Sin registrar"}
          </span>
        ) : null}
      </PageHeader>

      {isLoading ? (
        <div className="face-security-loading" role="status">Comprobando la plantilla facial…</div>
      ) : null}
      {loadError ? <ErrorState message={loadError} onRetry={reload} /> : null}

      {!isLoading && !loadError && data ? (
        <div className="face-security-grid">
          <section
            className={`face-enrollment-card${operation === "enroll" ? " face-enrollment-card--scanning" : ""}`}
            aria-labelledby="face-enrollment-title"
          >
            {operation === "enroll" ? (
              <FaceCapturePreview />
            ) : (
              <div className="face-enrollment-card__visual" aria-hidden="true"><span>◎</span></div>
            )}
            <div>
              <span className="eyebrow">{data.enrolled ? "Actualizar registro" : "Registro inicial"}</span>
              <h2 id="face-enrollment-title">
                {data.enrolled ? "Tu rostro ya protege la cuenta" : "Vincula tu rostro a esta cuenta"}
              </h2>
              <p>{data.description}</p>

              <ol className="face-capture-steps">
                <li><strong>Ubícate frente a la JOOAN.</strong><span>Deja visible solamente tu rostro.</span></li>
                <li><strong>Presiona registrar.</strong><span>Mira al frente con iluminación uniforme.</span></li>
                <li><strong>Mueve suavemente la cabeza.</strong><span>El control de movimiento validará la captura.</span></li>
              </ol>

              <label className="biometric-consent">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(event) => setConsent(event.target.checked)}
                  disabled={operation !== null}
                />
                <span>
                  Autorizo crear o reemplazar mi plantilla facial cifrada para verificar mi identidad en este sistema.
                </span>
              </label>

              {operationError ? <div className="face-operation-message face-operation-message--error" role="alert">{operationError}</div> : null}
              {message ? <div className="face-operation-message face-operation-message--success" role="status">{message}</div> : null}

              <div className="face-security-actions">
                <button className="button button--primary" type="button" onClick={handleEnroll} disabled={operation !== null || !consent}>
                  {operation === "enroll" ? "Capturando…" : data.enrolled ? "Actualizar mi rostro" : "Registrar mi rostro"}
                </button>
                {data.enrolled ? (
                  <button className="button button--danger-soft" type="button" onClick={() => setDeleteDialogOpen(true)} disabled={operation !== null}>
                    {operation === "delete" ? "Eliminando…" : "Eliminar plantilla"}
                  </button>
                ) : null}
              </div>
            </div>
          </section>

          <aside className="biometric-privacy-card">
            <span className="biometric-privacy-card__icon" aria-hidden="true">◇</span>
            <span className="eyebrow">Qué se conserva</span>
            <h2>Tu foto no se almacena</h2>
            <p>
              Los fotogramas RTSP se procesan temporalmente en memoria. El servicio guarda únicamente
              un vector matemático cifrado en el volumen local del servidor.
            </p>
            <ul>
              <li>Comparación 1:1 con el usuario que escribió la contraseña.</li>
              <li>Tres intentos por inicio de sesión y expiración automática.</li>
              <li>La plantilla puede eliminarse desde esta misma pantalla.</li>
            </ul>
          </aside>

          {deleteDialogOpen ? (
            <div className="confirm-dialog" role="presentation" onMouseDown={() => setDeleteDialogOpen(false)}>
              <section
                className="confirm-dialog__panel"
                role="alertdialog"
                aria-modal="true"
                aria-labelledby="delete-face-title"
                aria-describedby="delete-face-description"
                onMouseDown={(event) => event.stopPropagation()}
              >
                <button
                  className="confirm-dialog__close"
                  type="button"
                  aria-label="Cerrar confirmación"
                  onClick={() => setDeleteDialogOpen(false)}
                >
                  ×
                </button>
                <span className="confirm-dialog__icon" aria-hidden="true">!</span>
                <span className="eyebrow">Confirmar eliminación</span>
                <h2 id="delete-face-title">¿Eliminar tu plantilla facial?</h2>
                <p id="delete-face-description">
                  Ya no podrás iniciar sesión mediante reconocimiento facial hasta registrar nuevamente tu rostro.
                </p>
                <div className="confirm-dialog__actions">
                  <button className="button" type="button" onClick={() => setDeleteDialogOpen(false)}>
                    Conservar rostro
                  </button>
                  <button className="button button--danger" type="button" onClick={handleDelete}>
                    Sí, eliminar
                  </button>
                </div>
              </section>
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
