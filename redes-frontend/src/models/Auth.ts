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

export interface PasswordLoginResponse {
  status: "AUTHENTICATED" | "FACE_REQUIRED";
  user?: AuthUser;
  message: string;
  expiresInSeconds?: number;
}

export interface FaceVerificationResponse {
  user: AuthUser;
  livenessVerified: boolean;
  message: string;
}

export interface FaceEnrollmentStatus {
  enrolled: boolean;
  livenessRequired: boolean;
  description: string;
}

export interface FaceEnrollmentResponse {
  enrolled: boolean;
  samples: number;
  livenessVerified: boolean;
  message: string;
}

export interface FacePreviewStatus {
  active: boolean;
  samples: number;
  required: number;
  faceDetected: boolean;
  livenessVerified: boolean;
  message: string;
}

export interface SurveillanceStatus {
  active: boolean;
  faceDetected: boolean;
  message: string;
}

export interface CsrfToken {
  token: string;
  headerName: string;
}
