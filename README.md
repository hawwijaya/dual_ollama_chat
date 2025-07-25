# 🦙🦙 Dual Ollama Chat - Advanced AI Assistant Platform

**Author:** Kuatrinnus Wijaya (kuatrinnuswijaya@gmail.com)  
**Version:** Production-Ready  
**Created:** June 2025

## 🚀 Overview

Dual Ollama Chat is a sophisticated, production-ready AI assistant platform that enables users to interact with multiple large language models simultaneously. Built with enterprise-grade features including advanced memory management based on Nir Diamant's memory architecture, comprehensive file processing capabilities, and persistent conversation storage, it transforms local AI interactions into a comprehensive knowledge management system.

## ✨ Key Features

### 🔄 Multi-Model Architecture
- **Simultaneous Dual Model Support** - Run two different AI models side-by-side for comparison and enhanced responses
- **Dynamic Model Management** - Load, switch, and manage models without restarts
- **Memory-Optimized** - Keep models loaded for faster response times
- **Real-time Model Status** - Visual indicators for active models and their states

### 🧠 Advanced Memory System
Built on **Nir Diamant's production-grade memory architecture** for AI agents:
- **Persistent Conversation Storage** - All conversations automatically saved with LocalStorage
- **Semantic Search** - Find previous conversations by content meaning
- **Context Preservation** - Maintains conversation context, settings, and uploaded files
- **Memory Analytics** - Track usage patterns and conversation statistics
- **Export/Import** - JSON-based backup and restore functionality
- **Auto-Save** - Real-time conversation preservation every 30 seconds

### 📁 Comprehensive File Processing
- **Image Analysis** - Support for JPG, PNG, WebP, GIF, and other formats with vision model integration
- **PDF Processing** - Extract text content and convert pages to images using PDF.js
- **Excel/CSV Analysis** - Parse and preview spreadsheet data using SheetJS library
- **SVG Processing** - Vector graphics analysis and conversion
- **File Memory** - Uploaded files are remembered and saved with conversations

### 🎨 OpenCV-Inspired Image Enhancement
- **Real-time Enhancement** - Live adjustment of brightness, contrast, sharpness, and saturation
- **Preset Filters** - Auto, vivid, soft, sharp, and vintage enhancement modes
- **Before/After Comparison** - Side-by-side enhancement preview
- **Progressive Resizing** - Intelligent image scaling for optimal quality
- **Histogram Equalization** - Advanced color correction algorithms
- **Configurable Resolution** - Multiple quality presets (1920px to 5K+)

### 📐 Mathematical Rendering
- **MathJax Integration** - Local offline support for LaTeX math rendering
- **Inline & Display Math** - Support for both `$inline$` and `$$display$$` equations
- **LaTeX Document Support** - Handle complete LaTeX documents with proper formatting
- **Format Detection** - Automatic detection and rendering of mathematical content

### 🎯 Modern User Experience
- **Responsive Design** - Works seamlessly on desktop, tablet, and mobile devices
- **Offline-First** - Local libraries ensure functionality without internet dependency
- **Real-time Previews** - Live previews for all file types and enhancements
- **Keyboard Shortcuts** - Power user productivity features
- **Progressive Web App** - Install as a native app with manifest support

## 🛠️ Technology Stack

### Frontend Technologies
- **HTML5** - Modern semantic markup with accessibility features
- **CSS3** - Advanced styling with flexbox, grid, and responsive design
- **Vanilla JavaScript** - No framework dependencies for maximum performance
- **Progressive Web App** - Service worker ready with offline capabilities

### AI & Machine Learning
- **Ollama Integration** - Direct API communication with local Ollama server
- **Multi-Model Support** - Simultaneous interaction with multiple LLM models
- **Vision Model Integration** - Image analysis and understanding capabilities

### Document Processing Libraries
- **PDF.js (v3.11.174)** - Mozilla's PDF rendering engine for text extraction and page conversion
- **SheetJS/XLSX** - Industry-standard Excel and CSV processing library
- **MathJax (v3)** - Professional mathematical notation rendering engine
- **Marked.js** - Fast markdown parsing and rendering
- **Highlight.js** - Syntax highlighting for code blocks

### Image Processing
- **Canvas API** - Native HTML5 canvas for image manipulation
- **OpenCV-Inspired Algorithms** - Custom implementation of computer vision techniques:
  - Histogram equalization for color correction
  - Unsharp masking for image sharpening
  - Progressive resizing for quality optimization
  - Real-time filter application

### Data Storage & Memory
- **LocalStorage API** - Persistent browser storage for conversations and settings
- **Memory Management System** - Based on Nir Diamant's architecture:
  - Conversation threading and continuity
  - Semantic indexing for content search
  - Memory compression and summarization
  - Pattern recognition and learning

## 📋 System Requirements

### Local Environment
- **Ollama Server** - Running locally (default: 127.0.0.1:11434)
- **Modern Web Browser** - Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **JavaScript Enabled** - Required for all functionality
- **LocalStorage** - Minimum 50MB available storage recommended

### Recommended Ollama Models
- **Vision Models** - llava, llava:13b, or bakllava for image analysis
- **Text Models** - llama2, mistral, codellama, or any Ollama-compatible model
- **Memory Requirements** - Minimum 8GB RAM for dual model operation

## 🚀 Installation & Usage

### Quick Start
1. **Clone the Repository**
   ```bash
   git clone https://github.com/hawwijaya/dual_ollama_chat.git
   cd dual_ollama_chat
   ```

2. **Install Ollama** (if not already installed)
   - Download from [https://ollama.ai](https://ollama.ai)
   - Install your preferred models:
     ```bash
     ollama pull llama2
     ollama pull llava
     ```

3. **Start Ollama Server**
   - **Windows**: Run `twoLLM.bat` (configures environment for dual models)
   - **Manual**: 
     ```bash
     set OLLAMA_MAX_LOADED_MODELS=2
     set OLLAMA_NUM_PARALLEL=2
     set OLLAMA_ORIGINS=*
     ollama serve
     ```

4. **Launch the Application**
   - Open `Dual_ollama_Chat.html` in your web browser
   - Or use any local web server:
     ```bash
     python -m http.server 8000
     # Then visit http://localhost:8000
     ```

### Configuration
1. **Settings Panel** - Click ⚙️ Settings button
2. **Host Configuration** - Set Ollama server IP (default: 127.0.0.1:11434)
3. **Model Detection** - Click "🔍 Detect Models" to auto-discover available models
4. **Model Selection** - Choose models for both slots and activate them
5. **System Prompt** - Configure custom system prompts for specialized behavior

### Memory Management
1. **Memory Panel** - Click 🧠 Memory button to access saved conversations
2. **Search Conversations** - Use semantic search to find previous discussions
3. **Export Data** - Download all conversations as JSON backup
4. **Import Data** - Restore conversations from JSON files
5. **Memory Statistics** - View usage analytics and storage information

## 📖 Usage Examples

### Basic Chat
1. Configure and activate at least one model
2. Type your message and press Enter or click Send
3. Compare responses from both models simultaneously

### File Analysis
1. Click the 📎 attachment button
2. Select an image, PDF, Excel file, or CSV
3. Ask questions about the uploaded content
4. Enhanced images are automatically processed and saved

### Mathematical Content
1. Type LaTeX equations using `$inline$` or `$$display$$` syntax
2. Upload PDF documents with mathematical content
3. View properly rendered mathematical notation

### Memory & Search
1. Access Memory Panel to view conversation history
2. Use search to find specific topics or information
3. Export conversations for backup or analysis

## 🏗️ Architecture

### Memory System Architecture
```
┌─────────────────────────────────────────────────────────────┐
│                    Memory System (Nir Diamant)               │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Semantic   │  │ Conversation│  │   Context   │          │
│  │   Search    │  │  Threading  │  │ Preservation│          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │   Pattern   │  │   Memory    │  │  Export/    │          │
│  │ Recognition │  │ Compression │  │   Import    │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

### File Processing Pipeline
```
Input File → Type Detection → Library Processing → Enhancement → Storage → Memory Integration
     ↓             ↓              ↓                ↓          ↓            ↓
  📁 Upload    🔍 Analyze    📚 PDF.js/XLSX   🎨 OpenCV   💾 LocalStorage  🧠 Context
```

## 🔧 Development

### File Structure
```
dual_ollama_chat/
├── Dual_ollama_Chat.html          # Main application interface
├── chat_vision_understanding v2.js # Core application logic
├── chat_vision_understanding v2.css # Styling and responsive design
├── memory_system.js               # Memory management (Nir Diamant architecture)
├── memory_ui.js                   # Memory interface components
├── memory_integration.js          # Memory system integration
├── memory_styles.css              # Memory panel styling
├── twoLLM.bat                     # Windows startup script
├── manifest.json                  # PWA configuration
├── lib/                           # Local libraries for offline support
│   ├── marked.min.js             # Markdown processing
│   ├── highlight.min.js          # Code syntax highlighting
│   ├── github-dark.min.css       # Code highlighting theme
│   └── mathjax-tex-mml-chtml.js  # Mathematical rendering
└── docs/                          # Documentation and examples
    ├── feature_demo.html         # Feature demonstrations
    ├── format_feature_demo.html  # LaTeX/Markdown format examples
    └── test_*.html               # Testing utilities
```

### Key Components

#### Core Application (`chat_vision_understanding v2.js`)
- Model management and communication
- File processing orchestration
- Image enhancement pipeline
- Real-time UI updates

#### Memory System (`memory_system.js`)
- Persistent storage management
- Conversation threading
- Semantic search implementation
- Memory compression algorithms

#### File Processors
- **PDF Processing**: Text extraction and image conversion
- **Image Enhancement**: OpenCV-inspired algorithms
- **Spreadsheet Analysis**: Excel/CSV parsing and preview
- **Mathematical Rendering**: LaTeX and MathJax integration

## 🔒 Privacy & Security

### Data Privacy
- **100% Local Processing** - All data remains on your device
- **No Cloud Dependencies** - Offline-first architecture
- **No Telemetry** - No data collection or tracking
- **Local Storage Only** - Conversations stored in browser's LocalStorage

### Security Features
- **CORS Configuration** - Proper cross-origin resource sharing
- **Input Sanitization** - Protection against XSS attacks
- **File Type Validation** - Secure file upload handling
- **Memory Encryption** - Local storage data protection

## 🤝 Contributing

Contributions are welcome! Please feel free to submit pull requests, report bugs, or suggest features.

### Development Setup
1. Fork the repository
2. Make your changes
3. Test thoroughly with multiple model types
4. Submit a pull request with detailed description

### Testing
- Use the provided test files in the repository
- Test with various file types and sizes
- Verify memory system functionality
- Check responsive design on different devices

## 📄 License

This project is open source. Please respect the licenses of the included libraries:
- PDF.js (Apache 2.0)
- MathJax (Apache 2.0)
- Marked.js (MIT)
- Highlight.js (BSD-3-Clause)

## 🙏 Acknowledgments

- **Nir Diamant** - For the foundational memory architecture design
- **Ollama Team** - For the excellent local LLM server
- **Mozilla PDF.js Team** - For robust PDF processing capabilities
- **MathJax Consortium** - For professional mathematical rendering
- **OpenCV Community** - For computer vision algorithm inspiration

## 📞 Support

For questions, issues, or suggestions:
- **Email**: kuatrinnuswijaya@gmail.com
- **GitHub Issues**: [Create an issue](https://github.com/hawwijaya/dual_ollama_chat/issues)

---

**Made with ❤️ for the AI community by Kuatrinnus Wijaya**
