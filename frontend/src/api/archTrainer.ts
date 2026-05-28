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

export interface ArchHistoryItem {
  id: number
  image_name: string | null
  explanation: ExplanationJSON
  created_at: string
}

export async function explain(image: File): Promise<{ explanation: ExplanationJSON; history_id: number | null }> {
  const fd = new FormData()
  fd.append('image', image)
  const res = await fetch(`${BASE}/api/explain`, { method: 'POST', body: fd })
  if (!res.ok) throw new Error(`설명 오류 (${res.status})`)
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data
}

export async function feedback(
  aiExplanation: ExplanationJSON,
  userExplanation: string,
  historyId?: number | null,
): Promise<{ feedback: FeedbackJSON }> {
  const res = await fetch(`${BASE}/api/feedback`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      ai_explanation: aiExplanation,
      user_explanation: userExplanation,
      history_id: historyId ?? null,
    }),
  })
  if (!res.ok) throw new Error(`피드백 오류 (${res.status})`)
  const data = await res.json()
  if (data.error) throw new Error(data.error)
  return data
}

export async function getArchHistory(): Promise<ArchHistoryItem[]> {
  try {
    const res = await fetch(`${BASE}/api/history`)
    if (!res.ok) return []
    const data = await res.json()
    return data.items ?? []
  } catch {
    return []
  }
}
