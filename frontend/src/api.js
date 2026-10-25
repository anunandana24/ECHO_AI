
const API_BASE = 'http://127.0.0.1:8000/api'

async function handleResponse(response) {
  const data = await response.json().catch(() => ({}))

  if (!response.ok) {
    throw new Error(data.detail || 'Something went wrong.')
  }

  return data
}

export async function askQuestion(question) {
  const response = await fetch(`${API_BASE}/ask`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question }),
  })

  return handleResponse(response)
}

export async function transcribeAudio(audioFile) {
  const formData = new FormData()
  formData.append('file', audioFile)

  const response = await fetch(`${API_BASE}/transcribe`, {
    method: 'POST',
    body: formData,
  })

  return handleResponse(response)
}

export async function speakText(text) {
  const response = await fetch(`${API_BASE}/speak`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ question: text }),
  })

  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.detail || 'Could not generate audio.')
  }

  return URL.createObjectURL(await response.blob())
}
