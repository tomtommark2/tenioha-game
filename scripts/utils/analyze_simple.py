import csv

filename = r"C:\Users\warut\python_chatgpt\CEFR-J Wordlist Ver1.6 - A2_sep.csv"

try:
    with open(filename, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        print(f"Columns: {reader.fieldnames}")
        
        counts = {}
        for row in reader:
            cefr = row.get('CEFR', 'Unknown')
            counts[cefr] = counts.get(cefr, 0) + 1
            
        print(f"Counts: {counts}")

except Exception as e:
    print(e)
