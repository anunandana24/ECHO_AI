import numpy as np
import soundfile as sf
from kokoro import KPipeline

kokoro_pipeline = KPipeline(lang_code="a")

KOKORO_VOICE = "af_heart"
SAMPLE_RATE = 24000


def text_to_speech(text: str, output_path: str) -> str:
    text = (text or "").strip()

    if not text:
        raise ValueError("There is no text to speak.")

    chunks = []

    for _graphemes, _phonemes, audio_chunk in kokoro_pipeline(
        text,
        voice=KOKORO_VOICE,
    ):
        chunks.append(np.asarray(audio_chunk, dtype=np.float32))

    if not chunks:
        raise RuntimeError("Kokoro did not generate audio.")

    audio = np.concatenate(chunks)
    sf.write(output_path, audio, SAMPLE_RATE)

    return output_path