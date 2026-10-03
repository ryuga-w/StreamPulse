// StreamPulse - In-Page Ultra Luxury Floating Glass Studio (Shadow DOM)
// 100% Feature Parity with Extension Popup + Full Voice-Powered WebGL Orb + Draggable Floating Glass
(function () {
  'use strict';

  const SCRIPT_VERSION = '1.4.0';
  const HOST_ID = 'streampulse-glass-host';

  // Always clean up any stale container from previous injections
  const existingHost = document.getElementById(HOST_ID);
  if (existingHost) {
    try { existingHost.remove(); } catch (e) {}
  }

  let hostEl = null;
  let shadowRoot = null;
  let isPanelVisible = false;
  let isMinimized = false;

  // Active State
  let currentRecognizedTrack = null;
  let isRecognizing = false;
  let currentTabUrl = window.location.href;
  let selectedType = 'mp3';
  let selectedQuality = '320';
  let orbInstance = null;

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
    buildGlassStudio(shadowRoot);
    return shadowRoot;
  }

  function buildGlassStudio(root) {
    const iconUrl = typeof chrome !== 'undefined' && chrome.runtime ? chrome.runtime.getURL('icons/icon48.png') : '';

    root.innerHTML = `
      <style>
        * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
          font-family: 'YouTube Sans', 'Roboto', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
          user-select: none;
          scrollbar-width: thin;
          scrollbar-color: rgba(255, 255, 255, 0.2) transparent;
        }

        /* Custom Ultra-Slim Glass Scrollbar */
        *::-webkit-scrollbar {
          width: 4px;
          height: 4px;
        }

        *::-webkit-scrollbar-track {
          background: transparent;
        }

        *::-webkit-scrollbar-thumb {
          background: rgba(255, 255, 255, 0.18);
          border-radius: 999px;
        }

        *::-webkit-scrollbar-thumb:hover {
          background: rgba(255, 255, 255, 0.35);
        }

        *::-webkit-scrollbar-button {
          display: none;
          width: 0;
          height: 0;
        }

        /* Minimized Floating Pill */
        .glass-pill {
          position: fixed;
          bottom: 24px;
          right: 28px;
          height: 44px;
          padding: 0 16px 0 12px;
          background: rgba(15, 15, 22, 0.88);
          backdrop-filter: blur(28px) saturate(190%);
          -webkit-backdrop-filter: blur(28px) saturate(190%);
          border: 1px solid rgba(255, 255, 255, 0.15);
          border-radius: 22px;
          box-shadow: 0 14px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(139, 92, 246, 0.35);
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
          box-shadow: 0 18px 45px rgba(0, 0, 0, 0.7), 0 0 35px rgba(236, 72, 153, 0.45);
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
          width: 356px;
          max-height: 92vh;
          overflow-y: auto;
          scrollbar-width: none;
          background: rgba(13, 13, 19, 0.84);
          backdrop-filter: blur(36px) saturate(200%);
          -webkit-backdrop-filter: blur(36px) saturate(200%);
          border: 1px solid rgba(255, 255, 255, 0.12);
          border-radius: 28px;
          box-shadow: 0 30px 80px rgba(0, 0, 0, 0.75), 0 0 45px rgba(139, 92, 246, 0.25);
          display: flex;
          flex-direction: column;
          gap: 10px;
          padding: 14px;
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

        /* 1. Header */
        .header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 8px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          cursor: grab;
        }

        .header:active {
          cursor: grabbing;
        }

        .brand {
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .logo {
          width: 24px;
          height: 24px;
          border-radius: 7px;
          box-shadow: 0 2px 8px rgba(139, 92, 246, 0.4);
        }

        .title {
          font-size: 14px;
          font-weight: 700;
          color: #ffffff;
          letter-spacing: -0.2px;
        }

        .header-actions {
          display: flex;
          align-items: center;
          gap: 6px;
        }

        .status {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 4px 8px;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 14px;
          font-size: 10px;
          font-weight: 600;
          color: #a1a1aa;
        }

        .dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #ef4444;
          transition: all 0.2s ease;
        }

        .status.online {
          background: rgba(34, 197, 94, 0.1);
          border-color: rgba(34, 197, 94, 0.3);
          color: #86efac;
        }

        .status.online .dot {
          background: #22c55e;
          box-shadow: 0 0 6px rgba(34, 197, 94, 0.6);
        }

        .btn-ctl {
          width: 26px;
          height: 26px;
          display: flex;
          align-items: center;
          justify-content: center;
          background: rgba(255, 255, 255, 0.05);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 13px;
          color: #a1a1aa;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-ctl:hover {
          background: rgba(255, 255, 255, 0.12);
          color: #ffffff;
        }

        .btn-ctl svg {
          width: 14px;
          height: 14px;
          fill: currentColor;
        }

        /* 2. Tabs */
        .tabs {
          display: flex;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 16px;
          padding: 4px;
          gap: 4px;
        }

        .tab-btn {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 7px 10px;
          background: transparent;
          border: none;
          border-radius: 12px;
          color: #a1a1aa;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .tab-btn svg {
          width: 14px;
          height: 14px;
          fill: currentColor;
        }

        .tab-btn:hover {
          color: #ffffff;
        }

        .tab-btn.active {
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.28) 0%, rgba(236, 72, 153, 0.2) 100%);
          border: 1px solid rgba(139, 92, 246, 0.38);
          color: #ffffff;
          box-shadow: 0 2px 10px rgba(139, 92, 246, 0.2);
        }

        /* 3. Tab Contents */
        .tab-content {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .media-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }

        .media-thumb-box {
          position: relative;
          width: 100%;
          height: 105px;
          background: #09090b;
          overflow: hidden;
        }

        #media-thumb {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .media-ph {
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
          background: #101014;
        }

        .media-ph svg {
          width: 24px;
          height: 24px;
          fill: #71717a;
        }

        .media-info {
          padding: 10px 12px;
        }

        .media-title {
          font-size: 12px;
          font-weight: 700;
          color: #ffffff;
          line-height: 1.35;
        }

        .media-sub {
          font-size: 10.5px;
          color: #a1a1aa;
          margin-top: 2px;
        }

        .truncate {
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .custom-url-box {
          padding: 0 12px 10px 12px;
        }

        #custom-url-input {
          width: 100%;
          padding: 8px 12px;
          background: rgba(0, 0, 0, 0.45);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          color: #ffffff;
          font-size: 11px;
          outline: none;
        }

        #custom-url-input:focus {
          border-color: #8b5cf6;
        }

        .formats-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 5px;
        }

        .format-chip {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 1px;
          padding: 7px 4px;
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
          box-shadow: 0 2px 8px rgba(139, 92, 246, 0.35);
        }

        .format-chip strong {
          font-size: 11px;
          font-weight: 800;
          color: #ffffff;
        }

        .format-chip small {
          font-size: 8.5px;
          color: #a1a1aa;
        }

        .format-chip.active small {
          color: rgba(255, 255, 255, 0.9);
        }

        .btn-main {
          width: 100%;
          padding: 9.5px;
          background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 50%, #ec4899 100%);
          border: none;
          border-radius: 18px;
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          box-shadow: 0 4px 14px rgba(139, 92, 246, 0.35);
        }

        .btn-main:hover {
          background: linear-gradient(135deg, #9333ea 0%, #818cf8 50%, #f472b6 100%);
          box-shadow: 0 6px 18px rgba(139, 92, 246, 0.5);
        }

        .btn-main:active {
          transform: scale(0.98);
        }

        .btn-main.success-state {
          background: linear-gradient(135deg, #10b981 0%, #059669 100%) !important;
          box-shadow: 0 0 25px rgba(16, 185, 129, 0.65), 0 4px 14px rgba(5, 150, 105, 0.4) !important;
          transform: scale(1.02);
          pointer-events: none;
        }

        .btn-sub {
          width: 100%;
          padding: 8px;
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

        .btn-sub:hover {
          background: rgba(255, 255, 255, 0.1);
          color: #ffffff;
        }

        .btn-main svg, .btn-sub svg {
          width: 15px;
          height: 15px;
          fill: currentColor;
        }

        /* 4. Tab 2: Shazam AI with Full Voice-Powered Orb */
        .shazam-view {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 12px 6px;
          gap: 12px;
        }

        .shazam-btn-wrapper {
          position: relative;
          width: 220px;
          height: 220px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.16) 0%, rgba(59, 130, 246, 0.05) 50%, transparent 70%);
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), filter 0.3s ease;
        }

        .shazam-btn-wrapper:hover {
          transform: scale(1.04);
          filter: drop-shadow(0 0 25px rgba(139, 92, 246, 0.45));
        }

        .shazam-btn-wrapper:active {
          transform: scale(0.96);
        }

        .shazam-ai-canvas {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 220px;
          height: 220px;
          pointer-events: none;
          z-index: 1;
          border-radius: 50%;
        }

        .shazam-meta {
          text-align: center;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 6px;
        }

        /* Center Control Container (No round plate, purely centered) */
        .orb-center-btn {
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          width: 80px;
          height: 80px;
          background: transparent;
          border: none;
          box-shadow: none;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 2;
          pointer-events: none;
        }

        /* Large Pure Colorless Liquid Glass Play & Pause Icons */
        .orb-icon {
          width: 58px;
          height: 58px;
          filter: 
            drop-shadow(0 4px 16px rgba(0, 0, 0, 0.75))
            drop-shadow(0 0 14px rgba(255, 255, 255, 0.45))
            drop-shadow(0 0 28px rgba(255, 255, 255, 0.2));
          transition: transform 0.3s cubic-bezier(0.16, 1, 0.3, 1), filter 0.3s ease, opacity 0.2s ease;
          position: relative;
          z-index: 2;
          display: block;
          margin: 0 !important;
          padding: 0;
          box-sizing: border-box;
          flex-shrink: 0;
        }

        .shazam-btn-wrapper:hover .orb-icon {
          transform: scale(1.14);
          filter: 
            drop-shadow(0 6px 20px rgba(0, 0, 0, 0.85))
            drop-shadow(0 0 22px rgba(255, 255, 255, 0.85))
            drop-shadow(0 0 45px rgba(255, 255, 255, 0.4));
        }

        .shazam-btn-wrapper:active .orb-icon {
          transform: scale(0.92);
        }

        /* Listening State (Pause) Colorless Liquid Glass Pulse */
        .orb-icon-pause {
          animation: clear-glass-pulse 2s infinite ease-in-out;
        }

        @keyframes clear-glass-pulse {
          0%, 100% {
            transform: scale(1);
            filter: 
              drop-shadow(0 4px 16px rgba(0, 0, 0, 0.75))
              drop-shadow(0 0 16px rgba(255, 255, 255, 0.5))
              drop-shadow(0 0 30px rgba(255, 255, 255, 0.25));
          }
          50% {
            transform: scale(1.08);
            filter: 
              drop-shadow(0 6px 22px rgba(0, 0, 0, 0.85))
              drop-shadow(0 0 26px rgba(255, 255, 255, 0.95))
              drop-shadow(0 0 45px rgba(255, 255, 255, 0.5));
          }
        }

        .orb-icon-start,
        .orb-icon-pause {
          margin: 0 !important;
        }

        .shazam-title {
          font-size: 15px;
          font-weight: 700;
          color: #ffffff;
        }

        .btn-extract {
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 7px;
          padding: 9px 12px;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.08);
          border-radius: 18px;
          color: #c4b5fd;
          font-size: 11.5px;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .btn-extract:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: #8b5cf6;
          color: #ffffff;
        }

        .btn-extract svg {
          width: 14px;
          height: 14px;
          fill: currentColor;
        }

        .btn-extract.success-state {
          background: rgba(16, 185, 129, 0.25) !important;
          border-color: rgba(16, 185, 129, 0.8) !important;
          color: #34d399 !important;
          pointer-events: none;
        }

        /* Result Card */
        .result-card {
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(139, 92, 246, 0.35);
          border-radius: 16px;
          padding: 12px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          box-shadow: 0 4px 20px rgba(139, 92, 246, 0.25);
          animation: result-pop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }

        @keyframes result-pop {
          0% { opacity: 0; transform: scale(0.9) translateY(6px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }

        .result-top {
          display: flex;
          gap: 12px;
          align-items: center;
        }

        .result-thumb {
          width: 64px;
          height: 64px;
          border-radius: 12px;
          overflow: hidden;
          background: #09090b;
          flex-shrink: 0;
          border: 1px solid rgba(255, 255, 255, 0.1);
        }

        .result-thumb img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        .result-info {
          display: flex;
          flex-direction: column;
          gap: 2px;
          overflow: hidden;
        }

        .result-badge {
          align-self: flex-start;
          font-size: 8.5px;
          font-weight: 800;
          padding: 2.5px 8px;
          border-radius: 8px;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(236, 72, 153, 0.2) 100%);
          border: 1px solid rgba(139, 92, 246, 0.35);
          color: #e9d5ff;
        }

        .result-title {
          font-size: 13.5px;
          font-weight: 700;
          color: #ffffff;
        }

        .result-artist {
          font-size: 11.5px;
          font-weight: 600;
          color: #a78bfa;
        }

        .result-album {
          font-size: 10px;
          color: #71717a;
        }

        .result-btn-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 6px;
        }

        .btn-ytm {
          background: rgba(255, 0, 0, 0.1) !important;
          border: 1px solid rgba(255, 0, 0, 0.25) !important;
          color: #ff8a8a !important;
        }

        .btn-ytm:hover {
          background: rgba(255, 0, 0, 0.2) !important;
          color: #ffffff !important;
          border-color: rgba(255, 0, 0, 0.45) !important;
        }

        .ytm-icon-red {
          fill: #ef4444 !important;
        }

        /* History List */
        .history-section {
          display: flex;
          flex-direction: column;
          gap: 6px;
          margin-top: 4px;
          padding: 10px;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 14px;
        }

        .history-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .history-title {
          font-size: 10px;
          font-weight: 700;
          color: #a1a1aa;
          letter-spacing: 0.3px;
        }

        .history-clear-btn {
          background: transparent;
          border: none;
          color: #71717a;
          font-size: 9.5px;
          cursor: pointer;
          padding: 2px 4px;
        }

        .history-clear-btn:hover {
          color: #f87171;
        }

        .history-list {
          display: flex;
          flex-direction: column;
          gap: 4px;
          max-height: 125px;
          overflow-y: auto;
          padding-right: 2px;
          scrollbar-width: thin;
        }

        .history-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 10px;
          background: rgba(255, 255, 255, 0.03);
          border: 1px solid rgba(255, 255, 255, 0.04);
          border-radius: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
        }

        .history-item:hover {
          background: rgba(255, 255, 255, 0.08);
          border-color: #8b5cf6;
        }

        .history-item-thumb {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          object-fit: cover;
          background: #09090b;
          flex-shrink: 0;
        }

        .history-item-info {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          flex: 1;
        }

        .history-item-title {
          font-size: 11px;
          font-weight: 600;
          color: #f4f4f5;
          line-height: 1.2;
        }

        .history-item-artist {
          font-size: 9.5px;
          color: #a1a1aa;
        }

        .history-item-dl-icon {
          width: 13px;
          height: 13px;
          fill: #8b5cf6;
          opacity: 0.8;
        }

        /* Toast Feedback */
        .toast {
          display: none;
          padding: 8px 12px;
          border-radius: 12px;
          font-size: 10.5px;
          font-weight: 500;
          text-align: center;
        }

        .toast.show {
          display: block;
        }

        .toast.success {
          background: rgba(34, 197, 94, 0.15);
          color: #4ade80;
          border: 1px solid rgba(34, 197, 94, 0.3);
        }

        .toast.error {
          background: rgba(239, 68, 68, 0.15);
          color: #f87171;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        .footer {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 5px;
          font-size: 9.5px;
          color: #71717a;
          padding-top: 2px;
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
        <div class="header" id="drag-header">
          <div class="brand">
            <img src="${iconUrl}" class="logo" alt="StreamPulse">
            <span class="title">StreamPulse</span>
          </div>
          <div class="header-actions">
            <div class="status" id="app-status">
              <span class="dot"></span>
              <span id="status-text">Bağlanıyor...</span>
            </div>
            <button class="btn-ctl" id="btn-minimize" title="Küçült">
              <svg viewBox="0 0 24 24"><path d="M19 13H5v-2h14v2z"/></svg>
            </button>
            <button class="btn-ctl" id="btn-close" title="Kapat (Esc)">
              <svg viewBox="0 0 24 24"><path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/></svg>
            </button>
          </div>
        </div>

        <!-- 2. Segmented Pill Tabs -->
        <div class="tabs">
          <button class="tab-btn active" id="tab-btn-grabber">
            <svg viewBox="0 0 24 24"><path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM17 13l-5 5-5-5h3V9h4v4h3z"/></svg>
            <span>Medya İndirici</span>
          </button>
          <button class="tab-btn" id="tab-btn-shazam">
            <svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
            <span>Müzik Tanı (AI)</span>
          </button>
        </div>

        <!-- 3. TAB 1: GRABBER -->
        <div class="tab-content" id="view-grabber">
          <div class="media-card">
            <div class="media-thumb-box">
              <img id="media-thumb" src="" alt="Thumbnail" style="display: none;">
              <div class="media-ph" id="media-placeholder">
                <svg viewBox="0 0 24 24"><path d="M21 3H3c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h5v2h8v-2h5c1.1 0 1.99-.9 1.99-2L23 5c0-1.1-.9-2-2-2zm0 14H3V5h18v12zm-11-2l6-4-6-4v8z"/></svg>
                <span>Aktif Sekme Medyası</span>
              </div>
            </div>
            <div class="media-info">
              <h2 id="media-title" class="media-title truncate">Sekme taranıyor...</h2>
              <p id="media-channel" class="media-sub truncate">YouTube & YouTube Music</p>
            </div>
            <div class="custom-url-box" id="custom-url-box">
              <input type="text" id="custom-url-input" placeholder="YouTube linki veya şarkı adı girin...">
            </div>
          </div>

          <div class="formats-row">
            <button class="format-chip active" data-type="mp3" data-quality="320">
              <strong>MP3</strong>
              <small>320k</small>
            </button>
            <button class="format-chip" data-type="flac" data-quality="320">
              <strong>FLAC</strong>
              <small>Kayıpsız</small>
            </button>
            <button class="format-chip" data-type="video" data-quality="1080">
              <strong>1080p</strong>
              <small>FHD</small>
            </button>
            <button class="format-chip" data-type="video" data-quality="2160">
              <strong>4K</strong>
              <small>UHD</small>
            </button>
          </div>

          <button class="btn-main" id="btn-download">
            <svg viewBox="0 0 24 24"><path d="M17 18v1H6v-1h11zm-.5-6.6l-.7-.7-3.8 3.7V4h-1v10.4l-3.8-3.8-.7.7 5 5 5-5z"/></svg>
            <span class="btn-label" id="btn-download-label">Masaüstünde İndir</span>
          </button>

          <button class="btn-sub" id="btn-open-app">
            <svg viewBox="0 0 24 24"><path d="M19 19H5V5h7V3H5c-1.11 0-2 .9-2 2v14c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2v-7h-2v7zM14 3v2h3.59l-9.83 9.83 1.41 1.41L19 6.41V10h2V3h-7z"/></svg>
            <span>Masaüstü Uygulamasını Aç</span>
          </button>
        </div>

        <!-- 4. TAB 2: CLEAN SHAZAM RECOGNITION WITH FULL VOICE-POWERED ORB -->
        <div class="tab-content" id="view-shazam" style="display: none;">
          <div class="shazam-view" id="shazam-stage-idle">
            <!-- Full WebGL Voice-Powered Orb Container with Center Start/Pause Control -->
            <div class="shazam-btn-wrapper" id="btn-start-recognition" title="Müziği Tanı / Durdur">
              <canvas id="shazam-ai-canvas" width="240" height="240" class="shazam-ai-canvas"></canvas>
              <div class="orb-center-btn" id="orb-center-btn" title="Başlat / Duraklat">
                <!-- Large Pure Colorless Liquid Glass Play Icon (Idle) -->
                <svg class="orb-icon orb-icon-start" id="orb-icon-start" viewBox="0 0 24 24">
                  <defs>
                    <linearGradient id="clear-liquid-glass" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
                      <stop offset="25%" stop-color="#ffffff" stop-opacity="0.45"/>
                      <stop offset="65%" stop-color="#ffffff" stop-opacity="0.15"/>
                      <stop offset="100%" stop-color="#ffffff" stop-opacity="0.6"/>
                    </linearGradient>
                    <linearGradient id="clear-glass-specular" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stop-color="#ffffff" stop-opacity="0.95"/>
                      <stop offset="50%" stop-color="#ffffff" stop-opacity="0.3"/>
                      <stop offset="100%" stop-color="#ffffff" stop-opacity="0"/>
                    </linearGradient>
                  </defs>
                  <!-- Glass Body -->
                  <path fill="url(#clear-liquid-glass)" stroke="rgba(255, 255, 255, 0.9)" stroke-width="0.85" d="M7 5.5a1.2 1.2 0 0 1 1.8-1.04l9 5.5a1.2 1.2 0 0 1 0 2.08l-9 5.5A1.2 1.2 0 0 1 7 16.5v-11z"/>
                  <!-- Upper Glass Gloss Highlight -->
                  <path fill="url(#clear-glass-specular)" d="M7 5.5a1.2 1.2 0 0 1 1.8-1.04l9 5.5a1.2 1.2 0 0 1 0 1L7.5 12V5.5z" opacity="0.85"/>
                </svg>
                <!-- Large Pure Colorless Liquid Glass Pause Icon (Listening) -->
                <svg class="orb-icon orb-icon-pause" id="orb-icon-pause" viewBox="0 0 24 24" style="display: none;">
                  <!-- Glass Body -->
                  <path fill="url(#clear-liquid-glass)" stroke="rgba(255, 255, 255, 0.9)" stroke-width="0.85" d="M6.5 5a1.5 1.5 0 0 1 1.5-1.5h1A1.5 1.5 0 0 1 10.5 5v14a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 6.5 19V5zm7 0a1.5 1.5 0 0 1 1.5-1.5h1a1.5 1.5 0 0 1 1.5 1.5v14a1.5 1.5 0 0 1-1.5 1.5h-1a1.5 1.5 0 0 1-1.5-1.5V5z"/>
                  <!-- Upper Glass Gloss Highlights -->
                  <path fill="url(#clear-glass-specular)" d="M6.5 5a1.5 1.5 0 0 1 1.5-1.5h1A1.5 1.5 0 0 1 10.5 5v7H6.5V5zm7 0a1.5 1.5 0 0 1 1.5-1.5h1a1.5 1.5 0 0 1 1.5 1.5v7h-4V5z" opacity="0.85"/>
                </svg>
              </div>
            </div>

            <div class="shazam-meta">
              <h3 class="shazam-title" id="shazam-status-title">Müziği Tanı</h3>
            </div>

            <!-- Direct Video Audio Extract Button -->
            <button class="btn-extract" id="btn-extract-direct">
              <svg viewBox="0 0 24 24"><path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z"/></svg>
              <span id="btn-label-extract">🎬 Bu Editin / Videonun Sesini İndir</span>
            </button>
          </div>

          <!-- Result Card with Full Metadata & YouTube Music -->
          <div class="result-card" id="shazam-result-card" style="display: none;">
            <div class="result-top">
              <div class="result-thumb">
                <img id="result-cover" src="" alt="Album Artwork">
              </div>
              <div class="result-info">
                <span class="result-badge" id="result-engine-badge">STREAMPULSE AI CORE</span>
                <h3 id="result-song-title" class="result-title truncate">Şarkı Başlığı</h3>
                <p id="result-artist-name" class="result-artist truncate">Sanatçı Adı</p>
                <p id="result-album-name" class="result-album truncate">Albüm Adı</p>
              </div>
            </div>

            <button class="btn-main" id="btn-download-recognized">
              <svg viewBox="0 0 24 24"><path d="M17 18v1H6v-1h11zm-.5-6.6l-.7-.7-3.8 3.7V4h-1v10.4l-3.8-3.8-.7.7 5 5 5-5z"/></svg>
              <span id="btn-label-rec-download">StreamPulse ile 320kbps İndir</span>
            </button>

            <div class="result-btn-row">
              <button class="btn-sub btn-ytm" id="btn-open-ytm">
                <svg viewBox="0 0 24 24" class="ytm-icon-red"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z"/></svg>
                <span>YouTube Music</span>
              </button>

              <button class="btn-sub" id="btn-re-recognize">
                <svg viewBox="0 0 24 24"><path d="M17.65 6.35C16.2 4.9 14.21 4 12 4c-4.42 0-7.99 3.58-7.99 8s3.57 8 7.99 8c3.73 0 6.84-2.55 7.73-6h-2.08c-.82 2.33-3.04 4-5.65 4-3.31 0-6-2.69-6-6s2.69-6 6-6c1.66 0 3.14.69 4.22 1.78L13 11h7V4l-2.35 2.35z"/></svg>
                <span id="btn-label-rec-again">Başka Şarkı Tanı</span>
              </button>
            </div>
          </div>

          <!-- Son Keşfedilenler / History Section -->
          <div class="history-section" id="shazam-history-section" style="display: none;">
            <div class="history-header">
              <span class="history-title">🕒 Son Tanınanlar</span>
              <button class="history-clear-btn" id="btn-clear-history">Temizle</button>
            </div>
            <div class="history-list" id="shazam-history-list"></div>
          </div>
        </div>

        <!-- Toast Feedback -->
        <div class="toast" id="feedback-msg"></div>

        <!-- Footer -->
        <footer class="footer">
          <span>StreamPulse</span>
          <span>•</span>
          <span>v${SCRIPT_VERSION} Cam Studio</span>
        </footer>
      </div>
    `;

    bindStudioEvents(root);
    setupDragging(root);
    detectCurrentPageMedia(root);
    checkDesktopConnection(root);
    loadShazamHistory(root);

    // Initialize Voice-Powered WebGL Orb
    const orbCanvas = root.getElementById('shazam-ai-canvas');
    if (orbCanvas) {
      orbInstance = initVoicePoweredOrb(orbCanvas);
    }
  }

  // =========================================================================
  // VOICE-POWERED WEBGL GLSL SHADER ORB
  // =========================================================================
  function initVoicePoweredOrb(canvas) {
    const gl = canvas.getContext('webgl', { alpha: true, premultipliedAlpha: false, antialias: true }) ||
               canvas.getContext('experimental-webgl');

    if (!gl) {
      console.warn('WebGL unsupported for Orb');
      return null;
    }

    let state = 'idle';
    let targetHover = 0.0;
    let currentHover = 0.0;
    let targetHoverIntensity = 0.0;
    let currentHoverIntensity = 0.0;
    let currentRot = 0.0;
    let audioEnergy = 0.0;
    let targetAudioEnergy = 0.0;
    let animId = null;
    let isRunning = false;
    let lastTime = 0;

    const vertSrc = `
      precision highp float;
      attribute vec2 position;
      varying vec2 vUv;
      void main() {
        vUv = (position + 1.0) * 0.5;
        gl_Position = vec4(position, 0.0, 1.0);
      }
    `;

    const fragSrc = `
      precision highp float;
      uniform float iTime;
      uniform vec3 iResolution;
      uniform float hue;
      uniform float hover;
      uniform float rot;
      uniform float hoverIntensity;
      varying vec2 vUv;

      vec3 rgb2yiq(vec3 c) {
        float y = dot(c, vec3(0.299, 0.587, 0.114));
        float i = dot(c, vec3(0.596, -0.274, -0.322));
        float q = dot(c, vec3(0.211, -0.523, 0.312));
        return vec3(y, i, q);
      }

      vec3 yiq2rgb(vec3 c) {
        float r = c.x + 0.956 * c.y + 0.621 * c.z;
        float g = c.x - 0.272 * c.y - 0.647 * c.z;
        float b = c.x - 1.106 * c.y + 1.703 * c.z;
        return vec3(r, g, b);
      }

      vec3 adjustHue(vec3 color, float hueDeg) {
        float hueRad = hueDeg * 3.14159265 / 180.0;
        vec3 yiq = rgb2yiq(color);
        float cosA = cos(hueRad);
        float sinA = sin(hueRad);
        float i = yiq.y * cosA - yiq.z * sinA;
        float q = yiq.y * sinA + yiq.z * cosA;
        yiq.y = i;
        yiq.z = q;
        return yiq2rgb(yiq);
      }

      vec3 hash33(vec3 p3) {
        p3 = fract(p3 * vec3(0.1031, 0.11369, 0.13787));
        p3 += dot(p3, p3.yxz + 19.19);
        return -1.0 + 2.0 * fract(vec3(p3.x + p3.y, p3.x + p3.z, p3.y + p3.z) * p3.zyx);
      }

      float snoise3(vec3 p) {
        const float K1 = 0.333333333;
        const float K2 = 0.166666667;
        vec3 i = floor(p + (p.x + p.y + p.z) * K1);
        vec3 d0 = p - (i - (i.x + i.y + i.z) * K2);
        vec3 e = step(vec3(0.0), d0 - d0.yzx);
        vec3 i1 = e * (1.0 - e.zxy);
        vec3 i2 = 1.0 - e.zxy * (1.0 - e);
        vec3 d1 = d0 - (i1 - K2);
        vec3 d2 = d0 - (i2 - K1);
        vec3 d3 = d0 - 0.5;
        vec4 h = max(0.6 - vec4(dot(d0, d0), dot(d1, d1), dot(d2, d2), dot(d3, d3)), 0.0);
        vec4 n = h * h * h * h * vec4(dot(d0, hash33(i)), dot(d1, hash33(i + i1)), dot(d2, hash33(i + i2)), dot(d3, hash33(i + 1.0)));
        return dot(vec4(31.316), n);
      }

      vec4 extractAlpha(vec3 colorIn) {
        float a = max(max(colorIn.r, colorIn.g), colorIn.b);
        return vec4(colorIn.rgb / (a + 1e-5), a);
      }

      const vec3 baseColor1 = vec3(0.611765, 0.262745, 0.996078);
      const vec3 baseColor2 = vec3(0.298039, 0.760784, 0.913725);
      const vec3 baseColor3 = vec3(0.062745, 0.078431, 0.600000);
      const float innerRadius = 0.6;
      const float noiseScale = 0.65;

      float light1(float intensity, float attenuation, float dist) {
        return intensity / (1.0 + dist * attenuation);
      }

      float light2(float intensity, float attenuation, float dist) {
        return intensity / (1.0 + dist * dist * attenuation);
      }

      vec4 draw(vec2 uv) {
        vec3 color1 = adjustHue(baseColor1, hue);
        vec3 color2 = adjustHue(baseColor2, hue);
        vec3 color3 = adjustHue(baseColor3, hue);

        float ang = atan(uv.y, uv.x);
        float len = length(uv);
        float invLen = len > 0.0 ? 1.0 / len : 0.0;

        float n0 = snoise3(vec3(uv * noiseScale, iTime * 0.5)) * 0.5 + 0.5;
        float r0 = mix(mix(innerRadius, 1.0, 0.4), mix(innerRadius, 1.0, 0.6), n0);
        float d0 = distance(uv, (r0 * invLen) * uv);
        float v0 = light1(1.0, 10.0, d0);
        v0 *= smoothstep(r0 * 1.05, r0, len);
        float cl = cos(ang + iTime * 2.0) * 0.5 + 0.5;

        float a = iTime * -1.0;
        vec2 pos = vec2(cos(a), sin(a)) * r0;
        float d = distance(uv, pos);
        float v1 = light2(1.5, 5.0, d);
        v1 *= light1(1.0, 50.0, d0);

        float v2 = smoothstep(1.0, mix(innerRadius, 1.0, n0 * 0.5), len);
        float v3 = smoothstep(0.18, mix(innerRadius, 1.0, 0.5), len);
        float core = smoothstep(0.75, 0.0, len) * 0.28;

        vec3 col = mix(color1, color2, cl);
        col = mix(color3, col, v0);
        col = (col + v1) * v2 * v3 + mix(color1, color3, 0.5) * core;
        col = clamp(col, 0.0, 1.0);

        return extractAlpha(col);
      }

      vec4 mainImage(vec2 fragCoord) {
        vec2 center = iResolution.xy * 0.5;
        float size = min(iResolution.x, iResolution.y);
        vec2 uv = (fragCoord - center) / size * 2.0;

        float angle = rot;
        float s = sin(angle);
        float c = cos(angle);
        uv = vec2(c * uv.x - s * uv.y, s * uv.x + c * uv.y);

        uv.x += hover * hoverIntensity * 0.1 * sin(uv.y * 10.0 + iTime);
        uv.y += hover * hoverIntensity * 0.1 * sin(uv.x * 10.0 + iTime);

        return draw(uv);
      }

      void main() {
        vec2 fragCoord = vUv * iResolution.xy;
        vec4 col = mainImage(fragCoord);
        gl_FragColor = vec4(col.rgb * col.a, col.a);
      }
    `;

    function compileShader(type, src) {
      const s = gl.createShader(type);
      gl.shaderSource(s, src);
      gl.compileShader(s);
      return s;
    }

    const prog = gl.createProgram();
    gl.attachShader(prog, compileShader(gl.VERTEX_SHADER, vertSrc));
    gl.attachShader(prog, compileShader(gl.FRAGMENT_SHADER, fragSrc));
    gl.linkProgram(prog);
    gl.useProgram(prog);

    const posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const aPos = gl.getAttribLocation(prog, 'position');
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uTime = gl.getUniformLocation(prog, 'iTime');
    const uRes = gl.getUniformLocation(prog, 'iResolution');
    const uHue = gl.getUniformLocation(prog, 'hue');
    const uHover = gl.getUniformLocation(prog, 'hover');
    const uRot = gl.getUniformLocation(prog, 'rot');
    const uHoverInt = gl.getUniformLocation(prog, 'hoverIntensity');

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
    gl.clearColor(0, 0, 0, 0);

    function render(timeMs) {
      if (!isRunning) return;

      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const pw = Math.round(220 * dpr);
      const ph = Math.round(220 * dpr);
      if (canvas.width !== pw || canvas.height !== ph) {
        canvas.width = pw;
        canvas.height = ph;
      }
      gl.viewport(0, 0, canvas.width, canvas.height);

      const t = timeMs * 0.00045;
      const dt = lastTime ? Math.min(0.1, (timeMs - lastTime) * 0.001) : 0.016;
      lastTime = timeMs;

      audioEnergy += (targetAudioEnergy - audioEnergy) * 0.20;

      if (state === 'thinking') {
        // Active listening ripple & pulse (always alive while listening)
        const pulse = (Math.sin(timeMs * 0.0035) * 0.5 + 0.5) * 0.35;
        const totalEnergy = Math.max(audioEnergy, pulse);

        currentRot += dt * (0.12 + totalEnergy * 0.45);
        targetHover = Math.min(0.25 + totalEnergy * 1.5, 1.0);
        targetHoverIntensity = Math.min(0.25 + totalEnergy * 0.8, 0.85);
      } else {
        currentRot += dt * 0.03;
        targetHover = 0.0;
        targetHoverIntensity = 0.0;
      }

      currentHover += (targetHover - currentHover) * 0.12;
      currentHoverIntensity += (targetHoverIntensity - currentHoverIntensity) * 0.12;

      gl.useProgram(prog);
      gl.uniform1f(uTime, t);
      gl.uniform3f(uRes, canvas.width, canvas.height, 1.0);
      gl.uniform1f(uHue, 0.0);
      gl.uniform1f(uHover, currentHover);
      gl.uniform1f(uRot, currentRot);
      gl.uniform1f(uHoverInt, currentHoverIntensity);

      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.drawArrays(gl.TRIANGLES, 0, 3);

      animId = requestAnimationFrame(render);
    }

    function start() {
      if (isRunning) return;
      isRunning = true;
      lastTime = 0;
      animId = requestAnimationFrame(render);
    }

    function stop() {
      isRunning = false;
      if (animId) {
        cancelAnimationFrame(animId);
        animId = null;
      }
    }

    start();

    return {
      setState: (s) => { state = s; },
      setAudioLevels: (levels) => {
        if (levels) {
          targetAudioEnergy = Math.min(1.0, (levels.energy || 0) * 1.2 + (levels.kick || 0) * 0.8);
        }
      },
      start,
      stop
    };
  }

  // =========================================================================
  // STUDIO INTERACTION & EVENT BINDINGS
  // =========================================================================
  function bindStudioEvents(root) {
    const panel = root.getElementById('glass-panel');
    const pill = root.getElementById('glass-pill');
    const btnMinimize = root.getElementById('btn-minimize');
    const btnClose = root.getElementById('btn-close');
    const tabBtnGrabber = root.getElementById('tab-btn-grabber');
    const tabBtnShazam = root.getElementById('tab-btn-shazam');
    const viewGrabber = root.getElementById('view-grabber');
    const viewShazam = root.getElementById('view-shazam');
    const formatChips = root.querySelectorAll('.format-chip');
    const btnDownload = root.getElementById('btn-download');
    const btnOpenApp = root.getElementById('btn-open-app');
    const btnStartRec = root.getElementById('btn-start-recognition');
    const btnExtractDirect = root.getElementById('btn-extract-direct');
    const btnDownloadRecognized = root.getElementById('btn-download-recognized');
    const btnOpenYtm = root.getElementById('btn-open-ytm');
    const btnReRecognize = root.getElementById('btn-re-recognize');
    const btnClearHistory = root.getElementById('btn-clear-history');

    // Minimize & Close
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

    btnClose.addEventListener('click', () => {
      hideGlassPanel();
    });

    // Tab Switching
    tabBtnGrabber.addEventListener('click', () => {
      tabBtnGrabber.classList.add('active');
      tabBtnShazam.classList.remove('active');
      viewGrabber.style.display = 'flex';
      viewShazam.style.display = 'none';
      if (orbInstance) orbInstance.stop(); // Save GPU while on grabber
    });

    tabBtnShazam.addEventListener('click', () => {
      tabBtnShazam.classList.add('active');
      tabBtnGrabber.classList.remove('active');
      viewShazam.style.display = 'flex';
      viewGrabber.style.display = 'none';
      if (orbInstance) orbInstance.start(); // Resume Orb
    });

    // Format Chips
    formatChips.forEach(chip => {
      chip.addEventListener('click', () => {
        formatChips.forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        selectedType = chip.getAttribute('data-type') || 'mp3';
        selectedQuality = chip.getAttribute('data-quality') || '320';
      });
    });

    // Tab 1: Download Media Button
    btnDownload.addEventListener('click', () => {
      const customUrl = root.getElementById('custom-url-input').value.trim();
      const targetUrl = customUrl || window.location.href;
      const mediaTitle = root.getElementById('media-title').textContent || document.title;
      const thumb = root.getElementById('media-thumb').src || '';

      animateSuccess(btnDownload, 'İndirme Başlatıldı!');

      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          type: 'START_DOWNLOAD',
          url: targetUrl,
          formatType: selectedType,
          quality: selectedQuality,
          metadata: { title: mediaTitle, artwork: thumb }
        }, () => {
          showToast(root, 'İndirme StreamPulse uygulamasına aktarıldı! ⚡', 'success');
        });
      }
    });

    // Tab 1: Open Desktop App
    btnOpenApp.addEventListener('click', () => {
      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({ type: 'OPEN_APP' });
      }
      window.location.href = 'streampulse://open';
      showToast(root, 'StreamPulse Masaüstü başlatılıyor...', 'success');
    });

    // Tab 2: Start / Pause Shazam Recognition via Center Orb Button
    btnStartRec.addEventListener('click', () => {
      if (isRecognizing) {
        stopShazamRecognition(root);
      } else {
        startShazamRecognition(root);
      }
    });

    // Tab 2: Extract Current Tab Audio Directly
    btnExtractDirect.addEventListener('click', () => {
      animateSuccess(btnExtractDirect, 'Ses Kuyruğa Eklendi!');
      const targetUrl = window.location.href;
      const mediaTitle = document.title || 'Video Edit Sesi';

      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          type: 'START_DOWNLOAD',
          url: targetUrl,
          formatType: 'mp3',
          quality: '320',
          metadata: { title: mediaTitle }
        });
      }
      showToast(root, 'Bu videonun sesi 320kbps MP3 olarak kuyruğa alındı! 🎵', 'success');
    });

    // Tab 2: Download Recognized Track
    btnDownloadRecognized.addEventListener('click', () => {
      if (!currentRecognizedTrack) return;
      animateSuccess(btnDownloadRecognized, 'İndirme Başlatıldı!');
      const downloadQuery = currentRecognizedTrack.youtubeQuery || `${currentRecognizedTrack.artist} - ${currentRecognizedTrack.title}`;

      if (typeof chrome !== 'undefined' && chrome.runtime) {
        chrome.runtime.sendMessage({
          type: 'START_DOWNLOAD',
          url: downloadQuery,
          formatType: 'mp3',
          quality: '320',
          metadata: currentRecognizedTrack
        });
      }
      showToast(root, `"${currentRecognizedTrack.title}" indiriliyor! ⚡`, 'success');
    });

    // Tab 2: Direct YouTube Music Open
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
        window.open(directUrl, '_blank');
      }
    });

    // Tab 2: Re-Recognize
    btnReRecognize.addEventListener('click', () => {
      currentRecognizedTrack = null;
      root.getElementById('shazam-result-card').style.display = 'none';
      root.getElementById('shazam-stage-idle').style.display = 'flex';
      startShazamRecognition(root);
    });

    // Tab 2: Clear History
    btnClearHistory.addEventListener('click', async (e) => {
      e.stopPropagation();
      if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
        await chrome.storage.local.remove('streampulse_rec_history');
      }
      root.getElementById('shazam-history-section').style.display = 'none';
    });
  }

  // =========================================================================
  // SHAZAM RECOGNITION WORKFLOW & YOUTUBE MUSIC RESOLVER
  // =========================================================================
  function startShazamRecognition(root) {
    isRecognizing = true;
    if (orbInstance) orbInstance.setState('thinking');

    const btnWrapper = root.getElementById('btn-start-recognition');
    const orbCenterBtn = root.getElementById('orb-center-btn');
    const iconStart = root.getElementById('orb-icon-start');
    const iconPause = root.getElementById('orb-icon-pause');
    const title = root.getElementById('shazam-status-title');
    const resultCard = root.getElementById('shazam-result-card');

    if (btnWrapper) btnWrapper.classList.add('listening');
    if (orbCenterBtn) orbCenterBtn.classList.add('listening');
    if (iconStart) iconStart.style.display = 'none';
    if (iconPause) iconPause.style.display = 'block';

    resultCard.style.display = 'none';
    title.textContent = 'Sekme Dinleniyor...';

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'RECOGNIZE_AUDIO' }, (res) => {
        if (!isRecognizing) return;
        isRecognizing = false;
        if (orbInstance) orbInstance.setState('idle');
        if (btnWrapper) btnWrapper.classList.remove('listening');
        if (orbCenterBtn) orbCenterBtn.classList.remove('listening');
        if (iconStart) iconStart.style.display = 'block';
        if (iconPause) iconPause.style.display = 'none';

        if (res && res.success && res.track) {
          currentRecognizedTrack = res.track;
          renderRecognizedTrack(root, res.track);
        } else {
          title.textContent = 'Müzik Tespit Edilemedi';
          showToast(root, res?.error || 'Müzik net duyulamadı, ses çalarken tekrar deneyin.', 'error');
        }
      });
    }
  }

  function stopShazamRecognition(root) {
    isRecognizing = false;
    if (orbInstance) orbInstance.setState('idle');

    const btnWrapper = root.getElementById('btn-start-recognition');
    const orbCenterBtn = root.getElementById('orb-center-btn');
    const iconStart = root.getElementById('orb-icon-start');
    const iconPause = root.getElementById('orb-icon-pause');

    if (btnWrapper) btnWrapper.classList.remove('listening');
    if (orbCenterBtn) orbCenterBtn.classList.remove('listening');
    if (iconStart) iconStart.style.display = 'block';
    if (iconPause) iconPause.style.display = 'none';

    root.getElementById('shazam-status-title').textContent = 'Dinleme Durduruldu';

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'STOP_RECORDING' });
    }
  }

  function renderRecognizedTrack(root, track) {
    root.getElementById('shazam-stage-idle').style.display = 'none';
    const card = root.getElementById('shazam-result-card');
    card.style.display = 'flex';

    root.getElementById('result-song-title').textContent = track.title || 'Bilinmeyen Şarkı';
    root.getElementById('result-artist-name').textContent = track.artist || 'Bilinmeyen Sanatçı';
    root.getElementById('result-album-name').textContent = track.album || '';
    root.getElementById('result-cover').src = track.artwork || '';

    saveShazamHistory(root, track);

    // Pre-resolve YouTube Music exact link
    resolveDirectYouTubeMusicUrl(track.title, track.artist).then(url => {
      if (url && url.includes('/watch?v=')) {
        track.directMusicUrl = url;
      }
    });
  }

  async function resolveDirectYouTubeMusicUrl(title, artist) {
    const query = `${artist} ${title}`.trim();
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
    } catch (e) {}
    return `https://music.youtube.com/search?q=${encodeURIComponent(query)}`;
  }

  async function loadShazamHistory(root) {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;
      const stored = await chrome.storage.local.get('streampulse_rec_history');
      const list = stored.streampulse_rec_history || [];
      const historySec = root.getElementById('shazam-history-section');
      const historyList = root.getElementById('shazam-history-list');

      if (!list || list.length === 0) {
        if (historySec) historySec.style.display = 'none';
        return;
      }
      if (historySec) historySec.style.display = 'flex';
      if (historyList) {
        historyList.innerHTML = '';
        list.forEach(item => {
          const el = document.createElement('div');
          el.className = 'history-item';
          el.innerHTML = `
            <img class="history-item-thumb" src="${item.artwork || ''}" alt="cover">
            <div class="history-item-info">
              <span class="history-item-title truncate">${item.title}</span>
              <span class="history-item-artist truncate">${item.artist}</span>
            </div>
            <svg class="history-item-dl-icon" viewBox="0 0 24 24"><path d="M17 18v1H6v-1h11zm-.5-6.6l-.7-.7-3.8 3.7V4h-1v10.4l-3.8-3.8-.7.7 5 5 5-5z"/></svg>
          `;
          el.addEventListener('click', () => {
            currentRecognizedTrack = item;
            renderRecognizedTrack(root, item);
          });
          historyList.appendChild(el);
        });
      }
    } catch (e) {}
  }

  async function saveShazamHistory(root, track) {
    try {
      if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;
      const stored = await chrome.storage.local.get('streampulse_rec_history');
      let list = stored.streampulse_rec_history || [];
      list = list.filter(i => !(i.title.toLowerCase() === track.title.toLowerCase() && (i.artist || '').toLowerCase() === (track.artist || '').toLowerCase()));
      list.unshift(track);
      if (list.length > 6) list = list.slice(0, 6);
      await chrome.storage.local.set({ streampulse_rec_history: list });
      loadShazamHistory(root);
    } catch (e) {}
  }

  // =========================================================================
  // AUDIO LEVEL & MESSAGE BUS DISPATCHER
  // =========================================================================
  if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.onMessage) {
    chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
      if (msg.action === 'PING_STUDIO_VERSION') {
        sendResponse({ version: SCRIPT_VERSION });
        return true;
      }

      if (msg.action === 'TOGGLE_STREAM_PULSE_GLASS') {
        toggleGlassPanel();
        sendResponse({ success: true });
        return true;
      }

      if (msg.type === 'AUDIO_LEVELS' && shadowRoot) {
        // Feed into Voice-Powered WebGL Orb
        if (orbInstance) {
          orbInstance.setAudioLevels(msg.levels);
        }
      }
    });
  }

  function detectCurrentPageMedia(root) {
    const titleEl = root.getElementById('media-title');
    const channelEl = root.getElementById('media-channel');
    const thumbEl = root.getElementById('media-thumb');
    const phEl = root.getElementById('media-placeholder');

    const url = window.location.href;
    const videoIdMatch = url.match(/(?:v=|\/embed\/|\/shorts\/|youtu\.be\/|\/v\/)([^&?#/]+)/);

    if (videoIdMatch && videoIdMatch[1]) {
      const videoId = videoIdMatch[1];
      thumbEl.src = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
      thumbEl.style.display = 'block';
      phEl.style.display = 'none';

      const pageTitle =
        document.querySelector('h1.ytd-watch-metadata yt-formatted-string')?.innerText ||
        document.querySelector('ytmusic-player-bar .title')?.innerText ||
        document.title.replace(/ - YouTube.*$/i, '').trim();

      const channelName =
        document.querySelector('#owner #channel-name a')?.innerText ||
        document.querySelector('ytmusic-player-bar .byline a')?.innerText ||
        'YouTube & YouTube Music';

      titleEl.textContent = pageTitle || 'YouTube Medyası';
      channelEl.textContent = channelName;
    } else {
      titleEl.textContent = document.title || 'Aktif Web Sayfası';
      channelEl.textContent = window.location.hostname;
    }
  }

  function checkDesktopConnection(root) {
    const statusBox = root.getElementById('app-status');
    const statusText = root.getElementById('status-text');

    if (typeof chrome !== 'undefined' && chrome.runtime) {
      chrome.runtime.sendMessage({ type: 'CHECK_DESKTOP_STATUS' }, (res) => {
        if (res && res.online) {
          statusBox.className = 'status online';
          statusText.textContent = 'Masaüstü Bağlı';
        } else {
          statusBox.className = 'status';
          statusText.textContent = 'Masaüstü Kapalı';
        }
      });
    }
  }

  function setupDragging(root) {
    const panel = root.getElementById('glass-panel');
    const header = root.getElementById('drag-header');
    let isDragging = false;
    let startX = 0, startY = 0, initialLeft = 0, initialTop = 0;

    header.addEventListener('mousedown', (e) => {
      if (e.target.closest('button')) return;
      isDragging = true;
      const rect = panel.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      initialLeft = rect.left;
      initialTop = rect.top;
      panel.style.transition = 'none';

      function onMouseMove(moveEvent) {
        if (!isDragging) return;
        let newLeft = initialLeft + (moveEvent.clientX - startX);
        let newTop = initialTop + (moveEvent.clientY - startY);
        newLeft = Math.max(10, Math.min(window.innerWidth - panel.offsetWidth - 10, newLeft));
        newTop = Math.max(10, Math.min(window.innerHeight - panel.offsetHeight - 10, newTop));
        panel.style.left = `${newLeft}px`;
        panel.style.top = `${newTop}px`;
        panel.style.right = 'auto';
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

  function animateSuccess(btn, text) {
    const orig = btn.innerHTML;
    btn.classList.add('success-state');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" style="width:16px;height:16px;fill:currentColor;"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/></svg>
      <span>${text}</span>
    `;
    setTimeout(() => {
      btn.classList.remove('success-state');
      btn.innerHTML = orig;
    }, 2800);
  }

  function showToast(root, msg, type = 'success') {
    const t = root.getElementById('feedback-msg');
    t.textContent = msg;
    t.className = `toast show ${type}`;
    setTimeout(() => {
      t.className = 'toast';
    }, 3500);
  }

  function showGlassPanel() {
    const root = getShadowRoot();
    const panel = root.getElementById('glass-panel');
    const pill = root.getElementById('glass-pill');

    isPanelVisible = true;
    isMinimized = false;
    pill.classList.remove('show');
    panel.classList.add('show');
    detectCurrentPageMedia(root);
    checkDesktopConnection(root);
    if (orbInstance) orbInstance.start();
  }

  function hideGlassPanel() {
    if (!shadowRoot) return;
    const panel = shadowRoot.getElementById('glass-panel');
    const pill = shadowRoot.getElementById('glass-pill');

    isPanelVisible = false;
    isMinimized = false;
    panel.classList.remove('show');
    pill.classList.remove('show');
    if (orbInstance) orbInstance.stop();
  }

  function toggleGlassPanel() {
    if (isPanelVisible) {
      hideGlassPanel();
    } else {
      showGlassPanel();
    }
  }

  // Escape to close, Alt+S to toggle
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isPanelVisible) {
      hideGlassPanel();
    }
    if (e.altKey && (e.key === 's' || e.key === 'S')) {
      toggleGlassPanel();
    }
  });

  console.log('⚡ StreamPulse In-Page Glass Studio Ready (Shadow DOM + Voice Powered Orb)');
})();
