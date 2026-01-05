
import json
import re
import os

# B2 Batch 14 (Words 1951-2100 approx)
# CSV Lines 1951 to 2100
new_words = [
    {"word": "provision", "meaning": "【名】供給、規定", "pos": "名", "example": "Provision of services.", "phrase": "make provision for", "set": 1},
    {"word": "proximity", "meaning": "【名】近接", "pos": "名", "example": "Close proximity.", "phrase": "in proximity to", "set": 1},
    {"word": "psychologically", "meaning": "【副】心理的に", "pos": "副", "example": "Psychologically damaged.", "phrase": "psychologically sound", "set": 1},
    {"word": "psychology", "meaning": "【名】心理学", "pos": "名", "example": "Child psychology.", "phrase": "criminal psychology", "set": 1},
    {"word": "publication", "meaning": "【名】出版", "pos": "名", "example": "Date of publication.", "phrase": "publication house", "set": 1},
    {"word": "publicise", "meaning": "【動】公表する（英）", "pos": "動", "example": "Publicise the event.", "phrase": "widely publicised", "set": 1},
    {"word": "publicity", "meaning": "【名】宣伝", "pos": "名", "example": "Gained bad publicity.", "phrase": "publicity stunt", "set": 1},
    {"word": "publicize", "meaning": "【動】公表する", "pos": "動", "example": "Publicize the book.", "phrase": "publicize widely", "set": 1},
    {"word": "pudding", "meaning": "【名】プディング", "pos": "名", "example": "Rice pudding.", "phrase": "Christmas pudding", "set": 1},
    {"word": "pulse", "meaning": "【名】脈拍", "pos": "名", "example": "Check the pulse.", "phrase": "pulse rate", "set": 1},
    {"word": "pumpkin", "meaning": "【名】カボチャ", "pos": "名", "example": "Pumpkin pie.", "phrase": "carve a pumpkin", "set": 1},
    {"word": "punch", "meaning": "【名】パンチ", "pos": "名", "example": "Throw a punch.", "phrase": "fruit punch", "set": 1},
    {"word": "punch", "meaning": "【動】殴る", "pos": "動", "example": "Punch in the face.", "phrase": "punch a hole", "set": 1},
    {"word": "punctual", "meaning": "【形】時間を守る", "pos": "形", "example": "Please be punctual.", "phrase": "punctual arrival", "set": 1},
    {"word": "punctuality", "meaning": "【名】時間厳守", "pos": "名", "example": "Values punctuality.", "phrase": "strict punctuality", "set": 1},
    {"word": "purchase", "meaning": "【名】購入", "pos": "名", "example": "Proof of purchase.", "phrase": "make a purchase", "set": 1},
    {"word": "purchase", "meaning": "【動】購入する", "pos": "動", "example": "Purchase online.", "phrase": "purchase order", "set": 1},
    {"word": "purposeful", "meaning": "【形】目的のある", "pos": "形", "example": "Purposeful stride.", "phrase": "purposeful life", "set": 1},
    {"word": "pursuit", "meaning": "【名】追跡、追求", "pos": "名", "example": "Hot pursuit.", "phrase": "pursuit of happiness", "set": 1},
    {"word": "puzzled", "meaning": "【形】困惑した", "pos": "形", "example": "Puzzled look.", "phrase": "puzzled by", "set": 1},
    {"word": "pyjamas", "meaning": "【名】パジャマ（英）", "pos": "名", "example": "Put on pyjamas.", "phrase": "striped pyjamas", "set": 1},
    {"word": "qualification", "meaning": "【名】資格", "pos": "名", "example": "Academic qualification.", "phrase": "qualification for", "set": 1},
    {"word": "quantify", "meaning": "【動】定量化する", "pos": "動", "example": "Hard to quantify.", "phrase": "quantify the damage", "set": 1},
    {"word": "quarantine", "meaning": "【名】隔離", "pos": "名", "example": "In quarantine.", "phrase": "quarantine period", "set": 1},
    {"word": "quarrel", "meaning": "【名】口論", "pos": "名", "example": "Pick a quarrel.", "phrase": "lovers' quarrel", "set": 1},
    {"word": "quarrel", "meaning": "【動】口論する", "pos": "動", "example": "Quarrel about money.", "phrase": "quarrel with", "set": 1},
    {"word": "quarrelsome", "meaning": "【形】喧嘩好きな", "pos": "形", "example": "Quarrelsome neighbor.", "phrase": "quarrelsome nature", "set": 1},
    {"word": "queer", "meaning": "【形】奇妙な", "pos": "形", "example": "Queer feeling.", "phrase": "queer fish", "set": 1},
    {"word": "query", "meaning": "【名】質問", "pos": "名", "example": "Submit a query.", "phrase": "answer a query", "set": 1},
    {"word": "question", "meaning": "【動】尋ねる、疑う", "pos": "動", "example": "Question a suspect.", "phrase": "question authority", "set": 1},
    {"word": "queue", "meaning": "【動】列を作る（英）", "pos": "動", "example": "Queue for tickets.", "phrase": "jump the queue", "set": 1},
    {"word": "quiet", "meaning": "【名】静寂", "pos": "名", "example": "Peace and quiet.", "phrase": "keep quiet", "set": 1},
    {"word": "quit", "meaning": "【形】解放された", "pos": "形", "example": "Notice to quit.", "phrase": "quit claim", "set": 1},
    {"word": "quotable", "meaning": "【形】引用に適した", "pos": "形", "example": "Quotable quote.", "phrase": "highly quotable", "set": 1},
    {"word": "quotation", "meaning": "【名】引用", "pos": "名", "example": "Famous quotation.", "phrase": "quotation marks", "set": 1},
    {"word": "quote", "meaning": "【名】引用", "pos": "名", "example": "Quote from a book.", "phrase": "price quote", "set": 1},
    {"word": "quote", "meaning": "【動】引用する", "pos": "動", "example": "Quote Shakespeare.", "phrase": "quote a price", "set": 1},
    {"word": "racism", "meaning": "【名】人種差別", "pos": "名", "example": "Fight racism.", "phrase": "institutional racism", "set": 1},
    {"word": "racist", "meaning": "【名】人種差別主義者", "pos": "名", "example": "He is a racist.", "phrase": "racist remark", "set": 1},
    {"word": "rack", "meaning": "【名】棚", "pos": "名", "example": "Luggage rack.", "phrase": "rack of lamb", "set": 1},
    {"word": "radar", "meaning": "【名】レーダー", "pos": "名", "example": "Radar screen.", "phrase": "under the radar", "set": 1},
    {"word": "radiate", "meaning": "【動】放射する", "pos": "動", "example": "Radiate heat.", "phrase": "radiate happiness", "set": 1},
    {"word": "radical", "meaning": "【名】急進論者", "pos": "名", "example": "Political radical.", "phrase": "radical change", "set": 1},
    {"word": "radically", "meaning": "【副】根本的に", "pos": "副", "example": "Radically different.", "phrase": "change radically", "set": 1},
    {"word": "radium", "meaning": "【名】ラジウム", "pos": "名", "example": "Radioactive radium.", "phrase": "discovered radium", "set": 1},
    {"word": "rafter", "meaning": "【名】垂木", "pos": "名", "example": "Exposed rafters.", "phrase": "hang from rafters", "set": 1},
    {"word": "rag", "meaning": "【名】ぼろ布", "pos": "名", "example": "Clean with a rag.", "phrase": "glad rags", "set": 1},
    {"word": "rainbow", "meaning": "【名】虹", "pos": "名", "example": "Colors of the rainbow.", "phrase": "chase a rainbow", "set": 1},
    {"word": "rainstorm", "meaning": "【名】暴風雨", "pos": "名", "example": "Heavy rainstorm.", "phrase": "caught in a rainstorm", "set": 1},
    {"word": "rally", "meaning": "【名】集会、ラリー", "pos": "名", "example": "Political rally.", "phrase": "car rally", "set": 1},
    {"word": "ram", "meaning": "【名】雄羊", "pos": "名", "example": "Ram's horn.", "phrase": "battering ram", "set": 1},
    {"word": "ramp", "meaning": "【名】スロープ", "pos": "名", "example": "Wheelchair ramp.", "phrase": "highway ramp", "set": 1},
    {"word": "range", "meaning": "【動】及ぶ", "pos": "動", "example": "Range from A to B.", "phrase": "wide range", "set": 1},
    {"word": "ranger", "meaning": "【名】レンジャー", "pos": "名", "example": "Park ranger.", "phrase": "forest ranger", "set": 1},
    {"word": "rape", "meaning": "【名】強姦", "pos": "名", "example": "Crime of rape.", "phrase": "date rape", "set": 1},
    {"word": "rape", "meaning": "【動】強姦する", "pos": "動", "example": "He was raped.", "phrase": "rape victim", "set": 1},
    {"word": "rash", "meaning": "【形】軽率な", "pos": "形", "example": "Rash decision.", "phrase": "don't be rash", "set": 1},
    {"word": "rate", "meaning": "【動】評価する", "pos": "動", "example": "Rate highly.", "phrase": "rate of exchange", "set": 1},
    {"word": "rattle", "meaning": "【名】ガラガラ音", "pos": "名", "example": "Baby rattle.", "phrase": "death rattle", "set": 1},
    {"word": "ravage", "meaning": "【名】破壊", "pos": "名", "example": "Ravages of time.", "phrase": "war ravages", "set": 1},
    {"word": "reaction", "meaning": "【名】反応", "pos": "名", "example": "Chemical reaction.", "phrase": "chain reaction", "set": 1},
    {"word": "readily", "meaning": "【副】容易に", "pos": "副", "example": "Readily available.", "phrase": "agree readily", "set": 1},
    {"word": "real estate", "meaning": "【名】不動産", "pos": "名", "example": "Real estate agent.", "phrase": "invest in real estate", "set": 1},
    {"word": "realisation", "meaning": "【名】実感、実現（英）", "pos": "名", "example": "Sudden realisation.", "phrase": "realisation of a dream", "set": 1},
    {"word": "realization", "meaning": "【名】実感、実現", "pos": "名", "example": "Dawn of realization.", "phrase": "full realization", "set": 1},
    {"word": "rear", "meaning": "【形】後部の", "pos": "形", "example": "Rear entrance.", "phrase": "rear view mirror", "set": 1},
    {"word": "reasonably", "meaning": "【副】かなり、合理的に", "pos": "副", "example": "Reasonably priced.", "phrase": "act reasonably", "set": 1},
    {"word": "rebel", "meaning": "【名】反逆者", "pos": "名", "example": "Teenage rebel.", "phrase": "rebel forces", "set": 1},
    {"word": "rebel", "meaning": "【動】反逆する", "pos": "動", "example": "Rebel against.", "phrase": "rebel army", "set": 1},
    {"word": "rebellious", "meaning": "【形】反抗的な", "pos": "形", "example": "Rebellious nature.", "phrase": "rebellious teenager", "set": 1},
    {"word": "recession", "meaning": "【名】不況", "pos": "名", "example": "Economic recession.", "phrase": "deep recession", "set": 1},
    {"word": "recipe", "meaning": "【名】レシピ", "pos": "名", "example": "Cake recipe.", "phrase": "recipe for disaster", "set": 1},
    {"word": "reckon", "meaning": "【動】思う、計算する", "pos": "動", "example": "I reckon so.", "phrase": "dead reckoning", "set": 1},
    {"word": "recognition", "meaning": "【名】認識、承認", "pos": "名", "example": "Face recognition.", "phrase": "gain recognition", "set": 1},
    {"word": "recollect", "meaning": "【動】思い出す", "pos": "動", "example": "Recollect childhood.", "phrase": "as far as I recollect", "set": 1},
    {"word": "recollection", "meaning": "【名】記憶", "pos": "名", "example": "Vague recollection.", "phrase": "have no recollection", "set": 1},
    {"word": "recommendable", "meaning": "【形】推奨できる", "pos": "形", "example": "Highly recommendable.", "phrase": "is it recommendable", "set": 1},
    {"word": "recommendation", "meaning": "【名】推薦", "pos": "名", "example": "Letter of recommendation.", "phrase": "on my recommendation", "set": 1},
    {"word": "reconsider", "meaning": "【動】再考する", "pos": "動", "example": "Reconsider a decision.", "phrase": "please reconsider", "set": 1},
    {"word": "recreation", "meaning": "【名】レクリエーション", "pos": "名", "example": "Recreation center.", "phrase": "for recreation", "set": 1},
    {"word": "recruit", "meaning": "【動】採用する", "pos": "動", "example": "Recruit new staff.", "phrase": "raw recruit", "set": 1},
    {"word": "rectangular", "meaning": "【形】長方形の", "pos": "形", "example": "Rectangular table.", "phrase": "rectangular shape", "set": 1},
    {"word": "redo", "meaning": "【動】やり直す", "pos": "動", "example": "Redo the work.", "phrase": "undo and redo", "set": 1},
    {"word": "redundant", "meaning": "【形】余分な", "pos": "形", "example": "Make redundant.", "phrase": "redundant information", "set": 1},
    {"word": "reed", "meaning": "【名】葦", "pos": "名", "example": "Reed bed.", "phrase": "broken reed", "set": 1},
    {"word": "reference", "meaning": "【名】言及、参照", "pos": "名", "example": "Make reference to.", "phrase": "reference book", "set": 1},
    {"word": "referent", "meaning": "【形】指示対象の (noun mostly)", "pos": "形", "example": "Referent object.", "phrase": "social referent", "set": 1},
    {"word": "refinery", "meaning": "【名】精製所", "pos": "名", "example": "Oil refinery.", "phrase": "sugar refinery", "set": 1},
    {"word": "reflective", "meaning": "【形】反射する", "pos": "形", "example": "Reflective surface.", "phrase": "reflective vest", "set": 1},
    {"word": "reform", "meaning": "【名】改革", "pos": "名", "example": "Political reform.", "phrase": "prison reform", "set": 1},
    {"word": "refrain", "meaning": "【名】リフレイン", "pos": "名", "example": "Catchy refrain.", "phrase": "refrain from", "set": 1},
    {"word": "refresh", "meaning": "【名】リフレッシュ (verb mostly)", "pos": "名", "example": "Refresh page.", "phrase": "refresh memory", "set": 1},
    {"word": "refuge", "meaning": "【名】避難所", "pos": "名", "example": "Take refuge.", "phrase": "wildlife refuge", "set": 1},
    {"word": "refugee", "meaning": "【名】難民", "pos": "名", "example": "War refugee.", "phrase": "refugee camp", "set": 1},
    {"word": "refute", "meaning": "【動】反論する", "pos": "動", "example": "Refute an argument.", "phrase": "refute a claim", "set": 1},
    {"word": "regard", "meaning": "【名】配慮、尊敬", "pos": "名", "example": "High regard.", "phrase": "with regard to", "set": 1},
    {"word": "regardless", "meaning": "【副】関係なく", "pos": "副", "example": "Carry on regardless.", "phrase": "regardless of", "set": 1},
    {"word": "reggae", "meaning": "【名】レゲエ", "pos": "名", "example": "Reggae music.", "phrase": "listen to reggae", "set": 1},
    {"word": "regime", "meaning": "【名】政権", "pos": "名", "example": "Military regime.", "phrase": "change of regime", "set": 1},
    {"word": "regret", "meaning": "【名】後悔", "pos": "名", "example": "Deep regret.", "phrase": "regret to say", "set": 1},
    {"word": "regrettably", "meaning": "【副】残念ながら", "pos": "副", "example": "Regrettably, I can't.", "phrase": "most regrettably", "set": 1},
    {"word": "regulate", "meaning": "【動】規制する", "pos": "動", "example": "Regulate traffic.", "phrase": "regulate temperature", "set": 1},
    {"word": "rehearsal", "meaning": "【名】リハーサル", "pos": "名", "example": "Dress rehearsal.", "phrase": "wedding rehearsal", "set": 1},
    {"word": "reinforce", "meaning": "【動】補強する", "pos": "動", "example": "Reinforce the wall.", "phrase": "reinforce belief", "set": 1},
    {"word": "reinforcement", "meaning": "【名】補強、増援", "pos": "名", "example": "Send reinforcements.", "phrase": "negative reinforcement", "set": 1},
    {"word": "rejection", "meaning": "【名】拒絶", "pos": "名", "example": "Fear of rejection.", "phrase": "rejection letter", "set": 1},
    {"word": "rejoin", "meaning": "【動】再加入する", "pos": "動", "example": "Rejoin the team.", "phrase": "rejoin the battle", "set": 1},
    {"word": "related", "meaning": "【形】関連した", "pos": "形", "example": "Related topics.", "phrase": "are you related", "set": 1},
    {"word": "relativity", "meaning": "【名】相対性", "pos": "名", "example": "Theory of relativity.", "phrase": "moral relativity", "set": 1},
    {"word": "relaxation", "meaning": "【名】くつろぎ", "pos": "名", "example": "Time for relaxation.", "phrase": "relaxation technique", "set": 1},
    {"word": "relay", "meaning": "【名】リレー、中継", "pos": "名", "example": "Relay race.", "phrase": "relay station", "set": 1},
    {"word": "relevant", "meaning": "【形】関連のある", "pos": "形", "example": "Relevant information.", "phrase": "relevant to", "set": 1},
    {"word": "relic", "meaning": "【名】遺物", "pos": "名", "example": "Ancient relic.", "phrase": "holy relic", "set": 1},
    {"word": "relief", "meaning": "【名】安らぎ、救援", "pos": "名", "example": "Sigh of relief.", "phrase": "disaster relief", "set": 1},
    {"word": "relieve", "meaning": "【動】和らげる", "pos": "動", "example": "Relieve pain.", "phrase": "relieved to hear", "set": 1},
    {"word": "relieved", "meaning": "【形】ほっとした", "pos": "形", "example": "Relieved smile.", "phrase": "feel relieved", "set": 1},
    {"word": "reluctant", "meaning": "【形】気が進まない", "pos": "形", "example": "Reluctant learner.", "phrase": "reluctant to go", "set": 1},
    {"word": "remaining", "meaning": "【形】残っている", "pos": "形", "example": "Remaining time.", "phrase": "remaining balance", "set": 1},
    {"word": "remains", "meaning": "【名】残り", "pos": "名", "example": "Human remains.", "phrase": "remains to be seen", "set": 1},
    {"word": "remark", "meaning": "【名】発言", "pos": "名", "example": "Rude remark.", "phrase": "make a remark", "set": 1},
    {"word": "remarkably", "meaning": "【副】著しく", "pos": "副", "example": "Remarkably similar.", "phrase": "remarkably well", "set": 1},
    {"word": "reminder", "meaning": "【名】思い出させるもの", "pos": "名", "example": "Friendly reminder.", "phrase": "reminder of", "set": 1},
    {"word": "rental", "meaning": "【名】賃貸", "pos": "名", "example": "Car rental.", "phrase": "rental property", "set": 1},
    {"word": "reorganise", "meaning": "【動】再編成する（英）", "pos": "動", "example": "Reorganise the files.", "phrase": "reorganise the company", "set": 1},
    {"word": "reorganize", "meaning": "【動】再編成する", "pos": "動", "example": "Reorganize the closet.", "phrase": "reorganize structure", "set": 1},
    {"word": "repaint", "meaning": "【名】塗り直し (verb mostly)", "pos": "名", "example": "Needs a repaint.", "phrase": "repaint the room", "set": 1},
    {"word": "repertoire", "meaning": "【名】レパートリー", "pos": "名", "example": "Wide repertoire.", "phrase": "add to repertoire", "set": 1},
    {"word": "repetition", "meaning": "【名】繰り返し", "pos": "名", "example": "Avoid repetition.", "phrase": "repetition of", "set": 1},
    {"word": "replacement", "meaning": "【名】交換", "pos": "名", "example": "Replacement part.", "phrase": "hip replacement", "set": 1},
    {"word": "replica", "meaning": "【名】レプリカ", "pos": "名", "example": "Replica gun.", "phrase": "exact replica", "set": 1},
    {"word": "repress", "meaning": "【動】抑圧する", "pos": "動", "example": "Repress feelings.", "phrase": "repress a memory", "set": 1},
    {"word": "repression", "meaning": "【名】抑圧", "pos": "名", "example": "Political repression.", "phrase": "repression of anger", "set": 1},
    {"word": "reprint", "meaning": "【名】増刷", "pos": "名", "example": "In reprint.", "phrase": "reprint article", "set": 1},
    {"word": "reprove", "meaning": "【動】叱責する", "pos": "動", "example": "Reprove gently.", "phrase": "reprove for", "set": 1},
    {"word": "research", "meaning": "【動】研究する", "pos": "動", "example": "Research a topic.", "phrase": "market research", "set": 1},
    {"word": "residence", "meaning": "【名】住居", "pos": "名", "example": "Official residence.", "phrase": "take up residence", "set": 1},
    {"word": "resident", "meaning": "【名】居住者", "pos": "名", "example": "Local resident.", "phrase": "resident alien", "set": 1},
    {"word": "resign", "meaning": "【動】辞職する", "pos": "動", "example": "Resign from office.", "phrase": "resign oneself to", "set": 1},
    {"word": "resignation", "meaning": "【名】辞職、諦め", "pos": "名", "example": "Hand in resignation.", "phrase": "sigh of resignation", "set": 1},
    {"word": "resistance", "meaning": "【名】抵抗", "pos": "名", "example": "Resistance to change.", "phrase": "path of least resistance", "set": 1},
    {"word": "resolution", "meaning": "【名】解決、決意", "pos": "名", "example": "New Year's resolution.", "phrase": "high resolution", "set": 1},
    {"word": "resonant", "meaning": "【形】響き渡る", "pos": "形", "example": "Resonant voice.", "phrase": "emotionally resonant", "set": 1},
    {"word": "respectably", "meaning": "【副】立派に", "pos": "副", "example": "Dressed respectably.", "phrase": "behave respectably", "set": 1},
    {"word": "respected", "meaning": "【形】尊敬される", "pos": "形", "example": "Respected leader.", "phrase": "highly respected", "set": 1},
    {"word": "respiration", "meaning": "【名】呼吸", "pos": "名", "example": "Artificial respiration.", "phrase": "respiration rate", "set": 1},
    {"word": "respiratory", "meaning": "【形】呼吸の", "pos": "形", "example": "Respiratory system.", "phrase": "respiratory disease", "set": 1},
    {"word": "restriction", "meaning": "【名】制限", "pos": "名", "example": "Travel restriction.", "phrase": "lift restriction", "set": 1},
    {"word": "resume", "meaning": "【動】再開する", "pos": "動", "example": "Resume work.", "phrase": "resume seat", "set": 1},
    {"word": "retailer", "meaning": "【名】小売業者", "pos": "名", "example": "Online retailer.", "phrase": "major retailer", "set": 1},
    {"word": "retard", "meaning": "【動】遅らせる", "pos": "動", "example": "Retard growth.", "phrase": "fire retardant", "set": 1},
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
