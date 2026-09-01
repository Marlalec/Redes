import { useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "../../components/Feedback/Feedback";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { ProtocolCard } from "../../components/ProtocolCard/ProtocolCard";
import { SearchField } from "../../components/SearchField/SearchField";
import { useApiResource } from "../../hooks/useApiResource";
import type { NetworkPort } from "../../models/NetworkPort";
import type { NetworkProtocol } from "../../models/Protocol";
import { getPorts } from "../../services/portService";
import { getProtocols } from "../../services/protocolService";
import { normalizeText } from "../../utils/text";

interface ProtocolPageData {
  protocols: NetworkProtocol[];
  ports: NetworkPort[];
}

async function loadProtocolPageData(signal: AbortSignal): Promise<ProtocolPageData> {
  const [protocols, ports] = await Promise.all([
    getProtocols(signal),
    getPorts(signal),
  ]);

  return { protocols, ports };
}

export function ProtocolsPage() {
  const { data, isLoading, error, reload } = useApiResource(loadProtocolPageData);
  const [query, setQuery] = useState("");
  const [selectedProtocolId, setSelectedProtocolId] = useState<number | null>(null);
  const normalizedQuery = normalizeText(query.trim());

  const filteredProtocols = data?.protocols.filter((protocol) => {
    const searchableText = normalizeText(
      `${protocol.name} ${protocol.description} ${protocol.transportType} ${protocol.osiLayer.name}`,
    );
    return searchableText.includes(normalizedQuery);
  }) ?? [];

  const selectedProtocol =
    filteredProtocols.find((protocol) => protocol.id === selectedProtocolId) ?? filteredProtocols[0];

  const relatedPorts = selectedProtocol
    ? data?.ports.filter((port) => port.protocol.id === selectedProtocol.id) ?? []
    : [];

  return (
    <div className="page-container page-section">
      <PageHeader
        eyebrow="Comunicación entre sistemas"
        title="Protocolos de red"
        description="Busca y compara protocolos según su propósito, transporte, capa OSI y uso dentro de aplicaciones reales."
      />

      <div className="toolbar">
        <SearchField
          id="protocol-search"
          label="Buscar protocolos"
          placeholder="Ejemplo: HTTP, TCP, DNS..."
          value={query}
          onChange={setQuery}
        />
        <span className="result-count">
          <strong>{filteredProtocols.length}</strong> resultados
        </span>
      </div>

      {isLoading ? <LoadingState label="Consultando protocolos..." /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {!isLoading && !error && filteredProtocols.length ? (
        <div className="catalog-layout">
          <section className="protocol-grid" aria-label="Listado de protocolos">
            {filteredProtocols.map((protocol) => (
              <ProtocolCard
                key={protocol.id}
                protocol={protocol}
                isSelected={selectedProtocol?.id === protocol.id}
                onSelect={(item) => setSelectedProtocolId(item.id)}
              />
            ))}
          </section>

          {selectedProtocol ? (
            <article className="detail-panel catalog-detail">
              <div className="catalog-detail__heading">
                <span className="catalog-detail__monogram" aria-hidden="true">
                  {selectedProtocol.name.slice(0, 2).toUpperCase()}
                </span>
                <div>
                  <span className="eyebrow">Protocolo</span>
                  <h2>{selectedProtocol.name}</h2>
                </div>
              </div>

              <dl className="fact-grid">
                <div><dt>Capa OSI</dt><dd>{selectedProtocol.osiLayer.number} · {selectedProtocol.osiLayer.name}</dd></div>
                <div><dt>Transporte</dt><dd>{selectedProtocol.transportType}</dd></div>
              </dl>

              <div className="detail-section">
                <span className="detail-label">Descripción</span>
                <p>{selectedProtocol.description}</p>
              </div>

              <div className="detail-section">
                <span className="detail-label">Puertos relacionados</span>
                <div className="chip-list">
                  {relatedPorts.length ? relatedPorts.map((port) => (
                    <span key={port.id} className="data-chip">{port.port} · {port.service}</span>
                  )) : <span className="muted-text">No utiliza un puerto único en los datos del proyecto.</span>}
                </div>
              </div>

              <div className="development-example">
                <span className="development-example__icon" aria-hidden="true">&lt;/&gt;</span>
                <div>
                  <span className="detail-label">Ejemplo en desarrollo</span>
                  <p>{selectedProtocol.developmentExample}</p>
                </div>
              </div>
            </article>
          ) : null}
        </div>
      ) : null}

      {!isLoading && !error && !filteredProtocols.length ? (
        <EmptyState title="Sin coincidencias" description="Prueba con otro nombre, transporte o capa OSI." />
      ) : null}
    </div>
  );
}

