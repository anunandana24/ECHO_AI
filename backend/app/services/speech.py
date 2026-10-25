from faster_whisper import WhisperModel

whisper_model = WhisperModel(
    "small",
    device="cpu",
    compute_type="int8",
)


def transcribe_audio(audio_path: str) -> str:
    segments, _info = whisper_model.transcribe(
        audio_path,
        beam_size=1,
        vad_filter=True,
    )

    return " ".join(
        segment.text.strip()
        for segment in segments
    ).strip()