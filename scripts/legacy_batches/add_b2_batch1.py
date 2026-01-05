
import json
import re
import os

# B2 Batch 1 (Words 1-150)
new_words = [
    {"word": "abandoned", "meaning": "【形】見捨てられた", "pos": "形", "example": "An abandoned house.", "phrase": "abandoned car", "set": 1},
    {"word": "abnormally", "meaning": "【副】異常に", "pos": "副", "example": "Behave abnormally.", "phrase": "abnormally high", "set": 1},
    {"word": "abolish", "meaning": "【動】廃止する", "pos": "動", "example": "Abolish slavery.", "phrase": "abolish the law", "set": 1},
    {"word": "aboriginal", "meaning": "【形】原住民の", "pos": "形", "example": "Aboriginal art.", "phrase": "aboriginal people", "set": 1},
    {"word": "abruptly", "meaning": "【副】突然に", "pos": "副", "example": "Stop abruptly.", "phrase": "change abruptly", "set": 1},
    {"word": "absentee", "meaning": "【名】不在者", "pos": "名", "example": "Absentee landlord.", "phrase": "absentee ballot", "set": 1},
    {"word": "absurd", "meaning": "【形】不合理な、ばかげた", "pos": "形", "example": "Absurd idea.", "phrase": "don't be absurd", "set": 1},
    {"word": "abuse", "meaning": "【名】乱用、虐待", "pos": "名", "example": "Child abuse.", "phrase": "drug abuse", "set": 1},
    {"word": "access", "meaning": "【動】アクセスする", "pos": "動", "example": "Access the website.", "phrase": "access information", "set": 1},
    {"word": "accessibility", "meaning": "【名】接近しやすさ", "pos": "名", "example": "Wheelchair accessibility.", "phrase": "accessibility options", "set": 1},
    {"word": "accommodation", "meaning": "【名】宿泊施設", "pos": "名", "example": "Hotel accommodation.", "phrase": "cheap accommodation", "set": 1},
    {"word": "accordingly", "meaning": "【副】それに応じて", "pos": "副", "example": "Act accordingly.", "phrase": "price accordingly", "set": 1},
    {"word": "accumulate", "meaning": "【動】蓄積する", "pos": "動", "example": "Accumulate wealth.", "phrase": "accumulate dust", "set": 1},
    {"word": "accusation", "meaning": "【名】告発、非難", "pos": "名", "example": "False accusation.", "phrase": "make an accusation", "set": 1},
    {"word": "ache", "meaning": "【動】痛む", "pos": "動", "example": "My head aches.", "phrase": "ache all over", "set": 1},
    {"word": "achievable", "meaning": "【形】達成可能な", "pos": "形", "example": "Achievable goal.", "phrase": "easily achievable", "set": 1},
    {"word": "acid", "meaning": "【名】酸", "pos": "名", "example": "Sulphuric acid.", "phrase": "acid rain", "set": 1},
    {"word": "acquisition", "meaning": "【名】獲得、習得", "pos": "名", "example": "Language acquisition.", "phrase": "acquisition of wealth", "set": 1},
    {"word": "actively", "meaning": "【副】活発に", "pos": "副", "example": "Participate actively.", "phrase": "actively involved", "set": 1},
    {"word": "actual", "meaning": "【形】実際の", "pos": "形", "example": "Actual cost.", "phrase": "in actual fact", "set": 1},
    {"word": "acute", "meaning": "【形】急性の、鋭い", "pos": "形", "example": "Acute pain.", "phrase": "acute shortage", "set": 1},
    {"word": "adaptable", "meaning": "【形】適応できる", "pos": "形", "example": "Adaptable workforce.", "phrase": "highly adaptable", "set": 1},
    {"word": "addict", "meaning": "【名】中毒者", "pos": "名", "example": "Drug addict.", "phrase": "game addict", "set": 1},
    {"word": "addicted", "meaning": "【形】中毒の", "pos": "形", "example": "Addicted to smoking.", "phrase": "addicted to", "set": 1},
    {"word": "addiction", "meaning": "【名】中毒", "pos": "名", "example": "Overcome addiction.", "phrase": "drug addiction", "set": 1},
    {"word": "additionally", "meaning": "【副】その上", "pos": "副", "example": "Additionally, I agree.", "phrase": "and additionally", "set": 1},
    {"word": "adequate", "meaning": "【形】十分な", "pos": "形", "example": "Adequate supply.", "phrase": "adequate for", "set": 1},
    {"word": "adequately", "meaning": "【副】十分に", "pos": "副", "example": "Prepare adequately.", "phrase": "adequately funded", "set": 1},
    {"word": "adjustment", "meaning": "【名】調整", "pos": "名", "example": "Make an adjustment.", "phrase": "minor adjustment", "set": 1},
    {"word": "administrative", "meaning": "【形】管理の", "pos": "形", "example": "Administrative staff.", "phrase": "administrative costs", "set": 1},
    {"word": "admirable", "meaning": "【形】賞賛に値する", "pos": "形", "example": "Admirable courage.", "phrase": "truly admirable", "set": 1},
    {"word": "admiringly", "meaning": "【副】感心して", "pos": "副", "example": "Look admiringly.", "phrase": "gaze admiringly", "set": 1},
    {"word": "admittedly", "meaning": "【副】自ら認めるように、確かに", "pos": "副", "example": "Admittedly, I was wrong.", "phrase": "admittedly difficult", "set": 1},
    {"word": "adopted", "meaning": "【形】養子の", "pos": "形", "example": "Adopted son.", "phrase": "adopted country", "set": 1},
    {"word": "adoption", "meaning": "【名】養子縁組、採用", "pos": "名", "example": "Put up for adoption.", "phrase": "widespread adoption", "set": 1},
    {"word": "adore", "meaning": "【動】崇拝する、熱愛する", "pos": "動", "example": "I adore you.", "phrase": "adore children", "set": 1},
    {"word": "adorn", "meaning": "【動】飾る", "pos": "動", "example": "Adorn with flowers.", "phrase": "adorn the wall", "set": 1},
    {"word": "advance", "meaning": "【名】前進、進歩", "pos": "名", "example": "Technological advance.", "phrase": "in advance", "set": 1},
    {"word": "advancement", "meaning": "【名】昇進、進歩", "pos": "名", "example": "Career advancement.", "phrase": "scientific advancement", "set": 1},
    {"word": "advent", "meaning": "【名】到来", "pos": "名", "example": "Advent of the internet.", "phrase": "advent calendar", "set": 1},
    {"word": "adventurous", "meaning": "【形】冒険好きな", "pos": "形", "example": "Adventurous traveler.", "phrase": "adventurous spirit", "set": 1},
    {"word": "adverse", "meaning": "【形】不利な、逆の", "pos": "形", "example": "Adverse effects.", "phrase": "adverse weather", "set": 1},
    {"word": "adversely", "meaning": "【副】不利に", "pos": "副", "example": "Adversely affect.", "phrase": "adversely impacted", "set": 1},
    {"word": "adversity", "meaning": "【名】逆境", "pos": "名", "example": "Overcome adversity.", "phrase": "face adversity", "set": 1},
    {"word": "affectionate", "meaning": "【形】愛情深い", "pos": "形", "example": "Affectionate smile.", "phrase": "affectionate towards", "set": 1},
    {"word": "affectionately", "meaning": "【副】愛情を込めて", "pos": "副", "example": "Hug affectionately.", "phrase": "known affectionately as", "set": 1},
    {"word": "affordable", "meaning": "【形】手頃な価格の", "pos": "形", "example": "Affordable housing.", "phrase": "affordable price", "set": 1},
    {"word": "ageless", "meaning": "【形】年をとらない、不朽の", "pos": "形", "example": "Ageless beauty.", "phrase": "ageless wisdom", "set": 1},
    {"word": "aggressively", "meaning": "【副】攻撃的に", "pos": "副", "example": "Market aggressively.", "phrase": "act aggressively", "set": 1},
    {"word": "agonise", "meaning": "【動】苦悩する (英)", "pos": "動", "example": "Agonise over a decision.", "phrase": "agonise about", "set": 1},
    {"word": "agonize", "meaning": "【動】苦悩する", "pos": "動", "example": "Agonize over details.", "phrase": "agonize over", "set": 1},
    {"word": "agony", "meaning": "【名】激痛、苦悩", "pos": "名", "example": "In agony.", "phrase": "cry of agony", "set": 1},
    {"word": "aim", "meaning": "【動】狙う、目指す", "pos": "動", "example": "Aim for the top.", "phrase": "aim at", "set": 1},
    {"word": "aircraft", "meaning": "【名】航空機", "pos": "名", "example": "Military aircraft.", "phrase": "enemy aircraft", "set": 1},
    {"word": "aircrew", "meaning": "【名】搭乗員", "pos": "名", "example": "The aircrew prepared for takeoff.", "phrase": "aircrew member", "set": 1},
    {"word": "alcoholic", "meaning": "【名】アルコール依存症患者", "pos": "名", "example": "He is a recovering alcoholic.", "phrase": "alcoholic beverage", "set": 1},
    {"word": "alcoholism", "meaning": "【名】アルコール中毒", "pos": "名", "example": "Treat alcoholism.", "phrase": "suffer from alcoholism", "set": 1},
    {"word": "alert", "meaning": "【動】警告する", "pos": "動", "example": "Alert the police.", "phrase": "stay alert", "set": 1},
    {"word": "allegation", "meaning": "【名】申し立て", "pos": "名", "example": "Deny the allegation.", "phrase": "serious allegation", "set": 1},
    {"word": "alliance", "meaning": "【名】同盟", "pos": "名", "example": "Form an alliance.", "phrase": "military alliance", "set": 1},
    {"word": "ally", "meaning": "【名】同盟国、味方", "pos": "名", "example": "A staunch ally.", "phrase": "ally with", "set": 1},
    {"word": "alongside", "meaning": "【前】そばに、並んで", "pos": "前", "example": "Park alongside the curb.", "phrase": "work alongside", "set": 1},
    {"word": "alphabetical", "meaning": "【形】アルファベット順の", "pos": "形", "example": "Alphabetical order.", "phrase": "in alphabetical order", "set": 1},
    {"word": "altar", "meaning": "【名】祭壇", "pos": "名", "example": "Kneel at the altar.", "phrase": "high altar", "set": 1},
    {"word": "alter", "meaning": "【動】変える", "pos": "動", "example": "Alter a dress.", "phrase": "alter the course", "set": 1},
    {"word": "alternate", "meaning": "【動】交互に行う", "pos": "動", "example": "Alternate between hot and cold.", "phrase": "alternate days", "set": 1},
    {"word": "alternatively", "meaning": "【副】代わりに、あるいは", "pos": "副", "example": "Alternatively, we can walk.", "phrase": "or alternatively", "set": 1},
    {"word": "altitude", "meaning": "【名】高度", "pos": "名", "example": "Cruising altitude.", "phrase": "high altitude", "set": 1},
    {"word": "aluminium", "meaning": "【名】アルミニウム", "pos": "名", "example": "Aluminium can.", "phrase": "aluminium foil", "set": 1},
    {"word": "aluminum", "meaning": "【名】アルミニウム (米)", "pos": "名", "example": "Aluminum bat.", "phrase": "aluminum siding", "set": 1},
    {"word": "amaze", "meaning": "【動】驚嘆させる", "pos": "動", "example": "His skill amazes me.", "phrase": "amaze everyone", "set": 1},
    {"word": "amazement", "meaning": "【名】驚嘆", "pos": "名", "example": "Stare in amazement.", "phrase": "to my amazement", "set": 1},
    {"word": "amazingly", "meaning": "【副】驚くほど", "pos": "副", "example": "Strictly amazingly.", "phrase": "amazingly fast", "set": 1},
    {"word": "ambassador", "meaning": "【名】大使", "pos": "名", "example": "US Ambassador.", "phrase": "ambassador to", "set": 1},
    {"word": "ambiguity", "meaning": "【名】曖昧さ", "pos": "名", "example": "Avoid ambiguity.", "phrase": "moral ambiguity", "set": 1},
    {"word": "ambiguous", "meaning": "【形】曖昧な", "pos": "形", "example": "Ambiguous answer.", "phrase": "remain ambiguous", "set": 1},
    {"word": "ammonia", "meaning": "【名】アンモニア", "pos": "名", "example": "Smell of ammonia.", "phrase": "liquid ammonia", "set": 1},
    {"word": "amongst", "meaning": "【前】～の間で", "pos": "前", "example": "Amongst friends.", "phrase": "amongst others", "set": 1},
    {"word": "ample", "meaning": "【形】十分な", "pos": "形", "example": "Ample time.", "phrase": "ample opportunity", "set": 1},
    {"word": "amplifier", "meaning": "【名】アンプ、増幅器", "pos": "名", "example": "Guitar amplifier.", "phrase": "turn up the amplifier", "set": 1},
    {"word": "amplify", "meaning": "【動】増幅する", "pos": "動", "example": "Amplify the sound.", "phrase": "amplify the signal", "set": 1},
    {"word": "amuse", "meaning": "【動】楽しませる", "pos": "動", "example": "Amuse the children.", "phrase": "keep amused", "set": 1},
    {"word": "analogy", "meaning": "【名】類推、類似", "pos": "名", "example": "Draw an analogy.", "phrase": "analogy between", "set": 1},
    {"word": "analyst", "meaning": "【名】分析家", "pos": "名", "example": "Financial analyst.", "phrase": "system analyst", "set": 1},
    {"word": "anchor", "meaning": "【名】錨、アンカー", "pos": "名", "example": "Drop anchor.", "phrase": "news anchor", "set": 1},
    {"word": "anchorage", "meaning": "【名】停泊地", "pos": "名", "example": "Safe anchorage.", "phrase": "anchorage point", "set": 1},
    {"word": "anchorman", "meaning": "【名】ニュースキャスター", "pos": "名", "example": "TV anchorman.", "phrase": "celebrity anchorman", "set": 1},
    {"word": "anchorperson", "meaning": "【名】ニュースキャスター", "pos": "名", "example": "Female anchorperson.", "phrase": "lead anchorperson", "set": 1},
    {"word": "anguish", "meaning": "【名】苦悩", "pos": "名", "example": "Cry of anguish.", "phrase": "mental anguish", "set": 1},
    {"word": "animate", "meaning": "【動】活気づける", "pos": "動", "example": "Animate a conversation.", "phrase": "animate the scene", "set": 1},
    {"word": "anonymous", "meaning": "【形】匿名の", "pos": "形", "example": "Anonymous donor.", "phrase": "remain anonymous", "set": 1},
    {"word": "antiaircraft", "meaning": "【形】対空の", "pos": "形", "example": "Antiaircraft gun.", "phrase": "antiaircraft fire", "set": 1},
    {"word": "antibacterial", "meaning": "【形】抗菌の", "pos": "形", "example": "Antibacterial soap.", "phrase": "antibacterial spray", "set": 1},
    {"word": "anticancer", "meaning": "【名】抗がん剤", "pos": "名", "example": "Anticancer drug.", "phrase": "anticancer treatment", "set": 1},
    {"word": "anticipate", "meaning": "【動】予想する", "pos": "動", "example": "Anticipate trouble.", "phrase": "anticipate a change", "set": 1},
    {"word": "anticipation", "meaning": "【名】予想、期待", "pos": "名", "example": "In anticipation of.", "phrase": "eager anticipation", "set": 1},
    {"word": "antipollution", "meaning": "【名】公害防止", "pos": "名", "example": "Antipollution laws.", "phrase": "antipollution measures", "set": 1},
    {"word": "antique", "meaning": "【形】アンティークの", "pos": "形", "example": "Antique car.", "phrase": "antique shop", "set": 1},
    {"word": "antistatic", "meaning": "【形】帯電防止の", "pos": "形", "example": "Antistatic mat.", "phrase": "antistatic spray", "set": 1},
    {"word": "antivirus", "meaning": "【名】抗ウイルス", "pos": "名", "example": "Antivirus software.", "phrase": "antivirus program", "set": 1},
    {"word": "apostrophe", "meaning": "【名】アポストロフィ", "pos": "名", "example": "Missing apostrophe.", "phrase": "use an apostrophe", "set": 1},
    {"word": "appeal", "meaning": "【動】懇願する", "pos": "動", "example": "Appeal to reason.", "phrase": "appeal for help", "set": 1},
    {"word": "applicant", "meaning": "【名】応募者", "pos": "名", "example": "Job applicant.", "phrase": "successful applicant", "set": 1},
    {"word": "appreciative", "meaning": "【形】感謝している", "pos": "形", "example": "Appreciative audience.", "phrase": "be appreciative of", "set": 1},
    {"word": "approach", "meaning": "【動】近づく、取り組む", "pos": "動", "example": "Approach the bench.", "phrase": "approach the problem", "set": 1},
    {"word": "appropriately", "meaning": "【副】適切に", "pos": "副", "example": "Dress appropriately.", "phrase": "act appropriately", "set": 1},
    {"word": "approximate", "meaning": "【形】おおよその", "pos": "形", "example": "Approximate cost.", "phrase": "approximate figure", "set": 1},
    {"word": "arch", "meaning": "【名】アーチ", "pos": "名", "example": "Stone arch.", "phrase": "pass through the arch", "set": 1},
    {"word": "archaeologist", "meaning": "【名】考古学者", "pos": "名", "example": "Famous archaeologist.", "phrase": "dig archaeologist", "set": 1},
    {"word": "archeologist", "meaning": "【名】考古学者 (米)", "pos": "名", "example": "Work as an archeologist.", "phrase": "archeologist discovery", "set": 1},
    {"word": "arctic", "meaning": "【形】北極の", "pos": "形", "example": "Arctic circle.", "phrase": "arctic explorer", "set": 1},
    {"word": "arena", "meaning": "【名】競技場、アリーナ", "pos": "名", "example": "Sports arena.", "phrase": "political arena", "set": 1},
    {"word": "aristocracy", "meaning": "【名】貴族", "pos": "名", "example": "French aristocracy.", "phrase": "member of the aristocracy", "set": 1},
    {"word": "armful", "meaning": "【名】腕一杯の", "pos": "名", "example": "Armful of books.", "phrase": "by the armful", "set": 1},
    {"word": "arouse", "meaning": "【動】刺激する、目覚めさせる", "pos": "動", "example": "Arouse suspicion.", "phrase": "arouse interest", "set": 1},
    {"word": "arrogant", "meaning": "【形】傲慢な", "pos": "形", "example": "Arrogant attitude.", "phrase": "don't be arrogant", "set": 1},
    {"word": "artery", "meaning": "【名】動脈", "pos": "名", "example": "Blocked artery.", "phrase": "main artery", "set": 1},
    {"word": "articulate", "meaning": "【動】はっきり述べる", "pos": "動", "example": "Articulate your thoughts.", "phrase": "articulate clearly", "set": 1},
    {"word": "artificially", "meaning": "【副】人工的に", "pos": "副", "example": "Artificially flavored.", "phrase": "artificially inflated", "set": 1},
    {"word": "artistry", "meaning": "【名】芸術的才能", "pos": "名", "example": "Admire his artistry.", "phrase": "makeup artistry", "set": 1},
    {"word": "ash", "meaning": "【名】灰", "pos": "名", "example": "Cigarette ash.", "phrase": "rise from the ashes", "set": 1},
    {"word": "aspiration", "meaning": "【名】熱望", "pos": "名", "example": "Career aspiration.", "phrase": "have aspirations", "set": 1},
    {"word": "aspire", "meaning": "【動】熱望する", "pos": "動", "example": "Aspire to be a writer.", "phrase": "aspire to", "set": 1},
    {"word": "assault", "meaning": "【名】暴行、攻撃", "pos": "名", "example": "Sexual assault.", "phrase": "assault course", "set": 1},
    {"word": "assemble", "meaning": "【動】集める、組み立てる", "pos": "動", "example": "Assemble a team.", "phrase": "assemble furniture", "set": 1},
    {"word": "assembly", "meaning": "【名】集会、組み立て", "pos": "名", "example": "School assembly.", "phrase": "assembly line", "set": 1},
    {"word": "assert", "meaning": "【動】断言する", "pos": "動", "example": "Assert authority.", "phrase": "assert oneself", "set": 1},
    {"word": "assess", "meaning": "【動】評価する", "pos": "動", "example": "Assess the damage.", "phrase": "assess the situation", "set": 1},
    {"word": "assessment", "meaning": "【名】評価、査定", "pos": "名", "example": "Safety assessment.", "phrase": "assessment of", "set": 1},
    {"word": "assumption", "meaning": "【名】仮定", "pos": "名", "example": "Based on the assumption.", "phrase": "make an assumption", "set": 1},
    {"word": "assurance", "meaning": "【名】保証、確信", "pos": "名", "example": "Give assurance.", "phrase": "life assurance", "set": 1},
    {"word": "assure", "meaning": "【動】保証する", "pos": "動", "example": "I assure you.", "phrase": "rest assured", "set": 1},
    {"word": "astonish", "meaning": "【動】驚かす", "pos": "動", "example": "The news astonished us.", "phrase": "be astonished at", "set": 1},
    {"word": "astonished", "meaning": "【形】驚いた", "pos": "形", "example": "Astonished look.", "phrase": "be astonished by", "set": 1},
    {"word": "astonishing", "meaning": "【形】驚くべき", "pos": "形", "example": "Astonishing success.", "phrase": "truly astonishing", "set": 1},
    {"word": "astonishment", "meaning": "【名】驚き", "pos": "名", "example": "To my astonishment.", "phrase": "gasp in astonishment", "set": 1},
    {"word": "astronomy", "meaning": "【名】天文学", "pos": "名", "example": "Interested in astronomy.", "phrase": "study astronomy", "set": 1},
    {"word": "athletics", "meaning": "【名】陸上競技", "pos": "名", "example": "Good at athletics.", "phrase": "athletics competition", "set": 1},
    {"word": "attached", "meaning": "【形】付属の、愛着を持って", "pos": "形", "example": "Attached file.", "phrase": "attached to", "set": 1},
    {"word": "attainable", "meaning": "【形】達成可能な", "pos": "形", "example": "Attainable goal.", "phrase": "easily attainable", "set": 1},
    {"word": "attainment", "meaning": "【名】達成", "pos": "名", "example": "Educational attainment.", "phrase": "attainment of", "set": 1},
    {"word": "attendance", "meaning": "【名】出席", "pos": "名", "example": "Attendance record.", "phrase": "in attendance", "set": 1},
    {"word": "attentive", "meaning": "【形】注意深い", "pos": "形", "example": "Attentive listener.", "phrase": "be attentive to", "set": 1},
    {"word": "attentively", "meaning": "【副】注意深く", "pos": "副", "example": "Listen attentively.", "phrase": "watch attentively", "set": 1},
    {"word": "attractiveness", "meaning": "【名】魅力", "pos": "名", "example": "Physical attractiveness.", "phrase": "add to attractiveness", "set": 1},
    {"word": "attribute", "meaning": "【名】属性、特性", "pos": "名", "example": "Positive attributes.", "phrase": "attribute of", "set": 1},
    {"word": "attribute", "meaning": "【動】～のせいにする", "pos": "動", "example": "Attribute success to hard work.", "phrase": "attribute to", "set": 1},
    {"word": "atypical", "meaning": "【形】異例の、型にはまらない", "pos": "形", "example": "Atypical behavior.", "phrase": "atypical example", "set": 1},
    {"word": "aubergine", "meaning": "【名】ナス (英)", "pos": "名", "example": "Grilled aubergine.", "phrase": "aubergine parmigiana", "set": 1},
    {"word": "audit", "meaning": "【名】監査", "pos": "名", "example": "Tax audit.", "phrase": "carry out an audit", "set": 1}
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
        entry = f'{{ word: "{w["word"]}", meaning: "{w["meaning"]}", pos: "{w["pos"]}", example: "{w["example"]}", phrase: "{w["phrase"]}", set: 1 }}' # Set 1 or 2? User implied 'Exam1' which is distinct, but format uses 'set: 1'. I will use 'set: 1' to be safe as current Exam1 items use set:1 (lines 3936-3945).
        formatted_entries.append(entry)
    
    new_entries_str = ",\n        ".join(formatted_entries)
    
    if current_list_content:
        # List not empty, append with comma
        replacement = f'exam1: [\n        {current_list_content},\n        {new_entries_str}\n    ]'
        # Use simple replace if the content is unique enough, or careful reconstruction
        # Since regex matched the INNER content, we can reconstruct the whole block
        # But `current_list_content` involves everything inside [].
        
        # Safer text replacement:
        # replace `exam1: [` with `exam1: [\n        <new_entries>,\n` 
        # But wait, we want to append to end.
        
        # Let's replace the whole match block `exam1: [...]`
        full_match = match.group(0) # exam1: [ ... ]
        
        # We need to preserve what was inside.
        # But regex `exam1:\s*\[([^\]]*)\]` might be too greedy or not greedy enough if nested brackets (not likely in simple JS object).
        # Assuming no nested brackets in `exam1` array.
        
        # Construct new block
        old_inner = match.group(1)
        if old_inner.strip():
             new_block = f"exam1: [{old_inner},\n        {new_entries_str}]"
        else:
             new_block = f"exam1: [\n        {new_entries_str}\n    ]"
        
        new_content = content.replace(full_match, new_block)
        
    else:
        # Empty list `exam1: []`
        new_block = f"exam1: [\n        {new_entries_str}\n    ]"
        new_content = re.sub(r'exam1:\s*\[\s*\]', new_block, content)

    with open(js_path, 'w', encoding='utf-8') as f:
        f.write(new_content)
    print(f"Success: Added {len(new_words)} words to exam1 array.")

else:
    print("Error: Could not find `exam1: []` in vocabulary.js")
