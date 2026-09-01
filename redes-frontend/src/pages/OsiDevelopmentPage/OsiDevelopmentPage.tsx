import { ErrorState, LoadingState } from "../../components/Feedback/Feedback";
import { NetworkFlow } from "../../components/NetworkFlow/NetworkFlow";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { useApiResource } from "../../hooks/useApiResource";
import { getDevelopmentFlow } from "../../services/developmentFlowService";

export function OsiDevelopmentPage() {
  const { data: flow, isLoading, error, reload } = useApiResource(getDevelopmentFlow);

  return (
    <div className="page-container page-section">
      <PageHeader
        eyebrow="La arquitectura como laboratorio"
        title="OSI en desarrollo"
        description="Recorre una solicitud real desde el usuario hasta SQL Server y observa dónde participan las capas, los protocolos y los puertos."
      >
        <span className="live-badge"><span /> Flujo real del proyecto</span>
      </PageHeader>

      {isLoading ? <LoadingState label="Construyendo el flujo de la aplicación..." /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {!isLoading && !error && flow ? (
        <>
          <section className="flow-hero">
            <div>
              <span className="eyebrow">{flow.applicationName}</span>
              <h2>De un clic a una consulta SQL</h2>
              <p>{flow.description}</p>
            </div>
            <div className="flow-legend">
              <span><i className="legend-dot legend-dot--public" /> Público</span>
              <span><i className="legend-dot legend-dot--internal" /> Interno</span>
              <span><i className="legend-dot legend-dot--data" /> Datos</span>
            </div>
          </section>

          <section className="flow-section">
            <div className="section-title-row">
              <div><span>01</span><h2>Flujo cliente-servidor</h2></div>
              <p>Cada paso fue entregado por <code>GET /api/development-flow</code>.</p>
            </div>
            <NetworkFlow steps={flow.steps} />
          </section>

          <section className="flow-section">
            <div className="section-title-row">
              <div><span>02</span><h2>Participación del modelo OSI</h2></div>
              <p>El modelo es conceptual; una implementación TCP/IP no separa siempre estas funciones estrictamente.</p>
            </div>

            <div className="osi-participation-grid">
              {flow.osiLayers.map((layer) => (
                <article key={layer.layerNumber} className={`osi-participation layer-${layer.layerNumber}`}>
                  <span className="osi-participation__number">{layer.layerNumber}</span>
                  <div>
                    <span className="eyebrow">Capa {layer.layerNumber}</span>
                    <h3>{layer.layerName}</h3>
                    <p>{layer.participation}</p>
                    <small>{layer.clarification}</small>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="flow-section">
            <div className="section-title-row">
              <div><span>03</span><h2>Puertos de nuestra aplicación</h2></div>
              <p>Los puertos identifican servicios; no identifican por sí solos un equipo.</p>
            </div>

            <div className="project-ports-grid">
              {flow.ports.map((port) => (
                <article key={port.number} className="project-port-card">
                  <span className="project-port-card__number">:{port.number}</span>
                  <div>
                    <h3>{port.service}</h3>
                    <span className={`scope-badge scope-badge--${port.scope.toLowerCase().includes("público") ? "public" : "internal"}`}>
                      {port.scope}
                    </span>
                    <p>{port.purpose}</p>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="technical-notes">
            <div className="technical-notes__heading">
              <span aria-hidden="true">i</span>
              <div><span className="eyebrow">Precisión académica</span><h2>Conceptos que no conviene simplificar</h2></div>
            </div>
            <ul>
              {flow.technicalNotes.map((note) => <li key={note}>{note}</li>)}
            </ul>
          </aside>
        </>
      ) : null}
    </div>
  );
}

