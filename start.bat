@echo off
echo ========================================
echo   Ducky-Time - Temporizador de Enfoque
echo ========================================
echo.
echo IMPORTANTE: Las notificaciones de sistema
echo solo funcionan si abres la app desde:
echo http://localhost:8000
echo.
echo Iniciando servidor...
start "" "http://localhost:8000"
python -m http.server 8000
