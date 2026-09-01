interface LoadingStateProps {
  label?: string;
}

interface ErrorStateProps {
  message: string;
  onRetry: () => void;
}

interface EmptyStateProps {
  title: string;
  description: string;
}

export function LoadingState({ label = "Consultando la API..." }: LoadingStateProps) {
  return (
    <div className="loading-state" role="status" aria-live="polite">
      <div className="loading-state__spinner" aria-hidden="true" />
      <div>
        <strong>{label}</strong>
        <p>Spring Boot está consultando RedesDB.</p>
      </div>
    </div>
  );
}

export function ErrorState({ message, onRetry }: ErrorStateProps) {
  return (
    <div className="error-state" role="alert">
      <span className="error-state__icon" aria-hidden="true">
        !
      </span>
      <div>
        <strong>No pudimos cargar la información</strong>
        <p>{message}</p>
        <button className="button button--small" type="button" onClick={onRetry}>
          Reintentar
        </button>
      </div>
    </div>
  );
}

export function EmptyState({ title, description }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <span aria-hidden="true">⌕</span>
      <strong>{title}</strong>
      <p>{description}</p>
    </div>
  );
}

