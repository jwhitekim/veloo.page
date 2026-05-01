const SERVER = 'https://lab-toolkit.fly.dev';
let windowId: number | null = null;

chrome.action.onClicked.addListener(() => {
  if (windowId !== null) {
    chrome.windows.get(windowId, (win) => {
      if (chrome.runtime.lastError || !win) {
        openWindow();
      } else {
        chrome.windows.update(windowId!, { focused: true });
      }
    });
  } else {
    openWindow();
  }
});

function openWindow(): void {
  chrome.windows.create(
    { url: chrome.runtime.getURL('popup.html'), type: 'popup', width: 560, height: 820 },
    (win) => { if (win?.id != null) windowId = win.id; },
  );
}

chrome.windows.onRemoved.addListener((id) => {
  if (id === windowId) windowId = null;
});

interface AnalyzeMsg  { type: 'ANALYZE_PDF'; fileData: string; fileName: string }
interface GetMsg      { type: 'GET_RESULT' }
interface ClearMsg    { type: 'CLEAR_RESULT' }
type ExtMsg = AnalyzeMsg | GetMsg | ClearMsg;

interface StorageResult {
  ok?:        boolean;
  data?:      unknown;
  error?:     string;
  analyzing?: boolean;
}

chrome.runtime.onMessage.addListener((
  msg: ExtMsg,
  _sender,
  sendResponse: (r: unknown) => void,
) => {
  if (msg.type === 'ANALYZE_PDF') {
    analyzePdf(msg.fileData, msg.fileName).then(sendResponse);
    return true;
  }
  if (msg.type === 'GET_RESULT') {
    chrome.storage.local.get('lastResult', (data) => sendResponse(data['lastResult'] ?? null));
    return true;
  }
  if (msg.type === 'CLEAR_RESULT') {
    chrome.storage.local.remove('lastResult');
  }
});

async function analyzePdf(fileData: string, fileName: string): Promise<StorageResult> {
  try {
    const blob = base64ToBlob(fileData, 'application/pdf');
    const fd = new FormData();
    fd.append('file', blob, fileName);

    const res  = await fetch(`${SERVER}/paper/analyze-pdf`, { method: 'POST', body: fd });
    const data = await res.json() as { error?: string };

    const result: StorageResult = data.error ? { error: data.error } : { ok: true, data };
    await chrome.storage.local.set({ lastResult: result });
    return result;
  } catch {
    const result: StorageResult = { error: '서버 연결 실패 — 서버가 실행 중인지 확인하세요.' };
    await chrome.storage.local.set({ lastResult: result });
    return result;
  }
}

function base64ToBlob(b64: string, mime: string): Blob {
  const bytes = atob(b64);
  const arr   = new Uint8Array(bytes.length);
  for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

export {};
