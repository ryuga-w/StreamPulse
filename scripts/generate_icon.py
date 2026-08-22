import os
import math
from PIL import Image, ImageDraw, ImageFilter, ImageFont

def render_master_icon(size=1024):
    # Create canvas with transparency
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    
    # Dimensions
    pad = int(size * 0.08)
    radius = int(size * 0.22)
    card_box = [pad, pad, size - pad, size - pad]

    # --- 1. Outer Multi-Color Neon Aurora Bloom / Shadow ---
    glow = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    g_draw = ImageDraw.Draw(glow)
    
    # Draw colored concentric glows
    glow_box = [pad - int(size * 0.02), pad - int(size * 0.02), size - pad + int(size * 0.02), size - pad + int(size * 0.02)]
    g_draw.rounded_rectangle(glow_box, radius=radius + 10, fill=(147, 51, 234, 130)) # Purple glow
    
    # Left-bottom cyan bloom
    g_draw.ellipse([pad, size // 2, size // 2, size - pad], fill=(6, 182, 212, 100))
    # Right-top pink bloom
    g_draw.ellipse([size // 2, pad, size - pad, size // 2], fill=(236, 72, 153, 100))
    
    glow = glow.filter(ImageFilter.GaussianBlur(radius=int(size * 0.06)))
    img = Image.alpha_composite(glow, img)

    # --- 2. Main Obsidian Glass Squircle Card ---
    card = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    c_draw = ImageDraw.Draw(card)
    
    # Dark luxury metallic gradient fill
    for y in range(pad, size - pad):
        t = (y - pad) / (size - 2 * pad)
        # Deep space dark obsidian to rich dark violet
        r = int(10 + t * 18)
        g = int(14 + t * 10)
        b = int(28 + t * 45)
        c_draw.line([(pad, y), (size - pad, y)], fill=(r, g, b, 255))

    # Mask to perfect squircle
    mask = Image.new('L', (size, size), 0)
    m_draw = ImageDraw.Draw(mask)
    m_draw.rounded_rectangle(card_box, radius=radius, fill=255)
    card.putalpha(mask)
    img = Image.alpha_composite(img, card)

    # --- 3. Glassmorphic Top-Left Specular Sheen (Gloss highlight) ---
    sheen = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    sh_draw = ImageDraw.Draw(sheen)
    sh_draw.polygon([
        (pad, pad),
        (size - pad - int(size * 0.1), pad),
        (pad, size - pad - int(size * 0.1))
    ], fill=(255, 255, 255, 18))
    sheen = sheen.filter(ImageFilter.GaussianBlur(radius=int(size * 0.04)))
    
    # Apply mask so sheen stays inside card
    sheen_masked = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    sheen_masked.paste(sheen, (0, 0), mask=mask)
    img = Image.alpha_composite(img, sheen_masked)

    # --- 4. Neon Gradient Border Ring ---
    ring = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    r_draw = ImageDraw.Draw(ring)
    border_w = int(size * 0.016)
    
    for y in range(pad, size - pad):
        t = (y - pad) / (size - 2 * pad)
        # Gradient: Top-left Cyan/Indigo to Bottom-right Purple/Pink
        r = int(6 + t * (236 - 6))
        g = int(182 - t * (182 - 72))
        b = int(212 + t * (153 - 212))
        r_draw.line([(pad, y), (size - pad, y)], fill=(r, g, b, 255))
        
    ring_mask = Image.new('L', (size, size), 0)
    rm_draw = ImageDraw.Draw(ring_mask)
    rm_draw.rounded_rectangle(card_box, radius=radius, fill=255)
    inner_box = [pad + border_w, pad + border_w, size - pad - border_w, size - pad - border_w]
    rm_draw.rounded_rectangle(inner_box, radius=radius - border_w, fill=0)
    ring.putalpha(ring_mask)
    img = Image.alpha_composite(img, ring)

    # --- 5. Iconic Symbol: Glowing Sonic Equalizer Wings + 3D Chrome Arrow ---
    symbol = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    s_draw = ImageDraw.Draw(symbol)
    
    cx, cy = size // 2, int(size * 0.48)
    scale = size / 1024.0

    # A. Dynamic Neon Equalizer Bars in the background
    eq_bars = [
        # (offset_x, height, (r, g, b))
        (-220, 110, (6, 182, 212)),    # Cyan
        (-165, 170, (59, 130, 246)),   # Blue
        (-110, 250, (99, 102, 241)),   # Indigo
        (-55, 330, (168, 85, 247)),    # Purple
        (55, 330, (236, 72, 153)),     # Pink
        (110, 250, (244, 63, 94)),     # Rose
        (165, 170, (249, 115, 22)),    # Orange
        (220, 110, (234, 179, 8)),     # Amber
    ]

    for off_x, h, col in eq_bars:
        bx = cx + int(off_x * scale)
        bh = int(h * scale)
        bw = int(24 * scale)
        s_draw.rounded_rectangle(
            [bx - bw // 2, cy - bh // 2, bx + bw // 2, cy + bh // 2],
            radius=int(bw // 2),
            fill=(*col, 230)
        )

    # B. Central Chrome Metallic 3D Download Arrow
    # Arrow Stem
    stem_w = int(68 * scale)
    stem_top = int(size * 0.24)
    stem_bot = int(size * 0.50)
    
    # White Chrome Body
    s_draw.rounded_rectangle(
        [cx - stem_w // 2, stem_top, cx + stem_w // 2, stem_bot],
        radius=int(stem_w // 4),
        fill=(255, 255, 255, 255)
    )

    # Arrow Head Triangle
    head_w = int(260 * scale)
    head_top = int(size * 0.44)
    head_tip = int(size * 0.68)
    
    head_poly = [
        (cx, head_tip),                           # Bottom Tip
        (cx - head_w // 2, head_top),             # Left Wing
        (cx - int(stem_w * 0.7), head_top + int(20 * scale)), # Left Inner Notch
        (cx - int(stem_w * 0.7), head_top),
        (cx + int(stem_w * 0.7), head_top),
        (cx + int(stem_w * 0.7), head_top + int(20 * scale)), # Right Inner Notch
        (cx + head_w // 2, head_top),             # Right Wing
    ]
    s_draw.polygon(head_poly, fill=(255, 255, 255, 255))

    # C. Curved Neon Sonic Pulse Arc at the bottom (Base Plate)
    arc_w = int(280 * scale)
    arc_y = int(size * 0.77)
    arc_h = int(26 * scale)
    
    s_draw.rounded_rectangle(
        [cx - arc_w // 2, arc_y, cx + arc_w // 2, arc_y + arc_h],
        radius=int(arc_h // 2),
        fill=(6, 182, 212, 255)
    )

    # Small neon music spark dot
    s_draw.ellipse(
        [cx - int(12 * scale), arc_y + int(arc_h * 1.5), cx + int(12 * scale), arc_y + int(arc_h * 1.5) + int(24 * scale)],
        fill=(236, 72, 153, 255)
    )

    # Soft drop shadow for the symbol
    sym_shadow = symbol.filter(ImageFilter.GaussianBlur(radius=int(size * 0.02)))
    img = Image.alpha_composite(img, sym_shadow)
    img = Image.alpha_composite(img, symbol)

    return img

if __name__ == '__main__':
    os.makedirs('build', exist_ok=True)
    os.makedirs('public', exist_ok=True)
    
    master = render_master_icon(1024)
    
    # Save high-res PNGs with supersampling
    icon_512 = master.resize((512, 512), Image.Resampling.LANCZOS)
    icon_256 = master.resize((256, 256), Image.Resampling.LANCZOS)
    
    icon_512.save('build/icon.png', 'PNG', optimize=True)
    icon_512.save('public/icon.png', 'PNG', optimize=True)
    
    # Multi-resolution Windows ICO (256, 128, 64, 48, 32, 16)
    sizes = [(256, 256), (128, 128), (64, 64), (48, 48), (32, 32), (16, 16)]
    master.save('build/icon.ico', format='ICO', sizes=sizes)
    master.save('public/favicon.ico', format='ICO', sizes=sizes)
    print("Master 1024px 3D Sonic-Pulse App Icon rendered and saved to build/ and public/!")
