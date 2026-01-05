
import json
import re
import os

# B2 Batch 6 (Words 751-900 approx)
# CSV Lines 751 to 900
new_words = [
    {"word": "dye", "meaning": "【名】染料", "pos": "名", "example": "Hair dye.", "phrase": "natural dye", "set": 1},
    {"word": "dynamic", "meaning": "【形】活動的な、動的な", "pos": "形", "example": "Dynamic personality.", "phrase": "dynamic duo", "set": 1},
    {"word": "eagerly", "meaning": "【副】熱心に", "pos": "副", "example": "Wait eagerly.", "phrase": "eagerly anticipated", "set": 1},
    {"word": "eagle", "meaning": "【名】ワシ", "pos": "名", "example": "Bald eagle.", "phrase": "soar like an eagle", "set": 1},
    {"word": "earnings", "meaning": "【名】所得", "pos": "名", "example": "High earnings.", "phrase": "earnings report", "set": 1},
    {"word": "ease", "meaning": "【名】容易さ、安らぎ", "pos": "名", "example": "With ease.", "phrase": "at ease", "set": 1},
    {"word": "ease", "meaning": "【動】和らげる", "pos": "動", "example": "Ease the pain.", "phrase": "ease off", "set": 1},
    {"word": "eastward", "meaning": "【副】東へ", "pos": "副", "example": "Travel eastward.", "phrase": "look eastward", "set": 1},
    {"word": "eastwards", "meaning": "【副】東へ（英）", "pos": "副", "example": "Move eastwards.", "phrase": "heading eastwards", "set": 1},
    {"word": "ecologically", "meaning": "【副】生態学的に", "pos": "副", "example": "Ecologically sound.", "phrase": "ecologically friendly", "set": 1},
    {"word": "ecologist", "meaning": "【名】生態学者", "pos": "名", "example": "Study by ecologist.", "phrase": "leading ecologist", "set": 1},
    {"word": "economical", "meaning": "【形】経済的な", "pos": "形", "example": "Economical car.", "phrase": "economical choice", "set": 1},
    {"word": "economist", "meaning": "【名】経済学者", "pos": "名", "example": "Chief economist.", "phrase": "ask an economist", "set": 1},
    {"word": "ecstatic", "meaning": "【形】有頂天の", "pos": "形", "example": "Ecstatic fans.", "phrase": "ecstatic about", "set": 1},
    {"word": "edit", "meaning": "【名】編集", "pos": "名", "example": "Final edit.", "phrase": "do an edit", "set": 1},
    {"word": "edit", "meaning": "【動】編集する", "pos": "動", "example": "Edit a video.", "phrase": "edit out", "set": 1},
    {"word": "editorial", "meaning": "【名】社説", "pos": "名", "example": "Newspaper editorial.", "phrase": "editorial board", "set": 1},
    {"word": "educated", "meaning": "【形】教養のある", "pos": "形", "example": "Highly educated.", "phrase": "educated guess", "set": 1},
    {"word": "educator", "meaning": "【名】教育者", "pos": "名", "example": "Respected educator.", "phrase": "nurse educator", "set": 1},
    {"word": "effectively", "meaning": "【副】効果的に", "pos": "副", "example": "Work effectively.", "phrase": "deal with effectively", "set": 1},
    {"word": "effectiveness", "meaning": "【名】有効性", "pos": "名", "example": "Cost effectiveness.", "phrase": "prove effectiveness", "set": 1},
    {"word": "elect", "meaning": "【動】選出する", "pos": "動", "example": "Elect a president.", "phrase": "president elect", "set": 1},
    {"word": "elective", "meaning": "【形】選択の", "pos": "形", "example": "Elective surgery.", "phrase": "elective course", "set": 1},
    {"word": "electrician", "meaning": "【名】電気技師", "pos": "名", "example": "Call an electrician.", "phrase": "master electrician", "set": 1},
    {"word": "electronically", "meaning": "【副】電子的に", "pos": "副", "example": "Submit electronically.", "phrase": "electronically controlled", "set": 1},
    {"word": "electronics", "meaning": "【名】電子工学、電子機器", "pos": "名", "example": "Consumer electronics.", "phrase": "electronics store", "set": 1},
    {"word": "elegance", "meaning": "【名】優雅さ", "pos": "名", "example": "Simple elegance.", "phrase": "touch of elegance", "set": 1},
    {"word": "elegant", "meaning": "【形】優雅な", "pos": "形", "example": "Elegant dress.", "phrase": "elegant solution", "set": 1},
    {"word": "elegantly", "meaning": "【副】優雅に", "pos": "副", "example": "Dressed elegantly.", "phrase": "elegantly designed", "set": 1},
    {"word": "elemental", "meaning": "【形】基本的な、自然力の", "pos": "形", "example": "Elemental force.", "phrase": "elemental truth", "set": 1},
    {"word": "eligible", "meaning": "【形】資格のある", "pos": "形", "example": "Eligible for benefits.", "phrase": "eligible bachelor", "set": 1},
    {"word": "elite", "meaning": "【名】エリート", "pos": "名", "example": "Ruling elite.", "phrase": "elite forces", "set": 1},
    {"word": "eloquence", "meaning": "【名】雄弁さ", "pos": "名", "example": "Speak with eloquence.", "phrase": "flowery eloquence", "set": 1},
    {"word": "eloquent", "meaning": "【形】雄弁な", "pos": "形", "example": "Eloquent speaker.", "phrase": "eloquent silence", "set": 1},
    {"word": "embassy", "meaning": "【名】大使館", "pos": "名", "example": "US Embassy.", "phrase": "embassy staff", "set": 1},
    {"word": "embrace", "meaning": "【名】抱擁", "pos": "名", "example": "Warm embrace.", "phrase": "loving embrace", "set": 1},
    {"word": "emergence", "meaning": "【名】出現", "pos": "名", "example": "Emergence of new ideas.", "phrase": "sudden emergence", "set": 1},
    {"word": "emphatically", "meaning": "【副】断固として", "pos": "副", "example": "Denied emphatically.", "phrase": "state emphatically", "set": 1},
    {"word": "employ", "meaning": "【動】雇う", "pos": "動", "example": "Employ staff.", "phrase": "employ methods", "set": 1},
    {"word": "employee", "meaning": "【名】従業員", "pos": "名", "example": "Full-time employee.", "phrase": "employee benefits", "set": 1},
    {"word": "employer", "meaning": "【名】雇用主", "pos": "名", "example": "Fair employer.", "phrase": "employer liability", "set": 1},
    {"word": "encounter", "meaning": "【動】遭遇する", "pos": "動", "example": "Encounter difficulties.", "phrase": "brief encounter", "set": 1},
    {"word": "endeavor", "meaning": "【名】努力", "pos": "名", "example": "Scientific endeavor.", "phrase": "make an endeavor", "set": 1},
    {"word": "endeavour", "meaning": "【名】努力（英）", "pos": "名", "example": "Best endeavour.", "phrase": "endeavour to", "set": 1},
    {"word": "endlessly", "meaning": "【副】絶え間なく", "pos": "副", "example": "Talk endlessly.", "phrase": "endlessly fascinating", "set": 1},
    {"word": "endorse", "meaning": "【動】支持する、裏書きする", "pos": "動", "example": "Endorse a candidate.", "phrase": "endorse a check", "set": 1},
    {"word": "endurance", "meaning": "【名】忍耐", "pos": "名", "example": "Test of endurance.", "phrase": "endurance race", "set": 1},
    {"word": "enduring", "meaning": "【形】永続的な", "pos": "形", "example": "Enduring legacy.", "phrase": "enduring love", "set": 1},
    {"word": "energy", "meaning": "【名】エネルギー", "pos": "名", "example": "Renewable energy.", "phrase": "energy drink", "set": 1},
    {"word": "enforce", "meaning": "【動】施行する", "pos": "動", "example": "Enforce the law.", "phrase": "strictly enforce", "set": 1},
    {"word": "engagement", "meaning": "【名】婚約、約束", "pos": "名", "example": "Engagement ring.", "phrase": "break off engagement", "set": 1},
    {"word": "engulf", "meaning": "【動】飲み込む", "pos": "動", "example": "Engulfed in flames.", "phrase": "engulf the city", "set": 1},
    {"word": "enhance", "meaning": "【動】高める", "pos": "動", "example": "Enhance performance.", "phrase": "enhance the flavor", "set": 1},
    {"word": "enquire", "meaning": "【動】尋ねる", "pos": "動", "example": "Enquire about the price.", "phrase": "enquire within", "set": 1},
    {"word": "enrol", "meaning": "【動】登録する（英）", "pos": "動", "example": "Enrol in a course.", "phrase": "enrol now", "set": 1},
    {"word": "enroll", "meaning": "【動】登録する", "pos": "動", "example": "Enroll students.", "phrase": "open enrollment", "set": 1},
    {"word": "enterprise", "meaning": "【名】企業、冒険心", "pos": "名", "example": "Private enterprise.", "phrase": "spirit of enterprise", "set": 1},
    {"word": "entertaining", "meaning": "【形】面白い", "pos": "形", "example": "Entertaining movie.", "phrase": "highly entertaining", "set": 1},
    {"word": "enthusiastically", "meaning": "【副】熱狂的に", "pos": "副", "example": "Clapped enthusiastically.", "phrase": "greet enthusiastically", "set": 1},
    {"word": "entitle", "meaning": "【動】資格を与える、題する", "pos": "動", "example": "Entitled to refund.", "phrase": "be entitled to", "set": 1},
    {"word": "entrepreneur", "meaning": "【名】起業家", "pos": "名", "example": "Successful entrepreneur.", "phrase": "tech entrepreneur", "set": 1},
    {"word": "environment", "meaning": "【名】環境", "pos": "名", "example": "Protect the environment.", "phrase": "friendly environment", "set": 1},
    {"word": "environmentally", "meaning": "【副】環境的に", "pos": "副", "example": "Environmentally safe.", "phrase": "environmentally aware", "set": 1},
    {"word": "environmentally friendly", "meaning": "【形】環境に優しい", "pos": "形", "example": "Environmentally friendly products.", "phrase": "eco-friendly", "set": 1},
    {"word": "envy", "meaning": "【動】うらやむ", "pos": "動", "example": "Envy your success.", "phrase": "green with envy", "set": 1},
    {"word": "equal", "meaning": "【名】対等の人", "pos": "名", "example": "Treat as equals.", "phrase": "among equals", "set": 1},
    {"word": "equal", "meaning": "【動】等しい", "pos": "動", "example": "Two plus two equals four.", "phrase": "equal in value", "set": 1},
    {"word": "equation", "meaning": "【名】方程式", "pos": "名", "example": "Solve an equation.", "phrase": "chemical equation", "set": 1},
    {"word": "equip", "meaning": "【動】備え付ける", "pos": "動", "example": "Equip with tools.", "phrase": "ill equipped", "set": 1},
    {"word": "equity", "meaning": "【名】公平、株式", "pos": "名", "example": "Private equity.", "phrase": "equity stake", "set": 1},
    {"word": "erect", "meaning": "【形】直立した", "pos": "形", "example": "Stand erect.", "phrase": "erect posture", "set": 1},
    {"word": "erupt", "meaning": "【動】噴火する", "pos": "動", "example": "Volcano erupted.", "phrase": "violence erupted", "set": 1},
    {"word": "eruption", "meaning": "【名】噴火", "pos": "名", "example": "Volcanic eruption.", "phrase": "major eruption", "set": 1},
    {"word": "essayist", "meaning": "【名】随筆家", "pos": "名", "example": "Famous essayist.", "phrase": "literary essayist", "set": 1},
    {"word": "essentially", "meaning": "【副】本質的に", "pos": "副", "example": "Essentially the same.", "phrase": "essentially correct", "set": 1},
    {"word": "estate", "meaning": "【名】地所、財産", "pos": "名", "example": "Real estate.", "phrase": "housing estate", "set": 1},
    {"word": "estimate", "meaning": "【名】見積もり", "pos": "名", "example": "Rough estimate.", "phrase": "cost estimate", "set": 1},
    {"word": "estimated", "meaning": "【形】推定の", "pos": "形", "example": "Estimated time of arrival.", "phrase": "estimated cost", "set": 1},
    {"word": "eternally", "meaning": "【副】永遠に", "pos": "副", "example": "Eternally grateful.", "phrase": "love eternally", "set": 1},
    {"word": "ethic", "meaning": "【名】倫理", "pos": "名", "example": "Work ethic.", "phrase": "code of ethics", "set": 1},
    {"word": "ethnic", "meaning": "【形】民族の", "pos": "形", "example": "Ethnic minority.", "phrase": "ethnic group", "set": 1},
    {"word": "evacuate", "meaning": "【動】避難させる", "pos": "動", "example": "Evacuate the building.", "phrase": "evacuate to safety", "set": 1},
    {"word": "evacuation", "meaning": "【名】避難", "pos": "名", "example": "Emergency evacuation.", "phrase": "evacuation plan", "set": 1},
    {"word": "evaluate", "meaning": "【動】評価する", "pos": "動", "example": "Evaluate performance.", "phrase": "evaluate results", "set": 1},
    {"word": "evaluation", "meaning": "【名】評価", "pos": "名", "example": "Job evaluation.", "phrase": "pass evaluation", "set": 1},
    {"word": "everlasting", "meaning": "【形】永遠の", "pos": "形", "example": "Everlasting love.", "phrase": "life everlasting", "set": 1},
    {"word": "evidently", "meaning": "【副】明らかに", "pos": "副", "example": "Evidently false.", "phrase": "evidently so", "set": 1},
    {"word": "evil", "meaning": "【形】邪悪な", "pos": "形", "example": "Evil spirit.", "phrase": "evil eye", "set": 1},
    {"word": "evil", "meaning": "【名】悪", "pos": "名", "example": "Understand good and evil.", "phrase": "root of all evil", "set": 1},
    {"word": "evolution", "meaning": "【名】進化", "pos": "名", "example": "Theory of evolution.", "phrase": "human evolution", "set": 1},
    {"word": "evolve", "meaning": "【動】進化する", "pos": "動", "example": "Evolve over time.", "phrase": "evolve into", "set": 1},
    {"word": "exactness", "meaning": "【名】正確さ", "pos": "名", "example": "Mathematical exactness.", "phrase": "with exactness", "set": 1},
    {"word": "exaggerate", "meaning": "【動】誇張する", "pos": "動 (noun is err in csv?)", "example": "Don't exaggerate.", "phrase": "exaggerate the importance", "set": 1},
    {"word": "exaggeration", "meaning": "【名】誇張", "pos": "名", "example": "Gross exaggeration.", "phrase": "without exaggeration", "set": 1},
    {"word": "exalt", "meaning": "【動】高める", "pos": "動", "example": "Exalt his name.", "phrase": "be exalted", "set": 1},
    {"word": "examinee", "meaning": "【名】受験者", "pos": "名", "example": "Nervous examinee.", "phrase": "examinee instructions", "set": 1},
    {"word": "exceed", "meaning": "【動】超える", "pos": "動", "example": "Exceed the limit.", "phrase": "exceed expectations", "set": 1},
    {"word": "excel", "meaning": "【動】秀でる", "pos": "動", "example": "Excel in sports.", "phrase": "excel at", "set": 1},
    {"word": "exception", "meaning": "【名】例外", "pos": "名", "example": "With the exception of.", "phrase": "make an exception", "set": 1},
    {"word": "exceptional", "meaning": "【形】例外的な", "pos": "形", "example": "Exceptional talent.", "phrase": "exceptional circumstances", "set": 1},
    {"word": "exceptionally", "meaning": "【副】例外的に", "pos": "副", "example": "Exceptionally good.", "phrase": "perform exceptionally", "set": 1},
    {"word": "excessive", "meaning": "【形】過度の", "pos": "形", "example": "Excessive force.", "phrase": "excessive drinking", "set": 1},
    {"word": "exclaim", "meaning": "【動】叫ぶ", "pos": "動", "example": "Exclaim in surprise.", "phrase": "exclaim loudly", "set": 1},
    {"word": "exclamation mark", "meaning": "【名】感嘆符", "pos": "名", "example": "Use an exclamation mark.", "phrase": "end with exclamation mark", "set": 1},
    {"word": "exclude", "meaning": "【動】除外する", "pos": "動", "example": "Exclude possibility.", "phrase": "exclude from", "set": 1},
    {"word": "exclusion", "meaning": "【名】除外", "pos": "名", "example": "Social exclusion.", "phrase": "exclusion zone", "set": 1},
    {"word": "exclusively", "meaning": "【副】独占的に", "pos": "副", "example": "Available exclusively.", "phrase": "exclusively for", "set": 1},
    {"word": "excursion", "meaning": "【名】遠足", "pos": "名", "example": "School excursion.", "phrase": "go on an excursion", "set": 1},
    {"word": "execute", "meaning": "【動】処刑する、実行する", "pos": "動", "example": "Execute a prisoner.", "phrase": "execute a plan", "set": 1},
    {"word": "execution", "meaning": "【名】処刑、実行", "pos": "名", "example": "Public execution.", "phrase": "put into execution", "set": 1},
    {"word": "executive", "meaning": "【形】執行の", "pos": "形", "example": "Executive power.", "phrase": "executive decision", "set": 1},
    {"word": "executive", "meaning": "【名】重役", "pos": "名", "example": "Chief Executive.", "phrase": "senior executive", "set": 1},
    {"word": "exhaust", "meaning": "【名】排気", "pos": "名", "example": "Car exhaust.", "phrase": "exhaust pipe", "set": 1},
    {"word": "exhausting", "meaning": "【形】消耗させる", "pos": "形", "example": "Exhausting day.", "phrase": "exhausting work", "set": 1},
    {"word": "exhaustion", "meaning": "【名】疲労困憊", "pos": "名", "example": "Collapse from exhaustion.", "phrase": "heat exhaustion", "set": 1},
    {"word": "exhibit", "meaning": "【動】展示する", "pos": "動", "example": "Exhibit paintings.", "phrase": "exhibit signs of", "set": 1},
    {"word": "exile", "meaning": "【名】追放", "pos": "名", "example": "In exile.", "phrase": "political exile", "set": 1},
    {"word": "existing", "meaning": "【形】既存の", "pos": "形", "example": "Existing customers.", "phrase": "existing laws", "set": 1},
    {"word": "exotic", "meaning": "【形】異国風の", "pos": "形", "example": "Exotic fruit.", "phrase": "exotic location", "set": 1},
    {"word": "expansion", "meaning": "【名】拡大", "pos": "名", "example": "Business expansion.", "phrase": "expansion plan", "set": 1},
    {"word": "expectation", "meaning": "【名】期待", "pos": "名", "example": "High expectation.", "phrase": "meet expectations", "set": 1},
    {"word": "expected", "meaning": "【形】予期された", "pos": "形", "example": "Expected result.", "phrase": "expected delivery", "set": 1},
    {"word": "expedition", "meaning": "【名】探検、遠征", "pos": "名", "example": "Polar expedition.", "phrase": "go on an expedition", "set": 1},
    {"word": "experiment", "meaning": "【動】実験する", "pos": "動", "example": "Experiment with drugs.", "phrase": "experiment on animals", "set": 1},
    {"word": "expert", "meaning": "【形】熟練した", "pos": "形", "example": "Expert advice.", "phrase": "expert opinion", "set": 1},
    {"word": "explode", "meaning": "【動】爆発する", "pos": "動", "example": "Bomb exploded.", "phrase": "explode with anger", "set": 1},
    {"word": "exploit", "meaning": "【動】搾取する、開発する", "pos": "動", "example": "Exploit workers.", "phrase": "exploit resources", "set": 1},
    {"word": "explorer", "meaning": "【名】探検家", "pos": "名", "example": "Famous explorer.", "phrase": "internet explorer", "set": 1},
    {"word": "explosive", "meaning": "【形】爆発性の", "pos": "形", "example": "Explosive growth.", "phrase": "explosive device", "set": 1},
    {"word": "explosive", "meaning": "【名】爆発物", "pos": "名", "example": "High explosive.", "phrase": "detect explosives", "set": 1},
    {"word": "export", "meaning": "【名】輸出", "pos": "名", "example": "Export market.", "phrase": "export tax", "set": 1},
    {"word": "export", "meaning": "【動】輸出する", "pos": "動", "example": "Export goods.", "phrase": "export to", "set": 1},
    {"word": "expressive", "meaning": "【形】表現豊かな", "pos": "形", "example": "Expressive eyes.", "phrase": "expressive arts", "set": 1},
    {"word": "exquisite", "meaning": "【形】絶妙な", "pos": "形", "example": "Exquisite taste.", "phrase": "exquisite workmanship", "set": 1},
    {"word": "extension", "meaning": "【名】延長、内線", "pos": "名", "example": "Deadline extension.", "phrase": "telephone extension", "set": 1},
    {"word": "extensive", "meaning": "【形】広範囲な", "pos": "形", "example": "Extensive research.", "phrase": "extensive damage", "set": 1},
    {"word": "external", "meaning": "【形】外部の", "pos": "形", "example": "External hard drive.", "phrase": "external affairs", "set": 1},
    {"word": "extract", "meaning": "【名】抜粋、エキス", "pos": "名", "example": "Vanilla extract.", "phrase": "extract from a book", "set": 1},
    {"word": "extract", "meaning": "【動】抽出する", "pos": "動", "example": "Extract a tooth.", "phrase": "extract oil", "set": 1},
    {"word": "extraordinarily", "meaning": "【副】異常に", "pos": "副", "example": "Extraordinarily beautiful.", "phrase": "extraordinarily high", "set": 1},
    {"word": "exultant", "meaning": "【形】大喜びの", "pos": "形", "example": "Exultant crowd.", "phrase": "exultant mood", "set": 1},
    {"word": "eyebrow", "meaning": "【名】眉毛", "pos": "名", "example": "Raise an eyebrow.", "phrase": "thick eyebrows", "set": 1},
    {"word": "eyelash", "meaning": "【名】まつげ", "pos": "名", "example": "Long eyelashes.", "phrase": "false eyelashes", "set": 1},
    {"word": "eyelid", "meaning": "【名】まぶた", "pos": "名", "example": "Lower eyelid.", "phrase": "heavy eyelids", "set": 1},
    {"word": "fabric", "meaning": "【名】織物", "pos": "名", "example": "Cotton fabric.", "phrase": "fabric softener", "set": 1},
    {"word": "fabulous", "meaning": "【形】素晴らしい", "pos": "形", "example": "Fabulous time.", "phrase": "fabulous wealth", "set": 1},
    {"word": "facilitate", "meaning": "【動】促進する、容易にする", "pos": "動", "example": "Facilitate communication.", "phrase": "facilitate the process", "set": 1},
    {"word": "facilities", "meaning": "【名】設備", "pos": "名", "example": "Sports facilities.", "phrase": "public facilities", "set": 1},
    {"word": "factor", "meaning": "【名】要因", "pos": "名", "example": "Key factor.", "phrase": "deciding factor", "set": 1},
    {"word": "faculty", "meaning": "【名】学部、能力", "pos": "名", "example": "Faculty of Arts.", "phrase": "mental faculty", "set": 1},
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
    
    # Re-read the match to act on current file state (Batch 5 modified it).
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
