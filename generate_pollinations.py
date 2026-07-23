import os
import requests
import urllib.parse

dest_dir = "C:/Users/jason/.gemini/antigravity-ide/brain/37edaa8b-301a-42c9-a12d-f7773cfc9c01/raw_ai/"
os.makedirs(dest_dir, exist_ok=True)

prompts = {
    "garden_dirt": "photorealistic 3D game asset of a patch of brown dirt ground, unreal engine 5 style, isolated on a solid white background",
    "garden_grass": "photorealistic 3D game asset of a lush green grass patch, unreal engine 5 style, isolated on a solid white background",
    "garden_flower": "photorealistic 3D game asset of vibrant wildflowers, unreal engine 5 style, isolated on a solid white background",
    "garden_bush": "photorealistic 3D game asset of a lush green bush, unreal engine 5 style, isolated on a solid white background",
    "garden_tree": "photorealistic 3D game asset of a majestic park oak tree, unreal engine 5 style, isolated on a solid white background",
    "garden_pond": "photorealistic 3D game asset of a clear water pond lake, unreal engine 5 style, isolated on a solid white background",
    "garden_fountain": "photorealistic 3D game asset of a grand stone water fountain, unreal engine 5 style, isolated on a solid white background",
    "garden_bench": "photorealistic 3D game asset of a wooden park bench, unreal engine 5 style, isolated on a solid white background",
    "garden_lamp": "photorealistic 3D game asset of an ornate park lamp post, unreal engine 5 style, isolated on a solid white background",
    "garden_duck": "photorealistic 3D game asset of a mallard duck, unreal engine 5 style, isolated on a solid white background",
    "garden_turtle": "photorealistic 3D game asset of a green turtle, unreal engine 5 style, isolated on a solid white background"
}

print("Generating images via Pollinations API...")
for name, prompt in prompts.items():
    print(f"Generating {name}...")
    encoded_prompt = urllib.parse.quote(prompt)
    url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true"
    
    try:
        r = requests.get(url, timeout=30)
        if r.status_code == 200:
            out_path = os.path.join(dest_dir, f"{name}.png")
            with open(out_path, 'wb') as f:
                f.write(r.content)
            print(f" -> Saved {name}.png")
        else:
            print(f" -> Failed with status {r.status_code}")
    except Exception as e:
        print(f" -> Error: {e}")

print("Done generating.")
