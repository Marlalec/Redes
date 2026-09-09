export interface AuthUser {
  id: number;
  email: string;
  displayName: string;
  role: "ADMIN" | "STUDENT";
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CsrfToken {
  token: string;
  headerName: string;
}
