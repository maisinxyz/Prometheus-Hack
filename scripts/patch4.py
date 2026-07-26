from PIL import Image, ImageEnhance, ImageFilter, ImageDraw

# 1. Open the original image exactly as it was
img = Image.open(r'C:\Users\jason\.gemini\antigravity-ide\brain\7db3a488-fd86-470e-8ce7-09ce54bc4c17\subway_station_perfect_1785049303308.png').convert('RGBA')

# 2. Extract a continuous strip of clean tiles directly underneath the signs
# The signs are in x=235 to 450, y=435 to 500
# The clean tiles are in x=235 to 450, y=505 to 565
patch = img.crop((235, 505, 450, 565))

# 3. Slightly darken the patch because the wall gets darker higher up
patch = ImageEnhance.Brightness(patch).enhance(0.9)

# 4. Create an alpha mask to softly blend the top, left, and right edges
mask = Image.new('L', patch.size, 0)
draw = ImageDraw.Draw(mask)
# Leave the bottom edge sharp (or slightly feathered) but feather the top/sides
draw.rectangle([5, 5, patch.size[0]-5, patch.size[1]-2], fill=255)
mask = mask.filter(ImageFilter.GaussianBlur(3))
patch.putalpha(mask)

# 5. Paste the patch directly above its origin to cover the signs
img.alpha_composite(patch, (235, 445))

# 6. We also need to cover the tiny sign at x=380, y=465, which might peek out.
# The patch covers x=235 to 450, y=445 to 505. That perfectly covers all three signs!

img = img.convert('RGB')

# Save for review
img.save(r'C:\Users\jason\.gemini\antigravity-ide\brain\7db3a488-fd86-470e-8ce7-09ce54bc4c17\test_subway8.png')

# Upscale and save final
upscaled = img.resize((2560, 2560), Image.Resampling.LANCZOS)
upscaled = ImageEnhance.Sharpness(upscaled).enhance(1.2)
upscaled.save(r'C:\Users\jason\Documents\Prometheus-Hack\public\assets\subway_station_360_upscaled.png')
