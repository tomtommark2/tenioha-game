
import re

def get_csv_words():
    words = []
    try:
        with open('C:\\Users\\warut\\python_chatgpt\\CEFR-J Wordlist Ver1.6 - A2_sep.csv', 'r', encoding='utf-8') as f:
            lines = f.readlines()[1:] # Skip header
            for line in lines:
                parts = line.strip().split(',')
                if parts:
                    words.append((parts[0].strip(), parts[1].strip() if len(parts) > 1 else ''))
    except Exception as e:
        print(f"Error reading CSV: {e}")
    return words

def get_js_words():
    words = []
    try:
        with open('c:\\Users\\warut\\python_chatgpt\\data\\vocabulary.js', 'r', encoding='utf-8') as f:
            content = f.read()
            # Find basic array content
            match = re.search(r'basic:\s*\[(.*?)\]', content, re.DOTALL)
            if match:
                basic_content = match.group(1)
                # Find { word: "...", pos: "..." }
                # Using a more robust regex that handles embedded quotes/apostrophes
                word_matches = re.finditer(r'word:\s*(?P<q1>["\'])(.*?)(?P=q1).*?pos:\s*(?P<q2>["\'])(.*?)(?P=q2)', basic_content, re.DOTALL)
                for wm in word_matches:
                    words.append((wm.group(2), wm.group(4)))
    except Exception as e:
        print(f"Error reading JS: {e}")
    return words

csv_words = get_csv_words()
js_words = get_js_words()

# Map POS from CSV to JS format
pos_map = {
    'noun': '名',
    'verb': '動',
    'be-verb': '動',
    'do-verb': '動',
    'adjective': '形',
    'adverb': '副',
    'preposition': '前',
    'conjunction': '接',
    'pronoun': '代',
    'auxiliary': '助',
    'determiner': 'other',
    'number': 'other',
    'modal auxiliary': '助',
    'interjection': 'other',
    'relative pronoun': '代',
    'relative adverb': '副'
}

js_words_set = set()
for w, p in js_words:
    js_words_set.add((w, p))

missing = []
for w, p in csv_words:
    jp_p = pos_map.get(p, p)
    if (w, jp_p) not in js_words_set:
        missing.append((w, p))

print(f"Total CSV words: {len(csv_words)}")
print(f"Total JS words: {len(js_words)}")
print(f"Number of missing words: {len(missing)}")
print("Missing words (first 50):")
for w, p in missing[:50]:
    print(f"{w} ({p})")
