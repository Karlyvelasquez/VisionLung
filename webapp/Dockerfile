FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1

WORKDIR /app

COPY webapp/requirements.txt /app/webapp/requirements.txt

RUN python -m pip install --upgrade pip \
    && pip install --index-url https://download.pytorch.org/whl/cpu torch==2.5.1 torchvision==0.20.1 \
    && pip install -r /app/webapp/requirements.txt

COPY webapp /app/webapp
COPY outputs /app/outputs

WORKDIR /app/webapp

EXPOSE 8000

CMD ["gunicorn", "backend.app:app", "--bind", "0.0.0.0:8000", "--workers", "1", "--threads", "4", "--timeout", "300"]