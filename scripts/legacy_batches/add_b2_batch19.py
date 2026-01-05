
import json
import re
import os

# B2 Batch 19 (Words 2701-2860 approx)
# CSV Lines 2701 to 2860
new_words = [
    {"word": "unto", "meaning": "【前】～まで、～へ（古語）", "pos": "前", "example": "Do unto others.", "phrase": "unto itself", "set": 1},
    {"word": "untreated", "meaning": "【形】未処理の", "pos": "形", "example": "Untreated sewage.", "phrase": "untreated wood", "set": 1},
    {"word": "untrimmed", "meaning": "【形】整えられていない", "pos": "形", "example": "Untrimmed hedges.", "phrase": "untrimmed hair", "set": 1},
    {"word": "unusualness", "meaning": "【名】珍しさ", "pos": "名", "example": "Unusualness of event.", "phrase": "sheer unusualness", "set": 1},
    {"word": "unwilling", "meaning": "【形】気が進まない", "pos": "形", "example": "Unwilling to help.", "phrase": "unwilling participant", "set": 1},
    {"word": "unwise", "meaning": "【形】賢明でない", "pos": "形", "example": "Unwise decision.", "phrase": "unwise choice", "set": 1},
    {"word": "unworldly", "meaning": "【形】世俗的でない", "pos": "形", "example": "Unworldly innocence.", "phrase": "unworldly look", "set": 1},
    {"word": "upbringing", "meaning": "【名】養育、しつけ", "pos": "名", "example": "Strict upbringing.", "phrase": "good upbringing", "set": 1},
    {"word": "update", "meaning": "【名】更新", "pos": "名", "example": "Software update.", "phrase": "news update", "set": 1},
    {"word": "upgrade", "meaning": "【名】格上げ、改良", "pos": "名", "example": "Free upgrade.", "phrase": "system upgrade", "set": 1},
    {"word": "upgrade", "meaning": "【動】格上げする", "pos": "動", "example": "Upgrade to business class.", "phrase": "upgrade computer", "set": 1},
    {"word": "upright", "meaning": "【形】直立した", "pos": "形", "example": "Upright posture.", "phrase": "upright citizen", "set": 1},
    {"word": "upright", "meaning": "【副】直立して", "pos": "副", "example": "Stand upright.", "phrase": "sit upright", "set": 1},
    {"word": "upset", "meaning": "【動】動揺させる、覆す", "pos": "動", "example": "Don't upset him.", "phrase": "upset stomach", "set": 1},
    {"word": "upside down", "meaning": "【形】逆さまの", "pos": "形", "example": "Upside down cake.", "phrase": "upside down world", "set": 1},
    {"word": "upside down", "meaning": "【副】逆さまに", "pos": "副", "example": "Turn upside down.", "phrase": "hang upside down", "set": 1},
    {"word": "urban", "meaning": "【形】都市の", "pos": "形", "example": "Urban area.", "phrase": "urban renewal", "set": 1},
    {"word": "urge", "meaning": "【動】強く勧める、急がせる", "pos": "動", "example": "Urge caution.", "phrase": "urge on", "set": 1},
    {"word": "urgently", "meaning": "【副】至急", "pos": "副", "example": "Need urgently.", "phrase": "urgently required", "set": 1},
    {"word": "user", "meaning": "【名】使用者", "pos": "名", "example": "Computer user.", "phrase": "user friendly", "set": 1},
    {"word": "usher", "meaning": "【動】案内する", "pos": "動", "example": "Usher in.", "phrase": "usher to seat", "set": 1},
    {"word": "utilise", "meaning": "【動】利用する（英）", "pos": "動", "example": "Utilise resources.", "phrase": "fully utilise", "set": 1},
    {"word": "utility", "meaning": "【名】有用性、公益事業", "pos": "名", "example": "Public utility.", "phrase": "utility bill", "set": 1},
    {"word": "utilize", "meaning": "【動】利用する", "pos": "動", "example": "Utilize technology.", "phrase": "utilize skills", "set": 1},
    {"word": "utter", "meaning": "【動】発する", "pos": "動", "example": "Utter a word.", "phrase": "without uttering", "set": 1},
    {"word": "utterly", "meaning": "【副】全く", "pos": "副", "example": "Utterly exhausted.", "phrase": "utterly ridiculous", "set": 1},
    {"word": "vacant", "meaning": "【形】空いている", "pos": "形", "example": "Vacant seat.", "phrase": "vacant stare", "set": 1},
    {"word": "vaccine", "meaning": "【名】ワクチン", "pos": "名", "example": "Flu vaccine.", "phrase": "vaccine research", "set": 1},
    {"word": "valentine", "meaning": "【名】バレンタイン", "pos": "名", "example": "Be my valentine.", "phrase": "valentine card", "set": 1},
    {"word": "valid", "meaning": "【形】有効な", "pos": "形", "example": "Valid passport.", "phrase": "valid reason", "set": 1},
    {"word": "value", "meaning": "【動】評価する、重んじる", "pos": "動", "example": "Value friendship.", "phrase": "value highly", "set": 1},
    {"word": "vanish", "meaning": "【動】消える", "pos": "動", "example": "Vanish into thin air.", "phrase": "vanish without trace", "set": 1},
    {"word": "vanity", "meaning": "【名】虚栄心", "pos": "名", "example": "Wounded vanity.", "phrase": "vanity case", "set": 1},
    {"word": "variation", "meaning": "【名】変化、変異", "pos": "名", "example": "Genetic variation.", "phrase": "variation in", "set": 1},
    {"word": "varied", "meaning": "【形】変化に富んだ", "pos": "形", "example": "Varied diet.", "phrase": "varied interests", "set": 1},
    {"word": "venture", "meaning": "【名】冒険的事業", "pos": "名", "example": "Joint venture.", "phrase": "bold venture", "set": 1},
    {"word": "venue", "meaning": "【名】開催地", "pos": "名", "example": "Concert venue.", "phrase": "change of venue", "set": 1},
    {"word": "verbal", "meaning": "【形】言葉の", "pos": "形", "example": "Verbal abuse.", "phrase": "verbal agreement", "set": 1},
    {"word": "verbally", "meaning": "【副】言葉で", "pos": "副", "example": "Abused verbally.", "phrase": "communicate verbally", "set": 1},
    {"word": "verse", "meaning": "【名】韻文、詩節", "pos": "名", "example": "Write verse.", "phrase": "chapter and verse", "set": 1},
    {"word": "verse", "meaning": "【動】精通させる", "pos": "動", "example": "Well versed in.", "phrase": "verse oneself", "set": 1},
    {"word": "version", "meaning": "【名】版", "pos": "名", "example": "Latest version.", "phrase": "original version", "set": 1},
    {"word": "versus", "meaning": "【前】対", "pos": "前", "example": " Us versus them.", "phrase": "pro versus con", "set": 1},
    {"word": "very", "meaning": "【形】まさにその", "pos": "形", "example": "The very best.", "phrase": "at the very moment", "set": 1},
    {"word": "veteran", "meaning": "【名】ベテラン、退役軍人", "pos": "名", "example": "War veteran.", "phrase": "veteran actor", "set": 1},
    {"word": "vibrate", "meaning": "【動】振動する", "pos": "動", "example": "Phone vibrated.", "phrase": "vibrate with energy", "set": 1},
    {"word": "vibration", "meaning": "【名】振動", "pos": "名", "example": "Feel the vibration.", "phrase": "good vibrations", "set": 1},
    {"word": "viewer", "meaning": "【名】視聴者", "pos": "名", "example": "TV viewer.", "phrase": "viewer discretion", "set": 1},
    {"word": "vigor", "meaning": "【名】活力", "pos": "名", "example": "Renewed vigor.", "phrase": "full of vigor", "set": 1},
    {"word": "vigorous", "meaning": "【形】精力的な", "pos": "形", "example": "Vigorous exercise.", "phrase": "vigorous debate", "set": 1},
    {"word": "vigorously", "meaning": "【副】精力的に", "pos": "副", "example": "Shake vigorously.", "phrase": "defend vigorously", "set": 1},
    {"word": "vigour", "meaning": "【名】活力（英）", "pos": "名", "example": "Youthful vigour.", "phrase": "vim and vigour", "set": 1},
    {"word": "villa", "meaning": "【名】別荘", "pos": "名", "example": "Holiday villa.", "phrase": "Roman villa", "set": 1},
    {"word": "villager", "meaning": "【名】村人", "pos": "名", "example": "Local villager.", "phrase": "villager life", "set": 1},
    {"word": "vinegar", "meaning": "【名】酢", "pos": "名", "example": "Malt vinegar.", "phrase": "oil and vinegar", "set": 1},
    {"word": "violate", "meaning": "【動】違反する、侵害する", "pos": "動", "example": "Violate a law.", "phrase": "violate privacy", "set": 1},
    {"word": "virtual reality", "meaning": "【名】仮想現実", "pos": "名", "example": "Virtual reality headset.", "phrase": "in virtual reality", "set": 1},
    {"word": "virtually", "meaning": "【副】実質的に", "pos": "副", "example": "Virtually impossible.", "phrase": "virtually unknown", "set": 1},
    {"word": "virtue", "meaning": "【名】美徳", "pos": "名", "example": "Patience is a virtue.", "phrase": "by virtue of", "set": 1},
    {"word": "visibly", "meaning": "【副】目に見えて", "pos": "副", "example": "Visibly shaken.", "phrase": "visibly upset", "set": 1},
    {"word": "vital", "meaning": "【形】極めて重要な", "pos": "形", "example": "Vital signs.", "phrase": "vital role", "set": 1},
    {"word": "vitamin", "meaning": "【名】ビタミン", "pos": "名", "example": "Vitamin C.", "phrase": "take vitamins", "set": 1},
    {"word": "vocalist", "meaning": "【名】ボーカリスト", "pos": "名", "example": "Lead vocalist.", "phrase": "jazz vocalist", "set": 1},
    {"word": "volunteer", "meaning": "【名】ボランティア", "pos": "名", "example": "Work as volunteer.", "phrase": "volunteer work", "set": 1},
    {"word": "vomit", "meaning": "【名】嘔吐物", "pos": "名", "example": "Smell of vomit.", "phrase": "make vomit", "set": 1},
    {"word": "voter", "meaning": "【名】有権者", "pos": "名", "example": "Registered voter.", "phrase": "voter turnout", "set": 1},
    {"word": "vow", "meaning": "【名】誓い", "pos": "名", "example": "Marriage vow.", "phrase": "take a vow", "set": 1},
    {"word": "wage", "meaning": "【名】賃金", "pos": "名", "example": "Minimum wage.", "phrase": "living wage", "set": 1},
    {"word": "waist", "meaning": "【名】腰", "pos": "名", "example": "Slim waist.", "phrase": "waist size", "set": 1},
    {"word": "waistcoat", "meaning": "【名】チョッキ（英）", "pos": "名", "example": "Silk waistcoat.", "phrase": "wear a waistcoat", "set": 1},
    {"word": "wait", "meaning": "【名】待つこと", "pos": "名", "example": "Long wait.", "phrase": "wait and see", "set": 1},
    {"word": "walkabout", "meaning": "【名】徒歩旅行、散策", "pos": "名", "example": "Go on walkabout.", "phrase": "royal walkabout", "set": 1},
    {"word": "walker", "meaning": "【名】歩行者", "pos": "名", "example": "Slow walker.", "phrase": "baby walker", "set": 1},
    {"word": "wallboard", "meaning": "【名】壁板", "pos": "名", "example": "Gypsum wallboard.", "phrase": "install wallboard", "set": 1},
    {"word": "walnut", "meaning": "【名】クルミ", "pos": "名", "example": "Walnut shell.", "phrase": "walnut tree", "set": 1},
    {"word": "want", "meaning": "【名】不足、必要", "pos": "名", "example": "For want of.", "phrase": "freedom from want", "set": 1},
    {"word": "warship", "meaning": "【名】軍艦", "pos": "名", "example": "Naval warship.", "phrase": "sink a warship", "set": 1},
    {"word": "wartime", "meaning": "【名】戦時", "pos": "名", "example": "Wartime leader.", "phrase": "in wartime", "set": 1},
    {"word": "wasp", "meaning": "【名】スズメバチ", "pos": "名", "example": "Wasp sting.", "phrase": "wasp nest", "set": 1},
    {"word": "water", "meaning": "【動】水をやる", "pos": "動", "example": "Water the plants.", "phrase": "mouth water", "set": 1},
    {"word": "waterproof", "meaning": "【形】防水の", "pos": "形", "example": "Waterproof watch.", "phrase": "waterproof jacket", "set": 1},
    {"word": "weaken", "meaning": "【動】弱める、弱まる", "pos": "動", "example": "Weaken the economy.", "phrase": "grip weakened", "set": 1},
    {"word": "weakly", "meaning": "【副】弱々しく", "pos": "副", "example": "Smile weakly.", "phrase": "argue weakly", "set": 1},
    {"word": "wealthy", "meaning": "【形】裕福な", "pos": "形", "example": "Wealthy family.", "phrase": "wealthy nation", "set": 1},
    {"word": "wearisome", "meaning": "【形】疲れさせる、退屈な", "pos": "形", "example": "Wearisome task.", "phrase": "wearisome journey", "set": 1},
    {"word": "weary", "meaning": "【形】疲れた", "pos": "形", "example": "Weary traveler.", "phrase": "weary of", "set": 1},
    {"word": "weave", "meaning": "【名】織り方 (verb mostly)", "pos": "名", "example": "Loose weave.", "phrase": "basket weave", "set": 1},
    {"word": "wed", "meaning": "【動】結婚する", "pos": "動", "example": "Newly wed.", "phrase": "wed to", "set": 1},
    {"word": "weed", "meaning": "【名】雑草", "pos": "名", "example": "Pull weeds.", "phrase": "grow like a weed", "set": 1},
    {"word": "welcome", "meaning": "【名】歓迎", "pos": "名", "example": "Warm welcome.", "phrase": "welcome back", "set": 1},
    {"word": "welfare", "meaning": "【名】福祉", "pos": "名", "example": "Social welfare.", "phrase": "on welfare", "set": 1},
    {"word": "well-balanced", "meaning": "【形】バランスの取れた", "pos": "形", "example": "Well-balanced diet.", "phrase": "well-balanced meal", "set": 1},
    {"word": "well-built", "meaning": "【形】体格の良い、頑丈な", "pos": "形", "example": "Well-built man.", "phrase": "well-built house", "set": 1},
    {"word": "well-organised", "meaning": "【形】組織的な", "pos": "形", "example": "Well-organised event.", "phrase": "well-organised person", "set": 1},
    {"word": "well-organized", "meaning": "【形】組織的な", "pos": "形", "example": "Well-organized team.", "phrase": "well-organized plan", "set": 1},
    {"word": "well-paid", "meaning": "【形】給料の良い", "pos": "形", "example": "Well-paid job.", "phrase": "get well-paid", "set": 1},
    {"word": "western", "meaning": "【形】西の", "pos": "形", "example": "Western world.", "phrase": "western civilization", "set": 1},
    {"word": "wheat", "meaning": "【名】小麦", "pos": "名", "example": "Wheat flour.", "phrase": "whole wheat", "set": 1},
    {"word": "whereas", "meaning": "【接】～である一方で", "pos": "接", "example": "Rich whereas poor.", "phrase": "whereas I think", "set": 1},
    {"word": "whichever", "meaning": "【代】どちらでも", "pos": "代", "example": "Choose whichever.", "phrase": "whichever you like", "set": 1},
    {"word": "whip", "meaning": "【動】鞭打つ", "pos": "動", "example": "Whip a horse.", "phrase": "whip up", "set": 1},
    {"word": "whiskey", "meaning": "【名】ウイスキー", "pos": "名", "example": "Irish whiskey.", "phrase": "shot of whiskey", "set": 1},
    {"word": "whisky", "meaning": "【名】ウイスキー（英）", "pos": "名", "example": "Scotch whisky.", "phrase": "drink whisky", "set": 1},
    {"word": "whisper", "meaning": "【動】ささやく", "pos": "動", "example": "Whisper a secret.", "phrase": "whisper in ear", "set": 1},
    {"word": "whistle", "meaning": "【動】口笛を吹く", "pos": "動", "example": "Whistle a tune.", "phrase": "whistle blower", "set": 1},
    {"word": "widen", "meaning": "【動】広がる、広げる", "pos": "動", "example": "Road widens.", "phrase": "widen gap", "set": 1},
    {"word": "widow", "meaning": "【名】未亡人", "pos": "名", "example": "War widow.", "phrase": "wealthy widow", "set": 1},
    {"word": "width", "meaning": "【名】幅", "pos": "名", "example": "Width of the room.", "phrase": "in width", "set": 1},
    {"word": "wilderness", "meaning": "【名】荒野", "pos": "名", "example": "Lost in wilderness.", "phrase": "wilderness area", "set": 1},
    {"word": "will", "meaning": "【名】意志、遺言", "pos": "名", "example": "Free will.", "phrase": "at will", "set": 1},
    {"word": "willing", "meaning": "【形】喜んで～する", "pos": "形", "example": "Willing to help.", "phrase": "willing victim", "set": 1},
    {"word": "willingly", "meaning": "【副】快く", "pos": "副", "example": "Help willingly.", "phrase": "go willingly", "set": 1},
    {"word": "win", "meaning": "【名】勝利", "pos": "名", "example": "Big win.", "phrase": "win win situation", "set": 1},
    {"word": "wind", "meaning": "【動】巻く、曲がりくねる", "pos": "動", "example": "Wind the clock.", "phrase": "wind up", "set": 1},
    {"word": "winding", "meaning": "【形】曲がりくねった", "pos": "形", "example": "Winding road.", "phrase": "winding path", "set": 1},
    {"word": "windshield", "meaning": "【名】フロントガラス", "pos": "名", "example": "Cracked windshield.", "phrase": "windshield wiper", "set": 1},
    {"word": "wink", "meaning": "【名】ウインク", "pos": "名", "example": "Give a wink.", "phrase": "nod and a wink", "set": 1},
    {"word": "wipe", "meaning": "【動】拭く", "pos": "動", "example": "Wipe the table.", "phrase": "wipe out", "set": 1},
    {"word": "wire", "meaning": "【動】配線する", "pos": "動", "example": "Wire the house.", "phrase": "wire money", "set": 1},
    {"word": "wit", "meaning": "【名】機転、知力", "pos": "名", "example": "Quick wit.", "phrase": "at wits' end", "set": 1},
    {"word": "withdraw", "meaning": "【動】撤回する、引き出す", "pos": "動", "example": "Withdraw money.", "phrase": "withdraw support", "set": 1},
    {"word": "withdrawal", "meaning": "【名】撤退、引き出し", "pos": "名", "example": "Troop withdrawal.", "phrase": "withdrawal symptom", "set": 1},
    {"word": "witness", "meaning": "【名】目撃者、証人", "pos": "名", "example": "Eye witness.", "phrase": "bear witness", "set": 1},
    {"word": "witty", "meaning": "【形】気の利いた", "pos": "形", "example": "Witty remark.", "phrase": "witty conversation", "set": 1},
    {"word": "wolf", "meaning": "【名】オオカミ", "pos": "名", "example": "Wolf pack.", "phrase": "cry wolf", "set": 1},
    {"word": "wondrous", "meaning": "【形】驚くべき", "pos": "形", "example": "Wondrous sight.", "phrase": "wondrous thing", "set": 1},
    {"word": "woodcarving", "meaning": "【名】木彫り", "pos": "名", "example": "Intricate woodcarving.", "phrase": "woodcarving tool", "set": 1},
    {"word": "wordlessly", "meaning": "【副】無言で", "pos": "副", "example": "Stared wordlessly.", "phrase": "communicate wordlessly", "set": 1},
    {"word": "workaholic", "meaning": "【形】仕事中毒の", "pos": "形", "example": "He is workaholic.", "phrase": "workaholic tendancy", "set": 1},
    {"word": "workbench", "meaning": "【名】作業台", "pos": "名", "example": "Carpenter's workbench.", "phrase": "clean the workbench", "set": 1},
    {"word": "workman", "meaning": "【名】労働者", "pos": "名", "example": "Skilled workman.", "phrase": "workman compensation", "set": 1},
    {"word": "worktable", "meaning": "【名】作業テーブル", "pos": "名", "example": "Sturdy worktable.", "phrase": "kitchen worktable", "set": 1},
    {"word": "worldly", "meaning": "【形】世俗的な、世慣れた", "pos": "形", "example": "Worldly goods.", "phrase": "worldly wise", "set": 1},
    {"word": "worldview", "meaning": "【名】世界観", "pos": "名", "example": "Scientific worldview.", "phrase": "shape worldview", "set": 1},
    {"word": "worldwide", "meaning": "【形】世界的な", "pos": "形", "example": "Worldwide success.", "phrase": "worldwide web", "set": 1},
    {"word": "worm", "meaning": "【名】虫", "pos": "名", "example": "Earth worm.", "phrase": "can of worms", "set": 1},
    {"word": "worn out", "meaning": "【形】すり切れた、疲れ果てた", "pos": "形", "example": "Worn out shoes.", "phrase": "completely worn out", "set": 1},
    {"word": "wornout", "meaning": "【形】使い古した", "pos": "形", "example": "Wornout clothes.", "phrase": "look wornout", "set": 1},
    {"word": "worn-out", "meaning": "【形】使い古した", "pos": "形", "example": "Worn-out tires.", "phrase": "feel worn-out", "set": 1},
    {"word": "worrying", "meaning": "【形】心配な", "pos": "形", "example": "Worrying trend.", "phrase": "worrying news", "set": 1},
    {"word": "worse", "meaning": "【名】より悪いこと", "pos": "名", "example": "Change for the worse.", "phrase": "none the worse", "set": 1},
    {"word": "worsen", "meaning": "【動】悪化する", "pos": "動", "example": "Situation worsened.", "phrase": "worsen symptoms", "set": 1},
    {"word": "worship", "meaning": "【名】崇拝", "pos": "名", "example": "Place of worship.", "phrase": "hero worship", "set": 1},
    {"word": "worst", "meaning": "【副】最も悪く", "pos": "副", "example": "Worst case scenario.", "phrase": "at worst", "set": 1},
    {"word": "worthless", "meaning": "【形】価値のない", "pos": "形", "example": "Worthless junk.", "phrase": "feel worthless", "set": 1},
    {"word": "wound", "meaning": "【動】傷つける", "pos": "動", "example": "Wounded soldier.", "phrase": "wound pride", "set": 1},
    {"word": "wreck", "meaning": "【名】難破、残骸", "pos": "名", "example": "Train wreck.", "phrase": "nervous wreck", "set": 1},
    {"word": "wrongly", "meaning": "【副】間違って", "pos": "副", "example": "Wrongly accused.", "phrase": "wrongly spell", "set": 1},
    {"word": "X-ray", "meaning": "【名】X線", "pos": "名", "example": "Chest X-ray.", "phrase": "take an X-ray", "set": 1},
    {"word": "yacht", "meaning": "【名】ヨット", "pos": "名", "example": "Sailing yacht.", "phrase": "yacht club", "set": 1},
    {"word": "yawn", "meaning": "【名】あくび", "pos": "名", "example": "Stifle a yawn.", "phrase": "big yawn", "set": 1},
    {"word": "yawn", "meaning": "【動】あくびをする", "pos": "動", "example": "Yawn with boredom.", "phrase": "make me yawn", "set": 1},
    {"word": "yearn", "meaning": "【動】切望する", "pos": "動", "example": "Yearn for home.", "phrase": "yearn to be free", "set": 1},
    {"word": "yell", "meaning": "【動】叫ぶ", "pos": "動", "example": "Yell at someone.", "phrase": "yell for help", "set": 1},
    {"word": "yield", "meaning": "【動】産出する、屈する", "pos": "動", "example": "Yield profit.", "phrase": "yield right of way", "set": 1},
    {"word": "youthful", "meaning": "【形】若々しい", "pos": "形", "example": "Youthful appearance.", "phrase": "youthful energy", "set": 1},
    {"word": "yummy", "meaning": "【形】おいしい", "pos": "形", "example": "Yummy food.", "phrase": "really yummy", "set": 1},
    {"word": "zebra", "meaning": "【名】シマウマ", "pos": "名", "example": "Zebra stripes.", "phrase": "zebra crossing", "set": 1},
    {"word": "zip", "meaning": "【名】ファスナー（英）", "pos": "名", "example": "Do up zip.", "phrase": "zip code", "set": 1},
    {"word": "zoom", "meaning": "【名】急上昇、ズーム", "pos": "名", "example": "Camera zoom.", "phrase": "zoom lens", "set": 1},
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
