
import json
import re
import os

# B2 Batch 17 (Words 2401-2550 approx)
# CSV Lines 2401 to 2550
new_words = [
    {"word": "stink", "meaning": "【動】悪臭を放つ", "pos": "動", "example": "Stink of fish.", "phrase": "make a stink", "set": 1},
    {"word": "stitch", "meaning": "【名】一縫い、編み目", "pos": "名", "example": "Drop a stitch.", "phrase": "stitch in time", "set": 1},
    {"word": "stock", "meaning": "【名】在庫、株", "pos": "名", "example": "Out of stock.", "phrase": "stock market", "set": 1},
    {"word": "stock market", "meaning": "【名】株式市場", "pos": "名", "example": "Stock market crash.", "phrase": "invest in stock market", "set": 1},
    {"word": "stockpile", "meaning": "【名】備蓄", "pos": "名", "example": "Nuclear stockpile.", "phrase": "stockpile of food", "set": 1},
    {"word": "stonework", "meaning": "【名】石造物", "pos": "名", "example": "Ancient stonework.", "phrase": "intricate stonework", "set": 1},
    {"word": "stool", "meaning": "【名】（背のない）椅子", "pos": "名", "example": "Bar stool.", "phrase": "perch on a stool", "set": 1},
    {"word": "stopover", "meaning": "【名】一時滞在", "pos": "名", "example": "Short stopover.", "phrase": "stopover in Paris", "set": 1},
    {"word": "stopwatch", "meaning": "【名】ストップウォッチ", "pos": "名", "example": "Start the stopwatch.", "phrase": "timed by stopwatch", "set": 1},
    {"word": "store", "meaning": "【動】保管する", "pos": "動", "example": "Store in a cool place.", "phrase": "store away", "set": 1},
    {"word": "straighten", "meaning": "【動】真っ直ぐにする", "pos": "動", "example": "Straighten up.", "phrase": "straighten out", "set": 1},
    {"word": "straightforward", "meaning": "【形】率直な、簡単な", "pos": "形", "example": "Straightforward answer.", "phrase": "straightforward task", "set": 1},
    {"word": "strain", "meaning": "【動】緊張させる、痛める", "pos": "動", "example": "Strain eyes.", "phrase": "under strain", "set": 1},
    {"word": "strait", "meaning": "【名】海峡", "pos": "名", "example": "Bering Strait.", "phrase": "in dire straits", "set": 1},
    {"word": "strand", "meaning": "【名】（髪などの）房、要素", "pos": "名", "example": "Strand of hair.", "phrase": "DNA strand", "set": 1},
    {"word": "strangle", "meaning": "【動】絞め殺す", "pos": "動", "example": "Strangle a victim.", "phrase": "strangle business", "set": 1},
    {"word": "stress", "meaning": "【動】強調する", "pos": "動", "example": "Stress importance.", "phrase": "stress on", "set": 1},
    {"word": "strictly", "meaning": "【副】厳密に", "pos": "副", "example": "Strictly speaking.", "phrase": "strictly confidential", "set": 1},
    {"word": "stride", "meaning": "【動】大股で歩く", "pos": "動", "example": "Stride across room.", "phrase": "take in stride", "set": 1},
    {"word": "striking", "meaning": "【形】目立つ", "pos": "形", "example": "Striking resemblance.", "phrase": "striking feature", "set": 1},
    {"word": "strip", "meaning": "【動】脱ぐ、剥ぐ", "pos": "動", "example": "Strip off clothes.", "phrase": "strip mine", "set": 1},
    {"word": "strive", "meaning": "【動】努力する", "pos": "動", "example": "Strive for perfection.", "phrase": "strive to do", "set": 1},
    {"word": "stroke", "meaning": "【名】一撃、脳卒中", "pos": "名", "example": "Stroke of luck.", "phrase": "heat stroke", "set": 1},
    {"word": "stroke", "meaning": "【動】なでる", "pos": "動", "example": "Stroke a cat.", "phrase": "stroke hair", "set": 1},
    {"word": "struggle", "meaning": "【動】奮闘する", "pos": "動", "example": "Struggle to survive.", "phrase": "struggle against", "set": 1},
    {"word": "stubbornly", "meaning": "【副】頑固に", "pos": "副", "example": "Refused stubbornly.", "phrase": "stubbornly resist", "set": 1},
    {"word": "stuff", "meaning": "【動】詰める", "pos": "動", "example": "Stuff a turkey.", "phrase": "stuffed animal", "set": 1},
    {"word": "stylist", "meaning": "【名】スタイリスト", "pos": "名", "example": "Hair stylist.", "phrase": "personal stylist", "set": 1},
    {"word": "subcontinent", "meaning": "【名】亜大陸", "pos": "名", "example": "Indian subcontinent.", "phrase": "vast subcontinent", "set": 1},
    {"word": "subculture", "meaning": "【名】サブカルチャー", "pos": "名", "example": "Youth subculture.", "phrase": "punk subculture", "set": 1},
    {"word": "subdivision", "meaning": "【名】細分、分譲地", "pos": "名", "example": "Housing subdivision.", "phrase": "subdivision of land", "set": 1},
    {"word": "subjunctive", "meaning": "【名】仮定法", "pos": "名", "example": "Subjunctive mood.", "phrase": "use subjunctive", "set": 1},
    {"word": "submit", "meaning": "【動】提出する、服従する", "pos": "動", "example": "Submit a report.", "phrase": "submit to authority", "set": 1},
    {"word": "subplot", "meaning": "【名】サブプロット", "pos": "名", "example": "Interesting subplot.", "phrase": "romantic subplot", "set": 1},
    {"word": "subside", "meaning": "【動】静まる", "pos": "動", "example": "Storm subsided.", "phrase": "pain subsided", "set": 1},
    {"word": "substance", "meaning": "【名】物質、実質", "pos": "名", "example": "Chemical substance.", "phrase": "substance abuse", "set": 1},
    {"word": "substitute", "meaning": "【動】代用する", "pos": "動", "example": "Substitute A for B.", "phrase": "no substitute for", "set": 1},
    {"word": "subtitle", "meaning": "【名】字幕", "pos": "名", "example": "English subtitles.", "phrase": "with subtitles", "set": 1},
    {"word": "subtle", "meaning": "【形】微妙な", "pos": "形", "example": "Subtle difference.", "phrase": "subtle hint", "set": 1},
    {"word": "subtract", "meaning": "【動】引く", "pos": "動", "example": "Subtract numbers.", "phrase": "add and subtract", "set": 1},
    {"word": "suburb", "meaning": "【名】郊外", "pos": "名", "example": "Live in a suburb.", "phrase": "leafy suburb", "set": 1},
    {"word": "successive", "meaning": "【形】連続する", "pos": "形", "example": "Successive days.", "phrase": "successive governments", "set": 1},
    {"word": "suck", "meaning": "【動】吸う", "pos": "動", "example": "Suck thumb.", "phrase": "suck up", "set": 1},
    {"word": "sue", "meaning": "【動】訴える", "pos": "動", "example": "Sue for damages.", "phrase": "sue someone", "set": 1},
    {"word": "suffering", "meaning": "【名】苦しみ", "pos": "名", "example": "Ease suffering.", "phrase": "human suffering", "set": 1},
    {"word": "sufficiently", "meaning": "【副】十分に", "pos": "副", "example": "Sufficiently large.", "phrase": "recover sufficiently", "set": 1},
    {"word": "suitably", "meaning": "【副】ふさわしく", "pos": "副", "example": "Dressed suitably.", "phrase": "suitably impressed", "set": 1},
    {"word": "sulfur", "meaning": "【名】硫黄", "pos": "名", "example": "Smell of sulfur.", "phrase": "sulfur content", "set": 1},
    {"word": "sulphur", "meaning": "【名】硫黄（英）", "pos": "名", "example": "Sulphur spring.", "phrase": "burning sulphur", "set": 1},
    {"word": "sunbeam", "meaning": "【名】太陽光線", "pos": "名", "example": "Sunbeam through window.", "phrase": "catch a sunbeam", "set": 1},
    {"word": "superb", "meaning": "【形】すばらしい", "pos": "形", "example": "Superb performance.", "phrase": "superb quality", "set": 1},
    {"word": "superintendent", "meaning": "【名】監督者", "pos": "名", "example": "Building superintendent.", "phrase": "school superintendent", "set": 1},
    {"word": "supernatural", "meaning": "【形】超自然の", "pos": "形", "example": "Supernatural power.", "phrase": "supernatural event", "set": 1},
    {"word": "supervise", "meaning": "【動】監督する", "pos": "動", "example": "Supervise workers.", "phrase": "supervise exam", "set": 1},
    {"word": "supervision", "meaning": "【名】監督", "pos": "名", "example": "Under supervision.", "phrase": "strict supervision", "set": 1},
    {"word": "supervisor", "meaning": "【名】監督者", "pos": "名", "example": "Shift supervisor.", "phrase": "talk to supervisor", "set": 1},
    {"word": "supplement", "meaning": "【名】補足、付録", "pos": "名", "example": "Vitamin supplement.", "phrase": "dietary supplement", "set": 1},
    {"word": "supplier", "meaning": "【名】供給者", "pos": "名", "example": "Leading supplier.", "phrase": "water supplier", "set": 1},
    {"word": "supply", "meaning": "【動】供給する", "pos": "動", "example": "Supply goods.", "phrase": "supply chain", "set": 1},
    {"word": "suppress", "meaning": "【動】抑圧する", "pos": "動", "example": "Suppress a cough.", "phrase": "suppress anger", "set": 1},
    {"word": "surge", "meaning": "【名】急増、うねり", "pos": "名", "example": "Power surge.", "phrase": "surge in demand", "set": 1},
    {"word": "surrender", "meaning": "【動】降伏する", "pos": "動", "example": "Surrender weapons.", "phrase": "surrender to", "set": 1},
    {"word": "surroundings", "meaning": "【名】環境", "pos": "名", "example": "Natural surroundings.", "phrase": "familiar surroundings", "set": 1},
    {"word": "surveillance", "meaning": "【名】監視", "pos": "名", "example": "Under surveillance.", "phrase": "surveillance camera", "set": 1},
    {"word": "suspect", "meaning": "【動】疑う", "pos": "動", "example": "Suspect foul play.", "phrase": "suspect him of", "set": 1},
    {"word": "suspend", "meaning": "【動】一時停止する、吊るす", "pos": "動", "example": "Suspend a license.", "phrase": "suspend belief", "set": 1},
    {"word": "suspicious", "meaning": "【形】疑わしい", "pos": "形", "example": "Suspicious activity.", "phrase": "be suspicious of", "set": 1},
    {"word": "suspiciously", "meaning": "【副】疑わしげに", "pos": "副", "example": "Act suspiciously.", "phrase": "look suspiciously", "set": 1},
    {"word": "sustain", "meaning": "【動】維持する", "pos": "動", "example": "Sustain injury.", "phrase": "sustainable development", "set": 1},
    {"word": "swan", "meaning": "【名】白鳥", "pos": "名", "example": "Graceful swan.", "phrase": "black swan", "set": 1},
    {"word": "sweep", "meaning": "【動】掃く", "pos": "動", "example": "Sweep the floor.", "phrase": "clean sweep", "set": 1},
    {"word": "swift", "meaning": "【形】素早い", "pos": "形", "example": "Swift action.", "phrase": "swift response", "set": 1},
    {"word": "swing", "meaning": "【名】ブランコ、揺れ", "pos": "名", "example": "Mood swing.", "phrase": "swing set", "set": 1},
    {"word": "swing", "meaning": "【動】揺れる", "pos": "動", "example": "Swing arms.", "phrase": "swing by", "set": 1},
    {"word": "syllable", "meaning": "【名】音節", "pos": "名", "example": "Three syllables.", "phrase": "stress a syllable", "set": 1},
    {"word": "symbolic", "meaning": "【形】象徴的な", "pos": "形", "example": "Symbolic gesture.", "phrase": "symbolic meaning", "set": 1},
    {"word": "sympathetic", "meaning": "【形】同情的な", "pos": "形", "example": "Sympathetic ear.", "phrase": "sympathetic to", "set": 1},
    {"word": "sympathise", "meaning": "【動】同情する（英）", "pos": "動", "example": "Sympathise with victim.", "phrase": "sympathise with cause", "set": 1},
    {"word": "sympathize", "meaning": "【動】同情する", "pos": "動", "example": "Sympathize with.", "phrase": "deeply sympathize", "set": 1},
    {"word": "synonym", "meaning": "【名】同義語", "pos": "名", "example": "Synonym for sad.", "phrase": "antonym and synonym", "set": 1},
    {"word": "tablecloth", "meaning": "【名】テーブルクロス", "pos": "名", "example": "White tablecloth.", "phrase": "lay the tablecloth", "set": 1},
    {"word": "tabloid", "meaning": "【形】タブロイド判の", "pos": "形", "example": "Tabloid press.", "phrase": "tabloid journalism", "set": 1},
    {"word": "tabloid", "meaning": "【名】タブロイド紙", "pos": "名", "example": "Read a tabloid.", "phrase": "tabloid headline", "set": 1},
    {"word": "tack", "meaning": "【動】鋲で留める、方針を変える", "pos": "動", "example": "Tack it up.", "phrase": "change tack", "set": 1},
    {"word": "tackle", "meaning": "【動】取り組む", "pos": "動", "example": "Tackle a problem.", "phrase": "tackle hard", "set": 1},
    {"word": "tactile", "meaning": "【形】触覚の", "pos": "形", "example": "Tactile sensation.", "phrase": "tactile learner", "set": 1},
    {"word": "tag", "meaning": "【名】札、鬼ごっこ", "pos": "名", "example": "Price tag.", "phrase": "play tag", "set": 1},
    {"word": "tail", "meaning": "【名】尻尾", "pos": "名", "example": "Wag tail.", "phrase": "tail end", "set": 1},
    {"word": "tame", "meaning": "【形】飼いならされた", "pos": "形", "example": "Tame animal.", "phrase": "tame lion", "set": 1},
    {"word": "tan", "meaning": "【名】日焼け", "pos": "名", "example": "Get a tan.", "phrase": "suntan lotion", "set": 1},
    {"word": "tanned", "meaning": "【形】日焼けした", "pos": "形", "example": "Tanned skin.", "phrase": "get tanned", "set": 1},
    {"word": "tap", "meaning": "【動】軽く叩く、蛇口", "pos": "動", "example": "Tap on shoulder.", "phrase": "tap water", "set": 1},
    {"word": "tatter", "meaning": "【名】ぼろきれ", "pos": "名", "example": "In tatters.", "phrase": "torn to tatters", "set": 1},
    {"word": "tattoo", "meaning": "【名】タトゥー", "pos": "名", "example": "Get a tattoo.", "phrase": "tattoo artist", "set": 1},
    {"word": "taunt", "meaning": "【名】あざけり", "pos": "名", "example": "Ignore taunts.", "phrase": "taunt someone", "set": 1},
    {"word": "tease", "meaning": "【動】からかう", "pos": "動", "example": "Tease a friend.", "phrase": "tease hair", "set": 1},
    {"word": "teaspoon", "meaning": "【名】小さじ", "pos": "名", "example": "Teaspoon of sugar.", "phrase": "silver teaspoon", "set": 1},
    {"word": "technical", "meaning": "【形】技術的な", "pos": "形", "example": "Technical support.", "phrase": "technical difficulty", "set": 1},
    {"word": "technically", "meaning": "【副】厳密には、技術的に", "pos": "副", "example": "Technically speaking.", "phrase": "technically possible", "set": 1},
    {"word": "telescope", "meaning": "【名】望遠鏡", "pos": "名", "example": "Look through telescope.", "phrase": "Hubble telescope", "set": 1},
    {"word": "temperate", "meaning": "【形】穏やかな", "pos": "形", "example": "Temperate climate.", "phrase": "temperate zone", "set": 1},
    {"word": "temporarily", "meaning": "【副】一時的に", "pos": "副", "example": "Closed temporarily.", "phrase": "temporarily unavailable", "set": 1},
    {"word": "temptation", "meaning": "【名】誘惑", "pos": "名", "example": "Resist temptation.", "phrase": "fall into temptation", "set": 1},
    {"word": "tender", "meaning": "【形】優しい、柔らかい", "pos": "形", "example": "Tender loving care.", "phrase": "tender meat", "set": 1},
    {"word": "tenderly", "meaning": "【副】優しく", "pos": "副", "example": "Kiss tenderly.", "phrase": "hold tenderly", "set": 1},
    {"word": "tenderness", "meaning": "【名】優しさ", "pos": "名", "example": "Show tenderness.", "phrase": "tenderness of heart", "set": 1},
    {"word": "terrace", "meaning": "【名】テラス", "pos": "名", "example": "Roof terrace.", "phrase": "rice terrace", "set": 1},
    {"word": "terrifying", "meaning": "【形】恐ろしい", "pos": "形", "example": "Terrifying experience.", "phrase": "terrifying thought", "set": 1},
    {"word": "territory", "meaning": "【名】領土", "pos": "名", "example": "Enemy territory.", "phrase": "marking territory", "set": 1},
    {"word": "test", "meaning": "【動】試験する", "pos": "動", "example": "Test the water.", "phrase": "test drive", "set": 1},
    {"word": "testify", "meaning": "【動】証言する", "pos": "動", "example": "Testify in court.", "phrase": "testify against", "set": 1},
    {"word": "testimony", "meaning": "【名】証言", "pos": "名", "example": "Give testimony.", "phrase": "false testimony", "set": 1},
    {"word": "that", "meaning": "【副】それほど", "pos": "副", "example": "Not that big.", "phrase": "is it that hard", "set": 1},
    {"word": "theme", "meaning": "【名】主題", "pos": "名", "example": "Main theme.", "phrase": "theme park", "set": 1},
    {"word": "theorist", "meaning": "【名】理論家", "pos": "名", "example": "Political theorist.", "phrase": "conspiracy theorist", "set": 1},
    {"word": "therapist", "meaning": "【名】療法士", "pos": "名", "example": "Physical therapist.", "phrase": "speech therapist", "set": 1},
    {"word": "therapy", "meaning": "【名】療法", "pos": "名", "example": "Group therapy.", "phrase": "art therapy", "set": 1},
    {"word": "thereafter", "meaning": "【副】その後", "pos": "副", "example": "Shortly thereafter.", "phrase": "and thereafter", "set": 1},
    {"word": "thermometer", "meaning": "【名】温度計", "pos": "名", "example": "Read the thermometer.", "phrase": "digital thermometer", "set": 1},
    {"word": "thesis", "meaning": "【名】論文、命題", "pos": "名", "example": "Master's thesis.", "phrase": "write a thesis", "set": 1},
    {"word": "thickly", "meaning": "【副】厚く", "pos": "副", "example": "Apply thickly.", "phrase": "thickly wooded", "set": 1},
    {"word": "thickness", "meaning": "【名】厚さ", "pos": "名", "example": "Varying thickness.", "phrase": "thickness of ice", "set": 1},
    {"word": "thigh", "meaning": "【名】太もも", "pos": "名", "example": "Chicken thigh.", "phrase": "inner thigh", "set": 1},
    {"word": "thinker", "meaning": "【名】思想家", "pos": "名", "example": "Great thinker.", "phrase": "independent thinker", "set": 1},
    {"word": "third person", "meaning": "【名】三人称", "pos": "名", "example": "Third person perspective.", "phrase": "in third person", "set": 1},
    {"word": "thirdly", "meaning": "【副】第三に", "pos": "副", "example": "And thirdly.", "phrase": "secondly and thirdly", "set": 1},
    {"word": "thirst", "meaning": "【名】渇き", "pos": "名", "example": "Quench thirst.", "phrase": "thirst for knowledge", "set": 1},
    {"word": "thoroughly", "meaning": "【副】徹底的に", "pos": "副", "example": "Wash thoroughly.", "phrase": "thoroughly enjoy", "set": 1},
    {"word": "though", "meaning": "【副】でも（文末で）", "pos": "副", "example": "Thanks though.", "phrase": "looks nice though", "set": 1},
    {"word": "thoughtful", "meaning": "【形】思いやりのある", "pos": "形", "example": "Thoughtful gift.", "phrase": "thoughtful person", "set": 1},
    {"word": "thoughtless", "meaning": "【形】軽率な", "pos": "形", "example": "Thoughtless remark.", "phrase": "thoughtless action", "set": 1},
    {"word": "thread", "meaning": "【名】糸", "pos": "名", "example": "Needle and thread.", "phrase": "lose the thread", "set": 1},
    {"word": "threaten", "meaning": "【動】脅す", "pos": "動", "example": "Threaten to leave.", "phrase": "threaten with", "set": 1},
    {"word": "thrill", "meaning": "【名】スリル", "pos": "名", "example": "Cheap thrill.", "phrase": "thrill of victory", "set": 1},
    {"word": "thrilled", "meaning": "【形】ワクワクした", "pos": "形", "example": "Thrilled to hear.", "phrase": "thrilled about", "set": 1},
    {"word": "thrilling", "meaning": "【形】ワクワクさせる", "pos": "形", "example": "Thrilling match.", "phrase": "thrilling experience", "set": 1},
    {"word": "throat", "meaning": "【名】喉", "pos": "名", "example": "Sore throat.", "phrase": "clear throat", "set": 1},
    {"word": "tickle", "meaning": "【動】くすぐる", "pos": "動", "example": "Tickle feet.", "phrase": "tickle pink", "set": 1},
    {"word": "tight", "meaning": "【副】堅く", "pos": "副", "example": "Hold tight.", "phrase": "sleep tight", "set": 1},
    {"word": "tightrope", "meaning": "【名】綱渡りの綱", "pos": "名", "example": "Walk a tightrope.", "phrase": "political tightrope", "set": 1},
    {"word": "time", "meaning": "【動】時間を計る", "pos": "動", "example": "Time the race.", "phrase": "time is up", "set": 1},
    {"word": "timeless", "meaning": "【形】時代を超越した", "pos": "形", "example": "Timeless beauty.", "phrase": "timeless classic", "set": 1},
    {"word": "timeliness", "meaning": "【名】タイムリーさ", "pos": "名", "example": "Appreciate timeliness.", "phrase": "timeliness of data", "set": 1},
    {"word": "times", "meaning": "【前】掛ける（～倍）", "pos": "前", "example": "Three times four.", "phrase": "ten times", "set": 1},
    {"word": "timing", "meaning": "【名】タイミング", "pos": "名", "example": "Perfect timing.", "phrase": "bad timing", "set": 1},
    {"word": "tip", "meaning": "【動】傾ける、チップをやる", "pos": "動", "example": "Tip the waiter.", "phrase": "tip over", "set": 1},
    {"word": "tiptoe", "meaning": "【動】つま先で歩く", "pos": "動", "example": "Tiptoe across.", "phrase": "stand on tiptoe", "set": 1},
    {"word": "tiredness", "meaning": "【名】疲労", "pos": "名", "example": "Overcome tiredness.", "phrase": "chronic tiredness", "set": 1},
    {"word": "tiresome", "meaning": "【形】退屈な", "pos": "形", "example": "Tiresome chore.", "phrase": "tiresome person", "set": 1},
    {"word": "toenail", "meaning": "【名】足の爪", "pos": "名", "example": "Cut toenails.", "phrase": "ingrown toenail", "set": 1},
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
