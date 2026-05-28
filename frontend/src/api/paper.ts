const BASE = '/paper'

export interface Candidate {
  paperId: string
  title: string
  year: number
  venue: string
  citationCount: number
}

export interface PaperResult {
  basic: { title: string; year: number; venue: string; doi: string; arxivId: string; citationCount: number }
  analysis: {
    relevance: string; relevance_reason: string; keywords: string[]
    problem: string; problem_short: string
    method: string; method_short: string
    conclusion: string; conclusion_short: string
  }
  authors: { name: string; authorId: string; hIndex: number; citationCount: number; topPapers: { title: string; citationCount: number }[] }[]
  quality: { quartile: string; matched_title: string; sjr: string; type: string; country: string } | null
}

async function checkRes(res: Response, label: string): Promise<void> {
  if (res.ok) return
  if (res.status === 401) {
    window.location.href = '/login'
    throw new Error('세션이 만료됐습니다. 다시 로그인해주세요.')
  }
  let detail = ''
  try {
    const body = await res.json()
    detail = body?.error ?? JSON.stringify(body)
  } catch {
    detail = await res.text().catch(() => '')
  }
  throw new Error(`${label} (${res.status})${detail ? ': ' + detail : ''}`)
}

export async function search(query: string): Promise<{ type: string; query?: string; data?: Candidate[]; error?: string }> {
  const fd = new FormData()
  fd.append('query', query)
  const res = await fetch(`${BASE}/search`, { method: 'POST', body: fd })
  await checkRes(res, '검색 오류')
  return res.json()
}

export async function analyzeById(paperId: string): Promise<PaperResult> {
  const fd = new FormData()
  fd.append('paper_id', paperId)
  const res = await fetch(`${BASE}/analyze`, { method: 'POST', body: fd })
  await checkRes(res, '분석 오류')
  return res.json()
}

export async function analyzeByUrl(url: string): Promise<PaperResult> {
  const fd = new FormData()
  fd.append('url', url)
  const res = await fetch(`${BASE}/analyze`, { method: 'POST', body: fd })
  await checkRes(res, '분석 오류')
  return res.json()
}

export async function analyzePdf(file: File): Promise<PaperResult & { figures: unknown[] }> {
  const fd = new FormData()
  fd.append('file', file)
  const res = await fetch(`${BASE}/analyze-pdf`, { method: 'POST', body: fd })
  await checkRes(res, 'PDF 분석 오류')
  return res.json()
}

export interface PaperHistoryItem {
  id: number
  title: string
  paper_id: string | null
  query: string | null
  created_at: string
  result: PaperResult
}

export async function getHistory(): Promise<PaperHistoryItem[]> {
  try {
    const res = await fetch(`${BASE}/history`)
    if (!res.ok) return []
    const data = await res.json()
    return data.items ?? []
  } catch {
    return []
  }
}
