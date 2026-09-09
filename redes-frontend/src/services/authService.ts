import type { AuthUser, CsrfToken, LoginCredentials } from "../models/Auth";
import { apiGet, apiPost } from "./api";

async function getCsrfToken(): Promise<CsrfToken> {
  return apiGet<CsrfToken>("/auth/csrf", undefined, false);
}

export function getCurrentSession(signal?: AbortSignal): Promise<AuthUser> {
  return apiGet<AuthUser>("/auth/session", signal, false);
}

export async function login(credentials: LoginCredentials): Promise<AuthUser> {
  const csrf = await getCsrfToken();

  return apiPost<AuthUser>(
    "/auth/login",
    credentials,
    { [csrf.headerName]: csrf.token },
    false,
  );
}

export async function logout(): Promise<void> {
  const csrf = await getCsrfToken();

  await apiPost<void>(
    "/auth/logout",
    undefined,
    { [csrf.headerName]: csrf.token },
    false,
  );
}
