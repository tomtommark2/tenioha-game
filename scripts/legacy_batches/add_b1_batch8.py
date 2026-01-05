
import json
import re
import os

# B1 Batch 8 (Words 851-1000, "few" to "graph")
new_words = [
    {"word": "few", "meaning": "【代】少数", "pos": "代", "example": "A few of them.", "phrase": "quite a few", "set": 1},
    {"word": "fifth", "meaning": "【名】5番目、5分の1", "pos": "名", "example": "The fifth of May.", "phrase": "one fifth", "set": 1},
    {"word": "fight", "meaning": "【動】戦う", "pos": "動", "example": "Fight for freedom.", "phrase": "fight with", "set": 1},
    {"word": "filling", "meaning": "【名】詰め物", "pos": "名", "example": "Sandwich filling.", "phrase": "filling station", "set": 1},
    {"word": "film", "meaning": "【動】撮影する", "pos": "動", "example": "Film a movie.", "phrase": "film crew", "set": 1},
    {"word": "film-maker", "meaning": "【名】映画製作者", "pos": "名", "example": "A famous film-maker.", "phrase": "documentary film-maker", "set": 1},
    {"word": "filter", "meaning": "【名】フィルター", "pos": "名", "example": "Coffee filter.", "phrase": "filter paper", "set": 1},
    {"word": "finance", "meaning": "【動】融資する", "pos": "動", "example": "Finance a project.", "phrase": "finance the cost", "set": 1},
    {"word": "financial", "meaning": "【形】財政上の", "pos": "形", "example": "Financial crisis.", "phrase": "financial support", "set": 1},
    {"word": "finding", "meaning": "【名】発見、結果", "pos": "名", "example": "The findings of the study.", "phrase": "key finding", "set": 1},
    {"word": "fine", "meaning": "【名】罰金", "pos": "名", "example": "Pay a parking fine.", "phrase": "heavy fine", "set": 1},
    {"word": "finger", "meaning": "【名】指", "pos": "名", "example": "Point a finger.", "phrase": "little finger", "set": 1},
    {"word": "fire station", "meaning": "【名】消防署", "pos": "名", "example": "The fire station is nearby.", "phrase": "local fire station", "set": 1},
    {"word": "firefighter", "meaning": "【名】消防士", "pos": "名", "example": "He is a firefighter.", "phrase": "brave firefighter", "set": 1},
    {"word": "firework", "meaning": "【名】花火", "pos": "名", "example": "Watch the fireworks.", "phrase": "firework display", "set": 1},
    {"word": "firm", "meaning": "【形】堅い", "pos": "形", "example": "A firm mattress.", "phrase": "firm belief", "set": 1},
    {"word": "firm", "meaning": "【名】会社", "pos": "名", "example": "A law firm.", "phrase": "consulting firm", "set": 1},
    {"word": "firmly", "meaning": "【副】堅く", "pos": "副", "example": "Hold firmly.", "phrase": "believe firmly", "set": 1},
    {"word": "first floor", "meaning": "【名】1階（英では2階）", "pos": "名", "example": "It's on the first floor.", "phrase": "ground floor and first floor", "set": 1},
    {"word": "first lady", "meaning": "【名】大統領夫人", "pos": "名", "example": "The First Lady gave a speech.", "phrase": "former First Lady", "set": 1},
    {"word": "first-floor", "meaning": "【形】1階の", "pos": "形", "example": "First-floor apartment.", "phrase": "first-floor window", "set": 1},
    {"word": "fish", "meaning": "【動】釣りをする", "pos": "動", "example": "Fish in the river.", "phrase": "fish for", "set": 1},
    {"word": "fit", "meaning": "【動】合う", "pos": "動", "example": "The dress fits well.", "phrase": "fit perfectly", "set": 1},
    {"word": "fitness", "meaning": "【名】健康、適合性", "pos": "名", "example": "Physical fitness.", "phrase": "fitness center", "set": 1},
    {"word": "fix", "meaning": "【動】修理する、固定する", "pos": "動", "example": "Fix the car.", "phrase": "fix a date", "set": 1},
    {"word": "flash", "meaning": "【形】派手な", "pos": "形", "example": "A flash car.", "phrase": "flash clothes", "set": 1},
    {"word": "flat", "meaning": "【形】平らな", "pos": "形", "example": "Flat surface.", "phrase": "flat tire", "set": 1},
    {"word": "flavor", "meaning": "【名】風味（米）", "pos": "名", "example": "Vanilla flavor.", "phrase": "artificial flavor", "set": 1},
    {"word": "flavour", "meaning": "【名】風味", "pos": "名", "example": "Strong flavour.", "phrase": "add flavour", "set": 1},
    {"word": "float", "meaning": "【動】浮く", "pos": "動", "example": "Wood floats on water.", "phrase": "float in the air", "set": 1},
    {"word": "flock", "meaning": "【名】群れ", "pos": "名", "example": "A flock of birds.", "phrase": "flock of sheep", "set": 1},
    {"word": "flood", "meaning": "【動】氾濫する、殺到する", "pos": "動", "example": "The river flooded.", "phrase": "flood the market", "set": 1},
    {"word": "flow", "meaning": "【名】流れ", "pos": "名", "example": "The flow of the river.", "phrase": "flow chart", "set": 1},
    {"word": "flow", "meaning": "【動】流れる", "pos": "動", "example": "Water flows downhill.", "phrase": "flow freely", "set": 1},
    {"word": "flu", "meaning": "【名】インフルエンザ", "pos": "名", "example": "Catch the flu.", "phrase": "flu shot", "set": 1},
    {"word": "fluent", "meaning": "【形】流暢な", "pos": "形", "example": "Fluent English.", "phrase": "fluent speaker", "set": 1},
    {"word": "fluently", "meaning": "【副】流暢に", "pos": "副", "example": "Speak fluently.", "phrase": "speak English fluently", "set": 1},
    {"word": "flunk", "meaning": "【動】落第する", "pos": "動", "example": "Flunk a test.", "phrase": "flunk out", "set": 1},
    {"word": "flute", "meaning": "【名】フルート", "pos": "名", "example": "Play the flute.", "phrase": "flute player", "set": 1},
    {"word": "fold", "meaning": "【名】折り目", "pos": "名", "example": "A neat fold.", "phrase": "fold line", "set": 1},
    {"word": "fold", "meaning": "【動】折る、畳む", "pos": "動", "example": "Fold the paper.", "phrase": "fold your arms", "set": 1},
    {"word": "folk", "meaning": "【名】人々", "pos": "名", "example": "Country folk.", "phrase": "folk music", "set": 1},
    {"word": "fond", "meaning": "【形】好んで", "pos": "形", "example": "Fond of music.", "phrase": "be fond of", "set": 1},
    {"word": "fondness", "meaning": "【名】愛着", "pos": "名", "example": "Fondness for chocolate.", "phrase": "have a fondness for", "set": 1},
    {"word": "fool", "meaning": "【動】だます", "pos": "動", "example": "Don't be fooled.", "phrase": "fool around", "set": 1},
    {"word": "foolish", "meaning": "【形】愚かな", "pos": "形", "example": "A foolish mistake.", "phrase": "don't be foolish", "set": 1},
    {"word": "foot", "meaning": "【名】足、フィート", "pos": "名", "example": "My feet hurt.", "phrase": "on foot", "set": 1},
    {"word": "forbidden", "meaning": "【形】禁じられた", "pos": "形", "example": "Forbidden fruit.", "phrase": "strictly forbidden", "set": 1},
    {"word": "forecast", "meaning": "【名】予報", "pos": "名", "example": "Weather forecast.", "phrase": "economic forecast", "set": 1},
    {"word": "forehead", "meaning": "【名】額", "pos": "名", "example": "Wipe your forehead.", "phrase": "high forehead", "set": 1},
    {"word": "forgive", "meaning": "【動】許す", "pos": "動", "example": "Forgive me.", "phrase": "forgive and forget", "set": 1},
    {"word": "form", "meaning": "【動】形作る", "pos": "動", "example": "Form a circle.", "phrase": "form an opinion", "set": 1},
    {"word": "formal", "meaning": "【形】正式な", "pos": "形", "example": "Formal dress.", "phrase": "formal education", "set": 1},
    {"word": "formally", "meaning": "【副】正式に", "pos": "副", "example": "Dress formally.", "phrase": "formally introduce", "set": 1},
    {"word": "format", "meaning": "【名】形式", "pos": "名", "example": "File format.", "phrase": "pdf format", "set": 1},
    {"word": "format", "meaning": "【動】初期化する", "pos": "動", "example": "Format the disk.", "phrase": "re-format", "set": 1},
    {"word": "former", "meaning": "【形】前の", "pos": "形", "example": "Former president.", "phrase": "the former", "set": 1},
    {"word": "formula", "meaning": "【名】公式", "pos": "名", "example": "Mathematical formula.", "phrase": "formula one", "set": 1},
    {"word": "forth", "meaning": "【副】外へ、前方へ", "pos": "副", "example": "Back and forth.", "phrase": "go forth", "set": 1},
    {"word": "fortnight", "meaning": "【名】2週間", "pos": "名", "example": "Stay for a fortnight.", "phrase": "in a fortnight", "set": 1},
    {"word": "fortunate", "meaning": "【形】幸運な", "pos": "形", "example": "You are fortunate.", "phrase": "fortunate enough to", "set": 1},
    {"word": "foundation", "meaning": "【名】基礎、財団", "pos": "名", "example": "Lay the foundation.", "phrase": "foundation course", "set": 1},
    {"word": "fountain", "meaning": "【名】噴水", "pos": "名", "example": "Drinking fountain.", "phrase": "fountain pen", "set": 1},
    {"word": "fragment", "meaning": "【名】破片", "pos": "名", "example": "A fragment of glass.", "phrase": "fragment of memory", "set": 1},
    {"word": "freely", "meaning": "【副】自由に", "pos": "副", "example": "Speak freely.", "phrase": "move freely", "set": 1},
    {"word": "freezer", "meaning": "【名】冷凍庫", "pos": "名", "example": "Put it in the freezer.", "phrase": "deep freezer", "set": 1},
    {"word": "freezing", "meaning": "【形】凍るような", "pos": "形", "example": "It's freezing outside.", "phrase": "freezing point", "set": 1},
    {"word": "frequency", "meaning": "【名】頻度、周波数", "pos": "名", "example": "High frequency.", "phrase": "frequency of", "set": 1},
    {"word": "frequent", "meaning": "【形】頻繁な", "pos": "形", "example": "Frequent traveler.", "phrase": "frequent visits", "set": 1},
    {"word": "frequently", "meaning": "【副】頻繁に", "pos": "副", "example": "Visit frequently.", "phrase": "occur frequently", "set": 1},
    {"word": "freshman", "meaning": "【名】新入生（米）", "pos": "名", "example": "College freshman.", "phrase": "freshman year", "set": 1},
    {"word": "friendliness", "meaning": "【名】親しみやすさ", "pos": "名", "example": "Her friendliness made me welcome.", "phrase": "act with friendliness", "set": 1},
    {"word": "fright", "meaning": "【名】恐怖", "pos": "名", "example": "Die of fright.", "phrase": "stage fright", "set": 1},
    {"word": "frost", "meaning": "【名】霜", "pos": "名", "example": "Ground frost.", "phrase": "jack frost", "set": 1},
    {"word": "frozen", "meaning": "【形】冷凍の", "pos": "形", "example": "Frozen food.", "phrase": "frozen yogurt", "set": 1},
    {"word": "frustrated", "meaning": "【形】欲求不満の", "pos": "形", "example": "Feel frustrated.", "phrase": "become frustrated", "set": 1},
    {"word": "frustration", "meaning": "【名】欲求不満", "pos": "名", "example": "Vent one's frustration.", "phrase": "grow in frustration", "set": 1},
    {"word": "fry", "meaning": "【動】油で揚げる、炒める", "pos": "動", "example": "Fry an egg.", "phrase": "fry pan", "set": 1},
    {"word": "frying pan", "meaning": "【名】フライパン", "pos": "名", "example": "Non-stick frying pan.", "phrase": "out of the frying pan", "set": 1},
    {"word": "fuel", "meaning": "【名】燃料", "pos": "名", "example": "Fossil fuel.", "phrase": "add fuel to the fire", "set": 1},
    {"word": "full stop", "meaning": "【名】終止符（ピリオド）", "pos": "名", "example": "Put a full stop.", "phrase": "come to a full stop", "set": 1},
    {"word": "full-time", "meaning": "【形】常勤の", "pos": "形", "example": "Full-time job.", "phrase": "full-time student", "set": 1},
    {"word": "full-time", "meaning": "【副】常勤で", "pos": "副", "example": "Work full-time.", "phrase": "employed full-time", "set": 1},
    {"word": "function", "meaning": "【名】機能、行事", "pos": "名", "example": "The function of the heart.", "phrase": "social function", "set": 1},
    {"word": "fund", "meaning": "【名】資金", "pos": "名", "example": "Pension fund.", "phrase": "raise funds", "set": 1},
    {"word": "fund", "meaning": "【動】資金を提供する", "pos": "動", "example": "Fund a project.", "phrase": "government funded", "set": 1},
    {"word": "funeral", "meaning": "【名】葬儀", "pos": "名", "example": "Attend a funeral.", "phrase": "state funeral", "set": 1},
    {"word": "fur", "meaning": "【名】毛皮", "pos": "名", "example": "Fur coat.", "phrase": "fake fur", "set": 1},
    {"word": "furnish", "meaning": "【動】備え付ける", "pos": "動", "example": "Furnish a room.", "phrase": "fully furnished", "set": 1},
    {"word": "further", "meaning": "【副】さらに", "pos": "副", "example": "Any further questions?", "phrase": "further education", "set": 1},
    {"word": "furthermore", "meaning": "【副】その上", "pos": "副", "example": "Furthermore, it is cheap.", "phrase": "furthermore, I believe", "set": 1},
    {"word": "furthest", "meaning": "【副】最も遠くに", "pos": "副", "example": "Go furthest.", "phrase": "furthest point", "set": 1},
    {"word": "fuss", "meaning": "【名】大騒ぎ", "pos": "名", "example": "Make a fuss.", "phrase": "what's the fuss", "set": 1},
    {"word": "future", "meaning": "【形】未来の", "pos": "形", "example": "Future generations.", "phrase": "in the detailed future", "set": 1},
    {"word": "gain", "meaning": "【名】利益", "pos": "名", "example": "No pain, no gain.", "phrase": "financial gain", "set": 1},
    {"word": "gain", "meaning": "【動】得る", "pos": "動", "example": "Gain weight.", "phrase": "gain access", "set": 1},
    {"word": "gall", "meaning": "【名】厚かましさ、胆汁", "pos": "名", "example": "Have the gall to ask.", "phrase": "bitter as gall", "set": 1},
    {"word": "gallon", "meaning": "【名】ガロン", "pos": "名", "example": "A gallon of milk.", "phrase": "miles per gallon", "set": 1},
    {"word": "gaol", "meaning": "【名】刑務所（英古語）", "pos": "名", "example": "Throw into gaol.", "phrase": "go to gaol", "set": 1},
    {"word": "gap", "meaning": "【名】隙間、格差", "pos": "名", "example": "Generation gap.", "phrase": "mind the gap", "set": 1},
    {"word": "gardening", "meaning": "【名】園芸", "pos": "名", "example": "Enjoy gardening.", "phrase": "landscape gardening", "set": 1},
    {"word": "garment", "meaning": "【名】衣服", "pos": "名", "example": "A strange garment.", "phrase": "garment industry", "set": 1},
    {"word": "gay", "meaning": "【形】同性愛の", "pos": "形", "example": "Gay rights.", "phrase": "gay marriage", "set": 1},
    {"word": "gee", "meaning": "【間】へえ！", "pos": "間", "example": "Gee, that's great.", "phrase": "oh gee", "set": 1},
    {"word": "gene", "meaning": "【名】遺伝子", "pos": "名", "example": "Pass on genes.", "phrase": "gene therapy", "set": 1},
    {"word": "general", "meaning": "【形】一般の", "pos": "形", "example": "General public.", "phrase": "in general", "set": 1},
    {"word": "general", "meaning": "【名】将軍", "pos": "名", "example": "Army general.", "phrase": "Major General", "set": 1},
    {"word": "generally", "meaning": "【副】一般的に", "pos": "副", "example": "Generally speaking.", "phrase": "it is generally believed", "set": 1},
    {"word": "generate", "meaning": "【動】生み出す", "pos": "動", "example": "Generate electricity.", "phrase": "generate income", "set": 1},
    {"word": "generous", "meaning": "【形】気前の良い", "pos": "形", "example": "He is generous.", "phrase": "generous donation", "set": 1},
    {"word": "genetic", "meaning": "【形】遺伝子の", "pos": "形", "example": "Genetic engineering.", "phrase": "genetic disorder", "set": 1},
    {"word": "genetically", "meaning": "【副】遺伝子的に", "pos": "副", "example": "Genetically modified.", "phrase": "genetically determined", "set": 1},
    {"word": "genetics", "meaning": "【名】遺伝学", "pos": "名", "example": "Study genetics.", "phrase": "human genetics", "set": 1},
    {"word": "gentleman", "meaning": "【名】紳士", "pos": "名", "example": "Ladies and gentlemen.", "phrase": "true gentleman", "set": 1},
    {"word": "geographical", "meaning": "【形】地理的な", "pos": "形", "example": "Geographical location.", "phrase": "geographical features", "set": 1},
    {"word": "geography", "meaning": "【名】地理", "pos": "名", "example": "Study geography.", "phrase": "physical geography", "set": 1},
    {"word": "geology", "meaning": "【名】地質学", "pos": "名", "example": "Study geology.", "phrase": "professor of geology", "set": 1},
    {"word": "gesture", "meaning": "【名】身振り", "pos": "名", "example": "Hand gesture.", "phrase": "make a gesture", "set": 1},
    {"word": "giant", "meaning": "【形】巨大な", "pos": "形", "example": "Giant panda.", "phrase": "giant step", "set": 1},
    {"word": "gifted", "meaning": "【形】才能のある", "pos": "形", "example": "Gifted child.", "phrase": "gifted with", "set": 1},
    {"word": "giggle", "meaning": "【名】くすくす笑い", "pos": "名", "example": "She gave a giggle.", "phrase": "have the giggles", "set": 1},
    {"word": "ginger", "meaning": "【名】生姜", "pos": "名", "example": "Ginger tea.", "phrase": "ginger ale", "set": 1},
    {"word": "giraffe", "meaning": "【名】キリン", "pos": "名", "example": "A tall giraffe.", "phrase": "feed the giraffe", "set": 1},
    {"word": "glance", "meaning": "【名】一瞥", "pos": "名", "example": "At a glance.", "phrase": "cast a glance", "set": 1},
    {"word": "glance", "meaning": "【動】ちらっと見る", "pos": "動", "example": "Glance at the clock.", "phrase": "glance through", "set": 1},
    {"word": "glide", "meaning": "【名】滑走", "pos": "名", "example": "Hang glide.", "phrase": "smooth glide", "set": 1},
    {"word": "glimpse", "meaning": "【名】ちらりと見えること", "pos": "名", "example": "Catch a glimpse of.", "phrase": "brief glimpse", "set": 1},
    {"word": "glint", "meaning": "【名】きらめき", "pos": "名", "example": "A glint in his eye.", "phrase": "glint of steel", "set": 1},
    {"word": "global", "meaning": "【形】世界的な", "pos": "形", "example": "Global warming.", "phrase": "global economy", "set": 1},
    {"word": "glorious", "meaning": "【形】栄光ある、素晴らしい", "pos": "形", "example": "Glorious victory.", "phrase": "glorious morning", "set": 1},
    {"word": "glory", "meaning": "【名】栄光", "pos": "名", "example": "Bask in glory.", "phrase": "blaze of glory", "set": 1},
    {"word": "go", "meaning": "【名】試み、番", "pos": "名", "example": "Have a go.", "phrase": "on the go", "set": 1},
    {"word": "goalkeeper", "meaning": "【名】ゴールキーパー", "pos": "名", "example": "The goalkeeper saved the ball.", "phrase": "good goalkeeper", "set": 1},
    {"word": "goddess", "meaning": "【名】女神", "pos": "名", "example": "Goddess of love.", "phrase": "Greek goddess", "set": 1},
    {"word": "golfer", "meaning": "【名】ゴルファー", "pos": "名", "example": "Professional golfer.", "phrase": "avid golfer", "set": 1},
    {"word": "goodness", "meaning": "【間】おやまあ", "pos": "間", "example": "Oh my goodness.", "phrase": "thank goodness", "set": 1},
    {"word": "goods", "meaning": "【名】商品", "pos": "名", "example": "Consumer goods.", "phrase": "canned goods", "set": 1},
    {"word": "gorgeous", "meaning": "【形】豪華な", "pos": "形", "example": "Gorgeous dress.", "phrase": "drop-dead gorgeous", "set": 1},
    {"word": "gorilla", "meaning": "【名】ゴリラ", "pos": "名", "example": "Mountain gorilla.", "phrase": "silverback gorilla", "set": 1},
    {"word": "gossip", "meaning": "【名】噂話", "pos": "名", "example": "Spread gossip.", "phrase": "latest gossip", "set": 1},
    {"word": "govern", "meaning": "【動】統治する", "pos": "動", "example": "Govern a country.", "phrase": "govern wisely", "set": 1},
    {"word": "governor", "meaning": "【名】知事", "pos": "名", "example": "The governor of the state.", "phrase": "state governor", "set": 1},
    {"word": "gown", "meaning": "【名】ガウン、ドレス", "pos": "名", "example": "Evening gown.", "phrase": "hospital gown", "set": 1},
    {"word": "grab", "meaning": "【動】つかむ", "pos": "動", "example": "Grab a sandwich.", "phrase": "grab attention", "set": 1},
    {"word": "graceful", "meaning": "【形】優雅な", "pos": "形", "example": "Graceful dancer.", "phrase": "graceful exit", "set": 1},
    {"word": "graduate", "meaning": "【名】卒業生", "pos": "名", "example": "University graduate.", "phrase": "graduate student", "set": 1},
    {"word": "graduation", "meaning": "【名】卒業", "pos": "名", "example": "Graduation ceremony.", "phrase": "after graduation", "set": 1},
    {"word": "grant", "meaning": "【名】助成金", "pos": "名", "example": "Research grant.", "phrase": "student grant", "set": 1},
    {"word": "grant", "meaning": "【動】与える、認める", "pos": "動", "example": "Grant permission.", "phrase": "take for granted", "set": 1},
    {"word": "graph", "meaning": "【名】グラフ", "pos": "名", "example": "Draw a graph.", "phrase": "bar graph", "set": 1}
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
