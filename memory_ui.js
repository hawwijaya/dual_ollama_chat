/**
 * Memory UI Management
 * Handles the user interface for memory operations
 */

class MemoryUI {
    constructor() {
        this.memoryPanel = document.getElementById('memoryPanel');
        this.memoryList = document.getElementById('memoryList');
        this.autoSaveCheckbox = document.getElementById('autoSaveMemory');
        this.contextMemoryCheckbox = document.getElementById('contextMemory');
        
        this.currentFilter = {};
        this.currentSearchQuery = '';
        
        this.initializeUI();
    }

    /**
     * Initialize the memory UI
     */
    initializeUI() {
        this.setupEventListeners();
        this.loadMemorySettings();
        this.refreshMemoryList();
    }

    /**
     * Setup event listeners for memory UI
     */
    setupEventListeners() {
        // Settings checkboxes
        this.autoSaveCheckbox?.addEventListener('change', (e) => {
            this.saveMemorySettings();
        });

        this.contextMemoryCheckbox?.addEventListener('change', (e) => {
            this.saveMemorySettings();
        });

        // Keyboard shortcuts
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey) {
                switch (e.key) {
                    case 'S':
                        e.preventDefault();
                        this.saveCurrentConversation();
                        break;
                    case 'L':
                        e.preventDefault();
                        this.showLoadDialog();
                        break;
                    case 'F':
                        e.preventDefault();
                        this.focusSearch();
                        break;
                }
            }
        });
    }

    /**
     * Toggle memory panel visibility
     */
    toggleMemoryPanel() {
        if (this.memoryPanel) {
            const isActive = this.memoryPanel.classList.contains('active');
            
            if (isActive) {
                this.memoryPanel.classList.remove('active');
            } else {
                this.memoryPanel.classList.add('active');
                this.refreshMemoryList();
            }
        }
    }

    /**
     * Refresh the memory list display
     */
    refreshMemoryList() {
        if (!this.memoryList) return;

        const conversations = window.memorySystem.getConversations(this.currentFilter);
        
        if (conversations.length === 0) {
            this.memoryList.innerHTML = '<p>No saved conversations yet.</p>';
            return;
        }

        let html = `
            <div class="memory-search">
                <input type="text" id="memorySearch" placeholder="Search conversations..." 
                       value="${this.currentSearchQuery}" oninput="memoryUI.handleSearch(this.value)">
                <button class="btn" onclick="memoryUI.clearSearch()">✖</button>
            </div>
            <div class="memory-filters">
                <select id="modelFilter" onchange="memoryUI.handleModelFilter(this.value)">
                    <option value="">All Models</option>
                    ${this.getModelOptions()}
                </select>
                <select id="tagFilter" onchange="memoryUI.handleTagFilter(this.value)">
                    <option value="">All Tags</option>
                    ${this.getTagOptions()}
                </select>
            </div>
            <div class="memory-actions">
                <button class="btn" onclick="memoryUI.exportMemory()">📤 Export</button>
                <button class="btn" onclick="memoryUI.importMemory()">📥 Import</button>
            </div>
        `;

        if (this.currentSearchQuery) {
            const searchResults = window.memorySystem.searchConversations(this.currentSearchQuery);
            html += this.renderSearchResults(searchResults);
        } else {
            html += this.renderConversations(conversations);
        }

        this.memoryList.innerHTML = html;
    }

    /**
     * Render conversations list
     */
    renderConversations(conversations) {
        if (conversations.length === 0) {
            return '<p>No conversations match your filters.</p>';
        }

        return conversations.map(conv => `
            <div class="memory-item" data-id="${conv.id}">
                <div class="memory-item-header">
                    <h5>${this.escapeHtml(conv.title)}</h5>
                    <div class="memory-item-meta">
                        <span>${new Date(conv.metadata.created).toLocaleDateString()}</span>
                        <span>${conv.messages.length} messages</span>
                    </div>
                </div>
                <div class="memory-item-content">
                    <p>${this.escapeHtml(conv.metadata.summary)}</p>
                    <div class="memory-item-tags">
                        ${conv.metadata.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                    </div>
                    <div class="memory-item-models">
                        ${conv.metadata.model1 ? `<span class="model">Model 1: ${conv.metadata.model1}</span>` : ''}
                        ${conv.metadata.model2 ? `<span class="model">Model 2: ${conv.metadata.model2}</span>` : ''}
                    </div>
                </div>
                <div class="memory-item-actions">
                    <button class="btn" onclick="memoryUI.loadConversation('${conv.id}')">📁 Load</button>
                    <button class="btn" onclick="memoryUI.previewConversation('${conv.id}')">👁️ Preview</button>
                    <button class="btn danger" onclick="memoryUI.deleteConversation('${conv.id}')">🗑️ Delete</button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Render search results
     */
    renderSearchResults(results) {
        if (results.length === 0) {
            return '<p>No conversations found matching your search.</p>';
        }

        return results.map(result => `
            <div class="memory-item search-result" data-id="${result.conversation.id}">
                <div class="memory-item-header">
                    <h5>${this.escapeHtml(result.conversation.title)}</h5>
                    <div class="memory-item-meta">
                        <span>Relevance: ${result.score}</span>
                        <span>${new Date(result.conversation.metadata.created).toLocaleDateString()}</span>
                    </div>
                </div>
                <div class="memory-item-content">
                    ${result.highlights.map(highlight => `
                        <div class="search-highlight">
                            <strong>${highlight.role}:</strong> 
                            ${this.escapeHtml(highlight.text)}
                        </div>
                    `).join('')}
                </div>
                <div class="memory-item-actions">
                    <button class="btn" onclick="memoryUI.loadConversation('${result.conversation.id}')">📁 Load</button>
                    <button class="btn" onclick="memoryUI.previewConversation('${result.conversation.id}')">👁️ Preview</button>
                </div>
            </div>
        `).join('');
    }

    /**
     * Handle search input
     */
    handleSearch(query) {
        this.currentSearchQuery = query;
        this.refreshMemoryList();
    }

    /**
     * Clear search
     */
    clearSearch() {
        this.currentSearchQuery = '';
        document.getElementById('memorySearch') && (document.getElementById('memorySearch').value = '');
        this.refreshMemoryList();
    }

    /**
     * Handle model filter
     */
    handleModelFilter(model) {
        this.currentFilter.model = model || undefined;
        this.refreshMemoryList();
    }

    /**
     * Handle tag filter
     */
    handleTagFilter(tag) {
        this.currentFilter.tag = tag || undefined;
        this.refreshMemoryList();
    }

    /**
     * Get model options for filter
     */
    getModelOptions() {
        const conversations = window.memorySystem.getConversations();
        const models = new Set();
        
        conversations.forEach(conv => {
            if (conv.metadata.model1) models.add(conv.metadata.model1);
            if (conv.metadata.model2) models.add(conv.metadata.model2);
        });

        return Array.from(models).map(model => 
            `<option value="${model}">${model}</option>`
        ).join('');
    }

    /**
     * Get tag options for filter
     */
    getTagOptions() {
        const conversations = window.memorySystem.getConversations();
        const tags = new Set();
        
        conversations.forEach(conv => {
            conv.metadata.tags.forEach(tag => tags.add(tag));
        });

        return Array.from(tags).map(tag => 
            `<option value="${tag}">${tag}</option>`
        ).join('');
    }

    /**
     * Save current conversation
     */
    saveCurrentConversation() {
        const conversationData = {
            messages: [...conversationHistory],
            model1: currentModel1,
            model2: currentModel2,
            context: {
                systemPrompt: document.getElementById('systemPrompt')?.value || '',
                imageScaling: document.getElementById('imageScalingSelect')?.value || '3508'
            },
            fileAttachments: this.getFileAttachments()
        };

        const id = window.memorySystem.saveConversation(conversationData);
        
        if (id) {
            this.showNotification('Conversation saved successfully!', 'success');
            this.refreshMemoryList();
        } else {
            this.showNotification('Failed to save conversation', 'error');
        }
    }

    /**
     * Load conversation
     */
    loadConversation(conversationId) {
        const conversation = window.memorySystem.loadConversation(conversationId);
        
        if (conversation) {
            // Clear current chat
            startNewChat();
            
            // Load messages
            conversationHistory = [...conversation.messages];
            
            // Update UI
            this.loadMessagesToUI(conversationHistory);
            
            // Load context if available
            if (conversation.context) {
                if (conversation.context.systemPrompt) {
                    document.getElementById('systemPrompt').value = conversation.context.systemPrompt;
                }
            }
            
            this.showNotification('Conversation loaded successfully!', 'success');
            this.toggleMemoryPanel();
        }
    }

    /**
     * Preview conversation
     */
    previewConversation(conversationId) {
        const conversation = window.memorySystem.loadConversation(conversationId);
        
        if (conversation) {
            this.showConversationPreview(conversation);
        }
    }

    /**
     * Delete conversation
     */
    deleteConversation(conversationId) {
        if (confirm('Are you sure you want to delete this conversation?')) {
            const success = window.memorySystem.deleteConversation(conversationId);
            
            if (success) {
                this.showNotification('Conversation deleted successfully!', 'success');
                this.refreshMemoryList();
            } else {
                this.showNotification('Failed to delete conversation', 'error');
            }
        }
    }

    /**
     * Export memory
     */
    exportMemory() {
        const success = window.memorySystem.exportMemory();
        
        if (success) {
            this.showNotification('Memory exported successfully!', 'success');
        } else {
            this.showNotification('Failed to export memory', 'error');
        }
    }

    /**
     * Import memory
     */
    importMemory() {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        input.onchange = async (e) => {
            const file = e.target.files[0];
            if (file) {
                try {
                    await window.memorySystem.importMemory(file);
                    this.showNotification('Memory imported successfully!', 'success');
                    this.refreshMemoryList();
                } catch (error) {
                    this.showNotification('Failed to import memory: ' + error.message, 'error');
                }
            }
        };
        
        input.click();
    }

    /**
     * Clear all memory
     */
    clearAllMemory() {
        if (confirm('Are you sure you want to clear all saved conversations? This cannot be undone.')) {
            const success = window.memorySystem.clearAllConversations();
            
            if (success) {
                this.showNotification('All conversations cleared!', 'success');
                this.refreshMemoryList();
            } else {
                this.showNotification('Failed to clear conversations', 'error');
            }
        }
    }

    /**
     * Load messages to UI
     */
    loadMessagesToUI(messages) {
        const messagesContainer = document.getElementById('messages');
        
        // Clear existing messages except welcome
        const welcomeMessage = document.getElementById('staticWelcomeMessage');
        messagesContainer.innerHTML = '';
        if (welcomeMessage) {
            messagesContainer.appendChild(welcomeMessage);
        }
        
        // Add messages
        messages.forEach(msg => {
            addMessage(msg.content, msg.role === 'user', null, null);
        });
    }

    /**
     * Get file attachments from current conversation
     */
    getFileAttachments() {
        const attachments = [];
        
        if (uploadedFileBase64 && uploadedFileType) {
            attachments.push({
                type: uploadedFileType,
                name: uploadedFileName,
                data: uploadedFileBase64
            });
        }
        
        return attachments;
    }

    /**
     * Show conversation preview modal
     */
    showConversationPreview(conversation) {
        const modal = document.createElement('div');
        modal.className = 'memory-preview-modal';
        modal.innerHTML = `
            <div class="memory-preview-content">
                <div class="memory-preview-header">
                    <h3>${this.escapeHtml(conversation.title)}</h3>
                    <button class="close-btn" onclick="this.parentElement.parentElement.parentElement.remove()">✖</button>
                </div>
                <div class="memory-preview-body">
                    <div class="memory-preview-meta">
                        <p><strong>Created:</strong> ${new Date(conversation.metadata.created).toLocaleString()}</p>
                        <p><strong>Messages:</strong> ${conversation.messages.length}</p>
                        <p><strong>Models:</strong> ${conversation.metadata.model1 || 'None'} / ${conversation.metadata.model2 || 'None'}</p>
                        <p><strong>Tags:</strong> ${conversation.metadata.tags.join(', ')}</p>
                    </div>
                    <div class="memory-preview-messages">
                        ${conversation.messages.slice(0, 10).map(msg => `
                            <div class="memory-preview-message ${msg.role}">
                                <strong>${msg.role}:</strong>
                                <p>${this.escapeHtml(msg.content.substring(0, 200))}${msg.content.length > 200 ? '...' : ''}</p>
                            </div>
                        `).join('')}
                        ${conversation.messages.length > 10 ? '<p><em>... and more messages</em></p>' : ''}
                    </div>
                </div>
                <div class="memory-preview-actions">
                    <button class="btn" onclick="memoryUI.loadConversation('${conversation.id}'); this.parentElement.parentElement.parentElement.remove()">📁 Load</button>
                    <button class="btn" onclick="this.parentElement.parentElement.parentElement.remove()">Close</button>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
    }

    /**
     * Save memory settings
     */
    saveMemorySettings() {
        const settings = {
            autoSave: this.autoSaveCheckbox?.checked || false,
            contextMemory: this.contextMemoryCheckbox?.checked || false
        };
        
        localStorage.setItem('dual_ollama_memory_settings', JSON.stringify(settings));
    }

    /**
     * Load memory settings
     */
    loadMemorySettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('dual_ollama_memory_settings') || '{}');
            
            if (this.autoSaveCheckbox) {
                this.autoSaveCheckbox.checked = settings.autoSave !== false;
            }
            
            if (this.contextMemoryCheckbox) {
                this.contextMemoryCheckbox.checked = settings.contextMemory !== false;
            }
        } catch (error) {
            console.error('Error loading memory settings:', error);
        }
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            notification.classList.remove('show');
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }

    /**
     * Focus search input
     */
    focusSearch() {
        if (this.memoryPanel && !this.memoryPanel.classList.contains('active')) {
            this.toggleMemoryPanel();
        }
        
        setTimeout(() => {
            const searchInput = document.getElementById('memorySearch');
            if (searchInput) {
                searchInput.focus();
            }
        }, 100);
    }

    /**
     * Escape HTML
     */
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Global memory UI instance
let memoryUI;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    memoryUI = new MemoryUI();
});

// Global functions for HTML onclick handlers
function toggleMemoryPanel() {
    memoryUI.toggleMemoryPanel();
}

function saveConversation() {
    memoryUI.saveCurrentConversation();
}

function loadConversation() {
    memoryUI.showLoadDialog();
}

function clearMemory() {
    memoryUI.clearAllMemory();
}
