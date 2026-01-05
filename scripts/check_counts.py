
target_file = 'data/vocabulary.js'
try:
    with open(target_file, 'r', encoding='utf-8') as f:
        lines = f.readlines()

    keys = ['selection1900: [', 'selection1400: [', 'system: [', '};']
    indices = {}
    
    for i, line in enumerate(lines):
        for k in keys:
            if k in line:
                indices[k] = i
                
    print("Indices found:", indices)
    
    if 'selection1900: [' in indices and 'selection1400: [' in indices:
        count1900 = indices['selection1400: ['] - indices['selection1900: [']
        print(f"Est. Selection 1900 lines: {count1900} (Target: ~1900)")
        
    if 'selection1400: [' in indices and 'system: [' in indices:
        count1400 = indices['system: ['] - indices['selection1400: [']
        print(f"Est. Selection 1400 lines: {count1400} (Target: ~1400)")

    if 'system: [' in indices and '};' in indices:
        countSystem = indices['};'] - indices['system: [']
        print(f"Est. System lines: {countSystem} (Target: ~2000)")

except Exception as e:
    print(e)
