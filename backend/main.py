
import os
import tempfile
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel

from app.services.assistant import ask_ollama
from app.services.speech import transcribe_audio
from app.services.voice import text_to_speech


app = FastAPI(title="ECHO_AI API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

TEMP_DIR = Path(tempfile.gettempdir()) / "echo_ai_audio"
TEMP_DIR.mkdir(parents=True, exist_ok=True)

ALLOWED_EXTENSIONS = {
    ".wav", ".mp3", ".m4a", ".flac", ".ogg", ".webm", ".mp4"
}

MAX_FILE_SIZE = 20 * 1024 * 1024


class QuestionRequest(BaseModel):
    question: str


@app.get("/api/health")
def health():
    return {"status": "ok", "app": "ECHO_AI"}


@app.post("/api/ask")
def ask_question(request: QuestionRequest):
    question = request.question.strip()

    if not question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    try:
        answer = ask_ollama(question)
        return {"question": question, "answer": answer}
    except Exception as exc:
        raise HTTPException(
            status_code=502,
            detail=f"Could not generate an answer. Check that Ollama is running. {exc}",
        )


@app.post("/api/transcribe")
async def transcribe(file: UploadFile = File(...)):
    suffix = Path(file.filename or "recording.wav").suffix.lower()

    if suffix not in ALLOWED_EXTENSIONS:
        raise HTTPException(status_code=400, detail="Unsupported audio format.")

    content = await file.read()

    if not content:
        raise HTTPException(status_code=400, detail="The uploaded audio is empty.")

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(status_code=413, detail="Audio must be 20 MB or smaller.")

    temp_path = None 

    try:
        with tempfile.NamedTemporaryFile(
            suffix=suffix, delete=False, dir=TEMP_DIR
        ) as temp_file:
            temp_file.write(content)
            temp_path = temp_file.name

        transcript = transcribe_audio(temp_path)

        if not transcript:
            raise HTTPException(
                status_code=422,
                detail="No speech was recognized. Please try recording again.",
            )

        return {"transcript": transcript}

    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail=f"Audio transcription failed: {exc}",
        )
    finally:
        if temp_path and os.path.exists(temp_path):
            os.remove(temp_path)


@app.post("/api/speak")
def speak(request: QuestionRequest):
    text = request.question.strip()

    if not text:
        raise HTTPException(status_code=400, detail="Text cannot be empty.")

    output_path = TEMP_DIR / f"{next(tempfile._get_candidate_names())}.wav"

    try:
        text_to_speech(text, str(output_path))

        return FileResponse(
            path=output_path,
            media_type="audio/wav",
            filename="echo_ai_response.wav",
            background=None,
        )
    except Exception as exc:
        if output_path.exists():
            output_path.unlink()

        raise HTTPException(
            status_code=500,
            detail=f"Speech generation failed: {exc}",
        )
