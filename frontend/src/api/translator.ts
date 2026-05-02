const BASE = '/translate'

export interface DictEntry {
  entry: string
  phonetic: string
  senses: { pos: string; value: string; exampleOri: string; exampleTrans: string }[]
}

export async function naverDict(query: string): Promise<{ query: string; results: DictEntry[] }> {
  const res = await fetch(`${BASE}/api/naver-dict?query=${encodeURIComponent(query)}`)
  if (!res.ok) throw new Error('사전 오류')
  return res.json()
}
