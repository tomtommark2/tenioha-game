
import json
import re
import os

# B2 Batch 12 (Words 1651-1800 approx)
# CSV Lines 1651 to 1800
new_words = [
    {"word": "offend", "meaning": "【動】感情を害する", "pos": "動", "example": "Did I offend you?", "phrase": "offend against law", "set": 1},
    {"word": "offender", "meaning": "【名】犯罪者", "pos": "名", "example": "Young offender.", "phrase": "sex offender", "set": 1},
    {"word": "offense", "meaning": "【名】犯罪、攻撃（米）", "pos": "名", "example": "Federal offense.", "phrase": "no offense", "set": 1},
    {"word": "offhand", "meaning": "【副】即座に、ぶっきらぼうに", "pos": "副", "example": "Can't say offhand.", "phrase": "treated offhand", "set": 1},
    {"word": "official", "meaning": "【名】役人", "pos": "名", "example": "Government official.", "phrase": "elected official", "set": 1},
    {"word": "offshore", "meaning": "【形】沖合の", "pos": "形", "example": "Offshore drilling.", "phrase": "offshore bank", "set": 1},
    {"word": "ointment", "meaning": "【名】軟膏", "pos": "名", "example": "Apply ointment.", "phrase": "healing ointment", "set": 1},
    {"word": "olive", "meaning": "【名】オリーブ", "pos": "名", "example": "Olive oil.", "phrase": "green olive", "set": 1},
    {"word": "Olympia", "meaning": "【名】オリンピア", "pos": "名", "example": "Ancient Olympia.", "phrase": "Olympia Greece", "set": 1},
    {"word": "Olympiad", "meaning": "【名】オリンピアード", "pos": "名", "example": "Cultural Olympiad.", "phrase": "math Olympiad", "set": 1},
    {"word": "once", "meaning": "【接】いったん～すると", "pos": "接", "example": "Once you start.", "phrase": "once in a while", "set": 1},
    {"word": "openly", "meaning": "【副】公然と", "pos": "副", "example": "Discuss openly.", "phrase": "speak openly", "set": 1},
    {"word": "operator", "meaning": "【名】操作者、交換手", "pos": "名", "example": "Telephone operator.", "phrase": "tour operator", "set": 1},
    {"word": "opponent", "meaning": "【名】相手", "pos": "名", "example": "Defeat an opponent.", "phrase": "political opponent", "set": 1},
    {"word": "optimism", "meaning": "【名】楽観主義", "pos": "名", "example": "Cautious optimism.", "phrase": "full of optimism", "set": 1},
    {"word": "optimist", "meaning": "【名】楽観主義者", "pos": "名", "example": "Eternal optimist.", "phrase": "be an optimist", "set": 1},
    {"word": "optimistic", "meaning": "【形】楽観的な", "pos": "形", "example": "Optimistic view.", "phrase": "optimistic about", "set": 1},
    {"word": "optional", "meaning": "【形】任意の", "pos": "形", "example": "Optional extra.", "phrase": "strictly optional", "set": 1},
    {"word": "oral", "meaning": "【形】口頭の", "pos": "形", "example": "Oral exam.", "phrase": "oral hygiene", "set": 1},
    {"word": "orator", "meaning": "【名】演説者", "pos": "名", "example": "Great orator.", "phrase": "gifted orator", "set": 1},
    {"word": "orchestral", "meaning": "【形】オーケストラの", "pos": "形", "example": "Orchestral music.", "phrase": "orchestral suite", "set": 1},
    {"word": "orchid", "meaning": "【名】蘭", "pos": "名", "example": "Wild orchid.", "phrase": "orchid flower", "set": 1},
    {"word": "organiser", "meaning": "【名】主催者（英）", "pos": "名", "example": "Event organiser.", "phrase": "party organiser", "set": 1},
    {"word": "organizer", "meaning": "【名】主催者", "pos": "名", "example": "Union organizer.", "phrase": "pocket organizer", "set": 1},
    {"word": "original", "meaning": "【名】原本", "pos": "名", "example": "Keep the original.", "phrase": "in the original", "set": 1},
    {"word": "originality", "meaning": "【名】独創性", "pos": "名", "example": "Lack originality.", "phrase": "creative originality", "set": 1},
    {"word": "originally", "meaning": "【副】元来", "pos": "副", "example": "Originally planned.", "phrase": "come from originally", "set": 1},
    {"word": "originate", "meaning": "【動】生じる", "pos": "動", "example": "Originate from.", "phrase": "originate in", "set": 1},
    {"word": "ornament", "meaning": "【名】装飾品", "pos": "名", "example": "Christmas ornament.", "phrase": "garden ornament", "set": 1},
    {"word": "ounce", "meaning": "【名】オンス", "pos": "名", "example": "Ounce of gold.", "phrase": "ounce of prevention", "set": 1},
    {"word": "outback", "meaning": "【名】奥地（豪）", "pos": "名", "example": "Australian outback.", "phrase": "in the outback", "set": 1},
    {"word": "outbreak", "meaning": "【名】発生", "pos": "名", "example": "Outbreak of war.", "phrase": "virus outbreak", "set": 1},
    {"word": "outcome", "meaning": "【名】結果", "pos": "名", "example": "Final outcome.", "phrase": "predict the outcome", "set": 1},
    {"word": "outdistance", "meaning": "【動】引き離す", "pos": "動", "example": "Outdistance rivals.", "phrase": "far outdistance", "set": 1},
    {"word": "outdo", "meaning": "【動】まさる", "pos": "動", "example": "Outdo oneself.", "phrase": "not to be outdone", "set": 1},
    {"word": "outfit", "meaning": "【名】服装", "pos": "名", "example": "New outfit.", "phrase": "cowboy outfit", "set": 1},
    {"word": "outgrow", "meaning": "【動】成長して合わなくなる", "pos": "動", "example": "Outgrow clothes.", "phrase": "outgrow a habit", "set": 1},
    {"word": "outing", "meaning": "【名】遠出", "pos": "名", "example": "Family outing.", "phrase": "school outing", "set": 1},
    {"word": "outlet", "meaning": "【名】出口、直販店", "pos": "名", "example": "Factory outlet.", "phrase": "power outlet", "set": 1},
    {"word": "outline", "meaning": "【名】概要、輪郭", "pos": "名", "example": "Draw an outline.", "phrase": "rough outline", "set": 1},
    {"word": "outlive", "meaning": "【動】長生きする", "pos": "動", "example": "Outlive one's wife.", "phrase": "outlive usefulness", "set": 1},
    {"word": "outlook", "meaning": "【名】見通し、見解", "pos": "名", "example": "Positive outlook.", "phrase": "economic outlook", "set": 1},
    {"word": "outpatient", "meaning": "【名】外来患者", "pos": "名", "example": "Outpatient clinic.", "phrase": "treat as outpatient", "set": 1},
    {"word": "output", "meaning": "【名】生産高、出力", "pos": "名", "example": "Industrial output.", "phrase": "output data", "set": 1},
    {"word": "outrage", "meaning": "【名】激怒、非道", "pos": "名", "example": "Public outrage.", "phrase": "moral outrage", "set": 1},
    {"word": "outrageous", "meaning": "【形】法外な、けしからぬ", "pos": "形", "example": "Outrageous price.", "phrase": "outrageous behavior", "set": 1},
    {"word": "outshine", "meaning": "【動】より輝く", "pos": "動", "example": "Outshine the sun.", "phrase": "outshine competitors", "set": 1},
    {"word": "outside", "meaning": "【形】外部の", "pos": "形", "example": "Outside world.", "phrase": "outside chance", "set": 1},
    {"word": "outside", "meaning": "【名】外側", "pos": "名", "example": "On the outside.", "phrase": "look from outside", "set": 1},
    {"word": "outsider", "meaning": "【名】部外者", "pos": "名", "example": "Feel like an outsider.", "phrase": "rank outsider", "set": 1},
    {"word": "outskirts", "meaning": "【名】郊外", "pos": "名", "example": "On the outskirts.", "phrase": "city outskirts", "set": 1},
    {"word": "outwardly", "meaning": "【副】表面上は", "pos": "副", "example": "Outwardly calm.", "phrase": "outwardly happy", "set": 1},
    {"word": "oval", "meaning": "【形】楕円形の", "pos": "形", "example": "Oval office.", "phrase": "oval face", "set": 1},
    {"word": "overall", "meaning": "【形】全体の", "pos": "形", "example": "Overall effect.", "phrase": "overall picture", "set": 1},
    {"word": "overall", "meaning": "【副】全体として", "pos": "副", "example": "Overall, it's good.", "phrase": "perform well overall", "set": 1},
    {"word": "overboard", "meaning": "【副】船外へ", "pos": "副", "example": "Fall overboard.", "phrase": "go overboard", "set": 1},
    {"word": "overbook", "meaning": "【動】予約を取りすぎる", "pos": "動", "example": "Flight was overbooked.", "phrase": "overbook seats", "set": 1},
    {"word": "overcoat", "meaning": "【名】オーバーコート", "pos": "名", "example": "Wool overcoat.", "phrase": "winter overcoat", "set": 1},
    {"word": "overemphasise", "meaning": "【動】強調しすぎる（英）", "pos": "動", "example": "Overemphasise importance.", "phrase": "tend to overemphasise", "set": 1},
    {"word": "overemphasize", "meaning": "【動】強調しすぎる", "pos": "動", "example": "Overemphasize risk.", "phrase": "overemphasize the point", "set": 1},
    {"word": "overestimate", "meaning": "【動】過大評価する", "pos": "動", "example": "Overestimate ability.", "phrase": "overestimate the cost", "set": 1},
    {"word": "overhear", "meaning": "【動】ふと耳にする", "pos": "動", "example": "Overhear conversation.", "phrase": "overhear a remark", "set": 1},
    {"word": "overlap", "meaning": "【名】重複", "pos": "名", "example": "Small overlap.", "phrase": "overlap in schedule", "set": 1},
    {"word": "overlook", "meaning": "【動】見落とす、見渡す", "pos": "動", "example": "Overlook a mistake.", "phrase": "overlook the sea", "set": 1},
    {"word": "overly", "meaning": "【副】あまりに", "pos": "副", "example": "Overly cautious.", "phrase": "overly sensitive", "set": 1},
    {"word": "overseas", "meaning": "【形】海外の", "pos": "形", "example": "Overseas travel.", "phrase": "overseas market", "set": 1},
    {"word": "overshadow", "meaning": "【動】影を投げかける、見劣りさせる", "pos": "動", "example": "Overshadowed by clouds.", "phrase": "overshadow his brother", "set": 1},
    {"word": "oversize", "meaning": "【形】特大の", "pos": "形", "example": "Oversize load.", "phrase": "oversize t-shirt", "set": 1},
    {"word": "overstep", "meaning": "【動】踏み外す、行き過ぎる", "pos": "動", "example": "Overstep the mark.", "phrase": "overstep authority", "set": 1},
    {"word": "overtake", "meaning": "【動】追い越す", "pos": "動", "example": "Overtake a car.", "phrase": "overtake the leader", "set": 1},
    {"word": "overthrow", "meaning": "【動】転覆させる", "pos": "動", "example": "Overthrow the government.", "phrase": "overthrow a dictator", "set": 1},
    {"word": "overtime", "meaning": "【副】時間外に", "pos": "副", "example": "Work overtime.", "phrase": "paid overtime", "set": 1},
    {"word": "overtime", "meaning": "【名】残業", "pos": "名", "example": "Do overtime.", "phrase": "overtime pay", "set": 1},
    {"word": "overturn", "meaning": "【動】ひっくり返す", "pos": "動", "example": "Car overturned.", "phrase": "overturn a decision", "set": 1},
    {"word": "ow", "meaning": "【名】痛っ", "pos": "名", "example": "Ow, that hurt!", "phrase": "say ow", "set": 1},
    {"word": "owing to", "meaning": "【前】～のために", "pos": "前", "example": "Owing to rain.", "phrase": "cancelled owing to", "set": 1},
    {"word": "owl", "meaning": "【名】フクロウ", "pos": "名", "example": "Wise owl.", "phrase": "night owl", "set": 1},
    {"word": "ox", "meaning": "【名】雄牛", "pos": "名", "example": "Strong as an ox.", "phrase": "yoke of oxen", "set": 1},
    {"word": "ozone", "meaning": "【名】オゾン", "pos": "名", "example": "Ozone layer.", "phrase": "ozone depletion", "set": 1},
    {"word": "pa", "meaning": "【名】パパ", "pos": "名", "example": "Ask your pa.", "phrase": "ma and pa", "set": 1},
    {"word": "packed", "meaning": "【形】満員の", "pos": "形", "example": "Packed room.", "phrase": "packed lunch", "set": 1},
    {"word": "packet", "meaning": "【名】小包", "pos": "名", "example": "Packet of crisps.", "phrase": "data packet", "set": 1},
    {"word": "pad", "meaning": "【名】詰め物、パッド", "pos": "名", "example": "Shoulder pad.", "phrase": "launch pad", "set": 1},
    {"word": "paintbrush", "meaning": "【名】絵筆", "pos": "名", "example": "Clean the paintbrush.", "phrase": "fine paintbrush", "set": 1},
    {"word": "pajamas", "meaning": "【名】パジャマ", "pos": "名", "example": "Wear pajamas.", "phrase": "silk pajamas", "set": 1},
    {"word": "pallet", "meaning": "【名】パレット", "pos": "名", "example": "Wooden pallet.", "phrase": "pallet truck", "set": 1},
    {"word": "pancake", "meaning": "【名】パンケーキ", "pos": "名", "example": "Blueberry pancake.", "phrase": "flat as a pancake", "set": 1},
    {"word": "pandemic", "meaning": "【形】全国的な、パンデミック", "pos": "形", "example": "Pandemic flu.", "phrase": "global pandemic", "set": 1},
    {"word": "panel", "meaning": "【名】パネル、羽目板", "pos": "名", "example": "Solar panel.", "phrase": "panel discussion", "set": 1},
    {"word": "panic", "meaning": "【動】パニックになる", "pos": "動", "example": "Don't panic.", "phrase": "panic buying", "set": 1},
    {"word": "papaya", "meaning": "【名】パパイヤ", "pos": "名", "example": "Sweet papaya.", "phrase": "papaya salad", "set": 1},
    {"word": "paperless", "meaning": "【形】紙を使わない", "pos": "形", "example": "Paperless office.", "phrase": "go paperless", "set": 1},
    {"word": "paperwork", "meaning": "【名】事務処理", "pos": "名", "example": "Much paperwork.", "phrase": "finish paperwork", "set": 1},
    {"word": "parade", "meaning": "【名】パレード", "pos": "名", "example": "Victory parade.", "phrase": "fashion parade", "set": 1},
    {"word": "paradox", "meaning": "【名】逆説", "pos": "名", "example": "Seeming paradox.", "phrase": "logical paradox", "set": 1},
    {"word": "paralysis", "meaning": "【名】麻痺", "pos": "名", "example": "Partial paralysis.", "phrase": "sleep paralysis", "set": 1},
    {"word": "paramedic", "meaning": "【形】救急医療の (noun mostly)", "pos": "形", "example": "Paramedic team.", "phrase": "call a paramedic", "set": 1},
    {"word": "paratrooper", "meaning": "【名】落下傘兵", "pos": "名", "example": "Elite paratrooper.", "phrase": "drop paratroopers", "set": 1},
    {"word": "parliament", "meaning": "【名】議会", "pos": "名", "example": "Member of Parliament.", "phrase": "houses of parliament", "set": 1},
    {"word": "part", "meaning": "【動】別れる、分ける", "pos": "動", "example": "Part ways.", "phrase": "part company", "set": 1},
    {"word": "participation", "meaning": "【名】参加", "pos": "名", "example": "Active participation.", "phrase": "participation rate", "set": 1},
    {"word": "particle", "meaning": "【名】粒子", "pos": "名", "example": "Subatomic particle.", "phrase": "particle physics", "set": 1},
    {"word": "particular", "meaning": "【形】特定の", "pos": "形", "example": "Particular case.", "phrase": "in particular", "set": 1},
    {"word": "partisan", "meaning": "【名】党派心のある人、パルチザン", "pos": "名", "example": "Partisan politics.", "phrase": "partisan support", "set": 1},
    {"word": "partnership", "meaning": "【名】提携", "pos": "名", "example": "Business partnership.", "phrase": "in partnership with", "set": 1},
    {"word": "passionate", "meaning": "【形】情熱的な", "pos": "形", "example": "Passionate kiss.", "phrase": "passionate about", "set": 1},
    {"word": "passionately", "meaning": "【副】情熱的に", "pos": "副", "example": "Argue passionately.", "phrase": "love passionately", "set": 1},
    {"word": "pastor", "meaning": "【名】牧師", "pos": "名", "example": "Church pastor.", "phrase": "pastor of the church", "set": 1},
    {"word": "pastoral", "meaning": "【形】牧歌的な", "pos": "形", "example": "Pastoral scene.", "phrase": "pastoral care", "set": 1},
    {"word": "patch", "meaning": "【名】継ぎ、区画", "pos": "名", "example": "Vegetable patch.", "phrase": "eye patch", "set": 1},
    {"word": "patiently", "meaning": "【副】根気よく", "pos": "副", "example": "Wait patiently.", "phrase": "listen patiently", "set": 1},
    {"word": "patriot", "meaning": "【名】愛国者", "pos": "名", "example": "True patriot.", "phrase": "American patriot", "set": 1},
    {"word": "patriotic", "meaning": "【形】愛国的な", "pos": "形", "example": "Patriotic song.", "phrase": "patriotic duty", "set": 1},
    {"word": "patriotism", "meaning": "【名】愛国心", "pos": "名", "example": "Feel patriotism.", "phrase": "blind patriotism", "set": 1},
    {"word": "patron", "meaning": "【名】後援者", "pos": "名", "example": "Patron of arts.", "phrase": "patron saint", "set": 1},
    {"word": "pave", "meaning": "【動】舗装する", "pos": "動", "example": "Pave the road.", "phrase": "pave the way", "set": 1},
    {"word": "pavement", "meaning": "【名】歩道（英）", "pos": "名", "example": "Walk on the pavement.", "phrase": "crack in pavement", "set": 1},
    {"word": "paw", "meaning": "【名】足（動物の）", "pos": "名", "example": "Cat's paw.", "phrase": "paw print", "set": 1},
    {"word": "pawnbroker", "meaning": "【名】質屋", "pos": "名", "example": "Visit a pawnbroker.", "phrase": "licensed pawnbroker", "set": 1},
    {"word": "pawnshop", "meaning": "【名】質店", "pos": "名", "example": "Local pawnshop.", "phrase": "pawnshop owner", "set": 1},
    {"word": "payment", "meaning": "【名】支払い", "pos": "名", "example": "Late payment.", "phrase": "make a payment", "set": 1},
    {"word": "peacefully", "meaning": "【副】平和に", "pos": "副", "example": "Sleep peacefully.", "phrase": "peacefully resolved", "set": 1},
    {"word": "peach", "meaning": "【名】桃", "pos": "名", "example": "Juicy peach.", "phrase": "peach cobbler", "set": 1},
    {"word": "peak", "meaning": "【名】頂点", "pos": "名", "example": "Mountain peak.", "phrase": "peak season", "set": 1},
    {"word": "pearl", "meaning": "【名】真珠", "pos": "名", "example": "Cultured pearl.", "phrase": "pearl necklace", "set": 1},
    {"word": "pebble", "meaning": "【名】小石", "pos": "名", "example": "Smooth pebble.", "phrase": "beach pebble", "set": 1},
    {"word": "pedal", "meaning": "【名】ペダル", "pos": "名", "example": "Brake pedal.", "phrase": "push the pedal", "set": 1},
    {"word": "pedantic", "meaning": "【形】学者ぶった", "pos": "形", "example": "Pedantic teacher.", "phrase": "pedantic tone", "set": 1},
    {"word": "pedestrian", "meaning": "【名】歩行者", "pos": "名", "example": "Pedestrian crossing.", "phrase": "hit a pedestrian", "set": 1},
    {"word": "pee", "meaning": "【動】おしっこをする", "pos": "動", "example": "Need to pee.", "phrase": "pee pants", "set": 1},
    {"word": "peel", "meaning": "【名】皮", "pos": "名", "example": "Lemon peel.", "phrase": "orange peel", "set": 1},
    {"word": "peel", "meaning": "【動】皮をむく", "pos": "動", "example": "Peel a potato.", "phrase": "peel off", "set": 1},
    {"word": "peep", "meaning": "【名】のぞき見", "pos": "名", "example": "Take a peep.", "phrase": "peep show", "set": 1},
    {"word": "peer", "meaning": "【名】同等の人、貴族", "pos": "名", "example": "Peer pressure.", "phrase": "peer review", "set": 1},
    {"word": "peg", "meaning": "【名】留め釘、洗濯バサミ", "pos": "名", "example": "Clothes peg.", "phrase": "square peg", "set": 1},
    {"word": "penalise", "meaning": "【動】罰する（英）", "pos": "動", "example": "Penalise foul play.", "phrase": "be penalised", "set": 1},
    {"word": "penalize", "meaning": "【動】罰する", "pos": "動", "example": "Penalize the team.", "phrase": "penalize for late", "set": 1},
    {"word": "penalty", "meaning": "【名】刑罰", "pos": "名", "example": "Death penalty.", "phrase": "penalty kick", "set": 1},
    {"word": "penetrate", "meaning": "【動】貫通する", "pos": "動", "example": "Penetrate armor.", "phrase": "penetrate the market", "set": 1},
    {"word": "penguin", "meaning": "【名】ペンギン", "pos": "名", "example": "Emperor penguin.", "phrase": "penguin suit", "set": 1},
    {"word": "penicillin", "meaning": "【名】ペニシリン", "pos": "名", "example": "Allergic to penicillin.", "phrase": "penicillin shot", "set": 1},
    {"word": "pension", "meaning": "【名】年金", "pos": "名", "example": "Old age pension.", "phrase": "pension fund", "set": 1},
    {"word": "pentagon", "meaning": "【名】五角形", "pos": "名", "example": "Draw a pentagon.", "phrase": "The Pentagon", "set": 1},
    {"word": "perceive", "meaning": "【動】知覚する", "pos": "動", "example": "Perceive a threat.", "phrase": "perceive as", "set": 1},
    {"word": "percentage", "meaning": "【名】割合", "pos": "名", "example": "High percentage.", "phrase": "percentage point", "set": 1},
    {"word": "perception", "meaning": "【名】知覚", "pos": "名", "example": "Visual perception.", "phrase": "perception of reality", "set": 1},
    {"word": "permanence", "meaning": "【名】永続性", "pos": "名", "example": "Sense of permanence.", "phrase": "permanence of art", "set": 1},
    {"word": "permeate", "meaning": "【動】浸透する", "pos": "動", "example": "Water permeated soil.", "phrase": "permeate the air", "set": 1},
    {"word": "perseverance", "meaning": "【名】忍耐", "pos": "名", "example": "Reward for perseverance.", "phrase": "dogged perseverance", "set": 1},
    {"word": "persist", "meaning": "【動】固執する、持続する", "pos": "動", "example": "Persist in doing.", "phrase": "symptoms persist", "set": 1},
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
