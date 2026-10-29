@echo off
cd /d "%~dp0"
set PORT=8765
echo.
echo   Kwiz Local - starting local server on http://localhost:%PORT%/
echo   Keep this window open while you study. Close it to stop.
echo.
where python >nul 2>nul
if errorlevel 1 goto trypy
start "" /min python -m http.server %PORT%
timeout /t 2 >nul
start "" "http://localhost:%PORT%/"
echo   Server is running in a minimised window.
echo   Press any key to stop the server and quit.
pause >nul
goto :eof

:trypy
where py >nul 2>nul
if errorlevel 1 goto fallback
start "" /min py -m http.server %PORT%
timeout /t 2 >nul
start "" "http://localhost:%PORT%/"
echo   Server is running in a minimised window.
echo   Press any key to stop the server and quit.
pause >nul
goto :eof

:fallback
echo   Python was not found. Opening the file directly.
echo   The app still works, but "Add to Home Screen" is unavailable.
start "" "%~dp0index.html"
timeout /t 3 >nul
