import os
from pathlib import Path
from typing import Any, Dict

import httpx


def _load_local_env() -> None:
    env_file = Path(__file__).with_name(".env")
    if not env_file.exists():
        return
    for raw_line in env_file.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()
        if line and not line.startswith("#") and "=" in line:
            key, value = line.split("=", 1)
            os.environ.setdefault(key.strip(), value.strip().strip("\"'"))


_load_local_env()
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.0-flash").strip()


async def explain_forecast(forecast: Dict[str, Any]) -> Dict[str, Any]:
    """Explain verified railway facts without inventing live train information."""
    if not GEMINI_API_KEY:
        return {
            "available": False,
            "explanation": "AI explanation is not configured. The numbers above come from SETU's railway data and prediction engine.",
            "source": "SETU",
        }

    prompt = (
        "Explain this train update for a five-year-old in 2 short sentences. "
        "Only use the supplied facts. Do not claim the data is live unless data_is_live is true. "
        "Mention the next station and delay clearly. Do not give safety-critical advice.\n\n"
        f"Train update: {forecast}"
    )
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{GEMINI_MODEL}:generateContent"
    )
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            response = await client.post(
                url,
                params={"key": GEMINI_API_KEY},
                json={"contents": [{"parts": [{"text": prompt}]}]},
            )
        if response.status_code != 200:
            return {
                "available": False,
                "explanation": "AI explanation is temporarily unavailable. The railway facts are still shown above.",
                "source": "SETU",
                "error": f"Gemini returned HTTP {response.status_code}",
            }
        payload = response.json()
        text = (
            payload.get("candidates", [{}])[0]
            .get("content", {})
            .get("parts", [{}])[0]
            .get("text", "")
            .strip()
        )
        if not text:
            return {
                "available": False,
                "explanation": "AI did not return an explanation. The railway facts are still shown above.",
                "source": "SETU",
            }
        return {"available": True, "explanation": text, "source": "Gemini"}
    except httpx.HTTPError as error:
        return {
            "available": False,
            "explanation": "AI explanation is temporarily unavailable. The railway facts are still shown above.",
            "source": "SETU",
            "error": str(error),
        }
