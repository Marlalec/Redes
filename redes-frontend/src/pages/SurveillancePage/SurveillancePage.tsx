import { useEffect, useRef, useState } from "react";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import type { SurveillanceStatus } from "../../models/Auth";
import { getErrorMessage } from "../../services/api";
import {
  getSurveillanceFrame,
  getSurveillanceStatus,
  startSurveillance,
  stopSurveillance,
} from "../../services/authService";

const STOPPED: SurveillanceStatus = {
  active: false,
  faceDetected: false,
  message: "La cámara está detenida",
};

export function SurveillancePage() {
  const [status, setStatus] = useState<SurveillanceStatus>(STOPPED);
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const [operation, setOperation] = useState<"start" | "stop" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const currentUrl = useRef<string | null>(null);

  const releaseFrame = () => {
    if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
    currentUrl.current = null;
    setFrameUrl(null);
  };

  useEffect(() => {
    const request = new AbortController();
    getSurveillanceStatus(request.signal)
      .then(setStatus)
      .catch(() => undefined);
    return () => request.abort();
  }, []);

  useEffect(() => {
    if (!status.active) return;

    let stopped = false;
    let timer: number | undefined;
    let request: AbortController | null = null;

    const poll = async () => {
      request = new AbortController();
      try {
        const [nextStatus, frame] = await Promise.all([
          getSurveillanceStatus(request.signal),
          getSurveillanceFrame(request.signal),
        ]);
        if (stopped) return;
        setStatus(nextStatus);
        if (frame) {
          const nextUrl = URL.createObjectURL(frame);
          if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
          currentUrl.current = nextUrl;
          setFrameUrl(nextUrl);
        }
        if (nextStatus.active) {
          timer = window.setTimeout(poll, 320);
        } else {
          releaseFrame();
        }
      } catch (requestError) {
        if (!stopped && !(requestError instanceof DOMException && requestError.name === "AbortError")) {
          setError(getErrorMessage(requestError));
          setStatus(STOPPED);
        }
      }
    };

    void poll();
    return () => {
      stopped = true;
      if (timer !== undefined) window.clearTimeout(timer);
      request?.abort();
    };
  }, [status.active]);

  useEffect(() => () => {
    if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
  }, []);

  const handleStart = async () => {
    setOperation("start");
    setError(null);
    try {
      setStatus(await startSurveillance());
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setOperation(null);
    }
  };

  const handleStop = async () => {
    setOperation("stop");
    setError(null);
    try {
      await stopSurveillance();
      releaseFrame();
      setStatus(STOPPED);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setOperation(null);
    }
  };

  return (
    <div className="page-container page-section surveillance-page">
      <PageHeader
        eyebrow="Cámara de red"
        title="Vigilancia"
        description="Consulta la transmisión de la JOOAN en tiempo real desde la red interna."
      >
        <span className={`surveillance-status${status.active ? " surveillance-status--live" : ""}`}>
          <i aria-hidden="true" />
          {status.active ? "En vivo" : "Detenida"}
        </span>
      </PageHeader>

      <div className="surveillance-layout">
        <section className="surveillance-card" aria-label="Vista de vigilancia">
          <div className="surveillance-card__toolbar">
            <div>
              <span className="eyebrow">JOOAN · Red interna</span>
              <h2>Vista en tiempo real</h2>
            </div>
            {status.active ? (
              <button className="button button--danger-soft" type="button" onClick={handleStop} disabled={operation !== null}>
                {operation === "stop" ? "Deteniendo…" : "Detener vigilancia"}
              </button>
            ) : (
              <button className="button button--primary" type="button" onClick={handleStart} disabled={operation !== null}>
                {operation === "start" ? "Conectando…" : "Iniciar vigilancia"}
              </button>
            )}
          </div>

          <div className="surveillance-monitor">
            {frameUrl ? (
              <img src={frameUrl} alt="Transmisión en vivo de la cámara JOOAN" />
            ) : (
              <div className="surveillance-monitor__empty">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                  <path d="M4 7h11a2 2 0 0 1 2 2v6a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2Z" />
                  <path d="m17 10 5-3v10l-5-3" />
                  <circle cx="9.5" cy="12" r="2.5" />
                </svg>
                <strong>{status.active ? "Esperando imagen…" : "Vigilancia detenida"}</strong>
                <span>La cámara sólo se conecta cuando tú lo solicitas.</span>
              </div>
            )}
            {status.active ? (
              <div className="surveillance-monitor__overlay">
                <span className="surveillance-live"><i aria-hidden="true" /> EN VIVO</span>
                <span>{status.faceDetected ? "Rostro detectado" : status.message}</span>
              </div>
            ) : null}
          </div>

          {!status.active && !error ? <p className="surveillance-card__message">{status.message}</p> : null}
          {error ? <div className="face-operation-message face-operation-message--error" role="alert">{error}</div> : null}
        </section>

        <aside className="surveillance-info">
          <span className="surveillance-info__icon" aria-hidden="true">⌁</span>
          <span className="eyebrow">Privacidad</span>
          <h2>Visualización bajo demanda</h2>
          <p>La transmisión viaja por el servidor interno y las credenciales RTSP nunca llegan al navegador.</p>
          <ul>
            <li>No se graban videos ni fotografías.</li>
            <li>Se detiene automáticamente si cierras o abandonas la pantalla.</li>
            <li>El acceso requiere una sesión autenticada.</li>
          </ul>
        </aside>
      </div>
    </div>
  );
}
