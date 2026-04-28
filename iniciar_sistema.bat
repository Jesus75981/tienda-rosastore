@echo off
echo ===================================================
echo     INICIANDO TIENDA ROSESTORE (SISTEMA HELLO KITTY)
echo ===================================================

:: Iniciar Backend
echo Iniciando Servidor Backend...
start cmd /k "cd back-end && npm run dev"

:: Esperar 3 segundos
timeout /t 3 /nobreak > nul

:: Iniciar Frontend
echo Iniciando Servidor Frontend...
start cmd /k "cd front-end && npm run dev"

echo.
echo ===================================================
echo El sistema se esta ejecutando.
echo - Backend corriendo en puerto 5000 (aprox)
echo - Frontend corriendo en puerto 5173 (aprox)
echo Cierra las ventanas negras (CMD) para detener el sistema.
echo ===================================================
pause
