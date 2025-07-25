#!/usr/bin/env python3
import re

# Read the HTML file
with open('Dual_ollama_Chat.html', 'r', encoding='utf-8') as f:
    content = f.read()

# Find and replace the header buttons section
old_pattern = r'                <button class="config-btn" onclick="toggleConfig\(\)">⚙️ Settings</button>\s*\n\s*<button class="new-chat-btn" onclick="startNewChat\(\)" id="newChatBtn" title="Start a new conversation">🆕 New Chat</button>'
new_content = '''                <button class="config-btn" onclick="toggleConfig()">⚙️ Settings</button>
                <button class="memory-btn" onclick="toggleMemoryPanel()" title="Memory Management">🧠 Memory</button>
                <button class="new-chat-btn" onclick="startNewChat()" id="newChatBtn" title="Start a new conversation">🆕 New Chat</button>'''

# Apply the replacement
new_html = re.sub(old_pattern, new_content, content, flags=re.MULTILINE)

# Write back to file
with open('Dual_ollama_Chat.html', 'w', encoding='utf-8') as f:
    f.write(new_html)

print("Memory button added successfully!")
