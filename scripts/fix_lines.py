from PIL import Image

def fix_vertical_lines(path):
    print(f"Repairing vertical lines in {path}...")
    img = Image.open(path).convert("RGBA")
    pixels = img.load()
    width, height = img.size
    
    # Target Lines based on visual inspection: 
    # Frame 2 (x=50-100) center ~75
    # Frame 5 (x=200-250) center ~225
    # The artifact might be 1 or 2 pixels wide.
    # Let's target x=74, 75, 76 and x=224, 225, 226
    
    targets = [74, 75, 76, 224, 225, 226]
    
    # We will simply "Healing Brush" these columns using neighbors
    # For a pixel at X, take X-3 and X+3 (safe distance)
    # Actually, simple average of left and right neighbors is usually good.
    
    for x in targets:
        for y in range(height):
            # Check neighbors
            # If x is 75, take 72 and 78? Or 74 and 76?
            # 74 might be part of the line.
            # Let's use x-3 and x+3 to be safe from the line width.
            
            p_left = pixels[x-3, y]
            p_right = pixels[x+3, y]
            
            # Simple average
            r = (p_left[0] + p_right[0]) // 2
            g = (p_left[1] + p_right[1]) // 2
            b = (p_left[2] + p_right[2]) // 2
            a = (p_left[3] + p_right[3]) // 2
            
            # However, if one neighbor is Magenta (Background) and the other is Character,
            # blending them creates a dirty edge.
            # Logic: If neighbors are similar, blend.
            # If distinctive boundary (one is BG, one is Body), this is hard.
            # But the line is "Center". Character is usually symmetric.
            
            # Just applying average is better than a black line.
            pixels[x, y] = (r, g, b, a)

    img.save(path)
    print("Repair Complete.")

if __name__ == "__main__":
    fix_vertical_lines("assets/char_sprite.png")
