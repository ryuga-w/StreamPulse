// StreamPulse - In-Page Ultra Luxury Floating Glass Studio (Shadow DOM)
// Pure glassmorphism, 100% scoped styling, true border-radius 28px, draggable
(function () {
  'use strict';

  // Prevent multiple injections
  if (window.__streampulse_glass_initialized) return;
  window.__streampulse_glass_initialized = true;

  const HOST_ID = 'streampulse-glass-host';
  let hostEl = null;
  let shadowRoot = null;
  let isPanelVisible = false;
  let isMinimized = false;
  let isRecognizing = false;
  let currentRecognizedTrack = null;
  let selectedType = 'mp3';
  let selectedQuality = '320';

  // Create or get Shadow DOM host
  function getShadowRoot() {
    if (shadowRoot) return shadowRoot;

    hostEl = document.getElementById(HOST_ID);
    if (!hostEl) {
      hostEl = document.createElement('div');
      hostEl.id = HOST_ID;
      hostEl.style.all = 'initial';
      hostEl.style.position = 'fixed';
      hostEl.style.zIndex = '2147483647';
      hostEl.style.top = '0';
      hostEl.style.left = '0';
      hostEl.style.width = '0';
      hostEl.style.height = '0';
      hostEl.style.pointerEvents = 'none';
      document.documentElement.appendChild(hostEl);
    }

    shadowRoot = hostEl.attachShadow({ mode: 'open' });
    renderGlassInterface(shadowRoot);
    return shadowRoot;
  }

  function renderGlassInterface(root) {
    const iconUrl = typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime.getURL('icons/icon48.png') : '';

    root.innerHTML = `
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'YouTube Sans', sans-serif;
          user-select: none;
        }

        /* Floating Pill (Minimized state) */
        .glass-pill {
          position: fixed;
          bottom: 24px;
          right: 28px;
          height: 44px;
          padding: 0 16px 0 12px;
          background: rgba(15, 15, 22, 0.85);
          backdrop-filter: blur(24px) saturate(190%);
          -webkit-backdrop-filter: blur(24px) saturate(190%);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 22px;
          box-shadow: 0 12px 36px rgba(0, 0, 0, 0.5), 0 0 20px rgba(139, 92, 246, 0.35);
          display: flex;
          align-items: center;
          gap: 9px;
          cursor: pointer;
          pointer-events: auto;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          opacity: 0;
          transform: scale(0.85) translateY(12px);
          visibility: hidden;
          z-index: 2147483647;
        }

        .glass-pill.show {
          opacity: 1;
          transform: scale(1) translateY(0);
          visibility: visible;
        }

        .glass-pill:hover {
          transform: scale(1.05) translateY(-2px);
          box-shadow: 0 16px 42px rgba(0, 0, 0, 0.6), 0 0 30px rgba(236, 72, 153, 0.45);
          border-color: rgba(255, 255, 255, 0.3);
        }

        .glass-pill-icon {
          width: 22px;
          height: 22px;
          border-radius: 6px;
        }

        .glass-pill-text {
          font-size: 12px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.2px;
        }

        .glass-pill-badge {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          background: #22c55e;
          box-shadow: 0 0 8px #22c55e;
        }

        /* Main Floating Glass Panel */
        .glass-panel {
          position: fixed;
          top: 24px;
          right: 28px;
          width: 360px;
          max-height: 90vh;
          overflow-y: auto;
          scrollbar-width: none;
          background: rgba(13, 13, 19, 0.82);
          backdrop-filter: blur(36px) saturate(200%);
          -webkit-backdrop-filter: blur(36px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 28px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.7), 0 0 50px rgba(139, 92, 246, 0.25);
          display: flex;
          flex-direction: column;
          gap: 12px;
          padding: 16px;
          pointer-events: auto;
          color: #f4f4f5;
          opacity: 0;
          transform: scale(0.92) translateY(-14px);
          visibility: hidden;
          transition: opacity 0.3s cubic-bezier(0.16, 1, 0.3, 1), transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), visibility 0.3s;
          z-index: 2147483647;
        }

        .glass-panel::-webkit-scrollbar {
          display: none;
        }

        .glass-panel.show {
          opacity: 1;
          transform: scale(1) translateY(0);
          visibility: visible;
        }

        /* 1. Header & Drag Bar */
        .glass-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 10px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          cursor: grab;
        }

        .glass-header:active {
          cursor: grabbing;
        }

        .glass-brand {
          display: flex;
          align-items: center;
          gap: 9px;
        }

        .glass-logo {
          width: 24px;
          height: 24px;
          border-radius: 7px;
          box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
        }

        .glass-title {
          font-size: 14.5px;
          font-weight: 800;
          color: #ffffff;
          letter-spacing: -0.3px;
        }

        .glass-controls {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .glass-status {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px 8px;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 12px;
          font-size: 10px;
          font-weight: 600;
          color: #a1a1aa;
        }

        .glass-status .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ef4444;
        }

        .glass-status.online .dot {
          background: #22c55e;
          box-shadow: 0 0 6px #22c55e;
        }

        .glass-status.online {
          color: #86efac;
          border-color: rgba(34, 197, 94, 0.3);
          background: rgba(34, 197, 94, 0.1);
        }

        .btn-icon-ctl {
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.06);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 13px;
          color: #a1a1aa;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-icon-ctl:hover {
          background: rgba(255, 255, 255, 0.14);
          color: #ffffff;
        }

        .btn-icon-ctl svg {
          width: 14px;
          height: 14px;
          fill: currentColor;
        }

        /* 2. Tabs */
        .glass-tabs {
          display: flex;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 4px;
          gap: 4px;
        }

        .glass-tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 10px;
          background: transparent;
          border: none;
          border-radius: 12px;
          color: #a1a1aa;
          font-size: 11.5px;
          font-weight: 700;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .glass-tab-btn svg {
          width: 14px;
          height: 14px;
          fill: currentColor;
        }

        .glass-tab-btn:hover {
          color: #ffffff;
        }

        .glass-tab-btn.active {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(236, 72, 153, 0.22) 100%);
          border: 1px solid rgba(139, 92, 246, 0.4);
          color: #ffffff;
          box-shadow: 0 2px 10px rgba(139, 92, 246, 0.25);
        }

        /* 3. Tab Contents */
        .glass-view {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        /* Card */
        .glass-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 18px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .media-preview-box {
          position: relative;
          width: 100%;
          height: 110px;
          background: #09090c;
          overflow: hidden;
        }

        .media-preview-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .media-preview-placeholder {
          width: 100%;
          height: 100%;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 6px;
          color: #71717a;
          font-size: 11px;
          font-weight: 500;
          background: #111116;
        }

        .media-preview-placeholder svg {
          width: 26px;
          height: 26px;
          fill: #71717a;
        }

        .media-details {
          padding: 10px 12px;
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .media-details-title {
          font-size: 12.5px;
          font-weight: 700;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .media-details-sub {
          font-size: 10.5px;
          color: #a1a1aa;
        }

        .custom-url-input {
          margin: 0 12px 10px 12px;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.4);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: #ffffff;
          font-size: 11px;
          outline: none;
        }

        .custom-url-input:focus {
          border-color: #8b5cf6;
        }

        /* Format selector row */
        .format-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 6px;
        }

        .format-chip {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 2px;
          padding: 8px 4px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .format-chip:hover {
          background: rgba(255, 255, 255, 0.08);
        }

        .format-chip.active {
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #ec4899 100%);
          border-color: transparent;
          box-shadow: 0 3px 12px rgba(139, 92, 246, 0.4);
        }

        .format-chip strong {
          font-size: 11.5px;
          font-weight: 800;
          color: #ffffff;
        }

        .format-chip small {
          font-size: 8.5px;
          color: #a1a1aa;
        }

        .format-chip.active small {
          color: rgba(255, 255, 255, 0.95);
        }

        /* Buttons */
        .btn-action-primary {
          width: 100%;
          padding: 11px;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #ec4899 100%);
          border: none;
          border-radius: 18px;
          color: #ffffff;
          font-size: 12.5px;
          font-weight: 800;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          cursor: pointer;
          transition: all 0.2s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 18px rgba(139, 92, 246, 0.4);
        }

        .btn-action-primary:hover {
          background: linear-gradient(135deg, #9333ea 0%, #818cf8 50%, #f472b6 100%);
          box-shadow: 0 6px 24px rgba(139, 92, 246, 0.55);
          transform: translateY(-1px);
        }

        .btn-action-primary:active {
          transform: scale(0.98);
        }

        .btn-action-primary.success {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          box-shadow: 0 0 25px rgba(16, 185, 129, 0.6) !important;
        }

        .btn-action-secondary {
          width: 100%;
          padding: 8.5px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          color: #e4e4e7;
          font-size: 11.5px;
          font-weight: 600;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-action-secondary:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        .btn-action-primary svg, .btn-action-secondary svg {
          width: 15px;
          height: 15px;
          fill: currentColor;
        }

        /* 4. Shazam View */
        .shazam-studio {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 12px 6px;
          gap: 14px;
        }

        .shazam-orb-wrapper {
          position: relative;
          width: 150px;
          height: 150px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.25) 0%, rgba(236, 72, 153, 0.1) 60%, transparent 100%);
          border: 1px solid rgba(139, 92, 246, 0.35);
          box-shadow: 0 0 35px rgba(139, 92, 246, 0.35);
          transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
        }

        .shazam-orb-wrapper:hover {
          transform: scale(1.05);
          box-shadow: 0 0 45px rgba(236, 72, 153, 0.5);
          border-color: rgba(236, 72, 153, 0.6);
        }

        .shazam-orb-wrapper.listening {
          animation: orb-pulse 1.6s infinite ease-in-out;
          border-color: rgba(236, 72, 153, 0.8);
          box-shadow: 0 0 50px rgba(236, 72, 153, 0.65);
        }

        @keyframes orb-pulse {
          0% { transform: scale(1); box-shadow: 0 0 35px rgba(139, 92, 246, 0.4); }
          50% { transform: scale(1.08); box-shadow: 0 0 60px rgba(236, 72, 153, 0.7); }
          100% { transform: scale(1); box-shadow: 0 0 35px rgba(139, 92, 246, 0.4); }
        }

        .shazam-orb-icon {
          width: 48px;
          height: 48px;
          fill: #ffffff;
          filter: drop-shadow(0 2px 14px rgba(236, 72, 153, 0.6));
          transition: transform 0.2s ease;
        }

        .shazam-orb-wrapper:hover .shazam-orb-icon {
          transform: scale(1.1);
        }

        /* Live Studio Equalizer Pill */
        .eq-pill {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 3px;
          height: 28px;
          padding: 0 14px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(168, 85, 247, 0.35);
          border-radius: 14px;
          backdrop-filter: blur(12px);
          -webkit-backdrop-filter: blur(12px);
          box-shadow: 0 0 16px rgba(168, 85, 247, 0.3);
        }

        .eq-bar {
          width: 2.5px;
          height: 6px;
          min-height: 4px;
          max-height: 18px;
          border-radius: 2px;
          background: linear-gradient(180deg, #38bdf8 0%, #a855f7 50%, #ec4899 100%);
          transition: height 0.08s ease-out;
        }

        .shazam-meta {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }

        .shazam-headline {
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
        }

        .shazam-subtext {
          font-size: 11px;
          color: #a1a1aa;
          max-width: 270px;
          line-height: 1.4;
        }

        .btn-stop-listening {
          display: flex;
          align-items: center;
          gap: 6px;
          padding: 6px 16px;
          background: rgba(239, 68, 68, 0.15);
          border: 1px solid rgba(239, 68, 68, 0.3);
          border-radius: 16px;
          color: #f87171;
          font-size: 11px;
          font-weight: 600;
          cursor: pointer;
        }

        .btn-stop-listening:hover {
          background: rgba(239, 68, 68, 0.25);
          color: #ffffff;
        }

        /* Result Card */
        .recognized-card {
          width: 100%;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(139, 92, 246, 0.35);
          border-radius: 18px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-shadow: 0 8px 25px rgba(139, 92, 246, 0.25);
          animation: rec-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes rec-pop {
          0% { opacity: 0; transform: scale(0.9) translateY(8px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }

        .rec-top {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .rec-cover {
          width: 64px;
          height: 64px;
          border-radius: 12px;
          object-fit: cover;
          background: #09090c;
          border: 1px solid rgba(255, 255, 255, 0.12);
        }

        .rec-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }

        .rec-badge {
          align-self: flex-start;
          font-size: 8.5px;
          font-weight: 800;
          padding: 2.5px 8px;
          border-radius: 8px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.3) 0%, rgba(236, 72, 153, 0.25) 100%);
          border: 1px solid rgba(139, 92, 246, 0.4);
          color: #e9d5ff;
        }

        .rec-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #ffffff;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .rec-artist {
          font-size: 11.5px;
          font-weight: 600;
          color: #a78bfa;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .rec-buttons {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }

        /* Toast Notice */
        .glass-toast {
          display: none;
          padding: 8px 12px;
          border-radius: 12px;
          font-size: 11px;
          font-weight: 600;
          text-align: center;
        }

        .glass-toast.show {
          display: block;
        }

        .glass-toast.success {
          background: rgba(34, 197, 94, 0.15);
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .glass-toast.error {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
      </style>

      <!-- Minimized Floating Pill -->
      <div class="glass-pill" id="glass-pill">
        <img src="${iconUrl}" class="glass-pill-icon" alt="StreamPulse">
        <span class="glass-pill-text">StreamPulse</span>
        <div class="glass-pill-badge"></div>
      </div>

      <!-- Main In-Page Floating Glass Studio Panel -->
      <div class="glass-panel" id="glass-panel">
        <!-- 1. Header with Drag Handle -->
        <div class="glass-header" id="glass-drag-handle">
          <div class="glass-brand">
            <img src="${iconUrl}" class="glass-logo" alt="StreamPulse">
            <span class="glass-title">StreamPulse</span>
          </div>
          <div class="glass-controls">
            <div class="glass-status" id="glass-desktop-status">
              <span class="dot"></span>
              <span id="glass-desktop-status-text">Bağlanıyor...</span>
            </div>
            <button class="btn-icon-ctl" id="btn-minimize" title="Küçült">
              <svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>
            </button>
            <button class="btn-icon-ctl" id="btn-close" title="Kapat (Esc)">
              <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
            </button>
          </div>
        </div>

        <!-- 2. Segmented Pill Tabs -->
        <div class="glass-tabs">
          <button class="glass-tab-btn active" id="tab-btn-grabber">
            <svg viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/></svg>
            <span>Medya İndirici</span>
          </button>
          <button class="glass-tab-btn" id="tab-btn-shazam">
            <svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
            <span>Müzik Tanı (AI)</span>
          </button>
        </div>

        <!-- 3. Tab 1: Grabber View -->
        <div class="glass-view" id="view-grabber">
          <div class="glass-card">
            <div class="media-preview-box">
              <img id="media-preview-img" class="media-preview-img" style="display: none;" alt="Preview">
              <div class="media-preview-placeholder" id="media-placeholder">
                <svg viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12zm-11-2l6-4-6-4v8z"/></svg>
                <span id="media-placeholder-text">Aktif Sayfa Medyası</span>
              </div>
            </div>
            <div class="media-details">
              <span class="media-details-title" id="media-title">Sayfa Taranıyor...</span>
              <span class="media-details-sub" id="media-sub">YouTube, YouTube Music veya Doğrudan Link</span>
            </div>
            <input type="text" id="custom-url-input" class="custom-url-input" placeholder="Farklı bir YouTube linki veya şarkı adı girin...">
          </div>

          <!-- Format chips -->
          <div class="format-row">
            <div class="format-chip active" data-type="mp3" data-quality="320">
              <strong>MP3</strong>
              <small>320k</small>
            </div>
            <div class="format-chip" data-type="flac" data-quality="320">
              <strong>FLAC</strong>
              <small>Kayıpsız</small>
            </div>
            <div class="format-chip" data-type="video" data-quality="1080">
              <strong>1080p</strong>
              <small>FHD</small>
            </div>
            <div class="format-chip" data-type="video" data-quality="2160">
              <strong>4K</strong>
              <small>UHD</small>
            </div>
          </div>

          <!-- Action buttons -->
          <button class="btn-action-primary" id="btn-download">
            <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
            <span id="btn-download-label">Masaüstünde İndir</span>
          </button>

          <button class="btn-action-secondary" id="btn-open-desktop">
            <svg viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
            <span>Uygulamayı Aç</span>
          </button>
        </div>

        <!-- 4. Tab 2: Shazam View -->
        <div class="glass-view" id="view-shazam" style="display: none;">
          <div class="shazam-studio">
            <div class="shazam-orb-wrapper" id="shazam-orb">
              <svg class="shazam-orb-icon" viewBox="0 0 24 24">
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/>
              </svg>
            </div>

            <!-- Live Equalizer Capsule (Shown while listening) -->
            <div class="eq-pill" id="shazam-eq-pill" style="display: none;">
              <span class="eq-bar"></span><span class="eq-bar"></span><span class="eq-bar"></span>
              <span class="eq-bar"></span><span class="eq-bar"></span><span class="eq-bar"></span>
              <span class="eq-bar"></span><span class="eq-bar"></span><span class="eq-bar"></span>
              <span class="eq-bar"></span><span class="eq-bar"></span><span class="eq-bar"></span>
            </div>

            <div class="shazam-meta">
              <span class="shazam-headline" id="shazam-status-title">Müziği Tanı</span>
              <span class="shazam-subtext" id="shazam-status-desc">TikTok, Instagram, YouTube veya sekmede çalan şarkıyı dinleyip anında tanıyın.</span>
            </div>

            <button class="btn-stop-listening" id="btn-stop-listening" style="display: none;">
              <svg viewBox="0 0 24 24" width="12" height="12" fill="currentColor"><path d="M6 6h12v12H6z"/></svg>
              <span>Dinlemeyi Durdur</span>
            </button>
          </div>

          <!-- Result Card (Shown when recognized) -->
          <div class="recognized-card" id="shazam-result-card" style="display: none;">
            <div class="rec-top">
              <img id="rec-cover" class="rec-cover" src="" alt="Album Art">
              <div class="rec-info">
                <span class="rec-badge" id="rec-badge">SHAZAM AI</span>
                <span class="rec-title" id="rec-title">Şarkı Adı</span>
                <span class="rec-artist" id="rec-artist">Sanatçı</span>
              </div>
            </div>
            <div class="rec-buttons">
              <button class="btn-action-primary" id="btn-rec-download">
                <svg viewBox="0 0 24 24"><path d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"/></svg>
                <span>320k İndir</span>
              </button>
              <button class="btn-action-secondary" id="btn-rec-again">
                <span>Tekrar Tanı</span>
              </button>
            </div>
          </div>
        </div>

        <!-- Toast -->
        <div class="glass-toast" id="glass-toast"></div>
      </div>
    `;

    bindGlassEvents(root);
    detectPageMedia(root);
    checkDesktopStatus(root);
  }

  function bindGlassEvents(root) {
    const panel = root.getElementById('glass-panel');
    const pill = root.getElementById('glass-pill');
    const dragHandle = root.getElementById('glass-drag-handle');
    const btnMinimize = root.getElementById('btn-minimize');
    const btnClose = root.getElementById('btn-close');
    const tabBtnGrabber = root.getElementById('tab-btn-grabber');
    const tabBtnShazam = root.getElementById('tab-btn-shazam');
    const viewGrabber = root.getElementById('view-grabber');
    const viewShazam = root.getElementById('view-shazam');
    const formatChips = root.querySelectorAll('.format-chip');
    const btnDownload = root.getElementById('btn-download');
    const btnOpenDesktop = root.getElementById('btn-open-desktop');
    const shazamOrb = root.getElementById('shazam-orb');
    const btnStopListening = root.getElementById('btn-stop-listening');
    const btnRecDownload = root.getElementById('btn-rec-download');
    const btnRecAgain = root.getElementById('btn-rec-again');
    const toast = root.getElementById('glass-toast');

    function showToast(msg, type = 'success') {
      toast.textContent = msg;
      toast.className = `glass-toast show ${type}`;
      setTimeout(() => {
        toast.className = 'glass-toast';
      }, 3500);
    }

    // Toggle minimize
    btnMinimize.addEventListener('click', () => {
      isMinimized = true;
      panel.classList.remove('show');
      pill.classList.add('show');
    });

    pill.addEventListener('click', () => {
      isMinimized = false;
      pill.classList.remove('show');
      panel.classList.add('show');
    });

    // Close panel
    btnClose.addEventListener('click', () => {
      hideGlassPanel();
    });

    // Tabs switching
    tabBtnGrabber.addEventListener('click', () => {
      tabBtnGrabber.classList.add('active');
      tabBtnShazam.classList.remove('active');
      viewGrabber.style.display = 'flex';
      viewShazam.style.display = 'none';
    });

    tabBtnShazam.addEventListener('click', () => {
      tabBtnShazam.classList.add('active');
      tabBtnGrabber.classList.remove('active');
      viewShazam.style.display = 'flex';
      viewGrabber.style.display = 'none';
    });

    // Format chip selection
    formatChips.forEach(chip => {
      chip.addEventListener('click', () => {
        formatChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        selectedType = chip.getAttribute('data-type') || 'mp3';
        selectedQuality = chip.getAttribute('data-quality') || '320';
      });
    });

    // Download button action
    btnDownload.addEventListener('click', () => {
      const customUrl = root.getElementById('custom-url-input').value.trim();
      const targetUrl = customUrl || window.location.href;
      const mediaTitle = root.getElementById('media-title').textContent || document.title;
      const thumb = root.getElementById('media-preview-img').src || '';

      btnDownload.classList.add('success');
      btnDownload.querySelector('#btn-download-label').textContent = 'Kuyruğa Eklendi ✓';

      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          type: 'START_DOWNLOAD',
          url: targetUrl,
          formatType: selectedType,
          quality: selectedQuality,
          metadata: { title: mediaTitle, artwork: thumb }
        }, (res) => {
          showToast('İndirme StreamPulse uygulamasına aktarıldı! ⚡', 'success');
        });
      }

      setTimeout(() => {
        btnDownload.classList.remove('success');
        btnDownload.querySelector('#btn-download-label').textContent = 'Masaüstünde İndir';
      }, 3000);
    });

    // Open desktop app
    btnOpenDesktop.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({ type: 'OPEN_APP' });
      }
      window.location.href = 'streampulse://open';
      showToast('StreamPulse Masaüstü başlatılıyor...', 'success');
    });

    // Shazam recognition trigger
    shazamOrb.addEventListener('click', () => {
      if (isRecognizing) return;
      startShazamRecognition(root);
    });

    btnStopListening.addEventListener('click', () => {
      stopShazamRecognition(root);
    });

    btnRecAgain.addEventListener('click', () => {
      root.getElementById('shazam-result-card').style.display = 'none';
      startShazamRecognition(root);
    });

    btnRecDownload.addEventListener('click', () => {
      if (!currentRecognizedTrack) return;
      const query = currentRecognizedTrack.youtubeQuery || `${currentRecognizedTrack.artist} ${currentRecognizedTrack.title}`;
      chrome.runtime.sendMessage({
        type: 'START_DOWNLOAD',
        url: query,
        formatType: 'mp3',
        quality: '320',
        metadata: {
          title: currentRecognizedTrack.title,
          artist: currentRecognizedTrack.artist,
          artwork: currentRecognizedTrack.artwork
        }
      });
      showToast(`"${currentRecognizedTrack.title}" 320kbps MP3 olarak indiriliyor!`, 'success');
    });

    // Make Panel Draggable
    setupDragging(panel, dragHandle);
  }

  function setupDragging(panel, handle) {
    let isDragging = false;
    let startX = 0;
    let startY = 0;
    let initialLeft = 0;
    let initialTop = 0;

    handle.addEventListener('mousedown', (e) => {
      // Don't drag if clicking buttons
      if (e.target.closest('button')) return;

      isDragging = true;
      const rect = panel.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      initialLeft = rect.left;
      initialTop = rect.top;

      panel.style.transition = 'none'; // Instant response while dragging

      function onMouseMove(moveEvent) {
        if (!isDragging) return;
        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;

        let newLeft = initialLeft + dx;
        let newTop = initialTop + dy;

        // Keep inside screen viewport
        newLeft = Math.max(10, Math.min(window.innerWidth - panel.offsetWidth - 10, newLeft));
        newTop = Math.max(10, Math.min(window.innerHeight - panel.offsetHeight - 10, newTop));

        panel.style.left = `${newLeft}px`;
        panel.style.top = `${newTop}px`;
        panel.style.right = 'auto'; // Clear right anchor
      }

      function onMouseUp() {
        isDragging = false;
        panel.style.transition = '';
        window.removeEventListener('mousemove', onMouseMove);
        window.removeEventListener('mouseup', onMouseUp);
      }

      window.addEventListener('mousemove', onMouseMove);
      window.addEventListener('mouseup', onMouseUp);
    });
  }

  function detectPageMedia(root) {
    const titleEl = root.getElementById('media-title');
    const thumbEl = root.getElementById('media-preview-img');
    const placeholder = root.getElementById('media-placeholder');

    const url = window.location.href;
    const videoIdMatch = url.match(/(?:v=|\/embed\/|\/shorts\/|youtu\.be\/|\/v\/)([^&?#/]+)/);

    if (videoIdMatch && videoIdMatch[1]) {
      const videoId = videoIdMatch[1];
      const thumbUrl = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      thumbEl.src = thumbUrl;
      thumbEl.style.display = 'block';
      placeholder.style.display = 'none';

      // Grab title from page
      const ytTitle =
        document.querySelector('h1.ytd-watch-metadata yt-formatted-string')?.innerText ||
        document.querySelector('ytmusic-player-bar .title')?.innerText ||
        document.title.replace(/ - YouTube.*$/i, '').trim();

      titleEl.textContent = ytTitle || 'YouTube Medyası';
    } else {
      titleEl.textContent = document.title || 'Mevcut Sekme';
    }
  }

  function checkDesktopStatus(root) {
    const statusBox = root.getElementById('glass-desktop-status');
    const statusText = root.getElementById('glass-desktop-status-text');

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'CHECK_DESKTOP_STATUS' }, (res) => {
        if (res && res.online) {
          statusBox.classList.add('online');
          statusText.textContent = 'Masaüstü Bağlı';
        } else {
          statusBox.classList.remove('online');
          statusText.textContent = 'Masaüstü Kapalı';
        }
      });
    }
  }

  function startShazamRecognition(root) {
    isRecognizing = true;
    const orb = root.getElementById('shazam-orb');
    const eqPill = root.getElementById('shazam-eq-pill');
    const title = root.getElementById('shazam-status-title');
    const desc = root.getElementById('shazam-status-desc');
    const btnStop = root.getElementById('btn-stop-listening');
    const resultCard = root.getElementById('shazam-result-card');

    resultCard.style.display = 'none';
    orb.classList.add('listening');
    eqPill.style.display = 'flex';
    title.textContent = 'Sekme Dinleniyor...';
    desc.textContent = 'Akustik parmak izi analiz ediliyor, lütfen sesi kısmayın...';
    btnStop.style.display = 'flex';

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'RECOGNIZE_AUDIO' }, (res) => {
        if (!isRecognizing) return;
        isRecognizing = false;
        orb.classList.remove('listening');
        eqPill.style.display = 'none';
        btnStop.style.display = 'none';

        if (res && res.success && res.track) {
          currentRecognizedTrack = res.track;
          title.textContent = 'Müzik Tanındı! 🎵';
          desc.textContent = `${res.track.artist} - ${res.track.title}`;

          root.getElementById('rec-title').textContent = res.track.title;
          root.getElementById('rec-artist').textContent = res.track.artist;
          root.getElementById('rec-cover').src = res.track.artwork || '';
          resultCard.style.display = 'flex';
        } else {
          title.textContent = 'Tespit Edilemedi';
          desc.textContent = res?.error || 'Müzik net duyulamadı, ses çalarken tekrar deneyin.';
        }
      });
    }
  }

  function stopShazamRecognition(root) {
    isRecognizing = false;
    const orb = root.getElementById('shazam-orb');
    const eqPill = root.getElementById('shazam-eq-pill');
    const title = root.getElementById('shazam-status-title');
    const desc = root.getElementById('shazam-status-desc');
    const btnStop = root.getElementById('btn-stop-listening');

    orb.classList.remove('listening');
    eqPill.style.display = 'none';
    btnStop.style.display = 'none';
    title.textContent = 'Dinleme Durduruldu';
    desc.textContent = 'Tekrar dinlemek için orb simgesine tıklayın.';

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ target: 'offscreen', type: 'STOP_RECORDING' });
    }
  }

  // Live Audio Equalizer Listener
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.action === 'TOGGLE_STREAM_PULSE_GLASS') {
        toggleGlassPanel();
        return;
      }

      if (msg.type === 'AUDIO_LEVELS' && isRecognizing && shadowRoot) {
        const eqBars = shadowRoot.querySelectorAll('#shazam-eq-pill .eq-bar');
        if (eqBars && eqBars.length > 0 && msg.levels) {
          const bands = [
            msg.levels.subBass || 0,
            msg.levels.kick || 0,
            msg.levels.lowMids || 0,
            msg.levels.mids || 0,
            msg.levels.treble || 0,
            msg.levels.energy || 0
          ];
          for (let i = 0; i < eqBars.length; i++) {
            const bandIdx = i < 6 ? i : 11 - i;
            const val = bands[bandIdx] || 0.08;
            const h = Math.max(4, Math.min(18, Math.round(val * 20)));
            eqBars[i].style.height = `${h}px`;
          }
        }
      }
    });
  }

  function showGlassPanel() {
    const root = getShadowRoot();
    const panel = root.getElementById('glass-panel');
    const pill = root.getElementById('glass-pill');

    isPanelVisible = true;
    isMinimized = false;
    pill.classList.remove('show');
    panel.classList.add('show');
    detectPageMedia(root);
    checkDesktopStatus(root);
  }

  function hideGlassPanel() {
    if (!shadowRoot) return;
    const panel = shadowRoot.getElementById('glass-panel');
    const pill = shadowRoot.getElementById('glass-pill');

    isPanelVisible = false;
    isMinimized = false;
    panel.classList.remove('show');
    pill.classList.remove('show');
  }

  function toggleGlassPanel() {
    if (isPanelVisible) {
      hideGlassPanel();
    } else {
      showGlassPanel();
    }
  }

  // Keyboard shortcut listener: Escape closes panel, Alt+S toggles
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isPanelVisible) {
      hideGlassPanel();
    }
    if (e.altKey && (e.key === 's' || e.key === 'S')) {
      toggleGlassPanel();
    }
  });

  // Auto-listen for navigation events on YouTube
  ['yt-navigate-finish', 'sp-navigate-finish'].forEach(evt => {
    window.addEventListener(evt, () => {
      if (shadowRoot && isPanelVisible) {
        detectPageMedia(shadowRoot);
      }
    });
  });

  console.log('⚡ StreamPulse In-Page Glass Studio Ready (Shadow DOM)');
})();
