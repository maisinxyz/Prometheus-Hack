import os
import subprocess

songs = [
    ("Summer Smile by Silent Partner", "summer_smile"),
    ("Blue Skies by Silent Partner", "blue_skies"),
    ("Candyland by Tobu", "candyland"),
    ("Hope by Tobu", "hope"),
    ("Ukelele by Bensound", "ukelele"),
    ("Carefree by Kevin MacLeod", "carefree")
]

out_dir = r"C:\Users\jason\Documents\Prometheus-Hack\public\assets\audio"

for query, filename in songs:
    print(f"Downloading {query}...")
    cmd = [
        "python", "-m", "yt_dlp",
        f"ytsearch1:{query}",
        "-f", "bestaudio[ext=webm]/bestaudio[ext=m4a]/bestaudio",
        "-o", os.path.join(out_dir, f"{filename}.%(ext)s")
    ]
    subprocess.run(cmd)

print("Done downloading songs.")
