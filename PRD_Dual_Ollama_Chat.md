# Product Requirements Document (PRD)
## Dual Ollama Chat - Enhanced Memory & Production Features

### Executive Summary
Dual Ollama Chat is a sophisticated web-based AI chat application that enables users to interact with two different Ollama models simultaneously. The application provides advanced file processing capabilities, real-time image enhancement, and comprehensive conversation management. This PRD outlines the current state and planned enhancements for memory management, production readiness, and user experience improvements.

### Current Product Overview

#### Core Features (Implemented)
- **Dual Model Architecture**: Support for two concurrent Ollama models with independent activation
- **Multi-format File Processing**: Images, PDFs, SVG, CSV, and Excel files
- **Advanced Image Enhancement**: OpenCV-inspired processing with configurable parameters
- **Real-time Conversation Management**: Dynamic chat history with model-specific interactions
- **Responsive Web Interface**: Modern, gradient-based UI with dark/light mode support
- **Local Processing**: All processing happens client-side with local Ollama server
- **Math & Code Rendering**: LaTeX support via MathJax, syntax highlighting via Highlight.js

#### Technical Architecture
- **Frontend**: Vanilla HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Direct Ollama API integration via HTTP
- **File Processing**: 
  - PDF.js for PDF processing
  - SheetJS for Excel/CSV processing
  - Canvas API for image manipulation
- **Memory**: In-memory conversation history (session-based)
- **Storage**: Browser localStorage for settings persistence

### Current Limitations Identified

1. **Memory Management**
   - No persistent memory across sessions
   - No semantic search capabilities
   - Limited conversation context retention
   - No user preference learning

2. **Production Readiness**
   - No Redis integration for scalable memory
   - No conversation summarization
   - No memory deduplication
   - Limited error handling and recovery

3. **User Experience**
   - No conversation threading
   - No search across conversations
   - No user profile management
   - Limited conversation export/import

### Enhanced Memory Requirements (Based on Nir Diamant's Framework)

#### 1. Dual-Memory Architecture Implementation
**Short-term Memory (Conversation State)**
- Redis-based conversation checkpointing
- Thread-based conversation management
- Real-time state persistence
- Conversation resumption capabilities

**Long-term Memory (Persistent Knowledge)**
- Semantic memory storage using RedisVL
- Vector embeddings for semantic search
- User preference learning
- Cross-conversation knowledge retention

#### 2. Memory Types Implementation
**Episodic Memory**
- User-specific experiences and preferences
- Conversation summaries and key insights
- Temporal context preservation
- Personal interaction patterns

**Semantic Memory**
- General knowledge about topics discussed
- File processing learnings
- Model performance insights
- Best practices documentation

#### 3. Production Memory Features
**Memory Management Tools**
- Automated memory storage via tool calls
- Semantic search across memories
- Memory deduplication
- Memory expiration policies

**Conversation Management**
- Automatic summarization
- Thread-based organization
- Search and retrieval
- Export/import capabilities

### Technical Implementation Plan

#### Phase 1: Redis Integration
1. **Redis Setup**
   - Redis server configuration
   - RedisVL integration for vector search
   - Connection pooling and error handling

2. **Memory Schema Design**
   ```python
   MemoryType = {
     "EPISODIC": "user_experiences",
     "SEMANTIC": "general_knowledge", 
     "PREFERENCE": "user_preferences",
     "PROCESSING": "file_processing_learnings"
   }
   ```

3. **Data Models**
   - Conversation thread schema
   - Memory entry structure
   - Vector embedding configuration
   - Metadata tracking

#### Phase 2: Memory Tools
1. **Storage Tools**
   - Automatic memory extraction from conversations
   - Context-aware memory categorization
   - Deduplication before storage

2. **Retrieval Tools**
   - Semantic search with filters
   - Relevance scoring
   - Context injection into conversations

#### Phase 3: User Experience
1. **Memory Interface**
   - Memory browser/inspector
   - Search functionality
   - Memory editing/deletion
   - Export capabilities

2. **Conversation Management**
   - Thread list with previews
   - Conversation resumption
   - Summary generation
   - Cross-thread insights

### API Requirements

#### New Endpoints
```
GET /api/conversations - List all conversation threads
GET /api/conversations/:id - Get specific conversation
POST /api/conversations/:id/summary - Generate summary
GET /api/memories - Search memories
POST /api/memories - Store new memory
DELETE /api/memories/:id - Delete memory
```

#### Redis Operations
- Conversation checkpointing
- Vector similarity search
- Memory CRUD operations
- Thread management

### Security & Privacy Considerations
- Local-first architecture (no external data transmission)
- User data encryption at rest
- Memory access controls
- Data retention policies
- GDPR compliance features

### Performance Requirements
- Sub-second memory retrieval
- Efficient vector search (<100ms)
- Scalable to 10k+ conversations
- Memory usage optimization
- Background processing for summaries

### Testing Strategy
1. **Unit Tests**: Memory operations, Redis integration
2. **Integration Tests**: End-to-end conversation flows
3. **Performance Tests**: Memory retrieval benchmarks
4. **User Tests**: Memory interface usability

### Success Metrics
- Memory retrieval accuracy: >95%
- Conversation resumption success: >99%
- User satisfaction with memory features: >4.5/5
- Performance degradation: <5% with 10k conversations

### Deployment Considerations
- Redis server setup documentation
- Docker containerization
- Environment configuration
- Monitoring and logging
- Backup and recovery procedures

### Future Enhancements
- Multi-user support
- Collaborative memory sharing
- Advanced NLP for memory extraction
- Machine learning for memory prioritization
- Integration with external knowledge bases

### Timeline
- **Phase 1**: Redis integration (2 weeks)
- **Phase 2**: Memory tools (3 weeks)  
- **Phase 3**: UX enhancements (2 weeks)
- **Testing & Polish**: 1 week
- **Total**: 8 weeks

### Risk Assessment
- **High**: Redis server setup complexity
- **Medium**: Vector search performance
- **Low**: User adoption of memory features
- **Mitigation**: Comprehensive documentation and fallback mechanisms
