
const fs = require('fs');
const path = require('path');

const vocabPath = path.join(__dirname, '../data/vocabulary.js');
let fileContent = fs.readFileSync(vocabPath, 'utf8');

// We need to parse it to modify it.
// Since it is a JS file with `const DEFAULT_VOCABULARY = ...`, we can try to eval it or regex replace it.
// Regex replacement is safer to preserve formatting of OTHER parts, but we need to target specific objects.
// However, since the user is okay with a script fix, parsing -> modifying -> stringifying might lose comments or formatting.
// But vocabulary.js structure seems uniform.
// Let's try to be precise. We will load it as a module to get the objects, but to WRITE it back, we might want to use a smart replacer or just rewrite the `selection1900` part.

// Actually, rewriting the whole file logic in JS is risky for formatting.
// But `vocabulary.js` is data.
// Let's try to just find the `selection1900` block and replace it? No, it's too big.
// We will iterate the array in memory and then reconstruct the file content string for that specific array?
// Or better: valid JS data file. We can recreate the string.

// Let's use the method of reading, patching in memory, and writing back with `JSON.stringify` logic BUT keeping it as valid JS code.
// Note: The original file probably doesn't have quotes around keys like `word:`, but JSON.stringify does.
// The user might care about code style.
// However, fixing the data is priority.

// Let's load the data map first.
const patchData = {
    "accord": { pos: "noun", phrase: "in accord with", example: "We are in accord with your proposal." },
    "technology": { pos: "noun", phrase: "advanced technology", example: "Technology has changed our lives." },
    "solve": { pos: "verb", phrase: "solve a problem", example: "He found a way to solve the puzzle." },
    "site": { pos: "noun", phrase: "construction site", example: "They visited the historic site." },
    "survey": { pos: "noun", phrase: "conduct a survey", example: "The survey shows a change in public opinion." },
    "topic": { pos: "noun", phrase: "topic of conversation", example: "The main topic was climate change." },
    "cognitive": { pos: "adj", phrase: "cognitive ability", example: "Puzzles improve cognitive function." },
    "FALSE": { pos: "adj", phrase: "false accusation", example: "The statement was proven false." },
    "sight": { pos: "noun", phrase: "catch sight of", example: "She lost her sight in an accident." },
    "fossil": { pos: "noun", phrase: "fossil fuel", example: "Fossils tell us about ancient life." },
    "diversity": { pos: "noun", phrase: "cultural diversity", example: "Biodiversity is essential for nature." },
    "dialect": { pos: "noun", phrase: "local dialect", example: "They speak a unique dialect in this region." },
    "mammal": { pos: "noun", phrase: "marine mammal", example: "Whales are the largest mammals." },
    "norm": { pos: "noun", phrase: "social norm", example: "It is the norm to tip (money) in this country." },
    "linguistic": { pos: "adj", phrase: "linguistic skill", example: "Children have high linguistic ability." },
    "strict": { pos: "adj", phrase: "strict rule", example: "The school has strict regulations." },
    "hypothesis": { pos: "noun", phrase: "test a hypothesis", example: "The experiment supported his hypothesis." },
    "colony": { pos: "noun", phrase: "former colony", example: "India was once a British colony." },
    "distinct": { pos: "adj", phrase: "distinct flavor", example: "The two ideas are quite distinct." },
    "alien": { pos: "adj", phrase: "alien culture", example: "The custom felt alien to me." },
    "sum": { pos: "noun", phrase: "sum of money", example: "The sum of 2 and 3 is 5." },
    "boundary": { pos: "noun", phrase: "cross the boundary", example: "The river marks the boundary between the two states." },
    "predator": { pos: "noun", phrase: "natural predator", example: "Lions are top predators." },
    "bias": { pos: "noun", phrase: "gender bias", example: "We must avoid bias in our decision." },
    "patent": { pos: "noun", phrase: "patent pending", example: "He applied for a patent on his invention." },
    "equivalent": { pos: "adj", phrase: "equivalent to", example: "One dollar is equivalent to 100 cents." },
    "random": { pos: "adj", phrase: "at random", example: "Winners were chosen at random." },
    "isolate": { pos: "verb", phrase: "isolate the patient", example: "They decided to isolate the virus." },
    "literacy": { pos: "noun", phrase: "computer literacy", example: "Literacy rates have improved globally." },
    "protein": { pos: "noun", phrase: "rich in protein", example: "Meat and beans are sources of protein." },
    "inequality": { pos: "noun", phrase: "social inequality", example: "They fought against racial inequality." },
    "glacier": { pos: "noun", phrase: "melting glacier", example: "Glaciers are retreating due to warming." },
    "primate": { pos: "noun", phrase: "order of primates", example: "Humans and monkeys are primates." },
    "correlation": { pos: "noun", phrase: "correlation between", example: "There is a correlation between smoking and health issues." },
    "frustrate": { pos: "verb", phrase: "frustrate the plan", example: "The bad weather frustrated our efforts." },
    "mode": { pos: "noun", phrase: "mode of transport", example: "Rail is a common mode of travel." },
    "gravity": { pos: "noun", phrase: "law of gravity", example: "Zero gravity is experienced in space." },
    "asteroid": { pos: "noun", phrase: "asteroid belt", example: "An asteroid impact caused extinction." },
    "grocery": { pos: "noun", phrase: "grocery store", example: "I need to pick up items at the grocery." },
    "illusion": { pos: "noun", phrase: "optical illusion", example: "The magician created an illusion." },
    "prefecture": { pos: "noun", phrase: "Kyoto prefecture", example: "Japan is divided into 47 prefectures." },
    "Arctic": { pos: "adj", phrase: "Arctic Ocean", example: "Polar bears live in the Arctic region." },
    "immune": { pos: "adj", phrase: "immune system", example: "Vaccines make you immune to diseases." },
    "harsh": { pos: "adj", phrase: "harsh reality", example: "The punishment was too harsh." },
    "collective": { pos: "adj", phrase: "collective effort", example: "It was a collective decision by the team." },
    "profound": { pos: "adj", phrase: "profound impact", example: "Her speech had a profound effect on me." },
    "bob": { pos: "verb", phrase: "bob up and down", example: "The cork bobbed on the water." },
    "underlie": { pos: "verb", phrase: "underlie the problem", example: "A different theory underlies this method." },
    "neuron": { pos: "noun", phrase: "motor neuron", example: "Neurons transmit signals in the brain." },
    "workforce": { pos: "noun", phrase: "skilled workforce", example: "The company has a diverse workforce." },
    "scenario": { pos: "noun", phrase: "worst-case scenario", example: "We planned for every possible scenario." },
    "allergy": { pos: "noun", phrase: "food allergy", example: "She has an allergy to peanuts." },
    "antibiotic": { pos: "noun", phrase: "take antibiotics", example: "The doctor prescribed antibiotics." },
    "galaxy": { pos: "noun", phrase: "Milky Way galaxy", example: "The universe contains billions of galaxies." },
    "counterpart": { pos: "noun", phrase: "foreign counterpart", example: "Values are different from their counterparts." },
    "sibling": { pos: "noun", phrase: "sibling rivalry", example: "I have two siblings, a brother and a sister." },
    "ratio": { pos: "noun", phrase: "ratio of men to women", example: "The ratio was 2 to 1." },
    "magnetic": { pos: "adj", phrase: "magnetic field", example: "Iron is a magnetic material." },
    "polar": { pos: "adj", phrase: "polar bear", example: "The polar regions are very cold." },
    "vulnerable": { pos: "adj", phrase: "vulnerable to attack", example: "Children are vulnerable to illness." },
    "diminish": { pos: "verb", phrase: "diminish the importance", example: "His influence diminished over time." },
    "cite": { pos: "verb", phrase: "cite an example", example: "He cited several experts in his report." },
    "foster": { pos: "verb", phrase: "foster a child", example: "The program aims to foster innovation." },
    "premise": { pos: "noun", phrase: "based on the premise", example: "The argument relies on a false premise." },
    "merit": { pos: "noun", phrase: "merit and demerit", example: "We discussed the merits of the plan." },
    "infrastructure": { pos: "noun", phrase: "public infrastructure", example: "Investment in infrastructure is needed." },
    "distress": { pos: "noun", phrase: "in distress", example: "The ship sent a distress signal." },
    "adolescent": { pos: "noun", phrase: "adolescent behavior", example: "Adolescents experience rapid growth." },
    "poll": { pos: "noun", phrase: "opinion poll", example: "The poll shows the candidate leading." },
    "dementia": { pos: "noun", phrase: "suffer from dementia", example: "Dementia affects memory in old age." },
    "fatigue": { pos: "noun", phrase: "muscle fatigue", example: "He collapsed from fatigue." },
    "fingerprint": { pos: "noun", phrase: "take fingerprints", example: "No two fingerprints are alike." },
    "pesticide": { pos: "noun", phrase: "use of pesticides", example: "Organic farms avoid pesticides." },
    "elaborate": { pos: "adj", phrase: "elaborate design", example: "They made elaborate preparations for the party." },
    "subsequent": { pos: "adj", phrase: "subsequent events", example: "The theory was proved in subsequent studies." },
    "inferior": { pos: "adj", phrase: "inferior to", example: "This product is inferior in quality." },
    "obese": { pos: "adj", phrase: "obese patients", example: "Being obese increases health risks." },
    "orient": { pos: "verb", phrase: "orient oneself", example: "She needs time to orient herself to the new job." },
    "advocate": { pos: "verb", phrase: "advocate for peace", example: "He advocates simpler laws." },
    "migrate": { pos: "verb", phrase: "birds migrate", example: "Many birds migrate south for winter." },
    "disgust": { pos: "noun", phrase: "in disgust", example: "She looked at the mess in disgust." },
    "empathy": { pos: "noun", phrase: "feel empathy", example: "He lacks empathy for others." },
    "cue": { pos: "noun", phrase: "give a cue", example: "The actor waited for his cue." },
    "congress": { pos: "noun", phrase: "member of Congress", example: "Congress passed the new bill." },
    "millennium": { pos: "noun", phrase: "new millennium", example: "We celebrated the turn of the millennium." },
    "Muslim": { pos: "noun", phrase: "Muslim community", example: "He is a devout Muslim." },
    "landmine": { pos: "noun", phrase: "buried landmine", example: "Landmines are dangerous remnants of war." },
    "beverage": { pos: "noun", phrase: "alcoholic beverage", example: "Hot beverages are served here." },
    "diabetes": { pos: "noun", phrase: "type 2 diabetes", example: "Diet helps manage diabetes." },
    "prey": { pos: "noun", phrase: "birds of prey", example: "The lion stalked its prey." },
    "parallel": { pos: "adj", phrase: "parallel to", example: "The road runs parallel to the river." },
    "vertical": { pos: "adj", phrase: "vertical line", example: "Check the vertical alignment." },
    "indigenous": { pos: "adj", phrase: "indigenous people", example: "The kangaroo is indigenous to Australia." },
    "irrelevant": { pos: "adj", phrase: "irrelevant detail", example: "Wait, that's irrelevant to the topic." },
    "sensory": { pos: "adj", phrase: "sensory organ", example: "The eyes are sensory organs." },
    "chronic": { pos: "adj", phrase: "chronic pain", example: "He suffers from chronic back pain." },
    "voluntary": { pos: "adj", phrase: "voluntary work", example: "Attendance is voluntary." },
    "inclined": { pos: "adj", phrase: "inclined to agree", example: "I am inclined to believe him." },
    "esteem": { pos: "noun", phrase: "high esteem", example: "He is held in high esteem by his peers." },
    "accelerate": { pos: "verb", phrase: "accelerate growth", example: "The car accelerated quickly." },
    "flourish": { pos: "verb", phrase: "flourishing business", example: "The arts flourished during that period." },
    "thrive": { pos: "verb", phrase: "thrive on stress", example: "Plants thrive in sunlight." },
    "nurture": { pos: "verb", phrase: "nurture talent", example: "Parents nurture their children." },
    "drift": { pos: "verb", phrase: "drift apart", example: "The boat drifted out to sea." },
    "incorporate": { pos: "verb", phrase: "incorporate a feature", example: "We incorporated his specific suggestions." },
    "cortex": { pos: "noun", phrase: "cerebral cortex", example: "The cortex controls brain functions." },
    "chamber": { pos: "noun", phrase: "secret chamber", example: "The heart has four chambers." },
    "offspring": { pos: "noun", phrase: "produce offspring", example: "Parents protect their offspring." },
    "famine": { pos: "noun", phrase: "widespread famine", example: "The drought caused a severe famine." },
    "commodity": { pos: "noun", phrase: "valuable commodity", example: "Oil is a major commodity." },
    "recipient": { pos: "noun", phrase: "recipient of the award", example: "Who is the intended recipient?" },
    "inability": { pos: "noun", phrase: "inability to speak", example: "His inability to decide was a problem." },
    "combat": { pos: "verb", phrase: "combat climate change", example: "We must combat this disease." },
    "fraction": { pos: "noun", phrase: "fraction of the cost", example: "She paid only a fraction of the price." },
    "intuition": { pos: "noun", phrase: "trust your intuition", example: "My intuition told me to stop." },
    "hierarchy": { pos: "noun", phrase: "social hierarchy", example: "Wolves have a strict hierarchy." },
    "asset": { pos: "noun", phrase: "valuable asset", example: "He is a great asset to the company." },
    "cosmetic": { pos: "adj", phrase: "cosmetic surgery", example: "The changes were merely cosmetic." },
    "aesthetic": { pos: "adj", phrase: "aesthetic appeal", example: "The building has great aesthetic value." },
    "demographic": { pos: "noun", phrase: "demographic shift", example: "Marketers study demographic data." },
    "wireless": { pos: "adj", phrase: "wireless network", example: "We have free wireless internet." },
    "ongoing": { pos: "adj", phrase: "ongoing investigation", example: "Discussions are ongoing." },
    "compel": { pos: "verb", phrase: "compel obedience", example: "I felt compelled to resign." },
    "prolong": { pos: "verb", phrase: "prolong life", example: "The treatment prolonged his life." },
    "depict": { pos: "verb", phrase: "depict a scene", example: "The painting depicts a rural landscape." },
    "emit": { pos: "verb", phrase: "emit light", example: "The sun emits radiation." },
    "comprise": { pos: "verb", phrase: "comprised of", example: "The team is comprised of experts." },
    "quest": { pos: "noun", phrase: "quest for truth", example: "He went on a quest for gold." },
    "criterion": { pos: "noun", phrase: "selection criterion", example: "What is the main criterion for success?" },
    "mainstream": { pos: "noun", phrase: "mainstream culture", example: "The idea has entered the mainstream." },
    "epidemic": { pos: "noun", phrase: "flu epidemic", example: "Authorities controlled the epidemic." },
    "cluster": { pos: "noun", phrase: "cluster of stars", example: "People stood in a cluster." },
    "pollen": { pos: "noun", phrase: "pollen allergy", example: "Bees carry pollen between flowers." },
    "hive": { pos: "noun", phrase: "bee hive", example: "Bees live in a hive." },
    "irrigation": { pos: "noun", phrase: "irrigation system", example: "Farms rely on irrigation." },
    "cuisine": { pos: "noun", phrase: "French cuisine", example: "She loves Italian cuisine." },
    "intake": { pos: "noun", phrase: "calorie intake", example: "Limit your sugar intake." },
    "spectrum": { pos: "noun", phrase: "political spectrum", example: "It covers a broad spectrum of ideas." },
    "kidney": { pos: "noun", phrase: "kidney failure", example: "The kidney filters blood." },
    "skull": { pos: "noun", phrase: "human skull", example: "The brain is protected by the skull." },
    "unprecedented": { pos: "adj", phrase: "unprecedented event", example: "The scale of the disaster was unprecedented." },
    "infinite": { pos: "adj", phrase: "infinite space", example: " The universe seems infinite." },
    "obscure": { pos: "adj", phrase: "obscure meaning", example: "The reason remains obscure." },
    "skeptical": { pos: "adj", phrase: "skeptical about", example: "I am skeptical of his claims." },
    "fragile": { pos: "adj", phrase: "fragile glass", example: "Handle with care, it's fragile." },
    "static": { pos: "adj", phrase: "static electricity", example: "The image is static, not moving." },
    "vocal": { pos: "adj", phrase: "vocal cords", example: "He was very vocal about his objections." },
    "imperial": { pos: "adj", phrase: "imperial family", example: "We visited the imperial palace." },
    "hostile": { pos: "adj", phrase: "hostile environment", example: "The crowd became hostile." },
    "superficial": { pos: "adj", phrase: "superficial knowledge", example: "The wound was only superficial." },
    "scarce": { pos: "adj", phrase: "resources are scarce", example: "Food became scarce during the war." },
    "inherent": { pos: "adj", phrase: "inherent risk", example: "Risk is inherent in this business." },
    "notable": { pos: "adj", phrase: "notable achievement", example: "He is a notable author." },
    "induce": { pos: "verb", phrase: "induce sleep", example: "The drug induces relaxation." },
    "portray": { pos: "verb", phrase: "portray a character", example: "He portrayed the king in the movie." },
    "designate": { pos: "verb", phrase: "designated area", example: "This area is designated for parking." },
    "diagnose": { pos: "verb", phrase: "diagnose a disease", example: "He was diagnosed with flu." },
    "comprehend": { pos: "verb", phrase: "comprehend the meaning", example: "I simply cannot comprehend his attitude." },
    "oblige": { pos: "verb", phrase: "be obliged to", example: "I am obliged to answer that." },
    "cram": { pos: "verb", phrase: "cram for an exam", example: "He crammed all his clothes into the bag." },
    "distort": { pos: "verb", phrase: "distort the truth", example: "The heat distorted the image." },
    "undermine": { pos: "verb", phrase: "undermine confidence", example: "Scandals undermine the government." },
    "dispose": { pos: "verb", phrase: "dispose of waste", example: "Please dispose of your trash properly." },
    "refine": { pos: "verb", phrase: "refine oil", example: "You should refine your technique." },
    "coordinate": { pos: "verb", phrase: "coordinate activities", example: "We need to coordinate our schedules." },
    "internship": { pos: "noun", phrase: "summer internship", example: "She did an internship at Google." },
    "transaction": { pos: "noun", phrase: "business transaction", example: "The transaction was completed online." },
    "mutation": { pos: "noun", phrase: "genetic mutation", example: "The virus underwent a mutation." },
    "dairy": { pos: "noun", phrase: "dairy products", example: "I don't eat dairy products." },
    "posture": { pos: "noun", phrase: "good posture", example: "Sit up straight to improve your posture." },
    "census": { pos: "noun", phrase: "national census", example: "The census is taken every ten years." },
    "maze": { pos: "noun", phrase: "lost in a maze", example: "The streets were a maze." },
    "circulation": { pos: "noun", phrase: "blood circulation", example: "Exercise improves circulation." },
    "vacuum": { pos: "noun", phrase: "vacuum cleaner", example: "Nature abhors a vacuum." },
    "collision": { pos: "noun", phrase: "collision course", example: "The collision caused a traffic jam." },
    "landmark": { pos: "noun", phrase: "historic landmark", example: "The tower is a city landmark." },
    "supreme": { pos: "adj", phrase: "Supreme Court", example: "It was a supreme effort." },
    "metropolitan": { pos: "adj", phrase: "metropolitan area", example: "He lives in Tokyo metropolitan area." },
    "monetary": { pos: "adj", phrase: "monetary policy", example: "The item has little monetary value." },
    "drastic": { pos: "adj", phrase: "drastic change", example: "They took drastic measures." },
    "sole": { pos: "adj", phrase: "sole purpose", example: "He was the sole survivor." },
    "spontaneous": { pos: "adj", phrase: "spontaneous reaction", example: "The audience burst into spontaneous applause." },
    "spatial": { pos: "adj", phrase: "spatial awareness", example: "Architects need good spatial skills." },
    "conform": { pos: "verb", phrase: "conform to rules", example: "You must conform to the school dress code." },
    "halt": { pos: "verb", phrase: "halt production", example: "The train came to a sudden halt." },
    "provoke": { pos: "verb", phrase: "provoke anger", example: "His comments provoked a debate." },
    "populate": { pos: "verb", phrase: "densely populated", example: "The island is populated by birds." },
    "accommodate": { pos: "verb", phrase: "accommodate guests", example: "The hotel can accommodate 500 people." },
    "transplant": { pos: "verb", phrase: "heart transplant", example: "They transplanted the tree to the garden." },
    "reassure": { pos: "verb", phrase: "reassure the public", example: "I reassured him that everything was fine." },
    "speculate": { pos: "verb", phrase: "speculate on the future", example: "We can only speculate about the cause." },
    "surpass": { pos: "verb", phrase: "surpass expectations", example: "Sales surpassed last year's record." },
    "intrigue": { pos: "verb", phrase: "intrigue the audience", example: "The mystery intrigued me." },
    "awaken": { pos: "verb", phrase: "awaken from sleep", example: "I was awakened by a loud noise." },
    "surplus": { pos: "noun", phrase: "trade surplus", example: "The budget has a surplus this year." },
    "sweatshop": { pos: "noun", phrase: "sweatshop labor", example: "Activists protest against sweatshops." },
    "clash": { pos: "noun", phrase: "clash of cultures", example: "Protesters clashed with police." },
    "sociology": { pos: "noun", phrase: "study sociology", example: "Sociology studies human society." },
    "realm": { pos: "noun", phrase: "realm of fantasy", example: "That is within the realm of possibility." },
    "domain": { pos: "noun", phrase: "public domain", example: "This is outside my domain of expertise." },
    "algorithm": { pos: "noun", phrase: "search algorithm", example: "Computer algorithms solve problems." },
    "prairie": { pos: "noun", phrase: "large prairie", example: "Buffalo roamed the prairie." },
    "placebo": { pos: "noun", phrase: "placebo effect", example: "The patient was given a placebo." },
    "spouse": { pos: "noun", phrase: "husband or spouse", example: "Employees and their spouses are invited." },
    "makeup": { pos: "noun", phrase: "genetic makeup", example: "She is wearing makeup." },
    "mummy": { pos: "noun", phrase: "Egyptian mummy", example: "The museum displays a mummy." },
    "odor": { pos: "noun", phrase: "foul odor", example: "A strange odor filled the room." },
    "intellect": { pos: "noun", phrase: "human intellect", example: "He is a man of great intellect." },
    "manuscript": { pos: "noun", phrase: "ancient manuscript", example: "He sent his manuscript to the publisher." },
    "paradigm": { pos: "noun", phrase: "paradigm shift", example: "This represents a new paradigm in science." },
    "authentic": { pos: "adj", phrase: "authentic food", example: "This is an authentic Italian dish." },
    "empirical": { pos: "adj", phrase: "empirical evidence", example: "The theory is based on empirical data." },
    "immense": { pos: "adj", phrase: "immense pressure", example: "They made an immense profit." },
    "feminine": { pos: "adj", phrase: "feminine voice", example: "She has a feminine style." },
    "crude": { pos: "adj", phrase: "crude oil", example: "It was a crude drawing." },
    "susceptible": { pos: "adj", phrase: "susceptible to colds", example: "Elderly people are susceptible to the flu." },
    "edible": { pos: "adj", phrase: "edible plants", example: "Are these mushrooms edible?" },
    "explicit": { pos: "adj", phrase: "explicit instruction", example: "The instructions were explicit." },
    "prone": { pos: "adj", phrase: "accident prone", example: "He is prone to injury." },
    "affluent": { pos: "adj", phrase: "affluent society", example: "He grew up in an affluent neighborhood." },
    "collaborate": { pos: "verb", phrase: "collaborate with", example: "They collaborated on the project." },
    "exert": { pos: "verb", phrase: "exert influence", example: "He exerted all his strength." },
    "intervene": { pos: "verb", phrase: "intervene in a dispute", example: "The police had to intervene." },
    "insert": { pos: "verb", phrase: "insert a coin", example: "Insert the key into the lock." },
    "convict": { pos: "verb", phrase: "convict a criminal", example: "He was convicted of theft." },
    "dictate": { pos: "verb", phrase: "dictate terms", example: "He dictated the letter to his secretary." },
    "inhibit": { pos: "verb", phrase: "inhibit growth", example: "Fear can inhibit your action." },
    "stray": { pos: "verb", phrase: "stray dog", example: "Don't stray from the path." },
    "lag": { pos: "verb", phrase: "lag behind", example: "The video lagged due to slow internet." },
    "cling": { pos: "verb", phrase: "cling to hope", example: "The wet shirt clung to his body." },
    "erase": { pos: "verb", phrase: "erase a file", example: "Erase the writing from the board." },
    "grind": { pos: "verb", phrase: "grind coffee", example: "They grind wheat into flour." },
    "sprawl": { pos: "verb", phrase: "urban sprawl", example: "The city sprawls for miles." },
    "frown": { pos: "verb", phrase: "frown at", example: "She frowned at his bad joke." },
    "evoke": { pos: "verb", phrase: "evoke memories", example: "The song evoked sad memories." },
    "pledge": { pos: "verb", phrase: "pledge allegiance", example: "He pledged to support the cause." },
    "contemplate": { pos: "verb", phrase: "contemplate life", example: "He contemplated quitting his job." },
    "enlightenment": { pos: "noun", phrase: "Age of Enlightenment", example: "Meditation leads to enlightenment." },
    "timber": { pos: "noun", phrase: "timber industry", example: "The house is built of timber." },
    "autonomy": { pos: "noun", phrase: "local autonomy", example: "The region demanded greater autonomy." },
    "discourse": { pos: "noun", phrase: "public discourse", example: "We engaged in a civil discourse." },
    "glossary": { pos: "noun", phrase: "glossary of terms", example: "Check the glossary for definitions." },
    "archive": { pos: "noun", phrase: "digital archive", example: "The documents are in the archive." },
    "legacy": { pos: "noun", phrase: "cultural legacy", example: "He left a legacy of kindness." },
    "anthropology": { pos: "noun", phrase: "cultural anthropology", example: "She studies anthropology." },
    "psychiatrist": { pos: "noun", phrase: "visit a psychiatrist", example: "The psychiatrist treated his depression." },
    "irony": { pos: "noun", phrase: "dramatic irony", example: "The irony is that he famously hated technology." },
    "defect": { pos: "noun", phrase: "birth defect", example: "The car has a manufacturing defect." },
    "longevity": { pos: "noun", phrase: "health and longevity", example: "Exercise promotes longevity." },
    "sentiment": { pos: "noun", phrase: "public sentiment", example: "There is a growing anti-war sentiment." },
    "plausible": { pos: "adj", phrase: "plausible explanation", example: "His excuse sounded plausible." },
    "masculine": { pos: "adj", phrase: "masculine voice", example: "The room had a masculine decor." },
    "rigid": { pos: "adj", phrase: "rigid rules", example: "The metal bar is very rigid." },
    "arbitrary": { pos: "adj", phrase: "arbitrary decision", example: "The choice of color was arbitrary." },
    "subordinate": { pos: "adj", phrase: "subordinate to", example: "Personal interests are subordinate to the group." },
    "thermal": { pos: "adj", phrase: "thermal energy", example: "Wear thermal underwear in winter." },
    "naive": { pos: "adj", phrase: "naive belief", example: "He is naive to trust strangers." },
    "apt": { pos: "adj", phrase: "apt description", example: "She is an apt student." },
    "extrovert": { pos: "noun", phrase: "extrovert personality", example: "He is an extrovert who loves parties." },
    "conspicuous": { pos: "adj", phrase: "conspicuous consumption", example: "He felt conspicuous in the bright suit." },
    "intact": { pos: "adj", phrase: "remain intact", example: "The vase survived the fall intact." },
    "embody": { pos: "verb", phrase: "embody the spirit", example: "She embodies the values of the team." },
    "verify": { pos: "verb", phrase: "verify the truth", example: "Please verify your email address." },
    "disclose": { pos: "verb", phrase: "disclose information", example: "He refused to disclose the source." },
    "rotate": { pos: "verb", phrase: "rotate the tires", example: "The earth rotates on its axis." },
    "constrain": { pos: "verb", phrase: "constrained by time", example: "We are constrained by the budget." },
    "hinder": { pos: "verb", phrase: "hinder progress", example: "Bad weather hindered our travel." },
    "withstand": { pos: "verb", phrase: "withstand pressure", example: "The bridge can withstand earthquakes." },
    "tweet": { pos: "verb", phrase: "tweet a message", example: "Birds tweet in the morning." },
    "embed": { pos: "verb", phrase: "embed a video", example: "The reporter was embedded with the troops." },
    "render": { pos: "verb", phrase: "render assistance", example: "The shock rendered him speechless." },
    "plunge": { pos: "verb", phrase: "plunge into water", example: "Stock prices plunged yesterday." },
    "shun": { pos: "verb", phrase: "shun publicity", example: "He was shunned by his friends." },
    "flush": { pos: "verb", phrase: "flush the toilet", example: "Her face flushed with anger." },
    "presume": { pos: "verb", phrase: "presume innocence", example: "I presume you are tired." },
    "contend": { pos: "verb", phrase: "contend with difficulties", example: "He contends that the claim is false." },
    "entail": { pos: "verb", phrase: "entail risk", example: "The job entails a lot of travel." },
    "tactics": { pos: "noun", phrase: "marketing tactics", example: "They used aggressive tactics." },
    "textile": { pos: "noun", phrase: "textile industry", example: "Cotton is a common textile." },
    "metabolism": { pos: "noun", phrase: "fast metabolism", example: "Exercise boosts your metabolism." },
    "grid": { pos: "noun", phrase: "power grid", example: "The city streets form a grid." },
    "friction": { pos: "noun", phrase: "friction between", example: "Friction creates heat." },
    "monopoly": { pos: "noun", phrase: "have a monopoly", example: "The company has a monopoly on the market." },
    "staple": { pos: "noun", phrase: "staple diet", example: "Rice is a staple food in Asia." },
    "vendor": { pos: "noun", phrase: "street vendor", example: "He bought a hot dog from a vendor." },
    "predecessor": { pos: "noun", phrase: "immediate predecessor", example: "He replaced his predecessor." },
    "duration": { pos: "noun", phrase: "short duration", example: "The duration of the flight is 3 hours." },
    "geometry": { pos: "noun", phrase: "study geometry", example: "He likes algebra and geometry." },
    "symmetry": { pos: "noun", phrase: "perfect symmetry", example: "The building lacks symmetry." },
    "premium": { pos: "noun", phrase: "insurance premium", example: "You pay a premium for quality." },
    "protocol": { pos: "noun", phrase: "safety protocol", example: "Follow the standard protocol." },
    "specimen": { pos: "noun", phrase: "blood specimen", example: "The museum has rare specimens." },
    "intrinsic": { pos: "adj", phrase: "intrinsic value", example: "Gold has intrinsic value." },
    "vocational": { pos: "adj", phrase: "vocational school", example: "She attends a vocational college." },
    "maternal": { pos: "adj", phrase: "maternal instinct", example: "She has a strong maternal instinct." },
    "fertile": { pos: "adj", phrase: "fertile soil", example: "The land is very fertile." },
    "obsolete": { pos: "adj", phrase: "obsolete technology", example: "Typewriters are now obsolete." },
    "acoustic": { pos: "adj", phrase: "acoustic guitar", example: "The room has good acoustic properties." },
    "implicit": { pos: "adj", phrase: "implicit agreement", example: "It was an implicit threat." },
    "pervasive": { pos: "adj", phrase: "pervasive influence", example: "Corruption is pervasive." },
    "ubiquitous": { pos: "adj", phrase: "ubiquitous smartphones", example: "Wi-Fi is ubiquitous now." },
    "simulate": { pos: "verb", phrase: "simulate a crash", example: "The computer simulates weather patterns." },
    "cater": { pos: "verb", phrase: "cater to needs", example: "The hotel caters to families." },
    "allocate": { pos: "verb", phrase: "allocate funds", example: "We must allocate resources wisely." },
    "offset": { pos: "verb", phrase: "offset the cost", example: "Gains in one area offset losses in another." },
    "restrain": { pos: "verb", phrase: "restrain anger", example: "He couldn't restrain his laughter." },
    "comply": { pos: "verb", phrase: "comply with rules", example: "You must comply with the law." },
    "expire": { pos: "verb", phrase: "contract expires", example: "My passport expires next month." },
    "embark": { pos: "verb", phrase: "embark on a journey", example: "They embarked on a new project." },
    "forge": { pos: "verb", phrase: "forge a relationship", example: "He forged a signature." },
    "thrust": { pos: "verb", phrase: "thrust forward", example: "He thrust the money into my hand." },
    "dispatch": { pos: "verb", phrase: "dispatch a messenger", example: "Police were dispatched to the scene." },
    "resent": { pos: "verb", phrase: "resent criticism", example: "She repents being treated like a child." },
    "reconcile": { pos: "verb", phrase: "reconcile differences", example: "They reconciled after the fight." },
    "allege": { pos: "verb", phrase: "alleged crime", example: "It is alleged that he stole the money." },
    "expel": { pos: "verb", phrase: "expel from school", example: "He was expelled for fighting." },
    "ascend": { pos: "verb", phrase: "ascend the throne", example: "The path ascends steeply." },
    "commence": { pos: "verb", phrase: "commence work", example: "The ceremony will commence shortly." },
    "reign": { pos: "verb", phrase: "reign of the king", example: "Peace reigned in the country." },
    "diplomacy": { pos: "noun", phrase: "international diplomacy", example: "War was avoided through diplomacy." },
    "plight": { pos: "noun", phrase: "plight of the poor", example: "We must help the plight of refugees." },
    "solitude": { pos: "noun", phrase: "enjoy solitude", example: "He lives in solitude in the mountains." },
    "fallacy": { pos: "noun", phrase: "logical fallacy", example: "It is a common fallacy that money buys happiness." },
    "latitude": { pos: "noun", phrase: "high latitude", example: "They allow us some latitude in dressing." },
    "eclipse": { pos: "noun", phrase: "solar eclipse", example: "The moon eclipsed the sun." },
    "erosion": { pos: "noun", phrase: "soil erosion", example: "Wind caused erosion of the rocks." },
    "archaeology": { pos: "noun", phrase: "study archaeology", example: "They found ruins through archaeology." },
    "errand": { pos: "noun", phrase: "run an errand", example: "I have some errands to do." },
    "rhetoric": { pos: "noun", phrase: "political rhetoric", example: "His speech was full of empty rhetoric." },
    "congestion": { pos: "noun", phrase: "traffic congestion", example: "New roads reduced the congestion." },
    "sewage": { pos: "noun", phrase: "sewage treatment", example: "Raw sewage polluted the river." },
    "subsidy": { pos: "noun", phrase: "government subsidy", example: "Farmers receive a subsidy." },
    "attorney": { pos: "noun", phrase: "defense attorney", example: "You should consult an attorney." },
    "bulk": { pos: "noun", phrase: "in bulk", example: "We buy paper in bulk." },
    "synthesis": { pos: "noun", phrase: "chemical synthesis", example: "The essay was a synthesis of ideas." },
    "greed": { pos: "noun", phrase: "corporate greed", example: "Greed caused the crash." },
    "bribe": { pos: "noun", phrase: "accept a bribe", example: "He tried to bribe the official." },
    "texture": { pos: "noun", phrase: "smooth texture", example: "I like the texture of this fabric." },
    "harassment": { pos: "noun", phrase: "sexual harassment", example: "Harassment is not tolerated." },
    "doctrine": { pos: "noun", phrase: "religious doctrine", example: "They questioned the doctrine." },
    "holistic": { pos: "adj", phrase: "holistic approach", example: "We need a holistic view of health." },
    "liable": { pos: "adj", phrase: "liable for damages", example: "He is liable to change his mind." },
    "intelligible": { pos: "adj", phrase: "intelligible speech", example: "His explanation was barely intelligible." },
    "abrupt": { pos: "adj", phrase: "abrupt change", example: "The meeting came to an abrupt end." },
    "reckless": { pos: "adj", phrase: "reckless driving", example: "He was fined for reckless driving." },
    "juvenile": { pos: "adj", phrase: "juvenile delinquency", example: "He acted in a juvenile manner." },
    "timid": { pos: "adj", phrase: "timid animal", example: "She is too timid to ask." },
    "contagious": { pos: "adj", phrase: "contagious disease", example: "Yawns are contagious." },
    "cynical": { pos: "adj", phrase: "cynical attitude", example: "He is cynical about politics." },
    "monotonous": { pos: "adj", phrase: "monotonous voice", example: "The work became monotonous." },
    "perpetual": { pos: "adj", phrase: "perpetual motion", example: "They lived in perpetual fear." },
    "numb": { pos: "adj", phrase: "numb with cold", example: "My fingers went numb." },
    "zealous": { pos: "adj", phrase: "zealous supporter", example: "He is a zealous worker." }
};

// 2. Locate selection1900 in the file content.
// We expect: `selection1900: [` ... `],`
// Since the file is huge and has potential variations, let's use a safe replacement based on iterating the OBJECT itself.

// Wait, we can't iterate the object in the FILE string easily without parsing.
// BUT we successfully loaded `const vocabulary = require(tempPath);` earlier.
// We can modify that object in memory and then write it out.
// ISSUE: `JSON.stringify` will remove the variable declaration `const DEFAULT_VOCABULARY = ...`.
// It will also unquote keys? No, JSON requires quoted keys. Vocabulary.js likely has unquoted keys for 'word', 'meaning' etc.
// If we change formatting style, the Git diff will be huge.

// Strategy:
// 1. Read file.
// 2. Find start of `selection1900: [`.
// 3. Loop through lines until `]`.
// 4. For each line that contains a word in our patch list, REPLACE the line with the fixed version.
// This preserves the file structure and other lines.

const lines = fileContent.split('\n');
let insideSelection1900 = false;
let updatedCount = 0;

for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for start
    if (line.trim().startsWith('selection1900: [')) {
        insideSelection1900 = true;
        continue;
    }
    // Check for end
    if (insideSelection1900 && line.trim().startsWith(']')) {
        insideSelection1900 = false;
        // Don't break, might be used elsewhere? No, keys are unique usually.
        // But let's continue.
    }

    if (insideSelection1900) {
        // Try to parse the line as a JS object.
        // Line typically: `{ word: "accord", meaning: "一致", phrase: "accord", pos: "other", example: "accord example.", set: 1, id: 1888 },`
        // We can match the word using regex.
        const wordMatch = line.match(/word:\s*"([^"]+)"/);
        if (wordMatch) {
            const word = wordMatch[1];
            if (patchData[word]) {
                const patch = patchData[word];
                // We need to preserve 'meaning', 'set', 'id'.
                // We can extract them.
                const meaningMatch = line.match(/meaning:\s*"([^"]*)"/);
                const setMatch = line.match(/set:\s*(\d+|"[^"]+")/);
                const idMatch = line.match(/id:\s*(\d+)/); // optional
                const refMatch = line.match(/ref:\s*"([^"]+)"/); // Should be missing but check.

                const meaning = meaningMatch ? meaningMatch[1] : "";
                const setVal = setMatch ? setMatch[1] : "1";
                const idVal = idMatch ? idMatch[1] : null;

                // Construct new line
                let newLine = `        { word: "${word}", meaning: "${meaning}", phrase: "${patch.phrase}", pos: "${patch.pos}", example: "${patch.example}", set: ${setVal}`;
                if (idVal) newLine += `, id: ${idVal}`;

                // If there was a ref, we keep it? But the user said these DON'T have refs usually.
                // If there is a ref, and we are patching it, maybe we should keep it?
                // The task is to fix incomplete data. If it has a ref, usually it pulls data from ref.
                // But if we are providing local data, we assume NO ref is better (self-contained).
                // Or we can keep ref if it exists.
                // However, the query was about words WITHOUT ref or with BROKEN ref.
                // If I overwrite the line, I effectively remove the ref if I don't add it back.
                // Given I want to "fill holes", I should assume no ref.

                newLine += ` },`;

                lines[i] = newLine;
                updatedCount++;
            }
        }
    }
}

console.log(`Updated ${updatedCount} lines.`);

// Write back
fs.writeFileSync(vocabPath, lines.join('\n'));
