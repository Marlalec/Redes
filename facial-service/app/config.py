from __future__ import annotations

import os
from dataclasses import dataclass
from pathlib import Path
from urllib.parse import quote

from dotenv import load_dotenv


PROJECT_DIR = Path(__file__).resolve().parents[1]


def _read_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.strip().lower() in {"1", "true", "yes", "on", "si", "sí"}


@dataclass(frozen=True)
class Settings:
    camera_host: str
    camera_port: int
    camera_username: str
    camera_password: str
    camera_rtsp_path: str
    internal_token: str
    data_key: str
    data_dir: Path
    detection_model: Path
    recognition_model: Path
    detection_threshold: float
    match_threshold: float
    required_samples: int
    capture_timeout_seconds: float
    sample_interval_seconds: float
    min_face_pixels: int
    min_blur_variance: float
    liveness_enabled: bool
    liveness_min_movement: float

    @classmethod
    def from_env(cls) -> "Settings":
        load_dotenv(PROJECT_DIR / ".env", override=False)

        settings = cls(
            camera_host=os.getenv("CAMERA_HOST", "").strip(),
            camera_port=int(os.getenv("CAMERA_PORT", "554")),
            camera_username=os.getenv("CAMERA_USERNAME", "").strip(),
            camera_password=os.getenv("CAMERA_PASSWORD", ""),
            camera_rtsp_path=os.getenv("CAMERA_RTSP_PATH", "/live/ch00_0").strip(),
            internal_token=os.getenv("FACE_INTERNAL_TOKEN", ""),
            data_key=os.getenv("FACE_DATA_KEY", ""),
            data_dir=Path(os.getenv("FACE_DATA_DIR", str(PROJECT_DIR / "data" / "embeddings"))),
            detection_model=Path(
                os.getenv(
                    "FACE_DETECTION_MODEL",
                    str(PROJECT_DIR / "models" / "face_detection_yunet_2026may.onnx"),
                )
            ),
            recognition_model=Path(
                os.getenv(
                    "FACE_RECOGNITION_MODEL",
                    str(PROJECT_DIR / "models" / "face_recognition_sface_2021dec.onnx"),
                )
            ),
            detection_threshold=float(os.getenv("FACE_DETECTION_THRESHOLD", "0.70")),
            match_threshold=float(os.getenv("FACE_MATCH_THRESHOLD", "0.45")),
            required_samples=int(os.getenv("FACE_REQUIRED_SAMPLES", "8")),
            capture_timeout_seconds=float(os.getenv("FACE_CAPTURE_TIMEOUT_SECONDS", "14")),
            sample_interval_seconds=float(os.getenv("FACE_SAMPLE_INTERVAL_MS", "300")) / 1000.0,
            min_face_pixels=int(os.getenv("FACE_MIN_FACE_PIXELS", "120")),
            min_blur_variance=float(os.getenv("FACE_MIN_BLUR_VARIANCE", "30")),
            liveness_enabled=_read_bool("FACE_LIVENESS_ENABLED", True),
            liveness_min_movement=float(os.getenv("FACE_LIVENESS_MIN_MOVEMENT", "0.035")),
        )
        settings.validate()
        return settings

    def validate(self) -> None:
        missing = []
        if not self.camera_host:
            missing.append("CAMERA_HOST")
        if not self.camera_username:
            missing.append("CAMERA_USERNAME")
        if not self.camera_password:
            missing.append("CAMERA_PASSWORD")
        if len(self.internal_token) < 32:
            missing.append("FACE_INTERNAL_TOKEN (mínimo 32 caracteres)")
        if not self.data_key:
            missing.append("FACE_DATA_KEY")
        if missing:
            raise RuntimeError("Falta configuración obligatoria: " + ", ".join(missing))
        if not self.camera_rtsp_path.startswith("/"):
            raise RuntimeError("CAMERA_RTSP_PATH debe comenzar por /")
        if not self.detection_model.is_file():
            raise RuntimeError(f"No se encontró el modelo YuNet: {self.detection_model}")
        if not self.recognition_model.is_file():
            raise RuntimeError(f"No se encontró el modelo SFace: {self.recognition_model}")
        if self.required_samples < 3:
            raise RuntimeError("FACE_REQUIRED_SAMPLES debe ser al menos 3")

    @property
    def rtsp_url(self) -> str:
        username = quote(self.camera_username, safe="")
        password = quote(self.camera_password, safe="")
        return (
            f"rtsp://{username}:{password}@{self.camera_host}:"
            f"{self.camera_port}{self.camera_rtsp_path}"
        )
