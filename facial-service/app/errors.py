class FacialServiceError(RuntimeError):
    """Error controlado que puede mostrarse sin revelar secretos."""


class CameraUnavailableError(FacialServiceError):
    pass


class CaptureQualityError(FacialServiceError):
    pass


class LivenessError(FacialServiceError):
    pass


class TemplateNotFoundError(FacialServiceError):
    pass
