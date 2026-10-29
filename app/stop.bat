@echo off
echo Stopping any server listening on port 8765...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :8765 ^| findstr LISTENING') do taskkill /f /pid %%a >nul 2>nul
echo Done.
timeout /t 2 >nul
