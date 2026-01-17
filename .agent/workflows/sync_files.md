---
description: Synchronize index.html to vocab_clicker_game.html
---
# Sync Entry Points

Run this command after ANY edit to `index.html` to ensure the live URL (`vocab_clicker_game.html`) is updated.

// turbo
1. Copy index.html to vocab_clicker_game.html
```powershell
Copy-Item index.html -Destination vocab_clicker_game.html -Force
```
