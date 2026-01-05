
import json
import re
import os

# B2 Batch 18 (Words 2551-2700 approx)
# CSV Lines 2551 to 2700
new_words = [
    {"word": "toil", "meaning": "【動】苦労して働く", "pos": "動", "example": "Toil all day.", "phrase": "toil away", "set": 1},
    {"word": "tolerant", "meaning": "【形】寛容な", "pos": "形", "example": "Tolerant society.", "phrase": "tolerant of", "set": 1},
    {"word": "tolerate", "meaning": "【動】我慢する", "pos": "動", "example": "Can't tolerate noise.", "phrase": "tolerate behavior", "set": 1},
    {"word": "toll", "meaning": "【名】通行料、犠牲", "pos": "名", "example": "Pay the toll.", "phrase": "death toll", "set": 1},
    {"word": "tomb", "meaning": "【名】墓", "pos": "名", "example": "Ancient tomb.", "phrase": "tomb raider", "set": 1},
    {"word": "ton", "meaning": "【名】トン", "pos": "名", "example": "Weigh a ton.", "phrase": "metric ton", "set": 1},
    {"word": "tonne", "meaning": "【名】トン（英）", "pos": "名", "example": "Metric tonne.", "phrase": "cost per tonne", "set": 1},
    {"word": "torch", "meaning": "【名】たいまつ、懐中電灯（英）", "pos": "名", "example": "Shine a torch.", "phrase": "carry a torch for", "set": 1},
    {"word": "tortoiseshell", "meaning": "【名】べっ甲", "pos": "名", "example": "Tortoiseshell glasses.", "phrase": "tortoiseshell cat", "set": 1},
    {"word": "torture", "meaning": "【動】拷問にかける", "pos": "動", "example": "Torture prisoners.", "phrase": "mental torture", "set": 1},
    {"word": "tough", "meaning": "【形】丈夫な、困難な", "pos": "形", "example": "Tough guy.", "phrase": "tough luck", "set": 1},
    {"word": "toxic", "meaning": "【形】有毒な", "pos": "形", "example": "Toxic waste.", "phrase": "toxic relationship", "set": 1},
    {"word": "trace", "meaning": "【動】跡をたどる", "pos": "動", "example": "Trace the origin.", "phrase": "trace back to", "set": 1},
    {"word": "track", "meaning": "【動】追跡する", "pos": "動", "example": "Track a package.", "phrase": "keep track of", "set": 1},
    {"word": "trade", "meaning": "【動】貿易する", "pos": "動", "example": "Trade with China.", "phrase": "trade in", "set": 1},
    {"word": "trader", "meaning": "【名】商人", "pos": "名", "example": "Market trader.", "phrase": "day trader", "set": 1},
    {"word": "trail", "meaning": "【動】引きずる、追跡する", "pos": "動", "example": "Trail behind.", "phrase": "trail away", "set": 1},
    {"word": "trailer", "meaning": "【名】予告編、トレーラー", "pos": "名", "example": "Movie trailer.", "phrase": "camping trailer", "set": 1},
    {"word": "trainee", "meaning": "【名】研修生", "pos": "名", "example": "Management trainee.", "phrase": "trainee teacher", "set": 1},
    {"word": "trainer", "meaning": "【名】トレーナー", "pos": "名", "example": "Personal trainer.", "phrase": "dog trainer", "set": 1},
    {"word": "trait", "meaning": "【名】特徴", "pos": "名", "example": "Personality trait.", "phrase": "genetic trait", "set": 1},
    {"word": "traitor", "meaning": "【名】裏切り者", "pos": "名", "example": "Branded a traitor.", "phrase": "traitor to his country", "set": 1},
    {"word": "tramp", "meaning": "【名】放浪者", "pos": "名", "example": "Old tramp.", "phrase": "tramp stamp", "set": 1},
    {"word": "trample", "meaning": "【名】踏みつける音 (verb mostly)", "pos": "名", "example": "Hear the trample.", "phrase": "trample on rights", "set": 1},
    {"word": "transcript", "meaning": "【名】謄本、成績証明書", "pos": "名", "example": "Academic transcript.", "phrase": "interview transcript", "set": 1},
    {"word": "transfer", "meaning": "【名】移動、転送", "pos": "名", "example": "Bank transfer.", "phrase": "transfer student", "set": 1},
    {"word": "transfusion", "meaning": "【名】輸血", "pos": "名", "example": "Blood transfusion.", "phrase": "need a transfusion", "set": 1},
    {"word": "transient", "meaning": "【形】一時的な", "pos": "形", "example": "Transient sensation.", "phrase": "transient population", "set": 1},
    {"word": "transistor", "meaning": "【名】トランジスタ", "pos": "名", "example": "Transistor radio.", "phrase": "transistor circuit", "set": 1},
    {"word": "transition", "meaning": "【名】移行", "pos": "名", "example": "Period of transition.", "phrase": "transition to", "set": 1},
    {"word": "transitive", "meaning": "【形】他動詞の", "pos": "形", "example": "Transitive verb.", "phrase": "transitive sense", "set": 1},
    {"word": "translation", "meaning": "【名】翻訳", "pos": "名", "example": "Literal translation.", "phrase": "lost in translation", "set": 1},
    {"word": "translator", "meaning": "【名】翻訳家", "pos": "名", "example": "Professional translator.", "phrase": "work as translator", "set": 1},
    {"word": "transmission", "meaning": "【名】伝達、送信", "pos": "名", "example": "Data transmission.", "phrase": "automatic transmission", "set": 1},
    {"word": "transmit", "meaning": "【動】送信する、伝える", "pos": "動", "example": "Transmit a signal.", "phrase": "transmit disease", "set": 1},
    {"word": "transparent", "meaning": "【形】透明な", "pos": "形", "example": "Transparent glass.", "phrase": "transparent excuse", "set": 1},
    {"word": "transport", "meaning": "【動】輸送する", "pos": "動", "example": "Transport goods.", "phrase": "public transport", "set": 1},
    {"word": "traverse", "meaning": "【名】横断 (verb mostly)", "pos": "名", "example": "Mountain traverse.", "phrase": "traverse the globe", "set": 1},
    {"word": "tray", "meaning": "【名】盆", "pos": "名", "example": "Serving tray.", "phrase": "ash tray", "set": 1},
    {"word": "tread", "meaning": "【動】踏む、歩く", "pos": "動", "example": "Tread lightly.", "phrase": "tread water", "set": 1},
    {"word": "treat", "meaning": "【動】扱う、治療する", "pos": "動", "example": "Treat with respect.", "phrase": "trick or treat", "set": 1},
    {"word": "treaty", "meaning": "【名】条約", "pos": "名", "example": "Peace treaty.", "phrase": "sign a treaty", "set": 1},
    {"word": "trek", "meaning": "【名】長い旅", "pos": "名", "example": "Trek through mountains.", "phrase": "Star Trek", "set": 1},
    {"word": "tremendously", "meaning": "【副】ものすごく", "pos": "副", "example": "Tremendously popular.", "phrase": "suffer tremendously", "set": 1},
    {"word": "tremor", "meaning": "【名】震え", "pos": "名", "example": "Earth tremor.", "phrase": "hand tremor", "set": 1},
    {"word": "trial", "meaning": "【名】裁判、試み", "pos": "名", "example": "Fair trial.", "phrase": "trial and error", "set": 1},
    {"word": "triangle", "meaning": "【名】三角形", "pos": "名", "example": "Right triangle.", "phrase": "love triangle", "set": 1},
    {"word": "tribe", "meaning": "【名】部族", "pos": "名", "example": "Native tribe.", "phrase": "tribe member", "set": 1},
    {"word": "trick", "meaning": "【動】だます", "pos": "動", "example": "Trick someone.", "phrase": "do the trick", "set": 1},
    {"word": "tricky", "meaning": "【形】扱いにくい", "pos": "形", "example": "Tricky question.", "phrase": "tricky situation", "set": 1},
    {"word": "trio", "meaning": "【名】三人組", "pos": "名", "example": "Jazz trio.", "phrase": "musical trio", "set": 1},
    {"word": "trip", "meaning": "【動】つまずく", "pos": "動", "example": "Trip over a stone.", "phrase": "trip up", "set": 1},
    {"word": "trivial", "meaning": "【形】些細な", "pos": "形", "example": "Trivial matter.", "phrase": "trivial pursuit", "set": 1},
    {"word": "trolley", "meaning": "【名】手押し車", "pos": "名", "example": "Shopping trolley.", "phrase": "trolley bus", "set": 1},
    {"word": "troop", "meaning": "【名】軍隊、群れ", "pos": "名", "example": "Send troops.", "phrase": "scout troop", "set": 1},
    {"word": "trophy", "meaning": "【名】トロフィー", "pos": "名", "example": "Win a trophy.", "phrase": "trophy wife", "set": 1},
    {"word": "tropic", "meaning": "【形】熱帯の (noun mostly)", "pos": "形", "example": "Tropic of Cancer.", "phrase": "the tropics", "set": 1},
    {"word": "troublesome", "meaning": "【形】厄介な", "pos": "形", "example": "Troublesome child.", "phrase": "troublesome problem", "set": 1},
    {"word": "trunk", "meaning": "【名】幹、トランク", "pos": "名", "example": "Tree trunk.", "phrase": "elephant trunk", "set": 1},
    {"word": "trust", "meaning": "【名】信頼", "pos": "名", "example": "Mutual trust.", "phrase": "trust fund", "set": 1},
    {"word": "trusty", "meaning": "【形】信頼できる", "pos": "形", "example": "Trusty steed.", "phrase": "trusty friend", "set": 1},
    {"word": "truthful", "meaning": "【形】正直な", "pos": "形", "example": "Truthful answer.", "phrase": "be truthful", "set": 1},
    {"word": "truthfulness", "meaning": "【名】正直さ", "pos": "名", "example": "Doubting truthfulness.", "phrase": "value truthfulness", "set": 1},
    {"word": "tub", "meaning": "【名】桶", "pos": "名", "example": "Hot tub.", "phrase": "tub of butter", "set": 1},
    {"word": "tuberculosis", "meaning": "【名】結核", "pos": "名", "example": "Cure tuberculosis.", "phrase": "tuberculosis symptoms", "set": 1},
    {"word": "tug", "meaning": "【名】強い引き (verb mostly)", "pos": "名", "example": "Tug of war.", "phrase": "tug boat", "set": 1},
    {"word": "tuition", "meaning": "【名】授業料", "pos": "名", "example": "Pay tuition.", "phrase": "tuition fees", "set": 1},
    {"word": "tulip", "meaning": "【名】チューリップ", "pos": "名", "example": "Red tulip.", "phrase": "tulip bulb", "set": 1},
    {"word": "tumor", "meaning": "【名】腫瘍", "pos": "名", "example": "Brain tumor.", "phrase": "benign tumor", "set": 1},
    {"word": "tumour", "meaning": "【名】腫瘍（英）", "pos": "名", "example": "Remove a tumour.", "phrase": "malignant tumour", "set": 1},
    {"word": "tunnel", "meaning": "【名】トンネル", "pos": "名", "example": "Train tunnel.", "phrase": "tunnel vision", "set": 1},
    {"word": "turbulent", "meaning": "【形】荒れ狂う", "pos": "形", "example": "Turbulent flight.", "phrase": "turbulent times", "set": 1},
    {"word": "tutor", "meaning": "【名】家庭教師", "pos": "名", "example": "Math tutor.", "phrase": "private tutor", "set": 1},
    {"word": "twinkle", "meaning": "【名】きらめき (verb mostly)", "pos": "名", "example": "Twinkle in eye.", "phrase": "twinkle twinkle", "set": 1},
    {"word": "twisted", "meaning": "【形】ねじれた", "pos": "形", "example": "Twisted ankle.", "phrase": "twisted mind", "set": 1},
    {"word": "typhoid", "meaning": "【名】腸チフス", "pos": "名", "example": "Typhoid fever.", "phrase": "typhoid vaccine", "set": 1},
    {"word": "tyranny", "meaning": "【名】圧政", "pos": "名", "example": "End tyranny.", "phrase": "rule by tyranny", "set": 1},
    {"word": "tyrant", "meaning": "【名】暴君", "pos": "名", "example": "Cruel tyrant.", "phrase": "act like a tyrant", "set": 1},
    {"word": "ultimate", "meaning": "【形】究極の", "pos": "形", "example": "Ultimate goal.", "phrase": "ultimate sacrifice", "set": 1},
    {"word": "ultimately", "meaning": "【副】結局", "pos": "副", "example": "Ultimately responsible.", "phrase": "ultimately succeed", "set": 1},
    {"word": "unacceptable", "meaning": "【形】容認できない", "pos": "形", "example": "Unacceptable behavior.", "phrase": "socially unacceptable", "set": 1},
    {"word": "unashamedly", "meaning": "【副】恥ずかしげもなく", "pos": "副", "example": "Wept unashamedly.", "phrase": "unashamedly biased", "set": 1},
    {"word": "unattractive", "meaning": "【形】魅力のない", "pos": "形", "example": "Unattractive option.", "phrase": "feel unattractive", "set": 1},
    {"word": "unauthorised", "meaning": "【形】権限のない（英）", "pos": "形", "example": "Unauthorised access.", "phrase": "unauthorised use", "set": 1},
    {"word": "unauthorized", "meaning": "【形】権限のない", "pos": "形", "example": "Unauthorized entry.", "phrase": "unauthorized biography", "set": 1},
    {"word": "unavailable", "meaning": "【形】利用できない", "pos": "形", "example": "Currently unavailable.", "phrase": "make unavailable", "set": 1},
    {"word": "unaware", "meaning": "【形】気づかない", "pos": "形", "example": "Unaware of danger.", "phrase": "totally unaware", "set": 1},
    {"word": "unbearable", "meaning": "【形】耐えられない", "pos": "形", "example": "Unbearable pain.", "phrase": "unbearable lightness", "set": 1},
    {"word": "unbeatable", "meaning": "【形】打ち負かせない", "pos": "形", "example": "Unbeatable price.", "phrase": "unbeatable team", "set": 1},
    {"word": "unchanged", "meaning": "【形】変わらない", "pos": "形", "example": "Remain unchanged.", "phrase": "unchanged since", "set": 1},
    {"word": "uncharacteristic", "meaning": "【形】らしくない", "pos": "形", "example": "Uncharacteristic silence.", "phrase": "uncharacteristic behavior", "set": 1},
    {"word": "unclearly", "meaning": "【副】不明瞭に", "pos": "副", "example": "Speak unclearly.", "phrase": "written unclearly", "set": 1},
    {"word": "uncomfortably", "meaning": "【副】不快に", "pos": "副", "example": "Uncomfortably hot.", "phrase": "sit uncomfortably", "set": 1},
    {"word": "uncommon", "meaning": "【形】珍しい", "pos": "形", "example": "Not uncommon.", "phrase": "uncommon valor", "set": 1},
    {"word": "unconcerned", "meaning": "【形】無関心な", "pos": "形", "example": "Appear unconcerned.", "phrase": "unconcerned about", "set": 1},
    {"word": "unconscious", "meaning": "【形】意識不明の", "pos": "形", "example": "Fall unconscious.", "phrase": "unconscious mind", "set": 1},
    {"word": "underestimate", "meaning": "【動】過小評価する", "pos": "動", "example": "Underestimate enemy.", "phrase": "underestimate value", "set": 1},
    {"word": "undergraduate", "meaning": "【名】学部学生", "pos": "名", "example": "Undergraduate student.", "phrase": "undergraduate degree", "set": 1},
    {"word": "underground", "meaning": "【形】地下の", "pos": "形", "example": "Underground passage.", "phrase": "underground music", "set": 1},
    {"word": "underground", "meaning": "【副】地下で", "pos": "副", "example": "Go underground.", "phrase": "live underground", "set": 1},
    {"word": "underneath", "meaning": "【副】下に", "pos": "副", "example": "Look underneath.", "phrase": "wear underneath", "set": 1},
    {"word": "undersea", "meaning": "【形】海中の", "pos": "形", "example": "Undersea cable.", "phrase": "undersea life", "set": 1},
    {"word": "understandable", "meaning": "【形】理解できる", "pos": "形", "example": "Understandable mistake.", "phrase": "understandable reaction", "set": 1},
    {"word": "understanding", "meaning": "【形】思いやりのある", "pos": "形", "example": "Understanding parents.", "phrase": "be understanding", "set": 1},
    {"word": "understanding", "meaning": "【名】理解", "pos": "名", "example": "Mutual understanding.", "phrase": "my understanding", "set": 1},
    {"word": "undertake", "meaning": "【動】引き受ける", "pos": "動", "example": "Undertake a task.", "phrase": "undertake research", "set": 1},
    {"word": "underwater", "meaning": "【副】水中で", "pos": "副", "example": "Swim underwater.", "phrase": "underwater camera", "set": 1},
    {"word": "underwear", "meaning": "【名】下着", "pos": "名", "example": "Clean underwear.", "phrase": "wear underwear", "set": 1},
    {"word": "undoubtedly", "meaning": "【副】疑いなく", "pos": "副", "example": "Undoubtedly true.", "phrase": "undoubtedly the best", "set": 1},
    {"word": "undreamed", "meaning": "【形】夢にも思わない", "pos": "形", "example": "Undreamed of.", "phrase": "undreamed success", "set": 1},
    {"word": "undressed", "meaning": "【形】服を着ていない", "pos": "形", "example": "Get undressed.", "phrase": "half undressed", "set": 1},
    {"word": "unease", "meaning": "【名】不安", "pos": "名", "example": "Feeling of unease.", "phrase": "growing unease", "set": 1},
    {"word": "uneasily", "meaning": "【副】不安そうに", "pos": "副", "example": "Sleep uneasily.", "phrase": "move uneasily", "set": 1},
    {"word": "unenthusiastic", "meaning": "【形】乗り気でない", "pos": "形", "example": "Unenthusiastic response.", "phrase": "unenthusiastic about", "set": 1},
    {"word": "uneven", "meaning": "【形】平らでない", "pos": "形", "example": "Uneven surface.", "phrase": "uneven distribution", "set": 1},
    {"word": "unfamiliar", "meaning": "【形】なじみのない", "pos": "形", "example": "Unfamiliar face.", "phrase": "unfamiliar with", "set": 1},
    {"word": "unfashionable", "meaning": "【形】流行遅れの", "pos": "形", "example": "Unfashionable clothes.", "phrase": "unfashionable area", "set": 1},
    {"word": "unforeseen", "meaning": "【形】予期しない", "pos": "形", "example": "Unforeseen circumstances.", "phrase": "unforeseen problem", "set": 1},
    {"word": "ungodly", "meaning": "【形】神を恐れぬ、ひどい", "pos": "形", "example": "Ungodly hour.", "phrase": "ungodly mess", "set": 1},
    {"word": "unhappiness", "meaning": "【名】不幸", "pos": "名", "example": "Cause unhappiness.", "phrase": "deep unhappiness", "set": 1},
    {"word": "unhelpful", "meaning": "【形】役に立たない", "pos": "形", "example": "Unhelpful staff.", "phrase": "unhelpful advice", "set": 1},
    {"word": "unimaginable", "meaning": "【形】想像できない", "pos": "形", "example": "Unimaginable horror.", "phrase": "unimaginable wealth", "set": 1},
    {"word": "unimaginably", "meaning": "【副】想像できないほど", "pos": "副", "example": "Unimaginably rich.", "phrase": "unimaginably complex", "set": 1},
    {"word": "united", "meaning": "【形】団結した", "pos": "形", "example": "United front.", "phrase": "United Nations", "set": 1},
    {"word": "universal", "meaning": "【形】普遍的な", "pos": "形", "example": "Universal truth.", "phrase": "universal appeal", "set": 1},
    {"word": "unjustly", "meaning": "【副】不当に", "pos": "副", "example": "Unjustly accused.", "phrase": "treated unjustly", "set": 1},
    {"word": "unkind", "meaning": "【形】不親切な", "pos": "形", "example": "Unkind words.", "phrase": "not unkind", "set": 1},
    {"word": "unlike", "meaning": "【前】～と違って", "pos": "前", "example": "Unlike his brother.", "phrase": "not unlike", "set": 1},
    {"word": "unlimited", "meaning": "【形】無制限の", "pos": "形", "example": "Unlimited access.", "phrase": "unlimited potential", "set": 1},
    {"word": "unload", "meaning": "【動】荷を下ろす", "pos": "動", "example": "Unload the truck.", "phrase": "unload burden", "set": 1},
    {"word": "unlock", "meaning": "【動】鍵を開ける", "pos": "動", "example": "Unlock the door.", "phrase": "unlock potential", "set": 1},
    {"word": "unmistakable", "meaning": "【形】紛れもない", "pos": "形", "example": "Unmistakable sign.", "phrase": "unmistakable voice", "set": 1},
    {"word": "unmistakably", "meaning": "【副】紛れもなく", "pos": "副", "example": "Unmistakably him.", "phrase": "unmistakably clear", "set": 1},
    {"word": "unnatural", "meaning": "【形】不自然な", "pos": "形", "example": "Unnatural color.", "phrase": "unnatural death", "set": 1},
    {"word": "unofficial", "meaning": "【形】非公式の", "pos": "形", "example": "Unofficial strike.", "phrase": "unofficial visit", "set": 1},
    {"word": "unpopular", "meaning": "【形】人気のない", "pos": "形", "example": "Unpopular decision.", "phrase": "unpopular opinion", "set": 1},
    {"word": "unrealistic", "meaning": "【形】非現実的な", "pos": "形", "example": "Unrealistic expectation.", "phrase": "unrealistic goal", "set": 1},
    {"word": "unreasonable", "meaning": "【形】理不尽な", "pos": "形", "example": "Unreasonable demand.", "phrase": "being unreasonable", "set": 1},
    {"word": "unreliable", "meaning": "【形】当てにならない", "pos": "形", "example": "Unreliable witness.", "phrase": "unreliable source", "set": 1},
    {"word": "unrest", "meaning": "【名】不安、動揺", "pos": "名", "example": "Civil unrest.", "phrase": "social unrest", "set": 1},
    {"word": "unsafe", "meaning": "【形】安全でない", "pos": "形", "example": "Unsafe condition.", "phrase": "unsafe sex", "set": 1},
    {"word": "unsatisfactory", "meaning": "【形】不満足な", "pos": "形", "example": "Unsatisfactory performance.", "phrase": "unsatisfactory result", "set": 1},
    {"word": "unselfish", "meaning": "【形】無私の", "pos": "形", "example": "Unselfish love.", "phrase": "unselfish act", "set": 1},
    {"word": "unstoppable", "meaning": "【形】止められない", "pos": "形", "example": "Unstoppable force.", "phrase": "seem unstoppable", "set": 1},
    {"word": "unsuccessful", "meaning": "【形】成功しない", "pos": "形", "example": "Unsuccessful attempt.", "phrase": "unsuccessful candidate", "set": 1},
    {"word": "unsuitable", "meaning": "【形】不適当な", "pos": "形", "example": "Unsuitable for children.", "phrase": "unsuitable match", "set": 1},
    {"word": "unsure", "meaning": "【形】確信がない", "pos": "形", "example": "Unsure of answer.", "phrase": "unsure what to do", "set": 1},
    {"word": "untalented", "meaning": "【形】才能のない", "pos": "形", "example": "Untalented artist.", "phrase": "untalented writer", "set": 1},
    {"word": "unthinkably", "meaning": "【副】考えられないほど", "pos": "副", "example": "Unthinkably cruel.", "phrase": "unthinkably vast", "set": 1},
    {"word": "untie", "meaning": "【動】解く", "pos": "動", "example": "Untie the knot.", "phrase": "untie shoes", "set": 1},
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
