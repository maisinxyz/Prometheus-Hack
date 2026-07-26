from PIL import Image, ImageEnhance, ImageFilter, ImageDraw

# 1. Open the original image that the user loves
img_perfect = Image.open(r'C:\Users\jason\.gemini\antigravity-ide\brain\7db3a488-fd86-470e-8ce7-09ce54bc4c17\subway_station_perfect_1785049303308.png').convert('RGBA')

# 2. Patch the copied signs on the left wall with feathered white tiles
patch = img_perfect.crop((80, 480, 150, 520))

def make_feathered_patch(patch, size, brightness):
    p = ImageEnhance.Brightness(patch.resize(size, Image.Resampling.LANCZOS)).enhance(brightness)
    mask = Image.new('L', size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rectangle([5, 5, size[0]-5, size[1]-5], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(5))
    p.putalpha(mask)
    return p

p1 = make_feathered_patch(patch, (80, 65), 0.85)
img_perfect.alpha_composite(p1, (245, 430))
p2 = make_feathered_patch(patch, (55, 50), 0.65)
img_perfect.alpha_composite(p2, (330, 450))
p3 = make_feathered_patch(patch, (45, 45), 0.5)
img_perfect.alpha_composite(p3, (380, 460))

img_perfect = img_perfect.convert('RGB')

# 3. Open the final image that has a beautiful, normal ceiling
img_final = Image.open(r'C:\Users\jason\.gemini\antigravity-ide\brain\7db3a488-fd86-470e-8ce7-09ce54bc4c17\subway_station_final_1785049796801.png').convert('RGB')

# 4. Create a gradient mask to blend the beautiful ceiling into the perfect platform
# The split is roughly at y=320. 
mask = Image.new('L', (1024, 1024), 0)
draw = ImageDraw.Draw(mask)

# Top 280 pixels are fully the new ceiling
draw.rectangle([0, 0, 1024, 280], fill=255)

# Pixels 280 to 350 fade smoothly from the new ceiling to the old platform
for y in range(280, 350):
    # Calculate fade: 255 at y=280, 0 at y=350
    alpha = int(255 * (1 - (y - 280) / 70.0))
    draw.line([(0, y), (1024, y)], fill=alpha)

# 5. Composite the images
composite = Image.composite(img_final, img_perfect, mask)

# Save for review
composite.save(r'C:\Users\jason\.gemini\antigravity-ide\brain\7db3a488-fd86-470e-8ce7-09ce54bc4c17\test_subway7.png')

# 6. Upscale and save as the final asset
upscaled = composite.resize((2560, 2560), Image.Resampling.LANCZOS)
upscaled = ImageEnhance.Sharpness(upscaled).enhance(1.2)
upscaled.save(r'C:\Users\jason\Documents\Prometheus-Hack\public\assets\subway_station_360_upscaled.png')
