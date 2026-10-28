# BenchEngine (GreenGemma)

Plataforma de benchmarking energético local para modelos de lenguaje abiertos. Mide consumo eléctrico en Watts, energía acumulada en Joules, velocidad en tokens por segundo y rendimiento energético en tokens por Joule comparando cuantizaciones locales de Gemma 4 (`Q4_K_M` vs `Q8_0`) sobre documentación técnica real.

## Stack e Integraciones

1. Gemma 4 + Ollama (Motor Local): Ejecuta inferencia 100% en dispositivo sobre las variantes `gemma4-eco-q4` y `gemma4-perf-q8`, recolectando telemetría de hardware (CPU/GPU Watts, latencia y tokens generados).
2. Firecrawl (Ingesta de Contexto Real): Extrae documentación técnica en formato Markdown desde URLs en vivo para construir los prompts del benchmark.
3. Lovable (Frontend BenchEngine): Panel interactivo en React, TanStack Start, Tailwind CSS y Recharts con gráficas comparativas de Joules, Watts y tokens por Joule.
4. MojoAuth (Candado de Auditoría Energética): Autenticación passwordless mediante Email OTP que verifica la identidad del auditor antes de ejecutar corridas y firma cada reporte energético.
5. ElevenLabs (Voice Verdict): Sintetiza en audio MP3 (`eleven_multilingual_v2`) el veredicto ejecutivo del benchmark al finalizar cada corrida, con respaldo automático a Web Speech API.
6. n8n (Orquestación de Reportes): Recibe vía Webhook el resultado estructurado de cada corrida para automatizar la distribución del reporte.

## Estructura del Repositorio

```text
.
├── backend/                  # API REST en FastAPI + telemetría energética + conectores
│   ├── main.py               # Endpoints /api/benchmark, /api/scrape, /api/narrate, /api/auth/*
│   ├── requirements.txt      # Dependencias de Python
│   └── .env.example          # Plantilla de variables de entorno del backend
├── frontend/                 # Aplicación web creada con Lovable (React + Vite + Tailwind)
│   ├── src/
│   │   ├── routes/           # Rutas: Intro (/), Lobby (/lobby), Login MojoAuth (/auth), Dashboard (/dashboard)
│   │   ├── components/bench/ # Gráficas KPI, reproductor ElevenLabs, estado n8n y terminal en vivo
│   │   └── lib/benchmark.ts  # Cliente HTTP y tipos de telemetría
│   └── package.json
├── scripts/
│   └── check_secrets.py      # Escáner pre-commit que bloquea filtraciones de API keys
├── .env.example              # Plantilla general de variables de entorno
└── LICENSE                   # Licencia MIT
```

## Requisitos Previos

- Python 3.10+
- Node.js 20+ (o Bun)
- Ollama corriendo localmente en `http://localhost:11434` con Gemma 4:
  ```bash
  ollama pull gemma4
  ollama cp gemma4:latest gemma4-eco-q4
  ollama cp gemma4:latest gemma4-perf-q8
  ```

## Instalación y Ejecución Local

### 1. Configurar variables de entorno

Copia el archivo de plantilla y agrega tus llaves locales (los archivos `.env` están excluidos en `.gitignore` y protegidos por el hook pre-commit):

```bash
cp backend/.env.example backend/.env
```

Variables utilizadas en `backend/.env`:

```env
OLLAMA_URL=http://localhost:11434/api/generate
FIRECRAWL_API_KEY="colocar la apykey de Firecrawl"
MOJOAUTH_API_KEY="colocar la apykey de MojoAuth"
MOJOAUTH_CLIENT_ID="colocar la apykey de MojoAuth"
MOJOAUTH_CLIENT_SECRET="colocar la apykey de MojoAuth"
MOJOAUTH_ISSUER_URL=https://api.mojoauth.com
MOJOAUTH_REDIRECT_URL=http://localhost:3000/callback
ELEVENLABS_API_KEY="colocar la apykey de ElevenLabs"
ELEVENLABS_VOICE_ID=JBFqnCBsd6RMkjVDRZzb
N8N_WEBHOOK_URL=https://antucoss.app.n8n.cloud/webhook/green-benchmark
```

### 2. Iniciar el Backend (Puerto 8000)

```bash
cd backend
pip install -r requirements.txt
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
```

### 3. Iniciar el Frontend de Lovable (Puerto 5173)

```bash
cd frontend
npm install --legacy-peer-deps
npm run dev
```

Abre `http://localhost:5173` en tu navegador.

## Endpoints Principales del Backend

| Método | Ruta | Descripción |
| :--- | :--- | :--- |
| `POST` | `/api/auth/send-otp` | Envía código OTP passwordless al correo del auditor vía MojoAuth |
| `POST` | `/api/auth/verify-otp` | Verifica el código OTP y emite el token de auditoría energética |
| `POST` | `/api/scrape` | Extrae contenido Markdown de una URL técnica con Firecrawl |
| `POST` | `/api/narrate` | Genera audio MP3 en Base64 del veredicto con ElevenLabs |
| `POST` | `/api/benchmark` | Ejecuta el benchmark en Ollama, calcula Joules/Watts/tok-J, narra el resultado y notifica a n8n |

## Seguridad y Protección de Credenciales

El repositorio incluye `scripts/check_secrets.py` integrado como hook `pre-commit` de Git para impedir que llaves reales (`fc-...`, `sk_...`, `$argon2id$...`) puedan subirse por accidente al historial público.

## Licencia

Distribuido bajo la licencia MIT. Consulta el archivo [LICENSE](LICENSE) para más detalles.
