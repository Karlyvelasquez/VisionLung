#!/bin/bash

# Pneumonia Detector - Start Script for Linux/Mac

clear

echo ""
echo "============================================"
echo "   PNEUMONIA DETECTOR - WEBAPP"
echo "============================================"
echo ""

# Verificar si Python está instalado
if ! command -v python3 &> /dev/null; then
    echo "[ERROR] Python3 no está instalado"
    echo "Instálalo con: sudo apt-get install python3 python3-venv (Ubuntu)"
    exit 1
fi

echo "[OK] Python detectado: $(python3 --version)"
echo ""

# Verificar si el ambiente virtual existe
if [ ! -d "venv" ]; then
    echo "[CREANDO] Ambiente virtual..."
    python3 -m venv venv
    echo "[OK] Ambiente virtual creado"
    echo ""
fi

# Activar ambiente virtual
echo "[ACTIVANDO] Ambiente virtual..."
source venv/bin/activate
echo "[OK] Ambiente virtual activado"
echo ""

# Verificar si requirements están instalados
echo "[VERIFICANDO] Dependencias..."
if ! pip show flask &> /dev/null; then
    echo "[INSTALANDO] Dependencias (primera vez, puede tardar...)"
    pip install -r requirements.txt
    if [ $? -ne 0 ]; then
        echo "[ERROR] Fallo en instalación de dependencias"
        exit 1
    fi
    echo "[OK] Dependencias instaladas"
    echo ""
else
    echo "[OK] Dependencias ya instaladas"
    echo ""
fi

# Verificar archivo .env
if [ ! -f ".env" ]; then
    echo "[AVISO] Archivo .env no encontrado"
    echo "[CREANDO] .env desde .env.example..."
    cp .env.example .env
    echo ""
    echo "[IMPORTANTE] Edita el archivo .env y agrega tu OPENAI_API_KEY"
    echo "Luego, presiona Enter para continuar..."
    read
    echo ""
fi

# Verificar modelo
MODEL_PATH="../outputs/ablation_attention_only.pkl"
if [ ! -f "$MODEL_PATH" ]; then
    echo "[ERROR] Modelo no encontrado en $MODEL_PATH"
    echo "Ejecuta primero el notebook: pneumonia_classifier.ipynb"
    echo ""
    exit 1
fi
echo "[OK] Modelo Attention-only detectado"
echo ""

# Iniciar aplicación
echo "============================================"
echo "   INICIANDO APLICACIÓN"
echo "============================================"
echo ""
echo "Accede a: http://localhost:5000"
echo "Presiona Ctrl+C para detener"
echo ""

python backend/app.py

