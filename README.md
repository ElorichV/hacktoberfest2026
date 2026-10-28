# GemmaBench: Medidor de Eficiencia Local con Gemma 4

Boceto funcional y tablero de demostración para medir la eficiencia de Gemma 4 corriendo en local (tokens/seg, latencia al primer token TTFT, consumo de VRAM y ahorro frente a APIs en la nube) alimentado con documentación técnica real.

## Arquitectura por Categorías (Estrategia Hackathon)

### Núcleo Principal (4 Pilares)
1. Gemma 4 (Local via Ollama): Motor central que ejecuta los benchmarks de inferencia y cuantización (`Q4_K_M`, `Q8_0`, `2B`, `9B`, `27B`).
2. Firecrawl: Extrae documentación real en Markdown desde cualquier URL técnica y arma automáticamente el set de prompts de prueba.
3. Dashboard UI (Base para Lovable): Interfaz limpia en tres pasos con métricas KPI en vivo, tabla comparativa por prompt y cajón de configuración de endpoints.
4. Open-Source (MLH Track): Repositorio estructurado con licencia MIT, `.env.example` sin secretos expuestos y modo demo sin dependencias externas.

### Integraciones Bonus (Si sobra tiempo)
5. ElevenLabs: Narra en voz alta el resumen ejecutivo del benchmark al terminar la corrida (incluye fallback automático a síntesis de voz del navegador para no fallar en el escenario).
6. MojoAuth / n8n: Acceso passwordless por Magic Link en la barra superior y disparo de webhook JSON hacia n8n para archivar el reporte.

## Cómo abrir el boceto

No requiere compilación ni llaves configuradas para una demostración inicial:

```bash
# Opción 1: Abrir directamente index.html en el navegador
start index.html

# Opción 2: Servir localmente con Python
python -m http.server 8080
```

Para conectar los servicios reales durante el hackathon, abre el panel desplegable "Configurar Conexiones Reales" al final del dashboard y desactiva el interruptor "Modo Demo (Sin APIs)".
