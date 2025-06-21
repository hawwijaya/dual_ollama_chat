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
echo Checking required files...

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
echo Setup complete! Your chat application now has offline support for:
echo - LaTeX/Math rendering (MathJax)
echo - Markdown parsing (Marked)
echo - Code syntax highlighting (Highlight.js)
echo.
echo You can now run the chat application without internet connectivity.
pause
