
import json
import re
import os

# B1 Batch 14 (Words 1751-1900, "public transport" to "ridiculous")
new_words = [
    {"word": "public transport", "meaning": "【名】公共交通機関", "pos": "名", "example": "Use public transport.", "phrase": "on public transport", "set": 1},
    {"word": "publicly", "meaning": "【副】公然と", "pos": "副", "example": "Announce publicly.", "phrase": "publicly available", "set": 1},
    {"word": "publisher", "meaning": "【名】出版社、発行者", "pos": "名", "example": "Book publisher.", "phrase": "software publisher", "set": 1},
    {"word": "pullover", "meaning": "【名】プルオーバー", "pos": "名", "example": "Wool pullover.", "phrase": "wear a pullover", "set": 1},
    {"word": "pump", "meaning": "【名】ポンプ", "pos": "名", "example": "Water pump.", "phrase": "bicycle pump", "set": 1},
    {"word": "punish", "meaning": "【動】罰する", "pos": "動", "example": "Punish a crime.", "phrase": "punish severely", "set": 1},
    {"word": "punishment", "meaning": "【名】罰", "pos": "名", "example": "Capital punishment.", "phrase": "punishment for", "set": 1},
    {"word": "pupil", "meaning": "【名】生徒、瞳", "pos": "名", "example": "Primary school pupil.", "phrase": "pupil of the eye", "set": 1},
    {"word": "puppy", "meaning": "【名】子犬", "pos": "名", "example": "Playful puppy.", "phrase": "cute puppy", "set": 1},
    {"word": "pure", "meaning": "【形】純粋な", "pos": "形", "example": "Pure gold.", "phrase": "pure luck", "set": 1},
    {"word": "purify", "meaning": "【動】浄化する", "pos": "動", "example": "Purify water.", "phrase": "purify the air", "set": 1},
    {"word": "purse", "meaning": "【名】財布（米：ハンドバッグ）", "pos": "名", "example": "Lost my purse.", "phrase": "hold the purse strings", "set": 1},
    {"word": "push", "meaning": "【名】一押し", "pos": "名", "example": "Give it a push.", "phrase": "at a push", "set": 1},
    {"word": "puzzle", "meaning": "【名】パズル、難問", "pos": "名", "example": "Jigsaw puzzle.", "phrase": "crossword puzzle", "set": 1},
    {"word": "quake", "meaning": "【名】地震、揺れ", "pos": "名", "example": "Earth quake.", "phrase": "great quake", "set": 1},
    {"word": "qualified", "meaning": "【形】資格のある", "pos": "形", "example": "Qualified teacher.", "phrase": "qualified for", "set": 1},
    {"word": "qualify", "meaning": "【動】資格を得る", "pos": "動", "example": "Qualify for the final.", "phrase": "qualify as", "set": 1},
    {"word": "quality", "meaning": "【形】良質の", "pos": "形", "example": "Quality time.", "phrase": "quality control", "set": 1},
    {"word": "quantity", "meaning": "【名】量", "pos": "名", "example": "Large quantity.", "phrase": "quality over quantity", "set": 1},
    {"word": "question mark", "meaning": "【名】疑問符", "pos": "名", "example": "Ends with a question mark.", "phrase": "big question mark", "set": 1},
    {"word": "questionnaire", "meaning": "【名】アンケート", "pos": "名", "example": "Fill out a questionnaire.", "phrase": "survey questionnaire", "set": 1},
    {"word": "queue", "meaning": "【名】列（英）", "pos": "名", "example": "Jump the queue.", "phrase": "stand in a queue", "set": 1},
    {"word": "race", "meaning": "【名】競争、人種", "pos": "名", "example": "Horse race.", "phrase": "human race", "set": 1},
    {"word": "race", "meaning": "【動】競争する", "pos": "動", "example": "Race against time.", "phrase": "race car", "set": 1},
    {"word": "racial", "meaning": "【形】人種の", "pos": "形", "example": "Racial discrimination.", "phrase": "racial harmony", "set": 1},
    {"word": "radiation", "meaning": "【名】放射線", "pos": "名", "example": "Nuclear radiation.", "phrase": "radiation sickness", "set": 1},
    {"word": "rage", "meaning": "【名】激怒", "pos": "名", "example": "Fly into a rage.", "phrase": "road rage", "set": 1},
    {"word": "rail", "meaning": "【名】鉄道、レール", "pos": "名", "example": "Travel by rail.", "phrase": "railway station", "set": 1},
    {"word": "railroad", "meaning": "【名】鉄道（米）", "pos": "名", "example": "Railroad track.", "phrase": "underground railroad", "set": 1},
    {"word": "railway", "meaning": "【名】鉄道（英）", "pos": "名", "example": "Railway station.", "phrase": "railway line", "set": 1},
    {"word": "rainfall", "meaning": "【名】降雨量", "pos": "名", "example": "Heavy rainfall.", "phrase": "annual rainfall", "set": 1},
    {"word": "rainforest", "meaning": "【名】熱帯雨林", "pos": "名", "example": "Amazon rainforest.", "phrase": "save the rainforest", "set": 1},
    {"word": "rank", "meaning": "【名】階級、順位", "pos": "名", "example": "High rank.", "phrase": "taxi rank", "set": 1},
    {"word": "rap", "meaning": "【動】ラップを歌う、叩く", "pos": "動", "example": "Rap music.", "phrase": "rap on the door", "set": 1},
    {"word": "rapid", "meaning": "【形】急速な", "pos": "形", "example": "Rapid growth.", "phrase": "rapid fire", "set": 1},
    {"word": "rapidly", "meaning": "【副】急速に", "pos": "副", "example": "Changing rapidly.", "phrase": "move rapidly", "set": 1},
    {"word": "rare", "meaning": "【形】珍しい、生焼けの", "pos": "形", "example": "Rare bird.", "phrase": "rare steak", "set": 1},
    {"word": "rarely", "meaning": "【副】めったに～ない", "pos": "副", "example": "Rarely go out.", "phrase": "very rarely", "set": 1},
    {"word": "raspberry", "meaning": "【名】ラズベリー", "pos": "名", "example": "Raspberry jam.", "phrase": "blow a raspberry", "set": 1},
    {"word": "ration", "meaning": "【名】配給量", "pos": "名", "example": "Food ration.", "phrase": "daily ration", "set": 1},
    {"word": "rational", "meaning": "【形】合理的な", "pos": "形", "example": "Rational decision.", "phrase": "rational explanation", "set": 1},
    {"word": "razor", "meaning": "【名】カミソリ", "pos": "名", "example": "Electric razor.", "phrase": "razor sharp", "set": 1},
    {"word": "reach", "meaning": "【名】届く範囲", "pos": "名", "example": "Out of reach.", "phrase": "within reach", "set": 1},
    {"word": "react", "meaning": "【動】反応する", "pos": "動", "example": "React quickly.", "phrase": "react to", "set": 1},
    {"word": "realistic", "meaning": "【形】現実的な", "pos": "形", "example": "Realistic goal.", "phrase": "be realistic", "set": 1},
    {"word": "reality", "meaning": "【名】現実", "pos": "名", "example": "Face reality.", "phrase": "virtual reality", "set": 1},
    {"word": "rearrange", "meaning": "【動】再配置する", "pos": "動", "example": "Rearrange the furniture.", "phrase": "rearrange a meeting", "set": 1},
    {"word": "reasonable", "meaning": "【形】妥当な、手頃な", "pos": "形", "example": "Reasonable price.", "phrase": "be reasonable", "set": 1},
    {"word": "rebuild", "meaning": "【動】再建する", "pos": "動", "example": "Rebuild the house.", "phrase": "rebuild confidence", "set": 1},
    {"word": "recall", "meaning": "【動】思い出す", "pos": "動", "example": "Recall a memory.", "phrase": "product recall", "set": 1},
    {"word": "reception", "meaning": "【名】受付、歓迎会", "pos": "名", "example": "Wedding reception.", "phrase": "warm reception", "set": 1},
    {"word": "recite", "meaning": "【動】暗唱する", "pos": "動", "example": "Recite a poem.", "phrase": "recite the alphabet", "set": 1},
    {"word": "reclaim", "meaning": "【動】取り戻す", "pos": "動", "example": "Reclaim land.", "phrase": "baggage reclaim", "set": 1},
    {"word": "recognise", "meaning": "【動】認識する（英綴り）", "pos": "動", "example": "Recognise a face.", "phrase": "hard to recognise", "set": 1},
    {"word": "recognize", "meaning": "【動】認識する", "pos": "動", "example": "Recognize the voice.", "phrase": "fully recognize", "set": 1},
    {"word": "recommend", "meaning": "【動】勧める", "pos": "動", "example": "Recommend a book.", "phrase": "highly recommend", "set": 1},
    {"word": "record", "meaning": "【名】記録", "pos": "名", "example": "Break a record.", "phrase": "for the record", "set": 1},
    {"word": "recording", "meaning": "【名】録音、録画", "pos": "名", "example": "Audio recording.", "phrase": "recording studio", "set": 1},
    {"word": "recover", "meaning": "【動】回復する", "pos": "動", "example": "Recover from illness.", "phrase": "recover successfully", "set": 1},
    {"word": "recovery", "meaning": "【名】回復", "pos": "名", "example": "Speedy recovery.", "phrase": "recovery room", "set": 1},
    {"word": "recycled", "meaning": "【形】再生利用された", "pos": "形", "example": "Recycled paper.", "phrase": "recycled glass", "set": 1},
    {"word": "recycling", "meaning": "【名】リサイクル", "pos": "名", "example": "Recycling bin.", "phrase": "recycling center", "set": 1},
    {"word": "reduce", "meaning": "【動】減らす", "pos": "動", "example": "Reduce waste.", "phrase": "reduce speed", "set": 1},
    {"word": "reduction", "meaning": "【名】減少、削減", "pos": "名", "example": "Price reduction.", "phrase": "reduction in", "set": 1},
    {"word": "reef", "meaning": "【名】岩礁", "pos": "名", "example": "Coral reef.", "phrase": "barrier reef", "set": 1},
    {"word": "referee", "meaning": "【名】審判", "pos": "名", "example": "Football referee.", "phrase": "ask the referee", "set": 1},
    {"word": "reflection", "meaning": "【名】反射、熟考", "pos": "名", "example": "Reflection in the mirror.", "phrase": "on reflection", "set": 1},
    {"word": "refreshments", "meaning": "【名】軽食", "pos": "名", "example": "Serve refreshments.", "phrase": "light refreshments", "set": 1},
    {"word": "refund", "meaning": "【名】払い戻し", "pos": "名", "example": "Ask for a refund.", "phrase": "full refund", "set": 1},
    {"word": "refusal", "meaning": "【名】拒否", "pos": "名", "example": "Refusal to accept.", "phrase": "point blank refusal", "set": 1},
    {"word": "refuse", "meaning": "【名】ゴミ", "pos": "名", "example": "Household refuse.", "phrase": "refuse collection", "set": 1},
    {"word": "refuse", "meaning": "【動】断る", "pos": "動", "example": "Refuse an offer.", "phrase": "refuse to", "set": 1},
    {"word": "regain", "meaning": "【動】取り戻す", "pos": "動", "example": "Regain consciousness.", "phrase": "regain control", "set": 1},
    {"word": "regard", "meaning": "【動】みなす", "pos": "動", "example": "Regard as a friend.", "phrase": "as regards", "set": 1},
    {"word": "regarding", "meaning": "【前】～に関して", "pos": "前", "example": "Regarding your letter.", "phrase": "question regarding", "set": 1},
    {"word": "region", "meaning": "【名】地域", "pos": "名", "example": "Tropical region.", "phrase": "in the region of", "set": 1},
    {"word": "regional", "meaning": "【形】地域の", "pos": "形", "example": "Regional newspaper.", "phrase": "regional differences", "set": 1},
    {"word": "register", "meaning": "【名】登録簿、レジ", "pos": "名", "example": "School register.", "phrase": "cash register", "set": 1},
    {"word": "register", "meaning": "【動】登録する", "pos": "動", "example": "Register for a course.", "phrase": "register a birth", "set": 1},
    {"word": "registration", "meaning": "【名】登録", "pos": "名", "example": "Car registration.", "phrase": "registration fee", "set": 1},
    {"word": "regulation", "meaning": "【名】規則", "pos": "名", "example": "Safety regulations.", "phrase": "strict regulations", "set": 1},
    {"word": "reject", "meaning": "【動】拒絶する", "pos": "動", "example": "Reject a plan.", "phrase": "reject an offer", "set": 1},
    {"word": "relate", "meaning": "【動】関連づける", "pos": "動", "example": "Relate to the story.", "phrase": "relate facts", "set": 1},
    {"word": "relation", "meaning": "【名】関係、親類", "pos": "名", "example": "In relation to.", "phrase": "distant relation", "set": 1},
    {"word": "relationship", "meaning": "【名】人間関係", "pos": "名", "example": "Good relationship.", "phrase": "relationship with", "set": 1},
    {"word": "relative", "meaning": "【形】相対的な", "pos": "形", "example": "Relative humidity.", "phrase": "relative to", "set": 1},
    {"word": "relative", "meaning": "【名】親戚", "pos": "名", "example": "Visit relatives.", "phrase": "close relative", "set": 1},
    {"word": "relatively", "meaning": "【副】比較的", "pos": "副", "example": "Relatively cheap.", "phrase": "relatively speaking", "set": 1},
    {"word": "relaxing", "meaning": "【形】リラックスさせる", "pos": "形", "example": "Relaxing holiday.", "phrase": "relaxing music", "set": 1},
    {"word": "release", "meaning": "【動】解放する、発表する", "pos": "動", "example": "Release a prisoner.", "phrase": "press release", "set": 1},
    {"word": "reliable", "meaning": "【形】信頼できる", "pos": "形", "example": "Reliable information.", "phrase": "reliable source", "set": 1},
    {"word": "religion", "meaning": "【名】宗教", "pos": "名", "example": "Freedom of religion.", "phrase": "believe in religion", "set": 1},
    {"word": "religious", "meaning": "【形】宗教的な", "pos": "形", "example": "Religious belief.", "phrase": "religious education", "set": 1},
    {"word": "rely", "meaning": "【動】頼る", "pos": "動", "example": "Rely on others.", "phrase": "rely upon", "set": 1},
    {"word": "remainder", "meaning": "【名】残り", "pos": "名", "example": "Remainder of the day.", "phrase": "for the remainder", "set": 1},
    {"word": "remark", "meaning": "【動】述べる", "pos": "動", "example": "Remark on the weather.", "phrase": "remark that", "set": 1},
    {"word": "remarkable", "meaning": "【形】注目すべき", "pos": "形", "example": "Remarkable talent.", "phrase": "truly remarkable", "set": 1},
    {"word": "remedy", "meaning": "【名】治療法、救済策", "pos": "名", "example": "Home remedy.", "phrase": "remedy for", "set": 1},
    {"word": "remembrance", "meaning": "【名】追悼、記憶", "pos": "名", "example": "Remembrance Day.", "phrase": "in remembrance of", "set": 1},
    {"word": "remote control", "meaning": "【名】リモコン", "pos": "名", "example": "Use a remote control.", "phrase": "tv remote control", "set": 1},
    {"word": "remove", "meaning": "【動】取り除く", "pos": "動", "example": "Remove the cover.", "phrase": "remove stains", "set": 1},
    {"word": "renew", "meaning": "【動】更新する", "pos": "動", "example": "Renew a passport.", "phrase": "renew a contract", "set": 1},
    {"word": "repay", "meaning": "【動】返済する", "pos": "動", "example": "Repay a loan.", "phrase": "repay kindness", "set": 1},
    {"word": "repeatedly", "meaning": "【副】繰り返して", "pos": "副", "example": "Ask repeatedly.", "phrase": "told repeatedly", "set": 1},
    {"word": "reply", "meaning": "【動】返信する", "pos": "動", "example": "Reply to an email.", "phrase": "reply promptly", "set": 1},
    {"word": "report", "meaning": "【動】報告する", "pos": "動", "example": "Report a crime.", "phrase": "report for duty", "set": 1},
    {"word": "representative", "meaning": "【名】代表者", "pos": "名", "example": "Sales representative.", "phrase": "elected representative", "set": 1},
    {"word": "reproduce", "meaning": "【動】再生する、繁殖する", "pos": "動", "example": "Reproduce a sound.", "phrase": "reproduce the results", "set": 1},
    {"word": "republic", "meaning": "【名】共和国", "pos": "名", "example": "Republic of Ireland.", "phrase": "banana republic", "set": 1},
    {"word": "reputation", "meaning": "【名】評判", "pos": "名", "example": "Good reputation.", "phrase": "earn a reputation", "set": 1},
    {"word": "request", "meaning": "【動】要請する", "pos": "動", "example": "Request information.", "phrase": "request a stop", "set": 1},
    {"word": "require", "meaning": "【動】必要とする", "pos": "動", "example": "Require help.", "phrase": "require attention", "set": 1},
    {"word": "requirement", "meaning": "【名】必要条件", "pos": "名", "example": "Entry requirement.", "phrase": "meet the requirements", "set": 1},
    {"word": "rescue", "meaning": "【名】救助", "pos": "名", "example": "Come to the rescue.", "phrase": "rescue team", "set": 1},
    {"word": "rescue", "meaning": "【動】救助する", "pos": "動", "example": "Rescue a cat.", "phrase": "rescue from", "set": 1},
    {"word": "researcher", "meaning": "【名】研究者", "pos": "名", "example": "Scientific researcher.", "phrase": "market researcher", "set": 1},
    {"word": "resemble", "meaning": "【動】似ている", "pos": "動", "example": "Resemble a parent.", "phrase": "closely resemble", "set": 1},
    {"word": "reservation", "meaning": "【名】予約", "pos": "名", "example": "Make a reservation.", "phrase": "confirm reservation", "set": 1},
    {"word": "reserve", "meaning": "【名】蓄え、保護区", "pos": "名", "example": "Nature reserve.", "phrase": "in reserve", "set": 1},
    {"word": "reserve", "meaning": "【動】予約する、取っておく", "pos": "動", "example": "Reserve a table.", "phrase": "all rights reserved", "set": 1},
    {"word": "resident", "meaning": "【形】居住している", "pos": "形", "example": "Resident alien.", "phrase": "resident population", "set": 1},
    {"word": "residential", "meaning": "【形】住宅の", "pos": "形", "example": "Residential area.", "phrase": "residential street", "set": 1},
    {"word": "resist", "meaning": "【動】抵抗する", "pos": "動", "example": "Resist temptation.", "phrase": "cannot resist", "set": 1},
    {"word": "resolve", "meaning": "【動】解決する、決心する", "pos": "動", "example": "Resolve a conflict.", "phrase": "resolve to", "set": 1},
    {"word": "resort", "meaning": "【名】行楽地、手段", "pos": "名", "example": "Seaside resort.", "phrase": "last resort", "set": 1},
    {"word": "resource", "meaning": "【名】資源", "pos": "名", "example": "Natural resources.", "phrase": "human resources", "set": 1},
    {"word": "respect", "meaning": "【名】尊敬、点", "pos": "名", "example": "Show respect.", "phrase": "with respect to", "set": 1},
    {"word": "respect", "meaning": "【動】尊敬する", "pos": "動", "example": "Respect your elders.", "phrase": "respect the law", "set": 1},
    {"word": "respectable", "meaning": "【形】立派な", "pos": "形", "example": "Respectable job.", "phrase": "respectable citizen", "set": 1},
    {"word": "respond", "meaning": "【動】応答する", "pos": "動", "example": "Respond to a question.", "phrase": "respond quickly", "set": 1},
    {"word": "responsibility", "meaning": "【名】責任", "pos": "名", "example": "Take responsibility.", "phrase": "sense of responsibility", "set": 1},
    {"word": "responsible", "meaning": "【形】責任がある", "pos": "形", "example": "Who is responsible?", "phrase": "responsible for", "set": 1},
    {"word": "rest", "meaning": "【名】残り", "pos": "名", "example": "The rest of the day.", "phrase": "for the rest of", "set": 1},
    {"word": "rest", "meaning": "【動】休む", "pos": "動", "example": "Rest for a while.", "phrase": "rest in peace", "set": 1},
    {"word": "restore", "meaning": "【動】回復させる、修復する", "pos": "動", "example": "Restore order.", "phrase": "restore a building", "set": 1},
    {"word": "restrict", "meaning": "【動】制限する", "pos": "動", "example": "Restrict access.", "phrase": "restrict movement", "set": 1},
    {"word": "result", "meaning": "【動】結果として生じる", "pos": "動", "example": "Result in failure.", "phrase": "result from", "set": 1},
    {"word": "retail", "meaning": "【名】小売り", "pos": "名", "example": "Retail price.", "phrase": "retail store", "set": 1},
    {"word": "retain", "meaning": "【動】保持する", "pos": "動", "example": "Retain moisture.", "phrase": "retain control", "set": 1},
    {"word": "retell", "meaning": "【動】再話する", "pos": "動", "example": "Retell a story.", "phrase": "retell in your own words", "set": 1},
    {"word": "retrospect", "meaning": "【名】回顧", "pos": "名", "example": "In retrospect.", "phrase": "in retrospect I think", "set": 1},
    {"word": "reunification", "meaning": "【名】再統一", "pos": "名", "example": "German reunification.", "phrase": "family reunification", "set": 1},
    {"word": "reunify", "meaning": "【動】再統一する", "pos": "動", "example": "Reunify the country.", "phrase": "reunify families", "set": 1},
    {"word": "revise", "meaning": "【動】修正する、復習する", "pos": "動", "example": "Revise a plan.", "phrase": "revise for an exam", "set": 1},
    {"word": "revision", "meaning": "【名】修正、復習", "pos": "名", "example": "Make a revision.", "phrase": "revision of", "set": 1},
    {"word": "reward", "meaning": "【名】報酬", "pos": "名", "example": "Reward for lost dog.", "phrase": "reap the reward", "set": 1},
    {"word": "rewrite", "meaning": "【動】書き直す", "pos": "動", "example": "Rewrite an essay.", "phrase": "total rewrite", "set": 1},
    {"word": "rid", "meaning": "【動】取り除く", "pos": "動", "example": "Get rid of.", "phrase": "be rid of", "set": 1},
    {"word": "riddle", "meaning": "【動】穴だらけにする", "pos": "動", "example": "Riddled with bullets; Riddled with holes.", "phrase": "riddle with", "set": 1},
    # Note: 'riddle' noun is common (nazonazo), but CSV says verb. 
    # Usually B1 'riddle' is noun. 'riddle' verb is less common.
    # However I follow CSV POS.
    
    {"word": "ridiculous", "meaning": "【形】ばかげた", "pos": "形", "example": "Don't be ridiculous.", "phrase": "look ridiculous", "set": 1}
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
