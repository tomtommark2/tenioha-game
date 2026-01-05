
import json
import re
import os

# B1 Batch 3 (Words 113-250, "antonym" to "booking")
new_words = [
    {"word": "antonym", "meaning": "【名】対義語", "pos": "名", "example": "'Hot' is an antonym of 'cold'.", "phrase": "synonym and antonym", "set": 1},
    {"word": "anxiety", "meaning": "【名】不安、心配", "pos": "名", "example": "She felt great anxiety about the test.", "phrase": "anxiety about", "set": 1},
    {"word": "anxiously", "meaning": "【副】心配して、切望して", "pos": "副", "example": "They waited anxiously for news.", "phrase": "wait anxiously", "set": 1},
    {"word": "anyhow", "meaning": "【副】とにかく", "pos": "副", "example": "It's raining, but I'm going anyhow.", "phrase": "anyhow, let's go", "set": 1},
    {"word": "ape", "meaning": "【名】類人猿", "pos": "名", "example": "Chimpanzees are apes.", "phrase": "great ape", "set": 1},
    {"word": "apology", "meaning": "【名】謝罪", "pos": "名", "example": "He owes me an apology.", "phrase": "letter of apology", "set": 1},
    {"word": "apparent", "meaning": "【形】明らかな", "pos": "形", "example": "It was apparent that she was unhappy.", "phrase": "become apparent", "set": 1},
    {"word": "appeal", "meaning": "【名】懇願、魅力", "pos": "名", "example": "The charity made an appeal for help.", "phrase": "appeal for", "set": 1}, 
    # appeal (verb) already exists or checked? Let's check logic: if dupe, skip.
    {"word": "appetite", "meaning": "【名】食欲", "pos": "名", "example": "I have no appetite today.", "phrase": "loss of appetite", "set": 1},
    {"word": "applaud", "meaning": "【動】拍手する、称賛する", "pos": "動", "example": "The audience applauded loudly.", "phrase": "applaud the decision", "set": 1},
    {"word": "applause", "meaning": "【名】拍手", "pos": "名", "example": "He received a round of applause.", "phrase": "thunderous applause", "set": 1},
    {"word": "application", "meaning": "【名】申し込み、適用、アプリ", "pos": "名", "example": "I filled out the job application.", "phrase": "application form", "set": 1},
    {"word": "appoint", "meaning": "【動】任命する", "pos": "動", "example": "He was appointed as manager.", "phrase": "appoint a successor", "set": 1},
    {"word": "appreciation", "meaning": "【名】感謝、鑑賞、理解", "pos": "名", "example": "Please accept this gift in appreciation.", "phrase": "show appreciation", "set": 1},
    {"word": "approach", "meaning": "【名】接近、取り組み方", "pos": "名", "example": "We need a new approach to the problem.", "phrase": "approach to learning", "set": 1},
    {"word": "approval", "meaning": "【名】承認、賛成", "pos": "名", "example": "The plan needs approval from the boss.", "phrase": "seal of approval", "set": 1},
    {"word": "approve", "meaning": "【動】承認する、賛成する", "pos": "動", "example": "I don't approve of smoking.", "phrase": "approve of", "set": 1},
    {"word": "approximately", "meaning": "【副】およそ", "pos": "副", "example": "The flight takes approximately two hours.", "phrase": "approximately 100 people", "set": 1},
    {"word": "architect", "meaning": "【名】建築家", "pos": "名", "example": "He is a famous architect.", "phrase": "chief architect", "set": 1},
    {"word": "arise", "meaning": "【動】生じる、起こる", "pos": "動", "example": "Problems may arise.", "phrase": "arise from", "set": 1},
    {"word": "arithmetic", "meaning": "【名】算数", "pos": "名", "example": "He is good at arithmetic.", "phrase": "mental arithmetic", "set": 1},
    {"word": "arm", "meaning": "【動】武装させる", "pos": "動", "example": "They armed themselves with sticks.", "phrase": "armed with", "set": 1},
    {"word": "army", "meaning": "【名】陸軍", "pos": "名", "example": "He joined the army.", "phrase": "join the army", "set": 1},
    {"word": "arrange", "meaning": "【動】手配する、配置する", "pos": "動", "example": "Can you arrange a meeting?", "phrase": "arrange for", "set": 1},
    {"word": "arrangement", "meaning": "【名】手配、配置", "pos": "名", "example": "We made arrangements for the party.", "phrase": "flower arrangement", "set": 1},
    {"word": "arrest", "meaning": "【名】逮捕", "pos": "名", "example": "The police made an arrest.", "phrase": "under arrest", "set": 1},
    {"word": "arrest", "meaning": "【動】逮捕する", "pos": "動", "example": "He was arrested for speeding.", "phrase": "arrest a suspect", "set": 1},
    {"word": "arrival", "meaning": "【名】到着", "pos": "名", "example": "We are waiting for your arrival.", "phrase": "arrival time", "set": 1},
    {"word": "arrow", "meaning": "【名】矢", "pos": "名", "example": "Follow the arrow signs.", "phrase": "bow and arrow", "set": 1},
    {"word": "artist", "meaning": "【名】芸術家", "pos": "名", "example": "She is a talented artist.", "phrase": "makeup artist", "set": 1},
    {"word": "artistic", "meaning": "【形】芸術的な", "pos": "形", "example": "He has artistic talent.", "phrase": "artistic ability", "set": 1},
    {"word": "ashamed", "meaning": "【形】恥じて", "pos": "形", "example": "He felt ashamed of his behavior.", "phrase": "be ashamed of", "set": 1},
    {"word": "aside", "meaning": "【副】脇へ", "pos": "副", "example": "Step aside, please.", "phrase": "aside from", "set": 1},
    {"word": "aspect", "meaning": "【名】側面", "pos": "名", "example": "Consider every aspect of the problem.", "phrase": "key aspect", "set": 1},
    {"word": "aspirin", "meaning": "【名】アスピリン（鎮痛剤）", "pos": "名", "example": "Take an aspirin for your headache.", "phrase": "take an aspirin", "set": 1},
    {"word": "assign", "meaning": "【動】割り当てる", "pos": "動", "example": "The teacher assigned us homework.", "phrase": "assign a task", "set": 1},
    {"word": "assignment", "meaning": "【名】課題、宿題、割り当て", "pos": "名", "example": "I finished my geography assignment.", "phrase": "complete an assignment", "set": 1},
    {"word": "assist", "meaning": "【動】手伝う、援助する", "pos": "動", "example": "Can you assist me with this?", "phrase": "assist in", "set": 1},
    {"word": "assistance", "meaning": "【名】援助", "pos": "名", "example": "Do you need any assistance?", "phrase": "financial assistance", "set": 1},
    {"word": "assistant", "meaning": "【名】助手", "pos": "名", "example": "She works as a shop assistant.", "phrase": "personal assistant", "set": 1},
    {"word": "associate", "meaning": "【動】連想する、交際する", "pos": "動", "example": "I associate summer with ice cream.", "phrase": "associate A with B", "set": 1},
    {"word": "assume", "meaning": "【動】仮定する、思い込む", "pos": "動", "example": "I assume you are busy.", "phrase": "assume responsibility", "set": 1},
    {"word": "astronomer", "meaning": "【名】天文学者", "pos": "名", "example": "Galileo was a famous astronomer.", "phrase": "amateur astronomer", "set": 1},
    {"word": "athletic", "meaning": "【形】運動の、運動神経の良い", "pos": "形", "example": "He is very athletic.", "phrase": "athletic meet", "set": 1},
    {"word": "Atlantic", "meaning": "【形】大西洋の", "pos": "形", "example": "They crossed the Atlantic Ocean.", "phrase": "Atlantic Ocean", "set": 1},
    {"word": "atmosphere", "meaning": "【名】雰囲気、大気", "pos": "名", "example": "The restaurant has a nice atmosphere.", "phrase": "friendly atmosphere", "set": 1},
    {"word": "atomic", "meaning": "【形】原子の", "pos": "形", "example": "We studied atomic structure.", "phrase": "atomic bomb", "set": 1},
    {"word": "attach", "meaning": "【動】取り付ける、添付する", "pos": "動", "example": "Please attach the file to the email.", "phrase": "attach A to B", "set": 1},
    {"word": "attachment", "meaning": "【名】添付、愛着", "pos": "名", "example": "Check the email attachment.", "phrase": "sentimental attachment", "set": 1},
    {"word": "attain", "meaning": "【動】達成する", "pos": "動", "example": "We attained our sales goal.", "phrase": "attain a speed of", "set": 1},
    {"word": "attempt", "meaning": "【動】試みる", "pos": "動", "example": "Don't attempt to escape.", "phrase": "make an attempt", "set": 1},
    {"word": "attend", "meaning": "【動】出席する、世話をする", "pos": "動", "example": "She attended the meeting.", "phrase": "attend school", "set": 1},
    {"word": "attract", "meaning": "【動】引きつける", "pos": "動", "example": "The museum attracts many visitors.", "phrase": "attract attention", "set": 1},
    {"word": "attraction", "meaning": "【名】魅力、呼び物", "pos": "名", "example": "The main attraction is the roller coaster.", "phrase": "tourist attraction", "set": 1},
    {"word": "authority", "meaning": "【名】権威、当局", "pos": "名", "example": "You don't have the authority to do that.", "phrase": "local authority", "set": 1},
    {"word": "auxiliary", "meaning": "【形】補助の", "pos": "形", "example": "The hospital has an auxiliary power supply.", "phrase": "auxiliary verb", "set": 1},
    {"word": "available", "meaning": "【形】利用できる、入手できる", "pos": "形", "example": "Is this seat available?", "phrase": "available for", "set": 1},
    {"word": "avenue", "meaning": "【名】大通り", "pos": "名", "example": "He lives on Fifth Avenue.", "phrase": "broad avenue", "set": 1},
    {"word": "award", "meaning": "【動】授与する", "pos": "動", "example": "She was awarded a prize.", "phrase": "award a penalty", "set": 1},
    {"word": "aware", "meaning": "【形】気づいて", "pos": "形", "example": "Are you aware of the risks?", "phrase": "be aware of", "set": 1},
    {"word": "awareness", "meaning": "【名】認識、意識", "pos": "名", "example": "We need to raise public awareness.", "phrase": "environmental awareness", "set": 1},
    {"word": "awesome", "meaning": "【形】すばらしい、畏敬の念を起こさせる", "pos": "形", "example": "The view was awesome.", "phrase": "totally awesome", "set": 1},
    {"word": "awkward", "meaning": "【形】気まずい、不器用な", "pos": "形", "example": "There was an awkward silence.", "phrase": "awkward situation", "set": 1},
    {"word": "babysit", "meaning": "【動】子守をする", "pos": "動", "example": "I babysit for my neighbors.", "phrase": "babysit the kids", "set": 1},
    {"word": "babysitter", "meaning": "【名】ベビーシッター", "pos": "名", "example": "We hired a babysitter.", "phrase": "find a babysitter", "set": 1},
    {"word": "back", "meaning": "【動】後援する、後退する", "pos": "動", "example": "He backed the car into the garage.", "phrase": "back up", "set": 1},
    {"word": "backache", "meaning": "【名】背中の痛み", "pos": "名", "example": "I have a terrible backache.", "phrase": "suffer from backache", "set": 1},
    {"word": "backpack", "meaning": "【名】バックパック、リュック", "pos": "名", "example": "She carries a heavy backpack.", "phrase": "go backpacking", "set": 1},
    {"word": "backpacker", "meaning": "【名】バックパッカー", "pos": "名", "example": "Many backpackers visit Thailand.", "phrase": "hostel for backpackers", "set": 1},
    {"word": "backpacking", "meaning": "【名】バックパック旅行", "pos": "名", "example": "We went backpacking in Europe.", "phrase": "backpacking trip", "set": 1},
    {"word": "bacon", "meaning": "【名】ベーコン", "pos": "名", "example": "I like bacon and eggs.", "phrase": "bring home the bacon", "set": 1},
    {"word": "baggage", "meaning": "【名】手荷物", "pos": "名", "example": "Did you check your baggage?", "phrase": "baggage claim", "set": 1},
    {"word": "baker", "meaning": "【名】パン屋", "pos": "名", "example": "The baker bakes fresh bread.", "phrase": "the baker's", "set": 1},
    {"word": "bakery", "meaning": "【名】パン屋（店）", "pos": "名", "example": "Let's go to the bakery.", "phrase": "local bakery", "set": 1},
    {"word": "balance", "meaning": "【名】均衡、バランス、残高", "pos": "名", "example": "Keep your balance.", "phrase": "bank balance", "set": 1},
    {"word": "bald", "meaning": "【形】はげた", "pos": "形", "example": "He is going bald.", "phrase": "go bald", "set": 1},
    {"word": "bandage", "meaning": "【名】包帯", "pos": "名", "example": "The nurse put a bandage on his arm.", "phrase": "wrap a bandage", "set": 1},
    {"word": "bang", "meaning": "【名】ドスンという音、強打", "pos": "名", "example": "The door shut with a bang.", "phrase": "start with a bang", "set": 1},
    {"word": "bang", "meaning": "【動】たたく、ぶつける", "pos": "動", "example": "He banged his fist on the table.", "phrase": "bang on", "set": 1},
    {"word": "bank account", "meaning": "【名】銀行口座", "pos": "名", "example": "I opened a new bank account.", "phrase": "joint bank account", "set": 1},
    {"word": "bar", "meaning": "【動】塞ぐ、禁じる", "pos": "動", "example": "The road was barred.", "phrase": "bar someone from", "set": 1},
    {"word": "barbecue", "meaning": "【動】バーベキューをする", "pos": "動", "example": "We barbecued chicken in the garden.", "phrase": "barbecue sauce", "set": 1},
    {"word": "bare", "meaning": "【形】裸の、むき出しの", "pos": "形", "example": "The trees are bare in winter.", "phrase": "with bare hands", "set": 1},
    {"word": "barely", "meaning": "【副】かろうじて", "pos": "副", "example": "I barely know him.", "phrase": "barely visible", "set": 1},
    {"word": "bark", "meaning": "【名】吠え声、樹皮", "pos": "名", "example": "The dog gave a loud bark.", "phrase": "bark at", "set": 1},
    {"word": "barman", "meaning": "【名】バーテンダー", "pos": "名", "example": "Ask the barman for a drink.", "phrase": "work as a barman", "set": 1},
    {"word": "barrel", "meaning": "【名】樽", "pos": "名", "example": "They rolled out the barrel.", "phrase": "barrel of oil", "set": 1},
    {"word": "base", "meaning": "【動】基礎を置く", "pos": "動", "example": "The film is based on a true story.", "phrase": "base on", "set": 1},
    {"word": "basement", "meaning": "【名】地下室", "pos": "名", "example": "We store old furniture in the basement.", "phrase": "basement apartment", "set": 1},
    {"word": "basin", "meaning": "【名】洗面器、盆地", "pos": "名", "example": "Wash your face in the basin.", "phrase": "river basin", "set": 1},
    {"word": "basis", "meaning": "【名】基礎、根拠", "pos": "名", "example": "On a daily basis.", "phrase": "on a regular basis", "set": 1},
    {"word": "bat", "meaning": "【動】バットで打つ", "pos": "動", "example": "He batted the ball out of the park.", "phrase": "bat first", "set": 1},
    {"word": "bathe", "meaning": "【動】入浴する、洗う", "pos": "動", "example": "She bathed the baby.", "phrase": "bathe in the sun", "set": 1},
    {"word": "battle", "meaning": "【名】戦い", "pos": "名", "example": "The battle lasted for days.", "phrase": "battle of", "set": 1},
    {"word": "beard", "meaning": "【名】あごひげ", "pos": "名", "example": "He has a long white beard.", "phrase": "grow a beard", "set": 1},
    {"word": "beast", "meaning": "【名】野獣", "pos": "名", "example": "Beauty and the Beast.", "phrase": "wild beast", "set": 1},
    {"word": "beat", "meaning": "【動】打つ、負かす", "pos": "動", "example": "My heart is beating fast.", "phrase": "beat a drum", "set": 1},
    {"word": "beautifully", "meaning": "【副】美しく", "pos": "副", "example": "She sings beautifully.", "phrase": "beautifully decorated", "set": 1},
    {"word": "beaver", "meaning": "【名】ビーバー", "pos": "名", "example": "Beavers build dams.", "phrase": "eager beaver", "set": 1},
    {"word": "because of", "meaning": "【前】〜のために", "pos": "前", "example": "The game was cancelled because of rain.", "phrase": "because of you", "set": 1},
    {"word": "bedside", "meaning": "【名】ベッドの脇", "pos": "名", "example": "She sat by his bedside.", "phrase": "bedside table", "set": 1},
    {"word": "behalf", "meaning": "【名】味方、支持、利益", "pos": "名", "example": "I speak on behalf of the group.", "phrase": "on behalf of", "set": 1},
    {"word": "behave", "meaning": "【動】振る舞う、行儀よくする", "pos": "動", "example": "Please behave yourself.", "phrase": "behave badly", "set": 1},
    {"word": "belief", "meaning": "【名】信念、信じること", "pos": "名", "example": "It is my belief that he is innocent.", "phrase": "strong belief", "set": 1},
    {"word": "beloved", "meaning": "【形】最愛の", "pos": "形", "example": "Her beloved husband passed away.", "phrase": "dearly beloved", "set": 1},
    {"word": "beneath", "meaning": "【前】の下に", "pos": "前", "example": "The boat sank beneath the waves.", "phrase": "beneath the surface", "set": 1},
    {"word": "benefit", "meaning": "【名】利益、恩恵", "pos": "名", "example": "The new law will be of benefit to everyone.", "phrase": "for the benefit of", "set": 1},
    {"word": "bent", "meaning": "【形】曲がった、熱中して", "pos": "形", "example": "The nail is bent.", "phrase": "bent on", "set": 1},
    {"word": "besides", "meaning": "【前】～に加えて、～以外に", "pos": "前", "example": "Besides English, she speaks French.", "phrase": "besides this", "set": 1},
    {"word": "bet", "meaning": "【動】賭ける", "pos": "動", "example": "I bet he will win.", "phrase": "I bet", "set": 1},
    {"word": "bilingual", "meaning": "【形】２か国語を話す", "pos": "形", "example": "She is bilingual in English and Spanish.", "phrase": "bilingual education", "set": 1},
    {"word": "bill", "meaning": "【動】請求書を送る", "pos": "動", "example": "Please bill me later.", "phrase": "foot the bill", "set": 1},
    {"word": "bin", "meaning": "【名】ゴミ箱（重複回避対象だが意味確認）", "pos": "名", "example": "Put it in the bin.", "phrase": "rubbish bin", "set": 1},
    {"word": "biochemistry", "meaning": "【名】生化学", "pos": "名", "example": "He studies biochemistry.", "phrase": "biochemistry lab", "set": 1},
    {"word": "biography", "meaning": "【名】伝記", "pos": "名", "example": "I read a biography of Lincoln.", "phrase": "write a biography", "set": 1},
    {"word": "biology", "meaning": "【名】生物学", "pos": "名", "example": "Biology deals with living things.", "phrase": "marine biology", "set": 1},
    {"word": "bishop", "meaning": "【名】司教", "pos": "名", "example": "The bishop led the service.", "phrase": "chess bishop", "set": 1},
    {"word": "bite", "meaning": "【動】噛む", "pos": "動", "example": "The dog might bite.", "phrase": "bite off", "set": 1},
    {"word": "bitter", "meaning": "【形】苦い、辛辣な", "pos": "形", "example": "This coffee tastes bitter.", "phrase": "bitter cold", "set": 1},
    {"word": "blame", "meaning": "【名】非難、責任", "pos": "名", "example": "He took the blame for the accident.", "phrase": "take the blame", "set": 1},
    {"word": "bleed", "meaning": "【動】出血する", "pos": "動", "example": "His nose started to bleed.", "phrase": "bleed profusely", "set": 1},
    {"word": "blend", "meaning": "【動】混ぜる、調和する", "pos": "動", "example": "Blend the ingredients together.", "phrase": "blend in", "set": 1},
    {"word": "bless", "meaning": "【動】祝福する", "pos": "動", "example": "God bless you.", "phrase": "bless you", "set": 1},
    {"word": "blessing", "meaning": "【名】祝福、恩恵", "pos": "名", "example": "It was a blessing in disguise.", "phrase": "count your blessings", "set": 1},
    {"word": "blind", "meaning": "【形】目の不自由な", "pos": "形", "example": "He helped a blind man cross the street.", "phrase": "go blind", "set": 1},
    {"word": "block", "meaning": "【動】塞ぐ、妨害する", "pos": "動", "example": "A fallen tree blocked the road.", "phrase": "block the view", "set": 1},
    {"word": "blog", "meaning": "【名】ブログ", "pos": "名", "example": "I update my blog every day.", "phrase": "write a blog", "set": 1},
    {"word": "blogger", "meaning": "【名】ブロガー", "pos": "名", "example": "She is a popular food blogger.", "phrase": "fashion blogger", "set": 1},
    {"word": "blush", "meaning": "【名】赤面", "pos": "名", "example": "A blush spread across her cheeks.", "phrase": "at first blush", "set": 1},
    {"word": "board", "meaning": "【動】板を張る、乗り込む", "pos": "動", "example": "Passengers are boarding the plane.", "phrase": "on board", "set": 1},
    {"word": "boast", "meaning": "【動】自慢する", "pos": "動", "example": "He boasted about his new car.", "phrase": "boast of", "set": 1},
    {"word": "bold", "meaning": "【形】大胆な、太字の", "pos": "形", "example": "It was a bold decision.", "phrase": "bold move", "set": 1},
    {"word": "boldly", "meaning": "【副】大胆に", "pos": "副", "example": "He boldly asked for a raise.", "phrase": "go boldly", "set": 1},
    {"word": "bomb", "meaning": "【名】爆弾", "pos": "名", "example": "The bomb exploded.", "phrase": "time bomb", "set": 1},
    {"word": "bomb", "meaning": "【動】爆撃する", "pos": "動", "example": "The city was bombed.", "phrase": "bomb a target", "set": 1},
    {"word": "bond", "meaning": "【名】絆、債券", "pos": "名", "example": "There is a strong bond between them.", "phrase": "government bond", "set": 1},
    {"word": "book", "meaning": "【動】予約する", "pos": "動", "example": "I booked a table for two.", "phrase": "book a flight", "set": 1},
    {"word": "booking", "meaning": "【名】予約", "pos": "名", "example": "I'd like to make a booking.", "phrase": "booking office", "set": 1}
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
        # Check if we should allow certain duplicates (like different POS)
        # For now, strict duplication avoidance to prevent key collision issues in game
        # Unless we change key generation logic
        print(f"Skipping duplicate: {w['word']}")
        continue
    
    entry = f'{{ word: "{w["word"]}", meaning: "{w["meaning"]}", pos: "{w["pos"]}", example: "{w["example"]}", phrase: "{w["phrase"]}", set: 1 }}'
    formatted_js.append(entry)
    added_count += 1

if added_count == 0:
    print("No new words to add.")
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
    print(f"Success: Added {added_count} words to daily array.")
