import type { NetworkPort } from "../models/NetworkPort";
import { apiGet } from "./api";

export function getPorts(signal?: AbortSignal): Promise<NetworkPort[]> {
  return apiGet<NetworkPort[]>("/ports", signal);
}

export function getPortByNumber(
  portNumber: number,
  signal?: AbortSignal,
): Promise<NetworkPort> {
  return apiGet<NetworkPort>(`/ports/${portNumber}`, signal);
}

