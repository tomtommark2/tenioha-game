
import json
import re
import os

# B1 Batch 9 (Words 1001-1150, "graphic" to "inform")
new_words = [
    {"word": "graphic", "meaning": "【形】生き生きとした、図解の", "pos": "形", "example": "A graphic description.", "phrase": "graphic design", "set": 1},
    {"word": "graphics", "meaning": "【名】画像、グラフィックス", "pos": "名", "example": "Computer graphics.", "phrase": "high-quality graphics", "set": 1},
    {"word": "gratitude", "meaning": "【名】感謝", "pos": "名", "example": "Show gratitude.", "phrase": "deep gratitude", "set": 1},
    {"word": "grave", "meaning": "【名】墓", "pos": "名", "example": "Visit a grave.", "phrase": "dig a grave", "set": 1},
    {"word": "gravy", "meaning": "【名】肉汁ソース", "pos": "名", "example": "Pour gravy on the meat.", "phrase": "gravy boat", "set": 1},
    {"word": "greenhouse", "meaning": "【名】温室", "pos": "名", "example": "Greenhouse effect.", "phrase": "greenhouse gas", "set": 1},
    {"word": "greeting", "meaning": "【名】挨拶", "pos": "名", "example": "A warm greeting.", "phrase": "exchange greetings", "set": 1},
    {"word": "grill", "meaning": "【名】焼き網、グリル", "pos": "名", "example": "Put it on the grill.", "phrase": "charcoal grill", "set": 1},
    {"word": "grill", "meaning": "【動】直火で焼く", "pos": "動", "example": "Grill the fish.", "phrase": "grilled chicken", "set": 1},
    {"word": "groom", "meaning": "【名】花婿", "pos": "名", "example": "Bride and groom.", "phrase": "the groom's speech", "set": 1},
    {"word": "ground floor", "meaning": "【名】1階（英）", "pos": "名", "example": "On the ground floor.", "phrase": "ground floor apartment", "set": 1},
    {"word": "group", "meaning": "【動】分類する", "pos": "動", "example": "Group them by size.", "phrase": "group together", "set": 1},
    {"word": "grouping", "meaning": "【名】分類、グループ分け", "pos": "名", "example": "Social groupings.", "phrase": "grouping of", "set": 1},
    {"word": "growth", "meaning": "【名】成長", "pos": "名", "example": "Economic growth.", "phrase": "population growth", "set": 1},
    {"word": "guarantee", "meaning": "【名】保証", "pos": "名", "example": "Money-back guarantee.", "phrase": "under guarantee", "set": 1},
    {"word": "guess", "meaning": "【名】推測", "pos": "名", "example": "Take a guess.", "phrase": "wild guess", "set": 1},
    {"word": "guidance", "meaning": "【名】指導、案内", "pos": "名", "example": "Under his guidance.", "phrase": "guidance counselor", "set": 1},
    {"word": "guide", "meaning": "【名】ガイド、案内書", "pos": "名", "example": "Tour guide.", "phrase": "guide book", "set": 1},
    {"word": "guide", "meaning": "【動】案内する", "pos": "動", "example": "Guide the tourists.", "phrase": "guide dog", "set": 1},
    {"word": "guilt", "meaning": "【名】罪悪感、有罪", "pos": "名", "example": "Feel guilt.", "phrase": "admit guilt", "set": 1},
    {"word": "guilty", "meaning": "【形】有罪の、罪悪感のある", "pos": "形", "example": "Guilty conscience.", "phrase": "find guilty", "set": 1},
    {"word": "guitarist", "meaning": "【名】ギタリスト", "pos": "名", "example": "He is a guitarist.", "phrase": "lead guitarist", "set": 1},
    {"word": "gym", "meaning": "【名】体育館、ジム", "pos": "名", "example": "Go to the gym.", "phrase": "gym membership", "set": 1},
    {"word": "gymnastics", "meaning": "【名】体操", "pos": "名", "example": "Do gymnastics.", "phrase": "rhythmic gymnastics", "set": 1},
    {"word": "habitat", "meaning": "【名】生息地", "pos": "名", "example": "Natural habitat.", "phrase": "loss of habitat", "set": 1},
    {"word": "hairdresser", "meaning": "【名】美容師", "pos": "名", "example": "Go to the hairdresser.", "phrase": "female hairdresser", "set": 1},
    {"word": "hairdryer", "meaning": "【名】ヘアドライヤー", "pos": "名", "example": "Use a hairdryer.", "phrase": "new hairdryer", "set": 1},
    {"word": "half", "meaning": "【副】半分だけ", "pos": "副", "example": "Half asleep.", "phrase": "half empty", "set": 1},
    {"word": "hammer", "meaning": "【名】ハンマー", "pos": "名", "example": "Hit with a hammer.", "phrase": "hammer and nails", "set": 1},
    {"word": "handball", "meaning": "【名】ハンドボール", "pos": "名", "example": "Play handball.", "phrase": "handball player", "set": 1},
    {"word": "hand-held", "meaning": "【形】手持ちの", "pos": "形", "example": "Hand-held camera.", "phrase": "hand-held device", "set": 1},
    {"word": "handkerchief", "meaning": "【名】ハンカチ", "pos": "名", "example": "Wipe with a handkerchief.", "phrase": "silk handkerchief", "set": 1},
    {"word": "handle", "meaning": "【動】扱う、処理する", "pos": "動", "example": "Handle with care.", "phrase": "handle a problem", "set": 1},
    {"word": "handshake", "meaning": "【名】握手", "pos": "名", "example": "A firm handshake.", "phrase": "give a handshake", "set": 1},
    {"word": "handwriting", "meaning": "【名】手書き、筆跡", "pos": "名", "example": "His handwriting is bad.", "phrase": "neat handwriting", "set": 1},
    {"word": "handy", "meaning": "【形】便利な、器用な", "pos": "形", "example": "A handy tool.", "phrase": "come in handy", "set": 1},
    {"word": "hang", "meaning": "【動】つるす", "pos": "動", "example": "Hang a picture.", "phrase": "hang up", "set": 1},
    {"word": "hanging", "meaning": "【形】ぶら下がっている", "pos": "形", "example": "Hanging basket.", "phrase": "hanging gardens", "set": 1},
    {"word": "harbor", "meaning": "【名】港（米）", "pos": "名", "example": "Enter the harbor.", "phrase": "Safe harbor", "set": 1},
    {"word": "harbour", "meaning": "【名】港", "pos": "名", "example": "Sydney Harbour.", "phrase": "harbour view", "set": 1},
    {"word": "hardship", "meaning": "【名】苦難", "pos": "名", "example": "Face hardship.", "phrase": "economic hardship", "set": 1},
    {"word": "hard-working", "meaning": "【形】働き者の", "pos": "形", "example": "Hard-working student.", "phrase": "honest and hard-working", "set": 1},
    {"word": "harness", "meaning": "【名】馬具、ハーネス", "pos": "名", "example": "Safety harness.", "phrase": "check the harness", "set": 1},
    {"word": "hasty", "meaning": "【形】急ぎの", "pos": "形", "example": "Hasty decision.", "phrase": "hasty retreat", "set": 1},
    {"word": "hatch", "meaning": "【名】昇降口、ハッチ", "pos": "名", "example": "Through the hatch.", "phrase": "escape hatch", "set": 1},
    {"word": "hate", "meaning": "【名】憎しみ", "pos": "名", "example": "Full of hate.", "phrase": "love and hate", "set": 1},
    {"word": "hatred", "meaning": "【名】憎悪", "pos": "名", "example": "Stir up hatred.", "phrase": "racial hatred", "set": 1},
    {"word": "haunt", "meaning": "【名】たまり場", "pos": "名", "example": "Favorite haunt.", "phrase": "old haunt", "set": 1},
    {"word": "haven", "meaning": "【名】避難所", "pos": "名", "example": "Safe haven.", "phrase": "tax haven", "set": 1},
    {"word": "hazard", "meaning": "【名】危険", "pos": "名", "example": "Health hazard.", "phrase": "fire hazard", "set": 1},
    {"word": "headline", "meaning": "【名】見出し", "pos": "名", "example": "Hit the headlines.", "phrase": "newspaper headline", "set": 1},
    {"word": "heal", "meaning": "【動】治す、癒やす", "pos": "動", "example": "Time heals all wounds.", "phrase": "heal quickly", "set": 1},
    {"word": "healing", "meaning": "【形】癒やしの", "pos": "形", "example": "Healing power.", "phrase": "healing process", "set": 1},
    {"word": "hearing", "meaning": "【名】聴力、公聴会", "pos": "名", "example": "Loss of hearing.", "phrase": "hard of hearing", "set": 1},
    {"word": "heart attack", "meaning": "【名】心臓発作", "pos": "名", "example": "Have a heart attack.", "phrase": "fatal heart attack", "set": 1},
    {"word": "hearted", "meaning": "【形】～の心を持った", "pos": "形", "example": "Kind-hearted.", "phrase": "broken-hearted", "set": 1},
    {"word": "hearty", "meaning": "【形】心からの", "pos": "形", "example": "Hearty meal.", "phrase": "hearty welcome", "set": 1},
    {"word": "heat", "meaning": "【動】熱する", "pos": "動", "example": "Heat the milk.", "phrase": "heat up", "set": 1},
    {"word": "heater", "meaning": "【名】暖房器具", "pos": "名", "example": "Turn on the heater.", "phrase": "electric heater", "set": 1},
    {"word": "heaven", "meaning": "【名】天国", "pos": "名", "example": "Go to heaven.", "phrase": "heaven on earth", "set": 1},
    {"word": "heavenly", "meaning": "【形】天国の、素晴らしい", "pos": "形", "example": "Heavenly peace.", "phrase": "heavenly body", "set": 1},
    {"word": "heel", "meaning": "【名】かかと", "pos": "名", "example": "High heels.", "phrase": "Achilles' heel", "set": 1},
    {"word": "height", "meaning": "【名】高さ、身長", "pos": "名", "example": "Height of the building.", "phrase": "at the height of", "set": 1},
    {"word": "helmet", "meaning": "【名】ヘルメット", "pos": "名", "example": "Wear a helmet.", "phrase": "safety helmet", "set": 1},
    {"word": "helpless", "meaning": "【形】無力な", "pos": "形", "example": "Feel helpless.", "phrase": "helpless victim", "set": 1},
    {"word": "herd", "meaning": "【名】群れ", "pos": "名", "example": "A herd of cows.", "phrase": "herd instinct", "set": 1},
    {"word": "hesitate", "meaning": "【動】ためらう", "pos": "動", "example": "Hesitate to ask.", "phrase": "don't hesitate", "set": 1},
    {"word": "hidden", "meaning": "【形】隠された", "pos": "形", "example": "Hidden treasure.", "phrase": "hidden agenda", "set": 1},
    {"word": "highlight", "meaning": "【動】強調する", "pos": "動", "example": "Highlight the issue.", "phrase": "highlight marker", "set": 1},
    {"word": "highly", "meaning": "【副】大いに", "pos": "副", "example": "Highly recommended.", "phrase": "highly skilled", "set": 1},
    {"word": "hip", "meaning": "【名】腰、尻", "pos": "名", "example": "Hands on hips.", "phrase": "hip bone", "set": 1},
    {"word": "hire", "meaning": "【動】雇う、借りる", "pos": "動", "example": "Hire a car.", "phrase": "hire staff", "set": 1},
    {"word": "historian", "meaning": "【名】歴史家", "pos": "名", "example": "A famous historian.", "phrase": "art historian", "set": 1},
    {"word": "historic", "meaning": "【形】歴史的に重要な", "pos": "形", "example": "Historic site.", "phrase": "historic moment", "set": 1},
    {"word": "historical", "meaning": "【形】歴史の", "pos": "形", "example": "Historical facts.", "phrase": "historical novel", "set": 1},
    {"word": "hit", "meaning": "【名】打撃、ヒット", "pos": "名", "example": "A big hit.", "phrase": "take a hit", "set": 1},
    {"word": "HIV", "meaning": "【名】HIV", "pos": "名", "example": "HIV positive.", "phrase": "HIV virus", "set": 1},
    {"word": "holy", "meaning": "【形】神聖な", "pos": "形", "example": "Holy Bible.", "phrase": "holy water", "set": 1},
    {"word": "homeless", "meaning": "【形】ホームレスの", "pos": "形", "example": "Homeless people.", "phrase": "go homeless", "set": 1},
    {"word": "honest", "meaning": "【形】正直な", "pos": "形", "example": "To be honest.", "phrase": "honest answer", "set": 1},
    {"word": "honestly", "meaning": "【副】正直に", "pos": "副", "example": "Speak honestly.", "phrase": "honestly speaking", "set": 1},
    {"word": "honesty", "meaning": "【名】正直", "pos": "名", "example": "Honesty is the best policy.", "phrase": "in all honesty", "set": 1},
    {"word": "honeymoon", "meaning": "【名】新婚旅行", "pos": "名", "example": "Go on a honeymoon.", "phrase": "honeymoon suite", "set": 1},
    {"word": "hop", "meaning": "【名】ピョンと跳ぶこと", "pos": "名", "example": "A short hop.", "phrase": "hop on hop off", "set": 1},
    {"word": "hope", "meaning": "【動】望む", "pos": "動", "example": "I hope so.", "phrase": "hope for the best", "set": 1},
    {"word": "hopeful", "meaning": "【形】希望に満ちた", "pos": "形", "example": "I am hopeful.", "phrase": "hopeful sign", "set": 1},
    {"word": "hopefully", "meaning": "【副】願わくば", "pos": "副", "example": "Hopefully it will rain.", "phrase": "hopefully soon", "set": 1},
    {"word": "hopeless", "meaning": "【形】絶望的な", "pos": "形", "example": "A hopeless situation.", "phrase": "feel hopeless", "set": 1},
    {"word": "horizon", "meaning": "【名】地平線", "pos": "名", "example": "On the horizon.", "phrase": "broaden one's horizons", "set": 1},
    {"word": "horn", "meaning": "【名】警笛、角", "pos": "名", "example": "Honk the horn.", "phrase": "bull's horns", "set": 1},
    {"word": "horrible", "meaning": "【形】恐ろしい", "pos": "形", "example": "A horrible noise.", "phrase": "horrible smell", "set": 1},
    {"word": "horrify", "meaning": "【動】怖がらせる", "pos": "動", "example": "I was horrified.", "phrase": "horrify the public", "set": 1},
    {"word": "hostel", "meaning": "【名】ホステル", "pos": "名", "example": "Stay at a youth hostel.", "phrase": "youth hostel", "set": 1},
    {"word": "household", "meaning": "【名】世帯", "pos": "名", "example": "Household income.", "phrase": "household chores", "set": 1},
    {"word": "housework", "meaning": "【名】家事", "pos": "名", "example": "Do the housework.", "phrase": "share housework", "set": 1},
    {"word": "huge", "meaning": "【形】巨大な", "pos": "形", "example": "A huge success.", "phrase": "huge amount", "set": 1},
    {"word": "human", "meaning": "【名】人間", "pos": "名", "example": "Human being.", "phrase": "human rights", "set": 1},
    {"word": "humanity", "meaning": "【名】人類、人間性", "pos": "名", "example": "Crimes against humanity.", "phrase": "sense of humanity", "set": 1},
    {"word": "humid", "meaning": "【形】湿気の多い", "pos": "形", "example": "Humid climate.", "phrase": "hot and humid", "set": 1},
    {"word": "humor", "meaning": "【名】ユーモア（米）", "pos": "名", "example": "Sense of humor.", "phrase": "black humor", "set": 1},
    {"word": "humorous", "meaning": "【形】ユーモラスな", "pos": "形", "example": "Humorous story.", "phrase": "humorous remark", "set": 1},
    {"word": "humour", "meaning": "【名】ユーモア", "pos": "名", "example": "Sense of humour.", "phrase": "dry humour", "set": 1},
    {"word": "hunger", "meaning": "【名】飢え", "pos": "名", "example": "Die of hunger.", "phrase": "satisfy hunger", "set": 1},
    {"word": "hunt", "meaning": "【名】狩り", "pos": "名", "example": "Go on a hunt.", "phrase": "treasure hunt", "set": 1},
    {"word": "hunt", "meaning": "【動】狩る", "pos": "動", "example": "Hunt for food.", "phrase": "hunt down", "set": 1},
    {"word": "hurriedly", "meaning": "【副】急いで", "pos": "副", "example": "Left hurriedly.", "phrase": "dress hurriedly", "set": 1},
    {"word": "hurt", "meaning": "【形】怪我をして、傷ついて", "pos": "形", "example": "No one was hurt.", "phrase": "feel hurt", "set": 1},
    {"word": "hut", "meaning": "【名】小屋", "pos": "名", "example": "Wooden hut.", "phrase": "mountain hut", "set": 1},
    {"word": "ice hockey", "meaning": "【名】アイスホッケー", "pos": "名", "example": "Play ice hockey.", "phrase": "ice hockey rink", "set": 1},
    {"word": "ice skating", "meaning": "【名】アイススケート", "pos": "名", "example": "Go ice skating.", "phrase": "ice skating rink", "set": 1},
    {"word": "identity", "meaning": "【名】身元、アイデンティティ", "pos": "名", "example": "Prove your identity.", "phrase": "identity card", "set": 1},
    {"word": "identity card", "meaning": "【名】身分証明書", "pos": "名", "example": "Show your identity card.", "phrase": "national identity card", "set": 1},
    {"word": "idiom", "meaning": "【名】慣用句", "pos": "名", "example": "English idiom.", "phrase": "use an idiom", "set": 1},
    {"word": "idol", "meaning": "【名】アイドル", "pos": "名", "example": "Pop idol.", "phrase": "teen idol", "set": 1},
    {"word": "ignore", "meaning": "【動】無視する", "pos": "動", "example": "Ignore the warning.", "phrase": "ignore him", "set": 1},
    {"word": "illegally", "meaning": "【副】不法に", "pos": "副", "example": "Entered illegally.", "phrase": "illegally parked", "set": 1},
    {"word": "illness", "meaning": "【名】病気", "pos": "名", "example": "Serious illness.", "phrase": "recover from illness", "set": 1},
    {"word": "illuminate", "meaning": "【動】照らす", "pos": "動", "example": "Illuminate the room.", "phrase": "illuminate a manuscript", "set": 1},
    {"word": "imaginary", "meaning": "【形】架空の", "pos": "形", "example": "Imaginary friend.", "phrase": "imaginary line", "set": 1},
    {"word": "imitate", "meaning": "【動】真似る", "pos": "動", "example": "Imitate his voice.", "phrase": "imitate nature", "set": 1},
    {"word": "immediate", "meaning": "【形】即座の", "pos": "形", "example": "Immediate action.", "phrase": "immediate family", "set": 1},
    {"word": "immediately", "meaning": "【副】直ちに", "pos": "副", "example": "Leave immediately.", "phrase": "immediately after", "set": 1},
    {"word": "immigrate", "meaning": "【動】移住する", "pos": "動", "example": "Immigrate to Canada.", "phrase": "immigrate from", "set": 1},
    {"word": "immigration", "meaning": "【名】移住、入国管理", "pos": "名", "example": "Immigration control.", "phrase": "illegal immigration", "set": 1},
    {"word": "impair", "meaning": "【動】損なう", "pos": "動", "example": "Impair vision.", "phrase": "hearing impaired", "set": 1},
    {"word": "impression", "meaning": "【名】印象", "pos": "名", "example": "First impression.", "phrase": "make a good impression", "set": 1},
    {"word": "impressive", "meaning": "【形】印象的な", "pos": "形", "example": "Impressive performance.", "phrase": "most impressive", "set": 1},
    {"word": "improper", "meaning": "【形】不適切な", "pos": "形", "example": "Improper behavior.", "phrase": "improper conduct", "set": 1},
    {"word": "improvement", "meaning": "【名】改善", "pos": "名", "example": "Room for improvement.", "phrase": "home improvement", "set": 1},
    {"word": "incident", "meaning": "【名】出来事、事件", "pos": "名", "example": "An unfortunate incident.", "phrase": "isolated incident", "set": 1},
    {"word": "including", "meaning": "【前】～を含めて", "pos": "前", "example": "Everyone including me.", "phrase": "price including tax", "set": 1},
    {"word": "income", "meaning": "【名】収入", "pos": "名", "example": "Annual income.", "phrase": "source of income", "set": 1},
    {"word": "inconvenient", "meaning": "【形】不便な", "pos": "形", "example": "An inconvenient time.", "phrase": "inconvenient truth", "set": 1},
    {"word": "incorrect", "meaning": "【形】不正確な", "pos": "形", "example": "Incorrect answer.", "phrase": "politically incorrect", "set": 1},
    {"word": "increase", "meaning": "【名】増加", "pos": "名", "example": "Increase in price.", "phrase": "on the increase", "set": 1},
    {"word": "increasingly", "meaning": "【副】ますます", "pos": "副", "example": "Increasingly difficult.", "phrase": "become increasingly popular", "set": 1},
    {"word": "incredible", "meaning": "【形】信じられない", "pos": "形", "example": "Incredible story.", "phrase": "incredible hulk", "set": 1},
    {"word": "incredibly", "meaning": "【副】信じられないほど", "pos": "副", "example": "Incredibly fast.", "phrase": "incredibly lucky", "set": 1},
    {"word": "indefinite article", "meaning": "【名】不定冠詞", "pos": "名", "example": "'A' is an indefinite article.", "phrase": "use an indefinite article", "set": 1},
    {"word": "independent", "meaning": "【形】独立した", "pos": "形", "example": "Independent country.", "phrase": "independent of", "set": 1},
    {"word": "indirect", "meaning": "【形】間接的な", "pos": "形", "example": "Indirect flight.", "phrase": "indirect tax", "set": 1},
    {"word": "indirectly", "meaning": "【副】間接的に", "pos": "副", "example": "Indirectly involved.", "phrase": "speak indirectly", "set": 1},
    {"word": "individual", "meaning": "【形】個々の", "pos": "形", "example": "Individual attention.", "phrase": "individual rights", "set": 1},
    {"word": "indoors", "meaning": "【副】屋内で", "pos": "副", "example": "Stay indoors.", "phrase": "go indoors", "set": 1},
    {"word": "industrial", "meaning": "【形】産業の", "pos": "形", "example": "Industrial revolution.", "phrase": "industrial area", "set": 1},
    {"word": "industry", "meaning": "【名】産業、工業", "pos": "名", "example": "Automobile industry.", "phrase": "heavy industry", "set": 1},
    {"word": "inevitable", "meaning": "【形】避けられない", "pos": "形", "example": "Inevitable result.", "phrase": "inevitable conclusion", "set": 1},
    {"word": "infection", "meaning": "【名】感染", "pos": "名", "example": "Viral infection.", "phrase": "cause infection", "set": 1},
    {"word": "infinitive", "meaning": "【名】不定詞", "pos": "名", "example": "To be is an infinitive.", "phrase": "split infinitive", "set": 1},
    {"word": "inform", "meaning": "【動】知らせる", "pos": "動", "example": "Inform the police.", "phrase": "inform of", "set": 1}
]

js_path = 'c:\\Users\\warut\\python_chatgpt\\data\\vocabulary.js'

with open(js_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Duplicate logic: check (word, pos) in existing daily array
daily_match = re.search(r'daily:\s*\[(.*?)\]', content, re.DOTALL)
existing_entries = set()

if daily_match:
    daily_content = daily_match.group(1)
    entries = daily_content.split('},')
    for entry in entries:
        w_match = re.search(r'word:\s*"([^"]+)"', entry)
        p_match = re.search(r'pos:\s*"([^"]+)"', entry)
        if w_match and p_match:
            existing_entries.add((w_match.group(1), p_match.group(1)))

formatted_js = []
added_count = 0
skipped_count = 0

for w in new_words:
    if (w["word"], w["pos"]) in existing_entries:
        print(f"Skipping exact duplicate: {w['word']} ({w['pos']})")
        skipped_count += 1
        continue
    
    entry = f'{{ word: "{w["word"]}", meaning: "{w["meaning"]}", pos: "{w["pos"]}", example: "{w["example"]}", phrase: "{w["phrase"]}", set: 1 }}'
    formatted_js.append(entry)
    added_count += 1

if added_count == 0:
     print(f"No new words added. Skipped {skipped_count} duplicates.")
else:
    # Append to daily array via replacement
    joined_data = ",\n        ".join(formatted_js)
    
    if "daily: []" in content:
        new_content = content.replace("daily: []", f"daily: [\n        {joined_data}\n    ]")
    else:
        new_content = content.replace("daily: [", f"daily: [\n        {joined_data},")

    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Success: Added {added_count} words to daily array. Skipped {skipped_count} duplicates.")
