
import json
import re
import os

# B1 Batch 5 (Words 401-550, "cod" to "decline")
new_words = [
    {"word": "cod", "meaning": "【名】タラ", "pos": "名", "example": "Fish and chips is often made with cod.", "phrase": "cod fillet", "set": 1},
    {"word": "coffin", "meaning": "【名】棺", "pos": "名", "example": "They carried the coffin to the grave.", "phrase": "wooden coffin", "set": 1},
    {"word": "collapse", "meaning": "【名】崩壊、倒壊", "pos": "名", "example": "The collapse of the bridge was sudden.", "phrase": "economic collapse", "set": 1},
    # collapse (verb) exists in B1 CSV next lines? No, checked list, only noun listed at 403.
    # Actually CSV often lists same word multiple times if POS or meaning differs.
    # Looking at CSV: 403 is noun.
    
    {"word": "collar", "meaning": "【名】襟、首輪", "pos": "名", "example": "He turned up his collar.", "phrase": "dog collar", "set": 1},
    {"word": "columnist", "meaning": "【名】コラムニスト", "pos": "名", "example": "She is a famous newspaper columnist.", "phrase": "guest columnist", "set": 1},
    {"word": "combination", "meaning": "【名】組み合わせ", "pos": "名", "example": "A delicious combination of flavors.", "phrase": "in combination with", "set": 1},
    {"word": "combine", "meaning": "【動】結合する、兼ね備える", "pos": "動", "example": "Combine flour and sugar.", "phrase": "combine business with pleasure", "set": 1},
    {"word": "comedian", "meaning": "【名】コメディアン", "pos": "名", "example": "The comedian made everyone laugh.", "phrase": "stand-up comedian", "set": 1},
    {"word": "comedy", "meaning": "【名】喜劇、コメディ", "pos": "名", "example": "I prefer comedy to tragedy.", "phrase": "comedy show", "set": 1},
    {"word": "comet", "meaning": "【名】彗星", "pos": "名", "example": "Halley's Comet appears every 76 years.", "phrase": "comet tail", "set": 1},
    {"word": "comfort", "meaning": "【名】快適さ、慰め", "pos": "名", "example": "Live in comfort.", "phrase": "offer comfort", "set": 1},
    {"word": "comma", "meaning": "【名】コンマ", "pos": "名", "example": "Use a comma here.", "phrase": "comma splice", "set": 1},
    {"word": "command", "meaning": "【名】命令、指揮", "pos": "名", "example": "He took command of the army.", "phrase": "under command", "set": 1},
    {"word": "comment", "meaning": "【名】論評、コメント", "pos": "名", "example": "No comment.", "phrase": "make a comment", "set": 1},
    {"word": "commercial", "meaning": "【形】商業の", "pos": "形", "example": "The film was a commercial success.", "phrase": "commercial break", "set": 1},
    {"word": "commit", "meaning": "【動】犯す、委ねる", "pos": "動", "example": "Commit a crime.", "phrase": "commit suicide", "set": 1},
    {"word": "common sense", "meaning": "【名】常識", "pos": "名", "example": "Use your common sense.", "phrase": "lack common sense", "set": 1},
    {"word": "commonly", "meaning": "【副】一般に", "pos": "副", "example": "It is commonly known as...", "phrase": "commonly used", "set": 1},
    {"word": "companion", "meaning": "【名】仲間、連れ", "pos": "名", "example": "A travelling companion.", "phrase": "faithful companion", "set": 1},
    {"word": "comparison", "meaning": "【名】比較", "pos": "名", "example": "In comparison with last year.", "phrase": "make a comparison", "set": 1},
    {"word": "compete", "meaning": "【動】競争する", "pos": "動", "example": "Athletes compete for medals.", "phrase": "compete with", "set": 1},
    {"word": "competitive", "meaning": "【形】競争の、競争力のある", "pos": "形", "example": "A competitive market.", "phrase": "competitive price", "set": 1},
    {"word": "competitor", "meaning": "【名】競争相手", "pos": "名", "example": "Our main competitor.", "phrase": "beat a competitor", "set": 1},
    {"word": "complement", "meaning": "【名】補完物、補語", "pos": "名", "example": "Wine is a perfect complement to cheese.", "phrase": "full complement", "set": 1},
    {"word": "complete", "meaning": "【動】完了する", "pos": "動", "example": "Complete the form.", "phrase": "complete a task", "set": 1},
    {"word": "completely", "meaning": "【副】完全に", "pos": "副", "example": "I completely forgot.", "phrase": "completely different", "set": 1},
    {"word": "complex", "meaning": "【形】複雑な", "pos": "形", "example": "A complex problem.", "phrase": "complex structure", "set": 1},
    {"word": "complicate", "meaning": "【動】複雑にする", "pos": "動", "example": "Don't complicate things.", "phrase": "complicate matters", "set": 1},
    {"word": "complicated", "meaning": "【形】複雑な", "pos": "形", "example": "It's a complicated situation.", "phrase": "complicated relationship", "set": 1},
    {"word": "compliment", "meaning": "【名】賛辞、褒め言葉", "pos": "名", "example": "Pay someone a compliment.", "phrase": "fish for compliments", "set": 1},
    {"word": "compose", "meaning": "【動】構成する、作曲する", "pos": "動", "example": "Water is composed of hydrogen and oxygen.", "phrase": "compose music", "set": 1},
    {"word": "composition", "meaning": "【名】構成、作文", "pos": "名", "example": "The composition of the soil.", "phrase": "write a composition", "set": 1},
    {"word": "compound", "meaning": "【名】化合物、複合語", "pos": "名", "example": "Chemical compound.", "phrase": "compound interest", "set": 1},
    {"word": "compromise", "meaning": "【名】妥協", "pos": "名", "example": "Reach a compromise.", "phrase": "make a compromise", "set": 1},
    {"word": "concentration", "meaning": "【名】集中（力）、濃度", "pos": "名", "example": "It requires total concentration.", "phrase": "concentration camp", "set": 1},
    {"word": "concept", "meaning": "【名】概念", "pos": "名", "example": "The concept of freedom.", "phrase": "abstract concept", "set": 1},
    {"word": "concerned", "meaning": "【形】心配して、関心を持って", "pos": "形", "example": "I'm concerned about his health.", "phrase": "as far as I'm concerned", "set": 1},
    {"word": "conclude", "meaning": "【動】結論を下す、締めくくる", "pos": "動", "example": "He concluded his speech.", "phrase": "conclude that", "set": 1},
    {"word": "conclusion", "meaning": "【名】結論", "pos": "名", "example": "Come to a conclusion.", "phrase": "in conclusion", "set": 1},
    {"word": "conduct", "meaning": "【名】行い、管理", "pos": "名", "example": "Code of conduct.", "phrase": "good conduct", "set": 1},
    {"word": "confidence", "meaning": "【名】自信、信頼", "pos": "名", "example": "He lacks confidence.", "phrase": "with confidence", "set": 1},
    {"word": "confirm", "meaning": "【動】確認する", "pos": "動", "example": "Please confirm your reservation.", "phrase": "confirm a booking", "set": 1},
    {"word": "confirmation", "meaning": "【名】確認", "pos": "名", "example": "I received confirmation by email.", "phrase": "booking confirmation", "set": 1},
    {"word": "conflict", "meaning": "【名】衝突、紛争", "pos": "名", "example": "Armed conflict.", "phrase": "conflict of interest", "set": 1},
    {"word": "confusing", "meaning": "【形】混乱させるような", "pos": "形", "example": "The instructions were confusing.", "phrase": "confusing situation", "set": 1},
    {"word": "confusion", "meaning": "【名】混乱", "pos": "名", "example": "There was a lot of confusion.", "phrase": "cause confusion", "set": 1},
    {"word": "congratulate", "meaning": "【動】祝う", "pos": "動", "example": "I congratulated him on his success.", "phrase": "congratulate someone", "set": 1},
    {"word": "connect", "meaning": "【動】つなぐ、接続する", "pos": "動", "example": "Connect the printer to the computer.", "phrase": "connect with", "set": 1},
    {"word": "connection", "meaning": "【名】つながり、関係", "pos": "名", "example": "Is there a connection?", "phrase": "internet connection", "set": 1},
    {"word": "connexion", "meaning": "【名】関係（connectionの英綴り）", "pos": "名", "example": "In this connexion.", "phrase": "establish a connexion", "set": 1},
    {"word": "conquer", "meaning": "【動】征服する、克服する", "pos": "動", "example": "Conquer a mountain.", "phrase": "divide and conquer", "set": 1},
    {"word": "conscious", "meaning": "【形】意識して", "pos": "形", "example": "He was conscious of being watched.", "phrase": "become conscious", "set": 1},
    {"word": "consequently", "meaning": "【副】その結果", "pos": "副", "example": "It rained, consequently the game was cancelled.", "phrase": "consequently", "set": 1},
    {"word": "conservation", "meaning": "【名】保護、保存", "pos": "名", "example": "Wildlife conservation.", "phrase": "energy conservation", "set": 1},
    {"word": "conservative", "meaning": "【形】保守的な", "pos": "形", "example": "He has conservative views.", "phrase": "Conservative Party", "set": 1},
    {"word": "considerable", "meaning": "【形】かなりの", "pos": "形", "example": "A considerable amount of money.", "phrase": "considerable effort", "set": 1},
    {"word": "consideration", "meaning": "【名】考慮", "pos": "名", "example": "Take into consideration.", "phrase": "under consideration", "set": 1},
    {"word": "consonant", "meaning": "【名】子音", "pos": "名", "example": "Vowels and consonants.", "phrase": "consonant sound", "set": 1},
    {"word": "constantly", "meaning": "【副】絶えず", "pos": "副", "example": "He interrupts me constantly.", "phrase": "constantly changing", "set": 1},
    {"word": "constitute", "meaning": "【動】構成する", "pos": "動", "example": "Seven days constitute a week.", "phrase": "constitute a threat", "set": 1},
    {"word": "constitution", "meaning": "【名】憲法、構成", "pos": "名", "example": "The American Constitution.", "phrase": "written constitution", "set": 1},
    {"word": "construct", "meaning": "【動】建設する", "pos": "動", "example": "Construct a building.", "phrase": "construct a theory", "set": 1},
    {"word": "construction", "meaning": "【名】建設", "pos": "名", "example": "Under construction.", "phrase": "construction site", "set": 1},
    {"word": "consume", "meaning": "【動】消費する", "pos": "動", "example": "This car consumes a lot of fuel.", "phrase": "consume time", "set": 1},
    {"word": "consumer", "meaning": "【名】消費者", "pos": "名", "example": "Consumer rights.", "phrase": "consumer electronics", "set": 1},
    {"word": "consumption", "meaning": "【名】消費", "pos": "名", "example": "Alcohol consumption.", "phrase": "energy consumption", "set": 1},
    {"word": "contain", "meaning": "【動】含む、入っている", "pos": "動", "example": "This box contains books.", "phrase": "contain information", "set": 1},
    {"word": "content", "meaning": "【名】内容、中身", "pos": "名", "example": "The content of the letter.", "phrase": "table of contents", "set": 1},
    {"word": "continual", "meaning": "【形】断続的な、頻繁な", "pos": "形", "example": "Continual interruptions.", "phrase": "continual rain", "set": 1},
    {"word": "continually", "meaning": "【副】頻繁に、絶えず", "pos": "副", "example": "It rains continually.", "phrase": "continually changing", "set": 1},
    {"word": "continuous", "meaning": "【形】途切れない、連続的な", "pos": "形", "example": "Continuous improvement.", "phrase": "continuous line", "set": 1},
    {"word": "continuously", "meaning": "【副】途切れなく", "pos": "副", "example": "It rained continuously for two days.", "phrase": "continuously improve", "set": 1},
    {"word": "contrary", "meaning": "【形】反対の", "pos": "形", "example": "On the contrary.", "phrase": "contrary to", "set": 1},
    {"word": "contribute", "meaning": "【動】寄付する、貢献する", "pos": "動", "example": "Contribute money to the fund.", "phrase": "contribute to", "set": 1},
    {"word": "contribution", "meaning": "【名】寄付、貢献", "pos": "名", "example": "Make a contribution.", "phrase": "valuable contribution", "set": 1},
    {"word": "control", "meaning": "【動】支配する、制御する", "pos": "動", "example": "Can you control the situation?", "phrase": "control power", "set": 1},
    {"word": "controversial", "meaning": "【形】論争の的となる", "pos": "形", "example": "A controversial topic.", "phrase": "highly controversial", "set": 1},
    {"word": "convey", "meaning": "【動】運ぶ、伝える", "pos": "動", "example": "Convey my best wishes.", "phrase": "convey a message", "set": 1},
    {"word": "convince", "meaning": "【動】納得させる", "pos": "動", "example": "I convinced him to go.", "phrase": "convince someone of", "set": 1},
    {"word": "copyright", "meaning": "【名】著作権", "pos": "名", "example": "Copyright law.", "phrase": "infringe copyright", "set": 1},
    {"word": "correction", "meaning": "【名】訂正", "pos": "名", "example": "I made a correction.", "phrase": "correction pen", "set": 1},
    {"word": "cotton", "meaning": "【名】綿", "pos": "名", "example": "A cotton shirt.", "phrase": "100% cotton", "set": 1},
    {"word": "cough", "meaning": "【動】咳をする", "pos": "動", "example": "He has a bad cough.", "phrase": "cough up", "set": 1},
    {"word": "council", "meaning": "【名】会議、評議会", "pos": "名", "example": "City council.", "phrase": "council member", "set": 1},
    {"word": "counseling", "meaning": "【名】カウンセリング", "pos": "名", "example": "Marriage counseling.", "phrase": "seek counseling", "set": 1},
    {"word": "counselling", "meaning": "【名】カウンセリング（英綴り）", "pos": "名", "example": "She needs counselling.", "phrase": "counselling service", "set": 1},
    {"word": "count", "meaning": "【名】計算、総数", "pos": "名", "example": "A count of the votes.", "phrase": "lose count", "set": 1},
    {"word": "counter", "meaning": "【動】対抗する、反論する", "pos": "動", "example": "Counter an argument.", "phrase": "counter attack", "set": 1},
    {"word": "countless", "meaning": "【形】数え切れない", "pos": "形", "example": "Countless stars.", "phrase": "countless times", "set": 1},
    {"word": "county", "meaning": "【名】郡", "pos": "名", "example": "Orange County.", "phrase": "county court", "set": 1},
    {"word": "courage", "meaning": "【名】勇気", "pos": "名", "example": "Have the courage to say no.", "phrase": "pluck up courage", "set": 1},
    {"word": "courageous", "meaning": "【形】勇敢な", "pos": "形", "example": "A courageous act.", "phrase": "courageous leader", "set": 1},
    {"word": "courgette", "meaning": "【名】ズッキーニ", "pos": "名", "example": "Fried courgettes.", "phrase": "courgette slice", "set": 1},
    {"word": "craft", "meaning": "【名】工芸、技術", "pos": "名", "example": "Arts and crafts.", "phrase": "craft shop", "set": 1},
    {"word": "crash", "meaning": "【名】衝突、墜落", "pos": "名", "example": "A plane crash.", "phrase": "car crash", "set": 1},
    {"word": "crash", "meaning": "【動】衝突する", "pos": "動", "example": "The car crashed into a tree.", "phrase": "crash land", "set": 1},
    {"word": "creator", "meaning": "【名】創作者", "pos": "名", "example": "The creator of the series.", "phrase": "content creator", "set": 1},
    {"word": "criminal", "meaning": "【名】犯罪者", "pos": "名", "example": "He is a dangerous criminal.", "phrase": "criminal record", "set": 1},
    {"word": "crisis", "meaning": "【名】危機", "pos": "名", "example": "Economic crisis.", "phrase": "in crisis", "set": 1},
    {"word": "critic", "meaning": "【名】批評家", "pos": "名", "example": "A film critic.", "phrase": "art critic", "set": 1},
    {"word": "critical", "meaning": "【形】批判的な、重大な", "pos": "形", "example": "Critical condition.", "phrase": "critical thinking", "set": 1},
    {"word": "crop", "meaning": "【名】作物、収穫高", "pos": "名", "example": "A good crop of wheat.", "phrase": "cash crop", "set": 1},
    {"word": "crossing", "meaning": "【名】横断、踏切", "pos": "名", "example": "Pedestrian crossing.", "phrase": "railway crossing", "set": 1},
    {"word": "crossroads", "meaning": "【名】交差点、岐路", "pos": "名", "example": "At a crossroads.", "phrase": "reach a crossroads", "set": 1},
    {"word": "crow", "meaning": "【名】カラス", "pos": "名", "example": "A black crow.", "phrase": "as the crow flies", "set": 1},
    {"word": "cruel", "meaning": "【形】残酷な", "pos": "形", "example": "Cruel treatment.", "phrase": "cruel to animals", "set": 1},
    {"word": "crush", "meaning": "【名】押しつぶすこと、片思い", "pos": "名", "example": "Have a crush on someone.", "phrase": "crush barrier", "set": 1},
    {"word": "cucumber", "meaning": "【名】キュウリ", "pos": "名", "example": "Cucumber sandwich.", "phrase": "cool as a cucumber", "set": 1},
    {"word": "cultivate", "meaning": "【動】耕す、栽培する", "pos": "動", "example": "Cultivate the land.", "phrase": "cultivate plants", "set": 1},
    {"word": "cultural", "meaning": "【形】文化の", "pos": "形", "example": "Cultural heritage.", "phrase": "cultural differences", "set": 1},
    {"word": "cure", "meaning": "【名】治療法、治癒", "pos": "名", "example": "There is no cure for this disease.", "phrase": "find a cure", "set": 1},
    {"word": "curiosity", "meaning": "【名】好奇心", "pos": "名", "example": "Satisfy one's curiosity.", "phrase": "out of curiosity", "set": 1},
    {"word": "curious", "meaning": "【形】好奇心の強い、奇妙な", "pos": "形", "example": "I'm curious to know.", "phrase": "curious about", "set": 1},
    {"word": "curiously", "meaning": "【副】奇妙なことに", "pos": "副", "example": "Curiously enough.", "phrase": "look curiously", "set": 1},
    {"word": "curly", "meaning": "【形】巻き毛の", "pos": "形", "example": "Curly hair.", "phrase": "curly kale", "set": 1},
    {"word": "currency", "meaning": "【名】通貨", "pos": "名", "example": "Foreign currency.", "phrase": "hard currency", "set": 1},
    {"word": "current", "meaning": "【形】現在の", "pos": "形", "example": "Current events.", "phrase": "current affairs", "set": 1},
    {"word": "currently", "meaning": "【副】現在", "pos": "副", "example": "Currently unavailable.", "phrase": "currently working", "set": 1},
    {"word": "curriculum", "meaning": "【名】カリキュラム", "pos": "名", "example": "School curriculum.", "phrase": "national curriculum", "set": 1},
    {"word": "curtain", "meaning": "【名】カーテン (skip - duplicate)", "pos": "名", "example": "Draw the curtains.", "phrase": "curtain call", "set": 1},
    {"word": "curve", "meaning": "【名】曲線、カーブ", "pos": "名", "example": "A sharp curve in the road.", "phrase": "learning curve", "set": 1},
    {"word": "cushion", "meaning": "【名】クッション (skip - duplicate)", "pos": "名", "example": "Soft cushion.", "phrase": "cushion cover", "set": 1},
    {"word": "customs", "meaning": "【名】税関", "pos": "名", "example": "Go through customs.", "phrase": "customs officer", "set": 1},
    {"word": "cut", "meaning": "【名】切り傷、カット", "pos": "名", "example": "A cut on my finger.", "phrase": "tax cut", "set": 1},
    {"word": "CV", "meaning": "【名】履歴書", "pos": "名", "example": "Send your CV.", "phrase": "curriculum vitae", "set": 1},
    {"word": "cycle", "meaning": "【名】周期、自転車", "pos": "名", "example": "Life cycle.", "phrase": "cycle path", "set": 1},
    {"word": "cycle", "meaning": "【動】自転車に乗る", "pos": "動", "example": "He cycles to work.", "phrase": "cycle home", "set": 1},
    {"word": "daisy", "meaning": "【名】ヒナギク", "pos": "名", "example": "Pick daisies.", "phrase": "fresh as a daisy", "set": 1},
    {"word": "damage", "meaning": "【名】損害", "pos": "名", "example": "Cause damage.", "phrase": "brain damage", "set": 1},
    {"word": "damage", "meaning": "【動】損害を与える", "pos": "動", "example": "Smoking damages your health.", "phrase": "damaged goods", "set": 1},
    {"word": "damaged", "meaning": "【形】損傷した", "pos": "形", "example": "Damaged cars.", "phrase": "badly damaged", "set": 1},
    {"word": "damp", "meaning": "【形】湿っぽい", "pos": "形", "example": "Damp clothes.", "phrase": "damp proof", "set": 1},
    {"word": "dangerously", "meaning": "【副】危険なほど", "pos": "副", "example": "He drives dangerously.", "phrase": "dangerously close", "set": 1},
    {"word": "dare", "meaning": "【動】あえて～する", "pos": "動", "example": "How dare you!", "phrase": "dare to", "set": 1},
    {"word": "darkness", "meaning": "【名】暗闇", "pos": "名", "example": "Total darkness.", "phrase": "in darkness", "set": 1},
    {"word": "date", "meaning": "【動】日付を入れる、デートする", "pos": "動", "example": "The letter is dated today.", "phrase": "date someone", "set": 1},
    {"word": "dating", "meaning": "【名】デート", "pos": "名", "example": "Online dating.", "phrase": "dating agency", "set": 1},
    {"word": "daze", "meaning": "【名】呆然とした状態", "pos": "名", "example": "In a daze.", "phrase": "walk around in a daze", "set": 1},
    {"word": "dazzle", "meaning": "【名】輝き (verb usually)", "pos": "名", "example": "The dazzle of the headlights.", "phrase": "dazzle someone", "set": 1},
    {"word": "deadline", "meaning": "【名】締め切り", "pos": "名", "example": "Meet the deadline.", "phrase": "tight deadline", "set": 1},
    {"word": "deadly", "meaning": "【形】致命的な", "pos": "形", "example": "Deadly poison.", "phrase": "deadly weapon", "set": 1},
    {"word": "deaf", "meaning": "【形】耳が聞こえない", "pos": "形", "example": "He is deaf.", "phrase": "go deaf", "set": 1},
    {"word": "deal", "meaning": "【動】扱う、取引する", "pos": "動", "example": "Deal with a problem.", "phrase": "deal cards", "set": 1},
    {"word": "dealer", "meaning": "【名】業者、ディーラー", "pos": "名", "example": "Car dealer.", "phrase": "drug dealer", "set": 1},
    {"word": "debris", "meaning": "【名】残骸、瓦礫", "pos": "名", "example": "Clear the debris.", "phrase": "space debris", "set": 1},
    {"word": "debt", "meaning": "【名】借金", "pos": "名", "example": "Be in debt.", "phrase": "pay off debt", "set": 1},
    {"word": "decision", "meaning": "【名】決定", "pos": "名", "example": "Make a decision.", "phrase": "final decision", "set": 1},
    {"word": "declaration", "meaning": "【名】宣言", "pos": "名", "example": "Declaration of Independence.", "phrase": "make a declaration", "set": 1},
    {"word": "declare", "meaning": "【動】宣言する", "pos": "動", "example": "Declare war.", "phrase": "nothing to declare", "set": 1},
    {"word": "decline", "meaning": "【名】減少、衰退", "pos": "名", "example": "A decline in profits.", "phrase": "in decline", "set": 1}
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
