/**
 * Memory System UI Integration for Dual Ollama Chat
 * Provides user interface for memory management and retrieval
 */

class MemoryUI {
    constructor() {
        this.isMemoryPanelOpen = false;
        this.currentMemoryType = 'all';
        this.searchQuery = '';
        this.memorySystem = window.memorySystem;
        
        this.init();
    }

    init() {
        this.createMemoryPanel();
        this.addMemoryButton();
        this.bindEvents();
    }

    /**
     * Create the memory management panel
     */
    createMemoryPanel() {
        const panel = document.createElement('div');
        panel.id = 'memoryPanel';
        panel.className = 'memory-panel';
        panel.innerHTML = `
            <div class="memory-header">
                <h3>🧠 Memory Management</h3>
                <button class="close-btn" onclick="memoryUI.togglePanel()">✕</button>
            </div>
            
            <div class="memory-controls">
                <div class="search-section">
                    <input type="text" id="memorySearch" placeholder="Search memories..." class="memory-search">
                    <select id="memoryTypeFilter" class="memory-filter">
                        <option value="all">All Types</option>
                        <option value="episodic">Conversations</option>
                        <option value="semantic">Knowledge</option>
                        <option value="working">Context</option>
                        <option value="procedural">Instructions</option>
                    </select>
                </div>
                
                <div class="memory-actions">
                    <button onclick="memoryUI.exportMemories()" class="btn">📤 Export</button>
                    <button onclick="memoryUI.importMemories()" class="btn">📥 Import</button>
                    <button onclick="memoryUI.clearAllMemories()" class="btn danger">🗑️ Clear All</button>
                </div>
            </div>
            
            <div class="memory-stats">
                <div class="stat-item">
                    <span class="stat-label">Total Memories:</span>
                    <span class="stat-value" id="totalMemories">0</span>
                </div>
                <div class="stat-item">
                    <span class="stat-label">Avg Importance:</span>
                    <span class="stat-value" id="avgImportance">0</span>
                </div>
            </div>
            
            <div class="memory-list" id="memoryList">
                <div class="memory-placeholder">No memories yet. Start chatting to create memories!</div>
            </div>
        `;
        
        document.body.appendChild(panel);
    }

    /**
     * Add memory button to the main interface
     */
    addMemoryButton() {
        const header = document.querySelector('.header');
        const memoryBtn = document.createElement('button');
        memoryBtn.className = 'memory-btn';
        memoryBtn.innerHTML = '🧠 Memory';
        memoryBtn.onclick = () => this.togglePanel();
        header.appendChild(memoryBtn);
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
        // Search functionality
        const searchInput = document.getElementById('memorySearch');
        const typeFilter = document.getElementById('memoryTypeFilter');
        
        searchInput.addEventListener('input', (e) => {
            this.searchQuery = e.target.value;
            this.refreshMemoryList();
        });
        
        typeFilter.addEventListener('change', (e) => {
            this.currentMemoryType = e.target.value;
            this.refreshMemoryList();
        });
    }

    /**
     * Toggle memory panel visibility
     */
    togglePanel() {
        const panel = document.getElementById('memoryPanel');
        this.isMemoryPanelOpen = !this.isMemoryPanelOpen;
        
        if (this.isMemoryPanelOpen) {
            panel.classList.add('active');
            this.refreshMemoryList();
            this.updateStats();
        } else {
            panel.classList.remove('active');
        }
    }

    /**
     * Refresh the memory list based on current filters
     */
    async refreshMemoryList() {
        const listContainer = document.getElementById('memoryList');
        const memories = await this.memorySystem.retrieveMemories(
            this.searchQuery,
            this.currentMemoryType === 'all' ? null : this.currentMemoryType,
            50
        );

        if (memories.length === 0) {
            listContainer.innerHTML = `
                <div class="memory-placeholder">
                    ${this.searchQuery ? 'No memories found for your search.' : 'No memories yet. Start chatting to create memories!'}
                </div>
            `;
            return;
        }

        listContainer.innerHTML = '';
        
        memories.forEach(memory => {
            const memoryDiv = this.createMemoryCard(memory);
            listContainer.appendChild(memoryDiv);
        });
    }

    /**
     * Create a memory card for display
     */
    createMemoryCard(memory) {
        const card = document.createElement('div');
        card.className = 'memory-card';
        
        const date = new Date(memory.timestamp);
        const typeIcon = this.getTypeIcon(memory.type);
        
        card.innerHTML = `
            <div class="memory-header">
                <span class="memory-type ${memory.type}">${typeIcon} ${memory.type}</span>
                <span class="memory-date">${date.toLocaleDateString()}</span>
            </div>
            
            <div class="memory-content">
                ${this.truncateText(memory.content, 200)}
            </div>
            
            <div class="memory-meta">
                <span class="memory-importance">⭐ ${memory.metadata.importance.toFixed(1)}</span>
                <span class="memory-tokens">${memory.metadata.tokens} tokens</span>
                ${memory.metadata.tags.length > 0 ? 
                    `<div class="memory-tags">${memory.metadata.tags.map(tag => 
                        `<span class="tag">${tag}</span>`).join('')}</div>` : ''}
            </div>
            
            <div class="memory-actions">
                <button onclick="memoryUI.viewMemory('${memory.id}')" class="btn small">👁️ View</button>
                <button onclick="memoryUI.deleteMemory('${memory.id}')" class="btn small danger">🗑️ Delete</button>
            </div>
        `;
        
        return card;
    }

    /**
     * Get icon for memory type
     */
    getTypeIcon(type) {
        const icons = {
            'episodic': '💬',
            'semantic': '📚',
            'working': '🎯',
            'procedural': '⚙️'
        };
        return icons[type] || '📝';
    }

    /**
     * Truncate text for display
     */
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    /**
     * View full memory details
     */
    viewMemory(memoryId) {
        const memory = this.memorySystem.memoryStore.find(m => m.id === memoryId);
        if (!memory) return;

        const modal = document.createElement('div');
        modal.className = 'memory-modal';
        modal.innerHTML = `
            <div class="memory-modal-content">
                <div class="memory-modal-header">
                    <h3>Memory Details</h3>
                    <button onclick="this.parentElement.parentElement.parentElement.remove()" class="close-btn">✕</button>
                </div>
                
                <div class="memory-modal-body">
                    <div class="memory-detail-item">
                        <strong>Type:</strong> ${memory.type}
                    </div>
                    <div class="memory-detail-item">
                        <strong>Date:</strong> ${new Date(memory.timestamp).toLocaleString()}
                    </div>
                    <div class="memory-detail-item">
                        <strong>Importance:</strong> ${memory.metadata.importance.toFixed(2)}
                    </div>
                    <div class="memory-detail-item">
                        <strong>Tokens:</strong> ${memory.metadata.tokens}
                    </div>
                    
                    ${memory.metadata.tags.length > 0 ? `
                        <div class="memory-detail-item">
                            <strong>Tags:</strong>
                            <div class="tag-list">
                                ${memory.metadata.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                            </div>
                        </div>
                    ` : ''}
                    
                    <div class="memory-detail-item">
                        <strong>Content:</strong>
                        <pre class="memory-full-content">${memory.content}</pre>
                    </div>
                    
                    ${Object.keys(memory.metadata).length > 4 ? `
                        <div class="memory-detail-item">
                            <strong>Metadata:</strong>
                            <pre class="memory-metadata">${JSON.stringify(memory.metadata, null, 2)}</pre>
                        </div>
                    ` : ''}
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    /**
     * Delete a specific memory
     */
    deleteMemory(memoryId) {
        if (confirm('Are you sure you want to delete this memory?')) {
            this.memorySystem.memoryStore = this.memorySystem.memoryStore.filter(
                m => m.id !== memoryId
            );
            this.memorySystem.saveMemoryStore();
            this.refreshMemoryList();
            this.updateStats();
        }
    }

    /**
     * Export memories to JSON
     */
    exportMemories() {
        const memories = this.memorySystem.exportMemories();
        const blob = new Blob([memories], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = `dual_ollama_memories_${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        
        URL.revokeObjectURL(url);
    }

    /**
     * Import memories from JSON
     */
    importMemories() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = (e) => {
            const file = e.target.files[0];
            if (!file) return;
            
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    this.memorySystem.importMemories(e.target.result);
                    this.refreshMemoryList();
                    this.updateStats();
                    alert('Memories imported successfully!');
                } catch (error) {
                    alert('Error importing memories: ' + error.message);
                }
            };
            reader.readAsText(file);
        };
        
        input.click();
    }

    /**
     * Clear all memories
     */
    clearAllMemories() {
        if (confirm('Are you sure you want to clear ALL memories? This cannot be undone.')) {
            this.memorySystem.clearAllMemories();
            this.refreshMemoryList();
            this.updateStats();
        }
    }

    /**
     * Update memory statistics
     */
    updateStats() {
        const stats = this.memorySystem.getStats();
        
        document.getElementById('totalMemories').textContent = stats.totalMemories;
        document.getElementById('avgImportance').textContent = stats.averageImportance.toFixed(2);
    }

    /**
     * Add conversation memory
     */
    addConversationMemory(content, modelName, fileType = null) {
        return this.memorySystem.addMemory(content, 'episodic', {
            model: modelName,
            fileType: fileType,
            conversationId: this.generateConversationId()
        });
    }

    /**
     * Add semantic knowledge memory
     */
    addKnowledgeMemory(content, topic = null) {
        return this.memorySystem.addMemory(content, 'semantic', {
            topic: topic,
            source: 'user_input'
        });
    }

    /**
     * Add working context memory
     */
    addContextMemory(content, contextType = null) {
        return this.memorySystem.addMemory(content, 'working', {
            contextType: contextType,
            expiresAt: Date.now() + (1000 * 60 * 60) // 1 hour expiry
        });
    }

    /**
     * Add procedural instruction memory
     */
    addInstructionMemory(content, taskType = null) {
        return this.memorySystem.addMemory(content, 'procedural', {
            taskType: taskType,
            usageCount: 0
        });
    }

    /**
     * Generate conversation ID
     */
    generateConversationId() {
        return 'conv_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
    }

    /**
     * Get relevant context for a query
     */
    async getContextForQuery(query, modelName = null) {
        const memories = await this.memorySystem.retrieveMemories(query, null, 10);
        
        let context = '';
        for (const memory of memories) {
            context += `Relevant memory (${memory.type}): ${memory.content}\n\n`;
        }
        
        return context;
    }

    /**
     * Get conversation summary for a model
     */
    getConversationSummary(modelName) {
        const context = this.memorySystem.getConversationContext(modelName, 2000);
        return context ? `Previous conversation context:\n${context}` : '';
    }
}

// Initialize memory UI
window.memoryUI = new MemoryUI();

// Integration with existing chat system
document.addEventListener('DOMContentLoaded', () => {
    // Hook into conversation system
    const originalAddMessage = window.addMessage;
    if (originalAddMessage) {
        window.addMessage = function(content, isUser = false, fileData = null, modelInfo = null) {
            // Add to memory system
            if (isUser && modelInfo) {
                const memoryContent = `User: ${content}`;
                memoryUI.addConversationMemory(memoryContent, modelInfo.name, fileData?.type);
            } else if (!isUser && modelInfo) {
                const memoryContent = `Assistant: ${content}`;
                memoryUI.addConversationMemory(memoryContent, modelInfo.name);
            }
            
            return originalAddMessage.call(this, content, isUser, fileData, modelInfo);
        };
    }
});
