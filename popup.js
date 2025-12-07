const bookmarksList = document.getElementById('bookmarksList');
const responseDiv = document.getElementById('response');
const promptInput = document.getElementById('prompt');
const sendBtn = document.getElementById('send');
const explainBtn = document.getElementById('explain-selection');
const summarizeBtn = document.getElementById('summarize-page');
const clearBtn = document.getElementById('clear');
const notes = document.getElementById('notes');
const openOptions = document.getElementById('open-options');

// --- 1. Bookmarks Logic ---
function renderBookmarks(nodes, container) {
  nodes.forEach(node => {
    let title = node.title;
    if (title === 'Bookmarks bar') return; 
    if (title === 'Other bookmarks') title = 'Bookmarks'; 

    if (node.url) {
      const el = document.createElement('a');
      el.className = 'bookmark-item';
      el.textContent = title || 'Link';
      el.href = node.url;
      el.target = "_blank";
      container.appendChild(el);
    } else if (node.children) {
      const folderDiv = document.createElement('div');
      if (title) {
        const t = document.createElement('div');
        t.className = 'folder-title';
        t.textContent = '📂 ' + title;
        folderDiv.appendChild(t);
      }
      const childBox = document.createElement('div');
      childBox.style.paddingLeft = '8px';
      folderDiv.appendChild(childBox);
      renderBookmarks(node.children, childBox);
      container.appendChild(folderDiv);
    }
  });
}

chrome.bookmarks.getTree((tree) => {
  bookmarksList.innerHTML = '';
  if (tree[0] && tree[0].children) {
    renderBookmarks(tree[0].children, bookmarksList);
  }
});

// --- Navigation ---
openOptions.addEventListener('click', () => chrome.runtime.openOptionsPage());

// --- 2. Chat Helper ---
function appendMessage(role, text) {
  const div = document.createElement('div');
  div.className = role === 'user' ? 'msg-user' : 'msg-ai';
  if (role === 'ai' && text.includes('```')) {
     text = text.replace(/```([\s\S]*?)```/g, '<pre style="background:#222;color:#eee;padding:5px;border-radius:4px;overflow:auto;"><code>$1</code></pre>');
     div.innerHTML = text;
  } else {
     div.textContent = text;
  }
  responseDiv.appendChild(div);
  responseDiv.scrollTop = responseDiv.scrollHeight;
  chrome.storage.local.set({ chat_history: responseDiv.innerHTML });
}

chrome.storage.local.get(['chat_history'], (res) => {
  if (res.chat_history) responseDiv.innerHTML = res.chat_history;
});

// --- 3. LOCAL AI FUNCTION (Ollama) ---
async function callOpenAI(userPrompt) {
  if (!userPrompt) return;

  // Handle Summary Prompt display
  if(userPrompt.startsWith("Summarize this webpage content")) {
    appendMessage('user', "📄 Summarize this page...");
  } else {
    appendMessage('user', userPrompt);
  }
  
  promptInput.value = '';

  // Show "Thinking" Loader
  const loadDiv = document.createElement('div');
  loadDiv.className = 'msg-ai';
  loadDiv.textContent = 'Thinking (Locally)...';
  loadDiv.id = 'loader';
  responseDiv.appendChild(loadDiv);
  responseDiv.scrollTop = responseDiv.scrollHeight;

  try {
    // CONNECT TO LOCAL OLLAMA
    const r = await fetch('http://localhost:11434/api/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: "llama3.2", // <--- The smarter 3B Model
        messages: [{ role: "user", content: userPrompt }],
        stream: false
      })
    });

    if (!r.ok) throw new Error("Connection Failed. Is Ollama running?");

    const data = await r.json();
    const txt = data.message.content;
    
    if(document.getElementById('loader')) document.getElementById('loader').remove();
    appendMessage('ai', txt);

  } catch (err) {
    if(document.getElementById('loader')) document.getElementById('loader').remove();
    appendMessage('ai', '⚠️ Error: Make sure you ran "ollama run llama3.2" and the server is running correctly.');
  }
}

sendBtn.addEventListener('click', () => callOpenAI(promptInput.value.trim()));
promptInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); callOpenAI(promptInput.value.trim()); }
});

// Explain Selection
explainBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => window.getSelection().toString()
  }, (results) => {
    if (results && results[0] && results[0].result) {
      callOpenAI("Define this simply:\n" + results[0].result);
    } else {
      appendMessage('ai', 'Highlight text first!');
    }
  });
});

// Summarize Page
summarizeBtn.addEventListener('click', async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    function: () => document.body.innerText
  }, (results) => {
    if (results && results[0] && results[0].result) {
      const pageText = results[0].result.substring(0, 6000);
      callOpenAI("Summarize this in 3 short bullet points:\n\n" + pageText);
    } else {
      appendMessage('ai', '⚠️ Could not read page text.');
    }
  });
});

clearBtn.addEventListener('click', () => {
  responseDiv.innerHTML = '<div class="msg-ai">Chat cleared.</div>';
  chrome.storage.local.remove('chat_history');
});

// Extras
notes.addEventListener('input', () => chrome.storage.local.set({ quick_notes: notes.value }));
chrome.storage.local.get(['quick_notes'], (res) => notes.value = res.quick_notes || '');

document.getElementById('toggle-dark').addEventListener('click', () => {
  document.body.classList.toggle('dark');
  chrome.storage.sync.set({ dark_mode: document.body.classList.contains('dark') });
});
chrome.storage.sync.get(['dark_mode'], (res) => { if (res.dark_mode) document.body.classList.add('dark'); });

// To-Do Logic
const todoList = document.getElementById('todo-list');
const todoInput = document.getElementById('todo-input');
const addTodo = document.getElementById('add-todo');
function renderTodos(items) {
  todoList.innerHTML = '';
  items.forEach((t, i) => {
    const d = document.createElement('div');
    d.style.cssText = 'display:flex;justify-content:space-between;background:rgba(0,0,0,0.05);padding:4px;margin-bottom:2px;border-radius:4px;font-size:12px;';
    d.innerHTML = `<span>${t}</span>`;
    const b = document.createElement('span');
    b.textContent = '✕';
    b.style.cursor='pointer';
    b.onclick = () => { items.splice(i,1); chrome.storage.local.set({todos:items}); renderTodos(items); };
    d.appendChild(b);
    todoList.appendChild(d);
  });
}
chrome.storage.local.get(['todos'], (res) => renderTodos(res.todos || []));
addTodo.onclick = () => {
  const v = todoInput.value.trim();
  if(!v)return;
  chrome.storage.local.get(['todos'], (res) => { const a=res.todos||[]; a.push(v); chrome.storage.local.set({todos:a}); renderTodos(a); });
  todoInput.value='';
};