# Servicio facial interno

Microservicio Python que toma temporalmente fotogramas RTSP de la cámara JOOAN,
detecta el rostro principal con YuNet y genera una plantilla con SFace.

## Prueba nativa en Windows

Con el entorno virtual ya creado:

```powershell
.\.venv\Scripts\Activate.ps1
python -m pip install -r .\requirements.txt
Copy-Item .\.env.example .\.env
```

Completa en `.env` las credenciales RTSP y genera una clave Fernet:

```powershell
python -c "from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())"
```

Para comprobar la imagen y el detector con ventana local:

```powershell
python .\test_rtsp.py
python .\detect_faces.py
```

Para iniciar la API nativa:

```powershell
python -m uvicorn app.main:app --host 127.0.0.1 --port 8090
```

En el ambiente normal no se llaman los endpoints directamente: Spring Boot usa el
token `X-Internal-Token` y asocia el identificador interno al usuario autenticado.

## Datos guardados

`data/embeddings/user-N.face` contiene un JSON cifrado con el vector normalizado,
la fecha y la versión del modelo. No contiene la fotografía original. El directorio
está excluido del repositorio y se monta como volumen persistente en Docker.

## Parámetros importantes

| Variable | Predeterminado | Función |
|---|---:|---|
| `FACE_DETECTION_THRESHOLD` | `0.70` | Confianza mínima de YuNet |
| `FACE_MATCH_THRESHOLD` | `0.45` | Similitud mínima de SFace |
| `FACE_REQUIRED_SAMPLES` | `8` | Muestras válidas por operación |
| `FACE_CAPTURE_TIMEOUT_SECONDS` | `14` | Tiempo máximo de captura |
| `FACE_LIVENESS_ENABLED` | `true` | Exige movimiento básico |

No reduzcas los umbrales sin medir falsos positivos y falsos negativos con un conjunto
representativo. El movimiento actual es una ayuda de demostración, no un PAD certificado.
