import type { NetworkProtocol } from "../models/Protocol";
import { apiGet } from "./api";

export function getProtocols(signal?: AbortSignal): Promise<NetworkProtocol[]> {
  return apiGet<NetworkProtocol[]>("/protocols", signal);
}

export function getProtocolById(
  id: number,
  signal?: AbortSignal,
): Promise<NetworkProtocol> {
  return apiGet<NetworkProtocol>(`/protocols/${id}`, signal);
}

