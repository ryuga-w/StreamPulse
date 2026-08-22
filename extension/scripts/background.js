// StreamPulse Chrome Extension - Background Service Worker
const API_URL = 'http://127.0.0.1:3001/api';

// 1. Initialize Context Menus on Installation
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'streampulse_root',
    title: '⚡ StreamPulse ile İndir',
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
    title: '🎵 320kbps MP3 İndir (Stüdyo Kalite)',
    contexts: ['page', 'link', 'video', 'audio']
  });

  chrome.contextMenus.create({
    parentId: 'streampulse_root',
    id: 'streampulse_video',
    title: '🎬 4K / 1080p Video İndir (Kayıpsız)',
    contexts: ['page', 'link', 'video', 'audio']
  });

  chrome.contextMenus.create({
    parentId: 'streampulse_root',
    id: 'streampulse_queue',
    title: '📋 StreamPulse Kuyruğuna Ekle',
    contexts: ['page', 'link', 'video', 'audio']
  });
});

// Helper function to send download request to local StreamPulse API
async function sendToStreamPulse(url, formatType = 'mp3', quality = '320') {
  const payload = {
    id: 'ext_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
    url,
    formatType,
    quality
  };

  try {
    let res = await fetch(`${API_URL}/extension/download`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      res = await fetch(`${API_URL}/download`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    }

    if (res.ok) {
      notifyUser('İndirme Başlatıldı 🚀', `StreamPulse medyayı indirmeye başladı (${formatType.toUpperCase()})`);
      return { success: true };
    }
  } catch (err) {}

  // Fallback to custom protocol deep link if API fails
    const deepLink = `streampulse://download?url=${encodeURIComponent(url)}&format=${formatType}&quality=${quality}`;
    chrome.tabs.create({ url: deepLink, active: false }, (tab) => {
      setTimeout(() => {
        if (tab && tab.id) chrome.tabs.remove(tab.id);
      }, 500);
    });
    notifyUser('StreamPulse Başlatılıyor ⚡', 'Masaüstü uygulaması açılıyor ve indirme kuyruğa ekleniyor.');
    return { success: true, deepLinked: true };
  }
}

// 2. Handle Context Menu Clicks
chrome.contextMenus.onClicked.addListener((info, tab) => {
  const targetUrl = info.linkUrl || info.srcUrl || info.pageUrl || tab?.url;
  if (!targetUrl) return;

  if (info.menuItemId === 'streampulse_mp3') {
    sendToStreamPulse(targetUrl, 'mp3', '320');
  } else if (info.menuItemId === 'streampulse_video') {
    sendToStreamPulse(targetUrl, 'video', '1080');
  } else if (info.menuItemId === 'streampulse_queue') {
    sendToStreamPulse(targetUrl, 'mp3', '320');
  }
});

// 3. Handle Messages from Content Script or Popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.type === 'START_DOWNLOAD') {
    sendToStreamPulse(request.url, request.formatType, request.quality)
      .then(res => sendResponse(res))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true; // Keep channel open for async response
  }

  if (request.type === 'CHECK_APP_STATUS') {
    fetch(`${API_URL}/ping`)
      .then(res => res.json())
      .then(data => sendResponse({ online: true, data }))
      .catch(() => sendResponse({ online: false }));
    return true;
  }
});

// Helper for Chrome notifications
function notifyUser(title, message) {
  try {
    chrome.notifications.create({
      type: 'basic',
      iconUrl: 'icons/icon128.png',
      title,
      message,
      priority: 2
    });
  } catch (e) {}
}
