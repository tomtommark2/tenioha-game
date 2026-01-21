@echo off
echo ===================================================
echo   Vocab Clicker Game - Local Testing Server
echo ===================================================
echo.
echo Starting Python HTTP Server (Custom Script)...
echo Access at: http://localhost:8000
echo.
echo Closing this window will stop the server.
echo.

:: Build URL
set "URL=http://localhost:8000"

:: Open default browser
start "" "%URL%"

:: Start Server (Python 3) - Uses local_server.py for correct MIME types
python local_server.py

pause
