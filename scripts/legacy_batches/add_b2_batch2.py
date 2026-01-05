
import json
import re
import os

# B2 Batch 2 (Words 152-300 approx)
# CSV Lines 152 to 300
new_words = [
    {"word": "audition", "meaning": "【名】オーディション", "pos": "名", "example": "Pass the audition.", "phrase": "film audition", "set": 1},
    {"word": "authorise", "meaning": "【動】権限を与える（英）", "pos": "動", "example": "Authorise a payment.", "phrase": "authorise to", "set": 1},
    {"word": "authoritative", "meaning": "【形】権威ある、威圧的な", "pos": "形", "example": "Authoritative voice.", "phrase": "authoritative source", "set": 1},
    {"word": "authorize", "meaning": "【動】権限を与える", "pos": "動", "example": "Authorize the project.", "phrase": "authorize access", "set": 1},
    {"word": "availability", "meaning": "【名】有用性、入手可能性", "pos": "名", "example": "Check availability.", "phrase": "limited availability", "set": 1},
    {"word": "await", "meaning": "【動】待つ", "pos": "動", "example": "Await instructions.", "phrase": "await arrival", "set": 1},
    {"word": "awe", "meaning": "【名】畏敬", "pos": "名", "example": "Stand in awe.", "phrase": "awe-inspiring", "set": 1},
    {"word": "ax", "meaning": "【名】斧", "pos": "名", "example": "Chop wood with an ax.", "phrase": "get the ax", "set": 1},
    {"word": "axe", "meaning": "【名】斧（英）", "pos": "名", "example": "Swing an axe.", "phrase": "axe to grind", "set": 1},
    {"word": "axis", "meaning": "【名】軸", "pos": "名", "example": "Earth's axis.", "phrase": "rotate on axis", "set": 1},
    {"word": "backup", "meaning": "【名】予備、支援", "pos": "名", "example": "Backup plan.", "phrase": "data backup", "set": 1},
    {"word": "backward", "meaning": "【副】後方へ", "pos": "副", "example": "Look backward.", "phrase": "falling backward", "set": 1},
    {"word": "backwards", "meaning": "【副】後方へ", "pos": "副", "example": "Walk backwards.", "phrase": "backwards and forwards", "set": 1},
    {"word": "backyard", "meaning": "【名】裏庭", "pos": "名", "example": "Play in the backyard.", "phrase": "backyard barbecue", "set": 1},
    {"word": "badge", "meaning": "【名】記章、バッジ", "pos": "名", "example": "Police badge.", "phrase": "wear a badge", "set": 1},
    {"word": "bad-tempered", "meaning": "【形】機嫌が悪い", "pos": "形", "example": "He is bad-tempered today.", "phrase": "bad-tempered old man", "set": 1},
    {"word": "balance", "meaning": "【動】均衡を保つ", "pos": "動", "example": "Balance the budget.", "phrase": "balance work and life", "set": 1},
    {"word": "balanced", "meaning": "【形】バランスの取れた", "pos": "形", "example": "Balanced diet.", "phrase": "well balanced", "set": 1},
    {"word": "balky", "meaning": "【形】強情な", "pos": "形", "example": "Balky engine.", "phrase": "balky horse", "set": 1},
    {"word": "ballad", "meaning": "【名】バラード", "pos": "名", "example": "Sing a ballad.", "phrase": "love ballad", "set": 1},
    {"word": "ballet", "meaning": "【名】バレエ", "pos": "名", "example": "Ballet dancer.", "phrase": "go to the ballet", "set": 1},
    {"word": "ballot", "meaning": "【名】投票用ふだ、投票", "pos": "名", "example": "Cast a ballot.", "phrase": "secret ballot", "set": 1},
    {"word": "ban", "meaning": "【名】禁止", "pos": "名", "example": "Smoking ban.", "phrase": "ban on", "set": 1},
    {"word": "ban", "meaning": "【動】禁止する", "pos": "動", "example": "Ban smoking.", "phrase": "banned from", "set": 1},
    {"word": "banker", "meaning": "【名】銀行家", "pos": "名", "example": "Investment banker.", "phrase": "rich banker", "set": 1},
    {"word": "bankrupt", "meaning": "【動】破産させる (usually adjective: insolvent, but CSV says verb)", "pos": "動", "example": "The recession bankrupt the company.", "phrase": "go bankrupt", "set": 1},
    {"word": "bankruptcy", "meaning": "【名】倒産", "pos": "名", "example": "File for bankruptcy.", "phrase": "face bankruptcy", "set": 1},
    {"word": "barbershop", "meaning": "【名】理髪店", "pos": "名", "example": "Go to the barbershop.", "phrase": "barbershop quartet", "set": 1},
    {"word": "bare", "meaning": "【動】むき出しにする", "pos": "動", "example": "Bare one's teeth.", "phrase": "bare one's soul", "set": 1},
    {"word": "bargain", "meaning": "【動】交渉する", "pos": "動", "example": "Bargain for a lower price.", "phrase": "bargain with", "set": 1},
    {"word": "bark", "meaning": "【動】吠える", "pos": "動", "example": "Dogs bark.", "phrase": "bark up the wrong tree", "set": 1},
    {"word": "barley", "meaning": "【名】大麦", "pos": "名", "example": "Barley soup.", "phrase": "field of barley", "set": 1},
    {"word": "barn", "meaning": "【名】納屋", "pos": "名", "example": "Old red barn.", "phrase": "barn owl", "set": 1},
    {"word": "barometer", "meaning": "【名】気圧計、指標", "pos": "名", "example": "Barometer of public opinion.", "phrase": "falling barometer", "set": 1},
    {"word": "barren", "meaning": "【形】不毛の", "pos": "形", "example": "Barren land.", "phrase": "barren desert", "set": 1},
    {"word": "barrier", "meaning": "【名】障壁", "pos": "名", "example": "Language barrier.", "phrase": "break down barriers", "set": 1},
    {"word": "bartender", "meaning": "【名】バーテンダー", "pos": "名", "example": "Work as a bartender.", "phrase": "ask the bartender", "set": 1},
    {"word": "bathhouse", "meaning": "【名】公衆浴場", "pos": "名", "example": "Public bathhouse.", "phrase": "Roman bathhouse", "set": 1},
    {"word": "battlefield", "meaning": "【名】戦場", "pos": "名", "example": "On the battlefield.", "phrase": "battlefield surgeon", "set": 1},
    {"word": "beagle", "meaning": "【名】ビーグル犬", "pos": "名", "example": "Pet beagle.", "phrase": "hunting beagle", "set": 1},
    {"word": "beak", "meaning": "【名】くちばし", "pos": "名", "example": "Bird's beak.", "phrase": "sharp beak", "set": 1},
    {"word": "beam", "meaning": "【名】光線、梁", "pos": "名", "example": "Laser beam.", "phrase": "sun beam", "set": 1},
    {"word": "bearing", "meaning": "【名】態度、関係", "pos": "名", "example": "Have a bearing on.", "phrase": "lose one's bearings", "set": 1},
    {"word": "beat", "meaning": "【名】鼓動、拍子", "pos": "名", "example": "Music beat.", "phrase": "miss a beat", "set": 1},
    {"word": "beautify", "meaning": "【動】美化する", "pos": "動", "example": "Beautify the city.", "phrase": "beautify the park", "set": 1},
    {"word": "bellow", "meaning": "【動】怒鳴る", "pos": "動", "example": "Bellow an order.", "phrase": "bellow out", "set": 1},
    {"word": "belongings", "meaning": "【名】所持品", "pos": "名", "example": "Personal belongings.", "phrase": "pack belongings", "set": 1},
    {"word": "bend", "meaning": "【名】曲がり角", "pos": "名", "example": "Sharp bend.", "phrase": "round the bend", "set": 1},
    {"word": "beneficial", "meaning": "【形】有益な", "pos": "形", "example": "Beneficial to health.", "phrase": "mutually beneficial", "set": 1},
    {"word": "benefit", "meaning": "【動】利益を得る", "pos": "動", "example": "Benefit from the change.", "phrase": "benefit greatly", "set": 1},
    {"word": "benevolence", "meaning": "【名】慈悲", "pos": "名", "example": "Act of benevolence.", "phrase": "divine benevolence", "set": 1},
    {"word": "benevolent", "meaning": "【形】慈悲深い", "pos": "形", "example": "Benevolent dictator.", "phrase": "benevolent smile", "set": 1},
    {"word": "berry", "meaning": "【名】ベリー", "pos": "名", "example": "Wild berry.", "phrase": "pick berries", "set": 1},
    {"word": "bestow", "meaning": "【動】授ける", "pos": "動", "example": "Bestow a title.", "phrase": "bestow upon", "set": 1},
    {"word": "bestseller", "meaning": "【名】ベストセラー", "pos": "名", "example": "International bestseller.", "phrase": "bestseller list", "set": 1},
    {"word": "betray", "meaning": "【動】裏切る", "pos": "動", "example": "Betray a friend.", "phrase": "betray trust", "set": 1},
    {"word": "bewilder", "meaning": "【動】当惑させる", "pos": "動", "example": "Bewildered by the news.", "phrase": "completely bewildered", "set": 1},
    {"word": "bewilderment", "meaning": "【名】当惑", "pos": "名", "example": "Look of bewilderment.", "phrase": "in bewilderment", "set": 1},
    {"word": "bid", "meaning": "【動】入札する", "pos": "動", "example": "Bid for a contract.", "phrase": "bid on", "set": 1},
    {"word": "bidding", "meaning": "【名】入札、命令", "pos": "名", "example": "Competitive bidding.", "phrase": "do one's bidding", "set": 1},
    {"word": "bikini", "meaning": "【名】ビキニ", "pos": "名", "example": "Wear a bikini.", "phrase": "bikini wax", "set": 1},
    {"word": "billion", "meaning": "【名】10億", "pos": "名", "example": "Billions of dollars.", "phrase": "billion people", "set": 1},
    {"word": "bind", "meaning": "【動】縛る、束縛する", "pos": "動", "example": "Bind them together.", "phrase": "legally bound", "set": 1},
    {"word": "bio", "meaning": "【名】経歴（biographyの略）", "pos": "名", "example": "Read his bio.", "phrase": "short bio", "set": 1},
    {"word": "biological", "meaning": "【形】生物学的な", "pos": "形", "example": "Biological parents.", "phrase": "biological clock", "set": 1},
    {"word": "biotechnology", "meaning": "【名】バイオテクノロジー", "pos": "名", "example": "Advances in biotechnology.", "phrase": "biotechnology industry", "set": 1},
    {"word": "birdcage", "meaning": "【名】鳥かご", "pos": "名", "example": "Clean the birdcage.", "phrase": "golden birdcage", "set": 1},
    {"word": "birthplace", "meaning": "【名】出生地", "pos": "名", "example": "Visit my birthplace.", "phrase": "birthplace of jazz", "set": 1},
    {"word": "bitterly", "meaning": "【副】激しく", "pos": "副", "example": "Bitterly cold.", "phrase": "bitterly disappointed", "set": 1},
    {"word": "bizarre", "meaning": "【形】奇妙な", "pos": "形", "example": "Bizarre behavior.", "phrase": "truly bizarre", "set": 1},
    {"word": "blade", "meaning": "【名】刃", "pos": "名", "example": "Razor blade.", "phrase": "sharp blade", "set": 1},
    {"word": "blast", "meaning": "【名】爆発、突風", "pos": "名", "example": "Bomb blast.", "phrase": "blast of wind", "set": 1},
    {"word": "blast", "meaning": "【動】爆破する", "pos": "動", "example": "Blast a tunnel.", "phrase": "blast off", "set": 1},
    {"word": "blaze", "meaning": "【名】炎", "pos": "名", "example": "Fire blaze.", "phrase": "blaze of glory", "set": 1},
    {"word": "blaze", "meaning": "【動】燃え盛る", "pos": "動", "example": "The fire blazed.", "phrase": "blaze a trail", "set": 1},
    {"word": "blend", "meaning": "【名】混合物", "pos": "名", "example": "Coffee blend.", "phrase": "blend of", "set": 1},
    {"word": "blindly", "meaning": "【副】盲目的に", "pos": "副", "example": "Follow blindly.", "phrase": "stumble blindly", "set": 1},
    {"word": "blindness", "meaning": "【名】盲目", "pos": "名", "example": "Color blindness.", "phrase": "cause blindness", "set": 1},
    {"word": "blink", "meaning": "【動】まばたきする", "pos": "動", "example": "Blink your eyes.", "phrase": "in the blink of an eye", "set": 1},
    {"word": "bloodstream", "meaning": "【名】血流", "pos": "名", "example": "Enter the bloodstream.", "phrase": "inject into bloodstream", "set": 1},
    {"word": "bloody", "meaning": "【形】血だらけの", "pos": "形", "example": "Bloody nose.", "phrase": "bloody battle", "set": 1},
    {"word": "bloody", "meaning": "【副】すごく（英俗語）", "pos": "副", "example": "Bloody hell.", "phrase": "bloody good", "set": 1},
    {"word": "blooming", "meaning": "【形】咲いている", "pos": "形", "example": "Blooming flowers.", "phrase": "blooming lovely", "set": 1},
    {"word": "blossom", "meaning": "【名】花", "pos": "名", "example": "Cherry blossom.", "phrase": "in full blossom", "set": 1},
    {"word": "blur", "meaning": "【動】ぼやける", "pos": "動", "example": "Vision blurred.", "phrase": "blur the lines", "set": 1},
    {"word": "blurt", "meaning": "【名】出し抜けに言う", "pos": "名", "example": "Blurt out.", "phrase": "blurt a secret", "set": 1},
    {"word": "blush", "meaning": "【動】赤面する", "pos": "動", "example": "Blush with embarrassment.", "phrase": "make someone blush", "set": 1},
    {"word": "boiling", "meaning": "【形】沸騰している、猛暑の", "pos": "形", "example": "Boiling water.", "phrase": "boiling hot", "set": 1},
    {"word": "bold", "meaning": "【名】太字 (usually adj, but CSV has noun/adj duplicate often)", "pos": "名", "example": "In bold.", "phrase": "bold type", "set": 1},
    {"word": "bolt", "meaning": "【名】ボルト、稲妻", "pos": "名", "example": "Nut and bolt.", "phrase": "bolt of lightning", "set": 1},
    {"word": "bolt", "meaning": "【動】急に逃げる、ボルトで締める", "pos": "動", "example": "The horse bolted.", "phrase": "bolt the door", "set": 1},
    {"word": "bombard", "meaning": "【名】砲撃する (CSV says noun?)", "pos": "名", "example": "Bombard with questions.", "phrase": "under bombardment", "set": 1},
    {"word": "bomber", "meaning": "【名】爆撃機", "pos": "名", "example": "Stealth bomber.", "phrase": "suicide bomber", "set": 1},
    {"word": "bombing", "meaning": "【名】爆撃", "pos": "名", "example": "Aerial bombing.", "phrase": "terrorist bombing", "set": 1},
    {"word": "bony", "meaning": "【形】骨ばった", "pos": "形", "example": "Bony fingers.", "phrase": "bony fish", "set": 1},
    {"word": "bookish", "meaning": "【形】本好きの", "pos": "形", "example": "Bookish person.", "phrase": "bookish charm", "set": 1},
    {"word": "booklet", "meaning": "【名】小冊子", "pos": "名", "example": "Information booklet.", "phrase": "read the booklet", "set": 1},
    {"word": "bookmark", "meaning": "【名】しおり", "pos": "名", "example": "Use a bookmark.", "phrase": "browser bookmark", "set": 1},
    {"word": "bookmark", "meaning": "【動】ブックマークする", "pos": "動", "example": "Bookmark this page.", "phrase": "bookmark a site", "set": 1},
    {"word": "boost", "meaning": "【名】後押し", "pos": "名", "example": "Give a boost.", "phrase": "confidence boost", "set": 1},
    {"word": "boost", "meaning": "【動】高める", "pos": "動", "example": "Boost sales.", "phrase": "boost morale", "set": 1},
    {"word": "booth", "meaning": "【名】ブース", "pos": "名", "example": "Telephone booth.", "phrase": "polling booth", "set": 1},
    {"word": "bossy", "meaning": "【形】偉そうな", "pos": "形", "example": "Bossy sister.", "phrase": "don't be bossy", "set": 1},
    {"word": "botany", "meaning": "【名】植物学", "pos": "名", "example": "Study botany.", "phrase": "botany department", "set": 1},
    {"word": "bothered", "meaning": "【形】心配して、気にして", "pos": "形", "example": "I'm not bothered.", "phrase": "can't be bothered", "set": 1},
    {"word": "bothersome", "meaning": "【形】厄介な", "pos": "形", "example": "Bothersome noise.", "phrase": "find it bothersome", "set": 1},
    {"word": "bottle", "meaning": "【動】瓶詰めにする", "pos": "動", "example": "Bottle wine.", "phrase": "bottled water", "set": 1},
    {"word": "bounce", "meaning": "【名】跳ね返り", "pos": "名", "example": "Good bounce.", "phrase": "on the bounce", "set": 1},
    {"word": "bourbon", "meaning": "【名】バーボン", "pos": "名", "example": "Drink bourbon.", "phrase": "bourbon whiskey", "set": 1},
    {"word": "bow", "meaning": "【動】お辞儀する", "pos": "動", "example": "Bow to the queen.", "phrase": "take a bow", "set": 1},
    {"word": "boxer", "meaning": "【名】ボクサー", "pos": "名", "example": "Professional boxer.", "phrase": "boxer dog", "set": 1},
    {"word": "bracket", "meaning": "【名】括弧", "pos": "名", "example": "In brackets.", "phrase": "age bracket", "set": 1},
    {"word": "brag", "meaning": "【名】自慢 (verb mostly)", "pos": "名", "example": "Brag about success.", "phrase": "bragging rights", "set": 1},
    {"word": "brake", "meaning": "【動】ブレーキをかける", "pos": "動", "example": "Brake hard.", "phrase": "hit the brakes", "set": 1},
    {"word": "bravery", "meaning": "【名】勇敢さ", "pos": "名", "example": "Medal for bravery.", "phrase": "show bravery", "set": 1},
    {"word": "breakable", "meaning": "【形】壊れやすい", "pos": "形", "example": "Breakable items.", "phrase": "fragile and breakable", "set": 1},
    {"word": "breakdown", "meaning": "【名】故障、崩壊", "pos": "名", "example": "Nervous breakdown.", "phrase": "car breakdown", "set": 1},
    {"word": "breakup", "meaning": "【名】解散、破局", "pos": "名", "example": "Marriage breakup.", "phrase": "messy breakup", "set": 1},
    {"word": "breathtaking", "meaning": "【形】息をのむような", "pos": "形", "example": "Breathtaking view.", "phrase": "breathtaking beauty", "set": 1},
    {"word": "breed", "meaning": "【名】品種", "pos": "名", "example": "Breed of dog.", "phrase": "rare breed", "set": 1},
    {"word": "breezy", "meaning": "【形】風通しの良い、快活な", "pos": "形", "example": "Breezy day.", "phrase": "bright and breezy", "set": 1},
    {"word": "brewery", "meaning": "【名】醸造所", "pos": "名", "example": "Visit a brewery.", "phrase": "local brewery", "set": 1},
    {"word": "brilliantly", "meaning": "【副】見事に", "pos": "副", "example": "Played brilliantly.", "phrase": "shine brilliantly", "set": 1},
    {"word": "broadband", "meaning": "【名】ブロードバンド", "pos": "名", "example": "Broadband internet.", "phrase": "fiber broadband", "set": 1},
    {"word": "broadcast", "meaning": "【動】放送する", "pos": "動", "example": "Broadcast live.", "phrase": "broadcast news", "set": 1},
    {"word": "broadcaster", "meaning": "【名】放送局、アナウンサー", "pos": "名", "example": "National broadcaster.", "phrase": "public broadcaster", "set": 1},
    {"word": "broaden", "meaning": "【動】広げる", "pos": "動", "example": "Broaden your horizons.", "phrase": "broaden the mind", "set": 1},
    {"word": "broadly", "meaning": "【副】広く", "pos": "副", "example": "Broadly speaking.", "phrase": "smile broadly", "set": 1},
    {"word": "brochure", "meaning": "【名】パンフレット", "pos": "名", "example": "Travel brochure.", "phrase": "read a brochure", "set": 1},
    {"word": "brother-in-law", "meaning": "【名】義理の兄弟", "pos": "名", "example": "My brother-in-law is visiting.", "phrase": "brother-in-law's house", "set": 1},
    {"word": "browse", "meaning": "【動】閲覧する", "pos": "動", "example": "Browse the internet.", "phrase": "browse through", "set": 1},
    {"word": "browser", "meaning": "【名】ブラウザ", "pos": "名", "example": "Web browser.", "phrase": "open browser", "set": 1},
    {"word": "bruise", "meaning": "【名】あざ", "pos": "名", "example": "Black and blue bruise.", "phrase": "bruise easily", "set": 1},
    {"word": "bud", "meaning": "【名】つぼみ", "pos": "名", "example": "Rose bud.", "phrase": "nip in the bud", "set": 1},
    {"word": "budget", "meaning": "【形】格安の", "pos": "形", "example": "Budget airline.", "phrase": "on a budget", "set": 1},
    {"word": "bulimia", "meaning": "【名】過食症", "pos": "名", "example": "Suffer from bulimia.", "phrase": "bulimia nervosa", "set": 1},
    {"word": "bully", "meaning": "【動】いじめる", "pos": "動", "example": "Don't bully others.", "phrase": "bully a classmate", "set": 1},
    {"word": "bum", "meaning": "【名】浮浪者、尻", "pos": "名", "example": "Beach bum.", "phrase": "kick in the bum", "set": 1},
    {"word": "bumper", "meaning": "【名】バンパー", "pos": "名", "example": "Car bumper.", "phrase": "bumper to bumper", "set": 1},
    {"word": "bun", "meaning": "【名】小型のパン、髷", "pos": "名", "example": "Cinnamon bun.", "phrase": "hair in a bun", "set": 1},
    {"word": "burden", "meaning": "【動】負担をかける", "pos": "動", "example": "Burden with debt.", "phrase": "burden someone", "set": 1},
    {"word": "burdensome", "meaning": "【形】負担となる", "pos": "形", "example": "Burdensome task.", "phrase": "prove burdensome", "set": 1},
    {"word": "bureaucracy", "meaning": "【名】官僚主義", "pos": "名", "example": "Government bureaucracy.", "phrase": "cut through bureaucracy", "set": 1},
    {"word": "burglary", "meaning": "【名】強盗", "pos": "名", "example": "Commit burglary.", "phrase": "burglary rate", "set": 1},
    {"word": "burgle", "meaning": "【動】強盗に入る", "pos": "動", "example": "Burgle a house.", "phrase": "burgle a shop", "set": 1},
    {"word": "burial", "meaning": "【名】埋葬", "pos": "名", "example": "Burial ground.", "phrase": "burial ceremony", "set": 1},
    {"word": "bustle", "meaning": "【動】せわしく動く", "pos": "動", "example": "Bustle about.", "phrase": "hustle and bustle", "set": 1},
    {"word": "bustling", "meaning": "【形】騒がしい", "pos": "形", "example": "Bustling city.", "phrase": "bustling street", "set": 1},
    {"word": "butcher", "meaning": "【動】虐殺する、台無しにする", "pos": "動", "example": "Butcher the English language.", "phrase": "butcher meat", "set": 1}
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
    
    if current_list_content:
        # Check if the list already ends with comma to avoid syntax error?
        # A simple join with comma is safer.
        # But we need to replace the whole block again to be safe.
        pass
        
    # Re-read the match to act on current file state (Batch 1 modified it).
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
