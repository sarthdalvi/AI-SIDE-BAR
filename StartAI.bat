@echo off
echo Starting AI Brain for Chrome Extension...
echo.
echo Setting permissions...
set OLLAMA_ORIGINS=*

echo.
echo Launching Ollama Server...
echo (Keep this window OPEN while using the AI Side Bar)
echo.
ollama serve
pause