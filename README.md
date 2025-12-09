🤖 AI Side Bar — Local & Powerful AI Sidebar for Chrome

A clean, modern Chrome extension that brings a floating AI assistant directly into your browser — with local offline AI (Ollama Llama 3.2), voice chat, webpage tools, summarization, and more.

This extension is:

✔️ Free
✔️ Offline-capable
✔️ Privacy-friendly (local processing)
✔️ Works with Ollama, LM Studio, and OpenAI API (optional)


✨ Features
🧠 Local or Cloud AI Chat

Fully offline using Llama 3.2 (1B / 3B)

Smart responses: explanations, translations, code help, Q&A

Optionally switch to OpenAI API

🎤 Voice AI Chat

Speech-to-Text input

AI Talkback (Text-to-Speech output)

No setup needed — works instantly

Toggle with 🔊 button or shortcut

🪟 Floating Sidebar (Real-Time)

Appears on any website

Smooth slide-in animation

Can open via UI button or keyboard

Includes full chat interface inside the sidebar

📘 Explain Selected Text

Highlight → Auto “✨ Explain” button appears
Click to instantly get an AI explanation of selected text.

📄 Smart Page Summarizer

Summaries in clean 3 bullet-point format

Uses your local AI model

Works even offline

📝 Notes + To-Do Manager

Multi Notes

To-Do Checklist

Auto-saved locally

No login, no cloud, no tracking

🌙 Dark Mode

Smooth, modern UI

Saves your theme preference

⭐ Enhanced New Tab Page

Includes:

Search

Bookmarks

Quick Tools

Clean customizable layout

⚡ Keyboard Shortcuts
Action	Shortcut
Toggle Sidebar	Alt + X
Focus AI Input	Alt + A
Summarize Page	Alt + S
Voice Mode	Alt + V

Manage shortcuts here:
➡ chrome://extensions/shortcuts

📂 Project Structure
AI-SIDE-BAR/
│
├── icons/                     # Extension icons
│
├── vendor/                    # Voice / PDF / utility tools
│
├── manifest.json              # Chrome extension manifest (v3)
├── background.js              # Service worker
│
├── content.js                 # Injects floating sidebar into webpages
│
├── sidebar.html               # Sidebar UI
├── sidebar.js                 # Sidebar logic
│
├── popup.html                 # Extension popup UI
├── popup.js                   # Popup actions
│
├── options.html               # Settings page
├── options.js                 # Settings page logic
│
├── newtab.html                # Custom AI-powered new tab
├── newtab.js                  # New tab logic
│
├── StartAI.bat                # Windows launcher for Ollama (optional)
│
├── LICENSE                    # MIT License
└── README.md                  # Full documentation

🛠️ Local AI Setup (Ollama Required)

Since the extension runs 100% locally, install the AI engine first.

1️⃣ Install Ollama

➡ https://ollama.com/download

2️⃣ Pull the Model
ollama pull llama3.2:3b

3️⃣ Run the Model
ollama run llama3.2:3b

🚀 Install Extension (Chrome)
1️⃣ Download

GitHub → Code → Download ZIP

Extract the folder

2️⃣ Enable Dev Mode

Visit: chrome://extensions/
Toggle Developer Mode

3️⃣ Load Into Chrome

Click Load Unpacked → Choose AI-SIDE-BAR/

Done! 🎉

🎤 Voice AI Setup

Nothing extra needed.

Works via Web Speech API

Allows mic when Chrome prompts

Supports both STT + TTS

❓ Troubleshooting
🔌 Connection Failed

Is Ollama running?

Did you open StartAI.bat (Windows)?

Did you install the model (ollama pull)?

🎤 Voice Not Working

Check mic permissions in extension settings

Refresh the page

Ensure mic isn’t muted

📦 Share With Friends

Anyone can use your extension:

Download ZIP

Load as Unpacked

(Optional) Install Ollama for local AI

Done

No login.
No API key required.
No cost.

📜 License

This project is licensed under the MIT License.
You are free to use, modify, and distribute it.

If you like this project, drop a star ⭐ on the repo!