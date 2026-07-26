import os
import glob
from rembg import remove

artifact_dir = "C:/Users/jason/.gemini/antigravity-ide/brain/37edaa8b-301a-42c9-a12d-f7773cfc9c01/raw_ai/"
dest_dir = "C:/Users/jason/Documents/Prometheus-Hack/public/assets/garden/"
os.makedirs(dest_dir, exist_ok=True)

images = glob.glob(os.path.join(artifact_dir, "*.png"))

for img_path in images:
    filename = os.path.basename(img_path)
    base_name = filename.rsplit('.', 1)[0]
    out_path = os.path.join(dest_dir, base_name + ".png")
    
    print(f"Processing {filename} -> {base_name}.png")
    
    try:
        with open(img_path, 'rb') as i:
            with open(out_path, 'wb') as o:
                input_data = i.read()
                output_data = remove(input_data)
                o.write(output_data)
        print(f"Successfully processed {base_name}")
    except Exception as e:
        print(f"Failed to process {filename}: {e}")

print("Done processing images.")
