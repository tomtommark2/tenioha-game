
import re
import json

def deduplicate():
    file_path = 'c:\\Users\\warut\\python_chatgpt\\data\\vocabulary.js'
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # We need to preserve the non-basic parts
        # The structure is:
        # const DEFAULT_VOCABULARY = {
        #     basic: [...],
        #     daily: [...],
        #     exam1: [...],
        #     exam2: [...]
        # };
        
        # Regex to find the basic array
        basic_match = re.search(r'basic:\s*\[(.*?)\],', content, re.DOTALL)
        if not basic_match:
            # Maybe it's at the end or has different formatting
            basic_match = re.search(r'basic:\s*\[(.*?)\]', content, re.DOTALL)
            
        if basic_match:
            basic_content = basic_match.group(1)
            # Find all objects { ... }
            entries = re.findall(r'\{\s*word:.*?\s*\}', basic_content, re.DOTALL)
            
            seen = set()
            unique_entries = []
            for entry in entries:
                # Extract word and pos to check for uniqueness
                w_match = re.search(r'word:\s*["\'](.*?)["\']', entry)
                p_match = re.search(r'pos:\s*["\'](.*?)["\']', entry)
                if w_match and p_match:
                    w = w_match.group(1)
                    p = p_match.group(1)
                    if (w, p) not in seen:
                        seen.add((w, p))
                        unique_entries.append(entry)
            
            new_basic_content = ',\n        '.join(unique_entries)
            new_content = content.replace(basic_content, new_basic_content)
            
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(new_content)
            
            print(f"Deduplication complete. Unique words in basic: {len(unique_entries)}")
        else:
            print("Could not find basic array.")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    deduplicate()
