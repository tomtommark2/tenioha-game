import os
try:
    from PIL import Image
    has_pil = True
except ImportError:
    has_pil = False

def create_icons():
    source_path = "icon.jpg"
    if not os.path.exists(source_path):
        print(f"Error: {source_path} not found.")
        return

    if not has_pil:
        print("PIL/Pillow not found. Cannot resize.")
        # Fallback? No, we need proper resizing.
        return

    try:
        img = Image.open(source_path)
        print(f"Original size: {img.size}")

        # Square crop logic
        w, h = img.size
        min_dim = min(w, h)
        left = (w - min_dim) / 2
        top = (h - min_dim) / 2
        right = (w + min_dim) / 2
        bottom = (h + min_dim) / 2
        
        img_cropped = img.crop((left, top, right, bottom))
        
        # 512x512
        icon_512 = img_cropped.resize((512, 512), Image.Resampling.LANCZOS)
        icon_512.save("icon-512.png", "PNG")
        print("Created icon-512.png")

        # 192x192
        icon_192 = img_cropped.resize((192, 192), Image.Resampling.LANCZOS)
        icon_192.save("icon-192.png", "PNG")
        print("Created icon-192.png")

    except Exception as e:
        print(f"Error processing image: {e}")

if __name__ == "__main__":
    if not has_pil:
        print("Installing Pillow...")
        os.system("pip install Pillow")
        # Retry import in a sub-process or just restart? 
        # For simplicity, we assume pip works and we might need to run this script twice if first time fails import.
        # But import check is at top. 
        pass
    
    # Re-check import after install attempt inside main? 
    # Let's just create a wrapper command. 
    create_icons()
