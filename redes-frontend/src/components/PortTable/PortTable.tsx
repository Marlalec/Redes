import type { NetworkPort } from "../../models/NetworkPort";

interface PortTableProps {
  ports: NetworkPort[];
  selectedPort?: number;
  onSelect: (port: NetworkPort) => void;
}

export function PortTable({ ports, selectedPort, onSelect }: PortTableProps) {
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
          {ports.map((port) => (
            <tr key={port.id} className={selectedPort === port.port ? "is-selected" : undefined}>
              <td>
                <button type="button" className="port-number" onClick={() => onSelect(port)}>
                  {port.port}
                </button>
              </td>
              <td><strong>{port.service}</strong></td>
              <td><span className="badge badge--transport">{port.transportProtocol}</span></td>
              <td>{port.protocol.name}</td>
              <td>{port.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

