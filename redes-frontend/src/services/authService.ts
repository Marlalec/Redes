import type {
  AuthUser,
  CsrfToken,
  FaceEnrollmentResponse,
  FaceEnrollmentStatus,
  FacePreviewStatus,
  FaceVerificationResponse,
  LoginCredentials,
  PasswordLoginResponse,
  SurveillanceStatus,
} from "../models/Auth";
import { apiBlob, apiDelete, apiGet, apiPost } from "./api";

async function getCsrfToken(): Promise<CsrfToken> {
  return apiGet<CsrfToken>("/auth/csrf", undefined, false);
}

export function getCurrentSession(signal?: AbortSignal): Promise<AuthUser> {
  return apiGet<AuthUser>("/auth/session", signal, false);
}

export async function login(credentials: LoginCredentials): Promise<PasswordLoginResponse> {
  const csrf = await getCsrfToken();

  return apiPost<PasswordLoginResponse>(
    "/auth/login",
    credentials,
    { [csrf.headerName]: csrf.token },
    false,
  );
}

export async function verifyFace(): Promise<FaceVerificationResponse> {
  const csrf = await getCsrfToken();
  return apiPost<FaceVerificationResponse>(
    "/auth/face/verify",
    undefined,
    { [csrf.headerName]: csrf.token },
    false,
  );
}

export async function cancelFaceVerification(): Promise<void> {
  const csrf = await getCsrfToken();
  await apiPost<void>(
    "/auth/face/cancel",
    undefined,
    { [csrf.headerName]: csrf.token },
    false,
  );
}

export async function startFaceChallengePreview(): Promise<FacePreviewStatus> {
  const csrf = await getCsrfToken();
  return apiPost<FacePreviewStatus>(
    "/auth/face/challenge/preview/start",
    undefined,
    { [csrf.headerName]: csrf.token },
    false,
  );
}

export function getFaceChallengePreviewStatus(signal?: AbortSignal): Promise<FacePreviewStatus> {
  return apiGet<FacePreviewStatus>("/auth/face/challenge/preview/status", signal, false);
}

export function getFaceChallengePreviewFrame(signal?: AbortSignal): Promise<Blob | null> {
  return apiBlob("/auth/face/challenge/preview/frame", signal);
}

export async function stopFaceChallengePreview(): Promise<void> {
  const csrf = await getCsrfToken();
  await apiPost<void>(
    "/auth/face/challenge/preview/stop",
    undefined,
    { [csrf.headerName]: csrf.token },
    false,
  );
}

export function getFaceEnrollmentStatus(signal?: AbortSignal): Promise<FaceEnrollmentStatus> {
  return apiGet<FaceEnrollmentStatus>("/auth/face/status", signal);
}

export function getFacePreviewStatus(signal?: AbortSignal): Promise<FacePreviewStatus> {
  return apiGet<FacePreviewStatus>("/auth/face/preview/status", signal);
}

export function getFacePreviewFrame(signal?: AbortSignal): Promise<Blob | null> {
  return apiBlob("/auth/face/preview/frame", signal);
}

export function getSurveillanceStatus(signal?: AbortSignal): Promise<SurveillanceStatus> {
  return apiGet<SurveillanceStatus>("/auth/surveillance/status", signal);
}

export function getSurveillanceFrame(signal?: AbortSignal): Promise<Blob | null> {
  return apiBlob("/auth/surveillance/frame", signal);
}

export async function startSurveillance(): Promise<SurveillanceStatus> {
  const csrf = await getCsrfToken();
  return apiPost<SurveillanceStatus>(
    "/auth/surveillance/start",
    undefined,
    { [csrf.headerName]: csrf.token },
  );
}

export async function stopSurveillance(): Promise<void> {
  const csrf = await getCsrfToken();
  await apiPost<void>(
    "/auth/surveillance/stop",
    undefined,
    { [csrf.headerName]: csrf.token },
  );
}

export async function enrollFace(): Promise<FaceEnrollmentResponse> {
  const csrf = await getCsrfToken();
  return apiPost<FaceEnrollmentResponse>(
    "/auth/face/enrollment",
    { consent: true },
    { [csrf.headerName]: csrf.token },
  );
}

export async function deleteFaceEnrollment(): Promise<void> {
  const csrf = await getCsrfToken();
  await apiDelete<void>(
    "/auth/face/enrollment",
    { [csrf.headerName]: csrf.token },
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
