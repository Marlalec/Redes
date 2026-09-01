export interface DevelopmentStep {
  order: number;
  component: string;
  description: string;
  communication: string;
  port?: number;
}

export interface OsiParticipation {
  layerNumber: number;
  layerName: string;
  participation: string;
  clarification: string;
}

export interface LogicalPort {
  number: number;
  service: string;
  scope: string;
  purpose: string;
}

export interface DevelopmentFlow {
  applicationName: string;
  description: string;
  steps: DevelopmentStep[];
  osiLayers: OsiParticipation[];
  ports: LogicalPort[];
  technicalNotes: string[];
}

