@echo off
REM Pneumonia Detector - Start Script for Windows

cls
echo.
echo ============================================
echo   PNEUMONIA DETECTOR - WEBAPP
echo ============================================
echo.

REM Verificar si Python está instalado
python --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python no está instalado o no está en PATH
    echo Descárgalo desde: https://www.python.org/downloads/
    pause
    exit /b 1
)

echo [OK] Python detectado
echo.

REM Verificar si el ambiente virtual existe
if not exist "venv\" (
    echo [CREANDO] Ambiente virtual...
    python -m venv venv
    echo [OK] Ambiente virtual creado
    echo.
)

REM Activar ambiente virtual
echo [ACTIVANDO] Ambiente virtual...
call venv\Scripts\activate.bat
echo [OK] Ambiente virtual activado
echo.

REM Verificar si requirements están instalados
echo [VERIFICANDO] Dependencias...
pip show flask >nul 2>&1
if errorlevel 1 (
    echo [INSTALANDO] Dependencias (primera vez, puede tardar...)
    pip install -r requirements.txt
    if errorlevel 1 (
        echo [ERROR] Fallo en instalación de dependencias
        pause
        exit /b 1
    )
    echo [OK] Dependencias instaladas
    echo.
) else (
    echo [OK] Dependencias ya instaladas
    echo.
)

REM Verificar archivo .env
if not exist ".env" (
    echo [AVISO] Archivo .env no encontrado
    echo [CREANDO] .env desde .env.example...
    copy .env.example .env
    echo.
    echo [IMPORTANTE] Edita el archivo .env y agrega tu OPENAI_API_KEY
    echo Press any key to continue...
    pause
    echo.
)

REM Verificar modelo
set MODEL_PATH=..\outputs\ablation_attention_only.pkl
if not exist "%MODEL_PATH%" (
    echo [ERROR] Modelo no encontrado en ..\outputs\ablation_attention_only.pkl
    echo Ejecuta primero el notebook: pneumonia_classifier.ipynb
    echo.
    pause
    exit /b 1
)
echo [OK] Modelo Attention-only detectado
echo.

REM Iniciar aplicación
echo ============================================
echo   INICIANDO APLICACIÓN
echo ============================================
echo.
echo Accede a la URL que aparece en la salida de Python
echo Presiona Ctrl+C para detener
echo.

python backend\app.py

pause
