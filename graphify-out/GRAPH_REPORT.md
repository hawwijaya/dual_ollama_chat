# Graph Report - .  (2026-06-14)

## Corpus Check
- 28 files · ~128,691 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1052 nodes · 2818 edges · 58 communities (35 shown, 23 thin omitted)
- Extraction: 98% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 57 edges (avg confidence: 0.85)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Markdown Parsing|Markdown Parsing]]
- [[_COMMUNITY_Chat UI Logic|Chat UI Logic]]
- [[_COMMUNITY_Syntax Highlighting|Syntax Highlighting]]
- [[_COMMUNITY_MathJax Accessibility|MathJax Accessibility]]
- [[_COMMUNITY_MathJax Math Operators|MathJax Math Operators]]
- [[_COMMUNITY_Dual Model UI|Dual Model UI]]
- [[_COMMUNITY_MathJax State Management|MathJax State Management]]
- [[_COMMUNITY_Memory Persistence|Memory Persistence]]
- [[_COMMUNITY_MathJax Attribute Parsing|MathJax Attribute Parsing]]
- [[_COMMUNITY_Memory Integration|Memory Integration]]
- [[_COMMUNITY_Memory UI|Memory UI]]
- [[_COMMUNITY_MathJax Node Assembly|MathJax Node Assembly]]
- [[_COMMUNITY_MathJax String Parsing|MathJax String Parsing]]
- [[_COMMUNITY_MathJax Core Engine|MathJax Core Engine]]
- [[_COMMUNITY_MathJax HTML Generation|MathJax HTML Generation]]
- [[_COMMUNITY_Chat Message Handling|Chat Message Handling]]
- [[_COMMUNITY_MathJax Rule Engine|MathJax Rule Engine]]
- [[_COMMUNITY_MathJax Layout Engine|MathJax Layout Engine]]
- [[_COMMUNITY_MathJax Speech Output|MathJax Speech Output]]
- [[_COMMUNITY_MathJax Locale Support|MathJax Locale Support]]
- [[_COMMUNITY_MathJax Math Nodes|MathJax Math Nodes]]
- [[_COMMUNITY_MathJax Speech Generation|MathJax Speech Generation]]
- [[_COMMUNITY_MathJax Proof Parsing|MathJax Proof Parsing]]
- [[_COMMUNITY_MathJax DOM Utilities|MathJax DOM Utilities]]
- [[_COMMUNITY_MathJax Action Handling|MathJax Action Handling]]
- [[_COMMUNITY_MathJax Markup Assembly|MathJax Markup Assembly]]
- [[_COMMUNITY_MathJax Semantic Tree|MathJax Semantic Tree]]
- [[_COMMUNITY_MathJax Table Rules|MathJax Table Rules]]
- [[_COMMUNITY_MathJax Punctuation Tree|MathJax Punctuation Tree]]
- [[_COMMUNITY_File Processing Pipeline|File Processing Pipeline]]
- [[_COMMUNITY_MathJax Accent Rules|MathJax Accent Rules]]
- [[_COMMUNITY_MathJax Debug Output|MathJax Debug Output]]
- [[_COMMUNITY_MathJax Dynamic Rules|MathJax Dynamic Rules]]
- [[_COMMUNITY_Image Enhancement|Image Enhancement]]
- [[_COMMUNITY_Memory Search|Memory Search]]
- [[_COMMUNITY_Transformer Architecture|Transformer Architecture]]
- [[_COMMUNITY_Handwriting Recognition|Handwriting Recognition]]
- [[_COMMUNITY_Statistical Inference|Statistical Inference]]
- [[_COMMUNITY_GitHub Issue Screenshot|GitHub Issue Screenshot]]
- [[_COMMUNITY_Memory Export|Memory Export]]
- [[_COMMUNITY_Memory Import|Memory Import]]
- [[_COMMUNITY_Memory Load|Memory Load]]

## God Nodes (most connected - your core abstractions)
1. `c()` - 141 edges
2. `s()` - 138 edges
3. `i()` - 98 edges
4. `a()` - 97 edges
5. `l()` - 87 edges
6. `_()` - 81 edges
7. `O()` - 66 edges
8. `h()` - 49 edges
9. `g()` - 48 edges
10. `p()` - 43 edges

## Surprising Connections (you probably didn't know these)
- `MemoryIntegration` --implements--> `Conversation Context Preservation`  [INFERRED]
  memory_integration.js → MEMORY_SYSTEM_DOCUMENTATION.md
- `MemoryIntegration` --semantically_similar_to--> `MemoryUI`  [INFERRED] [semantically similar]
  memory_integration.js → memory_ui.js
- `sendMessageWithModel` --implements--> `Dual Model Interaction`  [INFERRED]
  chat_vision_understanding v2.js → PRD_Dual_Ollama_Chat.md
- `handleFileUpload` --implements--> `File Processing Pipeline`  [INFERRED]
  chat_vision_understanding v2.js → FUNCTIONALITY_REVIEW.md
- `processPDF` --implements--> `PDF Dual-Stream Processing`  [INFERRED]
  chat_vision_understanding v2.js → FUNCTIONALITY_REVIEW.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Memory System Data Flow** — memory_integration_js_MemoryIntegration, memory_system_js_MemorySystem, memory_ui_js_MemoryUI [EXTRACTED 1.00]
- **File Processing Chain** — chat_vision_understanding_v2_js_handleFileUpload, chat_vision_understanding_v2_js_processPDF, chat_vision_understanding_v2_js_processSVG, chat_vision_understanding_v2_js_processCSV, chat_vision_understanding_v2_js_processImageWithOpenCV [EXTRACTED 1.00]
- **Model Lifecycle Management** — chat_vision_understanding_v2_js_detectModels, chat_vision_understanding_v2_js_activateModel, chat_vision_understanding_v2_js_updateActivateButtons, chat_vision_understanding_v2_js_updateModelButtons [EXTRACTED 1.00]
- **MathJax Testing Ecosystem** — mathjax_test_html, test_mathjax_fix_html, mathjax_rendering, dual_ollama_chat_mathjax_config [INFERRED 0.85]
- **Image Scaling Feature** — test_image_scaling_html, dual_ollama_chat_image_scaling_ui, image_scaling_resolution, getimagescalingresolution, calculateresizedimensions [INFERRED 0.85]
- **Format Viewing Feature** — format_feature_demo_html, test_format_feature_md, latex_format_viewer, markdown_format_viewer [INFERRED 0.85]

## Communities (58 total, 23 thin omitted)

### Community 0 - "Markdown Parsing"
Cohesion: 0.07
Nodes (50): A(), autolink(), blockquote(), blockTokens(), br(), checkbox(), code(), codespan() (+42 more)

### Community 1 - "Chat UI Logic"
Cohesion: 0.07
Nodes (45): activateModel(), addMessage(), adjustImageEnhancement(), applyAutoEnhancement(), applyBrightnessContrast(), applyHistogramEqualization(), applyNoiseReduction(), applyPreset() (+37 more)

### Community 2 - "Syntax Highlighting"
Cohesion: 0.06
Nodes (21): _(), a(), b(), c(), d(), f(), g(), h() (+13 more)

### Community 5 - "Dual Model UI"
Cohesion: 0.06
Nodes (41): activateModel(), calculateResizeDimensions(), Chat Icon (Brain + Chat Balloon), CSV/Excel Data Preview, Dual Model Chat Pattern, Dual Model Selection UI, File Upload Feature, Dual Ollama Chat (+33 more)

### Community 7 - "Memory Persistence"
Cohesion: 0.09
Nodes (13): Auto-Save Debouncing, Conversation Context Preservation, Conversation Threading, LocalStorage Persistence, Privacy-First Local Processing, Semantic Search, MemoryIntegration.autoSaveConversation, MemoryIntegration.saveCurrentConversation (+5 more)

### Community 9 - "Memory Integration"
Cohesion: 0.10
Nodes (4): Keyboard Shortcuts, enhancedLoadConversation(), enhancedSaveConversation(), MemoryIntegration

### Community 10 - "Memory UI"
Cohesion: 0.11
Nodes (5): clearMemory(), loadConversation(), MemoryUI, saveConversation(), toggleMemoryPanel()

### Community 14 - "MathJax Core Engine"
Cohesion: 0.10
Nodes (12): _(), annotate(), applyConstraint(), applyCustomQuery(), applyQuery(), applySelector(), getRule(), makeNode() (+4 more)

### Community 15 - "MathJax HTML Generation"
Cohesion: 0.09
Nodes (3): generate(), increment(), l()

### Community 16 - "Chat Message Handling"
Cohesion: 0.09
Nodes (25): activateModel, addMessage, convertSpreadsheetToText, detectModels, removeFile, sendMessageWithModel, showStatus, startNewChat (+17 more)

### Community 17 - "MathJax Rule Engine"
Cohesion: 0.11
Nodes (7): compare(), constructor(), e(), match(), n(), setReference(), start()

### Community 18 - "MathJax Layout Engine"
Cohesion: 0.16
Nodes (3): constructString(), g(), t()

### Community 20 - "MathJax Locale Support"
Cohesion: 0.17
Nodes (4): j(), k(), r(), v()

### Community 21 - "MathJax Math Nodes"
Cohesion: 0.13
Nodes (4): createNode_(), makeContentNode(), makeLeafNode(), makeUnprocessed()

### Community 23 - "MathJax Proof Parsing"
Cohesion: 0.27
Nodes (3): getFactory(), makeBranchNode(), parseList()

### Community 26 - "MathJax DOM Utilities"
Cohesion: 0.27
Nodes (8): b(), d(), f(), m(), u(), w(), x(), y()

### Community 38 - "File Processing Pipeline"
Cohesion: 0.33
Nodes (7): handleFileUpload, processCSV, processPDF, processSVG, File Processing Pipeline, PDF Dual-Stream Processing, SVG Canvas Conversion

### Community 48 - "Image Enhancement"
Cohesion: 0.50
Nodes (4): processImageWithOpenCV, progressiveResize, OpenCV-Inspired Image Enhancement, Progressive Resizing

### Community 50 - "Memory Search"
Cohesion: 0.67
Nodes (3): MemorySystem.calculateRelevanceScore, MemorySystem.searchConversations, MemoryUI.refreshMemoryList

## Knowledge Gaps
- **39 isolated node(s):** `pdfImageContents`, `conversationHistory`, `name`, `short_name`, `description` (+34 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `s()` connect `MathJax State Management` to `Syntax Highlighting`, `MathJax Accessibility`, `MathJax Math Operators`, `MathJax Attribute Parsing`, `MathJax Node Assembly`, `MathJax String Parsing`, `MathJax Table Navigation`, `MathJax Core Engine`, `MathJax HTML Generation`, `MathJax Rule Engine`, `MathJax Layout Engine`, `MathJax Speech Output`, `MathJax Locale Support`, `MathJax Math Nodes`, `MathJax Speech Generation`, `MathJax Rule Definition`, `MathJax Unit Translation`, `MathJax DOM Utilities`, `MathJax Action Handling`, `MathJax Markup Assembly`, `MathJax Semantic Tree`, `MathJax Table Rules`, `MathJax Punctuation Tree`, `MathJax XML Attributes`, `MathJax Style Preferences`, `MathJax Meaning Collation`, `MathJax Speech Summary`, `MathJax Multiscript`, `MathJax Accent Rules`, `MathJax Prosody`, `MathJax Visual Retrieval`?**
  _High betweenness centrality (0.199) - this node is a cross-community bridge._
- **Why does `i()` connect `MathJax Speech Output` to `MathJax Accessibility`, `MathJax Math Operators`, `MathJax State Management`, `MathJax Attribute Parsing`, `MathJax Node Assembly`, `MathJax String Parsing`, `MathJax Table Navigation`, `MathJax Core Engine`, `MathJax HTML Generation`, `MathJax Rule Engine`, `MathJax Layout Engine`, `MathJax Locale Support`, `MathJax Speech Generation`, `MathJax Unit Translation`, `MathJax DOM Utilities`, `MathJax Markup Assembly`, `MathJax Semantic Tree`, `MathJax Punctuation Tree`, `MathJax Rule Enumeration`, `MathJax Meaning Collation`, `MathJax Dynamic Rules`, `MathJax Prosody`, `MathJax Highlight Events`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `c()` connect `MathJax Math Operators` to `MathJax State Management`, `MathJax Attribute Parsing`, `MathJax Node Assembly`, `MathJax String Parsing`, `MathJax Table Navigation`, `MathJax Core Engine`, `MathJax HTML Generation`, `MathJax Rule Engine`, `MathJax Layout Engine`, `MathJax Speech Output`, `MathJax Locale Support`, `MathJax Math Nodes`, `MathJax Proof Parsing`, `MathJax Unit Translation`, `MathJax DOM Utilities`, `MathJax Fence Parsing`, `MathJax Punctuation Tree`, `MathJax Function Parsing`, `MathJax Style Preferences`, `MathJax Semantic Labels`, `MathJax Rule Lookup`, `MathJax Accent Rules`, `MathJax Debug Output`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Are the 5 inferred relationships involving `s()` (e.g. with `.constructor()` and `.openNode()`) actually correct?**
  _`s()` has 5 INFERRED edges - model-reasoned connections that need verification._
- **What connects `pdfImageContents`, `conversationHistory`, `name` to the rest of the system?**
  _41 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Markdown Parsing` be split into smaller, more focused modules?**
  _Cohesion score 0.07142857142857142 - nodes in this community are weakly interconnected._
- **Should `Chat UI Logic` be split into smaller, more focused modules?**
  _Cohesion score 0.06734006734006734 - nodes in this community are weakly interconnected._