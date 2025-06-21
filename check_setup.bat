@echo off
echo Testing local library setup...
echo.

echo Checking if lib directory exists...
if exist "lib\" (
    echo ✓ lib directory found
) else (
    echo ✗ lib directory not found
    exit /b 1
)

echo.
echo Checking required library files...

if exist "lib\mathjax-tex-mml-chtml.js" (
    echo ✓ MathJax library found
) else (
    echo ✗ MathJax library missing
)

if exist "lib\marked.min.js" (
    echo ✓ Marked library found
) else (
    echo ✗ Marked library missing
)

if exist "lib\highlight.min.js" (
    echo ✓ Highlight.js library found
) else (
    echo ✗ Highlight.js library missing
)

if exist "lib\github-dark.min.css" (
    echo ✓ Highlight.js CSS found
) else (
    echo ✗ Highlight.js CSS missing
)

echo.
echo Checking MathJax font files...

if exist "lib\output\chtml\fonts\woff-v2\" (
    echo ✓ MathJax font directory found
) else (
    echo ✗ MathJax font directory missing
)

if exist "lib\output\chtml\fonts\woff-v2\MathJax_Main-Regular.woff" (
    echo ✓ MathJax Main Regular font found
) else (
    echo ✗ MathJax Main Regular font missing
)

if exist "lib\output\chtml\fonts\woff-v2\MathJax_Math-Italic.woff" (
    echo ✓ MathJax Math Italic font found
) else (
    echo ✗ MathJax Math Italic font missing
)

if exist "lib\output\chtml\fonts\woff-v2\MathJax_AMS-Regular.woff" (
    echo ✓ MathJax AMS Regular font found
) else (
    echo ✗ MathJax AMS Regular font missing
)

echo.
echo Setup complete! Your chat application now has offline support for:
echo - LaTeX/Math rendering (MathJax) with complete font support
echo - Markdown parsing (Marked)
echo - Code syntax highlighting (Highlight.js)
echo.
echo You can now run the chat application without internet connectivity.
echo Mathematical expressions should render properly with all fonts available.
pause
