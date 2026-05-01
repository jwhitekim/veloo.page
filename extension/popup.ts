const SERVER = 'https://lab-toolkit.fly.dev';

const dropzone  = document.getElementById('dropzone')!;
const fileInput = document.getElementById('fileInput')! as HTMLInputElement;
const statusEl  = document.getElementById('status')!;
const resultEl  = document.getElementById('result')!;
const resetBar  = document.getElementById('resetBar')!;

interface PaperBasic {
  title?:         string;
  year?:          number;
  venue?:         string;
  citationCount?: number;
  doi?:           string;
  arxivId?:       string;
}

interface PaperAnalysis {
  keywords?:         string[];
  relevance?:        string;
  relevance_reason?: string;
  problem?:          string;
  method?:           string;
  conclusion?:       string;
}

interface PaperQuality {
  quartile?:      string;
  sjr?:           string;
  matched_title?: string;
}

interface PaperFigure {
  data:      string;
  caption?:  string;
  page?:     number;
}

interface PaperAuthor {
  name?:          string;
  authorId?:      string;
  hIndex?:        number;
  citationCount?: number;
  topPapers?:     { title?: string; citationCount?: number }[];
}

interface PaperData {
  basic:     PaperBasic;
  analysis?: PaperAnalysis;
  quality?:  PaperQuality;
  figures?:  PaperFigure[];
  authors?:  PaperAuthor[];
}

interface StorageResult {
  analyzing?: boolean;
  error?:     string;
  ok?:        boolean;
  data?:      PaperData;
}

// Restore previous result on popup open
chrome.storage.local.get('lastResult', ({ lastResult: saved }: { lastResult?: StorageResult }) => {
  if (!saved) return;
  if (saved.analyzing) {
    dropzone.style.display = 'none';
    setStatus('분석 중<span class="spinner"></span>', 'loading');
    pollResult();
  } else if (saved.error) {
    setStatus('❌ ' + saved.error, 'error');
  } else if (saved.ok && saved.data) {
    dropzone.style.display = 'none';
    setStatus('');
    resetBar.style.display = 'block';
    renderResult(saved.data);
  }
});

function pollResult(): void {
  const timer = setInterval(() => {
    chrome.storage.local.get('lastResult', ({ lastResult: saved }: { lastResult?: StorageResult }) => {
      if (!saved || saved.analyzing) return;
      clearInterval(timer);
      if (saved.error) {
        dropzone.style.display = '';
        setStatus('❌ ' + saved.error, 'error');
      } else if (saved.data) {
        dropzone.style.display = 'none';
        setStatus('');
        resetBar.style.display = 'block';
        renderResult(saved.data);
      }
    });
  }, 1500);
}

document.getElementById('resetBtn')!.addEventListener('click', () => {
  chrome.storage.local.remove('lastResult');
  dropzone.style.display  = '';
  resetBar.style.display  = 'none';
  resultEl.style.display  = 'none';
  resultEl.innerHTML      = '';
  setStatus('');
  fileInput.value = '';
});

document.getElementById('openWeb')!.addEventListener('click', () => {
  chrome.tabs.create({ url: `${SERVER}/paper` });
});

document.getElementById('browseBtn')!.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => {
  if (fileInput.files?.[0]) uploadFile(fileInput.files[0]);
});

dropzone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropzone.classList.add('over');
});
dropzone.addEventListener('dragleave', () => dropzone.classList.remove('over'));
dropzone.addEventListener('drop', (e: DragEvent) => {
  e.preventDefault();
  dropzone.classList.remove('over');
  const file = e.dataTransfer?.files[0];
  if (file?.type === 'application/pdf') {
    uploadFile(file);
  } else {
    setStatus('PDF 파일만 지원합니다.', 'error');
  }
});

async function uploadFile(file: File): Promise<void> {
  dropzone.style.display = 'none';
  resetBar.style.display = 'none';
  setStatus('분석 중<span class="spinner"></span>', 'loading');
  resultEl.style.display = 'none';
  resultEl.innerHTML     = '';

  const fileData = await fileToBase64(file);
  await chrome.storage.local.set({ lastResult: { analyzing: true } });
  chrome.runtime.sendMessage(
    { type: 'ANALYZE_PDF', fileData, fileName: file.name },
    (result: StorageResult) => {
      if (result.error) {
        dropzone.style.display = '';
        setStatus('❌ ' + result.error, 'error');
      } else if (result.data) {
        setStatus('');
        resetBar.style.display = 'block';
        renderResult(result.data);
      }
    },
  );
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload  = () => resolve((reader.result as string).split(',')[1]);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function setStatus(html: string, cls = ''): void {
  statusEl.innerHTML = html;
  statusEl.className = cls;
}

function esc(str: string | undefined | null): string {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function renderResult(data: PaperData): void {
  const { basic, analysis, quality, figures, authors } = data;
  const parts: string[] = [];

  const chips: string[] = [];
  if (basic.year)                chips.push(basic.year + '년');
  if (basic.venue)               chips.push(esc(basic.venue));
  if (basic.citationCount != null) chips.push(`인용 ${basic.citationCount}회`);

  const linksArr: string[] = [];
  if (basic.doi)     linksArr.push(`<a href="https://doi.org/${basic.doi}" target="_blank">DOI ↗</a>`);
  if (basic.arxivId) linksArr.push(`<a href="https://arxiv.org/abs/${basic.arxivId}" target="_blank">arXiv ↗</a>`);

  parts.push(`<div class="paper-title">${esc(basic.title) || '(제목 미추출)'}</div>`);
  if (chips.length)    parts.push(`<div class="meta-row">${chips.map(c => `<span class="meta-chip">${c}</span>`).join('')}</div>`);
  if (linksArr.length) parts.push(`<div class="meta-row">${linksArr.join('')}</div>`);

  if (quality?.quartile) {
    const qKey   = String(quality.quartile).trim().toLowerCase();
    const qClass = ['q1','q2','q3','q4'].includes(qKey) ? `q-${qKey}` : 'q-q4';
    const sjr    = quality.sjr ? quality.sjr.replace(',', '.') : '—';
    parts.push(`
      <div class="quality-row">
        <div class="q-badge ${qClass}">${esc(quality.quartile)}</div>
        <div class="q-info">
          <div class="q-title">${esc(quality.matched_title) || '—'}</div>
          <div class="q-sjr">SJR ${sjr}</div>
        </div>
      </div>`);
  }

  if (analysis) {
    const kwHtml = (analysis.keywords ?? []).map(k => `<span class="kw-tag">${esc(k)}</span>`).join('');
    if (kwHtml) parts.push(`<div class="kw-row">${kwHtml}</div>`);

    const relClass = analysis.relevance === '높음' ? 'rel-high'
      : analysis.relevance === '낮음' ? 'rel-low' : 'rel-mid';
    parts.push(`
      <div class="rel-banner ${relClass}">
        <span class="label">관련성 ${esc(analysis.relevance)}</span>
        <span>${esc(analysis.relevance_reason)}</span>
      </div>`);

    for (const item of [
      { cls: 'prob', label: '문제', text: analysis.problem },
      { cls: 'meth', label: '방법', text: analysis.method },
      { cls: 'conc', label: '결론', text: analysis.conclusion },
    ]) {
      parts.push(`
        <div class="acc-item ${item.cls}">
          <div class="acc-header"><span class="lbl">${item.label}</span></div>
          <div class="detail">${esc(item.text)}</div>
        </div>`);
    }
  }

  if (authors?.length) {
    parts.push(`<div class="sec-label">👤 저자</div>`);
    const currentTitle = (basic.title ?? '').toLowerCase();
    parts.push(authors.map(a => {
      const metaParts: string[] = [];
      if (a.hIndex != null)        metaParts.push(`h-index ${a.hIndex}`);
      if (a.citationCount != null) metaParts.push(`인용 ${a.citationCount.toLocaleString()}회`);
      const metaLine      = metaParts.length ? `<div class="author-meta">${metaParts.join(' · ')}</div>` : '';
      const s2Link        = a.authorId
        ? `<a class="author-link" href="https://www.semanticscholar.org/author/${a.authorId}" target="_blank">프로필 ↗</a>`
        : '';
      const paperItems    = (a.topPapers ?? []).map(p => {
        const isCurrent = p.title?.toLowerCase() === currentTitle;
        const titleHtml = isCurrent
          ? `<strong style="color:#B19CD9;">${esc(p.title)} ★</strong>`
          : esc(p.title);
        return `<li>${titleHtml} <span class="cite">· 인용 ${p.citationCount ?? '?'}회</span></li>`;
      }).join('');
      const papersSection = paperItems ? `<ul class="top-papers">${paperItems}</ul>` : '';
      return `<div class="author-item">
        <div class="author-head"><span class="author-name">${esc(a.name)}</span>${s2Link}</div>
        ${metaLine}${papersSection}
      </div>`;
    }).join(''));
  }

  if (figures?.length) {
    parts.push(`<div class="sec-label">📷 추출 이미지</div>`);
    parts.push(`<div class="figures-row">${figures.slice(0, 3).map(f => `
      <div class="fig-wrap">
        <img class="fig-thumb" src="${f.data}" title="p.${f.page}" onclick="this.requestFullscreen?.()">
        ${f.caption ? `<div class="fig-caption">${esc(f.caption)}</div>` : ''}
      </div>`).join('')}</div>`);
  }

  resultEl.innerHTML   = parts.join('');
  resultEl.style.display = 'block';
}

export {};
