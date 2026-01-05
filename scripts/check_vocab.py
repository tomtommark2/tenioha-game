
import os

path = 'data/vocabulary.js'
enc = 'utf-8'

if not os.path.exists(path):
    print(f"File not found: {path}")
else:
    with open(path, 'r', encoding=enc) as f:
        lines = f.readlines()
        print(f"Total lines: {len(lines)}")
        
        content = "".join(lines)
        print(f"Has 'selection1900: [': {'selection1900: [' in content}")
        print(f"Has 'selection1400: [': {'selection1400: [' in content}")
        print(f"Has 'system: [': {'system: [' in content}")

