# Dual Ollama Chat - Advanced Memory System Documentation

## Overview

The Advanced Memory System transforms Dual Ollama Chat into a persistent, intelligent conversation management platform. Based on Nir Diamant's production-grade memory architecture, this system provides comprehensive conversation storage, retrieval, and context management capabilities.

## Architecture

### Core Components

1. **MemorySystem** (`memory_system.js`)
   - Core memory storage and retrieval engine
   - LocalStorage-based persistence
   - Conversation compression and summarization
   - Semantic search capabilities

2. **MemoryUI** (`memory_ui.js`)
   - User interface for memory management
   - Conversation browsing and search
   - Import/export functionality
   - Visual memory management

3. **MemoryIntegration** (`memory_integration.js`)
   - Seamless integration with existing chat functionality
   - Auto-save capabilities
   - Context preservation
   - Keyboard shortcuts

4. **MemoryStyles** (`memory_styles.css`)
   - Modern, responsive UI styling
   - Smooth animations and transitions
   - Mobile-responsive design

## Features

### 🧠 Persistent Memory
- **LocalStorage-based storage** - No server required
- **Conversation history** - Save unlimited conversations
- **Context preservation** - Maintain conversation state
- **File attachment memory** - Remember uploaded files

### 🔍 Advanced Search
- **Semantic search** - Find conversations by content
- **Keyword search** - Quick conversation lookup
- **Filter by model** - Filter conversations by AI models
- **Tag-based search** - Organize with custom tags

### 💾 Auto-Save System
- **Real-time auto-save** - Never lose your work
- **Context-aware saving** - Preserve settings and state
- **Change detection** - Only save when necessary
- **Compression** - Efficient storage usage

### 📊 Memory Management
- **Export/Import** - Backup and restore conversations
- **Bulk operations** - Clear all, export all
- **Memory statistics** - Track usage patterns
- **Conversation preview** - Quick conversation overview

## Usage Guide

### Basic Operations

#### Saving Conversations
- **Manual Save**: Click the 💾 button in the memory panel
- **Auto-Save**: Enabled by default, saves every 30 seconds
- **Keyboard Shortcut**: `Ctrl+Shift+S`

#### Loading Conversations
- **Browse**: Use the memory panel to browse saved conversations
- **Search**: Use the search bar to find specific conversations
- **Load**: Click "📁 Load" on any conversation
- **Keyboard Shortcut**: `Ctrl+Shift+L`

#### Memory Panel
- **Open**: Click the 🧠 Memory button in the header
- **Close**: Click ✖ or click outside the panel
- **Keyboard Shortcut**: `Ctrl+Shift+M`

### Advanced Features

#### Conversation Context
Each saved conversation includes:
- **Messages**: Complete conversation history
- **Models**: Which AI models were used
- **Settings**: System prompt and configuration
- **Files**: Uploaded file information
- **Metadata**: Timestamps and tags

#### Search Capabilities
- **Full-text search** across all conversations
- **Model filtering** by specific AI models
- **Tag filtering** by conversation tags
- **Date range filtering** (coming soon)

#### Export/Import
- **Export**: All conversations as JSON file
- **Import**: JSON file with conversation data
- **Format**: Standardized JSON format for compatibility

## Technical Implementation

### Data Structure

```javascript
{
  "id": "unique-conversation-id",
  "title": "Conversation Title",
  "messages": [...],
  "context": {
    "systemPrompt": "...",
    "imageScaling": "3508",
    "host": "127.0.0.1",
    "port": "11434"
  },
  "metadata": {
    "created": "2024-01-01T00:00:00.000Z",
    "lastAccess": "2024-01-01T00:00:00.000Z",
    "model1": "llama2",
    "model2": "mistral",
    "tags": ["research", "code"],
    "summary": "Conversation summary..."
  },
  "fileAttachments": [...]
}
```

### Storage Limits
- **Max Conversations**: 100
- **Max Messages per Conversation**: 1000
- **Compression Threshold**: 50 messages
- **Storage**: Browser localStorage (typically 5-10MB)

### Performance Optimizations
- **Lazy loading** - Only load conversations when needed
- **Compression** - Large conversations are compressed
- **Indexing** - Fast search with semantic indexing
- **Caching** - Recent conversations cached in memory

## API Reference

### MemorySystem Methods

#### `saveConversation(data)`
Save a conversation to memory.
```javascript
const id = memorySystem.saveConversation({
  messages: conversationHistory,
  model1: currentModel1,
  model2: currentModel2,
  context: { systemPrompt: "..." }
});
```

#### `loadConversation(id)`
Load a specific conversation by ID.
```javascript
const conversation = memorySystem.loadConversation(conversationId);
```

#### `getConversations(filter)`
Get all conversations with optional filtering.
```javascript
const conversations = memorySystem.getConversations({
  model: "llama2",
  tag: "research"
});
```

#### `searchConversations(query, limit)`
Search conversations by content.
```javascript
const results = memorySystem.searchConversations("machine learning", 10);
```

#### `exportMemory()`
Export all conversations as JSON.
```javascript
const data = memorySystem.exportMemory();
```

#### `importMemory(file)`
Import conversations from JSON file.
```javascript
await memorySystem.importMemory(file);
```

### MemoryUI Methods

#### `toggleMemoryPanel()`
Toggle the memory panel visibility.
```javascript
memoryUI.toggleMemoryPanel();
```

#### `saveCurrentConversation()`
Save the current conversation.
```javascript
memoryUI.saveCurrentConversation();
```

#### `refreshMemoryList()`
Refresh the memory list display.
```javascript
memoryUI.refreshMemoryList();
```

## Configuration

### Settings
- **Auto-save**: Automatically save conversations (default: true)
- **Context Memory**: Include settings and context (default: true)
- **Max Conversations**: Limit stored conversations (default: 100)

### Keyboard Shortcuts
- `Ctrl+Shift+S`: Save current conversation
- `Ctrl+Shift+L`: Load last conversation
- `Ctrl+Shift+M`: Toggle memory panel
- `Ctrl+Shift+F`: Focus search input

## Integration Guide

### Adding to Existing Projects

1. **Include Files**:
```html
<link rel="stylesheet" href="memory_styles.css">
<script src="memory_system.js"></script>
<script src="memory_ui.js"></script>
<script src="memory_integration.js"></script>
```

2. **Initialize**:
```javascript
// Memory system is automatically initialized
// Access via window.memorySystem, window.memoryUI, window.memoryIntegration
```

3. **Customize**:
```javascript
// Modify settings
memoryIntegration.autoSaveEnabled = false;
memoryIntegration.contextMemoryEnabled = true;
```

### Browser Compatibility
- **Chrome**: 60+
- **Firefox**: 55+
- **Safari**: 12+
- **Edge**: 79+
- **Mobile**: iOS Safari 12+, Chrome Mobile

## Troubleshooting

### Common Issues

#### Memory Not Saving
- Check browser localStorage permissions
- Verify auto-save is enabled
- Check console for JavaScript errors

#### Search Not Working
- Ensure conversations have content
- Check for special characters in search
- Verify semantic index is built

#### Import/Export Issues
- Ensure JSON format is correct
- Check file size limits
- Verify browser file permissions

### Debug Mode
Enable debug logging:
```javascript
window.DEBUG_MEMORY = true;
```

## Future Enhancements

### Planned Features
- **Cloud sync** - Sync across devices
- **Conversation sharing** - Share conversations via URL
- **Advanced analytics** - Usage patterns and insights
- **Voice notes** - Audio conversation support
- **Multi-language support** - Internationalization

### Community Contributions
- **Plugin system** - Extensible architecture
- **Custom themes** - Visual customization
- **Export formats** - PDF, Markdown, HTML
- **API endpoints** - RESTful API for external access

## Examples

### Basic Usage
```javascript
// Save current conversation
memoryIntegration.saveCurrentConversation();

// Load last conversation
memoryIntegration.loadLastConversation();

// Search conversations
const results = memoryIntegration.searchConversations("AI ethics");
```

### Advanced Usage
```javascript
// Custom save with metadata
const conversationData = {
  messages: conversationHistory,
  model1: "llama2",
  model2: "mistral",
  context: { systemPrompt: "You are a helpful assistant" },
  fileAttachments: getCurrentFiles()
};

memorySystem.saveConversation(conversationData);
```

## Support

For issues, feature requests, or contributions:
- **GitHub Issues**: [dual_ollama_chat/issues](https://github.com/hawwijaya/dual_ollama_chat/issues)
- **Documentation**: This file is updated with each release
- **Community**: Join discussions in GitHub Discussions

## License

This memory system is part of the Dual Ollama Chat project and follows the same license terms.
