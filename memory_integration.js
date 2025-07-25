/**
 * Memory System Integration
 * Integrates the memory system with the existing Dual Ollama Chat functionality
 */

class MemoryIntegration {
    constructor() {
        this.autoSaveEnabled = true;
        this.contextMemoryEnabled = true;
        this.lastAutoSave = null;
        
        this.initializeIntegration();
    }

    /**
     * Initialize memory integration
     */
    initializeIntegration() {
        this.loadSettings();
        this.setupAutoSave();
        this.setupContextMemory();
        this.setupKeyboardShortcuts();
        this.setupEventListeners();
    }

    /**
     * Load memory settings
     */
    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('dual_ollama_memory_settings') || '{}');
            this.autoSaveEnabled = settings.autoSave !== false;
            this.contextMemoryEnabled = settings.contextMemory !== false;
        } catch (error) {
            console.error('Error loading memory settings:', error);
        }
    }

    /**
     * Setup auto-save functionality
     */
    setupAutoSave() {
        if (!this.autoSaveEnabled) return;

        // Auto-save every 30 seconds if there are new messages
        setInterval(() => {
            this.autoSaveConversation();
        }, 30000);

        // Auto-save on page unload
        window.addEventListener('beforeunload', () => {
            this.autoSaveConversation();
        });
    }

    /**
     * Setup context memory
     */
    setupContextMemory() {
        if (!this.contextMemoryEnabled) return;

        // Save context when settings change
        const systemPrompt = document.getElementById('systemPrompt');
        const imageScalingSelect = document.getElementById('imageScalingSelect');

        systemPrompt?.addEventListener('change', () => {
            this.saveContext();
        });

        imageScalingSelect?.addEventListener('change', () => {
            this.saveContext();
        });
    }

    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Ctrl+Shift+S: Save conversation
            if (e.ctrlKey && e.shiftKey && e.key === 'S') {
                e.preventDefault();
                this.saveCurrentConversation();
            }

            // Ctrl+Shift+L: Load last conversation
            if (e.ctrlKey && e.shiftKey && e.key === 'L') {
                e.preventDefault();
                this.loadLastConversation();
            }

            // Ctrl+Shift+M: Toggle memory panel
            if (e.ctrlKey && e.shiftKey && e.key === 'M') {
                e.preventDefault();
                if (window.memoryUI) {
                    window.memoryUI.toggleMemoryPanel();
                }
            }
        });
    }

    /**
     * Setup event listeners
     */
    setupEventListeners() {
        // Listen for new messages to trigger auto-save
        const originalAddMessage = window.addMessage;
        if (originalAddMessage) {
            window.addMessage = function(...args) {
                const result = originalAddMessage.apply(this, args);
                if (window.memoryIntegration) {
                    window.memoryIntegration.onNewMessage();
                }
                return result;
            };
        }

        // Listen for new chat
        const originalStartNewChat = window.startNewChat;
        if (originalStartNewChat) {
            window.startNewChat = function(...args) {
                const result = originalStartNewChat.apply(this, args);
                if (window.memoryIntegration) {
                    window.memoryIntegration.onNewChat();
                }
                return result;
            };
        }
    }

    /**
     * Handle new message event
     */
    onNewMessage() {
        if (this.autoSaveEnabled && conversationHistory.length > 0) {
            this.debounceAutoSave();
        }
    }

    /**
     * Handle new chat event
     */
    onNewChat() {
        // Save previous conversation if it has messages
        if (conversationHistory.length > 0) {
            this.saveCurrentConversation();
        }
    }

    /**
     * Debounced auto-save
     */
    debounceAutoSave() {
        clearTimeout(this.autoSaveTimeout);
        this.autoSaveTimeout = setTimeout(() => {
            this.autoSaveConversation();
        }, 2000);
    }

    /**
     * Auto-save current conversation
     */
    autoSaveConversation() {
        if (!this.autoSaveEnabled || conversationHistory.length === 0) {
            return;
        }

        const conversationData = this.buildConversationData();
        
        // Only save if conversation has changed
        const conversationHash = this.hashConversation(conversationData);
        if (conversationHash === this.lastAutoSave) {
            return;
        }

        const id = window.memorySystem.saveConversation(conversationData);
        if (id) {
            this.lastAutoSave = conversationHash;
            this.showAutoSaveIndicator();
        }
    }

    /**
     * Save current conversation manually
     */
    saveCurrentConversation() {
        if (conversationHistory.length === 0) {
            alert('No conversation to save.');
            return;
        }

        const conversationData = this.buildConversationData();
        const id = window.memorySystem.saveConversation(conversationData);
        
        if (id) {
            this.showNotification('Conversation saved successfully!', 'success');
            if (window.memoryUI) {
                window.memoryUI.refreshMemoryList();
            }
        } else {
            this.showNotification('Failed to save conversation', 'error');
        }
    }

    /**
     * Build conversation data object
     */
    buildConversationData() {
        return {
            messages: [...conversationHistory],
            model1: currentModel1,
            model2: currentModel2,
            context: {
                systemPrompt: document.getElementById('systemPrompt')?.value || '',
                imageScaling: document.getElementById('imageScalingSelect')?.value || '3508',
                host: document.getElementById('hostInput')?.value || '127.0.0.1',
                port: document.getElementById('portInput')?.value || '11434'
            },
            fileAttachments: this.getCurrentFileAttachments(),
            timestamp: new Date().toISOString()
        };
    }

    /**
     * Get current file attachments
     */
    getCurrentFileAttachments() {
        const attachments = [];
        
        if (uploadedFileBase64 && uploadedFileType) {
            attachments.push({
                type: uploadedFileType,
                name: uploadedFileName,
                data: uploadedFileBase64,
                textContent: pdfTextContent || null,
                images: pdfImageContents || []
            });
        }

        if (svgConvertedBase64) {
            attachments.push({
                type: 'image/svg+xml',
                name: uploadedFileName,
                data: svgConvertedBase64
            });
        }

        if (spreadsheetData) {
            attachments.push({
                type: 'spreadsheet',
                name: uploadedFileName,
                data: spreadsheetData,
                stats: spreadsheetStats
            });
        }

        return attachments;
    }

    /**
     * Load last conversation
     */
    loadLastConversation() {
        const conversations = window.memorySystem.getConversations();
        if (conversations.length === 0) {
            alert('No saved conversations found.');
            return;
        }

        const lastConversation = conversations[0];
        this.loadConversation(lastConversation);
    }

    /**
     * Load conversation by ID
     */
    loadConversation(conversation) {
        if (!conversation || !conversation.messages) {
            return;
        }

        // Clear current chat
        if (window.startNewChat) {
            window.startNewChat();
        }

        // Load messages
        conversationHistory = [...conversation.messages];
        
        // Load context if available
        if (conversation.context) {
            const context = conversation.context;
            
            if (context.systemPrompt && document.getElementById('systemPrompt')) {
                document.getElementById('systemPrompt').value = context.systemPrompt;
            }
            
            if (context.imageScaling && document.getElementById('imageScalingSelect')) {
                document.getElementById('imageScalingSelect').value = context.imageScaling;
            }
            
            if (context.host && document.getElementById('hostInput')) {
                document.getElementById('hostInput').value = context.host;
            }
            
            if (context.port && document.getElementById('portInput')) {
                document.getElementById('portInput').value = context.port;
            }
        }

        // Load file attachments if available
        if (conversation.fileAttachments && conversation.fileAttachments.length > 0) {
            this.loadFileAttachments(conversation.fileAttachments);
        }

        // Update UI
        this.loadMessagesToUI(conversationHistory);
        
        this.showNotification('Conversation loaded successfully!', 'success');
    }

    /**
     * Load file attachments
     */
    loadFileAttachments(attachments) {
        for (const attachment of attachments) {
            if (attachment.type.startsWith('image/')) {
                uploadedFileBase64 = attachment.data;
                uploadedFileType = attachment.type;
                uploadedFileName = attachment.name;
                this.updateImagePreview();
            } else if (attachment.type === 'application/pdf') {
                pdfTextContent = attachment.textContent || null;
                pdfImageContents = attachment.images || [];
                this.updatePDFPreview();
            } else if (attachment.type === 'image/svg+xml') {
                svgConvertedBase64 = attachment.data;
                this.updateSVGPreview();
            } else if (attachment.type === 'spreadsheet') {
                spreadsheetData = attachment.data;
                spreadsheetStats = attachment.stats;
                this.updateSpreadsheetPreview();
            }
        }
    }

    /**
     * Load messages to UI
     */
    loadMessagesToUI(messages) {
        const messagesContainer = document.getElementById('messages');
        if (!messagesContainer) return;

        // Clear existing messages except welcome
        const welcomeMessage = document.getElementById('staticWelcomeMessage');
        messagesContainer.innerHTML = '';
        if (welcomeMessage) {
            messagesContainer.appendChild(welcomeMessage);
        }

        // Add messages
        messages.forEach(msg => {
            if (window.addMessage) {
                window.addMessage(msg.content, msg.role === 'user', null, null);
            }
        });
    }

    /**
     * Update image preview
     */
    updateImagePreview() {
        const imagePreview = document.getElementById('imagePreview');
        const imagePreviewContainer = document.getElementById('imagePreviewContainer');
        
        if (imagePreview && uploadedFileBase64) {
            imagePreview.src = `data:${uploadedFileType};base64,${uploadedFileBase64}`;
            imagePreview.style.display = 'block';
            if (imagePreviewContainer) {
                imagePreviewContainer.style.display = 'block';
            }
        }
    }

    /**
     * Update PDF preview
     */
    updatePDFPreview() {
        const pdfPreview = document.getElementById('pdfPreview');
        const pdfFileName = document.getElementById('pdfFileName');
        
        if (pdfPreview && pdfFileName) {
            pdfFileName.textContent = uploadedFileName || 'PDF Document';
            pdfPreview.style.display = 'block';
        }
    }

    /**
     * Update SVG preview
     */
    updateSVGPreview() {
        const svgPreview = document.getElementById('svgPreview');
        const svgFileName = document.getElementById('svgFileName');
        
        if (svgPreview && svgFileName) {
            svgFileName.textContent = uploadedFileName || 'SVG Document';
            svgPreview.style.display = 'block';
        }
    }

    /**
     * Update spreadsheet preview
     */
    updateSpreadsheetPreview() {
        const csvPreview = document.getElementById('csvPreview');
        const xlsxPreview = document.getElementById('xlsxPreview');
        
        if (csvPreview && uploadedFileType === 'text/csv') {
            csvPreview.style.display = 'block';
        }
        
        if (xlsxPreview && (uploadedFileType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || 
                           uploadedFileType === 'application/vnd.ms-excel')) {
            xlsxPreview.style.display = 'block';
        }
    }

    /**
     * Hash conversation for change detection
     */
    hashConversation(conversationData) {
        const str = JSON.stringify(conversationData);
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash; // Convert to 32-bit integer
        }
        return hash.toString();
    }

    /**
     * Show auto-save indicator
     */
    showAutoSaveIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'auto-save-indicator';
        indicator.textContent = '💾 Auto-saved';
        
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            indicator.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            indicator.classList.remove('show');
            setTimeout(() => indicator.remove(), 300);
        }, 2000);
    }

    /**
     * Show notification
     */
    showNotification(message, type = 'info') {
        if (window.memoryUI) {
            window.memoryUI.showNotification(message, type);
        } else {
            alert(message);
        }
    }

    /**
     * Get memory statistics
     */
    getMemoryStats() {
        return window.memorySystem.getMemoryStats();
    }

    /**
     * Export memory data
     */
    exportMemory() {
        return window.memorySystem.exportMemory();
    }

    /**
     * Import memory data
     */
    async importMemory(file) {
        return await window.memorySystem.importMemory(file);
    }

    /**
     * Search conversations
     */
    searchConversations(query, limit = 10) {
        return window.memorySystem.searchConversations(query, limit);
    }

    /**
     * Clear all memory
     */
    clearAllMemory() {
        return window.memorySystem.clearAllConversations();
    }
}

// Global memory integration instance
window.memoryIntegration = new MemoryIntegration();

// Enhanced functions for better integration
function enhancedSaveConversation() {
    if (window.memoryIntegration) {
        window.memoryIntegration.saveCurrentConversation();
    }
}

function enhancedLoadConversation() {
    if (window.memoryIntegration) {
        window.memoryIntegration.loadLastConversation();
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MemoryIntegration;
}
