const BASE = '/translate'

export interface TranslateResult {
  translation: string
  explanation?: string
  related?: string[]
}

export interface DictEntry {
  entry: string
  phonetic: string
  senses: { pos: string; value: string; exampleOri: string; exampleTrans: string }[]
}

export async function translate(text: string): Promise<TranslateResult> {
  const res = await fetch(`${BASE}/api/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  })
  if (!res.ok) throw new Error(`번역 오류 (${res.status})`)
  return res.json()
}

export async function naverDict(query: string): Promise<{ query: string; results: DictEntry[] }> {
  const res = await fetch(`${BASE}/api/naver-dict?query=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error('사전 오류')
  return res.json()
}
