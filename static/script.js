// static/script.js
// AI Project Generator v3.0 - Frontend JavaScript
// Main application logic for the upgraded AI Project Generator

// DOM Elements
const projectForm = document.getElementById('project-form');
const projectType = document.getElementById('project-type');
const projectComplexity = document.getElementById('project-complexity');
const techStack = document.getElementById('tech-stack');
const additionalRequirements = document.getElementById('additional-requirements');
const generateBtn = document.getElementById('generate-btn');
const loadingSpinner = document.getElementById('loading-spinner');
const projectOutput = document.getElementById('project-output');
const errorMessage = document.getElementById('error-message');
const successMessage = document.getElementById('success-message');
const copyBtn = document.getElementById('copy-btn');
const downloadBtn = document.getElementById('download-btn');
const clearBtn = document.getElementById('clear-btn');
const apiStatus = document.getElementById('api-status');
const modelSelector = document.getElementById('model-selector');
const temperatureSlider = document.getElementById('temperature-slider');
const temperatureValue = document.getElementById('temperature-value');
const maxTokens = document.getElementById('max-tokens');
const historyList = document.getElementById('history-list');
const clearHistoryBtn = document.getElementById('clear-history-btn');
const exportHistoryBtn = document.getElementById('export-history-btn');
const themeToggle = document.getElementById('theme-toggle');
const voiceInputBtn = document.getElementById('voice-input-btn');
const voiceStatus = document.getElementById('voice-status');

// Application State
let appState = {
    currentProject: null,
    generationHistory: [],
    isGenerating: false,
    isDarkMode: false,
    isVoiceActive: false,
    recognition: null
};

// Initialize the application
document.addEventListener('DOMContentLoaded', function() {
    console.log('AI Project Generator v3.0 Initializing...');
    
    // Load saved state from localStorage
    loadAppState();
    
    // Initialize event listeners
    initializeEventListeners();
    
    // Check API status
    checkAPIStatus();
    
    // Update UI based on loaded state
    updateUI();
    
    // Initialize voice recognition if available
    initializeVoiceRecognition();
});

// Load application state from localStorage
function loadAppState() {
    try {
        const savedState = localStorage.getItem('aiProjectGeneratorState');
        if (savedState) {
            const parsedState = JSON.parse(savedState);
            appState.generationHistory = parsedState.generationHistory || [];
            appState.isDarkMode = parsedState.isDarkMode || false;
            
            // Update theme
            if (appState.isDarkMode) {
                document.body.classList.add('dark-mode');
                themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
            }
            
            // Load history
            renderHistory();
        }
        
        // Load temperature preference
        const savedTemp = localStorage.getItem('aiTemperature');
        if (savedTemp) {
            temperatureSlider.value = savedTemp;
            temperatureValue.textContent = savedTemp;
        }
        
        // Load max tokens preference
        const savedTokens = localStorage.getItem('aiMaxTokens');
        if (savedTokens) {
            maxTokens.value = savedTokens;
        }
        
        // Load model preference
        const savedModel = localStorage.getItem('aiModel');
        if (savedModel) {
            modelSelector.value = savedModel;
        }
    } catch (error) {
        console.error('Error loading app state:', error);
        // Reset to defaults on error
        appState = {
            currentProject: null,
            generationHistory: [],
            isGenerating: false,
            isDarkMode: false,
            isVoiceActive: false,
            recognition: null
        };
    }
}

// Save application state to localStorage
function saveAppState() {
    try {
        const stateToSave = {
            generationHistory: appState.generationHistory,
            isDarkMode: appState.isDarkMode
        };
        localStorage.setItem('aiProjectGeneratorState', JSON.stringify(stateToSave));
        
        // Save preferences
        localStorage.setItem('aiTemperature', temperatureSlider.value);
        localStorage.setItem('aiMaxTokens', maxTokens.value);
        localStorage.setItem('aiModel', modelSelector.value);
    } catch (error) {
        console.error('Error saving app state:', error);
    }
}

// Initialize all event listeners
function initializeEventListeners() {
    // Form submission
    projectForm.addEventListener('submit', handleFormSubmit);
    
    // Copy button
    copyBtn.addEventListener('click', copyToClipboard);
    
    // Download button
    downloadBtn.addEventListener('click', downloadProject);
    
    // Clear button
    clearBtn.addEventListener('click', clearOutput);
    
    // Temperature slider
    temperatureSlider.addEventListener('input', function() {
        temperatureValue.textContent = this.value;
        saveAppState();
    });
    
    // Max tokens input
    maxTokens.addEventListener('change', saveAppState);
    
    // Model selector
    modelSelector.addEventListener('change', saveAppState);
    
    // Theme toggle
    themeToggle.addEventListener('click', toggleTheme);
    
    // Voice input button
    voiceInputBtn.addEventListener('click', toggleVoiceInput);
    
    // Clear history button
    clearHistoryBtn.addEventListener('click', clearHistory);
    
    // Export history button
    exportHistoryBtn.addEventListener('click', exportHistory);
    
    // Tech stack chips (if using a chip-based input)
    initializeTechStackInput();
    
    // Real-time validation
    initializeFormValidation();
}

// Initialize tech stack input with auto-suggestions
function initializeTechStackInput() {
    const techSuggestions = [
        'Python', 'JavaScript', 'React', 'Vue', 'Node.js', 'Flask', 'Django',
        'FastAPI', 'TensorFlow', 'PyTorch', 'OpenAI API', 'PostgreSQL', 'MongoDB',
        'Docker', 'AWS', 'Firebase', 'GraphQL', 'TypeScript', 'Next.js', 'Tailwind CSS'
    ];
    
    // Add input event listener for suggestions
    techStack.addEventListener('input', function() {
        showTechSuggestions(this.value, techSuggestions);
    });
    
    // Allow comma-separated tech stack
    techStack.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            addTechStackChip(this.value.replace(',', ''));
            this.value = '';
        }
    });
}

// Show tech stack suggestions
function showTechSuggestions(input, suggestions) {
    // Implementation for suggestion dropdown
    // This is a simplified version - in production you'd want a proper dropdown
    if (input.length > 1) {
        const filtered = suggestions.filter(tech => 
            tech.toLowerCase().includes(input.toLowerCase())
        );
        
        // You could implement a dropdown here
        console.log('Suggestions:', filtered.slice(0, 5));
    }
}

// Add a tech stack chip
function addTechStackChip(tech) {
    if (!tech.trim()) return;
    
    // Create chip element
    const chip = document.createElement('span');
    chip.className = 'tech-chip';
    chip.innerHTML = `
        ${tech.trim()}
        <span class="chip-remove" onclick="removeTechChip(this)">×</span>
    `;
    
    // Add to a chips container (you'd need to create this in HTML)
    const chipsContainer = document.getElementById('tech-chips-container');
    if (chipsContainer) {
        chipsContainer.appendChild(chip);
    }
    
    // Update hidden input value
    updateTechStackValue();
}

// Remove tech chip
function removeTechChip(element) {
    element.parentElement.remove();
    updateTechStackValue();
}

// Update hidden tech stack value
function updateTechStackValue() {
    const chips = document.querySelectorAll('.tech-chip');
    const techValues = Array.from(chips).map(chip => 
        chip.textContent.replace('×', '').trim()
    );
    
    // Update a hidden input or modify the main input
    // This depends on your HTML structure
    console.log('Current tech stack:', techValues.join(', '));
}

// Initialize form validation
function initializeFormValidation() {
    const inputs = [projectType, projectComplexity, techStack];
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            clearFieldError(this);
        });
    });
}

// Validate a form field
function validateField(field) {
    if (!field.value.trim()) {
        showFieldError(field, 'This field is required');
        return false;
    }
    
    // Additional validation for specific fields
    if (field === techStack && field.value.trim().length < 2) {
        showFieldError(field, 'Please specify at least one technology');
        return false;
    }
    
    return true;
}

// Show field error
function showFieldError(field, message) {
    clearFieldError(field);
    
    const error = document.createElement('div');
    error.className = 'field-error';
    error.textContent = message;
    error.style.color = '#ff4757';
    error.style.fontSize = '0.8rem';
    error.style.marginTop = '5px';
    
    field.parentNode.appendChild(error);
    field.style.borderColor = '#ff4757';
}

// Clear field error
function clearFieldError(field) {
    const existingError = field.parentNode.querySelector('.field-error');
    if (existingError) {
        existingError.remove();
    }
    field.style.borderColor = '';
}

// Handle form submission
async function handleFormSubmit(e) {
    e.preventDefault();
    
    // Validate form
    if (!validateForm()) {
        return;
    }
    
    // Prepare project data
    const projectData = {
        project_type: projectType.value,
        complexity: projectComplexity.value,
        tech_stack: techStack.value,
        additional_requirements: additionalRequirements.value,
        model: modelSelector.value,
        temperature: parseFloat(temperatureSlider.value),
        max_tokens: parseInt(maxTokens.value) || 2000
    };
    
    // Show loading state
    setLoadingState(true);
    
    try {
        // Send request to backend
        const response = await fetch('/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(projectData)
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        // Display the generated project
        displayProject(data);
        
        // Add to history
        addToHistory(projectData, data);
        
        // Show success message
        showMessage('success', 'Project generated successfully!');
        
    } catch (error) {
        console.error('Error generating project:', error);
        showMessage('error', `Failed to generate project: ${error.message}`);
    } finally {
        // Hide loading state
        setLoadingState(false);
    }
}

// Validate the entire form
function validateForm() {
    let isValid = true;
    
    const fields = [projectType, projectComplexity, techStack];
    
    fields.forEach(field => {
        if (!validateField(field)) {
            isValid = false;
        }
    });
    
    return isValid;
}

// Set loading state
function setLoadingState(isLoading) {
    appState.isGenerating = isLoading;
    
    if (isLoading) {
        generateBtn.disabled = true;
        generateBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Generating...';
        loadingSpinner.style.display = 'block';
        projectOutput.style.display = 'none';
        hideMessage();
    } else {
        generateBtn.disabled = false;
        generateBtn.innerHTML = '<i class="fas fa-magic"></i> Generate Project';
        loadingSpinner.style.display = 'none';
    }
}

// Display the generated project
function displayProject(data) {
    appState.currentProject = data;
    
    // Format the project output
    let outputHTML = `
        <div class="project-header">
            <h3>${data.project_name || 'Generated Project'}</h3>
            <div class="project-meta">
                <span class="badge">${data.project_type}</span>
                <span class="badge">${data.complexity}</span>
                <span class="badge">Tokens: ${data.usage?.total_tokens || 'N/A'}</span>
            </div>
        </div>
        
        <div class="project-content">
    `;
    
    // Add project description
    if (data.project_description) {
        outputHTML += `
            <div class="section">
                <h4><i class="fas fa-info-circle"></i> Project Description</h4>
                <p>${data.project_description}</p>
            </div>
        `;
    }
    
    // Add features
    if (data.features && data.features.length > 0) {
        outputHTML += `
            <div class="section">
                <h4><i class="fas fa-star"></i> Key Features</h4>
                <ul>
                    ${data.features.map(feature => `<li>${feature}</li>`).join('')}
                </ul>
            </div>
        `;
    }
    
    // Add tech stack
    if (data.tech_stack && data.tech_stack.length > 0) {
        outputHTML += `
            <div class="section">
                <h4><i class="fas fa-code"></i> Technology Stack</h4>
                <div class="tech-stack-display">
                    ${data.tech_stack.map(tech => `<span class="tech-tag">${tech}</span>`).join('')}
                </div>
            </div>
        `;
    }
    
    // Add file structure
    if (data.file_structure) {
        outputHTML += `
            <div class="section">
                <h4><i class="fas fa-folder"></i> Project Structure</h4>
                <pre class="file-structure">${data.file_structure}</pre>
            </div>
        `;
    }
    
    // Add code snippets
    if (data.code_snippets && Object.keys(data.code_snippets).length > 0) {
        outputHTML += `
            <div class="section">
                <h4><i class="fas fa-file-code"></i> Code Snippets</h4>
        `;
        
        for (const [filename, code] of Object.entries(data.code_snippets)) {
            outputHTML += `
                <div class="code-snippet">
                    <div class="code-header">
                        <span>${filename}</span>
                        <button class="copy-snippet-btn" onclick="copyCodeSnippet('${filename}')">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                    <pre><code class="language-python">${escapeHtml(code)}</code></pre>
                </div>
            `;
        }
        
        outputHTML += `</div>`;
    }
    
    // Add setup instructions
    if (data.setup_instructions) {
        outputHTML += `
            <div class="section">
                <h4><i class="fas fa-cogs"></i> Setup Instructions</h4>
                <ol class="setup-steps">
                    ${data.setup_instructions.map(step => `<li>${step}</li>`).join('')}
                </ol>
            </div>
        `;
    }
    
    // Add deployment instructions
    if (data.deployment_instructions) {
        outputHTML += `
            <div class="section">
                <h4><i class="fas fa-rocket"></i> Deployment</h4>
                <p>${data.deployment_instructions}</p>
            </div>
        `;
    }
    
    outputHTML += `</div>`;
    
    // Display the output
    projectOutput.innerHTML = outputHTML;
    projectOutput.style.display = 'block';
    
    // Show action buttons
    copyBtn.style.display = 'inline-block';
    downloadBtn.style.display = 'inline-block';
    clearBtn.style.display = 'inline-block';
    
    // Apply syntax highlighting if available
    if (window.Prism) {
        Prism.highlightAll();
    }
}

// Escape HTML to prevent XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// Copy code snippet to clipboard
function copyCodeSnippet(filename) {
    if (!appState.currentProject || !appState.currentProject.code_snippets) {
        return;
    }
    
    const code = appState.currentProject.code_snippets[filename];
    if (code) {
        navigator.clipboard.writeText(code).then(() => {
            showMessage('success', `Copied ${filename} to clipboard!`);
        }).catch(err => {
            console.error('Failed to copy:', err);
            showMessage('error', 'Failed to copy code');
        });
    }
}

// Copy entire project to clipboard
async function copyToClipboard() {
    if (!appState.currentProject) {
        showMessage('error', 'No project to copy');
        return;
    }
    
    try {
        // Create a formatted text version
        let textToCopy = `AI Generated Project: ${appState.currentProject.project_name || 'Project'}\n`;
        textToCopy += `Type: ${appState.currentProject.project_type}\n`;
        textToCopy += `Complexity: ${appState.currentProject.complexity}\n\n`;
        
        if (appState.currentProject.project_description) {
            textToCopy += `DESCRIPTION:\n${appState.currentProject.project_description}\n\n`;
        }
        
        if (appState.currentProject.features) {
            textToCopy += `FEATURES:\n`;
            appState.currentProject.features.forEach(feature => {
                textToCopy += `• ${feature}\n`;
            });
            textToCopy += '\n';
        }
        
        if (appState.currentProject.file_structure) {
            textToCopy += `PROJECT STRUCTURE:\n${appState.currentProject.file_structure}\n\n`;
        }
        
        if (appState.currentProject.code_snippets) {
            textToCopy += `CODE SNIPPETS:\n`;
            for (const [filename, code] of Object.entries(appState.currentProject.code_snippets)) {
                textToCopy += `\n--- ${filename} ---\n${code}\n`;
            }
        }
        
        await navigator.clipboard.writeText(textToCopy);
        showMessage('success', 'Project copied to clipboard!');
    } catch (error) {
        console.error('Failed to copy:', error);
        showMessage('error', 'Failed to copy project');
    }
}

// Download project as markdown file
function downloadProject() {
    if (!appState.currentProject) {
        showMessage('error', 'No project to download');
        return;
    }
    
    try {
        // Create markdown content
        let markdown = `# ${appState.currentProject.project_name || 'AI Generated Project'}\n\n`;
        markdown += `**Type:** ${appState.currentProject.project_type}  \n`;
        markdown += `**Complexity:** ${appState.currentProject.complexity}  \n`;
        markdown += `**Generated:** ${new Date().toLocaleDateString()}  \n\n`;
        
        if (appState.currentProject.project_description) {
            markdown += `## Description\n\n${appState.currentProject.project_description}\n\n`;
        }
        
        if (appState.currentProject.features) {
            markdown += `## Features\n\n`;
            appState.currentProject.features.forEach(feature => {
                markdown += `- ${feature}\n`;
            });
            markdown += '\n';
        }
        
        if (appState.currentProject.tech_stack) {
            markdown += `## Technology Stack\n\n`;
            appState.currentProject.tech_stack.forEach(tech => {
                markdown += `- ${tech}\n`;
            });
            markdown += '\n';
        }
        
        if (appState.currentProject.file_structure) {
            markdown += `## Project Structure\n\n\`\`\`\n${appState.currentProject.file_structure}\n\`\`\`\n\n`;
        }
        
        if (appState.currentProject.code_snippets) {
            markdown += `## Code\n\n`;
            for (const [filename, code] of Object.entries(appState.currentProject.code_snippets)) {
                markdown += `### ${filename}\n\n\`\`\`python\n${code}\n\`\`\`\n\n`;
            }
        }
        
        if (appState.currentProject.setup_instructions) {
            markdown += `## Setup Instructions\n\n`;
            appState.currentProject.setup_instructions.forEach((step, index) => {
                markdown += `${index + 1}. ${step}\n`;
            });
            markdown += '\n';
        }
        
        // Create download link
        const blob = new Blob([markdown], { type: 'text/markdown' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${appState.currentProject.project_name || 'project'}.md`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showMessage('success', 'Project downloaded as markdown!');
    } catch (error) {
        console.error('Failed to download:', error);
        showMessage('error', 'Failed to download project');
    }
}

// Clear the output
function clearOutput() {
    projectOutput.innerHTML = '';
    projectOutput.style.display = 'none';
    appState.currentProject = null;
    
    // Hide action buttons
    copyBtn.style.display = 'none';
    downloadBtn.style.display = 'none';
    clearBtn.style.display = 'none';
    
    hideMessage();
}

// Show message (success or error)
function showMessage(type, text) {
    hideMessage();
    
    if (type === 'success') {
        successMessage.textContent = text;
        successMessage.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            if (successMessage.textContent === text) {
                successMessage.style.display = 'none';
            }
        }, 5000);
    } else if (type === 'error') {
        errorMessage.textContent = text;
        errorMessage.style.display = 'block';
    }
}

// Hide all messages
function hideMessage() {
    successMessage.style.display = 'none';
    errorMessage.style.display = 'none';
}

// Check API status
async function checkAPIStatus() {
    try {
        const response = await fetch('/api-status');
        const data = await response.json();
        
        if (data.status === 'healthy') {
            apiStatus.innerHTML = '<i class="fas fa-check-circle"></i> API Connected';
            apiStatus.className = 'api-status connected';
        } else {
            apiStatus.innerHTML = '<i class="fas fa-exclamation-triangle"></i> API Issues';
            apiStatus.className = 'api-status warning';
        }
    } catch (error) {
        console.error('Error checking API status:', error);
        apiStatus.innerHTML = '<i class="fas fa-times-circle"></i> API Offline';
        apiStatus.className = 'api-status offline';
    }
}

// Toggle theme (light/dark mode)
function toggleTheme() {
    appState.isDarkMode = !appState.isDarkMode;
    
    if (appState.isDarkMode) {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    } else {
        document.body.classList.remove('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-moon"></i>';
    }
    
    saveAppState();
}

// Initialize voice recognition
function initializeVoiceRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        appState.recognition = new SpeechRecognition();
        
        appState.recognition.continuous = false;
        appState.recognition.interimResults = false;
        appState.recognition.lang = 'en-US';
        
        appState.recognition.onresult = function(event) {
            const transcript = event.results[0][0].transcript;
            additionalRequirements.value = transcript;
            voiceStatus.textContent = 'Voice input captured!';
            
            setTimeout(() => {
                voiceStatus.textContent = '';
            }, 3000);
        };
        
        appState.recognition.onerror = function(event) {
            console.error('Speech recognition error:', event.error);
            voiceStatus.textContent = `Error: ${event.error}`;
            appState.isVoiceActive = false;
            updateVoiceButton();
        };
        
        appState.recognition.onend = function() {
            appState.isVoiceActive = false;
            updateVoiceButton();
        };
        
        voiceInputBtn.style.display = 'inline-block';
    } else {
        voiceInputBtn.style.display = 'none';
        console.log('Speech recognition not supported in this browser');
    }
}

// Toggle voice input
function toggleVoiceInput() {
    if (!appState.recognition) {
        showMessage('error', 'Voice recognition not supported');
        return;
    }
    
    if (appState.isVoiceActive) {
        appState.recognition.stop();
        appState.isVoiceActive = false;
        voiceStatus.textContent = 'Voice input stopped';
    } else {
        appState.recognition.start();
        appState.isVoiceActive = true;
        voiceStatus.textContent = 'Listening... Speak now';
    }
    
    updateVoiceButton();
}

// Update voice button state
function updateVoiceButton() {
    if (appState.isVoiceActive) {
        voiceInputBtn.innerHTML = '<i class="fas fa-microphone-slash"></i>';
        voiceInputBtn.classList.add('active');
    } else {
        voiceInputBtn.innerHTML = '<i class="fas fa-microphone"></i>';
        voiceInputBtn.classList.remove('active');
    }
}

// Add project to history
function addToHistory(inputData, outputData) {
    const historyItem = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        input: inputData,
        output: {
            project_name: outputData.project_name,
            project_type: outputData.project_type,
            complexity: outputData.complexity
        }
    };
    
    appState.generationHistory.unshift(historyItem);
    
    // Keep only last 50 items
    if (appState.generationHistory.length > 50) {
        appState.generationHistory = appState.generationHistory.slice(0, 50);
    }
    
    // Update UI and save
    renderHistory();
    saveAppState();
}

// Render history list
function renderHistory() {
    if (!historyList) return;
    
    if (appState.generationHistory.length === 0) {
        historyList.innerHTML = '<div class="empty-history">No generation history yet</div>';
        return;
    }
    
    let historyHTML = '';
    
    appState.generationHistory.forEach(item => {
        const date = new Date(item.timestamp);
        const timeString = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        const dateString = date.toLocaleDateString();
        
        historyHTML += `
            <div class="history-item" data-id="${item.id}">
                <div class="history-header">
                    <span class="history-title">${item.output.project_name || 'Project'}</span>
                    <span class="history-time">${dateString} ${timeString}</span>
                </div>
                <div class="history-details">
                    <span class="badge">${item.input.project_type}</span>
                    <span class="badge">${item.input.complexity}</span>
                    <span class="badge">${item.input.model}</span>
                </div>
                <div class="history-actions">
                    <button class="btn-sm" onclick="loadHistoryItem(${item.id})">
                        <i class="fas fa-eye"></i> View
                    </button>
                    <button class="btn-sm" onclick="deleteHistoryItem(${item.id})">
                        <i class="fas fa-trash"></i>
                    </button>
                </div>
            </div>
        `;
    });
    
    historyList.innerHTML = historyHTML;
}

// Load a history item
function loadHistoryItem(id) {
    const item = appState.generationHistory.find(item => item.id === id);
    if (!item) return;
    
    // Populate form with history data
    projectType.value = item.input.project_type;
    projectComplexity.value = item.input.complexity;
    techStack.value = item.input.tech_stack;
    additionalRequirements.value = item.input.additional_requirements;
    modelSelector.value = item.input.model;
    temperatureSlider.value = item.input.temperature;
    temperatureValue.textContent = item.input.temperature;
    maxTokens.value = item.input.max_tokens;
    
    showMessage('success', 'History item loaded into form');
}

// Delete a history item
function deleteHistoryItem(id) {
    appState.generationHistory = appState.generationHistory.filter(item => item.id !== id);
    renderHistory();
    saveAppState();
    showMessage('success', 'History item deleted');
}

// Clear all history
function clearHistory() {
    if (confirm('Are you sure you want to clear all generation history?')) {
        appState.generationHistory = [];
        renderHistory();
        saveAppState();
        showMessage('success', 'History cleared');
    }
}

// Export history as JSON
function exportHistory() {
    if (appState.generationHistory.length === 0) {
        showMessage('error', 'No history to export');
        return;
    }
    
    try {
        const exportData = {
            exportedAt: new Date().toISOString(),
            version: 'AI Project Generator v3.0',
            history: appState.generationHistory
        };
        
        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `project-generator-history-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showMessage('success', 'History exported successfully');
    } catch (error) {
        console.error('Failed to export history:', error);
        showMessage('error', 'Failed to export history');
    }
}

// Update UI based on app state
function updateUI() {
    // Update theme
    if (appState.isDarkMode) {
        document.body.classList.add('dark-mode');
        themeToggle.innerHTML = '<i class="fas fa-sun"></i>';
    }
    
    // Update voice button
    updateVoiceButton();
    
    // Update temperature display
    temperatureValue.textContent = temperatureSlider.value;
}

// Utility function to format code with syntax highlighting
function highlightCode(code, language) {
    // This is a placeholder - in production you'd use a library like Prism.js
    // Prism.highlight(code, Prism.languages[language], language);
    return code;
}

// Export functions for global access (needed for inline event handlers)
window.copyCodeSnippet = copyCodeSnippet;
window.loadHistoryItem = loadHistoryItem;
window.deleteHistoryItem = deleteHistoryItem;
window.removeTechChip = removeTechChip;

// Initialize when page loads
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
        console.log('AI Project Generator v3.0 Ready');
    });
} else {
    console.log('AI Project Generator v3.0 Ready');
}