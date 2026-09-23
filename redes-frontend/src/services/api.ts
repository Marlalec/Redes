interface ApiErrorPayload {
  status?: number;
  message?: string;
  error?: string;
}

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE_URL = (configuredBaseUrl || "/api").replace(/\/$/, "");
export const AUTH_UNAUTHORIZED_EVENT = "osi-auth-unauthorized";

export class ApiRequestError extends Error {
  readonly status: number;

  constructor(message: string, status = 0) {
    super(message);
    this.name = "ApiRequestError";
    this.status = status;
  }
}

function isApiErrorPayload(value: unknown): value is ApiErrorPayload {
  return typeof value === "object" && value !== null;
}

async function readResponseBody(response: Response): Promise<unknown> {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  const text = await response.text();
  return text || null;
}

interface ApiRequestOptions extends RequestInit {
  notifyOnUnauthorized?: boolean;
}

export async function apiRequest<T>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<T> {
  const { notifyOnUnauthorized = true, headers, ...requestOptions } = options;

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      credentials: "include",
      ...requestOptions,
      headers: {
        Accept: "application/json",
        ...headers,
      },
    });

    const body = await readResponseBody(response);

    if (!response.ok) {
      if (response.status === 401 && notifyOnUnauthorized) {
        window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
      }

      const message =
        isApiErrorPayload(body) && typeof body.message === "string"
          ? body.message
          : `La API respondió con el estado ${response.status}.`;

      throw new ApiRequestError(message, response.status);
    }

    return body as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw error;
    }

    if (error instanceof ApiRequestError) {
      throw error;
    }

    throw new ApiRequestError(
      "No fue posible comunicarse con la API. Verifica que Spring Boot esté ejecutándose en el puerto 8080.",
    );
  }
}

export function apiGet<T>(
  path: string,
  signal?: AbortSignal,
  notifyOnUnauthorized = true,
): Promise<T> {
  return apiRequest<T>(path, {
    method: "GET",
    signal,
    notifyOnUnauthorized,
  });
}

export function apiPost<T>(
  path: string,
  body: unknown,
  headers: HeadersInit = {},
  notifyOnUnauthorized = true,
): Promise<T> {
  return apiRequest<T>(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...headers,
    },
    body: body === undefined ? undefined : JSON.stringify(body),
    notifyOnUnauthorized,
  });
}

export function apiDelete<T>(
  path: string,
  headers: HeadersInit = {},
  notifyOnUnauthorized = true,
): Promise<T> {
  return apiRequest<T>(path, {
    method: "DELETE",
    headers,
    notifyOnUnauthorized,
  });
}

export async function apiBlob(
  path: string,
  signal?: AbortSignal,
): Promise<Blob | null> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "GET",
      credentials: "include",
      signal,
      headers: { Accept: "image/jpeg" },
      cache: "no-store",
    });

    if (response.status === 204) {
      return null;
    }
    if (!response.ok) {
      if (response.status === 401) {
        window.dispatchEvent(new Event(AUTH_UNAUTHORIZED_EVENT));
      }
      const body = await readResponseBody(response);
      const message =
        isApiErrorPayload(body) && typeof body.message === "string"
          ? body.message
          : `La API respondió con el estado ${response.status}.`;
      throw new ApiRequestError(message, response.status);
    }
    return response.blob();
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") throw error;
    if (error instanceof ApiRequestError) throw error;
    throw new ApiRequestError("No fue posible obtener la vista de la cámara.");
  }
}

export function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado al consultar la información.";
}
