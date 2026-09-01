import { Link } from "react-router";
import { useApiResource } from "../../hooks/useApiResource";
import { getOsiLayers } from "../../services/osiService";
import { getPorts } from "../../services/portService";
import { getProtocols } from "../../services/protocolService";

interface HomeStats {
  layers: number;
  protocols: number;
  ports: number;
}

async function loadHomeStats(signal: AbortSignal): Promise<HomeStats> {
  const [layers, protocols, ports] = await Promise.all([
    getOsiLayers(signal),
    getProtocols(signal),
    getPorts(signal),
  ]);

  return {
    layers: layers.length,
    protocols: protocols.length,
    ports: ports.length,
  };
}

const learningAreas = [
  {
    number: "01",
    title: "Modelo OSI",
    description: "Explora las siete capas y su relación con el software.",
    to: "/modelo-osi",
    accent: "teal",
  },
  {
    number: "02",
    title: "Protocolos",
    description: "Compara HTTP, TCP, DNS, TLS y otros protocolos reales.",
    to: "/protocolos",
    accent: "blue",
  },
  {
    number: "03",
    title: "Puertos lógicos",
    description: "Descubre qué servicio escucha detrás de cada número.",
    to: "/puertos",
    accent: "violet",
  },
];

export function HomePage() {
  const { data: stats, isLoading, error, reload } = useApiResource(loadHomeStats);

  return (
    <>
      <section className="hero">
        <div className="page-container hero__grid">
          <div className="hero__copy">
            <span className="eyebrow eyebrow--light">Proyecto universitario de Redes</span>
            <h1>La red detrás del software, <span>visible.</span></h1>
            <p>
              Entiende cómo React, HTTP, TCP, Spring Boot y SQL Server colaboran
              para responder una solicitud real.
            </p>
            <div className="hero__actions">
              <Link className="button button--primary" to="/osi-en-desarrollo">
                Ver la aplicación en acción
                <span aria-hidden="true">→</span>
              </Link>
              <Link className="button button--ghost" to="/modelo-osi">
                Explorar modelo OSI
              </Link>
            </div>
          </div>

          <div className="architecture-card" aria-label="Arquitectura resumida del proyecto">
            <div className="architecture-card__status">
              <span /> Arquitectura cliente-servidor
            </div>
            <div className="architecture-tier">
              <span className="architecture-tier__index">01</span>
              <div>
                <strong>React Frontend</strong>
                <small>Interfaz en el navegador</small>
              </div>
              <span className="architecture-tier__tag">HTTP :80</span>
            </div>
            <div className="architecture-connector"><span>REST · JSON</span></div>
            <div className="architecture-tier">
              <span className="architecture-tier__index">02</span>
              <div>
                <strong>Spring Boot API</strong>
                <small>Casos de uso y puertos hexagonales</small>
              </div>
              <span className="architecture-tier__tag">TCP :8080</span>
            </div>
            <div className="architecture-connector"><span>JDBC · TDS</span></div>
            <div className="architecture-tier">
              <span className="architecture-tier__index">03</span>
              <div>
                <strong>SQL Server</strong>
                <small>Datos educativos de RedesDB</small>
              </div>
              <span className="architecture-tier__tag">TCP :1433</span>
            </div>
          </div>
        </div>
      </section>

      <section className="api-strip" aria-label="Datos disponibles en la API">
        <div className="page-container api-strip__inner">
          <div className="api-strip__label">
            <span className={error ? "status-dot status-dot--error" : "status-dot"} />
            <span>
              <strong>{error ? "API no disponible" : "API conectada"}</strong>
              <small>Datos consultados desde Spring Boot</small>
            </span>
          </div>
          <div className="api-stats">
            <div><strong>{isLoading ? "—" : (stats?.layers ?? 0)}</strong><span>Capas OSI</span></div>
            <div><strong>{isLoading ? "—" : (stats?.protocols ?? 0)}</strong><span>Protocolos</span></div>
            <div><strong>{isLoading ? "—" : (stats?.ports ?? 0)}</strong><span>Puertos</span></div>
          </div>
          {error ? (
            <button className="text-button" type="button" onClick={reload}>Reintentar</button>
          ) : null}
        </div>
      </section>

      <section className="section page-container">
        <div className="section-heading">
          <div>
            <span className="eyebrow">Explora por concepto</span>
            <h2>Redes explicadas desde el desarrollo</h2>
          </div>
          <p>Cada módulo consume información real desde la API; React nunca consulta SQL Server directamente.</p>
        </div>

        <div className="learning-grid">
          {learningAreas.map((area) => (
            <Link key={area.to} to={area.to} className={`learning-card learning-card--${area.accent}`}>
              <span className="learning-card__number">{area.number}</span>
              <div>
                <h3>{area.title}</h3>
                <p>{area.description}</p>
              </div>
              <span className="learning-card__arrow" aria-hidden="true">↗</span>
            </Link>
          ))}
        </div>
      </section>

      <section className="self-explaining-section">
        <div className="page-container self-explaining-section__grid">
          <div>
            <span className="eyebrow">Una demostración real</span>
            <h2>La aplicación se explica a sí misma</h2>
            <p>
              Cada consulta recorre una arquitectura cliente-servidor completa y permite
              identificar protocolos, puertos y capas OSI durante la exposición.
            </p>
            <Link className="inline-link" to="/osi-en-desarrollo">
              Recorrer el flujo completo <span aria-hidden="true">→</span>
            </Link>
          </div>
          <ol className="request-summary">
            <li><span>1</span><div><strong>Solicitud</strong><small>El navegador llama a /api</small></div></li>
            <li><span>2</span><div><strong>Procesamiento</strong><small>Spring Boot ejecuta el caso de uso</small></div></li>
            <li><span>3</span><div><strong>Datos</strong><small>JDBC consulta RedesDB por TCP</small></div></li>
            <li><span>4</span><div><strong>Respuesta</strong><small>React representa el JSON recibido</small></div></li>
          </ol>
        </div>
      </section>
    </>
  );
}

