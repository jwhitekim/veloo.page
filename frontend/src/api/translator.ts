const BASE = '/translate'

export interface DictDefinition {
  pos: string
  level: string
  value: string
  exampleOri?: string
  exampleTrans?: string
}

export interface DictExample {
  pos: string
  ori: string
  trans: string
}

export interface DictResult {
  query: string
  phonetic?: string
  audioUrl?: string
  definitions?: DictDefinition[]
  examples?: DictExample[]
  synonyms?: string[]
}

export async function naverDict(query: string): Promise<DictResult> {
  const res = await fetch(`${BASE}/api/naver-dict?query=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error('사전 오류')
  return res.json()
}

export interface TranslationHistoryItem {
  id: number
  source_text: string
  translated_text: string
  type: 'word' | 'sentence'
  created_at: string
}

export async function getTranslationHistory(): Promise<TranslationHistoryItem[]> {
  try {
    const res = await fetch(`${BASE}/api/history`)
    if (!res.ok) return []
    const data = await res.json()
    return data.items ?? []
  } catch {
    return []
  }
}
