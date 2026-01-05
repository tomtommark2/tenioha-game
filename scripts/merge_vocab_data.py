import json
import re

vocab_js_path = 'data/vocabulary.js'
json_1900_path = 'target1900_data.json'
json_1400_path = 'target1400_data.json'
json_system_path = 'system_words_data.json'

def load_data(path):
    try:
        with open(path, 'r', encoding='utf-8') as f:
            return json.load(f)
    except FileNotFoundError:
        print(f"Warning: {path} not found.")
        return []

def to_js_obj(data_list):
    lines = []
    for item in data_list:
        props = []
        for k, v in item.items():
            if isinstance(v, str):
                v_str = json.dumps(v, ensure_ascii=False)
            else:
                v_str = str(v)
            props.append(f'{k}: {v_str}')
        lines.append(f'        {{ {", ".join(props)} }},')
    return '\n'.join(lines)

# Load data
data_1900 = load_data(json_1900_path)
data_1400 = load_data(json_1400_path)
data_system = load_data(json_system_path)

js_block_1900 = to_js_obj(data_1900)
js_block_1400 = to_js_obj(data_1400)
js_block_system = to_js_obj(data_system)

# Read JS file
with open(vocab_js_path, 'r', encoding='utf-8') as f:
    js_content = f.read()

# Replace placeholders
content = js_content
placeholder_1900 = '// [SELECTION1900_DATA_PLACEHOLDER]'
placeholder_1400 = '// [SELECTION1400_DATA_PLACEHOLDER]'
placeholder_system = '// [SYSTEM_WORDS_DATA_PLACEHOLDER]'

if placeholder_1900 in content:
    content = content.replace(placeholder_1900, js_block_1900)
    print("Merged Selection 1900 data.")
else:
    print("Warning: Selection 1900 placeholder not found.")

if placeholder_1400 in content:
    content = content.replace(placeholder_1400, js_block_1400)
    print("Merged Selection 1400 data.")
else:
    print("Warning: Selection 1400 placeholder not found.")

if placeholder_system in content:
    content = content.replace(placeholder_system, js_block_system)
    print("Merged System Words data.")
else:
    print("Warning: System Words placeholder not found.")

# Save
with open(vocab_js_path, 'w', encoding='utf-8') as f:
    f.write(content)

print("Vocabulary merge complete.")
