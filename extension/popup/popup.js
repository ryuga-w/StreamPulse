// StreamPulse Chrome Extension - High Performance Dual Mode Grabber & Shazam AI
document.addEventListener('DOMContentLoaded', () => {
  // Elements - Header & Status
  const statusIndicator = document.getElementById('app-status');
  const statusText = document.getElementById('status-text');

  // Navigation Tabs
  const tabBtnGrabber = document.getElementById('tab-btn-grabber');
  const tabBtnShazam = document.getElementById('tab-btn-shazam');
  const viewGrabber = document.getElementById('view-grabber');
  const viewShazam = document.getElementById('view-shazam');
  const tabLabelGrabber = document.getElementById('tab-label-grabber');
  const tabLabelShazam = document.getElementById('tab-label-shazam');

  // Tab 1: Grabber Elements
  const mediaTitle = document.getElementById('media-title');
  const mediaChannel = document.getElementById('media-channel');
  const mediaThumb = document.getElementById('media-thumb');
  const mediaPlaceholder = document.getElementById('media-placeholder');
  const customUrlBox = document.getElementById('custom-url-box');
  const customUrlInput = document.getElementById('custom-url-input');
  const formatButtons = document.querySelectorAll('.format-chip, .format-pill, .format-btn');
  const btnDownload = document.getElementById('btn-download');
  const btnOpenApp = document.getElementById('btn-open-app');
  const feedbackMsg = document.getElementById('feedback-msg');

  // Tab 2: Shazam AI Elements
  const shazamStageIdle = document.getElementById('shazam-stage-idle');
  const btnStartRecognition = document.getElementById('btn-start-recognition');
  const shazamIconIdle = document.getElementById('shazam-icon-idle');
  const shazamLiveWave = document.getElementById('shazam-live-wave');
  const shazamStatusTitle = document.getElementById('shazam-status-title');
  const shazamStatusDesc = document.getElementById('shazam-status-desc');
  const btnStopListening = document.getElementById('btn-stop-listening');
  const btnLabelStop = document.getElementById('btn-label-stop');
  const btnExtractDirect = document.getElementById('btn-extract-direct');
  const btnLabelExtract = document.getElementById('btn-label-extract');
  const shazamResultCard = document.getElementById('shazam-result-card');
  const resultCover = document.getElementById('result-cover');
  const resultEngineBadge = document.getElementById('result-engine-badge');
  const resultSongTitle = document.getElementById('result-song-title');
  const resultArtistName = document.getElementById('result-artist-name');
  const resultAlbumName = document.getElementById('result-album-name');
  const btnDownloadRecognized = document.getElementById('btn-download-recognized');
  const btnLabelRecDownload = document.getElementById('btn-label-rec-download');
  const btnReRecognize = document.getElementById('btn-re-recognize');
  const btnLabelRecAgain = document.getElementById('btn-label-rec-again');

  let currentRecognizedTrack = null;
  let isRecognizing = false;
  let currentTabUrl = '';
  let activeTabId = null;
  let isYouTubeTab = false;
  let selectedType = 'mp3';
  let selectedQuality = '320';
  let tabHintText = '';

  // Multi-language dictionary for Extension
  const i18n = {
    tr: {
      desktopOnline: 'Masaüstü Bağlı',
      desktopOffline: 'Masaüstü Kapalı',
      tabGrabber: 'Medya İndirici',
      tabShazam: 'Müzik Tanı (AI)',
      formatTitle: 'İndirme Formatı & Kalite',
      pasteLinkPlaceholder: 'Medya Linki Yapıştırın',
      pasteChannelPlaceholder: 'YouTube, YouTube Music veya Şarkı Adı',
      enterLinkPlaceholder: 'İstediğiniz YouTube linkini girin',
      inputPlaceholder: 'YouTube linki veya şarkı adı...',
      downloadBtn: 'Masaüstünde İndir',
      openAppBtn: 'Uygulamayı Aç',
      invalidUrl: 'Lütfen geçerli bir YouTube linki veya şarkı adı girin.',
      browserInternalUrl: 'Tarayıcı iç sayfaları indirilemez. Bir YouTube linki girin.',
      sending: 'İndirme masaüstüne gönderiliyor...',
      started: 'StreamPulse indirmeye başladı!',
      queued: 'StreamPulse Pro kuyruğa aldı! İndirme başladı.',
      appLaunched: 'StreamPulse uygulamasına aktarıldı.',
      openingApp: 'Uygulama açılıyor...',
      shazamTitle: 'Müziği Tanı',
      shazamDesc: 'TikTok, Instagram, Twitter/X veya sekmede çalan şarkıyı dinleyip anında tanıyın.',
      listeningTitle: 'Sekme Dinleniyor...',
      listeningDesc: 'Akustik parmak izi analiz ediliyor, lütfen sesi kısmayın (%60)...',
      stopListeningBtn: 'Dinlemeyi Durdur',
      extractDirectBtn: '🎬 Bu Editin/Videonun Sesini İndir',
      recDownloadBtn: 'StreamPulse ile 320kbps İndir',
      recAgainBtn: 'Başka Şarkı Tanı',
      recSuccess: 'Şarkı Başarıyla Tanındı! 🎵',
      recFailed: 'Müzik tespit edilemedi. Lütfen sesin daha net olduğu bir anda tekrar deneyin.',
      stoppedMsg: 'Dinleme durduruldu.',
    },
    en: {
      desktopOnline: 'Desktop Connected',
      desktopOffline: 'Desktop Offline',
      tabGrabber: 'Media Downloader',
      tabShazam: 'Identify Music (AI)',
      formatTitle: 'Download Format & Quality',
      pasteLinkPlaceholder: 'Paste Media Link',
      pasteChannelPlaceholder: 'YouTube, YouTube Music or Song Name',
      enterLinkPlaceholder: 'Enter any YouTube link',
      inputPlaceholder: 'YouTube link or song name...',
      downloadBtn: 'Download on Desktop',
      openAppBtn: 'Open App',
      invalidUrl: 'Please enter a valid YouTube link or song title.',
      browserInternalUrl: 'Internal browser pages cannot be downloaded.',
      sending: 'Sending download to desktop app...',
      started: 'StreamPulse started downloading!',
      queued: 'Added to StreamPulse Pro queue!',
      appLaunched: 'Handed over to StreamPulse app.',
      openingApp: 'Launching desktop app...',
      shazamTitle: 'Identify Music',
      shazamDesc: 'Identify any song playing on TikTok, Instagram, Twitter/X or any web tab instantly.',
      listeningTitle: 'Listening to Tab...',
      listeningDesc: 'Analyzing acoustic fingerprint, please keep audio playing (60%)...',
      stopListeningBtn: 'Stop Listening',
      extractDirectBtn: '🎬 Extract Audio from This Video/Edit',
      recDownloadBtn: 'Download 320kbps on StreamPulse',
      recAgainBtn: 'Identify Another Track',
      recSuccess: 'Song Successfully Identified! 🎵',
      recFailed: 'No music detected. Please try again when the audio is clearer.',
      stoppedMsg: 'Listening cancelled.',
    }
  };

  let activeLang = 'tr';
  let currentLanguage = 'tr';
  let t = i18n.tr;
  const formatSectionTitle = document.getElementById('format-section-title') || document.querySelector('.formats-title');

  function applyLanguage(newLang) {
    activeLang = (newLang === 'en' || newLang === 'tr') ? newLang : 'tr';
    currentLanguage = activeLang;
    t = i18n[activeLang];

    if (tabLabelGrabber) tabLabelGrabber.textContent = t.tabGrabber;
    if (tabLabelShazam) tabLabelShazam.textContent = t.tabShazam;
    if (formatSectionTitle) formatSectionTitle.textContent = t.formatTitle;

    if (btnDownload) {
      const span = btnDownload.querySelector('span');
      if (span) span.textContent = t.downloadBtn;
    }
    if (btnOpenApp) {
      const span = btnOpenApp.querySelector('span');
      if (span) span.textContent = t.openAppBtn;
    }
    if (btnLabelStop) btnLabelStop.textContent = t.stopListeningBtn;
    if (btnLabelExtract) btnLabelExtract.textContent = t.extractDirectBtn;
    if (btnLabelRecDownload) btnLabelRecDownload.textContent = t.recDownloadBtn;
    if (btnLabelRecAgain) btnLabelRecAgain.textContent = t.recAgainBtn;

    if (customUrlInput) {
      customUrlInput.placeholder = t.inputPlaceholder;
    }
    if (!isYouTubeTab && mediaPlaceholder) {
      mediaPlaceholder.textContent = t.enterLinkPlaceholder;
    }
    if (!isYouTubeTab && mediaTitle) {
      mediaTitle.textContent = t.pasteLinkPlaceholder;
      mediaChannel.textContent = t.pasteChannelPlaceholder;
    }
    if (statusText) {
      const isOnline = statusIndicator.classList.contains('online');
      statusText.textContent = isOnline ? t.desktopOnline : t.desktopOffline;
    }

    if (!isRecognizing && !currentRecognizedTrack) {
      if (shazamStatusTitle) shazamStatusTitle.textContent = t.shazamTitle;
      if (shazamStatusDesc) shazamStatusDesc.textContent = t.shazamDesc;
    }
  }

  // 1. Instant Language Sync from Local Cache
  chrome.storage.local.get(['streampulse_language'], (res) => {
    if (res && res.streampulse_language) {
      applyLanguage(res.streampulse_language);
    }
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'local' && changes.streampulse_language) {
      applyLanguage(changes.streampulse_language.newValue);
    }
  });

  // 2. Tab Navigation (Instant 0ms Switch with Glider Animation)
  const segmentContainer = document.querySelector('.m3-segment-container, .segment-tabs');
  tabBtnGrabber.addEventListener('click', () => {
    tabBtnGrabber.classList.add('active');
    tabBtnShazam.classList.remove('active');
    if (segmentContainer) segmentContainer.classList.remove('active-shazam');
    viewGrabber.style.display = 'flex';
    viewShazam.style.display = 'none';
  });

  tabBtnShazam.addEventListener('click', () => {
    tabBtnShazam.classList.add('active');
    tabBtnGrabber.classList.remove('active');
    if (segmentContainer) segmentContainer.classList.add('active-shazam');
    viewShazam.style.display = 'flex';
    viewGrabber.style.display = 'none';
  });

  // 3. Ultra-Fast Asynchronous Desktop Status Check & UI Dimming
  function updateAppConnectionState(isOnline) {
    if (statusIndicator) statusIndicator.className = isOnline ? 'status online' : 'status offline';
    if (statusText) statusText.textContent = isOnline ? t.desktopOnline : t.desktopOffline;

    const formatsRow = document.querySelector('.formats-row');
    if (formatsRow) {
      formatsRow.style.opacity = isOnline ? '1' : '0.38';
      formatsRow.style.pointerEvents = isOnline ? 'auto' : 'none';
      formatsRow.style.transition = 'opacity 0.25s ease';
    }

    if (btnDownload) {
      btnDownload.style.opacity = isOnline ? '1' : '0.38';
      btnDownload.style.pointerEvents = isOnline ? 'auto' : 'none';
      btnDownload.style.cursor = isOnline ? 'pointer' : 'not-allowed';
      btnDownload.style.transition = 'opacity 0.25s ease';
      btnDownload.title = isOnline ? '' : (currentLanguage === 'en' ? 'Desktop app is closed' : 'Masaüstü uygulaması kapalı');
    }

    const recognizedDlBtn = document.getElementById('btn-download-recognized');
    if (recognizedDlBtn) {
      recognizedDlBtn.style.opacity = isOnline ? '1' : '0.38';
      recognizedDlBtn.style.pointerEvents = isOnline ? 'auto' : 'none';
      recognizedDlBtn.style.cursor = isOnline ? 'pointer' : 'not-allowed';
      recognizedDlBtn.style.transition = 'opacity 0.25s ease';
    }
  }

  async function checkAppStatusAsync() {
    chrome.runtime.sendMessage({ type: 'CHECK_DESKTOP_STATUS' }, (resp) => {
      if (!chrome.runtime.lastError && resp && resp.online) {
        if (resp.language && resp.language !== currentLanguage) {
          applyLanguage(resp.language);
          chrome.storage.local.set({ streampulse_language: resp.language });
        }
        updateAppConnectionState(true);
        return;
      }
      runDirectFetchCheck();
    });
  }

  async function runDirectFetchCheck() {
    const checkUrls = [
      'http://127.0.0.1:3001/api/health',
      'http://localhost:3001/api/health',
      'http://127.0.0.1:3001/api/settings'
    ];

    for (const u of checkUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 1200);
        const res = await fetch(u, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (res.ok) {
          const data = await res.json().catch(() => null);
          if (data) {
            const appLang = data.language || (data.settings && data.settings.language);
            if (appLang && appLang !== currentLanguage) {
              applyLanguage(appLang);
              chrome.storage.local.set({ streampulse_language: appLang });
            }
          }
          updateAppConnectionState(true);
          return;
        }
      } catch (e) {}
    }

    updateAppConnectionState(false);
  }

  checkAppStatusAsync();
  setInterval(checkAppStatusAsync, 2000);

  // 4. Query Active Tab Details
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (!tabs || tabs.length === 0) return;
    const tab = tabs[0];
    activeTabId = tab.id;
    currentTabUrl = tab.url || '';
    tabHintText = tab.title ? tab.title.replace(/ \/ X$/i, '').replace(/ - YouTube$/i, '').replace(/ - YouTube Music$/i, '').trim() : '';

    const isYouTube = currentTabUrl.includes('youtube.com') || currentTabUrl.includes('youtu.be');
    const isYtMusic = currentTabUrl.includes('music.youtube.com');

    if (isYouTube || isYtMusic) {
      isYouTubeTab = true;
      const cleanTitle = tab.title ? tab.title.replace(/ - YouTube Music$/i, '').replace(/ - YouTube$/i, '') : 'YouTube Media';
      mediaTitle.textContent = cleanTitle;
      mediaChannel.textContent = isYtMusic ? 'YouTube Music' : 'YouTube Video';

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
      mediaTitle.textContent = tab.title || t.pasteLinkPlaceholder;
      mediaChannel.textContent = currentTabUrl.includes('x.com') || currentTabUrl.includes('twitter.com') ? 'Twitter / X Media' : (currentTabUrl.includes('instagram.com') ? 'Instagram Reel' : (currentTabUrl.includes('tiktok.com') ? 'TikTok Media' : t.pasteChannelPlaceholder));
      mediaThumb.style.display = 'none';
      mediaPlaceholder.style.display = 'flex';
      mediaPlaceholder.textContent = t.enterLinkPlaceholder;
      customUrlBox.style.display = 'block';
    }
  });

  // 5. Format Selection
  formatButtons.forEach((btn) => {
    btn.addEventListener('click', () => {
      formatButtons.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');
      selectedType = btn.getAttribute('data-type') || 'mp3';
      selectedQuality = btn.getAttribute('data-quality') || '320';
    });
  });

  // =========================================================================
  // SIRI-STYLE GLSL WEBGL CHROMATIC WAVEFORM & FLUID AI ENGINE
  // =========================================================================
  const VERTEX_SHADER_SRC = `
    attribute vec2 aPos;
    void main() {
      gl_Position = vec4(aPos, 0.0, 1.0);
    }
  `;

  const WAVE_SHADER_SRC = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif

    uniform vec2 iResolution;
    uniform float iTime;
    uniform float iEnergy;

    const float PI = 3.14159265359;
    const float SPEED = 2.4;
    const float WAVE_SCALE = 0.55;

    vec3 spectral4(int s) {
      float x = float(s);
      return clamp(vec3(abs(x - 3.0) - 1.0, 2.0 - abs(x - 2.0), 2.0 - abs(x - 4.0)), 0.0, 1.0);
    }

    void main() {
      vec2 R = iResolution.xy;
      float aspect = R.x / R.y;
      vec2 p = (gl_FragCoord.xy * 2.0 - R) / min(R.x, R.y);
      p /= max(WAVE_SCALE, 0.1);

      float t = iTime;
      float low  = clamp(0.45 + 0.45 * sin(t * 0.8) * sin(t * 0.37 + 1.0) + iEnergy * 0.6, 0.0, 1.0);
      float mid  = clamp(0.40 + 0.40 * sin(t * 1.7 + 2.0) * sin(t * 0.53) + iEnergy * 0.5, 0.0, 1.0);
      float high = clamp(0.30 + 0.30 * sin(t * 2.9 + 4.0) * sin(t * 0.71 + 2.0) + iEnergy * 0.4, 0.0, 1.0);

      float drift = mod(t, 20.0 * PI) * SPEED;
      float xN = p.x / max(aspect, 1.0);
      float env = cos(PI * 0.5 * min(abs(0.9 * xN), 1.0));
      env *= env;

      float A1 = 0.32 + 0.06 * low + iEnergy * 0.22;
      float A2 = A1 + mid * 0.05 + high * 0.06;
      float AB = 2.6 + mid * 0.8 + high * 0.5;
      float th = 0.035;
      float inten = 0.025 + low * 0.02 + iEnergy * 0.03;
      float soft = 0.035;

      float yMain = A1 * env * sin(p.x * 1.1 + drift);

      vec3 num = vec3(0.0);
      vec3 den = vec3(0.0);

      for (int s = 0; s < 4; s++) {
        vec3 hue = spectral4(s);
        den += hue;
        float ab = mix(-AB, AB, float(s) / 3.0);
        float yL = A2 * env * sin(p.x * 1.0 + drift + ab);
        float d = abs(p.y - yL);
        float lor = 1.0 / (1.0 + (0.02 * d) * (0.02 * d));
        float line = inten / (sqrt(d * d + soft * soft) + th);
        float lo = min(yMain, yL);
        float hi = max(yMain, yL);
        float dBand = max(0.0, max(p.y - hi, lo - p.y));
        float band = (0.024 * inten) / (dBand + 0.08);
        num += hue * lor * (line + band);
      }

      vec3 col = num / max(den, vec3(0.001));
      float dM = abs(p.y - yMain);
      float lorM = 1.0 / (1.0 + (0.02 * dM) * (0.02 * dM));
      col += 0.5 * inten * lorM / (sqrt(dM * dM + soft * soft) + th);
      col = pow(max(col, vec3(0.0)), vec3(1.4));

      float gauss = exp(-pow(xN * 1.7, 2.0));
      col *= gauss;

      float alpha = clamp(max(col.r, max(col.g, col.b)) * 3.5, 0.0, 1.0);
      gl_FragColor = vec4(col, alpha);
    }
  `;

  const FLUID_DOTS_SHADER_SRC = `
    #ifdef GL_FRAGMENT_PRECISION_HIGH
    precision highp float;
    #else
    precision mediump float;
    #endif

    uniform vec2 iResolution;
    uniform float iTime;
    uniform float iEnergy;

    const float TAU = 6.28318530718;
    const int N = 6;

    float hash11(float n) {
      return fract(sin(n * 127.1 + 311.7) * 43758.5453);
    }

    float smin(float a, float b, float k) {
      float h = max(k - abs(a - b), 0.0) / k;
      return min(a, b) - h * h * k * 0.25;
    }

    vec3 hue2rgb(float h) {
      h = fract(h);
      float r = clamp(abs(h * 6.0 - 3.0) - 1.0, 0.0, 1.0);
      float g = clamp(2.0 - abs(h * 6.0 - 2.0), 0.0, 1.0);
      float b = clamp(2.0 - abs(h * 6.0 - 4.0), 0.0, 1.0);
      return vec3(r, g, b);
    }

    void main() {
      vec2 res = iResolution.xy;
      vec2 p = (2.0 * gl_FragCoord.xy - res) / min(res.x, res.y);
      float t = iTime;

      float total = 1e5;
      vec3 cAcc = vec3(0.0);
      float wAcc = 1e-6;

      float baseRadius = 0.52 + iEnergy * 0.12;

      for (int i = 0; i < N; i++) {
        float fi = float(i);
        float seed = hash11(fi);
        float ang = fi / float(N) * TAU + t * 0.45;
        vec2 dir = vec2(cos(ang), sin(ang));
        float r = baseRadius + 0.06 * sin(t * 1.8 + seed * TAU) + 0.04 * sin(t * 3.0 + fi);
        vec2 pos = r * dir;

        float d = length(p - pos) - (0.075 + 0.02 * sin(t * 2.0 + fi));
        total = smin(total, d, 0.12);

        float hue = fract(fi / float(N) + t * 0.08);
        vec3 dotCol = hue2rgb(hue);
        float w = exp(-d * 4.0);
        cAcc += w * dotCol;
        wAcc += w;
      }

      float sd = max(total, 0.0) + 1e-4;
      float core = clamp(0.0035 / pow(sd, 1.35), 0.0, 1.0);
      float edge = 1.0 - smoothstep(0.02, 0.55, sd);
      vec3 col = (core * edge * 1.6) * (cAcc / wAcc);

      col = pow(max(col, vec3(0.0)), vec3(0.85));
      float alpha = clamp(max(col.r, max(col.g, col.b)) * 3.2, 0.0, 1.0);
      gl_FragColor = vec4(col, alpha);
    }
  `;

  class WebGLSiriWaveVisualizer {
    constructor(canvasId) {
      this.canvas = document.getElementById(canvasId);
      if (!this.canvas) return;
      this.gl = this.canvas.getContext('webgl', { antialias: true, alpha: true });
      this.mode = 'ambient';
      this.running = false;
      this.raf = null;
      this.energy = 0;
      this.targetEnergy = 0;
      this.bands = [0, 0, 0, 0, 0, 0];
      this.targetBands = [0, 0, 0, 0, 0, 0];
      this.start = Date.now();
      this.waveProgram = null;
      this.fluidProgram = null;
      this.activeProgram = null;
      this.initGL();
    }

    createProgram(vsSrc, fsSrc) {
      const gl = this.gl;
      const compile = (type, src) => {
        const s = gl.createShader(type);
        gl.shaderSource(s, src);
        gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
          console.error("GLSL compile error:", gl.getShaderInfoLog(s));
        }
        return s;
      };
      const prog = gl.createProgram();
      const vs = compile(gl.VERTEX_SHADER, vsSrc);
      const fs = compile(gl.FRAGMENT_SHADER, fsSrc);
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      return prog;
    }

    initGL() {
      if (!this.gl) return;
      const gl = this.gl;
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

      this.waveProgram = this.createProgram(VERTEX_SHADER_SRC, WAVE_SHADER_SRC);
      this.fluidProgram = this.createProgram(VERTEX_SHADER_SRC, FLUID_DOTS_SHADER_SRC);
      this.activeProgram = this.fluidProgram;

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

      const aPos = gl.getAttribLocation(this.fluidProgram, 'aPos');
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      this.canvas.width = 240 * dpr;
      this.canvas.height = 240 * dpr;
      gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    }

    setMode(mode) {
      this.mode = mode;
      if (mode === 'listening') {
        this.activeProgram = this.waveProgram;
      } else {
        this.activeProgram = this.fluidProgram;
        this.targetEnergy = 0;
        this.targetBands = [0, 0, 0, 0, 0, 0];
      }
    }

    setAudioLevels(levels) {
      this.targetEnergy = levels.energy || 0;
      this.targetBands = [
        levels.b0 || 0,
        levels.b1 || 0,
        levels.b2 || 0,
        levels.b3 || 0,
        levels.b4 || 0,
        levels.b5 || 0,
      ];
    }

    start() {
      if (this.running || !this.gl) return;
      this.running = true;
      const loop = () => {
        if (!this.running) return;
        this.draw();
        this.raf = requestAnimationFrame(loop);
      };
      this.raf = requestAnimationFrame(loop);
    }

    stop() {
      this.running = false;
      if (this.raf) {
        cancelAnimationFrame(this.raf);
        this.raf = null;
      }
    }

    draw() {
      if (!this.gl || !this.activeProgram) return;
      const gl = this.gl;
      this.energy += (this.targetEnergy - this.energy) * 0.2;
      const speedMult = this.mode === 'listening' ? 1.5 + this.energy * 2.0 : 1.0;
      const elapsed = ((Date.now() - this.start) / 1000) * speedMult;

      gl.useProgram(this.activeProgram);
      const uRes = gl.getUniformLocation(this.activeProgram, 'iResolution');
      const uTime = gl.getUniformLocation(this.activeProgram, 'iTime');
      const uEnergy = gl.getUniformLocation(this.activeProgram, 'iEnergy');

      gl.uniform2f(uRes, this.canvas.width, this.canvas.height);
      gl.uniform1f(uTime, elapsed);
      if (uEnergy) gl.uniform1f(uEnergy, this.energy);

      gl.clearColor(0.0, 0.0, 0.0, 0.0);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    }
  }

  const aiNeuralCanvas = new WebGLSiriWaveVisualizer('shazam-ai-canvas');
  aiNeuralCanvas.start();

  // Listen for Live Audio Equalizer Levels from Offscreen Document
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'AUDIO_LEVELS' && msg.levels) {
      if (aiNeuralCanvas && isRecognizing) {
        aiNeuralCanvas.setAudioLevels(msg.levels);
      }
    }
  });

  // Tab Switching Canvas Power Management
  if (tabBtnGrabber) {
    tabBtnGrabber.addEventListener('click', () => {
      tabBtnGrabber.classList.add('active');
      tabBtnShazam.classList.remove('active');
      if (segmentContainer) segmentContainer.classList.remove('active-shazam');
      viewGrabber.style.display = 'flex';
      viewShazam.style.display = 'none';
      aiNeuralCanvas.stop();
    });
  }

  if (tabBtnShazam) {
    tabBtnShazam.addEventListener('click', () => {
      tabBtnShazam.classList.add('active');
      tabBtnGrabber.classList.remove('active');
      if (segmentContainer) segmentContainer.classList.add('active-shazam');
      viewShazam.style.display = 'flex';
      viewGrabber.style.display = 'none';
      loadHistory();
      aiNeuralCanvas.start();
    });
  }

  // =========================================================================
  // TAB 2: SHAZAM AI MUSIC RECOGNITION ACTIONS
  // =========================================================================
  function resetShazamStage() {
    isRecognizing = false;
    if (btnStartRecognition) btnStartRecognition.classList.remove('listening');
    if (shazamIconIdle) shazamIconIdle.style.display = 'flex';
    if (shazamLiveWave) shazamLiveWave.style.display = 'none';
    if (btnStopListening) btnStopListening.style.display = 'none';
    if (shazamStatusTitle) shazamStatusTitle.textContent = t.shazamTitle;
    if (shazamStatusDesc) shazamStatusDesc.textContent = t.shazamDesc;
    aiNeuralCanvas.setMode('ambient');
  }

  async function triggerRecognitionStart() {
    if (isRecognizing) return;
    isRecognizing = true;

    if (btnStartRecognition) btnStartRecognition.classList.add('listening');
    if (shazamIconIdle) shazamIconIdle.style.display = 'none';
    if (shazamLiveWave) shazamLiveWave.style.display = 'flex';
    if (btnStopListening) btnStopListening.style.display = 'flex';

    if (shazamStatusTitle) shazamStatusTitle.textContent = t.listeningTitle;
    if (shazamStatusDesc) shazamStatusDesc.textContent = t.listeningDesc;
    showFeedback(t.listeningTitle, 'info');

    aiNeuralCanvas.setMode('listening');

    try {
      chrome.runtime.sendMessage(
        { type: 'RECOGNIZE_AUDIO', tabId: activeTabId, hintText: tabHintText },
        (response) => {
          if (!isRecognizing) return; // cancelled

          resetShazamStage();

          if (response && response.success && response.track) {
            currentRecognizedTrack = response.track;
            renderRecognizedTrack(response.track, response.engine);
            showFeedback(t.recSuccess, 'success');
          } else {
            showFeedback(response?.error || t.recFailed, 'error');
          }
        }
      );
    } catch (e) {
      resetShazamStage();
      showFeedback(e.message || t.recFailed, 'error');
    }
  }

  if (btnStartRecognition) {
    btnStartRecognition.addEventListener('click', triggerRecognitionStart);
  }
  const shazamPulseBtn = document.getElementById('shazam-pulse-btn');
  if (shazamPulseBtn) {
    shazamPulseBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      triggerRecognitionStart();
    });
  }

  // Stop / Cancel Button Action
  btnStopListening.addEventListener('click', (e) => {
    e.stopPropagation();
    resetShazamStage();
    showFeedback(t.stoppedMsg, 'info');
    try {
      chrome.runtime.sendMessage({ target: 'offscreen', type: 'STOP_RECORDING' });
    } catch (err) {}
  });

  const shazamHistorySection = document.getElementById('shazam-history-section');
  const shazamHistoryList = document.getElementById('shazam-history-list');
  const btnClearHistory = document.getElementById('btn-clear-history');

  async function loadHistory() {
    try {
      const stored = await chrome.storage.local.get('streampulse_rec_history');
      const list = stored.streampulse_rec_history || [];
      if (!list || list.length === 0) {
        if (shazamHistorySection) shazamHistorySection.style.display = 'none';
        return;
      }
      if (shazamHistorySection) shazamHistorySection.style.display = 'flex';
      if (shazamHistoryList) {
        shazamHistoryList.innerHTML = '';
        list.forEach(item => {
          const el = document.createElement('div');
          el.className = 'history-item';
          el.innerHTML = `
            <img class="history-item-thumb" src="${item.artwork || '../icons/icon48.png'}" alt="cover">
            <div class="history-item-info">
              <span class="history-item-title truncate">${item.title}</span>
              <span class="history-item-artist truncate">${item.artist}</span>
            </div>
            <svg class="history-item-dl-icon" viewBox="0 0 24 24"><path d="M17 18v1H6v-1h11zm-.5-6.6l-.7-.7-3.8 3.7V4h-1v10.4l-3.8-3.8-.7.7 5 5 5-5z"/></svg>
          `;
          el.addEventListener('click', () => {
            currentRecognizedTrack = item;
            renderRecognizedTrack(item, 'SON ARAMALAR');
          });
          shazamHistoryList.appendChild(el);
        });
      }
    } catch (e) {}
  }

  async function saveToHistory(track) {
    try {
      if (!track || !track.title) return;
      const stored = await chrome.storage.local.get('streampulse_rec_history');
      let list = stored.streampulse_rec_history || [];
      list = list.filter(i => !(i.title.toLowerCase() === track.title.toLowerCase() && (i.artist || '').toLowerCase() === (track.artist || '').toLowerCase()));
      list.unshift(track);
      if (list.length > 6) list = list.slice(0, 6);
      await chrome.storage.local.set({ streampulse_rec_history: list });
      loadHistory();
    } catch (e) {}
  }

  if (btnClearHistory) {
    btnClearHistory.addEventListener('click', async (e) => {
      e.stopPropagation();
      await chrome.storage.local.remove('streampulse_rec_history');
      if (shazamHistorySection) shazamHistorySection.style.display = 'none';
    });
  }

  loadHistory();

  async function resolveDirectYouTubeMusicUrl(title, artist) {
    const query = `${artist} ${title}`.trim();

    // Layer 1: Universal YouTube HTML GET Search (100% Reliable, 0 CORS blocks)
    try {
      const res = await fetch(`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`);
      if (res.ok) {
        const html = await res.text();
        const vIdx = html.indexOf('/watch?v=');
        if (vIdx !== -1) {
          const vid = html.substring(vIdx + 9, vIdx + 20);
          if (vid && vid.length === 11 && !vid.includes('"') && !vid.includes('&') && !vid.includes('\\')) {
            return `https://music.youtube.com/watch?v=${vid}`;
          }
        }
      }
    } catch (e) {
      console.warn('[YTM Resolver Layer 1] Error:', e);
    }

    // Layer 2: YouTube Music WEB_REMIX API
    try {
      const res = await fetch('https://music.youtube.com/youtubei/v1/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          context: {
            client: {
              clientName: 'WEB_REMIX',
              clientVersion: '1.20240101.01.00',
              gl: 'TR',
              hl: 'tr'
            }
          },
          query: query
        })
      });
      if (res.ok) {
        const text = await res.text();
        const vIdx = text.indexOf('"videoId":"');
        if (vIdx !== -1) {
          const videoId = text.substring(vIdx + 11, vIdx + 22);
          if (videoId && videoId.length === 11 && !videoId.includes('"')) {
            return `https://music.youtube.com/watch?v=${videoId}`;
          }
        }
      }
    } catch (e) {
      console.warn('[YTM Direct Layer 2] Error:', e);
    }

    return `https://music.youtube.com/search?q=${encodeURIComponent(query)}`;
  }

  function renderRecognizedTrack(track, engineName) {
    requestAnimationFrame(() => {
      shazamStageIdle.style.display = 'none';
      shazamResultCard.style.display = 'flex';

      resultSongTitle.textContent = track.title || 'Unknown Title';
      resultArtistName.textContent = track.artist || 'Unknown Artist';
      resultAlbumName.textContent = track.album ? `${track.album} ${track.releaseDate ? '• ' + track.releaseDate : ''}` : '';
      resultEngineBadge.textContent = 'STREAMPULSE AI CORE';

      if (track.artwork) {
        resultCover.src = track.artwork;
        resultCover.style.display = 'block';
      } else {
        resultCover.src = '../icons/icon128.png';
      }

      saveToHistory(track);

      // Pre-resolve direct watch URL in background so clicking is instant
      resolveDirectYouTubeMusicUrl(track.title, track.artist).then(url => {
        if (url && url.includes('/watch?v=')) {
          track.directMusicUrl = url;
          saveToHistory(track);
        }
      });
    });
  }

  btnReRecognize.addEventListener('click', () => {
    currentRecognizedTrack = null;
    shazamResultCard.style.display = 'none';
    shazamStageIdle.style.display = 'flex';
    resetShazamStage();
    loadHistory();
  });

  // Direct YouTube Music Play Action (Opens Exact Track Instantly)
  const btnOpenYtm = document.getElementById('btn-open-ytm');
  if (btnOpenYtm) {
    btnOpenYtm.addEventListener('click', async () => {
      if (!currentRecognizedTrack) return;
      btnOpenYtm.disabled = true;
      btnOpenYtm.style.opacity = '0.7';

      let directUrl = currentRecognizedTrack.directMusicUrl;
      if (!directUrl || !directUrl.includes('/watch?v=')) {
        directUrl = await resolveDirectYouTubeMusicUrl(currentRecognizedTrack.title, currentRecognizedTrack.artist);
      }
      btnOpenYtm.disabled = false;
      btnOpenYtm.style.opacity = '1';
      if (directUrl) {
        chrome.tabs.create({ url: directUrl });
      }
    });
  }

  // One-Click Download for Recognized Track
  btnDownloadRecognized.addEventListener('click', async () => {
    if (!currentRecognizedTrack) return;

    btnDownloadRecognized.disabled = true;
    btnDownloadRecognized.style.opacity = '0.7';
    showFeedback(t.sending, 'info');

    const downloadQuery = currentRecognizedTrack.youtubeQuery || `${currentRecognizedTrack.artist} - ${currentRecognizedTrack.title}`;
    const payload = {
      id: 'shazam_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      url: downloadQuery,
      title: currentRecognizedTrack.title,
      uploader: currentRecognizedTrack.artist,
      thumbnail: currentRecognizedTrack.artwork || '',
      formatType: 'mp3',
      quality: '320',
      source: 'extension'
    };

    let sent = false;
    try {
      const res = await fetch('http://127.0.0.1:3001/api/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        sent = true;
        btnDownloadRecognized.disabled = false;
        btnDownloadRecognized.style.opacity = '1';
        showFeedback(t.started, 'success');
      }
    } catch (e) {}

    if (!sent) {
      btnDownloadRecognized.disabled = false;
      btnDownloadRecognized.style.opacity = '1';
      chrome.runtime.sendMessage({
        type: 'START_DOWNLOAD',
        url: downloadQuery,
        formatType: 'mp3',
        quality: '320',
        metadata: currentRecognizedTrack
      });
      showFeedback(t.appLaunched, 'success');
    }
  });

  // Direct Video Edit Audio Extraction Button
  if (btnExtractDirect) {
    btnExtractDirect.addEventListener('click', async () => {
      const targetUrl = currentTabUrl || '';
      if (!targetUrl || targetUrl.startsWith('chrome://') || targetUrl.startsWith('edge://')) {
        showFeedback(t.browserInternalUrl, 'error');
        return;
      }

      btnExtractDirect.disabled = true;
      btnExtractDirect.style.opacity = '0.7';
      showFeedback(t.sending, 'info');

      const payload = {
        id: 'edit_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
        url: targetUrl,
        title: tabHintText || mediaTitle.textContent || 'Video Edit Sesi',
        formatType: 'mp3',
        quality: '320',
        source: 'extension'
      };

      let sent = false;
      try {
        const res = await fetch('http://127.0.0.1:3001/api/download', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          sent = true;
          btnExtractDirect.disabled = false;
          btnExtractDirect.style.opacity = '1';
          showFeedback(t.started, 'success');
        }
      } catch (e) {}

      if (!sent) {
        btnExtractDirect.disabled = false;
        btnExtractDirect.style.opacity = '1';
        chrome.runtime.sendMessage({
          type: 'START_DOWNLOAD',
          url: targetUrl,
          formatType: 'mp3',
          quality: '320'
        });
        showFeedback(t.appLaunched, 'success');
      }
    });
  }

  // Tab 1: Download Media Button
  btnDownload.addEventListener('click', async () => {
    let downloadUrl = '';

    if (isYouTubeTab && currentTabUrl) {
      downloadUrl = currentTabUrl;
    } else if (customUrlInput.value.trim()) {
      downloadUrl = customUrlInput.value.trim();
    } else {
      showFeedback(t.invalidUrl, 'error');
      customUrlBox.style.display = 'block';
      customUrlInput.focus();
      return;
    }

    if (downloadUrl.startsWith('chrome://') || downloadUrl.startsWith('edge://') || downloadUrl.startsWith('about:')) {
      showFeedback(t.browserInternalUrl, 'error');
      return;
    }

    btnDownload.disabled = true;
    btnDownload.style.opacity = '0.7';
    showFeedback(t.sending, 'info');

    const payload = {
      id: 'ext_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
      url: downloadUrl,
      title: mediaTitle.textContent || 'YouTube Media',
      thumbnail: mediaThumb.src || '',
      formatType: selectedType,
      quality: selectedQuality,
      source: 'extension'
    };

    let sent = false;
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
        showFeedback(t.started, 'success');
      }
    } catch (e) {}

    if (!sent) {
      const deepLink = `streampulse://download?url=${encodeURIComponent(downloadUrl)}&format=${selectedType}&quality=${selectedQuality}`;
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        btnDownload.disabled = false;
        btnDownload.style.opacity = '1';
        showFeedback(t.appLaunched, 'success');
        if (tabs && tabs[0]?.id) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'OPEN_PROTOCOL', url: deepLink }, (res) => {
            if (chrome.runtime.lastError || !res?.success) {
              chrome.tabs.update(tabs[0].id, { url: deepLink });
            }
          });
        } else {
          window.location.href = deepLink;
        }
      });
    }
  });

  // Open Desktop App Button
  btnOpenApp.addEventListener('click', () => {
    showFeedback(t.openingApp, 'info');

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs && tabs[0]?.id) {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'OPEN_APP', url: 'streampulse://open' }, (res) => {
          if (chrome.runtime.lastError || !res?.success) {
            chrome.tabs.update(tabs[0].id, { url: 'streampulse://open' });
          }
        });
      } else {
        window.location.href = 'streampulse://open';
      }
    });
  });

  function showFeedback(text, type) {
    feedbackMsg.textContent = text;
    feedbackMsg.className = `feedback-msg ${type}`;
    setTimeout(() => {
      feedbackMsg.className = 'feedback-msg';
    }, 4000);
  }
});
