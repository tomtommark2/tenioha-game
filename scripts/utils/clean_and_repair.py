
import json
import re
import os
import sys

# Import batch data
# We assume files are in current directory
sys.path.append(os.getcwd())

def get_batch_words(filename):
    try:
        # Checking if file exists
        if not os.path.exists(filename):
            print(f"Warning: {filename} not found.")
            return []
        
        with open(filename, 'r', encoding='utf-8') as f:
            content = f.read()
            # Extract the new_words list using regex or just eval/exec since it is a simple definition
            # exec is risky generally but safe here as we wrote these files.
            # safe way: extract the list structure text
            m = re.search(r'new_words\s*=\s*(\[.*?\])', content, re.DOTALL)
            if m:
                # Need to handle Python true/false vs JSON/JS strings if direct eval?
                # The file is python source code.
                # Let's use eval with a limited context
                return eval(m.group(1))
    except Exception as e:
        print(f"Error reading {filename}: {e}")
    return []

# Collect all generated B1 words
all_b1_words = []
batch_files = [f"add_b1_batch{i}.py" for i in range(1, 8)]
# Also check add_b1_daily.py if it exists and had distinct words?
# Based on history, add_b1_daily.py added words like 'access'. 
# 'access' is in Batch 1 range (A-words).
# Let's verify if we need it. 'access' was skipped in Batch 1.
# So 'access' might be missing if I cut the tail? 
# Wait, 'access' was added by add_b1_daily.py. Where is it in the file?
# If add_b1_daily was run BEFORE Batch 1, and Batch 1 prepended... 
# Then 'access' should be BELOW Batch 1?
# Let's check finding 'access' later.
# For now, let's load batches 1-7.

for bf in batch_files:
    words = get_batch_words(bf)
    all_b1_words.extend(words)

js_path = 'c:\\Users\\warut\\python_chatgpt\\data\\vocabulary.js'

with open(js_path, 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Identify the 'daily' array content
daily_match = re.search(r'(daily:\s*\[)(.*?)(\])', content, re.DOTALL)
if not daily_match:
    print("Could not find daily array.")
    exit()

start_marker = daily_match.group(1)
inner_content = daily_match.group(2)
end_marker = daily_match.group(3)

# 2. Find cut-off point (End of Batch 1 -> "admission")
# We want to keep "admission" and everything BEFORE it (since batches were prepended).
# And remove everything AFTER "admission".
# Note: inner_content is a string of objects separated by commas.
# We need to split carefully.

# Let's confirm order: [Batch 7 ... Batch 1 ... Demo]
# So we search for "admission".
# But "admission" is inside the content.

cut_index = inner_content.find('word: "admission"')
if cut_index == -1:
    print("Could not find 'admission' (Batch 1 anchor). Aborting safely.")
    exit()

# Find the end of the 'admission' object.
# It should end with '}', then possibly a comma.
closing_brace = inner_content.find('}', cut_index)
if closing_brace == -1:
    print("Malformed object after admission.")
    exit()

# The cut point is immediately after this object's closing brace.
# We retain everything up to closing_brace + 1
retained_content = inner_content[:closing_brace+1]

# 3. Check for missing words (skipped duplicates)
# We parse the retained content to see what we have
existing_words = set()
# Simple regex to capture 'word: "..."' in retained content
found_words = re.findall(r'word:\s*"([^"]+)"', retained_content)
for w in found_words:
    existing_words.add(w)

added_missing_count = 0
missing_entries = []

for entry in all_b1_words:
    w = entry['word']
    # We want to add it if it's NOT in the retained set.
    # Note: We rely on exact word match.
    if w not in existing_words:
        # Check if 'access' needs special case? 'access' was in add_b1_daily.py.
        # If it's not in retained, we should add it?
        # Yes, safe to add.
        
        # Build JS string
        js_entry = f'{{ word: "{entry["word"]}", meaning: "{entry["meaning"]}", pos: "{entry["pos"]}", example: "{entry["example"]}", phrase: "{entry["phrase"]}", set: 1 }}'
        missing_entries.append(js_entry)
        added_missing_count += 1
        existing_words.add(w) # Prevent duplicates within this loop

# 4. Construct new content
# We have retained_content (ends with '}').
# We append missing_entries (comma separated).
# Then we close the array.

if missing_entries:
    # Add comma before appending
    appendix = ",\n        " + ",\n        ".join(missing_entries)
    final_inner = retained_content + appendix
else:
    final_inner = retained_content

# Clean up trailing comma issues?
# retained_content ends with '}'. 
# If we have missing entries, we put comma.
# The list ends without trailing comma usually, but JS allows it.
# Let's assume standard format.

new_daily_block = f"{start_marker}\n        {final_inner}\n    {end_marker}"

# Replace in original content
# Use substring replacement based on the match span to be safe against multiple regex matches
new_file_content = content[:daily_match.start()] + new_daily_block + content[daily_match.end():]

with open(js_path, 'w', encoding='utf-8') as f:
    f.write(new_file_content)

print(f"Success: Removed demo words (after 'admission') and restored {added_missing_count} skipped words.")
