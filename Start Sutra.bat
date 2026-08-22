@echo off
title Sutra - investigation toolkit
cd /d "%~dp0"

where py >nul 2>nul && ( py start_sutra.py & goto :eof )
where python >nul 2>nul && ( python start_sutra.py & goto :eof )

echo.
echo   Python is not installed on this computer.
echo   Install it once from https://www.python.org/downloads/
echo   (tick "Add Python to PATH" during setup), then double-click this again.
echo.
pause
