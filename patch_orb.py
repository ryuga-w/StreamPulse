import json

transcript_path = r'C:\Users\musta\.gemini\antigravity\brain\383cdba8-932a-4a7e-a00c-01a37cabdec7\.system_generated\logs\transcript_full.jsonl'

with open(transcript_path, 'r', encoding='utf-8') as f:
    for line in f:
        data = json.loads(line)
        content = data.get('content', '')
        if '<!doctype html>' in content and 'Liquid Orb' in content:
            s_idx = content.find('<script')
            e_idx = content.rfind('</script>')
            body = content[content.find('>', s_idx)+1:e_idx].strip()
            
            # Adapt canvas selector
            body = body.replace('document.querySelector("#orb")', '(document.querySelector("#shazam-ai-canvas") || document.querySelector("#orb"))')
            
            # Add audioState and setAudioLevels
            audio_engine = """
    const audioState = {
      kick: 0, subBass: 0, lowMids: 0, mids: 0, treble: 0, energy: 0, beatHit: 0,
      targetKick: 0, targetSubBass: 0, targetLowMids: 0, targetMids: 0, targetTreble: 0, targetEnergy: 0, targetBeatHit: 0,
      lastAudioPacketAt: 0
    };

    function setAudioLevels(levels) {
      if (!levels) return;
      audioState.lastAudioPacketAt = performance.now();
      audioState.targetKick = Math.min(3.0, (levels.kick || 0) * 3.0);
      audioState.targetSubBass = Math.min(3.0, (levels.subBass || 0) * 2.5);
      audioState.targetLowMids = Math.min(2.5, (levels.lowMids || 0) * 2.2);
      audioState.targetMids = Math.min(2.5, (levels.mids || 0) * 2.2);
      audioState.targetTreble = Math.min(3.0, (levels.treble || 0) * 3.0);
      audioState.targetEnergy = Math.min(3.0, (levels.energy || 0) * 3.0);
      audioState.targetBeatHit = Math.min(4.0, (levels.beatHit || 0) * 4.0);
    }
"""
            body = body.replace('function setState(nextState) {', audio_engine + '\n    function setState(nextState) {')
            
            # Expose setAudioLevels cleanly on window.liquidOrb
            old_export = 'Object.defineProperty(window, "liquidOrb", {\n      value: Object.freeze({\n        getState: () => state,\n        setState,\n      }),\n    });'
            new_export = 'Object.defineProperty(window, "liquidOrb", {\n      value: Object.freeze({\n        getState: () => state,\n        setState,\n        setAudioLevels,\n      }),\n    });\n    window.setOrbAudioLevels = setAudioLevels;'
            body = body.replace(old_export, new_export)
            
            # Massive Audio uniform modulation in frame() with Guaranteed Beat Dynamics:
            modulation = """
          values.set(sampleTransition(now));

          // Real-Time Ultra-Punchy Physical Beat Reactivity (Live Audio + Procedural Rhythm Drive)
          audioState.kick += (audioState.targetKick - audioState.kick) * 0.60;
          audioState.subBass += (audioState.targetSubBass - audioState.subBass) * 0.50;
          audioState.lowMids += (audioState.targetLowMids - audioState.lowMids) * 0.45;
          audioState.mids += (audioState.targetMids - audioState.mids) * 0.45;
          audioState.treble += (audioState.targetTreble - audioState.treble) * 0.55;
          audioState.energy += (audioState.targetEnergy - audioState.energy) * 0.50;
          audioState.beatHit += (audioState.targetBeatHit - audioState.beatHit) * 0.75;

          if (state === "thinking" || audioState.energy > 0.005) {
            const sec = now * 0.001;
            const hasRecentAudio = (now - audioState.lastAudioPacketAt) < 500;
            
            // 128 BPM dynamic organic beat engine
            const beatPhase = (sec * 2.133) % 1.0;
            const proceduralKick = Math.pow(Math.max(0, 1.0 - beatPhase * 3.2), 2.8);
            const proceduralSnare = Math.pow(Math.max(0, Math.sin(sec * 4.266)), 6.0);
            const proceduralWave = 0.5 + 0.5 * Math.sin(sec * 3.5);

            const liveKick = audioState.kick * 2.8 + audioState.beatHit * 3.5;
            const effectiveKick = hasRecentAudio ? Math.max(liveKick, proceduralKick * 0.4) : proceduralKick * 1.2;
            const effectiveBloom = hasRecentAudio 
              ? (audioState.energy * 2.5 + audioState.treble * 4.0 + audioState.beatHit * 3.0)
              : (proceduralSnare * 1.8 + proceduralWave * 0.9);

            // 37: ribbonBreath (Massive Physical Ribbons PUMP on Beat)
            values[37] += effectiveKick * 2.6 + audioState.subBass * 1.8;
            // 34: ribbonWidth (Ribbons expand thicker on hits)
            values[34] += effectiveKick * 0.75 + audioState.lowMids * 0.65;
            // 38: particleSize (Particles grow larger on beats)
            values[38] += effectiveKick * 1.2;
            // 39: particleBloom (Blinding neon flares on snare & treble)
            values[39] += effectiveBloom;
            // 4: radius (Subwoofer physical punch)
            values[4]  += effectiveKick * 0.12;
            // 3: speed (Rapid spin with music BPM)
            values[3]  += effectiveKick * 1.2 + audioState.energy * 1.5;
            // 35: ribbonTwist (Warp on vocals)
            values[35] += audioState.mids * 2.2 + proceduralWave * 0.8;
            // 36: ribbonFold
            values[36] += audioState.lowMids * 1.5 + proceduralKick * 0.6;
            // 14: exposure (Luminous flash)
            values[14] += effectiveKick * 0.85;
            // 6: warp
            values[6]  += audioState.subBass * 1.2 + proceduralKick * 0.5;
          }
"""
            body = body.replace('values.set(sampleTransition(now));', modulation)

            with open(r'C:\development\StreamPulse\extension\popup\orb-visualizer.js', 'w', encoding='utf-8') as out:
                out.write(body)
            print('Successfully generated guaranteed beat-reactive orb-visualizer.js!')
            break