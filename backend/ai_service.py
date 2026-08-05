import os
import httpx

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

SYSTEM_PROMPT = (
    "You are Cupid AI, a sweet, smart, and encouraging study buddy inside a private study room "
    "for a couple. Keep responses concise, clear, helpful, and warmly supportive."
)

async def generate_ai_response(prompt: str) -> str:
    """
    Checks for Groq API key first (used in cloud deployment).
    Fallback to local Ollama instance (used in local development).
    """
    # Uses environment variable or falls back directly to your Groq API key
    groq_api_key = os.getenv("GROQ_API_KEY", "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")

    # 1. Try Groq Cloud API first if API key exists
    if groq_api_key:
        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                response = await client.post(
                    "https://api.groq.com/openai/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {groq_api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "llama-3.3-70b-versatile",
                        "messages": [
                            {"role": "system", "content": SYSTEM_PROMPT},
                            {"role": "user", "content": prompt},
                        ],
                        "temperature": 0.7,
                        "max_tokens": 500,
                    },
                )
                if response.status_code == 200:
                    data = response.json()
                    return data["choices"][0]["message"]["content"]
        except Exception as e:
            print(f"[AI Service] Groq error, falling back to Ollama: {e}")

    # 2. Local Ollama Fallback
    try:
        async with httpx.AsyncClient(timeout=30.0) as client:
            response = await client.post(
                f"{OLLAMA_BASE_URL}/api/generate",
                json={
                    "model": "mistral",
                    "prompt": f"{SYSTEM_PROMPT}\n\nUser Question: {prompt}\nAnswer:",
                    "stream": False,
                },
            )
            if response.status_code == 200:
                data = response.json()
                return data.get("response", "Sorry, I couldn't process that.")
    except Exception as e:
        print(f"[AI Service] Ollama error: {e}")

    return "⚠️ Couldn't reach AI service (Groq or Ollama)."