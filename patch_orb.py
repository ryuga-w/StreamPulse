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
      audioState.targetKick = Math.min(1.5, (levels.kick || 0) * 1.8);
      audioState.targetSubBass = Math.min(1.5, (levels.subBass || 0) * 1.8);
      audioState.targetLowMids = Math.min(1.5, (levels.lowMids || 0) * 1.6);
      audioState.targetMids = Math.min(1.5, (levels.mids || 0) * 1.6);
      audioState.targetTreble = Math.min(1.5, (levels.treble || 0) * 2.0);
      audioState.targetEnergy = Math.min(1.5, (levels.energy || 0) * 1.8);
      audioState.targetBeatHit = Math.min(2.0, (levels.beatHit || 0) * 2.5);
    }
"""
            body = body.replace('function setState(nextState) {', audio_engine + '\n    function setState(nextState) {')
            
            # Expose setAudioLevels cleanly on window.liquidOrb
            old_export = 'Object.defineProperty(window, "liquidOrb", {\n      value: Object.freeze({\n        getState: () => state,\n        setState,\n      }),\n    });'
            new_export = 'Object.defineProperty(window, "liquidOrb", {\n      value: Object.freeze({\n        getState: () => state,\n        setState,\n        setAudioLevels,\n      }),\n    });\n    window.setOrbAudioLevels = setAudioLevels;'
            body = body.replace(old_export, new_export)
            
            # Massive Audio uniform modulation in frame()
            modulation = """
          values.set(sampleTransition(now));

          // Real-Time Ultra-Punchy Physical Beat Reactivity
          audioState.kick += (audioState.targetKick - audioState.kick) * 0.55;
          audioState.subBass += (audioState.targetSubBass - audioState.subBass) * 0.45;
          audioState.lowMids += (audioState.targetLowMids - audioState.lowMids) * 0.40;
          audioState.mids += (audioState.targetMids - audioState.mids) * 0.40;
          audioState.treble += (audioState.targetTreble - audioState.treble) * 0.50;
          audioState.energy += (audioState.targetEnergy - audioState.energy) * 0.45;
          audioState.beatHit += (audioState.targetBeatHit - audioState.beatHit) * 0.70;

          if (state === "thinking" || audioState.energy > 0.01) {
            const kickPunch = audioState.kick * 2.4 + audioState.beatHit * 3.0;
            values[36] += kickPunch * 1.6 + audioState.subBass * 1.0; // ribbonBreath (Massive Expansion on Kick)
            values[33] += audioState.kick * 0.65 + audioState.lowMids * 0.45; // ribbonWidth
            values[37] += audioState.kick * 0.95; // particleSize
            values[4]  += audioState.kick * 0.08 + audioState.beatHit * 0.06; // radius (Subwoofer punch)
            values[38] += audioState.energy * 1.6 + audioState.treble * 3.2 + audioState.beatHit * 2.2; // particleBloom (Neon flashes)
            values[3]  += audioState.energy * 1.4; // speed (Beat acceleration)
            values[34] += audioState.mids * 1.6; // ribbonTwist
            values[35] += audioState.lowMids * 1.2; // ribbonFold
            values[13] += audioState.beatHit * 0.75 + audioState.kick * 0.45; // exposure flare
            values[6]  += audioState.subBass * 0.8; // fluid warp
          }
"""
            body = body.replace('values.set(sampleTransition(now));', modulation)

            with open(r'C:\development\StreamPulse\extension\popup\orb-visualizer.js', 'w', encoding='utf-8') as out:
                out.write(body)
            print('Successfully generated amplified audio-reactive orb-visualizer.js!')
            break