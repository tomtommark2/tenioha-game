import shutil
import os

source = 'vocab_clicker_game.html'
dest = 'index.html'

# Read source with utf-8
with open(source, 'r', encoding='utf-8') as f:
    content = f.read()

# Write dest with utf-8
with open(dest, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"Successfully synced {source} to {dest} with UTF-8 encoding.")
