@echo off
echo Downloading required libraries for offline support...
echo.

if not exist "lib\" mkdir lib
if not exist "lib\output\chtml\fonts\woff-v2\" mkdir lib\output\chtml\fonts\woff-v2

echo Downloading MathJax library...
powershell -Command "Invoke-WebRequest -Uri 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/tex-mml-chtml.js' -OutFile 'lib\mathjax-tex-mml-chtml.js'"

echo Downloading MathJax font files...
powershell -Command "Invoke-WebRequest -Uri 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2/MathJax_Zero.woff' -OutFile 'lib\output\chtml\fonts\woff-v2\MathJax_Zero.woff'"
powershell -Command "Invoke-WebRequest -Uri 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2/MathJax_Main-Regular.woff' -OutFile 'lib\output\chtml\fonts\woff-v2\MathJax_Main-Regular.woff'"
powershell -Command "Invoke-WebRequest -Uri 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2/MathJax_Math-Italic.woff' -OutFile 'lib\output\chtml\fonts\woff-v2\MathJax_Math-Italic.woff'"
powershell -Command "Invoke-WebRequest -Uri 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2/MathJax_Size1-Regular.woff' -OutFile 'lib\output\chtml\fonts\woff-v2\MathJax_Size1-Regular.woff'"
powershell -Command "Invoke-WebRequest -Uri 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2/MathJax_Size2-Regular.woff' -OutFile 'lib\output\chtml\fonts\woff-v2\MathJax_Size2-Regular.woff'"
powershell -Command "Invoke-WebRequest -Uri 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2/MathJax_Size3-Regular.woff' -OutFile 'lib\output\chtml\fonts\woff-v2\MathJax_Size3-Regular.woff'"
powershell -Command "Invoke-WebRequest -Uri 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2/MathJax_Size4-Regular.woff' -OutFile 'lib\output\chtml\fonts\woff-v2\MathJax_Size4-Regular.woff'"
powershell -Command "Invoke-WebRequest -Uri 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2/MathJax_AMS-Regular.woff' -OutFile 'lib\output\chtml\fonts\woff-v2\MathJax_AMS-Regular.woff'"
powershell -Command "Invoke-WebRequest -Uri 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2/MathJax_Main-Bold.woff' -OutFile 'lib\output\chtml\fonts\woff-v2\MathJax_Main-Bold.woff'"
powershell -Command "Invoke-WebRequest -Uri 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2/MathJax_Script-Regular.woff' -OutFile 'lib\output\chtml\fonts\woff-v2\MathJax_Script-Regular.woff'"
powershell -Command "Invoke-WebRequest -Uri 'https://cdn.jsdelivr.net/npm/mathjax@3/es5/output/chtml/fonts/woff-v2/MathJax_Fraktur-Regular.woff' -OutFile 'lib\output\chtml\fonts\woff-v2\MathJax_Fraktur-Regular.woff'"

echo Downloading Marked library...
powershell -Command "Invoke-WebRequest -Uri 'https://cdn.jsdelivr.net/npm/marked/marked.min.js' -OutFile 'lib\marked.min.js'"

echo Downloading Highlight.js library...
powershell -Command "Invoke-WebRequest -Uri 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/highlight.min.js' -OutFile 'lib\highlight.min.js'"

echo Downloading Highlight.js CSS theme...
powershell -Command "Invoke-WebRequest -Uri 'https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.9.0/styles/github-dark.min.css' -OutFile 'lib\github-dark.min.css'"

echo.
echo Download complete! All libraries and fonts are now available locally.
echo Run check_setup.bat to verify the installation.
pause
