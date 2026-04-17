# VisionLung

Aplicacion web para apoyo diagnostico de neumonia a partir de radiografias de torax.

Este repositorio esta preparado para despliegue de inferencia (no entrenamiento).
Solo incluye:

- `webapp/`: backend Flask + frontend React (CDN)
- `outputs/best_model.pkl`: modelo entrenado que consume la webapp

## Estructura

```text
VisionLung/
├── outputs/
│   └── best_model.pkl
└── webapp/
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

## Requisitos

- Python 3.10+
- API key de OpenAI (opcional pero recomendada para feedback clinico)

## Ejecucion rapida

### Windows

```bat
cd webapp
start.bat
```

### Linux / macOS

```bash
cd webapp
chmod +x start.sh
./start.sh
```

## Variables de entorno

En `webapp/.env`:

```env
OPENAI_API_KEY=tu_api_key
FLASK_HOST=127.0.0.1
FLASK_PORT=8000
```

## Nota

El sistema es una herramienta de apoyo diagnostico y no reemplaza evaluacion medica profesional.

## Docker

Para levantar la app en Docker desde la raiz del repositorio:

```bash
docker compose up --build
```

La aplicacion quedara en `http://localhost:18080`.

Si quieres activar el feedback clinico con IA dentro del contenedor, exporta `OPENAI_API_KEY` en tu shell o usa `docker compose --env-file webapp/.env up --build` tras crear tu archivo local desde `webapp/.env.example`.
