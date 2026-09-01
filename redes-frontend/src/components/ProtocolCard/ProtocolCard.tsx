import type { NetworkProtocol } from "../../models/Protocol";

interface ProtocolCardProps {
  protocol: NetworkProtocol;
  isSelected: boolean;
  onSelect: (protocol: NetworkProtocol) => void;
}

export function ProtocolCard({ protocol, isSelected, onSelect }: ProtocolCardProps) {
  return (
    <button
      type="button"
      className={`protocol-card${isSelected ? " protocol-card--selected" : ""}`}
      aria-pressed={isSelected}
      onClick={() => onSelect(protocol)}
    >
      <span className="protocol-card__topline">
        <span className="protocol-card__monogram" aria-hidden="true">
          {protocol.name.slice(0, 2).toUpperCase()}
        </span>
        <span className="badge badge--transport">{protocol.transportType}</span>
      </span>
      <strong>{protocol.name}</strong>
      <span>Capa {protocol.osiLayer.number} · {protocol.osiLayer.name}</span>
    </button>
  );
}

