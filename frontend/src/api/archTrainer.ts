const BASE = '/arch-trainer'

export async function explain(image: File): Promise<{ session_id: string; explanation: string }> {
  const fd = new FormData()
  fd.append('image', image)
  const res = await fetch(`${BASE}/api/explain`, { method: 'POST', body: fd })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data
}

export async function feedback(sessionId: string, userExplanation: string): Promise<{ feedback: string }> {
  const res = await fetch(`${BASE}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id: sessionId, user_explanation: userExplanation }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data
}
