@echo off
echo Closing any existing processes on port 1024...
taskkill /F /IM node.exe /FI "LOCALPORT eq 1024" 2>NUL
if %ERRORLEVEL% EQU 0 (
    echo Existing process on port 1024 has been terminated.
) else (
    echo No existing process found on port 1024.
)

echo Starting server on port 1024...
node server.js
if %ERRORLEVEL% NEQ 0 (
    echo Error: Failed to start the server. Make sure Node.js is installed and port 1024 is available.
    echo Press any key to exit...
    pause >nul
) else (
    echo Server is running. Open your browser and go to http://localhost:1024
)
