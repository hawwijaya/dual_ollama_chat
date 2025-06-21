# Test Format Feature

This file demonstrates the new LaTeX and Markdown formatting feature added to the Dual Ollama Chat application.

## New Features Added:

### 1. LaTeX Format Viewer
- Added "in latex" button for code blocks containing LaTeX
- Opens a modal with source and rendered view tabs
- Uses MathJax for proper LaTeX rendering

### 2. Markdown Format Viewer  
- Added "in markdown" button for code blocks containing Markdown
- Opens a modal with source and rendered view tabs
- Uses marked.js for Markdown parsing

### 3. Enhanced Code Block Detection
The system automatically detects:
- LaTeX content by language tags (`latex`, `tex`) or LaTeX syntax patterns
- Markdown content by language tags (`markdown`, `md`) or Markdown syntax patterns

### 4. UI Improvements
- Format buttons styled with different colors:
  - LaTeX button: Green (#059669)
  - Markdown button: Purple (#7c3aed)
  - Copy button: Gray (#4a5568)
- Responsive modal design with proper typography
- Tab-based interface for switching between source and rendered views

## Example LaTeX Code Block:
```latex
\documentclass{article}
\usepackage{amsmath}
\usepackage{amsfonts}
\usepackage{graphicx}
\usepackage{hyperref}

\title{Query, key, value, and attention}
\author{MIT 6.390 Spring 2024}
\date{Last Updated: \today}

\begin{document}

\maketitle

\section{Query, key, value, and attention}
```

## Example Markdown Code Block:
```markdown
# Example Markdown

## Features
- **Bold text**
- *Italic text*
- [Links](https://example.com)

### Code
```python
def hello_world():
    print("Hello, World!")
```

### Math
Inline math: $E = mc^2$

Block math:
$$\sum_{i=1}^{n} x_i = x_1 + x_2 + \cdots + x_n$$
```

## Files Modified:
1. `chat_vision_understanding v2.js` - Added format viewing functions and code block detection
2. `chat_vision_understanding v2.css` - Added styling for format buttons and modal

## How to Test:
1. Open the Dual Ollama Chat application
2. Send a message containing LaTeX or Markdown code blocks
3. Look for the "in latex" or "in markdown" buttons next to the copy button
4. Click the format buttons to view the formatted content in a modal
