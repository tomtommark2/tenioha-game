
import json
import re
import os

# B2 Batch 5 (Words 601-750 approx)
# CSV Lines 601 to 750
new_words = [
    {"word": "decorate", "meaning": "【動】装飾する", "pos": "動", "example": "Decorate the room.", "phrase": "decorate with", "set": 1},
    {"word": "decoration", "meaning": "【名】装飾", "pos": "名", "example": "Christmas decoration.", "phrase": "interior decoration", "set": 1},
    {"word": "decorative", "meaning": "【形】装飾的な", "pos": "形", "example": "Decorative items.", "phrase": "purely decorative", "set": 1},
    {"word": "dedication", "meaning": "【名】献身", "pos": "名", "example": "Dedication to work.", "phrase": "show dedication", "set": 1},
    {"word": "deduce", "meaning": "【動】推論する", "pos": "動", "example": "Deduce the answer.", "phrase": "deduce from", "set": 1},
    {"word": "deduction", "meaning": "【名】推論、控除", "pos": "名", "example": "Logical deduction.", "phrase": "tax deduction", "set": 1},
    {"word": "deem", "meaning": "【動】みなす", "pos": "動", "example": "Deem necessary.", "phrase": "deem appropriate", "set": 1},
    {"word": "deep", "meaning": "【形】深い", "pos": "形", "example": "Deep ocean.", "phrase": "deep inside", "set": 1},
    {"word": "deer", "meaning": "【名】鹿", "pos": "名", "example": "Wild deer.", "phrase": "deer park", "set": 1},
    {"word": "defeat", "meaning": "【名】敗北", "pos": "名", "example": "Admit defeat.", "phrase": "suffer defeat", "set": 1},
    {"word": "deficit", "meaning": "【名】赤字", "pos": "名", "example": "Budget deficit.", "phrase": "trade deficit", "set": 1},
    {"word": "deforestation", "meaning": "【名】森林破壊", "pos": "名", "example": "Combat deforestation.", "phrase": "rate of deforestation", "set": 1},
    {"word": "defy", "meaning": "【動】反抗する", "pos": "動", "example": "Defy authority.", "phrase": "defy gravity", "set": 1},
    {"word": "dehumanise", "meaning": "【動】人間性を奪う（英）", "pos": "動", "example": "War dehumanises people.", "phrase": "dehumanise the enemy", "set": 1},
    {"word": "dehumanize", "meaning": "【動】人間性を奪う", "pos": "動", "example": "Dehumanize victims.", "phrase": "dehumanize society", "set": 1},
    {"word": "delegate", "meaning": "【名】代表者", "pos": "名", "example": "Conference delegate.", "phrase": "send a delegate", "set": 1},
    {"word": "deliberate", "meaning": "【形】故意の、慎重な", "pos": "形", "example": "Deliberate mistake.", "phrase": "deliberate attempt", "set": 1},
    {"word": "deliberately", "meaning": "【副】故意に", "pos": "副", "example": "Do it deliberately.", "phrase": "deliberately mislead", "set": 1},
    {"word": "delicacy", "meaning": "【名】繊細さ、珍味", "pos": "名", "example": "Local delicacy.", "phrase": "handle with delicacy", "set": 1},
    {"word": "delicately", "meaning": "【副】繊細に", "pos": "副", "example": "Balanced delicately.", "phrase": "put it delicately", "set": 1},
    {"word": "delight", "meaning": "【動】喜ばせる", "pos": "動", "example": "Delight the audience.", "phrase": "delight in", "set": 1},
    {"word": "demanding", "meaning": "【形】要求の厳しい", "pos": "形", "example": "Demanding job.", "phrase": "demanding schedule", "set": 1},
    {"word": "demolish", "meaning": "【動】取り壊す", "pos": "動", "example": "Demolish a building.", "phrase": "demolish an argument", "set": 1},
    {"word": "denim", "meaning": "【名】デニム", "pos": "名", "example": "Denim jeans.", "phrase": "denim jacket", "set": 1},
    {"word": "dense", "meaning": "【形】密集した", "pos": "形", "example": "Dense fog.", "phrase": "dense population", "set": 1},
    {"word": "densely", "meaning": "【副】密集して", "pos": "副", "example": "Densely populated.", "phrase": "densely packed", "set": 1},
    {"word": "dental", "meaning": "【形】歯の", "pos": "形", "example": "Dental checkup.", "phrase": "dental care", "set": 1},
    {"word": "dependable", "meaning": "【形】信頼できる", "pos": "形", "example": "Dependable car.", "phrase": "dependable person", "set": 1},
    {"word": "deposit", "meaning": "【動】預金する", "pos": "動", "example": "Deposit money.", "phrase": "make a deposit", "set": 1},
    {"word": "deputy", "meaning": "【名】代理人", "pos": "名", "example": "Deputy director.", "phrase": "act as deputy", "set": 1},
    {"word": "descend", "meaning": "【動】降りる", "pos": "動", "example": "Descend the stairs.", "phrase": "descend from", "set": 1},
    {"word": "descriptive", "meaning": "【形】描写的な", "pos": "形", "example": "Descriptive writing.", "phrase": "descriptive grammar", "set": 1},
    {"word": "designer", "meaning": "【形】デザイナーの", "pos": "形", "example": "Designer clothes.", "phrase": "designer label", "set": 1},
    {"word": "desirable", "meaning": "【形】望ましい", "pos": "形", "example": "Desirable outcome.", "phrase": "highly desirable", "set": 1},
    {"word": "desire", "meaning": "【動】望む", "pos": "動", "example": "Desire success.", "phrase": "burn with desire", "set": 1},
    {"word": "desktop", "meaning": "【名】デスクトップ", "pos": "名", "example": "Desktop computer.", "phrase": "desktop publishing", "set": 1},
    {"word": "desolation", "meaning": "【名】荒廃", "pos": "名", "example": "Scene of desolation.", "phrase": "utter desolation", "set": 1},
    {"word": "desperately", "meaning": "【副】必死に", "pos": "副", "example": "Try desperately.", "phrase": "desperately needed", "set": 1},
    {"word": "desperation", "meaning": "【名】絶望、必死", "pos": "名", "example": "Act of desperation.", "phrase": "in desperation", "set": 1},
    {"word": "despise", "meaning": "【動】軽蔑する", "pos": "動", "example": "Despise liars.", "phrase": "despise weakness", "set": 1},
    {"word": "destiny", "meaning": "【名】運命", "pos": "名", "example": "Control your destiny.", "phrase": "meet one's destiny", "set": 1},
    {"word": "detach", "meaning": "【動】切り離す", "pos": "動", "example": "Detach the coupon.", "phrase": "detach oneself", "set": 1},
    {"word": "detachment", "meaning": "【名】分離、無関心", "pos": "名", "example": "Sense of detachment.", "phrase": "retinal detachment", "set": 1},
    {"word": "detailed", "meaning": "【形】詳細な", "pos": "形", "example": "Detailed report.", "phrase": "detailed analysis", "set": 1},
    {"word": "detect", "meaning": "【動】探知する", "pos": "動", "example": "Detect a signal.", "phrase": "detect changes", "set": 1},
    {"word": "determined", "meaning": "【形】決心した", "pos": "形", "example": "Determined to succeed.", "phrase": "determined effort", "set": 1},
    {"word": "determiner", "meaning": "【名】限定詞", "pos": "名", "example": "Grammatical determiner.", "phrase": "use a determiner", "set": 1},
    {"word": "developing", "meaning": "【形】発展途上の", "pos": "形", "example": "Developing countries.", "phrase": "developing world", "set": 1},
    {"word": "devil", "meaning": "【名】悪魔", "pos": "名", "example": "Speak of the devil.", "phrase": "devil's advocate", "set": 1},
    {"word": "devote", "meaning": "【動】捧げる", "pos": "動", "example": "Devote time to study.", "phrase": "devote oneself to", "set": 1},
    {"word": "devoted", "meaning": "【形】献身的な", "pos": "形", "example": "Devoted husband.", "phrase": "devoted to", "set": 1},
    {"word": "diarrhea", "meaning": "【名】下痢", "pos": "名", "example": "Have diarrhea.", "phrase": "severe diarrhea", "set": 1},
    {"word": "diarrhoea", "meaning": "【名】下痢（英）", "pos": "名", "example": "Suffer from diarrhoea.", "phrase": "bout of diarrhoea", "set": 1},
    {"word": "dictator", "meaning": "【名】独裁者", "pos": "名", "example": "Ruthless dictator.", "phrase": "topple a dictator", "set": 1},
    {"word": "digest", "meaning": "【名】要約 (verb mostly)", "pos": "名", "example": "Reader's Digest.", "phrase": "news digest", "set": 1},
    {"word": "dignify", "meaning": "【動】威厳をつける", "pos": "動", "example": "Dignify with a reply.", "phrase": "dignify the occasion", "set": 1},
    {"word": "dignity", "meaning": "【名】尊厳", "pos": "名", "example": "Die with dignity.", "phrase": "human dignity", "set": 1},
    {"word": "dilemma", "meaning": "【名】ジレンマ", "pos": "名", "example": "Moral dilemma.", "phrase": "face a dilemma", "set": 1},
    {"word": "dim", "meaning": "【形】薄暗い", "pos": "形", "example": "Dim light.", "phrase": "dim memory", "set": 1},
    {"word": "dime", "meaning": "【名】10セント硬貨", "pos": "名", "example": "Give a dime.", "phrase": "a dime a dozen", "set": 1},
    {"word": "dimension", "meaning": "【名】次元、寸法", "pos": "名", "example": "Three dimensions.", "phrase": "new dimension", "set": 1},
    {"word": "dip", "meaning": "【動】浸す", "pos": "動", "example": "Dip bread in soup.", "phrase": "dip into", "set": 1},
    {"word": "diphtheria", "meaning": "【名】ジフテリア", "pos": "名", "example": "Diphtheria vaccine.", "phrase": "contract diphtheria", "set": 1},
    {"word": "diploma", "meaning": "【名】卒業証書", "pos": "名", "example": "High school diploma.", "phrase": "receive a diploma", "set": 1},
    {"word": "diplomat", "meaning": "【名】外交官", "pos": "名", "example": "Foreign diplomat.", "phrase": "career diplomat", "set": 1},
    {"word": "disappearance", "meaning": "【名】失踪", "pos": "名", "example": "Mysterious disappearance.", "phrase": "sudden disappearance", "set": 1},
    {"word": "disapproval", "meaning": "【名】不承認、不賛成", "pos": "名", "example": "Express disapproval.", "phrase": "shake head in disapproval", "set": 1},
    {"word": "disapprove", "meaning": "【動】反対する", "pos": "動", "example": "Disapprove of smoking.", "phrase": "strongly disapprove", "set": 1},
    {"word": "discharge", "meaning": "【名】解放、排出", "pos": "名", "example": "Hospital discharge.", "phrase": "honorable discharge", "set": 1},
    {"word": "disciple", "meaning": "【名】弟子", "pos": "名", "example": "Disciple of Jesus.", "phrase": "loyal disciple", "set": 1},
    {"word": "discipline", "meaning": "【名】規律、しつけ", "pos": "名", "example": "Strict discipline.", "phrase": "self discipline", "set": 1},
    {"word": "disconnect", "meaning": "【動】切断する", "pos": "動", "example": "Disconnect the phone.", "phrase": "feeling disconnected", "set": 1},
    {"word": "discredit", "meaning": "【動】信用を落とす", "pos": "動", "example": "Discredit a theory.", "phrase": "discredit the witness", "set": 1},
    {"word": "discriminate", "meaning": "【動】差別する", "pos": "動", "example": "Discriminate against.", "phrase": "discriminate between", "set": 1},
    {"word": "disgrace", "meaning": "【名】不名誉", "pos": "名", "example": "It's a disgrace.", "phrase": "in disgrace", "set": 1},
    {"word": "disguise", "meaning": "【名】変装", "pos": "名", "example": "In disguise.", "phrase": "master of disguise", "set": 1},
    {"word": "disguise", "meaning": "【動】変装させる", "pos": "動", "example": "Disguise oneself.", "phrase": "disguise feelings", "set": 1},
    {"word": "dishonesty", "meaning": "【名】不正直", "pos": "名", "example": "Accused of dishonesty.", "phrase": "intellectual dishonesty", "set": 1},
    {"word": "disillusion", "meaning": "【動】幻滅させる", "pos": "動", "example": "Disillusioned by politics.", "phrase": "utterly disillusioned", "set": 1},
    {"word": "dismiss", "meaning": "【動】解散させる、解雇する", "pos": "動", "example": "Dismiss the class.", "phrase": "dismiss a suggestion", "set": 1},
    {"word": "disorder", "meaning": "【名】無秩序、障害", "pos": "名", "example": "Eating disorder.", "phrase": "public disorder", "set": 1},
    {"word": "disorderly", "meaning": "【形】無秩序な", "pos": "形", "example": "Disorderly conduct.", "phrase": "disorderly pile", "set": 1},
    {"word": "disorganised", "meaning": "【形】整理されていない（英）", "pos": "形", "example": "Disorganised desk.", "phrase": "disorganised person", "set": 1},
    {"word": "disorganized", "meaning": "【形】整理されていない", "pos": "形", "example": "Disorganized schedule.", "phrase": "mentally disorganized", "set": 1},
    {"word": "dispensable", "meaning": "【形】なくても済む", "pos": "形", "example": "Dispensable workers.", "phrase": "not dispensable", "set": 1},
    {"word": "displace", "meaning": "【動】取って代わる、強制退去させる", "pos": "動", "example": "Displaced persons.", "phrase": "displace water", "set": 1},
    {"word": "displeasure", "meaning": "【名】不快", "pos": "名", "example": "Show displeasure.", "phrase": "incur displeasure", "set": 1},
    {"word": "disposal", "meaning": "【名】処分", "pos": "名", "example": "Waste disposal.", "phrase": "at your disposal", "set": 1},
    {"word": "disposition", "meaning": "【名】気質", "pos": "名", "example": "Sunny disposition.", "phrase": "nervous disposition", "set": 1},
    {"word": "dispute", "meaning": "【名】論争", "pos": "名", "example": "Border dispute.", "phrase": "settle a dispute", "set": 1},
    {"word": "disqualify", "meaning": "【動】失格させる", "pos": "動", "example": "Disqualify a player.", "phrase": "disqualified from driving", "set": 1},
    {"word": "disregard", "meaning": "【名】無視", "pos": "名", "example": "Reckless disregard.", "phrase": "total disregard", "set": 1},
    {"word": "disrupt", "meaning": "【動】混乱させる", "pos": "動", "example": "Disrupt the meeting.", "phrase": "disrupt sleep", "set": 1},
    {"word": "dissatisfaction", "meaning": "【名】不満", "pos": "名", "example": "Express dissatisfaction.", "phrase": "growing dissatisfaction", "set": 1},
    {"word": "dissatisfied", "meaning": "【形】不満な", "pos": "形", "example": "Dissatisfied customer.", "phrase": "dissatisfied with", "set": 1},
    {"word": "dissident", "meaning": "【名】反体制派", "pos": "名", "example": "Political dissident.", "phrase": "dissident group", "set": 1},
    {"word": "distinguished", "meaning": "【形】著名な、気品のある", "pos": "形", "example": "Distinguished career.", "phrase": "distinguished guest", "set": 1},
    {"word": "distortion", "meaning": "【名】歪曲", "pos": "名", "example": "Sound distortion.", "phrase": "distortion of facts", "set": 1},
    {"word": "distract", "meaning": "【動】気を逸らす", "pos": "動", "example": "Don't distract me.", "phrase": "distract attention", "set": 1},
    {"word": "distraction", "meaning": "【名】気晴らし、注意散漫", "pos": "名", "example": "Avoid distractions.", "phrase": "drive to distraction", "set": 1},
    {"word": "distressing", "meaning": "【形】悲惨な", "pos": "形", "example": "Distressing news.", "phrase": "distressing experience", "set": 1},
    {"word": "distributor", "meaning": "【名】販売代理店", "pos": "名", "example": "Exclusive distributor.", "phrase": "film distributor", "set": 1},
    {"word": "diversion", "meaning": "【名】転換、気晴らし", "pos": "名", "example": "Traffic diversion.", "phrase": "create a diversion", "set": 1},
    {"word": "divert", "meaning": "【動】逸らす", "pos": "動", "example": "Divert funds.", "phrase": "divert attention", "set": 1},
    {"word": "divided", "meaning": "【形】分割された", "pos": "形", "example": "Divided opinion.", "phrase": "divided house", "set": 1},
    {"word": "division", "meaning": "【名】分割、部門", "pos": "名", "example": "Division of labor.", "phrase": "sales division", "set": 1},
    {"word": "divorce", "meaning": "【名】離婚", "pos": "名", "example": "Get a divorce.", "phrase": "divorce rate", "set": 1},
    {"word": "divorce", "meaning": "【動】離婚する", "pos": "動", "example": "Divorce a spouse.", "phrase": "divorce proceedings", "set": 1},
    {"word": "DNA", "meaning": "【名】DNA", "pos": "名", "example": "DNA test.", "phrase": "DNA profile", "set": 1},
    {"word": "dock", "meaning": "【名】波止場", "pos": "名", "example": "At the dock.", "phrase": "dry dock", "set": 1},
    {"word": "domestic", "meaning": "【形】国内の、家庭の", "pos": "形", "example": "Domestic flights.", "phrase": "domestic violence", "set": 1},
    {"word": "dominate", "meaning": "【動】支配する", "pos": "動", "example": "Dominate the market.", "phrase": "dominate the conversation", "set": 1},
    {"word": "donate", "meaning": "【動】寄付する", "pos": "動", "example": "Donate money.", "phrase": "donate blood", "set": 1},
    {"word": "donation", "meaning": "【名】寄付", "pos": "名", "example": "Make a donation.", "phrase": "charitable donation", "set": 1},
    {"word": "donkey", "meaning": "【名】ロバ", "pos": "名", "example": "Ride a donkey.", "phrase": "stubborn like a donkey", "set": 1},
    {"word": "doom", "meaning": "【名】破滅", "pos": "名", "example": "Sense of doom.", "phrase": "impending doom", "set": 1},
    {"word": "doorkeeper", "meaning": "【名】ドア係", "pos": "名", "example": "Hotel doorkeeper.", "phrase": "ask the doorkeeper", "set": 1},
    {"word": "doorway", "meaning": "【名】戸口", "pos": "名", "example": "Stand in the doorway.", "phrase": "block the doorway", "set": 1},
    {"word": "dorm", "meaning": "【名】寮", "pos": "名", "example": "College dorm.", "phrase": "dorm room", "set": 1},
    {"word": "dormitory", "meaning": "【名】寮（正式）", "pos": "名", "example": "Student dormitory.", "phrase": "dormitory life", "set": 1},
    {"word": "dose", "meaning": "【名】服用量", "pos": "名", "example": "Daily dose.", "phrase": "lethal dose", "set": 1},
    {"word": "double", "meaning": "【名】二倍", "pos": "名", "example": "On the double.", "phrase": "body double", "set": 1},
    {"word": "double", "meaning": "【動】二倍にする", "pos": "動", "example": "Double the profit.", "phrase": "double check", "set": 1},
    {"word": "doubly", "meaning": "【副】二重に", "pos": "副", "example": "Doubly sure.", "phrase": "doubly difficult", "set": 1},
    {"word": "doubt", "meaning": "【動】疑う", "pos": "動", "example": "I doubt it.", "phrase": "doubt the truth", "set": 1},
    {"word": "doubtful", "meaning": "【形】疑わしい", "pos": "形", "example": "It is doubtful.", "phrase": "doubtful about", "set": 1},
    {"word": "dove", "meaning": "【名】ハト", "pos": "名", "example": "Peace dove.", "phrase": "white dove", "set": 1},
    {"word": "down", "meaning": "【形】元気がない", "pos": "形", "example": "Feeling down.", "phrase": "down on one's luck", "set": 1},
    {"word": "downfall", "meaning": "【名】転落、崩壊", "pos": "名", "example": "His downfall.", "phrase": "cause of downfall", "set": 1},
    {"word": "download", "meaning": "【名】ダウンロード", "pos": "名", "example": "Free download.", "phrase": "digital download", "set": 1},
    {"word": "downsize", "meaning": "【動】縮小する", "pos": "動", "example": "Downsize the company.", "phrase": "downsize workforce", "set": 1},
    {"word": "dowry", "meaning": "【名】持参金", "pos": "名", "example": "Marriage dowry.", "phrase": "pay a dowry", "set": 1},
    {"word": "draft", "meaning": "【名】下書き", "pos": "名", "example": "Rough draft.", "phrase": "draft beer", "set": 1},
    {"word": "drain", "meaning": "【名】排水溝、流出", "pos": "名", "example": "Brain drain.", "phrase": "down the drain", "set": 1},
    {"word": "drain", "meaning": "【動】排出する", "pos": "動", "example": "Drain the water.", "phrase": "drain energy", "set": 1},
    {"word": "dramatically", "meaning": "【副】劇的に", "pos": "副", "example": "Changed dramatically.", "phrase": "increase dramatically", "set": 1},
    {"word": "drapery", "meaning": "【名】（厚手の）カーテン", "pos": "名", "example": "Heavy drapery.", "phrase": "window drapery", "set": 1},
    {"word": "draught", "meaning": "【名】隙間風、ドラフト", "pos": "名", "example": "Feel a draught.", "phrase": "draught beer", "set": 1},
    {"word": "dread", "meaning": "【動】恐れる", "pos": "動", "example": "Dread the thought.", "phrase": "dread doing", "set": 1},
    {"word": "dreadful", "meaning": "【形】恐ろしい", "pos": "形", "example": "Dreadful mistake.", "phrase": "dreadful weather", "set": 1},
    {"word": "dreamy", "meaning": "【形】夢のような", "pos": "形", "example": "Dreamy eyes.", "phrase": "dreamy atmosphere", "set": 1},
    {"word": "drinkable", "meaning": "【形】飲める", "pos": "形", "example": "Drinkable water.", "phrase": "barely drinkable", "set": 1},
    {"word": "droop", "meaning": "【名】垂れ下がり (verb mostly)", "pos": "名", "example": "Shoulders droop.", "phrase": "droop down", "set": 1},
    {"word": "dropout", "meaning": "【名】中退者", "pos": "名", "example": "High school dropout.", "phrase": "dropout rate", "set": 1},
    {"word": "drought", "meaning": "【名】干ばつ", "pos": "名", "example": "Severe drought.", "phrase": "drought relief", "set": 1},
    {"word": "duel", "meaning": "【名】決闘", "pos": "名", "example": "Challenge to a duel.", "phrase": "fight a duel", "set": 1},
    {"word": "dumb", "meaning": "【形】口がきけない、ばかげた", "pos": "形", "example": "Dumb luck.", "phrase": "play dumb", "set": 1},
    {"word": "duplicate", "meaning": "【名】複製", "pos": "名", "example": "Duplicate key.", "phrase": "in duplicate", "set": 1},
    {"word": "duplication", "meaning": "【名】重複", "pos": "名", "example": "Avoid duplication.", "phrase": "duplication of effort", "set": 1},
    {"word": "dwarf", "meaning": "【名】小人", "pos": "名", "example": "Snow White and dwarves.", "phrase": "red dwarf", "set": 1},
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
    
    # Re-read the match to act on current file state (Batch 4 modified it).
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
