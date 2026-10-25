import requests

OLLAMA_URL = "http://localhost:11434"
OLLAMA_MODEL = "qwen2.5:1.5b"


def ask_ollama(question: str) -> str:
    question = (question or "").strip()

    if not question:
        raise ValueError("Please enter a question.")

    response = requests.post(
        f"{OLLAMA_URL}/api/chat",
        json={
            "model": OLLAMA_MODEL,
            "messages": [
                {
                    "role": "system",
                    "content": (
                        "You are EchoAI, a helpful voice assistant. "
                        "Answer clearly and concisely in 2-3 sentences."
                    ),
                },
                {"role": "user", "content": question},
            ],
            "stream": False,
            "options": {"num_predict": 100},
        },
        timeout=180,
    )

    response.raise_for_status()
    return response.json()["message"]["content"].strip()