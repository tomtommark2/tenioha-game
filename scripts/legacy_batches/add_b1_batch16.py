
import json
import re
import os

# B1 Batch 16 (Words 2051-2200, "snowboard" to "talented")
new_words = [
    {"word": "snowboard", "meaning": "【名】スノーボード", "pos": "名", "example": "Ride a snowboard.", "phrase": "go snowboarding", "set": 1},
    {"word": "snowstorm", "meaning": "【名】吹雪", "pos": "名", "example": "Caught in a snowstorm.", "phrase": "heavy snowstorm", "set": 1},
    {"word": "soap opera", "meaning": "【名】連続ドラマ", "pos": "名", "example": "Watch a soap opera.", "phrase": "popular soap opera", "set": 1},
    {"word": "social networking", "meaning": "【名】ソーシャルネットワーキング", "pos": "名", "example": "Use social networking sites.", "phrase": "social networking addiction", "set": 1},
    {"word": "socially", "meaning": "【副】社会的に、社交的に", "pos": "副", "example": "Socially active.", "phrase": "socially acceptable", "set": 1},
    {"word": "soil", "meaning": "【動】汚す", "pos": "動", "example": "Soil the clothes.", "phrase": "soil one's reputation", "set": 1},
    {"word": "solid", "meaning": "【形】固体の、しっかりした", "pos": "形", "example": "Solid rock.", "phrase": "solid fuel", "set": 1},
    {"word": "somehow", "meaning": "【副】どうにかして", "pos": "副", "example": "Manage somehow.", "phrase": "somehow or other", "set": 1},
    {"word": "someplace", "meaning": "【副】どこかで（米）", "pos": "副", "example": "Let's go someplace.", "phrase": "somewhere else", "set": 1},
    {"word": "sometime", "meaning": "【副】いつか", "pos": "副", "example": "See you sometime.", "phrase": "sometime soon", "set": 1},
    {"word": "sometimes", "meaning": "【副】時々", "pos": "副", "example": "Sometimes I walk.", "phrase": "sometimes ... sometimes", "set": 1},
    {"word": "soothe", "meaning": "【動】なだめる、和らげる", "pos": "動", "example": "Soothe a crying baby.", "phrase": "soothe pain", "set": 1},
    {"word": "sophomore", "meaning": "【名】２年生（米）", "pos": "名", "example": "College sophomore.", "phrase": "sophomore year", "set": 1},
    {"word": "sore", "meaning": "【形】痛い", "pos": "形", "example": "Sore throat.", "phrase": "sore muscle", "set": 1},
    {"word": "sorrow", "meaning": "【名】悲しみ", "pos": "名", "example": "Deep sorrow.", "phrase": "express sorrow", "set": 1},
    {"word": "sort", "meaning": "【名】種類", "pos": "名", "example": "What sort of music?", "phrase": "sort of", "set": 1},
    {"word": "soul", "meaning": "【名】魂", "pos": "名", "example": "Body and soul.", "phrase": "soul music", "set": 1},
    {"word": "sour", "meaning": "【形】酸っぱい", "pos": "形", "example": "Sour grapes.", "phrase": "go sour", "set": 1},
    {"word": "southeast", "meaning": "【形】南東の", "pos": "形", "example": "Southeast Asia.", "phrase": "southeast wind", "set": 1},
    {"word": "southeast", "meaning": "【名】南東", "pos": "名", "example": "Face southeast.", "phrase": "in the southeast", "set": 1},
    {"word": "southern", "meaning": "【形】南の", "pos": "形", "example": "Southern hemisphere.", "phrase": "southern comfort", "set": 1},
    {"word": "southwest", "meaning": "【形】南西の", "pos": "形", "example": "Southwest corner.", "phrase": "southwest wind", "set": 1},
    {"word": "southwest", "meaning": "【名】南西", "pos": "名", "example": "Live in the southwest.", "phrase": "heading southwest", "set": 1},
    {"word": "souvenir", "meaning": "【名】お土産", "pos": "名", "example": "Buy a souvenir.", "phrase": "souvenir shop", "set": 1},
    {"word": "sparkle", "meaning": "【名】きらめき", "pos": "名", "example": "Sparkle in eyes.", "phrase": "sparkle water", "set": 1},
    {"word": "specialise", "meaning": "【動】専門にする", "pos": "動", "example": "Specialise in law.", "phrase": "specialise in", "set": 1},
    {"word": "specialist", "meaning": "【名】専門家", "pos": "名", "example": "See a specialist.", "phrase": "IT specialist", "set": 1},
    {"word": "specialize", "meaning": "【動】専門にする（米）", "pos": "動", "example": "Specialize in physics.", "phrase": "specialize in", "set": 1},
    {"word": "specially", "meaning": "【副】特別に", "pos": "副", "example": "Specially made.", "phrase": "specially for you", "set": 1},
    {"word": "spectacular", "meaning": "【形】壮観な", "pos": "形", "example": "Spectacular view.", "phrase": "spectacular failure", "set": 1},
    {"word": "spectator", "meaning": "【名】観客", "pos": "名", "example": "Sports spectator.", "phrase": "spectator sport", "set": 1},
    {"word": "speed", "meaning": "【動】急ぐ、スピードを出す", "pos": "動", "example": "Speed up.", "phrase": "speed limit", "set": 1},
    {"word": "spelling", "meaning": "【名】つづり", "pos": "名", "example": "Correct spelling.", "phrase": "spelling mistake", "set": 1},
    {"word": "sphere", "meaning": "【名】球、範囲", "pos": "名", "example": "Perfect sphere.", "phrase": "sphere of influence", "set": 1},
    {"word": "spice", "meaning": "【名】香辛料", "pos": "名", "example": "Add spice.", "phrase": "spice of life", "set": 1},
    {"word": "spicy", "meaning": "【形】辛い", "pos": "形", "example": "Spicy food.", "phrase": "hot and spicy", "set": 1},
    {"word": "spider", "meaning": "【名】クモ", "pos": "名", "example": "Spider web.", "phrase": "spider man", "set": 1},
    {"word": "spinach", "meaning": "【名】ほうれん草", "pos": "名", "example": "Fresh spinach.", "phrase": "spinach salad", "set": 1},
    {"word": "spiral", "meaning": "【形】らせん状の", "pos": "形", "example": "Spiral staircase.", "phrase": "spiral notebook", "set": 1},
    {"word": "spirit", "meaning": "【名】精神、魂", "pos": "名", "example": "Team spirit.", "phrase": "in high spirits", "set": 1},
    {"word": "spiritual", "meaning": "【形】精神的な", "pos": "形", "example": "Spiritual growth.", "phrase": "spiritual leader", "set": 1},
    {"word": "split", "meaning": "【名】裂け目、分割", "pos": "名", "example": "Split in the wood.", "phrase": "banana split", "set": 1},
    {"word": "spoil", "meaning": "【動】台無しにする、甘やかす", "pos": "動", "example": "Spoil the party.", "phrase": "spoiled child", "set": 1},
    {"word": "sponge", "meaning": "【名】スポンジ", "pos": "名", "example": "Clean with a sponge.", "phrase": "sponge cake", "set": 1},
    {"word": "sponsor", "meaning": "【名】スポンサー", "pos": "名", "example": "Official sponsor.", "phrase": "find a sponsor", "set": 1},
    {"word": "sports", "meaning": "【形】スポーツの", "pos": "形", "example": "Sports car.", "phrase": "sports center", "set": 1},
    {"word": "sportsmanship", "meaning": "【名】スポーツマンシップ", "pos": "名", "example": "Show sportsmanship.", "phrase": "good sportsmanship", "set": 1},
    {"word": "stable", "meaning": "【形】安定した", "pos": "形", "example": "Stable condition.", "phrase": "stable job", "set": 1},
    {"word": "stall", "meaning": "【名】露店", "pos": "名", "example": "Market stall.", "phrase": "food stall", "set": 1},
    {"word": "standard", "meaning": "【名】基準", "pos": "名", "example": "High standard.", "phrase": "standard of living", "set": 1},
    {"word": "star", "meaning": "【動】主演させる", "pos": "動", "example": "Star in a movie.", "phrase": "starring role", "set": 1},
    {"word": "stare", "meaning": "【動】じっと見る", "pos": "動", "example": "Stare at the screen.", "phrase": "stare blankly", "set": 1},
    {"word": "status", "meaning": "【名】地位、状態", "pos": "名", "example": "Social status.", "phrase": "status symbol", "set": 1},
    {"word": "stay", "meaning": "【名】滞在", "pos": "名", "example": "Short stay.", "phrase": "enjoy your stay", "set": 1},
    {"word": "steadily", "meaning": "【副】着実に", "pos": "副", "example": "Improve steadily.", "phrase": "steadily increasing", "set": 1},
    {"word": "steady", "meaning": "【形】安定した", "pos": "形", "example": "Steady job.", "phrase": "steady pace", "set": 1},
    {"word": "steam", "meaning": "【名】蒸気", "pos": "名", "example": "Let off steam.", "phrase": "steam engine", "set": 1},
    {"word": "steel", "meaning": "【名】鋼鉄", "pos": "名", "example": "Stainless steel.", "phrase": "nerves of steel", "set": 1},
    {"word": "steep", "meaning": "【形】険しい", "pos": "形", "example": "Steep hill.", "phrase": "steep price", "set": 1},
    {"word": "stem", "meaning": "【動】生じる、食い止める", "pos": "動", "example": "Stem from.", "phrase": "stem the flow", "set": 1},
    {"word": "stick", "meaning": "【動】くっつく、突き刺す", "pos": "動", "example": "Stick to the plan.", "phrase": "stick out", "set": 1},
    {"word": "sticker", "meaning": "【名】ステッカー", "pos": "名", "example": "Bumper sticker.", "phrase": "sticker price", "set": 1},
    {"word": "sticky", "meaning": "【形】べたつく", "pos": "形", "example": "Sticky rice.", "phrase": "sticky situation", "set": 1},
    {"word": "stir", "meaning": "【動】かき混ぜる", "pos": "動", "example": "Stir the soup.", "phrase": "stir fry", "set": 1},
    {"word": "storage", "meaning": "【名】貯蔵", "pos": "名", "example": "Cold storage.", "phrase": "storage space", "set": 1},
    {"word": "stormy", "meaning": "【形】嵐の", "pos": "形", "example": "Stormy weather.", "phrase": "stormy relationship", "set": 1},
    {"word": "storyteller", "meaning": "【名】語り手", "pos": "名", "example": "Good storyteller.", "phrase": "storyteller's art", "set": 1},
    {"word": "strain", "meaning": "【名】緊張、負担", "pos": "名", "example": "Under strain.", "phrase": "mental strain", "set": 1},
    {"word": "strangely", "meaning": "【副】奇妙に", "pos": "副", "example": "Behave strangely.", "phrase": "strangely enough", "set": 1},
    {"word": "strategic", "meaning": "【形】戦略的な", "pos": "形", "example": "Strategic plan.", "phrase": "strategic location", "set": 1},
    {"word": "straw", "meaning": "【名】わら、ストロー", "pos": "名", "example": "Drinking straw.", "phrase": "last straw", "set": 1},
    {"word": "strawberry", "meaning": "【名】イチゴ", "pos": "名", "example": "Strawberry jam.", "phrase": "wild strawberry", "set": 1},
    {"word": "stream", "meaning": "【名】小川、流れ", "pos": "名", "example": "Mountain stream.", "phrase": "stream of consciousness", "set": 1},
    {"word": "stream", "meaning": "【動】流れる", "pos": "動", "example": "Tears streamed down.", "phrase": "stream video", "set": 1},
    {"word": "strengthen", "meaning": "【動】強化する", "pos": "動", "example": "Strengthen muscles.", "phrase": "strengthen ties", "set": 1},
    {"word": "stress", "meaning": "【名】ストレス、強調", "pos": "名", "example": "Under stress.", "phrase": "relieve stress", "set": 1},
    {"word": "stressed", "meaning": "【形】ストレスを感じている", "pos": "形", "example": "Feel stressed.", "phrase": "stressed out", "set": 1},
    {"word": "stressful", "meaning": "【形】ストレスの多い", "pos": "形", "example": "Stressful job.", "phrase": "stressful situation", "set": 1},
    {"word": "stretch", "meaning": "【動】伸ばす", "pos": "動", "example": "Stretch your legs.", "phrase": "stretch out", "set": 1},
    {"word": "stricken", "meaning": "【形】打ちひしがれた", "pos": "形", "example": "Panic-stricken.", "phrase": "grief-stricken", "set": 1},
    {"word": "strike", "meaning": "【動】打つ、ストライキをする", "pos": "動", "example": "Strike a match.", "phrase": "go on strike", "set": 1},
    {"word": "strip", "meaning": "【名】細長いきれ", "pos": "名", "example": "Strip of paper.", "phrase": "comic strip", "set": 1},
    {"word": "stripe", "meaning": "【名】縞模様", "pos": "名", "example": "Tiger stripes.", "phrase": "stars and stripes", "set": 1},
    {"word": "struggle", "meaning": "【名】闘争、努力", "pos": "名", "example": "Power struggle.", "phrase": "struggle for survival", "set": 1},
    {"word": "stubborn", "meaning": "【形】頑固な", "pos": "形", "example": "Stubborn old man.", "phrase": "stubborn stain", "set": 1},
    {"word": "stuck", "meaning": "【形】行き詰まった", "pos": "形", "example": "Get stuck.", "phrase": "stuck in traffic", "set": 1},
    {"word": "studio", "meaning": "【名】スタジオ", "pos": "名", "example": "Recording studio.", "phrase": "art studio", "set": 1},
    {"word": "stuffed", "meaning": "【形】詰まった、満腹の", "pos": "形", "example": "Stuffed toy.", "phrase": "stuffed nose", "set": 1},
    {"word": "stumble", "meaning": "【動】つまずく", "pos": "動", "example": "Stumble on a stone.", "phrase": "stumble upon", "set": 1},
    {"word": "stun", "meaning": "【動】気絶させる、呆然とさせる", "pos": "動", "example": "Stun the audience.", "phrase": "stun gun", "set": 1},
    {"word": "stunning", "meaning": "【形】素晴らしい", "pos": "形", "example": "Stunning beauty.", "phrase": "stunning view", "set": 1},
    {"word": "stupid", "meaning": "【形】愚かな", "pos": "形", "example": "Stupid mistake.", "phrase": "don't be stupid", "set": 1},
    {"word": "stylish", "meaning": "【形】おしゃれな", "pos": "形", "example": "Stylish clothes.", "phrase": "look stylish", "set": 1},
    {"word": "subconscious", "meaning": "【形】潜在意識の", "pos": "形", "example": "Subconscious mind.", "phrase": "subconscious desire", "set": 1},
    {"word": "submarine", "meaning": "【名】潜水艦", "pos": "名", "example": "Nuclear submarine.", "phrase": "yellow submarine", "set": 1},
    {"word": "substantial", "meaning": "【形】かなりの、実質的な", "pos": "形", "example": "Substantial amount.", "phrase": "substantial meal", "set": 1},
    {"word": "substitute", "meaning": "【名】代用品", "pos": "名", "example": "Sugar substitute.", "phrase": "no substitute for", "set": 1},
    {"word": "suddenly", "meaning": "【副】突然", "pos": "副", "example": "Stop suddenly.", "phrase": "and then suddenly", "set": 1},
    {"word": "suffer", "meaning": "【動】苦しむ", "pos": "動", "example": "Suffer from pain.", "phrase": "suffer a loss", "set": 1},
    {"word": "sufficient", "meaning": "【形】十分な", "pos": "形", "example": "Sufficient time.", "phrase": "self-sufficient", "set": 1},
    {"word": "suffix", "meaning": "【名】接尾辞", "pos": "名", "example": "Add a suffix.", "phrase": "common suffix", "set": 1},
    {"word": "suicide", "meaning": "【名】自殺", "pos": "名", "example": "Commit suicide.", "phrase": "suicide bomber", "set": 1},
    {"word": "summarise", "meaning": "【動】要約する", "pos": "動", "example": "Summarise text.", "phrase": "briefly summarise", "set": 1},
    {"word": "summarize", "meaning": "【動】要約する（米）", "pos": "動", "example": "Summarize the findings.", "phrase": "summarize the main points", "set": 1},
    {"word": "summit", "meaning": "【名】頂上、首脳会議", "pos": "名", "example": "Summit meeting.", "phrase": "reach the summit", "set": 1},
    {"word": "sunbathe", "meaning": "【動】日光浴をする", "pos": "動", "example": "Sunbathe on the beach.", "phrase": "go sunbathing", "set": 1},
    {"word": "sundial", "meaning": "【名】日時計", "pos": "名", "example": "Old sundial.", "phrase": "read a sundial", "set": 1},
    {"word": "sunrise", "meaning": "【名】日の出", "pos": "名", "example": "Watch the sunrise.", "phrase": "at sunrise", "set": 1},
    {"word": "sunset", "meaning": "【名】日没", "pos": "名", "example": "Beautiful sunset.", "phrase": "at sunset", "set": 1},
    {"word": "superior", "meaning": "【形】優れた", "pos": "形", "example": "Superior quality.", "phrase": "superior to", "set": 1},
    {"word": "superstition", "meaning": "【名】迷信", "pos": "名", "example": "Old superstition.", "phrase": "common superstition", "set": 1},
    {"word": "supply", "meaning": "【名】供給", "pos": "名", "example": "Water supply.", "phrase": "in short supply", "set": 1},
    {"word": "support", "meaning": "【動】支持する", "pos": "動", "example": "Support a family.", "phrase": "support a team", "set": 1},
    {"word": "supporter", "meaning": "【名】支持者", "pos": "名", "example": "Football supporter.", "phrase": "staunch supporter", "set": 1},
    {"word": "supportive", "meaning": "【形】協力的な", "pos": "形", "example": "Supportive family.", "phrase": "supportive of", "set": 1},
    {"word": "suppose", "meaning": "【動】仮定する、思う", "pos": "動", "example": "I suppose so.", "phrase": "suppose that", "set": 1},
    {"word": "supposedly", "meaning": "【副】たぶん、推定では", "pos": "副", "example": "Supposedly true.", "phrase": "allegedly and supposedly", "set": 1},
    {"word": "surely", "meaning": "【副】確かに", "pos": "副", "example": "Slowly but surely.", "phrase": "surely you jest", "set": 1},
    {"word": "surface", "meaning": "【名】表面", "pos": "名", "example": "Surface area.", "phrase": "on the surface", "set": 1},
    {"word": "surgeon", "meaning": "【名】外科医", "pos": "名", "example": "Brain surgeon.", "phrase": "skilled surgeon", "set": 1},
    {"word": "surgery", "meaning": "【名】手術", "pos": "名", "example": "Heart surgery.", "phrase": "undergo surgery", "set": 1},
    {"word": "surprise", "meaning": "【動】驚かせる", "pos": "動", "example": "Surprise me.", "phrase": "be surprised at", "set": 1},
    {"word": "surprisingly", "meaning": "【副】驚くほど", "pos": "副", "example": "Surprisingly good.", "phrase": "not surprisingly", "set": 1},
    {"word": "surround", "meaning": "【動】囲む", "pos": "動", "example": "Surround the city.", "phrase": "surrounded by", "set": 1},
    {"word": "surrounding", "meaning": "【形】周囲の", "pos": "形", "example": "Surrounding area.", "phrase": "surrounding countryside", "set": 1},
    {"word": "survival", "meaning": "【名】生存", "pos": "名", "example": "Survival skills.", "phrase": "fight for survival", "set": 1},
    {"word": "survivor", "meaning": "【名】生存者", "pos": "名", "example": "Sole survivor.", "phrase": "Holocaust survivor", "set": 1},
    {"word": "suspect", "meaning": "【名】容疑者", "pos": "名", "example": "Prime suspect.", "phrase": "interrogate a suspect", "set": 1},
    {"word": "suspicion", "meaning": "【名】疑い", "pos": "名", "example": "Under suspicion.", "phrase": "arouse suspicion", "set": 1},
    {"word": "swarm", "meaning": "【名】群れ", "pos": "名", "example": "Swarm of bees.", "phrase": "swarm of people", "set": 1},
    {"word": "swear", "meaning": "【動】誓う、ののしる", "pos": "動", "example": "Swear to tell the truth.", "phrase": "swear at", "set": 1},
    {"word": "sweat", "meaning": "【名】汗", "pos": "名", "example": "Cold sweat.", "phrase": "break a sweat", "set": 1},
    {"word": "sweatshirt", "meaning": "【名】トレーナー", "pos": "名", "example": "Wear a sweatshirt.", "phrase": "hooded sweatshirt", "set": 1},
    {"word": "swell", "meaning": "【動】膨らむ", "pos": "動", "example": "Swell up.", "phrase": "swell with pride", "set": 1},
    {"word": "swimmer", "meaning": "【名】泳ぐ人", "pos": "名", "example": "Good swimmer.", "phrase": "strong swimmer", "set": 1},
    {"word": "switch", "meaning": "【名】スイッチ", "pos": "名", "example": "Light switch.", "phrase": "make the switch", "set": 1},
    {"word": "switch", "meaning": "【動】切り替える", "pos": "動", "example": "Switch channels.", "phrase": "switch off", "set": 1},
    {"word": "swollen", "meaning": "【形】腫れた", "pos": "形", "example": "Swollen ankle.", "phrase": "swollen river", "set": 1},
    {"word": "sword", "meaning": "【名】剣", "pos": "名", "example": "Sharp sword.", "phrase": "double-edged sword", "set": 1},
    {"word": "sympathy", "meaning": "【名】同情", "pos": "名", "example": "Deep sympathy.", "phrase": "feel sympathy for", "set": 1},
    {"word": "symptom", "meaning": "【名】症状", "pos": "名", "example": "Flu symptoms.", "phrase": "withdrawal symptoms", "set": 1},
    {"word": "syndrome", "meaning": "【名】症候群", "pos": "名", "example": "Down syndrome.", "phrase": "chronic fatigue syndrome", "set": 1},
    {"word": "systematic", "meaning": "【形】体系的な", "pos": "形", "example": "Systematic approach.", "phrase": "systematic review", "set": 1},
    {"word": "tablet", "meaning": "【名】錠剤、タブレット", "pos": "名", "example": "Take a tablet.", "phrase": "tablet computer", "set": 1},
    {"word": "take", "meaning": "【名】テイク、売上", "pos": "名", "example": "Take two.", "phrase": "what is your take", "set": 1},
    {"word": "takeaway", "meaning": "【名】持ち帰り料理（英）", "pos": "名", "example": "Order a takeaway.", "phrase": "Chinese takeaway", "set": 1},
    {"word": "takeoff", "meaning": "【名】離陸", "pos": "名", "example": "Ready for takeoff.", "phrase": "smooth takeoff", "set": 1},
    {"word": "take-off", "meaning": "【名】離陸", "pos": "名", "example": "Before take-off.", "phrase": "take-off speed", "set": 1},
    {"word": "tale", "meaning": "【名】話、物語", "pos": "名", "example": "Fairy tale.", "phrase": "tell a tale", "set": 1},
    {"word": "talented", "meaning": "【形】才能のある", "pos": "形", "example": "Talented musician.", "phrase": "talented artist", "set": 1}
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
