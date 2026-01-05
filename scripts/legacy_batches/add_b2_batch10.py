
import json
import re
import os

# B2 Batch 10 (Words 1351-1500 approx)
# CSV Lines 1351 to 1500
new_words = [
    {"word": "kneel", "meaning": "【動】ひざまずく", "pos": "動", "example": "Kneel down.", "phrase": "kneel in prayer", "set": 1},
    {"word": "knot", "meaning": "【名】結び目", "pos": "名", "example": "Tie a knot.", "phrase": "tie the knot", "set": 1},
    {"word": "knowingly", "meaning": "【副】承知で、知り顔に", "pos": "副", "example": "Smiled knowingly.", "phrase": "knowingly false", "set": 1},
    {"word": "known", "meaning": "【形】知られている", "pos": "形", "example": "Well known.", "phrase": "known fact", "set": 1},
    {"word": "label", "meaning": "【名】ラベル", "pos": "名", "example": "Read the label.", "phrase": "designer label", "set": 1},
    {"word": "laborer", "meaning": "【名】労働者", "pos": "名", "example": "Farm laborer.", "phrase": "manual laborer", "set": 1},
    {"word": "labourer", "meaning": "【名】労働者（英）", "pos": "名", "example": "Unskilled labourer.", "phrase": "day labourer", "set": 1},
    {"word": "lack", "meaning": "【動】欠いている", "pos": "動", "example": "Lack confidence.", "phrase": "lack of interest", "set": 1},
    {"word": "lame", "meaning": "【形】足の不自由な、説得力のない", "pos": "形", "example": "Lame excuse.", "phrase": "go lame", "set": 1},
    {"word": "lance", "meaning": "【名】槍", "pos": "名", "example": "Knight's lance.", "phrase": "break a lance", "set": 1},
    {"word": "landing", "meaning": "【名】着陸、踊り場", "pos": "名", "example": "Emergency landing.", "phrase": "stair landing", "set": 1},
    {"word": "landlady", "meaning": "【名】女主人", "pos": "名", "example": "Pay the landlady.", "phrase": "strict landlady", "set": 1},
    {"word": "landslide", "meaning": "【名】地滑り、圧勝", "pos": "名", "example": "Landslide victory.", "phrase": "caused a landslide", "set": 1},
    {"word": "lap", "meaning": "【名】膝（座った時の）", "pos": "名", "example": "Sit on lap.", "phrase": "in the lap of luxury", "set": 1},
    {"word": "laptop", "meaning": "【名】ノートパソコン", "pos": "名", "example": "Laptop computer.", "phrase": "open laptop", "set": 1},
    {"word": "lark", "meaning": "【名】ヒバリ、おふざけ", "pos": "名", "example": "Up with the lark.", "phrase": "for a lark", "set": 1},
    {"word": "laser", "meaning": "【名】レーザー", "pos": "名", "example": "Laser beam.", "phrase": "laser surgery", "set": 1},
    {"word": "last minute", "meaning": "【名】土壇場", "pos": "名", "example": "Leave until last minute.", "phrase": "last minute change", "set": 1},
    {"word": "lastly", "meaning": "【副】最後に", "pos": "副", "example": "Lastly, I want to say.", "phrase": "and lastly", "set": 1},
    {"word": "last-minute", "meaning": "【形】土壇場の", "pos": "形", "example": "Last-minute deal.", "phrase": "last-minute decision", "set": 1},
    {"word": "later", "meaning": "【形】後の", "pos": "形", "example": "Later date.", "phrase": "see you later", "set": 1},
    {"word": "latter", "meaning": "【形】後者の", "pos": "形", "example": "The latter half.", "phrase": "former and latter", "set": 1},
    {"word": "laundry", "meaning": "【名】洗濯物", "pos": "名", "example": "Do the laundry.", "phrase": "dirty laundry", "set": 1},
    {"word": "lava", "meaning": "【名】溶岩", "pos": "名", "example": "Molten lava.", "phrase": "lava flow", "set": 1},
    {"word": "lawmaker", "meaning": "【名】立法者", "pos": "名", "example": "Lawmakers vote.", "phrase": "federal lawmaker", "set": 1},
    {"word": "lawn", "meaning": "【名】芝生", "pos": "名", "example": "Mow the lawn.", "phrase": "lawn mower", "set": 1},
    {"word": "lawsuit", "meaning": "【名】訴訟", "pos": "名", "example": "File a lawsuit.", "phrase": "civil lawsuit", "set": 1},
    {"word": "layabout", "meaning": "【名】怠け者", "pos": "名", "example": "Good-for-nothing layabout.", "phrase": "lazy layabout", "set": 1},
    {"word": "leaflet", "meaning": "【名】チラシ", "pos": "名", "example": "Distribute leaflets.", "phrase": "information leaflet", "set": 1},
    {"word": "leak", "meaning": "【名】漏れ", "pos": "名", "example": "Gas leak.", "phrase": "spring a leak", "set": 1},
    {"word": "leak", "meaning": "【動】漏れる", "pos": "動", "example": "Roof is leaking.", "phrase": "leak information", "set": 1},
    {"word": "lean", "meaning": "【動】傾く、寄りかかる", "pos": "動", "example": "Lean against the wall.", "phrase": "lean on", "set": 1},
    {"word": "leap", "meaning": "【名】跳躍", "pos": "名", "example": "Giant leap.", "phrase": "leap year", "set": 1},
    {"word": "learning", "meaning": "【名】学習、知識", "pos": "名", "example": "Lifelong learning.", "phrase": "learning curve", "set": 1},
    {"word": "lease", "meaning": "【名】賃貸借契約", "pos": "名", "example": "Sign a lease.", "phrase": "lease agreement", "set": 1},
    {"word": "leash", "meaning": "【名】リード（犬の）", "pos": "名", "example": "Keep dog on leash.", "phrase": "short leash", "set": 1},
    {"word": "least", "meaning": "【代】最小", "pos": "代", "example": "At least.", "phrase": "least of all", "set": 1},
    {"word": "lecturer", "meaning": "【名】講師", "pos": "名", "example": "University lecturer.", "phrase": "guest lecturer", "set": 1},
    {"word": "leek", "meaning": "【名】西洋ネギ", "pos": "名", "example": "Leek soup.", "phrase": "chopped leek", "set": 1},
    {"word": "legend", "meaning": "【名】伝説", "pos": "名", "example": "Urban legend.", "phrase": "living legend", "set": 1},
    {"word": "legendary", "meaning": "【形】伝説的な", "pos": "形", "example": "Legendary hero.", "phrase": "legendary status", "set": 1},
    {"word": "legislate", "meaning": "【動】法律を制定する", "pos": "動", "example": "Legislate against.", "phrase": "power to legislate", "set": 1},
    {"word": "legislation", "meaning": "【名】立法、法律", "pos": "名", "example": "Pass legislation.", "phrase": "new legislation", "set": 1},
    {"word": "legislative", "meaning": "【形】立法の", "pos": "形", "example": "Legislative body.", "phrase": "legislative power", "set": 1},
    {"word": "legislator", "meaning": "【名】議員", "pos": "名", "example": "State legislator.", "phrase": "legislator vote", "set": 1},
    {"word": "legislature", "meaning": "【名】議会", "pos": "名", "example": "State legislature.", "phrase": "member of legislature", "set": 1},
    {"word": "legitimate", "meaning": "【形】正当な", "pos": "形", "example": "Legitimate reason.", "phrase": "legitimate child", "set": 1},
    {"word": "leisurely", "meaning": "【副】のんびりと", "pos": "副", "example": "Walk leisurely.", "phrase": "leisurely pace", "set": 1},
    {"word": "lengthen", "meaning": "【動】長くする", "pos": "動", "example": "Lengthen the dress.", "phrase": "days lengthen", "set": 1},
    {"word": "lengthy", "meaning": "【形】長ったらしい", "pos": "形", "example": "Lengthy process.", "phrase": "lengthy discussion", "set": 1},
    {"word": "leopard", "meaning": "【名】ヒョウ", "pos": "名", "example": "Spotted leopard.", "phrase": "leopard print", "set": 1},
    {"word": "lest", "meaning": "【接】～しないように", "pos": "接", "example": "Lest we forget.", "phrase": "fear lest", "set": 1},
    {"word": "level", "meaning": "【動】水平にする、破壊する", "pos": "動", "example": "Level the ground.", "phrase": "level with me", "set": 1},
    {"word": "liberal", "meaning": "【形】自由主義の、寛大な", "pos": "形", "example": "Liberal arts.", "phrase": "liberal views", "set": 1},
    {"word": "lick", "meaning": "【動】なめる", "pos": "動", "example": "Lick ice cream.", "phrase": "lick lips", "set": 1},
    {"word": "lid", "meaning": "【名】蓋", "pos": "名", "example": "Close the lid.", "phrase": "put a lid on it", "set": 1},
    {"word": "lifeless", "meaning": "【形】活気のない、死んだような", "pos": "形", "example": "Lifeless body.", "phrase": "lifeless eyes", "set": 1},
    {"word": "lifetime", "meaning": "【名】生涯", "pos": "名", "example": "Lifetime achievement.", "phrase": "once in a lifetime", "set": 1},
    {"word": "lighten", "meaning": "【動】明るくする、軽くする", "pos": "動", "example": "Lighten the load.", "phrase": "sky lightened", "set": 1},
    {"word": "lighting", "meaning": "【名】照明", "pos": "名", "example": "Stage lighting.", "phrase": "lighting effects", "set": 1},
    {"word": "likewise", "meaning": "【副】同様に", "pos": "副", "example": "Do likewise.", "phrase": "nice to meet you, likewise", "set": 1},
    {"word": "limb", "meaning": "【名】手足", "pos": "名", "example": "Artificial limb.", "phrase": "out on a limb", "set": 1},
    {"word": "line", "meaning": "【動】並ぶ、裏地をつける", "pos": "動", "example": "Line up.", "phrase": "lined with trees", "set": 1},
    {"word": "linen", "meaning": "【名】亜麻布、リネン", "pos": "名", "example": "Linen suit.", "phrase": "bed linen", "set": 1},
    {"word": "liner", "meaning": "【名】定期船", "pos": "名", "example": "Ocean liner.", "phrase": "eye liner", "set": 1},
    {"word": "ling", "meaning": "【名】リング（魚）", "pos": "名", "example": "Type of fish.", "phrase": "catch a ling", "set": 1},
    {"word": "linger", "meaning": "【動】ぐずぐずする、長引く", "pos": "動", "example": "Linger over coffee.", "phrase": "linger on", "set": 1},
    {"word": "list", "meaning": "【動】リストに載せる", "pos": "動", "example": "List names.", "phrase": "listed building", "set": 1},
    {"word": "listener", "meaning": "【名】聞き手", "pos": "名", "example": "Good listener.", "phrase": "radio listener", "set": 1},
    {"word": "literal", "meaning": "【形】文字通りの", "pos": "形", "example": "Literal translation.", "phrase": "literal meaning", "set": 1},
    {"word": "literally", "meaning": "【副】文字通りに", "pos": "副", "example": "Literally true.", "phrase": "taken literally", "set": 1},
    {"word": "litter", "meaning": "【名】ごみ、一腹の子", "pos": "名", "example": "Pick up litter.", "phrase": "litter of puppies", "set": 1},
    {"word": "living", "meaning": "【名】生計、生活", "pos": "名", "example": "Make a living.", "phrase": "standard of living", "set": 1},
    {"word": "load", "meaning": "【動】積む", "pos": "動", "example": "Load the truck.", "phrase": "load up", "set": 1},
    {"word": "loan", "meaning": "【名】ローン、貸付", "pos": "名", "example": "Student loan.", "phrase": "bank loan", "set": 1},
    {"word": "lobby", "meaning": "【名】ロビー", "pos": "名", "example": "Hotel lobby.", "phrase": "lobby group", "set": 1},
    {"word": "loneliness", "meaning": "【名】孤独", "pos": "名", "example": "Suffering from loneliness.", "phrase": "feeling of loneliness", "set": 1},
    {"word": "long-distance", "meaning": "【形】長距離の", "pos": "形", "example": "Long-distance runner.", "phrase": "long-distance call", "set": 1},
    {"word": "long-term", "meaning": "【形】長期の", "pos": "形", "example": "Long-term goal.", "phrase": "long-term memory", "set": 1},
    {"word": "loosely", "meaning": "【副】緩く", "pos": "副", "example": "Loosely based on.", "phrase": "hang loosely", "set": 1},
    {"word": "lousy", "meaning": "【形】ひどい", "pos": "形", "example": "Lousy weather.", "phrase": "feel lousy", "set": 1},
    {"word": "lower", "meaning": "【動】下げる", "pos": "動", "example": "Lower the price.", "phrase": "lower your voice", "set": 1},
    {"word": "lowland", "meaning": "【名】低地", "pos": "名", "example": "Lowland area.", "phrase": "Scottish Lowlands", "set": 1},
    {"word": "lucrative", "meaning": "【形】儲かる", "pos": "形", "example": "Lucrative business.", "phrase": "lucrative contract", "set": 1},
    {"word": "lush", "meaning": "【形】青々と茂った", "pos": "形", "example": "Lush vegetation.", "phrase": "lush green", "set": 1},
    {"word": "luxurious", "meaning": "【形】豪華な", "pos": "形", "example": "Luxurious hotel.", "phrase": "luxurious lifestyle", "set": 1},
    {"word": "luxury", "meaning": "【形】高級な", "pos": "形", "example": "Luxury car.", "phrase": "luxury goods", "set": 1},
    {"word": "lyrics", "meaning": "【名】歌詞", "pos": "名", "example": "Song lyrics.", "phrase": "write lyrics", "set": 1},
    {"word": "madam", "meaning": "【名】奥様", "pos": "名", "example": "Dear Madam.", "phrase": "Yes, madam", "set": 1},
    {"word": "madame", "meaning": "【名】夫人（フランス語圏）", "pos": "名", "example": "Madame Tussauds.", "phrase": "call her Madame", "set": 1},
    {"word": "madness", "meaning": "【名】狂気", "pos": "名", "example": "Sheer madness.", "phrase": "descent into madness", "set": 1},
    {"word": "maestro", "meaning": "【名】マエストロ、巨匠", "pos": "名", "example": "The great maestro.", "phrase": "maestro conductor", "set": 1},
    {"word": "magnify", "meaning": "【動】拡大する", "pos": "動", "example": "Magnify the image.", "phrase": "magnify problems", "set": 1},
    {"word": "major", "meaning": "【名】専攻、少佐", "pos": "名", "example": "Biology major.", "phrase": "army major", "set": 1},
    {"word": "make", "meaning": "【名】型、銘柄", "pos": "名", "example": "Make of car.", "phrase": "what make is it", "set": 1},
    {"word": "malady", "meaning": "【名】病気", "pos": "名", "example": "Strange malady.", "phrase": "cure a malady", "set": 1},
    {"word": "malaria", "meaning": "【名】マラリア", "pos": "名", "example": "Catch malaria.", "phrase": "malaria vaccine", "set": 1},
    {"word": "mama", "meaning": "【名】ママ", "pos": "名", "example": "Hi mama.", "phrase": "mama bear", "set": 1},
    {"word": "mamma", "meaning": "【名】ママ（つづり違い）", "pos": "名", "example": "Mamma mia.", "phrase": "call mamma", "set": 1},
    {"word": "mango", "meaning": "【名】マンゴー", "pos": "名", "example": "Ripe mango.", "phrase": "mango juice", "set": 1},
    {"word": "manipulate", "meaning": "【動】操る", "pos": "動", "example": "Manipulate data.", "phrase": "manipulate people", "set": 1},
    {"word": "mansion", "meaning": "【名】大邸宅", "pos": "名", "example": "Huge mansion.", "phrase": "live in a mansion", "set": 1},
    {"word": "manual", "meaning": "【形】手動の、肉体の", "pos": "形", "example": "Manual labor.", "phrase": "manual transmission", "set": 1},
    {"word": "manual", "meaning": "【名】説明書", "pos": "名", "example": "Instruction manual.", "phrase": "read the manual", "set": 1},
    {"word": "manufacture", "meaning": "【名】製造", "pos": "名", "example": "Car manufacture.", "phrase": "of foreign manufacture", "set": 1},
    {"word": "manufacture", "meaning": "【動】製造する", "pos": "動", "example": "Manufacture cars.", "phrase": "mass manufacture", "set": 1},
    {"word": "manufacturer", "meaning": "【名】製造業者", "pos": "名", "example": "Leading manufacturer.", "phrase": "manufacturer's warranty", "set": 1},
    {"word": "manufacturing", "meaning": "【名】製造業", "pos": "名", "example": "Manufacturing jobs.", "phrase": "manufacturing plant", "set": 1},
    {"word": "marathon", "meaning": "【名】マラソン", "pos": "名", "example": "Run a marathon.", "phrase": "marathon meeting", "set": 1},
    {"word": "margin", "meaning": "【名】余白、差", "pos": "名", "example": "Narrow margin.", "phrase": "margin of error", "set": 1},
    {"word": "marketing", "meaning": "【名】マーケティング", "pos": "名", "example": "Marketing strategy.", "phrase": "marketing department", "set": 1},
    {"word": "martial art", "meaning": "【名】武道", "pos": "名", "example": "Practice martial arts.", "phrase": "black belt in martial arts", "set": 1},
    {"word": "mask", "meaning": "【名】マスク", "pos": "名", "example": "Wear a mask.", "phrase": "surgical mask", "set": 1},
    {"word": "mass", "meaning": "【名】塊、大衆", "pos": "名", "example": "Mass of people.", "phrase": "mass media", "set": 1},
    {"word": "massacre", "meaning": "【名】大虐殺", "pos": "名", "example": "Bloody massacre.", "phrase": "massacre of innocents", "set": 1},
    {"word": "massage", "meaning": "【名】マッサージ", "pos": "名", "example": "Full body massage.", "phrase": "facial massage", "set": 1},
    {"word": "masseur", "meaning": "【名】マッサージ師", "pos": "名", "example": "Professional masseur.", "phrase": "visit a masseur", "set": 1},
    {"word": "master", "meaning": "【名】主人、名人", "pos": "名", "example": "Master of ceremonies.", "phrase": "master key", "set": 1},
    {"word": "masterpiece", "meaning": "【名】傑作", "pos": "名", "example": "Artistic masterpiece.", "phrase": "literary masterpiece", "set": 1},
    {"word": "mastery", "meaning": "【名】熟達、支配", "pos": "名", "example": "Mastery of English.", "phrase": "achieve mastery", "set": 1},
    {"word": "mate", "meaning": "【名】仲間、連れ合い", "pos": "名", "example": "Room mate.", "phrase": "soul mate", "set": 1},
    {"word": "mathematical", "meaning": "【形】数学の", "pos": "形", "example": "Mathematical problem.", "phrase": "mathematical genius", "set": 1},
    {"word": "mature", "meaning": "【形】成熟した", "pos": "形", "example": "Mature attitude.", "phrase": "mature for age", "set": 1},
    {"word": "mausoleum", "meaning": "【名】霊廟", "pos": "名", "example": "Grand mausoleum.", "phrase": "family mausoleum", "set": 1},
    {"word": "mean", "meaning": "【名】平均", "pos": "名", "example": "Arithmetic mean.", "phrase": "above the mean", "set": 1},
    {"word": "means", "meaning": "【名】手段、財力", "pos": "名", "example": "By all means.", "phrase": "means of transport", "set": 1},
    {"word": "mechanise", "meaning": "【動】機械化する（英）", "pos": "動", "example": "Mechanise production.", "phrase": "fully mechanised", "set": 1},
    {"word": "mechanize", "meaning": "【動】機械化する", "pos": "動", "example": "Mechanize farming.", "phrase": "mechanized infantry", "set": 1},
    {"word": "media", "meaning": "【名】メディア", "pos": "名", "example": "Social media.", "phrase": "media coverage", "set": 1},
    {"word": "mediaeval", "meaning": "【形】中世の（英）", "pos": "形", "example": "Mediaeval castle.", "phrase": "mediaeval history", "set": 1},
    {"word": "medication", "meaning": "【名】薬物治療、薬", "pos": "名", "example": "Take medication.", "phrase": "on medication", "set": 1},
    {"word": "medieval", "meaning": "【形】中世の", "pos": "形", "example": "Medieval knight.", "phrase": "medieval times", "set": 1},
    {"word": "mediocre", "meaning": "【形】平凡な", "pos": "形", "example": "Mediocre performance.", "phrase": "mediocre results", "set": 1},
    {"word": "melody", "meaning": "【名】旋律", "pos": "名", "example": "Beautiful melody.", "phrase": "haunting melody", "set": 1},
    {"word": "memorial", "meaning": "【名】記念碑", "pos": "名", "example": "War memorial.", "phrase": "memorial service", "set": 1},
    {"word": "mentor", "meaning": "【名】助言者", "pos": "名", "example": "Find a mentor.", "phrase": "trusted mentor", "set": 1},
    {"word": "merchandise", "meaning": "【名】商品", "pos": "名", "example": "Display merchandise.", "phrase": "branded merchandise", "set": 1},
    {"word": "mercy", "meaning": "【名】慈悲", "pos": "名", "example": "Beg for mercy.", "phrase": "at the mercy of", "set": 1},
    {"word": "merge", "meaning": "【動】合併する", "pos": "動", "example": "Merge two companies.", "phrase": "merge lanes", "set": 1},
    {"word": "merger", "meaning": "【名】合併", "pos": "名", "example": "Corporate merger.", "phrase": "merger agreement", "set": 1},
    {"word": "mess", "meaning": "【動】台無しにする", "pos": "動", "example": "Mess up.", "phrase": "mess with", "set": 1},
    {"word": "messenger", "meaning": "【名】使者", "pos": "名", "example": "Send a messenger.", "phrase": "instant messenger", "set": 1},
    {"word": "metaphor", "meaning": "【名】隠喩", "pos": "名", "example": "Use a metaphor.", "phrase": "mixed metaphor", "set": 1},
    {"word": "metric", "meaning": "【形】メートル法の", "pos": "形", "example": "Metric system.", "phrase": "metric ton", "set": 1},
    {"word": "micro", "meaning": "【名】マイクロ", "pos": "名", "example": "Micro economics.", "phrase": "micro level", "set": 1},
    {"word": "microbe", "meaning": "【名】微生物", "pos": "名", "example": "Deadly microbe.", "phrase": "soil microbes", "set": 1},
    {"word": "microcomputer", "meaning": "【名】マイクロコンピュータ", "pos": "名", "example": "Use a microcomputer.", "phrase": "early microcomputer", "set": 1},
    {"word": "micrometer", "meaning": "【名】マイクロメートル", "pos": "名", "example": "Measure in micrometers.", "phrase": "micrometer screw", "set": 1},
    {"word": "micrometre", "meaning": "【名】マイクロメートル（英）", "pos": "名", "example": "One micrometre.", "phrase": "micrometre precision", "set": 1},
    {"word": "microorganism", "meaning": "【名】微生物", "pos": "名", "example": "Study microorganisms.", "phrase": "harmful microorganism", "set": 1},
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
