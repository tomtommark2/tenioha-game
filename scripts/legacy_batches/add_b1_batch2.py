
import json
import re
import os

# B1 Batch 2 (Words 52-112, "adopt" to "antique")
new_words = [
    {"word": "adopt", "meaning": "【動】採用する、養子にする", "pos": "動", "example": "We decided to adopt a child.", "phrase": "adopt a policy", "set": 1},
    {"word": "adorable", "meaning": "【形】愛らしい", "pos": "形", "example": "The baby is absolutely adorable.", "phrase": "adorable puppy", "set": 1},
    {"word": "advance", "meaning": "【動】前進する、進歩する", "pos": "動", "example": "The army advanced towards the city.", "phrase": "in advance", "set": 1},
    {"word": "adverb", "meaning": "【名】副詞", "pos": "名", "example": "'Quickly' is an adverb.", "phrase": "adverbial clause", "set": 1},
    {"word": "adverbial", "meaning": "【形】副詞の", "pos": "形", "example": "This is an adverbial phrase.", "phrase": "adverbial usage", "set": 1},
    {"word": "advert", "meaning": "【名】広告（adの口語）", "pos": "名", "example": "I saw an advert for the job.", "phrase": "TV advert", "set": 1},
    {"word": "advertise", "meaning": "【動】宣伝する", "pos": "動", "example": "They advertise their products on TV.", "phrase": "advertise for", "set": 1},
    {"word": "adviser", "meaning": "【名】助言者、顧問", "pos": "名", "example": "He is a financial adviser.", "phrase": "special adviser", "set": 1},
    {"word": "advisor", "meaning": "【名】助言者（adviserと同じ）", "pos": "名", "example": "She acts as a legal advisor.", "phrase": "technical advisor", "set": 1},
    {"word": "aerobics", "meaning": "【名】エアロビクス", "pos": "名", "example": "I do aerobics twice a week.", "phrase": "aerobics class", "set": 1},
    {"word": "affect", "meaning": "【動】影響する", "pos": "動", "example": "The weather affected our plans.", "phrase": "affect the outcome", "set": 1},
    {"word": "affection", "meaning": "【名】愛情", "pos": "名", "example": "He felt great affection for her.", "phrase": "deep affection", "set": 1},
    {"word": "afford", "meaning": "【動】余裕がある", "pos": "動", "example": "I can't afford a new car.", "phrase": "afford to buy", "set": 1},
    {"word": "after", "meaning": "【接】～した後に", "pos": "接", "example": "Call me after you arrive.", "phrase": "after all", "set": 1},
    {"word": "afterward", "meaning": "【副】その後", "pos": "副", "example": "We went to dinner afterward.", "phrase": "shortly afterward", "set": 1},
    {"word": "afterwards", "meaning": "【副】その後（afterwardと同じ）", "pos": "副", "example": "See you afterwards.", "phrase": "soon afterwards", "set": 1},
    {"word": "agenda", "meaning": "【名】議題", "pos": "名", "example": "What's on the agenda for today?", "phrase": "set the agenda", "set": 1},
    {"word": "aggressive", "meaning": "【形】攻撃的な、積極的な", "pos": "形", "example": "He has an aggressive personality.", "phrase": "aggressive behavior", "set": 1},
    {"word": "agreement", "meaning": "【名】合意、協定", "pos": "名", "example": "They reached an agreement.", "phrase": "in agreement", "set": 1},
    {"word": "agricultural", "meaning": "【形】農業の", "pos": "形", "example": "They sell agricultural products.", "phrase": "agricultural land", "set": 1},
    {"word": "agriculture", "meaning": "【名】農業", "pos": "名", "example": "Agriculture is important here.", "phrase": "sustainable agriculture", "set": 1},
    {"word": "aid", "meaning": "【名】援助", "pos": "名", "example": "They sent humanitarian aid.", "phrase": "first aid", "set": 1},
    # Skip word: aid (verb) separate entry usually merged, but let's add as verb too if distinct?
    # JS structure supports duplicate words if meanings differ, but `word` key is unique in map usually.
    # The game uses `${level}_${word}` as key. Duplicate keys might be an issue.
    # Let's Skip duplicate headwords in same batch to avoid key collision issues or handle them carefully.
    # If "aid" (verb) is next, we should perhaps merge or append meaning?
    # Current codebase doesn't support multiple entries for exact same word string well (overwrites state).
    # So we will SKIP the second 'aid' (verb) for now or assume noun covers it.
    
    {"word": "aim", "meaning": "【名】目的、狙い", "pos": "名", "example": "His aim is to become a doctor.", "phrase": "take aim", "set": 1},
    {"word": "air conditioning", "meaning": "【名】空調", "pos": "名", "example": "Turn on the air conditioning.", "phrase": "air conditioning system", "set": 1},
    {"word": "air force", "meaning": "【名】空軍", "pos": "名", "example": "He joined the Air Force.", "phrase": "Royal Air Force", "set": 1},
    {"word": "airline", "meaning": "【名】航空会社", "pos": "名", "example": "Which airline are you flying with?", "phrase": "budget airline", "set": 1},
    {"word": "alarm", "meaning": "【動】驚かせる、警告する", "pos": "動", "example": "The news alarmed everyone.", "phrase": "be alarmed at", "set": 1},
    {"word": "alcohol", "meaning": "【名】アルコール", "pos": "名", "example": "He doesn't drink alcohol.", "phrase": "alcohol abuse", "set": 1},
    {"word": "alcoholic", "meaning": "【形】アルコールの", "pos": "形", "example": "This is an alcoholic beverage.", "phrase": "alcoholic drink", "set": 1},
    {"word": "alike", "meaning": "【形】似ている", "pos": "形", "example": "The twins look very alike.", "phrase": "look alike", "set": 1},
    # Skip alike (adverb)
    {"word": "allergic", "meaning": "【形】アレルギーの", "pos": "形", "example": "I'm allergic to cats.", "phrase": "allergic reaction", "set": 1},
    {"word": "allowance", "meaning": "【名】手当、小遣い", "pos": "名", "example": "He gets a monthly allowance.", "phrase": "make allowance for", "set": 1},
    {"word": "aloud", "meaning": "【副】声に出して", "pos": "副", "example": "Read the text aloud.", "phrase": "read aloud", "set": 1},
    {"word": "alphabet", "meaning": "【名】アルファベット", "pos": "名", "example": "How many letters are in the alphabet?", "phrase": "alphabet soup", "set": 1},
    {"word": "alternative", "meaning": "【形】代わりの", "pos": "形", "example": "We need an alternative plan.", "phrase": "alternative energy", "set": 1},
    # Skip alternative (noun)
    {"word": "altogether", "meaning": "【副】完全に、全体で", "pos": "副", "example": "It disappeared altogether.", "phrase": "altogether different", "set": 1},
    {"word": "amazed", "meaning": "【形】驚いた", "pos": "形", "example": "I was amazed by the view.", "phrase": "be amazed at", "set": 1},
    {"word": "amazing", "meaning": "【形】驚くべき、素晴らしい", "pos": "形", "example": "It was an amazing experience.", "phrase": "amazing grace", "set": 1},
    {"word": "ambitious", "meaning": "【形】野心的な", "pos": "形", "example": "He has ambitious plans.", "phrase": "ambitious project", "set": 1},
    {"word": "ambulance", "meaning": "【名】救急車", "pos": "名", "example": "Call an ambulance!", "phrase": "ambulance siren", "set": 1},
    {"word": "amount", "meaning": "【名】量、総額", "pos": "名", "example": "A large amount of money was stolen.", "phrase": "amount of", "set": 1},
    {"word": "amusing", "meaning": "【形】面白い、愉快な", "pos": "形", "example": "She told an amusing story.", "phrase": "find it amusing", "set": 1},
    {"word": "analyse", "meaning": "【動】分析する（英）", "pos": "動", "example": "We need to analyse the data.", "phrase": "analyse results", "set": 1},
    {"word": "analysis", "meaning": "【名】分析", "pos": "名", "example": "Further analysis is required.", "phrase": "clinical analysis", "set": 1},
    {"word": "analyze", "meaning": "【動】分析する（米）", "pos": "動", "example": "He analyzed the problem.", "phrase": "analyze data", "set": 1},
    {"word": "anger", "meaning": "【名】怒り", "pos": "名", "example": "He couldn't hide his anger.", "phrase": "in anger", "set": 1},
    {"word": "angle", "meaning": "【名】角度、角", "pos": "名", "example": "Measure the angle of the slope.", "phrase": "right angle", "set": 1},
    {"word": "animated", "meaning": "【形】活気のある、アニメの", "pos": "形", "example": "They had an animated discussion.", "phrase": "animated cartoon", "set": 1},
    {"word": "animation", "meaning": "【名】アニメーション、活気", "pos": "名", "example": "I study computer animation.", "phrase": "animation movie", "set": 1},
    {"word": "announce", "meaning": "【動】発表する", "pos": "動", "example": "They announced their engagement.", "phrase": "announce a plan", "set": 1},
    {"word": "announcement", "meaning": "【名】発表、告知", "pos": "名", "example": "Wait for the announcement.", "phrase": "make an announcement", "set": 1},
    {"word": "annoyance", "meaning": "【名】苛立ち、迷惑", "pos": "名", "example": "He showed his annoyance.", "phrase": "cause annoyance", "set": 1},
    {"word": "annoyed", "meaning": "【形】イライラした", "pos": "形", "example": "I get annoyed when people are late.", "phrase": "be annoyed with", "set": 1},
    {"word": "annual", "meaning": "【形】毎年の、年1回の", "pos": "形", "example": "The annual meeting is in June.", "phrase": "annual report", "set": 1},
    {"word": "annually", "meaning": "【副】毎年", "pos": "副", "example": "The event is held annually.", "phrase": "updated annually", "set": 1},
    {"word": "ant", "meaning": "【名】アリ", "pos": "名", "example": "Ants are hardworking insects.", "phrase": "ant hill", "set": 1},
    {"word": "anti", "meaning": "【形】反対の", "pos": "形", "example": "He is anti-war.", "phrase": "anti-virus", "set": 1},
    {"word": "antique", "meaning": "【名】骨董品", "pos": "名", "example": "This shop sells antiques.", "phrase": "antique furniture", "set": 1}
]

js_path = 'c:\\Users\\warut\\python_chatgpt\\data\\vocabulary.js'

with open(js_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Parse existing daily words to prevent duplicates
daily_match = re.search(r'daily:\s*\[(.*?)\]', content, re.DOTALL)
existing_words = set()
if daily_match:
    daily_content = daily_match.group(1)
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
    # Append to daily array
    joined_data = ",\n        ".join(formatted_js)
    if "daily: []" in content:
        new_content = content.replace("daily: []", f"daily: [\n        {joined_data}\n    ]")
    else:
        # Match 'daily: [' and insert after it, adding comma + newline + data + comma if not empty?
        # Actually simplest is to prepend to the list again to keep it clean for now. 
        # Wait, if we prepend, the list order is reversed for batches.
        # But order doesn't matter for the game.
        # Let's prepend to be consistent.
        new_content = content.replace("daily: [", f"daily: [\n        {joined_data},")

    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Success: Added {added_count} words to daily array.")
