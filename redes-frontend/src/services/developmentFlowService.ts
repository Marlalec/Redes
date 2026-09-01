import type { DevelopmentFlow } from "../models/DevelopmentFlow";
import { apiGet } from "./api";

export function getDevelopmentFlow(signal?: AbortSignal): Promise<DevelopmentFlow> {
  return apiGet<DevelopmentFlow>("/development-flow", signal);
}

