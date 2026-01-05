
import json
import re
import os

# B1 Batch 15 (Words 1901-2050, "ripe" to "sneeze")
new_words = [
    {"word": "ripe", "meaning": "【形】熟した", "pos": "形", "example": "Ripe fruit.", "phrase": "ripe for", "set": 1},
    {"word": "rise", "meaning": "【名】上昇", "pos": "名", "example": "Price rise.", "phrase": "give rise to", "set": 1},
    {"word": "rise", "meaning": "【動】上がる", "pos": "動", "example": "Sun rises.", "phrase": "rise up", "set": 1},
    {"word": "risk", "meaning": "【名】危険、リスク", "pos": "名", "example": "High risk.", "phrase": "at risk", "set": 1},
    {"word": "roadside", "meaning": "【名】道端", "pos": "名", "example": "Roadside cafe.", "phrase": "by the roadside", "set": 1},
    {"word": "robot", "meaning": "【名】ロボット", "pos": "名", "example": "Industrial robot.", "phrase": "robot arm", "set": 1},
    {"word": "rolling", "meaning": "【形】なだらかに起伏する、回転する", "pos": "形", "example": "Rolling hills.", "phrase": "rolling stone", "set": 1},
    {"word": "room", "meaning": "【動】下宿する", "pos": "動", "example": "Room with a friend.", "phrase": "room together", "set": 1},
    {"word": "rotten", "meaning": "【形】腐った", "pos": "形", "example": "Rotten apple.", "phrase": "rotten egg", "set": 1},
    {"word": "rough", "meaning": "【形】荒い、ざっとした", "pos": "形", "example": "Rough surface.", "phrase": "rough idea", "set": 1},
    {"word": "round", "meaning": "【形】丸い", "pos": "形", "example": "Round table.", "phrase": "all year round", "set": 1},
    {"word": "round", "meaning": "【名】一巡、ラウンド", "pos": "名", "example": "Round of golf.", "phrase": "round of applause", "set": 1},
    {"word": "routine", "meaning": "【名】決まりきった仕事", "pos": "名", "example": "Daily routine.", "phrase": "routine check", "set": 1},
    {"word": "rubber", "meaning": "【名】ゴム", "pos": "名", "example": "Rubber band.", "phrase": "rubber ball", "set": 1},
    {"word": "rubbish", "meaning": "【名】ゴミ（英）", "pos": "名", "example": "Pick up rubbish.", "phrase": "talk rubbish", "set": 1},
    {"word": "rudely", "meaning": "【副】無礼に", "pos": "副", "example": "Behave rudely.", "phrase": "speak rudely", "set": 1},
    {"word": "ruin", "meaning": "【名】破滅、遺跡", "pos": "名", "example": "Financial ruin.", "phrase": "in ruins", "set": 1},
    {"word": "runaway", "meaning": "【名】家出人", "pos": "名", "example": "Runaway child.", "phrase": "runaway victory", "set": 1},
    {"word": "runway", "meaning": "【名】滑走路", "pos": "名", "example": "Plane on the runway.", "phrase": "fashion runway", "set": 1},
    {"word": "rush", "meaning": "【動】急ぐ", "pos": "動", "example": "Rush home.", "phrase": "rush hour", "set": 1},
    {"word": "sacred", "meaning": "【形】神聖な", "pos": "形", "example": "Sacred place.", "phrase": "sacred cow", "set": 1},
    {"word": "sadness", "meaning": "【名】悲しみ", "pos": "名", "example": "Deep sadness.", "phrase": "feel sadness", "set": 1},
    {"word": "safari", "meaning": "【名】サファリ", "pos": "名", "example": "Go on a safari.", "phrase": "safari park", "set": 1},
    {"word": "safeguard", "meaning": "【名】保護手段", "pos": "名", "example": "Safeguard against.", "phrase": "necessary safeguard", "set": 1},
    {"word": "safely", "meaning": "【副】安全に", "pos": "副", "example": "Arrive safely.", "phrase": "drive safely", "set": 1},
    {"word": "safety", "meaning": "【名】安全", "pos": "名", "example": "Safety first.", "phrase": "safety belt", "set": 1},
    {"word": "salesman", "meaning": "【名】セールスマン", "pos": "名", "example": "Car salesman.", "phrase": "door-to-door salesman", "set": 1},
    {"word": "salmon", "meaning": "【名】鮭", "pos": "名", "example": "Smoked salmon.", "phrase": "salmon fillet", "set": 1},
    {"word": "sand", "meaning": "【名】砂", "pos": "名", "example": "White sand.", "phrase": "grain of sand", "set": 1},
    {"word": "sandal", "meaning": "【名】サンダル", "pos": "名", "example": "Wear sandals.", "phrase": "leather sandal", "set": 1},
    {"word": "satellite", "meaning": "【名】衛星", "pos": "名", "example": "Satellite TV.", "phrase": "satellite dish", "set": 1},
    {"word": "satisfaction", "meaning": "【名】満足", "pos": "名", "example": "Job satisfaction.", "phrase": "express satisfaction", "set": 1},
    {"word": "satisfied", "meaning": "【形】満足した", "pos": "形", "example": "Satisfied customer.", "phrase": "satisfied with", "set": 1},
    {"word": "saucepan", "meaning": "【名】片手鍋", "pos": "名", "example": "Boil in a saucepan.", "phrase": "heavy saucepan", "set": 1},
    {"word": "saucer", "meaning": "【名】受け皿", "pos": "名", "example": "Cup and saucer.", "phrase": "flying saucer", "set": 1},
    {"word": "scan", "meaning": "【名】スキャン、精密検査", "pos": "名", "example": "Brain scan.", "phrase": "CT scan", "set": 1},
    {"word": "scare", "meaning": "【動】怖がらせる", "pos": "動", "example": "Scare me.", "phrase": "scare away", "set": 1},
    {"word": "scared", "meaning": "【形】怖がって", "pos": "形", "example": "Scared of spiders.", "phrase": "scared to death", "set": 1},
    {"word": "scary", "meaning": "【形】怖い", "pos": "形", "example": "Scary movie.", "phrase": "scary story", "set": 1},
    {"word": "scatter", "meaning": "【動】まき散らす", "pos": "動", "example": "Scatter seeds.", "phrase": "scatter shot", "set": 1},
    {"word": "scenic", "meaning": "【形】景色の良い", "pos": "形", "example": "Scenic route.", "phrase": "scenic view", "set": 1},
    {"word": "scholar", "meaning": "【名】学者", "pos": "名", "example": "Distinguished scholar.", "phrase": "visiting scholar", "set": 1},
    {"word": "scholarship", "meaning": "【名】奨学金", "pos": "名", "example": "Win a scholarship.", "phrase": "scholarship student", "set": 1},
    {"word": "schoolmate", "meaning": "【名】学校の友達", "pos": "名", "example": "Old schoolmate.", "phrase": "meet a schoolmate", "set": 1},
    {"word": "schoolteacher", "meaning": "【名】学校の先生", "pos": "名", "example": "Primary schoolteacher.", "phrase": "work as a schoolteacher", "set": 1},
    {"word": "science fiction", "meaning": "【名】SF", "pos": "名", "example": "Read science fiction.", "phrase": "science fiction movie", "set": 1},
    {"word": "scold", "meaning": "【動】叱る", "pos": "動", "example": "Scold a child.", "phrase": "scold for", "set": 1},
    {"word": "scope", "meaning": "【名】範囲", "pos": "名", "example": "Scope of the project.", "phrase": "beyond the scope", "set": 1},
    {"word": "score", "meaning": "【名】得点", "pos": "名", "example": "High score.", "phrase": "keep score", "set": 1},
    {"word": "score", "meaning": "【動】得点する", "pos": "動", "example": "Score a goal.", "phrase": "score points", "set": 1},
    {"word": "scratch", "meaning": "【名】ひっかき傷", "pos": "名", "example": "Scratch on the car.", "phrase": "from scratch", "set": 1},
    {"word": "scream", "meaning": "【動】叫ぶ", "pos": "動", "example": "Scream in terror.", "phrase": "scream for help", "set": 1},
    {"word": "sculpture", "meaning": "【名】彫刻", "pos": "名", "example": "Modern sculpture.", "phrase": "ice sculpture", "set": 1},
    {"word": "search", "meaning": "【動】探す", "pos": "動", "example": "Search the web.", "phrase": "search for", "set": 1},
    {"word": "season", "meaning": "【名】季節", "pos": "名", "example": "Four seasons.", "phrase": "peak season", "set": 1},
    {"word": "seawater", "meaning": "【名】海水", "pos": "名", "example": "Drink seawater.", "phrase": "salt from seawater", "set": 1},
    {"word": "seaweed", "meaning": "【名】海藻", "pos": "名", "example": "Dried seaweed.", "phrase": "seaweed salad", "set": 1},
    {"word": "second", "meaning": "【副】第二に", "pos": "副", "example": "Second best.", "phrase": "second to none", "set": 1},
    {"word": "secondary school", "meaning": "【名】中学校（英）", "pos": "名", "example": "Start secondary school.", "phrase": "secondary school student", "set": 1},
    {"word": "second-hand", "meaning": "【形】中古の", "pos": "形", "example": "Second-hand car.", "phrase": "second-hand shop", "set": 1},
    {"word": "second-hand", "meaning": "【副】中古で", "pos": "副", "example": "Buy second-hand.", "phrase": "heard it second-hand", "set": 1},
    {"word": "secret", "meaning": "【形】秘密の", "pos": "形", "example": "Secret agent.", "phrase": "keep a secret", "set": 1},
    {"word": "secretly", "meaning": "【副】こっそりと", "pos": "副", "example": "Meet secretly.", "phrase": "secretly admire", "set": 1},
    {"word": "secure", "meaning": "【形】安全な、確実な", "pos": "形", "example": "Secure connection.", "phrase": "feel secure", "set": 1},
    {"word": "security", "meaning": "【名】警備、安心", "pos": "名", "example": "National security.", "phrase": "security guard", "set": 1},
    {"word": "seize", "meaning": "【動】つかむ、押収する", "pos": "動", "example": "Seize the day.", "phrase": "seize opportunity", "set": 1},
    {"word": "select", "meaning": "【形】選り抜きの", "pos": "形", "example": "Select group.", "phrase": "select few", "set": 1},
    {"word": "selection", "meaning": "【名】選択", "pos": "名", "example": "Wide selection.", "phrase": "selection process", "set": 1},
    {"word": "selfish", "meaning": "【形】利己的な", "pos": "形", "example": "Selfish behavior.", "phrase": "don't be selfish", "set": 1},
    {"word": "self-service", "meaning": "【形】セルフサービスの", "pos": "形", "example": "Self-service restaurant.", "phrase": "self-service pump", "set": 1},
    {"word": "sensation", "meaning": "【名】感覚、大評判", "pos": "名", "example": "Strange sensation.", "phrase": "burning sensation", "set": 1},
    {"word": "separation", "meaning": "【名】分離", "pos": "名", "example": "Legal separation.", "phrase": "separation of powers", "set": 1},
    {"word": "sequence", "meaning": "【名】順序、連続", "pos": "名", "example": "In sequence.", "phrase": "sequence of events", "set": 1},
    {"word": "series", "meaning": "【名】連続、シリーズ", "pos": "名", "example": "TV series.", "phrase": "series of accidents", "set": 1},
    {"word": "serious", "meaning": "【形】真剣な、深刻な", "pos": "形", "example": "Serious injury.", "phrase": "serious matter", "set": 1},
    {"word": "server", "meaning": "【名】給仕人、サーバー", "pos": "名", "example": "File server.", "phrase": "restaurant server", "set": 1},
    {"word": "service", "meaning": "【名】サービス、奉仕", "pos": "名", "example": "Customer service.", "phrase": "at your service", "set": 1},
    {"word": "service", "meaning": "【動】点検する", "pos": "動", "example": "Service the car.", "phrase": "get serviced", "set": 1},
    {"word": "session", "meaning": "【名】会議、期間", "pos": "名", "example": "Training session.", "phrase": "in session", "set": 1},
    {"word": "setting", "meaning": "【名】設定、環境", "pos": "名", "example": "Beautiful setting.", "phrase": "rural setting", "set": 1},
    {"word": "settle", "meaning": "【動】定住する、解決する", "pos": "動", "example": "Settle down.", "phrase": "settle a dispute", "set": 1},
    {"word": "settlement", "meaning": "【名】入植地、解決", "pos": "名", "example": "Peace settlement.", "phrase": "early settlement", "set": 1},
    {"word": "settler", "meaning": "【名】入植者", "pos": "名", "example": "Early settler.", "phrase": "European settlers", "set": 1},
    {"word": "severe", "meaning": "【形】厳しい", "pos": "形", "example": "Severe weather.", "phrase": "severe pain", "set": 1},
    {"word": "severely", "meaning": "【副】厳しく", "pos": "副", "example": "Severely damaged.", "phrase": "punish severely", "set": 1},
    {"word": "sex", "meaning": "【名】性別、性", "pos": "名", "example": "Sex discrimination.", "phrase": "safe sex", "set": 1},
    {"word": "shadow", "meaning": "【動】尾行する、影を落とす", "pos": "動", "example": "Shadow a suspect.", "phrase": "cast a shadow", "set": 1},
    {"word": "shadowy", "meaning": "【形】影のある、ぼんやりした", "pos": "形", "example": "Shadowy figure.", "phrase": "shadowy past", "set": 1},
    {"word": "shake", "meaning": "【動】振る", "pos": "動", "example": "Shake hands.", "phrase": "shake head", "set": 1},
    {"word": "shallow", "meaning": "【形】浅い", "pos": "形", "example": "Shallow water.", "phrase": "shallow breathing", "set": 1},
    {"word": "shame", "meaning": "【名】恥、残念なこと", "pos": "名", "example": "What a shame.", "phrase": "feel shame", "set": 1},
    {"word": "shameful", "meaning": "【形】恥ずべき", "pos": "形", "example": "Shameful act.", "phrase": "shameful secret", "set": 1},
    {"word": "shape", "meaning": "【動】形作る", "pos": "動", "example": "Shape the future.", "phrase": "shape up", "set": 1},
    {"word": "sharp", "meaning": "【形】鋭い", "pos": "形", "example": "Sharp knife.", "phrase": "sharp pain", "set": 1},
    {"word": "shave", "meaning": "【動】剃る", "pos": "動", "example": "Shave every morning.", "phrase": "close shave", "set": 1},
    {"word": "sheer", "meaning": "【形】まったくの", "pos": "形", "example": "Sheer luck.", "phrase": "sheer size", "set": 1},
    {"word": "sheet", "meaning": "【名】シーツ、１枚", "pos": "名", "example": "Clean sheets.", "phrase": "sheet of paper", "set": 1},
    {"word": "shelter", "meaning": "【名】避難所", "pos": "名", "example": "Bomb shelter.", "phrase": "take shelter", "set": 1},
    {"word": "sheriff", "meaning": "【名】保安官", "pos": "名", "example": "County sheriff.", "phrase": "sheriff badge", "set": 1},
    {"word": "shift", "meaning": "【動】移す、変える", "pos": "動", "example": "Shift gears.", "phrase": "shift focus", "set": 1},
    {"word": "shiny", "meaning": "【形】輝く", "pos": "形", "example": "Shiny shoes.", "phrase": "shiny new", "set": 1},
    {"word": "ship", "meaning": "【動】送る", "pos": "動", "example": "Ship goods.", "phrase": "free shipping", "set": 1},
    {"word": "shiver", "meaning": "【動】震える", "pos": "動", "example": "Shiver with cold.", "phrase": "shiver down spine", "set": 1},
    {"word": "shocked", "meaning": "【形】ショックを受けた", "pos": "形", "example": "Shocked silence.", "phrase": "shocked to hear", "set": 1},
    {"word": "shocking", "meaning": "【形】衝撃的な", "pos": "形", "example": "Shocking news.", "phrase": "shocking truth", "set": 1},
    {"word": "shop", "meaning": "【動】買い物をする", "pos": "動", "example": "Shop for clothes.", "phrase": "shop around", "set": 1},
    {"word": "shopper", "meaning": "【名】買い物客", "pos": "名", "example": "Holiday shoppers.", "phrase": "smart shopper", "set": 1},
    {"word": "shortage", "meaning": "【名】不足", "pos": "名", "example": "Food shortage.", "phrase": "water shortage", "set": 1},
    {"word": "shortly", "meaning": "【副】間もなく", "pos": "副", "example": "Arrive shortly.", "phrase": "shortly after", "set": 1},
    {"word": "shout", "meaning": "【動】叫ぶ", "pos": "動", "example": "Shout at him.", "phrase": "shout out", "set": 1},
    {"word": "shrimp", "meaning": "【名】小エビ", "pos": "名", "example": "Fried shrimp.", "phrase": "shrimp cocktail", "set": 1},
    {"word": "shut", "meaning": "【形】閉まった", "pos": "形", "example": "Keep your mouth shut.", "phrase": "shut down", "set": 1},
    {"word": "sickness", "meaning": "【名】病気", "pos": "名", "example": "Morning sickness.", "phrase": "motion sickness", "set": 1},
    {"word": "sidewalk", "meaning": "【名】歩道（米）", "pos": "名", "example": "Walk on the sidewalk.", "phrase": "paved sidewalk", "set": 1},
    {"word": "sigh", "meaning": "【名】ため息", "pos": "名", "example": "Deep sigh.", "phrase": "heave a sigh", "set": 1},
    {"word": "sign", "meaning": "【動】署名する", "pos": "動", "example": "Sign a contract.", "phrase": "sign here", "set": 1},
    {"word": "signal", "meaning": "【名】信号", "pos": "名", "example": "Traffic signal.", "phrase": "give a signal", "set": 1},
    {"word": "signature", "meaning": "【名】署名", "pos": "名", "example": "Author's signature.", "phrase": "digital signature", "set": 1},
    {"word": "significance", "meaning": "【名】重要性", "pos": "名", "example": "Historical significance.", "phrase": "of great significance", "set": 1},
    {"word": "signpost", "meaning": "【名】道しるべ", "pos": "名", "example": "Follow the signpost.", "phrase": "missing signpost", "set": 1},
    {"word": "silent", "meaning": "【形】静かな", "pos": "形", "example": "Silent film.", "phrase": "silent night", "set": 1},
    {"word": "silk", "meaning": "【名】絹", "pos": "名", "example": "Silk dress.", "phrase": "pure silk", "set": 1},
    {"word": "similarity", "meaning": "【名】類似点", "pos": "名", "example": "Striking similarity.", "phrase": "similarity between", "set": 1},
    {"word": "similarly", "meaning": "【副】同様に", "pos": "副", "example": "Act similarly.", "phrase": "similarly situated", "set": 1},
    {"word": "simplify", "meaning": "【動】単純化する", "pos": "動", "example": "Simplify the process.", "phrase": "simplify life", "set": 1},
    {"word": "simultaneously", "meaning": "【副】同時に", "pos": "副", "example": "Happen simultaneously.", "phrase": "work simultaneously", "set": 1},
    {"word": "since", "meaning": "【接】～なので、～以来", "pos": "接", "example": "Since you are here.", "phrase": "ever since", "set": 1},
    {"word": "single", "meaning": "【名】独身者、シングル", "pos": "名", "example": "Single parent.", "phrase": "single room", "set": 1},
    {"word": "sink", "meaning": "【動】沈む", "pos": "動", "example": "Sink quickly.", "phrase": "sink or swim", "set": 1},
    {"word": "skate", "meaning": "【動】スケートをする", "pos": "動", "example": "Ice skate.", "phrase": "skate on thin ice", "set": 1},
    {"word": "skeleton", "meaning": "【名】骨格", "pos": "名", "example": "Human skeleton.", "phrase": "skeleton in the closet", "set": 1},
    {"word": "ski", "meaning": "【動】スキーをする", "pos": "動", "example": "Go skiing.", "phrase": "ski slope", "set": 1},
    {"word": "skin", "meaning": "【名】皮膚", "pos": "名", "example": "Dry skin.", "phrase": "skin deep", "set": 1},
    {"word": "skyscraper", "meaning": "【名】超高層ビル", "pos": "名", "example": "Tall skyscraper.", "phrase": "city of skyscrapers", "set": 1},
    {"word": "slavery", "meaning": "【名】奴隷制度", "pos": "名", "example": "Abolish slavery.", "phrase": "end slavery", "set": 1},
    {"word": "sleep", "meaning": "【名】睡眠", "pos": "名", "example": "Deep sleep.", "phrase": "go to sleep", "set": 1},
    {"word": "sleeve", "meaning": "【名】袖", "pos": "名", "example": "Long sleeves.", "phrase": "roll up sleeves", "set": 1},
    {"word": "slight", "meaning": "【名】軽視", "pos": "名", "example": "Feel a slight.", "phrase": "slight difference", "set": 1},
    {"word": "slightly", "meaning": "【副】わずかに", "pos": "副", "example": "Slightly different.", "phrase": "slightly better", "set": 1},
    {"word": "slip", "meaning": "【名】滑ること、紙切れ", "pos": "名", "example": "Slip on ice.", "phrase": "pink slip", "set": 1},
    {"word": "slip", "meaning": "【動】滑る", "pos": "動", "example": "Slip and fall.", "phrase": "slip away", "set": 1},
    {"word": "slogan", "meaning": "【名】スローガン", "pos": "名", "example": "Campaign slogan.", "phrase": "political slogan", "set": 1},
    {"word": "slope", "meaning": "【名】坂、傾斜", "pos": "名", "example": "Steep slope.", "phrase": "ski slope", "set": 1},
    {"word": "slot", "meaning": "【名】細長い穴、時間枠", "pos": "名", "example": "Coin slot.", "phrase": "time slot", "set": 1},
    {"word": "slow", "meaning": "【副】遅く", "pos": "副", "example": "Go slow.", "phrase": "drive slow", "set": 1},
    {"word": "slow", "meaning": "【動】遅くする", "pos": "動", "example": "Slow down.", "phrase": "slow traffic", "set": 1},
    {"word": "smell", "meaning": "【動】においがする", "pos": "動", "example": "Smell good.", "phrase": "smell a rat", "set": 1},
    {"word": "smile", "meaning": "【動】微笑む", "pos": "動", "example": "Smile at him.", "phrase": "smile back", "set": 1},
    {"word": "smoker", "meaning": "【名】喫煙者", "pos": "名", "example": "Heavy smoker.", "phrase": "non-smoker", "set": 1},
    {"word": "sneeze", "meaning": "【名】くしゃみ", "pos": "名", "example": "Loud sneeze.", "phrase": "suppress a sneeze", "set": 1}
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
