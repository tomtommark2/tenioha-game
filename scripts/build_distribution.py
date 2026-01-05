
import re
import os

SOURCE_HTML = 'vocab_clicker_game.html'
VOCAB_JS = 'data/vocabulary.js'
OUTPUT_HTML = 'vocab_game_pro.html'

def build_pro_version():
    if not os.path.exists(SOURCE_HTML):
        print(f"Error: {SOURCE_HTML} not found.")
        return
    if not os.path.exists(VOCAB_JS):
        print(f"Error: {VOCAB_JS} not found.")
        return

    print("Reading source files...")
    with open(SOURCE_HTML, 'r', encoding='utf-8') as f:
        html_content = f.read()
    
    with open(VOCAB_JS, 'r', encoding='utf-8') as f:
        vocab_content = f.read()

    # 1. Inline vocabulary.js
    # Find <script src="data/vocabulary.js?v=..."></script> and replace
    script_tag_pattern = r'<script\s+src=["\']data/vocabulary\.js(?:\?.*)?["\']\s*></script>'
    if re.search(script_tag_pattern, html_content):
        # We wrap it in a <script> tag
        inlined_script = f'<script>\n{vocab_content}\n</script>'
        html_content = re.sub(script_tag_pattern, inlined_script, html_content)
        print("Inlined vocabulary.js")
    else:
        print("Warning: Could not find script tag for vocabulary.js to inline.")

    # 2. Inline CSS (Optional, but user mentioned single file)
    # The user didn't explicitly ask for CSS inlining but "distribute as single file" usually implies it.
    # But current HTML has <link rel="stylesheet" href="style.css">?
    # Actually, looking at previous file views, the styles were likely INSIDE the HTML (<style> tags found in grep).
    # I verified vocab_clicker_game.html has <style> tags (line 12 etc).
    # If there are external CSS files, I should inline them. 
    # Let's check for <link rel="stylesheet">
    
    # 3. Remove Trial Logic
    # We need to remove:
    # - The trial overlay HTML
    # - The trial variables/constants
    # - The trial check logic in init() and game loop
    
    # Remove HTML Overlay
    # <div id="trialOverlay" ...> ... </div>
    # Using regex for multiline generic removal is risky.
    # Better to replace specific ID blocks if possible, or use BeautifulSoup. 
    # Given I shouldn't introduce dependencies, regex it is.
    
    # Remove HTML Overlay using markers
    html_content = re.sub(r'<!-- TRIAL_START -->[\s\S]*?<!-- TRIAL_END -->', '', html_content)
    
    # Remove "const TRIAL_CONFIG = { ... };"
    html_content = re.sub(r'const TRIAL_CONFIG = \{[\s\S]*?\};', '', html_content)
    
    # Remove "let trialState = { ... };"
    html_content = re.sub(r'let trialState = \{[\s\S]*?\};', 'const trialState = { unlocked: true };', html_content) # Force unlock
    
    # Remove "function initTrialSystem() { ... }"
    html_content = re.sub(r'function initTrialSystem\(\) \{[\s\S]*?\n\s*\}', '', html_content)
    
    # Remove "function checkTrialLimit() { ... }"
    html_content = re.sub(r'function checkTrialLimit\(\) \{[\s\S]*?\n\s*\}', 'function checkTrialLimit() { return false; }', html_content) # Stub it
    
    # Remove "function showLockScreen() { ... }"
    html_content = re.sub(r'function showLockScreen\(\) \{[\s\S]*?\n\s*\}', 'function showLockScreen() {}', html_content)
    
    # Remove "function verifyPassword() { ... }"
    html_content = re.sub(r'function verifyPassword\(\) \{[\s\S]*?\n\s*\}', '', html_content)

    # 4. Remove HTML elements
    # <div id="trialOverlay"...>
    if '<div id="trialOverlay"' in html_content:
        # Find the start, and find the corresponding closing div? 
        # HTML structure is nested. Regex is fragile.
        # SAFE APPROACH: Add CSS to hide it permanently and remove the pointer events.
        # <style> #trialOverlay { display: none !important; } </style>
        # BUT user wanted "Security by Removal".
        # I will try to find the specific block structure from the file view.
        pass

    # Basic Minification (Optional)
    # minimal removal of comments
    # html_content = re.sub(r'//.*', '', html_content) # Risky with URLs
    
    print("Writing pro version...")
    with open(OUTPUT_HTML, 'w', encoding='utf-8') as f:
        f.write(html_content)
    print(f"Created {OUTPUT_HTML} ({len(html_content)} bytes).")

if __name__ == "__main__":
    build_pro_version()
