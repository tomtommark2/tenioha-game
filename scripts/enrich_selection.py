import json
import re

def enrich_data():
    # 1. Load current selection data
    try:
        with open('target1900_data.json', 'r', encoding='utf-8') as f:
            selection_data = json.load(f)
    except FileNotFoundError:
        print("Error: target1900_data.json not found.")
        return

    current_words = set(item['word'].lower() for item in selection_data)
    
    # 2. Extract potential bonus words from vocabulary.js (Exam 1)
    # Since we can't easily import vocabulary.js in Python, we'll parse it as text
    # searching for basic structure in the 'exam1' array.
    
    bonus_candidates = []
    
    try:
        with open('data/vocabulary.js', 'r', encoding='utf-8') as f:
            content = f.read()
            
        # Regex to find the exam1 array content
        # Looking for matching key/value pairs
        # This is a bit fragile but sufficient if format is standard
        # We look for lines containing "word:" inside the file, but we need to know which section.
        
        # Simpler approach: We know the file structure.
        # Find "exam1: [" and parse objects until "]"
        
        match = re.search(r'exam1:\s*\[(.*?)\]', content, re.DOTALL)
        if match:
            exam1_content = match.group(1)
            # Find word properties: word: "value"
            # Regex: word:\s*['"](.*?)['"]
            words = re.findall(r'word:\s*[\'"](.*?)[\'"]', exam1_content)
            
            for w in words:
                if w.lower() not in current_words:
                    bonus_candidates.append(w)
                    if len(bonus_candidates) >= 50:
                        break
    except Exception as e:
        print(f"Error parsing vocabulary.js: {e}")
        return

    print(f"Found {len(bonus_candidates)} bonus words.")

    # 3. Append to selection data
    last_id = 0
    if selection_data:
        last_id = max(item.get('id', 0) for item in selection_data)
        
    start_id = last_id + 1
    
    for i, word in enumerate(bonus_candidates):
        new_entry = {
            "id": start_id + i,
            "word": word,
            "meaning": "", # Copyright Mitigation
            "pos": "unknown",
            "example": "", # Copyright Mitigation
            "set": 1,
            "ref": "exam1"            # <--- Crucial
        }
        selection_data.append(new_entry)
        
    # 4. Save
    with open('target1900_data.json', 'w', encoding='utf-8') as f:
        json.dump(selection_data, f, indent=4, ensure_ascii=False)
        
    print(f"Successfully added {len(bonus_candidates)} words to target1900_data.json")

if __name__ == "__main__":
    enrich_data()
