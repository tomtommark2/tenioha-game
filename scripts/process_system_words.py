import csv
import json
import re

# 1. Load Existing Vocabulary (to find refs)
EXISTING_VOCAB_FILE = 'data/vocabulary.js'

def load_existing_vocab():
    print("Loading existing vocabulary...")
    try:
        with open(EXISTING_VOCAB_FILE, 'r', encoding='utf-8') as f:
            content = f.read()
            # Extract JSON part
            start = content.find('{')
            end = content.rfind('}') + 1
            if start == -1 or end == 0:
                print("Error: Could not find JSON object in vocabulary.js")
                return {}
            
            json_str = content[start:end]
            # Remove comments
            json_str = re.sub(r'//.*', '', json_str)
            
            # Fix keys to be quoted (basic fix) if needed, 
            # but usually vocabulary.js keys are unquoted in JS.
            # Ideally we rely on the Structure. 
            # Since we can't easily parse JS object in Python without a library,
            # Let's simple-parse or assume standard format.
            
            # Actually, previous scripts might have used a simpler approach or regex.
            # Let's use a regex to find all words in specific sets.
            
            vocab_map = {}
            
            # Regex to find: { word: "apple", ... set: "basic" ... }
            # This is complex. Let's assume we can regex match "word": "..." and "set": "..." nearby.
            # Or better, just regex match all `word: "..."` and assume first match is the key.
            # AND we need to know which SET it belongs to.
            
            # Simpler approach:
            # The file is structured as key: [ ... objects ... ]
            # We can regex each block.
            
            categories = ['basic', 'daily', 'junior', 'exam1', 'exam2']
            
            for cat in categories:
                # Find the array block for this category
                pattern = f"{cat}:\\s*\\[(.*?)\\]"
                match = re.search(pattern, content, re.DOTALL)
                if match:
                    block = match.group(1)
                    # Find all words in this block
                    # word: "apple"
                    word_matches = re.findall(r'word:\s*"(.*?)"', block)
                    for w in word_matches:
                        if w not in vocab_map:
                            vocab_map[w] = cat
                            
            print(f"Loaded {len(vocab_map)} existing words.")
            return vocab_map
            
    except Exception as e:
        print(f"Error loading vocabulary: {e}")
        return {}

vocab_map = load_existing_vocab()

# 2. Process CSV
CSV_FILE = 'system-words.csv'
OUTPUT_FILE = 'system_words_data.json'

processed_data = []

print(f"Processing {CSV_FILE}...")

try:
    with open(CSV_FILE, 'r', encoding='utf-8') as f:
        reader = csv.reader(f)
        # No header in this file, check first row
        
        for row in reader:
            if len(row) < 3:
                continue
                
            # ID is row[0], Word is row[1], Meaning is row[2]
            word = row[1].strip()
            meaning_raw = row[2].strip()
            
            # Clean formatting if needed
            
            entry = {
                "word": word,
                "meaning": meaning_raw,
                "phrase": "",
                "pos": "unknown", # Default
                "example": "",
                "set": "sys_2000"
            }
            
            # Check for Reference (Copyright Mitigation)
            if word in vocab_map:
                ref_set = vocab_map[word]
                entry["ref"] = f"{ref_set}:{word}"
                entry["meaning"] = "" # STRIP MEANING
                entry["example"] = "" # STRIP EXAMPLE
                # entry["pos"] = "" # Optional: keep pos or strip? Usually safe to keep pos or just let ref handle it.
            
            processed_data.append(entry)

    print(f"Processed {len(processed_data)} words.")

    with open(OUTPUT_FILE, 'w', encoding='utf-8') as f:
        json.dump(processed_data, f, indent=4, ensure_ascii=False)
        
    print(f"Saved to {OUTPUT_FILE}")

except Exception as e:
    print(f"Error processing CSV: {e}")
