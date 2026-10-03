import json, re

transcript_path = r'C:\Users\musta\.gemini\antigravity\brain\383cdba8-932a-4a7e-a00c-01a37cabdec7\.system_generated\logs\transcript_full.jsonl'

with open(transcript_path, 'r', encoding='utf-8') as f:
    for i, line in enumerate(f):
        if i in (4029, 4216, 4486, 4546):
            data = json.loads(line)
            content = data.get('content', '')
            urls = re.findall(r'https?://[^\s<>"\'\)]+', content)
            print(f"Step {i} URLs:", urls)
            # Look for site names or brand names
            for word in ['21st', 'shadergradient', 'uiverse', 'codepen', 'luma', 'spline', 'aceternity', 'magicui', 'glitch', 'framer', 'orbs']:
                if word in content.lower():
                    print(f"  Found keyword '{word}' in step {i}")