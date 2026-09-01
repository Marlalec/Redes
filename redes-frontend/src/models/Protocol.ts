import type { OsiLayerSummary } from "./OsiLayer";

export interface NetworkProtocol {
  id: number;
  name: string;
  description: string;
  transportType: string;
  osiLayer: OsiLayerSummary;
  developmentExample: string;
}

export interface ProtocolSummary {
  id: number;
  name: string;
}

