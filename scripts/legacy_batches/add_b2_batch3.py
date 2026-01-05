
import json
import re
import os

# B2 Batch 3 (Words 301-450 approx)
# CSV Lines 301 to 450
new_words = [
    {"word": "buzz", "meaning": "【名】ブーンという音、噂", "pos": "名", "example": "Buzz of conversation.", "phrase": "give someone a buzz", "set": 1},
    {"word": "buzz", "meaning": "【動】ブーンと鳴る", "pos": "動", "example": "Bees buzz.", "phrase": "buzz off", "set": 1},
    {"word": "cabinet", "meaning": "【名】飾り棚、内閣", "pos": "名", "example": "Kitchen cabinet.", "phrase": "cabinet minister", "set": 1},
    {"word": "cable", "meaning": "【名】ケーブル", "pos": "名", "example": "Fiber optic cable.", "phrase": "cable TV", "set": 1},
    {"word": "calmly", "meaning": "【副】穏やかに", "pos": "副", "example": "Speak calmly.", "phrase": "react calmly", "set": 1},
    {"word": "campaign", "meaning": "【名】キャンペーン、運動", "pos": "名", "example": "Election campaign.", "phrase": "launch a campaign", "set": 1},
    {"word": "candidate", "meaning": "【名】候補者", "pos": "名", "example": "Presidential candidate.", "phrase": "suitable candidate", "set": 1},
    {"word": "cane", "meaning": "【名】杖", "pos": "名", "example": "Walk with a cane.", "phrase": "sugar cane", "set": 1},
    {"word": "cannonball", "meaning": "【名】砲弾", "pos": "名", "example": "Fired a cannonball.", "phrase": "heavy cannonball", "set": 1},
    {"word": "canon", "meaning": "【名】規範、正典", "pos": "名", "example": "Literary canon.", "phrase": "canon law", "set": 1},
    {"word": "capability", "meaning": "【名】能力", "pos": "名", "example": "Military capability.", "phrase": "have the capability", "set": 1},
    {"word": "caption", "meaning": "【名】説明文、字幕", "pos": "名", "example": "Read the caption.", "phrase": "photo caption", "set": 1},
    {"word": "captive", "meaning": "【名】捕虜", "pos": "名", "example": "Held captive.", "phrase": "captive audience", "set": 1},
    {"word": "caravan", "meaning": "【名】キャラバン、移動住宅", "pos": "名", "example": "Travel in a caravan.", "phrase": "camel caravan", "set": 1},
    {"word": "carbon", "meaning": "【名】炭素", "pos": "名", "example": "Carbon atom.", "phrase": "carbon copy", "set": 1},
    {"word": "carbon dioxide", "meaning": "【名】二酸化炭素", "pos": "名", "example": "Emit carbon dioxide.", "phrase": "carbon dioxide levels", "set": 1},
    {"word": "carbon footprint", "meaning": "【名】二酸化炭素排出量", "pos": "名", "example": "Reduce carbon footprint.", "phrase": "calculate carbon footprint", "set": 1},
    {"word": "carbon monoxide", "meaning": "【名】一酸化炭素", "pos": "名", "example": "Carbon monoxide poisoning.", "phrase": "detect carbon monoxide", "set": 1},
    {"word": "cardboard", "meaning": "【名】段ボール", "pos": "名", "example": "Cardboard box.", "phrase": "piece of cardboard", "set": 1},
    {"word": "cardigan", "meaning": "【名】カーディガン", "pos": "名", "example": "Wool cardigan.", "phrase": "wear a cardigan", "set": 1},
    {"word": "carefree", "meaning": "【形】のんきな", "pos": "形", "example": "Carefree childhood.", "phrase": "carefree attitude", "set": 1},
    {"word": "caring", "meaning": "【形】思いやりのある", "pos": "形", "example": "Caring nature.", "phrase": "caring profession", "set": 1},
    {"word": "carnival", "meaning": "【名】カーニバル、謝肉祭", "pos": "名", "example": "Rio carnival.", "phrase": "carnival atmosphere", "set": 1},
    {"word": "carpool", "meaning": "【名】相乗り", "pos": "名", "example": "Join a carpool.", "phrase": "carpool lane", "set": 1},
    {"word": "carve", "meaning": "【動】彫る、切り分ける", "pos": "動", "example": "Carve a statue.", "phrase": "carve out a niche", "set": 1},
    {"word": "cascade", "meaning": "【名】小滝", "pos": "名", "example": "Water cascade.", "phrase": "cascade effect", "set": 1},
    {"word": "cast", "meaning": "【名】配役、ギプス", "pos": "名", "example": "Cast of the movie.", "phrase": "in a cast", "set": 1},
    {"word": "cast", "meaning": "【動】投げる、配役する", "pos": "動", "example": "Cast a spell.", "phrase": "cast a vote", "set": 1},
    {"word": "casually", "meaning": "【副】何気なく", "pos": "副", "example": "Dress casually.", "phrase": "mention casually", "set": 1},
    {"word": "catalog", "meaning": "【名】カタログ", "pos": "名", "example": "Product catalog.", "phrase": "order from catalog", "set": 1},
    {"word": "catalogue", "meaning": "【名】カタログ（英）", "pos": "名", "example": "Mail order catalogue.", "phrase": "library catalogue", "set": 1},
    {"word": "catalyst", "meaning": "【名】触媒、きっかけ", "pos": "名", "example": "Catalyst for change.", "phrase": "act as a catalyst", "set": 1},
    {"word": "catastrophe", "meaning": "【名】大惨事", "pos": "名", "example": "Natural catastrophe.", "phrase": "avoid catastrophe", "set": 1},
    {"word": "catastrophic", "meaning": "【形】壊滅的な", "pos": "形", "example": "Catastrophic failure.", "phrase": "catastrophic effect", "set": 1},
    {"word": "catchy", "meaning": "【形】覚えやすい", "pos": "形", "example": "Catchy tune.", "phrase": "catchy slogan", "set": 1},
    {"word": "categorisation", "meaning": "【名】分類（英）", "pos": "名", "example": "Categorisation of data.", "phrase": "system of categorisation", "set": 1},
    {"word": "categorization", "meaning": "【名】分類", "pos": "名", "example": "Categorization of species.", "phrase": "automatic categorization", "set": 1},
    {"word": "catering", "meaning": "【名】仕出し、ケータリング", "pos": "名", "example": "Catering service.", "phrase": "wedding catering", "set": 1},
    {"word": "cathedral", "meaning": "【名】大聖堂", "pos": "名", "example": "Gothic cathedral.", "phrase": "visit the cathedral", "set": 1},
    {"word": "cause", "meaning": "【名】原因、大義", "pos": "名", "example": "Cause of the fire.", "phrase": "good cause", "set": 1},
    {"word": "cease", "meaning": "【動】やめる、終わる", "pos": "動", "example": "Cease fire.", "phrase": "cease to exist", "set": 1},
    {"word": "ceiling", "meaning": "【名】天井", "pos": "名", "example": "High ceiling.", "phrase": "glass ceiling", "set": 1},
    {"word": "cellar", "meaning": "【名】地下室", "pos": "名", "example": "Wine cellar.", "phrase": "dark cellar", "set": 1},
    {"word": "cellist", "meaning": "【名】チェロ奏者", "pos": "名", "example": "Famous cellist.", "phrase": "solo cellist", "set": 1},
    {"word": "cello", "meaning": "【名】チェロ", "pos": "名", "example": "Play the cello.", "phrase": "cello concerto", "set": 1},
    {"word": "cemetery", "meaning": "【名】墓地", "pos": "名", "example": "Buried in the cemetery.", "phrase": "cemetery gates", "set": 1},
    {"word": "centigrade", "meaning": "【名】摂氏", "pos": "名", "example": "20 degrees centigrade.", "phrase": "centigrade scale", "set": 1},
    {"word": "certificate", "meaning": "【名】証明書", "pos": "名", "example": "Birth certificate.", "phrase": "gift certificate", "set": 1},
    {"word": "certification", "meaning": "【名】証明、検定", "pos": "名", "example": "Professional certification.", "phrase": "certification exam", "set": 1},
    {"word": "certify", "meaning": "【動】証明する", "pos": "動", "example": "Certify a document.", "phrase": "certify as true", "set": 1},
    {"word": "challenge", "meaning": "【動】異議を唱える、挑む", "pos": "動", "example": "Challenge a decision.", "phrase": "challenge authority", "set": 1},
    {"word": "chancellor", "meaning": "【名】首相、学長", "pos": "名", "example": "German Chancellor.", "phrase": "university chancellor", "set": 1},
    {"word": "chaotic", "meaning": "【形】混沌とした", "pos": "形", "example": "Chaotic situation.", "phrase": "chaotic traffic", "set": 1},
    {"word": "characteristic", "meaning": "【形】特有の", "pos": "形", "example": "Characteristic style.", "phrase": "characteristic feature", "set": 1},
    {"word": "charming", "meaning": "【形】魅力的な", "pos": "形", "example": "Charming personality.", "phrase": "charming village", "set": 1},
    {"word": "chase", "meaning": "【動】追いかける", "pos": "動", "example": "Chase the thief.", "phrase": "chase dreams", "set": 1},
    {"word": "cheat", "meaning": "【動】不正をする、騙す", "pos": "動", "example": "Cheat on a test.", "phrase": "cheat sheet", "set": 1},
    {"word": "checkpoint", "meaning": "【名】検問所", "pos": "名", "example": "Security checkpoint.", "phrase": "pass the checkpoint", "set": 1},
    {"word": "cheeky", "meaning": "【形】生意気な", "pos": "形", "example": "Cheeky grin.", "phrase": "cheeky remark", "set": 1},
    {"word": "cheerfully", "meaning": "【副】陽気に", "pos": "副", "example": "Smile cheerfully.", "phrase": "greet cheerfully", "set": 1},
    {"word": "cheerfulness", "meaning": "【名】陽気さ", "pos": "名", "example": "Full of cheerfulness.", "phrase": "forced cheerfulness", "set": 1},
    {"word": "chemotherapy", "meaning": "【名】化学療法", "pos": "名", "example": "Undergo chemotherapy.", "phrase": "chemotherapy treatment", "set": 1},
    {"word": "cherished", "meaning": "【形】大事にしている", "pos": "形", "example": "Cherished memory.", "phrase": "cherished possession", "set": 1},
    {"word": "cherry", "meaning": "【名】サクランボ", "pos": "名", "example": "Cherry pie.", "phrase": "cherry blossom", "set": 1},
    {"word": "chew", "meaning": "【動】噛む", "pos": "動", "example": "Chew gum.", "phrase": "chew over", "set": 1},
    {"word": "chief", "meaning": "【名】長、チーフ", "pos": "名", "example": "Police chief.", "phrase": "editor in chief", "set": 1},
    {"word": "childish", "meaning": "【形】子供っぽい", "pos": "形", "example": "Childish behavior.", "phrase": "don't be childish", "set": 1},
    {"word": "chimney", "meaning": "【名】煙突", "pos": "名", "example": "Smoke from the chimney.", "phrase": "Santa down the chimney", "set": 1},
    {"word": "chip", "meaning": "【名】欠け、チップ", "pos": "名", "example": "Computer chip.", "phrase": "potato chip", "set": 1},
    {"word": "chop", "meaning": "【動】切る", "pos": "動", "example": "Chop onions.", "phrase": "chop down", "set": 1},
    {"word": "chunk", "meaning": "【名】塊", "pos": "名", "example": "Chunk of cheese.", "phrase": "big chunk", "set": 1},
    {"word": "circuit", "meaning": "【名】回路、周回", "pos": "名", "example": "Electric circuit.", "phrase": "circuit breaker", "set": 1},
    {"word": "circuitry", "meaning": "【名】回路構成", "pos": "名", "example": "Complex circuitry.", "phrase": "electronic circuitry", "set": 1},
    {"word": "circumstance", "meaning": "【名】状況", "pos": "名", "example": "Under no circumstance.", "phrase": "victim of circumstance", "set": 1},
    {"word": "citywide", "meaning": "【形】市全体の", "pos": "形", "example": "Citywide ban.", "phrase": "citywide strike", "set": 1},
    {"word": "clam", "meaning": "【名】ハマグリ", "pos": "名", "example": "Clam chowder.", "phrase": "happy as a clam", "set": 1},
    {"word": "clap", "meaning": "【動】拍手する", "pos": "動", "example": "Clap hands.", "phrase": "clap along", "set": 1},
    {"word": "clarify", "meaning": "【動】明確にする", "pos": "動", "example": "Clarify the situation.", "phrase": "clarify butter", "set": 1},
    {"word": "classic", "meaning": "【名】傑作、古典", "pos": "名", "example": "A literary classic.", "phrase": "instant classic", "set": 1},
    {"word": "classification", "meaning": "【名】分類", "pos": "名", "example": "Classification system.", "phrase": "job classification", "set": 1},
    {"word": "clause", "meaning": "【名】条項、節", "pos": "名", "example": "Contract clause.", "phrase": "relative clause", "set": 1},
    {"word": "clearness", "meaning": "【名】明瞭さ", "pos": "名", "example": "Clearness of speech.", "phrase": "for clearness", "set": 1},
    {"word": "clerical", "meaning": "【形】事務の、聖職者の", "pos": "形", "example": "Clerical work.", "phrase": "clerical error", "set": 1},
    {"word": "client", "meaning": "【名】依頼人", "pos": "名", "example": "Lawyer's client.", "phrase": "serve a client", "set": 1},
    {"word": "climate change", "meaning": "【名】気候変動", "pos": "名", "example": "Combat climate change.", "phrase": "climate change effects", "set": 1},
    {"word": "clog", "meaning": "【動】詰まらせる", "pos": "動", "example": "Clog the drain.", "phrase": "clogged arteries", "set": 1},
    {"word": "closure", "meaning": "【名】閉鎖、決着", "pos": "名", "example": "Road closure.", "phrase": "bring closure", "set": 1},
    {"word": "clothing", "meaning": "【名】衣類", "pos": "名", "example": "Winter clothing.", "phrase": "clothing store", "set": 1},
    {"word": "clumsy", "meaning": "【形】不器用な", "pos": "形", "example": "Clumsy mistake.", "phrase": "clumsy fingers", "set": 1},
    {"word": "coach", "meaning": "【動】指導する", "pos": "動", "example": "Coach a team.", "phrase": "coach sports", "set": 1},
    {"word": "coaching", "meaning": "【名】コーチング", "pos": "名", "example": "Life coaching.", "phrase": "coaching staff", "set": 1},
    {"word": "coalition", "meaning": "【名】連立、提携", "pos": "名", "example": "Coalition government.", "phrase": "form a coalition", "set": 1},
    {"word": "coarse", "meaning": "【形】粗い", "pos": "形", "example": "Coarse sand.", "phrase": "coarse language", "set": 1},
    {"word": "coastline", "meaning": "【名】海岸線", "pos": "名", "example": "Rugged coastline.", "phrase": "along the coastline", "set": 1},
    {"word": "cocktail", "meaning": "【名】カクテル", "pos": "名", "example": "Cocktail party.", "phrase": "make a cocktail", "set": 1},
    {"word": "cocoa", "meaning": "【名】ココア", "pos": "名", "example": "Hot cocoa.", "phrase": "cocoa powder", "set": 1},
    {"word": "coconut", "meaning": "【名】ココナッツ", "pos": "名", "example": "Coconut milk.", "phrase": "coconut oil", "set": 1},
    {"word": "coherence", "meaning": "【名】一貫性", "pos": "名", "example": "Lack coherence.", "phrase": "maintain coherence", "set": 1},
    {"word": "coherent", "meaning": "【形】一貫した", "pos": "形", "example": "Coherent argument.", "phrase": "coherent strategy", "set": 1},
    {"word": "coincide", "meaning": "【動】同時に起こる、一致する", "pos": "動", "example": "Dates coincide.", "phrase": "coincide with", "set": 1},
    {"word": "coincidence", "meaning": "【名】偶然の一致", "pos": "名", "example": "What a coincidence!", "phrase": "pure coincidence", "set": 1},
    {"word": "collapse", "meaning": "【動】崩壊する", "pos": "動", "example": "The building collapsed.", "phrase": "collapse from exhaustion", "set": 1},
    {"word": "colleague", "meaning": "【名】同僚", "pos": "名", "example": "Work colleagues.", "phrase": "trusted colleague", "set": 1},
    {"word": "collector", "meaning": "【名】収集家", "pos": "名", "example": "Stamp collector.", "phrase": "tax collector", "set": 1},
    {"word": "collocation", "meaning": "【名】コロケーション（語の連結）", "pos": "名", "example": "English collocations.", "phrase": "study collocations", "set": 1},
    {"word": "colon", "meaning": "【名】コロン", "pos": "名", "example": "Semia colon.", "phrase": "colon cancer (different meaning)", "set": 1},
    {"word": "colonial", "meaning": "【形】植民地の", "pos": "形", "example": "Colonial rule.", "phrase": "colonial era", "set": 1},
    {"word": "coma", "meaning": "【名】昏睡", "pos": "名", "example": "Fall into a coma.", "phrase": "coma patient", "set": 1},
    {"word": "comb", "meaning": "【動】とかす", "pos": "動", "example": "Comb hair.", "phrase": "comb through", "set": 1},
    {"word": "comfortably", "meaning": "【副】快適に", "pos": "副", "example": "Sit comfortably.", "phrase": "comfortably numb", "set": 1},
    {"word": "commander", "meaning": "【名】指揮官", "pos": "名", "example": "Military commander.", "phrase": "commander in chief", "set": 1},
    {"word": "commemorate", "meaning": "【動】記念する", "pos": "動", "example": "Commemorate the victory.", "phrase": "commemorate an anniversary", "set": 1},
    {"word": "comment", "meaning": "【動】コメントする", "pos": "動", "example": "Comment on the post.", "phrase": "no comment", "set": 1},
    {"word": "commerce", "meaning": "【名】商業", "pos": "名", "example": "Chamber of commerce.", "phrase": "e-commerce", "set": 1},
    {"word": "commercial", "meaning": "【名】コマーシャル", "pos": "名", "example": "TV commercial.", "phrase": "commercial break", "set": 1},
    {"word": "commission", "meaning": "【名】委員会、手数料", "pos": "名", "example": "Earn commission.", "phrase": "royal commission", "set": 1},
    {"word": "commonwealth", "meaning": "【名】連邦", "pos": "名", "example": "The Commonwealth.", "phrase": "commonwealth games", "set": 1},
    {"word": "communicative", "meaning": "【形】話し好きな、伝達の", "pos": "形", "example": "Communicative approach.", "phrase": "communicative skills", "set": 1},
    {"word": "community", "meaning": "【名】地域社会、共同体", "pos": "名", "example": "Local community.", "phrase": "community center", "set": 1},
    {"word": "commute", "meaning": "【動】通勤・通学する", "pos": "動", "example": "Commute to work.", "phrase": "long commute", "set": 1},
    {"word": "compassion", "meaning": "【名】思いやり、哀れみ", "pos": "名", "example": "Show compassion.", "phrase": "feel compassion", "set": 1},
    {"word": "compassionate", "meaning": "【形】慈悲深い", "pos": "形", "example": "Compassionate leave.", "phrase": "compassionate nature", "set": 1},
    {"word": "compatible", "meaning": "【形】適合する、相性の良い", "pos": "形", "example": "Compatible software.", "phrase": "compatible with", "set": 1},
    {"word": "compensate", "meaning": "【動】補償する", "pos": "動", "example": "Compensate for loss.", "phrase": "fully compensate", "set": 1},
    {"word": "compensation", "meaning": "【名】補償、報酬", "pos": "名", "example": "Claim compensation.", "phrase": "worker's compensation", "set": 1},
    {"word": "competence", "meaning": "【名】能力、適性", "pos": "名", "example": "Professional competence.", "phrase": "core competence", "set": 1},
    {"word": "competent", "meaning": "【形】有能な", "pos": "形", "example": "Competent employee.", "phrase": "competent authority", "set": 1},
    {"word": "compile", "meaning": "【動】編集する、収集する", "pos": "動", "example": "Compile a report.", "phrase": "compile data", "set": 1},
    {"word": "completion", "meaning": "【名】完了", "pos": "名", "example": "Nearing completion.", "phrase": "completion date", "set": 1},
    {"word": "complexion", "meaning": "【名】顔色", "pos": "名", "example": "Pale complexion.", "phrase": "fair complexion", "set": 1},
    {"word": "complexity", "meaning": "【名】複雑さ", "pos": "名", "example": "Complexity of the issue.", "phrase": "add complexity", "set": 1},
    {"word": "component", "meaning": "【名】構成要素", "pos": "名", "example": "Key component.", "phrase": "electronic component", "set": 1},
    {"word": "comprehension", "meaning": "【名】理解", "pos": "名", "example": "Reading comprehension.", "phrase": "beyond comprehension", "set": 1},
    {"word": "comprehensive", "meaning": "【形】包括的な", "pos": "形", "example": "Comprehensive insurance.", "phrase": "comprehensive guide", "set": 1},
    {"word": "compress", "meaning": "【名】湿布 (mostly verb 'compress')", "pos": "名", "example": "Cold compress.", "phrase": "apply a compress", "set": 1},
    {"word": "compression", "meaning": "【名】圧縮", "pos": "名", "example": "Data compression.", "phrase": "compression ratio", "set": 1},
    {"word": "compromise", "meaning": "【動】妥協する", "pos": "動", "example": "Compromise on a deal.", "phrase": "compromise security", "set": 1},
    {"word": "compulsory", "meaning": "【形】義務的な", "pos": "形", "example": "Compulsory education.", "phrase": "compulsory subjects", "set": 1},
    {"word": "compute", "meaning": "【動】計算する", "pos": "動", "example": "Compute the tax.", "phrase": "compute data", "set": 1},
    {"word": "conceal", "meaning": "【動】隠す", "pos": "動", "example": "Conceal a weapon.", "phrase": "conceal the truth", "set": 1},
    {"word": "concede", "meaning": "【動】認める、譲歩する", "pos": "動", "example": "Concede defeat.", "phrase": "concede a goal", "set": 1},
    {"word": "conceit", "meaning": "【名】うぬぼれ", "pos": "名", "example": "Full of conceit.", "phrase": "vain conceit", "set": 1},
    {"word": "conceivable", "meaning": "【形】考えられる", "pos": "形", "example": "Every conceivable way.", "phrase": "conceivable solution", "set": 1},
    {"word": "conceive", "meaning": "【動】思いつく、妊娠する", "pos": "動", "example": "Conceive an idea.", "phrase": "conceive a child", "set": 1},
    {"word": "conception", "meaning": "【名】概念、妊娠", "pos": "名", "example": "Concept of time.", "phrase": "from conception to birth", "set": 1},
    {"word": "concern", "meaning": "【動】関係する、心配させる", "pos": "動", "example": "It concerns you.", "phrase": "to whom it may concern", "set": 1},
    {"word": "concerning", "meaning": "【前】～に関して", "pos": "前", "example": "Questions concerning the policy.", "phrase": "concerning the matter", "set": 1},
    {"word": "concession", "meaning": "【名】譲歩", "pos": "名", "example": "Make a concession.", "phrase": "concession stand", "set": 1},
    {"word": "concrete", "meaning": "【形】具体的な", "pos": "形", "example": "Concrete evidence.", "phrase": "concrete plan", "set": 1},
    {"word": "concrete", "meaning": "【名】コンクリート", "pos": "名", "example": "Reinforced concrete.", "phrase": "concrete jungle", "set": 1},
]

js_path = 'c:\\Users\\warut\\python_chatgpt\\data\\vocabulary.js'

with open(js_path, 'r', encoding='utf-8') as f:
    content = f.read()

# Duplicate logic: NONE requested for B2 -> Exam1.
# Just append to exam1.

# Strategy: Find `exam1: [` and insert items.
match = re.search(r'exam1:\s*\[([^\]]*)\]', content, re.DOTALL)
if match:
    current_list_content = match.group(1).strip()
    
    formatted_entries = []
    for w in new_words:
        entry = f'{{ word: "{w["word"]}", meaning: "{w["meaning"]}", pos: "{w["pos"]}", example: "{w["example"]}", phrase: "{w["phrase"]}", set: 1 }}' # Set 1.
        formatted_entries.append(entry)
    
    new_entries_str = ",\n        ".join(formatted_entries)
    
    # Re-read the match to act on current file state (Batch 2 modified it).
    full_match = match.group(0)
    old_inner = match.group(1)
    
    if old_inner.strip():
        # Append
        # Ensure we handle the comma correctly. If old_inner ends with newline spaces, we append comma.
        # Actually simplest is: `exam1: [ <old>, <new> ]`
        new_block = f"exam1: [{old_inner},\n        {new_entries_str}]"
    else:
        new_block = f"exam1: [\n        {new_entries_str}\n    ]"

    new_content = content.replace(full_match, new_block)

    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Success: Added {len(new_words)} words to exam1 array.")

else:
    print("Error: Could not find `exam1: []` in vocabulary.js")
