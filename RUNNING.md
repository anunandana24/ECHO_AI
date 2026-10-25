# ECHO_AI — How to Run the Project

## Prerequisites

Make sure you have the following installed:

- Python 3.11
- Node.js and npm
- Ollama
- The Ollama model `qwen2.5:1.5b`

Project location:

`C:\Users\anuna\OneDrive\Desktop\PYSPIDERS\ECHO_AI`

---

## Step 1: Start Ollama

Open PowerShell and check that the model is available:

```powershell
ollama list
```

Make sure `qwen2.5:1.5b` appears in the list.

If Ollama is not running, start the Ollama application or run:

```powershell
ollama serve
```

If it says the server is already running, that is fine.

---

## Step 2: Start the Backend

Open a new PowerShell terminal and run:

```powershell
cd C:\Users\anuna\OneDrive\Desktop\PYSPIDERS\ECHO_AI\backend
```

Activate the existing virtual environment:

```powershell
..\.venv311\Scripts\Activate.ps1
```

Start FastAPI:

```powershell
python -m uvicorn main:app
```

Wait until you see:

`Application startup complete.`

Keep this terminal open.

Backend URL: http://127.0.0.1:8000

API documentation: http://127.0.0.1:8000/docs

Health check: http://127.0.0.1:8000/api/health

---

## Step 3: Start the Frontend

Open another PowerShell terminal and run:

```powershell
cd C:\Users\anuna\OneDrive\Desktop\PYSPIDERS\ECHO_AI\frontend
```

Start Vite:

```powershell
npm run dev
```

Wait until the terminal shows a local URL, usually:

`http://localhost:5173/`

Keep this terminal open.

---

## Step 4: Open ECHO_AI

Open this URL in your browser:

http://localhost:5173/

You can now use:

- **Text to Speech:** Enter a question, receive an AI answer, and listen to the generated speech.
- **Voice Assistant:** Record or upload audio, view the transcription, receive an answer, and listen to the spoken response.

The backend and Ollama must be running for the AI features to work.

---

## Step 5: Shut Down

When finished:

1. Press `Ctrl + C` in the frontend terminal.
2. Press `Ctrl + C` in the backend terminal.
3. Close Ollama only if you no longer need it.

You can start the project again anytime by following Steps 1–4.

---

## Troubleshooting

**Backend import error:** Make sure you activated the correct `.venv311` environment and are running the command from the `backend` folder.

**Frontend dependencies missing:** Run `npm install` inside `frontend`.

**Ollama connection error:** Make sure Ollama is running and `qwen2.5:1.5b` is available.

**Microphone not working:** Allow microphone access in your browser.

**First startup is slow:** Whisper and Kokoro may need to load their models. The first run can take longer than subsequent runs.

**Important:** This is a local development setup. The website is not publicly deployed.
