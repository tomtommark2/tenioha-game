
import re

file_path = 'c:\\Users\\warut\\python_chatgpt\\data\\vocabulary.js'

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

print(f"Analyzing {len(lines)} lines...")

# Stack for braces
stack = []
error_found = False

for i, line in enumerate(lines):
    line = line.strip()
    if not line:
        continue
    
    # Check for missing commas between objects in array
    # Pattern: starts with { ... } and does NOT end with , (unless it's followed by ])
    
    # Very rough heuristic:
    # If line starts with { and ends with }, it's an object.
    # If the NEXT line starts with {, then THIS line must end with ,
    
    if line.startswith('{') and line.endswith('}'):
        # Check next non-empty line
        j = i + 1
        while j < len(lines):
            next_line = lines[j].strip()
            if next_line:
                if next_line.startswith('{'):
                    # Must have comma
                    print(f"Error potential at line {i+1}: Missing comma?")
                    print(f"Line: {line}")
                    print(f"Next: {next_line}")
                    error_found = True
                break
            j += 1

    # Check for duplicate commas like ,,
    if ",," in line:
         print(f"Error potential at line {i+1}: Double comma")
         print(f"Line: {line}")

    # Check for unclosed strings
    if line.count('"') % 2 != 0:
        # Ignore lines with escaped quotes for now (simple check)
        print(f"Error potential at line {i+1}: Unbalanced quotes")
        print(f"Line: {line}")

print("Analysis complete.")
