
import json
import re
import os

# B2 Batch 13 (Words 1801-1950 approx)
# CSV Lines 1801 to 1950
new_words = [
    {"word": "persistence", "meaning": "【名】粘り強さ", "pos": "名", "example": "Admire your persistence.", "phrase": "persistence pays off", "set": 1},
    {"word": "persistent", "meaning": "【形】しつこい", "pos": "形", "example": "Persistent cough.", "phrase": "persistent rumors", "set": 1},
    {"word": "personification", "meaning": "【名】擬人化、権化", "pos": "名", "example": "Personification of evil.", "phrase": "personification of beauty", "set": 1},
    {"word": "personify", "meaning": "【動】象徴する、擬人化する", "pos": "動", "example": "Personify kindness.", "phrase": "characters personify", "set": 1},
    {"word": "personnel", "meaning": "【名】職員、人事", "pos": "名", "example": "Military personnel.", "phrase": "personnel department", "set": 1},
    {"word": "perspective", "meaning": "【名】視点、遠近法", "pos": "名", "example": "Different perspective.", "phrase": "in perspective", "set": 1},
    {"word": "perspiration", "meaning": "【名】発汗", "pos": "名", "example": "Beads of perspiration.", "phrase": "heavy perspiration", "set": 1},
    {"word": "persuasion", "meaning": "【名】説得", "pos": "名", "example": "Gentle persuasion.", "phrase": "power of persuasion", "set": 1},
    {"word": "pessimist", "meaning": "【名】悲観主義者", "pos": "名", "example": "Don't be a pessimist.", "phrase": "born pessimist", "set": 1},
    {"word": "pessimistic", "meaning": "【形】悲観的な", "pos": "形", "example": "Pessimistic outlook.", "phrase": "pessimistic about", "set": 1},
    {"word": "petrified", "meaning": "【形】石化した、すくんだ", "pos": "形", "example": "Petrified of spiders.", "phrase": "petrified wood", "set": 1},
    {"word": "petty", "meaning": "【形】些細な", "pos": "形", "example": "Petty crime.", "phrase": "petty cash", "set": 1},
    {"word": "pH", "meaning": "【名】水素イオン指数", "pos": "名", "example": "pH balance.", "phrase": "pH level", "set": 1},
    {"word": "pharmacist", "meaning": "【名】薬剤師", "pos": "名", "example": "Ask the pharmacist.", "phrase": "registered pharmacist", "set": 1},
    {"word": "phase", "meaning": "【名】段階", "pos": "名", "example": "Initial phase.", "phrase": "phase out", "set": 1},
    {"word": "philosophical", "meaning": "【形】哲学的な", "pos": "形", "example": "Philosophical discussion.", "phrase": "philosophical view", "set": 1},
    {"word": "photograph", "meaning": "【動】写真を撮る", "pos": "動", "example": "Photograph scenery.", "phrase": "photograph well", "set": 1},
    {"word": "physician", "meaning": "【名】医師", "pos": "名", "example": "Consult a physician.", "phrase": "attending physician", "set": 1},
    {"word": "pi", "meaning": "【名】円周率", "pos": "名", "example": "Value of pi.", "phrase": "calculate pi", "set": 1},
    {"word": "pickle", "meaning": "【名】漬物", "pos": "名", "example": "Sour pickle.", "phrase": "in a pickle", "set": 1},
    {"word": "picky", "meaning": "【形】えり好みする", "pos": "形", "example": "Picky eater.", "phrase": "don't be picky", "set": 1},
    {"word": "picture", "meaning": "【動】想像する", "pos": "動", "example": "Picture yourself on a beach.", "phrase": "picture this", "set": 1},
    {"word": "picturesque", "meaning": "【形】絵のような", "pos": "形", "example": "Picturesque village.", "phrase": "picturesque view", "set": 1},
    {"word": "pillowcase", "meaning": "【名】枕カバー", "pos": "名", "example": "Change pillowcase.", "phrase": "silk pillowcase", "set": 1},
    {"word": "pin", "meaning": "【名】ピン", "pos": "名", "example": "Safety pin.", "phrase": "pin number", "set": 1},
    {"word": "pine", "meaning": "【名】松", "pos": "名", "example": "Pine tree.", "phrase": "pine cone", "set": 1},
    {"word": "pint", "meaning": "【名】パイント", "pos": "名", "example": "Pint of beer.", "phrase": "half a pint", "set": 1},
    {"word": "piracy", "meaning": "【名】海賊行為", "pos": "名", "example": "Software piracy.", "phrase": "act of piracy", "set": 1},
    {"word": "pirate", "meaning": "【名】海賊", "pos": "名", "example": "Pirate ship.", "phrase": "pirate radio", "set": 1},
    {"word": "pitch", "meaning": "【名】音の高さ、ピッチ", "pos": "名", "example": "High pitch.", "phrase": "football pitch", "set": 1},
    {"word": "pitch", "meaning": "【動】投げる", "pos": "動", "example": "Pitch a ball.", "phrase": "pitch a tent", "set": 1},
    {"word": "plague", "meaning": "【名】疫病", "pos": "名", "example": "The Plague.", "phrase": "plague of locusts", "set": 1},
    {"word": "planning", "meaning": "【名】計画", "pos": "名", "example": "Urban planning.", "phrase": "family planning", "set": 1},
    {"word": "playmate", "meaning": "【名】遊び相手", "pos": "名", "example": "Childhood playmate.", "phrase": "Playboy playmate", "set": 1},
    {"word": "playwright", "meaning": "【名】劇作家", "pos": "名", "example": "Famous playwright.", "phrase": "Shakespeare playwright", "set": 1},
    {"word": "plead", "meaning": "【動】嘆願する", "pos": "動", "example": "Plead guilty.", "phrase": "plead for mercy", "set": 1},
    {"word": "plot", "meaning": "【名】筋、陰謀", "pos": "名", "example": "Movie plot.", "phrase": "plot twist", "set": 1},
    {"word": "pluck", "meaning": "【動】摘む、むしる", "pos": "動", "example": "Pluck a flower.", "phrase": "pluck eyebrows", "set": 1},
    {"word": "plug", "meaning": "【動】塞ぐ、プラグを差し込む", "pos": "動", "example": "Plug the leak.", "phrase": "plug in", "set": 1},
    {"word": "plum", "meaning": "【名】プラム", "pos": "名", "example": "Juicy plum.", "phrase": "plum pudding", "set": 1},
    {"word": "plumber", "meaning": "【名】配管工", "pos": "名", "example": "Call a plumber.", "phrase": "master plumber", "set": 1},
    {"word": "plus", "meaning": "【名】プラス面", "pos": "名", "example": "That's a plus.", "phrase": "plus side", "set": 1},
    {"word": "pneumonia", "meaning": "【名】肺炎", "pos": "名", "example": "Viral pneumonia.", "phrase": "catch pneumonia", "set": 1},
    {"word": "point of view", "meaning": "【名】観点", "pos": "名", "example": "My point of view.", "phrase": "from a point of view", "set": 1},
    {"word": "pointless", "meaning": "【形】無意味な", "pos": "形", "example": "Pointless argument.", "phrase": "pointless to try", "set": 1},
    {"word": "poison", "meaning": "【動】毒殺する、毒する", "pos": "動", "example": "Poison the water.", "phrase": "poison someone's mind", "set": 1},
    {"word": "polar bear", "meaning": "【名】ホッキョクグマ", "pos": "名", "example": "White polar bear.", "phrase": "polar bear cub", "set": 1},
    {"word": "polio", "meaning": "【名】ポリオ", "pos": "名", "example": "Polio vaccine.", "phrase": "eradicate polio", "set": 1},
    {"word": "polish", "meaning": "【名】艶出し剤", "pos": "名", "example": "Shoe polish.", "phrase": "nail polish", "set": 1},
    {"word": "politeness", "meaning": "【名】礼儀正しさ", "pos": "名", "example": "Common politeness.", "phrase": "out of politeness", "set": 1},
    {"word": "politically", "meaning": "【副】政治的に", "pos": "副", "example": "Politically active.", "phrase": "politically incorrect", "set": 1},
    {"word": "polity", "meaning": "【名】政治形態", "pos": "名", "example": "Democratic polity.", "phrase": "structure of polity", "set": 1},
    {"word": "polo", "meaning": "【名】ポロ", "pos": "名", "example": "Play polo.", "phrase": "water polo", "set": 1},
    {"word": "ponder", "meaning": "【動】熟考する", "pos": "動", "example": "Ponder the meaning.", "phrase": "ponder over", "set": 1},
    {"word": "pop", "meaning": "【動】ポンと鳴る、急に現れる", "pos": "動", "example": "Balloon popped.", "phrase": "pop up", "set": 1},
    {"word": "popularise", "meaning": "【動】普及させる（英）", "pos": "動", "example": "Popularise science.", "phrase": "popularise a trend", "set": 1},
    {"word": "popularity", "meaning": "【名】人気", "pos": "名", "example": "Gain popularity.", "phrase": "popularity poll", "set": 1},
    {"word": "popularize", "meaning": "【動】普及させる", "pos": "動", "example": "Popularize the idea.", "phrase": "newly popularized", "set": 1},
    {"word": "porch", "meaning": "【名】ポーチ", "pos": "名", "example": "Sit on the porch.", "phrase": "front porch", "set": 1},
    {"word": "portion", "meaning": "【名】部分、一人前", "pos": "名", "example": "Small portion.", "phrase": "large portion", "set": 1},
    {"word": "pose", "meaning": "【名】姿勢、見せかけ", "pos": "名", "example": "Strike a pose.", "phrase": "yoga pose", "set": 1},
    {"word": "posh", "meaning": "【形】豪華な、上流階級の", "pos": "形", "example": "Posh hotel.", "phrase": "posh accent", "set": 1},
    {"word": "possessed", "meaning": "【形】とりつかれた", "pos": "形", "example": "Possessed by demons.", "phrase": "act like possessed", "set": 1},
    {"word": "postal", "meaning": "【形】郵便の", "pos": "形", "example": "Postal service.", "phrase": "postal code", "set": 1},
    {"word": "postpone", "meaning": "【動】延期する", "pos": "動", "example": "Postpone the meeting.", "phrase": "postpone until later", "set": 1},
    {"word": "potent", "meaning": "【形】強力な", "pos": "形", "example": "Potent drug.", "phrase": "potent symbol", "set": 1},
    {"word": "potential", "meaning": "【形】潜在的な", "pos": "形", "example": "Potential customer.", "phrase": "potential danger", "set": 1},
    {"word": "potentially", "meaning": "【副】潜在的に", "pos": "副", "example": "Potentially harmful.", "phrase": "potentially dangerous", "set": 1},
    {"word": "pound", "meaning": "【動】ドンドン叩く", "pos": "動", "example": "Pound the door.", "phrase": "heart pounding", "set": 1},
    {"word": "powder", "meaning": "【動】粉にする、白粉をつける", "pos": "動", "example": "Powder one's nose.", "phrase": "powder snow", "set": 1},
    {"word": "powerfully", "meaning": "【副】力強く", "pos": "副", "example": "Built powerfully.", "phrase": "influence powerfully", "set": 1},
    {"word": "practicality", "meaning": "【名】実用性", "pos": "名", "example": "Practicality of the plan.", "phrase": "assess practicality", "set": 1},
    {"word": "practically", "meaning": "【副】実際的に、ほとんど", "pos": "副", "example": "Practically impossible.", "phrase": "practically speaking", "set": 1},
    {"word": "praise", "meaning": "【動】称賛する", "pos": "動", "example": "Praise God.", "phrase": "praise highly", "set": 1},
    {"word": "prance", "meaning": "【名】跳ね回り (verb mostly)", "pos": "名", "example": "Prance around.", "phrase": "make a prance", "set": 1},
    {"word": "prawn", "meaning": "【名】車エビ", "pos": "名", "example": "Prawn cocktail.", "phrase": "king prawn", "set": 1},
    {"word": "precede", "meaning": "【動】先行する", "pos": "動", "example": "Precede the storm.", "phrase": "precede in rank", "set": 1},
    {"word": "precisely", "meaning": "【副】正確に", "pos": "副", "example": "Precisely at noon.", "phrase": "precisely what I mean", "set": 1},
    {"word": "predicament", "meaning": "【名】苦境", "pos": "名", "example": "In a predicament.", "phrase": "face a predicament", "set": 1},
    {"word": "predicate", "meaning": "【動】断定する、基礎を置く", "pos": "動", "example": "Predicate on facts.", "phrase": "predicate adjective (grammar)", "set": 1},
    {"word": "predicative", "meaning": "【形】叙述的な", "pos": "形", "example": "Predicative use.", "phrase": "predicative adjective", "set": 1},
    {"word": "predictable", "meaning": "【形】予測可能な", "pos": "形", "example": "Predictable outcome.", "phrase": "predictable patter", "set": 1},
    {"word": "predictive", "meaning": "【形】予測の", "pos": "形", "example": "Predictive text.", "phrase": "predictive validity", "set": 1},
    {"word": "predictor", "meaning": "【名】予測因子", "pos": "名", "example": "Strong predictor.", "phrase": "predictor of success", "set": 1},
    {"word": "prefect", "meaning": "【名】監督生、県知事", "pos": "名", "example": "School prefect.", "phrase": "police prefect", "set": 1},
    {"word": "preferable", "meaning": "【形】好ましい", "pos": "形", "example": "Preferable to death.", "phrase": "highly preferable", "set": 1},
    {"word": "preferably", "meaning": "【副】できれば", "pos": "副", "example": "Preferably alone.", "phrase": "preferably by email", "set": 1},
    {"word": "prehistoric", "meaning": "【形】有史以前の", "pos": "形", "example": "Prehistoric times.", "phrase": "prehistoric animal", "set": 1},
    {"word": "prehuman", "meaning": "【名】原人", "pos": "名", "example": "Prehuman ancestors.", "phrase": "prehuman fossils", "set": 1},
    {"word": "preindustrial", "meaning": "【形】産業革命以前の", "pos": "形", "example": "Preindustrial society.", "phrase": "preindustrial age", "set": 1},
    {"word": "prejudge", "meaning": "【動】予断する", "pos": "動", "example": "Don't prejudge.", "phrase": "prejudge the issue", "set": 1},
    {"word": "preliminary", "meaning": "【形】予備の", "pos": "形", "example": "Preliminary results.", "phrase": "preliminary round", "set": 1},
    {"word": "preoccupy", "meaning": "【動】夢中にさせる", "pos": "動", "example": "Preoccupied with work.", "phrase": "preoccupy one's thoughts", "set": 1},
    {"word": "prescribe", "meaning": "【動】処方する", "pos": "動", "example": "Prescribe medicine.", "phrase": "doctor prescribed", "set": 1},
    {"word": "present", "meaning": "【動】提示する", "pos": "動", "example": "Present a paper.", "phrase": "present an award", "set": 1},
    {"word": "presenter", "meaning": "【名】贈呈者、司会者", "pos": "名", "example": "TV presenter.", "phrase": "award presenter", "set": 1},
    {"word": "presidency", "meaning": "【名】大統領の職", "pos": "名", "example": "Run for presidency.", "phrase": "during his presidency", "set": 1},
    {"word": "presidential", "meaning": "【形】大統領の", "pos": "形", "example": "Presidential election.", "phrase": "presidential suite", "set": 1},
    {"word": "prestige", "meaning": "【名】威信", "pos": "名", "example": "High prestige.", "phrase": "loss of prestige", "set": 1},
    {"word": "prestigious", "meaning": "【形】名声のある", "pos": "形", "example": "Prestigious award.", "phrase": "prestigious university", "set": 1},
    {"word": "presumably", "meaning": "【副】たぶん", "pos": "副", "example": "Presumably true.", "phrase": "presumably dead", "set": 1},
    {"word": "pretend", "meaning": "【形】見せかけの", "pos": "形", "example": "Pretend friend.", "phrase": "pretend game", "set": 1},
    {"word": "prevail", "meaning": "【動】普及する、勝つ", "pos": "動", "example": "Justice will prevail.", "phrase": "prevail over", "set": 1},
    {"word": "prevention", "meaning": "【名】防止", "pos": "名", "example": "Crime prevention.", "phrase": "prevention is better", "set": 1},
    {"word": "preventive", "meaning": "【形】予防の", "pos": "形", "example": "Preventive measure.", "phrase": "preventive medicine", "set": 1},
    {"word": "previously", "meaning": "【副】以前に", "pos": "副", "example": "Previously known as.", "phrase": "previously discussed", "set": 1},
    {"word": "price", "meaning": "【動】値段をつける", "pos": "動", "example": "Price the items.", "phrase": "reasonably priced", "set": 1},
    {"word": "priceless", "meaning": "【形】非常に貴重な", "pos": "形", "example": "Priceless antique.", "phrase": "priceless moment", "set": 1},
    {"word": "prick", "meaning": "【名】ちくりとした痛み、突き傷", "pos": "名", "example": "Pin prick.", "phrase": "feel a prick", "set": 1},
    {"word": "primary", "meaning": "【形】主要な、初等の", "pos": "形", "example": "Primary school.", "phrase": "primary color", "set": 1},
    {"word": "prime", "meaning": "【形】主要な、最良の", "pos": "形", "example": "Prime time.", "phrase": "prime suspect", "set": 1},
    {"word": "prime minister", "meaning": "【名】首相", "pos": "名", "example": "Prime Minister of UK.", "phrase": "elect a Prime Minister", "set": 1},
    {"word": "principal", "meaning": "【名】校長、長", "pos": "名", "example": "School principal.", "phrase": "principal investigator", "set": 1},
    {"word": "prior", "meaning": "【形】前の", "pos": "形", "example": "Prior engagement.", "phrase": "prior to", "set": 1},
    {"word": "priority", "meaning": "【名】優先事項", "pos": "名", "example": "Top priority.", "phrase": "give priority to", "set": 1},
    {"word": "privately", "meaning": "【副】個人的に", "pos": "副", "example": "Speak privately.", "phrase": "privately owned", "set": 1},
    {"word": "privilege", "meaning": "【名】特権", "pos": "名", "example": "It's a privilege.", "phrase": "executive privilege", "set": 1},
    {"word": "probable", "meaning": "【形】ありそうな", "pos": "形", "example": "Probable cause.", "phrase": "highly probable", "set": 1},
    {"word": "probe", "meaning": "【名】探査機、厳密な調査", "pos": "名", "example": "Space probe.", "phrase": "launch a probe", "set": 1},
    {"word": "procedure", "meaning": "【名】手順", "pos": "名", "example": "Follow procedure.", "phrase": "standard procedure", "set": 1},
    {"word": "process", "meaning": "【動】処理する", "pos": "動", "example": "Process data.", "phrase": "process meat", "set": 1},
    {"word": "professional", "meaning": "【名】専門家", "pos": "名", "example": "Consummate professional.", "phrase": "turn professional", "set": 1},
    {"word": "profile", "meaning": "【名】横顔、プロフィール", "pos": "名", "example": "Low profile.", "phrase": "update profile", "set": 1},
    {"word": "profit", "meaning": "【名】利益", "pos": "名", "example": "Net profit.", "phrase": "make a profit", "set": 1},
    {"word": "profitable", "meaning": "【形】有益な", "pos": "形", "example": "Profitable business.", "phrase": "highly profitable", "set": 1},
    {"word": "programer", "meaning": "【名】プログラマー", "pos": "名", "example": "Computer programer.", "phrase": "skilled programer", "set": 1},
    {"word": "programing", "meaning": "【名】プログラミング", "pos": "名", "example": "Learn programing.", "phrase": "programing language", "set": 1},
    {"word": "programmer", "meaning": "【名】プログラマー（つづり違い）", "pos": "名", "example": "Java programmer.", "phrase": "hire a programmer", "set": 1},
    {"word": "programming", "meaning": "【名】プログラミング（つづり違い）", "pos": "名", "example": "Programming skill.", "phrase": "programming code", "set": 1},
    {"word": "progress", "meaning": "【動】進歩する", "pos": "動", "example": "Progress rapidly.", "phrase": "progress in study", "set": 1},
    {"word": "prohibit", "meaning": "【動】禁止する", "pos": "動", "example": "Prohibit smoking.", "phrase": "strictly prohibit", "set": 1},
    {"word": "project", "meaning": "【名】計画", "pos": "名", "example": "School project.", "phrase": "research project", "set": 1},
    {"word": "project", "meaning": "【動】映写する、計画する", "pos": "動", "example": "Project an image.", "phrase": "project costs", "set": 1},
    {"word": "projection", "meaning": "【名】投影、予測", "pos": "名", "example": "Sales projection.", "phrase": "map projection", "set": 1},
    {"word": "prom", "meaning": "【名】プロム", "pos": "名", "example": "School prom.", "phrase": "prom queen", "set": 1},
    {"word": "prominence", "meaning": "【名】卓越", "pos": "名", "example": "Rise to prominence.", "phrase": "gain prominence", "set": 1},
    {"word": "prompt", "meaning": "【形】迅速な", "pos": "形", "example": "Prompt reply.", "phrase": "prompt action", "set": 1},
    {"word": "prompt", "meaning": "【名】プロンプト", "pos": "名", "example": "Follow the prompt.", "phrase": "voice prompt", "set": 1},
    {"word": "prompt", "meaning": "【動】促す", "pos": "動", "example": "Prompt a response.", "phrase": "prompted to acts", "set": 1},
    {"word": "promptly", "meaning": "【副】迅速に", "pos": "副", "example": "Arrive promptly.", "phrase": "reply promptly", "set": 1},
    {"word": "proponent", "meaning": "【名】支持者", "pos": "名", "example": "Leading proponent.", "phrase": "proponent of change", "set": 1},
    {"word": "proposed", "meaning": "【形】提案された", "pos": "形", "example": "Proposed plan.", "phrase": "proposed changes", "set": 1},
    {"word": "prose", "meaning": "【名】散文", "pos": "名", "example": "Write prose.", "phrase": "prose style", "set": 1},
    {"word": "prosecute", "meaning": "【動】起訴する", "pos": "動", "example": "Prosecute for theft.", "phrase": "prosecute a case", "set": 1},
    {"word": "prospect", "meaning": "【名】見込み", "pos": "名", "example": "Good prospect.", "phrase": "job prospects", "set": 1},
    {"word": "prosper", "meaning": "【動】繁栄する", "pos": "動", "example": "Business prospered.", "phrase": "live long and prosper", "set": 1},
    {"word": "protest", "meaning": "【動】抗議する", "pos": "動", "example": "Protest against war.", "phrase": "protest innocence", "set": 1},
    {"word": "proudly", "meaning": "【副】誇らしげに", "pos": "副", "example": "Stand proudly.", "phrase": "proudly present", "set": 1},
    {"word": "proven", "meaning": "【形】証明された", "pos": "形", "example": "Proven record.", "phrase": "proven fact", "set": 1},
    {"word": "province", "meaning": "【名】州、地方", "pos": "名", "example": "Canadian province.", "phrase": "province of Quebec", "set": 1},
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
