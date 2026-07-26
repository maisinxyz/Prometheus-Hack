from PIL import Image, ImageDraw, ImageFilter
import math, random

W, H = 2560, 1280
img = Image.new('RGB', (W, H))
draw = ImageDraw.Draw(img)

# Create a realistic gym interior panorama using gradients and shapes
# Floor: dark rubber matting
for y in range(H * 2 // 3, H):
    t = (y - H * 2 // 3) / (H // 3)
    r = int(45 + t * 15)
    g = int(42 + t * 12)
    b = int(40 + t * 10)
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# Walls: light gray with warm tone
for y in range(H // 6, H * 2 // 3):
    t = (y - H // 6) / (H // 2)
    r = int(200 - t * 40)
    g = int(195 - t * 35)
    b = int(190 - t * 30)
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# Ceiling: darker
for y in range(0, H // 6):
    t = y / (H // 6)
    r = int(80 + t * 40)
    g = int(78 + t * 38)
    b = int(82 + t * 40)
    draw.line([(0, y), (W, y)], fill=(r, g, b))

# Wall-floor baseboard line
draw.rectangle([0, H * 2 // 3 - 8, W, H * 2 // 3 + 2], fill=(60, 58, 55))

# Draw exercise equipment silhouettes along the walls
random.seed(42)

# Treadmills
for i in range(6):
    x = 120 + i * 380
    base_y = H * 2 // 3 - 10
    # Base
    draw.rectangle([x, base_y - 180, x + 160, base_y], fill=(50, 50, 55))
    # Console
    draw.rectangle([x + 60, base_y - 260, x + 110, base_y - 180], fill=(40, 40, 45))
    # Screen
    draw.rectangle([x + 65, base_y - 250, x + 105, base_y - 210], fill=(20, 180, 80))
    # Handles
    draw.rectangle([x + 30, base_y - 240, x + 35, base_y - 180], fill=(120, 120, 125))
    draw.rectangle([x + 125, base_y - 240, x + 130, base_y - 180], fill=(120, 120, 125))

# Weight rack on far wall
for i in range(8):
    x = 200 + i * 280
    base_y = H * 2 // 3 - 10
    # Vertical posts
    draw.rectangle([x, base_y - 320, x + 8, base_y], fill=(90, 88, 85))
    draw.rectangle([x + 80, base_y - 320, x + 88, base_y], fill=(90, 88, 85))
    # Cross bars
    for j in range(4):
        bar_y = base_y - 80 - j * 60
        draw.rectangle([x + 8, bar_y, x + 80, bar_y + 6], fill=(100, 98, 95))
        # Weights on bars
        w_size = random.randint(12, 25)
        draw.ellipse([x + 30 - w_size, bar_y - w_size + 3, x + 30 + w_size, bar_y + w_size + 3], fill=(55, 55, 60))
        draw.ellipse([x + 58 - w_size, bar_y - w_size + 3, x + 58 + w_size, bar_y + w_size + 3], fill=(55, 55, 60))

# Ceiling lights
for i in range(10):
    x = 100 + i * 250
    draw.rectangle([x, H // 6 - 5, x + 120, H // 6 + 5], fill=(255, 250, 230))
    # Light glow
    for r_size in range(30, 0, -1):
        alpha_val = int(15 * (r_size / 30))
        light_color = (255, 250, 240 - alpha_val)
        draw.ellipse([x + 30 - r_size, H // 6 - r_size, x + 90 + r_size, H // 6 + r_size], fill=light_color)

# Mirrors on the wall (reflective rectangles)
for i in range(4):
    x = 350 + i * 550
    draw.rectangle([x, H // 3, x + 300, H * 2 // 3 - 20], fill=(170, 185, 195))
    draw.rectangle([x + 2, H // 3 + 2, x + 298, H * 2 // 3 - 22], fill=(180, 195, 205))

# Slight blur for realism
img = img.filter(ImageFilter.GaussianBlur(1.5))

img.save(r'C:\Users\jason\Documents\Prometheus-Hack\public\assets\gym_360.png')
print("Saved gym_360.png")
