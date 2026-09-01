interface ApiErrorPayload {
  status?: number;
  message?: string;
  error?: string;
}

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim();

export const API_BASE_URL = (configuredBaseUrl || "/api").replace(/\/$/, "");

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

export async function apiGet<T>(path: string, signal?: AbortSignal): Promise<T> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      signal,
    });

    const body = await readResponseBody(response);

    if (!response.ok) {
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

export function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : "Ocurrió un error inesperado al consultar la información.";
}

