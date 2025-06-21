@echo off
echo Downloading required libraries for offline support...
echo.

if not exist "lib\" mkdir lib

echo Downloading MathJax library...
powershell -Command "Invoke-WebRequest -Uri 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js' -OutFile 'lib\mathjax-tex-mml-chtml.js'"

echo Downloading Marked library...
powershell -Command "Invoke-WebRequest -Uri 'https://cdn.jsdelivr.net/npm/marked/marked.min.js' -OutFile 'lib\marked.min.js'"

echo Downloading Highlight.js library...
powershell -Command "Invoke-WebRequest -Uri 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js' -OutFile 'lib\highlight.min.js'"

echo Downloading Highlight.js CSS theme...
powershell -Command "Invoke-WebRequest -Uri 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css' -OutFile 'lib\github-dark.min.css'"

echo.
echo Download complete! All libraries are now available locally.
echo Run check_setup.bat to verify the installation.
pause
