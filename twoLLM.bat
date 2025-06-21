@echo off
set OLLAMA_MAX_LOADED_MODELS= 2
set OLLAMA_NUM_PARALLEL=2
set OLLAMA_ORIGINS=* && ollama serve
echo Environment variables have been set. 
