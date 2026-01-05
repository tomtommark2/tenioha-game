
import json
import re
import os

# B1 Batch 17 (Words 2201-2350, "talk" to "unless")
new_words = [
    {"word": "talk", "meaning": "【名】会話、講演", "pos": "名", "example": "Have a talk.", "phrase": "small talk", "set": 1},
    {"word": "talkative", "meaning": "【形】おしゃべりな", "pos": "形", "example": "Talkative person.", "phrase": "very talkative", "set": 1},
    {"word": "tank", "meaning": "【名】タンク、戦車", "pos": "名", "example": "Water tank.", "phrase": "fish tank", "set": 1},
    {"word": "tape", "meaning": "【動】テープで貼る、録音する", "pos": "動", "example": "Tape a box.", "phrase": "tape record", "set": 1},
    {"word": "taste", "meaning": "【名】味、好み", "pos": "名", "example": "Sweet taste.", "phrase": "taste in music", "set": 1},
    {"word": "taste", "meaning": "【動】味がする", "pos": "動", "example": "Taste good.", "phrase": "taste like", "set": 1},
    {"word": "tasteless", "meaning": "【形】味がない、趣味の悪い", "pos": "形", "example": "Tasteless food.", "phrase": "tasteless joke", "set": 1},
    {"word": "tasty", "meaning": "【形】おいしい", "pos": "形", "example": "Tasty meal.", "phrase": "very tasty", "set": 1},
    {"word": "tax", "meaning": "【名】税金", "pos": "名", "example": "Income tax.", "phrase": "tax return", "set": 1},
    {"word": "teaching", "meaning": "【名】教えること、教え", "pos": "名", "example": "Teaching method.", "phrase": "Christian teachings", "set": 1},
    {"word": "teammate", "meaning": "【名】チームメイト", "pos": "名", "example": "Soccer teammate.", "phrase": "supportive teammate", "set": 1},
    {"word": "teamwork", "meaning": "【名】チームワーク", "pos": "名", "example": "Great teamwork.", "phrase": "teamwork skills", "set": 1},
    {"word": "tear", "meaning": "【動】引き裂く", "pos": "動", "example": "Tear the paper.", "phrase": "tear apart", "set": 1},
    {"word": "tease", "meaning": "【名】からかう人", "pos": "名", "example": "He is a tease.", "phrase": "don't be a tease", "set": 1},
    # Note: 'tease' as noun often means the act or person. CSV maps to noun.
    
    {"word": "technique", "meaning": "【名】技術、技巧", "pos": "名", "example": "New technique.", "phrase": "master a technique", "set": 1},
    {"word": "technological", "meaning": "【形】技術的な", "pos": "形", "example": "Technological advance.", "phrase": "technological change", "set": 1},
    {"word": "teen", "meaning": "【名】１０代の若者", "pos": "名", "example": "Young teen.", "phrase": "teen idol", "set": 1},
    {"word": "telecommunications", "meaning": "【名】電気通信", "pos": "名", "example": "Telecommunications industry.", "phrase": "satellite telecommunications", "set": 1},
    {"word": "telegram", "meaning": "【名】電報", "pos": "名", "example": "Send a telegram.", "phrase": "receive a telegram", "set": 1},
    {"word": "teller", "meaning": "【名】（銀行の）窓口係", "pos": "名", "example": "Bank teller.", "phrase": "fortune teller", "set": 1},
    {"word": "temper", "meaning": "【名】気質、機嫌", "pos": "名", "example": "Bad temper.", "phrase": "lose one's temper", "set": 1},
    {"word": "temporary", "meaning": "【形】一時的な", "pos": "形", "example": "Temporary job.", "phrase": "temporary shelter", "set": 1},
    {"word": "tempt", "meaning": "【動】誘惑する", "pos": "動", "example": "Tempt me.", "phrase": "be tempted to", "set": 1},
    {"word": "tend", "meaning": "【動】傾向がある", "pos": "動", "example": "Tend to be late.", "phrase": "tend to do", "set": 1},
    {"word": "tendency", "meaning": "【名】傾向", "pos": "名", "example": "Natural tendency.", "phrase": "tendency to", "set": 1},
    {"word": "tense", "meaning": "【形】緊張した", "pos": "形", "example": "Tense atmosphere.", "phrase": "tense moment", "set": 1},
    {"word": "tense", "meaning": "【名】時制", "pos": "名", "example": "Past tense.", "phrase": "future tense", "set": 1},
    {"word": "tension", "meaning": "【名】緊張", "pos": "名", "example": "High tension.", "phrase": "reduce tension", "set": 1},
    {"word": "tent", "meaning": "【名】テント", "pos": "名", "example": "Pitch a tent.", "phrase": "camping tent", "set": 1},
    {"word": "term", "meaning": "【名】期間、用語", "pos": "名", "example": "School term.", "phrase": "technical term", "set": 1},
    {"word": "terminal", "meaning": "【名】ターミナル、端末", "pos": "名", "example": "Airport terminal.", "phrase": "computer terminal", "set": 1},
    {"word": "terribly", "meaning": "【副】ひどく", "pos": "副", "example": "Terribly sorry.", "phrase": "terribly wrong", "set": 1},
    {"word": "terrific", "meaning": "【形】すばらしい", "pos": "形", "example": "Terrific job.", "phrase": "feel terrific", "set": 1},
    {"word": "terrified", "meaning": "【形】おびえた", "pos": "形", "example": "Terrified of dogs.", "phrase": "terrified look", "set": 1},
    {"word": "terror", "meaning": "【名】恐怖", "pos": "名", "example": "Scream in terror.", "phrase": "reign of terror", "set": 1},
    {"word": "terrorism", "meaning": "【名】テロリズム", "pos": "名", "example": "Act of terrorism.", "phrase": "fight against terrorism", "set": 1},
    {"word": "terrorist", "meaning": "【名】テロリスト", "pos": "名", "example": "Terrorist attack.", "phrase": "suspected terrorist", "set": 1},
    {"word": "thankful", "meaning": "【形】感謝している", "pos": "形", "example": "Thankful for help.", "phrase": "be thankful", "set": 1},
    {"word": "theft", "meaning": "【名】盗み", "pos": "名", "example": "Car theft.", "phrase": "identity theft", "set": 1},
    {"word": "theory", "meaning": "【名】理論", "pos": "名", "example": "Scientific theory.", "phrase": "in theory", "set": 1},
    {"word": "thirst", "meaning": "【動】渇望する", "pos": "動", "example": "Thirst for knowledge.", "phrase": "thirst after", "set": 1},
    {"word": "thorough", "meaning": "【形】徹底的な", "pos": "形", "example": "Thorough investigation.", "phrase": "thorough cleaning", "set": 1},
    {"word": "threat", "meaning": "【名】脅迫、脅威", "pos": "名", "example": "Serious threat.", "phrase": "threat to", "set": 1},
    {"word": "threatening", "meaning": "【形】脅迫的な", "pos": "形", "example": "Threatening letter.", "phrase": "life-threatening", "set": 1},
    {"word": "thriller", "meaning": "【名】スリラー", "pos": "名", "example": "Psychological thriller.", "phrase": "action thriller", "set": 1},
    {"word": "through", "meaning": "【副】通り抜けて", "pos": "副", "example": "Read through.", "phrase": "see through", "set": 1},
    {"word": "throughout", "meaning": "【前】～の至る所に", "pos": "前", "example": "Throughout the world.", "phrase": "throughout the year", "set": 1},
    {"word": "thumb", "meaning": "【名】親指", "pos": "名", "example": "Suck thumb.", "phrase": "thumbs up", "set": 1},
    {"word": "thump", "meaning": "【動】ゴツンと打つ", "pos": "動", "example": "Thump on the door.", "phrase": "thump the table", "set": 1},
    {"word": "thunder", "meaning": "【名】雷", "pos": "名", "example": "Crash of thunder.", "phrase": "thunder and lightning", "set": 1},
    {"word": "thunderous", "meaning": "【形】雷のような", "pos": "形", "example": "Thunderous applause.", "phrase": "thunderous noise", "set": 1},
    {"word": "thus", "meaning": "【副】したがって", "pos": "副", "example": "Thus far.", "phrase": "and thus", "set": 1},
    {"word": "tick", "meaning": "【名】カチカチという音、ダニ", "pos": "名", "example": "Tick of the clock.", "phrase": "in a tick", "set": 1},
    {"word": "tick", "meaning": "【動】カチカチ鳴る", "pos": "動", "example": "Clock ticks.", "phrase": "tick the box", "set": 1},
    {"word": "tide", "meaning": "【名】潮", "pos": "名", "example": "High tide.", "phrase": "tide turns", "set": 1},
    {"word": "tie", "meaning": "【動】結ぶ", "pos": "動", "example": "Tie a knot.", "phrase": "tie shoelaces", "set": 1},
    {"word": "tighten", "meaning": "【動】締める", "pos": "動", "example": "Tighten the screw.", "phrase": "tighten one's belt", "set": 1},
    {"word": "tightly", "meaning": "【副】堅く", "pos": "副", "example": "Hold tightly.", "phrase": "shut tightly", "set": 1},
    {"word": "tile", "meaning": "【名】タイル", "pos": "名", "example": "Bathroom tile.", "phrase": "roof tile", "set": 1},
    {"word": "till", "meaning": "【接】～まで", "pos": "接", "example": "Wait till I come.", "phrase": "till tomorrow", "set": 1},
    {"word": "timely", "meaning": "【形】タイムリーな", "pos": "形", "example": "Timely reminder.", "phrase": "timely manner", "set": 1},
    {"word": "tin", "meaning": "【名】スズ、缶", "pos": "名", "example": "Tin can.", "phrase": "biscuit tin", "set": 1},
    {"word": "tiny", "meaning": "【形】とても小さい", "pos": "形", "example": "Tiny creatures.", "phrase": "tiny bit", "set": 1},
    {"word": "tire", "meaning": "【動】疲れさせる", "pos": "動", "example": "Tire easily.", "phrase": "tire out", "set": 1},
    {"word": "tiring", "meaning": "【形】骨の折れる", "pos": "形", "example": "Tiring journey.", "phrase": "tiring work", "set": 1},
    {"word": "tissue", "meaning": "【名】組織、ティッシュ", "pos": "名", "example": "Muscle tissue.", "phrase": "tissue paper", "set": 1},
    {"word": "tobacco", "meaning": "【名】タバコ", "pos": "名", "example": "Grow tobacco.", "phrase": "tobacco smoke", "set": 1},
    {"word": "tongue", "meaning": "【名】舌、言語", "pos": "名", "example": "Bite your tongue.", "phrase": "mother tongue", "set": 1},
    {"word": "toothpaste", "meaning": "【名】歯磨き粉", "pos": "名", "example": "Buy toothpaste.", "phrase": "tube of toothpaste", "set": 1},
    {"word": "top", "meaning": "【形】一番上の", "pos": "形", "example": "Top priority.", "phrase": "top floor", "set": 1},
    {"word": "tornado", "meaning": "【名】竜巻", "pos": "名", "example": "Hit by a tornado.", "phrase": "tornado warning", "set": 1},
    {"word": "toss", "meaning": "【動】投げる", "pos": "動", "example": "Toss a coin.", "phrase": "toss and turn", "set": 1},
    {"word": "total", "meaning": "【形】全体の", "pos": "形", "example": "Total cost.", "phrase": "total eclipse", "set": 1},
    {"word": "total", "meaning": "【名】合計", "pos": "名", "example": "Grand total.", "phrase": "in total", "set": 1},
    {"word": "totally", "meaning": "【副】完全に", "pos": "副", "example": "Totally agree.", "phrase": "totally different", "set": 1},
    {"word": "touch", "meaning": "【動】触れる、感動させる", "pos": "動", "example": "Don't touch.", "phrase": "keep in touch", "set": 1},
    {"word": "tour", "meaning": "【動】周遊する", "pos": "動", "example": "Tour the country.", "phrase": "tour around", "set": 1},
    {"word": "tourism", "meaning": "【名】観光事業", "pos": "名", "example": "Promote tourism.", "phrase": "mass tourism", "set": 1},
    {"word": "tournament", "meaning": "【名】トーナメント", "pos": "名", "example": "Tennis tournament.", "phrase": "win a tournament", "set": 1},
    {"word": "trace", "meaning": "【名】痕跡", "pos": "名", "example": "No trace left.", "phrase": "trace element", "set": 1},
    {"word": "tracksuit", "meaning": "【名】トラックスーツ", "pos": "名", "example": "Wear a tracksuit.", "phrase": "blue tracksuit", "set": 1},
    {"word": "traditionally", "meaning": "【副】伝統的に", "pos": "副", "example": "Traditionally cooked.", "phrase": "traditionally believed", "set": 1},
    {"word": "traffic jam", "meaning": "【名】交通渋滞", "pos": "名", "example": "Stuck in a traffic jam.", "phrase": "avoid traffic jams", "set": 1},
    {"word": "tragedy", "meaning": "【名】悲劇", "pos": "名", "example": "Greek tragedy.", "phrase": "great tragedy", "set": 1},
    {"word": "tragic", "meaning": "【形】悲劇的な", "pos": "形", "example": "Tragic accident.", "phrase": "tragic ending", "set": 1},
    {"word": "trail", "meaning": "【名】小道、跡", "pos": "名", "example": "Nature trail.", "phrase": "leave a trail", "set": 1},
    {"word": "transfer", "meaning": "【動】移す、乗り換える", "pos": "動", "example": "Transfer money.", "phrase": "transfer to", "set": 1},
    {"word": "transform", "meaning": "【動】変える", "pos": "動", "example": "Transform society.", "phrase": "transform into", "set": 1},
    {"word": "transformation", "meaning": "【名】変化、変形", "pos": "名", "example": "Complete transformation.", "phrase": "social transformation", "set": 1},
    {"word": "transitional", "meaning": "【形】過渡期の", "pos": "形", "example": "Transitional period.", "phrase": "transitional government", "set": 1},
    {"word": "translate", "meaning": "【動】翻訳する", "pos": "動", "example": "Translate into English.", "phrase": "translate literally", "set": 1},
    {"word": "transport", "meaning": "【名】輸送", "pos": "名", "example": "Public transport.", "phrase": "means of transport", "set": 1},
    {"word": "transportation", "meaning": "【名】輸送（米）", "pos": "名", "example": "Public transportation.", "phrase": "mode of transportation", "set": 1},
    {"word": "trash", "meaning": "【名】ゴミ（米）", "pos": "名", "example": "Take out the trash.", "phrase": "trash can", "set": 1},
    {"word": "travel agent", "meaning": "【名】旅行業者", "pos": "名", "example": "Book with a travel agent.", "phrase": "local travel agent", "set": 1},
    {"word": "treat", "meaning": "【名】楽しみ、おごり", "pos": "名", "example": "Special treat.", "phrase": "trick or treat", "set": 1},
    {"word": "treatment", "meaning": "【名】治療、扱い", "pos": "名", "example": "Medical treatment.", "phrase": "fair treatment", "set": 1},
    {"word": "tremble", "meaning": "【動】震える", "pos": "動", "example": "Tremble with fear.", "phrase": "hands tremble", "set": 1},
    {"word": "tremendous", "meaning": "【形】ものすごい", "pos": "形", "example": "Tremendous success.", "phrase": "tremendous amount", "set": 1},
    {"word": "trend", "meaning": "【名】傾向", "pos": "名", "example": "Current trend.", "phrase": "market trend", "set": 1},
    {"word": "trigger", "meaning": "【名】引き金", "pos": "名", "example": "Pull the trigger.", "phrase": "trigger for", "set": 1},
    {"word": "trim", "meaning": "【名】整頓、手入れ", "pos": "名", "example": "Hair trim.", "phrase": "in good trim", "set": 1},
    {"word": "triumph", "meaning": "【名】勝利", "pos": "名", "example": "Great triumph.", "phrase": "shout of triumph", "set": 1},
    {"word": "tropical", "meaning": "【形】熱帯の", "pos": "形", "example": "Tropical fruit.", "phrase": "tropical storm", "set": 1},
    {"word": "trouble", "meaning": "【動】悩ませる", "pos": "動", "example": "Sorry to trouble you.", "phrase": "trouble oneself", "set": 1},
    {"word": "trumpet", "meaning": "【名】トランペット", "pos": "名", "example": "Play the trumpet.", "phrase": "blow your own trumpet", "set": 1},
    {"word": "trustworthy", "meaning": "【形】信頼できる", "pos": "形", "example": "Trustworthy person.", "phrase": "prove trustworthy", "set": 1},
    {"word": "tumble", "meaning": "【動】転がり落ちる", "pos": "動", "example": "Tumble down the stairs.", "phrase": "rough and tumble", "set": 1},
    {"word": "tuna", "meaning": "【名】マグロ", "pos": "名", "example": "Canned tuna.", "phrase": "tuna sandwich", "set": 1},
    {"word": "turbulence", "meaning": "【名】乱気流", "pos": "名", "example": "Hit turbulence.", "phrase": "severe turbulence", "set": 1},
    {"word": "turning", "meaning": "【名】曲がり角", "pos": "名", "example": "Take the first turning.", "phrase": "wrong turning", "set": 1},
    {"word": "turtle", "meaning": "【名】カメ", "pos": "名", "example": "Sea turtle.", "phrase": "turtle shell", "set": 1},
    {"word": "twin", "meaning": "【名】双子", "pos": "名", "example": "Identical twin.", "phrase": "twin brother", "set": 1},
    {"word": "twist", "meaning": "【名】ねじれ", "pos": "名", "example": "Twist of fate.", "phrase": "twist and turn", "set": 1},
    {"word": "twist", "meaning": "【動】ねじる", "pos": "動", "example": "Twist an ankle.", "phrase": "twist off", "set": 1},
    {"word": "type", "meaning": "【動】タイプする", "pos": "動", "example": "Type a letter.", "phrase": "type fast", "set": 1},
    {"word": "typical", "meaning": "【形】典型的な", "pos": "形", "example": "Typical example.", "phrase": "it's typical of him", "set": 1},
    {"word": "typically", "meaning": "【副】典型的に", "pos": "副", "example": "Typically English.", "phrase": "typically found", "set": 1},
    {"word": "unable", "meaning": "【形】できない", "pos": "形", "example": "Unable to attend.", "phrase": "unable to do", "set": 1},
    {"word": "unafraid", "meaning": "【形】恐れない", "pos": "形", "example": "Unafraid of danger.", "phrase": "totally unafraid", "set": 1},
    {"word": "unbelievable", "meaning": "【形】信じられない", "pos": "形", "example": "Unbelievable stroy.", "phrase": "it's unbelievable", "set": 1},
    {"word": "uncertainty", "meaning": "【名】不確実性", "pos": "名", "example": "Uncertainty about the future.", "phrase": "period of uncertainty", "set": 1},
    {"word": "unclear", "meaning": "【形】不明瞭な", "pos": "形", "example": "Instructions were unclear.", "phrase": "unclear concerning", "set": 1},
    {"word": "uncontrollable", "meaning": "【形】制御できない", "pos": "形", "example": "Uncontrollable urge.", "phrase": "uncontrollable laughter", "set": 1},
    {"word": "uncover", "meaning": "【動】暴露する、覆いを取る", "pos": "動", "example": "Uncover the truth.", "phrase": "uncover a plot", "set": 1},
    {"word": "underage", "meaning": "【形】未成年の", "pos": "形", "example": "Underage drinking.", "phrase": "underage driver", "set": 1},
    {"word": "undergo", "meaning": "【動】経験する、受ける", "pos": "動", "example": "Undergo surgery.", "phrase": "undergo change", "set": 1},
    {"word": "underline", "meaning": "【動】下線を引く、強調する", "pos": "動", "example": "Underline the word.", "phrase": "underline importance", "set": 1},
    {"word": "underneath", "meaning": "【前】～の下に", "pos": "前", "example": "Underneath the bed.", "phrase": "wear underneath", "set": 1},
    {"word": "underpants", "meaning": "【名】下着（パンツ）", "pos": "名", "example": "Pair of underpants.", "phrase": "men's underpants", "set": 1},
    {"word": "undo", "meaning": "【動】元に戻す、ほどく", "pos": "動", "example": "Undo the knot.", "phrase": "undo the damage", "set": 1},
    {"word": "undress", "meaning": "【動】服を脱ぐ", "pos": "動", "example": "Undress quickly.", "phrase": "get undressed", "set": 1},
    {"word": "unemployed", "meaning": "【形】失業した", "pos": "形", "example": "Unemployed workers.", "phrase": "become unemployed", "set": 1},
    {"word": "unemployment", "meaning": "【名】失業", "pos": "名", "example": "High unemployment.", "phrase": "unemployment rate", "set": 1},
    {"word": "unexpected", "meaning": "【形】予期しない", "pos": "形", "example": "Unexpected guest.", "phrase": "unexpected result", "set": 1},
    {"word": "unexpectedly", "meaning": "【副】思いがけなく", "pos": "副", "example": "Arrive unexpectedly.", "phrase": "unexpectedly good", "set": 1},
    {"word": "unfairly", "meaning": "【副】不当に", "pos": "副", "example": "Treated unfairly.", "phrase": "dismissed unfairly", "set": 1},
    {"word": "unfit", "meaning": "【形】不適当な、健康でない", "pos": "形", "example": "Unfit for consumption.", "phrase": "physically unfit", "set": 1},
    {"word": "unfold", "meaning": "【動】広げる、展開する", "pos": "動", "example": "Unfold the map.", "phrase": "story unfolds", "set": 1},
    {"word": "unfortunate", "meaning": "【形】不運な", "pos": "形", "example": "Unfortunate incident.", "phrase": "unfortunate mistake", "set": 1},
    {"word": "unfriendly", "meaning": "【形】愛想の悪い", "pos": "形", "example": "Unfriendly attitude.", "phrase": "unfriendly look", "set": 1},
    {"word": "unheard", "meaning": "【形】聞かれない、前代未聞の", "pos": "形", "example": "Go unheard.", "phrase": "unheard of", "set": 1},
    {"word": "unify", "meaning": "【動】統一する", "pos": "動", "example": "Unify the country.", "phrase": "unify efforts", "set": 1},
    {"word": "uninterested", "meaning": "【形】無関心な", "pos": "形", "example": "Uninterested in politics.", "phrase": "seem uninterested", "set": 1},
    {"word": "uninteresting", "meaning": "【形】面白くない", "pos": "形", "example": "Uninteresting book.", "phrase": "find it uninteresting", "set": 1},
    {"word": "union", "meaning": "【名】組合、結合", "pos": "名", "example": "Trade union.", "phrase": "European Union", "set": 1},
    {"word": "unique", "meaning": "【形】独特の", "pos": "形", "example": "Unique opportunity.", "phrase": "unique to", "set": 1},
    {"word": "unite", "meaning": "【動】団結する", "pos": "動", "example": "Unite against.", "phrase": "workers unite", "set": 1},
    {"word": "universe", "meaning": "【名】宇宙", "pos": "名", "example": "Center of the universe.", "phrase": "mysteries of the universe", "set": 1},
    {"word": "unless", "meaning": "【接】～でない限り", "pos": "接", "example": "Unless you try.", "phrase": "not unless", "set": 1}
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
