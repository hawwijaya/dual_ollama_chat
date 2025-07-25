/* Generated JavaScript file from monolithic HTML */
/* Original inline scripts and event handlers */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Separated JavaScript components loaded successfully');
    
    // Set up event listeners for model select dropdowns
    const modelSelect1 = document.getElementById('modelSelect');
    const modelSelect2 = document.getElementById('modelSelect2');
    
    if (modelSelect1) {
        modelSelect1.addEventListener('change', function() {
            updateActivateButtons();
        });
    }
    
    if (modelSelect2) {
        modelSelect2.addEventListener('change', function() {
            updateActivateButtons();
        });
    }
    
    // Initial update of activate buttons
    updateActivateButtons();
});

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Function to wait for MathJax to be ready (updated for local loading)
function waitForMathJax(callback, timeout = 5000) {
    const startTime = Date.now();
    
    const check = () => {
        if (window.MathJax && window.MathJax.typesetPromise) {
            callback(true);
        } else if (Date.now() - startTime > timeout) {
            callback(false); // Timeout
        } else {
            setTimeout(check, 50); // Check more frequently for local loading
        }
    };
      check();
}

// Configure marked for markdown parsing
marked.setOptions({
    highlight: function(code, lang) {
        if (lang && hljs.getLanguage(lang)) {
            try {
                return hljs.highlight(code, { language: lang }).value;
            } catch (err) {}
        }
        return hljs.highlightAuto(code).value;
    },
    breaks: true,
    gfm: true
});

let currentModel1 = null;
let currentModel2 = null;
let isLoading = false;
let baseUrl = 'http://127.0.0.1:11434';

// Add AbortController for canceling ongoing requests
let currentAbortController = null;

// Modified: Store PDF/SVG/CSV/Excel content
let uploadedFileBase64 = null;
let uploadedFileType = null;
let uploadedFileName = null;
let pdfTextContent = null;
let pdfImageContents = [];
let svgConvertedBase64 = null; // Store converted SVG as PNG
let spreadsheetData = null; // Store CSV/Excel data
let spreadsheetStats = null; // Store statistics about spreadsheet

// Modified: Initialize empty conversation history (no welcome message)
let conversationHistory = [];
let currentSystemPrompt = null; // Track current system prompt

// Function to show loading indicator
function showLoading() {
    // Create or show loading indicator
    let loadingDiv = document.getElementById('loadingIndicator');
    if (!loadingDiv) {
        loadingDiv = document.createElement('div');
        loadingDiv.id = 'loadingIndicator';
        loadingDiv.className = 'loading-indicator';
        loadingDiv.innerHTML = `
            <div class="loading-spinner"></div>
            <div class="loading-text">Generating response...</div>
        `;
        loadingDiv.style.cssText = `
            display: flex;
            flex-direction: column;
            align-items: center;
            padding: 20px;
            margin: 10px 0;
            background: rgba(255, 255, 255, 0.1);
            border-radius: 12px;
            border: 1px solid rgba(255, 255, 255, 0.2);
        `;
        
        // Add CSS for spinner if not already present
        if (!document.getElementById('loadingSpinnerStyles')) {
            const style = document.createElement('style');
            style.id = 'loadingSpinnerStyles';
            style.textContent = `
                .loading-spinner {
                    width: 24px;
                    height: 24px;
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    border-top: 3px solid #007acc;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                    margin-bottom: 10px;
                }
                @keyframes spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                .loading-text {
                    color: rgba(255, 255, 255, 0.8);
                    font-size: 14px;
                }
            `;
            document.head.appendChild(style);
        }
        
        const messagesContainer = document.getElementById('messages');
        messagesContainer.appendChild(loadingDiv);
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
    } else {
        loadingDiv.style.display = 'flex';
    }
}

// Function to hide loading indicator
function hideLoading() {
    const loadingDiv = document.getElementById('loadingIndicator');
    if (loadingDiv) {
        loadingDiv.remove();
    }
}

// Modified: Start new chat (clear history and dynamic UI messages only)
async function startNewChat() {
    // Stop any ongoing inference process
    await stopOngoingInference();
    
    // Note: We don't unload models from memory to avoid reload time
    // Models remain loaded for faster subsequent requests
    
    conversationHistory = []; // Empty history, no welcome message
    currentSystemPrompt = null; // Reset system prompt tracking
    const messagesContainer = document.getElementById('messages');

    // Remove all messages except the static welcome message
    const messages = messagesContainer.querySelectorAll('.message:not(#staticWelcomeMessage)');
    messages.forEach(message => message.remove());

    removeFile(); // Updated function name
    document.getElementById('messageInput').value = '';
    
    console.log('New chat started - inference stopped, models remain loaded for efficiency');
}

// Function to stop ongoing inference process
async function stopOngoingInference() {
    if (currentAbortController) {
        console.log('Aborting ongoing request...');
        currentAbortController.abort();
        currentAbortController = null;
    }
    
    if (isLoading) {
        // Reset loading state
        isLoading = false;
        hideLoading();
        
        // Re-enable UI elements
        updateModelButtons();
        const messageInput = document.getElementById('messageInput');
        if (messageInput) {
            messageInput.disabled = false;
            messageInput.focus();
        }
        
        console.log('Stopped ongoing inference and reset UI state');
    }
}

// Function to clear Ollama model memory and cache (DISABLED - keeps models loaded for efficiency)
// This function can be called manually if needed to free up memory
async function clearOllamaMemory() {
    try {
        updateBaseUrl();
        
        // Get currently loaded models
        const psResponse = await fetch(`${baseUrl}/api/ps`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 5000
        });
        
        if (psResponse.ok) {
            const data = await psResponse.json();
            const loadedModels = data.models || [];
            
            // Unload each model to clear memory
            for (const model of loadedModels) {
                try {
                    await fetch(`${baseUrl}/api/generate`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            model: model.name,
                            keep_alive: 0 // This tells Ollama to unload the model
                        }),
                        timeout: 5000
                    });
                    console.log(`Unloaded model: ${model.name}`);
                } catch (error) {
                    console.warn(`Failed to unload model ${model.name}:`, error);
                }
            }
            
            console.log('Ollama memory cleared - all models unloaded');
        }
    } catch (error) {
        console.warn('Failed to clear Ollama memory:', error);
        // Don't throw error as this is not critical for starting new chat
    }
}

function toggleConfig() {
    const panel = document.getElementById('configPanel');
    panel.classList.toggle('active');
}

function updateBaseUrl() {
    const host = document.getElementById('hostInput').value;
    const port = document.getElementById('portInput').value;
    baseUrl = `http://${host}:${port}`;
}

async function updateActiveModelsDisplay() {
    const displayElement = document.getElementById('activeModelsText');
    if (!displayElement) return;

    try {
        // Check for currently loaded models in memory
        const psResponse = await fetch(`${baseUrl}/api/ps`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors'
        });

        if (psResponse.ok) {
            const psData = await psResponse.json();
            let loadedModels = [];
            if (psData.models && psData.models.length > 0) {
                loadedModels = psData.models.map(model => model.name || model.model);
            }            // Determine which loaded models to show as Model 1 and Model 2
            // Use the actual assigned models instead of array order
            let model1Display = 'None';
            let model2Display = 'None';

            if (currentModel1) {
                model1Display = `${currentModel1} ✅`;
            }
            
            if (currentModel2) {
                model2Display = `${currentModel2} ✅`;
            }

            displayElement.innerHTML = `Model 1: <span style="color: ${model1Display !== 'None' ? '#27ae60' : '#666'}">${model1Display}</span>, Model 2: <span style="color: ${model2Display !== 'None' ? '#27ae60' : '#666'}">${model2Display}</span>`;
            } else {
                // Fallback to assigned models if ps command fails
                const model1Status = currentModel1 ? `${currentModel1} ✅` : 'None';
                const model2Status = currentModel2 ? `${currentModel2} ✅` : 'None';
                displayElement.innerHTML = `Model 1: <span style="color: ${currentModel1 ? '#27ae60' : '#666'}">${model1Status}</span>, Model 2: <span style="color: ${currentModel2 ? '#27ae60' : '#666'}">${model2Status}</span>`;
            }
            } catch (error) {
                console.warn('Could not update active models display:', error);
                // Fallback to assigned models if there's an error
                const model1Status = currentModel1 ? `${currentModel1} ✅` : 'None';
                const model2Status = currentModel2 ? `${currentModel2} ✅` : 'None';
                displayElement.innerHTML = `Model 1: <span style="color: ${currentModel1 ? '#27ae60' : '#666'}">${model1Status}</span>, Model 2: <span style="color: ${currentModel2 ? '#27ae60' : '#666'}">${model2Status}</span>`;
            }
        }

async function detectModels(event = null) {
    updateBaseUrl();
    
    // Handle case where function is called without an event (programmatically)
    let btn = null;
    let originalText = '';
    
    if (event && event.target) {
        // btn = event.target;
        // originalText = btn.textContent;
        // btn.textContent = '🔍 Detecting...';
        // btn.disabled = true;
    }

    try {
        // First, check for currently loaded models in memory
        let loadedModels = [];
        try {
            const psResponse = await fetch(`${baseUrl}/api/ps`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors'
            });

            if (psResponse.ok) {
                const psData = await psResponse.json();
                if (psData.models && psData.models.length > 0) {
                    loadedModels = psData.models.map(model => model.name || model.model);
                    console.log('Currently loaded models:', loadedModels);
                }
            }
            } catch (psError) {
                console.warn('Could not check loaded models:', psError);
            }

            // Then get all available models
            const response = await fetch(`${baseUrl}/api/tags`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors'
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            const modelSelect1 = document.getElementById('modelSelect');
            const modelSelect2 = document.getElementById('modelSelect2');

            // Clear existing options
            modelSelect1.innerHTML = '<option value="">Select a model...</option>';
            modelSelect2.innerHTML = '<option value="">Select a model...</option>';

            if (data.models && data.models.length > 0) {
                data.models.forEach(model => {
                    const option1 = document.createElement('option');
                    option1.value = model.name;

                    // Mark loaded models in the dropdown
                    const isLoaded = loadedModels.includes(model.name);
                    option1.textContent = model.name + (isLoaded ? ' (loaded)' : '');
                    if (isLoaded) {
                        option1.style.fontWeight = 'bold';
                        option1.style.color = '#27ae60';
                    }
                    modelSelect1.appendChild(option1);

                    const option2 = document.createElement('option');
                    option2.value = model.name;
                    option2.textContent = model.name + (isLoaded ? ' (loaded)' : '');
                    if (isLoaded) {
                        option2.style.fontWeight = 'bold';
                        option2.style.color = '#27ae60';
                    }
                    modelSelect2.appendChild(option2);
                });                // Update activate buttons after populating dropdowns
                updateActivateButtons();

                // Auto-assign loaded models to slots if not already assigned
                if (loadedModels.length > 0) {
                    // Check if we need to assign Model 1
                    if (!currentModel1 || !loadedModels.includes(currentModel1)) {
                        const firstLoaded = loadedModels[0];
                        modelSelect1.value = firstLoaded;
                        currentModel1 = firstLoaded;
                        console.log(`Auto-assigned ${firstLoaded} to Model 1 slot`);
                    }

                    // Check if we need to assign Model 2 (use different model if available)
                    if (loadedModels.length > 1 && (!currentModel2 || !loadedModels.includes(currentModel2))) {
                        const secondLoaded = loadedModels.find(model => model !== currentModel1) || loadedModels[1];
                        if (secondLoaded && secondLoaded !== currentModel1) {
                            modelSelect2.value = secondLoaded;
                            currentModel2 = secondLoaded;
                            console.log(`Auto-assigned ${secondLoaded} to Model 2 slot`);
                        }
                    }                    // Enable chat interface if models are assigned
                    if (currentModel1 || currentModel2) {
                        updateModelButtons();
                    }
                    
                    // Update activate button states after auto-assignment
                    updateActivateButtons();

                    showStatus(`Found ${data.models.length} models (${loadedModels.length} loaded in memory). Auto-assigned loaded models.`, 'success');
                    } else {
                        showStatus(`Found ${data.models.length} models`, 'success');
                    }
                    } else {
                        showStatus('No models found. Please pull a model first.', 'error');
                    }
                    } catch (error) {
                        console.error('Error detecting models:', error);
                        let errorMessage = error.message;
                        if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
                            errorMessage = `CORS Error: Cannot connect to Ollama server.\n\nWindows PowerShell:\n$env:OLLAMA_ORIGINS="*"; ollama serve\n\nWindows CMD:\nset OLLAMA_ORIGINS=* && ollama serve\n\nOr use the start-ollama.bat file\n\nCheck if Ollama is running on http://127.0.0.1:11434`;
                        }

                        showStatus(errorMessage, 'error');                        } finally {
                            if (btn) {
                                btn.textContent = originalText;
                                btn.disabled = false;
                            }
                            updateActivateButtons();
                            await updateActiveModelsDisplay(); // Make this async call and await it
                        }
                    }

function updateActivateButtons() {
    const modelSelect1 = document.getElementById('modelSelect');
    const activateBtn1 = document.getElementById('activateBtn');
    activateBtn1.disabled = !modelSelect1.value;

    const modelSelect2 = document.getElementById('modelSelect2');
    const activateBtn2 = document.getElementById('activateBtn2');
    activateBtn2.disabled = !modelSelect2.value;
}

// New function to update model button states
function updateModelButtons() {
    const model1Btn = document.getElementById('model1Btn');
    const model2Btn = document.getElementById('model2Btn');
    const messageInput = document.getElementById('messageInput');
    
    if (model1Btn) {
        model1Btn.disabled = !currentModel1;
        model1Btn.title = currentModel1 ? `Send to Model 1 (${currentModel1})` : 'Model 1 not activated';
    }
    
    if (model2Btn) {
        model2Btn.disabled = !currentModel2;
        model2Btn.title = currentModel2 ? `Send to Model 2 (${currentModel2})` : 'Model 2 not activated';
    }
    
    // Enable input if at least one model is active
    const hasActiveModel = currentModel1 || currentModel2;
    if (messageInput) {
        messageInput.disabled = !hasActiveModel;
        messageInput.placeholder = hasActiveModel ? 'Type your message here...' : 'Activate a model to chat.';
    }
}

async function activateModel(modelNumber) {
    const modelSelectElement = document.getElementById(modelNumber === 1 ? 'modelSelect' : 'modelSelect2');
    const selectedModelName = modelSelectElement.value;

    if (!selectedModelName) return;

    const btn = document.getElementById(modelNumber === 1 ? 'activateBtn' : 'activateBtn2');
    const originalButtonText = btn.textContent; // Store original button text
    btn.textContent = '🚀 Activating...';
    btn.disabled = true;

    let previouslyActiveModelInThisSlot = null;
    if (modelNumber === 1) {
        previouslyActiveModelInThisSlot = currentModel1;
    } else { // modelNumber === 2
    previouslyActiveModelInThisSlot = currentModel2;
}

try {
    // Check if model is already loaded in memory
    let isAlreadyLoaded = false;
    try {
        const psResponse = await fetch(`${baseUrl}/api/ps`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
            mode: 'cors'
        });

        if (psResponse.ok) {
            const psData = await psResponse.json();
            if (psData.models && psData.models.length > 0) {
                const loadedModels = psData.models.map(model => model.name || model.model);
                isAlreadyLoaded = loadedModels.includes(selectedModelName);
            }
        }
        } catch (psError) {
            console.warn('Could not check if model is loaded:', psError);
        }

        if (isAlreadyLoaded) {
            console.log(`Model ${selectedModelName} is already loaded in memory`);
            } else {
                console.log(`Loading model ${selectedModelName} into memory...`);
            }

            // Test the model by sending a simple request. This also loads it if not already loaded.
            const response = await fetch(`${baseUrl}/api/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                mode: 'cors',
                body: JSON.stringify({
                    model: selectedModelName,
                    prompt: 'Hello', // A short prompt to check/load the model
                    stream: false
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            // Successfully activated or confirmed active
            if (modelNumber === 1) {
                if (previouslyActiveModelInThisSlot && previouslyActiveModelInThisSlot !== selectedModelName) {
                    console.log(`Model ${previouslyActiveModelInThisSlot} in slot 1 is being replaced by ${selectedModelName}.`);
                    // Ollama manages unloading models from memory based on its policies.
                }
                currentModel1 = selectedModelName;
            } else { // modelNumber === 2
            if (previouslyActiveModelInThisSlot && previouslyActiveModelInThisSlot !== selectedModelName) {
                console.log(`Model ${previouslyActiveModelInThisSlot} in slot 2 is being replaced by ${selectedModelName}.`);
                // Ollama manages unloading models from memory based on its policies.
            }
            currentModel2 = selectedModelName;
        }

        const statusMessage = isAlreadyLoaded ?
        `Model ${modelNumber} "${selectedModelName}" was already loaded and is now active!` :
        `Model ${modelNumber} "${selectedModelName}" loaded and activated successfully!`;
        showStatus(statusMessage, 'success');        // Enable chat interface if either model is active
        if (currentModel1 || currentModel2) {
            updateModelButtons();
        }

        } catch (error) {
            console.error(`Error activating model ${modelNumber} ("${selectedModelName}"):`, error);
            let errorMessageText = error.message;
            if (error.message.includes('Failed to fetch') || error.name === 'TypeError' || error.message.includes('NetworkError')) {
                errorMessageText = `CORS Error: Cannot connect to Ollama server.\n\nWindows PowerShell:\n$env:OLLAMA_ORIGINS="*"; ollama serve\n\nWindows CMD:\nset OLLAMA_ORIGINS=* && ollama serve\n\nOr use the start-ollama.bat file\n\nCheck if Ollama is running on http://127.0.0.1:11434`;
            }

            showStatus(`Error activating model ${modelNumber} ("${selectedModelName}"): ${errorMessageText}`, 'error');

            // If activation failed, currentModel1 or currentModel2 for this slot was not updated.
            // They retain their previous values (previouslyActiveModelInThisSlot or null).
            // So, no explicit revert of currentModel1/currentModel2 is needed here.            // Disable chat interface ONLY if BOTH models are effectively null (i.e., no model is successfully active)
            // This check uses the current values of currentModel1 and currentModel2, which reflect the latest successful activations.
            if (!currentModel1 && !currentModel2) {
                updateModelButtons();
            }        } finally {
            btn.textContent = originalButtonText; // Restore original button text
            // Re-enable the button based on selection
            updateActivateButtons();
            updateModelButtons(); // Update model button states
            await updateActiveModelsDisplay(); // Make this async call and await it
        }
        }

function showStatus(message, type = 'success') {
    // Remove existing status messages
    const existingStatus = document.querySelector('.status');
    if (existingStatus) {
        existingStatus.remove();
    }

    const status = document.createElement('div');
    status.className = `status ${type === 'error' ? 'error' : ''}`;

    // Handle multi-line messages
    if (message.includes('\n')) {
        status.innerHTML = message.replace(/\n/g, '<br>');
        } else {
            status.textContent = message;
        }

        const configPanel = document.getElementById('configPanel');
        configPanel.appendChild(status);

        // Auto-remove after 10 seconds for error messages, 5 for success
        setTimeout(() => {
            if (status.parentNode) {
                status.remove();
            }
        }, type === 'error' ? 10000 : 5000);
    }

function addMessage(content, isUser = false, fileData = null, modelInfo = null) {
    const messagesContainer = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;

    // For assistant messages, show file thumbnails/previews if the previous user message had a file
    if (!isUser && conversationHistory.length >= 1) {
        const lastUserMsgIndex = conversationHistory.length - 1;
        if (lastUserMsgIndex >= 0) {
            const lastUserMsg = conversationHistory[lastUserMsgIndex];
            if (lastUserMsg.files && lastUserMsg.files.length > 0) {
                const file = lastUserMsg.files[0];
                if (file.type.startsWith('image/')) {
                    const img = document.createElement('img');
                    img.src = 'data:' + file.type + ';base64,' + file.data;
                    img.style.maxWidth = '200px';
                    img.style.maxHeight = '140px';
                    img.style.borderRadius = '8px';
                    img.style.marginBottom = '12px';
                    img.style.display = 'block';
                    img.style.cursor = 'pointer';
                    img.style.transition = 'transform 0.2s';
                    img.title = 'Click to view full size';


                    // Add click handler for image popup
                    img.onclick = () => {
                        const modal = document.createElement('div');
                        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:1000;cursor:pointer;';
                        const largeImg = document.createElement('img');
                        largeImg.src = img.src;
                        largeImg.style.cssText = 'max-width:90%;max-height:90%;border-radius:8px;';
                        modal.appendChild(largeImg);
                        modal.onclick = () => modal.remove();
                        document.body.appendChild(modal);
                    };

                    // Add hover effect
                    img.onmouseover = () => img.style.transform = 'scale(1.05)';
                    img.onmouseout = () => img.style.transform = 'scale(1)';

                    messageDiv.appendChild(img);
                    } else if (file.type === 'application/pdf' && file.pageImages) {
                        // Show PDF page thumbnails for assistant responses
                        const pdfThumbnailsDiv = document.createElement('div');
                        pdfThumbnailsDiv.style.cssText = 'display:flex;flex-wrap:wrap;gap:8px;margin-bottom:12px;';

                        file.pageImages.slice(0, 6).forEach((img, index) => {
                            const thumb = document.createElement('img');
                            thumb.src = 'data:' + img.type + ';base64,' + img.data;
                            thumb.style.cssText = 'max-width:80px;max-height:60px;border-radius:4px;border:1px solid #dee2e6;cursor:pointer;transition:transform 0.2s;';
                            thumb.title = `PDF Page ${img.page}`;
                            thumb.onclick = () => {
                                // Create modal to show larger image
                                const modal = document.createElement('div');
                                modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:1000;cursor:pointer;';
                                const largeImg = document.createElement('img');
                                largeImg.src = thumb.src;
                                largeImg.style.cssText = 'max-width:90%;max-height:90%;border-radius:8px;';
                                modal.appendChild(largeImg);
                                modal.onclick = () => modal.remove();
                                document.body.appendChild(modal);
                            };
                            thumb.onmouseover = () => thumb.style.transform = 'scale(1.1)';
                            thumb.onmouseout = () => thumb.style.transform = 'scale(1)';
                            pdfThumbnailsDiv.appendChild(thumb);
                        });

                        if (file.pageImages.length > 6) {
                            const moreDiv = document.createElement('div');
                            moreDiv.style.cssText = 'display:flex;align-items:center;justify-content:center;min-width:80px;height:60px;background:#f8f9fa;border:1px solid #dee2e6;border-radius:4px;font-size:10px;color:#666;text-align:center;padding:4px;';
                            moreDiv.textContent = `+${file.pageImages.length - 6} more pages`;
                            pdfThumbnailsDiv.appendChild(moreDiv);
                        }

                        messageDiv.appendChild(pdfThumbnailsDiv);
                        } else if ((file.type === 'text/csv' || file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') && file.spreadsheetPreview) {
                            // Show spreadsheet preview for assistant responses
                            const spreadsheetDiv = document.createElement('div');
                            spreadsheetDiv.className = 'spreadsheet-preview';
                            spreadsheetDiv.style.marginBottom = '12px';
                            spreadsheetDiv.innerHTML = file.spreadsheetPreview;
                            messageDiv.appendChild(spreadsheetDiv);
                        }
                    }
                }
            }

            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';

            // If user and file, show file info and visual preview inside user message
            if (isUser && fileData) {
                const fileInfoDiv = document.createElement('div');
                fileInfoDiv.style.cssText = 'font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace; font-size: 11px; color: rgba(255, 255, 255, 0.8); margin-bottom: 8px; padding: 4px 8px; background: rgba(255, 255, 255, 0.1); border-radius: 4px; border-left: 3px solid rgba(255, 255, 255, 0.3);';

                if (fileData.type.startsWith('image/')) {
                    fileInfoDiv.innerHTML = `📷 Image: ${fileData.name}`;

                    // Add small image preview
                    const img = document.createElement('img');
                    img.src = 'data:' + fileData.type + ';base64,' + fileData.data;
                    img.style.cssText = 'max-width: 100px; max-height: 60px; border-radius: 4px; margin-top: 6px; display: block; cursor: pointer; transition: transform 0.2s;';
                    img.onclick = () => {
                        const modal = document.createElement('div');
                        modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:1000;cursor:pointer;';
                        const largeImg = document.createElement('img');
                        largeImg.src = img.src;
                        largeImg.style.cssText = 'max-width:90%;max-height:90%;border-radius:8px;';
                        modal.appendChild(largeImg);
                        modal.onclick = () => modal.remove();
                        document.body.appendChild(modal);
                    };
                    img.onmouseover = () => img.style.transform = 'scale(1.05)';
                    img.onmouseout = () => img.style.transform = 'scale(1)';
                    fileInfoDiv.appendChild(img);
                    } else if (fileData.type === 'application/pdf') {
                        fileInfoDiv.innerHTML = `📄 PDF Document: ${fileData.name}`;
                        } else if (fileData.type === 'image/svg+xml') {
                            fileInfoDiv.innerHTML = `📊 SVG File: ${fileData.name}`;
                            } else if (fileData.type === 'text/csv') {
                                fileInfoDiv.innerHTML = `📊 CSV File: ${fileData.name}`;
                                if (fileData.stats) {
                                    fileInfoDiv.innerHTML += `<br><small>${fileData.stats.rows} rows × ${fileData.stats.columns} columns</small>`;
                                }
                                } else if (fileData.type.includes('spreadsheet') || fileData.type.includes('excel')) {
                                    fileInfoDiv.innerHTML = `📈 Excel File: ${fileData.name}`;
                                    if (fileData.stats) {
                                        fileInfoDiv.innerHTML += `<br><small>${fileData.stats.sheets} sheet(s), ${fileData.stats.rows} rows × ${fileData.stats.columns} columns</small>`;
                                    }
                                }

                                contentDiv.appendChild(fileInfoDiv);
                            }                            if (isUser) {
                                // Only show the actual user message content, not the file name
                                contentDiv.innerHTML += `<div style="margin-top: ${fileData ? '8px' : '0'}">${content}</div>`;
                                
                                // Add model information if provided
                                if (modelInfo) {
                                    const modelInfoDiv = document.createElement('div');
                                    modelInfoDiv.style.cssText = 'font-family: "SF Mono", Monaco, "Cascadia Code", "Roboto Mono", Consolas, "Courier New", monospace; font-size: 10px; color: rgba(255, 255, 255, 0.7); margin-top: 6px; padding: 3px 6px; background: rgba(255, 255, 255, 0.08); border-radius: 3px; border-left: 2px solid rgba(255, 255, 255, 0.2); display: inline-block;';
                                    modelInfoDiv.textContent = `Model ${modelInfo.number}: ${modelInfo.name}`;
                                    contentDiv.appendChild(modelInfoDiv);
                                }
                                } else {                    try {
                        // Pre-process content to fix common equation formats and handle LaTeX documents
                        let processedContent = content
                        // Convert \[ \] to $$ $$ for display math
                        .replace(/\\\[(.*?)\\\]/gs, '$$$$1$$')
                        // Convert \( \) to $ $ for inline math
                        .replace(/\\\((.*?)\\\)/gs, '$$$1$$')
                        // Handle equations that might be in square brackets without backslashes
                        .replace(/\[\s*([^[\]]*[=<>≤≥≈∈∀∃∑∏∫][^[\]]*)\s*\]/g, '$$$$1$$')
                        // Fix common LaTeX commands that might be missing proper delimiters
                        .replace(/([^$])(\\frac|\\sqrt|\\sum|\\int|\\prod|\\lim)/g, '$1$$$2')
                        .replace(/(\\frac\{[^}]+\}\{[^}]+\}|\\sqrt\{[^}]+\}|\\sum_\{[^}]+\}|\\int_\{[^}]+\}|\\prod_\{[^}]+\}|\\lim_\{[^}]+\})([^$])/g, '$1$$$2');

                        // Check if content contains LaTeX document structure
                        const hasLatexDocStructure = processedContent.includes('\\documentclass') || 
                                                   processedContent.includes('\\begin{document}') ||
                                                   processedContent.includes('\\usepackage');

                        if (hasLatexDocStructure) {
                            // For LaTeX documents, wrap in a special container to prevent MathJax processing
                            processedContent = `<div class="latex-document-container">
                                <div class="latex-document-notice" style="background:#e6f3ff;border:1px solid #4299e1;padding:12px;border-radius:8px;margin:12px 0;color:#2c5aa0;">
                                    <strong>📄 LaTeX Document Detected</strong><br>
                                    This appears to be a complete LaTeX document. Use the "View LaTeX formatted" button in code blocks to see a processed version.
                                </div>
                                ${marked.parse(processedContent)}
                            </div>`;
                            contentDiv.innerHTML = processedContent;
                        } else {
                            contentDiv.innerHTML = marked.parse(processedContent);
                        }// Add copy buttons and format view buttons to code blocks
                                        contentDiv.querySelectorAll('pre code').forEach((block, index) => {
                                            const pre = block.parentElement;
                                            const language = block.className.match(/language-(\w+)/);
                                            const langName = language ? language[1] : 'text';
                                            const codeContent = block.textContent;

                                            // Check if this is LaTeX or markdown content
                                            const isLatex = langName === 'latex' || langName === 'tex' || 
                                                          codeContent.includes('\\begin{') || 
                                                          codeContent.includes('\\documentclass') ||
                                                          codeContent.includes('\\usepackage') ||
                                                          codeContent.match(/\\\w+\{[^}]*\}/);
                                            
                                            const isMarkdown = langName === 'markdown' || langName === 'md' ||
                                                             (codeContent.includes('# ') || codeContent.includes('## ') ||
                                                              codeContent.includes('**') || codeContent.includes('*') ||
                                                              codeContent.includes('[') && codeContent.includes(']('));

                                            // Create header with language, format view buttons, and copy button
                                            const header = document.createElement('div');
                                            header.className = 'code-header';
                                            
                                            let formatButtons = '';
                                            if (isLatex) {
                                                formatButtons += `<button class="format-btn latex-btn" onclick="viewLatexFormatted(this)" title="View LaTeX formatted">in latex</button>`;
                                            }
                                            if (isMarkdown) {
                                                formatButtons += `<button class="format-btn markdown-btn" onclick="viewMarkdownFormatted(this)" title="View Markdown formatted">in markdown</button>`;
                                            }

                                            header.innerHTML = `
                                                <span>${langName}</span>
                                                <div class="code-buttons">
                                                    ${formatButtons}
                                                    <button class="copy-btn" onclick="copyCode(this)">Copy</button>
                                                </div>
                                            `;

                                            // Insert header before pre
                                            pre.parentNode.insertBefore(header, pre);
                                            pre.style.borderRadius = '0 0 8px 8px';
                                            pre.style.marginTop = '0';

                                            // Store code content for copying and formatting
                                            header.querySelector('.copy-btn').dataset.code = codeContent;
                                            if (isLatex) {
                                                header.querySelector('.latex-btn').dataset.code = codeContent;
                                            }
                                            if (isMarkdown) {
                                                header.querySelector('.markdown-btn').dataset.code = codeContent;
                                            }
                                        });                        // Process math equations with proper error handling (skip LaTeX document containers)
                        if (window.MathJax && window.MathJax.typesetPromise && !contentDiv.querySelector('.latex-document-container')) {
                            window.MathJax.typesetPromise([contentDiv]).then(() => {
                                console.log('MathJax typesetting completed');
                                }).catch((err) => {
                                    console.warn('MathJax rendering error:', err);
                                    // Fallback: try to render again after a short delay
                                    setTimeout(() => {
                                        if (window.MathJax && window.MathJax.typesetPromise) {
                                            window.MathJax.typesetPromise([contentDiv]).catch(() => {
                                                console.warn('MathJax fallback rendering also failed');
                                            });
                                        }
                                    }, 100);
                                });
                                } else if (!contentDiv.querySelector('.latex-document-container')) {
                                    // If MathJax is not ready, try again after a delay (but not for LaTeX documents)
                                    setTimeout(() => {
                                        if (window.MathJax && window.MathJax.typesetPromise) {
                                            window.MathJax.typesetPromise([contentDiv]).catch((err) => {
                                                console.warn('Delayed MathJax rendering error:', err);
                                            });
                                        }
                                    }, 500);
                                }

                                                } catch (error) {
                                                    console.warn('Markdown parsing error:', error);
                                                    contentDiv.textContent = content;
                                                }
                                            }

                                            messageDiv.appendChild(contentDiv);
                                            messagesContainer.appendChild(messageDiv);
                                            messagesContainer.scrollTop = messagesContainer.scrollHeight;
                                        }

function copyCode(button) {
    const code = button.dataset.code;
    navigator.clipboard.writeText(code).then(() => {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.style.background = '#38a169';
        setTimeout(() => {
            button.textContent = originalText;
            button.style.background = '#4a5568';
        }, 2000);
        }).catch(err => {
            console.error('Failed to copy code:', err);
        });
    }

// Function to view LaTeX content in formatted view
function viewLatexFormatted(button) {
    const code = button.dataset.code;
    
    // Create modal for formatted LaTeX view
    const modal = document.createElement('div');
    modal.className = 'format-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px;';
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = 'background:white;border-radius:12px;max-width:90%;max-height:90%;overflow:auto;box-shadow:0 20px 40px rgba(0,0,0,0.3);display:flex;flex-direction:column;';
    
    // Modal header
    const header = document.createElement('div');
    header.style.cssText = 'padding:16px 20px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;background:#f8f9fa;border-radius:12px 12px 0 0;';
    header.innerHTML = `
        <h3 style="margin:0;color:#2d3748;font-size:18px;">LaTeX Formatted View</h3>
        <button onclick="this.closest('.format-modal').remove()" style="background:none;border:none;font-size:24px;cursor:pointer;color:#718096;">&times;</button>
    `;
    
    // Content area with both source and rendered view
    const contentArea = document.createElement('div');
    contentArea.style.cssText = 'padding:20px;min-height:300px;';
    
    // Create tabs for source and rendered view
    const tabContainer = document.createElement('div');
    tabContainer.style.cssText = 'display:flex;margin-bottom:16px;border-bottom:1px solid #e2e8f0;';
    
    const sourceTab = document.createElement('button');
    sourceTab.textContent = 'Source';
    sourceTab.className = 'format-tab active';
    sourceTab.style.cssText = 'padding:8px 16px;border:none;background:none;cursor:pointer;border-bottom:2px solid #3182ce;color:#3182ce;font-weight:500;';
    
    const renderedTab = document.createElement('button');
    renderedTab.textContent = 'Rendered';
    renderedTab.className = 'format-tab';
    renderedTab.style.cssText = 'padding:8px 16px;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;color:#718096;margin-left:8px;';
    
    tabContainer.appendChild(sourceTab);
    tabContainer.appendChild(renderedTab);
    
    // Source view
    const sourceView = document.createElement('div');
    sourceView.className = 'tab-content active';
    const sourcePre = document.createElement('pre');
    sourcePre.style.cssText = 'background:#f7fafc;padding:16px;border-radius:8px;overflow:auto;margin:0;';
    const sourceCode = document.createElement('code');
    sourceCode.textContent = code;
    sourceCode.style.cssText = 'font-family:"SF Mono",Monaco,"Cascadia Code","Roboto Mono",Consolas,"Courier New",monospace;font-size:14px;';
    sourcePre.appendChild(sourceCode);
    sourceView.appendChild(sourcePre);
    
    // Rendered view
    const renderedView = document.createElement('div');
    renderedView.className = 'tab-content';
    renderedView.style.cssText = 'display:none;background:#fff;padding:16px;border:1px solid #e2e8f0;border-radius:8px;min-height:200px;';
      // Try to render LaTeX using MathJax
    try {
        let latexContent = code;
        
        // Check if this is a complete LaTeX document
        if (latexContent.includes('\\documentclass') || latexContent.includes('\\begin{document}')) {
            // Extract content from document body and math environments
            const bodyMatch = latexContent.match(/\\begin\{document\}([\s\S]*?)\\end\{document\}/);
            if (bodyMatch) {
                latexContent = bodyMatch[1].trim();
            }
            
            // If we still have document structure, show a formatted version instead
            if (latexContent.includes('\\documentclass') || latexContent.includes('\\usepackage')) {
                renderedView.innerHTML = `
                    <div style="color:#2d3748;padding:16px;line-height:1.6;">
                        <h4 style="margin:0 0 12px 0;color:#1a202c;">LaTeX Document Structure</h4>
                        <div style="background:#f7fafc;padding:12px;border-radius:6px;font-family:monospace;font-size:13px;white-space:pre-wrap;">${code}</div>
                        <p style="margin:12px 0 0 0;color:#718096;font-size:14px;">
                            <strong>Note:</strong> This appears to be a complete LaTeX document. MathJax can only render mathematical expressions. 
                            To see the rendered output, you would need to compile this with a LaTeX processor like pdflatex.
                        </p>
                    </div>
                `;
                return;
            }
        }
          // For complete LaTeX documents, extract and render content properly
        let renderedHTML = '<div style="padding:20px;line-height:1.6;max-width:800px;">';
        
        // Extract title, author, date if present
        const titleMatch = latexContent.match(/\\title\{([^}]+)\}/);
        const authorMatch = latexContent.match(/\\author\{([^}]+)\}/);
        const dateMatch = latexContent.match(/\\date\{([^}]+)\}/);
        
        if (titleMatch || authorMatch || dateMatch) {
            renderedHTML += '<div style="text-align:center;margin-bottom:30px;border-bottom:1px solid #e2e8f0;padding-bottom:20px;">';
            if (titleMatch) {
                renderedHTML += `<h1 style="margin:0 0 10px 0;color:#1a202c;font-size:24px;">${titleMatch[1]}</h1>`;
            }
            if (authorMatch) {
                renderedHTML += `<p style="margin:5px 0;color:#4a5568;font-size:16px;">${authorMatch[1]}</p>`;
            }
            if (dateMatch) {
                renderedHTML += `<p style="margin:5px 0;color:#718096;font-size:14px;">${dateMatch[1]}</p>`;
            }
            renderedHTML += '</div>';
        }
        
        // Split content into sections and paragraphs
        const sections = latexContent.split(/\\section\{([^}]+)\}/);
        for (let i = 1; i < sections.length; i += 2) {
            const sectionTitle = sections[i];
            const sectionContent = sections[i + 1] || '';
            
            renderedHTML += `<h2 style="color:#2d3748;font-size:20px;margin:25px 0 15px 0;">${sectionTitle}</h2>`;
            
            // Process paragraph content
            const paragraphs = sectionContent.split(/\n\s*\n/).filter(p => p.trim());
            paragraphs.forEach(paragraph => {
                const trimmedPara = paragraph.trim();
                if (!trimmedPara) return;
                
                // Skip LaTeX commands
                if (trimmedPara.startsWith('\\') && !trimmedPara.includes('$')) return;
                
                // Handle equations
                const equationMatch = trimmedPara.match(/\\begin\{equation\}([\s\S]*?)\\end\{equation\}/);
                if (equationMatch) {
                    renderedHTML += `<div style="margin:20px 0;text-align:center;">$$${equationMatch[1].trim()}$$</div>`;
                    return;
                }
                
                // Process regular paragraphs with inline math
                let processedPara = trimmedPara
                    // Convert inline math
                    .replace(/\$([^$]+)\$/g, '$$$1$$')
                    // Convert text formatting
                    .replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>')
                    .replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>')
                    // Remove LaTeX commands we don't need
                    .replace(/\\[a-zA-Z]+(\[[^\]]*\])?(\{[^}]*\})*\s*/g, '');
                
                if (processedPara.trim()) {
                    renderedHTML += `<p style="margin:15px 0;color:#2d3748;text-align:justify;">${processedPara}</p>`;
                }
            });
        }
        
        // If no sections found, process as single content
        if (sections.length <= 2) {
            const content = latexContent.replace(/\\(documentclass|usepackage|title|author|date|maketitle|begin\{document\}|end\{document\})[^}]*(\{[^}]*\})?/g, '').trim();
            const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim());
            
            paragraphs.forEach(paragraph => {
                const trimmedPara = paragraph.trim();
                if (!trimmedPara) return;
                
                // Handle equations
                const equationMatch = trimmedPara.match(/\\begin\{equation\}([\s\S]*?)\\end\{equation\}/);
                if (equationMatch) {
                    renderedHTML += `<div style="margin:20px 0;text-align:center;">$$${equationMatch[1].trim()}$$</div>`;
                    return;
                }
                
                // Process regular paragraphs
                let processedPara = trimmedPara
                    .replace(/\$([^$]+)\$/g, '$$$1$$')
                    .replace(/\\textbf\{([^}]+)\}/g, '<strong>$1</strong>')
                    .replace(/\\textit\{([^}]+)\}/g, '<em>$1</em>');
                
                if (processedPara.trim() && !processedPara.startsWith('\\')) {
                    renderedHTML += `<p style="margin:15px 0;color:#2d3748;text-align:justify;">${processedPara}</p>`;
                }
            });
        }
        
        renderedHTML += '</div>';
        renderedView.innerHTML = renderedHTML;        // Render with MathJax using the waiting function (local version)
        renderedView.innerHTML = '<div style="color:#4299e1;padding:16px;">⏳ Preparing LaTeX rendering (local MathJax)...</div>';
        
        waitForMathJax((mathJaxReady) => {
            if (mathJaxReady) {
                // MathJax is ready, render the content
                renderedView.innerHTML = renderedHTML;
                window.MathJax.typesetPromise([renderedView]).then(() => {
                    console.log('LaTeX rendered successfully with local MathJax');
                }).catch((err) => {
                    console.error('MathJax error:', err);
                    renderedView.innerHTML = `
                        <div style="color:#e53e3e;padding:16px;">
                            <h4 style="margin:0 0 8px 0;">MathJax Rendering Error</h4>
                            <p style="margin:0 0 8px 0;">Could not render LaTeX. Error details:</p>
                            <code style="background:#fed7d7;padding:4px 8px;border-radius:4px;">${err.message || err}</code>
                            <details style="margin-top:12px;">
                                <summary style="cursor:pointer;color:#3182ce;">Show original LaTeX code</summary>
                                <pre style="background:#f7fafc;padding:12px;margin-top:8px;border-radius:6px;overflow:auto;">${code}</pre>
                            </details>
                        </div>
                    `;
                });
            } else {
                // MathJax failed to load locally
                console.warn('Local MathJax not available');
                renderedView.innerHTML = `
                    <div style="color:#e53e3e;padding:16px;background:#fed7d7;border:1px solid #f56565;border-radius:8px;">
                        <h4 style="margin:0 0 8px 0;">🚫 Local MathJax Not Available</h4>
                        <p style="margin:0 0 12px 0;">The local MathJax library could not be loaded. Please check:</p>
                        <ul style="margin:0 0 12px 20px;">
                            <li>File exists: <code>lib/mathjax-tex-mml-chtml.js</code></li>
                            <li>File is not corrupted (try re-downloading)</li>
                            <li>No file permission issues</li>
                        </ul>
                        <p style="margin:0 0 12px 0;"><strong>Showing formatted content without math rendering:</strong></p>
                    </div>
                    ${renderedHTML.replace(/\$\$([^$]+)\$\$/g, '<div style="background:#f7fafc;padding:8px;margin:8px 0;border-radius:4px;font-family:monospace;border-left:4px solid #4299e1;"><strong>Math:</strong> $1</div>')}
                `;
            }
        });
    } catch (error) {
        renderedView.innerHTML = '<div style="color:#e53e3e;padding:16px;">Error rendering LaTeX: ' + error.message + '</div>';
    }
    
    // Tab switching functionality
    sourceTab.onclick = () => {
        sourceTab.style.borderBottomColor = '#3182ce';
        sourceTab.style.color = '#3182ce';
        renderedTab.style.borderBottomColor = 'transparent';
        renderedTab.style.color = '#718096';
        sourceView.style.display = 'block';
        renderedView.style.display = 'none';
    };
    
    renderedTab.onclick = () => {
        renderedTab.style.borderBottomColor = '#3182ce';
        renderedTab.style.color = '#3182ce';
        sourceTab.style.borderBottomColor = 'transparent';
        sourceTab.style.color = '#718096';
        sourceView.style.display = 'none';
        renderedView.style.display = 'block';
    };
    
    contentArea.appendChild(tabContainer);
    contentArea.appendChild(sourceView);
    contentArea.appendChild(renderedView);
    
    modalContent.appendChild(header);
    modalContent.appendChild(contentArea);
    modal.appendChild(modalContent);
    
    // Close modal when clicking outside
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    document.body.appendChild(modal);
}

// Function to view Markdown content in formatted view
function viewMarkdownFormatted(button) {
    const code = button.dataset.code;
    
    // Create modal for formatted Markdown view
    const modal = document.createElement('div');
    modal.className = 'format-modal';
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px;';
    
    const modalContent = document.createElement('div');
    modalContent.style.cssText = 'background:white;border-radius:12px;max-width:90%;max-height:90%;overflow:auto;box-shadow:0 20px 40px rgba(0,0,0,0.3);display:flex;flex-direction:column;';
    
    // Modal header
    const header = document.createElement('div');
    header.style.cssText = 'padding:16px 20px;border-bottom:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center;background:#f8f9fa;border-radius:12px 12px 0 0;';
    header.innerHTML = `
        <h3 style="margin:0;color:#2d3748;font-size:18px;">Markdown Formatted View</h3>
        <button onclick="this.closest('.format-modal').remove()" style="background:none;border:none;font-size:24px;cursor:pointer;color:#718096;">&times;</button>
    `;
    
    // Content area with both source and rendered view
    const contentArea = document.createElement('div');
    contentArea.style.cssText = 'padding:20px;min-height:300px;';
    
    // Create tabs for source and rendered view
    const tabContainer = document.createElement('div');
    tabContainer.style.cssText = 'display:flex;margin-bottom:16px;border-bottom:1px solid #e2e8f0;';
    
    const sourceTab = document.createElement('button');
    sourceTab.textContent = 'Source';
    sourceTab.className = 'format-tab active';
    sourceTab.style.cssText = 'padding:8px 16px;border:none;background:none;cursor:pointer;border-bottom:2px solid #3182ce;color:#3182ce;font-weight:500;';
    
    const renderedTab = document.createElement('button');
    renderedTab.textContent = 'Rendered';
    renderedTab.className = 'format-tab';
    renderedTab.style.cssText = 'padding:8px 16px;border:none;background:none;cursor:pointer;border-bottom:2px solid transparent;color:#718096;margin-left:8px;';
    
    tabContainer.appendChild(sourceTab);
    tabContainer.appendChild(renderedTab);
    
    // Source view
    const sourceView = document.createElement('div');
    sourceView.className = 'tab-content active';
    const sourcePre = document.createElement('pre');
    sourcePre.style.cssText = 'background:#f7fafc;padding:16px;border-radius:8px;overflow:auto;margin:0;';
    const sourceCode = document.createElement('code');
    sourceCode.textContent = code;
    sourceCode.style.cssText = 'font-family:"SF Mono",Monaco,"Cascadia Code","Roboto Mono",Consolas,"Courier New",monospace;font-size:14px;';
    sourcePre.appendChild(sourceCode);
    sourceView.appendChild(sourcePre);
    
    // Rendered view
    const renderedView = document.createElement('div');
    renderedView.className = 'tab-content';
    renderedView.style.cssText = 'display:none;background:#fff;padding:16px;border:1px solid #e2e8f0;border-radius:8px;min-height:200px;line-height:1.6;';
    
    // Render Markdown using marked
    try {
        renderedView.innerHTML = marked.parse(code);
        
        // Process any math in the rendered markdown
        if (window.MathJax && window.MathJax.typesetPromise) {
            window.MathJax.typesetPromise([renderedView]).catch(() => {
                console.warn('MathJax rendering failed in markdown view');
            });
        }
    } catch (error) {
        renderedView.innerHTML = '<div style="color:#e53e3e;padding:16px;">Error rendering Markdown: ' + error.message + '</div>';
    }
    
    // Tab switching functionality
    sourceTab.onclick = () => {
        sourceTab.style.borderBottomColor = '#3182ce';
        sourceTab.style.color = '#3182ce';
        renderedTab.style.borderBottomColor = 'transparent';
        renderedTab.style.color = '#718096';
        sourceView.style.display = 'block';
        renderedView.style.display = 'none';
    };
    
    renderedTab.onclick = () => {
        renderedTab.style.borderBottomColor = '#3182ce';
        renderedTab.style.color = '#3182ce';
        sourceTab.style.borderBottomColor = 'transparent';
        sourceTab.style.color = '#718096';
        sourceView.style.display = 'none';
        renderedView.style.display = 'block';
    };
    
    contentArea.appendChild(tabContainer);
    contentArea.appendChild(sourceView);
    contentArea.appendChild(renderedView);
    
    modalContent.appendChild(header);
    modalContent.appendChild(contentArea);
    modal.appendChild(modalContent);
    
    // Close modal when clicking outside
    modal.onclick = (e) => {
        if (e.target === modal) modal.remove();
    };
    
    document.body.appendChild(modal);
}

// Modified: Handle image, PDF, SVG, CSV, and Excel uploads
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    uploadedFileName = file.name;
    uploadedFileType = file.type;    // Reset all preview states
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('pdfPreview').style.display = 'none';
    document.getElementById('svgPreview').style.display = 'none';
    document.getElementById('csvPreview').style.display = 'none';
    document.getElementById('xlsxPreview').style.display = 'none';
    document.getElementById('imageEnhancementPanel').classList.remove('active');
    
    // Clear any existing spreadsheet previews
    const csvPreview = document.getElementById('csvPreview');
    const xlsxPreview = document.getElementById('xlsxPreview');
    const existingTable1 = csvPreview.querySelector('.spreadsheet-preview');
    const existingTable2 = xlsxPreview.querySelector('.spreadsheet-preview');
    if (existingTable1) existingTable1.remove();
    if (existingTable2) existingTable2.remove();

    if (file.type === 'application/pdf') {
        document.getElementById('pdfFileName').textContent = file.name;
        document.getElementById('pdfPreview').style.display = 'block';
        document.getElementById('imagePreviewContainer').style.display = 'flex';

        try {
            await processPDF(file);
            const reader = new FileReader();
            reader.onload = function(e) {
                uploadedFileBase64 = e.target.result.split(',')[1];
            };
            reader.readAsDataURL(file);
            } catch (error) {
                console.error('PDF processing failed:', error);
            }
            } else if (file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg')) {
                uploadedFileType = 'image/svg+xml';
                document.getElementById('svgFileName').textContent = file.name;
                document.getElementById('svgPreview').style.display = 'block';
                document.getElementById('imagePreviewContainer').style.display = 'flex';


                try {
                    await processSVG(file);
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        uploadedFileBase64 = e.target.result.split(',')[1];
                    };
                    reader.readAsDataURL(file);
                    } catch (error) {
                        console.error('SVG processing failed:', error);
                    }                        } else if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
                        uploadedFileType = 'text/csv';
                        document.getElementById('csvFileName').textContent = file.name;
                        document.getElementById('csvPreview').style.display = 'block';
                        document.getElementById('imagePreviewContainer').style.display = 'flex';

                        try {
                            await processCSV(file);
                            updateSpreadsheetPreview('csv');
                            const reader = new FileReader();
                            reader.onload = function(e) {
                                uploadedFileBase64 = e.target.result.split(',')[1];
                            };
                            reader.readAsDataURL(file);
                            } catch (error) {
                                console.error('CSV processing failed:', error);
                            }                        } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                        file.type === 'application/vnd.ms-excel' ||
                        file.name.toLowerCase().endsWith('.xlsx') ||
                        file.name.toLowerCase().endsWith('.xls')) {
                            uploadedFileType = file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                            document.getElementById('xlsxFileName').textContent = file.name;
                            document.getElementById('xlsxPreview').style.display = 'block';
                            document.getElementById('imagePreviewContainer').style.display = 'flex';

                            try {
                                await processExcel(file);
                                updateSpreadsheetPreview('xlsx');
                                const reader = new FileReader();
                                reader.onload = function(e) {
                                    uploadedFileBase64 = e.target.result.split(',')[1];
                                };
                                reader.readAsDataURL(file);
                                } catch (error) {
                                    console.error('Excel processing failed:', error);
                                }
                                } else if (file.type.startsWith('image/')) {
                                    // New: Enhanced image processing with OpenCV-style enhancement
                                    showOpenCVProcessingStatus('Loading image for enhancement...');

                                    const reader = new FileReader();
                                    reader.onload = async function(e) {
                                        try {
                                            await processImageWithOpenCV(e.target.result, file.name);
                                            document.getElementById('imagePreview').src = enhancedImageCanvas.toDataURL();
                                            document.getElementById('imagePreview').style.display = 'block';
                                            document.getElementById('imageEnhancementPanel').classList.add('active');
                                            document.getElementById('imagePreviewContainer').style.display = 'flex';
                                            showOpenCVProcessingStatus('Image enhancement ready!', true);
                                            } catch (error) {
                                                console.error('Image processing failed:', error);
                                                showOpenCVProcessingStatus('Error processing image: ' + error.message, false, true);
                                            }
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }                                // Process CSV files
async function processCSV(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const csvText = e.target.result;
                
                // Simple CSV parsing (handle quoted fields and commas)
                const lines = csvText.split('\n').filter(line => line.trim());
                const headers = parseCSVLine(lines[0]);
                const rows = lines.slice(1).map(line => parseCSVLine(line));
                
                // Convert to structured data
                const data = rows.map(row => {
                    const obj = {};
                    headers.forEach((header, index) => {
                        obj[header] = row[index] || '';
                    });
                    return obj;
                });
                  // Store the data as array format for convertSpreadsheetToText
                spreadsheetData = [headers, ...rows];
                
                // Set spreadsheet statistics
                spreadsheetStats = {
                    rows: data.length + 1, // +1 for header
                    columns: headers.length,
                    sheets: 1,
                    sheetNames: ['Sheet1']
                };
                  console.log('CSV processed successfully:', spreadsheetStats);
                resolve(spreadsheetData);
            } catch (error) {
                console.error('CSV processing error:', error);
                reject(error);
            }
        };
        reader.onerror = () => reject(new Error('Failed to read CSV file'));
        reader.readAsText(file);
    });
}

// Helper function to parse CSV line with proper handling of quoted fields
function parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (char === '"') {
            inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
            result.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    
    result.push(current.trim());
    return result;
}

// Process Excel files (.xlsx, .xls)
async function processExcel(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const fileName = file.name;
                const fileSize = (file.size / 1024).toFixed(2);
                
                // Check if XLSX library is available
                if (typeof XLSX === 'undefined') {
                    console.warn('XLSX library not available, using basic info only');
                    // Fallback to basic info
                    spreadsheetData = [
                        ['Excel File Information'],
                        ['Filename', fileName],
                        ['Size', fileSize + ' KB'],
                        ['Note', 'XLSX library not loaded. Consider converting to CSV for full analysis.']
                    ];
                    
                    spreadsheetStats = {
                        rows: 4,
                        columns: 2,
                        sheets: 1,
                        sheetNames: ['Info']
                    };
                    
                    console.log('Excel file detected (basic mode):', fileName);
                    resolve(spreadsheetData);
                    return;
                }
                
                // Use XLSX library to parse the Excel file
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                
                // Get all sheet names
                const sheetNames = workbook.SheetNames;
                console.log('Excel file detected:', fileName, 'with sheets:', sheetNames);
                
                // Process the first sheet (or all sheets if needed)
                const firstSheetName = sheetNames[0];
                const worksheet = workbook.Sheets[firstSheetName];
                
                // Convert worksheet to array of arrays
                const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });
                
                // Store the data
                spreadsheetData = jsonData.length > 0 ? jsonData : [['No data found']];
                
                // Calculate statistics
                const nonEmptyRows = spreadsheetData.filter(row => row.some(cell => cell !== '')).length;
                const maxCols = Math.max(...spreadsheetData.map(row => row.length));
                
                spreadsheetStats = {
                    rows: nonEmptyRows,
                    columns: maxCols,
                    sheets: sheetNames.length,
                    sheetNames: sheetNames,
                    fileName: fileName,
                    fileSize: fileSize + ' KB'
                };
                
                console.log('Excel processed successfully:', {
                    file: fileName,
                    sheets: sheetNames.length,
                    rows: nonEmptyRows,
                    cols: maxCols
                });
                
                resolve(spreadsheetData);
            } catch (error) {
                console.error('Excel processing error:', error);
                // Fallback to basic info on error
                const fileName = file.name;
                const fileSize = (file.size / 1024).toFixed(2);
                
                spreadsheetData = [
                    ['Excel File Information'],
                    ['Filename', fileName],
                    ['Size', fileSize + ' KB'],
                    ['Error', error.message],
                    ['Note', 'Failed to process Excel file. Consider converting to CSV.']
                ];
                
                spreadsheetStats = {
                    rows: 5,
                    columns: 2,
                    sheets: 1,
                    sheetNames: ['Error Info']
                };
                
                resolve(spreadsheetData);
            }
        };        reader.onerror = () => reject(new Error('Failed to read Excel file'));
        reader.readAsArrayBuffer(file);
    });
}

// New: PDF processing functions
async function processPDF(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        
        const extractedImages = [];
        let extractedText = '';
        
        // Show processing status
        showPDFProcessingStatus('Processing PDF pages...');
        
        // Process each page - extract both text and convert to images
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            
            // Extract text content
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            if (pageText.trim()) {
                extractedText += `\n--- Page ${pageNum} ---\n${pageText.trim()}\n`;
            }
            
            // Convert page to image
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            // Convert canvas to base64
            const imageDataUrl = canvas.toDataURL('image/png');
            const base64Data = imageDataUrl.split(',')[1];
            
            extractedImages.push({
                page: pageNum,
                data: base64Data,
                type: 'image/png'
            });
            
            // Update progress
            showPDFProcessingStatus(`Processed page ${pageNum}/${pdf.numPages}...`);
        }
        
        pdfTextContent = extractedText.trim() || null;
        pdfImageContents = extractedImages;
        
        showPDFProcessingStatus('PDF processing complete!', true);
        updatePDFPreview();
        
        return { text: pdfTextContent, images: pdfImageContents };
        
    } catch (error) {
        console.error('Error processing PDF:', error);
        showPDFProcessingStatus('Error processing PDF: ' + error.message, false, true);
        throw error;
    }
}

function showPDFProcessingStatus(message, complete = false, error = false) {
    let statusDiv = document.getElementById('pdfProcessingStatus');
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'pdfProcessingStatus';
        statusDiv.className = 'pdf-processing';
        statusDiv.style.cssText = 'margin: 8px 0; padding: 8px 12px; border: 1px solid #dee2e6; border-radius: 6px; font-size: 12px; background: #f8f9fa; color: #495057;';
        document.getElementById('imagePreviewContainer').appendChild(statusDiv);
    }
    
    if (error) {
        statusDiv.style.background = '#f8d7da';
        statusDiv.style.borderColor = '#f5c6cb';
        statusDiv.style.color = '#721c24';
        statusDiv.innerHTML = `❌ ${message}`;
    } else if (complete) {
        statusDiv.style.background = '#d4edda';
        statusDiv.style.borderColor = '#c3e6cb';
        statusDiv.style.color = '#155724';
        statusDiv.innerHTML = `✅ ${message}`;
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.remove();
            }
        }, 3000);
    } else {
        statusDiv.innerHTML = `<div style="display:inline-block;width:16px;height:16px;border:2px solid #f3f3f3;border-top:2px solid #3498db;border-radius:50%;animation:spin 2s linear infinite;margin-right:8px;"></div> ${message}`;
    }
}

function updatePDFPreview() {
    const container = document.getElementById('filePreview');
    
    // Remove existing preview content
    const existingContent = container.querySelector('.pdf-content-preview');
    const existingImages = container.querySelector('.pdf-images-preview');
    if (existingContent) existingContent.remove();
    if (existingImages) existingImages.remove();
    
    // Show text preview if available
    if (pdfTextContent) {
        const textDiv = document.createElement('div');
        textDiv.className = 'pdf-content-preview';
        textDiv.style.cssText = 'margin: 8px 0; padding: 8px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; font-size: 11px; max-height: 100px; overflow-y: auto;';
        textDiv.textContent = pdfTextContent.substring(0, 300) + (pdfTextContent.length > 300 ? '...' : '');
        container.appendChild(textDiv);
    }
    
    // Show image thumbnails
    if (pdfImageContents.length > 0) {
        const imagesDiv = document.createElement('div');
        imagesDiv.className = 'pdf-images-preview';
        imagesDiv.style.cssText = 'display: flex; gap: 4px; margin: 8px 0; flex-wrap: wrap;';
        
        pdfImageContents.slice(0, 4).forEach((img, index) => {
            const thumb = document.createElement('img');
            thumb.src = 'data:' + img.type + ';base64,' + img.data;
            thumb.className = 'pdf-image-thumb';
            thumb.style.cssText = 'width: 60px; height: 80px; object-fit: cover; border: 1px solid #dee2e6; border-radius: 4px; cursor: pointer;';
            thumb.title = `Page ${img.page}`;
            thumb.onclick = () => {
                const modal = document.createElement('div');
                modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:1000;cursor:pointer;';
                const largeImg = document.createElement('img');
                largeImg.src = thumb.src;
                largeImg.style.cssText = 'max-width:90%;max-height:90%;border-radius:8px;';
                modal.appendChild(largeImg);
                modal.onclick = () => modal.remove();
                document.body.appendChild(modal);
            };
            imagesDiv.appendChild(thumb);
        });
        
        if (pdfImageContents.length > 4) {
            const moreDiv = document.createElement('div');
            moreDiv.style.cssText = 'display:flex;align-items:center;justify-content:center;width:60px;height:80px;background:#f8f9fa;border:1px solid #dee2e6;border-radius:4px;font-size:10px;color:#666;text-align:center;';
            moreDiv.textContent = `+${pdfImageContents.length - 4} more`;
            imagesDiv.appendChild(moreDiv);
        }
        
        container.appendChild(imagesDiv);
    }
}

// New: SVG processing functions
async function processSVG(file) {
    try {
        const svgText = await file.text();
        
        // Show processing status
        showSVGProcessingStatus('Converting SVG to image...');
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            img.onload = function() {
                // Set canvas size to image dimensions
                canvas.width = img.width || 800;
                canvas.height = img.height || 600;
                
                // Draw the SVG image onto canvas
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                
                // Convert to base64 PNG
                const dataUrl = canvas.toDataURL('image/png');
                svgConvertedBase64 = dataUrl.split(',')[1];
                
                showSVGProcessingStatus('SVG conversion complete!', true);
                resolve({ convertedBase64: svgConvertedBase64 });
            };
            
            img.onerror = function(error) {
                console.error('SVG conversion error:', error);
                showSVGProcessingStatus('Error converting SVG', false, true);
                reject(error);
            };
            
            // Create blob URL for the SVG
            const blob = new Blob([svgText], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            img.src = url;
            
            // Clean up the blob URL after loading
            img.onload = function() {
                URL.revokeObjectURL(url);
                // Set canvas size to image dimensions
                canvas.width = img.width || 800;
                canvas.height = img.height || 600;
                
                // Draw the SVG image onto canvas
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                
                // Convert to base64 PNG
                const dataUrl = canvas.toDataURL('image/png');
                svgConvertedBase64 = dataUrl.split(',')[1];
                
                showSVGProcessingStatus('SVG conversion complete!', true);
                resolve({ convertedBase64: svgConvertedBase64 });
            };
        });
        
    } catch (error) {
        console.error('Error processing SVG:', error);
        showSVGProcessingStatus('Error processing SVG: ' + error.message, false, true);
        throw error;
    }
}

function showSVGProcessingStatus(message, complete = false, error = false) {
    let statusDiv = document.getElementById('svgProcessingStatus');
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'svgProcessingStatus';
        statusDiv.className = 'svg-processing';
        statusDiv.style.cssText = 'margin: 8px 0; padding: 8px 12px; border: 1px solid #dee2e6; border-radius: 6px; font-size: 12px; background: #f8f9fa; color: #495057;';
        document.getElementById('imagePreviewContainer').appendChild(statusDiv);
    }
    
    if (error) {
        statusDiv.style.background = '#f8d7da';
        statusDiv.style.borderColor = '#f5c6cb';
        statusDiv.style.color = '#721c24';
        statusDiv.innerHTML = `❌ ${message}`;
    } else if (complete) {
        statusDiv.style.background = '#d4edda';
        statusDiv.style.borderColor = '#c3e6cb';
        statusDiv.style.color = '#155724';
        statusDiv.innerHTML = `✅ ${message}`;
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.remove();
            }
        }, 3000);
    } else {
        statusDiv.innerHTML = `<div style="display:inline-block;width:16px;height:16px;border:2px solid #f3f3f3;border-top:2px solid #3498db;border-radius:50%;animation:spin 2s linear infinite;margin-right:8px;"></div> ${message}`;
    }
}

                                // New: OpenCV-inspired image processing with configurable resolution
async function processImageWithOpenCV(dataUrl, fileName) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function() {
            try {
                // Get configurable max size from UI
                const maxSize = getImageScalingResolution();
                
                // Validate image size to prevent memory issues
                if (!validateImageSize(img.width, img.height, maxSize)) {
                    reject(new Error(`Image too large for processing. Maximum allowed area: ${maxSize * maxSize} pixels`));
                    return;
                }
                
                let { width, height } = calculateResizeDimensions(img.width, img.height, maxSize);                // Create original canvas
                originalImageCanvas = document.createElement('canvas');
                const originalCtx = originalImageCanvas.getContext('2d', { willReadFrequently: true });
                originalImageCanvas.width = img.width;
                originalImageCanvas.height = img.height;

                // Draw original image at full size first
                originalCtx.drawImage(img, 0, 0);
                  // Apply progressive resizing for better quality if needed
                const reductionRatio = Math.min(width / img.width, height / img.height);
                if (reductionRatio < 0.5) {
                    console.log(`Using progressive resizing: ${img.width}×${img.height} → ${width}×${height} (ratio: ${reductionRatio.toFixed(2)})`);
                    showOpenCVProcessingStatus('Applying progressive resizing for optimal quality...', false);
                    progressiveResize(originalImageCanvas, width, height);
                } else {
                    // Direct resize for smaller reductions
                    console.log(`Using direct resizing: ${img.width}×${img.height} → ${width}×${height} (ratio: ${reductionRatio.toFixed(2)})`);
                    originalImageCanvas.width = width;
                    originalImageCanvas.height = height;
                    originalCtx.drawImage(img, 0, 0, width, height);
                }
                
                originalImageData = originalCtx.getImageData(0, 0, width, height);

                // Create enhanced canvas (start with copy of original)
                enhancedImageCanvas = document.createElement('canvas');
                enhancedImageCanvas.width = width;
                enhancedImageCanvas.height = height;

                // Apply initial auto-enhancement
                applyAutoEnhancement();

                // Update UI
                updateImageComparison(img.width, img.height, fileName);

                // Set the enhanced image as the upload data
                uploadedFileBase64 = enhancedImageCanvas.toDataURL().split(',')[1];

                resolve();
                } catch (error) {
                    reject(error);
                }
            };
            img.onerror = () => reject(new Error('Failed to load image'));
            img.src = dataUrl;
        });
    }    // Calculate resize dimensions maintaining aspect ratio
function calculateResizeDimensions(originalWidth, originalHeight, maxSize) {
    if (originalWidth <= maxSize && originalHeight <= maxSize) {
        console.log(`Image ${originalWidth}×${originalHeight} is within size limit (${maxSize}px), no resizing needed`);
        return { width: originalWidth, height: originalHeight };
    }

    const aspectRatio = originalWidth / originalHeight;

    if (originalWidth > originalHeight) {
        const newDimensions = {
            width: maxSize,
            height: Math.round(maxSize / aspectRatio)
        };
        console.log(`Resizing landscape image: ${originalWidth}×${originalHeight} → ${newDimensions.width}×${newDimensions.height} (max: ${maxSize}px)`);
        return newDimensions;
        } else {
            const newDimensions = {
                width: Math.round(maxSize * aspectRatio),
                height: maxSize
            };
            console.log(`Resizing portrait image: ${originalWidth}×${originalHeight} → ${newDimensions.width}×${newDimensions.height} (max: ${maxSize}px)`);
            return newDimensions;
        }
    }

    // Apply auto-enhancement (OpenCV-inspired algorithms)
function applyAutoEnhancement() {
    if (!originalImageData) return;    const canvas = enhancedImageCanvas;
    const ctx = canvas.getContext('2d', { willReadFrequently: true });

    // Start with original image
    ctx.putImageData(originalImageData, 0, 0);

    // Apply automatic enhancements
    applyHistogramEqualization(ctx, canvas.width, canvas.height);
    applySharpeningFilter(ctx, canvas.width, canvas.height, 0.5);
    applyNoiseReduction(ctx, canvas.width, canvas.height);

    isImageEnhanced = true;
    updateEnhancedImageDisplay();
}

// OpenCV-inspired histogram equalization
function applyHistogramEqualization(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    // Calculate histogram for each channel
    const histR = new Array(256).fill(0);
    const histG = new Array(256).fill(0);
    const histB = new Array(256).fill(0);

    for (let i = 0; i < data.length; i += 4) {
        histR[data[i]]++;
        histG[data[i + 1]]++;
        histB[data[i + 2]]++;
    }

    // Calculate cumulative distribution
    const cdfR = new Array(256);
    const cdfG = new Array(256);
    const cdfB = new Array(256);

    cdfR[0] = histR[0];
    cdfG[0] = histG[0];
    cdfB[0] = histB[0];

    for (let i = 1; i < 256; i++) {
        cdfR[i] = cdfR[i - 1] + histR[i];
        cdfG[i] = cdfG[i - 1] + histG[i];
        cdfB[i] = cdfB[i - 1] + histB[i];
    }

    const totalPixels = width * height;

    // Apply histogram equalization
    for (let i = 0; i < data.length; i += 4) {
        data[i] = Math.round((cdfR[data[i]] / totalPixels) * 255);
        data[i + 1] = Math.round((cdfG[data[i + 1]] / totalPixels) * 255);
        data[i + 2] = Math.round((cdfB[data[i + 2]] / totalPixels) * 255);
    }

    ctx.putImageData(imageData, 0, 0);
}

// Apply sharpening filter (similar to OpenCV unsharp mask)
function applySharpeningFilter(ctx, width, height, strength = 1.0) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const newData = new Uint8ClampedArray(data);

    const kernel = [
    0, -1, 0,
    -1, 5, -1,
    0, -1, 0
    ];

    for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
            const idx = (y * width + x) * 4;

            for (let c = 0; c < 3; c++) {
                let sum = 0;
                for (let ky = -1; ky <= 1; ky++) {
                    for (let kx = -1; kx <= 1; kx++) {
                        const kidx = ((y + ky) * width + (x + kx)) * 4 + c;
                        sum += data[kidx] * kernel[(ky + 1) * 3 + (kx + 1)];
                    }
                }

                newData[idx + c] = Math.max(0, Math.min(255,
                data[idx + c] + (sum - data[idx + c]) * strength
                ));
            }
        }
    }

    for (let i = 0; i < data.length; i++) {
        data[i] = newData[i];
    }

    ctx.putImageData(imageData, 0, 0);
}

// Apply noise reduction (simple bilateral filter approximation)
function applyNoiseReduction(ctx, width, height) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;
    const newData = new Uint8ClampedArray(data);

    const radius = 2;

    for (let y = radius; y < height - radius; y++) {
        for (let x = radius; x < width - radius; x++) {
            const idx = (y * width + x) * 4;

            for (let c = 0; c < 3; c++) {
                let sum = 0;
                let weightSum = 0;

                for (let ky = -radius; ky <= radius; ky++) {
                    for (let kx = -radius; kx <= radius; kx++) {
                        const kidx = ((y + ky) * width + (x + kx)) * 4 + c;
                        const distance = Math.sqrt(kx * kx + ky * ky);
                        const colorDiff = Math.abs(data[idx + c] - data[kidx]);

                        const weight = Math.exp(-(distance * distance) / 8 - (colorDiff * colorDiff) / 800);
                        sum += data[kidx] * weight;
                        weightSum += weight;
                    }
                }

                newData[idx + c] = sum / weightSum;
            }
        }
    }

    for (let i = 0; i < data.length; i++) {
        data[i] = newData[i];
    }

    ctx.putImageData(imageData, 0, 0);
}

// Apply manual adjustments
function adjustImageEnhancement() {
    if (!originalImageData) return;

    const brightness = parseInt(document.getElementById('brightnessSlider').value);
    const contrast = parseFloat(document.getElementById('contrastSlider').value);
    const sharpness = parseFloat(document.getElementById('sharpnessSlider').value);
    const saturation = parseFloat(document.getElementById('saturationSlider').value);

    // Update display values
    document.getElementById('brightnessValue').textContent = brightness;
    document.getElementById('contrastValue').textContent = contrast.toFixed(1);
    document.getElementById('sharpnessValue').textContent = sharpness.toFixed(1);
    document.getElementById('saturationValue').textContent = saturation.toFixed(1);

    const ctx = enhancedImageCanvas.getContext('2d', { willReadFrequently: true });
    ctx.putImageData(originalImageData, 0, 0);

    // Apply adjustments
    applyBrightnessContrast(ctx, enhancedImageCanvas.width, enhancedImageCanvas.height, brightness, contrast);
    if (sharpness > 0) {
        applySharpeningFilter(ctx, enhancedImageCanvas.width, enhancedImageCanvas.height, sharpness);
    }
    applySaturationAdjustment(ctx, enhancedImageCanvas.width, enhancedImageCanvas.height, saturation);

    updateEnhancedImageDisplay();
}

// Apply brightness and contrast
function applyBrightnessContrast(ctx, width, height, brightness, contrast) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        for (let c = 0; c < 3; c++) {
            data[i + c] = Math.max(0, Math.min(255,
            (data[i + c] - 128) * contrast + 128 + brightness
            ));
        }
    }

    ctx.putImageData(imageData, 0, 0);
}

// Apply saturation adjustment
function applySaturationAdjustment(ctx, width, height, saturation) {
    const imageData = ctx.getImageData(0, 0, width, height);
    const data = imageData.data;

    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        const gray = 0.299 * r + 0.587 * g + 0.114 * b;

        data[i] = Math.max(0, Math.min(255, gray + saturation * (r - gray)));
        data[i + 1] = Math.max(0, Math.min(255, gray + saturation * (g - gray)));
        data[i + 2] = Math.max(0, Math.min(255, gray + saturation * (b - gray)));
    }

    ctx.putImageData(imageData, 0, 0);
}

// Apply enhancement presets
function applyPreset(preset) {
    const sliders = {
        brightness: document.getElementById('brightnessSlider'),
        contrast: document.getElementById('contrastSlider'),
        sharpness: document.getElementById('sharpnessSlider'),
        saturation: document.getElementById('saturationSlider')
    };

    const presets = {
        auto: { brightness: 5, contrast: 1.1, sharpness: 0.3, saturation: 1.1 },
        vivid: { brightness: 10, contrast: 1.3, sharpness: 0.8, saturation: 1.4 },
        soft: { brightness: 8, contrast: 0.9, sharpness: 0.1, saturation: 0.9 },
        sharp: { brightness: 0, contrast: 1.2, sharpness: 1.5, saturation: 1.0 },
        vintage: { brightness: -5, contrast: 0.8, sharpness: 0.2, saturation: 0.7 }
    };

    if (presets[preset]) {
        const p = presets[preset];
        sliders.brightness.value = p.brightness;
        sliders.contrast.value = p.contrast;
        sliders.sharpness.value = p.sharpness;
        sliders.saturation.value = p.saturation;
        adjustImageEnhancement();
    }
}

// Reset enhancement
function resetEnhancement() {
    document.getElementById('brightnessSlider').value = 0;
    document.getElementById('contrastSlider').value = 1.0;
    document.getElementById('sharpnessSlider').value = 0;
    document.getElementById('saturationSlider').value = 1.0;
    adjustImageEnhancement();
}

// Toggle auto enhancement
function toggleAutoEnhancement() {
    if (isImageEnhanced) {
        resetEnhancement();
        isImageEnhanced = false;
        document.getElementById('autoEnhanceBtn').textContent = '🚀 Auto Enhance';
        } else {
            applyAutoEnhancement();
            isImageEnhanced = true;
            document.getElementById('autoEnhanceBtn').textContent = '↩️ Reset Auto';
        }
    }

    // Update enhanced image display
function updateEnhancedImageDisplay() {
    uploadedFileBase64 = enhancedImageCanvas.toDataURL().split(',')[1];
    document.getElementById('imagePreview').src = enhancedImageCanvas.toDataURL();
    document.getElementById('enhancedImage').src = enhancedImageCanvas.toDataURL();
}

// Update image comparison display
function updateImageComparison(originalWidth, originalHeight, fileName) {
    document.getElementById('originalImage').src = originalImageCanvas.toDataURL();
    document.getElementById('enhancedImage').src = enhancedImageCanvas.toDataURL();

    const maxSize = getImageScalingResolution();
    document.getElementById('originalImageInfo').textContent =
    `${originalWidth}×${originalHeight} → ${originalImageCanvas.width}×${originalImageCanvas.height}`;
    document.getElementById('enhancedImageInfo').textContent =
    `${originalImageCanvas.width}×${originalImageCanvas.height} (Enhanced @ ${maxSize}px)`;

    document.getElementById('imageComparisonContainer').style.display = 'flex';
}

// Show image in modal
function showImageModal(src) {
    const modal = document.createElement('div');
    modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:1000;cursor:pointer;';
    const largeImg = document.createElement('img');
    largeImg.src = src;
    largeImg.style.cssText = 'max-width:90%;max-height:90%;border-radius:8px;';
    modal.appendChild(largeImg);
    modal.onclick = () => modal.remove();
    document.body.appendChild(modal);
}

// Show OpenCV processing status
function showOpenCVProcessingStatus(message, complete = false, error = false) {
    let statusDiv = document.getElementById('opencvProcessingStatus');
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'opencvProcessingStatus';
        statusDiv.className = 'opencv-processing';
        document.getElementById('imagePreviewContainer').appendChild(statusDiv);
    }

    if (error) {
        statusDiv.style.background = '#f8d7da';
        statusDiv.style.borderColor = '#f5c6cb';
        statusDiv.style.color = '#721c24';
        statusDiv.innerHTML = `❌ ${message}`;
        } else if (complete) {
            statusDiv.style.background = '#d4edda';
            statusDiv.style.borderColor = '#c3e6cb';
            statusDiv.style.color = '#155724';
            statusDiv.innerHTML = `✅ ${message}`;
            setTimeout(() => {
                if (statusDiv.parentNode) {
                    statusDiv.remove();
                }
            }, 3000);
            } else {
                statusDiv.innerHTML = `<div class="spinner inline-style-34" ></div> ${message}`;
            }
        }

        // Modified: Remove any type of file and clear all content including OpenCV data
function removeFile() {
    uploadedFileBase64 = null;
    uploadedFileType = null;
    uploadedFileName = null;
    pdfTextContent = null;
    pdfImageContents = [];
    svgConvertedBase64 = null;
    spreadsheetData = null;
    spreadsheetStats = null;

    // Clear OpenCV enhancement data
    originalImageData = null;
    originalImageCanvas = null;
    enhancedImageCanvas = null;
    isImageEnhanced = false;

    document.getElementById('imageInput').value = '';
    document.getElementById('imagePreview').src = '';
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('pdfPreview').style.display = 'none';
    document.getElementById('svgPreview').style.display = 'none';
    document.getElementById('csvPreview').style.display = 'none';
    document.getElementById('xlsxPreview').style.display = 'none';
    document.getElementById('imageEnhancementPanel').classList.remove('active');
    document.getElementById('imagePreviewContainer').style.display = 'none';    // Explicitly remove detailed previews from the filePreview container
    const filePreviewDiv = document.getElementById('filePreview');
    if (filePreviewDiv) {
        const pdfContentPreview = filePreviewDiv.querySelector('.pdf-content-preview');
        if (pdfContentPreview) pdfContentPreview.remove();

        const pdfImagesPreview = filePreviewDiv.querySelector('.pdf-images-preview');
        if (pdfImagesPreview) pdfImagesPreview.remove();

        const spreadsheetPreview = filePreviewDiv.querySelector('.spreadsheet-preview');
        if (spreadsheetPreview) spreadsheetPreview.remove();
    }
    
    // Clear spreadsheet previews from CSV and Excel preview containers
    const csvPreview = document.getElementById('csvPreview');
    const xlsxPreview = document.getElementById('xlsxPreview');
    const csvTable = csvPreview?.querySelector('.spreadsheet-preview');
    const xlsxTable = xlsxPreview?.querySelector('.spreadsheet-preview');
    if (csvTable) csvTable.remove();
    if (xlsxTable) xlsxTable.remove();

    // Remove processing status divs
    const statusDivs = ['pdfProcessingStatus', 'svgProcessingStatus', 'csvProcessingStatus', 'opencvProcessingStatus'];
    statusDivs.forEach(id => {
        const div = document.getElementById(id);
        if (div) div.remove();
    });
}

// New function to send message with specific model
async function sendMessageWithModel(modelNumber) {
    if (isLoading) return;

    const selectedModel = modelNumber === 1 ? currentModel1 : currentModel2;
    
    if (!selectedModel) {
        showStatus(`Model ${modelNumber} is not activated. Please activate a model first.`, 'error');
        return;
    }

    // Get the message from the input field
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message && !uploadedFileBase64) {
        showStatus('Please enter a message or upload a file.', 'error');
        return;
    }

    // Call the existing sendMessage function with specific model info
                let fileData = null;
                if (uploadedFileBase64) {
                    fileData = {
                        data: uploadedFileBase64,
                        type: uploadedFileType,
                        name: uploadedFileName
                    };

                    // Add spreadsheet stats if available
                    if (spreadsheetStats) {
                        fileData.stats = spreadsheetStats;
                    }
                }

                // For PDFs and spreadsheets, append extracted content to the message for LLM processing
                let finalMessage = message;
                if (pdfTextContent) {
                    finalMessage = `${message}\n\n[PDF Content from "${uploadedFileName}"]\n${pdfTextContent}`;
                    } else if (spreadsheetData) {
                        // Convert spreadsheet data to text format for AI analysis
                        const csvText = convertSpreadsheetToText(spreadsheetData, spreadsheetStats);
                        finalMessage = `${message}\n\n[Spreadsheet Data from "${uploadedFileName}"]\n${csvText}`;                    }                    // Create model info using the active model for this request
                    const activeModelNumber = modelNumber;
                    const activeModelName = selectedModel;
                    let modelInfo = null;
                    if (activeModelNumber && activeModelName) {
                        modelInfo = { number: activeModelNumber, name: activeModelName };
                    }

                    // Add user message with separated file display
                    addMessage(message, true, fileData, modelInfo);

                    // Add user message to memory
                    let userMsg = { role: "user", content: finalMessage };

                    // Handle different file types for vision input and data processing
                    if (pdfImageContents.length > 0) {
                        // PDF handling
                        userMsg.images = pdfImageContents.map(img => img.data);
                        userMsg.files = [{
                            data: uploadedFileBase64,
                            type: uploadedFileType,
                            name: uploadedFileName,
                            pageImages: pdfImageContents
                        }];
                        } else if (svgConvertedBase64) {
                            // SVG handling - use converted PNG for AI processing
                            userMsg.images = [svgConvertedBase64];
                            userMsg.files = [{
                                data: uploadedFileBase64,
                                type: uploadedFileType,
                                name: uploadedFileName,
                                convertedImage: svgConvertedBase64
                            }];
                            } else if (uploadedFileBase64 && uploadedFileType.startsWith('image/')) {
                                // Regular image handling
                                userMsg.images = [uploadedFileBase64];
                                userMsg.files = [{
                                    data: uploadedFileBase64,
                                    type: uploadedFileType,
                                    name: uploadedFileName
                                }];
                                } else if (spreadsheetData) {
                                    // For spreadsheets, store the data and preview for reference
                                    userMsg.files = [{
                                        data: uploadedFileBase64,
                                        type: uploadedFileType,
                                        name: uploadedFileName,
                                        spreadsheetData: spreadsheetData,
                                        spreadsheetStats: spreadsheetStats,
                                        spreadsheetPreview: generateSpreadsheetPreviewHTML()
                                    }];
                                }

                                conversationHistory.push(userMsg);

                                messageInput.value = '';

                                // Clear file after sending
                                removeFile();                // Show loading
                isLoading = true;
                showLoading();
                document.getElementById('model1Btn').disabled = true;
                document.getElementById('model2Btn').disabled = true;
                messageInput.disabled = true;                                // Prepare messages array for API request
                                let messages = [];

                                // Get system prompt from textarea and include if present
                                const systemPromptElement = document.getElementById('systemPrompt');
                                const systemPrompt = systemPromptElement ? systemPromptElement.value.trim() : '';
                                if (systemPrompt) {
                                    messages.push({ role: "system", content: systemPrompt });
                                }// Add conversation history (excluding system messages from history to avoid duplication)
                                const historyMessages = conversationHistory.filter(msg => msg.role !== "system");                                messages = messages.concat(historyMessages.map(msg => {
                                    // Ensure content is always a string
                                    const content = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
                                    
                                    // Include images for user messages - format according to Ollama API
                                    if (msg.role === "user" && msg.images) {
                                        // For Ollama, images should be in the images array as base64 strings
                                        return { 
                                            role: msg.role, 
                                            content: content, 
                                            images: msg.images.map(img => {
                                                // Remove data:image/...;base64, prefix if present
                                                return img.replace(/^data:image\/[^;]+;base64,/, '');
                                            })
                                        };
                                        } else {
                                            return { role: msg.role, content: content };
                                        }
                                    }));// Create new AbortController for this request
                                    currentAbortController = new AbortController();
                                      // Prepare request body
                                    const body = {
                                        model: activeModelName,
                                        messages: messages,
                                        stream: false
                                    };                                    // Debug logging (can be removed in production)
                                    console.log('Sending request to model:', activeModelName);
                                    console.log('Messages count:', messages.length);

                                    // Validate request before sending
                                    if (!activeModelName) {
                                        throw new Error('No model name specified');
                                    }
                                    if (!messages || messages.length === 0) {
                                        throw new Error('No messages to send');
                                    }                                    // Ensure each message has required fields
                                    for (const msg of messages) {
                                        if (!msg.role || !msg.content) {
                                            throw new Error(`Invalid message format: ${JSON.stringify(msg)}`);
                                        }
                                        if (typeof msg.content !== 'string') {
                                            throw new Error(`Message content must be string, got ${typeof msg.content}: ${JSON.stringify(msg.content)}`);
                                        }
                                    }try {
                                        const response = await fetch(`${baseUrl}/api/chat`, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                            },
                                            mode: 'cors',
                                            body: JSON.stringify(body),                                            signal: currentAbortController.signal
                                        });

                                        if (!response.ok) {
                                            // Try to get error details from response body
                                            let errorDetails = '';
                                            try {
                                                const errorData = await response.json();
                                                errorDetails = errorData.error || JSON.stringify(errorData);
                                            } catch (e) {
                                                errorDetails = await response.text();
                                            }
                                            throw new Error(`HTTP ${response.status}: ${response.statusText}. Details: ${errorDetails}`);
                                        }
                                        
                                        const data = await response.json();
                                        hideLoading();
                                        addMessage(data.message?.content || data.response || 'No response received');

                                        conversationHistory.push({
                                            role: "assistant",
                                            content: data.message?.content || data.response || 'No response received'
                                        });
                                        
                                        // Clear abort controller on successful completion
                                        currentAbortController = null;
                                        
                                    } catch (error) {
                                        console.error('Error sending message:', error);
                                        hideLoading();
                                        
                                        // Handle aborted requests differently
                                        if (error.name === 'AbortError') {
                                            console.log('Request was aborted by user');
                                            addMessage('Request cancelled by user - new chat started', false);
                                            // Don't add cancelled requests to conversation history
                                            return; // Exit early for aborted requests
                                        }
                                        
                                        let errorMessage = error.message;
                                        if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {
                                            errorMessage = 'CORS Error: Cannot connect to Ollama server.\n\nWindows PowerShell:\n$env:OLLAMA_ORIGINS="*"; ollama serve\n\nWindows CMD:\nset OLLAMA_ORIGINS=* && ollama serve\n\nOr use the start-ollama.bat file\n\nCheck if Ollama is running on http://127.0.0.1:11434';
                                        }
                                        
                                        addMessage(`Error: ${errorMessage}`, false);
                                        conversationHistory.push({
                                            role: "assistant",
                                            content: `Error: ${errorMessage}`
                                        });
                                        
                                    } finally {
                                        isLoading = false;
                                        currentAbortController = null; // Clear the abort controller
                                        updateModelButtons(); // Re-enable buttons based on active models
                                        messageInput.focus();
                                    }
                                }

// Function to update spreadsheet preview in the UI
function updateSpreadsheetPreview(fileType) {
    if (!spreadsheetData || spreadsheetData.length === 0) return;

    const previewId = fileType === 'csv' ? 'csvPreview' : 'xlsxPreview';
    const previewElement = document.getElementById(previewId);
    
    if (!previewElement) return;

    // Create table container
    let tableContainer = previewElement.querySelector('.spreadsheet-preview');
    if (!tableContainer) {
        tableContainer = document.createElement('div');
        tableContainer.className = 'spreadsheet-preview';
        previewElement.appendChild(tableContainer);
    }

    // Clear existing content
    tableContainer.innerHTML = '';

    // Create stats info
    const statsDiv = document.createElement('div');
    statsDiv.className = 'spreadsheet-stats';
    statsDiv.textContent = `${spreadsheetStats.rows} rows × ${spreadsheetStats.columns} columns`;
    if (spreadsheetStats.sheets > 1) {
        statsDiv.textContent += ` (${spreadsheetStats.sheets} sheets)`;
    }
    tableContainer.appendChild(statsDiv);

    // Create table
    const table = document.createElement('table');
    
    // Determine how many columns and rows to show
    const maxCols = Math.min(6, spreadsheetStats.columns);
    const maxRows = Math.min(5, spreadsheetData.length);

    // Add headers (first row or generated column headers)
    const headerRow = document.createElement('tr');
    const firstRow = spreadsheetData[0] || [];
    const hasHeaders = firstRow.every(cell => typeof cell === 'string' && cell.trim().length > 0);
    
    for (let j = 0; j < maxCols; j++) {
        const th = document.createElement('th');
        if (hasHeaders && firstRow[j]) {
            th.textContent = String(firstRow[j]).substring(0, 15); // Limit header length
        } else {
            th.textContent = String.fromCharCode(65 + j); // A, B, C, etc.
        }
        headerRow.appendChild(th);
    }
    table.appendChild(headerRow);

    // Add data rows
    const startRow = hasHeaders ? 1 : 0;
    for (let i = startRow; i < maxRows && i < spreadsheetData.length; i++) {
        const row = spreadsheetData[i] || [];
        const tr = document.createElement('tr');
        
        for (let j = 0; j < maxCols; j++) {
            const td = document.createElement('td');
            const cellValue = row[j];
            
            if (cellValue !== null && cellValue !== undefined) {
                let displayValue = String(cellValue);
                // Truncate long values
                if (displayValue.length > 20) {
                    displayValue = displayValue.substring(0, 17) + '...';
                }
                td.textContent = displayValue;
            } else {
                td.textContent = '';
            }
            td.title = String(cellValue || ''); // Full value in tooltip
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }

    tableContainer.appendChild(table);

    // Add "more data" indicator if needed
    if (spreadsheetData.length > maxRows || spreadsheetStats.columns > maxCols) {
        const moreInfo = document.createElement('div');
        moreInfo.className = 'spreadsheet-stats';
        moreInfo.style.fontSize = '10px';
        moreInfo.style.fontStyle = 'italic';
        
        let moreText = '';
        if (spreadsheetData.length > maxRows) {
            moreText += `+${spreadsheetData.length - maxRows} more rows`;
        }
        if (spreadsheetStats.columns > maxCols) {
            if (moreText) moreText += ', ';
            moreText += `+${spreadsheetStats.columns - maxCols} more columns`;
        }
        moreInfo.textContent = moreText;
        tableContainer.appendChild(moreInfo);
    }
}

// Helper function to convert spreadsheet data to text
function convertSpreadsheetToText(data, stats) {
    if (!data || data.length === 0) return "Empty spreadsheet";

    let text = `Spreadsheet Summary: ${stats.rows} rows × ${stats.columns} columns`;
    if (stats.sheets > 1) {
        text += ` (${stats.sheets} sheets: ${stats.sheetNames.join(', ')})`;
    }
    text += '\n\n';

    // Add header row
    const maxRows = Math.min(20, data.length); // Limit to 20 rows
    const maxCols = Math.min(10, stats.columns); // Limit to 10 columns

    for (let i = 0; i < maxRows; i++) {
        const row = data[i] || [];
        const rowData = [];
        for (let j = 0; j < maxCols; j++) {
            const cell = row[j];
            rowData.push(cell !== null && cell !== undefined ? String(cell) : '');
        }
        text += rowData.join('\t') + '\n';
    }

    if (data.length > maxRows) {
        text += `\n... (${data.length - maxRows} more rows hidden)\n`;
    }

    return text;
}

// Helper function to generate HTML preview for spreadsheet
function generateSpreadsheetPreviewHTML() {
    if (!spreadsheetData || spreadsheetData.length === 0) return '';

    const container = document.createElement('div');
    container.className = 'spreadsheet-preview';

    // Create table (similar to updateSpreadsheetPreview but return HTML)
    const table = document.createElement('table');
    const firstDataRow = spreadsheetData[0] || [];
    const maxCols = Math.min(6, Math.max(3, firstDataRow.length));

    // Headers
    const headerRow = document.createElement('tr');
    for (let i = 0; i < maxCols; i++) {
        const th = document.createElement('th');
        th.textContent = firstDataRow[i] || String.fromCharCode(65 + i);
        headerRow.appendChild(th);
    }
    table.appendChild(headerRow);

    // Data rows
    const hasHeaders = firstDataRow.every(cell => typeof cell === 'string' && cell.length > 0);
    const startRow = hasHeaders ? 1 : 0;
    const maxRows = Math.min(4, spreadsheetData.length - startRow);

    for (let i = startRow; i < startRow + maxRows && i < spreadsheetData.length; i++) {
        const row = spreadsheetData[i];
        const tr = document.createElement('tr');

        for (let j = 0; j < maxCols; j++) {
            const td = document.createElement('td');
            const cellValue = row[j];
            td.textContent = cellValue !== null && cellValue !== undefined ? String(cellValue) : '';
            tr.appendChild(td);
        }
        table.appendChild(tr);
    }

    container.appendChild(table);
    return container.outerHTML;
}

// Get current image scaling resolution from UI
function getImageScalingResolution() {
    const select = document.getElementById('imageScalingSelect');
    const customInput = document.getElementById('customImageSize');
    
    if (select.value === 'custom') {
        const customSize = parseInt(customInput.value);
        return (customSize && customSize >= 512 && customSize <= 8192) ? customSize : 1920;
    }
    
    return parseInt(select.value) || 3508;
}

// Validate image size to prevent memory issues
function validateImageSize(width, height, maxSize) {
    const maxPixels = maxSize * maxSize;
    const imagePixels = width * height;
    
    // Allow images up to maxSize^2 pixels
    return imagePixels <= maxPixels;
}

// Handle image scaling resolution change
function handleImageScalingChange() {
    const select = document.getElementById('imageScalingSelect');
    const customInput = document.getElementById('customImageSize');
    
    if (select.value === 'custom') {
        customInput.style.display = 'inline-block';
        customInput.focus();
    } else {
        customInput.style.display = 'none';
    }
}

// Progressive resize for very large images (reduces in steps for better quality)
function progressiveResize(sourceCanvas, targetWidth, targetHeight) {
    const sourceCtx = sourceCanvas.getContext('2d', { willReadFrequently: true });
    let currentWidth = sourceCanvas.width;
    let currentHeight = sourceCanvas.height;
    
    // If reduction is more than 50%, resize progressively
    while (currentWidth > targetWidth * 2 || currentHeight > targetHeight * 2) {
        currentWidth = Math.max(targetWidth, Math.floor(currentWidth * 0.7));
        currentHeight = Math.max(targetHeight, Math.floor(currentHeight * 0.7));
        
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
        tempCanvas.width = currentWidth;
        tempCanvas.height = currentHeight;
        
        tempCtx.drawImage(sourceCanvas, 0, 0, currentWidth, currentHeight);
        
        // Copy back to source canvas
        sourceCanvas.width = currentWidth;
        sourceCanvas.height = currentHeight;
        sourceCtx.drawImage(tempCanvas, 0, 0);
    }
    
    // Final resize to exact target dimensions
    if (currentWidth !== targetWidth || currentHeight !== targetHeight) {
        const tempCanvas = document.createElement('canvas');
        const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
        tempCanvas.width = targetWidth;
        tempCanvas.height = targetHeight;
        
        tempCtx.drawImage(sourceCanvas, 0, 0, targetWidth, targetHeight);
        
        sourceCanvas.width = targetWidth;
        sourceCanvas.height = targetHeight;
        sourceCtx.drawImage(tempCanvas, 0, 0);
    }
}

// New: PDF processing functions
async function processPDF(file) {
    try {
        const arrayBuffer = await file.arrayBuffer();
        const pdf = await pdfjsLib.getDocument(arrayBuffer).promise;
        
        const extractedImages = [];
        let extractedText = '';
        
        // Show processing status
        showPDFProcessingStatus('Processing PDF pages...');
        
        // Process each page - extract both text and convert to images
        for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            const page = await pdf.getPage(pageNum);
            
            // Extract text content
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map(item => item.str).join(' ');
            if (pageText.trim()) {
                extractedText += `\n--- Page ${pageNum} ---\n${pageText.trim()}\n`;
            }
            
            // Convert page to image
            const viewport = page.getViewport({ scale: 1.5 });
            const canvas = document.createElement('canvas');
            const context = canvas.getContext('2d');
            canvas.height = viewport.height;
            canvas.width = viewport.width;
            
            await page.render({
                canvasContext: context,
                viewport: viewport
            }).promise;
            
            // Convert canvas to base64
            const imageDataUrl = canvas.toDataURL('image/png');
            const base64Data = imageDataUrl.split(',')[1];
            
            extractedImages.push({
                page: pageNum,
                data: base64Data,
                type: 'image/png'
            });
            
            // Update progress
            showPDFProcessingStatus(`Processed page ${pageNum}/${pdf.numPages}...`);
        }
        
        pdfTextContent = extractedText.trim() || null;
        pdfImageContents = extractedImages;
        
        showPDFProcessingStatus('PDF processing complete!', true);
        updatePDFPreview();
        
        return { text: pdfTextContent, images: pdfImageContents };
        
    } catch (error) {
        console.error('Error processing PDF:', error);
        showPDFProcessingStatus('Error processing PDF: ' + error.message, false, true);
        throw error;
    }
}

function showPDFProcessingStatus(message, complete = false, error = false) {
    let statusDiv = document.getElementById('pdfProcessingStatus');
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'pdfProcessingStatus';
        statusDiv.className = 'pdf-processing';
        statusDiv.style.cssText = 'margin: 8px 0; padding: 8px 12px; border: 1px solid #dee2e6; border-radius: 6px; font-size: 12px; background: #f8f9fa; color: #495057;';
        document.getElementById('imagePreviewContainer').appendChild(statusDiv);
    }
    
    if (error) {
        statusDiv.style.background = '#f8d7da';
        statusDiv.style.borderColor = '#f5c6cb';
        statusDiv.style.color = '#721c24';
        statusDiv.innerHTML = `❌ ${message}`;
    } else if (complete) {
        statusDiv.style.background = '#d4edda';
        statusDiv.style.borderColor = '#c3e6cb';
        statusDiv.style.color = '#155724';
        statusDiv.innerHTML = `✅ ${message}`;
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.remove();
            }
        }, 3000);
    } else {
        statusDiv.innerHTML = `<div style="display:inline-block;width:16px;height:16px;border:2px solid #f3f3f3;border-top:2px solid #3498db;border-radius:50%;animation:spin 2s linear infinite;margin-right:8px;"></div> ${message}`;
    }
}

function updatePDFPreview() {
    const container = document.getElementById('filePreview');
    
    // Remove existing preview content
    const existingContent = container.querySelector('.pdf-content-preview');
    const existingImages = container.querySelector('.pdf-images-preview');
    if (existingContent) existingContent.remove();
    if (existingImages) existingImages.remove();
    
    // Show text preview if available
    if (pdfTextContent) {
        const textDiv = document.createElement('div');
        textDiv.className = 'pdf-content-preview';
        textDiv.style.cssText = 'margin: 8px 0; padding: 8px; background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 4px; font-size: 11px; max-height: 100px; overflow-y: auto;';
        textDiv.textContent = pdfTextContent.substring(0, 300) + (pdfTextContent.length > 300 ? '...' : '');
        container.appendChild(textDiv);
    }
    
    // Show image thumbnails
    if (pdfImageContents.length > 0) {
        const imagesDiv = document.createElement('div');
        imagesDiv.className = 'pdf-images-preview';
        imagesDiv.style.cssText = 'display: flex; gap: 4px; margin: 8px 0; flex-wrap: wrap;';
        
        pdfImageContents.slice(0, 4).forEach((img, index) => {
            const thumb = document.createElement('img');
            thumb.src = 'data:' + img.type + ';base64,' + img.data;
            thumb.className = 'pdf-image-thumb';
            thumb.style.cssText = 'width: 60px; height: 80px; object-fit: cover; border: 1px solid #dee2e6; border-radius: 4px; cursor: pointer;';
            thumb.title = `Page ${img.page}`;
            thumb.onclick = () => {
                const modal = document.createElement('div');
                modal.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(0,0,0,0.8);display:flex;align-items:center;justify-content:center;z-index:1000;cursor:pointer;';
                const largeImg = document.createElement('img');
                largeImg.src = thumb.src;
                largeImg.style.cssText = 'max-width:90%;max-height:90%;border-radius:8px;';
                modal.appendChild(largeImg);
                modal.onclick = () => modal.remove();
                document.body.appendChild(modal);
            };
            imagesDiv.appendChild(thumb);
        });
        
        if (pdfImageContents.length > 4) {
            const moreDiv = document.createElement('div');
            moreDiv.style.cssText = 'display:flex;align-items:center;justify-content:center;width:60px;height:80px;background:#f8f9fa;border:1px solid #dee2e6;border-radius:4px;font-size:10px;color:#666;text-align:center;';
            moreDiv.textContent = `+${pdfImageContents.length - 4} more`;
            imagesDiv.appendChild(moreDiv);
        }
        
        container.appendChild(imagesDiv);
    }
}

// New: SVG processing functions
async function processSVG(file) {
    try {
        const svgText = await file.text();
        
        // Show processing status
        showSVGProcessingStatus('Converting SVG to image...');
        
        return new Promise((resolve, reject) => {
            const img = new Image();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            
            img.onload = function() {
                // Set canvas size to image dimensions
                canvas.width = img.width || 800;
                canvas.height = img.height || 600;
                
                // Draw the SVG image onto canvas
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                
                // Convert to base64 PNG
                const dataUrl = canvas.toDataURL('image/png');
                svgConvertedBase64 = dataUrl.split(',')[1];
                
                showSVGProcessingStatus('SVG conversion complete!', true);
                resolve({ convertedBase64: svgConvertedBase64 });
            };
            
            img.onerror = function(error) {
                console.error('SVG conversion error:', error);
                showSVGProcessingStatus('Error converting SVG', false, true);
                reject(error);
            };
            
            // Create blob URL for the SVG
            const blob = new Blob([svgText], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            img.src = url;
            
            // Clean up the blob URL after loading
            img.onload = function() {
                URL.revokeObjectURL(url);
                // Set canvas size to image dimensions
                canvas.width = img.width || 800;
                canvas.height = img.height || 600;
                
                // Draw the SVG image onto canvas
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                
                // Convert to base64 PNG
                const dataUrl = canvas.toDataURL('image/png');
                svgConvertedBase64 = dataUrl.split(',')[1];
                
                showSVGProcessingStatus('SVG conversion complete!', true);
                resolve({ convertedBase64: svgConvertedBase64 });
            };
        });
        
    } catch (error) {
        console.error('Error processing SVG:', error);
        showSVGProcessingStatus('Error processing SVG: ' + error.message, false, true);
        throw error;
    }
}

function showSVGProcessingStatus(message, complete = false, error = false) {
    let statusDiv = document.getElementById('svgProcessingStatus');
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'svgProcessingStatus';
        statusDiv.className = 'svg-processing';
        statusDiv.style.cssText = 'margin: 8px 0; padding: 8px 12px; border: 1px solid #dee2e6; border-radius: 6px; font-size: 12px; background: #f8f9fa; color: #495057;';
        document.getElementById('imagePreviewContainer').appendChild(statusDiv);
    }
    
    if (error) {
        statusDiv.style.background = '#f8d7da';
        statusDiv.style.borderColor = '#f5c6cb';
        statusDiv.style.color = '#721c24';
        statusDiv.innerHTML = `❌ ${message}`;
    } else if (complete) {
        statusDiv.style.background = '#d4edda';
        statusDiv.style.borderColor = '#c3e6cb';
        statusDiv.style.color = '#155724';
        statusDiv.innerHTML = `✅ ${message}`;
        setTimeout(() => {
            if (statusDiv.parentNode) {
                statusDiv.remove();
            }
        }, 3000);
    } else {
        statusDiv.innerHTML = `<div style="display:inline-block;width:16px;height:16px;border:2px solid #f3f3f3;border-top:2px solid #3498db;border-radius:50%;animation:spin 2s linear infinite;margin-right:8px;"></div> ${message}`;
    }
}

