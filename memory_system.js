/**
 * Advanced Memory System for Dual Ollama Chat
 * Based on Nir Diamant's "Building AI Agents That Actually Remember" approach
 * Implements semantic memory, episodic memory, and working memory
 */

class MemorySystem {
    constructor() {
        this.storageKey = 'dual_ollama_memory';
        this.maxMemorySize = 1000; // Maximum number of memories to store
        this.similarityThreshold = 0.7; // Minimum similarity for memory retrieval
        
        // Memory types
        this.memoryTypes = {
            EPISODIC: 'episodic',      // Conversation history
            SEMANTIC: 'semantic',      // Facts and knowledge
            WORKING: 'working',        // Current context
            PROCEDURAL: 'procedural'   // How-to instructions
        };
        
        // Initialize memory store
        this.memoryStore = this.loadMemoryStore();
        
        // Embedding cache for semantic search
        this.embeddingCache = new Map();
        
        console.log('Memory system initialized with', this.memoryStore.length, 'memories');
    }

    /**
     * Load memory store from localStorage
     */
    loadMemoryStore() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            return stored ? JSON.parse(stored) : [];
        } catch (error) {
            console.error('Error loading memory store:', error);
            return [];
        }
    }

    /**
     * Save memory store to localStorage
     */
    saveMemoryStore() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.memoryStore));
        } catch (error) {
            console.error('Error saving memory store:', error);
        }
    }

    /**
     * Add a new memory to the store
     */
    addMemory(content, type = this.memoryTypes.EPISODIC, metadata = {}) {
        const memory = {
            id: this.generateId(),
            content: content,
            type: type,
            timestamp: Date.now(),
            metadata: {
                ...metadata,
                tokens: this.estimateTokens(content),
                importance: this.calculateImportance(content, type),
                tags: this.extractTags(content)
            }
        };

        this.memoryStore.unshift(memory); // Add to beginning (most recent)
        
        // Trim memory if exceeding max size
        if (this.memoryStore.length > this.maxMemorySize) {
            this.memoryStore = this.memoryStore.slice(0, this.maxMemorySize);
        }
        
        this.saveMemoryStore();
        
        // Generate embedding for semantic search
        this.generateEmbedding(memory.id, content);
        
        return memory.id;
    }

    /**
     * Retrieve relevant memories based on query
     */
    async retrieveMemories(query, type = null, limit = 5) {
        let relevantMemories = [];
        
        // Filter by type if specified
        let memories = type 
            ? this.memoryStore.filter(m => m.type === type)
            : this.memoryStore;

        // Semantic search for semantic memories
        if (type === this.memoryTypes.SEMANTIC || type === null) {
            const semanticMemories = await this.semanticSearch(query, memories, limit);
            relevantMemories = [...relevantMemories, ...semanticMemories];
        }

        // Keyword search for all memories
        const keywordMemories = this.keywordSearch(query, memories, limit);
        
        // Combine and deduplicate results
        const combined = [...relevantMemories, ...keywordMemories];
        const unique = combined.filter((memory, index, self) => 
            index === self.findIndex(m => m.id === memory.id)
        );

        // Sort by relevance score and return top results
        return unique
            .sort((a, b) => b.relevanceScore - a.relevanceScore)
            .slice(0, limit);
    }

    /**
     * Semantic search using simple embedding similarity
     */
    async semanticSearch(query, memories, limit) {
        const queryEmbedding = await this.getEmbedding(query);
        const results = [];

        for (const memory of memories) {
            const memoryEmbedding = this.embeddingCache.get(memory.id);
            if (memoryEmbedding) {
                const similarity = this.cosineSimilarity(queryEmbedding, memoryEmbedding);
                if (similarity > this.similarityThreshold) {
                    results.push({
                        ...memory,
                        relevanceScore: similarity * memory.metadata.importance
                    });
                }
            }
        }

        return results;
    }

    /**
     * Keyword-based search
     */
    keywordSearch(query, memories, limit) {
        const queryWords = query.toLowerCase().split(/\s+/);
        const results = [];

        for (const memory of memories) {
            const content = memory.content.toLowerCase();
            let score = 0;

            // Exact phrase matching
            if (content.includes(query.toLowerCase())) {
                score += 2;
            }

            // Word matching
            for (const word of queryWords) {
                if (content.includes(word)) {
                    score += 1;
                }
            }

            // Tag matching
            for (const tag of memory.metadata.tags) {
                if (queryWords.some(word => tag.toLowerCase().includes(word))) {
                    score += 1.5;
                }
            }

            if (score > 0) {
                results.push({
                    ...memory,
                    relevanceScore: score * memory.metadata.importance
                });
            }
        }

        return results;
    }

    /**
     * Get conversation context for a specific model
     */
    getConversationContext(modelName, maxTokens = 4000) {
        const modelMemories = this.memoryStore.filter(
            m => m.type === this.memoryTypes.EPISODIC && 
                 m.metadata.model === modelName
        );

        let context = '';
        let tokenCount = 0;

        for (const memory of modelMemories.slice(0, 50)) { // Last 50 messages
            const memoryTokens = memory.metadata.tokens;
            if (tokenCount + memoryTokens > maxTokens) break;
            
            context += `${memory.content}\n`;
            tokenCount += memoryTokens;
        }

        return context;
    }

    /**
     * Get user preferences and patterns
     */
    getUserPreferences() {
        const preferences = {
            preferredModels: {},
            commonTopics: {},
            interactionPatterns: {},
            fileTypes: {}
        };

        // Analyze episodic memories
        const episodicMemories = this.memoryStore.filter(
            m => m.type === this.memoryTypes.EPISODIC
        );

        for (const memory of episodicMemories) {
            // Track model usage
            if (memory.metadata.model) {
                preferences.preferredModels[memory.metadata.model] = 
                    (preferences.preferredModels[memory.metadata.model] || 0) + 1;
            }

            // Track file types
            if (memory.metadata.fileType) {
                preferences.fileTypes[memory.metadata.fileType] = 
                    (preferences.fileTypes[memory.metadata.fileType] || 0) + 1;
            }

            // Track topics from tags
            for (const tag of memory.metadata.tags) {
                preferences.commonTopics[tag] = 
                    (preferences.commonTopics[tag] || 0) + 1;
            }
        }

        return preferences;
    }

    /**
     * Generate simple embedding for semantic search
     */
    async getEmbedding(text) {
        // Simple TF-IDF based embedding
        const words = text.toLowerCase().split(/\s+/);
        const embedding = new Array(100).fill(0);
        
        for (let i = 0; i < Math.min(words.length, 100); i++) {
            const word = words[i];
            const hash = this.simpleHash(word);
            embedding[hash % 100] += 1;
        }

        return embedding;
    }

    /**
     * Generate and cache embedding
     */
    async generateEmbedding(memoryId, content) {
        const embedding = await this.getEmbedding(content);
        this.embeddingCache.set(memoryId, embedding);
    }

    /**
     * Calculate cosine similarity between two vectors
     */
    cosineSimilarity(vec1, vec2) {
        let dotProduct = 0;
        let norm1 = 0;
        let norm2 = 0;

        for (let i = 0; i < vec1.length; i++) {
            dotProduct += vec1[i] * vec2[i];
            norm1 += vec1[i] * vec1[i];
            norm2 += vec2[i] * vec2[i];
        }

        if (norm1 === 0 || norm2 === 0) return 0;
        return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
    }

    /**
     * Calculate importance score for a memory
     */
    calculateImportance(content, type) {
        let importance = 1.0;

        // Type-based importance
        const typeWeights = {
            [this.memoryTypes.PROCEDURAL]: 1.5,
            [this.memoryTypes.SEMANTIC]: 1.3,
            [this.memoryTypes.EPISODIC]: 1.0,
            [this.memoryTypes.WORKING]: 0.8
        };
        importance *= typeWeights[type] || 1.0;

        // Length-based importance
        const length = content.length;
        if (length > 1000) importance *= 1.2;
        if (length < 50) importance *= 0.8;

        // Keyword-based importance
        const importantKeywords = ['important', 'key', 'critical', 'essential', 'remember'];
        for (const keyword of importantKeywords) {
            if (content.toLowerCase().includes(keyword)) {
                importance *= 1.1;
            }
        }

        return Math.min(importance, 2.0);
    }

    /**
     * Extract tags from content
     */
    extractTags(content) {
        const tags = [];
        const words = content.toLowerCase().split(/\s+/);
        
        // Extract technical terms
        const techTerms = ['python', 'javascript', 'ai', 'ml', 'api', 'database', 'frontend', 'backend'];
        for (const term of techTerms) {
            if (words.some(word => word.includes(term))) {
                tags.push(term);
            }
        }

        // Extract file types
        const fileTypes = ['pdf', 'image', 'csv', 'excel', 'svg'];
        for (const type of fileTypes) {
            if (content.toLowerCase().includes(type)) {
                tags.push(type);
            }
        }

        return tags;
    }

    /**
     * Estimate token count for content
     */
    estimateTokens(content) {
        // Rough estimation: 1 token ≈ 4 characters
        return Math.ceil(content.length / 4);
    }

    /**
     * Generate unique ID
     */
    generateId() {
        return Date.now().toString(36) + Math.random().toString(36).substr(2);
    }

    /**
     * Simple hash function for embeddings
     */
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return Math.abs(hash);
    }

    /**
     * Clear all memories
     */
    clearAllMemories() {
        this.memoryStore = [];
        this.embeddingCache.clear();
        this.saveMemoryStore();
        console.log('All memories cleared');
    }

    /**
     * Export memories for backup
     */
    exportMemories() {
        return JSON.stringify(this.memoryStore, null, 2);
    }

    /**
     * Import memories from backup
     */
    importMemories(memoriesJson) {
        try {
            const memories = JSON.parse(memoriesJson);
            this.memoryStore = memories;
            this.saveMemoryStore();
            
            // Regenerate embeddings
            for (const memory of this.memoryStore) {
                this.generateEmbedding(memory.id, memory.content);
            }
            
            console.log('Memories imported successfully');
        } catch (error) {
            console.error('Error importing memories:', error);
        }
    }

    /**
     * Get memory statistics
     */
    getStats() {
        const stats = {
            totalMemories: this.memoryStore.length,
            byType: {},
            byDate: {},
            averageImportance: 0
        };

        let totalImportance = 0;

        for (const memory of this.memoryStore) {
            // Count by type
            stats.byType[memory.type] = (stats.byType[memory.type] || 0) + 1;

            // Count by date (daily)
            const date = new Date(memory.timestamp).toDateString();
            stats.byDate[date] = (stats.byDate[date] || 0) + 1;

            totalImportance += memory.metadata.importance;
        }

        stats.averageImportance = totalImportance / this.memoryStore.length || 0;

        return stats;
    }
}

// Global memory system instance
window.memorySystem = new MemorySystem();
