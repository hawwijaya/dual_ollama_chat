/**
 * Memory System Integration for Dual Ollama Chat
 * Ensures seamless integration between memory system and existing chat functionality
 */

class MemoryIntegration {
    constructor() {
        this.isInitialized = false;
        this.init();
    }

    init() {
        // Wait for DOM and memory system to be ready
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => this.setupIntegration());
        } else {
            this.setupIntegration();
        }
    }

    setupIntegration() {
        // Ensure memory system is available
        if (!window.memorySystem || !window.memoryUI) {
            console.error('Memory system not available');
            return;
        }

        // Hook into existing chat functions
        this.hookIntoChatSystem();
        
        // Add memory context to system prompts
        this.enhanceSystemPrompts();
        
        // Setup memory cleanup on new chat
        this.setupNewChatIntegration();
        
        this.isInitialized = true;
        console.log('Memory system integration complete');
    }

    hookIntoChatSystem() {
        // Store original functions
        const originalSendMessageWithModel = window.sendMessageWithModel;
        const originalAddMessage = window.addMessage;
        
        // Hook into sendMessageWithModel to add context
        window.sendMessageWithModel = async function(modelNumber) {
            if (!window.memoryIntegration.isInitialized) {
                return originalSendMessageWithModel.call(this, modelNumber);
            }

            const messageInput = document.getElementById('messageInput');
            const message = messageInput.value.trim();
            if (!message) return;

            // Get relevant context from memory
            const context = await window.memoryUI.getContextForQuery(message, 
                modelNumber === 1 ? currentModel1 : currentModel2);
            
            // Add context to system prompt if available
            if (context) {
                const originalSystemPrompt = document.getElementById('systemPrompt').value;
                const enhancedPrompt = `${originalSystemPrompt}\n\n${context}`;
                
                // Temporarily update system prompt
                document.getElementById('systemPrompt').value = enhancedPrompt;
                
                // Call original function
                const result = await originalSendMessageWithModel.call(this, modelNumber);
                
                // Restore original system prompt
                document.getElementById('systemPrompt').value = originalSystemPrompt;
                
                return result;
            }
            
            return originalSendMessageWithModel.call(this, modelNumber);
        };

        // Hook into addMessage to store memories
        window.addMessage = function(content, isUser = false, fileData = null, modelInfo = null) {
            const result = originalAddMessage.call(this, content, isUser, fileData, modelInfo);
            
            if (window.memoryIntegration.isInitialized) {
                // Store conversation memory
                const modelName = modelInfo ? modelInfo.name : (isUser ? currentModel1 || currentModel2 : 'assistant');
                const memoryContent = isUser ? `User: ${content}` : `Assistant: ${content}`;
                
                window.memoryUI.addConversationMemory(
                    memoryContent, 
                    modelName, 
                    fileData?.type
                );
                
                // Store semantic knowledge for important content
                if (!isUser && content.length > 100) {
                    // Simple heuristic: if response is substantial, store as knowledge
                    window.memoryUI.addKnowledgeMemory(content, 'general');
                }
            }
            
            return result;
        };
    }

    enhanceSystemPrompts() {
        // Add memory-aware instructions to system prompt
        const systemPrompt = document.getElementById('systemPrompt');
        const originalPrompt = systemPrompt.value;
        
        const memoryEnhancedPrompt = originalPrompt + 
            "\n\nYou have access to previous conversation memories. When relevant, refer to past discussions " +
            "and maintain consistency with previously shared information. Use the context provided to " +
            "give more personalized and helpful responses.";
        
        systemPrompt.value = memoryEnhancedPrompt;
    }

    setupNewChatIntegration() {
        const originalStartNewChat = window.startNewChat;
        
        window.startNewChat = async function() {
            // Clear working memory when starting new chat
            if (window.memorySystem) {
                // Remove expired working memories
                window.memorySystem.memoryStore = window.memorySystem.memoryStore.filter(
                    memory => memory.type !== 'working' || 
                    (memory.metadata.expiresAt && memory.metadata.expiresAt > Date.now())
                );
                window.memorySystem.saveMemoryStore();
            }
            
            return originalStartNewChat.call(this);
        };
    }

    // Utility methods for memory management
    async getConversationSummary(modelName) {
        if (!window.memoryUI) return '';
        return await window.memoryUI.getConversationSummary(modelName);
    }

    async searchMemories(query, type = null, limit = 10) {
        if (!window.memorySystem) return [];
        return await window.memorySystem.retrieveMemories(query, type, limit);
    }

    exportMemories() {
        if (!window.memorySystem) return null;
        return window.memorySystem.exportMemories();
    }

    importMemories(jsonData) {
        if (!window.memorySystem) return false;
        try {
            window.memorySystem.importMemories(jsonData);
            return true;
        } catch (error) {
            console.error('Failed to import memories:', error);
            return false;
        }
    }
}

// Initialize memory integration
window.memoryIntegration = new MemoryIntegration();

// Global memory utilities
window.memoryUtils = {
    search: (query, type, limit) => window.memoryIntegration.searchMemories(query, type, limit),
    export: () => window.memoryIntegration.exportMemories(),
    import: (data) => window.memoryIntegration.importMemories(data),
    getSummary: (model) => window.memoryIntegration.getConversationSummary(model)
};

// Debug helper
window.debugMemory = () => {
    console.log('=== Memory System Debug ===');
    console.log('Memory count:', window.memorySystem?.memoryStore?.length || 0);
    console.log('Recent memories:', window.memorySystem?.memoryStore?.slice(-5) || []);
    console.log('Memory types:', window.memorySystem?.getStats() || {});
    console.log('Integration status:', window.memoryIntegration?.isInitialized || false);
};
