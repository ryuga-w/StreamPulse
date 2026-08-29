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
            
            # Add silky-smooth audio follower
            audio_engine = """
    let smoothEnergy = 0;
    let smoothBass = 0;
    let targetEnergy = 0;
    let targetBass = 0;

    function setAudioLevels(levels) {
      if (!levels) return;
      targetEnergy = Math.min(1.0, (levels.energy || 0));
      targetBass = Math.min(1.0, ((levels.kick || 0) + (levels.subBass || 0)) * 0.6);
    }
"""
            body = body.replace('function setState(nextState) {', audio_engine + '\n    function setState(nextState) {')
            
            # Expose setAudioLevels cleanly on window.liquidOrb
            old_export = 'Object.defineProperty(window, "liquidOrb", {\n      value: Object.freeze({\n        getState: () => state,\n        setState,\n      }),\n    });'
            new_export = 'Object.defineProperty(window, "liquidOrb", {\n      value: Object.freeze({\n        getState: () => state,\n        setState,\n        setAudioLevels,\n      }),\n    });\n    window.setOrbAudioLevels = setAudioLevels;'
            body = body.replace(old_export, new_export)
            
            # Silky-smooth, organic liquid breathing (Zero strobe, zero flicker, pure fluid motion)
            modulation = """
          values.set(sampleTransition(now));

          // Silky-Smooth Organic Damping (Apple Siri/Liquid fluid physics)
          smoothEnergy += (targetEnergy - smoothEnergy) * 0.08;
          smoothBass += (targetBass - smoothBass) * 0.10;

          if (state === "thinking") {
            // Smooth organic ribbon breathing (swells gracefully with volume)
            values[37] += smoothBass * 0.45;
            // Smooth fluid speed acceleration
            values[3]  += smoothEnergy * 0.35;
          }
"""
            body = body.replace('values.set(sampleTransition(now));', modulation)

            with open(r'C:\development\StreamPulse\extension\popup\orb-visualizer.js', 'w', encoding='utf-8') as out:
                out.write(body)
            print('Successfully generated silky-smooth fluid orb-visualizer.js!')
            break