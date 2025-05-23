import os

# === CONFIG ===
AUDIO_ROOT = r"C:\Users\hp\Documents\GenAI\testreactnativeapp\english-chinese-audio\assets\audio"
OUTPUT_FILE = r"C:\Users\hp\Documents\GenAI\testreactnativeapp\audioManifest.js"
RELATIVE_PREFIX = './assets/audio'  # Relative path for React Native require()

# === GATHER ENTRIES ===
entries = []

for root, _, files in os.walk(AUDIO_ROOT):
    for file in files:
        if file.endswith(".mp3"):
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, os.path.dirname(OUTPUT_FILE)).replace("\\", "/")
            key = os.path.splitext(file)[0]  # e.g. L1-0001eng
            entries.append((key, f"require('{RELATIVE_PREFIX}/{rel_path.split('assets/audio/')[-1]}')"))

# === WRITE TO JS FILE ===
with open(OUTPUT_FILE, "w", encoding="utf-8") as f:
    f.write("export const audioManifest = {\n")
    for key, require_stmt in sorted(entries):
        f.write(f"  '{key}': {require_stmt},\n")
    f.write("};\n")

print(f"✅ Manifest generated: {OUTPUT_FILE}")
