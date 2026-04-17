"""
Pneumonia Detector Web Application - Backend
Médico webapp para diagnosis de neumonía con feedback de OpenAI
"""

import os
import io
import base64
import socket
from pathlib import Path
from datetime import datetime
from typing import Tuple

import torch
import numpy as np
from PIL import Image
from flask import Flask, render_template, request, jsonify
from werkzeug.utils import secure_filename
import openai
from dotenv import load_dotenv

# Cargar variables de entorno
load_dotenv()

BASE_DIR = Path(__file__).parent.parent
FRONTEND_DIR = BASE_DIR / "frontend"

app = Flask(
    __name__,
    template_folder=str(FRONTEND_DIR / "templates"),
    static_folder=str(FRONTEND_DIR / "static"),
)
app.config['MAX_CONTENT_LENGTH'] = 50 * 1024 * 1024  # 50MB max

# Configuración
MODEL_PATH = BASE_DIR.parent / "outputs" / "best_model.pkl"
UPLOAD_FOLDER = Path(__file__).parent / "uploads"
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}

UPLOAD_FOLDER.mkdir(exist_ok=True)

# Variables globales para el modelo
model = None
device = None
model_config = None

# Configurar OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')


def allowed_file(filename: str) -> bool:
    """Validar extensión de archivo"""
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS


def _symmetry_score(gray: np.ndarray) -> float:
    """Mide simetría izquierda-derecha en escala [0, 1]."""
    h, w = gray.shape
    half = w // 2
    left = gray[:, :half]
    right = gray[:, w - half:]
    right_flipped = np.fliplr(right)
    left_vec = left.flatten().astype(np.float32)
    right_vec = right_flipped.flatten().astype(np.float32)
    left_vec -= left_vec.mean()
    right_vec -= right_vec.mean()
    denom = float(np.linalg.norm(left_vec) * np.linalg.norm(right_vec) + 1e-8)
    corr = float(np.dot(left_vec, right_vec) / denom)
    return max(0.0, min(1.0, (corr + 1.0) / 2.0))


def load_model():
    """Cargar el modelo PKL entrenado"""
    global model, device, model_config
    
    if model is not None:
        return model, device, model_config
    
    device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
    
    if not MODEL_PATH.exists():
        raise FileNotFoundError(f"Modelo no encontrado en {MODEL_PATH}")
    
    try:
        checkpoint = torch.load(str(MODEL_PATH), map_location=device)
        
        # Extraer componentes del checkpoint
        state_dict = checkpoint.get('model_state_dict')
        model_config = checkpoint.get('config', {})
        
        # Importar la arquitectura del modelo
        from models import SoftAttention, PneumoniaClassifier
        
        # Recrear modelo
        model = PneumoniaClassifier(
            lstm_hidden=model_config.get('lstm_hidden', 128),
            feature_dim=model_config.get('feature_dim', 256),
            dropout=model_config.get('dropout', 0.6)
        )
        
        model.load_state_dict(state_dict)
        model.to(device)
        model.eval()
        
        print(f"✓ Modelo cargado exitosamente en {device}")
        return model, device, model_config
        
    except Exception as e:
        print(f"✗ Error cargando modelo: {str(e)}")
        raise


def preprocess_image(img_path: str, size: int = 224) -> Tuple[torch.Tensor, Image.Image]:
    """Preprocesar imagen para el modelo"""
    img = Image.open(img_path).convert('RGB')
    img_resized = img.resize((size, size), Image.Resampling.LANCZOS)

    # Normalización ImageNet para ResNet50
    img_array = np.array(img_resized, dtype=np.float32) / 255.0
    img_array = np.transpose(img_array, (2, 0, 1))
    mean = np.array([0.485, 0.456, 0.406], dtype=np.float32).reshape(3, 1, 1)
    std = np.array([0.229, 0.224, 0.225], dtype=np.float32).reshape(3, 1, 1)
    img_array = (img_array - mean) / std

    img_tensor = torch.from_numpy(img_array).unsqueeze(0).to(device)
    
    return img_tensor, img_resized


def validate_chest_xray_image(img_path: str) -> Tuple[bool, str]:
    """Validación heurística para filtrar imágenes no relacionadas con RX de tórax."""
    try:
        img = Image.open(img_path).convert('RGB')
        arr = np.array(img, dtype=np.float32)

        # 1) Radiografías suelen ser casi monocromas: poca diferencia entre canales.
        rg = np.abs(arr[:, :, 0] - arr[:, :, 1]).mean()
        gb = np.abs(arr[:, :, 1] - arr[:, :, 2]).mean()
        rb = np.abs(arr[:, :, 0] - arr[:, :, 2]).mean()
        mean_channel_diff = float((rg + gb + rb) / 3.0)

        # 2) Evitar imágenes completamente planas/ruidosas.
        gray = np.array(img.convert('L'), dtype=np.float32)
        contrast_std = float(gray.std())

        # 3) Validar proporción razonable (evita panorámicas/fotos extrañas).
        w, h = img.size
        aspect_ratio = float(w / h) if h else 1.0

        if mean_channel_diff > 14.0:
            return False, (
                "No se puede analizar: la imagen no parece una radiografía de tórax "
                "(se detectó contenido en color)."
            )

        if contrast_std < 18.0:
            return False, (
                "No se puede analizar: la imagen no tiene el contraste típico de una radiografía de tórax."
            )

        if not (0.55 <= aspect_ratio <= 1.8):
            return False, (
                "No se puede analizar: la proporción de la imagen no coincide con una radiografía de tórax."
            )

        # 4) Validación estructural simple sin dependencia de dataset local.
        gray_224 = np.array(Image.fromarray(gray.astype(np.uint8)).resize((224, 224), Image.Resampling.BILINEAR))
        gray_norm = gray_224 / 255.0
        gx = np.diff(gray_norm, axis=1, append=gray_norm[:, -1:])
        gy = np.diff(gray_norm, axis=0, append=gray_norm[-1:, :])
        grad_mag = np.sqrt(gx * gx + gy * gy)
        edge_density = float((grad_mag > 0.08).mean())
        sym_score = _symmetry_score(gray_224)

        if sym_score < 0.45 or edge_density > 0.35:
            return False, (
                "No se puede analizar: la imagen no presenta estructura compatible con radiografía de tórax."
            )

        return True, "ok"
    except Exception:
        return False, "No se pudo validar el archivo de imagen."


def get_prediction(img_tensor: torch.Tensor) -> Tuple[float, str, str, float]:
    """Obtener predicción del modelo"""
    with torch.no_grad():
        logits = model(img_tensor)
        probability = torch.sigmoid(logits).item()
        threshold = model_config.get('threshold', 0.5)
        
        # Diagnóstico
        is_pneumonia = probability >= threshold
        diagnosis = "NEUMONÍA DETECTADA" if is_pneumonia else "SIN NEUMONÍA"
        diagnosis_code = "PNEUMONIA_DETECTED" if is_pneumonia else "NO_PNEUMONIA"
        confidence = probability if is_pneumonia else (1 - probability)
        
    return probability, diagnosis, diagnosis_code, confidence


def generate_openai_feedback(diagnosis: str, confidence: float, language: str = 'es') -> str:
    """Generar feedback con OpenAI en el idioma solicitado por el frontend."""
    selected_language = 'en' if language == 'en' else 'es'

    if selected_language == 'en':
        prompt = f"""
        You are an expert radiologist. Provide clinical feedback for the following chest X-ray diagnosis:

        Diagnosis: {diagnosis}
        Model confidence: {confidence:.1%}

        Include in your answer:
        1. Clinical explanation of the finding
        2. Pulmonary pathology context (if applicable)
        3. Follow-up recommendations or next steps

        Keep a professional and concise tone (max 300 words).
        This is a decision-support model and does not replace professional radiologist assessment.
        """
        system_message = (
            "You are an expert radiologist specialized in chest X-ray interpretation. "
            "Provide clear and professional clinical feedback in English."
        )
    else:
        prompt = f"""
        Eres un radiólogo experto. Proporciona un feedback clínico sobre el siguiente diagnóstico de radiografía de tórax:

        Diagnóstico: {diagnosis}
        Confianza del modelo: {confidence:.1%}

        Proporciona un análisis que incluya:
        1. Explicación clínica del hallazgo
        2. Contexto sobre la patología pulmonar (si aplica)
        3. Recomendaciones de seguimiento o próximos pasos

        Mantén el tono profesional y conciso (máximo 300 palabras).
        Recuerda que este es un modelo de apoyo diagnóstico y no reemplaza la evaluación clínica del radiólogo.
        """
        system_message = (
            "Eres un radiólogo experto en interpretación de radiografías de tórax. "
            "Proporciona feedback clínico profesional en español."
        )
    
    try:
        response = openai.ChatCompletion.create(
            model="gpt-4",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": prompt}
            ],
            max_tokens=500,
            temperature=0.7
        )
        return response['choices'][0]['message']['content']
    except Exception as e:
        print(f"Error con OpenAI: {str(e)}")
        return f"Error generando feedback: {str(e)}"


def image_to_base64(img: Image.Image) -> str:
    """Convertir imagen PIL a base64"""
    img_byte_arr = io.BytesIO()
    img.save(img_byte_arr, format='PNG')
    img_byte_arr.seek(0)
    return base64.b64encode(img_byte_arr.getvalue()).decode()


@app.route('/')
def index():
    """Página principal"""
    return render_template('index.html')


@app.route('/favicon.ico')
def favicon():
    """Evita 404 en favicon cuando el navegador lo solicita por defecto."""
    return ('', 204)


@app.route('/api/predict', methods=['POST'])
def predict():
    """Endpoint para predicción"""
    try:
        # Validar archivo
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        if not allowed_file(file.filename):
            return jsonify({'error': 'Invalid file extension. Use PNG, JPG, or JPEG'}), 400
        
        language = request.form.get('language', 'es').strip().lower()

        # Cargar modelo si es necesario
        if model is None:
            load_model()
        
        # Guardar archivo temporalmente
        filename = secure_filename(file.filename)
        filepath = UPLOAD_FOLDER / f"{datetime.now().timestamp()}_{filename}"
        file.save(str(filepath))

        # Verificar que la imagen sea compatible con RX de tórax
        is_valid_xray, validation_message = validate_chest_xray_image(str(filepath))
        if not is_valid_xray:
            if filepath.exists():
                filepath.unlink()
            return jsonify({'error': validation_message, 'success': False}), 400
        
        # Preprocesar imagen
        img_tensor, img_display = preprocess_image(str(filepath))
        
        # Obtener predicción
        probability, diagnosis, diagnosis_code, confidence = get_prediction(img_tensor)
        
        # Convertir imagen a base64 para mostrar
        img_base64 = image_to_base64(img_display)
        
        # Generar feedback con OpenAI
        feedback = generate_openai_feedback(diagnosis, confidence, language)
        
        # Limpiar archivo temporal
        filepath.unlink()
        
        # Respuesta
        response = {
            'success': True,
            'diagnosis': diagnosis,
            'diagnosis_code': diagnosis_code,
            'probability': float(probability),
            'confidence': float(confidence),
            'image': f"data:image/png;base64,{img_base64}",
            'feedback': feedback,
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify(response), 200
        
    except Exception as e:
        print(f"Error en predicción: {str(e)}")
        return jsonify({'error': str(e), 'success': False}), 500


@app.route('/api/health', methods=['GET'])
def health():
    """Health check endpoint"""
    try:
        if model is None:
            load_model()
        
        model_status = "ready" if model is not None else "not_loaded"
        pytorch_device = "cuda" if torch.cuda.is_available() else "cpu"
        
        return jsonify({
            'status': 'ok',
            'model': model_status,
            'device': pytorch_device,
            'openai_configured': bool(openai.api_key)
        }), 200
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500


@app.errorhandler(413)
def too_large(e):
    """Manejar archivos muy grandes"""
    return jsonify({'error': 'File too large. Maximum 50MB allowed'}), 413


def find_available_port(host: str, preferred_port: int, max_tries: int = 2000) -> int:
    """Buscar un puerto libre para evitar fallos de bind en Windows."""
    for port in range(preferred_port, preferred_port + max_tries):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                sock.bind((host, port))
                return port
            except OSError:
                continue
    raise RuntimeError(
        f"No se encontró puerto disponible entre {preferred_port} y {preferred_port + max_tries - 1}."
    )


if __name__ == '__main__':
    host = os.getenv('FLASK_HOST', '127.0.0.1')
    preferred_port = int(os.getenv('FLASK_PORT', '8000'))
    port = find_available_port(host, preferred_port)

    print("\n" + "="*60)
    print("PNEUMONIA DETECTOR - WEBAPP BACKEND")
    print("="*60)
    if port != preferred_port:
        print(f"Puerto {preferred_port} no disponible. Usando puerto {port}.")
    print(f"Iniciando servidor en http://{host}:{port}")
    print(f"PyTorch Device: {torch.device('cuda' if torch.cuda.is_available() else 'cpu')}")
    print("="*60 + "\n")
    
    app.run(debug=True, host=host, port=port)
