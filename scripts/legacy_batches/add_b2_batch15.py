
import json
import re
import os

# B2 Batch 15 (Words 2101-2250 approx)
# CSV Lines 2101 to 2250
new_words = [
    {"word": "retina", "meaning": "【名】網膜", "pos": "名", "example": "Detached retina.", "phrase": "retina scan", "set": 1},
    {"word": "retirement", "meaning": "【名】退職", "pos": "名", "example": "Early retirement.", "phrase": "retirement plan", "set": 1},
    {"word": "retreat", "meaning": "【名】後退、隠居所", "pos": "名", "example": "Be in retreat.", "phrase": "spiritual retreat", "set": 1},
    {"word": "retreat", "meaning": "【動】後退する", "pos": "動", "example": "Retreat from battle.", "phrase": "hastily retreat", "set": 1},
    {"word": "retrieve", "meaning": "【動】回収する", "pos": "動", "example": "Retrieve data.", "phrase": "retrieve information", "set": 1},
    {"word": "revelation", "meaning": "【名】暴露、啓示", "pos": "名", "example": "Shocking revelation.", "phrase": "divine revelation", "set": 1},
    {"word": "revenge", "meaning": "【名】復讐", "pos": "名", "example": "Seek revenge.", "phrase": "take revenge", "set": 1},
    {"word": "revenue", "meaning": "【名】歳入、収益", "pos": "名", "example": "Tax revenue.", "phrase": "generate revenue", "set": 1},
    {"word": "reverence", "meaning": "【名】崇拝", "pos": "名", "example": "Deep reverence.", "phrase": "hold in reverence", "set": 1},
    {"word": "reverse", "meaning": "【動】逆にする", "pos": "動", "example": "Reverse the car.", "phrase": "reverse roles", "set": 1},
    {"word": "review", "meaning": "【動】再検討する、批評する", "pos": "動", "example": "Review the plan.", "phrase": "review a book", "set": 1},
    {"word": "revival", "meaning": "【名】復活", "pos": "名", "example": "Economic revival.", "phrase": "revival meeting", "set": 1},
    {"word": "revive", "meaning": "【動】生き返らせる", "pos": "動", "example": "Revive a patient.", "phrase": "revive economy", "set": 1},
    {"word": "revolution", "meaning": "【名】革命", "pos": "名", "example": "French Revolution.", "phrase": "industrial revolution", "set": 1},
    {"word": "revolutionary", "meaning": "【形】革命的な", "pos": "形", "example": "Revolutionary idea.", "phrase": "revolutionary war", "set": 1},
    {"word": "revolutionise", "meaning": "【動】革命を起こす（英）", "pos": "動", "example": "Revolutionise industry.", "phrase": "completely revolutionise", "set": 1},
    {"word": "revolutionize", "meaning": "【動】革命を起こす", "pos": "動", "example": "Revolutionize medicine.", "phrase": "revolutionize the way", "set": 1},
    {"word": "revolve", "meaning": "【動】回転する", "pos": "動", "example": "Revolve around.", "phrase": "revolve around the sun", "set": 1},
    {"word": "reward", "meaning": "【動】報いる", "pos": "動", "example": "Reward hard work.", "phrase": "be rewarded", "set": 1},
    {"word": "rhinoceros", "meaning": "【名】サイ", "pos": "名", "example": "Wild rhinoceros.", "phrase": "rhinoceros horn", "set": 1},
    {"word": "rhyme", "meaning": "【動】韻を踏む", "pos": "動", "example": "Words that rhyme.", "phrase": "rhyme with", "set": 1},
    {"word": "rhythmic", "meaning": "【形】リズミカルな", "pos": "形", "example": "Rhythmic beat.", "phrase": "rhythmic gymnastics", "set": 1},
    {"word": "rib", "meaning": "【名】肋骨", "pos": "名", "example": "Broken rib.", "phrase": "rib cage", "set": 1},
    {"word": "riddle", "meaning": "【名】なぞなぞ", "pos": "名", "example": "Solve a riddle.", "phrase": "speak in riddles", "set": 1},
    {"word": "rider", "meaning": "【名】乗り手", "pos": "名", "example": "Horse rider.", "phrase": "easy rider", "set": 1},
    {"word": "ridge", "meaning": "【名】尾根", "pos": "名", "example": "Mountain ridge.", "phrase": "along the ridge", "set": 1},
    {"word": "righteousness", "meaning": "【名】正義", "pos": "名", "example": "Paths of righteousness.", "phrase": "moral righteousness", "set": 1},
    {"word": "rightly", "meaning": "【副】当然ながら", "pos": "副", "example": "Rightly decided.", "phrase": "rightly or wrongly", "set": 1},
    {"word": "rim", "meaning": "【名】縁", "pos": "名", "example": "Rim of the glass.", "phrase": "basketball rim", "set": 1},
    {"word": "rip", "meaning": "【動】引き裂く", "pos": "動", "example": "Rip the paper.", "phrase": "rip open", "set": 1},
    {"word": "risk", "meaning": "【動】危険にさらす", "pos": "動", "example": "Risk one's life.", "phrase": "risk it all", "set": 1},
    {"word": "risky", "meaning": "【形】危険な", "pos": "形", "example": "Risky business.", "phrase": "risky investment", "set": 1},
    {"word": "rite", "meaning": "【名】儀式", "pos": "名", "example": "Religious rite.", "phrase": "rite of passage", "set": 1},
    {"word": "ritual", "meaning": "【名】儀式", "pos": "名", "example": "Morning ritual.", "phrase": "ritual sacrifice", "set": 1},
    {"word": "rival", "meaning": "【名】ライバル", "pos": "名", "example": "Arch rival.", "phrase": "beat a rival", "set": 1},
    {"word": "roam", "meaning": "【名】放浪 (verb mostly)", "pos": "名", "example": "On the roam.", "phrase": "free to roam", "set": 1},
    {"word": "roar", "meaning": "【動】ほえる", "pos": "動", "example": "Lion roared.", "phrase": "roar with laughter", "set": 1},
    {"word": "roast", "meaning": "【形】焼かれた", "pos": "形", "example": "Roast chicken.", "phrase": "roast beef", "set": 1},
    {"word": "rock", "meaning": "【動】揺らす", "pos": "動", "example": "Rock the boat.", "phrase": "rock gently", "set": 1},
    {"word": "rocket", "meaning": "【名】ロケット", "pos": "名", "example": "Launch a rocket.", "phrase": "rocket science", "set": 1},
    {"word": "rocky", "meaning": "【形】岩の多い、不安定な", "pos": "形", "example": "Rocky road.", "phrase": "rocky relationship", "set": 1},
    {"word": "roll", "meaning": "【動】転がる", "pos": "動", "example": "Ball rolled away.", "phrase": "roll over", "set": 1},
    {"word": "roommate", "meaning": "【名】ルームメイト", "pos": "名", "example": "New roommate.", "phrase": "find a roommate", "set": 1},
    {"word": "rosy", "meaning": "【形】バラ色の", "pos": "形", "example": "Rosy cheeks.", "phrase": "rosy future", "set": 1},
    {"word": "round", "meaning": "【前】～の周りに", "pos": "前", "example": "Round the corner.", "phrase": "all round", "set": 1},
    {"word": "round", "meaning": "【動】丸くする、回る", "pos": "動", "example": "Round the bend.", "phrase": "round up", "set": 1},
    {"word": "route", "meaning": "【名】経路", "pos": "名", "example": "Bus route.", "phrase": "plan a route", "set": 1},
    {"word": "row", "meaning": "【動】漕ぐ", "pos": "動", "example": "Row a boat.", "phrase": "row hard", "set": 1},
    {"word": "royalty", "meaning": "【名】王族、印税", "pos": "名", "example": "British royalty.", "phrase": "pay royalty", "set": 1},
    {"word": "rub", "meaning": "【動】こする", "pos": "動", "example": "Rub eyes.", "phrase": "rub it in", "set": 1},
    {"word": "rubble", "meaning": "【名】がれき", "pos": "名", "example": "Buried in rubble.", "phrase": "clear the rubble", "set": 1},
    {"word": "rug", "meaning": "【名】敷物", "pos": "名", "example": "Persian rug.", "phrase": "sweep under the rug", "set": 1},
    {"word": "ruinous", "meaning": "【形】破滅的な", "pos": "形", "example": "Ruinous cost.", "phrase": "ruinous war", "set": 1},
    {"word": "rule", "meaning": "【動】支配する", "pos": "動", "example": "Rule the country.", "phrase": "rule out", "set": 1},
    {"word": "rural", "meaning": "【形】田舎の", "pos": "形", "example": "Rural area.", "phrase": "rural life", "set": 1},
    {"word": "rush hour", "meaning": "【名】ラッシュアワー", "pos": "名", "example": "During rush hour.", "phrase": "rush hour traffic", "set": 1},
    {"word": "rusty", "meaning": "【形】錆びた", "pos": "形", "example": "Rusty nail.", "phrase": "get rusty", "set": 1},
    {"word": "sack", "meaning": "【動】解雇する、略奪する", "pos": "動", "example": "Get sacked.", "phrase": "sack the city", "set": 1},
    {"word": "safeguard", "meaning": "【動】保護する", "pos": "動", "example": "Safeguard rights.", "phrase": "safeguard against", "set": 1},
    {"word": "sag", "meaning": "【名】たるみ (verb mostly)", "pos": "名", "example": "Start to sag.", "phrase": "sag under weight", "set": 1},
    {"word": "sage", "meaning": "【名】賢人", "pos": "名", "example": "Wise sage.", "phrase": "sage advice", "set": 1},
    {"word": "sail", "meaning": "【動】航海する", "pos": "動", "example": "Sail the seas.", "phrase": "set sail", "set": 1},
    {"word": "salary", "meaning": "【名】給料", "pos": "名", "example": "Monthly salary.", "phrase": "high salary", "set": 1},
    {"word": "salesmanship", "meaning": "【名】販売術", "pos": "名", "example": "Good salesmanship.", "phrase": "art of salesmanship", "set": 1},
    {"word": "salesperson", "meaning": "【名】販売員", "pos": "名", "example": "Car salesperson.", "phrase": "door-to-door salesperson", "set": 1},
    {"word": "saleswoman", "meaning": "【名】女性販売員", "pos": "名", "example": "Shop saleswoman.", "phrase": "experienced saleswoman", "set": 1},
    {"word": "salon", "meaning": "【名】サロン", "pos": "名", "example": "Beauty salon.", "phrase": "hair salon", "set": 1},
    {"word": "salsa", "meaning": "【名】サルサ", "pos": "名", "example": "Salsa dancing.", "phrase": "salsa sauce", "set": 1},
    {"word": "salty", "meaning": "【形】塩辛い", "pos": "形", "example": "Salty taste.", "phrase": "salty water", "set": 1},
    {"word": "sandstone", "meaning": "【名】砂岩", "pos": "名", "example": "Red sandstone.", "phrase": "sandstone cliff", "set": 1},
    {"word": "sanitary", "meaning": "【形】衛生的な", "pos": "形", "example": "Sanitary conditions.", "phrase": "sanitary towel", "set": 1},
    {"word": "sanitation", "meaning": "【名】衛生設備", "pos": "名", "example": "Poor sanitation.", "phrase": "improve sanitation", "set": 1},
    {"word": "satisfactory", "meaning": "【形】満足のいく", "pos": "形", "example": "Satisfactory result.", "phrase": "highly satisfactory", "set": 1},
    {"word": "saving", "meaning": "【名】節約、救助", "pos": "名", "example": "Life saving.", "phrase": "saving grace", "set": 1},
    {"word": "savings", "meaning": "【名】貯蓄", "pos": "名", "example": "Life savings.", "phrase": "savings account", "set": 1},
    {"word": "saw", "meaning": "【動】のこぎりで切る", "pos": "動", "example": "Saw wood.", "phrase": "saw off", "set": 1},
    {"word": "say", "meaning": "【名】言い分", "pos": "名", "example": "Have a say.", "phrase": "final say", "set": 1},
    {"word": "scan", "meaning": "【動】走査する、ざっと見る", "pos": "動", "example": "Scan the document.", "phrase": "scan for viruses", "set": 1},
    {"word": "scandal", "meaning": "【名】スキャンダル", "pos": "名", "example": "Political scandal.", "phrase": "cause a scandal", "set": 1},
    {"word": "scar", "meaning": "【名】傷跡", "pos": "名", "example": "Deep scar.", "phrase": "emotional scar", "set": 1},
    {"word": "scarcely", "meaning": "【副】ほとんど～ない", "pos": "副", "example": "Scarcely believe.", "phrase": "scarcely enough", "set": 1},
    {"word": "scarlet", "meaning": "【名】深紅色", "pos": "名", "example": "Scarlet fever.", "phrase": "scarlet letter", "set": 1},
    {"word": "scent", "meaning": "【名】香り", "pos": "名", "example": "Sweet scent.", "phrase": "scent of roses", "set": 1},
    {"word": "schedule", "meaning": "【動】予定する", "pos": "動", "example": "Schedule a meeting.", "phrase": "scheduled for", "set": 1},
    {"word": "scheduled", "meaning": "【形】予定された", "pos": "形", "example": "Scheduled flight.", "phrase": "as scheduled", "set": 1},
    {"word": "scheme", "meaning": "【名】計画、陰謀", "pos": "名", "example": "Pyramid scheme.", "phrase": "scheme of things", "set": 1},
    {"word": "scholasticism", "meaning": "【名】スコラ学、学究的傾向", "pos": "名", "example": "Medieval scholasticism.", "phrase": "period of scholasticism", "set": 1},
    {"word": "schoolgirl", "meaning": "【名】女子生徒", "pos": "名", "example": "Uniformed schoolgirl.", "phrase": "schoolgirl crush", "set": 1},
    {"word": "scientifically", "meaning": "【副】科学的に", "pos": "副", "example": "Scientifically proven.", "phrase": "scientifically sound", "set": 1},
    {"word": "scooter", "meaning": "【名】スクーター", "pos": "名", "example": "Ride a scooter.", "phrase": "motor scooter", "set": 1},
    {"word": "scramble", "meaning": "【動】よじ登る、奪い合う", "pos": "動", "example": "Scramble eggs.", "phrase": "scramble up", "set": 1},
    {"word": "scratch", "meaning": "【動】引っ掻く", "pos": "動", "example": "Scratch an itch.", "phrase": "start from scratch", "set": 1},
    {"word": "screen", "meaning": "【動】上映する、審査する", "pos": "動", "example": "Screen a movie.", "phrase": "screen candidates", "set": 1},
    {"word": "screw", "meaning": "【動】ねじ込む", "pos": "動", "example": "Screw in.", "phrase": "screw up", "set": 1},
    {"word": "scribble", "meaning": "【名】走り書き", "pos": "名", "example": "Illegible scribble.", "phrase": "just a scribble", "set": 1},
    {"word": "scrooge", "meaning": "【名】守銭奴", "pos": "名", "example": "Don't be a scrooge.", "phrase": "old scrooge", "set": 1},
    {"word": "scuba", "meaning": "【名】スキューバ", "pos": "名", "example": "Scuba diving.", "phrase": "scuba gear", "set": 1},
    {"word": "scythe", "meaning": "【名】大鎌", "pos": "名", "example": "Grim Reaper's scythe.", "phrase": "cut with scythe", "set": 1},
    {"word": "seal", "meaning": "【名】アザラシ、印鑑", "pos": "名", "example": "Baby seal.", "phrase": "seal of approval", "set": 1},
    {"word": "seasonal", "meaning": "【形】季節的な", "pos": "形", "example": "Seasonal work.", "phrase": "seasonal adjustment", "set": 1},
    {"word": "second person", "meaning": "【名】二人称", "pos": "名", "example": "Second person singular.", "phrase": "in the second person", "set": 1},
    {"word": "secondary", "meaning": "【形】第二の", "pos": "形", "example": "Secondary school.", "phrase": "secondary importance", "set": 1},
    {"word": "secondly", "meaning": "【副】第二に", "pos": "副", "example": "And secondly.", "phrase": "firstly and secondly", "set": 1},
    {"word": "sector", "meaning": "【名】部門", "pos": "名", "example": "Private sector.", "phrase": "public sector", "set": 1},
    {"word": "seesaw", "meaning": "【名】シーソー", "pos": "名", "example": "Play on seesaw.", "phrase": "emotional seesaw", "set": 1},
    {"word": "segment", "meaning": "【名】区分", "pos": "名", "example": "Market segment.", "phrase": "orange segment", "set": 1},
    {"word": "seldom", "meaning": "【副】めったに～ない", "pos": "副", "example": "Seldom seen.", "phrase": "very seldom", "set": 1},
    {"word": "select", "meaning": "【動】選ぶ", "pos": "動", "example": "Select an option.", "phrase": "select carefully", "set": 1},
    {"word": "self-confidence", "meaning": "【名】自信", "pos": "名", "example": "Lack of self-confidence.", "phrase": "gain self-confidence", "set": 1},
    {"word": "self-confident", "meaning": "【形】自信のある", "pos": "形", "example": "Self-confident person.", "phrase": "appear self-confident", "set": 1},
    {"word": "selfless", "meaning": "【形】無私の", "pos": "形", "example": "Selfless act.", "phrase": "selfless devotion", "set": 1},
    {"word": "seller", "meaning": "【名】売り手", "pos": "名", "example": "Best seller.", "phrase": "buyer and seller", "set": 1},
    {"word": "semicolon", "meaning": "【名】セミコロン", "pos": "名", "example": "Use a semicolon.", "phrase": "punctuation semicolon", "set": 1},
    {"word": "semi-final", "meaning": "【名】準決勝", "pos": "名", "example": "Win the semi-final.", "phrase": "semi-final match", "set": 1},
    {"word": "seminar", "meaning": "【名】ゼミ、セミナー", "pos": "名", "example": "Research seminar.", "phrase": "attend a seminar", "set": 1},
    {"word": "senator", "meaning": "【名】上院議員", "pos": "名", "example": "US Senator.", "phrase": "state senator", "set": 1},
    {"word": "sense", "meaning": "【動】感じる", "pos": "動", "example": "Sense danger.", "phrase": "sense of humor", "set": 1},
    {"word": "sensible", "meaning": "【形】分別のある", "pos": "形", "example": "Sensible decision.", "phrase": "sensible shoes", "set": 1},
    {"word": "sensitive", "meaning": "【形】敏感な", "pos": "形", "example": "Sensitive skin.", "phrase": "sensitive topic", "set": 1},
    {"word": "sentence", "meaning": "【動】刑を宣告する", "pos": "動", "example": "Sentence to death.", "phrase": "life sentence", "set": 1},
    {"word": "separate", "meaning": "【動】分ける", "pos": "動", "example": "Separate waste.", "phrase": "separate ways", "set": 1},
    {"word": "separately", "meaning": "【副】別々に", "pos": "副", "example": "Sold separately.", "phrase": "live separately", "set": 1},
    {"word": "serene", "meaning": "【形】穏やかな", "pos": "形", "example": "Serene landscape.", "phrase": "serene smile", "set": 1},
    {"word": "serial", "meaning": "【形】連続の", "pos": "形", "example": "Serial killer.", "phrase": "serial number", "set": 1},
    {"word": "servant", "meaning": "【名】召使い", "pos": "名", "example": "Civil servant.", "phrase": "public servant", "set": 1},
    {"word": "setback", "meaning": "【名】挫折", "pos": "名", "example": "Major setback.", "phrase": "temporary setback", "set": 1},
    {"word": "sexism", "meaning": "【名】性差別", "pos": "名", "example": "End sexism.", "phrase": "everyday sexism", "set": 1},
    {"word": "sexual", "meaning": "【形】性の", "pos": "形", "example": "Sexual harassment.", "phrase": "sexual orientation", "set": 1},
    {"word": "sexy", "meaning": "【形】セクシーな", "pos": "形", "example": "Sexy dress.", "phrase": "feeling sexy", "set": 1},
    {"word": "shabby", "meaning": "【形】みすぼらしい", "pos": "形", "example": "Shabby clothes.", "phrase": "shabby treatment", "set": 1},
    {"word": "shaken", "meaning": "【形】動揺した", "pos": "形", "example": "Badly shaken.", "phrase": "shaken up", "set": 1},
    {"word": "Shakespearean", "meaning": "【形】シェイクスピアの", "pos": "形", "example": "Shakespearean tragedy.", "phrase": "Shakespearean actor", "set": 1},
    {"word": "shaky", "meaning": "【形】震える、不安定な", "pos": "形", "example": "Shaky hands.", "phrase": "shaky start", "set": 1},
    {"word": "sharp", "meaning": "【副】きっかりに", "pos": "副", "example": "At 8 o'clock sharp.", "phrase": "look sharp", "set": 1},
    {"word": "sharply", "meaning": "【副】急激に、鋭く", "pos": "副", "example": "Rose sharply.", "phrase": "speak sharply", "set": 1},
    {"word": "shatter", "meaning": "【動】粉々にする", "pos": "動", "example": "Glass shattered.", "phrase": "earth-shattering", "set": 1},
    {"word": "shed", "meaning": "【名】小屋", "pos": "名", "example": "Garden shed.", "phrase": "tool shed", "set": 1},
    {"word": "shell", "meaning": "【動】砲撃する、殻をむく", "pos": "動", "example": "Shell the city.", "phrase": "shell peas", "set": 1},
    {"word": "shield", "meaning": "【名】盾", "pos": "名", "example": "Sword and shield.", "phrase": "human shield", "set": 1},
    {"word": "shift", "meaning": "【名】変化、交代", "pos": "名", "example": "Night shift.", "phrase": "paradigm shift", "set": 1},
    {"word": "shipping", "meaning": "【名】配送、海運", "pos": "名", "example": "Free shipping.", "phrase": "shipping company", "set": 1},
    {"word": "shipwreck", "meaning": "【名】難破船、難破", "pos": "名", "example": "Ancient shipwreck.", "phrase": "survive a shipwreck", "set": 1},
    {"word": "shock", "meaning": "【動】衝撃を与える", "pos": "動", "example": "Shock the world.", "phrase": "culture shock", "set": 1},
    {"word": "shooting", "meaning": "【名】射撃、撮影", "pos": "名", "example": "Shooting star.", "phrase": "film shooting", "set": 1},
    {"word": "shopkeeper", "meaning": "【名】店主", "pos": "名", "example": "Local shopkeeper.", "phrase": "ask the shopkeeper", "set": 1},
    {"word": "shoplift", "meaning": "【動】万引きする", "pos": "動", "example": "Caught shoplifting.", "phrase": "shoplift items", "set": 1},
    {"word": "shoplifter", "meaning": "【名】万引き犯", "pos": "名", "example": "Catch a shoplifter.", "phrase": "accused shoplifter", "set": 1},
    {"word": "shoplifting", "meaning": "【名】万引き", "pos": "名", "example": "Arrested for shoplifting.", "phrase": "shoplifting charge", "set": 1},
    {"word": "shortness", "meaning": "【名】不足、短さ", "pos": "名", "example": "Shortness of breath.", "phrase": "shortness of time", "set": 1},
    {"word": "short-term", "meaning": "【形】短期の", "pos": "形", "example": "Short-term memory.", "phrase": "short-term goal", "set": 1},
]

js_path = 'c:\\Users\\warut\\python_chatgpt\\data\\vocabulary.js'

with open(js_path, 'r', encoding='utf-8') as f:
    content = f.read()

match = re.search(r'exam1:\s*\[([^\]]*)\]', content, re.DOTALL)
if match:
    current_list_content = match.group(1).strip()
    
    formatted_entries = []
    for w in new_words:
        entry = f'{{ word: "{w["word"]}", meaning: "{w["meaning"]}", pos: "{w["pos"]}", example: "{w["example"]}", phrase: "{w["phrase"]}", set: 1 }}'
        formatted_entries.append(entry)
    
    new_entries_str = ",\n        ".join(formatted_entries)
    
    full_match = match.group(0)
    old_inner = match.group(1)
    
    if old_inner.strip():
        new_block = f"exam1: [{old_inner},\n        {new_entries_str}]"
    else:
        new_block = f"exam1: [\n        {new_entries_str}\n    ]"

    new_content = content.replace(full_match, new_block)

    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Success: Added {len(new_words)} words to exam1 array.")

else:
    print("Error: Could not find `exam1: []` in vocabulary.js")
