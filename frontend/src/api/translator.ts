const BASE = '/translate'

export interface DictSense {
  pos: string
  level: string
  value: string
  exampleOri: string
  exampleTrans: string
}

export interface DictResult {
  query: string
  phonetic: string
  senses: DictSense[]
}

export async function naverDict(query: string): Promise<DictResult> {
  const res = await fetch(`${BASE}/api/naver-dict?query=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error('사전 오류')
  return res.json()
}
