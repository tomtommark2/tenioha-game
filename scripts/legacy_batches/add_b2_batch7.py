
import json
import re
import os

# B2 Batch 7 (Words 901-1050 approx)
# CSV Lines 901 to 1050
new_words = [
    {"word": "faint", "meaning": "【動】気絶する", "pos": "動", "example": "Faint from heat.", "phrase": "faint with hunger", "set": 1},
    {"word": "faith", "meaning": "【名】信仰、信頼", "pos": "名", "example": "Have faith.", "phrase": "blind faith", "set": 1},
    {"word": "falter", "meaning": "【動】口ごもる、よろめく", "pos": "動", "example": "Voice faltered.", "phrase": "never falter", "set": 1},
    {"word": "fame", "meaning": "【名】名声", "pos": "名", "example": "Hall of fame.", "phrase": "rise to fame", "set": 1},
    {"word": "familiarise", "meaning": "【動】慣れさせる（英）", "pos": "動", "example": "Familiarise oneself.", "phrase": "familiarise with", "set": 1},
    {"word": "familiarize", "meaning": "【動】慣れさせる", "pos": "動", "example": "Familiarize yourself.", "phrase": "familiarize with", "set": 1},
    {"word": "fantastically", "meaning": "【副】素晴らしく", "pos": "副", "example": "Fantastically rich.", "phrase": "fantastically well", "set": 1},
    {"word": "far", "meaning": "【形】遠い", "pos": "形", "example": "Far country.", "phrase": "far cry from", "set": 1},
    {"word": "fascinated", "meaning": "【形】魅了された", "pos": "形", "example": "Fascinated by art.", "phrase": "fascinated to hear", "set": 1},
    {"word": "fascination", "meaning": "【名】魅力", "pos": "名", "example": "Endless fascination.", "phrase": "hold a fascination", "set": 1},
    {"word": "fat", "meaning": "【名】脂肪", "pos": "名", "example": "Burn fat.", "phrase": "body fat", "set": 1},
    {"word": "fatal", "meaning": "【形】致命的な", "pos": "形", "example": "Fatal accident.", "phrase": "fatal error", "set": 1},
    {"word": "fate", "meaning": "【名】運命", "pos": "名", "example": "Twist of fate.", "phrase": "seal one's fate", "set": 1},
    {"word": "father-in-law", "meaning": "【名】義理の父", "pos": "名", "example": "My father-in-law.", "phrase": "visit father-in-law", "set": 1},
    {"word": "faulty", "meaning": "【形】欠陥のある", "pos": "形", "example": "Faulty wiring.", "phrase": "faulty logic", "set": 1},
    {"word": "fear", "meaning": "【動】恐れる", "pos": "動", "example": "Fear the worst.", "phrase": "fear for", "set": 1},
    {"word": "fearsome", "meaning": "【形】恐ろしい", "pos": "形", "example": "Fearsome warrior.", "phrase": "fearsome reputation", "set": 1},
    {"word": "feat", "meaning": "【名】偉業", "pos": "名", "example": "Remarkable feat.", "phrase": "feat of strength", "set": 1},
    {"word": "feature", "meaning": "【動】特徴とする、特集する", "pos": "動", "example": "Feature a guest.", "phrase": "feature in", "set": 1},
    {"word": "fed up", "meaning": "【形】うんざりして", "pos": "形", "example": "Fed up with work.", "phrase": "get fed up", "set": 1},
    {"word": "federal", "meaning": "【形】連邦の", "pos": "形", "example": "Federal government.", "phrase": "federal law", "set": 1},
    {"word": "feedback", "meaning": "【名】フィードバック", "pos": "名", "example": "Customer feedback.", "phrase": "give feedback", "set": 1},
    {"word": "fellow", "meaning": "【形】仲間の", "pos": "形", "example": "Fellow citizens.", "phrase": "fellow workers", "set": 1},
    {"word": "female", "meaning": "【名】女性", "pos": "名", "example": "Adult female.", "phrase": "female population", "set": 1},
    {"word": "ferryboat", "meaning": "【名】フェリーボート", "pos": "名", "example": "Ride a ferryboat.", "phrase": "cross by ferryboat", "set": 1},
    {"word": "fiber", "meaning": "【名】繊維", "pos": "名", "example": "Dietary fiber.", "phrase": "carbon fiber", "set": 1},
    {"word": "fibre", "meaning": "【名】繊維（英）", "pos": "名", "example": "Fibre optics.", "phrase": "high fibre", "set": 1},
    {"word": "fictional", "meaning": "【形】架空の", "pos": "形", "example": "Fictional character.", "phrase": "fictional story", "set": 1},
    {"word": "fierce", "meaning": "【形】激しい", "pos": "形", "example": "Fierce competition.", "phrase": "fierce battles", "set": 1},
    {"word": "fighting", "meaning": "【名】戦い", "pos": "名", "example": "Street fighting.", "phrase": "fighting spirit", "set": 1},
    {"word": "figurative", "meaning": "【形】比喩的な", "pos": "形", "example": "Figurative language.", "phrase": "figurative sense", "set": 1},
    {"word": "file", "meaning": "【動】提出する、ファイルする", "pos": "動", "example": "File a report.", "phrase": "file a lawsuit", "set": 1},
    {"word": "filial", "meaning": "【形】子の", "pos": "形", "example": "Filial duty.", "phrase": "filial piety", "set": 1},
    {"word": "finance", "meaning": "【名】財政、金融", "pos": "名", "example": "Personal finance.", "phrase": "finance minister", "set": 1},
    {"word": "financially", "meaning": "【副】財政的に", "pos": "副", "example": "Financially stable.", "phrase": "support financially", "set": 1},
    {"word": "fine", "meaning": "【副】立派に、細かく", "pos": "副", "example": "Doing fine.", "phrase": "chop fine", "set": 1},
    {"word": "fine", "meaning": "【動】罰金を科す", "pos": "動", "example": "Fined for speeding.", "phrase": "he was fined", "set": 1},
    {"word": "finely", "meaning": "【副】細かく、見事に", "pos": "副", "example": "Finely chopped.", "phrase": "finely tuned", "set": 1},
    {"word": "fingernail", "meaning": "【名】爪", "pos": "名", "example": "Paint fingernails.", "phrase": "bite fingernails", "set": 1},
    {"word": "fire", "meaning": "【動】解雇する、発砲する", "pos": "動", "example": "You are fired.", "phrase": "fire a gun", "set": 1},
    {"word": "fire brigade", "meaning": "【名】消防隊", "pos": "名", "example": "Call the fire brigade.", "phrase": "fire brigade arrived", "set": 1},
    {"word": "firearm", "meaning": "【名】火器", "pos": "名", "example": "Possess a firearm.", "phrase": "firearm safety", "set": 1},
    {"word": "marketplace", "meaning": "【名】暖炉", "pos": "名", "example": "Sit by the fireplace.", "phrase": "lit fireplace", "set": 1},
    {"word": "firmness", "meaning": "【名】堅固さ", "pos": "名", "example": "Firmness of mattress.", "phrase": "treat with firmness", "set": 1},
    {"word": "first language", "meaning": "【名】母語", "pos": "名", "example": "English is my first language.", "phrase": "speak first language", "set": 1},
    {"word": "first person", "meaning": "【名】一人称", "pos": "名", "example": "Written in first person.", "phrase": "first person shooter", "set": 1},
    {"word": "firstly", "meaning": "【副】第一に", "pos": "副", "example": "Firstly, welcome.", "phrase": "firstly and secondly", "set": 1},
    {"word": "fiscal", "meaning": "【形】財政の", "pos": "形", "example": "Fiscal policy.", "phrase": "fiscal year", "set": 1},
    {"word": "fit", "meaning": "【名】発作、適合", "pos": "名", "example": "Fit of rage.", "phrase": "good fit", "set": 1},
    {"word": "fixed", "meaning": "【形】固定された", "pos": "形", "example": "Fixed price.", "phrase": "fixed term", "set": 1},
    {"word": "flame", "meaning": "【名】炎", "pos": "名", "example": "Blue flame.", "phrase": "burst into flames", "set": 1},
    {"word": "flap", "meaning": "【動】ばたつかせる", "pos": "動", "example": "Flap wings.", "phrase": "flap in the wind", "set": 1},
    {"word": "flash", "meaning": "【名】閃光", "pos": "名", "example": "Flash of light.", "phrase": "news flash", "set": 1},
    {"word": "flash", "meaning": "【動】光る", "pos": "動", "example": "Lights flashed.", "phrase": "flash a smile", "set": 1},
    {"word": "flat", "meaning": "【副】平らに、きっぱりと", "pos": "副", "example": "Fall flat.", "phrase": "flat broke", "set": 1},
    {"word": "flaw", "meaning": "【名】欠陥", "pos": "名", "example": "Design flaw.", "phrase": "character flaw", "set": 1},
    {"word": "flawless", "meaning": "【形】傷のない、完璧な", "pos": "形", "example": "Flawless skin.", "phrase": "flawless performance", "set": 1},
    {"word": "flax", "meaning": "【名】亜麻", "pos": "名", "example": "Flax seeds.", "phrase": "flax linen", "set": 1},
    {"word": "flee", "meaning": "【動】逃げる", "pos": "動", "example": "Flee the country.", "phrase": "flee from", "set": 1},
    {"word": "fleet", "meaning": "【名】艦隊", "pos": "名", "example": "Naval fleet.", "phrase": "fleet of cars", "set": 1},
    {"word": "flesh", "meaning": "【名】肉", "pos": "名", "example": "Flesh and blood.", "phrase": "in the flesh", "set": 1},
    {"word": "flexibility", "meaning": "【名】柔軟性", "pos": "名", "example": "Flexibility exercises.", "phrase": "show flexibility", "set": 1},
    {"word": "flexible", "meaning": "【形】柔軟な", "pos": "形", "example": "Flexible schedule.", "phrase": "flexible approach", "set": 1},
    {"word": "flexibly", "meaning": "【副】柔軟に", "pos": "副", "example": "Work flexibly.", "phrase": "respond flexibly", "set": 1},
    {"word": "flip", "meaning": "【動】弾く、裏返す", "pos": "動", "example": "Flip a coin.", "phrase": "flip over", "set": 1},
    {"word": "fluency", "meaning": "【名】流暢さ", "pos": "名", "example": "Fluency in English.", "phrase": "achieve fluency", "set": 1},
    {"word": "fluid", "meaning": "【形】流動的な", "pos": "形", "example": "Fluid situation.", "phrase": "fluid movement", "set": 1},
    {"word": "flutter", "meaning": "【名】はためき (verb mostly)", "pos": "名", "example": "Flutter of wings.", "phrase": "heart in a flutter", "set": 1},
    {"word": "focus", "meaning": "【名】焦点", "pos": "名", "example": "Out of focus.", "phrase": "main focus", "set": 1},
    {"word": "follower", "meaning": "【名】信奉者、フォロワー", "pos": "名", "example": "Loyal follower.", "phrase": "gain followers", "set": 1},
    {"word": "following", "meaning": "【前】～の後に", "pos": "前", "example": "Following the meeting.", "phrase": "following the rules", "set": 1},
    {"word": "folly", "meaning": "【名】愚かさ", "pos": "名", "example": "Sheer folly.", "phrase": "act of folly", "set": 1},
    {"word": "fondly", "meaning": "【副】愛情を込めて", "pos": "副", "example": "Remember fondly.", "phrase": "smile fondly", "set": 1},
    {"word": "foolishly", "meaning": "【副】愚かにも", "pos": "副", "example": "Acted foolishly.", "phrase": "smiling foolishly", "set": 1},
    {"word": "footnote", "meaning": "【名】脚注", "pos": "名", "example": "Read the footnote.", "phrase": "add a footnote", "set": 1},
    {"word": "force", "meaning": "【動】強制する", "pos": "動", "example": "Force open.", "phrase": "force someone to", "set": 1},
    {"word": "forcefully", "meaning": "【副】力強く", "pos": "副", "example": "Argue forcefully.", "phrase": "act forcefully", "set": 1},
    {"word": "foreman", "meaning": "【名】現場監督", "pos": "名", "example": "Construction foreman.", "phrase": "factory foreman", "set": 1},
    {"word": "foresee", "meaning": "【動】予見する", "pos": "動", "example": "Foresee problems.", "phrase": "could not foresee", "set": 1},
    {"word": "forestry", "meaning": "【名】林業", "pos": "名", "example": "Forestry commission.", "phrase": "sustainable forestry", "set": 1},
    {"word": "formation", "meaning": "【名】形成、隊形", "pos": "名", "example": "Rock formation.", "phrase": "battle formation", "set": 1},
    {"word": "formerly", "meaning": "【副】以前は", "pos": "副", "example": "Formerly known as.", "phrase": "formerly used", "set": 1},
    {"word": "formidable", "meaning": "【形】手ごわい", "pos": "形", "example": "Formidable opponent.", "phrase": "formidable task", "set": 1},
    {"word": "forthcoming", "meaning": "【形】来たるべき", "pos": "形", "example": "Forthcoming event.", "phrase": "forthcoming book", "set": 1},
    {"word": "foul", "meaning": "【形】汚い、反則の", "pos": "形", "example": "Foul smell.", "phrase": "foul play", "set": 1},
    {"word": "found", "meaning": "【動】設立する", "pos": "動", "example": "Found a company.", "phrase": "founded in", "set": 1},
    {"word": "fox", "meaning": "【名】キツネ", "pos": "名", "example": "Sly as a fox.", "phrase": "red fox", "set": 1},
    {"word": "fragrance", "meaning": "【名】芳香", "pos": "名", "example": "Sweet fragrance.", "phrase": "perfume fragrance", "set": 1},
    {"word": "frame", "meaning": "【動】枠にはめる、組み立てる", "pos": "動", "example": "Frame a picture.", "phrase": "frame a question", "set": 1},
    {"word": "frankly", "meaning": "【副】率直に", "pos": "副", "example": "Frankly speaking.", "phrase": "speak frankly", "set": 1},
    {"word": "frantically", "meaning": "【副】必死に", "pos": "副", "example": "Wave frantically.", "phrase": "search frantically", "set": 1},
    {"word": "fraud", "meaning": "【名】詐欺", "pos": "名", "example": "Credit card fraud.", "phrase": "commit fraud", "set": 1},
    {"word": "freak", "meaning": "【動】パニックになる", "pos": "動", "example": "Don't freak out.", "phrase": "freak show (noun)", "set": 1},
    {"word": "free", "meaning": "【動】解放する", "pos": "動", "example": "Free the prisoners.", "phrase": "set free", "set": 1},
    {"word": "friendly", "meaning": "【形】親しみやすい", "pos": "形", "example": "Friendly smile.", "phrase": "user friendly", "set": 1},
    {"word": "frigate", "meaning": "【名】フリゲート艦", "pos": "名", "example": "Naval frigate.", "phrase": "command a frigate", "set": 1},
    {"word": "frontier", "meaning": "【名】国境、辺境", "pos": "名", "example": "Cross the frontier.", "phrase": "final frontier", "set": 1},
    {"word": "frugal", "meaning": "【形】質素な", "pos": "形", "example": "Frugal meal.", "phrase": "frugal lifestyle", "set": 1},
    {"word": "fulfil", "meaning": "【動】果たす、満たす（英）", "pos": "動", "example": "Fulfil a promise.", "phrase": "fulfil requirements", "set": 1},
    {"word": "fulfill", "meaning": "【動】果たす、満たす", "pos": "動", "example": "Fulfill dreams.", "phrase": "fulfill potential", "set": 1},
    {"word": "fume", "meaning": "【名】ガス、煙", "pos": "名", "example": "Toxic fumes.", "phrase": "exhaust fumes", "set": 1},
    {"word": "functional", "meaning": "【形】機能的な", "pos": "形", "example": "Functional design.", "phrase": "fully functional", "set": 1},
    {"word": "functionality", "meaning": "【名】機能性", "pos": "名", "example": "Software functionality.", "phrase": "check functionality", "set": 1},
    {"word": "fundamental", "meaning": "【形】根本的な", "pos": "形", "example": "Fundamental difference.", "phrase": "fundamental rights", "set": 1},
    {"word": "funk", "meaning": "【名】ファンク", "pos": "名", "example": "Funk music.", "phrase": "in a funk", "set": 1},
    {"word": "funky", "meaning": "【形】ファンキーな", "pos": "形", "example": "Funky beat.", "phrase": "funky smell", "set": 1},
    {"word": "furious", "meaning": "【形】激怒した", "pos": "形", "example": "Furious anger.", "phrase": "fast and furious", "set": 1},
    {"word": "furiously", "meaning": "【副】猛烈に", "pos": "副", "example": "Work furiously.", "phrase": "scribble furiously", "set": 1},
    {"word": "furor", "meaning": "【名】熱狂、激怒", "pos": "名", "example": "Cause a furor.", "phrase": "create a furor", "set": 1},
    {"word": "furore", "meaning": "【名】激怒、騒動（英）", "pos": "名", "example": "Public furore.", "phrase": "cause a furore", "set": 1},
    {"word": "gaiety", "meaning": "【名】陽気", "pos": "名", "example": "Full of gaiety.", "phrase": "forced gaiety", "set": 1},
    {"word": "gambling", "meaning": "【名】ギャンブル", "pos": "名", "example": "Addicted to gambling.", "phrase": "gambling debt", "set": 1},
    {"word": "gang", "meaning": "【名】ギャング、一団", "pos": "名", "example": "Street gang.", "phrase": "gang member", "set": 1},
    {"word": "gangster", "meaning": "【名】暴力団員", "pos": "名", "example": "Mob gangster.", "phrase": "gangster movie", "set": 1},
    {"word": "gardener", "meaning": "【名】庭師", "pos": "名", "example": "Landscape gardener.", "phrase": "keen gardener", "set": 1},
    {"word": "gasp", "meaning": "【名】あえぎ", "pos": "名", "example": "Gasp of horror.", "phrase": "last gasp", "set": 1},
    {"word": "gateway", "meaning": "【名】入り口", "pos": "名", "example": "Gateway to the city.", "phrase": "gateway drug", "set": 1},
    {"word": "gaudy", "meaning": "【形】派手な", "pos": "形", "example": "Gaudy colors.", "phrase": "gaudy jewelry", "set": 1},
    {"word": "gaze", "meaning": "【名】凝視", "pos": "名", "example": "Steady gaze.", "phrase": "meet one's gaze", "set": 1},
    {"word": "gear", "meaning": "【名】歯車、用具", "pos": "名", "example": "Camping gear.", "phrase": "shift gears", "set": 1},
    {"word": "generalisation", "meaning": "【名】一般化（英）", "pos": "名", "example": "Hasty generalisation.", "phrase": "make a generalisation", "set": 1},
    {"word": "generalise", "meaning": "【動】一般化する（英）", "pos": "動", "example": "Hard to generalise.", "phrase": "generalise from", "set": 1},
    {"word": "generalization", "meaning": "【名】一般化", "pos": "名", "example": "Sweeping generalization.", "phrase": "valid generalization", "set": 1},
    {"word": "generalize", "meaning": "【動】一般化する", "pos": "動", "example": "Generalize findings.", "phrase": "cannot generalize", "set": 1},
    {"word": "generosity", "meaning": "【名】寛大さ", "pos": "名", "example": "Act of generosity.", "phrase": "thank you for your generosity", "set": 1},
    {"word": "generously", "meaning": "【副】寛大に", "pos": "副", "example": "Give generously.", "phrase": "generously donated", "set": 1},
    {"word": "genius", "meaning": "【名】天才", "pos": "名", "example": "Mathematical genius.", "phrase": "stroke of genius", "set": 1},
    {"word": "genre", "meaning": "【名】ジャンル", "pos": "名", "example": "Music genre.", "phrase": "literary genre", "set": 1},
    {"word": "gently", "meaning": "【副】優しく", "pos": "副", "example": "Touch gently.", "phrase": "break it gently", "set": 1},
    {"word": "genuine", "meaning": "【形】本物の", "pos": "形", "example": "Genuine leather.", "phrase": "genuine interest", "set": 1},
    {"word": "genuinely", "meaning": "【副】純粋に", "pos": "副", "example": "Genuinely happy.", "phrase": "genuinely sorry", "set": 1},
    {"word": "geographic", "meaning": "【形】地理的な", "pos": "形", "example": "Geographic location.", "phrase": "geographic features", "set": 1},
    {"word": "germ", "meaning": "【名】細菌", "pos": "名", "example": "Kill germs.", "phrase": "germ warfare", "set": 1},
    {"word": "getaway", "meaning": "【名】逃走、休暇", "pos": "名", "example": "Weekend getaway.", "phrase": "clean getaway", "set": 1},
    {"word": "ghetto", "meaning": "【名】スラム街", "pos": "名", "example": "Urban ghetto.", "phrase": "ghetto blaster", "set": 1},
    {"word": "giveaway", "meaning": "【名】無料サンプル", "pos": "名", "example": "Promotional giveaway.", "phrase": "dead giveaway", "set": 1},
    {"word": "glacis", "meaning": "【名】斜堤", "pos": "名", "example": "Fortress glacis.", "phrase": "slope of glacis", "set": 1},
    {"word": "glamorous", "meaning": "【形】魅力的な", "pos": "形", "example": "Glamorous life.", "phrase": "glamorous movie star", "set": 1},
    {"word": "glamourous", "meaning": "【形】魅力的な（英）", "pos": "形", "example": "Glamourous event.", "phrase": "look glamourous", "set": 1},
    {"word": "glare", "meaning": "【名】まぶしい光、睨み", "pos": "名", "example": "Sun's glare.", "phrase": "angry glare", "set": 1},
    {"word": "gleam", "meaning": "【名】きらめき", "pos": "名", "example": "Gleam in his eye.", "phrase": "gleam of hope", "set": 1},
    {"word": "glee", "meaning": "【名】大喜び", "pos": "名", "example": "Shout with glee.", "phrase": "full of glee", "set": 1},
    {"word": "global warming", "meaning": "【名】地球温暖化", "pos": "名", "example": "Stop global warming.", "phrase": "effects of global warming", "set": 1},
    {"word": "globally", "meaning": "【副】世界的に", "pos": "副", "example": "Recognized globally.", "phrase": "act locally, think globally", "set": 1},
    {"word": "glocal", "meaning": "【形】グローカルな", "pos": "形", "example": "Glocal strategy.", "phrase": "glocal marketing", "set": 1},
    {"word": "gloomy", "meaning": "【形】陰気な", "pos": "形", "example": "Gloomy weather.", "phrase": "gloomy outlook", "set": 1},
    {"word": "glorify", "meaning": "【動】美化する", "pos": "動", "example": "Glorify war.", "phrase": "glorify God", "set": 1},
    {"word": "glow", "meaning": "【名】輝き", "pos": "名", "example": "Warm glow.", "phrase": "rosy glow", "set": 1},
    {"word": "goat", "meaning": "【名】ヤギ", "pos": "名", "example": "Mountain goat.", "phrase": "goat cheese", "set": 1},
    {"word": "god", "meaning": "【名】神", "pos": "名", "example": "Greek gods.", "phrase": "act of God", "set": 1},
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
    
    # Re-read the match to act on current file state (Batch 6 modified it).
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
