
import json
import re
import os

# B1 Batch 11 (Words 1301-1450, "little" to "nationalist")
new_words = [
    {"word": "little", "meaning": "【定】少しの", "pos": "other", "example": "A little water.", "phrase": "a little bit", "set": 1},
    {"word": "little", "meaning": "【代】少し", "pos": "代", "example": "I know a little.", "phrase": "little by little", "set": 1},
    # Note: 'little' determiner maps to 'other' or specific handling? CEFR-J 'determiner' -> 'other' in our mapping. 
    # But usually 'little' (adj) is already in lower levels? 
    # The user instruction says same word different POS is separate.
    
    {"word": "live", "meaning": "【形】生きている、生の", "pos": "形", "example": "Live broadcast.", "phrase": "live music", "set": 1},
    {"word": "liver", "meaning": "【名】肝臓", "pos": "名", "example": "Liver pâté.", "phrase": "liver damage", "set": 1},
    {"word": "loaf", "meaning": "【名】一斤、塊", "pos": "名", "example": "Loaf of bread.", "phrase": "meat loaf", "set": 1},
    {"word": "locate", "meaning": "【動】位置を突き止める、置く", "pos": "動", "example": "Locate the source.", "phrase": "be located in", "set": 1},
    {"word": "location", "meaning": "【名】場所", "pos": "名", "example": "Exact location.", "phrase": "prime location", "set": 1},
    {"word": "lock", "meaning": "【動】鍵をかける", "pos": "動", "example": "Lock the door.", "phrase": "lock up", "set": 1},
    {"word": "lodge", "meaning": "【名】小屋、ロッジ", "pos": "名", "example": "Ski lodge.", "phrase": "hunting lodge", "set": 1},
    {"word": "log", "meaning": "【名】丸太、記録", "pos": "名", "example": "Log cabin.", "phrase": "keep a log", "set": 1},
    {"word": "logic", "meaning": "【名】論理", "pos": "名", "example": "There is no logic in his argument.", "phrase": "use logic", "set": 1},
    {"word": "logo", "meaning": "【名】ロゴ", "pos": "名", "example": "Company logo.", "phrase": "design a logo", "set": 1},
    {"word": "lorry", "meaning": "【名】トラック（英）", "pos": "名", "example": "Drive a lorry.", "phrase": "lorry driver", "set": 1},
    {"word": "loss", "meaning": "【名】喪失、損失", "pos": "名", "example": "Weight loss.", "phrase": "at a loss", "set": 1},
    {"word": "lottery", "meaning": "【名】宝くじ", "pos": "名", "example": "Win the lottery.", "phrase": "national lottery", "set": 1},
    {"word": "loud", "meaning": "【形】うるさい", "pos": "形", "example": "Loud noise.", "phrase": "loud voice", "set": 1},
    {"word": "loud", "meaning": "【副】大声で", "pos": "副", "example": "Laugh loud.", "phrase": "out loud", "set": 1},
    {"word": "loudspeaker", "meaning": "【名】拡声器", "pos": "名", "example": "Announce over the loudspeaker.", "phrase": "turn down the loudspeaker", "set": 1},
    {"word": "lovingly", "meaning": "【副】愛情を込めて", "pos": "副", "example": "Look lovingly.", "phrase": "lovingly prepared", "set": 1},
    {"word": "loyal", "meaning": "【形】忠実な", "pos": "形", "example": "Loyal friend.", "phrase": "loyal to", "set": 1},
    {"word": "loyalty", "meaning": "【名】忠誠心", "pos": "名", "example": "Pledge loyalty.", "phrase": "customer loyalty", "set": 1},
    {"word": "luggage", "meaning": "【名】荷物", "pos": "名", "example": "Carry luggage.", "phrase": "hand luggage", "set": 1},
    {"word": "lung", "meaning": "【名】肺", "pos": "名", "example": "Lung cancer.", "phrase": "lung capacity", "set": 1},
    {"word": "luxury", "meaning": "【名】贅沢", "pos": "名", "example": "Live in luxury.", "phrase": "luxury car", "set": 1},
    {"word": "magical", "meaning": "【形】魔法の", "pos": "形", "example": "Magical power.", "phrase": "magical moment", "set": 1},
    {"word": "magician", "meaning": "【名】手品師、魔法使い", "pos": "名", "example": "The magician performed tricks.", "phrase": "talented magician", "set": 1},
    {"word": "magnificent", "meaning": "【形】壮大な", "pos": "形", "example": "Magnificent view.", "phrase": "magnificent palace", "set": 1},
    {"word": "mail", "meaning": "【動】郵送する", "pos": "動", "example": "Mail a letter.", "phrase": "mail it to me", "set": 1},
    {"word": "mailbox", "meaning": "【名】郵便受け", "pos": "名", "example": "Check the mailbox.", "phrase": "full mailbox", "set": 1},
    {"word": "main", "meaning": "【形】主な", "pos": "形", "example": "Main reason.", "phrase": "main street", "set": 1},
    {"word": "maintain", "meaning": "【動】維持する", "pos": "動", "example": "Maintain health.", "phrase": "maintain standards", "set": 1},
    {"word": "maintenance", "meaning": "【名】維持、整備", "pos": "名", "example": "Car maintenance.", "phrase": "high maintenance", "set": 1},
    {"word": "majority", "meaning": "【名】過半数", "pos": "名", "example": "The majority of people.", "phrase": "vast majority", "set": 1},
    {"word": "male", "meaning": "【形】オスの、男性の", "pos": "形", "example": "Male bird.", "phrase": "male nurse", "set": 1},
    {"word": "management", "meaning": "【名】経営、管理", "pos": "名", "example": "Time management.", "phrase": "management team", "set": 1},
    {"word": "mankind", "meaning": "【名】人類", "pos": "名", "example": "History of mankind.", "phrase": "benefit mankind", "set": 1},
    {"word": "maple", "meaning": "【名】カエデ", "pos": "名", "example": "Maple syrup.", "phrase": "maple leaf", "set": 1},
    {"word": "marble", "meaning": "【名】大理石、ビー玉", "pos": "名", "example": "Marble floor.", "phrase": "lose one's marbles", "set": 1},
    {"word": "march", "meaning": "【名】行進", "pos": "名", "example": "Protest march.", "phrase": "on the march", "set": 1},
    {"word": "march", "meaning": "【動】行進する", "pos": "動", "example": "March forward.", "phrase": "march in step", "set": 1},
    {"word": "marine", "meaning": "【形】海の", "pos": "形", "example": "Marine life.", "phrase": "marine biology", "set": 1},
    {"word": "marked", "meaning": "【形】著しい", "pos": "形", "example": "Marked improvement.", "phrase": "marked difference", "set": 1},
    {"word": "market", "meaning": "【動】売り込む", "pos": "動", "example": "Market a product.", "phrase": "test market", "set": 1},
    {"word": "marriage", "meaning": "【名】結婚", "pos": "名", "example": "Happy marriage.", "phrase": "marriage proposal", "set": 1},
    {"word": "mash", "meaning": "【動】すり潰す", "pos": "動", "example": "Mash potatoes.", "phrase": "mashed potatoes", "set": 1},
    {"word": "mass", "meaning": "【形】大衆の、大量の", "pos": "形", "example": "Mass media.", "phrase": "mass production", "set": 1},
    {"word": "massive", "meaning": "【形】巨大な", "pos": "形", "example": "Massive rock.", "phrase": "massive heart attack", "set": 1},
    {"word": "match", "meaning": "【動】調和する、匹敵する", "pos": "動", "example": "Shoes match the bag.", "phrase": "match with", "set": 1},
    {"word": "mathematician", "meaning": "【名】数学者", "pos": "名", "example": "Famous mathematician.", "phrase": "talented mathematician", "set": 1},
    {"word": "mathematics", "meaning": "【名】数学", "pos": "名", "example": "Study mathematics.", "phrase": "applied mathematics", "set": 1},
    {"word": "maximum", "meaning": "【形】最大の", "pos": "形", "example": "Maximum speed.", "phrase": "maximum output", "set": 1},
    {"word": "maximum", "meaning": "【名】最大", "pos": "名", "example": "To the maximum.", "phrase": "reach a maximum", "set": 1},
    {"word": "mayor", "meaning": "【名】市長", "pos": "名", "example": "City mayor.", "phrase": "deputy mayor", "set": 1},
    {"word": "meaningful", "meaning": "【形】意味のある", "pos": "形", "example": "Meaningful relationship.", "phrase": "meaningful silence", "set": 1},
    {"word": "meanwhile", "meaning": "【副】その間に", "pos": "副", "example": "Meanwhile, back home.", "phrase": "in the meanwhile", "set": 1},
    {"word": "measure", "meaning": "【名】対策、手段", "pos": "名", "example": "Safety measure.", "phrase": "take measures", "set": 1},
    {"word": "measure", "meaning": "【動】測る", "pos": "動", "example": "Measure the height.", "phrase": "measure up", "set": 1},
    {"word": "measurement", "meaning": "【名】測定、寸法", "pos": "名", "example": "Take measurements.", "phrase": "accurate measurement", "set": 1},
    {"word": "mechanic", "meaning": "【名】整備士", "pos": "名", "example": "Car mechanic.", "phrase": "skilled mechanic", "set": 1},
    {"word": "mechanical", "meaning": "【形】機械の", "pos": "形", "example": "Mechanical engineer.", "phrase": "mechanical failure", "set": 1},
    {"word": "meditate", "meaning": "【動】瞑想する", "pos": "動", "example": "Meditate daily.", "phrase": "meditate on", "set": 1},
    {"word": "meditation", "meaning": "【名】瞑想", "pos": "名", "example": "Deep meditation.", "phrase": "transcendental meditation", "set": 1},
    {"word": "Mediterranean", "meaning": "【名】地中海（的）", "pos": "名", "example": "Mediterranean climate.", "phrase": "Mediterranean food", "set": 1},
    {"word": "medium", "meaning": "【形】中間の", "pos": "形", "example": "Medium size.", "phrase": "happy medium", "set": 1},
    {"word": "medium", "meaning": "【名】媒体", "pos": "名", "example": "Advertising medium.", "phrase": "through the medium of", "set": 1},
    {"word": "melt", "meaning": "【動】溶ける", "pos": "動", "example": "Ice melts.", "phrase": "melt away", "set": 1},
    {"word": "membership", "meaning": "【名】会員資格、会員数", "pos": "名", "example": "Apply for membership.", "phrase": "membership fee", "set": 1},
    {"word": "memorable", "meaning": "【形】記憶に残る", "pos": "形", "example": "Memorable occasion.", "phrase": "truly memorable", "set": 1},
    {"word": "memorise", "meaning": "【動】暗記する", "pos": "動", "example": "Memorise the poem.", "phrase": "memorise facts", "set": 1},
    {"word": "memorize", "meaning": "【動】暗記する（米）", "pos": "動", "example": "Memorize vocabulary.", "phrase": "memorize lines", "set": 1},
    {"word": "mend", "meaning": "【動】修繕する", "pos": "動", "example": "Mend clothes.", "phrase": "mend fences", "set": 1},
    {"word": "mental", "meaning": "【形】精神の", "pos": "形", "example": "Mental health.", "phrase": "make a mental note", "set": 1},
    {"word": "mentally", "meaning": "【副】精神的に", "pos": "副", "example": "Mentally ill.", "phrase": "physically and mentally", "set": 1},
    {"word": "mention", "meaning": "【動】言及する", "pos": "動", "example": "Don't mention it.", "phrase": "not to mention", "set": 1},
    {"word": "merchant", "meaning": "【名】商人", "pos": "名", "example": "Wine merchant.", "phrase": "merchant bank", "set": 1},
    {"word": "mere", "meaning": "【形】ほんの、単なる", "pos": "形", "example": "A mere child.", "phrase": "mere mortal", "set": 1},
    {"word": "merely", "meaning": "【副】単に", "pos": "副", "example": "Merely a joke.", "phrase": "merely suggest", "set": 1},
    {"word": "mess", "meaning": "【名】散らかった状態、混乱", "pos": "名", "example": "Make a mess.", "phrase": "in a mess", "set": 1},
    {"word": "message board", "meaning": "【名】掲示板", "pos": "名", "example": "Post on a message board.", "phrase": "online message board", "set": 1},
    {"word": "messy", "meaning": "【形】散らかった", "pos": "形", "example": "Messy room.", "phrase": "get messy", "set": 1},
    {"word": "middle-aged", "meaning": "【形】中年の", "pos": "形", "example": "Middle-aged man.", "phrase": "middle-aged spread", "set": 1},
    {"word": "mild", "meaning": "【形】穏やかな、軽い", "pos": "形", "example": "Mild weather.", "phrase": "mild curry", "set": 1},
    {"word": "mile", "meaning": "【名】マイル", "pos": "名", "example": "Miles away.", "phrase": "go the extra mile", "set": 1},
    {"word": "mineral", "meaning": "【名】鉱物、ミネラル", "pos": "名", "example": "Mineral water.", "phrase": "mineral resources", "set": 1},
    {"word": "minimise", "meaning": "【動】最小限にする", "pos": "動", "example": "Minimise risk.", "phrase": "minimise the impact", "set": 1},
    {"word": "minimize", "meaning": "【動】最小限にする（米）", "pos": "動", "example": "Minimize waste.", "phrase": "minimize the damage", "set": 1},
    {"word": "minimum", "meaning": "【形】最小の", "pos": "形", "example": "Minimum wage.", "phrase": "minimum age", "set": 1},
    {"word": "minimum", "meaning": "【名】最小限", "pos": "名", "example": "Keep to a minimum.", "phrase": "bare minimum", "set": 1},
    {"word": "minor", "meaning": "【形】小さい、重要でない", "pos": "形", "example": "Minor injury.", "phrase": "minor change", "set": 1},
    {"word": "minority", "meaning": "【名】少数派", "pos": "名", "example": "Ethnic minority.", "phrase": "be in the minority", "set": 1},
    {"word": "minus", "meaning": "【前】引く", "pos": "前", "example": "Ten minus two.", "phrase": "minus degrees", "set": 1},
    {"word": "miracle", "meaning": "【名】奇跡", "pos": "名", "example": "It's a miracle.", "phrase": "work miracles", "set": 1},
    {"word": "mischief", "meaning": "【名】いたずら", "pos": "名", "example": "Get into mischief.", "phrase": "make mischief", "set": 1},
    {"word": "miserable", "meaning": "【形】惨めな", "pos": "形", "example": "Feel miserable.", "phrase": "miserable failure", "set": 1},
    {"word": "misery", "meaning": "【名】惨めさ", "pos": "名", "example": "Life of misery.", "phrase": "put out of misery", "set": 1},
    {"word": "mislead", "meaning": "【動】誤解させる", "pos": "動", "example": "Don't mislead me.", "phrase": "be misled", "set": 1},
    {"word": "mission", "meaning": "【名】使命", "pos": "名", "example": "Space mission.", "phrase": "mission impossible", "set": 1},
    {"word": "misty", "meaning": "【形】霧の深い", "pos": "形", "example": "Misty morning.", "phrase": "misty eyes", "set": 1},
    {"word": "misunderstanding", "meaning": "【名】誤解", "pos": "名", "example": "Clear up a misunderstanding.", "phrase": "slight misunderstanding", "set": 1},
    {"word": "mixing bowl", "meaning": "【名】ボウル", "pos": "名", "example": "Put flour in a mixing bowl.", "phrase": "large mixing bowl", "set": 1},
    {"word": "modal", "meaning": "【名】法（文法）", "pos": "名", "example": "Modal logic.", "phrase": "modal auxiliary", "set": 1},
    {"word": "modal verb", "meaning": "【名】法助動詞", "pos": "名", "example": "Examples of modal verbs.", "phrase": "English modal verbs", "set": 1},
    {"word": "model", "meaning": "【形】模範的な", "pos": "形", "example": "Model student.", "phrase": "model answer", "set": 1},
    {"word": "model", "meaning": "【動】モデルを務める、模型を作る", "pos": "動", "example": "Model clothes.", "phrase": "model for", "set": 1},
    {"word": "modem", "meaning": "【名】モデム", "pos": "名", "example": "Cable modem.", "phrase": "connect the modem", "set": 1},
    {"word": "moderate", "meaning": "【形】適度な", "pos": "形", "example": "Moderate exercise.", "phrase": "moderate amount", "set": 1},
    {"word": "modify", "meaning": "【動】修正する", "pos": "動", "example": "Modify the plan.", "phrase": "genetically modified", "set": 1},
    {"word": "moisture", "meaning": "【名】水分、湿気", "pos": "名", "example": "Retain moisture.", "phrase": "moisture content", "set": 1},
    {"word": "molecule", "meaning": "【名】分子", "pos": "名", "example": "Water molecule.", "phrase": "molecule structure", "set": 1},
    {"word": "monitor", "meaning": "【名】モニター、監視員", "pos": "名", "example": "Computer monitor.", "phrase": "heart monitor", "set": 1},
    {"word": "monitor", "meaning": "【動】監視する", "pos": "動", "example": "Monitor the situation.", "phrase": "closely monitor", "set": 1},
    {"word": "monk", "meaning": "【名】修道士、僧", "pos": "名", "example": "Buddhist monk.", "phrase": "live like a monk", "set": 1},
    {"word": "monster", "meaning": "【名】怪物", "pos": "名", "example": "Scary monster.", "phrase": "Loch Ness monster", "set": 1},
    {"word": "monthly", "meaning": "【形】毎月の", "pos": "形", "example": "Monthly meeting.", "phrase": "monthly payments", "set": 1},
    {"word": "monthly", "meaning": "【副】毎月", "pos": "副", "example": "Pay monthly.", "phrase": "billed monthly", "set": 1},
    {"word": "monument", "meaning": "【名】記念碑", "pos": "名", "example": "Ancient monument.", "phrase": "national monument", "set": 1},
    {"word": "moral", "meaning": "【名】道徳、教訓", "pos": "名", "example": "Moral of the story.", "phrase": "moral support", "set": 1},
    {"word": "more", "meaning": "【副】もっと", "pos": "副", "example": "More beautiful.", "phrase": "more and more", "set": 1},
    {"word": "moreover", "meaning": "【副】さらに", "pos": "副", "example": "Moreover, it is true.", "phrase": "and moreover", "set": 1},
    {"word": "mosquito", "meaning": "【名】蚊", "pos": "名", "example": "Mosquito bite.", "phrase": "mosquito net", "set": 1},
    {"word": "moss", "meaning": "【名】苔", "pos": "名", "example": "Covered in moss.", "phrase": "rolling stone gathers no moss", "set": 1},
    {"word": "motherland", "meaning": "【名】母国", "pos": "名", "example": "Protect the motherland.", "phrase": "love for motherland", "set": 1},
    {"word": "motionless", "meaning": "【形】動かない", "pos": "形", "example": "Stand motionless.", "phrase": "lie motionless", "set": 1},
    {"word": "motivate", "meaning": "【動】動機付ける", "pos": "動", "example": "Motivate students.", "phrase": "highly motivated", "set": 1},
    {"word": "motivation", "meaning": "【名】動機、やる気", "pos": "名", "example": "Lack motivation.", "phrase": "motivation to learn", "set": 1},
    {"word": "motive", "meaning": "【名】動機", "pos": "名", "example": "Motive for the crime.", "phrase": " ulterior motive", "set": 1},
    {"word": "motor", "meaning": "【名】モーター", "pos": "名", "example": "Electric motor.", "phrase": "outboard motor", "set": 1},
    {"word": "motorcycle", "meaning": "【名】オートバイ", "pos": "名", "example": "Ride a motorcycle.", "phrase": "motorcycle accident", "set": 1},
    {"word": "motto", "meaning": "【名】標語、座右の銘", "pos": "名", "example": "School motto.", "phrase": "personal motto", "set": 1},
    {"word": "mount", "meaning": "【名】山（略）", "pos": "名", "example": "Mount Everest.", "phrase": "Mount Fuji", "set": 1},
    {"word": "mountaintop", "meaning": "【名】山頂", "pos": "名", "example": "Reach the mountaintop.", "phrase": "from the mountaintop", "set": 1},
    {"word": "mourn", "meaning": "【動】嘆き悲しむ", "pos": "動", "example": "Mourn the dead.", "phrase": "mourn for", "set": 1},
    {"word": "movement", "meaning": "【名】動き、運動", "pos": "名", "example": "Political movement.", "phrase": "freedom of movement", "set": 1},
    {"word": "mud", "meaning": "【名】泥", "pos": "名", "example": "Stuck in the mud.", "phrase": "as clear as mud", "set": 1},
    {"word": "mule", "meaning": "【名】ラバ", "pos": "名", "example": "Stubborn as a mule.", "phrase": "pack mule", "set": 1},
    {"word": "murder", "meaning": "【動】殺害する", "pos": "動", "example": "Murder a victim.", "phrase": "get away with murder", "set": 1},
    {"word": "murderer", "meaning": "【名】殺人犯", "pos": "名", "example": "Catch the murderer.", "phrase": "convicted murderer", "set": 1},
    {"word": "muscle", "meaning": "【名】筋肉", "pos": "名", "example": "Build muscle.", "phrase": "muscle pain", "set": 1},
    {"word": "mustard", "meaning": "【名】マスタード", "pos": "名", "example": "Hot mustard.", "phrase": "mustard gas", "set": 1},
    {"word": "mutual", "meaning": "【形】相互の", "pos": "形", "example": "Mutual understanding.", "phrase": "mutual friend", "set": 1},
    {"word": "myth", "meaning": "【名】神話", "pos": "名", "example": "Greek myth.", "phrase": "urban myth", "set": 1},
    {"word": "nail", "meaning": "【名】爪、釘", "pos": "名", "example": "Break a nail.", "phrase": "hit the nail on the head", "set": 1},
    {"word": "naked", "meaning": "【形】裸の", "pos": "形", "example": "Naked eye.", "phrase": "stark naked", "set": 1},
    {"word": "name", "meaning": "【動】名付ける", "pos": "動", "example": "Name the baby.", "phrase": "name after", "set": 1},
    {"word": "nap", "meaning": "【名】昼寝", "pos": "名", "example": "Take a nap.", "phrase": "afternoon nap", "set": 1},
    {"word": "narrate", "meaning": "【動】語る", "pos": "動", "example": "Narrate a story.", "phrase": "narrate the events", "set": 1},
    {"word": "narrative", "meaning": "【形】物語の", "pos": "形", "example": "Narrative poem.", "phrase": "narrative structure", "set": 1},
    {"word": "narrow", "meaning": "【形】狭い", "pos": "形", "example": "Narrow road.", "phrase": "narrow escape", "set": 1},
    {"word": "nasty", "meaning": "【形】不快な、意地悪な", "pos": "形", "example": "Nasty smell.", "phrase": "nasty piece of work", "set": 1},
    {"word": "nationalist", "meaning": "【名】国家主義者", "pos": "名", "example": "Scottish nationalist.", "phrase": "ardent nationalist", "set": 1}
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
