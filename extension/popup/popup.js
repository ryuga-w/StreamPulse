// StreamPulse Chrome Extension - Popup Logic
document.addEventListener('DOMContentLoaded', async () => {
  const statusIndicator = document.getElementById('app-status');
  const statusText = document.getElementById('status-text');
  const mediaTitle = document.getElementById('media-title');
  const mediaChannel = document.getElementById('media-channel');
  const mediaThumb = document.getElementById('media-thumb');
  const mediaPlaceholder = document.getElementById('media-placeholder');
  const formatButtons = document.querySelectorAll('.format-btn');
  const btnDownload = document.getElementById('btn-download');
  const btnOpenApp = document.getElementById('btn-open-app');
  const feedbackMsg = document.getElementById('feedback-msg');

  let currentTabUrl = '';
  let selectedType = 'mp3';
  let selectedQuality = '320';

  // 1. Check Desktop App Status
  async function checkAppStatus() {
    try {
      const res = await fetch('http://127.0.0.1:3001/api/ping');
      const data = await res.json();
      if (data && data.success) {
        statusIndicator.className = 'status-indicator online';
        statusText.textContent = 'Masaüstü Bağlı';
        return true;
      }
    } catch (e) {
      statusIndicator.className = 'status-indicator offline';
      statusText.textContent = 'Masaüstü Kapalı';
      return false;
    }
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
      mediaTitle.textContent = tab.title ? tab.title.replace(' - YouTube', '').replace(' - YouTube Music', '') : 'YouTube Medyası';
      mediaChannel.textContent = isYtMusic ? '🎵 YouTube Music' : '🎬 YouTube Video';

      // Extract YouTube Video ID for instant thumbnail preview
      const match = currentTabUrl.match(/(?:v=|\/embed\/|\/shorts\/|youtu\.be\/|\/v\/)([^&?#/]+)/);
      if (match && match[1]) {
        const videoId = match[1];
        mediaThumb.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        mediaThumb.style.display = 'block';
        mediaPlaceholder.style.display = 'none';
      }
    } else {
      mediaTitle.textContent = 'Masaüstü İndiriciye Gönder';
      mediaChannel.textContent = 'Herhangi bir medya veya sayfa linki';
      mediaPlaceholder.textContent = '🌐 ' + (new URL(currentTabUrl || 'https://google.com')).hostname;
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
    if (!currentTabUrl) return;

    btnDownload.disabled = true;
    btnDownload.style.opacity = '0.7';
    showFeedback('İndirme gönderiliyor...', 'info');

    chrome.runtime.sendMessage(
      {
        type: 'START_DOWNLOAD',
        url: currentTabUrl,
        formatType: selectedType,
        quality: selectedQuality
      },
      (response) => {
        btnDownload.disabled = false;
        btnDownload.style.opacity = '1';

        if (response && response.success) {
          showFeedback('⚡ StreamPulse kuyruğa aldı! İndirme başladı.', 'success');
        } else {
          showFeedback('🚀 StreamPulse uygulaması başlatılıyor...', 'success');
        }
      }
    );
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
