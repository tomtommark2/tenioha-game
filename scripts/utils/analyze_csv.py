import csv
import sys

filename = r"C:\Users\warut\python_chatgpt\CEFR-J Wordlist Ver1.6 - B1.csv"

try:
    with open(filename, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        print(f"Header: {reader.fieldnames}")
        
        cefr_counts = {}
        row_count = 0
        
        for row in reader:
            row_count += 1
            cefr = row.get('CEFR', 'Unknown')
            cefr_counts[cefr] = cefr_counts.get(cefr, 0) + 1
            if row_count <= 5:
                print(f"Row {row_count}: {row}")
                
        print(f"\nTotal Rows: {row_count}")
        print(f"CEFR Counts: {cefr_counts}")

except Exception as e:
    print(f"Error: {e}")
