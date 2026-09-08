"""
Mossombi PWA Icon Generator
Generates all required PWA icon sizes from the source logo.
Uses Pillow (PIL) to resize the logo for web/icons/.
"""
import sys
import os

try:
    from PIL import Image
except ImportError:
    print("Installing Pillow...")
    os.system(f"{sys.executable} -m pip install Pillow")
    from PIL import Image

# Source logo
LOGO_PATH = os.path.join(os.path.dirname(__file__), "assets", "images", "logo.png")
ICONS_DIR = os.path.join(os.path.dirname(__file__), "web", "icons")
FAVICON_PATH = os.path.join(os.path.dirname(__file__), "web", "favicon.png")

# PWA icon sizes
SIZES = [72, 96, 128, 144, 152, 192, 384, 512]

def generate_icon(source_img, size, output_path, maskable=False):
    """Generate a single icon at the specified size."""
    if maskable:
        # Maskable icons need 10% safe zone padding
        # Create a square canvas with background color
        canvas = Image.new('RGBA', (size, size), (106, 78, 246, 255))  # Violet background
        # Scale the logo to fit within 80% of the canvas (safe zone)
        inner_size = int(size * 0.8)
        resized = source_img.resize((inner_size, inner_size), Image.LANCZOS)
        # Center the logo on the canvas
        offset = (size - inner_size) // 2
        canvas.paste(resized, (offset, offset), resized if resized.mode == 'RGBA' else None)
        canvas.save(output_path, 'PNG', optimize=True)
    else:
        resized = source_img.resize((size, size), Image.LANCZOS)
        resized.save(output_path, 'PNG', optimize=True)
    print(f"  ✅ Generated: {os.path.basename(output_path)} ({size}x{size})")

def main():
    if not os.path.exists(LOGO_PATH):
        print(f"❌ Logo not found at: {LOGO_PATH}")
        sys.exit(1)

    print(f"📱 Mossombi PWA Icon Generator")
    print(f"   Source: {LOGO_PATH}")
    print(f"   Output: {ICONS_DIR}")
    print()

    # Load source image
    source = Image.open(LOGO_PATH).convert('RGBA')
    print(f"   Source size: {source.size[0]}x{source.size[1]}")
    print()

    # Ensure output directory exists
    os.makedirs(ICONS_DIR, exist_ok=True)

    # Generate regular icons
    print("🎨 Generating regular icons...")
    for size in SIZES:
        output_path = os.path.join(ICONS_DIR, f"Icon-{size}.png")
        generate_icon(source, size, output_path, maskable=False)

    # Generate maskable icons (with safe zone padding)
    print()
    print("🎭 Generating maskable icons...")
    for size in [192, 512]:
        output_path = os.path.join(ICONS_DIR, f"Icon-maskable-{size}.png")
        generate_icon(source, size, output_path, maskable=True)

    # Generate favicon (32x32)
    print()
    print("⭐ Generating favicon...")
    favicon = source.resize((32, 32), Image.LANCZOS)
    favicon.save(FAVICON_PATH, 'PNG', optimize=True)
    print(f"  ✅ Generated: favicon.png (32x32)")

    print()
    print(f"✅ All icons generated successfully!")
    print(f"   Total: {len(SIZES)} regular + 2 maskable + 1 favicon = {len(SIZES) + 3} icons")

if __name__ == "__main__":
    main()
