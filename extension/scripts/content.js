// StreamPulse In-Page YouTube & YouTube Music Injector
(function () {
  'use strict';

  const INJECT_BUTTON_ID = 'streampulse-injected-btn';
  const TOAST_ID = 'streampulse-injected-toast';

  function showInPageToast(title, message, isError = false) {
    let toast = document.getElementById(TOAST_ID);
    if (!toast) {
      toast = document.createElement('div');
      toast.id = TOAST_ID;
      document.body.appendChild(toast);
    }

    toast.className = `streampulse-toast ${isError ? 'streampulse-toast-error' : 'streampulse-toast-success'}`;
    toast.innerHTML = `
      <div class="streampulse-toast-icon">${isError ? '⚠️' : '⚡'}</div>
      <div class="streampulse-toast-content">
        <div class="streampulse-toast-title">${title}</div>
        <div class="streampulse-toast-desc">${message}</div>
      </div>
    `;

    toast.classList.add('show');
    setTimeout(() => {
      toast.classList.remove('show');
    }, 4000);
  }

  async function triggerDownload(url, formatType, quality) {
    const targetUrl = url || window.location.href;
    const pageTitle = (
      document.querySelector('h1.ytd-watch-metadata yt-formatted-string')?.innerText ||
      document.querySelector('ytmusic-player-bar .title')?.innerText ||
      document.title ||
      'YouTube Medyası'
    ).replace(/ - YouTube Music$/i, '').replace(/ - YouTube$/i, '').trim();

    const videoIdMatch = targetUrl.match(/(?:v=|\/embed\/|\/shorts\/|youtu\.be\/|\/v\/)([^&?#/]+)/);
    const thumbnail = videoIdMatch && videoIdMatch[1] ? `https://i.ytimg.com/vi/${videoIdMatch[1]}/hqdefault.jpg` : '';

    showInPageToast('StreamPulse Pro 🚀', `"${pageTitle.slice(0, 25)}..." (${formatType.toUpperCase()}) masaüstüne gönderiliyor...`);

    const payload = {
      id: 'ext_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      url: targetUrl,
      title: pageTitle,
      thumbnail,
      formatType,
      quality,
      source: 'extension'
    };

    let sent = false;

    // 1. Direct fetch to local engine (Bypasses sleeping Service Worker)
    try {
      const res = await fetch('http://127.0.0.1:3001/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        sent = true;
        showInPageToast('İndirme Başlatıldı! ⚡', `StreamPulse Pro indirmeye başladı (${formatType.toUpperCase()})`);
      }
    } catch (e) {}

    // 2. Service Worker fallback
    if (!sent) {
      try {
        chrome.runtime.sendMessage(
          {
            type: 'START_DOWNLOAD',
            url: targetUrl,
            formatType,
            quality
          },
          (response) => {
            if (response && response.success) {
              showInPageToast('İndirme Başlatıldı! ⚡', `StreamPulse Pro kuyruğa aldı (${formatType.toUpperCase()})`);
            } else {
              window.location.href = `streampulse://download?url=${encodeURIComponent(targetUrl)}&format=${formatType}&quality=${quality}`;
              showInPageToast('Aktarım Başarılı 🚀', 'StreamPulse uygulaması başlatılıyor.');
            }
          }
        );
      } catch (err) {
        window.location.href = `streampulse://download?url=${encodeURIComponent(targetUrl)}&format=${formatType}&quality=${quality}`;
      }
    }
  }

  function createStreamPulseDropdown(parentBtn) {
    const existing = document.getElementById('streampulse-dropdown-menu');
    if (existing) {
      existing.remove();
      return;
    }

    const currentUrl = window.location.href;
    const isPlaylist = currentUrl.includes('list=') && !currentUrl.includes('list=RD');

    const menu = document.createElement('div');
    menu.id = 'streampulse-dropdown-menu';
    menu.className = 'streampulse-dropdown';

    menu.innerHTML = `
      <div class="streampulse-dropdown-header">
        <span class="sp-dot"></span>
        <span>StreamPulse Downloader</span>
      </div>
      <button class="streampulse-dropdown-item" id="sp-dl-mp3">
        <span class="sp-item-icon">🎵</span>
        <div class="sp-item-text">
          <span class="sp-title">320kbps MP3 (Stüdyo Kalite)</span>
          <span class="sp-sub">ID3 etiketli yüksek kaliteli ses</span>
        </div>
      </button>
      <button class="streampulse-dropdown-item" id="sp-dl-flac">
        <span class="sp-item-icon">🎧</span>
        <div class="sp-item-text">
          <span class="sp-title">Kayıpsız FLAC / M4A</span>
          <span class="sp-sub">Orijinal bit rate kayıpsız ses</span>
        </div>
      </button>
      <button class="streampulse-dropdown-item" id="sp-dl-video">
        <span class="sp-item-icon">🎬</span>
        <div class="sp-item-text">
          <span class="sp-title">4K / 1080p Ultra HD Video</span>
          <span class="sp-sub">En yüksek çözünürlükte video</span>
        </div>
      </button>
      ${
        isPlaylist
          ? `
      <button class="streampulse-dropdown-item sp-playlist-btn" id="sp-dl-playlist">
        <span class="sp-item-icon">💽</span>
        <div class="sp-item-text">
          <span class="sp-title">Tüm Çalma Listesini İndir</span>
          <span class="sp-sub">Klasör halinde otomatik albüm</span>
        </div>
      </button>
      `
          : ''
      }
    `;

    document.body.appendChild(menu);

    // Position dropdown relative to button
    const rect = parentBtn.getBoundingClientRect();
    menu.style.top = `${rect.bottom + window.scrollY + 8}px`;
    menu.style.left = `${Math.max(10, rect.left + window.scrollX - 40)}px`;

    menu.querySelector('#sp-dl-mp3').addEventListener('click', (e) => {
      e.stopPropagation();
      menu.remove();
      triggerDownload(currentUrl, 'mp3', '320');
    });

    menu.querySelector('#sp-dl-flac').addEventListener('click', (e) => {
      e.stopPropagation();
      menu.remove();
      triggerDownload(currentUrl, 'flac', '320');
    });

    menu.querySelector('#sp-dl-video').addEventListener('click', (e) => {
      e.stopPropagation();
      menu.remove();
      triggerDownload(currentUrl, 'video', '1080');
    });

    if (isPlaylist) {
      menu.querySelector('#sp-dl-playlist').addEventListener('click', (e) => {
        e.stopPropagation();
        menu.remove();
        triggerDownload(currentUrl, 'mp3', '320');
      });
    }

    const closeHandler = (e) => {
      if (!menu.contains(e.target) && e.target !== parentBtn && !parentBtn.contains(e.target)) {
        menu.remove();
        document.removeEventListener('click', closeHandler);
      }
    };
    setTimeout(() => {
      document.addEventListener('click', closeHandler);
    }, 50);
  }

  function injectMainButton() {
    if (document.getElementById(INJECT_BUTTON_ID)) return;

    // 1. YouTube Standard Watch Page Target Container
    const ytTarget =
      document.querySelector('#top-level-buttons-computed') ||
      document.querySelector('#actions-inner #top-level-buttons-computed') ||
      document.querySelector('ytd-watch-metadata #actions #top-level-buttons-computed') ||
      document.querySelector('#actions ytd-menu-renderer');

    // 2. YouTube Music Target Container
    const ytmTarget = document.querySelector('ytmusic-player-bar .middle-controls') || document.querySelector('ytmusic-player-bar .right-controls');

    // 3. YouTube Shorts Target Container
    const shortsTarget = document.querySelector('ytd-reel-video-renderer[is-active] #actions') || document.querySelector('#actions.ytd-reel-video-renderer');

    const targetContainer = ytTarget || ytmTarget || shortsTarget;
    if (!targetContainer) return;

    const btn = document.createElement('button');
    btn.id = INJECT_BUTTON_ID;
    btn.className = 'streampulse-inject-btn';
    btn.innerHTML = `
      <span class="streampulse-btn-icon">⚡</span>
      <span class="streampulse-btn-text">StreamPulse İndir</span>
      <span class="streampulse-btn-arrow">▾</span>
    `;

    btn.addEventListener('click', (e) => {
      e.preventDefault();
      e.stopPropagation();
      createStreamPulseDropdown(btn);
    });

    if (ytmTarget) {
      ytmTarget.prepend(btn);
    } else if (shortsTarget) {
      shortsTarget.prepend(btn);
    } else if (ytTarget) {
      ytTarget.prepend(btn);
    }
  }

  // Observe URL and DOM changes for YouTube Single Page App (SPA)
  function initObserver() {
    injectMainButton();

    window.addEventListener('yt-navigate-finish', () => {
      setTimeout(injectMainButton, 600);
      setTimeout(injectMainButton, 1500);
    });

    const observer = new MutationObserver(() => {
      if (!document.getElementById(INJECT_BUTTON_ID)) {
        injectMainButton();
      }
    });

    observer.observe(document.body, { childList: true, subtree: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initObserver);
  } else {
    initObserver();
  }
})();
