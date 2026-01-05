
import json
import re
import os

# B1 Batch 10 (Words 1151-1300, "informative" to "literature")
new_words = [
    {"word": "informative", "meaning": "【形】有益な、情報の多い", "pos": "形", "example": "Informative book.", "phrase": "highly informative", "set": 1},
    {"word": "ingredient", "meaning": "【名】材料", "pos": "名", "example": "Natural ingredients.", "phrase": "main ingredient", "set": 1},
    {"word": "inhabitant", "meaning": "【名】住民", "pos": "名", "example": "Inhabitants of the island.", "phrase": "original inhabitants", "set": 1},
    {"word": "inhale", "meaning": "【動】吸い込む", "pos": "動", "example": "Inhale deeply.", "phrase": "inhale smoke", "set": 1},
    {"word": "initial", "meaning": "【名】頭文字", "pos": "名", "example": "My initials are J.S.", "phrase": "sign with initials", "set": 1},
    {"word": "initially", "meaning": "【副】初めは", "pos": "副", "example": "Initially, I was worried.", "phrase": "initially planned", "set": 1},
    {"word": "inject", "meaning": "【動】注入する", "pos": "動", "example": "Inject insulin.", "phrase": "inject capital", "set": 1},
    {"word": "injury", "meaning": "【名】怪我", "pos": "名", "example": "Serious injury.", "phrase": "recover from injury", "set": 1},
    {"word": "ink", "meaning": "【名】インク", "pos": "名", "example": "Black ink.", "phrase": "write in ink", "set": 1},
    {"word": "innermost", "meaning": "【形】最も奥の", "pos": "形", "example": "Innermost thoughts.", "phrase": "innermost circle", "set": 1},
    {"word": "innocent", "meaning": "【形】無実の", "pos": "形", "example": "Innocent victim.", "phrase": "innocent of", "set": 1},
    {"word": "innovator", "meaning": "【名】革新者", "pos": "名", "example": "He is a true innovator.", "phrase": "leading innovator", "set": 1},
    {"word": "inquiry", "meaning": "【名】調査、問い合わせ", "pos": "名", "example": "Make an inquiry.", "phrase": "public inquiry", "set": 1},
    {"word": "insane", "meaning": "【形】正気でない", "pos": "形", "example": "You are insane.", "phrase": "go insane", "set": 1},
    {"word": "inscribe", "meaning": "【動】刻む", "pos": "動", "example": "Inscribe a name.", "phrase": "inscribe on", "set": 1},
    {"word": "inscription", "meaning": "【名】碑文", "pos": "名", "example": "Read the inscription.", "phrase": "inscription on the wall", "set": 1},
    {"word": "insight", "meaning": "【名】洞察力", "pos": "名", "example": "Deep insight.", "phrase": "gain insight", "set": 1},
    {"word": "insist", "meaning": "【動】主張する", "pos": "動", "example": "I insist on going.", "phrase": "insist that", "set": 1},
    {"word": "inspection", "meaning": "【名】検査", "pos": "名", "example": "Safety inspection.", "phrase": "pass inspection", "set": 1},
    {"word": "inspire", "meaning": "【動】奮起させる", "pos": "動", "example": "Inspire others.", "phrase": "inspire confidence", "set": 1},
    # 'instal' is variant of 'install'. Add both if they are distinct in CSV.
    {"word": "instal", "meaning": "【動】取り付ける（英綴り）", "pos": "動", "example": "Instal software.", "phrase": "instal a system", "set": 1},
    {"word": "install", "meaning": "【動】取り付ける", "pos": "動", "example": "Install a program.", "phrase": "install in", "set": 1},
    {"word": "instance", "meaning": "【名】実例", "pos": "名", "example": "For instance.", "phrase": "in this instance", "set": 1},
    {"word": "instead of", "meaning": "【前】～の代わりに", "pos": "前", "example": "Tea instead of coffee.", "phrase": "instead of me", "set": 1},
    {"word": "institute", "meaning": "【名】研究所、協会", "pos": "名", "example": "Research institute.", "phrase": "art institute", "set": 1},
    {"word": "instruction", "meaning": "【名】指示、指導", "pos": "名", "example": "Follow instructions.", "phrase": "give instructions", "set": 1},
    {"word": "instructor", "meaning": "【名】インストラクター", "pos": "名", "example": "Driving instructor.", "phrase": "ski instructor", "set": 1},
    {"word": "insurance", "meaning": "【名】保険", "pos": "名", "example": "Health insurance.", "phrase": "insurance policy", "set": 1},
    {"word": "intend", "meaning": "【動】意図する", "pos": "動", "example": "I intend to go.", "phrase": "intend to", "set": 1},
    {"word": "intense", "meaning": "【形】激しい", "pos": "形", "example": "Intense heat.", "phrase": "intense pressure", "set": 1},
    {"word": "intensive", "meaning": "【形】集中的な", "pos": "形", "example": "Intensive care.", "phrase": "intensive course", "set": 1},
    {"word": "intention", "meaning": "【名】意図", "pos": "名", "example": "Good intentions.", "phrase": "with the intention of", "set": 1},
    {"word": "intentionally", "meaning": "【副】意図的に", "pos": "副", "example": "Do it intentionally.", "phrase": "intentionally or not", "set": 1},
    {"word": "interact", "meaning": "【動】相互作用する", "pos": "動", "example": "Interact with people.", "phrase": "interact closely", "set": 1},
    {"word": "interaction", "meaning": "【名】相互作用", "pos": "名", "example": "Social interaction.", "phrase": "human interaction", "set": 1},
    {"word": "interest", "meaning": "【動】興味を持たせる", "pos": "動", "example": "History interests me.", "phrase": "interest someone in", "set": 1},
    {"word": "intermediate", "meaning": "【形】中間の、中級の", "pos": "形", "example": "Intermediate level.", "phrase": "intermediate student", "set": 1},
    {"word": "intermission", "meaning": "【名】休憩時間", "pos": "名", "example": "During the intermission.", "phrase": "brief intermission", "set": 1},
    {"word": "internal", "meaning": "【形】内部の", "pos": "形", "example": "Internal organs.", "phrase": "internal affairs", "set": 1},
    {"word": "internationally", "meaning": "【副】国際的に", "pos": "副", "example": "Recognized internationally.", "phrase": "known internationally", "set": 1},
    {"word": "interrupt", "meaning": "【動】妨げる、中断する", "pos": "動", "example": "Don't interrupt me.", "phrase": "interrupt a conversation", "set": 1},
    {"word": "interval", "meaning": "【名】間隔", "pos": "名", "example": "At intervals.", "phrase": "time interval", "set": 1},
    {"word": "interview", "meaning": "【動】面接する", "pos": "動", "example": "Interview a candidate.", "phrase": "be interviewed", "set": 1},
    {"word": "interviewee", "meaning": "【名】面接を受ける人", "pos": "名", "example": "Nervous interviewee.", "phrase": "interviewee for the job", "set": 1},
    {"word": "introduction", "meaning": "【名】紹介、導入", "pos": "名", "example": "Brief introduction.", "phrase": "make an introduction", "set": 1},
    {"word": "invasion", "meaning": "【名】侵略", "pos": "名", "example": "Military invasion.", "phrase": "invasion of privacy", "set": 1},
    {"word": "invest", "meaning": "【動】投資する", "pos": "動", "example": "Invest money.", "phrase": "invest in", "set": 1},
    {"word": "investigation", "meaning": "【名】調査", "pos": "名", "example": "Criminal investigation.", "phrase": "under investigation", "set": 1},
    {"word": "invitation", "meaning": "【名】招待", "pos": "名", "example": "Wedding invitation.", "phrase": "accept an invitation", "set": 1},
    {"word": "involuntarily", "meaning": "【副】不本意に、無意識に", "pos": "副", "example": "Shudder involuntarily.", "phrase": "move involuntarily", "set": 1},
    {"word": "involve", "meaning": "【動】巻き込む、含む", "pos": "動", "example": "Involve risks.", "phrase": "get involved", "set": 1},
    {"word": "involved", "meaning": "【形】関わっている、複雑な", "pos": "形", "example": "Get involved in.", "phrase": "deeply involved", "set": 1},
    {"word": "iron", "meaning": "【名】鉄、アイロン", "pos": "名", "example": "Made of iron.", "phrase": "iron deficiency", "set": 1},
    {"word": "iron", "meaning": "【動】アイロンをかける", "pos": "動", "example": "Iron a shirt.", "phrase": "iron out", "set": 1},
    {"word": "ironing", "meaning": "【名】アイロンがけ（再チェック）", "pos": "名", "example": "Do the ironing.", "phrase": "pile of ironing", "set": 1},
    # Note: 'ironing' might be duplicate if restored. We'll check carefully.
    
    {"word": "irregular", "meaning": "【形】不規則な", "pos": "形", "example": "Irregular heartbeat.", "phrase": "irregular verbs", "set": 1},
    {"word": "irritate", "meaning": "【動】いらいらさせる", "pos": "動", "example": "Don't irritate him.", "phrase": "irritate the skin", "set": 1},
    {"word": "isle", "meaning": "【名】小島", "pos": "名", "example": "Isle of Wight.", "phrase": "desert isle", "set": 1},
    {"word": "isolation", "meaning": "【名】孤立", "pos": "名", "example": "Live in isolation.", "phrase": "social isolation", "set": 1},
    {"word": "ivory", "meaning": "【名】象牙", "pos": "名", "example": "Ivory tower.", "phrase": "ivory trade", "set": 1},
    {"word": "jade", "meaning": "【名】翡翠", "pos": "名", "example": "Jade jewelry.", "phrase": "green jade", "set": 1},
    {"word": "jail", "meaning": "【名】刑務所", "pos": "名", "example": "Go to jail.", "phrase": "jail sentence", "set": 1},
    {"word": "jar", "meaning": "【名】瓶", "pos": "名", "example": "Jam jar.", "phrase": "jar of honey", "set": 1},
    {"word": "jazz", "meaning": "【名】ジャズ", "pos": "名", "example": "Jazz music.", "phrase": "jazz band", "set": 1},
    {"word": "jealous", "meaning": "【形】嫉妬深い", "pos": "形", "example": "Jealous husband.", "phrase": "jealous of", "set": 1},
    {"word": "jewel", "meaning": "【名】宝石", "pos": "名", "example": "Crown jewels.", "phrase": "precious jewel", "set": 1},
    {"word": "jog", "meaning": "【動】ジョギングする", "pos": "動", "example": "Jog in the park.", "phrase": "go for a jog", "set": 1},
    {"word": "jogging", "meaning": "【名】ジョギング", "pos": "名", "example": "Go jogging.", "phrase": "jogging shoes", "set": 1},
    {"word": "joint", "meaning": "【形】共同の", "pos": "形", "example": "Joint effot.", "phrase": "joint account", "set": 1},
    {"word": "joke", "meaning": "【動】冗談を言う", "pos": "動", "example": "He is joking.", "phrase": "joke about", "set": 1},
    {"word": "journal", "meaning": "【名】日誌、専門誌", "pos": "名", "example": "Write a journal.", "phrase": "scientific journal", "set": 1},
    {"word": "journalist", "meaning": "【名】ジャーナリスト", "pos": "名", "example": "Work as a journalist.", "phrase": "freelance journalist", "set": 1},
    {"word": "judge", "meaning": "【名】裁判官、審査員", "pos": "名", "example": "The judge ruled.", "phrase": "judge of character", "set": 1},
    {"word": "judgement", "meaning": "【名】判断", "pos": "名", "example": "Poor judgement.", "phrase": "pass judgement", "set": 1},
    {"word": "judgment", "meaning": "【名】判断（米）", "pos": "名", "example": "Good judgment.", "phrase": "judgment day", "set": 1},
    {"word": "jug", "meaning": "【名】水差し", "pos": "名", "example": "Jug of water.", "phrase": "milk jug", "set": 1},
    {"word": "juicy", "meaning": "【形】汁の多い", "pos": "形", "example": "Juicy fruit.", "phrase": "juicy steak", "set": 1},
    {"word": "jumper", "meaning": "【名】ジャンパー（英：セーター）", "pos": "名", "example": "Wear a warm jumper.", "phrase": "woolly jumper", "set": 1},
    {"word": "jungle", "meaning": "【名】ジャングル", "pos": "名", "example": "Dense jungle.", "phrase": "law of the jungle", "set": 1},
    {"word": "justice", "meaning": "【名】正義", "pos": "名", "example": "Justice system.", "phrase": "justice of the peace", "set": 1},
    {"word": "kettle", "meaning": "【名】やかん", "pos": "名", "example": "Boil the kettle.", "phrase": "electric kettle", "set": 1},
    {"word": "keyboard", "meaning": "【名】キーボード", "pos": "名", "example": "Computer keyboard.", "phrase": "keyboard player", "set": 1},
    {"word": "kid", "meaning": "【動】からかう", "pos": "動", "example": "I'm just kidding.", "phrase": "no kidding", "set": 1},
    {"word": "killing", "meaning": "【名】殺害", "pos": "名", "example": "Mass killing.", "phrase": "killing fields", "set": 1},
    {"word": "kindly", "meaning": "【副】親切に", "pos": "副", "example": "Speak kindly.", "phrase": "treat kindly", "set": 1},
    {"word": "kindness", "meaning": "【名】親切", "pos": "名", "example": "Act of kindness.", "phrase": "kill with kindness", "set": 1},
    {"word": "kiss", "meaning": "【動】キスする", "pos": "動", "example": "Kiss goodbye.", "phrase": "kiss and tell", "set": 1},
    {"word": "kitten", "meaning": "【名】子猫", "pos": "名", "example": "Cute kitten.", "phrase": "playful kitten", "set": 1},
    {"word": "knit", "meaning": "【動】編む", "pos": "動", "example": "Knit a sweater.", "phrase": "knit together", "set": 1},
    {"word": "knock", "meaning": "【動】ノックする、叩く", "pos": "動", "example": "Knock on the door.", "phrase": "knock out", "set": 1},
    {"word": "lab", "meaning": "【名】実験室（略）", "pos": "名", "example": "Science lab.", "phrase": "lab coat", "set": 1},
    {"word": "laboratory", "meaning": "【名】実験室", "pos": "名", "example": "Research laboratory.", "phrase": "laboratory test", "set": 1},
    {"word": "ladder", "meaning": "【名】はしご", "pos": "名", "example": "Climb a ladder.", "phrase": "ladder of success", "set": 1},
    {"word": "lamb", "meaning": "【名】子羊（肉）", "pos": "名", "example": "Roast lamb.", "phrase": "gentle as a lamb", "set": 1},
    {"word": "land", "meaning": "【名】陸、土地", "pos": "名", "example": "Buy land.", "phrase": "land mine", "set": 1},
    {"word": "landlord", "meaning": "【名】大家", "pos": "名", "example": "Pay the landlord.", "phrase": "landlord and tenant", "set": 1},
    {"word": "largely", "meaning": "【副】主に", "pos": "副", "example": "Largely ignored.", "phrase": "largely due to", "set": 1},
    {"word": "last", "meaning": "【副】最後に", "pos": "副", "example": "He arrived last.", "phrase": "last but not least", "set": 1},
    {"word": "last", "meaning": "【動】続く", "pos": "動", "example": "The meeting lasted an hour.", "phrase": "last forever", "set": 1},
    {"word": "lasting", "meaning": "【形】長続きする", "pos": "形", "example": "Lasting peace.", "phrase": "lasting impression", "set": 1},
    {"word": "latecomer", "meaning": "【名】遅刻者", "pos": "名", "example": "Latecomers will not be admitted.", "phrase": "habitual latecomer", "set": 1},
    {"word": "lately", "meaning": "【副】最近", "pos": "副", "example": "Have you seen him lately?", "phrase": "lately I feel", "set": 1},
    {"word": "laugh", "meaning": "【名】笑い", "pos": "名", "example": "Have a laugh.", "phrase": "loud laugh", "set": 1},
    {"word": "laughter", "meaning": "【名】笑い声", "pos": "名", "example": "Burst of laughter.", "phrase": "laughter is the best medicine", "set": 1},
    {"word": "launch", "meaning": "【動】発射する、開始する", "pos": "動", "example": "Launch a rocket.", "phrase": "launch a product", "set": 1},
    {"word": "lawful", "meaning": "【形】合法的な", "pos": "形", "example": "Lawful act.", "phrase": "lawful owner", "set": 1},
    {"word": "lay", "meaning": "【動】置く、横たえる", "pos": "動", "example": "Lay the table.", "phrase": "lay down", "set": 1},
    {"word": "layer", "meaning": "【名】層", "pos": "名", "example": "Ozone layer.", "phrase": "top layer", "set": 1},
    {"word": "lead", "meaning": "【形】先頭の", "pos": "形", "example": "Lead singer.", "phrase": "lead role", "set": 1},
    {"word": "lead", "meaning": "【動】導く", "pos": "動", "example": "Lead the way.", "phrase": "lead to", "set": 1},
    {"word": "leadership", "meaning": "【名】指導力", "pos": "名", "example": "Strong leadership.", "phrase": "leadership skills", "set": 1},
    {"word": "leading", "meaning": "【形】主要な", "pos": "形", "example": "Leading expert.", "phrase": "leading question", "set": 1},
    {"word": "league", "meaning": "【名】連盟、リーグ", "pos": "名", "example": "Football league.", "phrase": "major league", "set": 1},
    {"word": "lean", "meaning": "【形】痩せた", "pos": "形", "example": "Lean meat.", "phrase": "lean and mean", "set": 1},
    {"word": "leap", "meaning": "【動】跳ぶ", "pos": "動", "example": "Leap over a fence.", "phrase": "leap year", "set": 1},
    {"word": "least", "meaning": "【副】最も少なく", "pos": "副", "example": "Least expected.", "phrase": "at least", "set": 1},
    {"word": "leave", "meaning": "【名】休暇", "pos": "名", "example": "Sick leave.", "phrase": "on leave", "set": 1},
    {"word": "lecture", "meaning": "【名】講義", "pos": "名", "example": "Attend a lecture.", "phrase": "give a lecture", "set": 1},
    {"word": "legal", "meaning": "【形】法律の、合法の", "pos": "形", "example": "Legal advice.", "phrase": "legal action", "set": 1},
    {"word": "legally", "meaning": "【副】法的に", "pos": "副", "example": "Legally binding.", "phrase": "legally responsible", "set": 1},
    {"word": "length", "meaning": "【名】長さ", "pos": "名", "example": "Length of time.", "phrase": "at length", "set": 1},
    {"word": "lessen", "meaning": "【動】減らす", "pos": "動", "example": "Lessen the pain.", "phrase": "lessen the impact", "set": 1},
    {"word": "lettuce", "meaning": "【名】レタス", "pos": "名", "example": "Fresh lettuce.", "phrase": "lettuce leaf", "set": 1},
    {"word": "level", "meaning": "【形】平らな、水平な", "pos": "形", "example": "Level ground.", "phrase": "level playing field", "set": 1},
    {"word": "liar", "meaning": "【名】嘘つき", "pos": "名", "example": "He is a liar.", "phrase": "poor liar", "set": 1},
    {"word": "liberate", "meaning": "【動】解放する", "pos": "動", "example": "Liberate a city.", "phrase": "liberate from", "set": 1},
    {"word": "liberation", "meaning": "【名】解放", "pos": "名", "example": "National liberation.", "phrase": "women's liberation", "set": 1},
    {"word": "librarian", "meaning": "【名】司書", "pos": "名", "example": "Ask the librarian.", "phrase": "head librarian", "set": 1},
    {"word": "lie", "meaning": "【名】嘘", "pos": "名", "example": "Tell a lie.", "phrase": "white lie", "set": 1},
    {"word": "lifeguard", "meaning": "【名】ライフガード", "pos": "名", "example": "The lifeguard saved him.", "phrase": "lifeguard on duty", "set": 1},
    {"word": "lifelong", "meaning": "【形】生涯の", "pos": "形", "example": "Lifelong friend.", "phrase": "lifelong learning", "set": 1},
    {"word": "lift", "meaning": "【名】エレベーター（英）、持ち上げ", "pos": "名", "example": "Take the lift.", "phrase": "give a lift", "set": 1},
    {"word": "lift", "meaning": "【動】持ち上げる", "pos": "動", "example": "Lift a heavy box.", "phrase": "lift the ban", "set": 1},
    {"word": "light", "meaning": "【動】火をつける、照らす", "pos": "動", "example": "Light a candle.", "phrase": "light up", "set": 1},
    {"word": "lighter", "meaning": "【名】ライター", "pos": "名", "example": "Cigarette lighter.", "phrase": "borrow a lighter", "set": 1},
    {"word": "lightly", "meaning": "【副】軽く", "pos": "副", "example": "Touch lightly.", "phrase": "take lightly", "set": 1},
    {"word": "lightning", "meaning": "【名】稲妻", "pos": "名", "example": "Struck by lightning.", "phrase": "lightning bolt", "set": 1},
    {"word": "like", "meaning": "【接】～のように", "pos": "接", "example": "Do it like I do.", "phrase": "looks like", "set": 1},
    {"word": "likeness", "meaning": "【名】似ていること、肖像", "pos": "名", "example": "Family likeness.", "phrase": "good likeness", "set": 1},
    {"word": "limit", "meaning": "【名】制限", "pos": "名", "example": "Speed limit.", "phrase": "limit to", "set": 1},
    {"word": "limit", "meaning": "【動】制限する", "pos": "動", "example": "Limit the number.", "phrase": "limit yourself", "set": 1},
    {"word": "limitation", "meaning": "【名】制限、限界", "pos": "名", "example": "Know your limitations.", "phrase": "time limitation", "set": 1},
    {"word": "limited", "meaning": "【形】限られた", "pos": "形", "example": "Limited edition.", "phrase": "limited time", "set": 1},
    {"word": "limp", "meaning": "【動】足を引きずる", "pos": "動", "example": "Limp home.", "phrase": "limp along", "set": 1},
    {"word": "link", "meaning": "【名】関連、リンク", "pos": "名", "example": "Missing link.", "phrase": "link between", "set": 1},
    {"word": "link", "meaning": "【動】関連付ける", "pos": "動", "example": "Link A to B.", "phrase": "linked with", "set": 1},
    {"word": "liquid", "meaning": "【形】液体の", "pos": "形", "example": "Liquid soap.", "phrase": "liquid assets", "set": 1},
    {"word": "liquid", "meaning": "【名】液体", "pos": "名", "example": "Drink plenty of liquids.", "phrase": "flammable liquid", "set": 1},
    {"word": "literary", "meaning": "【形】文学の", "pos": "形", "example": "Literary works.", "phrase": "literary criticism", "set": 1},
    {"word": "literature", "meaning": "【名】文学", "pos": "名", "example": "English literature.", "phrase": "classic literature", "set": 1}
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
