from PIL import Image, ImageEnhance, ImageFilter, ImageDraw

img = Image.open(r'C:\Users\jason\.gemini\antigravity-ide\brain\7db3a488-fd86-470e-8ce7-09ce54bc4c17\subway_station_perfect_1785049303308.png').convert('RGBA')

# 1. Seamlessly patch the copied signs on the original image first
patch = img.crop((80, 480, 150, 520))

def make_feathered_patch(patch, size, brightness):
    p = ImageEnhance.Brightness(patch.resize(size, Image.Resampling.LANCZOS)).enhance(brightness)
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rectangle([5, 5, size[0]-5, size[1]-5], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(5))
    p.putalpha(mask)
    return p

p1 = make_feathered_patch(patch, (80, 65), 0.85)
img.alpha_composite(p1, (245, 430))
p2 = make_feathered_patch(patch, (55, 50), 0.65)
img.alpha_composite(p2, (330, 450))
p3 = make_feathered_patch(patch, (45, 45), 0.5)
img.alpha_composite(p3, (380, 460))

img = img.convert('RGB')

# 2. Extract the bottom platform (y=320 to 1024)
platform = img.crop((0, 320, 1024, 1024))

# 3. Create a new 1024x1024 image
new_img = Image.new('RGB', (1024, 1024))
new_img.paste(platform, (0, 320))

# 4. Fill the top ceiling (y=0 to 320) smoothly
# Stretch the top 30 pixels of the platform upwards
top_slice = platform.crop((0, 0, 1024, 30))
stretched_ceiling = top_slice.resize((1024, 320), Image.Resampling.LANCZOS)

# Create a gradient mask to fade the stretched ceiling to black at the top
# y=0 is black (0), y=320 is fully visible (255)
mask = Image.new('L', (1024, 320))
draw = ImageDraw.Draw(mask)
for y in range(320):
    alpha = int((y / 320.0) * 255)
    draw.line([(0, y), (1024, y)], fill=alpha)

# Paste the stretched ceiling using the gradient mask (over a black background)
ceiling_bg = Image.new('RGB', (1024, 320), (10, 10, 10))
ceiling_bg.paste(stretched_ceiling, (0, 0), mask)

new_img.paste(ceiling_bg, (0, 0))

# Save for review
new_img.save(r'C:\Users\jason\.gemini\antigravity-ide\brain\7db3a488-fd86-470e-8ce7-09ce54bc4c17\test_subway6.png')

# Also upscale and save as final
upscaled = new_img.resize((2560, 2560), Image.Resampling.LANCZOS)
upscaled = ImageEnhance.Sharpness(upscaled).enhance(1.2)
upscaled.save(r'C:\Users\jason\Documents\Prometheus-Hack\public\assets\subway_station_360_upscaled.png')
