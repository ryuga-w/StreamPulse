// StreamPulse High-Performance Direct PCM Capture Engine
// Zero MediaRecorder CPU overhead - Direct Real-Time Audio Buffer
let audioContext = null;
let currentStream = null;
let scriptNode = null;
let isRecording = false;

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message.target !== 'offscreen') return;

  if (message.type === 'START_RECORDING') {
    startDirectPcmCapture(message.data.streamId, message.data.duration || 3800, message.data.hintText || '')
      .then(result => sendResponse(result))
      .catch(err => sendResponse({ success: false, error: err.message }));
    return true;
  }

  if (message.type === 'STOP_RECORDING') {
    stopCapture();
    sendResponse({ success: true });
    return true;
  }
});

async function startDirectPcmCapture(streamId, duration = 3800, hintText = '') {
  try {
    stopCapture();

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        mandatory: {
          chromeMediaSource: 'tab',
          chromeMediaSourceId: streamId
        }
      },
      video: false
    });

    currentStream = stream;
    audioContext = new AudioContext({ latencyHint: 'playback' });
    const source = audioContext.createMediaStreamSource(stream);

    // Keep tab audio playing through destination without lag
    source.connect(audioContext.destination);

    // Real-Time Audio Frequency Analyser (for live AI equalizer visualizer)
    const analyser = audioContext.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.75;
    source.connect(analyser);

    const freqData = new Uint8Array(analyser.frequencyBinCount);
    const levelInterval = setInterval(() => {
      if (!isRecording) {
        clearInterval(levelInterval);
        return;
      }
      try {
        analyser.getByteFrequencyData(freqData);
        const b0 = (freqData[1] || 0) / 255;
        const b1 = (freqData[3] || 0) / 255;
        const b2 = (freqData[6] || 0) / 255;
        const b3 = (freqData[10] || 0) / 255;
        const b4 = (freqData[16] || 0) / 255;
        const b5 = (freqData[22] || 0) / 255;
        const energy = (b0 * 1.6 + b1 * 1.3 + b2 + b3 + b4 + b5) / 6;

        chrome.runtime.sendMessage({
          type: 'AUDIO_LEVELS',
          levels: { b0, b1, b2, b3, b4, b5, energy }
        }).catch(() => {});
      } catch (err) {}
    }, 32);

    // Direct buffer collector: 4096 buffer size
    const bufferSize = 4096;
    scriptNode = audioContext.createScriptProcessor(bufferSize, 1, 1);

    const rawPcmChunks = [];
    const sourceSampleRate = audioContext.sampleRate;
    isRecording = true;

    scriptNode.onaudioprocess = (e) => {
      if (!isRecording) return;
      const inputData = e.inputBuffer.getChannelData(0);
      rawPcmChunks.push(new Float32Array(inputData));
    };

    source.connect(scriptNode);
    // Connect to destination to keep processor alive
    const muteGain = audioContext.createGain();
    muteGain.gain.value = 0;
    scriptNode.connect(muteGain);
    muteGain.connect(audioContext.destination);

    return new Promise((resolve) => {
      setTimeout(async () => {
        try {
          isRecording = false;
          stopCapture();

          // Merge all float buffers into one continuous 16kHz mono int16 array
          const totalLength = rawPcmChunks.reduce((acc, chunk) => acc + chunk.length, 0);
          const fullFloatArray = new Float32Array(totalLength);
          let offset = 0;
          for (const chunk of rawPcmChunks) {
            fullFloatArray.set(chunk, offset);
            offset += chunk.length;
          }

          const targetSampleRate = 16000;
          const ratio = sourceSampleRate / targetSampleRate;
          const targetLength = Math.round(totalLength / ratio);
          const pcmSamples = new Int16Array(targetLength);

          for (let i = 0; i < targetLength; i++) {
            const srcIdx = Math.floor(i * ratio);
            const sample = Math.max(-1, Math.min(1, fullFloatArray[srcIdx]));
            pcmSamples[i] = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
          }

          // 1. Direct Standalone Shazam Core Recognition
          if (window.ShazamRecognizer && pcmSamples.length > 8000) {
            try {
              const directShazamResult = await window.ShazamRecognizer.recognizePcmSamples(Array.from(pcmSamples));
              if (directShazamResult && directShazamResult.success && directShazamResult.track) {
                return resolve(directShazamResult);
              }
            } catch (err) {
              console.warn('[Shazam Core] Direct note:', err);
            }
          }

          // 2. Secondary Engine: AudD Neural Database fallback
          try {
            const wavBlob = pcmToWavBlob(pcmSamples, 16000);
            const formData = new FormData();
            formData.append('file', wavBlob, 'sample.wav');
            formData.append('return', 'apple_music,spotify');
            formData.append('api_token', '91a99540b0805187ff6a2aa73fa0599a');

            const auddRes = await fetch('https://api.audd.io/', {
              method: 'POST',
              body: formData
            });

            if (auddRes.ok) {
              const result = await auddRes.json();
              if (result && result.status === 'success' && result.result) {
                const r = result.result;
                const track = {
                  title: r.title || 'Unknown Title',
                  artist: r.artist || 'Unknown Artist',
                  album: r.album || '',
                  releaseDate: r.release_date || '',
                  artwork: r.spotify?.album?.images?.[0]?.url || r.apple_music?.artwork?.url?.replace('{w}x{h}', '600x600') || '',
                  youtubeQuery: `${r.artist} - ${r.title}`
                };
                return resolve({ success: true, track, engine: 'AudD Intelligence' });
              }
            }
          } catch (e) {}

          resolve({
            success: false,
            canExtractDirectly: true,
            error: 'Müzik veritabanlarında bulunamadı (Özel video miksi/edit olabilir).'
          });
        } catch (e) {
          resolve({ success: false, error: e.message });
        }
      }, duration);
    });
  } catch (error) {
    stopCapture();
    return { success: false, error: error.message };
  }
}

function stopCapture() {
  isRecording = false;
  if (scriptNode) {
    try {
      scriptNode.disconnect();
    } catch (e) {}
    scriptNode = null;
  }
  if (currentStream) {
    try {
      currentStream.getTracks().forEach(t => t.stop());
    } catch (e) {}
    currentStream = null;
  }
  if (audioContext && audioContext.state !== 'closed') {
    try {
      audioContext.close();
    } catch (e) {}
    audioContext = null;
  }
}

function pcmToWavBlob(pcmSamples, sampleRate) {
  const buffer = new ArrayBuffer(44 + pcmSamples.length * 2);
  const view = new DataView(buffer);

  const writeString = (offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + pcmSamples.length * 2, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true);
  view.setUint16(32, 2, true);
  view.setUint16(34, 16, true);
  writeString(36, 'data');
  view.setUint32(40, pcmSamples.length * 2, true);

  let offset = 44;
  for (let i = 0; i < pcmSamples.length; i++) {
    view.setInt16(offset, pcmSamples[i], true);
    offset += 2;
  }

  return new Blob([view], { type: 'audio/wav' });
}
