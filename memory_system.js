/**
 * Advanced Memory System for Dual Ollama Chat
 * Based on Nir Diamant's memory architecture for production AI agents
 * 
 * Features:
 * - Persistent conversation memory with localStorage
 * - Context-aware memory retrieval
 * - Semantic search across conversations
 * - Memory compression and summarization
 * - Conversation threading and continuity
 */

class MemorySystem {
    constructor() {
        this.storageKey = 'dual_ollama_memory';
        this.conversationsKey = 'dual_ollama_conversations';
        this.contextKey = 'dual_ollama_context';
        this.maxConversations = 100;
        this.maxMessagesPerConversation = 1000;
        this.compressionThreshold = 50;
        
        // Initialize memory storage
        this.initializeStorage();
        
        // Memory enhancement features
        this.semanticIndex = new Map();
        this.conversationThreads = new Map();
        this.memoryPatterns = new Map();
    }

    /**
     * Initialize storage with proper structure
     */
    initializeStorage() {
        if (!localStorage.getItem(this.storageKey)) {
            localStorage.setItem(this.storageKey, JSON.stringify({
                version: '1.0',
                conversations: [],
                patterns: {},
                metadata: {
                    totalConversations: 0,
                    lastAccess: new Date().toISOString(),
                    compressionEnabled: true
                }
            }));
        }
    }

    /**
     * Save current conversation to memory
     */
    saveConversation(conversationData) {
        try {
            const memory = this.getMemoryData();
            const conversation = {
                id: this.generateId(),
                title: this.generateTitle(conversationData),
                messages: this.sanitizeMessages(conversationData.messages || []),
                context: conversationData.context || {},
                metadata: {
                    created: new Date().toISOString(),
                    lastAccess: new Date().toISOString(),
                    model1: conversationData.model1 || null,
                    model2: conversationData.model2 || null,
                    fileAttachments: conversationData.fileAttachments || [],
                    tags: this.extractTags(conversationData),
                    summary: this.generateSummary(conversationData.messages || [])
                },
                threadId: this.getCurrentThreadId()
            };

            // Add to conversations
            memory.conversations.unshift(conversation);
            
            // Maintain max conversations limit
            if (memory.conversations.length > this.maxConversations) {
                memory.conversations = memory.conversations.slice(0, this.maxConversations);
            }

            // Update metadata
            memory.metadata.totalConversations = memory.conversations.length;
            memory.metadata.lastAccess = new Date().toISOString();

            // Save to storage
            this.saveMemoryData(memory);
            
            // Update semantic index
            this.updateSemanticIndex(conversation);
            
            return conversation.id;
        } catch (error) {
            console.error('Error saving conversation:', error);
            return null;
        }
    }

    /**
     * Load conversation by ID
     */
    loadConversation(conversationId) {
        try {
            const memory = this.getMemoryData();
            const conversation = memory.conversations.find(c => c.id === conversationId);
            
            if (conversation) {
                // Update last access time
                conversation.metadata.lastAccess = new Date().toISOString();
                this.saveMemoryData(memory);
                
                return conversation;
            }
            
            return null;
        } catch (error) {
            console.error('Error loading conversation:', error);
            return null;
        }
    }

    /**
     * Get all conversations with optional filtering
     */
    getConversations(filter = {}) {
        try {
            const memory = this.getMemoryData();
            let conversations = [...memory.conversations];

            // Apply filters
            if (filter.model) {
                conversations = conversations.filter(c => 
                    c.metadata.model1 === filter.model || c.metadata.model2 === filter.model
                );
            }

            if (filter.tag) {
                conversations = conversations.filter(c => 
                    c.metadata.tags.includes(filter.tag)
                );
            }

            if (filter.dateFrom) {
                conversations = conversations.filter(c => 
                    new Date(c.metadata.created) >= new Date(filter.dateFrom)
                );
            }

            if (filter.dateTo) {
                conversations = conversations.filter(c => 
                    new Date(c.metadata.created) <= new Date(filter.dateTo)
                );
            }

            // Sort by last access (most recent first)
            conversations.sort((a, b) => 
                new Date(b.metadata.lastAccess) - new Date(a.metadata.lastAccess)
            );

            return conversations;
        } catch (error) {
            console.error('Error getting conversations:', error);
            return [];
        }
    }

    /**
     * Search conversations semantically
     */
    searchConversations(query, limit = 10) {
        try {
            const conversations = this.getConversations();
            const results = [];

            for (const conversation of conversations) {
                const score = this.calculateRelevanceScore(conversation, query);
                if (score > 0) {
                    results.push({
                        conversation,
                        score,
                        highlights: this.extractHighlights(conversation, query)
                    });
                }
            }

            // Sort by relevance score
            results.sort((a, b) => b.score - a.score);
            
            return results.slice(0, limit);
        } catch (error) {
            console.error('Error searching conversations:', error);
            return [];
        }
    }

    /**
     * Delete conversation by ID
     */
    deleteConversation(conversationId) {
        try {
            const memory = this.getMemoryData();
            const index = memory.conversations.findIndex(c => c.id === conversationId);
            
            if (index !== -1) {
                memory.conversations.splice(index, 1);
                memory.metadata.totalConversations = memory.conversations.length;
                this.saveMemoryData(memory);
                
                // Update semantic index
                this.removeFromSemanticIndex(conversationId);
                
                return true;
            }
            
            return false;
        } catch (error) {
            console.error('Error deleting conversation:', error);
            return false;
        }
    }

    /**
     * Clear all conversations
     */
    clearAllConversations() {
        try {
            const memory = this.getMemoryData();
            memory.conversations = [];
            memory.metadata.totalConversations = 0;
            this.saveMemoryData(memory);
            
            // Clear semantic index
            this.semanticIndex.clear();
            
            return true;
        } catch (error) {
            console.error('Error clearing conversations:', error);
            return false;
        }
    }

    /**
     * Get memory statistics
     */
    getMemoryStats() {
        try {
            const memory = this.getMemoryData();
            const totalMessages = memory.conversations.reduce((sum, c) => sum + c.messages.length, 0);
            
            return {
                totalConversations: memory.conversations.length,
                totalMessages,
                averageMessagesPerConversation: memory.conversations.length > 0 ? totalMessages / memory.conversations.length : 0,
                oldestConversation: memory.conversations.length > 0 ? memory.conversations[memory.conversations.length - 1].metadata.created : null,
                newestConversation: memory.conversations.length > 0 ? memory.conversations[0].metadata.created : null,
                storageSize: new Blob([JSON.stringify(memory)]).size
            };
        } catch (error) {
            console.error('Error getting memory stats:', error);
            return {
                totalConversations: 0,
                totalMessages: 0,
                averageMessagesPerConversation: 0,
                oldestConversation: null,
                newestConversation: null,
                storageSize: 0
            };
        }
    }

    /**
     * Export memory data
     */
    exportMemory() {
        try {
            const memory = this.getMemoryData();
            const blob = new Blob([JSON.stringify(memory, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            
            const a = document.createElement('a');
            a.href = url;
            a.download = `dual_ollama_memory_${new Date().toISOString().split('T')[0]}.json`;
            a.click();
            
            URL.revokeObjectURL(url);
            return true;
        } catch (error) {
            console.error('Error exporting memory:', error);
            return false;
        }
    }

    /**
     * Import memory data
     */
    importMemory(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    // Validate structure
                    if (!importedData.version || !importedData.conversations) {
                        reject(new Error('Invalid memory file format'));
                        return;
                    }
                    
                    // Merge with existing data
                    const currentMemory = this.getMemoryData();
                    const mergedMemory = {
                        ...currentMemory,
                        ...importedData,
                        conversations: [...importedData.conversations, ...currentMemory.conversations]
                            .slice(0, this.maxConversations)
                    };
                    
                    this.saveMemoryData(mergedMemory);
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            };
            
            reader.onerror = () => reject(new Error('Failed to read file'));
            reader.readAsText(file);
        });
    }

    /**
     * Private helper methods
     */
    getMemoryData() {
        try {
            return JSON.parse(localStorage.getItem(this.storageKey) || '{}');
        } catch {
            return { conversations: [], metadata: {} };
        }
    }

    saveMemoryData(data) {
        localStorage.setItem(this.storageKey, JSON.stringify(data));
    }

    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    generateTitle(conversationData) {
        const messages = conversationData.messages || [];
        if (messages.length === 0) return 'Empty Conversation';
        
        const firstMessage = messages.find(m => m.role === 'user');
        if (!firstMessage) return 'Conversation';
        
        const content = firstMessage.content || '';
        const title = content.substring(0, 50);
        return title.length < content.length ? title + '...' : title;
    }

    sanitizeMessages(messages) {
        return messages.slice(-this.maxMessagesPerConversation).map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp || new Date().toISOString(),
            images: msg.images || []
        }));
    }

    extractTags(conversationData) {
        const tags = [];
        const content = conversationData.messages?.map(m => m.content).join(' ') || '';
        
        // Extract common tags based on content
        if (content.toLowerCase().includes('code')) tags.push('programming');
        if (content.toLowerCase().includes('image') || content.toLowerCase().includes('photo')) tags.push('image-analysis');
        if (content.toLowerCase().includes('pdf') || content.toLowerCase().includes('document')) tags.push('document-analysis');
        if (content.toLowerCase().includes('excel') || content.toLowerCase().includes('csv')) tags.push('data-analysis');
        
        return tags;
    }

    generateSummary(messages) {
        if (messages.length === 0) return 'No messages';
        
        const userMessages = messages.filter(m => m.role === 'user');
        const assistantMessages = messages.filter(m => m.role === 'assistant');
        
        return `Conversation with ${userMessages.length} user messages and ${assistantMessages.length} AI responses`;
    }

    calculateRelevanceScore(conversation, query) {
        const queryLower = query.toLowerCase();
        let score = 0;
        
        // Check title
        if (conversation.title.toLowerCase().includes(queryLower)) {
            score += 10;
        }
        
        // Check messages
        const messagesText = conversation.messages.map(m => m.content).join(' ').toLowerCase();
        if (messagesText.includes(queryLower)) {
            score += 5;
        }
        
        // Check tags
        const matchingTags = conversation.metadata.tags.filter(tag => 
            tag.toLowerCase().includes(queryLower)
        );
        score += matchingTags.length * 3;
        
        return score;
    }

    extractHighlights(conversation, query) {
        const queryLower = query.toLower();
        const highlights = [];
        
        for (const message of conversation.messages) {
            const content = message.content.toLowerCase();
            if (content.includes(queryLower)) {
                const index = content.indexOf(queryLower);
                const start = Math.max(0, index - 20);
                const end = Math.min(content.length, index + query.length + 20);
                const highlight = message.content.substring(start, end);
                highlights.push({
                    role: message.role,
                    text: highlight,
                    timestamp: message.timestamp
                });
            }
        }
        
        return highlights;
    }

    updateSemanticIndex(conversation) {
        // Simple semantic indexing - can be enhanced with more sophisticated NLP
        const keywords = this.extractKeywords(conversation);
        for (const keyword of keywords) {
            if (!this.semanticIndex.has(keyword)) {
                this.semanticIndex.set(keyword, []);
            }
            this.semanticIndex.get(keyword).push(conversation.id);
        }
    }

    removeFromSemanticIndex(conversationId) {
        for (const [keyword, ids] of this.semanticIndex.entries()) {
            const index = ids.indexOf(conversationId);
            if (index !== -1) {
                ids.splice(index, 1);
                if (ids.length === 0) {
                    this.semanticIndex.delete(keyword);
                }
            }
        }
    }

    extractKeywords(conversation) {
        const text = conversation.messages.map(m => m.content).join(' ');
        const words = text.toLowerCase().split(/\s+/);
        const keywords = new Set();
        
        // Simple keyword extraction - can be enhanced
        for (const word of words) {
            if (word.length > 3 && !this.isCommonWord(word)) {
                keywords.add(word);
            }
        }
        
        return Array.from(keywords);
    }

    isCommonWord(word) {
        const commonWords = new Set(['the', 'and', 'for', 'are', 'but', 'not', 'you', 'all', 'can', 'had', 'her', 'was', 'one', 'our', 'out', 'day', 'get', 'has', 'him', 'his', 'how', 'man', 'new', 'now', 'old', 'see', 'two', 'way', 'who', 'boy', 'did', 'its', 'let', 'put', 'say', 'she', 'too', 'use']);
        return commonWords.has(word);
    }

    getCurrentThreadId() {
        // Generate a thread ID based on current session
        return `thread_${Date.now()}`;
    }
}

// Global memory system instance
window.memorySystem = new MemorySystem();
