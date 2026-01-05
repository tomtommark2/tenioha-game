
import json
import re
import os

# B2 Batch 4 (Words 451-600 approx)
# CSV Lines 451 to 600
new_words = [
    {"word": "condemn", "meaning": "【動】非難する", "pos": "動", "example": "Condemn violence.", "phrase": "condemn to death", "set": 1},
    {"word": "conduct", "meaning": "【動】行う、指揮する", "pos": "動", "example": "Conduct a survey.", "phrase": "conduct business", "set": 1},
    {"word": "conductor", "meaning": "【名】指揮者、車掌", "pos": "名", "example": "Orchestra conductor.", "phrase": "bus conductor", "set": 1},
    {"word": "cone", "meaning": "【名】円錐", "pos": "名", "example": "Ice cream cone.", "phrase": "traffic cone", "set": 1},
    {"word": "conference", "meaning": "【名】会議", "pos": "名", "example": "Press conference.", "phrase": "attend a conference", "set": 1},
    {"word": "conferencing", "meaning": "【名】会議（システム）", "pos": "名", "example": "Video conferencing.", "phrase": "conferencing software", "set": 1},
    {"word": "confess", "meaning": "【動】告白する", "pos": "動", "example": "Confess a crime.", "phrase": "confess to", "set": 1},
    {"word": "confession", "meaning": "【名】告白", "pos": "名", "example": "Sign a confession.", "phrase": "make a confession", "set": 1},
    {"word": "confidently", "meaning": "【副】自信を持って", "pos": "副", "example": "Smile confidently.", "phrase": "speak confidently", "set": 1},
    {"word": "confine", "meaning": "【動】制限する、閉じ込める", "pos": "動", "example": "Confine to bed.", "phrase": "be confined", "set": 1},
    {"word": "confront", "meaning": "【動】直面する", "pos": "動", "example": "Confront the problem.", "phrase": "confront someone", "set": 1},
    {"word": "conjunction", "meaning": "【名】接続詞、結合", "pos": "名", "example": "In conjunction with.", "phrase": "coordinating conjunction", "set": 1},
    {"word": "conquest", "meaning": "【名】征服", "pos": "名", "example": "Norman Conquest.", "phrase": "conquest of space", "set": 1},
    {"word": "conscience", "meaning": "【名】良心", "pos": "名", "example": "Guilty conscience.", "phrase": "clear conscience", "set": 1},
    {"word": "consciousness", "meaning": "【名】意識", "pos": "名", "example": "Lose consciousness.", "phrase": "consciousness raising", "set": 1},
    {"word": "consensus", "meaning": "【名】合意", "pos": "名", "example": "Reach a consensus.", "phrase": "general consensus", "set": 1},
    {"word": "consent", "meaning": "【名】同意", "pos": "名", "example": "Give consent.", "phrase": "age of consent", "set": 1},
    {"word": "considerably", "meaning": "【副】かなり", "pos": "副", "example": "Considerably larger.", "phrase": "improve considerably", "set": 1},
    {"word": "considering", "meaning": "【接】～を考慮すると", "pos": "接", "example": "Considering he is young.", "phrase": "considering that", "set": 1},
    {"word": "considering", "meaning": "【前】～を考慮すると", "pos": "前", "example": "Considering the cost.", "phrase": "considering everything", "set": 1},
    {"word": "consistent", "meaning": "【形】一貫した", "pos": "形", "example": "Consistent effort.", "phrase": "consistent with", "set": 1},
    {"word": "consolation", "meaning": "【名】慰め", "pos": "名", "example": "Consolation prize.", "phrase": "small consolation", "set": 1},
    {"word": "console", "meaning": "【動】慰める", "pos": "動", "example": "Console a friend.", "phrase": "try to console", "set": 1},
    {"word": "constant", "meaning": "【形】絶え間ない", "pos": "形", "example": "Constant rain.", "phrase": "constant companion", "set": 1},
    {"word": "consult", "meaning": "【動】相談する", "pos": "動", "example": "Consult a doctor.", "phrase": "consult with", "set": 1},
    {"word": "consultant", "meaning": "【名】コンサルタント", "pos": "名", "example": "Business consultant.", "phrase": "hire a consultant", "set": 1},
    {"word": "contaminate", "meaning": "【動】汚染する", "pos": "動", "example": "Contaminate water.", "phrase": "contaminated food", "set": 1},
    {"word": "contemporary", "meaning": "【形】現代の", "pos": "形", "example": "Contemporary art.", "phrase": "contemporary music", "set": 1},
    {"word": "contempt", "meaning": "【名】軽蔑", "pos": "名", "example": "Look with contempt.", "phrase": "beneath contempt", "set": 1},
    {"word": "content", "meaning": "【形】満足して", "pos": "形", "example": "Content with life.", "phrase": "feel content", "set": 1},
    {"word": "contract", "meaning": "【名】契約", "pos": "名", "example": "Sign a contract.", "phrase": "breach of contract", "set": 1},
    {"word": "contradict", "meaning": "【動】矛盾する、否定する", "pos": "動", "example": "Contradict a statement.", "phrase": "contradict oneself", "set": 1},
    {"word": "contradiction", "meaning": "【名】矛盾", "pos": "名", "example": "In contradiction to.", "phrase": "direct contradiction", "set": 1},
    {"word": "contradictory", "meaning": "【形】矛盾した", "pos": "形", "example": "Contradictory evidence.", "phrase": "contradictory statements", "set": 1},
    {"word": "controversy", "meaning": "【名】論争", "pos": "名", "example": "Public controversy.", "phrase": "cause controversy", "set": 1},
    {"word": "conveniently", "meaning": "【副】便利に", "pos": "副", "example": "Located conveniently.", "phrase": "conveniently placed", "set": 1},
    {"word": "convention", "meaning": "【名】慣習、大会", "pos": "名", "example": "Social convention.", "phrase": "convention center", "set": 1},
    {"word": "conventional", "meaning": "【形】従来の", "pos": "形", "example": "Conventional weapons.", "phrase": "conventional wisdom", "set": 1},
    {"word": "converse", "meaning": "【名】会話する (noun in CSV but usually verb here)", "pos": "名", "example": "Converse with friends.", "phrase": "converse in English", "set": 1},
    {"word": "conversely", "meaning": "【副】逆に", "pos": "副", "example": "Conversely, he agreed.", "phrase": "conversely true", "set": 1},
    {"word": "conversion", "meaning": "【名】転換", "pos": "名", "example": "Currency conversion.", "phrase": "conversion rate", "set": 1},
    {"word": "convert", "meaning": "【動】転換する", "pos": "動", "example": "Convert to Islam.", "phrase": "convert money", "set": 1},
    {"word": "convinced", "meaning": "【形】確信して", "pos": "形", "example": "I am convinced.", "phrase": "firmly convinced", "set": 1},
    {"word": "cool", "meaning": "【動】冷やす", "pos": "動", "example": "Cool the soup.", "phrase": "cool down", "set": 1},
    {"word": "cooperate", "meaning": "【動】協力する", "pos": "動", "example": "Cooperate with police.", "phrase": "refuse to cooperate", "set": 1},
    {"word": "cooperation", "meaning": "【名】協力", "pos": "名", "example": "In cooperation with.", "phrase": "international cooperation", "set": 1},
    {"word": "cooperative", "meaning": "【形】協力的な", "pos": "形", "example": "Cooperative effort.", "phrase": "be cooperative", "set": 1},
    {"word": "cope", "meaning": "【動】対処する", "pos": "動", "example": "Cope with stress.", "phrase": "can't cope", "set": 1},
    {"word": "copper", "meaning": "【名】銅", "pos": "名", "example": "Copper wire.", "phrase": "copper coin", "set": 1},
    {"word": "coral", "meaning": "【名】サンゴ", "pos": "名", "example": "Coral reef.", "phrase": "coral island", "set": 1},
    {"word": "core", "meaning": "【名】核心", "pos": "名", "example": "Core value.", "phrase": "rotten to the core", "set": 1},
    {"word": "cornerstone", "meaning": "【名】礎石", "pos": "名", "example": "Cornerstone of democracy.", "phrase": "lay the cornerstone", "set": 1},
    {"word": "cornet", "meaning": "【名】コルネット", "pos": "名", "example": "Play the cornet.", "phrase": "cornet solo", "set": 1},
    {"word": "corona", "meaning": "【名】コロナ", "pos": "名", "example": "Solar corona.", "phrase": "corona virus", "set": 1},
    {"word": "corporal", "meaning": "【形】身体の", "pos": "形", "example": "Corporal punishment.", "phrase": "corporal works", "set": 1},
    {"word": "corporate", "meaning": "【形】企業の", "pos": "形", "example": "Corporate culture.", "phrase": "corporate ladder", "set": 1},
    {"word": "corporation", "meaning": "【名】法人", "pos": "名", "example": "Multinational corporation.", "phrase": "large corporation", "set": 1},
    {"word": "correct", "meaning": "【動】訂正する", "pos": "動", "example": "Correct mistakes.", "phrase": "correct me if I'm wrong", "set": 1},
    {"word": "correctness", "meaning": "【名】正確さ", "pos": "名", "example": "Political correctness.", "phrase": "check for correctness", "set": 1},
    {"word": "correspond", "meaning": "【動】一致する、文通する", "pos": "動", "example": "Correspond to facts.", "phrase": "correspond with", "set": 1},
    {"word": "correspondence", "meaning": "【名】通信、一致", "pos": "名", "example": "Email correspondence.", "phrase": "in correspondence with", "set": 1},
    {"word": "correspondent", "meaning": "【名】特派員", "pos": "名", "example": "War correspondent.", "phrase": "foreign correspondent", "set": 1},
    {"word": "corresponding", "meaning": "【形】対応する", "pos": "形", "example": "Corresponding period.", "phrase": "corresponding angles", "set": 1},
    {"word": "corridor", "meaning": "【名】廊下", "pos": "名", "example": "Long corridor.", "phrase": "walk down the corridor", "set": 1},
    {"word": "corrupt", "meaning": "【形】腐敗した", "pos": "形", "example": "Corrupt politician.", "phrase": "corrupt system", "set": 1},
    {"word": "corruption", "meaning": "【名】汚職", "pos": "名", "example": "Fight corruption.", "phrase": "political corruption", "set": 1},
    {"word": "cosiness", "meaning": "【名】居心地の良さ（英）", "pos": "名", "example": "Cosiness of the room.", "phrase": "warmth and cosiness", "set": 1},
    {"word": "costly", "meaning": "【形】高価な", "pos": "形", "example": "Costly mistake.", "phrase": "costly procedure", "set": 1},
    {"word": "costume", "meaning": "【名】衣装", "pos": "名", "example": "Halloween costume.", "phrase": "national costume", "set": 1},
    {"word": "cosy", "meaning": "【形】居心地の良い（英）", "pos": "形", "example": "Cosy atmosphere.", "phrase": "cosy chair", "set": 1},
    {"word": "cottage", "meaning": "【名】小別荘", "pos": "名", "example": "Country cottage.", "phrase": "holiday cottage", "set": 1},
    {"word": "cough", "meaning": "【名】咳", "pos": "名", "example": "Bad cough.", "phrase": "cough medicine", "set": 1},
    {"word": "counter", "meaning": "【名】カウンター、反対", "pos": "名", "example": "Kitchen counter.", "phrase": "counter argument", "set": 1},
    {"word": "countryman", "meaning": "【名】同胞", "pos": "名", "example": "Fellow countryman.", "phrase": "my countryman", "set": 1},
    {"word": "countrywide", "meaning": "【形】全国的な", "pos": "形", "example": "Countrywide tour.", "phrase": "spread countrywide", "set": 1},
    {"word": "courtesy", "meaning": "【名】礼儀", "pos": "名", "example": "Treat with courtesy.", "phrase": "courtesy bus", "set": 1},
    {"word": "coward", "meaning": "【名】臆病者", "pos": "名", "example": "Don't be a coward.", "phrase": "act like a coward", "set": 1},
    {"word": "cowardly", "meaning": "【形】臆病な", "pos": "形", "example": "Cowardly act.", "phrase": "cowardly attack", "set": 1},
    {"word": "coziness", "meaning": "【名】居心地の良さ", "pos": "名", "example": "Coziness of home.", "phrase": "add coziness", "set": 1},
    {"word": "cozy", "meaning": "【形】居心地の良い", "pos": "形", "example": "Cozy blanket.", "phrase": "feel cozy", "set": 1},
    {"word": "crab", "meaning": "【名】カニ", "pos": "名", "example": "Crab salad.", "phrase": "catch a crab", "set": 1},
    {"word": "crack", "meaning": "【名】割れ目", "pos": "名", "example": "Crack in the wall.", "phrase": "at the crack of dawn", "set": 1},
    {"word": "crack", "meaning": "【動】割れる", "pos": "動", "example": "Crack an egg.", "phrase": "crack a joke", "set": 1},
    {"word": "craftsman", "meaning": "【名】職人", "pos": "名", "example": "Skilled craftsman.", "phrase": "master craftsman", "set": 1},
    {"word": "crater", "meaning": "【名】噴火口", "pos": "名", "example": "Volcanic crater.", "phrase": "impact crater", "set": 1},
    {"word": "crawl", "meaning": "【動】這う", "pos": "動", "example": "Baby crawls.", "phrase": "crawl space", "set": 1},
    {"word": "crease", "meaning": "【名】しわ、折り目", "pos": "名", "example": "Iron the crease.", "phrase": "crease in paper", "set": 1},
    {"word": "creation", "meaning": "【名】創造、作品", "pos": "名", "example": "Creation of the world.", "phrase": "artistic creation", "set": 1},
    {"word": "creatively", "meaning": "【副】独創的に", "pos": "副", "example": "Think creatively.", "phrase": "solve creatively", "set": 1},
    {"word": "creek", "meaning": "【名】小川", "pos": "名", "example": "Swim in the creek.", "phrase": "up the creek", "set": 1},
    {"word": "creepy", "meaning": "【形】気味の悪い", "pos": "形", "example": "Creepy house.", "phrase": "creepy feeling", "set": 1},
    {"word": "crew", "meaning": "【名】乗組員", "pos": "名", "example": "Cabin crew.", "phrase": "film crew", "set": 1},
    {"word": "criminal", "meaning": "【形】犯罪の", "pos": "形", "example": "Criminal record.", "phrase": "criminal charges", "set": 1},
    {"word": "cripple", "meaning": "【名】不自由な人（差別的）", "pos": "名", "example": "Emotional cripple.", "phrase": "cripple economy (verb usage)", "set": 1},
    {"word": "critically", "meaning": "【副】批判的に、決定的に", "pos": "副", "example": "Critically acclaimed.", "phrase": "critically ill", "set": 1},
    {"word": "criticism", "meaning": "【名】批判", "pos": "名", "example": "Accept criticism.", "phrase": "constructive criticism", "set": 1},
    {"word": "crocodile", "meaning": "【名】ワニ", "pos": "名", "example": "Crocodile tears.", "phrase": "crocodile leather", "set": 1},
    {"word": "crossly", "meaning": "【副】不機嫌に", "pos": "副", "example": "Stared crossly.", "phrase": "speak crossly", "set": 1},
    {"word": "crucial", "meaning": "【形】重大な", "pos": "形", "example": "Crucial decision.", "phrase": "crucial moment", "set": 1},
    {"word": "cruelly", "meaning": "【副】残酷に", "pos": "副", "example": "Treat cruelly.", "phrase": "cruelly beaten", "set": 1},
    {"word": "cruelty", "meaning": "【名】残酷さ", "pos": "名", "example": "Animal cruelty.", "phrase": "act of cruelty", "set": 1},
    {"word": "cruise", "meaning": "【動】巡航する", "pos": "動", "example": "Cruise ship.", "phrase": "cruise around", "set": 1},
    {"word": "crystallise", "meaning": "【動】結晶化する（英）", "pos": "動", "example": "Ideas crystallise.", "phrase": "sugar crystallises", "set": 1},
    {"word": "crystallize", "meaning": "【動】結晶化する", "pos": "動", "example": "Plans crystallize.", "phrase": "honey crystallizes", "set": 1},
    {"word": "cube", "meaning": "【名】立方体", "pos": "名", "example": "Ice cube.", "phrase": "Rubik's cube", "set": 1},
    {"word": "cubism", "meaning": "【名】キュビズム", "pos": "名", "example": "Picasso's cubism.", "phrase": "style of cubism", "set": 1},
    {"word": "cuff", "meaning": "【名】袖口", "pos": "名", "example": "Shirt cuff.", "phrase": "off the cuff", "set": 1},
    {"word": "culmination", "meaning": "【名】最高潮", "pos": "名", "example": "Culmination of efforts.", "phrase": "reach culmination", "set": 1},
    {"word": "culturally", "meaning": "【副】文化的に", "pos": "副", "example": "Culturally diverse.", "phrase": "culturally significant", "set": 1},
    {"word": "cure", "meaning": "【動】治療する", "pos": "動", "example": "Cure a disease.", "phrase": "prevention is better than cure", "set": 1},
    {"word": "curl", "meaning": "【名】巻き毛、カール", "pos": "名", "example": "Hair curl.", "phrase": "curl up", "set": 1},
    {"word": "cursor", "meaning": "【名】カーソル", "pos": "名", "example": "Move the cursor.", "phrase": "blinking cursor", "set": 1},
    {"word": "cyberaddict", "meaning": "【名】ネット中毒者", "pos": "名", "example": "Become a cyberaddict.", "phrase": "help for cyberaddict", "set": 1},
    {"word": "cybercafe", "meaning": "【名】ネットカフェ", "pos": "名", "example": "Visit a cybercafe.", "phrase": "cybercafe access", "set": 1},
    {"word": "cybercafé", "meaning": "【名】ネットカフェ（表記揺れ）", "pos": "名", "example": "Cybercafé nearby.", "phrase": "at an internet cybercafé", "set": 1},
    {"word": "cybercrime", "meaning": "【名】サイバー犯罪", "pos": "名", "example": "Fight cybercrime.", "phrase": "victim of cybercrime", "set": 1},
    {"word": "cyberpet", "meaning": "【名】電子ペット", "pos": "名", "example": "Feed a cyberpet.", "phrase": "virtual cyberpet", "set": 1},
    {"word": "cyberschool", "meaning": "【名】サイバースクール", "pos": "名", "example": "Enroll in cyberschool.", "phrase": "online cyberschool", "set": 1},
    {"word": "cyberspace", "meaning": "【名】サイバースペース", "pos": "名", "example": "Lost in cyberspace.", "phrase": "explore cyberspace", "set": 1},
    {"word": "cyclist", "meaning": "【名】自転車に乗る人", "pos": "名", "example": "Professional cyclist.", "phrase": "road cyclist", "set": 1},
    {"word": "daft", "meaning": "【形】ばかげた", "pos": "形", "example": "Daft idea.", "phrase": "don't be daft", "set": 1},
    {"word": "damn", "meaning": "【形】いまいましい", "pos": "形", "example": "Damn fool.", "phrase": "damn it", "set": 1},
    {"word": "damn", "meaning": "【副】まったく", "pos": "副", "example": "Damn good.", "phrase": "damn right", "set": 1},
    {"word": "damn", "meaning": "【間】くそっ", "pos": "間", "example": "Damn!", "phrase": "damn!", "set": 1},
    {"word": "dandelion", "meaning": "【名】タンポポ", "pos": "名", "example": "Blow a dandelion.", "phrase": "yellow dandelion", "set": 1},
    {"word": "darling", "meaning": "【形】最愛の", "pos": "形", "example": "My darling wife.", "phrase": "little darling", "set": 1},
    {"word": "darling", "meaning": "【名】あなた、最愛の人", "pos": "名", "example": "Hello, darling.", "phrase": "everybody's darling", "set": 1},
    {"word": "dash", "meaning": "【名】突進、ダッシュ", "pos": "名", "example": "Make a dash for it.", "phrase": "100m dash", "set": 1},
    {"word": "dash", "meaning": "【動】突進する", "pos": "動", "example": "Dash across the street.", "phrase": "dashed hopes", "set": 1},
    {"word": "data", "meaning": "【名】データ", "pos": "名", "example": "Collect data.", "phrase": "data analysis", "set": 1},
    {"word": "database", "meaning": "【名】データベース", "pos": "名", "example": "Update the database.", "phrase": "search database", "set": 1},
    {"word": "dated", "meaning": "【形】時代遅れの", "pos": "形", "example": "Dated clothes.", "phrase": "look dated", "set": 1},
    {"word": "daughter-in-law", "meaning": "【名】義理の娘", "pos": "名", "example": "My daughter-in-law.", "phrase": "son and daughter-in-law", "set": 1},
    {"word": "dawn", "meaning": "【名】夜明け", "pos": "名", "example": "At dawn.", "phrase": "from dawn to dusk", "set": 1},
    {"word": "daytime", "meaning": "【名】昼間", "pos": "名", "example": "In the daytime.", "phrase": "daytime TV", "set": 1},
    {"word": "de facto", "meaning": "【形】事実上の", "pos": "形", "example": "De facto leader.", "phrase": "de facto standard", "set": 1},
    {"word": "dear", "meaning": "【名】あなた（呼びかけ）", "pos": "名", "example": "Yes, dear.", "phrase": "my dear", "set": 1},
    {"word": "dearly", "meaning": "【副】心から", "pos": "副", "example": "Love dearly.", "phrase": "pay dearly", "set": 1},
    {"word": "debit", "meaning": "【名】借方、引き落とし", "pos": "名", "example": "Direct debit.", "phrase": "debit side", "set": 1},
    {"word": "debit", "meaning": "【動】引き落とす", "pos": "動", "example": "Debit my account.", "phrase": "debit card", "set": 1},
    {"word": "debit card", "meaning": "【名】デビットカード", "pos": "名", "example": "Pay by debit card.", "phrase": "insert debit card", "set": 1},
    {"word": "decade", "meaning": "【名】10年間", "pos": "名", "example": "Last decade.", "phrase": "decades ago", "set": 1},
    {"word": "decay", "meaning": "【動】腐敗する", "pos": "動", "example": "Teeth decay.", "phrase": "urban decay", "set": 1},
    {"word": "deceive", "meaning": "【動】だます", "pos": "動", "example": "Deceive people.", "phrase": "deceive oneself", "set": 1},
    {"word": "decent", "meaning": "【形】まともな、親切な", "pos": "形", "example": "Decent job.", "phrase": "decent person", "set": 1},
    {"word": "deceptive", "meaning": "【形】人を惑わす", "pos": "形", "example": "Deceptive appearance.", "phrase": "deceptive marketing", "set": 1},
    {"word": "decisive", "meaning": "【形】決定的な", "pos": "形", "example": "Decisive victory.", "phrase": "decisive action", "set": 1},
    {"word": "deck", "meaning": "【名】甲板", "pos": "名", "example": "On the deck.", "phrase": "deck of cards", "set": 1},
    {"word": "decline", "meaning": "【動】断る、減少する", "pos": "動", "example": "Decline an offer.", "phrase": "decline in quality", "set": 1},
    {"word": "decomposition", "meaning": "【名】分解、腐敗", "pos": "名", "example": "Decomposition of leaves.", "phrase": "rate of decomposition", "set": 1},
]

js_path = 'c:\\Users\\warut\\python_chatgpt\\data\\vocabulary.js'

with open(js_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Duplicate logic: NONE requested for B2 -> Exam1.
# Just append to exam1.

# Strategy: Find `exam1: [` and insert items.
match = re.search(r'exam1:\s*\[([^\]]*)\]', content, re.DOTALL)
if match:
    current_list_content = match.group(1).strip()
    
    formatted_entries = []
    for w in new_words:
        entry = f'{{ word: "{w["word"]}", meaning: "{w["meaning"]}", pos: "{w["pos"]}", example: "{w["example"]}", phrase: "{w["phrase"]}", set: 1 }}' # Set 1.
        formatted_entries.append(entry)
    
    new_entries_str = ",\n        ".join(formatted_entries)
    
    # Re-read the match to act on current file state (Batch 3 modified it).
    full_match = match.group(0)
    old_inner = match.group(1)
    
    if old_inner.strip():
        # Append
        # Ensure we handle the comma correctly. If old_inner ends with newline spaces, we append comma.
        # Actually simplest is: `exam1: [ <old>, <new> ]`
        new_block = f"exam1: [{old_inner},\n        {new_entries_str}]"
    else:
        new_block = f"exam1: [\n        {new_entries_str}\n    ]"

    new_content = content.replace(full_match, new_block)

    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Success: Added {len(new_words)} words to exam1 array.")

else:
    print("Error: Could not find `exam1: []` in vocabulary.js")
