@echo off
setlocal enabledelayedexpansion

set "file=Dual_ollama_Chat.html"
set "tempfile=temp.html"

(
  for /f "delims=" %%i in (%file%) do (
    set "line=%%i"
    set "line=!line:⚙️ Settings</button>=⚙️ Settings</button>"
    echo !line! | findstr /c:"⚙️ Settings</button>" >nul
    if !errorlevel! equ 0 (
      echo                 ^<button class="config-btn" onclick="toggleConfig()"^>⚙️ Settings^</button^>
      echo                 ^<button class="memory-btn" onclick="toggleMemoryPanel()" title="Memory Management"^>🧠 Memory^</button^>
    ) else (
      echo !line!
    )
  )
) > %tempfile%

move /y %tempfile% %file% >nul
echo Memory button added successfully!
