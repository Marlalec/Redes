@echo off
setlocal
powershell.exe -NoProfile -ExecutionPolicy Bypass -File "%~dp0iniciar-docker.ps1" %*
exit /b %ERRORLEVEL%
