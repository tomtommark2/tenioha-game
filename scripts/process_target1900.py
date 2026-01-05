import csv
import json
import re

# Load existing vocabulary to find matches
vocab_js_path = 'data/vocabulary.js'
target_csv_path = 'taget1900.csv'
output_json_path = 'target1900_data.json'

def load_existing_vocab(js_path):
    with open(js_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    # Extract the JSON-like objects
    # This is a simple regex extraction, might need more robustness if file format varies
    vocab_map = {}
    
    # Find all arrays in DEFAULT_VOCABULARY
    # We look for: key: [ ... ]
    
    # Actually, simpler: just find all { word: "...", ... } objects
    # regex to find properties. 
    # Let's iterate through lines to be safer against JS syntax nuances
    
    lines = content.split('\n')
    current_level = None
    
    for line in lines:
        line = line.strip()
        if ':' in line and '[' in line:
            key = line.split(':')[0].strip()
            if key in ['junior', 'basic', 'daily', 'exam1', 'exam2']: # exam2 is being deleted but might still be there in source
                current_level = key
        
        if current_level and line.startswith('{') and 'word:' in line:
            # Parse simple object line
            try:
                # Extract word value
                word_match = re.search(r'word:\s*"([^"]+)"', line)
                if word_match:
                    word = word_match.group(1)
                    if word not in vocab_map:
                        vocab_map[word] = []
                    vocab_map[word].append(current_level)
            except:
                pass
                
    return vocab_map

existing_vocab_map = load_existing_vocab(vocab_js_path)

entries = []
with open(target_csv_path, 'r', encoding='utf-8') as f:
    # Handle BOM if present? Python utf-8 handles it? 
    # The file view didn't show BOM chars but safeguard usually good.
    reader = csv.reader(f)
    for row in reader:
        if len(row) < 3:
            continue
            
        # CSV Format: No, Word, Meaning
        # 1,create,を創り出す...
        
        no = row[0].strip()
        word = row[1].strip()
        meaning = row[2].strip()
        
        # Check if exists in other levels
        linked_levels = existing_vocab_map.get(word, [])
        link_str = None
        if linked_levels:
            # Prioritize levels? junior > basic > daily > exam1
            priority = ['junior', 'basic', 'daily', 'exam1']
            for p in priority:
                if p in linked_levels:
                    link_str = p
                    break
            if not link_str:
                link_str = linked_levels[0]

        entry = {
            "word": word,
            "meaning": meaning,
            "phrase": word, # Default phrase is word itself if no data
            "pos": "other", # Default pos
            "example": f"{word} example.", # Placeholder
            "set": 1,
            "id": int(no) # Keep original ID reference
        }
        
        # If linked, we add a property to signal UI/Logic to reference the other one
        if link_str:
            entry["ref"] = link_str
            # Copyright Mitigation: Remove meaning/example if referenced
            entry["meaning"] = ""
            entry["example"] = ""
            
        entries.append(entry)

# Write to a JSON snippet file we can paste
with open(output_json_path, 'w', encoding='utf-8') as f:
    json.dump(entries, f, ensure_ascii=False, indent=4)

print(f"Processed {len(entries)} words. Saved to {output_json_path}")
