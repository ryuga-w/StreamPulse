import os
import math
from PIL import Image, ImageDraw, ImageFilter

def create_streampulse_icon(size=512):
    # Create image with transparent background
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    # 1. Base dark obsidian rounded squircle
    radius = int(size * 0.22)
    margin = int(size * 0.05)
    bbox = [margin, margin, size - margin, size - margin]

    # Glowing background shadow / bloom
    shadow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(shadow)
    s_draw.rounded_rectangle(bbox, radius=radius, fill=(138, 43, 226, 120))
    shadow = shadow.filter(ImageFilter.GaussianBlur(radius=int(size * 0.08)))
    img = Image.alpha_composite(shadow, img)
    draw = ImageDraw.Draw(img)

    # 2. Draw glossy gradient rounded card
    card = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    c_draw = ImageDraw.Draw(card)
    
    # Gradient fill for squircle
    for y in range(margin, size - margin):
        t = (y - margin) / (size - 2 * margin)
        # Deep space dark indigo to obsidian purple
        r = int(12 + t * (25 - 12))
        g = int(16 + t * (10 - 16))
        b = int(35 + t * (55 - 35))
        c_draw.line([(margin, y), (size - margin, y)], fill=(r, g, b, 255))
    
    # Mask to rounded rectangle
    mask = Image.new('L', (size, size), 0)
    m_draw = ImageDraw.Draw(mask)
    m_draw.rounded_rectangle(bbox, radius=radius, fill=255)
    
    card.putalpha(mask)
    img = Image.alpha_composite(img, card)
    draw = ImageDraw.Draw(img)

    # Neon border ring
    draw.rounded_rectangle(bbox, radius=radius, outline=(168, 85, 247, 180), width=int(size * 0.015))

    # 3. Sonic pulse waves (Equalizer soundwave lines)
    cx, cy = size // 2, int(size * 0.52)
    
    wave_bars = [
        (-120, 45, (6, 182, 212)),    # Cyan
        (-90, 75, (99, 102, 241)),    # Indigo
        (-60, 110, (168, 85, 247)),   # Purple
        (-30, 140, (236, 72, 153)),   # Pink
        (0, 165, (168, 85, 247)),     # Center
        (30, 140, (236, 72, 153)),    # Pink
        (60, 110, (168, 85, 247)),    # Purple
        (90, 75, (99, 102, 241)),     # Indigo
        (120, 45, (6, 182, 212)),     # Cyan
    ]

    scale = size / 512.0
    for offset_x, h, color in wave_bars:
        bx = cx + int(offset_x * scale)
        bh = int(h * scale * 0.7)
        bar_w = int(14 * scale)
        draw.rounded_rectangle(
            [bx - bar_w // 2, cy - bh, bx + bar_w // 2, cy + bh],
            radius=int(bar_w // 2),
            fill=(*color, 220)
        )

    # 4. Central 3D Download Arrow Symbol
    arrow_w = int(110 * scale)
    arrow_top = int(size * 0.28)
    arrow_stem_w = int(28 * scale)
    arrow_stem_h = int(70 * scale)
    
    # Arrow Stem
    draw.rounded_rectangle(
        [cx - arrow_stem_w // 2, arrow_top, cx + arrow_stem_w // 2, arrow_top + arrow_stem_h],
        radius=int(arrow_stem_w // 2),
        fill=(255, 255, 255, 255)
    )

    # Arrow Head Triangle
    tip_y = arrow_top + arrow_stem_h + int(50 * scale)
    wing_y = arrow_top + arrow_stem_h + int(10 * scale)
    arrow_poly = [
        (cx, tip_y),
        (cx - int(65 * scale), wing_y),
        (cx - int(25 * scale), wing_y),
        (cx, tip_y - int(30 * scale)),
        (cx + int(25 * scale), wing_y),
        (cx + int(65 * scale), wing_y),
    ]
    draw.polygon(arrow_poly, fill=(255, 255, 255, 255))

    # Base tray plate underneath
    tray_w = int(140 * scale)
    tray_y = int(size * 0.76)
    tray_h = int(14 * scale)
    draw.rounded_rectangle(
        [cx - tray_w // 2, tray_y, cx + tray_w // 2, tray_y + tray_h],
        radius=int(tray_h // 2),
        fill=(236, 72, 153, 240)
    )

    return img

if __name__ == '__main__':
    os.makedirs('build', exist_ok=True)
    os.makedirs('public', exist_ok=True)
    
    icon_512 = create_streampulse_icon(512)
    icon_512.save('build/icon.png', 'PNG')
    icon_512.save('public/icon.png', 'PNG')
    
    # Generate multi-size Windows .ico file
    sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
    icon_512.save('build/icon.ico', format='ICO', sizes=sizes)
    icon_512.save('public/favicon.ico', format='ICO', sizes=sizes)
    print("StreamPulse Pro icons generated successfully in build/ and public/!")
