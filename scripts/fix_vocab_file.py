
import os

def fix_file():
    target_file = 'data/vocabulary.js'
    try:
        with open(target_file, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        found_start = -1
        
        # Identify where to cut the file
        # We look for the first occurrence of any of our managed sections
        check_keys = ['selection1900: [', 'selection1400: [', 'sys_2000: [', 'system: [']
        
        for i, line in enumerate(lines):
            # Check for managed keys
            if any(key in line for key in check_keys):
                found_start = i
                break
            
            # Check for end of object (fallback) if we haven't found a key yet
            # We assume the file ends with "};" or similar. 
            # But relying on "};" is safer strictly as a fallback.
        
        # If we didn't find the keys, look for the last "};" to append before it
        if found_start == -1:
             for i in range(len(lines) - 1, -1, -1):
                 if '};' in lines[i]:
                     found_start = i
                     break
        
        if found_start != -1:
            # Truncate lines up to the found point (exclusive of the found line)
            new_lines = lines[:found_start]
            
            # Add placeholder and close
            new_lines.append('    selection1900: [\n')
            new_lines.append('        // [SELECTION1900_DATA_PLACEHOLDER]\n')
            new_lines.append('    ],\n')
            new_lines.append('    selection1400: [\n')
            new_lines.append('        // [SELECTION1400_DATA_PLACEHOLDER]\n')
            new_lines.append('    ],\n')
            new_lines.append('    sys_2000: [\n')
            new_lines.append('        // [SYSTEM_WORDS_DATA_PLACEHOLDER]\n')
            new_lines.append('    ]\n')
            new_lines.append('};\n')
            
            with open(target_file, 'w', encoding='utf-8') as f:
                f.writelines(new_lines)
            print("Successfully fixed vocabulary.js")
        else:
            print("Could not find insertion point (keys or '};').")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    fix_file()
