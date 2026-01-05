import csv
import json
import re

# Load existing vocabulary to find matches
vocab_js_path = 'data/vocabulary.js'
target_csv_path = 'target1400.csv'
output_json_path = 'target1400_data.json'

def load_existing_vocab(js_path):
    with open(js_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    vocab_map = {}
    
    # Simple regex based parsing to find which level a word belongs to
    lines = content.split('\n')
    current_level = None
    
    for line in lines:
        line = line.strip()
        if ':' in line and '[' in line:
            key = line.split(':')[0].strip()
            if key in ['junior', 'basic', 'daily', 'exam1', 'selection1900', 'selection1400']:
                current_level = key
        
        if current_level and current_level not in ['selection1900', 'selection1400'] and line.startswith('{') and 'word:' in line:
            try:
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
try:
    with open(target_csv_path, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        for row in reader:
            if len(row) < 3:
                continue
                
            # CSV Format: No, Word, Meaning
            no = row[0].strip()
            word = row[1].strip()
            meaning = row[2].strip()
            
            # Check if exists in other levels
            linked_levels = existing_vocab_map.get(word, [])
            link_str = None
            if linked_levels:
                # Priority: junior > basic > daily > exam1
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
                "phrase": word, 
                "pos": "other",
                "example": f"{word} example.", 
                "set": 1,
                "id": int(no)
            }
            
            # Link check
            if link_str:
                entry["ref"] = link_str
                # Copyright Mitigation: empty meaning/example
                entry["meaning"] = ""
                entry["example"] = ""
                
            entries.append(entry)

    with open(output_json_path, 'w', encoding='utf-8') as f:
        json.dump(entries, f, ensure_ascii=False, indent=4)

    print(f"Processed {len(entries)} words. Saved to {output_json_path}")
except Exception as e:
    print(f"Error processing {target_csv_path}: {e}")
