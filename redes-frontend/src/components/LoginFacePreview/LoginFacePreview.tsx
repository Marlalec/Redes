import { useEffect, useRef, useState } from "react";
import type { FacePreviewStatus } from "../../models/Auth";
import { getErrorMessage } from "../../services/api";
import {
  getFaceChallengePreviewFrame,
  getFaceChallengePreviewStatus,
} from "../../services/authService";

const CONNECTING: FacePreviewStatus = {
  active: true,
  samples: 0,
  required: 8,
  faceDetected: false,
  livenessVerified: false,
  message: "Conectando con la cámara…",
};

interface LoginFacePreviewProps {
  isVerifying: boolean;
  onError: (message: string) => void;
}

export function LoginFacePreview({ isVerifying, onError }: LoginFacePreviewProps) {
  const [status, setStatus] = useState<FacePreviewStatus>(CONNECTING);
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
          getFaceChallengePreviewStatus(request.signal),
          getFaceChallengePreviewFrame(request.signal),
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
          onError(getErrorMessage(error));
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
      currentUrl.current = null;
    };
  }, [onError]);

  const progress = Math.min(
    100,
    Math.round((status.samples / Math.max(1, status.required)) * 100),
  );

  return (
    <div className="login-face-preview" aria-live="polite">
      {frameUrl ? (
        <img src={frameUrl} alt="Transmisión en vivo para verificar el rostro" />
      ) : (
        <div className="login-face-preview__waiting">
          <span className="face-live-preview__spinner" aria-hidden="true" />
          Abriendo la cámara JOOAN…
        </div>
      )}
      <span className="login-face-preview__scan" aria-hidden="true" />
      <div className="login-face-preview__top">
        <span><i aria-hidden="true" /> EN VIVO</span>
        <strong>{isVerifying ? `${status.samples}/${status.required}` : "JOOAN"}</strong>
      </div>
      <div className="login-face-preview__footer">
        <strong>{status.faceDetected ? "Rostro detectado" : "Ubícate frente a la cámara"}</strong>
        <span>{isVerifying ? status.message : "La imagen se procesa temporalmente y no se guarda."}</span>
        {isVerifying ? (
          <div className="login-face-preview__progress" aria-label={`${progress}% de verificación completada`}>
            <span style={{ width: `${progress}%` }} />
          </div>
        ) : null}
      </div>
    </div>
  );
}
