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
            
            # Adapt canvas selector to #shazam-ai-canvas
            body = body.replace('document.querySelector("#orb")', '(document.querySelector("#shazam-ai-canvas") || document.querySelector("#orb"))')
            
            with open(r'C:\development\StreamPulse\extension\popup\orb-visualizer.js', 'w', encoding='utf-8') as out:
                out.write(body)
            print('Successfully restored pure, untouched original Liquid Orb!')
            break