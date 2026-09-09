import { useEffect, useState, type CSSProperties } from "react";
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

function getProtocolColumnCount(): number {
  if (typeof window === "undefined") return 5;
  if (window.innerWidth <= 650) return 1;
  if (window.innerWidth <= 860) return 3;
  if (window.innerWidth <= 1200) return 4;
  return 5;
}

export function ProtocolsPage() {
  const { data, isLoading, error, reload } = useApiResource(loadProtocolPageData);
  const [query, setQuery] = useState("");
  const [selectedProtocolId, setSelectedProtocolId] = useState<number | null>(null);
  const [columnCount, setColumnCount] = useState(getProtocolColumnCount);
  const normalizedQuery = normalizeText(query.trim());

  useEffect(() => {
    const updateColumnCount = () => setColumnCount(getProtocolColumnCount());
    window.addEventListener("resize", updateColumnCount);
    return () => window.removeEventListener("resize", updateColumnCount);
  }, []);

  const filteredProtocols = data?.protocols.filter((protocol) =>
    normalizeText(protocol.name).includes(normalizedQuery),
  ) ?? [];

  const selectedProtocol =
    filteredProtocols.find((protocol) => protocol.id === selectedProtocolId) ?? null;

  const protocolRows: NetworkProtocol[][] = [];
  for (let index = 0; index < filteredProtocols.length; index += columnCount) {
    protocolRows.push(filteredProtocols.slice(index, index + columnCount));
  }

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
        <div className="protocol-rows" aria-label="Listado de protocolos">
          {protocolRows.map((row) => {
            const expandedProtocol = row.find(
              (protocol) => protocol.id === selectedProtocol?.id,
            );
            const selectedColumn = expandedProtocol
              ? row.findIndex((protocol) => protocol.id === expandedProtocol.id)
              : -1;
            const relatedPorts = expandedProtocol
              ? data?.ports.filter((port) => port.protocol.id === expandedProtocol.id) ?? []
              : [];
            const detailStyle = expandedProtocol
              ? ({
                  "--detail-pointer-left": `${((selectedColumn + 0.5) / columnCount) * 100}%`,
                } as CSSProperties)
              : undefined;

            return (
              <section className="protocol-row" key={row.map((protocol) => protocol.id).join("-")}>
                <div className="protocol-grid">
                  {row.map((protocol) => {
                    const isSelected = selectedProtocol?.id === protocol.id;

                    return (
                      <ProtocolCard
                        key={protocol.id}
                        protocol={protocol}
                        isSelected={isSelected}
                        onSelect={(item) => setSelectedProtocolId((current) =>
                          current === item.id ? null : item.id
                        )}
                      />
                    );
                  })}
                </div>

                {expandedProtocol ? (
                  <article className="protocol-row-detail" style={detailStyle}>
                    <div className="protocol-row-detail__heading">
                      <span className="protocol-row-detail__monogram" aria-hidden="true">
                        {expandedProtocol.name.slice(0, 2).toUpperCase()}
                      </span>
                      <div>
                        <span className="eyebrow">Protocolo seleccionado</span>
                        <h2>{expandedProtocol.name}</h2>
                      </div>

                      <dl className="fact-grid protocol-row-detail__facts">
                        <div><dt>Capa OSI</dt><dd>{expandedProtocol.osiLayer.number} · {expandedProtocol.osiLayer.name}</dd></div>
                        <div><dt>Transporte</dt><dd>{expandedProtocol.transportType}</dd></div>
                      </dl>
                    </div>

                    <div className="protocol-row-detail__content">
                      <div className="detail-section protocol-row-detail__section">
                        <span className="detail-label">Descripción</span>
                        <p>{expandedProtocol.description}</p>
                      </div>

                      <div className="detail-section protocol-row-detail__section">
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
                          <p>{expandedProtocol.developmentExample}</p>
                        </div>
                      </div>
                    </div>
                  </article>
                ) : null}
              </section>
            );
          })}
        </div>
      ) : null}

      {!isLoading && !error && !filteredProtocols.length ? (
        <EmptyState title="Sin coincidencias" description="Prueba con otro nombre de protocolo." />
      ) : null}
    </div>
  );
}
