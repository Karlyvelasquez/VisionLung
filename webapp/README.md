# VisionLung WebApp

Aplicacion web de inferencia para detectar neumonia en radiografias de torax usando un modelo `.pkl` preentrenado.

## Requisitos

- Python 3.10+
- `../outputs/best_model.pkl`
- API key de OpenAI (opcional, para feedback clinico)

## Estructura

```text
webapp/
├── backend/
│   ├── app.py
│   ├── models.py
│   └── uploads/
├── frontend/
│   ├── templates/
│   └── static/
├── requirements.txt
├── start.bat
└── start.sh
```

## Ejecutar

### Windows

```bat
start.bat
```

### Linux / macOS

```bash
chmod +x start.sh
./start.sh
```

En Docker, la app quedara disponible en `http://localhost:18080`.

## Variables de entorno

Copia `.env.example` a `.env` y configura:

```env
OPENAI_API_KEY=tu_api_key
FLASK_HOST=127.0.0.1
FLASK_PORT=8000
```

## API

- `GET /` interfaz web
- `POST /api/predict` prediccion sobre imagen (`file` en multipart/form-data)
- `GET /api/health` estado del servicio

## Despliegue en Render

Configuracion recomendada para el formulario de Render:

- `Language`: Python 3
- `Branch`: main
- `Region`: Oregon (US West)
- `Root Directory`: webapp
- `Build Command`: `git lfs pull; pip install -r requirements.txt`
- `Start Command`: `gunicorn backend.app:app --bind 0.0.0.0:$PORT --workers 1 --threads 4 --timeout 300`

Variables de entorno en Render:

- `OPENAI_API_KEY` = tu clave
- `FLASK_HOST` = `0.0.0.0`
- `PYTHON_VERSION` = `3.11.9`

Nota: el modelo `outputs/best_model.pkl` se sube con Git LFS, por eso se usa `git lfs pull` en el build.

## Docker local

Desde la raiz del repositorio:

```bash
docker compose up --build
```

Esto construye una imagen con Flask, React servido por Flask y el modelo cargado desde `outputs/best_model.pkl`.

Si vas a usar OpenAI dentro del contenedor, crea `webapp/.env` desde `webapp/.env.example` y coloca tu `OPENAI_API_KEY`. El compose ya lo carga automaticamente.

## Nota legal

Herramienta de apoyo diagnostico. No reemplaza evaluacion medica profesional.
