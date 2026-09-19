import os
from urllib.parse import quote

import cv2
from dotenv import load_dotenv


load_dotenv()

host = os.getenv("CAMERA_HOST")
port = os.getenv("CAMERA_PORT", "554")
username = os.getenv("CAMERA_USERNAME")
password = os.getenv("CAMERA_PASSWORD")
path = os.getenv("CAMERA_RTSP_PATH", "/live/ch00_0")

if not all([host, username, password]):
    raise RuntimeError(
        "Faltan CAMERA_HOST, CAMERA_USERNAME o CAMERA_PASSWORD en el archivo .env"
    )

encoded_username = quote(username, safe="")
encoded_password = quote(password, safe="")

rtsp_url = (
    f"rtsp://{encoded_username}:{encoded_password}"
    f"@{host}:{port}{path}"
)

# Obliga a utilizar TCP para obtener mayor estabilidad dentro de la red local.
os.environ["OPENCV_FFMPEG_CAPTURE_OPTIONS"] = "rtsp_transport;tcp"

capture = cv2.VideoCapture(rtsp_url, cv2.CAP_FFMPEG)

if not capture.isOpened():
    raise RuntimeError(
        f"No fue posible abrir la transmisión RTSP de la cámara {host}"
    )

print(f"Cámara conectada: {host}")
print("Presiona Q o ESC para cerrar.")

try:
    while True:
        received, frame = capture.read()

        if not received:
            print("No fue posible recibir el siguiente fotograma.")
            break

        cv2.imshow("Prueba RTSP - Camara JOOAN", frame)

        key = cv2.waitKey(1) & 0xFF

        if key in (ord("q"), 27):
            break
finally:
    capture.release()
    cv2.destroyAllWindows()