import { useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "../../components/Feedback/Feedback";
import { OsiLayerCard } from "../../components/OsiLayerCard/OsiLayerCard";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { useApiResource } from "../../hooks/useApiResource";
import type { OsiLayer } from "../../models/OsiLayer";
import type { NetworkProtocol } from "../../models/Protocol";
import { getOsiLayers } from "../../services/osiService";
import { getProtocols } from "../../services/protocolService";

interface OsiPageData {
  layers: OsiLayer[];
  protocols: NetworkProtocol[];
}

async function loadOsiPageData(signal: AbortSignal): Promise<OsiPageData> {
  const [layers, protocols] = await Promise.all([
    getOsiLayers(signal),
    getProtocols(signal),
  ]);

  return { layers, protocols };
}

export function OsiPage() {
  const { data, isLoading, error, reload } = useApiResource(loadOsiPageData);
  const [selectedLayerId, setSelectedLayerId] = useState<number | null>(null);

  const selectedLayer =
    data?.layers.find((layer) => layer.id === selectedLayerId) ?? data?.layers[0];

  const relatedProtocols = selectedLayer
    ? data?.protocols.filter((protocol) => protocol.osiLayer.id === selectedLayer.id) ?? []
    : [];

  return (
    <div className="page-container page-section">
      <PageHeader
        eyebrow="Las siete capas"
        title="Modelo OSI"
        description="Selecciona una capa para entender su función, los protocolos relacionados y cómo aparece dentro del desarrollo de software."
      >
        <div className="header-metric">
          <strong>7</strong>
          <span>capas conceptuales</span>
        </div>
      </PageHeader>

      {isLoading ? <LoadingState label="Consultando las capas OSI..." /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {!isLoading && !error && data?.layers.length ? (
        <div className="osi-explorer">
          <section className="osi-stack" aria-label="Capas del modelo OSI">
            <div className="osi-stack__direction">
              <span>Datos de aplicación</span>
              <span aria-hidden="true">↓</span>
              <span>Señal física</span>
            </div>
            {data.layers.map((layer) => (
              <OsiLayerCard
                key={layer.id}
                layer={layer}
                isSelected={selectedLayer?.id === layer.id}
                onSelect={(item) => setSelectedLayerId(item.id)}
              />
            ))}
          </section>

          {selectedLayer ? (
            <article className={`detail-panel detail-panel--layer layer-${selectedLayer.layerNumber}`}>
              <div className="detail-panel__heading">
                <span className="large-layer-number">{selectedLayer.layerNumber}</span>
                <div>
                  <span className="eyebrow">Capa {selectedLayer.layerNumber}</span>
                  <h2>{selectedLayer.name}</h2>
                </div>
              </div>

              <div className="detail-section">
                <span className="detail-label">Función principal</span>
                <p>{selectedLayer.description}</p>
              </div>

              <div className="detail-section">
                <span className="detail-label">Protocolos relacionados</span>
                <div className="chip-list">
                  {relatedProtocols.length ? relatedProtocols.map((protocol) => (
                    <span key={protocol.id} className="data-chip">{protocol.name}</span>
                  )) : <span className="muted-text">No hay protocolos asociados en este alcance.</span>}
                </div>
              </div>

              <div className="development-example">
                <span className="development-example__icon" aria-hidden="true">&lt;/&gt;</span>
                <div>
                  <span className="detail-label">Aplicado al desarrollo</span>
                  <p>{selectedLayer.developmentExample}</p>
                </div>
              </div>
            </article>
          ) : null}
        </div>
      ) : null}

      {!isLoading && !error && !data?.layers.length ? (
        <EmptyState title="No hay capas disponibles" description="RedesDB no devolvió registros de OSI_LAYER." />
      ) : null}
    </div>
  );
}

