from __future__ import annotations

import json
import os
import re
import tempfile
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
from cryptography.fernet import Fernet, InvalidToken

from .errors import FacialServiceError, TemplateNotFoundError


SUBJECT_PATTERN = re.compile(r"^[A-Za-z0-9_-]{1,64}$")


class EncryptedTemplateStore:
    def __init__(self, data_dir: Path, encryption_key: str) -> None:
        try:
            self._cipher = Fernet(encryption_key.encode("ascii"))
        except (ValueError, UnicodeEncodeError) as error:
            raise RuntimeError(
                "FACE_DATA_KEY no es una clave Fernet válida de 32 bytes"
            ) from error

        self._data_dir = data_dir.resolve()
        self._data_dir.mkdir(parents=True, exist_ok=True)

    def exists(self, subject_id: str) -> bool:
        return self._path_for(subject_id).is_file()

    def save(self, subject_id: str, embedding: np.ndarray, model_version: str) -> None:
        normalized = _normalize_embedding(embedding)
        payload = json.dumps(
            {
                "version": 1,
                "model": model_version,
                "createdAt": datetime.now(timezone.utc).isoformat(),
                "embedding": normalized.astype(np.float32).tolist(),
            },
            separators=(",", ":"),
        ).encode("utf-8")
        encrypted = self._cipher.encrypt(payload)
        target = self._path_for(subject_id)

        descriptor, temporary_name = tempfile.mkstemp(
            prefix=f".{subject_id}-",
            suffix=".tmp",
            dir=self._data_dir,
        )
        try:
            with os.fdopen(descriptor, "wb") as temporary_file:
                temporary_file.write(encrypted)
                temporary_file.flush()
                os.fsync(temporary_file.fileno())
            os.chmod(temporary_name, 0o600)
            os.replace(temporary_name, target)
        finally:
            if os.path.exists(temporary_name):
                os.unlink(temporary_name)

    def load(self, subject_id: str) -> np.ndarray:
        path = self._path_for(subject_id)
        if not path.is_file():
            raise TemplateNotFoundError("El usuario no tiene un rostro registrado")

        try:
            decrypted = self._cipher.decrypt(path.read_bytes())
            payload = json.loads(decrypted.decode("utf-8"))
            embedding = np.asarray(payload["embedding"], dtype=np.float32)
            return _normalize_embedding(embedding)
        except (InvalidToken, KeyError, TypeError, ValueError, json.JSONDecodeError) as error:
            raise FacialServiceError(
                "La plantilla facial cifrada no es válida o usa otra clave"
            ) from error

    def delete(self, subject_id: str) -> bool:
        path = self._path_for(subject_id)
        if not path.exists():
            return False
        path.unlink()
        return True

    def _path_for(self, subject_id: str) -> Path:
        if not SUBJECT_PATTERN.fullmatch(subject_id):
            raise FacialServiceError("El identificador biométrico no es válido")
        return self._data_dir / f"{subject_id}.face"


def _normalize_embedding(embedding: np.ndarray) -> np.ndarray:
    flattened = np.asarray(embedding, dtype=np.float32).reshape(-1)
    norm = float(np.linalg.norm(flattened))
    if norm <= 1e-8:
        raise FacialServiceError("El vector facial generado no es válido")
    return flattened / norm
