
import json
import re
import os

# B1 Batch 1 (Words 1-50)
new_words = [
    {"word": "abandon", "meaning": "【動】捨てる、放棄する", "pos": "動", "example": "He decided to abandon the project.", "phrase": "abandon hope", "set": 1},
    {"word": "able", "meaning": "【形】できる、有能な", "pos": "形", "example": "You will be able to speak English soon.", "phrase": "be able to", "set": 1},
    {"word": "abnormal", "meaning": "【形】異常な", "pos": "形", "example": "The test results were abnormal.", "phrase": "abnormal behavior", "set": 1},
    {"word": "aboard", "meaning": "【副】乗って、搭乗して", "pos": "副", "example": "Welcome aboard.", "phrase": "climb aboard", "set": 1},
    {"word": "aborigine", "meaning": "【名】先住民（特にオーストラリアの）", "pos": "名", "example": "Many Aborigines live in this region.", "phrase": "Australian Aborigine", "set": 1},
    {"word": "above", "meaning": "【形】上述の", "pos": "形", "example": "Please read the above sentence.", "phrase": "the above", "set": 1},
    {"word": "absence", "meaning": "【名】不在、欠席", "pos": "名", "example": "His absence was noticed.", "phrase": "leave of absence", "set": 1},
    {"word": "absent", "meaning": "【形】不在の、欠席の", "pos": "形", "example": "He was absent from school yesterday.", "phrase": "be absent from", "set": 1},
    {"word": "absolute", "meaning": "【形】絶対的な、完全な", "pos": "形", "example": "It's an absolute disaster.", "phrase": "absolute truth", "set": 1},
    {"word": "absolutely", "meaning": "【副】絶対に、完全に", "pos": "副", "example": "You are absolutely right.", "phrase": "absolutely essential", "set": 1},
    {"word": "absorb", "meaning": "【動】吸収する", "pos": "動", "example": "Plants absorb water from the soil.", "phrase": "absorb knowledge", "set": 1},
    {"word": "abstract", "meaning": "【形】抽象的な", "pos": "形", "example": "Love is an abstract concept.", "phrase": "abstract art", "set": 1},
    {"word": "abundance", "meaning": "【名】豊富、大量", "pos": "名", "example": "There is an abundance of food.", "phrase": "in abundance", "set": 1},
    {"word": "abundant", "meaning": "【形】豊富な", "pos": "形", "example": "We have an abundant supply of water.", "phrase": "abundant resources", "set": 1},
    {"word": "academic", "meaning": "【形】学問の、大学の", "pos": "形", "example": "She has a brilliant academic record.", "phrase": "academic year", "set": 1},
    {"word": "academy", "meaning": "【名】学院、専門学校", "pos": "名", "example": "He studied at the Royal Academy of Arts.", "phrase": "military academy", "set": 1},
    {"word": "accent", "meaning": "【名】なまり、アクセント", "pos": "名", "example": "He has a strong French accent.", "phrase": "foreign accent", "set": 1},
    {"word": "acceptance", "meaning": "【名】受諾、受け入れ", "pos": "名", "example": "She received a letter of acceptance.", "phrase": "acceptance speech", "set": 1},
    {"word": "access", "meaning": "【名】接近、利用", "pos": "名", "example": "We have easy access to the internet.", "phrase": "gain access to", "set": 1},
    {"word": "accessible", "meaning": "【形】利用可能な、近づきやすい", "pos": "形", "example": "The information is accessible to everyone.", "phrase": "easily accessible", "set": 1},
    {"word": "accessory", "meaning": "【名】アクセサリー、付属品", "pos": "名", "example": "She bought some accessories for her dress.", "phrase": "fashion accessory", "set": 1},
    {"word": "accidental", "meaning": "【形】偶然の", "pos": "形", "example": "The meeting was accidental.", "phrase": "accidental death", "set": 1},
    {"word": "accidentally", "meaning": "【副】誤って、偶然に", "pos": "副", "example": "I accidentally deleted the file.", "phrase": "accidentally on purpose", "set": 1},
    {"word": "accompany", "meaning": "【動】同行する、伴う", "pos": "動", "example": "May I accompany you?", "phrase": "accompany a friend", "set": 1},
    {"word": "accomplish", "meaning": "【動】成し遂げる", "pos": "動", "example": "We accomplished our goal.", "phrase": "accomplish a task", "set": 1},
    {"word": "according to", "meaning": "【前】〜によれば", "pos": "前", "example": "According to the weather forecast, it will rain.", "phrase": "according to plan", "set": 1},
    {"word": "account", "meaning": "【動】説明する（for）、占める", "pos": "動", "example": "Can you account for your absence?", "phrase": "account for", "set": 1},
    {"word": "accountant", "meaning": "【名】会計士", "pos": "名", "example": "He works as an accountant.", "phrase": "certified public accountant", "set": 1},
    {"word": "accuracy", "meaning": "【名】正確さ", "pos": "名", "example": "Accuracy is important in this job.", "phrase": "with accuracy", "set": 1},
    {"word": "accurate", "meaning": "【形】正確な", "pos": "形", "example": "The report was accurate.", "phrase": "accurate information", "set": 1},
    {"word": "accurately", "meaning": "【副】正確に", "pos": "副", "example": "Please measure it accurately.", "phrase": "describe accurately", "set": 1},
    {"word": "accuse", "meaning": "【動】非難する、告発する", "pos": "動", "example": "She accused him of lying.", "phrase": "accuse A of B", "set": 1},
    {"word": "accustom", "meaning": "【動】慣れさせる", "pos": "動", "example": "You must accustom yourself to the new environment.", "phrase": "accustom oneself to", "set": 1},
    {"word": "ache", "meaning": "【名】痛み", "pos": "名", "example": "I have an ache in my back.", "phrase": "dull ache", "set": 1},
    {"word": "achievement", "meaning": "【名】達成、業績", "pos": "名", "example": "Winning the prize was a great achievement.", "phrase": "sense of achievement", "set": 1},
    {"word": "acknowledge", "meaning": "【動】認める", "pos": "動", "example": "He acknowledged his mistake.", "phrase": "acknowledge receipt", "set": 1},
    {"word": "acknowledgement", "meaning": "【名】承認、謝辞", "pos": "名", "example": "I received an acknowledgement of my letter.", "phrase": "in acknowledgement of", "set": 1},
    {"word": "acknowledgment", "meaning": "【名】承認（acknowledgementの異綴り）", "pos": "名", "example": "Please send an acknowledgment.", "phrase": "letter of acknowledgment", "set": 1},
    {"word": "acquaintance", "meaning": "【名】知人", "pos": "名", "example": "He is just an acquaintance.", "phrase": "make the acquaintance of", "set": 1},
    {"word": "acquire", "meaning": "【動】習得する、獲得する", "pos": "動", "example": "She acquired a good knowledge of English.", "phrase": "acquire skills", "set": 1},
    {"word": "act", "meaning": "【動】行動する、演じる", "pos": "動", "example": "You must act quickly.", "phrase": "act as", "set": 1},
    {"word": "active", "meaning": "【形】活動的な", "pos": "形", "example": "He leads an active life.", "phrase": "active part", "set": 1},
    {"word": "actress", "meaning": "【名】女優", "pos": "名", "example": "She is a famous actress.", "phrase": "lead actress", "set": 1},
    {"word": "ad", "meaning": "【名】広告（advertisementの略）", "pos": "名", "example": "I saw an ad for a new car.", "phrase": "placed an ad", "set": 1},
    {"word": "adapt", "meaning": "【動】適応させる、順応する", "pos": "動", "example": "We must adapt to change.", "phrase": "adapt to", "set": 1},
    {"word": "address", "meaning": "【動】話しかける、演説する", "pos": "動", "example": "He addressed the audience.", "phrase": "address a problem", "set": 1},
    {"word": "addressee", "meaning": "【名】受信人、宛名", "pos": "名", "example": "Include the name of the addressee.", "phrase": "return to addressee", "set": 1},
    {"word": "administration", "meaning": "【名】管理、行政、政府", "pos": "名", "example": "She works in administration.", "phrase": "Biden administration", "set": 1},
    {"word": "admiration", "meaning": "【名】賞賛", "pos": "名", "example": "She earned the admiration of her peers.", "phrase": "full of admiration", "set": 1},
    {"word": "admission", "meaning": "【名】入場、入学", "pos": "名", "example": "Admission to the museum is free.", "phrase": "admission fee", "set": 1}
]

js_path = 'c:\\Users\\warut\\python_chatgpt\\data\\vocabulary.js'

with open(js_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Parse existing daily words to prevent duplicates
daily_match = re.search(r'daily:\s*\[(.*?)\]', content, re.DOTALL)
existing_words = set()
if daily_match:
    daily_content = daily_match.group(1)
    # Extract word:"..." using regex
    found = re.findall(r'word:\s*"([^"]+)"', daily_content)
    for w in found:
        existing_words.add(w)

formatted_js = []
added_count = 0
for w in new_words:
    if w["word"] in existing_words:
        print(f"Skipping duplicate: {w['word']}")
        continue
    
    entry = f'{{ word: "{w["word"]}", meaning: "{w["meaning"]}", pos: "{w["pos"]}", example: "{w["example"]}", phrase: "{w["phrase"]}", set: {w["set"]} }}'
    formatted_js.append(entry)
    added_count += 1

if added_count == 0:
    print("No new words to add.")
else:
    # Join with indentation
    joined_data = ",\n        ".join(formatted_js)
    
    # Insert logic - simpler: strictly assume we have "daily: [" and append if not empty
    # We'll use the replace with regex approach again but carefully
    
    # We want to insert AFTER the opening bracket "daily: ["
    # But if there's content, we need a comma.
    
    # If the block is "daily: []", we replace with "daily: [ <content> ]"
    # If "daily: [ <existing> ]", we replace "daily: [" with "daily: [ <content>, "
    
    if "daily: []" in content:
        new_content = content.replace("daily: []", f"daily: [\n        {joined_data}\n    ]")
    else:
        # Prepend to start of list for visibility? Or append?
        # Let's append to the END of the list this time to keep order? 
        # Actually user might want to see new words?
        # Let's Prepend to be safe and consistent with previous scipt.
        new_content = content.replace("daily: [", f"daily: [\n        {joined_data},")

    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Success: Added {added_count} words to daily array.")
