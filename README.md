# intern-learning


Hi, I am Barsarani Sahoo.

This repository contains my 4-week Python internship work including:

- Python basics
- Flask applications
- Git & GitHub workflows
- Docker basics
- Deployment tasks
- Machine learning fundamentals

This internship is focused on building real-world development skills through hands-on projects and daily tasks.
## Day 2 Update
- Created GitHub repository
- Learned Git branching
- Practiced commits and push workflow
## Day 3 Update
Created CLI To-Do App using Python  
Learned file handling and basic command-line operations  
Practiced Git commit and push workflow  

## Day 4 Update
Built Notes App using React (Vite)  
Learned useState for managing notes  
Implemented add and delete functionality  
Practiced frontend state management


## Day 5 Update
- Built a FastAPI backend API and Dockerized it  
- Created `/about` endpoint returning JSON response  
- Learned FastAPI routing and basic API development  
- Containerized application using Docker and understood port mapping  

## Day 6 Update – AI Use Cases

- Researched 10 AI use cases in engineering domains
- Mapped each use case to AI capability (Text, Code, Vision, Extraction, Agent)
- Defined input and output for all use cases
- Selected **Resume Screening** as the first project to build
- Wrote justification for choosing Resume Screening

### Selected Project:
- Resume Screening AI System
- Input: Resume + Job Description
- Output: Match score, matched skills, missing skills, recommendation

### Learning:
- Learned how real-world problems map to AI solutions

## Day 7 – Prompt Library

Built a library of production-ready AI prompts for:

- Resume bullet generation
- Document summarization (JSON)
- Meeting action item extraction
- Error message rewriting
- Professional email generation

Each prompt includes:
- System Message
- User Template
- Example Output

The resume and document summary prompts also include **v1 vs v2** improvements.

## Day8 Update

- Loaded Gemini API key from `.env`
- Added `.env.example` for configuration
- Read input document from a file path argument
- Used a summarization prompt from the prompt library
- Called the Gemini API to generate a summary
- Parsed and printed structured JSON fields
- Added error handling for:
  - Missing API key
  - Failed API requests

  ## Day9 Update

- Read a document from `document.txt`
- Chunked the document into configurable chunks
- Generated embeddings using Gemini Embedding API
- Saved chunks and embeddings to `chunks_embeddings.json`
- Retrieved the top 3 most similar chunks using cosine similarity
- Generated concise answers using Gemini 2.5 Flash based on the retrieved context