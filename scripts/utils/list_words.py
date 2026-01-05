import csv
input_file = r"C:\Users\warut\python_chatgpt\CEFR-J Wordlist Ver1.6 - A2_sep.csv"
with open(input_file, 'r', encoding='utf-8-sig') as f:
    reader = csv.DictReader(f)
    rows = list(reader)
    count = 0
    for i, w in enumerate(rows):
        if 655 <= i < 680:
            print(f"{i}|{w['headword']}|{w['pos']}")
            count += 1
    print(f"Total printed: {count}")
