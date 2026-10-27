@echo off
rem Opens the Meron screen full-screen in Chrome (kiosk mode). Press Alt+F4 to exit.
set "HERE=%~dp0"
set "CHROME=C:\Program Files\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=C:\Program Files (x86)\Google\Chrome\Application\chrome.exe"
if not exist "%CHROME%" set "CHROME=%LOCALAPPDATA%\Google\Chrome\Application\chrome.exe"
start "" "%CHROME%" --kiosk --no-first-run --no-default-browser-check --disable-sync --autoplay-policy=no-user-gesture-required --allow-file-access-from-files --disable-session-crashed-bubble --noerrdialogs --user-data-dir="%TEMP%\meron-screen" "file:///%HERE:\=/%index.html"
