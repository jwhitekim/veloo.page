const SERVER = 'https://lab-toolkit.fly.dev';
let windowId = null;
chrome.action.onClicked.addListener(() => {
    if (windowId !== null) {
        chrome.windows.get(windowId, (win) => {
            if (chrome.runtime.lastError || !win) {
                openWindow();
            }
            else {
                chrome.windows.update(windowId, { focused: true });
            }
        });
    }
    else {
        openWindow();
    }
});
function openWindow() {
    chrome.windows.create({ url: chrome.runtime.getURL('popup.html'), type: 'popup', width: 560, height: 820 }, (win) => { if (win?.id != null)
        windowId = win.id; });
}
chrome.windows.onRemoved.addListener((id) => {
    if (id === windowId)
        windowId = null;
});
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
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
async function analyzePdf(fileData, fileName) {
    try {
        const blob = base64ToBlob(fileData, 'application/pdf');
        const fd = new FormData();
        fd.append('file', blob, fileName);
        const res = await fetch(`${SERVER}/paper/analyze-pdf`, { method: 'POST', body: fd });
        const data = await res.json();
        const result = data.error ? { error: data.error } : { ok: true, data };
        await chrome.storage.local.set({ lastResult: result });
        return result;
    }
    catch {
        const result = { error: '서버 연결 실패 — 서버가 실행 중인지 확인하세요.' };
        await chrome.storage.local.set({ lastResult: result });
        return result;
    }
}
function base64ToBlob(b64, mime) {
    const bytes = atob(b64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++)
        arr[i] = bytes.charCodeAt(i);
    return new Blob([arr], { type: mime });
}
export {};
