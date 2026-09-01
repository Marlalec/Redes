import type { OsiLayerSummary } from "./OsiLayer";
import type { ProtocolSummary } from "./Protocol";

export interface NetworkPort {
  id: number;
  port: number;
  service: string;
  transportProtocol: string;
  osiLayer: OsiLayerSummary;
  description: string;
  protocol: ProtocolSummary;
  developmentExample: string;
}

