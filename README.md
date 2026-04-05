# 🧠 Cognis

**Turn your static documents into a dynamic conversation.**

Cognis is a high-performance Retrieval-Augmented Generation (RAG) platform that allows you to upload, vectorize, and chat with your PDF documents.

![Cognis Chat Simulation](https://i.makeagif.com/media/4-05-2026/qjFEPJ.gif)

---

## ✨ Key Features

* **⚡ Real-time RAG Chat**: Instant responses powered by Gemini Flash.
* **📂 Intelligent Ingestion**: Automated PDF parsing and chunking using `pdf-parse-fork`.
* **🎯 Vector Search**: High-precision similarity search using Supabase `pgvector` with 3072-dimensional embeddings.
* **🏷️ Smart Mentions**: Type `@` to filter the AI's context to a specific document.
* **🗑️ Full Data Lifecycle**: Secure upload and one-click deletion (Storage + DB + Vectors).
* **🔒 Secure & Private**: Row Level Security (RLS) ensures you only chat with *your* documents.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Frontend** | Next.js, Tailwind CSS, Shadcn UI |
| **AI Engine** | Gemini Flash, Google Text Embeddings |
| **Database** | Supabase (PostgreSQL + pgvector) |