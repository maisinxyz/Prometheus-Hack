from PIL import Image, ImageEnhance, ImageFilter, ImageDraw

# 1. Open the original perfect platform image
img = Image.open(r'C:\Users\jason\.gemini\antigravity-ide\brain\7db3a488-fd86-470e-8ce7-09ce54bc4c17\subway_station_perfect_1785049303308.png').convert('RGBA')

# 2. Patch the signs flawlessly using unique patches (NO BENCHES, NO REPEATING)
def apply_feathered_patch(img, patch, target_box, brightness=1.0):
    p = ImageEnhance.Brightness(patch.resize((target_box[2]-target_box[0], target_box[3]-target_box[1]), Image.Resampling.LANCZOS)).enhance(brightness)
    mask = Image.new('L', p.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rectangle([3, 3, p.size[0]-3, p.size[1]-3], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(3))
    p.putalpha(mask)
    img.alpha_composite(p, (target_box[0], target_box[1]))

patch_medium = img.crop((240, 505, 320, 565))
apply_feathered_patch(img, patch_medium, [240, 435, 320, 495], brightness=0.95)

patch_small = img.crop((70, 470, 120, 515))
apply_feathered_patch(img, patch_small, [330, 450, 380, 495], brightness=0.85)

patch_tiny = img.crop((130, 470, 175, 515))
apply_feathered_patch(img, patch_tiny, [380, 460, 425, 505], brightness=0.75)

img = img.convert('RGB')

# 3. Replace the weird two-story reflection with the perfect single-story ceiling
img_final = Image.open(r'C:\Users\jason\.gemini\antigravity-ide\brain\7db3a488-fd86-470e-8ce7-09ce54bc4c17\subway_station_final_1785049796801.png').convert('RGB')

mask = Image.new('L', (1024, 1024), 0)
draw = ImageDraw.Draw(mask)
draw.rectangle([0, 0, 1024, 280], fill=255)
for y in range(280, 340):
    alpha = int(255 * (1 - (y - 280) / 60.0))
    draw.line([(0, y), (1024, y)], fill=alpha)

composite = Image.composite(img_final, img, mask)

# Save test for review
composite.save(r'C:\Users\jason\.gemini\antigravity-ide\brain\7db3a488-fd86-470e-8ce7-09ce54bc4c17\test_subway10.png')

# Upscale and save final
upscaled = composite.resize((2560, 2560), Image.Resampling.LANCZOS)
upscaled = ImageEnhance.Sharpness(upscaled).enhance(1.2)
upscaled.save(r'C:\Users\jason\Documents\Prometheus-Hack\public\assets\subway_station_360_upscaled.png')
