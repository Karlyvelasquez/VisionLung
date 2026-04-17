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

El servidor se iniciara en la URL mostrada por consola (por defecto `http://127.0.0.1:8000`).

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

## Nota legal

Herramienta de apoyo diagnostico. No reemplaza evaluacion medica profesional.
