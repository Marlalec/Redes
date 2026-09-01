import type { OsiLayer } from "../models/OsiLayer";
import { apiGet } from "./api";

export function getOsiLayers(signal?: AbortSignal): Promise<OsiLayer[]> {
  return apiGet<OsiLayer[]>("/osi-layers", signal);
}

export function getOsiLayerById(id: number, signal?: AbortSignal): Promise<OsiLayer> {
  return apiGet<OsiLayer>(`/osi-layers/${id}`, signal);
}

