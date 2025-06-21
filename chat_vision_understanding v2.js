/* Generated JavaScript file from monolithic HTML */
/* Original inline scripts and event handlers */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Separated JavaScript components loaded successfully');
});

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js';

// Configure MathJax - Updated configuration
window.MathJax = {
    tex: {
        inlineMath: [['$', '$'], ['\\(', '\\)']],
        displayMath: [['$$', '$$'], ['\\[', '\\]']],
        processEscapes: true,
        processEnvironments: true,
        packages: {'[+]': ['ams', 'newcommand', 'configmacros']}
    },
    options: {
        skipHtmlTags: ['script', 'noscript', 'style', 'textarea', 'pre'],
        ignoreHtmlClass: 'tex2jax_ignore',
        processHtmlClass: 'tex2jax_process'
    },
    startup: {
        ready: () => {
            console.log('MathJax is loaded and ready');
            MathJax.startup.defaultReady();
        }
    }
};

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

// Modified: Start new chat (clear history and dynamic UI messages only)
function startNewChat() {
    conversationHistory = []; // Empty history, no welcome message
    currentSystemPrompt = null; // Reset system prompt tracking
    const messagesContainer = document.getElementById('messages');

    // Remove all messages except the static welcome message
    const messages = messagesContainer.querySelectorAll('.message:not(#staticWelcomeMessage)');
    messages.forEach(message => message.remove());

    removeFile(); // Updated function name
    document.getElementById('messageInput').value = '';
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
        btn = event.target;
        originalText = btn.textContent;
        btn.textContent = '🔍 Detecting...';
        btn.disabled = true;
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
                });

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
                                } else {
                                    try {
                                        // Pre-process content to fix common equation formats
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

                                        contentDiv.innerHTML = marked.parse(processedContent);

                                        // Add copy buttons to code blocks
                                        contentDiv.querySelectorAll('pre code').forEach((block, index) => {
                                            const pre = block.parentElement;
                                            const language = block.className.match(/language-(\w+)/);
                                            const langName = language ? language[1] : 'text';

                                            // Create header with language and copy button
                                            const header = document.createElement('div');
                                            header.className = 'code-header';
                                            header.innerHTML = `
                                            <span>${langName}</span>
                                            <button class="copy-btn" onclick="copyCode(this)">Copy</button>
                                            `;

                                            // Insert header before pre
                                            pre.parentNode.insertBefore(header, pre);
                                            pre.style.borderRadius = '0 0 8px 8px';
                                            pre.style.marginTop = '0';

                                            // Store code content for copying
                                            header.querySelector('.copy-btn').dataset.code = block.textContent;
                                        });

                                        // Process math equations with proper error handling
                                        if (window.MathJax && window.MathJax.typesetPromise) {
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
                                                } else {
                                                    // If MathJax is not ready, try again after a delay
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

function showLoading() {
    const messagesContainer = document.getElementById('messages');
    const loadingDiv = document.createElement('div');
    loadingDiv.className = 'message assistant';
    loadingDiv.id = 'loadingMessage';

    const contentDiv = document.createElement('div');
    contentDiv.className = 'message-content loading';
    contentDiv.innerHTML = '<div class="spinner"></div> Thinking...';

    loadingDiv.appendChild(contentDiv);
    messagesContainer.appendChild(loadingDiv);
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

function hideLoading() {
    const loadingMessage = document.getElementById('loadingMessage');
    if (loadingMessage) {
        loadingMessage.remove();
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
        textDiv.textContent = pdfTextContent.substring(0, 300) + (pdfTextContent.length > 300 ? '...' : '');
        container.appendChild(textDiv);
    }

    // Show image thumbnails
    if (pdfImageContents.length > 0) {
        const imagesDiv = document.createElement('div');
        imagesDiv.className = 'pdf-images-preview';

        pdfImageContents.slice(0, 4).forEach((img, index) => {
            const thumb = document.createElement('img');
            thumb.src = 'data:' + img.type + ';base64,' + img.data;
            thumb.className = 'pdf-image-thumb';
            thumb.title = `Page ${img.page}`;
            imagesDiv.appendChild(thumb);
        });

        if (pdfImageContents.length > 4) {
            const moreDiv = document.createElement('div');
            moreDiv.style.cssText = 'display:flex;align-items:center;justify-content:center;width:80px;height:60px;background:#f8f9fa;border:1px solid #dee2e6;border-radius:4px;font-size:10px;color:#666;';
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
        statusDiv.className = 'pdf-processing';
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

        // New: CSV processing functions
async function processCSV(file) {
    try {
        showCSVProcessingStatus('Processing CSV file...');

        const text = await file.text();
        const workbook = XLSX.read(text, { type: 'string' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

        // Calculate statistics
        const stats = {
            rows: jsonData.length,
            columns: jsonData.length > 0 ? Math.max(...jsonData.map(row => row.length)) : 0,
            nonEmptyRows: jsonData.filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== '')).length
        };

        spreadsheetData = jsonData;
        spreadsheetStats = stats;

        showCSVProcessingStatus('CSV processing complete!', true);
        updateSpreadsheetPreview();

        return { data: jsonData, stats: stats };

        } catch (error) {
            console.error('Error processing CSV:', error);
            showCSVProcessingStatus('Error processing CSV: ' + error.message, false, true);
            throw error;
        }
    }

    // New: Excel processing functions
async function processExcel(file) {
    try {
        showCSVProcessingStatus('Processing Excel file...');

        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(arrayBuffer, { type: 'array' });

        // Process all sheets
        const allSheetsData = {};
        let totalRows = 0;
        let maxColumns = 0;

        workbook.SheetNames.forEach(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            allSheetsData[sheetName] = jsonData;
            totalRows += jsonData.length;
            if (jsonData.length > 0) {
                maxColumns = Math.max(maxColumns, Math.max(...jsonData.map(row => row.length)));
            }
        });

        // Use first sheet as primary data
        const firstSheetName = workbook.SheetNames[0];
        const primaryData = allSheetsData[firstSheetName] || [];

        const stats = {
            sheets: workbook.SheetNames.length,
            rows: primaryData.length,
            columns: maxColumns,
            totalRows: totalRows,
            nonEmptyRows: primaryData.filter(row => row.some(cell => cell !== null && cell !== undefined && cell !== '')).length,
            sheetNames: workbook.SheetNames
        };

        spreadsheetData = primaryData;
        spreadsheetStats = stats;

        showCSVProcessingStatus('Excel processing complete!', true);
        updateSpreadsheetPreview();

        return { data: allSheetsData, primaryData: primaryData, stats: stats };

        } catch (error) {
            console.error('Error processing Excel:', error);
            showCSVProcessingStatus('Error processing Excel: ' + error.message, false, true);
            throw error;
        }
    }

function showCSVProcessingStatus(message, complete = false, error = false) {
    let statusDiv = document.getElementById('csvProcessingStatus');
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'csvProcessingStatus';
        statusDiv.className = 'csv-processing';
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

function updateSpreadsheetPreview() {
    const container = document.getElementById('filePreview');

    // Remove existing preview content
    const existingPreview = container.querySelector('.spreadsheet-preview');
    if (existingPreview) existingPreview.remove();

    if (spreadsheetData && spreadsheetData.length > 0) {
        const previewDiv = document.createElement('div');
        previewDiv.className = 'spreadsheet-preview';

        // Create table
        const table = document.createElement('table');

        // Add headers (first row or A, B, C... if no headers)
        const headerRow = document.createElement('tr');
        const firstDataRow = spreadsheetData[0] || [];
        const maxCols = Math.min(10, Math.max(5, firstDataRow.length)); // Show max 10 columns

        for (let i = 0; i < maxCols; i++) {
            const th = document.createElement('th');
            th.textContent = firstDataRow[i] || String.fromCharCode(65 + i); // A, B, C... if empty
            headerRow.appendChild(th);
        }
        table.appendChild(headerRow);

        // Add data rows (skip first row if it looks like headers, otherwise include it)
        const hasHeaders = firstDataRow.every(cell => typeof cell === 'string' && cell.length > 0);
        const startRow = hasHeaders ? 1 : 0;
        const maxRows = Math.min(8, spreadsheetData.length - startRow); // Show max 8 data rows

        for (let i = startRow; i < startRow + maxRows && i < spreadsheetData.length; i++) {
            const row = spreadsheetData[i];
            const tr = document.createElement('tr');

            for (let j = 0; j < maxCols; j++) {
                const td = document.createElement('td');
                const cellValue = row[j];
                td.textContent = cellValue !== null && cellValue !== undefined ? String(cellValue) : '';
                td.title = td.textContent; // Tooltip for truncated content
                tr.appendChild(td);
            }
            table.appendChild(tr);
        }

        previewDiv.appendChild(table);

        // Add statistics
        const statsDiv = document.createElement('div');
        statsDiv.className = 'spreadsheet-stats';
        let statsText = `${spreadsheetStats.rows} rows × ${spreadsheetStats.columns} columns`;
        if (spreadsheetStats.sheets > 1) {
            statsText += ` • ${spreadsheetStats.sheets} sheets: ${spreadsheetStats.sheetNames.join(', ')}`;
        }
        statsDiv.textContent = statsText;
        previewDiv.appendChild(statsDiv);

        container.appendChild(previewDiv);
    }
}

// Modified: Handle image, PDF, SVG, CSV, and Excel uploads
async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    uploadedFileName = file.name;
    uploadedFileType = file.type;

    // Reset all preview states
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('pdfPreview').style.display = 'none';
    document.getElementById('svgPreview').style.display = 'none';
    document.getElementById('csvPreview').style.display = 'none';
    document.getElementById('xlsxPreview').style.display = 'none';
    document.getElementById('imageEnhancementPanel').classList.remove('active');

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
                    }
                    } else if (file.type === 'text/csv' || file.name.toLowerCase().endsWith('.csv')) {
                        uploadedFileType = 'text/csv';
                        document.getElementById('csvFileName').textContent = file.name;
                        document.getElementById('csvPreview').style.display = 'block';
                        document.getElementById('imagePreviewContainer').style.display = 'flex';

                        try {
                            await processCSV(file);
                            const reader = new FileReader();
                            reader.onload = function(e) {
                                uploadedFileBase64 = e.target.result.split(',')[1];
                            };
                            reader.readAsDataURL(file);
                            } catch (error) {
                                console.error('CSV processing failed:', error);
                            }
                        } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
                        file.type === 'application/vnd.ms-excel' ||
                        file.name.toLowerCase().endsWith('.xlsx') ||
                        file.name.toLowerCase().endsWith('.xls')) {
                            uploadedFileType = file.type || 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
                            document.getElementById('xlsxFileName').textContent = file.name;
                            document.getElementById('xlsxPreview').style.display = 'block';
                            document.getElementById('imagePreviewContainer').style.display = 'flex';

                            try {
                                await processExcel(file);
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
                                }                                // New: OpenCV-inspired image processing with configurable resolution
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
    document.getElementById('imagePreviewContainer').style.display = 'none';

    // Explicitly remove detailed previews from the filePreview container
    const filePreviewDiv = document.getElementById('filePreview');
    if (filePreviewDiv) {
        const pdfContentPreview = filePreviewDiv.querySelector('.pdf-content-preview');
        if (pdfContentPreview) pdfContentPreview.remove();

        const pdfImagesPreview = filePreviewDiv.querySelector('.pdf-images-preview');
        if (pdfImagesPreview) pdfImagesPreview.remove();

        const spreadsheetPreview = filePreviewDiv.querySelector('.spreadsheet-preview');
        if (spreadsheetPreview) spreadsheetPreview.remove();
    }

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

    // Call the existing sendMessage function with specific model info
    await sendMessage(modelNumber, selectedModel);
}

// Modified: Updated message sending to exclude static welcome from backend
async function sendMessage(specificModelNumber = null, specificModelName = null) {
    if (isLoading) return;

    let activeModelName = null;
    let activeModelNumber = null;
    
    // If specific model is provided, use it
    if (specificModelNumber && specificModelName) {
        activeModelName = specificModelName;
        activeModelNumber = specificModelNumber;
    } else {
        // Otherwise, use the first available model
        if (currentModel1) {
            activeModelName = currentModel1;
            activeModelNumber = 1;
        } else if (currentModel2) {
            activeModelName = currentModel2;
            activeModelNumber = 2;
        }
    }

    if (!activeModelName) {
        showStatus('No active model. Please activate a model to send a message.', 'error');
        return;
    }

        const messageInput = document.getElementById('messageInput');
        const message = messageInput.value.trim();

        if (!message && !uploadedFileBase64 && !pdfImageContents.length && !svgConvertedBase64 && !spreadsheetData) return;

        // Get system prompt and check if it changed
        const systemPrompt = document.getElementById('systemPrompt').value.trim();
        const systemPromptChanged = currentSystemPrompt !== systemPrompt;

        // If system prompt changed, we need to restart the conversation context
        if (systemPromptChanged && systemPrompt) {
            currentSystemPrompt = systemPrompt;
            // Add system message to history if it's the first time or changed
            if (conversationHistory.length === 0) {
                // Insert system prompt at the beginning of conversation
                conversationHistory.unshift({
                    role: "system",
                    content: systemPrompt
                });
                } else {
                    // For existing conversations, we'll include it in the request but not permanently store it
                    // to avoid duplicating system messages
                }
                } else if (systemPromptChanged && !systemPrompt) {
                    // System prompt was cleared
                    currentSystemPrompt = null;
                    // Remove system message from history if it exists
                    if (conversationHistory.length > 0 && conversationHistory[0].role === "system") {
                        conversationHistory.shift();
                    }
                }

                // Prepare file data for display
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
                        finalMessage = `${message}\n\n[Spreadsheet Data from "${uploadedFileName}"]\n${csvText}`;
                    }                    // Create model info using the active model for this request
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
                messageInput.disabled = true;

                                // Prepare messages array for API request
                                let messages = [];

                                // Always include current system prompt if present
                                if (systemPrompt) {
                                    messages.push({ role: "system", content: systemPrompt });
                                }

                                // Add conversation history (excluding system messages from history to avoid duplication)
                                const historyMessages = conversationHistory.filter(msg => msg.role !== "system");
                                messages = messages.concat(historyMessages.map(msg => {
                                    // Include images for user messages (both regular images and PDF pages)
                                    if (msg.role === "user" && msg.images) {
                                        return { role: msg.role, content: msg.content, images: msg.images };
                                        } else {
                                            return { role: msg.role, content: msg.content };
                                        }
                                    }));

                                    // Prepare request body
                                    const body = {
                                        model: activeModelName,
                                        messages: messages,
                                        stream: false
                                    };

                                    try {
                                        const response = await fetch(`${baseUrl}/api/chat`, {
                                            method: 'POST',
                                            headers: {
                                                'Content-Type': 'application/json',
                                            },
                                            mode: 'cors',
                                            body: JSON.stringify(body)
                                        });

                                        if (!response.ok) {
                                            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                                        }

                                        const data = await response.json();
                                        hideLoading();
                                        addMessage(data.message?.content || data.response || 'No response received');

                                        conversationHistory.push({
                                            role: "assistant",
                                            content: data.message?.content || data.response || 'No response received'
                                        });

                                        } catch (error) {
                                            console.error('Error sending message:', error);
                                            hideLoading();
                                            let errorMessage = error.message;
                                            if (error.message.includes('Failed to fetch') || error.name === 'TypeError') {

                                                errorMessage = 'CORS Error: Cannot connect to Ollama server.\n\nWindows PowerShell:\n$env:OLLAMA_ORIGINS="*"; ollama serve\n\nWindows CMD:\nset OLLAMA_ORIGINS=* && ollama serve\n\nOr use the start-ollama.bat file\n\nCheck if Ollama is running on http://127.0.0.1:11434';
                                            }

                                            addMessage(`Error: ${errorMessage}`, false);
                                            conversationHistory.push({
                                                role: "assistant",
                                                content: `Error: ${errorMessage}`
                                            });                            } finally {
                                isLoading = false;
                                updateModelButtons(); // Re-enable buttons based on active models
                                messageInput.focus();
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

// Auto-resize textarea
document.getElementById('messageInput').addEventListener('input', function() {
    this.style.height = 'auto';
    this.style.height = Math.min(this.scrollHeight, 120) + 'px';
});

// Enable activate button when model is selected
document.getElementById('modelSelect').addEventListener('change', updateActivateButtons);
document.getElementById('modelSelect2').addEventListener('change', updateActivateButtons);

// Auto-detect models on page load
window.addEventListener('load', () => {
    setTimeout(async () => {
        await detectModels(); // This will also call updateActiveModelsDisplay in its finally block
    }, 1000);
    updateActiveModelsDisplay(); // Initial call to set "None, None" before detection
    updateModelButtons(); // Initialize model button states
});

function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        // Send to first available model, prioritizing Model 1
        if (currentModel1) {
            sendMessageWithModel(1);
        } else if (currentModel2) {
            sendMessageWithModel(2);
        }
    }
}


function eventHandler3(event) {
    activateModel(1);
}


function eventHandler4(event) {
    activateModel(2);
}


function eventHandler5(event) {
    handleFileUpload(event);
}


function eventHandler6(event) {
    document.getElementById('imageInput').click();
}


function eventHandler7(event) {
    handleKeyDown(event);
}


function eventHandler15(event) {
    applyPreset('auto');
}


function eventHandler16(event) {
    applyPreset('vivid');
}


function eventHandler17(event) {
    applyPreset('soft');
}


function eventHandler18(event) {
    applyPreset('sharp');
}


function eventHandler19(event) {
    applyPreset('vintage');
}


function eventHandler21(event) {
    showImageModal(this.src);
}


function eventHandler22(event) {
    showImageModal(this.src);
}

