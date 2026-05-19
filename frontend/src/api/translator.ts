const BASE = '/translate'

export interface DictDefinition {
  pos: string
  level: string
  value: string
}

export interface DictExample {
  pos: string
  ori: string
  trans: string
}

export interface DictResult {
  query: string
  phonetic: string
  definitions: DictDefinition[]
  examples: DictExample[]
}

export async function naverDict(query: string): Promise<DictResult> {
  const res = await fetch(`${BASE}/api/naver-dict?query=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error('사전 오류')
  return res.json()
}
