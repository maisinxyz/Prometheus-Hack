from PIL import Image
import os

sprites_dir = 'public/assets/sprites/items'

# Files with the beige/cream semi-transparent background (249, 245, 231, 128)
files_to_fix = [
    'coffecup.png', 'coffeelid.png', 'emptyfoodbox.png', 'foodbox.png',
    'foodbox1.png', 'foodbox2.png', 'foodboxfull.png', 'foodboxplastic.png',
    'tissues.png'
]

for fname in files_to_fix:
    path = os.path.join(sprites_dir, fname)
    img = Image.open(path).convert('RGBA')
    pixels = img.load()
    w, h = img.size
    
    changed = 0
    for y in range(h):
        for x in range(w):
            r, g, b, a = pixels[x, y]
            # Target the beige/cream background color (249, 245, 231) with alpha ~128
            # Use a tolerance range to catch slight variations
            if (240 <= r <= 255 and 235 <= g <= 255 and 220 <= b <= 245 and a < 200):
                pixels[x, y] = (r, g, b, 0)  # Make fully transparent
                changed += 1
    
    img.save(path)
    print(f'{fname}: removed {changed} background pixels')

print('Done!')
