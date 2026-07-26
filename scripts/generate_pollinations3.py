import os
import requests
import urllib.parse
import time

dest_dir = "C:/Users/jason/.gemini/antigravity-ide/brain/37edaa8b-301a-42c9-a12d-f7773cfc9c01/raw_ai/"
os.makedirs(dest_dir, exist_ok=True)

prompts = {
    "garden_flower": "photorealistic vibrant wildflower patch unreal engine 5 isolated white background",
    "garden_bush": "photorealistic lush green garden bush shrub unreal engine 5 isolated white background",
    "garden_fountain": "photorealistic grand stone water fountain park unreal engine 5 isolated white background",
    "garden_lamp": "photorealistic ornate black iron park lamp post unreal engine 5 isolated white background",
    "garden_duck": "photorealistic mallard duck standing unreal engine 5 isolated white background",
    "garden_turtle": "photorealistic green turtle unreal engine 5 isolated white background",
    "garden_rabbit": "photorealistic brown rabbit sitting unreal engine 5 isolated white background",
}

print("Generating batch 2 via Pollinations API...")
for name, prompt in prompts.items():
    print(f"Generating {name}...")
    encoded_prompt = urllib.parse.quote(prompt)
    url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?width=1024&height=1024&nologo=true&seed={int(time.time())}"
    
    headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'}
    
    try:
        r = requests.get(url, headers=headers, timeout=45)
        if r.status_code == 200:
            out_path = os.path.join(dest_dir, f"{name}.png")
            with open(out_path, 'wb') as f:
                f.write(r.content)
            print(f" -> Saved {name}.png")
        else:
            print(f" -> Failed with status {r.status_code}")
    except Exception as e:
        print(f" -> Error: {e}")
        
    time.sleep(10)

print("Done generating batch 2.")
