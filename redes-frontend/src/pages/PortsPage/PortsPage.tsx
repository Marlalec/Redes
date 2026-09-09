import { useEffect, useRef, useState } from "react";
import { EmptyState, ErrorState, LoadingState } from "../../components/Feedback/Feedback";
import { PageHeader } from "../../components/PageHeader/PageHeader";
import { PortTable } from "../../components/PortTable/PortTable";
import { SearchField } from "../../components/SearchField/SearchField";
import { useApiResource } from "../../hooks/useApiResource";
import type { NetworkPort } from "../../models/NetworkPort";
import { getPorts } from "../../services/portService";
import { normalizeText } from "../../utils/text";

const PORTS_PER_PAGE = 5;

export function PortsPage() {
  const { data: ports, isLoading, error, reload } = useApiResource(getPorts);
  const [query, setQuery] = useState("");
  const [selectedPortNumber, setSelectedPortNumber] = useState<number | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const detailPanelRef = useRef<HTMLElement>(null);
  const portsLayoutRef = useRef<HTMLDivElement>(null);
  const normalizedQuery = normalizeText(query.trim());

  const filteredPorts = ports?.filter((port) =>
    normalizeText(port.service).includes(normalizedQuery),
  ) ?? [];

  const selectedPort =
    filteredPorts.find((port) => port.port === selectedPortNumber) ?? null;

  const totalPages = Math.max(1, Math.ceil(filteredPorts.length / PORTS_PER_PAGE));
  const firstVisiblePort = (currentPage - 1) * PORTS_PER_PAGE;
  const visiblePorts = filteredPorts.slice(
    firstVisiblePort,
    firstVisiblePort + PORTS_PER_PAGE,
  );

  useEffect(() => {
    if (!selectedPort) return;

    const animationFrame = window.requestAnimationFrame(() => {
      detailPanelRef.current?.focus({ preventScroll: true });
      detailPanelRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });

    return () => window.cancelAnimationFrame(animationFrame);
  }, [selectedPort]);

  const handleSelect = (port: NetworkPort) => {
    setSelectedPortNumber((current) => current === port.port ? null : port.port);
  };

  const handleQueryChange = (value: string) => {
    setQuery(value);
    setCurrentPage(1);
    setSelectedPortNumber(null);
  };

  const handlePageChange = (page: number) => {
    if (page < 1 || page > totalPages || page === currentPage) return;

    setCurrentPage(page);
    setSelectedPortNumber(null);

    window.requestAnimationFrame(() => {
      portsLayoutRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });
  };

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
          placeholder="Ejemplo: HTTP, DNS, SQL Server..."
          value={query}
          onChange={handleQueryChange}
        />
        <span className="result-count" aria-live="polite">
          <strong>{filteredPorts.length}</strong> resultados
          {totalPages > 1 ? ` · Página ${currentPage} de ${totalPages}` : null}
        </span>
      </div>

      {isLoading ? <LoadingState label="Consultando puertos lógicos..." /> : null}
      {error ? <ErrorState message={error} onRetry={reload} /> : null}

      {!isLoading && !error && filteredPorts.length ? (
        <div className="ports-layout" ref={portsLayoutRef}>
          <PortTable
            ports={visiblePorts}
            selectedPort={selectedPort?.port}
            onSelect={handleSelect}
            renderDetail={(port) => (
              <article
                ref={detailPanelRef}
                id={`port-detail-${port.port}`}
                className="port-detail port-detail--inline"
                tabIndex={-1}
                aria-labelledby={`port-detail-title-${port.port}`}
              >
                <div className="port-detail__number">
                  <span>Puerto</span>
                  <strong>{port.port}</strong>
                </div>
                <div className="port-detail__content">
                  <div className="port-detail__heading">
                    <div>
                      <span className="eyebrow">Servicio seleccionado</span>
                      <h2 id={`port-detail-title-${port.port}`}>{port.service}</h2>
                    </div>
                    <span className="badge badge--transport">{port.transportProtocol}</span>
                  </div>

                  <dl className="fact-grid">
                    <div><dt>Protocolo</dt><dd>{port.protocol.name}</dd></div>
                    <div><dt>Capa OSI</dt><dd>{port.osiLayer.number} · {port.osiLayer.name}</dd></div>
                  </dl>

                  <div className="detail-section">
                    <span className="detail-label">Uso</span>
                    <p>{port.description}</p>
                  </div>

                  <div className="development-example">
                    <span className="development-example__icon" aria-hidden="true">&lt;/&gt;</span>
                    <div>
                      <span className="detail-label">Dentro del software</span>
                      <p>{port.developmentExample}</p>
                    </div>
                  </div>
                </div>
              </article>
            )}
          />

          {totalPages > 1 ? (
            <nav className="pagination" aria-label="Paginación de puertos">
              <button
                type="button"
                className="pagination__button"
                disabled={currentPage === 1}
                onClick={() => handlePageChange(currentPage - 1)}
              >
                Anterior
              </button>

              <div className="pagination__pages">
                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button
                    type="button"
                    key={page}
                    className={
                      page === currentPage
                        ? "pagination__button pagination__button--active"
                        : "pagination__button"
                    }
                    aria-label={`Ir a la página ${page}`}
                    aria-current={page === currentPage ? "page" : undefined}
                    onClick={() => handlePageChange(page)}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                type="button"
                className="pagination__button"
                disabled={currentPage === totalPages}
                onClick={() => handlePageChange(currentPage + 1)}
              >
                Siguiente
              </button>
            </nav>
          ) : null}
        </div>
      ) : null}

      {!isLoading && !error && !filteredPorts.length ? (
        <EmptyState title="Sin coincidencias" description="Prueba con otro nombre de servicio." />
      ) : null}
    </div>
  );
}
