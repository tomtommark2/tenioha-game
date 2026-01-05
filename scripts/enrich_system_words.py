import json
import re

def enrich_data():
    # 1. Load current system data
    try:
        with open('system_words_data.json', 'r', encoding='utf-8') as f:
            system_data = json.load(f)
    except FileNotFoundError:
        print("Error: system_words_data.json not found.")
        return

    current_words = set(item['word'].lower() for item in system_data)
    
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

    # 3. Append to system data
    # Find max ID to append correctly? Or system list doesn't have IDs?
    # process_system_words.py didn't seem to generate IDs.
    # We'll just append.
    
    for i, word in enumerate(bonus_candidates):
        new_entry = {
            "word": word,
            "meaning": "", # Copyright Safe
            "phrase": "",
            "pos": "unknown",
            "example": "",
            "set": "sys_2000",
            "ref": f"exam1:{word}" # Link to original data
        }
        
        system_data.append(new_entry)

    # 4. Save
    with open('system_words_data.json', 'w', encoding='utf-8') as f:
        json.dump(system_data, f, indent=4, ensure_ascii=False)
        
    print(f"Successfully added 50 words. Total: {len(system_data)}")

if __name__ == "__main__":
    enrich_data()
