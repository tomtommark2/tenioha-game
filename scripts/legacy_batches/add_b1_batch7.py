
import json
import re
import os

# B1 Batch 7 (Words 701-850, "economic" to "feverishly")
new_words = [
    {"word": "economic", "meaning": "【形】経済の", "pos": "形", "example": "Economic growth.", "phrase": "economic policy", "set": 1},
    {"word": "economics", "meaning": "【名】経済学", "pos": "名", "example": "I study economics.", "phrase": "basic economics", "set": 1},
    {"word": "economy", "meaning": "【名】経済、節約", "pos": "名", "example": "The global economy.", "phrase": "boost the economy", "set": 1},
    {"word": "ecosystem", "meaning": "【名】生態系", "pos": "名", "example": "Protect the ecosystem.", "phrase": "marine ecosystem", "set": 1},
    {"word": "ecstasy", "meaning": "【名】有頂天、恍惚", "pos": "名", "example": "She was in ecstasy.", "phrase": "pure ecstasy", "set": 1},
    {"word": "edge", "meaning": "【名】端、縁", "pos": "名", "example": "The edge of the table.", "phrase": "on the edge", "set": 1},
    {"word": "edition", "meaning": "【名】版", "pos": "名", "example": "First edition.", "phrase": "limited edition", "set": 1},
    {"word": "educate", "meaning": "【動】教育する", "pos": "動", "example": "Educate children.", "phrase": "educate oneself", "set": 1},
    {"word": "effective", "meaning": "【形】効果的な", "pos": "形", "example": "An effective method.", "phrase": "effective immediately", "set": 1},
    {"word": "efficiency", "meaning": "【名】効率", "pos": "名", "example": "Improve efficiency.", "phrase": "energy efficiency", "set": 1},
    {"word": "efficient", "meaning": "【形】効率的な", "pos": "形", "example": "An efficient worker.", "phrase": "energy efficient", "set": 1},
    {"word": "either", "meaning": "【形】どちらかの", "pos": "形", "example": "Either way is fine.", "phrase": "in either case", "set": 1},
    {"word": "either", "meaning": "【代】どちらか", "pos": "代", "example": "Either of them can go.", "phrase": "either or", "set": 1},
    # Note: 'either' is listed as determiner and pronoun. We handle both distinct POS.
    
    {"word": "elbow", "meaning": "【名】肘", "pos": "名", "example": "He hurt his elbow.", "phrase": "rub elbows with", "set": 1},
    {"word": "election", "meaning": "【名】選挙", "pos": "名", "example": "General election.", "phrase": "win an election", "set": 1},
    {"word": "electrical", "meaning": "【形】電気の", "pos": "形", "example": "Electrical appliance.", "phrase": "electrical engineer", "set": 1},
    {"word": "electricity", "meaning": "【名】電気", "pos": "名", "example": "Save electricity.", "phrase": "conduct electricity", "set": 1},
    {"word": "electron", "meaning": "【名】電子", "pos": "名", "example": "Electron microscope.", "phrase": "electron beam", "set": 1},
    {"word": "electronic", "meaning": "【形】電子の", "pos": "形", "example": "Electronic mail.", "phrase": "electronic device", "set": 1},
    {"word": "element", "meaning": "【名】要素、元素", "pos": "名", "example": "Key element.", "phrase": "chemical element", "set": 1},
    {"word": "eliminate", "meaning": "【動】取り除く、排除する", "pos": "動", "example": "Eliminate waste.", "phrase": "eliminate risk", "set": 1},
    {"word": "embarrass", "meaning": "【動】恥ずかしい思いをさせる", "pos": "動", "example": "Don't embarrass me.", "phrase": "be embarrassed", "set": 1},
    {"word": "embarrassed", "meaning": "【形】恥ずかしい", "pos": "形", "example": "I felt embarrassed.", "phrase": "embarrassed smile", "set": 1},
    {"word": "embarrassment", "meaning": "【名】当惑、恥ずかしさ", "pos": "名", "example": "To my embarrassment.", "phrase": "cause embarrassment", "set": 1},
    {"word": "emerge", "meaning": "【動】現れる", "pos": "動", "example": "The sun emerged from the clouds.", "phrase": "emerge as", "set": 1},
    {"word": "emotion", "meaning": "【名】感情", "pos": "名", "example": "Show emotion.", "phrase": "mixed emotions", "set": 1},
    {"word": "emotional", "meaning": "【形】感情的な", "pos": "形", "example": "Emotional support.", "phrase": "emotional distress", "set": 1},
    {"word": "emotionally", "meaning": "【副】感情的に", "pos": "副", "example": "Emotionally stable.", "phrase": "emotionally involved", "set": 1},
    {"word": "emperor", "meaning": "【名】皇帝", "pos": "名", "example": "Roman Emperor.", "phrase": "the Emperor", "set": 1},
    {"word": "emphasis", "meaning": "【名】強調", "pos": "名", "example": "Place emphasis on.", "phrase": "particular emphasis", "set": 1},
    {"word": "emphasise", "meaning": "【動】強調する", "pos": "動", "example": "Emphasise the importance.", "phrase": "emphasise a point", "set": 1},
    {"word": "emphasize", "meaning": "【動】強調する（米）", "pos": "動", "example": "He emphasized the need for change.", "phrase": "emphasize that", "set": 1},
    {"word": "empire", "meaning": "【名】帝国", "pos": "名", "example": "British Empire.", "phrase": "build an empire", "set": 1},
    {"word": "employment", "meaning": "【名】雇用", "pos": "名", "example": "Full employment.", "phrase": "employment agency", "set": 1},
    {"word": "enable", "meaning": "【動】可能にする", "pos": "動", "example": "Money enables you to do things.", "phrase": "enable someone to", "set": 1},
    {"word": "enclose", "meaning": "【動】同封する、囲む", "pos": "動", "example": "Enclose a check.", "phrase": "enclosed space", "set": 1},
    {"word": "encounter", "meaning": "【名】出会い、遭遇", "pos": "名", "example": "A chance encounter.", "phrase": "encounter with", "set": 1},
    {"word": "encouragement", "meaning": "【名】激励", "pos": "名", "example": "Words of encouragement.", "phrase": "give encouragement", "set": 1},
    {"word": "encouraging", "meaning": "【形】励みになる", "pos": "形", "example": "Encouraging signs.", "phrase": "encouraging news", "set": 1},
    {"word": "encyclopaedia", "meaning": "【名】百科事典", "pos": "名", "example": "Look it up in an encyclopaedia.", "phrase": "encyclopaedia britannica", "set": 1},
    {"word": "encyclopedia", "meaning": "【名】百科事典（米）", "pos": "名", "example": "Online encyclopedia.", "phrase": "consult an encyclopedia", "set": 1},
    {"word": "endanger", "meaning": "【動】危険にさらす", "pos": "動", "example": "Endanger one's life.", "phrase": "endangered species", "set": 1},
    {"word": "endless", "meaning": "【形】終わりのない", "pos": "形", "example": "Endless possibilities.", "phrase": "endless loop", "set": 1},
    {"word": "endure", "meaning": "【動】耐える", "pos": "動", "example": "Endure pain.", "phrase": "endure hardship", "set": 1},
    {"word": "enemy", "meaning": "【名】敵", "pos": "名", "example": "Public enemy.", "phrase": "make an enemy", "set": 1},
    {"word": "engage", "meaning": "【動】従事させる、約束する", "pos": "動", "example": "Engage in conversation.", "phrase": "engage someone in", "set": 1},
    {"word": "engaged", "meaning": "【形】婚約している、従事している", "pos": "形", "example": "They are engaged.", "phrase": "get engaged", "set": 1},
    {"word": "engine", "meaning": "【名】エンジン", "pos": "名", "example": "Start the engine.", "phrase": "search engine", "set": 1},
    {"word": "engineering", "meaning": "【名】工学", "pos": "名", "example": "Civil engineering.", "phrase": "software engineering", "set": 1},
    {"word": "Englishman", "meaning": "【名】イギリス人男性", "pos": "名", "example": "He is an Englishman.", "phrase": "Englishman in New York", "set": 1},
    {"word": "enjoyable", "meaning": "【形】楽しい", "pos": "形", "example": "An enjoyable evening.", "phrase": "make it enjoyable", "set": 1},
    {"word": "enjoyment", "meaning": "【名】楽しみ", "pos": "名", "example": "For your enjoyment.", "phrase": "pure enjoyment", "set": 1},
    {"word": "enquiry", "meaning": "【名】問い合わせ", "pos": "名", "example": "Make an enquiry.", "phrase": "general enquiry", "set": 1},
    {"word": "enrich", "meaning": "【動】豊かにする", "pos": "動", "example": "Enrich your vocabulary.", "phrase": "enrich life", "set": 1},
    {"word": "ensure", "meaning": "【動】確実にする", "pos": "動", "example": "Ensure safety.", "phrase": "ensure that", "set": 1},
    {"word": "entertain", "meaning": "【動】楽しませる", "pos": "動", "example": "Entertain guests.", "phrase": "entertain an idea", "set": 1},
    {"word": "entertainer", "meaning": "【名】芸能人、エンターテイナー", "pos": "名", "example": "Street entertainer.", "phrase": "famous entertainer", "set": 1},
    {"word": "enthusiasm", "meaning": "【名】熱意", "pos": "名", "example": "Full of enthusiasm.", "phrase": "show enthusiasm", "set": 1},
    {"word": "enthusiast", "meaning": "【名】熱心な人", "pos": "名", "example": "Car enthusiast.", "phrase": "sports enthusiast", "set": 1},
    {"word": "enthusiastic", "meaning": "【形】熱狂的な", "pos": "形", "example": "Enthusiastic applause.", "phrase": "be enthusiastic about", "set": 1},
    {"word": "entire", "meaning": "【形】全体の", "pos": "形", "example": "The entire world.", "phrase": "entire day", "set": 1},
    {"word": "entirely", "meaning": "【副】完全に", "pos": "副", "example": "It's entirely my fault.", "phrase": "entirely different", "set": 1},
    {"word": "entry", "meaning": "【名】入り口、参加、項目", "pos": "名", "example": "No entry.", "phrase": "entry fee", "set": 1},
    {"word": "environmental", "meaning": "【形】環境の", "pos": "形", "example": "Environmental issues.", "phrase": "environmental protection", "set": 1},
    {"word": "environmentalist", "meaning": "【名】環境保護論者", "pos": "名", "example": "She is an environmentalist.", "phrase": "active environmentalist", "set": 1},
    {"word": "equal", "meaning": "【形】平等の、等しい", "pos": "形", "example": "All men are created equal.", "phrase": "equal opportunity", "set": 1},
    {"word": "equality", "meaning": "【名】平等", "pos": "名", "example": "Gender equality.", "phrase": "racial equality", "set": 1},
    {"word": "equally", "meaning": "【副】同様に、等しく", "pos": "副", "example": "Treat everyone equally.", "phrase": "equally important", "set": 1},
    {"word": "equipment", "meaning": "【名】装備、機器", "pos": "名", "example": "Sports equipment.", "phrase": "piece of equipment", "set": 1},
    {"word": "era", "meaning": "【名】時代", "pos": "名", "example": "Victorian era.", "phrase": "new era", "set": 1},
    {"word": "escape", "meaning": "【動】逃げる", "pos": "動", "example": "Escape from prison.", "phrase": "narrow escape", "set": 1},
    {"word": "essence", "meaning": "【名】本質", "pos": "名", "example": "The essence of the argument.", "phrase": "in essence", "set": 1},
    {"word": "essential", "meaning": "【形】不可欠な、本質的な", "pos": "形", "example": "Water is essential for life.", "phrase": "essential oil", "set": 1},
    {"word": "establishment", "meaning": "【名】設立、施設", "pos": "名", "example": "The establishment of the company.", "phrase": "educational establishment", "set": 1},
    {"word": "estimate", "meaning": "【動】見積もる", "pos": "動", "example": "Estimate the cost.", "phrase": "estimated time", "set": 1},
    {"word": "eternal", "meaning": "【形】永遠の", "pos": "形", "example": "Eternal love.", "phrase": "eternal life", "set": 1},
    {"word": "eternity", "meaning": "【名】永遠", "pos": "名", "example": "Wait for an eternity.", "phrase": "spend eternity", "set": 1},
    {"word": "even", "meaning": "【形】平らな、偶数の", "pos": "形", "example": "An even surface.", "phrase": "even number", "set": 1},
    {"word": "evenly", "meaning": "【副】均等に", "pos": "副", "example": "Spread the butter evenly.", "phrase": "evenly distributed", "set": 1},
    {"word": "eventually", "meaning": "【副】結局は", "pos": "副", "example": "He eventualy agreed.", "phrase": "eventually discover", "set": 1},
    {"word": "evident", "meaning": "【形】明らかな", "pos": "形", "example": "It was evident that...", "phrase": "self-evident", "set": 1},
    {"word": "exact", "meaning": "【形】正確な", "pos": "形", "example": "The exact time.", "phrase": "exact change", "set": 1},
    {"word": "examination", "meaning": "【名】試験、検査", "pos": "名", "example": "Pass the examination.", "phrase": "medical examination", "set": 1},
    {"word": "examine", "meaning": "【動】調べる、診察する", "pos": "動", "example": "Examine the patient.", "phrase": "examine carefully", "set": 1},
    {"word": "examiner", "meaning": "【名】試験官", "pos": "名", "example": "The examiner asked a question.", "phrase": "external examiner", "set": 1},
    {"word": "excellence", "meaning": "【名】優秀さ", "pos": "名", "example": "Center of excellence.", "phrase": "strive for excellence", "set": 1},
    {"word": "excess", "meaning": "【名】過剰、超過", "pos": "名", "example": "In excess of.", "phrase": "excess baggage", "set": 1},
    {"word": "exchange", "meaning": "【動】交換する", "pos": "動", "example": "Exchange gifts.", "phrase": "exchange student", "set": 1},
    {"word": "exchange rate", "meaning": "【名】為替レート", "pos": "名", "example": "The exchange rate is good.", "phrase": "current exchange rate", "set": 1},
    {"word": "excitedly", "meaning": "【副】興奮して", "pos": "副", "example": "She spoke excitedly.", "phrase": "run excitedly", "set": 1},
    {"word": "excitement", "meaning": "【名】興奮", "pos": "名", "example": "Great excitement.", "phrase": "shout with excitement", "set": 1},
    {"word": "exclusive", "meaning": "【形】独占的な、高級な", "pos": "形", "example": "Exclusive interview.", "phrase": "exclusive rights", "set": 1},
    {"word": "excuse", "meaning": "【動】許す、言い訳する", "pos": "動", "example": "Excuse my lateness.", "phrase": "excuse me", "set": 1},
    {"word": "exhausted", "meaning": "【形】疲れ果てた", "pos": "形", "example": "I'm exhausted.", "phrase": "completely exhausted", "set": 1},
    {"word": "existence", "meaning": "【名】存在", "pos": "名", "example": "Believe in the existence of ghosts.", "phrase": "come into existence", "set": 1},
    {"word": "exit", "meaning": "【名】出口", "pos": "名", "example": "Emergency exit.", "phrase": "exit sign", "set": 1},
    {"word": "exit", "meaning": "【動】退出する", "pos": "動", "example": "Exit the program.", "phrase": "exit stage left", "set": 1},
    {"word": "expand", "meaning": "【動】拡大する", "pos": "動", "example": "Expand the business.", "phrase": "expand on", "set": 1},
    {"word": "expense", "meaning": "【名】費用", "pos": "名", "example": "At my expense.", "phrase": "travel expenses", "set": 1},
    {"word": "experience", "meaning": "【動】経験する", "pos": "動", "example": "Experience difficulties.", "phrase": "experience life", "set": 1},
    {"word": "experienced", "meaning": "【形】経験豊富な", "pos": "形", "example": "An experienced teacher.", "phrase": "experienced in", "set": 1},
    {"word": "experiment", "meaning": "【名】実験", "pos": "名", "example": "Conduct an experiment.", "phrase": "science experiment", "set": 1},
    {"word": "exploration", "meaning": "【名】探検", "pos": "名", "example": "Space exploration.", "phrase": "exploration of", "set": 1},
    {"word": "explosion", "meaning": "【名】爆発", "pos": "名", "example": "A loud explosion.", "phrase": "population explosion", "set": 1},
    {"word": "expose", "meaning": "【動】さらす、暴露する", "pos": "動", "example": "Expose to the sun.", "phrase": "expose the truth", "set": 1},
    {"word": "express", "meaning": "【動】表現する", "pos": "動", "example": "Express your feelings.", "phrase": "express an opinion", "set": 1},
    {"word": "extend", "meaning": "【動】延長する、広げる", "pos": "動", "example": "Extend the deadline.", "phrase": "extend a hand", "set": 1},
    {"word": "extensively", "meaning": "【副】広範囲に", "pos": "副", "example": "Travel extensively.", "phrase": "read extensively", "set": 1},
    {"word": "extent", "meaning": "【名】程度、範囲", "pos": "名", "example": "To some extent.", "phrase": "full extent", "set": 1},
    {"word": "extinct", "meaning": "【形】絶滅した", "pos": "形", "example": "Dinosaurs are extinct.", "phrase": "go extinct", "set": 1},
    {"word": "extinction", "meaning": "【名】絶滅", "pos": "名", "example": "Face extinction.", "phrase": "mass extinction", "set": 1},
    {"word": "extra", "meaning": "【名】余分なもの、エキストラ", "pos": "名", "example": "Charge extra.", "phrase": "optional extra", "set": 1},
    {"word": "extraordinary", "meaning": "【形】並外れた", "pos": "形", "example": "An extraordinary talent.", "phrase": "extraordinary power", "set": 1},
    {"word": "extreme", "meaning": "【形】極端な", "pos": "形", "example": "Extreme cold.", "phrase": "extreme weather", "set": 1},
    {"word": "extreme sports", "meaning": "【名】エクストリームスポーツ", "pos": "名", "example": "He likes extreme sports.", "phrase": "extreme sports event", "set": 1},
    {"word": "eyesight", "meaning": "【名】視力", "pos": "名", "example": "Good eyesight.", "phrase": "poor eyesight", "set": 1},
    {"word": "face to face", "meaning": "【副】面と向かって", "pos": "副", "example": "We met face to face.", "phrase": "talk face to face", "set": 1},
    {"word": "face-to-face", "meaning": "【形】対面の", "pos": "形", "example": "Face-to-face meeting.", "phrase": "face-to-face contact", "set": 1},
    {"word": "facility", "meaning": "【名】施設、設備", "pos": "名", "example": "Sports facility.", "phrase": "medical facility", "set": 1},
    {"word": "fade", "meaning": "【動】色あせる、消えていく", "pos": "動", "example": "The colors faded.", "phrase": "fade away", "set": 1},
    {"word": "failure", "meaning": "【名】失敗", "pos": "名", "example": "Fear of failure.", "phrase": "total failure", "set": 1},
    {"word": "faint", "meaning": "【形】かすかな", "pos": "形", "example": "A faint smell.", "phrase": "faint hope", "set": 1},
    {"word": "fair", "meaning": "【名】見本市、フェア", "pos": "名", "example": "Book fair.", "phrase": "fun fair", "set": 1},
    {"word": "faithful", "meaning": "【形】忠実な", "pos": "形", "example": "A faithful dog.", "phrase": "faithful friend", "set": 1},
    {"word": "fake", "meaning": "【形】偽の", "pos": "形", "example": "Fake fur.", "phrase": "fake news", "set": 1},
    {"word": "fall", "meaning": "【名】落下、秋（米）", "pos": "名", "example": "The fall of the empire.", "phrase": "in the fall", "set": 1},
    {"word": "fallen", "meaning": "【形】落ちた、倒れた", "pos": "形", "example": "Fallen leaves.", "phrase": "fallen angel", "set": 1},
    {"word": "fancy", "meaning": "【名】空想、好み", "pos": "名", "example": "Passing fancy.", "phrase": "take a fancy to", "set": 1},
    {"word": "fancy", "meaning": "【動】想像する、好む", "pos": "動", "example": "Fancy a drink?", "phrase": "fancy meeting you here", "set": 1},
    {"word": "fantasy", "meaning": "【名】空想、ファンタジー", "pos": "名", "example": "Fantasy novel.", "phrase": "live in a fantasy world", "set": 1},
    {"word": "faraway", "meaning": "【形】遠い", "pos": "形", "example": "A faraway land.", "phrase": "faraway look", "set": 1},
    {"word": "farewell", "meaning": "【名】別れ", "pos": "名", "example": "Bid farewell.", "phrase": "farewell party", "set": 1},
    {"word": "farming", "meaning": "【名】農業", "pos": "名", "example": "Dairy farming.", "phrase": "organic farming", "set": 1},
    {"word": "farmland", "meaning": "【名】農地", "pos": "名", "example": "Fertile farmland.", "phrase": "protect farmland", "set": 1},
    {"word": "farther", "meaning": "【副】もっと遠くに", "pos": "副", "example": "Walk farther.", "phrase": "go farther", "set": 1},
    {"word": "farthest", "meaning": "【副】最も遠くに", "pos": "副", "example": "Who ran oldest and farthest?", "phrase": "farthest corner", "set": 1},
    {"word": "fascinate", "meaning": "【動】魅了する", "pos": "動", "example": "Science fascinates me.", "phrase": "fascinate the audience", "set": 1},
    {"word": "fashionable", "meaning": "【形】流行の", "pos": "形", "example": "Fashionable clothes.", "phrase": "highly fashionable", "set": 1},
    {"word": "fasten", "meaning": "【動】締める", "pos": "動", "example": "Fasten your seatbelt.", "phrase": "fasten securely", "set": 1},
    {"word": "favorable", "meaning": "【形】好都合な、有利な", "pos": "形", "example": "Favorable conditions.", "phrase": "favorable impression", "set": 1},
    {"word": "favourable", "meaning": "【形】好都合な（英綴り）", "pos": "形", "example": "Favourable review.", "phrase": "favourable wind", "set": 1},
    {"word": "fax", "meaning": "【名】ファックス", "pos": "名", "example": "Send a fax.", "phrase": "fax machine", "set": 1},
    {"word": "fax", "meaning": "【動】ファックスを送る", "pos": "動", "example": "Fax the document.", "phrase": "fax it to me", "set": 1},
    {"word": "feast", "meaning": "【名】宴会、ごちそう", "pos": "名", "example": "A wedding feast.", "phrase": "feast for the eyes", "set": 1},
    {"word": "feed", "meaning": "【動】エサをやる、養う", "pos": "動", "example": "Feed the dog.", "phrase": "feed the family", "set": 1},
    {"word": "fellow", "meaning": "【名】男、仲間", "pos": "名", "example": "He's a nice fellow.", "phrase": "fellow students", "set": 1},
    {"word": "ferry", "meaning": "【名】フェリー", "pos": "名", "example": "Take the ferry.", "phrase": "ferry boat", "set": 1},
    {"word": "festive", "meaning": "【形】お祭り気分の", "pos": "形", "example": "Festive atmosphere.", "phrase": "festive season", "set": 1},
    {"word": "fetch", "meaning": "【動】取ってくる", "pos": "動", "example": "Fetch me a glass of water.", "phrase": "play fetch", "set": 1},
    {"word": "feverishly", "meaning": "【副】熱狂的に、必死に", "pos": "副", "example": "Work feverishly.", "phrase": "feverishly excited", "set": 1}
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
