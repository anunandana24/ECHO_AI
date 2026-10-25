

import { useEffect, useRef, useState } from 'react'
import { askQuestion, speakText, transcribeAudio } from './api'
import './App.css'

export default function App() {
  const [mode, setMode] = useState('text')
  const [question, setQuestion] = useState('')
  const [transcript, setTranscript] = useState('')
  const [answer, setAnswer] = useState('')
  const [audioUrl, setAudioUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [recording, setRecording] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('Ready when you are.')

  const questionInputRef = useRef(null)
  const mediaRecorderRef = useRef(null)
  const streamRef = useRef(null)
  const chunksRef = useRef([])
  const audioUrlRef = useRef('')

  useEffect(() => {
    return () => {
      streamRef.current?.getTracks().forEach((track) => track.stop())

      if (audioUrlRef.current) {
        URL.revokeObjectURL(audioUrlRef.current)
      }
    }
  }, [])

  function clearResult() {
    setAnswer('')
    setTranscript('')
    setError('')
    setStatus('Ready when you are.')

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
      audioUrlRef.current = ''
    }

    setAudioUrl('')
  }

  async function generateAudio(text) {
    const url = await speakText(text)

    if (audioUrlRef.current) {
      URL.revokeObjectURL(audioUrlRef.current)
    }

    audioUrlRef.current = url
    setAudioUrl(url)
  }

  async function submitQuestion(event) {
    event?.preventDefault()

    const currentQuestion = question.trim()

    if (!currentQuestion || loading) return

    setLoading(true)
    clearResult()
    setStatus('Thinking with Ollama…')

    try {
      const result = await askQuestion(currentQuestion)

      setAnswer(result.answer)
      setStatus('Generating speech with Kokoro…')

      await generateAudio(result.answer)

      setStatus('Your response is ready.')
    } catch (err) {
      setError(err.message || 'Something went wrong.')
      setStatus('Something needs your attention.')
    } finally {
      setLoading(false)
    }
  }

  async function handleAudioFile(file) {
    if (!file || loading) return

    if (file.size > 20 * 1024 * 1024) {
      setError('Please choose an audio file smaller than 20 MB.')
      return
    }

    setLoading(true)
    clearResult()
    setStatus('Transcribing your audio with Whisper…')

    try {
      const result = await transcribeAudio(file)
      const recognizedText = result.transcript?.trim()

      if (!recognizedText) {
        throw new Error('No speech was recognized. Please try again.')
      }

      setTranscript(recognizedText)
      setStatus('Generating your answer with Ollama…')

      const answerResult = await askQuestion(recognizedText)

      setAnswer(answerResult.answer)
      setStatus('Generating speech with Kokoro…')

      await generateAudio(answerResult.answer)

      setStatus('Your voice response is ready.')
    } catch (err) {
      setError(err.message || 'Audio processing failed.')
      setStatus('Something needs your attention.')
    } finally {
      setLoading(false)
    }
  }

  async function startRecording() {
    if (loading || recording) return

    if (
      !navigator.mediaDevices?.getUserMedia ||
      !window.MediaRecorder
    ) {
      setError(
        'Audio recording is not supported in this browser. Try uploading an audio file instead.',
      )
      return
    }

    try {
      clearResult()

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      })

      streamRef.current = stream

      const supportedTypes = [
        'audio/webm;codecs=opus',
        'audio/webm',
        'audio/mp4',
      ]

      const mimeType = supportedTypes.find((type) =>
        MediaRecorder.isTypeSupported(type),
      )

      const recorder = mimeType
        ? new MediaRecorder(stream, { mimeType })
        : new MediaRecorder(stream)

      mediaRecorderRef.current = recorder
      chunksRef.current = []

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data)
        }
      }

      recorder.onerror = () => {
        setError('Recording failed. Please try again.')
        setRecording(false)

        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null
      }

      recorder.onstop = async () => {
        stream.getTracks().forEach((track) => track.stop())
        streamRef.current = null

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/webm',
        })

        if (!blob.size) {
          setError('The recording was empty. Please try again.')
          setStatus('Ready when you are.')
          return
        }

        const extension = blob.type.includes('mp4') ? 'mp4' : 'webm'

        const file = new File(
          [blob],
          `recording.${extension}`,
          { type: blob.type },
        )

        await handleAudioFile(file)
      }

      recorder.start()
      setRecording(true)
      setStatus('Listening… speak, then stop when finished.')
    } catch (err) {
      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null

      setError(
        err.name === 'NotAllowedError'
          ? 'Microphone permission was denied. Allow microphone access in your browser.'
          : err.message || 'Could not access your microphone.',
      )

      setStatus('Ready when you are.')
    }
  }

  function stopRecording() {
    const recorder = mediaRecorderRef.current

    if (recorder && recorder.state !== 'inactive') {
      setRecording(false)
      setStatus('Processing your recording…')
      recorder.stop()
    }
  }

  function askAnotherQuestion() {
    if (recording) {
      stopRecording()
    }

    clearResult()
    setQuestion('')

    if (mode === 'text') {
      requestAnimationFrame(() => {
        questionInputRef.current?.focus()
      })
    } else {
      setStatus('Ready to record your next question.')
    }
  }

  function changeMode(nextMode) {
    if (loading) return

    if (recording) {
      const recorder = mediaRecorderRef.current

      if (recorder && recorder.state !== 'inactive') {
        recorder.onstop = null
        recorder.stop()
      }

      streamRef.current?.getTracks().forEach((track) => track.stop())
      streamRef.current = null
      setRecording(false)
    }

    setMode(nextMode)
    setQuestion('')
    clearResult()
  }

  return (
    <main className="app-shell">
      <header className="topbar">
        <a
          className="brand"
          href="#"
          aria-label="ECHOAI home"
          onClick={(event) => {
            event.preventDefault()
            askAnotherQuestion()
          }}
        >
          <span className="brand-mark">E</span>
          <span>
            ECHO<span className="brand-light">AI</span>
          </span>
        </a>

        <span className="connection">
          <span />
          Local AI workspace
        </span>
      </header>

      <section className="hero">
        <div className="eyebrow">
          <span />
          YOUR PERSONAL AI VOICE ASSISTANT
        </div>

        <h1>
          Intelligence that
          <br />
          <span>speaks your language.</span>
        </h1>

        <p>
          Ask anything, speak naturally, and listen to your answers.
          <br className="desktop-break" />
          Powered by local AI models running on your machine.
        </p>
      </section>

      <section className="workspace">
        <div
          className="mode-tabs"
          role="tablist"
          aria-label="Assistant mode"
        >
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'text'}
            className={mode === 'text' ? 'mode-tab active' : 'mode-tab'}
            onClick={() => changeMode('text')}
            disabled={loading}
          >
            <span className="tab-icon">Aa</span>
            <span>
              <strong>Text to Speech</strong>
              <small>Type a question</small>
            </span>
          </button>

          <button
            type="button"
            role="tab"
            aria-selected={mode === 'voice'}
            className={mode === 'voice' ? 'mode-tab active' : 'mode-tab'}
            onClick={() => changeMode('voice')}
            disabled={loading}
          >
            <span className="tab-icon">◉</span>
            <span>
              <strong>Voice Assistant</strong>
              <small>Talk to ECHOAI</small>
            </span>
          </button>
        </div>

        <div className="panel">
          {mode === 'text' ? (
            <form onSubmit={submitQuestion}>
              <label className="field-label" htmlFor="question">
                WHAT WOULD YOU LIKE TO KNOW?
              </label>

              <textarea
                ref={questionInputRef}
                id="question"
                value={question}
                onChange={(event) => setQuestion(event.target.value)}
                placeholder="Ask me anything…"
                rows={4}
                disabled={loading}
              />

              <div className="input-footer">
                <span>{question.length} characters</span>

                <button
                  className="primary-button"
                  type="submit"
                  disabled={loading || !question.trim()}
                >
                  {loading ? (
                    <>
                      <span className="spinner" />
                      Working…
                    </>
                  ) : (
                    <>
                      Generate answer <span>↗</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          ) : (
            <div className="voice-panel">
              <span className="field-label">VOICE INPUT</span>

              <div className={recording ? 'mic-orb recording' : 'mic-orb'}>
                <span className="mic-symbol">🎙</span>
              </div>

              <h2>{recording ? 'I’m listening…' : 'Speak your mind'}</h2>

              <p>
                {recording
                  ? 'Speak clearly, then stop when you are done.'
                  : 'Record a question and I’ll transcribe, answer, and speak it back.'}
              </p>

              {!recording ? (
                <button
                  className="primary-button record-button"
                  type="button"
                  disabled={loading}
                  onClick={startRecording}
                >
                  <span>●</span> Start recording
                </button>
              ) : (
                <button
                  className="stop-button"
                  type="button"
                  onClick={stopRecording}
                >
                  ■ Stop and process
                </button>
              )}

              <p className="privacy-note">
                Your recording is processed by your local backend.
              </p>

              <div className="upload-divider">
                <span>OR UPLOAD AN AUDIO FILE</span>
              </div>

              <input
                className="file-input"
                type="file"
                accept="audio/*,.webm,.wav,.mp3,.m4a,.ogg,.flac"
                disabled={loading || recording}
                onChange={(event) => {
                  const file = event.target.files?.[0]

                  if (file) {
                    handleAudioFile(file)
                  }

                  event.target.value = ''
                }}
              />
            </div>
          )}

          <div className="status-line" aria-live="polite">
            <span className={loading ? 'status-dot busy' : 'status-dot'} />
            {status}
          </div>

          {error && (
            <div className="error-box" role="alert">
              {error}
            </div>
          )}

          {transcript && (
            <section className="result-section">
              <div className="result-heading">
                <span>01</span>
                <h3>What I heard</h3>
              </div>

              <div className="result-card transcript-card">
                {transcript}
              </div>
            </section>
          )}

          {answer && (
            <section className="result-section">
              <div className="result-heading">
                <span>{transcript ? '02' : '01'}</span>
                <h3>AI response</h3>
              </div>

              <div className="result-card">
                <p className="answer-text">{answer}</p>

                {audioUrl ? (
                  <div className="audio-player">
                    <span className="audio-icon">♫</span>
                    <audio controls src={audioUrl}>
                      Your browser does not support audio playback.
                    </audio>
                  </div>
                ) : loading ? (
                  <p className="audio-pending">
                    <span className="spinner" />
                    Preparing audio…
                  </p>
                ) : null}
              </div>
            </section>
          )}

          {answer && !loading && (
            <div className="next-question">
              <button
                type="button"
                className="primary-button"
                onClick={askAnotherQuestion}
              >
                + Ask another question
              </button>
            </div>
          )}
        </div>
      </section>

      <footer className="footer">
        <span>BUILT WITH LOCAL AI</span>
        <div>
          <span>Whisper</span>
          <i />
          <span>Ollama</span>
          <i />
          <span>Kokoro</span>
        </div>
      </footer>
    </main>
  )
}
