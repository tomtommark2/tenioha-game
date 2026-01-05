
import json
import re
import os

# B1 Batch 13 (Words 1601-1750, "password" to "public")
new_words = [
    {"word": "password", "meaning": "【名】パスワード", "pos": "名", "example": "Enter your password.", "phrase": "forgotten password", "set": 1},
    {"word": "past", "meaning": "【形】過去の", "pos": "形", "example": "In the past year.", "phrase": "past tense", "set": 1},
    {"word": "patience", "meaning": "【名】忍耐", "pos": "名", "example": "Lose patience.", "phrase": "have patience", "set": 1},
    {"word": "patient", "meaning": "【形】忍耐強い", "pos": "形", "example": "Be patient.", "phrase": "patient with", "set": 1},
    {"word": "patrol", "meaning": "【名】パトロール", "pos": "名", "example": "Police patrol.", "phrase": "night patrol", "set": 1},
    {"word": "pattern", "meaning": "【名】模様、パターン", "pos": "名", "example": "Floral pattern.", "phrase": "pattern of behavior", "set": 1},
    {"word": "pause", "meaning": "【名】休止", "pos": "名", "example": "A brief pause.", "phrase": "pause for thought", "set": 1},
    {"word": "pause", "meaning": "【動】一時停止する", "pos": "動", "example": "Pause the video.", "phrase": "pause to reflect", "set": 1},
    {"word": "peanut", "meaning": "【名】ピーナッツ", "pos": "名", "example": "Peanut butter.", "phrase": "salted peanuts", "set": 1},
    {"word": "peculiar", "meaning": "【形】奇妙な、特有の", "pos": "形", "example": "Peculiar smell.", "phrase": "peculiar to", "set": 1},
    {"word": "penniless", "meaning": "【形】一文無しの", "pos": "形", "example": "Die penniless.", "phrase": "left penniless", "set": 1},
    {"word": "penny", "meaning": "【名】ペニー", "pos": "名", "example": "Cost a penny.", "phrase": "every penny", "set": 1},
    {"word": "per", "meaning": "【前】～につき", "pos": "前", "example": "Miles per hour.", "phrase": "per person", "set": 1},
    {"word": "per cent", "meaning": "【名】パーセント", "pos": "名", "example": "Ten per cent.", "phrase": "100 per cent", "set": 1},
    {"word": "percent", "meaning": "【名】パーセント", "pos": "名", "example": "Fifty percent.", "phrase": "percent sign", "set": 1},
    {"word": "performer", "meaning": "【名】演奏者、演技者", "pos": "名", "example": "Street performer.", "phrase": "live performer", "set": 1},
    {"word": "permanent", "meaning": "【形】永続的な", "pos": "形", "example": "Permanent job.", "phrase": "permanent resident", "set": 1},
    {"word": "permanently", "meaning": "【副】永久に", "pos": "副", "example": "Closed permanently.", "phrase": "damaged permanently", "set": 1},
    {"word": "permit", "meaning": "【動】許可する", "pos": "動", "example": "Permit copying.", "phrase": "permit to", "set": 1},
    {"word": "personally", "meaning": "【副】個人的に", "pos": "副", "example": "Personally, I disagree.", "phrase": "take it personally", "set": 1},
    {"word": "persuade", "meaning": "【動】説得する", "pos": "動", "example": "Persuade him to go.", "phrase": "persuade of", "set": 1},
    {"word": "persuasive", "meaning": "【形】説得力のある", "pos": "形", "example": "Persuasive argument.", "phrase": "highly persuasive", "set": 1},
    {"word": "phantom", "meaning": "【形】幻の", "pos": "形", "example": "Phantom limb.", "phrase": "phantom pain", "set": 1},
    {"word": "pharmacy", "meaning": "【名】薬局", "pos": "名", "example": "Go to the pharmacy.", "phrase": "local pharmacy", "set": 1},
    {"word": "phenix", "meaning": "【名】不死鳥 (phoenix)", "pos": "名", "example": "Rise like a phenix.", "phrase": "legend of the phenix", "set": 1},
    {"word": "phenomenon", "meaning": "【名】現象", "pos": "名", "example": "Natural phenomenon.", "phrase": "strange phenomenon", "set": 1},
    {"word": "philosopher", "meaning": "【名】哲学者", "pos": "名", "example": "Greek philosopher.", "phrase": "famous philosopher", "set": 1},
    {"word": "philosophy", "meaning": "【名】哲学", "pos": "名", "example": "Study philosophy.", "phrase": "philosophy of life", "set": 1},
    {"word": "phoenix", "meaning": "【名】不死鳥", "pos": "名", "example": "Phoenix from the ashes.", "phrase": "city of Phoenix", "set": 1},
    {"word": "photocopy", "meaning": "【名】コピー", "pos": "名", "example": "Make a photocopy.", "phrase": "photocopy machine", "set": 1},
    {"word": "phrasal verb", "meaning": "【名】句動詞", "pos": "名", "example": "Learn phrasal verbs.", "phrase": "common phrasal verb", "set": 1},
    {"word": "phrase", "meaning": "【名】句、フレーズ", "pos": "名", "example": "Catchy phrase.", "phrase": "key phrase", "set": 1},
    {"word": "physics", "meaning": "【名】物理学", "pos": "名", "example": "Laws of physics.", "phrase": "nuclear physics", "set": 1},
    {"word": "pick", "meaning": "【名】選択、ピック", "pos": "名", "example": "Take your pick.", "phrase": "pick of the bunch", "set": 1},
    {"word": "pie", "meaning": "【名】パイ", "pos": "名", "example": "Apple pie.", "phrase": "pie in the sky", "set": 1},
    {"word": "piety", "meaning": "【名】信心深さ", "pos": "名", "example": "Act of piety.", "phrase": "filial piety", "set": 1},
    {"word": "pillow", "meaning": "【名】枕", "pos": "名", "example": "Soft pillow.", "phrase": "pillow case", "set": 1},
    {"word": "pin", "meaning": "【動】ピンで留める", "pos": "動", "example": "Pin a notice.", "phrase": "pin down", "set": 1},
    {"word": "pineapple", "meaning": "【名】パイナップル", "pos": "名", "example": "Fresh pineapple.", "phrase": "pineapple juice", "set": 1},
    {"word": "pipe", "meaning": "【名】パイプ、管", "pos": "名", "example": "Water pipe.", "phrase": "pipe dream", "set": 1},
    {"word": "pit", "meaning": "【名】穴、くぼみ", "pos": "名", "example": "Deep pit.", "phrase": "pit stop", "set": 1},
    {"word": "place", "meaning": "【動】置く", "pos": "動", "example": "Place the book.", "phrase": "place an order", "set": 1},
    {"word": "plain", "meaning": "【形】明白な、質素な", "pos": "形", "example": "Plain English.", "phrase": "plain yogurt", "set": 1},
    {"word": "plan", "meaning": "【動】計画する", "pos": "動", "example": "Plan a trip.", "phrase": "plan ahead", "set": 1},
    {"word": "plant", "meaning": "【動】植える", "pos": "動", "example": "Plant a tree.", "phrase": "plant seeds", "set": 1},
    {"word": "plastic", "meaning": "【名】プラスチック", "pos": "名", "example": "Plastic bag.", "phrase": "made of plastic", "set": 1},
    {"word": "platform", "meaning": "【名】駅のホーム、壇", "pos": "名", "example": "Platform 1.", "phrase": "on the platform", "set": 1},
    {"word": "pleasantly", "meaning": "【副】楽しく、愉快に", "pos": "副", "example": "Pleasantly surprised.", "phrase": "smile pleasantly", "set": 1},
    {"word": "please", "meaning": "【動】喜ばせる", "pos": "動", "example": "Difficult to please.", "phrase": "please yourself", "set": 1},
    {"word": "plenty", "meaning": "【代】たくさん", "pos": "代", "example": "Plenty of time.", "phrase": "plenty more", "set": 1},
    {"word": "plug", "meaning": "【名】プラグ、栓", "pos": "名", "example": "Pull the plug.", "phrase": "spark plug", "set": 1},
    {"word": "plus", "meaning": "【接】足す、加えて", "pos": "接", "example": "Two plus two.", "phrase": "plus tax", "set": 1},
    {"word": "pocket money", "meaning": "【名】お小遣い", "pos": "名", "example": "Save pocket money.", "phrase": "give pocket money", "set": 1},
    {"word": "poet", "meaning": "【名】詩人", "pos": "名", "example": "Famous poet.", "phrase": "romantic poet", "set": 1},
    {"word": "poetry", "meaning": "【名】詩", "pos": "名", "example": "Write poetry.", "phrase": "poetry reading", "set": 1},
    {"word": "poison", "meaning": "【名】毒", "pos": "名", "example": "Rat poison.", "phrase": "deadly poison", "set": 1},
    {"word": "poisonous", "meaning": "【形】有毒な", "pos": "形", "example": "Poisonous snake.", "phrase": "poisonous gas", "set": 1},
    {"word": "pole", "meaning": "【名】棒、極", "pos": "名", "example": "North Pole.", "phrase": "pole vault", "set": 1},
    {"word": "policy", "meaning": "【名】政策、方針", "pos": "名", "example": "Foreign policy.", "phrase": "honesty is the best policy", "set": 1},
    {"word": "politely", "meaning": "【副】礼儀正しく", "pos": "副", "example": "Ask politely.", "phrase": "smile politely", "set": 1},
    {"word": "politician", "meaning": "【名】政治家", "pos": "名", "example": "Local politician.", "phrase": "corrupt politician", "set": 1},
    {"word": "politics", "meaning": "【名】政治", "pos": "名", "example": "Talk politics.", "phrase": "party politics", "set": 1},
    {"word": "pollutant", "meaning": "【名】汚染物質", "pos": "名", "example": "Air pollutants.", "phrase": "chemical pollutant", "set": 1},
    {"word": "pond", "meaning": "【名】池", "pos": "名", "example": "Fish pond.", "phrase": "duck pond", "set": 1},
    {"word": "popcorn", "meaning": "【名】ポップコーン", "pos": "名", "example": "Eat popcorn.", "phrase": "bucket of popcorn", "set": 1},
    {"word": "pork", "meaning": "【名】豚肉", "pos": "名", "example": "Roast pork.", "phrase": "pork chop", "set": 1},
    {"word": "port", "meaning": "【名】港", "pos": "名", "example": "Fishing port.", "phrase": "port of call", "set": 1},
    {"word": "positive", "meaning": "【形】肯定的な、確信して", "pos": "形", "example": "Positive attitude.", "phrase": "positive identification", "set": 1},
    {"word": "positively", "meaning": "【副】肯定的に、断固として", "pos": "副", "example": "Think positively.", "phrase": "positively forbid", "set": 1},
    {"word": "possess", "meaning": "【動】所有する", "pos": "動", "example": "Possess a weapon.", "phrase": "possess the skills", "set": 1},
    {"word": "possession", "meaning": "【名】所有、所有物", "pos": "名", "example": "In possession of.", "phrase": "personal possessions", "set": 1},
    {"word": "possessive", "meaning": "【形】所有欲の強い", "pos": "形", "example": "Possessive boyfriend.", "phrase": "possessive pronoun", "set": 1},
    {"word": "possibility", "meaning": "【名】可能性", "pos": "名", "example": "There is a possibility.", "phrase": "distinct possibility", "set": 1},
    {"word": "postcard", "meaning": "【名】絵葉書", "pos": "名", "example": "Send a postcard.", "phrase": "picture postcard", "set": 1},
    {"word": "postman", "meaning": "【名】郵便配達員", "pos": "名", "example": "The postman delivered a letter.", "phrase": "ask the postman", "set": 1},
    {"word": "pot", "meaning": "【名】鍋、つぼ", "pos": "名", "example": "Cooking pot.", "phrase": "flower pot", "set": 1},
    {"word": "potential", "meaning": "【名】潜在能力", "pos": "名", "example": "Full potential.", "phrase": "unlock potential", "set": 1},
    {"word": "pottery", "meaning": "【名】陶器", "pos": "名", "example": "Make pottery.", "phrase": "pottery class", "set": 1},
    {"word": "pound", "meaning": "【名】ポンド", "pos": "名", "example": "British pound.", "phrase": "pound sterling", "set": 1},
    {"word": "poverty", "meaning": "【名】貧困", "pos": "名", "example": "Live in poverty.", "phrase": "poverty line", "set": 1},
    {"word": "powder", "meaning": "【名】粉", "pos": "名", "example": "Baking powder.", "phrase": "talcum powder", "set": 1},
    {"word": "practical", "meaning": "【形】実用的な", "pos": "形", "example": "Practical advice.", "phrase": "practical joke", "set": 1},
    {"word": "praise", "meaning": "【名】称賛", "pos": "名", "example": "Win praise.", "phrase": "sing praises", "set": 1},
    {"word": "prayer", "meaning": "【名】祈り", "pos": "名", "example": "Say a prayer.", "phrase": "answer to prayer", "set": 1},
    {"word": "precious", "meaning": "【形】貴重な", "pos": "形", "example": "Precious stone.", "phrase": "precious memories", "set": 1},
    {"word": "preference", "meaning": "【名】好み", "pos": "名", "example": "Personal preference.", "phrase": "sexual preference", "set": 1},
    {"word": "prefix", "meaning": "【名】接頭辞", "pos": "名", "example": "Add a prefix.", "phrase": "common prefix", "set": 1},
    {"word": "pregnant", "meaning": "【形】妊娠している", "pos": "形", "example": "Pregnant woman.", "phrase": "get pregnant", "set": 1},
    {"word": "prejudice", "meaning": "【名】偏見", "pos": "名", "example": "Racial prejudice.", "phrase": "without prejudice", "set": 1},
    {"word": "preparation", "meaning": "【名】準備", "pos": "名", "example": "In preparation for.", "phrase": "food preparation", "set": 1},
    {"word": "prepared", "meaning": "【形】準備ができている", "pos": "形", "example": "Be prepared.", "phrase": "well prepared", "set": 1},
    {"word": "preposition", "meaning": "【名】前置詞", "pos": "名", "example": "Use a preposition.", "phrase": "preposition of place", "set": 1},
    {"word": "preschool", "meaning": "【形】就学前の", "pos": "形", "example": "Preschool child.", "phrase": "preschool education", "set": 1},
    {"word": "prescription", "meaning": "【名】処方箋", "pos": "名", "example": "Doctor's prescription.", "phrase": "fill a prescription", "set": 1},
    {"word": "presence", "meaning": "【名】存在、出席", "pos": "名", "example": "In my presence.", "phrase": "presence of mind", "set": 1},
    {"word": "present", "meaning": "【形】現在の、出席して", "pos": "形", "example": "Present situation.", "phrase": "present day", "set": 1},
    {"word": "presentation", "meaning": "【名】発表、提示", "pos": "名", "example": "Give a presentation.", "phrase": "presentation skills", "set": 1},
    {"word": "preservation", "meaning": "【名】保存", "pos": "名", "example": "Food preservation.", "phrase": "preservation of nature", "set": 1},
    {"word": "preserve", "meaning": "【動】保存する", "pos": "動", "example": "Preserve traditions.", "phrase": "preserve food", "set": 1},
    {"word": "president", "meaning": "【名】大統領、社長", "pos": "名", "example": "Mr. President.", "phrase": "vice president", "set": 1},
    {"word": "press", "meaning": "【名】報道陣、プレス機", "pos": "名", "example": "Freedom of the press.", "phrase": "press conference", "set": 1},
    {"word": "press", "meaning": "【動】押す", "pos": "動", "example": "Press the button.", "phrase": "press hard", "set": 1},
    {"word": "previous", "meaning": "【形】以前の", "pos": "形", "example": "Previous page.", "phrase": "previous experience", "set": 1},
    {"word": "priest", "meaning": "【名】司祭", "pos": "名", "example": "Catholic priest.", "phrase": "parish priest", "set": 1},
    {"word": "primarily", "meaning": "【副】主として", "pos": "副", "example": "Primarily responsible.", "phrase": "designed primarily for", "set": 1},
    {"word": "primary school", "meaning": "【名】小学校（英）", "pos": "名", "example": "Go to primary school.", "phrase": "primary school teacher", "set": 1},
    {"word": "primitive", "meaning": "【形】原始の", "pos": "形", "example": "Primitive man.", "phrase": "primitive tools", "set": 1},
    {"word": "principle", "meaning": "【名】原理、原則", "pos": "名", "example": "Basic principle.", "phrase": "matter of principle", "set": 1},
    {"word": "print", "meaning": "【名】印刷", "pos": "名", "example": "In print.", "phrase": "small print", "set": 1},
    {"word": "prison", "meaning": "【名】刑務所", "pos": "名", "example": "Go to prison.", "phrase": "prison guard", "set": 1},
    {"word": "prisoner", "meaning": "【名】囚人", "pos": "名", "example": "Political prisoner.", "phrase": "take prisoner", "set": 1},
    {"word": "privacy", "meaning": "【名】プライバシー", "pos": "名", "example": "Respect privacy.", "phrase": "invasion of privacy", "set": 1},
    {"word": "prize", "meaning": "【名】賞", "pos": "名", "example": "First prize.", "phrase": "win a prize", "set": 1},
    {"word": "probability", "meaning": "【名】確率", "pos": "名", "example": "High probability.", "phrase": "in all probability", "set": 1},
    {"word": "proceed", "meaning": "【動】続行する、進む", "pos": "動", "example": "Proceed with caution.", "phrase": "proceed to", "set": 1},
    {"word": "process", "meaning": "【名】過程", "pos": "名", "example": "Learning process.", "phrase": "in the process of", "set": 1},
    {"word": "proclaim", "meaning": "【動】宣言する", "pos": "動", "example": "Proclaim independence.", "phrase": "proclaim a holiday", "set": 1},
    {"word": "procrastination", "meaning": "【名】先延ばし", "pos": "名", "example": "Stop procrastination.", "phrase": "overcome procrastination", "set": 1},
    {"word": "producer", "meaning": "【名】生産者、プロデューサー", "pos": "名", "example": "Film producer.", "phrase": "music producer", "set": 1},
    {"word": "productive", "meaning": "【形】生産的な", "pos": "形", "example": "Productive day.", "phrase": "highly productive", "set": 1},
    {"word": "profession", "meaning": "【名】職業（専門職）", "pos": "名", "example": "Legal profession.", "phrase": "medical profession", "set": 1},
    {"word": "professor", "meaning": "【名】教授", "pos": "名", "example": "University professor.", "phrase": "professor of English", "set": 1},
    {"word": "program", "meaning": "【動】プログラムする（米）", "pos": "動", "example": "Program a computer.", "phrase": "program to", "set": 1},
    {"word": "programme", "meaning": "【動】プログラムする", "pos": "動", "example": "Programme to record.", "phrase": "programme the machine", "set": 1},
    {"word": "progress", "meaning": "【名】進歩", "pos": "名", "example": "Make progress.", "phrase": "work in progress", "set": 1},
    {"word": "prohibition", "meaning": "【名】禁止", "pos": "名", "example": "Prohibition of alcohol.", "phrase": "prohibition era", "set": 1},
    {"word": "prominent", "meaning": "【形】著名な、目立つ", "pos": "形", "example": "Prominent figure.", "phrase": "play a prominent role", "set": 1},
    {"word": "promise", "meaning": "【動】約束する", "pos": "動", "example": "I promise you.", "phrase": "promise to", "set": 1},
    {"word": "promote", "meaning": "【動】促進する、昇進させる", "pos": "動", "example": "Promote health.", "phrase": "promote a product", "set": 1},
    {"word": "promotion", "meaning": "【名】昇進、促進", "pos": "名", "example": "Get a promotion.", "phrase": "sales promotion", "set": 1},
    {"word": "pronoun", "meaning": "【名】代名詞", "pos": "名", "example": "Personal pronoun.", "phrase": "replace with a pronoun", "set": 1},
    {"word": "proof", "meaning": "【名】証拠", "pos": "名", "example": "Proof of identity.", "phrase": "no proof", "set": 1},
    {"word": "properly", "meaning": "【副】適切に", "pos": "副", "example": "Behave properly.", "phrase": "do it properly", "set": 1},
    {"word": "property", "meaning": "【名】財産、不動産", "pos": "名", "example": "Private property.", "phrase": "intellectual property", "set": 1},
    {"word": "proportion", "meaning": "【名】割合、比率", "pos": "名", "example": "High proportion.", "phrase": "in proportion to", "set": 1},
    {"word": "proposal", "meaning": "【名】提案", "pos": "名", "example": "Make a proposal.", "phrase": "accept a proposal", "set": 1},
    {"word": "propose", "meaning": "【動】提案する", "pos": "動", "example": "Propose a plan.", "phrase": "propose marriage", "set": 1},
    {"word": "prosperity", "meaning": "【名】繁栄", "pos": "名", "example": "Peace and prosperity.", "phrase": "economic prosperity", "set": 1},
    {"word": "prosperous", "meaning": "【形】繁栄している", "pos": "形", "example": "Prosperous business.", "phrase": "prosperous future", "set": 1},
    {"word": "protect", "meaning": "【動】保護する", "pos": "動", "example": "Protect from harm.", "phrase": "protect against", "set": 1},
    {"word": "protection", "meaning": "【名】保護", "pos": "名", "example": "Data protection.", "phrase": "protection from", "set": 1},
    {"word": "protective", "meaning": "【形】保護する", "pos": "形", "example": "Protective clothing.", "phrase": "protective of", "set": 1},
    {"word": "protest", "meaning": "【名】抗議", "pos": "名", "example": "Protest march.", "phrase": "under protest", "set": 1},
    {"word": "proud", "meaning": "【形】誇りに思う", "pos": "形", "example": "Proud of you.", "phrase": "house-proud", "set": 1},
    {"word": "prove", "meaning": "【動】証明する", "pos": "動", "example": "Prove it.", "phrase": "prove to be", "set": 1},
    {"word": "proverb", "meaning": "【名】ことわざ", "pos": "名", "example": "Old proverb.", "phrase": "as the proverb says", "set": 1},
    {"word": "provided", "meaning": "【接】～という条件で", "pos": "接", "example": "Provided that.", "phrase": "provided you pay", "set": 1},
    {"word": "psychological", "meaning": "【形】精神的な、心理的な", "pos": "形", "example": "Psychological effect.", "phrase": "psychological warfare", "set": 1},
    {"word": "pub", "meaning": "【名】パブ、居酒屋", "pos": "名", "example": "Go to the pub.", "phrase": "local pub", "set": 1},
    {"word": "public", "meaning": "【形】公の", "pos": "形", "example": "Public library.", "phrase": "public transport", "set": 1}
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
