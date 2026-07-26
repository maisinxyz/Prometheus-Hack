from PIL import Image, ImageEnhance, ImageFilter, ImageDraw

img = Image.open(r'C:\Users\jason\.gemini\antigravity-ide\brain\7db3a488-fd86-470e-8ce7-09ce54bc4c17\subway_station_perfect_1785049303308.png').convert('RGBA')

def apply_feathered_patch(img, patch, target_box, brightness=1.0):
    p = ImageEnhance.Brightness(patch.resize((target_box[2]-target_box[0], target_box[3]-target_box[1]), Image.Resampling.LANCZOS)).enhance(brightness)
    mask = Image.new('L', p.size, 0)
    draw = ImageDraw.Draw(mask)
    draw.rectangle([3, 3, p.size[0]-3, p.size[1]-3], fill=255)
    mask = mask.filter(ImageFilter.GaussianBlur(3))
    p.putalpha(mask)
    img.alpha_composite(p, (target_box[0], target_box[1]))

# 1. Patch the medium sign (x=240 to 320, y=435 to 495)
# Using tiles directly underneath it (x=240 to 320, y=505 to 565) - NO BENCH HERE
patch_medium = img.crop((240, 505, 320, 565))
apply_feathered_patch(img, patch_medium, [240, 435, 320, 495], brightness=0.95)

# 2. Patch the small sign (x=330 to 380, y=450 to 495)
# Using unique clean tiles from under the large sign (x=70 to 120, y=470 to 515)
patch_small = img.crop((70, 470, 120, 515))
apply_feathered_patch(img, patch_small, [330, 450, 380, 495], brightness=0.85)

# 3. Patch the tiny sign (x=380 to 425, y=460 to 505)
# Using another unique clean tile patch (x=130 to 175, y=470 to 515)
patch_tiny = img.crop((130, 470, 175, 515))
apply_feathered_patch(img, patch_tiny, [380, 460, 425, 505], brightness=0.75)

img = img.convert('RGB')

# Save test for review
img.save(r'C:\Users\jason\.gemini\antigravity-ide\brain\7db3a488-fd86-470e-8ce7-09ce54bc4c17\test_subway9.png')

# Upscale and save final
upscaled = img.resize((2560, 2560), Image.Resampling.LANCZOS)
upscaled = ImageEnhance.Sharpness(upscaled).enhance(1.2)
upscaled.save(r'C:\Users\jason\Documents\Prometheus-Hack\public\assets\subway_station_360_upscaled.png')
