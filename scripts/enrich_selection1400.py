import json
import re

def enrich_data():
    # 1. Load current selection data
    target_file = 'target1400_data.json'
    try:
        with open(target_file, 'r', encoding='utf-8') as f:
            selection_data = json.load(f)
    except FileNotFoundError:
        print(f"Error: {target_file} not found.")
        return

    current_words = set(item['word'].lower() for item in selection_data)
    
    # 2. Extract potential bonus words from vocabulary.js (Exam 1)
    bonus_candidates = []
    
    try:
        with open('data/vocabulary.js', 'r', encoding='utf-8') as f:
            content = f.read()
            
        match = re.search(r'exam1:\s*\[(.*?)\]', content, re.DOTALL)
        if match:
            exam1_content = match.group(1)
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
            "ref": "exam1"
        }
        selection_data.append(new_entry)
        
    # 4. Save
    with open(target_file, 'w', encoding='utf-8') as f:
        json.dump(selection_data, f, indent=4, ensure_ascii=False)
        
    print(f"Successfully added {len(bonus_candidates)} words to {target_file}")

if __name__ == "__main__":
    enrich_data()
