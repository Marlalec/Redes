import type { OsiLayer } from "../../models/OsiLayer";

interface OsiLayerCardProps {
  layer: OsiLayer;
  isSelected: boolean;
  onSelect: (layer: OsiLayer) => void;
}

export function OsiLayerCard({ layer, isSelected, onSelect }: OsiLayerCardProps) {
  return (
    <button
      type="button"
      className={`osi-layer-card layer-${layer.layerNumber}${
        isSelected ? " osi-layer-card--selected" : ""
      }`}
      aria-pressed={isSelected}
      onClick={() => onSelect(layer)}
    >
      <span className="osi-layer-card__number">{layer.layerNumber}</span>
      <span className="osi-layer-card__copy">
        <strong>{layer.name}</strong>
        <small>Capa {layer.layerNumber}</small>
      </span>
      <span className="osi-layer-card__arrow" aria-hidden="true">
        →
      </span>
    </button>
  );
}

