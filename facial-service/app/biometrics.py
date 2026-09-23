from __future__ import annotations

import os
import threading
import time
from dataclasses import dataclass

os.environ.setdefault("OPENCV_FFMPEG_CAPTURE_OPTIONS", "rtsp_transport;tcp")

import cv2
import numpy as np

from .config import Settings
from .errors import CameraUnavailableError, CaptureQualityError, LivenessError
from .storage import _normalize_embedding


@dataclass(frozen=True)
class CaptureResult:
    embeddings: list[np.ndarray]
    liveness_verified: bool


@dataclass(frozen=True)
class VerificationResult:
    matched: bool
    score: float
    liveness_verified: bool


@dataclass(frozen=True)
class PreviewStatus:
    active: bool
    samples: int
    required: int
    face_detected: bool
    liveness_verified: bool
    message: str


@dataclass(frozen=True)
class SurveillanceStatus:
    active: bool
    face_detected: bool
    message: str


class FaceEngine:
    MODEL_VERSION = "sface-2021dec"

    def __init__(self, settings: Settings) -> None:
        self._settings = settings
        self._detector = cv2.FaceDetectorYN.create(
            str(settings.detection_model),
            "",
            (320, 320),
            settings.detection_threshold,
            0.30,
            5000,
        )
        self._recognizer = cv2.FaceRecognizerSF.create(
            str(settings.recognition_model),
            "",
        )
        self._camera_lock = threading.Lock()
        self._preview_lock = threading.Lock()
        self._preview_frame: bytes | None = None
        self._preview_subject_id: str | None = None
        self._preview_status = PreviewStatus(
            active=False,
            samples=0,
            required=settings.required_samples,
            face_detected=False,
            liveness_verified=False,
            message="La cámara está lista",
        )
        self._preview_clear_timer: threading.Timer | None = None
        self._surveillance_lock = threading.Lock()
        self._surveillance_subject_id: str | None = None
        self._surveillance_frame: bytes | None = None
        self._surveillance_status = SurveillanceStatus(False, False, "Vigilancia detenida")
        self._surveillance_stop = threading.Event()
        self._surveillance_last_access = 0.0

    def preview_status(self, subject_id: str) -> PreviewStatus:
        with self._preview_lock:
            if self._preview_subject_id != subject_id:
                return PreviewStatus(
                    active=False,
                    samples=0,
                    required=self._settings.required_samples,
                    face_detected=False,
                    liveness_verified=False,
                    message="Esperando el inicio de la captura",
                )
            return self._preview_status

    def preview_frame(self, subject_id: str) -> bytes | None:
        with self._preview_lock:
            if self._preview_subject_id != subject_id:
                return None
            return self._preview_frame

    def start_surveillance(self, subject_id: str) -> SurveillanceStatus:
        with self._surveillance_lock:
            if self._surveillance_status.active:
                if self._surveillance_subject_id != subject_id:
                    raise CameraUnavailableError("La cámara está siendo utilizada por otro usuario")
                self._surveillance_last_access = time.monotonic()
                return self._surveillance_status

        if not self._camera_lock.acquire(timeout=1.0):
            raise CameraUnavailableError(
                "La cámara está atendiendo una captura facial; inténtalo nuevamente"
            )

        with self._surveillance_lock:
            self._surveillance_subject_id = subject_id
            self._surveillance_frame = None
            self._surveillance_status = SurveillanceStatus(
                True,
                False,
                "Conectando con la cámara…",
            )
            self._surveillance_last_access = time.monotonic()
            self._surveillance_stop.clear()

        worker = threading.Thread(
            target=self._run_surveillance,
            args=(subject_id,),
            daemon=True,
            name="jooan-surveillance",
        )
        worker.start()
        return self.surveillance_status(subject_id)

    def surveillance_status(self, subject_id: str) -> SurveillanceStatus:
        with self._surveillance_lock:
            if self._surveillance_subject_id != subject_id:
                return SurveillanceStatus(False, False, "Vigilancia detenida")
            self._surveillance_last_access = time.monotonic()
            return self._surveillance_status

    def surveillance_frame(self, subject_id: str) -> bytes | None:
        with self._surveillance_lock:
            if self._surveillance_subject_id != subject_id:
                return None
            self._surveillance_last_access = time.monotonic()
            return self._surveillance_frame

    def stop_surveillance(self, subject_id: str) -> None:
        should_wait = False
        with self._surveillance_lock:
            if self._surveillance_subject_id == subject_id:
                self._surveillance_stop.set()
                should_wait = True

        if not should_wait:
            return

        deadline = time.monotonic() + 2.0
        while time.monotonic() < deadline:
            with self._surveillance_lock:
                if not self._surveillance_status.active:
                    return
            time.sleep(0.04)

    def _run_surveillance(self, subject_id: str) -> None:
        capture = None
        failed_reads = 0
        last_detection_at = 0.0
        detected_face: np.ndarray | None = None
        final_message = "Vigilancia detenida"
        try:
            capture = cv2.VideoCapture(self._settings.rtsp_url, cv2.CAP_FFMPEG)
            capture.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            if not capture.isOpened():
                final_message = "No fue posible abrir la transmisión RTSP"
                return

            while not self._surveillance_stop.is_set():
                with self._surveillance_lock:
                    inactive_seconds = time.monotonic() - self._surveillance_last_access
                if inactive_seconds > 12.0:
                    final_message = "Vigilancia detenida por inactividad"
                    break

                received, frame = capture.read()
                if not received or frame is None:
                    failed_reads += 1
                    if failed_reads >= 20:
                        final_message = "La cámara dejó de entregar imágenes"
                        break
                    continue

                failed_reads = 0
                now = time.monotonic()
                if now - last_detection_at >= 0.30:
                    detected_face = self._detect_largest_face(frame)
                    last_detection_at = now

                encoded = self._encode_preview_frame(frame, detected_face)
                if encoded is None:
                    continue

                with self._surveillance_lock:
                    if self._surveillance_subject_id != subject_id:
                        break
                    self._surveillance_frame = encoded
                    self._surveillance_status = SurveillanceStatus(
                        True,
                        detected_face is not None,
                        "Rostro detectado" if detected_face is not None else "Transmisión en vivo",
                    )
        except Exception:
            final_message = "Se perdió la conexión con la cámara"
        finally:
            if capture is not None:
                capture.release()
            with self._surveillance_lock:
                if self._surveillance_subject_id == subject_id:
                    self._surveillance_frame = None
                    self._surveillance_status = SurveillanceStatus(False, False, final_message)
            self._camera_lock.release()

    def enroll(self, subject_id: str) -> tuple[np.ndarray, int, bool]:
        capture = self._capture_embeddings(subject_id)
        template = average_embeddings(capture.embeddings)
        return template, len(capture.embeddings), capture.liveness_verified

    def verify(self, subject_id: str, template: np.ndarray) -> VerificationResult:
        capture = self._capture_embeddings(subject_id)
        normalized_template = _normalize_embedding(template)
        scores = [cosine_similarity(normalized_template, item) for item in capture.embeddings]
        score = float(np.median(np.asarray(scores, dtype=np.float32)))
        accepted_samples = sum(item >= self._settings.match_threshold for item in scores)
        required_acceptances = max(2, int(np.ceil(len(scores) * 0.60)))
        matched = (
            score >= self._settings.match_threshold
            and accepted_samples >= required_acceptances
            and capture.liveness_verified
        )
        return VerificationResult(matched, score, capture.liveness_verified)

    def _capture_embeddings(self, subject_id: str) -> CaptureResult:
        if not self._camera_lock.acquire(timeout=1.0):
            raise CameraUnavailableError(
                "La cámara está atendiendo otra verificación; inténtalo nuevamente"
            )
        self._start_preview(subject_id)
        capture = None
        try:
            capture = cv2.VideoCapture(self._settings.rtsp_url, cv2.CAP_FFMPEG)
            capture.set(cv2.CAP_PROP_BUFFERSIZE, 1)
            if not capture.isOpened():
                raise CameraUnavailableError(
                    "No fue posible abrir la transmisión RTSP de la cámara"
                )

            deadline = time.monotonic() + self._settings.capture_timeout_seconds
            last_sample_at = 0.0
            failed_reads = 0
            embeddings: list[np.ndarray] = []
            pose_markers: list[float] = []

            while time.monotonic() < deadline and len(embeddings) < self._settings.required_samples:
                received, frame = capture.read()
                if not received or frame is None:
                    failed_reads += 1
                    if failed_reads >= 20:
                        raise CameraUnavailableError(
                            "La cámara dejó de entregar fotogramas válidos"
                        )
                    continue

                failed_reads = 0
                now = time.monotonic()
                if now - last_sample_at < self._settings.sample_interval_seconds:
                    continue

                face = self._detect_largest_face(frame)
                if face is None:
                    self._publish_preview(
                        frame,
                        None,
                        len(embeddings),
                        False,
                        "Ubícate frente a la cámara",
                    )
                    continue

                if not self._is_quality_sample(frame, face):
                    self._publish_preview(
                        frame,
                        face,
                        len(embeddings),
                        False,
                        "Acércate y mantén el rostro bien iluminado",
                    )
                    continue

                aligned = self._recognizer.alignCrop(frame, face)
                feature = self._recognizer.feature(aligned)
                embeddings.append(_normalize_embedding(feature))
                pose_markers.append(head_pose_marker(face))
                last_sample_at = now
                liveness_progress = (
                    not self._settings.liveness_enabled
                    or movement_span(pose_markers) >= self._settings.liveness_min_movement
                )
                message = (
                    "Movimiento validado; mantén la posición"
                    if liveness_progress
                    else "Mueve suavemente la cabeza hacia ambos lados"
                )
                self._publish_preview(
                    frame,
                    face,
                    len(embeddings),
                    liveness_progress,
                    message,
                )

            if len(embeddings) < self._settings.required_samples:
                raise CaptureQualityError(
                    "No se obtuvieron suficientes muestras. Mira a la cámara, mejora la luz y evita cubrir el rostro"
                )

            liveness_verified = (
                not self._settings.liveness_enabled
                or movement_span(pose_markers) >= self._settings.liveness_min_movement
            )
            if not liveness_verified:
                raise LivenessError(
                    "No se detectó movimiento suficiente. Mueve lentamente la cabeza hacia ambos lados"
                )

            self._finish_preview(
                "Captura completada",
                len(embeddings),
                True,
            )
            return CaptureResult(embeddings, liveness_verified)
        except Exception as error:
            self._finish_preview(str(error), 0, False)
            raise
        finally:
            if capture is not None:
                capture.release()
            self._camera_lock.release()

    def _start_preview(self, subject_id: str) -> None:
        with self._preview_lock:
            if self._preview_clear_timer is not None:
                self._preview_clear_timer.cancel()
                self._preview_clear_timer = None
            self._preview_frame = None
            self._preview_subject_id = subject_id
            self._preview_status = PreviewStatus(
                active=True,
                samples=0,
                required=self._settings.required_samples,
                face_detected=False,
                liveness_verified=False,
                message="Conectando con la cámara…",
            )

    def _publish_preview(
        self,
        frame: np.ndarray,
        face: np.ndarray | None,
        samples: int,
        liveness_verified: bool,
        message: str,
    ) -> None:
        encoded_frame = self._encode_preview_frame(frame, face)
        if encoded_frame is None:
            return

        with self._preview_lock:
            self._preview_frame = encoded_frame
            self._preview_status = PreviewStatus(
                active=True,
                samples=samples,
                required=self._settings.required_samples,
                face_detected=face is not None,
                liveness_verified=liveness_verified,
                message=message,
            )

    def _encode_preview_frame(
        self,
        frame: np.ndarray,
        face: np.ndarray | None,
    ) -> bytes | None:
        preview = frame.copy()
        if face is not None:
            x, y, width, height = face[:4].astype(int)
            x1, y1 = max(0, x), max(0, y)
            x2 = min(preview.shape[1] - 1, x + width)
            y2 = min(preview.shape[0] - 1, y + height)
            cv2.rectangle(preview, (x1, y1), (x2, y2), (72, 224, 190), 3)
            landmarks = np.asarray(face[4:14], dtype=np.float32).reshape(5, 2)
            for point_x, point_y in landmarks.astype(int):
                cv2.circle(preview, (point_x, point_y), 3, (74, 201, 255), -1)

        max_width = 760
        if preview.shape[1] > max_width:
            scale = max_width / preview.shape[1]
            preview = cv2.resize(
                preview,
                (max_width, max(1, int(preview.shape[0] * scale))),
                interpolation=cv2.INTER_AREA,
            )

        encoded, buffer = cv2.imencode(
            ".jpg",
            preview,
            [int(cv2.IMWRITE_JPEG_QUALITY), 76],
        )
        if not encoded:
            return None
        return buffer.tobytes()

    def _finish_preview(
        self,
        message: str,
        samples: int,
        liveness_verified: bool,
    ) -> None:
        with self._preview_lock:
            self._preview_status = PreviewStatus(
                active=False,
                samples=samples,
                required=self._settings.required_samples,
                face_detected=self._preview_status.face_detected,
                liveness_verified=liveness_verified,
                message=message,
            )
            timer = threading.Timer(5.0, self._clear_preview)
            timer.daemon = True
            self._preview_clear_timer = timer
            timer.start()

    def _clear_preview(self) -> None:
        with self._preview_lock:
            self._preview_frame = None
            self._preview_subject_id = None
            self._preview_clear_timer = None

    def _detect_largest_face(self, frame: np.ndarray) -> np.ndarray | None:
        height, width = frame.shape[:2]
        self._detector.setInputSize((width, height))
        _, faces = self._detector.detect(frame)
        if faces is None or len(faces) == 0:
            return None
        return max(faces, key=lambda item: float(item[2] * item[3]))

    def _is_quality_sample(self, frame: np.ndarray, face: np.ndarray) -> bool:
        x, y, width, height = face[:4].astype(int)
        if width < self._settings.min_face_pixels or height < self._settings.min_face_pixels:
            return False

        frame_height, frame_width = frame.shape[:2]
        x1, y1 = max(0, x), max(0, y)
        x2, y2 = min(frame_width, x + width), min(frame_height, y + height)
        roi = frame[y1:y2, x1:x2]
        if roi.size == 0:
            return False
        gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
        return float(cv2.Laplacian(gray, cv2.CV_64F).var()) >= self._settings.min_blur_variance


def head_pose_marker(face: np.ndarray) -> float:
    landmarks = np.asarray(face[4:14], dtype=np.float32).reshape(5, 2)
    right_eye, left_eye, nose = landmarks[0], landmarks[1], landmarks[2]
    eye_midpoint_x = float((right_eye[0] + left_eye[0]) / 2.0)
    interocular_distance = max(float(abs(left_eye[0] - right_eye[0])), 1.0)
    return (float(nose[0]) - eye_midpoint_x) / interocular_distance


def movement_span(markers: list[float]) -> float:
    if len(markers) < 2:
        return 0.0
    return float(max(markers) - min(markers))


def average_embeddings(embeddings: list[np.ndarray]) -> np.ndarray:
    if not embeddings:
        raise CaptureQualityError("No hay muestras faciales para registrar")
    matrix = np.vstack([_normalize_embedding(item) for item in embeddings])
    return _normalize_embedding(matrix.mean(axis=0))


def cosine_similarity(first: np.ndarray, second: np.ndarray) -> float:
    left = _normalize_embedding(first)
    right = _normalize_embedding(second)
    return float(np.clip(np.dot(left, right), -1.0, 1.0))
