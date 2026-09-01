import { Link } from "react-router";

export function NotFoundPage() {
  return (
    <div className="page-container not-found">
      <span>404</span>
      <h1>Esta ruta no existe</h1>
      <p>Regresa al inicio para continuar explorando la arquitectura de red.</p>
      <Link className="button button--primary" to="/">Volver al inicio</Link>
    </div>
  );
}

