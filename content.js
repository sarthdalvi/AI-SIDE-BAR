/* 1. Inject Main Floating Button (Bottom Right) */
if (!document.getElementById("ai-float-btn")) {
  const btn = document.createElement("div");
  btn.id = "ai-float-btn";
  btn.innerHTML = "🤖";
  document.body.appendChild(btn);

  /* 2. Create Sidebar Iframe */
  const sidebar = document.createElement("iframe");
  sidebar.id = "ai-sidebar";
  sidebar.src = chrome.runtime.getURL("sidebar.html");
  sidebar.allow = "microphone *"; 
  document.body.appendChild(sidebar);

  /* 3. Create the Floating Context Button (Hidden by default) */
  const contextBtn = document.createElement("div");
  contextBtn.id = "ai-context-btn";
  contextBtn.innerHTML = "✨ Explain";
  document.body.appendChild(contextBtn);

  /* --- TOGGLE LOGIC --- */
  btn.onclick = () => {
    sidebar.classList.toggle("open");
  };

  /* --- CONTEXT MENU LOGIC --- */
  
  // A. Detect Selection
  document.addEventListener("mouseup", (e) => {
    const selectedText = window.getSelection().toString().trim();
    
    if (selectedText.length > 0) {
      // Show button near the mouse
      contextBtn.style.display = "block";
      contextBtn.style.top = `${e.pageY + 10}px`;
      contextBtn.style.left = `${e.pageX + 10}px`;
    } else {
      // Hide if no text selected
      setTimeout(() => {
        // Small delay to allow clicking the button
        if (document.activeElement !== contextBtn) {
           contextBtn.style.display = "none";
        }
      }, 200);
    }
  });

  // B. Handle Button Click
  contextBtn.onmousedown = (e) => {
    e.preventDefault(); // Prevent losing the selection
    const selectedText = window.getSelection().toString().trim();
    
    if (selectedText) {
      sidebar.classList.add("open"); // Open sidebar
      // Send the text to the AI
      sidebar.contentWindow.postMessage({ 
        action: "askAI", 
        text: "Explain this briefly:\n" + selectedText 
      }, "*");
    }
    contextBtn.style.display = "none";
  };

  // C. Hide on click elsewhere
  document.addEventListener("mousedown", (e) => {
    if (e.target.id !== "ai-context-btn") {
      contextBtn.style.display = "none";
    }
  });

  /* 4. Styles */
  const style = document.createElement("style");
  style.textContent = `
    #ai-float-btn {
      position: fixed;
      right: 20px;
      bottom: 20px;
      background: #4f46e5;
      color: white;
      width: 50px;
      height: 50px;
      display: flex;
      justify-content: center;
      align-items: center;
      border-radius: 50%;
      cursor: pointer;
      z-index: 2147483647;
      font-size: 22px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.3);
      transition: transform 0.2s;
    }
    #ai-float-btn:hover { transform: scale(1.1); }
    
    #ai-sidebar {
      position: fixed;
      top: 0;
      right: -450px;
      width: 450px;
      height: 100vh;
      background: white;
      border: none;
      box-shadow: -5px 0 15px rgba(0,0,0,0.1);
      z-index: 2147483647;
      transition: right 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
    }
    #ai-sidebar.open { right: 0; }

    /* New Context Button Style */
    #ai-context-btn {
      display: none;
      position: absolute;
      z-index: 2147483647;
      background: #1f2937;
      color: white;
      padding: 6px 12px;
      border-radius: 6px;
      font-family: sans-serif;
      font-size: 13px;
      font-weight: bold;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      animation: popIn 0.15s ease-out;
    }
    #ai-context-btn:hover { background: #000; transform: scale(1.05); }

    @keyframes popIn {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1); }
    }
  `;
  document.head.appendChild(style);

  /* 5. Listen for Background Commands */
  chrome.runtime.onMessage.addListener((msg) => {
    const sb = document.getElementById("ai-sidebar");

    if (msg.action === "toggle-sidebar") {
      sb.classList.toggle("open");
    }

    if (msg.action === "toggle-voice") {
      sb.classList.add("open");
      sb.contentWindow.postMessage({ action: "startVoice" }, "*");
    }

    if (msg.action === "focus-ai") {
      sb.classList.add("open");
      sb.contentWindow.postMessage({ action: "focusInput" }, "*");
    }
    
    if (msg.action === "summarize-page") {
      sb.classList.add("open");
      const pageText = document.body.innerText.substring(0, 6000);
      sb.contentWindow.postMessage({ action: "summarize", text: pageText }, "*");
    }
  });
}
/* Listen for messages from the Sidebar (Iframe) */
window.addEventListener("message", (event) => {
  if (event.data.action === "closeSidebar") {
    const sb = document.getElementById("ai-sidebar");
    if (sb) sb.classList.remove("open");
  }
});