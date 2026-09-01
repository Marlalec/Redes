import { useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "../../components/Feedback/Feedback";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { PortTable } from "../../components/PortTable/PortTable";
import { SearchField } from "../../components/SearchField/SearchField";
import { useApiResource } from "../../hooks/useApiResource";
import type { NetworkPort } from "../../models/NetworkPort";
import { getPorts } from "../../services/portService";
import { normalizeText } from "../../utils/text";

export function PortsPage() {
  const { data: ports, isLoading, error, reload } = useApiResource(getPorts);
  const [query, setQuery] = useState("");
  const [selectedPortNumber, setSelectedPortNumber] = useState<number | null>(null);
  const normalizedQuery = normalizeText(query.trim());

  const filteredPorts = ports?.filter((port) => {
    const searchableText = normalizeText(
      `${port.port} ${port.service} ${port.transportProtocol} ${port.protocol.name} ${port.description}`,
    );
    return searchableText.includes(normalizedQuery);
  }) ?? [];

  const selectedPort =
    filteredPorts.find((port) => port.port === selectedPortNumber) ?? filteredPorts[0];

  const handleSelect = (port: NetworkPort) => setSelectedPortNumber(port.port);

  return (
    <div className="page-container page-section">
      <PageHeader
        eyebrow="Identificadores de servicios"
        title="Puertos lógicos"
        description="Consulta qué servicio utiliza cada puerto, sobre qué transporte se comunica y dónde aparece dentro del proyecto."
      >
        <div className="port-range">
          <span>Rango válido</span>
          <strong>1 — 65.535</strong>
        </div>
      </PageHeader>

      <div className="toolbar">
        <SearchField
          id="port-search"
          label="Buscar puertos"
          placeholder="Puerto, servicio o protocolo..."
          value={query}
          onChange={setQuery}
        />
        <span className="result-count"><strong>{filteredPorts.length}</strong> resultados</span>
      </div>

      {isLoading ? <LoadingState label="Consultando puertos lógicos..." /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {!isLoading && !error && filteredPorts.length ? (
        <div className="ports-layout">
          <PortTable
            ports={filteredPorts}
            selectedPort={selectedPort?.port}
            onSelect={handleSelect}
          />

          {selectedPort ? (
            <article className="port-detail">
              <div className="port-detail__number">
                <span>Puerto</span>
                <strong>{selectedPort.port}</strong>
              </div>
              <div className="port-detail__content">
                <div className="port-detail__heading">
                  <div>
                    <span className="eyebrow">Servicio seleccionado</span>
                    <h2>{selectedPort.service}</h2>
                  </div>
                  <span className="badge badge--transport">{selectedPort.transportProtocol}</span>
                </div>

                <dl className="fact-grid">
                  <div><dt>Protocolo</dt><dd>{selectedPort.protocol.name}</dd></div>
                  <div><dt>Capa OSI</dt><dd>{selectedPort.osiLayer.number} · {selectedPort.osiLayer.name}</dd></div>
                </dl>

                <div className="detail-section">
                  <span className="detail-label">Uso</span>
                  <p>{selectedPort.description}</p>
                </div>

                <div className="development-example">
                  <span className="development-example__icon" aria-hidden="true">&lt;/&gt;</span>
                  <div>
                    <span className="detail-label">Dentro del software</span>
                    <p>{selectedPort.developmentExample}</p>
                  </div>
                </div>
              </div>
            </article>
          ) : null}
        </div>
      ) : null}

      {!isLoading && !error && !filteredPorts.length ? (
        <EmptyState title="Sin coincidencias" description="Busca por valores como 443, HTTPS, TCP o SQL Server." />
      ) : null}
    </div>
  );
}

