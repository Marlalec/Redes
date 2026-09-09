import { Fragment, type ReactNode } from "react";
import type { NetworkPort } from "../../models/NetworkPort";

interface PortTableProps {
  ports: NetworkPort[];
  selectedPort?: number;
  onSelect: (port: NetworkPort) => void;
  renderDetail: (port: NetworkPort) => ReactNode;
}

export function PortTable({ ports, selectedPort, onSelect, renderDetail }: PortTableProps) {
  return (
    <div className="table-shell">
      <table className="port-table">
        <thead>
          <tr>
            <th>Puerto</th>
            <th>Servicio</th>
            <th>Transporte</th>
            <th>Protocolo</th>
            <th>Uso</th>
          </tr>
        </thead>
        <tbody>
          {ports.map((port) => {
            const isSelected = selectedPort === port.port;
            const detailId = `port-detail-${port.port}`;

            return (
              <Fragment key={port.id}>
                <tr
                  className={isSelected ? "is-selected port-data-row" : "port-data-row"}
                  onClick={() => onSelect(port)}
                >
                  <td>
                    <button
                      type="button"
                      className="port-number"
                      aria-expanded={isSelected}
                      aria-controls={detailId}
                    >
                      {port.port}
                    </button>
                  </td>
                  <td><strong>{port.service}</strong></td>
                  <td><span className="badge badge--transport">{port.transportProtocol}</span></td>
                  <td>{port.protocol.name}</td>
                  <td>{port.description}</td>
                </tr>

                {isSelected ? (
                  <tr className="port-detail-row">
                    <td colSpan={5}>{renderDetail(port)}</td>
                  </tr>
                ) : null}
              </Fragment>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
