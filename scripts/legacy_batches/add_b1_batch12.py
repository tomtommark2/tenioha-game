
import json
import re
import os

# B1 Batch 12 (Words 1451-1600, "naturally" to "passport")
new_words = [
    {"word": "naturally", "meaning": "【副】自然に、当然", "pos": "副", "example": "Act naturally.", "phrase": "naturally occurring", "set": 1},
    {"word": "navy blue", "meaning": "【形】濃紺の", "pos": "形", "example": "Navy blue suit.", "phrase": "wear navy blue", "set": 1},
    {"word": "near", "meaning": "【形】近い", "pos": "形", "example": "In the near future.", "phrase": "near miss", "set": 1},
    {"word": "near", "meaning": "【副】近くに", "pos": "副", "example": "Come near.", "phrase": "near and far", "set": 1},
    {"word": "nearby", "meaning": "【形】近くの", "pos": "形", "example": "Nearby park.", "phrase": "nearby location", "set": 1},
    {"word": "nearby", "meaning": "【副】近くに", "pos": "副", "example": "Live nearby.", "phrase": "somewhere nearby", "set": 1},
    {"word": "necklace", "meaning": "【名】ネックレス", "pos": "名", "example": "Pearl necklace.", "phrase": "wear a necklace", "set": 1},
    {"word": "nectar", "meaning": "【名】蜜", "pos": "名", "example": "Bees collect nectar.", "phrase": "sweet nectar", "set": 1},
    {"word": "needle", "meaning": "【名】針", "pos": "名", "example": "Thread a needle.", "phrase": "needle and thread", "set": 1},
    {"word": "negotiate", "meaning": "【動】交渉する", "pos": "動", "example": "Negotiate a deal.", "phrase": "negotiate with", "set": 1},
    {"word": "negotiation", "meaning": "【名】交渉", "pos": "名", "example": "Under negotiation.", "phrase": "peace negotiation", "set": 1},
    {"word": "neighborhood", "meaning": "【名】近所（米）", "pos": "名", "example": "Friendly neighborhood.", "phrase": "in the neighborhood", "set": 1},
    {"word": "neighbourhood", "meaning": "【名】近所", "pos": "名", "example": "Quiet neighbourhood.", "phrase": "my neighbourhood", "set": 1},
    {"word": "nephew", "meaning": "【名】甥", "pos": "名", "example": "My nephew works here.", "phrase": "beloved nephew", "set": 1},
    {"word": "nervousness", "meaning": "【名】神経質", "pos": "名", "example": "Overcome nervousness.", "phrase": "sign of nervousness", "set": 1},
    {"word": "ness", "meaning": "【名】岬", "pos": "名", "example": "Inverness (place name suffix often).", "phrase": "Loch Ness", "set": 1},
    {"word": "net", "meaning": "【名】網、ネット", "pos": "名", "example": "Fish net.", "phrase": "internet", "set": 1},
    {"word": "network", "meaning": "【名】ネットワーク", "pos": "名", "example": "Computer network.", "phrase": "social network", "set": 1},
    {"word": "neutral", "meaning": "【形】中立の", "pos": "形", "example": "Neutral country.", "phrase": "remain neutral", "set": 1},
    {"word": "nevertheless", "meaning": "【副】それにもかかわらず", "pos": "副", "example": "Nevertheless, I will go.", "phrase": "but nevertheless", "set": 1},
    {"word": "newborn", "meaning": "【形】生まれたばかりの", "pos": "形", "example": "Newborn baby.", "phrase": "newborn clothes", "set": 1},
    {"word": "newcomer", "meaning": "【名】新入り", "pos": "名", "example": "Welcome the newcomer.", "phrase": "newcomer to the team", "set": 1},
    {"word": "newly", "meaning": "【副】最近", "pos": "副", "example": "Newly married.", "phrase": "newly built", "set": 1},
    {"word": "next door", "meaning": "【副】隣に", "pos": "副", "example": "She lives next door.", "phrase": "the boy next door", "set": 1},
    {"word": "next-door", "meaning": "【形】隣の", "pos": "形", "example": "Next-door neighbor.", "phrase": "next-door house", "set": 1},
    {"word": "nickname", "meaning": "【名】あだ名", "pos": "名", "example": "My nickname is Bob.", "phrase": "give a nickname", "set": 1},
    {"word": "niece", "meaning": "【名】姪", "pos": "名", "example": "My niece is visiting.", "phrase": "favorite niece", "set": 1},
    {"word": "nightlife", "meaning": "【名】夜の歓楽", "pos": "名", "example": "Enjoy the nightlife.", "phrase": "vibrant nightlife", "set": 1},
    {"word": "nod", "meaning": "【名】うなずき", "pos": "名", "example": "Give a nod.", "phrase": "nod of approval", "set": 1},
    {"word": "noisily", "meaning": "【副】騒々しく", "pos": "副", "example": "Play noisily.", "phrase": "eat noisily", "set": 1},
    {"word": "none", "meaning": "【代】誰も～ない", "pos": "代", "example": "None of them came.", "phrase": "none other than", "set": 1},
    {"word": "nonetheless", "meaning": "【副】それにもかかわらず", "pos": "副", "example": "Nonetheless, it is true.", "phrase": "but nonetheless", "set": 1},
    {"word": "nonsense", "meaning": "【名】無意味なこと", "pos": "名", "example": "Stop talking nonsense.", "phrase": "utter nonsense", "set": 1},
    {"word": "nor", "meaning": "【接】～もまた～ない", "pos": "接", "example": "Neither hot nor cold.", "phrase": "nor do I", "set": 1},
    {"word": "normally", "meaning": "【副】普通は", "pos": "副", "example": "Normally I walk.", "phrase": "behave normally", "set": 1},
    {"word": "northeast", "meaning": "【形】北東の", "pos": "形", "example": "Northeast wind.", "phrase": "northeast coast", "set": 1},
    {"word": "northeast", "meaning": "【名】北東", "pos": "名", "example": "In the northeast.", "phrase": "heading northeast", "set": 1},
    {"word": "northeastern", "meaning": "【形】北東の", "pos": "形", "example": "Northeastern states.", "phrase": "northeastern part", "set": 1},
    {"word": "northern", "meaning": "【形】北の", "pos": "形", "example": "Northern hemisphere.", "phrase": "northern lights", "set": 1},
    {"word": "northwest", "meaning": "【形】北西の", "pos": "形", "example": "Northwest passage.", "phrase": "northwest wind", "set": 1},
    {"word": "northwest", "meaning": "【名】北西", "pos": "名", "example": "In the northwest.", "phrase": "heading northwest", "set": 1},
    {"word": "northwestern", "meaning": "【形】北西の", "pos": "形", "example": "Northwestern region.", "phrase": "Northwestern University", "set": 1},
    {"word": "notice", "meaning": "【動】気づく", "pos": "動", "example": "Notice a change.", "phrase": "did you notice", "set": 1},
    {"word": "noticeable", "meaning": "【形】目立つ", "pos": "形", "example": "Noticeable difference.", "phrase": "become noticeable", "set": 1},
    {"word": "noticeboard", "meaning": "【名】掲示板（英）", "pos": "名", "example": "Check the noticeboard.", "phrase": "pin on noticeboard", "set": 1},
    {"word": "notion", "meaning": "【名】概念、考え", "pos": "名", "example": "Abstract notion.", "phrase": "vague notion", "set": 1},
    {"word": "notorious", "meaning": "【形】悪名高い", "pos": "形", "example": "Notorious criminal.", "phrase": "notorious for", "set": 1},
    {"word": "novelist", "meaning": "【名】小説家", "pos": "名", "example": "Famous novelist.", "phrase": "aspiring novelist", "set": 1},
    {"word": "nowhere", "meaning": "【副】どこにも～ない", "pos": "副", "example": "Go nowhere.", "phrase": "nowhere to be found", "set": 1},
    {"word": "nuclear", "meaning": "【形】核の、原子力の", "pos": "形", "example": "Nuclear power.", "phrase": "nuclear weapon", "set": 1},
    {"word": "nucleus", "meaning": "【名】核", "pos": "名", "example": "Cell nucleus.", "phrase": "atomic nucleus", "set": 1},
    {"word": "numerous", "meaning": "【形】多数の", "pos": "形", "example": "Numerous attempts.", "phrase": "numerous times", "set": 1},
    {"word": "nurse", "meaning": "【動】看病する", "pos": "動", "example": "Nurse a patient.", "phrase": "nurse back to health", "set": 1},
    {"word": "nutrient", "meaning": "【名】栄養素", "pos": "名", "example": "Rich in nutrients.", "phrase": "essential nutrient", "set": 1},
    {"word": "nutrition", "meaning": "【名】栄養", "pos": "名", "example": "Good nutrition.", "phrase": "nutrition facts", "set": 1},
    {"word": "nutritious", "meaning": "【形】栄養のある", "pos": "形", "example": "Nutritious meal.", "phrase": "highly nutritious", "set": 1},
    {"word": "object", "meaning": "【名】物体、対象", "pos": "名", "example": "Flying object.", "phrase": "object of desire", "set": 1},
    {"word": "objection", "meaning": "【名】反対", "pos": "名", "example": "Have an objection.", "phrase": "raise an objection", "set": 1},
    {"word": "objective", "meaning": "【名】目的", "pos": "名", "example": "Main objective.", "phrase": "achieve an objective", "set": 1},
    {"word": "observation", "meaning": "【名】観察", "pos": "名", "example": "Careful observation.", "phrase": "observation deck", "set": 1},
    {"word": "observe", "meaning": "【動】観察する、守る", "pos": "動", "example": "Observe nature.", "phrase": "observe the rules", "set": 1},
    {"word": "obstacle", "meaning": "【名】障害", "pos": "名", "example": "Overcome an obstacle.", "phrase": "obstacle course", "set": 1},
    {"word": "obtain", "meaning": "【動】入手する", "pos": "動", "example": "Obtain permission.", "phrase": "obtain information", "set": 1},
    {"word": "obvious", "meaning": "【形】明らかな", "pos": "形", "example": "Obvious choice.", "phrase": "state the obvious", "set": 1},
    {"word": "obviously", "meaning": "【副】明らかに", "pos": "副", "example": "Obviously wrong.", "phrase": "obviously disturbed", "set": 1},
    {"word": "occasion", "meaning": "【名】場合、機会", "pos": "名", "example": "Special occasion.", "phrase": "on occasion", "set": 1},
    {"word": "occasion", "meaning": "【動】引き起こす", "pos": "動", "example": "Occasion a surprise.", "phrase": "occasion trouble", "set": 1},
    {"word": "occasional", "meaning": "【形】時折の", "pos": "形", "example": "Occasional rain.", "phrase": "occasional visitor", "set": 1},
    {"word": "occasionally", "meaning": "【副】時々", "pos": "副", "example": "Visit occasionally.", "phrase": "only occasionally", "set": 1},
    {"word": "occupy", "meaning": "【動】占める", "pos": "動", "example": "Occupy a seat.", "phrase": "occupy one's mind", "set": 1},
    {"word": "occur", "meaning": "【動】起こる", "pos": "動", "example": "An accident occurred.", "phrase": "occur to me", "set": 1},
    {"word": "ocean", "meaning": "【名】大洋", "pos": "名", "example": "Pacific Ocean.", "phrase": "deep ocean", "set": 1},
    {"word": "off", "meaning": "【前】～から外れて", "pos": "前", "example": "Off the road.", "phrase": "off duty", "set": 1},
    {"word": "offensive", "meaning": "【形】不快な、攻撃的な", "pos": "形", "example": "Offensive language.", "phrase": "take the offensive", "set": 1},
    {"word": "officially", "meaning": "【副】公式に", "pos": "副", "example": "Officially announced.", "phrase": "officially open", "set": 1},
    {"word": "oily", "meaning": "【形】油っぽい", "pos": "形", "example": "Oily skin.", "phrase": "oily fish", "set": 1},
    {"word": "old-fashioned", "meaning": "【形】古風な", "pos": "形", "example": "Old-fashioned clothes.", "phrase": "call me old-fashioned", "set": 1},
    {"word": "on to", "meaning": "【前】～の上へ（動作）", "pos": "前", "example": "Jump on to the stage.", "phrase": "pass on to", "set": 1},
    {"word": "oneself", "meaning": "【代】自分自身", "pos": "代", "example": "Hurt oneself.", "phrase": "by oneself", "set": 1},
    {"word": "onstage", "meaning": "【形】舞台上の", "pos": "形", "example": "Onstage performance.", "phrase": "appear onstage", "set": 1},
    {"word": "onto", "meaning": "【前】～の上へ", "pos": "前", "example": "Step onto the platform.", "phrase": "hold onto", "set": 1},
    {"word": "opening", "meaning": "【名】開始、穴", "pos": "名", "example": "Grand opening.", "phrase": "opening ceremony", "set": 1},
    {"word": "operation", "meaning": "【名】手術、操作", "pos": "名", "example": "Undergo an operation.", "phrase": "in operation", "set": 1},
    {"word": "opposite", "meaning": "【副】向かい側に", "pos": "副", "example": "Sit opposite.", "phrase": "directly opposite", "set": 1},
    {"word": "opposite", "meaning": "【名】正反対", "pos": "名", "example": "Exact opposite.", "phrase": "attract opposites", "set": 1},
    {"word": "opposition", "meaning": "【名】反対、野党", "pos": "名", "example": "Leader of the opposition.", "phrase": "strong opposition", "set": 1},
    {"word": "oppress", "meaning": "【動】抑圧する", "pos": "動", "example": "Oppress the people.", "phrase": "oppressed minority", "set": 1},
    {"word": "oppression", "meaning": "【名】抑圧", "pos": "名", "example": "Fight against oppression.", "phrase": "political oppression", "set": 1},
    {"word": "option", "meaning": "【名】選択肢", "pos": "名", "example": "No other option.", "phrase": "choose an option", "set": 1},
    {"word": "oral", "meaning": "【名】口頭試験", "pos": "名", "example": "Pass the oral.", "phrase": "oral exam", "set": 1},
    {"word": "orbit", "meaning": "【名】軌道", "pos": "名", "example": "Earth's orbit.", "phrase": "in orbit", "set": 1},
    {"word": "orchestra", "meaning": "【名】オーケストラ", "pos": "名", "example": "Symphony orchestra.", "phrase": "play in an orchestra", "set": 1},
    {"word": "orderly", "meaning": "【形】整然とした", "pos": "形", "example": "Orderly fashion.", "phrase": "orderly conduct", "set": 1},
    {"word": "ordinary", "meaning": "【形】普通の", "pos": "形", "example": "Ordinary people.", "phrase": "out of the ordinary", "set": 1},
    {"word": "organ", "meaning": "【名】臓器、オルガン", "pos": "名", "example": "Vital organ.", "phrase": "pipe organ", "set": 1},
    {"word": "organic", "meaning": "【形】有機の", "pos": "形", "example": "Organic food.", "phrase": "organic farming", "set": 1},
    {"word": "organisation", "meaning": "【名】組織", "pos": "名", "example": "Charity organisation.", "phrase": "well-run organisation", "set": 1},
    {"word": "organism", "meaning": "【名】有機体、生物", "pos": "名", "example": "Living organism.", "phrase": "micro organism", "set": 1},
    {"word": "organization", "meaning": "【名】組織（米）", "pos": "名", "example": "Non-profit organization.", "phrase": "organization skills", "set": 1},
    {"word": "origin", "meaning": "【名】起源", "pos": "名", "example": "Country of origin.", "phrase": "word origin", "set": 1},
    {"word": "otherwise", "meaning": "【副】さもなければ", "pos": "副", "example": "Do it, otherwise leave.", "phrase": "think otherwise", "set": 1},
    {"word": "ought to", "meaning": "【助】～すべきである", "pos": "助", "example": "You ought to go.", "phrase": "ought to know", "set": 1},
    {"word": "outdoor", "meaning": "【形】屋外の", "pos": "形", "example": "Outdoor activities.", "phrase": "outdoor pool", "set": 1},
    {"word": "outdoors", "meaning": "【副】屋外で", "pos": "副", "example": "Play outdoors.", "phrase": "great outdoors", "set": 1},
    {"word": "outer", "meaning": "【形】外側の", "pos": "形", "example": "Outer space.", "phrase": "outer layer", "set": 1},
    {"word": "outlaw", "meaning": "【名】無法者", "pos": "名", "example": "Wild West outlaw.", "phrase": "declared an outlaw", "set": 1},
    {"word": "outline", "meaning": "【動】概説する", "pos": "動", "example": "Outline the plan.", "phrase": "briefly outline", "set": 1},
    {"word": "out-of-date", "meaning": "【形】時代遅れの", "pos": "形", "example": "Out-of-date fashion.", "phrase": "become out-of-date", "set": 1},
    {"word": "outstanding", "meaning": "【形】傑出した", "pos": "形", "example": "Outstanding achievement.", "phrase": "outstanding balance", "set": 1},
    {"word": "outward", "meaning": "【形】外側の", "pos": "形", "example": "Outward appearance.", "phrase": "outward journey", "set": 1},
    {"word": "outweigh", "meaning": "【動】上回る", "pos": "動", "example": "Benefits outweigh risks.", "phrase": "outweigh the cost", "set": 1},
    {"word": "overcome", "meaning": "【動】克服する", "pos": "動", "example": "Overcome difficulties.", "phrase": "overcome fear", "set": 1},
    {"word": "overjoyed", "meaning": "【形】大喜びの", "pos": "形", "example": "She was overjoyed.", "phrase": "overjoyed to hear", "set": 1},
    {"word": "overnight", "meaning": "【形】一晩の", "pos": "形", "example": "Overnight stay.", "phrase": "overnight success", "set": 1},
    {"word": "overnight", "meaning": "【副】一晩中、突然", "pos": "副", "example": "Stay overnight.", "phrase": "change overnight", "set": 1},
    {"word": "overwhelm", "meaning": "【動】圧倒する", "pos": "動", "example": "Overwhelmed by work.", "phrase": "emotionally overwhelmed", "set": 1},
    {"word": "overwhelming", "meaning": "【形】圧倒的な", "pos": "形", "example": "Overwhelming majority.", "phrase": "overwhelming evidence", "set": 1},
    {"word": "overwork", "meaning": "【名】過労", "pos": "名", "example": "Sick from overwork.", "phrase": "die from overwork", "set": 1},
    {"word": "owe", "meaning": "【動】借りがある", "pos": "動", "example": "I owe you one.", "phrase": "owe money", "set": 1},
    {"word": "owing", "meaning": "【形】未払いの", "pos": "形", "example": "Money owing.", "phrase": "owing to", "set": 1},
    {"word": "own", "meaning": "【動】所有する", "pos": "動", "example": "Own a car.", "phrase": "own up", "set": 1},
    {"word": "oxygen", "meaning": "【名】酸素", "pos": "名", "example": "Need oxygen.", "phrase": "oxygen mask", "set": 1},
    {"word": "pace", "meaning": "【名】ペース、歩調", "pos": "名", "example": "Keep pace.", "phrase": "at a slow pace", "set": 1},
    {"word": "package", "meaning": "【名】包み", "pos": "名", "example": "Send a package.", "phrase": "package tour", "set": 1},
    {"word": "packing", "meaning": "【名】荷造り", "pos": "名", "example": "Finish packing.", "phrase": "packing material", "set": 1},
    {"word": "paddle", "meaning": "【名】パドル", "pos": "名", "example": "Lost the paddle.", "phrase": "canoe paddle", "set": 1},
    {"word": "paid", "meaning": "【形】有給の", "pos": "形", "example": "Paid holiday.", "phrase": "paid leave", "set": 1},
    {"word": "pain", "meaning": "【名】痛み", "pos": "名", "example": "Feel pain.", "phrase": "pain in the neck", "set": 1},
    {"word": "painful", "meaning": "【形】痛い", "pos": "形", "example": "Painful memory.", "phrase": "painful experience", "set": 1},
    {"word": "pale", "meaning": "【形】青白い", "pos": "形", "example": "Pale face.", "phrase": "pale blue", "set": 1},
    {"word": "palm", "meaning": "【名】手のひら", "pos": "名", "example": "Read a palm.", "phrase": "palm tree", "set": 1},
    {"word": "parachute", "meaning": "【名】パラシュート", "pos": "名", "example": "Jump with a parachute.", "phrase": "open the parachute", "set": 1},
    {"word": "paradise", "meaning": "【名】楽園", "pos": "名", "example": "Tropical paradise.", "phrase": "paradise lost", "set": 1},
    {"word": "paralyse", "meaning": "【動】麻痺させる（英綴り）", "pos": "動", "example": "Paralysed by fear.", "phrase": "traffic paralysed", "set": 1},
    {"word": "paralyze", "meaning": "【動】麻痺させる", "pos": "動", "example": "Paralyze the system.", "phrase": "paralyzed from waist down", "set": 1},
    {"word": "parcel", "meaning": "【名】小包", "pos": "名", "example": "Post a parcel.", "phrase": "part and parcel", "set": 1},
    {"word": "pardon", "meaning": "【動】許す", "pos": "動", "example": "Pardon me.", "phrase": "beg your pardon", "set": 1},
    {"word": "parental", "meaning": "【形】親の", "pos": "形", "example": "Parental guidance.", "phrase": "parental control", "set": 1},
    {"word": "parking", "meaning": "【名】駐車", "pos": "名", "example": "No parking.", "phrase": "parking lot", "set": 1},
    {"word": "parrot", "meaning": "【名】オウム", "pos": "名", "example": "Talk like a parrot.", "phrase": "pet parrot", "set": 1},
    {"word": "partial", "meaning": "【形】部分的な", "pos": "形", "example": "Partial success.", "phrase": "partial to", "set": 1},
    {"word": "participant", "meaning": "【名】参加者", "pos": "名", "example": "Active participant.", "phrase": "participant in", "set": 1},
    {"word": "participate", "meaning": "【動】参加する", "pos": "動", "example": "Participate in a game.", "phrase": "thank you for participating", "set": 1},
    {"word": "participle", "meaning": "【名】分詞", "pos": "名", "example": "Past participle.", "phrase": "present participle", "set": 1},
    {"word": "particularly", "meaning": "【副】特に", "pos": "副", "example": "Not particularly like.", "phrase": "particularly good", "set": 1},
    {"word": "part-time", "meaning": "【形】パートタイムの", "pos": "形", "example": "Part-time job.", "phrase": "part-time worker", "set": 1},
    {"word": "part-time", "meaning": "【副】パートで", "pos": "副", "example": "Work part-time.", "phrase": "employed part-time", "set": 1},
    {"word": "passion", "meaning": "【名】情熱", "pos": "名", "example": "Passion for music.", "phrase": "with passion", "set": 1},
    {"word": "passive", "meaning": "【形】受動的な", "pos": "形", "example": "Passive smoking.", "phrase": "passive voice", "set": 1},
    {"word": "passport", "meaning": "【名】パスポート", "pos": "名", "example": "Valid passport.", "phrase": "passport control", "set": 1}
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
