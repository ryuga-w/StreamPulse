// StreamPulse Chrome Extension - Popup Logic
document.addEventListener('DOMContentLoaded', async () => {
  const statusIndicator = document.getElementById('app-status');
  const statusText = document.getElementById('status-text');
  const mediaTitle = document.getElementById('media-title');
  const mediaChannel = document.getElementById('media-channel');
  const mediaThumb = document.getElementById('media-thumb');
  const mediaPlaceholder = document.getElementById('media-placeholder');
  const customUrlBox = document.getElementById('custom-url-box');
  const customUrlInput = document.getElementById('custom-url-input');
  const formatButtons = document.querySelectorAll('.format-btn');
  const btnDownload = document.getElementById('btn-download');
  const btnOpenApp = document.getElementById('btn-open-app');
  const feedbackMsg = document.getElementById('feedback-msg');

  let currentTabUrl = '';
  let isYouTubeTab = false;
  let selectedType = 'mp3';
  let selectedQuality = '320';

  // 1. Check Desktop App Status
  async function checkAppStatus() {
    const endpoints = [
      'http://127.0.0.1:3001/api/ping',
      'http://127.0.0.1:3001/api/default-dir',
      'http://localhost:3001/api/default-dir',
    ];

    for (const ep of endpoints) {
      try {
        const res = await fetch(ep, { method: 'GET' });
        if (res.ok) {
          statusIndicator.className = 'status-indicator online';
          statusText.textContent = 'Masaüstü Bağlı';
          return true;
        }
      } catch (e) {}
    }

    statusIndicator.className = 'status-indicator offline';
    statusText.textContent = 'Masaüstü Kapalı';
    return false;
  }

  await checkAppStatus();

  // 2. Query Active Tab
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) return;
    const tab = tabs[0];
    currentTabUrl = tab.url || '';

    const isYouTube = currentTabUrl.includes('youtube.com') || currentTabUrl.includes('youtu.be');
    const isYtMusic = currentTabUrl.includes('music.youtube.com');

    if (isYouTube || isYtMusic) {
      isYouTubeTab = true;
      const cleanTitle = tab.title ? tab.title.replace(/ - YouTube Music$/i, '').replace(/ - YouTube$/i, '') : 'YouTube Medyası';
      mediaTitle.textContent = cleanTitle;
      mediaChannel.textContent = isYtMusic ? '🎵 YouTube Music' : '🎬 YouTube Video';

      // Extract YouTube Video ID for instant thumbnail preview
      const match = currentTabUrl.match(/(?:v=|\/embed\/|\/shorts\/|youtu\.be\/|\/v\/)([^&?#/]+)/);
      if (match && match[1]) {
        const videoId = match[1];
        mediaThumb.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        mediaThumb.style.display = 'block';
        mediaPlaceholder.style.display = 'none';
      }
      customUrlBox.style.display = 'none';
    } else {
      isYouTubeTab = false;
      mediaTitle.textContent = 'Medya Linki Yapıştırın';
      mediaChannel.textContent = 'YouTube, YouTube Music veya Şarkı Adı';
      mediaThumb.style.display = 'none';
      mediaPlaceholder.style.display = 'flex';
      mediaPlaceholder.textContent = '🔗 İstediğiniz linki girin';
      customUrlBox.style.display = 'block';
      setTimeout(() => customUrlInput.focus(), 100);
    }
  });

  // 3. Format Button Selection
  formatButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      formatButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedType = btn.getAttribute('data-type') || 'mp3';
      selectedQuality = btn.getAttribute('data-quality') || '320';
    });
  });

  // 4. Trigger Download
  btnDownload.addEventListener('click', async () => {
    let downloadUrl = '';

    if (isYouTubeTab && currentTabUrl) {
      downloadUrl = currentTabUrl;
    } else if (customUrlInput.value.trim()) {
      downloadUrl = customUrlInput.value.trim();
    } else {
      showFeedback('Lütfen geçerli bir YouTube linki veya şarkı adı girin.', 'error');
      customUrlBox.style.display = 'block';
      customUrlInput.focus();
      return;
    }

    if (downloadUrl.startsWith('chrome://') || downloadUrl.startsWith('edge://') || downloadUrl.startsWith('about:')) {
      showFeedback('Tarayıcı iç sayfaları indirilemez. Bir YouTube linki girin.', 'error');
      return;
    }

    btnDownload.disabled = true;
    btnDownload.style.opacity = '0.7';
    showFeedback('İndirme masaüstüne gönderiliyor...', 'info');

    const payload = {
      id: 'ext_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      url: downloadUrl,
      title: mediaTitle.textContent || 'YouTube Medyası',
      thumbnail: mediaThumb.src || '',
      formatType: selectedType,
      quality: selectedQuality,
      source: 'extension'
    };

    let sent = false;

    // 1. Direct HTTP Post
    try {
      const res = await fetch('http://127.0.0.1:3001/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        sent = true;
        btnDownload.disabled = false;
        btnDownload.style.opacity = '1';
        showFeedback('⚡ StreamPulse indirmeye başladı!', 'success');
      }
    } catch (e) {}

    // 2. Service Worker Fallback
    if (!sent) {
      try {
        chrome.runtime.sendMessage(
          {
            type: 'START_DOWNLOAD',
            url: downloadUrl,
            formatType: selectedType,
            quality: selectedQuality
          },
          (response) => {
            btnDownload.disabled = false;
            btnDownload.style.opacity = '1';

            if (response && response.success) {
              showFeedback('⚡ StreamPulse Pro kuyruğa aldı! İndirme başladı.', 'success');
            } else {
              window.location.href = `streampulse://download?url=${encodeURIComponent(downloadUrl)}&format=${selectedType}&quality=${selectedQuality}`;
              showFeedback('🚀 StreamPulse uygulamasına aktarıldı.', 'success');
            }
          }
        );
      } catch (err) {
        btnDownload.disabled = false;
        btnDownload.style.opacity = '1';
        window.location.href = `streampulse://download?url=${encodeURIComponent(downloadUrl)}&format=${selectedType}&quality=${selectedQuality}`;
        showFeedback('🚀 StreamPulse uygulamasına aktarıldı.', 'success');
      }
    }
  });

  // 5. Open Desktop App Button
  btnOpenApp.addEventListener('click', () => {
    window.location.href = 'streampulse://open';
    showFeedback('Uygulama açılıyor...', 'info');
  });

  function showFeedback(text, type) {
    feedbackMsg.textContent = text;
    feedbackMsg.className = `feedback-msg ${type}`;
    setTimeout(() => {
      feedbackMsg.className = 'feedback-msg';
    }, 4000);
  }
});
