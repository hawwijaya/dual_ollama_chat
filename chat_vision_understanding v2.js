/* Generated JavaScript file from monolithic HTML */
/* Original inline scripts and event handlers */

document.addEventListener('DOMContentLoaded', function() {
    console.log('Separated JavaScript components loaded successfully');
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

// File processing functions
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
        document.getElementById('imagePreviewContainer').style.display = 'block';

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
        document.getElementById('imagePreviewContainer').style.display = 'block';

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
        document.getElementById('imagePreviewContainer').style.display = 'block';

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
        }
    } else if (file.type === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
               file.type === 'application/vnd.ms-excel' ||
               file.name.toLowerCase().endsWith('.xlsx') ||
               file.name.toLowerCase().endsWith('.xls')) {
        uploadedFileType = file.type;
        document.getElementById('xlsxFileName').textContent = file.name;
        document.getElementById('xlsxPreview').style.display = 'block';
        document.getElementById('imagePreviewContainer').style.display = 'block';

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
        const img = document.getElementById('imagePreview');
        const reader = new FileReader();
        
        reader.onload = async function(e) {
            try {
                // Process image with OpenCV-inspired enhancements
                await processImageWithOpenCV(e.target.result, file.name);
                document.getElementById('imagePreviewContainer').style.display = 'block';
            } catch (error) {
                console.error('Image processing failed:', error);
                // Fallback to simple display
                img.src = e.target.result;
                img.style.display = 'block';
                document.getElementById('imagePreviewContainer').style.display = 'block';
                uploadedFileBase64 = e.target.result.split(',')[1];
            }
        };
        
        reader.readAsDataURL(file);
    }
}

async function processPDF(file) {
    return new Promise(async (resolve, reject) => {
        try {
            showPDFProcessingStatus('Loading PDF...');
            
            const arrayBuffer = await file.arrayBuffer();
            const loadingTask = pdfjsLib.getDocument(arrayBuffer);
            const pdf = await loadingTask.promise;
            
            showPDFProcessingStatus(`Processing ${pdf.numPages} pages...`);
            
            pdfTextContent = '';
            pdfImageContents = [];
            
            // Extract text and images from all pages
            for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
                const page = await pdf.getPage(pageNum);
                
                // Extract text
                const textContent = await page.getTextContent();
                const pageText = textContent.items.map(item => item.str).join(' ');
                pdfTextContent += `\n--- Page ${pageNum} ---\n${pageText}\n`;
                
                // Render page as image
                const viewport = page.getViewport({ scale: 1.5 });
                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;
                
                await page.render({
                    canvasContext: context,
                    viewport: viewport
                }).promise;
                
                const imageDataUrl = canvas.toDataURL('image/png');
                pdfImageContents.push({
                    page: pageNum,
                    image: imageDataUrl.split(',')[1]
                });
            }
            
            showPDFProcessingStatus('PDF processing complete!', true);
            updatePDFPreview();
            resolve({ textContent: pdfTextContent, imageContents: pdfImageContents });
            
        } catch (error) {
            console.error('Error processing PDF:', error);
            showPDFProcessingStatus('Error processing PDF: ' + error.message, false, true);
            reject(error);
        }
    });
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
    if (!pdfTextContent && !pdfImageContents.length) return;
    
    const filePreview = document.getElementById('filePreview');
    let pdfContentPreview = filePreview.querySelector('.pdf-content-preview');
    
    if (!pdfContentPreview) {
        pdfContentPreview = document.createElement('div');
        pdfContentPreview.className = 'pdf-content-preview';
        filePreview.appendChild(pdfContentPreview);
    }
    
    let previewHTML = '';
    
    if (pdfTextContent) {
        const preview = pdfTextContent.substring(0, 500);
        previewHTML += `<div style="font-size: 11px; max-height: 100px; overflow-y: auto; background: #f8f9fa; padding: 8px; border-radius: 4px; margin: 4px 0;"><strong>Text Content Preview:</strong><br>${preview}${pdfTextContent.length > 500 ? '...' : ''}</div>`;
    }
    
    if (pdfImageContents.length > 0) {
        previewHTML += `<div style="font-size: 11px; color: #666; margin: 4px 0;">📄 ${pdfImageContents.length} page(s) rendered as images</div>`;
    }
    
    pdfContentPreview.innerHTML = previewHTML;
}

async function processSVG(file) {
    return new Promise(async (resolve, reject) => {
        try {
            showSVGProcessingStatus('Converting SVG to PNG...');
            
            const text = await file.text();
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new Image();
            
            img.onerror = function() {
                console.error('SVG conversion error');
                showSVGProcessingStatus('Error converting SVG', false, true);
                reject(new Error('SVG conversion failed'));
            };
            
            const blob = new Blob([text], { type: 'image/svg+xml' });
            const url = URL.createObjectURL(blob);
            
            img.onload = function() {
                URL.revokeObjectURL(url);
                canvas.width = img.width || 800;
                canvas.height = img.height || 600;
                
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0);
                
                const dataUrl = canvas.toDataURL('image/png');
                svgConvertedBase64 = dataUrl.split(',')[1];
                
                showSVGProcessingStatus('SVG conversion complete!', true);
                resolve({ convertedBase64: svgConvertedBase64 });
            };
            
            img.src = url;
            
        } catch (error) {
            console.error('Error processing SVG:', error);
            showSVGProcessingStatus('Error processing SVG: ' + error.message, false, true);
            reject(error);
        }
    });
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

async function processCSV(file) {
    return new Promise(async (resolve, reject) => {
        try {
            showCSVProcessingStatus('Processing CSV file...');
            
            const text = await file.text();
            const lines = text.trim().split('\n');
            const data = [];
            
            for (const line of lines) {
                // Simple CSV parsing (handles quoted fields)
                const row = [];
                let current = '';
                let inQuotes = false;
                
                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    
                    if (char === '"') {
                        inQuotes = !inQuotes;
                    } else if (char === ',' && !inQuotes) {
                        row.push(current.trim());
                        current = '';
                    } else {
                        current += char;
                    }
                }
                row.push(current.trim());
                data.push(row);
            }
            
            spreadsheetData = data;
            spreadsheetStats = {
                rows: data.length,
                columns: data.length > 0 ? Math.max(...data.map(row => row.length)) : 0,
                sheets: 1,
                sheetNames: ['Sheet1']
            };
            
            showCSVProcessingStatus('CSV processing complete!', true);
            console.log('CSV processed successfully:', spreadsheetStats);
            resolve(spreadsheetData);
            
        } catch (error) {
            console.error('CSV processing error:', error);
            showCSVProcessingStatus('Error processing CSV: ' + error.message, false, true);
            reject(error);
        }
    });
}

async function processExcel(file) {
    return new Promise(async (resolve, reject) => {
        try {
            showCSVProcessingStatus('Processing Excel file...');
            
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: 'array' });
            
            // Get first sheet
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            
            // Convert to JSON array
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            
            spreadsheetData = jsonData;
            spreadsheetStats = {
                rows: jsonData.length,
                columns: jsonData.length > 0 ? Math.max(...jsonData.map(row => row.length)) : 0,
                sheets: workbook.SheetNames.length,
                sheetNames: workbook.SheetNames
            };
            
            showCSVProcessingStatus('Excel processing complete!', true);
            console.log('Excel processed successfully:', spreadsheetStats);
            resolve(spreadsheetData);
            
        } catch (error) {
            console.error('Excel processing error:', error);
            showCSVProcessingStatus('Error processing Excel: ' + error.message, false, true);
            reject(error);
        }
    });
}

function showCSVProcessingStatus(message, complete = false, error = false) {
    let statusDiv = document.getElementById('csvProcessingStatus');
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'csvProcessingStatus';
        statusDiv.className = 'csv-processing';
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

async function processImageWithOpenCV(dataUrl, fileName) {
    showOpenCVProcessingStatus('Processing image...');
    
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = function() {
            try {
                // Calculate resize dimensions
                const maxSize = parseInt(document.getElementById('imageScalingSelect').value) || 3508;
                const { width, height } = calculateResizeDimensions(img.width, img.height, maxSize);
                
                // Create canvas for processing
                const canvas = document.createElement('canvas');
                const ctx = canvas.getContext('2d');
                canvas.width = width;
                canvas.height = height;
                
                // Draw and resize image
                ctx.drawImage(img, 0, 0, width, height);
                
                // Store processed image
                const processedDataUrl = canvas.toDataURL('image/png');
                uploadedFileBase64 = processedDataUrl.split(',')[1];
                
                // Display image
                const imagePreview = document.getElementById('imagePreview');
                imagePreview.src = processedDataUrl;
                imagePreview.style.display = 'block';
                
                // Show enhancement panel
                document.getElementById('imageEnhancementPanel').classList.add('active');
                
                // Update comparison view
                updateImageComparison(width, height, fileName);
                
                showOpenCVProcessingStatus('Image processing complete!', true);
                resolve({ width, height, dataUrl: processedDataUrl });
                
            } catch (error) {
                console.error('Image processing error:', error);
                showOpenCVProcessingStatus('Error processing image: ' + error.message, false, true);
                reject(error);
            }
        };
        
        img.onerror = function() {
            showOpenCVProcessingStatus('Error loading image', false, true);
            reject(new Error('Failed to load image'));
        };
        
        img.src = dataUrl;
    });
}

function calculateResizeDimensions(originalWidth, originalHeight, maxSize) {
    if (originalWidth <= maxSize && originalHeight <= maxSize) {
        return { width: originalWidth, height: originalHeight };
    }
    
    const aspectRatio = originalWidth / originalHeight;
    
    if (originalWidth > originalHeight) {
        return {
            width: maxSize,
            height: Math.round(maxSize / aspectRatio)
        };
    } else {
        return {
            width: Math.round(maxSize * aspectRatio),
            height: maxSize
        };
    }
}

function updateImageComparison(originalWidth, originalHeight, fileName) {
    // Simple implementation - just show the processed image
    const originalImage = document.getElementById('originalImage');
    const enhancedImage = document.getElementById('enhancedImage');
    const originalInfo = document.getElementById('originalImageInfo');
    const enhancedInfo = document.getElementById('enhancedImageInfo');
    
    if (originalImage && enhancedImage) {
        originalImage.src = `data:image/png;base64,${uploadedFileBase64}`;
        enhancedImage.src = `data:image/png;base64,${uploadedFileBase64}`;
        
        if (originalInfo) {
            originalInfo.textContent = `${originalWidth}x${originalHeight}`;
        }
        if (enhancedInfo) {
            enhancedInfo.textContent = `${originalWidth}x${originalHeight}`;
        }
    }
}

function showOpenCVProcessingStatus(message, complete = false, error = false) {
    let statusDiv = document.getElementById('opencvProcessingStatus');
    if (!statusDiv) {
        statusDiv = document.createElement('div');
        statusDiv.id = 'opencvProcessingStatus';
        statusDiv.className = 'opencv-processing';
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

function removeFile() {
    // Reset all file-related variables
    uploadedFileBase64 = null;
    uploadedFileType = null;
    uploadedFileName = null;
    pdfTextContent = null;
    pdfImageContents = [];
    svgConvertedBase64 = null;
    spreadsheetData = null;
    spreadsheetStats = null;
    
    // Reset file input
    document.getElementById('imageInput').value = '';
    
    // Hide all preview elements
    document.getElementById('imagePreview').style.display = 'none';
    document.getElementById('pdfPreview').style.display = 'none';
    document.getElementById('svgPreview').style.display = 'none';
    document.getElementById('csvPreview').style.display = 'none';
    document.getElementById('xlsxPreview').style.display = 'none';
    document.getElementById('imageEnhancementPanel').classList.remove('active');
    document.getElementById('imagePreviewContainer').style.display = 'none';
    
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
        if (div && div.parentNode) {
            div.remove();
        }
    });
    
    // Clear detailed previews from the filePreview container
    const filePreviewDiv = document.getElementById('filePreview');
    if (filePreviewDiv) {
        const pdfContentPreview = filePreviewDiv.querySelector('.pdf-content-preview');
        if (pdfContentPreview) pdfContentPreview.remove();
        
        const pdfImagesPreview = filePreviewDiv.querySelector('.pdf-images-preview');
        if (pdfImagesPreview) pdfImagesPreview.remove();
        
        const spreadsheetPreview = filePreviewDiv.querySelector('.spreadsheet-preview');
        if (spreadsheetPreview) spreadsheetPreview.remove();
    }
}

// Core messaging functions
async function sendMessage() {
    // Default to sending with model 1 if available, otherwise model 2
    if (currentModel1) {
        await sendMessageWithModel(1);
    } else if (currentModel2) {
        await sendMessageWithModel(2);
    } else {
        showStatus('Please activate at least one model first', 'error');
    }
}

async function sendMessageWithModel(modelNumber) {
    const messageInput = document.getElementById('messageInput');
    const message = messageInput.value.trim();
    
    if (!message && !uploadedFileBase64) {
        showStatus('Please enter a message or upload a file', 'error');
        return;
    }
    
    const currentModel = modelNumber === 1 ? currentModel1 : currentModel2;
    if (!currentModel) {
        showStatus(`Model ${modelNumber} is not activated`, 'error');
        return;
    }
    
    if (isLoading) {
        showStatus('Please wait for the current request to complete', 'error');
        return;
    }
    
    // Disable input and show loading
    messageInput.disabled = true;
    isLoading = true;
    showLoading();
    
    try {
        // Add user message to chat
        if (message) {
            addMessage(message, true);
        }
        
        // Add file info if present
        if (uploadedFileBase64) {
            const fileInfo = {
                type: uploadedFileType,
                name: uploadedFileName,
                base64: uploadedFileBase64
            };
            
            if (pdfTextContent) {
                fileInfo.textContent = pdfTextContent;
            }
            if (pdfImageContents && pdfImageContents.length > 0) {
                fileInfo.imageContents = pdfImageContents;
            }
            if (svgConvertedBase64) {
                fileInfo.convertedBase64 = svgConvertedBase64;
            }
            if (spreadsheetData) {
                fileInfo.spreadsheetData = spreadsheetData;
                fileInfo.spreadsheetStats = spreadsheetStats;
            }
            
            addMessage(`📎 Attached: ${uploadedFileName}`, true, fileInfo);
        }
        
        // Prepare the request payload
        const systemPrompt = document.getElementById('systemPrompt').value.trim();
        const requestPayload = {
            model: currentModel,
            messages: [],
            stream: true
        };
        
        // Add system prompt if provided and different from current
        if (systemPrompt && systemPrompt !== currentSystemPrompt) {
            requestPayload.messages.push({
                role: 'system',
                content: systemPrompt
            });
            currentSystemPrompt = systemPrompt;
        }
        
        // Add conversation history
        requestPayload.messages.push(...conversationHistory);
        
        // Add current message
        if (message || uploadedFileBase64) {
            const userMessage = {
                role: 'user',
                content: message || 'Please analyze the uploaded file.'
            };
            
            // Add image data if present
            if (uploadedFileBase64 && uploadedFileType.startsWith('image/')) {
                userMessage.images = [uploadedFileBase64];
            }
            
            requestPayload.messages.push(userMessage);
        }
        
        // Create abort controller for this request
        currentAbortController = new AbortController();
        
        // Make API request
        updateBaseUrl();
        const response = await fetch(`${baseUrl}/api/chat`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(requestPayload),
            signal: currentAbortController.signal
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        // Handle streaming response
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let assistantResponse = '';
        let responseMessageElement = null;
        
        while (true) {
            const { done, value } = await reader.read();
            
            if (done) break;
            
            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (line.trim() === '') continue;
                
                try {
                    const data = JSON.parse(line);
                    
                    if (data.message && data.message.content) {
                        assistantResponse += data.message.content;
                        
                        // Create or update response message
                        if (!responseMessageElement) {
                            responseMessageElement = addMessage('', false);
                        }
                        
                        // Update message content with markdown rendering
                        const messageContent = responseMessageElement.querySelector('.message-content');
                        messageContent.innerHTML = marked.parse(assistantResponse);
                        
                        // Apply syntax highlighting
                        messageContent.querySelectorAll('pre code').forEach((block) => {
                            hljs.highlightElement(block);
                        });
                        
                        // Process math if available
                        if (window.MathJax && window.MathJax.typesetPromise) {
                            try {
                                MathJax.typesetPromise([messageContent]).catch(() => {});
                            } catch (e) {}
                        }
                        
                        // Scroll to bottom
                        messageContent.scrollIntoView({ behavior: 'smooth', block: 'end' });
                    }
                    
                    if (data.done) {
                        break;
                    }
                    
                } catch (e) {
                    // Ignore JSON parse errors for incomplete chunks
                }
            }
        }
        
        // Update conversation history
        if (message || uploadedFileBase64) {
            conversationHistory.push({
                role: 'user',
                content: message || 'Please analyze the uploaded file.'
            });
        }
        
        if (assistantResponse) {
            conversationHistory.push({
                role: 'assistant',
                content: assistantResponse
            });
        }
        
        // Clear input and file
        messageInput.value = '';
        removeFile();
        
        showStatus(`Message sent successfully with Model ${modelNumber} (${currentModel})`, 'success');
        
    } catch (error) {
        if (error.name === 'AbortError') {
            showStatus('Request was cancelled', 'error');
        } else {
            console.error('Error sending message:', error);
            showStatus('Error sending message: ' + error.message, 'error');
        }
    } finally {
        // Re-enable input and hide loading
        messageInput.disabled = false;
        isLoading = false;
        hideLoading();
        currentAbortController = null;
        updateModelButtons();
        messageInput.focus();
    }
}

function addMessage(content, isUser = false, fileData = null) {
    const messagesContainer = document.getElementById('messages');
    const messageDiv = document.createElement('div');
    messageDiv.className = `message ${isUser ? 'user' : 'assistant'}`;
    
    const messageContent = document.createElement('div');
    messageContent.className = 'message-content';
    
    if (fileData) {
        // Show file attachment info
        messageContent.innerHTML = `<div style="margin-bottom: 8px; font-size: 0.9em; opacity: 0.8;">${content}</div>`;
    } else if (isUser) {
        messageContent.textContent = content;
    } else {
        // For assistant messages, parse markdown
        messageContent.innerHTML = marked.parse(content || '...');
        
        // Apply syntax highlighting
        messageContent.querySelectorAll('pre code').forEach((block) => {
            hljs.highlightElement(block);
        });
        
        // Add copy buttons to code blocks
        messageContent.querySelectorAll('pre').forEach((pre) => {
            const code = pre.querySelector('code');
            if (code) {
                const copyBtn = document.createElement('button');
                copyBtn.className = 'copy-btn';
                copyBtn.textContent = 'Copy';
                copyBtn.onclick = () => copyCode(copyBtn);
                
                const codeHeader = document.createElement('div');
                codeHeader.className = 'code-header';
                codeHeader.innerHTML = `<span>Code</span>`;
                codeHeader.appendChild(copyBtn);
                
                pre.parentNode.insertBefore(codeHeader, pre);
                pre.style.borderRadius = '0 0 8px 8px';
                pre.style.marginTop = '0';
            }
        });
    }
    
    messageDiv.appendChild(messageContent);
    messagesContainer.appendChild(messageDiv);
    
    // Scroll to bottom
    messageDiv.scrollIntoView({ behavior: 'smooth', block: 'end' });
    
    return messageDiv;
}

function copyCode(button) {
    const codeBlock = button.closest('.code-header').nextElementSibling.querySelector('code');
    const text = codeBlock.textContent;
    
    navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        setTimeout(() => {
            button.textContent = originalText;
        }, 2000);
    });
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
});

function handleKeyDown(event) {
    if (event.key === 'Enter' && !event.shiftKey) {
        event.preventDefault();
        sendMessage();
    }
}