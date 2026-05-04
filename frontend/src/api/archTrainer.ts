const BASE = '/arch-trainer'

export interface ExplanationJSON {
  overview: string
  modules: string
  data_flow: string
  contribution: string
}

export interface FeedbackJSON {
  correct: string
  missing: string
  suggestion: string
}

export async function explain(image: File): Promise<{ explanation: ExplanationJSON }> {
  const fd = new FormData()
  fd.append('image', image)
  const res = await fetch(`${BASE}/api/explain`, { method: 'POST', body: fd })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data
}

export async function feedback(aiExplanation: ExplanationJSON, userExplanation: string): Promise<{ feedback: FeedbackJSON }> {
  const res = await fetch(`${BASE}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ai_explanation: aiExplanation, user_explanation: userExplanation }),
  })
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data
}
