@echo off
echo Starting Local Server...
echo Opening game in your default browser...

start http://localhost:8000/vocab_clicker_game.html

python -m http.server 8000
pause
