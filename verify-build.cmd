@echo off
powershell -ExecutionPolicy Bypass -File "%~dp0verify-build.ps1"
if errorlevel 1 exit /b 1
