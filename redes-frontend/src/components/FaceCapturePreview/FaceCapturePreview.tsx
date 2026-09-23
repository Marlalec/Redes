import { useEffect, useRef, useState } from "react";
import type { FacePreviewStatus } from "../../models/Auth";
import {
  getFacePreviewFrame,
  getFacePreviewStatus,
} from "../../services/authService";

const EMPTY_STATUS: FacePreviewStatus = {
  active: true,
  samples: 0,
  required: 8,
  faceDetected: false,
  livenessVerified: false,
  message: "Conectando con la cámara…",
};

export function FaceCapturePreview() {
  const [status, setStatus] = useState<FacePreviewStatus>(EMPTY_STATUS);
  const [frameUrl, setFrameUrl] = useState<string | null>(null);
  const currentUrl = useRef<string | null>(null);

  useEffect(() => {
    let stopped = false;
    let timer: number | undefined;
    let request: AbortController | null = null;

    const poll = async () => {
      request = new AbortController();
      try {
        const [nextStatus, frame] = await Promise.all([
          getFacePreviewStatus(request.signal),
          getFacePreviewFrame(request.signal),
        ]);
        if (stopped) return;
        setStatus(nextStatus);
        if (frame) {
          const nextUrl = URL.createObjectURL(frame);
          if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
          currentUrl.current = nextUrl;
          setFrameUrl(nextUrl);
        }
      } catch (error) {
        if (!stopped && !(error instanceof DOMException && error.name === "AbortError")) {
          setStatus((current) => ({
            ...current,
            message: "Esperando la imagen de la cámara…",
          }));
        }
      } finally {
        if (!stopped) timer = window.setTimeout(poll, 320);
      }
    };

    void poll();
    return () => {
      stopped = true;
      if (timer !== undefined) window.clearTimeout(timer);
      request?.abort();
      if (currentUrl.current) URL.revokeObjectURL(currentUrl.current);
    };
  }, []);

  const progress = Math.min(100, Math.round((status.samples / Math.max(1, status.required)) * 100));

  return (
    <div className="face-live-preview" aria-live="polite">
      {frameUrl ? (
        <img src={frameUrl} alt="Vista en vivo de la cámara durante el escaneo facial" />
      ) : (
        <div className="face-live-preview__waiting">
          <span className="face-live-preview__spinner" aria-hidden="true" />
          Conectando con la JOOAN…
        </div>
      )}
      <span className="face-live-preview__scan" aria-hidden="true" />
      <span className="face-live-preview__corner face-live-preview__corner--tl" aria-hidden="true" />
      <span className="face-live-preview__corner face-live-preview__corner--tr" aria-hidden="true" />
      <span className="face-live-preview__corner face-live-preview__corner--bl" aria-hidden="true" />
      <span className="face-live-preview__corner face-live-preview__corner--br" aria-hidden="true" />
      <div className="face-live-preview__top">
        <span><i aria-hidden="true" /> EN VIVO</span>
        <strong>{status.samples}/{status.required}</strong>
      </div>
      <div className="face-live-preview__footer">
        <strong>{status.faceDetected ? "Rostro detectado" : "Buscando rostro"}</strong>
        <span>{status.message}</span>
        <div className="face-live-preview__progress" aria-label={`${progress}% de muestras capturadas`}>
          <span style={{ width: `${progress}%` }} />
        </div>
      </div>
    </div>
  );
}
