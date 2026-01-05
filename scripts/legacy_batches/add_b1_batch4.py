
import json
import re
import os

# B1 Batch 4 (Words 251-400, "boom" to "coastal")
new_words = [
    {"word": "boom", "meaning": "【名】好景気、ブーム", "pos": "名", "example": "The economy is experiencing a boom.", "phrase": "baby boom", "set": 1},
    {"word": "boot", "meaning": "【名】ブーツ、長靴", "pos": "名", "example": "She bought a pair of leather boots.", "phrase": "hiking boots", "set": 1},
    {"word": "border", "meaning": "【名】国境、境界", "pos": "名", "example": "We crossed the border into Canada.", "phrase": "cross the border", "set": 1},
    {"word": "bore", "meaning": "【動】退屈させる", "pos": "動", "example": "His stories bore me.", "phrase": "bore someone to death", "set": 1},
    {"word": "boredom", "meaning": "【名】退屈", "pos": "名", "example": "He sighed with boredom.", "phrase": "die of boredom", "set": 1},
    {"word": "bother", "meaning": "【名】面倒、厄介", "pos": "名", "example": "It's too much bother.", "phrase": "no bother", "set": 1},
    {"word": "bounce", "meaning": "【動】跳ねる", "pos": "動", "example": "The ball bounced off the wall.", "phrase": "bounce back", "set": 1},
    {"word": "bound", "meaning": "【形】縛られた、行きの", "pos": "形", "example": "The train is bound for Tokyo.", "phrase": "bound for", "set": 1},
    {"word": "bow", "meaning": "【名】弓", "pos": "名", "example": "He shot an arrow from his bow.", "phrase": "bow and arrow", "set": 1},
    {"word": "bowl", "meaning": "【動】ボウリングをする", "pos": "動", "example": "Let's go bowling.", "phrase": "bowl a strike", "set": 1},
    {"word": "boxing", "meaning": "【名】ボクシング", "pos": "名", "example": "He likes watching boxing matches.", "phrase": "boxing glove", "set": 1},
    {"word": "bracelet", "meaning": "【名】ブレスレット", "pos": "名", "example": "She wore a gold bracelet.", "phrase": "charm bracelet", "set": 1},
    {"word": "brainstorming", "meaning": "【名】ブレインストーミング", "pos": "名", "example": "We had a brainstorming session.", "phrase": "brainstorming ideas", "set": 1},
    {"word": "branch", "meaning": "【動】枝分かれする", "pos": "動", "example": "The road branches off to the left.", "phrase": "branch out", "set": 1},
    {"word": "brand-new", "meaning": "【形】新品の", "pos": "形", "example": "He bought a brand-new car.", "phrase": "brand-new condition", "set": 1},
    {"word": "brass", "meaning": "【名】真鍮", "pos": "名", "example": "The door handle is made of brass.", "phrase": "brass band", "set": 1},
    {"word": "bravely", "meaning": "【副】勇敢に", "pos": "副", "example": "He fought bravely.", "phrase": "face bravely", "set": 1},
    {"word": "breakthrough", "meaning": "【名】画期的な進歩、突破口", "pos": "名", "example": "Scientists made a major breakthrough.", "phrase": "medical breakthrough", "set": 1},
    {"word": "breast", "meaning": "【名】胸", "pos": "名", "example": "She held the baby to her breast.", "phrase": "breast cancer", "set": 1},
    {"word": "breath", "meaning": "【名】息、呼吸", "pos": "名", "example": "Take a deep breath.", "phrase": "out of breath", "set": 1},
    {"word": "breathless", "meaning": "【形】息切れして", "pos": "形", "example": "I was breathless after running.", "phrase": "leave someone breathless", "set": 1},
    {"word": "breed", "meaning": "【動】繁殖させる、飼育する", "pos": "動", "example": "They breed horses.", "phrase": "breed cattle", "set": 1},
    {"word": "breeding", "meaning": "【名】繁殖、育ち", "pos": "名", "example": "The breeding of pandas is difficult.", "phrase": "good breeding", "set": 1},
    {"word": "brick", "meaning": "【名】レンガ", "pos": "名", "example": "The house is built of brick.", "phrase": "brick wall", "set": 1},
    {"word": "brief", "meaning": "【形】短時間の、簡潔な", "pos": "形", "example": "We had a brief meeting.", "phrase": "in brief", "set": 1},
    {"word": "briefly", "meaning": "【副】手短に", "pos": "副", "example": "She spoke briefly about her trip.", "phrase": "briefly explain", "set": 1},
    {"word": "brightly", "meaning": "【副】明るく", "pos": "副", "example": "The sun shone brightly.", "phrase": "smile brightly", "set": 1},
    {"word": "broad", "meaning": "【形】広い", "pos": "形", "example": "He has broad shoulders.", "phrase": "broad daylight", "set": 1},
    {"word": "broadcast", "meaning": "【名】放送", "pos": "名", "example": "Listen to the news broadcast.", "phrase": "live broadcast", "set": 1},
    {"word": "broccoli", "meaning": "【名】ブロッコリー", "pos": "名", "example": "Eat your broccoli.", "phrase": "steamed broccoli", "set": 1},
    {"word": "bronze", "meaning": "【名】青銅、銅", "pos": "名", "example": "He won a bronze medal.", "phrase": "bronze statue", "set": 1},
    {"word": "brotherhood", "meaning": "【名】兄弟関係、連帯", "pos": "名", "example": "They swore an oath of brotherhood.", "phrase": "universal brotherhood", "set": 1},
    {"word": "bubble", "meaning": "【名】泡", "pos": "名", "example": "Children love blowing bubbles.", "phrase": "bubble bath", "set": 1},
    {"word": "buddy", "meaning": "【名】相棒、親友", "pos": "名", "example": "He's my best buddy.", "phrase": "Hey buddy", "set": 1},
    {"word": "builder", "meaning": "【名】建築業者", "pos": "名", "example": "We hired a builder to fix the roof.", "phrase": "master builder", "set": 1},
    {"word": "bull", "meaning": "【名】雄牛", "pos": "名", "example": "Be careful of the bull.", "phrase": "bull market", "set": 1},
    {"word": "bullet", "meaning": "【名】銃弾", "pos": "名", "example": "The bullet missed him.", "phrase": "bullet train", "set": 1},
    {"word": "bulletin", "meaning": "【名】掲示、速報", "pos": "名", "example": "Read the bulletin board.", "phrase": "news bulletin", "set": 1},
    {"word": "bump", "meaning": "【動】ぶつかる", "pos": "動", "example": "I bumped into an old friend.", "phrase": "bump into", "set": 1},
    {"word": "bunch", "meaning": "【名】房、束", "pos": "名", "example": "She bought a bunch of flowers.", "phrase": "a bunch of", "set": 1},
    {"word": "burden", "meaning": "【名】重荷、負担", "pos": "名", "example": "I don't want to be a burden.", "phrase": "burden of proof", "set": 1},
    {"word": "bureau", "meaning": "【名】案内所、局", "pos": "名", "example": "Ask at the information bureau.", "phrase": "travel bureau", "set": 1},
    {"word": "burglar", "meaning": "【名】強盗", "pos": "名", "example": "The burglar broke the window.", "phrase": "burglar alarm", "set": 1},
    {"word": "burn", "meaning": "【動】燃える、焦げる", "pos": "動", "example": "The fire burnt brightly.", "phrase": "burn down", "set": 1},
    {"word": "burning", "meaning": "【形】燃えている", "pos": "形", "example": "I smelled something burning.", "phrase": "burning desire", "set": 1},
    {"word": "burst", "meaning": "【動】破裂する", "pos": "動", "example": "The balloon burst.", "phrase": "burst into tears", "set": 1},
    {"word": "bust", "meaning": "【動】壊す、破産させる", "pos": "動", "example": "The police busted the drug ring.", "phrase": "go bust", "set": 1},
    {"word": "but", "meaning": "【前】～を除いて", "pos": "前", "example": "Everyone but him went.", "phrase": "nothing but", "set": 1},
    {"word": "butcher", "meaning": "【名】肉屋", "pos": "名", "example": "Buy some meat at the butcher's.", "phrase": "the butcher's", "set": 1},
    {"word": "buyer", "meaning": "【名】買い手", "pos": "名", "example": "We found a buyer for our house.", "phrase": "potential buyer", "set": 1},
    {"word": "cabbage", "meaning": "【名】キャベツ", "pos": "名", "example": "I like cabbage salad.", "phrase": "red cabbage", "set": 1},
    {"word": "cabin", "meaning": "【名】小屋、客室", "pos": "名", "example": "We stayed in a log cabin.", "phrase": "cabin crew", "set": 1},
    {"word": "cage", "meaning": "【名】檻、鳥かご", "pos": "名", "example": "The lion was in a cage.", "phrase": "bird cage", "set": 1},
    {"word": "calculate", "meaning": "【動】計算する", "pos": "動", "example": "Calculate the total cost.", "phrase": "calculate distance", "set": 1},
    {"word": "calculation", "meaning": "【名】計算", "pos": "名", "example": "I made a mistake in my calculation.", "phrase": "do a calculation", "set": 1},
    {"word": "calculator", "meaning": "【名】電卓", "pos": "名", "example": "Use a calculator.", "phrase": "pocket calculator", "set": 1},
    {"word": "calf", "meaning": "【名】子牛、ふくらはぎ", "pos": "名", "example": "The cow had a calf.", "phrase": "calf muscle", "set": 1},
    {"word": "caller", "meaning": "【名】電話をかける人、訪問客", "pos": "名", "example": "The caller didn't leave a name.", "phrase": "unknown caller", "set": 1},
    {"word": "calm", "meaning": "【形】穏やかな", "pos": "形", "example": "Stay calm.", "phrase": "keep calm", "set": 1},
    {"word": "calmness", "meaning": "【名】静けさ、沈着", "pos": "名", "example": "I admired his calmness.", "phrase": "restore calmness", "set": 1},
    {"word": "camel", "meaning": "【名】ラクダ", "pos": "名", "example": "Camels can survive without water.", "phrase": "ride a camel", "set": 1},
    {"word": "campsite", "meaning": "【名】キャンプ場", "pos": "名", "example": "We pitched our tent at the campsite.", "phrase": "campsite facilities", "set": 1},
    {"word": "canal", "meaning": "【名】運河 (skip candidate)", "pos": "名", "example": "We walked along the canal.", "phrase": "Suez Canal", "set": 1},
    {"word": "cancel", "meaning": "【動】取り消す", "pos": "動", "example": "The flight was cancelled.", "phrase": "cancel a reservation", "set": 1},
    {"word": "cancer", "meaning": "【名】癌", "pos": "名", "example": "Smoking causes cancer.", "phrase": "lung cancer", "set": 1},
    {"word": "candle", "meaning": "【名】ろうそく (skip candidate)", "pos": "名", "example": "Light a candle.", "phrase": "candle light", "set": 1},
    {"word": "canned", "meaning": "【形】缶詰の", "pos": "形", "example": "I bought some canned fruit.", "phrase": "canned food", "set": 1},
    {"word": "canteen", "meaning": "【名】食堂、水筒", "pos": "名", "example": "We eat lunch in the canteen.", "phrase": "school canteen", "set": 1},
    {"word": "capable", "meaning": "【形】有能な、～できる", "pos": "形", "example": "He is capable of doing it.", "phrase": "capable of", "set": 1},
    {"word": "capacity", "meaning": "【名】容量、能力", "pos": "名", "example": "The stadium has a large capacity.", "phrase": "full capacity", "set": 1},
    {"word": "capsule", "meaning": "【名】カプセル", "pos": "名", "example": "Take one capsule a day.", "phrase": "time capsule", "set": 1},
    {"word": "capture", "meaning": "【名】捕獲", "pos": "名", "example": "The capture of the criminal.", "phrase": "avoid capture", "set": 1},
    {"word": "capture", "meaning": "【動】捕らえる", "pos": "動", "example": "The army captured the city.", "phrase": "capture attention", "set": 1},
    {"word": "care", "meaning": "【動】気にかける", "pos": "動", "example": "I don't care about the price.", "phrase": "care for", "set": 1},
    {"word": "career", "meaning": "【名】経歴 (skip candidate)", "pos": "名", "example": "He has a successful career.", "phrase": "career path", "set": 1},
    {"word": "careless", "meaning": "【形】不注意な", "pos": "形", "example": "It was a careless mistake.", "phrase": "careless driving", "set": 1},
    {"word": "carelessly", "meaning": "【副】不注意に", "pos": "副", "example": "He drove carelessly.", "phrase": "carelessly tossed", "set": 1},
    {"word": "carelessness", "meaning": "【名】不注意", "pos": "名", "example": "The accident was caused by carelessness.", "phrase": "act of carelessness", "set": 1},
    {"word": "carpet", "meaning": "【名】カーペット (skip candidate)", "pos": "名", "example": "The carpet is dirty.", "phrase": "red carpet", "set": 1},
    {"word": "carriage", "meaning": "【名】馬車、客車", "pos": "名", "example": "The queen rode in a carriage.", "phrase": "railway carriage", "set": 1},
    {"word": "carton", "meaning": "【名】紙パック、箱", "pos": "名", "example": "A carton of milk.", "phrase": "milk carton", "set": 1},
    {"word": "cashpoint", "meaning": "【名】現金自動預払機（ATM）", "pos": "名", "example": "I need to go to a cashpoint.", "phrase": "find a cashpoint", "set": 1},
    {"word": "casual", "meaning": "【形】何気ない、略式の", "pos": "形", "example": "Wear casual clothes.", "phrase": "casual wear", "set": 1},
    {"word": "categorise", "meaning": "【動】分類する", "pos": "動", "example": "Categorise these books.", "phrase": "categorise into", "set": 1},
    {"word": "categorize", "meaning": "【動】分類する（米）", "pos": "動", "example": "Categorize the data.", "phrase": "categorize by", "set": 1},
    {"word": "category", "meaning": "【名】範疇、カテゴリー", "pos": "名", "example": "Which category does this fall into?", "phrase": "category list", "set": 1},
    {"word": "cattle", "meaning": "【名】畜牛", "pos": "名", "example": "The ranch has many cattle.", "phrase": "cattle ranch", "set": 1},
    {"word": "caution", "meaning": "【名】用心、警告", "pos": "名", "example": "Proceed with caution.", "phrase": "exercise caution", "set": 1},
    {"word": "cautious", "meaning": "【形】用心深い", "pos": "形", "example": "He is a cautious driver.", "phrase": "be cautious about", "set": 1},
    {"word": "cave", "meaning": "【名】洞窟", "pos": "名", "example": "Bears live in caves.", "phrase": "explore a cave", "set": 1},
    {"word": "CD-ROM", "meaning": "【名】CD-ROM", "pos": "名", "example": "Insert the CD-ROM.", "phrase": "CD-ROM drive", "set": 1},
    {"word": "celebrity", "meaning": "【名】有名人", "pos": "名", "example": "He is a TV celebrity.", "phrase": "local celebrity", "set": 1},
    {"word": "cell", "meaning": "【名】細胞、独房", "pos": "名", "example": "Red blood cells.", "phrase": "cell phone", "set": 1},
    {"word": "central", "meaning": "【形】中央の", "pos": "形", "example": "The station is in central London.", "phrase": "central heating", "set": 1},
    {"word": "central heating", "meaning": "【名】セントラルヒーティング", "pos": "名", "example": "The house has central heating.", "phrase": "turn on central heating", "set": 1},
    {"word": "ceremony", "meaning": "【名】儀式 (skip candidate)", "pos": "名", "example": "The wedding ceremony.", "phrase": "opening ceremony", "set": 1},
    {"word": "certainty", "meaning": "【名】確実性", "pos": "名", "example": "There is no certainty.", "phrase": "with certainty", "set": 1},
    {"word": "challenging", "meaning": "【形】やりがいのある、困難な", "pos": "形", "example": "This job is challenging.", "phrase": "challenging task", "set": 1},
    {"word": "champion", "meaning": "【名】チャンピオン", "pos": "名", "example": "He is the world champion.", "phrase": "reigning champion", "set": 1},
    {"word": "channel", "meaning": "【名】海峡、チャンネル", "pos": "名", "example": "Change the TV channel.", "phrase": "English Channel", "set": 1},
    {"word": "chaos", "meaning": "【名】大混乱", "pos": "名", "example": "The city was in chaos.", "phrase": "total chaos", "set": 1},
    {"word": "characterise", "meaning": "【動】特徴づける", "pos": "動", "example": "The era was characterised by peace.", "phrase": "characterise as", "set": 1},
    {"word": "characteristic", "meaning": "【名】特徴", "pos": "名", "example": "It is a characteristic of this species.", "phrase": "defining characteristic", "set": 1},
    {"word": "characterize", "meaning": "【動】特徴づける（米）", "pos": "動", "example": "How would you characterize him?", "phrase": "characterize the situation", "set": 1},
    {"word": "charge", "meaning": "【名】料金、責任", "pos": "名", "example": "Admission charge is $10.", "phrase": "in charge of", "set": 1},
    {"word": "charge", "meaning": "【動】請求する、充電する", "pos": "動", "example": "They charged me $50.", "phrase": "charge a battery", "set": 1},
    {"word": "chariot", "meaning": "【名】（古代の）戦車", "pos": "名", "example": "Roman chariot races.", "phrase": "ride a chariot", "set": 1},
    {"word": "charity", "meaning": "【名】慈善", "pos": "名", "example": "He gives money to charity.", "phrase": "charity event", "set": 1},
    {"word": "charm", "meaning": "【名】魅力", "pos": "名", "example": "She has a lot of charm.", "phrase": "good luck charm", "set": 1},
    {"word": "chase", "meaning": "【名】追跡", "pos": "名", "example": "The police car chase.", "phrase": "wild goose chase", "set": 1},
    {"word": "chat", "meaning": "【名】おしゃべり", "pos": "名", "example": "We had a nice chat.", "phrase": "chat room", "set": 1},
    {"word": "chat show", "meaning": "【名】トークショー", "pos": "名", "example": "I saw him on a chat show.", "phrase": "host a chat show", "set": 1},
    {"word": "check-in", "meaning": "【名】チェックイン", "pos": "名", "example": "The check-in time is 3 PM.", "phrase": "check-in counter", "set": 1},
    {"word": "checkout", "meaning": "【名】レジ、チェックアウト", "pos": "名", "example": "Pay at the checkout.", "phrase": "checkout counter", "set": 1},
    {"word": "cheerful", "meaning": "【形】快活な", "pos": "形", "example": "She is always cheerful.", "phrase": "cheerful smile", "set": 1},
    {"word": "chemical", "meaning": "【名】化学物質", "pos": "名", "example": "Dangerous chemicals.", "phrase": "chemical reaction", "set": 1},
    {"word": "chemist", "meaning": "【名】薬剤師、化学者", "pos": "名", "example": "Ask the chemist for advice.", "phrase": "at the chemist's", "set": 1},
    {"word": "chemistry", "meaning": "【名】化学", "pos": "名", "example": "I study chemistry.", "phrase": "organic chemistry", "set": 1},
    {"word": "cherish", "meaning": "【動】大事にする", "pos": "動", "example": "Cherish the memory.", "phrase": "cherish a hope", "set": 1},
    {"word": "chest of drawers", "meaning": "【名】タンス", "pos": "名", "example": "Put your clothes in the chest of drawers.", "phrase": "wooden chest of drawers", "set": 1},
    {"word": "chewing gum", "meaning": "【名】チューインガム", "pos": "名", "example": "Don't swallow chewing gum.", "phrase": "piece of chewing gum", "set": 1},
    {"word": "chief", "meaning": "【形】主な、最高位の", "pos": "形", "example": "The chief reason is money.", "phrase": "chief executive", "set": 1},
    {"word": "choir", "meaning": "【名】聖歌隊、合唱団", "pos": "名", "example": "She sings in the church choir.", "phrase": "join a choir", "set": 1},
    {"word": "choke", "meaning": "【動】窒息させる、詰まらせる", "pos": "動", "example": "He choked on a piece of bread.", "phrase": "choke back tears", "set": 1},
    {"word": "Christian", "meaning": "【形】キリスト教の", "pos": "形", "example": "Christian holidays.", "phrase": "Christian name", "set": 1},
    {"word": "chronological", "meaning": "【形】年代順の", "pos": "形", "example": "In chronological order.", "phrase": "chronological age", "set": 1},
    {"word": "chuckle", "meaning": "【名】くすくす笑い", "pos": "名", "example": "He gave a soft chuckle.", "phrase": "have a chuckle", "set": 1},
    {"word": "circle", "meaning": "【動】旋回する、囲む", "pos": "動", "example": "The plane circled the airport.", "phrase": "circle the answer", "set": 1},
    {"word": "circular", "meaning": "【形】円形の", "pos": "形", "example": "A circular table.", "phrase": "circular motion", "set": 1},
    {"word": "circus", "meaning": "【名】サーカス", "pos": "名", "example": "We went to the circus.", "phrase": "circus tent", "set": 1},
    {"word": "citizenship", "meaning": "【名】市民権", "pos": "名", "example": "He applied for citizenship.", "phrase": "dual citizenship", "set": 1},
    {"word": "civil", "meaning": "【形】市民の、国内の", "pos": "形", "example": "Civil rights.", "phrase": "civil war", "set": 1},
    {"word": "civilisation", "meaning": "【名】文明", "pos": "名", "example": "Ancient civilisation.", "phrase": "western civilisation", "set": 1},
    {"word": "civilization", "meaning": "【名】文明（米）", "pos": "名", "example": "Modern civilization.", "phrase": "cradle of civilization", "set": 1},
    {"word": "claim", "meaning": "【名】主張、請求", "pos": "名", "example": "Make a claim for damages.", "phrase": "lay claim to", "set": 1},
    {"word": "classical", "meaning": "【形】古典の", "pos": "形", "example": "I like classical music.", "phrase": "classical literature", "set": 1},
    {"word": "classify", "meaning": "【動】分類する", "pos": "動", "example": "Classify them by size.", "phrase": "classify as", "set": 1},
    {"word": "clear", "meaning": "【動】片付ける、晴れる", "pos": "動", "example": "Clear the table.", "phrase": "clear up", "set": 1},
    {"word": "click", "meaning": "【名】クリック音", "pos": "名", "example": "I heard a click.", "phrase": "mouse click", "set": 1},
    {"word": "cliff", "meaning": "【名】崖", "pos": "名", "example": "Don't go near the cliff edge.", "phrase": "steep cliff", "set": 1},
    {"word": "climate", "meaning": "【名】気候", "pos": "名", "example": "The climate here is mild.", "phrase": "climate change", "set": 1},
    {"word": "climber", "meaning": "【名】登山者", "pos": "名", "example": "Mountain climbers.", "phrase": "rock climber", "set": 1},
    {"word": "clinic", "meaning": "【名】診療所", "pos": "名", "example": "He went to a dental clinic.", "phrase": "health clinic", "set": 1},
    {"word": "clip", "meaning": "【名】クリップ、切り抜き", "pos": "名", "example": "Paper clip.", "phrase": "video clip", "set": 1},
    {"word": "closely", "meaning": "【副】密接に、綿密に", "pos": "副", "example": "Listen closely.", "phrase": "closely related", "set": 1},
    {"word": "coal", "meaning": "【名】石炭", "pos": "名", "example": "They burn coal for heat.", "phrase": "coal mine", "set": 1},
    {"word": "coast", "meaning": "【動】惰走する、沿岸を航行する", "pos": "動", "example": "The car coasted down the hill.", "phrase": "coast to coast", "set": 1},
    {"word": "coastal", "meaning": "【形】沿岸の", "pos": "形", "example": "Coastal areas.", "phrase": "coastal town", "set": 1}
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
skipped_count = 0
for w in new_words:
    if w["word"] in existing_words:
        print(f"Skipping duplicate: {w['word']}")
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
