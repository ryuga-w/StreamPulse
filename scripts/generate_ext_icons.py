import os
from PIL import Image

def generate_extension_icons():
    os.makedirs('extension/icons', exist_ok=True)
    
    src_icon_path = 'build/icon.png'
    if not os.path.exists(src_icon_path):
        print("Source icon not found in build/icon.png")
        return
        
    src_img = Image.open(src_icon_path)
    
    sizes = [16, 32, 48, 128]
    for s in sizes:
        resized = src_img.resize((s, s), Image.Resampling.LANCZOS)
        out_path = f'extension/icons/icon{s}.png'
        resized.save(out_path, 'PNG', optimize=True)
        print(f"Generated {out_path}")

if __name__ == '__main__':
    generate_extension_icons()
