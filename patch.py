from PIL import Image, ImageEnhance, ImageFilter, ImageDraw

img = Image.open(r'C:\Users\jason\.gemini\antigravity-ide\brain\7db3a488-fd86-470e-8ce7-09ce54bc4c17\subway_station_perfect_1785049303308.png').convert('RGBA')
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

upscaled = img.convert('RGB').resize((2560, 2560), Image.Resampling.LANCZOS)
upscaled = ImageEnhance.Sharpness(upscaled).enhance(1.2)
upscaled.save(r'C:\Users\jason\Documents\Prometheus-Hack\public\assets\subway_station_360_upscaled.png')
