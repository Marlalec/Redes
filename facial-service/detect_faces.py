import os
from pathlib import Path
from urllib.parse import quote

# Mantiene la transmisión RTSP utilizando TCP.
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp"

import cv2
from dotenv import load_dotenv


WINDOW_NAME = "Deteccion facial - Camara JOOAN"
WINDOW_WIDTH = 960
WINDOW_HEIGHT = 540

load_dotenv(dotenv_path=".env", override=True)

host = os.getenv("CAMERA_HOST")
port = os.getenv("CAMERA_PORT", "554")
username = os.getenv("CAMERA_USERNAME")
password = os.getenv("CAMERA_PASSWORD")
rtsp_path = os.getenv("CAMERA_RTSP_PATH", "/live/ch00_0")

if not all([host, username, password]):
    raise RuntimeError(
        "Faltan CAMERA_HOST, CAMERA_USERNAME o CAMERA_PASSWORD en .env"
    )

encoded_username = quote(username, safe="")
encoded_password = quote(password, safe="")

rtsp_url = (
    f"rtsp://{encoded_username}:{encoded_password}"
    f"@{host}:{port}{rtsp_path}"
)

model_path = (
    Path(__file__).parent
    / "models"
    / "face_detection_yunet_2026may.onnx"
)

if not model_path.exists():
    raise RuntimeError(
        f"No se encontró el modelo facial: {model_path}"
    )

capture = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)

if not capture.isOpened():
    raise RuntimeError(
        f"No fue posible abrir la transmisión RTSP de la cámara {host}"
    )

detector = cv2.FaceDetectorYN.create(
    str(model_path),
    "",
    (320, 320),
    0.70,
    0.30,
    5000,
)

# Crea una ventana redimensionable y más pequeña.
cv2.namedWindow(
    WINDOW_NAME,
    cv2.WINDOW_NORMAL,
)

cv2.resizeWindow(
    WINDOW_NAME,
    WINDOW_WIDTH,
    WINDOW_HEIGHT,
)

print(f"Cámara conectada: {host}")
print("Detección facial iniciada.")
print("Presiona Q, ESC o cierra la ventana para terminar.")

try:
    while True:
        received, frame = capture.read()

        if not received:
            print("\nNo fue posible recibir el siguiente fotograma.")
            break

        height, width = frame.shape[:2]

        detector.setInputSize((width, height))

        _, faces = detector.detect(frame)

        # Conserva solamente el rostro más grande.
        if faces is not None and len(faces) > 0:
            largest_face = max(
                faces,
                key=lambda face: face[2] * face[3],
            )
            faces = [largest_face]
        else:
            faces = None

        face_count = 0 if faces is None else len(faces)

        print(
            f"\rRostros detectados: {face_count}",
            end="",
            flush=True,
        )

        if faces is not None:
            for face in faces:
                x, y, face_width, face_height = face[:4].astype(int)
                confidence = float(face[14])

                box_x1 = max(0, x)
                box_y1 = max(0, y)
                box_x2 = min(width - 1, x + face_width)
                box_y2 = min(height - 1, y + face_height)

                cv2.rectangle(
                    frame,
                    (box_x1, box_y1),
                    (box_x2, box_y2),
                    (0, 255, 0),
                    3,
                )

                cv2.putText(
                    frame,
                    f"Rostro {confidence:.0%}",
                    (box_x1, max(box_y1 - 10, 25)),
                    cv2.FONT_HERSHEY_SIMPLEX,
                    0.7,
                    (0, 255, 0),
                    2,
                )

                landmarks = face[4:14].astype(int).reshape(5, 2)

                for landmark_x, landmark_y in landmarks:
                    cv2.circle(
                        frame,
                        (landmark_x, landmark_y),
                        3,
                        (0, 255, 255),
                        -1,
                    )

        cv2.putText(
            frame,
            f"Rostros detectados: {face_count}",
            (20, 35),
            cv2.FONT_HERSHEY_SIMPLEX,
            0.8,
            (255, 255, 255),
            2,
        )

        cv2.imshow(WINDOW_NAME, frame)

        key = cv2.waitKey(1) & 0xFF

        if key in (ord("q"), 27):
            break

        if cv2.getWindowProperty(
            WINDOW_NAME,
            cv2.WND_PROP_VISIBLE,
        ) < 1:
            break

finally:
    print()
    capture.release()
    cv2.destroyAllWindows()