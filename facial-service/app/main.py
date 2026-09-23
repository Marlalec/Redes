from __future__ import annotations

import logging
import secrets
from typing import Annotated

from fastapi import Depends, FastAPI, Header, HTTPException, Response, status
from pydantic import BaseModel

from .biometrics import FaceEngine
from .config import Settings
from .errors import (
    CameraUnavailableError,
    CaptureQualityError,
    FacialServiceError,
    LivenessError,
    TemplateNotFoundError,
)
from .storage import EncryptedTemplateStore


LOGGER = logging.getLogger("facial-service")
settings = Settings.from_env()
engine = FaceEngine(settings)
store = EncryptedTemplateStore(settings.data_dir, settings.data_key)

app = FastAPI(
    title="OSI Facial Verification Service",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
    openapi_url=None,
)


class StatusResponse(BaseModel):
    enrolled: bool


class EnrollmentResponse(BaseModel):
    enrolled: bool
    samples: int
    livenessVerified: bool
    message: str


class VerificationResponse(BaseModel):
    matched: bool
    score: float
    livenessVerified: bool
    message: str


class PreviewStatusResponse(BaseModel):
    active: bool
    samples: int
    required: int
    faceDetected: bool
    livenessVerified: bool
    message: str


class SurveillanceStatusResponse(BaseModel):
    active: bool
    faceDetected: bool
    message: str


def require_internal_token(
    token: Annotated[str | None, Header(alias="X-Internal-Token")] = None,
) -> None:
    if token is None or not secrets.compare_digest(token, settings.internal_token):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token interno inválido")


InternalAccess = Annotated[None, Depends(require_internal_token)]


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "UP"}


@app.get("/v1/templates/{subject_id}/preview/status", response_model=PreviewStatusResponse)
def preview_status(subject_id: str, _: InternalAccess) -> PreviewStatusResponse:
    preview = engine.preview_status(subject_id)
    return PreviewStatusResponse(
        active=preview.active,
        samples=preview.samples,
        required=preview.required,
        faceDetected=preview.face_detected,
        livenessVerified=preview.liveness_verified,
        message=preview.message,
    )


@app.get("/v1/templates/{subject_id}/preview/frame")
def preview_frame(subject_id: str, _: InternalAccess) -> Response:
    frame = engine.preview_frame(subject_id)
    if frame is None:
        return Response(status_code=204, headers={"Cache-Control": "no-store"})
    return Response(
        content=frame,
        media_type="image/jpeg",
        headers={"Cache-Control": "no-store, max-age=0"},
    )


@app.post("/v1/templates/{subject_id}/surveillance/start", response_model=SurveillanceStatusResponse)
def start_surveillance(subject_id: str, _: InternalAccess) -> SurveillanceStatusResponse:
    try:
        current = engine.start_surveillance(subject_id)
        return SurveillanceStatusResponse(
            active=current.active,
            faceDetected=current.face_detected,
            message=current.message,
        )
    except CameraUnavailableError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error


@app.get("/v1/templates/{subject_id}/surveillance/status", response_model=SurveillanceStatusResponse)
def surveillance_status(subject_id: str, _: InternalAccess) -> SurveillanceStatusResponse:
    current = engine.surveillance_status(subject_id)
    return SurveillanceStatusResponse(
        active=current.active,
        faceDetected=current.face_detected,
        message=current.message,
    )


@app.get("/v1/templates/{subject_id}/surveillance/frame")
def surveillance_frame(subject_id: str, _: InternalAccess) -> Response:
    frame = engine.surveillance_frame(subject_id)
    if frame is None:
        return Response(status_code=204, headers={"Cache-Control": "no-store"})
    return Response(
        content=frame,
        media_type="image/jpeg",
        headers={"Cache-Control": "no-store, max-age=0"},
    )


@app.post("/v1/templates/{subject_id}/surveillance/stop", status_code=204)
def stop_surveillance(subject_id: str, _: InternalAccess) -> Response:
    engine.stop_surveillance(subject_id)
    return Response(status_code=204)


@app.get("/v1/templates/{subject_id}", response_model=StatusResponse)
def template_status(subject_id: str, _: InternalAccess) -> StatusResponse:
    return StatusResponse(enrolled=store.exists(subject_id))


@app.post("/v1/templates/{subject_id}/enroll", response_model=EnrollmentResponse)
def enroll(subject_id: str, _: InternalAccess) -> EnrollmentResponse:
    try:
        template, samples, liveness_verified = engine.enroll(subject_id)
        store.save(subject_id, template, engine.MODEL_VERSION)
        return EnrollmentResponse(
            enrolled=True,
            samples=samples,
            livenessVerified=liveness_verified,
            message="Rostro registrado correctamente",
        )
    except CameraUnavailableError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except (CaptureQualityError, LivenessError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error
    except FacialServiceError as error:
        LOGGER.exception("Error controlado al registrar la plantilla facial")
        raise HTTPException(status_code=500, detail=str(error)) from error


@app.post("/v1/templates/{subject_id}/verify", response_model=VerificationResponse)
def verify(subject_id: str, _: InternalAccess) -> VerificationResponse:
    try:
        template = store.load(subject_id)
        result = engine.verify(subject_id, template)
        return VerificationResponse(
            matched=result.matched,
            score=round(result.score, 4),
            livenessVerified=result.liveness_verified,
            message=(
                "Rostro verificado correctamente"
                if result.matched
                else "El rostro no coincide con el usuario"
            ),
        )
    except TemplateNotFoundError as error:
        raise HTTPException(status_code=404, detail=str(error)) from error
    except CameraUnavailableError as error:
        raise HTTPException(status_code=503, detail=str(error)) from error
    except (CaptureQualityError, LivenessError) as error:
        raise HTTPException(status_code=422, detail=str(error)) from error


@app.delete("/v1/templates/{subject_id}", status_code=204)
def delete_template(subject_id: str, _: InternalAccess) -> Response:
    store.delete(subject_id)
    return Response(status_code=204)
