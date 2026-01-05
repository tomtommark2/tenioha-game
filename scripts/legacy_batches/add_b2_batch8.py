
import json
import re
import os

# B2 Batch 8 (Words 1051-1200 approx)
# CSV Lines 1051 to 1200
new_words = [
    {"word": "godly", "meaning": "【形】信心深い", "pos": "形", "example": "Godly life.", "phrase": "righteous and godly", "set": 1},
    {"word": "good", "meaning": "【名】善、利益", "pos": "名", "example": "For the greater good.", "phrase": "do good", "set": 1},
    {"word": "goodwill", "meaning": "【名】善意", "pos": "名", "example": "Gesture of goodwill.", "phrase": "goodwill ambassador", "set": 1},
    {"word": "gook", "meaning": "【名】（蔑称）東洋人 (Usage Warning: Offensive)", "pos": "名", "example": "Offensive slur.", "phrase": "avoid using gook", "set": 1},
    {"word": "gorge", "meaning": "【名】峡谷", "pos": "名", "example": "Deep gorge.", "phrase": "river gorge", "set": 1},
    {"word": "gossip", "meaning": "【動】噂話をする", "pos": "動", "example": "Don't gossip.", "phrase": "gossip about", "set": 1},
    {"word": "governmental", "meaning": "【形】政府の", "pos": "形", "example": "Governmental agency.", "phrase": "non-governmental", "set": 1},
    {"word": "gracefulness", "meaning": "【名】優雅さ", "pos": "名", "example": "Move with gracefulness.", "phrase": "natural gracefulness", "set": 1},
    {"word": "grade", "meaning": "【動】採点する、等級分けする", "pos": "動", "example": "Grade the papers.", "phrase": "grade A", "set": 1},
    {"word": "gradual", "meaning": "【形】徐々の", "pos": "形", "example": "Gradual change.", "phrase": "gradual improvement", "set": 1},
    {"word": "grain", "meaning": "【名】穀物、粒", "pos": "名", "example": "Grain of sand.", "phrase": "whole grain", "set": 1},
    {"word": "grand", "meaning": "【形】壮大な", "pos": "形", "example": "Grand canyon.", "phrase": "grand piano", "set": 1},
    {"word": "graphically", "meaning": "【副】写実的に、図解で", "pos": "副", "example": "Described graphically.", "phrase": "illustrate graphically", "set": 1},
    {"word": "grasp", "meaning": "【名】把握、握り", "pos": "名", "example": "Grasp of the situation.", "phrase": "within grasp", "set": 1},
    {"word": "gravestone", "meaning": "【名】墓石", "pos": "名", "example": "Old gravestone.", "phrase": "carved gravestone", "set": 1},
    {"word": "gravitation", "meaning": "【名】引力", "pos": "名", "example": "Law of gravitation.", "phrase": "universal gravitation", "set": 1},
    {"word": "greatness", "meaning": "【名】偉大さ", "pos": "名", "example": "Achieve greatness.", "phrase": "destined for greatness", "set": 1},
    {"word": "grief", "meaning": "【名】深い悲しみ", "pos": "名", "example": "Overcome with grief.", "phrase": "good grief", "set": 1},
    {"word": "grieve", "meaning": "【動】悲しむ", "pos": "動", "example": "Grieve for the dead.", "phrase": "grieve over", "set": 1},
    {"word": "grim", "meaning": "【形】厳しい、不吉な", "pos": "形", "example": "Grim reality.", "phrase": "grim reaper", "set": 1},
    {"word": "grin", "meaning": "【名】にやり笑い", "pos": "名", "example": "Wide grin.", "phrase": "grin and bear it", "set": 1},
    {"word": "grip", "meaning": "【名】握り、支配", "pos": "名", "example": "Tight grip.", "phrase": "lose one's grip", "set": 1},
    {"word": "grip", "meaning": "【動】握る、心を捉える", "pos": "動", "example": "Gripped by fear.", "phrase": "grip the handle", "set": 1},
    {"word": "gross", "meaning": "【形】総計の、粗野な", "pos": "形", "example": "Gross income.", "phrase": "gross misconduct", "set": 1},
    {"word": "growing", "meaning": "【形】増大する", "pos": "形", "example": "Growing concern.", "phrase": "growing population", "set": 1},
    {"word": "grown-up", "meaning": "【形】大人の", "pos": "形", "example": "Grown-up children.", "phrase": "act grown-up", "set": 1},
    {"word": "grown-up", "meaning": "【名】大人", "pos": "名", "example": "Ask a grown-up.", "phrase": "be a grown-up", "set": 1},
    {"word": "guarantee", "meaning": "【動】保証する", "pos": "動", "example": "Guarantee quality.", "phrase": "money back guarantee", "set": 1},
    {"word": "guard", "meaning": "【動】守る", "pos": "動", "example": "Guard the entrance.", "phrase": "guard against", "set": 1},
    {"word": "guerrilla", "meaning": "【名】ゲリラ", "pos": "名", "example": "Guerrilla warfare.", "phrase": "guerrilla fighter", "set": 1},
    {"word": "guideline", "meaning": "【名】指針", "pos": "名", "example": "Follow guidelines.", "phrase": "safety guidelines", "set": 1},
    {"word": "gulp", "meaning": "【名】ごくりと飲むこと", "pos": "名", "example": "Take a gulp.", "phrase": "gulp of air", "set": 1},
    {"word": "gum", "meaning": "【名】歯茎、ガム", "pos": "名", "example": "Chewing gum.", "phrase": "bleeding gums", "set": 1},
    {"word": "gunshot", "meaning": "【名】銃声", "pos": "名", "example": "Heard a gunshot.", "phrase": "gunshot wound", "set": 1},
    {"word": "guts", "meaning": "【名】根性、内臓", "pos": "名", "example": "Have the guts.", "phrase": "spill one's guts", "set": 1},
    {"word": "gymnastic", "meaning": "【形】体操の", "pos": "形", "example": "Gymnastic exercises.", "phrase": "gymnastic team", "set": 1},
    {"word": "habitant", "meaning": "【名】住民", "pos": "名", "example": "Local habitant.", "phrase": "native habitant", "set": 1},
    {"word": "hail", "meaning": "【動】歓呼して迎える", "pos": "動", "example": "Hail a taxi.", "phrase": "hail the hero", "set": 1},
    {"word": "hairy", "meaning": "【形】毛深い", "pos": "形", "example": "Hairy chest.", "phrase": "hairy situation", "set": 1},
    {"word": "hammer", "meaning": "【動】ハンマーで打つ", "pos": "動", "example": "Hammer a nail.", "phrase": "hammer out", "set": 1},
    {"word": "handicap", "meaning": "【名】ハンディキャップ", "pos": "名", "example": "Physical handicap.", "phrase": "overcome a handicap", "set": 1},
    {"word": "handicraft", "meaning": "【名】手芸", "pos": "名", "example": "Local handicraft.", "phrase": "handicraft shop", "set": 1},
    {"word": "handout", "meaning": "【名】配布資料", "pos": "名", "example": "Class handout.", "phrase": "give a handout", "set": 1},
    {"word": "handrail", "meaning": "【名】手すり", "pos": "名", "example": "Hold the handrail.", "phrase": "stairs handrail", "set": 1},
    {"word": "hang", "meaning": "【名】扱い方、コツ", "pos": "名", "example": "Get the hang of it.", "phrase": "hang in there", "set": 1},
    {"word": "hard drive", "meaning": "【名】ハードドライブ", "pos": "名", "example": "Save to hard drive.", "phrase": "external hard drive", "set": 1},
    {"word": "hardware", "meaning": "【名】ハードウェア、金物", "pos": "名", "example": "Computer hardware.", "phrase": "hardware store", "set": 1},
    {"word": "harm", "meaning": "【名】害", "pos": "名", "example": "Do no harm.", "phrase": "out of harm's way", "set": 1},
    {"word": "harmless", "meaning": "【形】無害な", "pos": "形", "example": "Harmless joke.", "phrase": "harmless to humans", "set": 1},
    {"word": "harrow", "meaning": "【名】砕土機", "pos": "名", "example": "Farm harrow.", "phrase": "under the harrow", "set": 1},
    {"word": "haste", "meaning": "【名】急ぎ", "pos": "名", "example": "Make haste.", "phrase": "in haste", "set": 1},
    {"word": "hastily", "meaning": "【副】急いで", "pos": "副", "example": "Left hastily.", "phrase": "hastily arranged", "set": 1},
    {"word": "hatching", "meaning": "【名】孵化、ハッチング（描画）", "pos": "名", "example": "Cross hatching.", "phrase": "egg hatching", "set": 1},
    {"word": "haunt", "meaning": "【動】出没する", "pos": "動", "example": "Ghost haunts the house.", "phrase": "haunt memories", "set": 1},
    {"word": "haunting", "meaning": "【形】忘れられない", "pos": "形", "example": "Haunting melody.", "phrase": "haunting beauty", "set": 1},
    {"word": "hay", "meaning": "【名】干し草", "pos": "名", "example": "Make hay.", "phrase": "hit the hay", "set": 1},
    {"word": "hazardous", "meaning": "【形】危険な", "pos": "形", "example": "Hazardous waste.", "phrase": "hazardous conditions", "set": 1},
    {"word": "headquarters", "meaning": "【名】本部", "pos": "名", "example": "Police headquarters.", "phrase": "company headquarters", "set": 1},
    {"word": "health care", "meaning": "【名】医療", "pos": "名", "example": "Health care system.", "phrase": "universal health care", "set": 1},
    {"word": "heap", "meaning": "【名】積み重ね", "pos": "名", "example": "Heap of clothes.", "phrase": "bottom of the heap", "set": 1},
    {"word": "heap", "meaning": "【動】積み重ねる", "pos": "動", "example": "Heap praise on.", "phrase": "heap up", "set": 1},
    {"word": "heartbreaking", "meaning": "【形】胸が張り裂けるような", "pos": "形", "example": "Heartbreaking story.", "phrase": "heartbreaking news", "set": 1},
    {"word": "heartwarming", "meaning": "【形】心温まる", "pos": "形", "example": "Heartwarming moment.", "phrase": "heartwarming tale", "set": 1},
    {"word": "heart-warming", "meaning": "【形】心温まる（つづり違い）", "pos": "形", "example": "Heart-warming soup.", "phrase": "heart-warming story", "set": 1},
    {"word": "hedge", "meaning": "【名】生け垣", "pos": "名", "example": "Trim the hedge.", "phrase": "hedge fund", "set": 1},
    {"word": "helicopter", "meaning": "【名】ヘリコプター", "pos": "名", "example": "Fly a helicopter.", "phrase": "helicopter pilot", "set": 1},
    {"word": "hell", "meaning": "【名】地獄", "pos": "名", "example": "Go to hell.", "phrase": "hell on earth", "set": 1},
    {"word": "helper", "meaning": "【名】助手", "pos": "名", "example": "Mother's helper.", "phrase": "hired helper", "set": 1},
    {"word": "hemp", "meaning": "【名】麻", "pos": "名", "example": "Hemp rope.", "phrase": "hemp fabric", "set": 1},
    {"word": "herb", "meaning": "【名】ハーブ", "pos": "名", "example": "Fresh herbs.", "phrase": "herb garden", "set": 1},
    {"word": "heritage", "meaning": "【名】遺産", "pos": "名", "example": "Cultural heritage.", "phrase": "world heritage site", "set": 1},
    {"word": "hesitation", "meaning": "【名】ためらい", "pos": "名", "example": "Without hesitation.", "phrase": "moment of hesitation", "set": 1},
    {"word": "highlight", "meaning": "【名】見所", "pos": "名", "example": "Highlight of the trip.", "phrase": "career highlight", "set": 1},
    {"word": "high-tech", "meaning": "【形】ハイテクの", "pos": "形", "example": "High-tech industry.", "phrase": "high-tech gadgets", "set": 1},
    {"word": "hijack", "meaning": "【名】乗っ取り", "pos": "名", "example": "Plane hijack.", "phrase": "hijack attempt", "set": 1},
    {"word": "hijack", "meaning": "【動】乗っ取る", "pos": "動", "example": "Hijack a plane.", "phrase": "hijacked by terrorists", "set": 1},
    {"word": "hilarious", "meaning": "【形】とても面白い", "pos": "形", "example": "Hilarious joke.", "phrase": "hilarious comedy", "set": 1},
    {"word": "hint", "meaning": "【名】ヒント、気配", "pos": "名", "example": "Give a hint.", "phrase": "hint of smile", "set": 1},
    {"word": "hi-tech", "meaning": "【形】ハイテクの（略）", "pos": "形", "example": "Hi-tech equipment.", "phrase": "hi-tech society", "set": 1},
    {"word": "holder", "meaning": "【名】保持者、ホルダー", "pos": "名", "example": "Ticket holder.", "phrase": "account holder", "set": 1},
    {"word": "hollow", "meaning": "【形】空洞の", "pos": "形", "example": "Hollow tree.", "phrase": "hollow promise", "set": 1},
    {"word": "holocaust", "meaning": "【名】大虐殺", "pos": "名", "example": "The Holocaust.", "phrase": "nuclear holocaust", "set": 1},
    {"word": "homeward", "meaning": "【形】家路につく", "pos": "形", "example": "Homeward journey.", "phrase": "homeward bound", "set": 1},
    {"word": "hone", "meaning": "【名】砥石 (verb mostly)", "pos": "名", "example": "Hone skills.", "phrase": "hone to perfection", "set": 1},
    {"word": "honor", "meaning": "【動】尊敬する、名誉を与える", "pos": "動", "example": "Honor the dead.", "phrase": "honor a promise", "set": 1},
    {"word": "honorable", "meaning": "【形】名誉ある", "pos": "形", "example": "Honorable discharge.", "phrase": "honorable man", "set": 1},
    {"word": "honour", "meaning": "【動】尊敬する（英）", "pos": "動", "example": "Honour the queen.", "phrase": "guard of honour", "set": 1},
    {"word": "honourable", "meaning": "【形】名誉ある（英）", "pos": "形", "example": "Honourable member.", "phrase": "right honourable", "set": 1},
    {"word": "hood", "meaning": "【名】フード、ボンネット", "pos": "名", "example": "Wear a hood.", "phrase": "under the hood", "set": 1},
    {"word": "hook", "meaning": "【名】フック", "pos": "名", "example": "Coat hook.", "phrase": "off the hook", "set": 1},
    {"word": "hook", "meaning": "【動】引っ掛ける", "pos": "動", "example": "Hook a fish.", "phrase": "hook up", "set": 1},
    {"word": "hospice", "meaning": "【名】ホスピス", "pos": "名", "example": "Hospice care.", "phrase": "enter a hospice", "set": 1},
    {"word": "hospitable", "meaning": "【形】親切な", "pos": "形", "example": "Hospitable host.", "phrase": "hospitable climate", "set": 1},
    {"word": "hospitalise", "meaning": "【動】入院させる（英）", "pos": "動", "example": "Be hospitalised.", "phrase": "hospitalise a patient", "set": 1},
    {"word": "hospitality", "meaning": "【名】歓待", "pos": "名", "example": "Show hospitality.", "phrase": "hospitality industry", "set": 1},
    {"word": "hospitalize", "meaning": "【動】入院させる", "pos": "動", "example": "Be hospitalized.", "phrase": "need to hospitalize", "set": 1},
    {"word": "hourly", "meaning": "【形】1時間ごとの", "pos": "形", "example": "Hourly wage.", "phrase": "hourly update", "set": 1},
    {"word": "housekeeper", "meaning": "【名】家政婦", "pos": "名", "example": "Hire a housekeeper.", "phrase": "head housekeeper", "set": 1},
    {"word": "housemaster", "meaning": "【名】寮監", "pos": "名", "example": "School housemaster.", "phrase": "boarding housemaster", "set": 1},
    {"word": "housewife", "meaning": "【名】主婦", "pos": "名", "example": "Full-time housewife.", "phrase": "desperate housewives", "set": 1},
    {"word": "hover", "meaning": "【動】空中に停止する", "pos": "動", "example": "Helicopter hovered.", "phrase": "hover over", "set": 1},
    {"word": "hug", "meaning": "【名】抱擁", "pos": "名", "example": "Big hug.", "phrase": "bear hug", "set": 1},
    {"word": "hugely", "meaning": "【副】非常に", "pos": "副", "example": "Hugely popular.", "phrase": "hugely successful", "set": 1},
    {"word": "human rights", "meaning": "【名】人権", "pos": "名", "example": "Respect human rights.", "phrase": "human rights violation", "set": 1},
    {"word": "humane", "meaning": "【形】人道的な", "pos": "形", "example": "Humane treatment.", "phrase": "humane killer", "set": 1},
    {"word": "humanise", "meaning": "【動】人間味を持たせる（英）", "pos": "動", "example": "Humanise the workplace.", "phrase": "humanise technology", "set": 1},
    {"word": "humanist", "meaning": "【名】人道主義者", "pos": "名", "example": "Secular humanist.", "phrase": "humanist perspective", "set": 1},
    {"word": "humanize", "meaning": "【動】人間味を持たせる", "pos": "動", "example": "Humanize the story.", "phrase": "humanize branding", "set": 1},
    {"word": "humble", "meaning": "【形】謙虚な、質素な", "pos": "形", "example": "Humble origin.", "phrase": "humble opinion", "set": 1},
    {"word": "humbug", "meaning": "【名】詐欺、ペテン", "pos": "名", "example": "Bah, humbug!", "phrase": "sheer humbug", "set": 1},
    {"word": "humiliate", "meaning": "【動】恥をかかせる", "pos": "動", "example": "Humiliate someone.", "phrase": "feel humiliated", "set": 1},
    {"word": "humiliating", "meaning": "【形】屈辱的な", "pos": "形", "example": "Humiliating defeat.", "phrase": "humiliating experience", "set": 1},
    {"word": "humiliation", "meaning": "【名】屈辱", "pos": "名", "example": "Suffer humiliation.", "phrase": "public humiliation", "set": 1},
    {"word": "hunting", "meaning": "【名】狩猟", "pos": "名", "example": "Go hunting.", "phrase": "job hunting", "set": 1},
    {"word": "hush", "meaning": "【動】静かにさせる", "pos": "動", "example": "Hush the baby.", "phrase": "hush up", "set": 1},
    {"word": "hybrid", "meaning": "【形】ハイブリッドの", "pos": "形", "example": "Hybrid car.", "phrase": "hybrid vigor", "set": 1},
    {"word": "hygiene", "meaning": "【名】衛生", "pos": "名", "example": "Personal hygiene.", "phrase": "dental hygiene", "set": 1},
    {"word": "hyperbole", "meaning": "【名】誇張法", "pos": "名", "example": "Use hyperbole.", "phrase": "rhetorical hyperbole", "set": 1},
    {"word": "hyphen", "meaning": "【名】ハイフン", "pos": "名", "example": "Join with a hyphen.", "phrase": "hyphenated word", "set": 1},
    {"word": "iceman", "meaning": "【名】氷屋、アイスマン", "pos": "名", "example": "The Iceman Cometh.", "phrase": "prehistoric iceman", "set": 1},
    {"word": "icon", "meaning": "【名】アイコン、聖像", "pos": "名", "example": "Click the icon.", "phrase": "cultural icon", "set": 1},
    {"word": "icy", "meaning": "【形】氷のような", "pos": "形", "example": "Icy road.", "phrase": "icy stare", "set": 1},
    {"word": "ideally", "meaning": "【副】理想的には", "pos": "副", "example": "Ideally suited.", "phrase": "ideally speaking", "set": 1},
    {"word": "identical", "meaning": "【形】同一の", "pos": "形", "example": "Identical twins.", "phrase": "identical to", "set": 1},
    {"word": "identification", "meaning": "【名】身元確認", "pos": "名", "example": "Show identification.", "phrase": "identification card", "set": 1},
    {"word": "identify", "meaning": "【動】特定する", "pos": "動", "example": "Identify the suspect.", "phrase": "identify with", "set": 1},
    {"word": "ideology", "meaning": "【名】イデオロギー", "pos": "名", "example": "Political ideology.", "phrase": "dominant ideology", "set": 1},
    {"word": "idiot", "meaning": "【名】馬鹿", "pos": "名", "example": "Don't be an idiot.", "phrase": "complete idiot", "set": 1},
    {"word": "idle", "meaning": "【形】何もしていない", "pos": "形", "example": "Idle hands.", "phrase": "idle talk", "set": 1},
    {"word": "idolise", "meaning": "【動】崇拝する（英）", "pos": "動", "example": "Idolise a singer.", "phrase": "idolise heroes", "set": 1},
    {"word": "idolize", "meaning": "【動】崇拝する", "pos": "動", "example": "Idolize a star.", "phrase": "idolize someone", "set": 1},
    {"word": "ignorance", "meaning": "【名】無知", "pos": "名", "example": "Ignorance is bliss.", "phrase": "admit ignorance", "set": 1},
    {"word": "ignorant", "meaning": "【形】無知な", "pos": "形", "example": "Ignorant of facts.", "phrase": "ignorant person", "set": 1},
    {"word": "illustrate", "meaning": "【動】説明する、挿絵を入れる", "pos": "動", "example": "Illustrate a point.", "phrase": "illustrated book", "set": 1},
    {"word": "illustration", "meaning": "【名】挿絵、実例", "pos": "名", "example": "Book illustration.", "phrase": "by way of illustration", "set": 1},
    {"word": "imagery", "meaning": "【名】比喩的表現、画像", "pos": "名", "example": "Poetic imagery.", "phrase": "satellite imagery", "set": 1},
    {"word": "imitation", "meaning": "【名】模倣", "pos": "名", "example": "Cheap imitation.", "phrase": "imitation leather", "set": 1},
    {"word": "immerse", "meaning": "【動】浸す、没頭させる", "pos": "動", "example": "Immerse in water.", "phrase": "immerse oneself in", "set": 1},
    {"word": "immigrant", "meaning": "【名】移民", "pos": "名", "example": "Illegal immigrant.", "phrase": "immigrant population", "set": 1},
    {"word": "immoral", "meaning": "【形】不道徳な", "pos": "形", "example": "Immoral behavior.", "phrase": "immoral earnings", "set": 1},
    {"word": "immortal", "meaning": "【形】不死の", "pos": "形", "example": "Immortal soul.", "phrase": "immortal words", "set": 1},
    {"word": "immortality", "meaning": "【名】不死", "pos": "名", "example": "Quest for immortality.", "phrase": "achieve immortality", "set": 1},
    {"word": "impartial", "meaning": "【形】公平な", "pos": "形", "example": "Impartial advice.", "phrase": "impartial judge", "set": 1},
    {"word": "impatiently", "meaning": "【副】じれったそうに", "pos": "副", "example": "Wait impatiently.", "phrase": "tap fingers impatiently", "set": 1},
    {"word": "imperative", "meaning": "【名】命令、必須事項", "pos": "名", "example": "Moral imperative.", "phrase": "imperative mood", "set": 1},
    {"word": "impermanent", "meaning": "【形】一時的な", "pos": "形", "example": "Impermanent residence.", "phrase": "life is impermanent", "set": 1},
    {"word": "implement", "meaning": "【名】道具", "pos": "名", "example": "Farm implement.", "phrase": "garden implements", "set": 1},
    {"word": "implement", "meaning": "【動】実行する", "pos": "動", "example": "Implement a plan.", "phrase": "fully implement", "set": 1},
    {"word": "implication", "meaning": "【名】含意、関与", "pos": "名", "example": "Serious implication.", "phrase": "by implication", "set": 1},
    {"word": "imply", "meaning": "【動】ほのめかす", "pos": "動", "example": "Implying that.", "phrase": "what do you imply", "set": 1},
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
