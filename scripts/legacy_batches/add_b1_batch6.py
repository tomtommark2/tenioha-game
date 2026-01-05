
import json
import re
import os

# B1 Batch 6 (Words 551-700, "decrease" to "ecology")
new_words = [
    {"word": "decrease", "meaning": "【名】減少", "pos": "名", "example": "A decrease in sales.", "phrase": "on the decrease", "set": 1},
    {"word": "decrease", "meaning": "【動】減少する", "pos": "動", "example": "The population decreased.", "phrase": "decrease by", "set": 1},
    {"word": "dedicate", "meaning": "【動】捧げる", "pos": "動", "example": "He dedicated his life to science.", "phrase": "dedicate oneself to", "set": 1},
    {"word": "deed", "meaning": "【名】行為", "pos": "名", "example": "A good deed.", "phrase": "do a good deed", "set": 1},
    {"word": "defeat", "meaning": "【動】負かす、破る", "pos": "動", "example": "They defeated the enemy.", "phrase": "admit defeat", "set": 1},
    {"word": "defence", "meaning": "【名】防御、弁護", "pos": "名", "example": "The best defence is attack.", "phrase": "self-defence", "set": 1},
    {"word": "defend", "meaning": "【動】守る、弁護する", "pos": "動", "example": "Defend the country.", "phrase": "defend against", "set": 1},
    {"word": "defender", "meaning": "【名】防御者", "pos": "名", "example": "He played as a defender.", "phrase": "title defender", "set": 1},
    {"word": "defense", "meaning": "【名】防御（米）", "pos": "名", "example": "Department of Defense.", "phrase": "national defense", "set": 1},
    {"word": "deficiency", "meaning": "【名】不足、欠陥", "pos": "名", "example": "Vitamin deficiency.", "phrase": "deficiency in", "set": 1},
    {"word": "define", "meaning": "【動】定義する", "pos": "動", "example": "Define the word.", "phrase": "define as", "set": 1},
    {"word": "definite", "meaning": "【形】明確な", "pos": "形", "example": "Give me a definite answer.", "phrase": "definite plan", "set": 1},
    {"word": "definite article", "meaning": "【名】定冠詞", "pos": "名", "example": "'The' is the definite article.", "phrase": "use a definite article", "set": 1},
    {"word": "definitely", "meaning": "【副】間違いなく", "pos": "副", "example": "I will definitely go.", "phrase": "definitely not", "set": 1},
    {"word": "definition", "meaning": "【名】定義", "pos": "名", "example": "The definition of success.", "phrase": "by definition", "set": 1},
    {"word": "delay", "meaning": "【動】遅らせる", "pos": "動", "example": "The train was delayed.", "phrase": "without delay", "set": 1},
    {"word": "delete", "meaning": "【動】削除する", "pos": "動", "example": "Delete the file.", "phrase": "delete key", "set": 1},
    {"word": "delicate", "meaning": "【形】繊細な", "pos": "形", "example": "A delicate flower.", "phrase": "delicate balance", "set": 1},
    {"word": "delight", "meaning": "【名】喜び", "pos": "名", "example": "He laughed with delight.", "phrase": "take delight in", "set": 1},
    {"word": "delighted", "meaning": "【形】喜んで", "pos": "形", "example": "I'm delighted to meet you.", "phrase": "be delighted with", "set": 1},
    {"word": "delightful", "meaning": "【形】楽しい、愉快な", "pos": "形", "example": "A delightful evening.", "phrase": "delightful weather", "set": 1},
    {"word": "deliver", "meaning": "【動】配達する", "pos": "動", "example": "Deliver a package.", "phrase": "deliver a speech", "set": 1},
    {"word": "delivery", "meaning": "【名】配達", "pos": "名", "example": "Free delivery.", "phrase": "delivery service", "set": 1},
    {"word": "demand", "meaning": "【名】要求、需要", "pos": "名", "example": "Supply and demand.", "phrase": "in demand", "set": 1},
    {"word": "demand", "meaning": "【動】要求する", "pos": "動", "example": "I demand an apology.", "phrase": "demand to know", "set": 1},
    {"word": "democracy", "meaning": "【名】民主主義", "pos": "名", "example": "Fight for democracy.", "phrase": "parliamentary democracy", "set": 1},
    {"word": "democratic", "meaning": "【形】民主的な", "pos": "形", "example": "A democratic country.", "phrase": "Democratic Party", "set": 1},
    {"word": "demonstrate", "meaning": "【動】証明する、実演する", "pos": "動", "example": "Demonstrate how to use it.", "phrase": "clearly demonstrate", "set": 1},
    {"word": "demonstration", "meaning": "【名】実演、デモ", "pos": "名", "example": "A cooking demonstration.", "phrase": "give a demonstration", "set": 1},
    {"word": "deny", "meaning": "【動】否定する", "pos": "動", "example": "He denied the charge.", "phrase": "deny access", "set": 1},
    {"word": "depart", "meaning": "【動】出発する", "pos": "動", "example": "The train departs at 5.", "phrase": "depart from", "set": 1},
    {"word": "department", "meaning": "【名】部門、学科", "pos": "名", "example": "Sales department.", "phrase": "department store", "set": 1},
    {"word": "departure", "meaning": "【名】出発", "pos": "名", "example": "Departure time.", "phrase": "departure gate", "set": 1},
    {"word": "dependent", "meaning": "【形】依存している", "pos": "形", "example": "He is dependent on his parents.", "phrase": "dependent on", "set": 1},
    {"word": "deposit", "meaning": "【名】預金、手付金", "pos": "名", "example": "Make a deposit.", "phrase": "deposit account", "set": 1},
    {"word": "depressed", "meaning": "【形】落ち込んだ", "pos": "形", "example": "He feels depressed.", "phrase": "deeply depressed", "set": 1},
    {"word": "depressing", "meaning": "【形】気を滅入らせる", "pos": "形", "example": "Depressing news.", "phrase": "depressing thought", "set": 1},
    {"word": "depression", "meaning": "【名】不況、憂鬱", "pos": "名", "example": "The Great Depression.", "phrase": "suffer from depression", "set": 1},
    {"word": "deprive", "meaning": "【動】奪う", "pos": "動", "example": "Deprive him of his rights.", "phrase": "deprive of", "set": 1},
    {"word": "depth", "meaning": "【名】深さ", "pos": "名", "example": "The depth of the pool.", "phrase": "in depth", "set": 1},
    {"word": "derive", "meaning": "【動】引き出す、由来する", "pos": "動", "example": "Derive pleasure from reading.", "phrase": "derive from", "set": 1},
    {"word": "deserve", "meaning": "【動】値する", "pos": "動", "example": "He deserves a prize.", "phrase": "deserve better", "set": 1},
    {"word": "design", "meaning": "【動】設計する", "pos": "動", "example": "Design a building.", "phrase": "by design", "set": 1},
    {"word": "designer", "meaning": "【名】デザイナー", "pos": "名", "example": "Fashion designer.", "phrase": "designer clothes", "set": 1},
    {"word": "desire", "meaning": "【名】欲望", "pos": "名", "example": "A desire for fame.", "phrase": "burning desire", "set": 1},
    {"word": "despair", "meaning": "【名】絶望", "pos": "名", "example": "He gave up in despair.", "phrase": "depths of despair", "set": 1},
    {"word": "desperate", "meaning": "【形】絶望的な、必死の", "pos": "形", "example": "A desperate attempt.", "phrase": "desperate for", "set": 1},
    {"word": "despite", "meaning": "【前】～にもかかわらず", "pos": "前", "example": "Despite the rain, we went.", "phrase": "despite the fact", "set": 1},
    {"word": "destination", "meaning": "【名】目的地", "pos": "名", "example": "Reach your destination.", "phrase": "final destination", "set": 1},
    {"word": "destruction", "meaning": "【名】破壊", "pos": "名", "example": "Destruction of the environment.", "phrase": "mass destruction", "set": 1},
    {"word": "destructive", "meaning": "【形】破壊的な", "pos": "形", "example": "Destructive power.", "phrase": "destructive force", "set": 1},
    {"word": "detective", "meaning": "【名】探偵、刑事", "pos": "名", "example": "Private detective.", "phrase": "detective story", "set": 1},
    {"word": "determination", "meaning": "【名】決意", "pos": "名", "example": "He showed great determination.", "phrase": "self-determination", "set": 1},
    {"word": "determine", "meaning": "【動】決定する", "pos": "動", "example": "Determine the cause.", "phrase": "determined to", "set": 1},
    {"word": "devastate", "meaning": "【動】荒廃させる", "pos": "動", "example": "The city was devastated by the quake.", "phrase": "be devastated", "set": 1},
    {"word": "devastating", "meaning": "【形】壊滅的な", "pos": "形", "example": "A devastating flood.", "phrase": "devastating news", "set": 1},
    {"word": "development", "meaning": "【名】発展、開発", "pos": "名", "example": "Economic development.", "phrase": "under development", "set": 1},
    {"word": "device", "meaning": "【名】装置", "pos": "名", "example": "Electronic device.", "phrase": "safety device", "set": 1},
    {"word": "devotion", "meaning": "【名】献身", "pos": "名", "example": "His devotion to his family.", "phrase": "selfless devotion", "set": 1},
    {"word": "diagram", "meaning": "【名】図、図表", "pos": "名", "example": "Draw a diagram.", "phrase": "flow diagram", "set": 1},
    {"word": "dial", "meaning": "【名】文字盤", "pos": "名", "example": "The dial on the clock.", "phrase": "speed dial", "set": 1},
    {"word": "dial", "meaning": "【動】ダイヤルを回す", "pos": "動", "example": "Dial the number.", "phrase": "dial 911", "set": 1},
    {"word": "dialog", "meaning": "【名】対話（米綴り）", "pos": "名", "example": "Open a dialog.", "phrase": "dialog box", "set": 1},
    {"word": "dialogue", "meaning": "【名】対話", "pos": "名", "example": "They had a dialogue.", "phrase": "meaningful dialogue", "set": 1},
    {"word": "diameter", "meaning": "【名】直径", "pos": "名", "example": "Measure the diameter.", "phrase": "in diameter", "set": 1},
    {"word": "diaper", "meaning": "【名】おむつ", "pos": "名", "example": "Change the diaper.", "phrase": "disposable diaper", "set": 1},
    {"word": "differ", "meaning": "【動】異なる", "pos": "動", "example": "Opinions differ.", "phrase": "differ from", "set": 1},
    {"word": "dig", "meaning": "【動】掘る", "pos": "動", "example": "Dig a hole.", "phrase": "dig up", "set": 1},
    {"word": "digital", "meaning": "【形】デジタルの", "pos": "形", "example": "Digital camera.", "phrase": "digital age", "set": 1},
    {"word": "diligence", "meaning": "【名】勤勉", "pos": "名", "example": "His diligence was rewarded.", "phrase": "due diligence", "set": 1},
    {"word": "diligent", "meaning": "【形】勤勉な", "pos": "形", "example": "A diligent student.", "phrase": "be diligent in", "set": 1},
    {"word": "dioxide", "meaning": "【名】二酸化物", "pos": "名", "example": "Carbon dioxide.", "phrase": "carbon dioxide", "set": 1},
    {"word": "direct", "meaning": "【動】向ける、指揮する", "pos": "動", "example": "Direct traffic.", "phrase": "direct attention to", "set": 1},
    {"word": "directly", "meaning": "【副】直接に", "pos": "副", "example": "Speak directly to him.", "phrase": "directly proportional", "set": 1},
    {"word": "dirt", "meaning": "【名】泥、汚れ", "pos": "名", "example": "Wash the dirt off.", "phrase": "treat like dirt", "set": 1},
    {"word": "disability", "meaning": "【名】障害", "pos": "名", "example": "Physical disability.", "phrase": "learning disability", "set": 1},
    {"word": "disable", "meaning": "【動】無効にする、障害を負わせる", "pos": "動", "example": "Disable the alarm.", "phrase": "permanently disabled", "set": 1},
    {"word": "disabled", "meaning": "【形】体の不自由な", "pos": "形", "example": "Disabled parking space.", "phrase": "disabled people", "set": 1},
    {"word": "disagreement", "meaning": "【名】不一致", "pos": "名", "example": "We had a disagreement.", "phrase": "total disagreement", "set": 1},
    {"word": "disappoint", "meaning": "【動】失望させる", "pos": "動", "example": "I hate to disappoint you.", "phrase": "be disappointed", "set": 1},
    {"word": "disappointment", "meaning": "【名】失望", "pos": "名", "example": "It was a big disappointment.", "phrase": "express disappointment", "set": 1},
    {"word": "disaster", "meaning": "【名】災害", "pos": "名", "example": "Natural disaster.", "phrase": "recipe for disaster", "set": 1},
    {"word": "disastrous", "meaning": "【形】破滅的な", "pos": "形", "example": "A disastrous mistake.", "phrase": "disastrous consequences", "set": 1},
    {"word": "disc", "meaning": "【名】円盤、ディスク", "pos": "名", "example": "Compact disc.", "phrase": "slipped disc", "set": 1},
    {"word": "disc jockey", "meaning": "【名】DJ", "pos": "名", "example": "He works as a disc jockey.", "phrase": "radio disc jockey", "set": 1},
    {"word": "discomfort", "meaning": "【名】不快", "pos": "名", "example": "Feel discomfort.", "phrase": "cause discomfort", "set": 1},
    {"word": "discount", "meaning": "【名】割引", "pos": "名", "example": "A 10% discount.", "phrase": "get a discount", "set": 1},
    {"word": "discourage", "meaning": "【動】落胆させる、思いとどまらせる", "pos": "動", "example": "Don't be discouraged.", "phrase": "discourage from", "set": 1},
    {"word": "discovery", "meaning": "【名】発見", "pos": "名", "example": "Scientific discovery.", "phrase": "make a discovery", "set": 1},
    {"word": "discrimination", "meaning": "【名】差別", "pos": "名", "example": "Racial discrimination.", "phrase": "fight discrimination", "set": 1},
    {"word": "disease", "meaning": "【名】病気", "pos": "名", "example": "Heart disease.", "phrase": "cure a disease", "set": 1},
    {"word": "disgusting", "meaning": "【形】胸が悪くなるような", "pos": "形", "example": "That smell is disgusting.", "phrase": "absolutely disgusting", "set": 1},
    {"word": "dishwasher", "meaning": "【名】食洗機 (skip? no, check POS/dup)", "pos": "名", "example": "Load the dishwasher.", "phrase": "empty the dishwasher", "set": 1},
    {"word": "disk", "meaning": "【名】ディスク（米綴り）", "pos": "名", "example": "Floppy disk.", "phrase": "hard disk", "set": 1},
    {"word": "disk jockey", "meaning": "【名】DJ（米綴り）", "pos": "名", "example": "He is a famous disk jockey.", "phrase": "club disk jockey", "set": 1},
    {"word": "dislike", "meaning": "【動】嫌う", "pos": "動", "example": "I dislike onions.", "phrase": "dislike intensely", "set": 1},
    {"word": "display", "meaning": "【動】展示する、表示する", "pos": "動", "example": "Display the results.", "phrase": "on display", "set": 1},
    {"word": "dissolve", "meaning": "【動】溶かす、解散する", "pos": "動", "example": "Dissolve sugar in water.", "phrase": "dissolve parliament", "set": 1},
    {"word": "distance", "meaning": "【名】距離", "pos": "名", "example": "In the distance.", "phrase": "long distance", "set": 1},
    {"word": "distant", "meaning": "【形】遠い", "pos": "形", "example": "A distant relative.", "phrase": "distant future", "set": 1},
    {"word": "distinction", "meaning": "【名】区別、特徴", "pos": "名", "example": "Make a distinction.", "phrase": "clear distinction", "set": 1},
    {"word": "distinctly", "meaning": "【副】はっきりと", "pos": "副", "example": "I distinctly remember.", "phrase": "speak distinctly", "set": 1},
    {"word": "distinguish", "meaning": "【動】区別する", "pos": "動", "example": "Distinguish between right and wrong.", "phrase": "distinguish A from B", "set": 1},
    {"word": "distribute", "meaning": "【動】分配する", "pos": "動", "example": "Distribute leaflets.", "phrase": "distribute wealth", "set": 1},
    {"word": "distribution", "meaning": "【名】分配、分布", "pos": "名", "example": "Wealth distribution.", "phrase": "distribution channel", "set": 1},
    {"word": "district", "meaning": "【名】地区", "pos": "名", "example": "Shopping district.", "phrase": "red-light district", "set": 1},
    {"word": "disturbance", "meaning": "【名】騒乱、妨害", "pos": "名", "example": "Cause a disturbance.", "phrase": "emotional disturbance", "set": 1},
    {"word": "dive", "meaning": "【名】飛び込み", "pos": "名", "example": "A swan dive.", "phrase": "take a dive", "set": 1},
    {"word": "dive", "meaning": "【動】飛び込む", "pos": "動", "example": "Dive into the pool.", "phrase": "dive for pearls", "set": 1},
    {"word": "diver", "meaning": "【名】ダイバー", "pos": "名", "example": "Deep sea diver.", "phrase": "scuba diver", "set": 1},
    {"word": "diverse", "meaning": "【形】多様な", "pos": "形", "example": "Diverse cultures.", "phrase": "culturally diverse", "set": 1},
    {"word": "divide", "meaning": "【名】分割、分水嶺", "pos": "名", "example": "The north-south divide.", "phrase": "bridge the divide", "set": 1},
    {"word": "divine", "meaning": "【形】神の", "pos": "形", "example": "Divine intervention.", "phrase": "divine right", "set": 1},
    {"word": "diving", "meaning": "【名】ダイビング", "pos": "名", "example": "Go diving.", "phrase": "scuba diving", "set": 1},
    {"word": "divorced", "meaning": "【形】離婚した", "pos": "形", "example": "She is divorced.", "phrase": "get divorced", "set": 1},
    {"word": "DJ", "meaning": "【名】DJ", "pos": "名", "example": "The DJ played a hit song.", "phrase": "radio DJ", "set": 1},
    {"word": "doc", "meaning": "【名】医者（略語）", "pos": "名", "example": "What's up, doc?", "phrase": "call the doc", "set": 1},
    {"word": "document", "meaning": "【名】文書", "pos": "名", "example": "Sign the document.", "phrase": "official document", "set": 1},
    {"word": "documentary", "meaning": "【名】ドキュメンタリー", "pos": "名", "example": "I watched a nature documentary.", "phrase": "TV documentary", "set": 1},
    {"word": "dolphin", "meaning": "【名】イルカ", "pos": "名", "example": "Dolphins are intelligent.", "phrase": "swim with dolphins", "set": 1},
    {"word": "dot", "meaning": "【名】点、ドット", "pos": "名", "example": "Connect the dots.", "phrase": "dot com", "set": 1},
    {"word": "downstairs", "meaning": "【形】階下の", "pos": "形", "example": "The downstairs bathroom.", "phrase": "go downstairs", "set": 1},
    {"word": "downward", "meaning": "【形】下向きの", "pos": "形", "example": "A downward trend.", "phrase": "downward spiral", "set": 1},
    {"word": "doze", "meaning": "【名】うたた寝", "pos": "名", "example": "Have a doze.", "phrase": "doze off", "set": 1},
    {"word": "dozen", "meaning": "【名】ダース（12個）", "pos": "名", "example": "A dozen eggs.", "phrase": "baker's dozen", "set": 1},
    # Dozen listed as determiner and noun. Let's correct determiner to 'other' or handle carefully.
    
    {"word": "drag", "meaning": "【動】引きずる", "pos": "動", "example": "Drag the table.", "phrase": "drag and drop", "set": 1},
    {"word": "dramatic", "meaning": "【形】劇的な", "pos": "形", "example": "A dramatic change.", "phrase": "dramatic effect", "set": 1},
    {"word": "drown", "meaning": "【動】溺れる", "pos": "動", "example": "He nearly drowned.", "phrase": "drown in debt", "set": 1},
    {"word": "drunk", "meaning": "【形】酔っぱらった", "pos": "形", "example": "He got drunk.", "phrase": "drunk driver", "set": 1},
    {"word": "dude", "meaning": "【名】男、やつ（スラング）", "pos": "名", "example": "Hey, dude!", "phrase": "cool dude", "set": 1},
    {"word": "dull", "meaning": "【形】退屈な、鈍い", "pos": "形", "example": "A dull movie.", "phrase": "dull pain", "set": 1},
    {"word": "dump", "meaning": "【名】ゴミ捨て場", "pos": "名", "example": "Take it to the dump.", "phrase": "rubbish dump", "set": 1},
    {"word": "dump", "meaning": "【動】捨てる", "pos": "動", "example": "Don't dump rubbish here.", "phrase": "dump a boyfriend", "set": 1},
    {"word": "dustbin", "meaning": "【名】ゴミ箱（英）", "pos": "名", "example": "Put it in the dustbin.", "phrase": "dustbin lid", "set": 1},
    {"word": "dusty", "meaning": "【形】ほこりっぽい", "pos": "形", "example": "A dusty room.", "phrase": "dusty road", "set": 1},
    {"word": "duty", "meaning": "【名】義務、関税", "pos": "名", "example": "Do your duty.", "phrase": "duty free", "set": 1},
    {"word": "duty-free", "meaning": "【形】免税の", "pos": "形", "example": "Duty-free shop.", "phrase": "buy duty-free", "set": 1},
    {"word": "duvet", "meaning": "【名】羽毛布団", "pos": "名", "example": "A warm duvet.", "phrase": "duvet cover", "set": 1},
    {"word": "dynasty", "meaning": "【名】王朝", "pos": "名", "example": "Ming Dynasty.", "phrase": "ruling dynasty", "set": 1},
    {"word": "eager", "meaning": "【形】熱望して", "pos": "形", "example": "I'm eager to help.", "phrase": "eager beaver", "set": 1},
    {"word": "eagerness", "meaning": "【名】熱意", "pos": "名", "example": "He showed great eagerness.", "phrase": "with eagerness", "set": 1},
    {"word": "earache", "meaning": "【名】耳の痛み", "pos": "名", "example": "I have an earache.", "phrase": "suffer from earache", "set": 1},
    {"word": "earnest", "meaning": "【形】まじめな", "pos": "形", "example": "He is an earnest student.", "phrase": "in earnest", "set": 1},
    {"word": "eastern", "meaning": "【形】東の", "pos": "形", "example": "Eastern Europe.", "phrase": "Eastern culture", "set": 1},
    {"word": "easygoing", "meaning": "【形】のんきな", "pos": "形", "example": "He is easygoing.", "phrase": "easygoing personality", "set": 1},
    {"word": "easy-going", "meaning": "【形】のんきな（同上）", "pos": "形", "example": "An easy-going boss.", "phrase": "easy-going attitude", "set": 1},
    {"word": "eco", "meaning": "【名】エコ", "pos": "名", "example": "Eco-friendly.", "phrase": "eco tourism", "set": 1},
    {"word": "ecological", "meaning": "【形】生態学の", "pos": "形", "example": "Ecological crisis.", "phrase": "ecological balance", "set": 1},
    {"word": "ecology", "meaning": "【名】生態学", "pos": "名", "example": "Study ecology.", "phrase": "deep ecology", "set": 1}
]

js_path = 'c:\\Users\\warut\\python_chatgpt\\data\\vocabulary.js'

with open(js_path, 'r', encoding='utf-8') as f:
    content = f.read()

# IMPROVED DUPLICATE CHECKING: Check (word, pos) pairs
daily_match = re.search(r'daily:\s*\[(.*?)\]', content, re.DOTALL)
existing_entries = set()

if daily_match:
    daily_content = daily_match.group(1)
    # Parse object literals strictly roughly
    # Extract word:"..." and pos:"..."
    # Warning: this regex is fragile if formatting changes.
    # Assuming standard format: { word: "...", meaning: "...", pos: "...", ... }
    
    # We iterate over blocks starting with { and ending with }
    # Better to iterate by finding "word" and then finding "pos" nearby?
    # Or just splitting by "},"?
    
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
    # Check if (word, pos) already exists
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
        # Prepend to list again
        new_content = content.replace("daily: [", f"daily: [\n        {joined_data},")

    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Success: Added {added_count} words to daily array. Skipped {skipped_count} duplicates.")
