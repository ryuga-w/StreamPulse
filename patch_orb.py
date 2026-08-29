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
      targetKick: 0, targetSubBass: 0, targetLowMids: 0, targetMids: 0, targetTreble: 0, targetEnergy: 0, targetBeatHit: 0
    };

    function setAudioLevels(levels) {
      if (!levels) return;
      audioState.targetKick = levels.kick || 0;
      audioState.targetSubBass = levels.subBass || 0;
      audioState.targetLowMids = levels.lowMids || 0;
      audioState.targetMids = levels.mids || 0;
      audioState.targetTreble = levels.treble || 0;
      audioState.targetEnergy = levels.energy || 0;
      audioState.targetBeatHit = levels.beatHit || 0;
    }
"""
            body = body.replace('function setState(nextState) {', audio_engine + '\n    function setState(nextState) {')
            
            # Expose setAudioLevels
            body = body.replace('Object.defineProperty(window, "liquidOrb", {\n      value: Object.freeze({\n        getState: () => state,\n        setState,\n      }),\n    });', 'Object.defineProperty(window, "liquidOrb", {\n      value: Object.freeze({\n        getState: () => state,\n        setState,\n        setAudioLevels,\n      }),\n    });')
            
            # Audio uniform modulation in frame()
            modulation = """
          values.set(sampleTransition(now));

          // Tactile Real-Time Audio Reactivity (Snappy attack, exponential bass punch)
          audioState.kick += (audioState.targetKick - audioState.kick) * 0.45;
          audioState.subBass += (audioState.targetSubBass - audioState.subBass) * 0.35;
          audioState.lowMids += (audioState.targetLowMids - audioState.lowMids) * 0.30;
          audioState.mids += (audioState.targetMids - audioState.mids) * 0.30;
          audioState.treble += (audioState.targetTreble - audioState.treble) * 0.40;
          audioState.energy += (audioState.targetEnergy - audioState.energy) * 0.35;
          audioState.beatHit += (audioState.targetBeatHit - audioState.beatHit) * 0.60;

          if (state === "thinking" || audioState.energy > 0.015) {
            const punch = audioState.kick * 1.75 + audioState.beatHit * 2.2;
            values[36] += punch * 0.85 + audioState.subBass * 0.45; // ribbonBreath (Physical Expansion on Kick)
            values[4]  += audioState.kick * 0.045 + audioState.beatHit * 0.03; // radius (Subwoofer pulse)
            values[38] += audioState.energy * 0.85 + audioState.treble * 1.5 + audioState.beatHit * 0.9; // particleBloom (Snare / Treble flash)
            values[3]  += audioState.energy * 0.75; // speed (Tempo sync)
            values[34] += audioState.mids * 1.1; // ribbonTwist
            values[35] += audioState.lowMids * 0.8; // ribbonFold
            values[13] += audioState.beatHit * 0.35; // exposure punch
          }
"""
            body = body.replace('values.set(sampleTransition(now));', modulation)

            with open(r'C:\development\StreamPulse\extension\popup\orb-visualizer.js', 'w', encoding='utf-8') as out:
                out.write(body)
            print('Successfully patched orb-visualizer.js with tactile audio-reactivity!')
            break