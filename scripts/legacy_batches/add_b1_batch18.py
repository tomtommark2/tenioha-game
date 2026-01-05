
import json
import re
import os

# B1 Batch 18 (Words 2351-2487, "unlikely" to "yoga")
new_words = [
    {"word": "unlikely", "meaning": "【形】ありそうもない", "pos": "形", "example": "It is unlikely.", "phrase": "highly unlikely", "set": 1},
    {"word": "unlucky", "meaning": "【形】不運な", "pos": "形", "example": "Unlucky number.", "phrase": "unlucky person", "set": 1},
    {"word": "unpack", "meaning": "【動】荷をほどく", "pos": "動", "example": "Unpack the suitcase.", "phrase": "unpack boxes", "set": 1},
    {"word": "unpredictable", "meaning": "【形】予測できない", "pos": "形", "example": "Unpredictable weather.", "phrase": "highly unpredictable", "set": 1},
    {"word": "unrelated", "meaning": "【形】無関係の", "pos": "形", "example": "Unrelated issue.", "phrase": "totally unrelated", "set": 1},
    {"word": "untidy", "meaning": "【形】散らかった", "pos": "形", "example": "Untidy room.", "phrase": "look untidy", "set": 1},
    {"word": "until", "meaning": "【接】～まで", "pos": "接", "example": "Wait until he comes.", "phrase": "until now", "set": 1},
    {"word": "unusually", "meaning": "【副】異例に", "pos": "副", "example": "Unusually hot.", "phrase": "behave unusually", "set": 1},
    {"word": "unwanted", "meaning": "【形】望まれない", "pos": "形", "example": "Unwanted advice.", "phrase": "unwanted hair", "set": 1},
    {"word": "unwell", "meaning": "【形】気分が悪い", "pos": "形", "example": "Feel unwell.", "phrase": "look unwell", "set": 1},
    {"word": "update", "meaning": "【動】更新する", "pos": "動", "example": "Update the software.", "phrase": "update status", "set": 1},
    {"word": "uplifted", "meaning": "【形】高揚した", "pos": "形", "example": "Feel uplifted.", "phrase": "spiritually uplifted", "set": 1},
    {"word": "upload", "meaning": "【動】アップロードする", "pos": "動", "example": "Upload a file.", "phrase": "upload to", "set": 1},
    {"word": "upper", "meaning": "【形】上の、上部の", "pos": "形", "example": "Upper body.", "phrase": "upper class", "set": 1},
    {"word": "upstairs", "meaning": "【形】２階の", "pos": "形", "example": "Upstairs room.", "phrase": "go upstairs", "set": 1},
    {"word": "upstairs", "meaning": "【名】２階", "pos": "名", "example": "Cleaning the upstairs.", "phrase": "live upstairs", "set": 1},
    {"word": "up-to-date", "meaning": "【形】最新の", "pos": "形", "example": "Up-to-date information.", "phrase": "keep up-to-date", "set": 1},
    {"word": "upward", "meaning": "【形】上向きの", "pos": "形", "example": "Upward trend.", "phrase": "upward mobility", "set": 1},
    {"word": "urge", "meaning": "【名】衝動", "pos": "名", "example": "Sudden urge.", "phrase": "fight the urge", "set": 1},
    {"word": "urgent", "meaning": "【形】緊急の", "pos": "形", "example": "Urgent message.", "phrase": "urgent care", "set": 1},
    {"word": "usage", "meaning": "【名】使用法、慣習", "pos": "名", "example": "Correct usage.", "phrase": "English usage", "set": 1},
    {"word": "used to", "meaning": "【助】以前は～だった", "pos": "助", "example": "Used to live here.", "phrase": "get used to", "set": 1},
    {"word": "useless", "meaning": "【形】役に立たない", "pos": "形", "example": "Useless attempt.", "phrase": "totally useless", "set": 1},
    {"word": "vacancy", "meaning": "【名】空き、欠員", "pos": "名", "example": "Job vacancy.", "phrase": "no vacancies", "set": 1},
    {"word": "vague", "meaning": "【形】あいまいな", "pos": "形", "example": "Vague answer.", "phrase": "vague idea", "set": 1},
    {"word": "vain", "meaning": "【形】無駄な、うぬぼれた", "pos": "形", "example": "In vain.", "phrase": "vain attempt", "set": 1},
    {"word": "valuable", "meaning": "【形】貴重な", "pos": "形", "example": "Valuable advice.", "phrase": "valuable asset", "set": 1},
    {"word": "van", "meaning": "【名】バン、小型トラック", "pos": "名", "example": "Drive a van.", "phrase": "delivery van", "set": 1},
    {"word": "variety", "meaning": "【名】多様性、種類", "pos": "名", "example": "Variety of food.", "phrase": "wide variety", "set": 1},
    {"word": "various", "meaning": "【形】さまざまな", "pos": "形", "example": "Various reasons.", "phrase": "various types", "set": 1},
    {"word": "vary", "meaning": "【動】変わる、異なる", "pos": "動", "example": "Opinions vary.", "phrase": "vary from", "set": 1},
    {"word": "vast", "meaning": "【形】広大な", "pos": "形", "example": "Vast area.", "phrase": "vast majority", "set": 1},
    {"word": "vegetarian", "meaning": "【形】菜食主義の", "pos": "形", "example": "Vegetarian meal.", "phrase": "vegetarian diet", "set": 1},
    {"word": "vegetarian", "meaning": "【名】菜食主義者", "pos": "名", "example": "Strict vegetarian.", "phrase": "become a vegetarian", "set": 1},
    {"word": "vehicle", "meaning": "【名】乗り物", "pos": "名", "example": "Motor vehicle.", "phrase": "electric vehicle", "set": 1},
    {"word": "vein", "meaning": "【名】静脈", "pos": "名", "example": "Blue veins.", "phrase": "in the same vein", "set": 1},
    {"word": "vessel", "meaning": "【名】船、容器、血管", "pos": "名", "example": "Fishing vessel.", "phrase": "blood vessel", "set": 1},
    {"word": "vet", "meaning": "【名】獣医", "pos": "名", "example": "Take the dog to the vet.", "phrase": "veterinary surgeon", "set": 1},
    {"word": "via", "meaning": "【前】～経由で", "pos": "前", "example": "Fly via London.", "phrase": "via email", "set": 1},
    {"word": "vice", "meaning": "【形】副～、代理の", "pos": "形", "example": "Vice captain.", "phrase": "vice versa", "set": 1},
    {"word": "vice president", "meaning": "【名】副大統領、副社長", "pos": "名", "example": "US Vice President.", "phrase": "senior vice president", "set": 1},
    {"word": "victim", "meaning": "【名】犠牲者", "pos": "名", "example": "Crime victim.", "phrase": "fall victim to", "set": 1},
    {"word": "victory", "meaning": "【名】勝利", "pos": "名", "example": "Win a victory.", "phrase": "victory celebration", "set": 1},
    {"word": "video clip", "meaning": "【名】ビデオクリップ", "pos": "名", "example": "Watch a video clip.", "phrase": "short video clip", "set": 1},
    {"word": "view", "meaning": "【動】見る、みなす", "pos": "動", "example": "View the landscape.", "phrase": "view as", "set": 1},
    {"word": "viewpoint", "meaning": "【名】観点", "pos": "名", "example": "Different viewpoint.", "phrase": "from my viewpoint", "set": 1},
    {"word": "violence", "meaning": "【名】暴力", "pos": "名", "example": "Domestic violence.", "phrase": "end violence", "set": 1},
    {"word": "violently", "meaning": "【副】激しく", "pos": "副", "example": "Shake violently.", "phrase": "react violently", "set": 1},
    {"word": "virtual", "meaning": "【形】仮想の", "pos": "形", "example": "Virtual reality.", "phrase": "virtual world", "set": 1},
    {"word": "virus", "meaning": "【名】ウイルス", "pos": "名", "example": "Computer virus.", "phrase": "flu virus", "set": 1},
    {"word": "visa", "meaning": "【名】ビザ", "pos": "名", "example": "Tourist visa.", "phrase": "apply for a visa", "set": 1},
    {"word": "visible", "meaning": "【形】目に見える", "pos": "形", "example": "Visible stars.", "phrase": "barely visible", "set": 1},
    {"word": "vision", "meaning": "【名】視力、展望", "pos": "名", "example": "Blurry vision.", "phrase": "vision of the future", "set": 1},
    {"word": "visual", "meaning": "【形】視覚の", "pos": "形", "example": "Visual aids.", "phrase": "visual effects", "set": 1},
    {"word": "visually", "meaning": "【副】視覚的に", "pos": "副", "example": "Visually impaired.", "phrase": "visually stunning", "set": 1},
    {"word": "vivid", "meaning": "【形】鮮やかな", "pos": "形", "example": "Vivid color.", "phrase": "vivid memory", "set": 1},
    {"word": "vividly", "meaning": "【副】鮮やかに", "pos": "副", "example": "Remember vividly.", "phrase": "describe vividly", "set": 1},
    {"word": "volcano", "meaning": "【名】火山", "pos": "名", "example": "Active volcano.", "phrase": "volcano eruption", "set": 1},
    {"word": "volume", "meaning": "【名】音量、巻", "pos": "名", "example": "Turn up the volume.", "phrase": "volume one", "set": 1},
    {"word": "volunteer", "meaning": "【動】ボランティアをする", "pos": "動", "example": "Volunteer at a shelter.", "phrase": "volunteer for", "set": 1},
    {"word": "vote", "meaning": "【動】投票する", "pos": "動", "example": "Vote for him.", "phrase": "cast a vote", "set": 1},
    {"word": "vowel", "meaning": "【名】母音", "pos": "名", "example": "Short vowel.", "phrase": "vowel sound", "set": 1},
    {"word": "voyage", "meaning": "【名】航海", "pos": "名", "example": "Sea voyage.", "phrase": "maiden voyage", "set": 1},
    {"word": "waggon", "meaning": "【名】荷馬車（英）", "pos": "名", "example": "Horse-drawn waggon.", "phrase": "jump on the waggon", "set": 1},
    {"word": "wagon", "meaning": "【名】荷馬車（米）", "pos": "名", "example": "Covered wagon.", "phrase": "station wagon", "set": 1},
    {"word": "wake", "meaning": "【動】起きる、起こす", "pos": "動", "example": "Wake up early.", "phrase": "wake up", "set": 1},
    {"word": "ward", "meaning": "【名】病棟、区", "pos": "名", "example": "Maternity ward.", "phrase": "city ward", "set": 1},
    {"word": "wardrobe", "meaning": "【名】衣装だんす", "pos": "名", "example": "Full wardrobe.", "phrase": "new wardrobe", "set": 1},
    {"word": "warm", "meaning": "【動】温める", "pos": "動", "example": "Warm up the soup.", "phrase": "warm up", "set": 1},
    {"word": "warmly", "meaning": "【副】温かく", "pos": "副", "example": "Greet warmly.", "phrase": "dress warmly", "set": 1},
    {"word": "warmth", "meaning": "【名】暖かさ", "pos": "名", "example": "Feel the warmth.", "phrase": "warmth of the sun", "set": 1},
    {"word": "warn", "meaning": "【動】警告する", "pos": "動", "example": "Warn of danger.", "phrase": "warn against", "set": 1},
    {"word": "warning", "meaning": "【名】警告", "pos": "名", "example": "Warning sign.", "phrase": "give a warning", "set": 1},
    {"word": "warranty", "meaning": "【名】保証", "pos": "名", "example": "Under warranty.", "phrase": "warranty period", "set": 1},
    {"word": "warrior", "meaning": "【名】戦士", "pos": "名", "example": "Brave warrior.", "phrase": "ancient warrior", "set": 1},
    {"word": "washbowl", "meaning": "【名】洗面器", "pos": "名", "example": "Fill the washbowl.", "phrase": "ceramic washbowl", "set": 1},
    {"word": "waste", "meaning": "【形】無駄な、廃物の", "pos": "形", "example": "Waste paper.", "phrase": "waste ground", "set": 1},
    {"word": "waste", "meaning": "【名】無駄、廃棄物", "pos": "名", "example": "Waste of time.", "phrase": "nuclear waste", "set": 1},
    {"word": "waste", "meaning": "【動】浪費する", "pos": "動", "example": "Waste money.", "phrase": "waste time", "set": 1},
    {"word": "wasteful", "meaning": "【形】無駄の多い", "pos": "形", "example": "Wasteful spending.", "phrase": "wasteful habits", "set": 1},
    {"word": "waterfall", "meaning": "【名】滝", "pos": "名", "example": "High waterfall.", "phrase": "Niagara waterfall", "set": 1},
    {"word": "wave", "meaning": "【動】手を振る、波打つ", "pos": "動", "example": "Wave goodbye.", "phrase": "wave at", "set": 1},
    {"word": "wax", "meaning": "【名】ワックス、ろう", "pos": "名", "example": "Candle wax.", "phrase": "ear wax", "set": 1},
    {"word": "wax", "meaning": "【動】ワックスをかける", "pos": "動", "example": "Wax the car.", "phrase": "wax and wane", "set": 1},
    {"word": "weakness", "meaning": "【名】弱点", "pos": "名", "example": "Admit weakness.", "phrase": "show weakness", "set": 1},
    {"word": "weapon", "meaning": "【名】武器", "pos": "名", "example": "Nuclear weapon.", "phrase": "deadly weapon", "set": 1},
    {"word": "weather forecast", "meaning": "【名】天気予報", "pos": "名", "example": "Check the weather forecast.", "phrase": "according to the weather forecast", "set": 1},
    {"word": "webcam", "meaning": "【名】ウェブカメラ", "pos": "名", "example": "Use a webcam.", "phrase": "turn on webcam", "set": 1},
    {"word": "weird", "meaning": "【形】奇妙な", "pos": "形", "example": "Weird behavior.", "phrase": "weird dream", "set": 1},
    {"word": "welcome", "meaning": "【形】歓迎される", "pos": "形", "example": "You are welcome.", "phrase": "welcome guest", "set": 1},
    {"word": "well-dressed", "meaning": "【形】服装のよい", "pos": "形", "example": "Well-dressed man.", "phrase": "always well-dressed", "set": 1},
    {"word": "westward", "meaning": "【副】西へ", "pos": "副", "example": "Travel westward.", "phrase": "look westward", "set": 1},
    {"word": "westwards", "meaning": "【副】西へ（英）", "pos": "副", "example": "Move westwards.", "phrase": "head westwards", "set": 1},
    {"word": "wetland", "meaning": "【名】湿地", "pos": "名", "example": "Protect the wetland.", "phrase": "wetland preservation", "set": 1},
    {"word": "whale", "meaning": "【名】クジラ", "pos": "名", "example": "Blue whale.", "phrase": "whale watching", "set": 1},
    {"word": "whatever", "meaning": "【代】何でも", "pos": "代", "example": "Do whatever you like.", "phrase": "or whatever", "set": 1},
    {"word": "whenever", "meaning": "【副】いつ～しようとも", "pos": "副", "example": "Come whenever.", "phrase": "whenever possible", "set": 1},
    {"word": "whenever", "meaning": "【接】～するときはいつでも", "pos": "接", "example": "Call me whenever you want.", "phrase": "whenever I go", "set": 1},
    {"word": "wherever", "meaning": "【接】～するところならどこでも", "pos": "接", "example": "Go wherever you like.", "phrase": "wherever I go", "set": 1},
    {"word": "whether", "meaning": "【接】～かどうか", "pos": "接", "example": "Whether rich or poor.", "phrase": "whether or not", "set": 1},
    {"word": "whichever", "meaning": "【限】どちらの～でも", "pos": "限", "example": "Take whichever book you like.", "phrase": "whichever way", "set": 1},
    {"word": "while", "meaning": "【名】時間", "pos": "名", "example": "Wait a while.", "phrase": "for a while", "set": 1},
    {"word": "whisper", "meaning": "【名】ささやき", "pos": "名", "example": "Speak in a whisper.", "phrase": "Chinese whisper", "set": 1},
    {"word": "whistle", "meaning": "【名】笛、口笛", "pos": "名", "example": "Blow a whistle.", "phrase": "dog whistle", "set": 1},
    {"word": "whoever", "meaning": "【代】誰でも", "pos": "代", "example": "Whoever did this.", "phrase": "whoever wins", "set": 1},
    {"word": "whole", "meaning": "【名】全体", "pos": "名", "example": "The whole of the story.", "phrase": "as a whole", "set": 1},
    {"word": "widespread", "meaning": "【形】広範囲にわたる", "pos": "形", "example": "Widespread panic.", "phrase": "widespread use", "set": 1},
    {"word": "wildlife", "meaning": "【名】野生生物", "pos": "名", "example": "Protect wildlife.", "phrase": "wildlife sanctuary", "set": 1},
    {"word": "wildly", "meaning": "【副】乱暴に、すごく", "pos": "副", "example": "Wave wildly.", "phrase": "wildly popular", "set": 1},
    {"word": "willingness", "meaning": "【名】意欲", "pos": "名", "example": "Willingness to learn.", "phrase": "show willingness", "set": 1},
    {"word": "windscreen", "meaning": "【名】フロントガラス（英）", "pos": "名", "example": "Cracked windscreen.", "phrase": "windscreen wiper", "set": 1},
    {"word": "windsurfing", "meaning": "【名】ウィンドサーフィン", "pos": "名", "example": "Go windsurfing.", "phrase": "windsurfing board", "set": 1},
    {"word": "wing", "meaning": "【名】翼", "pos": "名", "example": "Bird's wing.", "phrase": "left wing", "set": 1},
    {"word": "wire", "meaning": "【名】針金、電線", "pos": "名", "example": "Copper wire.", "phrase": "barbed wire", "set": 1},
    {"word": "wither", "meaning": "【動】しおれる", "pos": "動", "example": "Flowers wither.", "phrase": "wither away", "set": 1},
    {"word": "witness", "meaning": "【動】目撃する", "pos": "動", "example": "Witness an accident.", "phrase": "bear witness", "set": 1},
    {"word": "wizard", "meaning": "【形】魔法使いの", "pos": "形", "example": "Wizard hat.", "phrase": "computer wizard", "set": 1},
    # Note: Wizard is primarily a noun, but B1 CSV says adjective. 
    # Actually CSV says B1 'wizard' adjective.
    
    {"word": "wonder", "meaning": "【名】驚き、不思議", "pos": "名", "example": "No wonder.", "phrase": "natural wonder", "set": 1},
    {"word": "working", "meaning": "【形】働いている、作動している", "pos": "形", "example": "Working mother.", "phrase": "working class", "set": 1},
    {"word": "workout", "meaning": "【名】運動", "pos": "名", "example": "Daily workout.", "phrase": "gym workout", "set": 1},
    {"word": "workplace", "meaning": "【名】職場", "pos": "名", "example": "Safe workplace.", "phrase": "workplace safety", "set": 1},
    {"word": "workshop", "meaning": "【名】作業場、研修会", "pos": "名", "example": "Attend a workshop.", "phrase": "writer's workshop", "set": 1},
    {"word": "worn", "meaning": "【形】すり切れた", "pos": "形", "example": "Worn shoes.", "phrase": "worn out", "set": 1},
    {"word": "worst", "meaning": "【名】最悪の事態", "pos": "名", "example": "Prepare for the worst.", "phrase": "at worst", "set": 1},
    {"word": "worth", "meaning": "【形】価値がある", "pos": "形", "example": "Worth reading.", "phrase": "worth it", "set": 1},
    {"word": "worthwhile", "meaning": "【形】価値のある", "pos": "形", "example": "Worthwhile effort.", "phrase": "make it worthwhile", "set": 1},
    {"word": "worthy", "meaning": "【形】価値のある", "pos": "形", "example": "Trustworthy.", "phrase": "worthy of", "set": 1},
    {"word": "wound", "meaning": "【名】傷", "pos": "名", "example": "Deep wound.", "phrase": "bullet wound", "set": 1},
    {"word": "wrap", "meaning": "【名】包装、ラップ", "pos": "名", "example": "Plastic wrap.", "phrase": "gift wrap", "set": 1},
    {"word": "wrap", "meaning": "【動】包む", "pos": "動", "example": "Wrap a gift.", "phrase": "wrap up", "set": 1},
    {"word": "wrapping", "meaning": "【名】包装", "pos": "名", "example": "Wrapping paper.", "phrase": "gift wrapping", "set": 1},
    {"word": "wrist", "meaning": "【名】手首", "pos": "名", "example": "Sprain wrist.", "phrase": "wrist watch", "set": 1},
    {"word": "wristwatch", "meaning": "【名】腕時計", "pos": "名", "example": "Wear a wristwatch.", "phrase": "gold wristwatch", "set": 1},
    {"word": "written", "meaning": "【形】書かれた", "pos": "形", "example": "Written exam.", "phrase": "written agreement", "set": 1},
    {"word": "yell", "meaning": "【名】叫び声", "pos": "名", "example": "Loud yell.", "phrase": "give a yell", "set": 1},
    {"word": "yet", "meaning": "【接】けれども", "pos": "接", "example": "Strange yet true.", "phrase": "and yet", "set": 1},
    {"word": "yoga", "meaning": "【名】ヨガ", "pos": "名", "example": "Do yoga.", "phrase": "yoga class", "set": 1}
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
