import csv
import json

# POS mapping
pos_map = {
    'noun': '名',
    'verb': '動',
    'adjective': '形',
    'adverb': '副',
    'auxiliary': '助',
    'preposition': '前',
    'conjunction': '接',
    'pronoun': '代',
    'determiner': '代',
    'interjection': '感'
}

# Simple meaning templates (will need AI enhancement for production)
# For this script, we'll use placeholder meanings
def generate_meaning(word, pos):
    # This is a simplified version - in production you'd want actual translations
    return f"{word}の意味"

def generate_phrase(word, pos):
    if pos == '動':
        return f"{word} something"
    elif pos == '形':
        return f"{word} thing"
    elif pos == '名':
        return f"a {word}"
    elif pos == '副':
        return f"{word} do"
    elif pos == '前':
        return f"{word} the place"
    else:
        return f"use {word}"

def generate_example(word, pos):
    if pos == '動':
        return f"I {word} every day."
    elif pos == '形':
        return f"It is very {word}."
    elif pos == '名':
        return f"This is a {word}."
    elif pos == '副':
        return f"He did it {word}."
    elif pos == '前':
        return f"The book is {word} the table."
    else:
        return f"We use {word} here."

# Read CSV and generate vocabulary
input_file = r"C:\Users\warut\python_chatgpt\CEFR-J Wordlist Ver1.6 - A2_sep.csv"
output_file = r"C:\Users\warut\python_chatgpt\data\vocabulary_a2_generated.js"

vocab_list = []

with open(input_file, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    for row in reader:
        word = row['headword']
        pos_eng = row['pos'].lower()
        pos_jp = pos_map.get(pos_eng, 'other')
        
        # Generate content
        meaning = generate_meaning(word, pos_jp)
        phrase = generate_phrase(word, pos_jp)
        example = generate_example(word, pos_jp)
        
        vocab_entry = {
            'word': word,
            'meaning': meaning,
            'phrase': phrase,
            'pos': pos_jp,
            'example': example,
            'set': 1
        }
        vocab_list.append(vocab_entry)

# Write to JS file
with open(output_file, 'w', encoding='utf-8') as f:
    f.write('const A2_VOCABULARY_GENERATED = [\n')
    for i, entry in enumerate(vocab_list):
        comma = ',' if i < len(vocab_list) - 1 else ''
        f.write(f'    {{ word: "{entry["word"]}", meaning: "{entry["meaning"]}", phrase: "{entry["phrase"]}", pos: "{entry["pos"]}", example: "{entry["example"]}", set: {entry["set"]} }}{comma}\n')
    f.write('];\n')

print(f"Generated {len(vocab_list)} vocabulary entries")
print(f"Output written to: {output_file}")
