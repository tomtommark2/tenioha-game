
import json
import re
import os

# B2 Batch 9 (Words 1201-1350 approx)
# CSV Lines 1201 to 1350
new_words = [
    {"word": "impolite", "meaning": "【形】失礼な", "pos": "形", "example": "Impolite question.", "phrase": "impolite to stare", "set": 1},
    {"word": "impolitely", "meaning": "【副】失礼に", "pos": "副", "example": "Behave impolitely.", "phrase": "ask impolitely", "set": 1},
    {"word": "import", "meaning": "【動】輸入する", "pos": "動", "example": "Import goods.", "phrase": "import from", "set": 1},
    {"word": "impose", "meaning": "【動】課す、押し付ける", "pos": "動", "example": "Impose a tax.", "phrase": "impose restrictions", "set": 1},
    {"word": "impossibility", "meaning": "【名】不可能", "pos": "名", "example": "Practical impossibility.", "phrase": "face impossibility", "set": 1},
    {"word": "impractical", "meaning": "【形】非実用的な", "pos": "形", "example": "Impractical idea.", "phrase": "impractical to do", "set": 1},
    {"word": "impressed", "meaning": "【形】感銘を受けた", "pos": "形", "example": "I'm impressed.", "phrase": "impressed by", "set": 1},
    {"word": "impressionism", "meaning": "【名】印象派", "pos": "名", "example": "French Impressionism.", "phrase": "impressionism art", "set": 1},
    {"word": "impressionist", "meaning": "【名】印象派の画家", "pos": "名", "example": "Famous impressionist.", "phrase": "impressionist painter", "set": 1},
    {"word": "imprison", "meaning": "【動】投獄する", "pos": "動", "example": "Imprison a criminal.", "phrase": "imprison for life", "set": 1},
    {"word": "imprisonment", "meaning": "【名】投獄", "pos": "名", "example": "False imprisonment.", "phrase": "life imprisonment", "set": 1},
    {"word": "improbable", "meaning": "【形】ありそうもない", "pos": "形", "example": "Improbable story.", "phrase": "highly improbable", "set": 1},
    {"word": "improperly", "meaning": "【副】不適切に", "pos": "副", "example": "Installed improperly.", "phrase": "behave improperly", "set": 1},
    {"word": "improved", "meaning": "【形】改良された", "pos": "形", "example": "Improved version.", "phrase": "greatly improved", "set": 1},
    {"word": "impulse", "meaning": "【名】衝動", "pos": "名", "example": "Sudden impulse.", "phrase": "on impulse", "set": 1},
    {"word": "impulsive", "meaning": "【形】衝動的な", "pos": "形", "example": "Impulsive decision.", "phrase": "impulsive shopper", "set": 1},
    {"word": "inaccurate", "meaning": "【形】不正確な", "pos": "形", "example": "Inaccurate information.", "phrase": "wildly inaccurate", "set": 1},
    {"word": "inadequate", "meaning": "【形】不十分な", "pos": "形", "example": "Inadequate funds.", "phrase": "feel inadequate", "set": 1},
    {"word": "inanimate", "meaning": "【形】生命のない", "pos": "形", "example": "Inanimate object.", "phrase": "inanimate nature", "set": 1},
    {"word": "inborn", "meaning": "【形】生まれつきの", "pos": "形", "example": "Inborn talent.", "phrase": "inborn error", "set": 1},
    {"word": "incense", "meaning": "【名】香", "pos": "名", "example": "Burn incense.", "phrase": "smell of incense", "set": 1},
    {"word": "incentive", "meaning": "【名】動機、報奨金", "pos": "名", "example": "Tax incentive.", "phrase": "give an incentive", "set": 1},
    {"word": "inch", "meaning": "【動】じりじりと進む", "pos": "動", "example": "Inch forward.", "phrase": "not budge an inch", "set": 1},
    {"word": "incur", "meaning": "【動】招く、負う", "pos": "動", "example": "Incur a debt.", "phrase": "incur wrath", "set": 1},
    {"word": "incurable", "meaning": "【形】不治の", "pos": "形", "example": "Incurable disease.", "phrase": "incurable optimist", "set": 1},
    {"word": "indebted", "meaning": "【形】恩義がある、負債がある", "pos": "形", "example": "Deeply indebted.", "phrase": "heavily indebted", "set": 1},
    {"word": "indent", "meaning": "【動】インデントする", "pos": "動", "example": "Indent the paragraph.", "phrase": "indent text", "set": 1},
    {"word": "independently", "meaning": "【副】独立して", "pos": "副", "example": "Work independently.", "phrase": "live independently", "set": 1},
    {"word": "indescribable", "meaning": "【形】言葉にいえない", "pos": "形", "example": "Indescribable pain.", "phrase": "indescribable beauty", "set": 1},
    {"word": "index", "meaning": "【名】索引、指数", "pos": "名", "example": "Price index.", "phrase": "index finger", "set": 1},
    {"word": "indifferent", "meaning": "【形】無関心な", "pos": "形", "example": "Indifferent to politics.", "phrase": "remain indifferent", "set": 1},
    {"word": "indignity", "meaning": "【名】屈辱", "pos": "名", "example": "Suffer indignity.", "phrase": "final indignity", "set": 1},
    {"word": "indispensable", "meaning": "【形】不可欠な", "pos": "形", "example": "Indispensable part.", "phrase": "absolutely indispensable", "set": 1},
    {"word": "individual", "meaning": "【名】個人", "pos": "名", "example": "Unique individual.", "phrase": "individual rights", "set": 1},
    {"word": "indulge", "meaning": "【動】甘やかす、ふける", "pos": "動", "example": "Indulge in sweets.", "phrase": "indulge oneself", "set": 1},
    {"word": "indulgent", "meaning": "【形】甘い、寛大な", "pos": "形", "example": "Indulgent parent.", "phrase": "indulgent smile", "set": 1},
    {"word": "industrialise", "meaning": "【動】工業化する（英）", "pos": "動", "example": "Rapidly industrialise.", "phrase": "industrialise the country", "set": 1},
    {"word": "industrialize", "meaning": "【動】工業化する", "pos": "動", "example": "Industrialize the economy.", "phrase": "industrialized nation", "set": 1},
    {"word": "ineffective", "meaning": "【形】効果のない", "pos": "形", "example": "Ineffective treatment.", "phrase": "ineffective leader", "set": 1},
    {"word": "inert", "meaning": "【形】不活性の、鈍い", "pos": "形", "example": "Inert gas.", "phrase": "lie inert", "set": 1},
    {"word": "inexperienced", "meaning": "【形】経験不足の", "pos": "形", "example": "Inexperienced driver.", "phrase": "young and inexperienced", "set": 1},
    {"word": "infant", "meaning": "【名】幼児", "pos": "名", "example": "Infant mortality.", "phrase": "newborn infant", "set": 1},
    {"word": "infect", "meaning": "【動】感染させる", "pos": "動", "example": "Infect computer.", "phrase": "infected with", "set": 1},
    {"word": "infected", "meaning": "【形】感染した", "pos": "形", "example": "Infected wound.", "phrase": "infected area", "set": 1},
    {"word": "infectious", "meaning": "【形】伝染性の", "pos": "形", "example": "Infectious disease.", "phrase": "infectious laughter", "set": 1},
    {"word": "infer", "meaning": "【動】推論する", "pos": "動", "example": "Infer meaning.", "phrase": "infer from", "set": 1},
    {"word": "inference", "meaning": "【名】推論", "pos": "名", "example": "Draw an inference.", "phrase": "logical inference", "set": 1},
    {"word": "inflammation", "meaning": "【名】炎症", "pos": "名", "example": "Reduce inflammation.", "phrase": "chronic inflammation", "set": 1},
    {"word": "inflammatory", "meaning": "【形】炎症性の、扇動的な", "pos": "形", "example": "Inflammatory speech.", "phrase": "inflammatory bowel disease", "set": 1},
    {"word": "inflate", "meaning": "【動】膨らませる", "pos": "動", "example": "Inflate a balloon.", "phrase": "inflate prices", "set": 1},
    {"word": "inflation", "meaning": "【名】インフレ", "pos": "名", "example": "High inflation.", "phrase": "inflation rate", "set": 1},
    {"word": "influence", "meaning": "【動】影響を与える", "pos": "動", "example": "Influence people.", "phrase": "influence the outcome", "set": 1},
    {"word": "influential", "meaning": "【形】影響力のある", "pos": "形", "example": "Influential figure.", "phrase": "highly influential", "set": 1},
    {"word": "influenza", "meaning": "【名】インフルエンザ", "pos": "名", "example": "Catch influenza.", "phrase": "influenza virus", "set": 1},
    {"word": "informal", "meaning": "【形】非公式の", "pos": "形", "example": "Informal meeting.", "phrase": "informal dress", "set": 1},
    {"word": "infringe", "meaning": "【動】侵害する", "pos": "動", "example": "Infringe copyright.", "phrase": "infringe on terms", "set": 1},
    {"word": "infringement", "meaning": "【名】侵害", "pos": "名", "example": "Patent infringement.", "phrase": "copyright infringement", "set": 1},
    {"word": "inhabit", "meaning": "【動】居住する", "pos": "動", "example": "Inhabit the island.", "phrase": "inhibit growth (typo? no, inhabit)", "set": 1},
    {"word": "inherit", "meaning": "【動】相続する", "pos": "動", "example": "Inherit money.", "phrase": "inherit a trait", "set": 1},
    {"word": "initial", "meaning": "【形】最初の", "pos": "形", "example": "Initial reaction.", "phrase": "initial stage", "set": 1},
    {"word": "initiative", "meaning": "【名】主導権、自発性", "pos": "名", "example": "Take the initiative.", "phrase": "peace initiative", "set": 1},
    {"word": "injection", "meaning": "【名】注射、注入", "pos": "名", "example": "Give an injection.", "phrase": "cash injection", "set": 1},
    {"word": "injured", "meaning": "【形】怪我をした", "pos": "形", "example": "Injured party.", "phrase": "badly injured", "set": 1},
    {"word": "innate", "meaning": "【形】先天的な", "pos": "形", "example": "Innate ability.", "phrase": "innate immunity", "set": 1},
    {"word": "innocently", "meaning": "【副】無邪気に", "pos": "副", "example": "Smile innocently.", "phrase": "plead innocently", "set": 1},
    {"word": "innovation", "meaning": "【名】革新", "pos": "名", "example": "Technological innovation.", "phrase": "encourage innovation", "set": 1},
    {"word": "innovative", "meaning": "【形】革新的な", "pos": "形", "example": "Innovative solution.", "phrase": "innovative design", "set": 1},
    {"word": "input", "meaning": "【名】入力、意見", "pos": "名", "example": "User input.", "phrase": "give input", "set": 1},
    {"word": "inquire", "meaning": "【動】尋ねる", "pos": "動", "example": "Inquire within.", "phrase": "inquire about", "set": 1},
    {"word": "inseparable", "meaning": "【形】不可分の", "pos": "形", "example": "Inseparable friends.", "phrase": "inseparable part", "set": 1},
    {"word": "inside", "meaning": "【形】内部の", "pos": "形", "example": "Inside pocket.", "phrase": "inside information", "set": 1},
    {"word": "inside", "meaning": "【名】内側", "pos": "名", "example": "Look inside.", "phrase": "on the inside", "set": 1},
    {"word": "inspect", "meaning": "【動】検査する", "pos": "動", "example": "Inspect the car.", "phrase": "inspect closely", "set": 1},
    {"word": "inspector", "meaning": "【名】検査官", "pos": "名", "example": "Safety inspector.", "phrase": "police inspector", "set": 1},
    {"word": "inspirational", "meaning": "【形】鼓舞する", "pos": "形", "example": "Inspirational speech.", "phrase": "inspirational leader", "set": 1},
    {"word": "instantly", "meaning": "【副】即座に", "pos": "副", "example": "Instantly recognizable.", "phrase": "died instantly", "set": 1},
    {"word": "instil", "meaning": "【動】教え込む（英）", "pos": "動", "example": "Instil values.", "phrase": "instil confidence", "set": 1},
    {"word": "instill", "meaning": "【動】教え込む", "pos": "動", "example": "Instill discipline.", "phrase": "instill fear", "set": 1},
    {"word": "instinct", "meaning": "【名】本能", "pos": "名", "example": "Survival instinct.", "phrase": "trust your instincts", "set": 1},
    {"word": "institution", "meaning": "【名】機関、制度", "pos": "名", "example": "Educational institution.", "phrase": "financial institution", "set": 1},
    {"word": "instruct", "meaning": "【動】指示する、教える", "pos": "動", "example": "Instruct the jury.", "phrase": "instruct to do", "set": 1},
    {"word": "insufficient", "meaning": "【形】不十分な", "pos": "形", "example": "Insufficient evidence.", "phrase": "insufficient funds", "set": 1},
    {"word": "insult", "meaning": "【名】侮辱", "pos": "名", "example": "Take as an insult.", "phrase": "add insult to injury", "set": 1},
    {"word": "insult", "meaning": "【動】侮辱する", "pos": "動", "example": "Don't insult me.", "phrase": "insult intelligence", "set": 1},
    {"word": "integrate", "meaning": "【動】統合する", "pos": "動", "example": "Integrate data.", "phrase": "integrate into", "set": 1},
    {"word": "intellectual", "meaning": "【形】知的な", "pos": "形", "example": "Intellectual property.", "phrase": "intellectual challenge", "set": 1},
    {"word": "intellectual", "meaning": "【名】知識人", "pos": "名", "example": "Public intellectual.", "phrase": "leading intellectual", "set": 1},
    {"word": "intent", "meaning": "【形】熱心な、決心して", "pos": "形", "example": "Intent on winning.", "phrase": "intent gaze", "set": 1},
    {"word": "interactive", "meaning": "【形】双方向の", "pos": "形", "example": "Interactive game.", "phrase": "interactive learning", "set": 1},
    {"word": "interfere", "meaning": "【動】邪魔する、干渉する", "pos": "動", "example": "Don't interfere.", "phrase": "interfere with", "set": 1},
    {"word": "interior", "meaning": "【名】内部", "pos": "名", "example": "Interior design.", "phrase": "car interior", "set": 1},
    {"word": "interpersonal", "meaning": "【形】対人関係の", "pos": "形", "example": "Interpersonal skills.", "phrase": "interpersonal relationships", "set": 1},
    {"word": "interpret", "meaning": "【動】解釈する、通訳する", "pos": "動", "example": "Interpret a dream.", "phrase": "interpret data", "set": 1},
    {"word": "interpretation", "meaning": "【名】解釈、通訳", "pos": "名", "example": "Different interpretation.", "phrase": "interpretation of dreams", "set": 1},
    {"word": "interpreter", "meaning": "【名】通訳者", "pos": "名", "example": "French interpreter.", "phrase": "speak through interpreter", "set": 1},
    {"word": "interruption", "meaning": "【名】中断", "pos": "名", "example": "Brief interruption.", "phrase": "without interruption", "set": 1},
    {"word": "intersection", "meaning": "【名】交差点", "pos": "名", "example": "Busy intersection.", "phrase": "traffic intersection", "set": 1},
    {"word": "intimate", "meaning": "【形】親密な", "pos": "形", "example": "Intimate friend.", "phrase": "intimate relationship", "set": 1},
    {"word": "intransitive", "meaning": "【形】自動詞の", "pos": "形", "example": "Intransitive verb.", "phrase": "intransitive use", "set": 1},
    {"word": "intravenous", "meaning": "【形】静脈内の", "pos": "形", "example": "Intravenous injection.", "phrase": "intravenous drip", "set": 1},
    {"word": "intrude", "meaning": "【動】侵入する", "pos": "動", "example": "Intrude on privacy.", "phrase": "intrude into", "set": 1},
    {"word": "intruder", "meaning": "【名】侵入者", "pos": "名", "example": "Catch an intruder.", "phrase": "unwanted intruder", "set": 1},
    {"word": "intrusion", "meaning": "【名】侵入", "pos": "名", "example": "Intrusion alarm.", "phrase": "unwelcome intrusion", "set": 1},
    {"word": "invariable", "meaning": "【形】不変の", "pos": "形", "example": "Invariable rule.", "phrase": "invariable routine", "set": 1},
    {"word": "invariably", "meaning": "【副】いつも、変わらず", "pos": "副", "example": "Invariably late.", "phrase": "almost invariably", "set": 1},
    {"word": "inventor", "meaning": "【名】発明家", "pos": "名", "example": "Famous inventor.", "phrase": "great inventor", "set": 1},
    {"word": "inverted commas", "meaning": "【名】引用符", "pos": "名", "example": "In inverted commas.", "phrase": "single inverted commas", "set": 1},
    {"word": "investigate", "meaning": "【動】調査する", "pos": "動", "example": "Investigate a crime.", "phrase": "investigate causes", "set": 1},
    {"word": "investigator", "meaning": "【名】捜査官、研究者", "pos": "名", "example": "Private investigator.", "phrase": "lead investigator", "set": 1},
    {"word": "investment", "meaning": "【名】投資", "pos": "名", "example": "Good investment.", "phrase": "foreign investment", "set": 1},
    {"word": "investor", "meaning": "【名】投資家", "pos": "名", "example": "Angel investor.", "phrase": "institutional investor", "set": 1},
    {"word": "invisible", "meaning": "【形】目に見えない", "pos": "形", "example": "Invisible ink.", "phrase": "invisible man", "set": 1},
    {"word": "invitingly", "meaning": "【副】誘うように", "pos": "副", "example": "Smile invitingly.", "phrase": "smell invitingly", "set": 1},
    {"word": "invoke", "meaning": "【動】呼び起こす、発動する", "pos": "動", "example": "Invoke a law.", "phrase": "invoke help", "set": 1},
    {"word": "involvement", "meaning": "【名】関与", "pos": "名", "example": "Deep involvement.", "phrase": "community involvement", "set": 1},
    {"word": "ironically", "meaning": "【副】皮肉にも", "pos": "副", "example": "Ironically called Lucky.", "phrase": "smile ironically", "set": 1},
    {"word": "irrational", "meaning": "【形】不合理な", "pos": "形", "example": "Irrational fear.", "phrase": "irrational behavior", "set": 1},
    {"word": "irresistible", "meaning": "【形】抵抗できない", "pos": "形", "example": "Irresistible urge.", "phrase": "irresistible charm", "set": 1},
    {"word": "irresistibly", "meaning": "【副】たまらなく", "pos": "副", "example": "Irresistibly drawn.", "phrase": "irresistibly funny", "set": 1},
    {"word": "irresponsible", "meaning": "【形】無責任な", "pos": "形", "example": "Irresponsible behavior.", "phrase": "socially irresponsible", "set": 1},
    {"word": "irritated", "meaning": "【形】いらいらした", "pos": "形", "example": "Get irritated.", "phrase": "irritated voice", "set": 1},
    {"word": "irritating", "meaning": "【形】いらいらさせる", "pos": "形", "example": "Irritating noise.", "phrase": "irritating habit", "set": 1},
    {"word": "irritation", "meaning": "【名】いらだち", "pos": "名", "example": "Source of irritation.", "phrase": "skin irritation", "set": 1},
    {"word": "islander", "meaning": "【名】島民", "pos": "名", "example": "Pacific islander.", "phrase": "local islander", "set": 1},
    {"word": "issue", "meaning": "【動】発行する", "pos": "動", "example": "Issue a passport.", "phrase": "issue a statement", "set": 1},
    {"word": "italicise", "meaning": "【動】イタリック体にする（英）", "pos": "動", "example": "Italicise the text.", "phrase": "italicise specific words", "set": 1},
    {"word": "italicize", "meaning": "【動】イタリック体にする", "pos": "動", "example": "Italicize titles.", "phrase": "italicize for emphasis", "set": 1},
    {"word": "itch", "meaning": "【動】かゆい", "pos": "動", "example": "My nose itches.", "phrase": "itching to go", "set": 1},
    {"word": "jam", "meaning": "【動】詰め込む、故障する", "pos": "動", "example": "Paper jammed.", "phrase": "traffic jam", "set": 1},
    {"word": "jaw", "meaning": "【名】あご", "pos": "名", "example": "Lower jaw.", "phrase": "jaw dropping", "set": 1},
    {"word": "jealously", "meaning": "【副】嫉妬深く", "pos": "副", "example": "Guard jealously.", "phrase": "look jealously", "set": 1},
    {"word": "jeopardise", "meaning": "【動】危うくする（英）", "pos": "動", "example": "Jeopardise safety.", "phrase": "jeopardise a career", "set": 1},
    {"word": "jeopardize", "meaning": "【動】危うくする", "pos": "動", "example": "Jeopardize the mission.", "phrase": "jeopardize health", "set": 1},
    {"word": "jeweler", "meaning": "【名】宝石商", "pos": "名", "example": "Visit a jeweler.", "phrase": "jeweler's loupe", "set": 1},
    {"word": "jeweller", "meaning": "【名】宝石商（英）", "pos": "名", "example": "Reputable jeweller.", "phrase": "family jeweller", "set": 1},
    {"word": "jog", "meaning": "【名】ジョギング", "pos": "名", "example": "Go for a jog.", "phrase": "morning jog", "set": 1},
    {"word": "joint", "meaning": "【名】関節、継ぎ目", "pos": "名", "example": "Aching joints.", "phrase": "joint venture", "set": 1},
    {"word": "journalism", "meaning": "【名】ジャーナリズム", "pos": "名", "example": "Investigative journalism.", "phrase": "career in journalism", "set": 1},
    {"word": "judo", "meaning": "【名】柔道", "pos": "名", "example": "Practice judo.", "phrase": "judo black belt", "set": 1},
    {"word": "jump", "meaning": "【名】ジャンプ", "pos": "名", "example": "High jump.", "phrase": "jump for joy", "set": 1},
    {"word": "junk food", "meaning": "【名】ジャンクフード", "pos": "名", "example": "Avoid junk food.", "phrase": "eat too much junk food", "set": 1},
    {"word": "juror", "meaning": "【名】陪審員", "pos": "名", "example": "Selected as juror.", "phrase": "impartial juror", "set": 1},
    {"word": "jury", "meaning": "【名】陪審", "pos": "名", "example": "Trial by jury.", "phrase": "jury duty", "set": 1},
    {"word": "justify", "meaning": "【動】正当化する", "pos": "動", "example": "Justify the cost.", "phrase": "hard to justify", "set": 1},
    {"word": "kangaroo", "meaning": "【名】カンガルー", "pos": "名", "example": "Wild kangaroo.", "phrase": "kangaroo court", "set": 1},
    {"word": "karaoke", "meaning": "【名】カラオケ", "pos": "名", "example": "Sing karaoke.", "phrase": "karaoke bar", "set": 1},
    {"word": "keen", "meaning": "【形】鋭い、熱心な", "pos": "形", "example": "Keen interest.", "phrase": "keen on", "set": 1},
    {"word": "keeper", "meaning": "【名】番人、飼育係", "pos": "名", "example": "Zoo keeper.", "phrase": "finders keepers", "set": 1},
    {"word": "kerosene", "meaning": "【名】灯油", "pos": "名", "example": "Kerosene lamp.", "phrase": "kerosene heater", "set": 1},
    {"word": "keystroke", "meaning": "【名】キー入力", "pos": "名", "example": "Track keystrokes.", "phrase": "single keystroke", "set": 1},
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
