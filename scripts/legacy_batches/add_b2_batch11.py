
import json
import re
import os

# B2 Batch 11 (Words 1501-1650 approx)
# CSV Lines 1501 to 1650
new_words = [
    {"word": "microphone", "meaning": "【名】マイク", "pos": "名", "example": "Speak into microphone.", "phrase": "microphone check", "set": 1},
    {"word": "microscope", "meaning": "【名】顕微鏡", "pos": "名", "example": "Look through microscope.", "phrase": "electron microscope", "set": 1},
    {"word": "microscopic", "meaning": "【形】微視的な", "pos": "形", "example": "Microscopic detail.", "phrase": "microscopic scale", "set": 1},
    {"word": "microscopy", "meaning": "【名】顕微鏡使用法", "pos": "名", "example": "Study microscopy.", "phrase": "advanced microscopy", "set": 1},
    {"word": "microwave", "meaning": "【名】電子レンジ", "pos": "名", "example": "Heat in microwave.", "phrase": "microwave oven", "set": 1},
    {"word": "midst", "meaning": "【名】真ん中", "pos": "名", "example": "In the midst of.", "phrase": "in our midst", "set": 1},
    {"word": "mighty", "meaning": "【形】強力な", "pos": "形", "example": "Mighty stroke.", "phrase": "high and mighty", "set": 1},
    {"word": "migration", "meaning": "【名】移動、移住", "pos": "名", "example": "Bird migration.", "phrase": "mass migration", "set": 1},
    {"word": "mill", "meaning": "【名】工場、製粉所", "pos": "名", "example": "Cotton mill.", "phrase": "run of the mill", "set": 1},
    {"word": "millimeter", "meaning": "【名】ミリメートル", "pos": "名", "example": "One millimeter.", "phrase": "millimeter wave", "set": 1},
    {"word": "millimetre", "meaning": "【名】ミリメートル（英）", "pos": "名", "example": "Few millimetres.", "phrase": "millimetre precision", "set": 1},
    {"word": "millionaire", "meaning": "【名】百万長者", "pos": "名", "example": "Become a millionaire.", "phrase": "multi millionaire", "set": 1},
    {"word": "mimic", "meaning": "【名】物真似師 (verb mostly)", "pos": "名", "example": "Good mimic.", "phrase": "mimic someone", "set": 1},
    {"word": "mine", "meaning": "【名】鉱山、地雷", "pos": "名", "example": "Gold mine.", "phrase": "land mine", "set": 1},
    {"word": "miniature", "meaning": "【形】小型の", "pos": "形", "example": "Miniature camera.", "phrase": "miniature golf", "set": 1},
    {"word": "minister", "meaning": "【名】大臣、牧師", "pos": "名", "example": "Prime Minister.", "phrase": "cabinet minister", "set": 1},
    {"word": "mint", "meaning": "【名】ミント、造幣局", "pos": "名", "example": "Fresh mint.", "phrase": "mint condition", "set": 1},
    {"word": "misconception", "meaning": "【名】誤解", "pos": "名", "example": "Common misconception.", "phrase": "clear up misconception", "set": 1},
    {"word": "misfortune", "meaning": "【名】不運", "pos": "名", "example": "Series of misfortunes.", "phrase": "bad misfortune", "set": 1},
    {"word": "misleading", "meaning": "【形】誤解を招く", "pos": "形", "example": "Misleading information.", "phrase": "misleading impression", "set": 1},
    {"word": "missile", "meaning": "【名】ミサイル", "pos": "名", "example": "Launch a missile.", "phrase": "ballistic missile", "set": 1},
    {"word": "mist", "meaning": "【名】霧", "pos": "名", "example": "Morning mist.", "phrase": "thick mist", "set": 1},
    {"word": "mistreat", "meaning": "【動】虐待する", "pos": "動", "example": "Mistreat animals.", "phrase": "badly mistreat", "set": 1},
    {"word": "mistrustful", "meaning": "【形】疑い深い", "pos": "形", "example": "Mistrustful glance.", "phrase": "mistrustful of", "set": 1},
    {"word": "misunderstand", "meaning": "【動】誤解する", "pos": "動", "example": "Don't misunderstand.", "phrase": "misunderstand purpose", "set": 1},
    {"word": "mix", "meaning": "【名】混合", "pos": "名", "example": "Cake mix.", "phrase": "good mix", "set": 1},
    {"word": "mixture", "meaning": "【名】混合物", "pos": "名", "example": "Odd mixture.", "phrase": "mixture of", "set": 1},
    {"word": "mobility", "meaning": "【名】可動性", "pos": "名", "example": "social mobility.", "phrase": "upward mobility", "set": 1},
    {"word": "mock", "meaning": "【形】模擬の", "pos": "形", "example": "Mock exam.", "phrase": "mock trial", "set": 1},
    {"word": "modernisation", "meaning": "【名】近代化（英）", "pos": "名", "example": "Rapid modernisation.", "phrase": "modernisation program", "set": 1},
    {"word": "modernise", "meaning": "【動】近代化する（英）", "pos": "動", "example": "Modernise the system.", "phrase": "modernise facilities", "set": 1},
    {"word": "modernization", "meaning": "【名】近代化", "pos": "名", "example": "Economic modernization.", "phrase": "modernization plan", "set": 1},
    {"word": "modernize", "meaning": "【動】近代化する", "pos": "動", "example": "Modernize equipment.", "phrase": "modernize outlook", "set": 1},
    {"word": "modest", "meaning": "【形】謙虚な", "pos": "形", "example": "Modest behavior.", "phrase": "modest proposal", "set": 1},
    {"word": "modification", "meaning": "【名】変更、修正", "pos": "名", "example": "Slight modification.", "phrase": "make a modification", "set": 1},
    {"word": "mogul", "meaning": "【名】大物", "pos": "名", "example": "Media mogul.", "phrase": "movie mogul", "set": 1},
    {"word": "mold", "meaning": "【名】カビ、型", "pos": "名", "example": "Break the mold.", "phrase": "mold growth", "set": 1},
    {"word": "momentarily", "meaning": "【副】瞬時に、少しの間", "pos": "副", "example": "Paused momentarily.", "phrase": "momentarily confused", "set": 1},
    {"word": "momentary", "meaning": "【形】瞬間の", "pos": "形", "example": "Momentary lapse.", "phrase": "momentary relief", "set": 1},
    {"word": "monastery", "meaning": "【名】修道院", "pos": "名", "example": "Live in a monastery.", "phrase": "Buddhist monastery", "set": 1},
    {"word": "moody", "meaning": "【形】気分屋の", "pos": "形", "example": "Moody teenager.", "phrase": "feeling moody", "set": 1},
    {"word": "moonlight", "meaning": "【名】月光", "pos": "名", "example": "By moonlight.", "phrase": "moonlight walk", "set": 1},
    {"word": "moonscape", "meaning": "【名】月面のような風景", "pos": "名", "example": "Barren moonscape.", "phrase": "volcanic moonscape", "set": 1},
    {"word": "moral", "meaning": "【形】道徳的な", "pos": "形", "example": "Moral duty.", "phrase": "moral support", "set": 1},
    {"word": "morality", "meaning": "【名】道徳", "pos": "名", "example": "Public morality.", "phrase": "sense of morality", "set": 1},
    {"word": "morally", "meaning": "【副】道徳的に", "pos": "副", "example": "Morally wrong.", "phrase": "morally obligated", "set": 1},
    {"word": "mortal", "meaning": "【形】死ぬ運命の", "pos": "形", "example": "Mortal man.", "phrase": "mortal sin", "set": 1},
    {"word": "mortar", "meaning": "【名】モルタル、迫撃砲", "pos": "名", "example": "Brick and mortar.", "phrase": "mortar attack", "set": 1},
    {"word": "mortgage", "meaning": "【名】住宅ローン", "pos": "名", "example": "Pay the mortgage.", "phrase": "mortgage rate", "set": 1},
    {"word": "mortify", "meaning": "【動】屈辱を与える", "pos": "動", "example": "Be mortified.", "phrase": "mortify the flesh", "set": 1},
    {"word": "mother-in-law", "meaning": "【名】義理の母", "pos": "名", "example": "My mother-in-law.", "phrase": "visit mother-in-law", "set": 1},
    {"word": "motion", "meaning": "【名】動き、動議", "pos": "名", "example": "Slow motion.", "phrase": "set in motion", "set": 1},
    {"word": "motivated", "meaning": "【形】やる気のある", "pos": "形", "example": "Highly motivated.", "phrase": "motivated student", "set": 1},
    {"word": "motorbike", "meaning": "【名】オートバイ", "pos": "名", "example": "Ride a motorbike.", "phrase": "motorbike racing", "set": 1},
    {"word": "motorist", "meaning": "【名】ドライバー", "pos": "名", "example": "Angry motorist.", "phrase": "passing motorist", "set": 1},
    {"word": "mould", "meaning": "【名】カビ、型（英）", "pos": "名", "example": "Blue mould.", "phrase": "clay mould", "set": 1},
    {"word": "mount", "meaning": "【動】登る、据え付ける", "pos": "動", "example": "Mount a horse.", "phrase": "mount a campaign", "set": 1},
    {"word": "mournful", "meaning": "【形】悲しげな", "pos": "形", "example": "Mournful cry.", "phrase": "mournful look", "set": 1},
    {"word": "moustache", "meaning": "【名】口ひげ", "pos": "名", "example": "Grow a moustache.", "phrase": "thick moustache", "set": 1},
    {"word": "mover", "meaning": "【名】引っ越し業者、提案者", "pos": "名", "example": "Hired movers.", "phrase": "prime mover", "set": 1},
    {"word": "moving", "meaning": "【形】感動的な", "pos": "形", "example": "Moving story.", "phrase": "deeply moving", "set": 1},
    {"word": "muddy", "meaning": "【形】泥だらけの", "pos": "形", "example": "Muddy shoes.", "phrase": "muddy water", "set": 1},
    {"word": "multiple", "meaning": "【形】多数の", "pos": "形", "example": "Multiple choice.", "phrase": "multiple injuries", "set": 1},
    {"word": "multiply", "meaning": "【動】掛ける、増やす", "pos": "動", "example": "Multiply by two.", "phrase": "multiply quickly", "set": 1},
    {"word": "mumble", "meaning": "【名】つぶやき (verb mostly)", "pos": "名", "example": "Low mumble.", "phrase": "mumble words", "set": 1},
    {"word": "mumble", "meaning": "【動】つぶやく", "pos": "動", "example": "Don't mumble.", "phrase": "mumble excuse", "set": 1},
    {"word": "murmur", "meaning": "【名】ささやき", "pos": "名", "example": "Murmur of approval.", "phrase": "heart murmur", "set": 1},
    {"word": "muse", "meaning": "【動】熟考する", "pos": "動", "example": "Muse on life.", "phrase": "muse aloud", "set": 1},
    {"word": "musical", "meaning": "【名】ミュージカル", "pos": "名", "example": "Broadway musical.", "phrase": "musical instrument", "set": 1},
    {"word": "mustache", "meaning": "【名】口ひげ（米）", "pos": "名", "example": "Handlebar mustache.", "phrase": "trim mustache", "set": 1},
    {"word": "mutability", "meaning": "【名】変わりやすさ", "pos": "名", "example": "Mutability of life.", "phrase": "mutability of fortune", "set": 1},
    {"word": "mutable", "meaning": "【形】変わりやすい", "pos": "形", "example": "Mutable nature.", "phrase": "mutable laws", "set": 1},
    {"word": "mutter", "meaning": "【名】つぶやき (verb mostly)", "pos": "名", "example": "Angry mutter.", "phrase": "mutter complaint", "set": 1},
    {"word": "mutter", "meaning": "【動】不平を言う", "pos": "動", "example": "Mutter under breath.", "phrase": "mutter to oneself", "set": 1},
    {"word": "mutton", "meaning": "【名】羊肉", "pos": "名", "example": "Roast mutton.", "phrase": "mutton chop", "set": 1},
    {"word": "mystify", "meaning": "【動】惑わす", "pos": "動", "example": "Completely mystified.", "phrase": "mystify the audience", "set": 1},
    {"word": "nano", "meaning": "【名】ナノ", "pos": "名", "example": "Nano technology.", "phrase": "nano scale", "set": 1},
    {"word": "narcissistic", "meaning": "【形】自己陶酔的な", "pos": "形", "example": "Narcissistic personality.", "phrase": "narcissistic behavior", "set": 1},
    {"word": "narrator", "meaning": "【名】語り手", "pos": "名", "example": "Film narrator.", "phrase": "first-person narrator", "set": 1},
    {"word": "narrowly", "meaning": "【副】かろうじて", "pos": "副", "example": "Narrowly escaped.", "phrase": "narrowly defeated", "set": 1},
    {"word": "nationwide", "meaning": "【形】全国的な", "pos": "形", "example": "Nationwide strike.", "phrase": "nationwide search", "set": 1},
    {"word": "nationwide", "meaning": "【副】全国的に", "pos": "副", "example": "Broadcast nationwide.", "phrase": "travel nationwide", "set": 1},
    {"word": "native speaker", "meaning": "【名】ネイティブスピーカー", "pos": "名", "example": "English native speaker.", "phrase": "like a native speaker", "set": 1},
    {"word": "naughty", "meaning": "【形】いたずらな", "pos": "形", "example": "Naughty boy.", "phrase": "naughty bit", "set": 1},
    {"word": "naval", "meaning": "【形】海軍の", "pos": "形", "example": "Naval officer.", "phrase": "naval base", "set": 1},
    {"word": "navigate", "meaning": "【動】操縦する、航行する", "pos": "動", "example": "Navigate the ship.", "phrase": "navigate through", "set": 1},
    {"word": "navigation", "meaning": "【名】航海、ナビゲーション", "pos": "名", "example": "Satellite navigation.", "phrase": "car navigation", "set": 1},
    {"word": "navy", "meaning": "【名】海軍", "pos": "名", "example": "Join the navy.", "phrase": "navy blue", "set": 1},
    {"word": "neat", "meaning": "【形】きちんとした", "pos": "形", "example": "Neat room.", "phrase": "neat handwriting", "set": 1},
    {"word": "necessarily", "meaning": "【副】必ずしも", "pos": "副", "example": "Not necessarily true.", "phrase": "necessarily so", "set": 1},
    {"word": "necessity", "meaning": "【名】必要性", "pos": "名", "example": "Absolute necessity.", "phrase": "out of necessity", "set": 1},
    {"word": "need", "meaning": "【名】必要", "pos": "名", "example": "In need of.", "phrase": "basic needs", "set": 1},
    {"word": "needless", "meaning": "【形】不必要な", "pos": "形", "example": "Needless to say.", "phrase": "needless worry", "set": 1},
    {"word": "needy", "meaning": "【形】貧困な", "pos": "形", "example": "Help the needy.", "phrase": "needy family", "set": 1},
    {"word": "negatively", "meaning": "【副】否定的に", "pos": "副", "example": "React negatively.", "phrase": "affect negatively", "set": 1},
    {"word": "neglect", "meaning": "【名】怠慢、無視", "pos": "名", "example": "Child neglect.", "phrase": "willful neglect", "set": 1},
    {"word": "neighboring", "meaning": "【形】隣接する", "pos": "形", "example": "Neighboring country.", "phrase": "neighboring town", "set": 1},
    {"word": "neighbouring", "meaning": "【形】隣接する（英）", "pos": "形", "example": "Neighbouring village.", "phrase": "neighbouring state", "set": 1},
    {"word": "neither", "meaning": "【副】...もまた...ない", "pos": "副", "example": "Me neither.", "phrase": "neither here nor there", "set": 1},
    {"word": "neither", "meaning": "【接】どちらも～ない", "pos": "接", "example": "Neither A nor B.", "phrase": "neither tall nor short", "set": 1},
    {"word": "neither", "meaning": "【限】どちらの～も～ない", "pos": "限", "example": "Neither answer is correct.", "phrase": "on neither side", "set": 1},
    {"word": "neither", "meaning": "【代】どちらも～ない", "pos": "代", "example": "Neither of them.", "phrase": "neither knows", "set": 1},
    {"word": "nerve", "meaning": "【名】神経", "pos": "名", "example": "Optic nerve.", "phrase": "lose one's nerve", "set": 1},
    {"word": "nerves", "meaning": "【名】神経過敏", "pos": "名", "example": "Bad nerves.", "phrase": "get on nerves", "set": 1},
    {"word": "nervously", "meaning": "【副】神経質に", "pos": "副", "example": "Glance nervously.", "phrase": "laugh nervously", "set": 1},
    {"word": "net surfer", "meaning": "【名】ネットサーファー", "pos": "名", "example": "Avid net surfer.", "phrase": "experienced net surfer", "set": 1},
    {"word": "netsurfer", "meaning": "【名】ネットサーファー", "pos": "名", "example": "Heavy netsurfer.", "phrase": "become a netsurfer", "set": 1},
    {"word": "neurosis", "meaning": "【名】ノイローゼ", "pos": "名", "example": "Suffer from neurosis.", "phrase": "anxiety neurosis", "set": 1},
    {"word": "newscaster", "meaning": "【名】ニュースキャスター", "pos": "名", "example": "TV newscaster.", "phrase": "famous newscaster", "set": 1},
    {"word": "newsworthy", "meaning": "【形】ニュース価値のある", "pos": "形", "example": "Newsworthy event.", "phrase": "rarely newsworthy", "set": 1},
    {"word": "next", "meaning": "【代】次", "pos": "代", "example": "What comes next?", "phrase": "next please", "set": 1},
    {"word": "nicely", "meaning": "【副】うまく、親切に", "pos": "副", "example": "Playing nicely.", "phrase": "ask nicely", "set": 1},
    {"word": "nightclub", "meaning": "【名】ナイトクラブ", "pos": "名", "example": "Dance at a nightclub.", "phrase": "nightclub bouncer", "set": 1},
    {"word": "nightmare", "meaning": "【名】悪夢", "pos": "名", "example": "Have a nightmare.", "phrase": "worst nightmare", "set": 1},
    {"word": "nobility", "meaning": "【名】貴族", "pos": "名", "example": "French nobility.", "phrase": "member of nobility", "set": 1},
    {"word": "noble", "meaning": "【形】高潔な、貴族の", "pos": "形", "example": "Noble cause.", "phrase": "noble gas", "set": 1},
    {"word": "nobleman", "meaning": "【名】貴族", "pos": "名", "example": "Wealthy nobleman.", "phrase": "titled nobleman", "set": 1},
    {"word": "nod", "meaning": "【動】うなずく", "pos": "動", "example": "Nod in agreement.", "phrase": "nod off", "set": 1},
    {"word": "nomad", "meaning": "【名】遊牧民", "pos": "名", "example": "Desert nomad.", "phrase": "digital nomad", "set": 1},
    {"word": "nomination", "meaning": "【名】指名", "pos": "名", "example": "Accept nomination.", "phrase": "nomination for", "set": 1},
    {"word": "nominee", "meaning": "【名】指名された人", "pos": "名", "example": "Award nominee.", "phrase": "presidential nominee", "set": 1},
    {"word": "nonprofessional", "meaning": "【形】プロでない", "pos": "形", "example": "Nonprofessional athletes.", "phrase": "nonprofessional staff", "set": 1},
    {"word": "non-smoking", "meaning": "【形】禁煙の", "pos": "形", "example": "Non-smoking area.", "phrase": "non-smoking flight", "set": 1},
    {"word": "northward", "meaning": "【副】北へ", "pos": "副", "example": "Travel northward.", "phrase": "facing northward", "set": 1},
    {"word": "northwards", "meaning": "【副】北へ（英）", "pos": "副", "example": "Move northwards.", "phrase": "heading northwards", "set": 1},
    {"word": "nostril", "meaning": "【名】鼻孔", "pos": "名", "example": "Flare nostrils.", "phrase": "right nostril", "set": 1},
    {"word": "nought", "meaning": "【名】ゼロ", "pos": "名", "example": "Come to nought.", "phrase": "noughts and crosses", "set": 1},
    {"word": "nourish", "meaning": "【動】養う", "pos": "動", "example": "Nourish the body.", "phrase": "ill nourished", "set": 1},
    {"word": "nourishment", "meaning": "【名】栄養", "pos": "名", "example": "Need nourishment.", "phrase": "spiritual nourishment", "set": 1},
    {"word": "novelty", "meaning": "【名】目新しさ", "pos": "名", "example": "Novelty wore off.", "phrase": "novelty item", "set": 1},
    {"word": "now", "meaning": "【接】今や～なので", "pos": "接", "example": "Now that you mention it.", "phrase": "now that", "set": 1},
    {"word": "nuisance", "meaning": "【名】迷惑", "pos": "名", "example": "Public nuisance.", "phrase": "make a nuisance of", "set": 1},
    {"word": "numerical", "meaning": "【形】数の", "pos": "形", "example": "Numerical order.", "phrase": "numerical ability", "set": 1},
    {"word": "nursery", "meaning": "【名】保育園、苗床", "pos": "名", "example": "Day nursery.", "phrase": "nursery school", "set": 1},
    {"word": "nut", "meaning": "【名】木の実、変人", "pos": "名", "example": "Crack a nut.", "phrase": "hard nut to crack", "set": 1},
    {"word": "nutshell", "meaning": "【名】木の実の殻", "pos": "名", "example": "In a nutshell.", "phrase": "put in a nutshell", "set": 1},
    {"word": "oath", "meaning": "【名】誓い", "pos": "名", "example": "Take an oath.", "phrase": "under oath", "set": 1},
    {"word": "obedience", "meaning": "【名】服従", "pos": "名", "example": "Blind obedience.", "phrase": "obedience school", "set": 1},
    {"word": "obedient", "meaning": "【形】従順な", "pos": "形", "example": "Obedient dog.", "phrase": "obedient servant", "set": 1},
    {"word": "obey", "meaning": "【動】従う", "pos": "動", "example": "Obey rules.", "phrase": "obey the law", "set": 1},
    {"word": "obituary", "meaning": "【名】死亡記事", "pos": "名", "example": "Read the obituary.", "phrase": "obituary column", "set": 1},
    {"word": "object", "meaning": "【動】反対する", "pos": "動", "example": "Object to the plan.", "phrase": "object strongly", "set": 1},
    {"word": "objective", "meaning": "【形】客観的な", "pos": "形", "example": "Objective opinion.", "phrase": "objective reality", "set": 1},
    {"word": "obligation", "meaning": "【名】義務", "pos": "名", "example": "Moral obligation.", "phrase": "under obligation", "set": 1},
    {"word": "observer", "meaning": "【名】観察者", "pos": "名", "example": "Impartial observer.", "phrase": "political observer", "set": 1},
    {"word": "obsess", "meaning": "【動】取りつく", "pos": "動", "example": "Obsess about details.", "phrase": "obsessed with", "set": 1},
    {"word": "obsession", "meaning": "【名】強迫観念", "pos": "名", "example": "Healthy obsession.", "phrase": "obsession with", "set": 1},
    {"word": "obsessive", "meaning": "【形】強迫的な", "pos": "形", "example": "Obsessive behavior.", "phrase": "obsessive fan", "set": 1},
    {"word": "odd", "meaning": "【形】奇妙な、奇数の", "pos": "形", "example": "Odd socks.", "phrase": "odd number", "set": 1},
    {"word": "offence", "meaning": "【名】犯罪、侮辱（英）", "pos": "名", "example": "Criminal offence.", "phrase": "take offence", "set": 1},
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
