#!/usr/bin/env python3
"""
Icon generator for Azaan Pro PWA
Run: python generate-icons.py
"""

import os

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Installing required package...")
    import subprocess
    subprocess.check_call(["pip", "install", "pillow"])
    from PIL import Image, ImageDraw, ImageFont

SIZES = [72, 96, 128, 144, 152, 192, 384, 512]
OUTPUT_DIR = "icons"

def create_icon(size):
    """Create a single icon"""
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)
    
    # Create gradient background
    for y in range(size):
        for x in range(size):
            ratio = (x + y) / (2 * size)
            r = int(13 + (5 - 13) * ratio)
            g = int(148 + (150 - 148) * ratio)
            b = int(136 + (105 - 136) * ratio)
            draw.point((x, y), fill=(r, g, b, 255))
    
    # Draw rounded rectangle mask
    mask = Image.new('L', (size, size), 0)
    mask_draw = ImageDraw.Draw(mask)
    corner_radius = int(size * 0.2)
    mask_draw.rounded_rectangle([0, 0, size, size], radius=corner_radius, fill=255)
    
    # Apply mask
    img.putalpha(mask)
    
    # Draw symbol
    try:
        font_size = int(size * 0.55)
        font = ImageFont.truetype("arial.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    draw = ImageDraw.Draw(img)
    symbol = "☪"
    bbox = draw.textbbox((0, 0), symbol, font=font)
    text_width = bbox[2] - bbox[0]
    text_height = bbox[3] - bbox[1]
    x = (size - text_width) / 2
    y = (size - text_height) / 2
    draw.text((x, y), symbol, fill=(255, 255, 255, 255), font=font)
    
    return img

def main():
    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)
    
    print("Generating Azaan Pro icons...")
    print("-" * 40)
    
    for size in SIZES:
        icon = create_icon(size)
        filename = f"{OUTPUT_DIR}/icon-{size}x{size}.png"
        icon.save(filename, "PNG")
        print(f"Created: {filename}")
    
    print("-" * 40)
    print("All icons generated successfully!")
    print(f"Icons saved in: {os.path.abspath(OUTPUT_DIR)}/")

if __name__ == "__main__":
    main()
