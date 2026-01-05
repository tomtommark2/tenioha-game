
import json
import re
import os

# B2 Batch 16 (Words 2251-2400 approx)
# CSV Lines 2251 to 2400
new_words = [
    {"word": "showbiz", "meaning": "【名】芸能界", "pos": "名", "example": "Showbiz news.", "phrase": "that's showbiz", "set": 1},
    {"word": "showcase", "meaning": "【名】陳列棚、披露の場", "pos": "名", "example": "Talent showcase.", "phrase": "glass showcase", "set": 1},
    {"word": "shower", "meaning": "【動】シャワーを浴びる、降り注ぐ", "pos": "動", "example": "Shower with gifts.", "phrase": "take a shower", "set": 1},
    {"word": "shrink", "meaning": "【名】精神科医（俗語）", "pos": "名", "example": "See a shrink.", "phrase": "head shrink", "set": 1},
    {"word": "shrink", "meaning": "【動】縮む", "pos": "動", "example": "Shirt shrunk.", "phrase": "shrink back", "set": 1},
    {"word": "shrug", "meaning": "【動】肩をすくめる", "pos": "動", "example": "Shrug shoulders.", "phrase": "shrug off", "set": 1},
    {"word": "sigh", "meaning": "【動】ため息をつく", "pos": "動", "example": "Sigh deeply.", "phrase": "sigh of relief", "set": 1},
    {"word": "significantly", "meaning": "【副】著しく", "pos": "副", "example": "Significantly different.", "phrase": "contribute significantly", "set": 1},
    {"word": "signify", "meaning": "【動】意味する", "pos": "動", "example": "Signify agreement.", "phrase": "what does it signify", "set": 1},
    {"word": "silverware", "meaning": "【名】銀食器", "pos": "名", "example": "Polish silverware.", "phrase": "sterling silverware", "set": 1},
    {"word": "simplification", "meaning": "【名】単純化", "pos": "名", "example": "Gross simplification.", "phrase": "tax simplification", "set": 1},
    {"word": "simultaneous", "meaning": "【形】同時の", "pos": "形", "example": "Simultaneous translation.", "phrase": "simultaneous attack", "set": 1},
    {"word": "since", "meaning": "【副】その後ずっと", "pos": "副", "example": "Haven't seen him since.", "phrase": "ever since", "set": 1},
    {"word": "sincere", "meaning": "【形】誠実な", "pos": "形", "example": "Sincere apology.", "phrase": "sincere thanks", "set": 1},
    {"word": "sincerity", "meaning": "【名】誠実", "pos": "名", "example": "Speak with sincerity.", "phrase": "in all sincerity", "set": 1},
    {"word": "sister-in-law", "meaning": "【名】義理の姉（妹）", "pos": "名", "example": "My sister-in-law.", "phrase": "visit sister-in-law", "set": 1},
    {"word": "skateboard", "meaning": "【名】スケートボード", "pos": "名", "example": "Ride a skateboard.", "phrase": "skateboard park", "set": 1},
    {"word": "skateboarder", "meaning": "【名】スケートボーダー", "pos": "名", "example": "Pro skateboarder.", "phrase": "skateboarder tricks", "set": 1},
    {"word": "sketch", "meaning": "【動】スケッチする", "pos": "動", "example": "Sketch a portrait.", "phrase": "sketch out", "set": 1},
    {"word": "skilful", "meaning": "【形】熟練した（英）", "pos": "形", "example": "Skilful player.", "phrase": "skilful handling", "set": 1},
    {"word": "skilfully", "meaning": "【副】巧みに（英）", "pos": "副", "example": "Skilfully done.", "phrase": "negotiate skilfully", "set": 1},
    {"word": "skilled", "meaning": "【形】熟練した", "pos": "形", "example": "Skilled worker.", "phrase": "highly skilled", "set": 1},
    {"word": "skillful", "meaning": "【形】熟練した", "pos": "形", "example": "Skillful surgeon.", "phrase": "skillful negotiation", "set": 1},
    {"word": "skillfully", "meaning": "【副】巧みに", "pos": "副", "example": "Skillfully executed.", "phrase": "play skillfuly", "set": 1},
    {"word": "skim", "meaning": "【動】すくい取る、ざっと読む", "pos": "動", "example": "Skim milk.", "phrase": "skim through", "set": 1},
    {"word": "skip", "meaning": "【動】飛ばす、スキップする", "pos": "動", "example": "Skip lunch.", "phrase": "skip class", "set": 1},
    {"word": "skylark", "meaning": "【名】ヒバリ", "pos": "名", "example": "Singing skylark.", "phrase": "happy as a skylark", "set": 1},
    {"word": "skyward", "meaning": "【副】空の方へ", "pos": "副", "example": "Look skyward.", "phrase": "point skyward", "set": 1},
    {"word": "skywards", "meaning": "【副】空の方へ（英）", "pos": "副", "example": "Fly skywards.", "phrase": "gaze skywards", "set": 1},
    {"word": "slam", "meaning": "【動】バタンと閉める", "pos": "動", "example": "Slam the door.", "phrase": "slam dunk", "set": 1},
    {"word": "slang", "meaning": "【名】俗語", "pos": "名", "example": "Teenage slang.", "phrase": "slang word", "set": 1},
    {"word": "slap", "meaning": "【名】平手打ち", "pos": "名", "example": "Slap in the face.", "phrase": "give a slap", "set": 1},
    {"word": "slap", "meaning": "【動】平手打ちする", "pos": "動", "example": "Slap his face.", "phrase": "slap on the back", "set": 1},
    {"word": "slash", "meaning": "【名】切り傷、斜線", "pos": "名", "example": "Forward slash.", "phrase": "slash prices", "set": 1},
    {"word": "slaughter", "meaning": "【名】屠殺、虐殺", "pos": "名", "example": "Wholesale slaughter.", "phrase": "lamb to the slaughter", "set": 1},
    {"word": "slice", "meaning": "【動】薄く切る", "pos": "動", "example": "Slice bread.", "phrase": "slice and dice", "set": 1},
    {"word": "slide", "meaning": "【動】滑る", "pos": "動", "example": "Slide on ice.", "phrase": "let it slide", "set": 1},
    {"word": "slight", "meaning": "【形】わずかな", "pos": "形", "example": "Slight change.", "phrase": "not in the slightest", "set": 1},
    {"word": "sliver", "meaning": "【名】裂片", "pos": "名", "example": "Sliver of glass.", "phrase": "sliver of hope", "set": 1},
    {"word": "sloppy", "meaning": "【形】だらしない", "pos": "形", "example": "Sloppy work.", "phrase": "sloppy joe", "set": 1},
    {"word": "smash", "meaning": "【動】粉砕する", "pos": "動", "example": "Smash a window.", "phrase": "smash hit", "set": 1},
    {"word": "smokestack", "meaning": "【名】煙突", "pos": "名", "example": "Factory smokestack.", "phrase": "tall smokestack", "set": 1},
    {"word": "snap", "meaning": "【動】ポキッと折れる、スナップ写真を撮る", "pos": "動", "example": "Snap fingers.", "phrase": "snap out of it", "set": 1},
    {"word": "sneak", "meaning": "【動】こっそり動く", "pos": "動", "example": "Sneak out.", "phrase": "sneak peek", "set": 1},
    {"word": "sneer", "meaning": "【名】冷笑", "pos": "名", "example": "Cynical sneer.", "phrase": "wipe that sneer off", "set": 1},
    {"word": "sneeze", "meaning": "【動】くしゃみをする", "pos": "動", "example": "Sneeze deeply.", "phrase": "nothing to sneeze at", "set": 1},
    {"word": "sniff", "meaning": "【動】嗅ぐ", "pos": "動", "example": "Sniff the air.", "phrase": "sniff around", "set": 1},
    {"word": "snore", "meaning": "【名】いびき", "pos": "名", "example": "Loud snore.", "phrase": "hear a snore", "set": 1},
    {"word": "snore", "meaning": "【動】いびきをかく", "pos": "動", "example": "Snore loudly.", "phrase": "stop snoring", "set": 1},
    {"word": "snowball", "meaning": "【名】雪玉", "pos": "名", "example": "Throw a snowball.", "phrase": "snowball effect", "set": 1},
    {"word": "soak", "meaning": "【名】浸すこと", "pos": "名", "example": "Long soak.", "phrase": "give it a soak", "set": 1},
    {"word": "soak", "meaning": "【動】浸す", "pos": "動", "example": "Soak in water.", "phrase": "soak up", "set": 1},
    {"word": "soaked", "meaning": "【形】びしょ濡れの", "pos": "形", "example": "Soaked to the skin.", "phrase": "get soaked", "set": 1},
    {"word": "soaking", "meaning": "【形】びしょ濡れの", "pos": "形", "example": "Soaking wet.", "phrase": "soaking rain", "set": 1},
    {"word": "soar", "meaning": "【動】急上昇する", "pos": "動", "example": "Prices soar.", "phrase": "soar high", "set": 1},
    {"word": "sob", "meaning": "【動】すすり泣く", "pos": "動", "example": "Sob uncontrollably.", "phrase": "sob story", "set": 1},
    {"word": "so-called", "meaning": "【形】いわゆる", "pos": "形", "example": "So-called expert.", "phrase": "my so-called friend", "set": 1},
    {"word": "sociable", "meaning": "【形】社交的な", "pos": "形", "example": "Sociable person.", "phrase": "feeling sociable", "set": 1},
    {"word": "socialise", "meaning": "【動】交流する（英）", "pos": "動", "example": "Socialise with friends.", "phrase": "socialise at work", "set": 1},
    {"word": "socialize", "meaning": "【動】交流する", "pos": "動", "example": "Socialize at parties.", "phrase": "hard to socialize", "set": 1},
    {"word": "softness", "meaning": "【名】柔らかさ", "pos": "名", "example": "Softness of skin.", "phrase": "touch for softness", "set": 1},
    {"word": "soil", "meaning": "【名】土壌", "pos": "名", "example": "Fertile soil.", "phrase": "potting soil", "set": 1},
    {"word": "solar", "meaning": "【形】太陽の", "pos": "形", "example": "Solar energy.", "phrase": "solar system", "set": 1},
    {"word": "solidity", "meaning": "【名】堅固さ", "pos": "名", "example": "Solidity of rock.", "phrase": "test for solidity", "set": 1},
    {"word": "soliloquy", "meaning": "【名】独り言", "pos": "名", "example": "Hamlet's soliloquy.", "phrase": "deliver a soliloquy", "set": 1},
    {"word": "solo", "meaning": "【形】独奏の、単独の", "pos": "形", "example": "Solo flight.", "phrase": "solo career", "set": 1},
    {"word": "solo", "meaning": "【副】単独で", "pos": "副", "example": "Fly solo.", "phrase": "go solo", "set": 1},
    {"word": "solo", "meaning": "【名】ソロ", "pos": "名", "example": "Guitar solo.", "phrase": "piano solo", "set": 1},
    {"word": "solvent", "meaning": "【名】溶剤", "pos": "名", "example": "Cleaning solvent.", "phrase": "organic solvent", "set": 1},
    {"word": "somewhat", "meaning": "【副】幾分", "pos": "副", "example": "Somewhat different.", "phrase": "somewhat surprised", "set": 1},
    {"word": "son-in-law", "meaning": "【名】義理の息子", "pos": "名", "example": "My son-in-law.", "phrase": "meet son-in-law", "set": 1},
    {"word": "sonnet", "meaning": "【名】ソネット", "pos": "名", "example": "Shakespeare's sonnets.", "phrase": "write a sonnet", "set": 1},
    {"word": "sophisticated", "meaning": "【形】洗練された", "pos": "形", "example": "Sophisticated lady.", "phrase": "sophisticated technology", "set": 1},
    {"word": "sort", "meaning": "【動】分類する", "pos": "動", "example": "Sort the mail.", "phrase": "sort out", "set": 1},
    {"word": "sound", "meaning": "【形】健全な", "pos": "形", "example": "Sound advice.", "phrase": "safe and sound", "set": 1},
    {"word": "soundtrack", "meaning": "【名】サウンドトラック", "pos": "名", "example": "Movie soundtrack.", "phrase": "original soundtrack", "set": 1},
    {"word": "southward", "meaning": "【副】南へ", "pos": "副", "example": "Travel southward.", "phrase": "facing southward", "set": 1},
    {"word": "southwards", "meaning": "【副】南へ（英）", "pos": "副", "example": "Move southwards.", "phrase": "heading southwards", "set": 1},
    {"word": "Soviet", "meaning": "【名】ソビエト人（連邦）", "pos": "名", "example": "Former Soviet Union.", "phrase": "Soviet era", "set": 1},
    {"word": "soybean", "meaning": "【名】大豆", "pos": "名", "example": "Soybean paste.", "phrase": "soybean oil", "set": 1},
    {"word": "spa", "meaning": "【名】温泉、スパ", "pos": "名", "example": "Day spa.", "phrase": "spa treatment", "set": 1},
    {"word": "span", "meaning": "【動】架かる、及ぶ", "pos": "動", "example": "Bridge spans the river.", "phrase": "span centuries", "set": 1},
    {"word": "spare", "meaning": "【形】予備の", "pos": "形", "example": "Spare tire.", "phrase": "spare time", "set": 1},
    {"word": "spare", "meaning": "【動】割く、なしで済ます", "pos": "動", "example": "Spare a dime.", "phrase": "spare me the details", "set": 1},
    {"word": "sparerib", "meaning": "【名】スペアリブ", "pos": "名", "example": "BBQ spareribs.", "phrase": "pork spareribs", "set": 1},
    {"word": "spark", "meaning": "【名】火花", "pos": "名", "example": "Bright spark.", "phrase": "spark plug", "set": 1},
    {"word": "sparkling", "meaning": "【形】発泡性の、きらめく", "pos": "形", "example": "Sparkling water.", "phrase": "sparkling wine", "set": 1},
    {"word": "sparrow", "meaning": "【名】スズメ", "pos": "名", "example": "Little sparrow.", "phrase": "sparrow hawk", "set": 1},
    {"word": "specialty", "meaning": "【名】専門、名物", "pos": "名", "example": "House specialty.", "phrase": "medical specialty", "set": 1},
    {"word": "species", "meaning": "【名】種", "pos": "名", "example": "Endangered species.", "phrase": "new species", "set": 1},
    {"word": "specifically", "meaning": "【副】具体的に", "pos": "副", "example": "Specifically designed.", "phrase": "ask specifically", "set": 1},
    {"word": "specify", "meaning": "【動】明記する", "pos": "動", "example": "Specify the date.", "phrase": "unless specified", "set": 1},
    {"word": "spectacle", "meaning": "【名】壮観、見世物", "pos": "名", "example": "Grand spectacle.", "phrase": "make a spectacle", "set": 1},
    {"word": "speeder", "meaning": "【名】スピード違反者", "pos": "名", "example": "Catch a speeder.", "phrase": "reckless speeder", "set": 1},
    {"word": "spellbound", "meaning": "【形】魅了された", "pos": "形", "example": "Held spellbound.", "phrase": "spellbound audience", "set": 1},
    {"word": "spin", "meaning": "【動】回転する", "pos": "動", "example": "Spin around.", "phrase": "spin a web", "set": 1},
    {"word": "spite", "meaning": "【名】悪意", "pos": "名", "example": "In spite of.", "phrase": "out of spite", "set": 1},
    {"word": "splash", "meaning": "【名】水しぶき", "pos": "名", "example": "Big splash.", "phrase": "make a splash", "set": 1},
    {"word": "splatter", "meaning": "【名】跳ね返り", "pos": "名", "example": "Blood splatter.", "phrase": "splatter pattern", "set": 1},
    {"word": "split", "meaning": "【動】割る", "pos": "動", "example": "Split the bill.", "phrase": "split up", "set": 1},
    {"word": "spokesman", "meaning": "【名】スポークスマン", "pos": "名", "example": "Official spokesman.", "phrase": "police spokesman", "set": 1},
    {"word": "spokeswoman", "meaning": "【名】女性スポークスマン", "pos": "名", "example": "Company spokeswoman.", "phrase": "appointed spokeswoman", "set": 1},
    {"word": "sponsor", "meaning": "【動】後援する", "pos": "動", "example": "Sponsor an event.", "phrase": "proudly sponsor", "set": 1},
    {"word": "spot", "meaning": "【動】見つける", "pos": "動", "example": "Spot a mistake.", "phrase": "spot the difference", "set": 1},
    {"word": "spray", "meaning": "【名】しぶき、スプレー", "pos": "名", "example": "Hair spray.", "phrase": "sea spray", "set": 1},
    {"word": "spray", "meaning": "【動】吹きかける", "pos": "動", "example": "Spray paint.", "phrase": "spray water", "set": 1},
    {"word": "spread", "meaning": "【動】広げる", "pos": "動", "example": "Spread butter.", "phrase": "spread the news", "set": 1},
    {"word": "spreadsheet", "meaning": "【名】スプレッドシート", "pos": "名", "example": "Excel spreadsheet.", "phrase": "update spreadsheet", "set": 1},
    {"word": "sprint", "meaning": "【名】全力疾走", "pos": "名", "example": "100m sprint.", "phrase": "final sprint", "set": 1},
    {"word": "spur", "meaning": "【名】拍車", "pos": "名", "example": "Spur of the moment.", "phrase": "earn one's spurs", "set": 1},
    {"word": "squad", "meaning": "【名】班、分隊", "pos": "名", "example": "Rescue squad.", "phrase": "cheer squad", "set": 1},
    {"word": "squash", "meaning": "【名】スカッシュ、果汁", "pos": "名", "example": "Play squash.", "phrase": "lemon squash", "set": 1},
    {"word": "squash", "meaning": "【動】押しつぶす", "pos": "動", "example": "Squash a bug.", "phrase": "squash rumors", "set": 1},
    {"word": "squeeze", "meaning": "【動】絞る", "pos": "動", "example": "Squeeze a lemon.", "phrase": "squeeze in", "set": 1},
    {"word": "stab", "meaning": "【動】刺す", "pos": "動", "example": "Stab with a knife.", "phrase": "stab in the back", "set": 1},
    {"word": "stability", "meaning": "【名】安定", "pos": "名", "example": "Economic stability.", "phrase": "political stability", "set": 1},
    {"word": "stack", "meaning": "【名】積み重ね", "pos": "名", "example": "Stack of books.", "phrase": "chimney stack", "set": 1},
    {"word": "stagger", "meaning": "【名】よろめき (verb mostly)", "pos": "名", "example": "Walk with a stagger.", "phrase": "stagger work hours", "set": 1},
    {"word": "stain", "meaning": "【名】しみ", "pos": "名", "example": "Coffee stain.", "phrase": "remove a stain", "set": 1},
    {"word": "stain", "meaning": "【動】汚す", "pos": "動", "example": "Stain the cloth.", "phrase": "stained glass", "set": 1},
    {"word": "stake", "meaning": "【名】利害関係、杭", "pos": "名", "example": "At stake.", "phrase": "stake in the company", "set": 1},
    {"word": "stammer", "meaning": "【動】どもる", "pos": "動", "example": "Stammer nervously.", "phrase": "stammer out", "set": 1},
    {"word": "stamp", "meaning": "【動】踏み鳴らす、切手を貼る", "pos": "動", "example": "Stamp feet.", "phrase": "stamp out", "set": 1},
    {"word": "standard", "meaning": "【形】標準の", "pos": "形", "example": "Standard procedure.", "phrase": "standard time", "set": 1},
    {"word": "standby", "meaning": "【形】待機の", "pos": "形", "example": "Standby flight.", "phrase": "on standby", "set": 1},
    {"word": "standstill", "meaning": "【名】停止", "pos": "名", "example": "Come to a standstill.", "phrase": "traffic standstill", "set": 1},
    {"word": "stanza", "meaning": "【名】連（詩の）", "pos": "名", "example": "First stanza.", "phrase": "verse stanza", "set": 1},
    {"word": "startle", "meaning": "【動】驚かせる", "pos": "動", "example": "Startle someone.", "phrase": "be startled", "set": 1},
    {"word": "starvation", "meaning": "【名】飢餓", "pos": "名", "example": "Face starvation.", "phrase": "die of starvation", "set": 1},
    {"word": "starve", "meaning": "【動】飢える", "pos": "動", "example": "Starve to death.", "phrase": "starve for attention", "set": 1},
    {"word": "starving", "meaning": "【形】飢えている", "pos": "形", "example": "I'm starving.", "phrase": "starving children", "set": 1},
    {"word": "state", "meaning": "【形】国家の", "pos": "形", "example": "State visit.", "phrase": "state secret", "set": 1},
    {"word": "state", "meaning": "【動】述べる", "pos": "動", "example": "State your name.", "phrase": "clearly stated", "set": 1},
    {"word": "statesman", "meaning": "【名】政治家", "pos": "名", "example": "Elder statesman.", "phrase": "respected statesman", "set": 1},
    {"word": "statewide", "meaning": "【副】州全体で", "pos": "副", "example": "Broadcast statewide.", "phrase": "statewide election", "set": 1},
    {"word": "statistics", "meaning": "【名】統計", "pos": "名", "example": "Vital statistics.", "phrase": "official statistics", "set": 1},
    {"word": "steely", "meaning": "【形】鋼鉄のような", "pos": "形", "example": "Steely determination.", "phrase": "steely gaze", "set": 1},
    {"word": "steer", "meaning": "【動】操縦する", "pos": "動", "example": "Steer the car.", "phrase": "steer clear of", "set": 1},
    {"word": "steering wheel", "meaning": "【名】ハンドル", "pos": "名", "example": "Hold the steering wheel.", "phrase": "behind the steering wheel", "set": 1},
    {"word": "stepfather", "meaning": "【名】継父", "pos": "名", "example": "My stepfather.", "phrase": "wicked stepfather", "set": 1},
    {"word": "stepmother", "meaning": "【名】継母", "pos": "名", "example": "Cinderella's stepmother.", "phrase": "evil stepmother", "set": 1},
    {"word": "stereotype", "meaning": "【名】固定観念", "pos": "名", "example": "Gender stereotype.", "phrase": "stereotype threat", "set": 1},
    {"word": "stern", "meaning": "【形】厳格な", "pos": "形", "example": "Stern warning.", "phrase": "stern look", "set": 1},
    {"word": "stew", "meaning": "【名】シチュー", "pos": "名", "example": "Beef stew.", "phrase": "in a stew", "set": 1},
    {"word": "stick", "meaning": "【名】棒", "pos": "名", "example": "Walking stick.", "phrase": "stick shift", "set": 1},
    {"word": "stiff", "meaning": "【形】硬い", "pos": "形", "example": "Stiff neck.", "phrase": "scared stiff", "set": 1},
    {"word": "stimulant", "meaning": "【名】興奮剤", "pos": "名", "example": "Coffee is a stimulant.", "phrase": "mild stimulant", "set": 1},
    {"word": "stimulate", "meaning": "【動】刺激する", "pos": "動", "example": "Stimulate the economy.", "phrase": "stimulate growth", "set": 1},
    {"word": "stimulation", "meaning": "【名】刺激", "pos": "名", "example": "Mental stimulation.", "phrase": "sensory stimulation", "set": 1},
    {"word": "stingy", "meaning": "【形】けちな", "pos": "形", "example": "Stingy with money.", "phrase": "stingy person", "set": 1},
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
