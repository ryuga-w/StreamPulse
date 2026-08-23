// StreamPulse In-Page YouTube & YouTube Music Injector
(function () {
  'use strict';

  const INJECT_BUTTON_ID = 'streampulse-injected-btn';
  const TOAST_ID = 'streampulse-injected-toast';

  let currentLanguage = 'tr';

  const translations = {
    tr: {
      btnText: 'İndir',
      menuHeader: 'StreamPulse İndirici',
      mp3Title: 'MP3 İndir',
      flacTitle: 'Kayıpsız Ses',
      videoTitle: 'Video İndir',
      playlistTitle: 'Tüm Çalma Listesini İndir',
      badgeLossless: 'FLAC',
      badgeAlbum: 'ALBÜM',
      sendingToast: (title, fmt) => `"${title.slice(0, 30)}" (${fmt}) masaüstüne gönderiliyor...`,
      downloadStartedToast: 'İndirme Başlatıldı',
      startedToast: (fmt) => `Masaüstü StreamPulse kütüphanenize indiriyor (${fmt})`,
      transferSuccessToast: 'Aktarım Başarılı',
      appLaunchingToast: 'StreamPulse uygulaması başlatılıyor.',
    },
    en: {
      btnText: 'Download',
      menuHeader: 'StreamPulse Downloader',
      mp3Title: 'Download MP3',
      flacTitle: 'Lossless Audio',
      videoTitle: 'Download Video',
      playlistTitle: 'Download Full Playlist',
      badgeLossless: 'FLAC',
      badgeAlbum: 'ALBUM',
      sendingToast: (title, fmt) => `Sending "${title.slice(0, 30)}" (${fmt}) to desktop...`,
      downloadStartedToast: 'Download Started',
      startedToast: (fmt) => `Downloading to StreamPulse desktop library (${fmt})`,
      transferSuccessToast: 'Transfer Successful',
      appLaunchingToast: 'Launching StreamPulse desktop app.',
    }
  };

  function getT() {
    return translations[currentLanguage] || translations.tr;
  }

  function updateInjectedBtnText() {
    const btnTextEl = document.querySelector(`#${INJECT_BUTTON_ID} .streampulse-btn-text`);
    if (btnTextEl) {
      btnTextEl.textContent = getT().btnText;
    }
  }

  function syncLanguage() {
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.get('streampulse_language', (res) => {
        if (res && res.streampulse_language && res.streampulse_language !== currentLanguage) {
          currentLanguage = res.streampulse_language;
          updateInjectedBtnText();
        }
      });
    }

    fetch('http://127.0.0.1:3001/api/health')
      .then(res => res.json())
      .then(data => {
        const lang = data.language || (data.settings && data.settings.language);
        if (lang && lang !== currentLanguage) {
          currentLanguage = lang;
          if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
            chrome.storage.local.set({ streampulse_language: lang });
          }
          updateInjectedBtnText();
        }
      })
      .catch(() => {});
  }

  syncLanguage();

  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.onChanged) {
    chrome.storage.onChanged.addListener((changes) => {
      if (changes.streampulse_language) {
        currentLanguage = changes.streampulse_language.newValue || 'tr';
        updateInjectedBtnText();
      }
    });
  }

  // Listen for open app / download requests from popup to execute centered on page
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((request, _sender, sendResponse) => {
      if (request.action === 'OPEN_APP' || request.action === 'OPEN_PROTOCOL') {
        const targetUrl = request.url || 'streampulse://open';
        window.location.href = targetUrl;
        sendResponse({ success: true });
        return true;
      }
    });
  }

  function showInPageToast(title, message, isError = false) {
    let toast = document.getElementById(TOAST_ID);
    if (!toast) {
      toast = document.createElement('div');
      toast.id = TOAST_ID;
      document.body.appendChild(toast);
    }

    toast.className = `streampulse-toast ${isError ? 'streampulse-toast-error' : 'streampulse-toast-success'}`;
    toast.innerHTML = `
      <div class="streampulse-toast-icon">
        <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/></svg>
      </div>
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

    showInPageToast('StreamPulse', `"${pageTitle.slice(0, 30)}" (${formatType.toUpperCase()}) masaüstüne gönderiliyor...`);

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
        showInPageToast('İndirme Başlatıldı', `Masaüstü StreamPulse kütüphanenize indiriyor (${formatType.toUpperCase()})`);
      }
    } catch (e) {}

    // 2. Extension background fallback
    if (!sent && typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.sendMessage) {
      try {
        chrome.runtime.sendMessage(
          { action: 'download_media', url: targetUrl, formatType, quality, title: pageTitle, thumbnail },
          (response) => {
            if (response && response.success) {
              showInPageToast('İndirme Başlatıldı', `Masaüstü uygulamasına aktarıldı (${formatType.toUpperCase()})`);
            } else {
              window.location.href = `streampulse://download?url=${encodeURIComponent(targetUrl)}&format=${formatType}&quality=${quality}`;
              showInPageToast('Aktarım Başarılı', 'StreamPulse uygulaması başlatılıyor.');
            }
          }
        );
      } catch (err) {
        window.location.href = `streampulse://download?url=${encodeURIComponent(targetUrl)}&format=${formatType}&quality=${quality}`;
      }
    }
  }

  function createStreamPulseDropdown(parentBtn) {
    const t = getT();
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
        <span>${t.menuHeader}</span>
      </div>
      <button class="streampulse-dropdown-item" id="sp-dl-mp3">
        <div class="sp-item-left">
          <div class="sp-item-icon-svg">
            <svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
          </div>
          <div class="sp-item-text">
            <span class="sp-title">${t.mp3Title}</span>
          </div>
        </div>
        <span class="sp-badge">320 kbps</span>
      </button>
      <button class="streampulse-dropdown-item" id="sp-dl-flac">
        <div class="sp-item-left">
          <div class="sp-item-icon-svg">
            <svg viewBox="0 0 24 24"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/></svg>
          </div>
          <div class="sp-item-text">
            <span class="sp-title">${t.flacTitle}</span>
          </div>
        </div>
        <span class="sp-badge">${t.badgeLossless}</span>
      </button>
      <button class="streampulse-dropdown-item" id="sp-dl-video">
        <div class="sp-item-left">
          <div class="sp-item-icon-svg">
            <svg viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12zm-11-2l6-4-6-4v8z"/></svg>
          </div>
          <div class="sp-item-text">
            <span class="sp-title">${t.videoTitle}</span>
          </div>
        </div>
        <span class="sp-badge">4K / HD</span>
      </button>
      ${
        isPlaylist
          ? `
      <button class="streampulse-dropdown-item" id="sp-dl-playlist">
        <div class="sp-item-left">
          <div class="sp-item-icon-svg">
            <svg viewBox="0 0 24 24"><path d="M19 9H2v2h17V9zm0-4H2v2h17V5zM2 15h11v-2H2v2zm13 4v-8l6 4-6 4z"/></svg>
          </div>
          <div class="sp-item-text">
            <span class="sp-title">${t.playlistTitle}</span>
          </div>
        </div>
        <span class="sp-badge" style="color: #3ea6ff;">${t.badgeAlbum}</span>
      </button>
      `
          : ''
      }
    `;

    document.body.appendChild(menu);

    // Position dropdown relative to button (Smart Dropup if near bottom or on YouTube Music)
    const rect = parentBtn.getBoundingClientRect();
    const menuHeight = menu.offsetHeight || 240;
    const isNearBottom = (window.innerHeight - rect.bottom) < (menuHeight + 30) || window.location.hostname.includes('music.youtube.com');

    if (isNearBottom) {
      menu.classList.add('dropup');
      menu.style.position = 'fixed';
      menu.style.top = 'auto';
      menu.style.bottom = `${Math.max(10, window.innerHeight - rect.top + 8)}px`;
    } else {
      menu.style.position = 'absolute';
      menu.style.top = `${rect.bottom + window.scrollY + 8}px`;
      menu.style.bottom = 'auto';
    }

    const leftPos = Math.max(10, Math.min(window.innerWidth - 290, isNearBottom ? rect.left : (rect.left + window.scrollX - 40)));
    menu.style.left = `${leftPos}px`;

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

    // 1. YouTube Standard Watch Page Target Container (Buttons row or Owner section)
    const ytTarget =
      document.querySelector('#top-level-buttons-computed') ||
      document.querySelector('#actions-inner #top-level-buttons-computed') ||
      document.querySelector('ytd-watch-metadata #actions #top-level-buttons-computed') ||
      document.querySelector('#actions ytd-menu-renderer') ||
      document.querySelector('ytd-menu-renderer.ytd-watch-metadata') ||
      document.querySelector('#owner #subscribe-button') ||
      document.querySelector('#owner');

    // 2. YouTube Music Target Container
    const ytmTarget =
      document.querySelector('ytmusic-player-bar .middle-controls') ||
      document.querySelector('ytmusic-player-bar .right-controls') ||
      document.querySelector('ytmusic-player-bar');

    // 3. YouTube Shorts Target Container
    const shortsTarget =
      document.querySelector('ytd-reel-video-renderer[is-active] #actions') ||
      document.querySelector('#actions.ytd-reel-video-renderer');

    const targetContainer = ytTarget || ytmTarget || shortsTarget;
    if (!targetContainer) return;

    const t = getT();
    const btn = document.createElement('button');
    btn.id = INJECT_BUTTON_ID;
    btn.className = 'streampulse-inject-btn';
    btn.innerHTML = `
      <span class="streampulse-btn-icon">
        <svg viewBox="0 0 24 24"><path d="M17 18v1H6v-1h11zm-.5-6.6l-.7-.7-3.8 3.7V4h-1v10.4l-3.8-3.8-.7.7 5 5 5-5z"/></svg>
      </span>
      <span class="streampulse-btn-text">${t.btnText}</span>
      <span class="streampulse-btn-arrow">
        <svg viewBox="0 0 24 24"><path d="M12 15.5l-6-6h12l-6 6z"/></svg>
      </span>
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
      if (ytTarget.id === 'subscribe-button' || ytTarget.id === 'owner') {
        ytTarget.appendChild(btn);
      } else {
        ytTarget.prepend(btn);
      }
    }
  }

  // Observe URL and DOM changes for YouTube Single Page App (SPA)
  function initObserver() {
    injectMainButton();

    ['yt-navigate-finish', 'yt-page-data-updated', 'sp-navigate-finish'].forEach(evt => {
      window.addEventListener(evt, () => {
        setTimeout(injectMainButton, 300);
        setTimeout(injectMainButton, 800);
        setTimeout(injectMainButton, 1800);
      });
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
