// StreamPulse Chrome Extension - Background Service Worker
const API_URL = 'http://127.0.0.1:3001/api';

let currentLanguage = 'tr';

function getMenuTitles(lang) {
  if (lang === 'en') {
    return {
      root: '⚡ Download with StreamPulse',
      mp3: '🎵 Download 320kbps MP3 (Studio Quality)',
      video: '🎬 Download 4K / 1080p Video (Lossless)',
      queue: '📋 Add to StreamPulse Queue',
      shazam: '🎵 Recognize Music in this Tab',
    };
  }
  return {
    root: '⚡ StreamPulse ile İndir',
    mp3: '🎵 320kbps MP3 İndir (Stüdyo Kalite)',
    video: '🎬 4K / 1080p Video İndir (Kayıpsız)',
    queue: '📋 StreamPulse Kuyruğuna Ekle',
    shazam: '🎵 Bu Sekmedeki Müziği Tanı (Shazam)',
  };
}

function updateContextMenus(lang) {
  currentLanguage = lang;
  const titles = getMenuTitles(lang);
  try {
    chrome.contextMenus.update('streampulse_root', { title: titles.root });
    chrome.contextMenus.update('streampulse_mp3', { title: titles.mp3 });
    chrome.contextMenus.update('streampulse_video', { title: titles.video });
    chrome.contextMenus.update('streampulse_queue', { title: titles.queue });
    chrome.contextMenus.update('streampulse_shazam', { title: titles.shazam });
  } catch (e) {}
}

// 1. Initialize Context Menus on Installation
chrome.runtime.onInstalled.addListener(async () => {
  const titles = getMenuTitles(currentLanguage);

  chrome.contextMenus.create({
    id: 'streampulse_root',
    title: titles.root,
    contexts: ['page', 'link', 'video', 'audio'],
    documentUrlPatterns: [
      '*://*.youtube.com/*',
      '*://music.youtube.com/*',
      '*://youtube.com/*'
    ]
  });

  chrome.contextMenus.create({
    parentId: 'streampulse_root',
    id: 'streampulse_mp3',
    title: titles.mp3,
    contexts: ['page', 'link', 'video', 'audio']
  });

  chrome.contextMenus.create({
    parentId: 'streampulse_root',
    id: 'streampulse_video',
    title: titles.video,
    contexts: ['page', 'link', 'video', 'audio']
  });

  chrome.contextMenus.create({
    parentId: 'streampulse_root',
    id: 'streampulse_queue',
    title: titles.queue,
    contexts: ['page', 'link', 'video', 'audio']
  });

  // Universal Shazam Music Identifier Menu
  chrome.contextMenus.create({
    id: 'streampulse_shazam',
    title: titles.shazam,
    contexts: ['page', 'video', 'audio']
  });

  await syncLanguageFromDesktop();
});

// Periodic & Event-based Sync from Desktop App
async function syncLanguageFromDesktop() {
  const syncUrls = ['http://127.0.0.1:3001/api/health', 'http://localhost:3001/api/health'];
  for (const u of syncUrls) {
    try {
      const res = await fetch(u);
      if (res.ok) {
        const data = await res.json();
        const newLang = data.language || (data.settings && data.settings.language);
        if (newLang && newLang !== currentLanguage) {
          currentLanguage = newLang;
          chrome.storage.local.set({ streampulse_language: newLang });
          updateContextMenus(newLang);
          try {
            chrome.tabs.query({}, (tabs) => {
              if (tabs) {
                tabs.forEach(tab => {
                  if (tab && tab.id) {
                    chrome.tabs.sendMessage(tab.id, { action: 'LANGUAGE_CHANGED', language: newLang }).catch(() => {});
                  }
                });
              }
            });
          } catch (e) {}
        }
        return;
      }
    } catch (e) {}
  }
}

syncLanguageFromDesktop();
setInterval(syncLanguageFromDesktop, 3000);

// Ensure Offscreen Document for Audio Capture
async function ensureOffscreenDocument() {
  const existingContexts = await chrome.runtime.getContexts({
    contextTypes: ['OFFSCREEN_DOCUMENT'],
    documentUrls: [chrome.runtime.getURL('scripts/offscreen.html')]
  });

  if (existingContexts.length > 0) {
    return;
  }

  await chrome.offscreen.createDocument({
    url: 'scripts/offscreen.html',
    reasons: ['USER_MEDIA'],
    justification: 'Capture and recognize audio playing in the active browser tab'
  });
}

// 2. Recognize Tab Music using tabCapture + Offscreen Document
async function recognizeTabMusic(targetTabId) {
  try {
    await ensureOffscreenDocument();

    let tabId = targetTabId;
    if (!tabId) {
      const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
      if (tabs && tabs[0]) tabId = tabs[0].id;
    }

    if (!tabId) {
      return { success: false, error: 'Aktif sekme bulunamadı.' };
    }

    const streamId = await chrome.tabCapture.getMediaStreamId({ targetTabId: tabId });

    // Send capture command to offscreen document
    const response = await chrome.runtime.sendMessage({
      target: 'offscreen',
      type: 'START_RECORDING',
      data: { streamId, duration: 4500 }
    });

    return response;
  } catch (err) {
    return { success: false, error: err.message };
  }
}

// Helper function to send download request to local StreamPulse API
async function sendToStreamPulse(url, formatType = 'mp3', quality = '320', metadata = null) {
  const payload = {
    id: 'ext_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    url,
    title: metadata?.title,
    uploader: metadata?.artist,
    thumbnail: metadata?.artwork,
    formatType,
    quality,
    source: 'extension'
  };

  try {
    let res = await fetch(`${API_URL}/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      return { success: true };
    }
  } catch (err) {}

  // Fallback to custom protocol deep link centered on active tab
  const deepLink = `streampulse://download?url=${encodeURIComponent(url)}&format=${formatType}&quality=${quality}`;
  triggerDeepLinkOnTab(deepLink);
  notifyUser(
    currentLanguage === 'en' ? 'Starting StreamPulse ⚡' : 'StreamPulse Başlatılıyor ⚡',
    currentLanguage === 'en' ? 'Opening desktop app and queueing download.' : 'Masaüstü uygulaması açılıyor ve indirme kuyruğa ekleniyor.'
  );
  return { success: true, deepLinked: true };
}

// Focus / Open Desktop App
async function openDesktopApp() {
  try {
    const res = await fetch(`${API_URL}/focus`, { method: 'POST' });
    if (res.ok) {
      return { success: true };
    }
  } catch (e) {}

  triggerDeepLinkOnTab('streampulse://open');
  return { success: true };
}

function triggerDeepLinkOnTab(deepLink) {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs.length > 0 && tabs[0].id) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'OPEN_PROTOCOL', url: deepLink }, (res) => {
        if (chrome.runtime.lastError || !res?.success) {
          chrome.tabs.update(tabs[0].id, { url: deepLink });
        }
      });
    } else {
      chrome.tabs.create({ url: deepLink, active: false }, (tab) => {
        setTimeout(() => {
          if (tab && tab.id) chrome.tabs.remove(tab.id);
        }, 1000);
      });
    }
  });
}

// 3. Handle Context Menu Clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const targetUrl = info.linkUrl || info.srcUrl || info.pageUrl || tab?.url;

  if (info.menuItemId === 'streampulse_mp3') {
    if (targetUrl) sendToStreamPulse(targetUrl, 'mp3', '320');
  } else if (info.menuItemId === 'streampulse_video') {
    if (targetUrl) sendToStreamPulse(targetUrl, 'video', '1080');
  } else if (info.menuItemId === 'streampulse_queue') {
    if (targetUrl) sendToStreamPulse(targetUrl, 'mp3', '320');
  } else if (info.menuItemId === 'streampulse_shazam') {
    notifyUser(
      currentLanguage === 'en' ? 'Listening...' : 'Dinleniyor...',
      currentLanguage === 'en' ? 'Recognizing music in this tab...' : 'Bu sekmede çalan müzik analiz ediliyor...'
    );
    recognizeTabMusic(tab?.id).then((res) => {
      if (res && res.success && res.track) {
        notifyUser(
          '🎵 ' + res.track.title,
          res.track.artist + (currentLanguage === 'en' ? ' - Click to download' : ' - İndirmek için tıklayın')
        );
        sendToStreamPulse(res.track.youtubeQuery || (res.track.artist + ' ' + res.track.title), 'mp3', '320', res.track);
      } else {
        notifyUser(
          currentLanguage === 'en' ? 'Not Recognized' : 'Tanınamadı',
          res.error || (currentLanguage === 'en' ? 'Could not identify track.' : 'Şarkı tespit edilemedi.')
        );
      }
    });
  }
});

// 4. Handle Messages from Content Script or Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'START_DOWNLOAD') {
    sendToStreamPulse(request.url, request.formatType, request.quality, request.metadata)
      .then(res => sendResponse(res))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
  if (request.type === 'OPEN_APP') {
    openDesktopApp()
      .then(res => sendResponse(res))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
  if (request.type === 'RECOGNIZE_AUDIO') {
    recognizeTabMusic(request.tabId)
      .then(res => sendResponse(res))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }
  if (request.type === 'CHECK_DESKTOP_STATUS') {
    (async () => {
      const syncUrls = ['http://127.0.0.1:3001/api/health', 'http://localhost:3001/api/health'];
      for (const u of syncUrls) {
        try {
          const res = await fetch(u);
          if (res.ok) {
            const data = await res.json();
            const lang = data.language || (data.settings && data.settings.language) || currentLanguage;
            currentLanguage = lang;
            sendResponse({ online: true, language: lang, settings: data.settings });
            return;
          }
        } catch (e) {}
      }
      sendResponse({ online: false });
    })();
    return true;
  }
  if (request.type === 'SYNC_SETTINGS') {
    syncLanguageFromDesktop().then(() => sendResponse({ success: true, language: currentLanguage }));
    return true;
  }
});

function notifyUser(title, message) {
  try {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title: title || 'StreamPulse',
      message: message || (currentLanguage === 'en' ? 'Operation completed.' : 'İşlem tamamlandı.')
    });
  } catch (e) {}
}
