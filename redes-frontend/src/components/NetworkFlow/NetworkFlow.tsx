import type { DevelopmentStep } from "../../models/DevelopmentFlow";

interface NetworkFlowProps {
  steps: DevelopmentStep[];
}

export function NetworkFlow({ steps }: NetworkFlowProps) {
  return (
    <ol className="network-flow" aria-label="Flujo de comunicación de la aplicación">
      {steps.map((step) => (
        <li key={step.order} className="network-flow__step">
          <div className="network-flow__rail" aria-hidden="true">
            <span>{step.order}</span>
          </div>
          <article className="network-flow__card">
            <div className="network-flow__heading">
              <h3>{step.component}</h3>
              {step.port ? <span className="port-chip">:{step.port}</span> : null}
            </div>
            <p>{step.description}</p>
            <span className="communication-chip">{step.communication}</span>
          </article>
        </li>
      ))}
    </ol>
  );
}

