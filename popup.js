const responseDiv = document.getElementById("response");
const promptInput = document.getElementById("prompt");
const sendBtn = document.getElementById("send");
const micBtn = document.getElementById("micBtn");
const speakToggle = document.getElementById("speakToggle");
const clearBtn = document.getElementById("clear");
const openOptions = document.getElementById("open-options");
const bookmarksList = document.getElementById('bookmarksList');

// Notes & Todo
const notesList = document.getElementById('notes-list');
const noteInput = document.getElementById('note-input');
const addNoteBtn = document.getElementById('add-note');
const todoList = document.getElementById('todo-list');
const todoInput = document.getElementById('todo-input');
const addTodo = document.getElementById('add-todo');

// CONFIG
let speakEnabled = true;
let listening = false;
const OLLAMA_MODEL = "llama3.2"; 

// --- HELPER FUNCTIONS ---
function appendMessage(role, text) {
  const div = document.createElement("div");
  div.className = role === "user" ? "msg-user" : "msg-ai";
  if (role === 'ai' && text.includes('```')) {
     text = text.replace(/```([\s\S]*?)```/g, '<pre style="background:#222;color:#eee;padding:5px;border-radius:4px;overflow:auto;"><code>$1</code></pre>');
     div.innerHTML = text;
  } else {
     div.textContent = text;
  }
  responseDiv.appendChild(div);
  responseDiv.scrollTop = responseDiv.scrollHeight;
}

// Fixed Speech Function
function speakText(text) {
  if (!speakEnabled) return;
  window.speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.rate = 1.0; 
  window.speechSynthesis.speak(utter);
}

// Toggle Button
speakToggle.addEventListener("click", () => {
  speakEnabled = !speakEnabled;
  speakToggle.style.opacity = speakEnabled ? "1" : "0.4";
  speakToggle.textContent = speakEnabled ? "🔊" : "🔇";
  if (!speakEnabled) window.speechSynthesis.cancel();
});

// --- CORE AI FUNCTION ---
async function callOllama(prompt) {
  let displayPrompt = prompt;
  if (prompt.length > 60) displayPrompt = "📄 [Sending Selection...]";
  
  appendMessage("user", displayPrompt);
  promptInput.value = "";
  
  const loading = document.createElement("div");
  loading.className = "msg-ai";
  loading.textContent = "Thinking...";
  loading.id = "loader";
  responseDiv.appendChild(loading);

  try {
    const r = await fetch("http://localhost:11434/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ model: OLLAMA_MODEL, messages: [{ role: "user", content: prompt }], stream: false })
    });
    
    if (!r.ok) throw new Error("Ollama Error");
    const data = await r.json();
    const text = data?.message?.content || "No response";
    
    document.getElementById("loader")?.remove();
    appendMessage("ai", text);
    speakText(text);
  } catch (e) {
    document.getElementById("loader")?.remove();
    appendMessage("ai", "⚠️ Connection failed. Run `StartAI.bat`!");
  }
}

sendBtn.addEventListener("click", () => {
  const v = promptInput.value.trim();
  if(v) callOllama(v);
});
promptInput.addEventListener("keydown", (e) => {
  if(e.key==="Enter" && !e.shiftKey) { e.preventDefault(); sendBtn.click(); }
});
clearBtn.addEventListener("click", () => {
  responseDiv.innerHTML = '';
  window.speechSynthesis.cancel();
});
openOptions.addEventListener("click", () => chrome.runtime.openOptionsPage());

// Microphone
let recognition;
if ("webkitSpeechRecognition" in window) {
  recognition = new webkitSpeechRecognition();
  recognition.continuous = false;
  recognition.lang = "en-US";
  recognition.onstart = () => { listening = true; micBtn.style.opacity = "0.5"; };
  recognition.onend = () => { listening = false; micBtn.style.opacity = "1"; };
  recognition.onresult = (e) => {
    const text = e.results[0][0].transcript;
    promptInput.value = text;
    sendBtn.click();
  };
}
micBtn.addEventListener("click", () => {
  if (listening) recognition.stop();
  else recognition.start();
});

// --- BOOKMARKS ---
function renderBookmarks(nodes, container) {
  nodes.forEach(node => {
    let title = node.title;
    if (title === 'Bookmarks bar') return; 
    if (title === 'Other bookmarks') title = 'Bookmarks'; 
    if (node.url) {
      const el = document.createElement('div');
      el.style.padding="4px"; el.style.fontSize="12px"; el.style.cursor="pointer";
      el.style.whiteSpace="nowrap"; el.style.overflow="hidden"; el.style.textOverflow="ellipsis";
      el.textContent = "🔗 " + (title || 'Link');
      el.onclick = () => chrome.tabs.create({ url: node.url });
      container.appendChild(el);
    } else if (node.children) renderBookmarks(node.children, container);
  });
}
chrome.bookmarks.getTree((tree) => {
  bookmarksList.innerHTML = '';
  if (tree[0] && tree[0].children) renderBookmarks(tree[0].children, bookmarksList);
});

// --- NOTES & TODO ---
function renderList(storageKey, listElement, items) {
  listElement.innerHTML = '';
  items.forEach((text, i) => {
    const div = document.createElement('div');
    div.className = 'list-item';
    div.textContent = text;
    const del = document.createElement('button');
    del.className = 'list-del';
    del.textContent = '✕';
    del.onclick = () => {
      items.splice(i, 1);
      let saveObj = {}; saveObj[storageKey] = items;
      chrome.storage.local.set(saveObj);
      renderList(storageKey, listElement, items);
    };
    div.appendChild(del);
    listElement.appendChild(div);
  });
}
chrome.storage.local.get(['multi_notes', 'todos'], (res) => {
  renderList('multi_notes', notesList, res.multi_notes || []);
  renderList('todos', todoList, res.todos || []);
});
addNoteBtn.addEventListener('click', () => {
  const t = noteInput.value.trim();
  if (!t) return;
  chrome.storage.local.get(['multi_notes'], (res) => {
    const arr = res.multi_notes || []; arr.push(t);
    chrome.storage.local.set({ multi_notes: arr });
    renderList('multi_notes', notesList, arr);
  });
  noteInput.value = ''; 
});
addTodo.addEventListener('click', () => {
  const t = todoInput.value.trim();
  if (!t) return;
  chrome.storage.local.get(['todos'], (res) => {
    const arr = res.todos || []; arr.push(t);
    chrome.storage.local.set({ todos: arr });
    renderList('todos', todoList, arr);
  });
  todoInput.value = '';
});

// --- LISTEN FOR MESSAGES (The Magic Part) ---
window.addEventListener("message", (event) => {
  const data = event.data;
  if (data.action === "startVoice") micBtn.click();
  if (data.action === "focusInput") promptInput.focus();
  // Handle the "Explain" button click
  if (data.action === "askAI" && data.text) callOllama(data.text);
  if (data.action === "summarize" && data.text) callOllama("Summarize this webpage content in 3 bullet points:\n\n" + data.text);
});
// --- 6. CLOSE SIDEBAR LOGIC ---
const closeSidebarBtn = document.getElementById('close-sidebar');
if (closeSidebarBtn) {
  closeSidebarBtn.addEventListener('click', () => {
    // Send message to parent window (the website) to close the iframe
    window.parent.postMessage({ action: "closeSidebar" }, "*");
  });
}