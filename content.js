/* content.js - Full Feature Set with PDF Exclusion */

// 1. PDF CHECK (New)
// If the page is a PDF, stop immediately so nothing appears.
if (document.contentType === 'application/pdf' || window.location.href.toLowerCase().endsWith('.pdf')) {
  console.log("AI Side Bar: PDF detected. Stopping extension.");
  // We stop the script here by wrapping the rest in an 'else' block or just returning (if function).
  // Since this is top-level, we'll wrap the main logic in a condition.
} else {

  console.log("AI Side Bar: Content Script Active");

  /* --- 2. SETUP UI ELEMENTS --- */

  // Check if already injected to avoid duplicates
  if (!document.getElementById("ai-float-btn")) {

    // Main Floating Button (Robot)
    const btn = document.createElement("div");
    btn.id = "ai-float-btn";
    btn.innerHTML = "🤖";
    document.body.appendChild(btn);

    // Sidebar Iframe
    const sidebar = document.createElement("iframe");
    sidebar.id = "ai-sidebar";
    sidebar.src = chrome.runtime.getURL("sidebar.html");
    sidebar.allow = "microphone *"; 
    document.body.appendChild(sidebar);

    // Draggable Context Menu
    const contextBtn = document.createElement("div");
    contextBtn.id = "ai-context-btn";
    contextBtn.innerHTML = `
      <div id="ai-drag-handle" title="Drag to move">⋮⋮</div>
      <div id="ai-btn-text">✨ Explain</div>
      <div id="ai-close-btn" title="Close">✕</div>
    `;
    document.body.appendChild(contextBtn);

    /* --- 3. STYLES --- */
    // Note: If you moved styles to content.css, you can remove this block.
    // If you kept them here, leave them. This ensures it works either way.
    const style = document.createElement("style");
    style.textContent = `
      #ai-float-btn {
        position: fixed; right: 20px; bottom: 20px;
        background: #4f46e5; color: white;
        width: 50px; height: 50px;
        display: flex; justify-content: center; align-items: center;
        border-radius: 50%; cursor: pointer;
        z-index: 2147483647; font-size: 24px;
        box-shadow: 0 4px 14px rgba(0,0,0,0.3);
        transition: transform 0.2s;
      }
      #ai-float-btn:hover { transform: scale(1.1); }
      
      #ai-sidebar {
        position: fixed; top: 0; right: -450px;
        width: 450px; height: 100vh;
        background: white; border: none;
        box-shadow: -5px 0 15px rgba(0,0,0,0.1);
        z-index: 2147483647;
        transition: right 0.3s cubic-bezier(0.25, 0.8, 0.25, 1);
      }
      #ai-sidebar.open { right: 0; }

      #ai-context-btn {
        display: none; position: fixed; z-index: 2147483647;
        background: #1f2937; color: white; border-radius: 8px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
        padding: 0; overflow: hidden; font-family: sans-serif; font-size: 13px;
        align-items: center; flex-direction: row;
        user-select: none;
      }
      #ai-drag-handle {
        padding: 8px; background: #374151; cursor: grab; color: #9ca3af;
      }
      #ai-drag-handle:active { cursor: grabbing; background: #4b5563; }
      
      #ai-btn-text {
        padding: 8px 12px; cursor: pointer; font-weight: bold; border-right: 1px solid #374151;
      }
      #ai-btn-text:hover { background: #374151; color: #60a5fa; }

      #ai-close-btn {
        padding: 8px 10px; cursor: pointer; color: #ef4444; font-weight: bold;
      }
      #ai-close-btn:hover { background: #374151; color: #f87171; }
    `;
    document.head.appendChild(style);

    /* --- 4. LOGIC --- */

    // Toggle Sidebar
    btn.onclick = () => sidebar.classList.toggle("open");

    // Dragging Logic
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    const dragHandle = contextBtn.querySelector("#ai-drag-handle");

    dragHandle.onmousedown = (e) => {
      isDragging = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = contextBtn.getBoundingClientRect();
      initialLeft = rect.left;
      initialTop = rect.top;
      contextBtn.style.cursor = "grabbing";
      e.preventDefault(); 
    };

    document.addEventListener("mousemove", (e) => {
      if (isDragging) {
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        contextBtn.style.left = `${initialLeft + dx}px`;
        contextBtn.style.top = `${initialTop + dy}px`;
      }
    });

    document.addEventListener("mouseup", () => {
      isDragging = false;
      contextBtn.style.cursor = "default";
    });

    // Text Selection Logic
    document.addEventListener("mouseup", (e) => {
      if (isDragging) return; 
      
      setTimeout(() => {
        const sel = window.getSelection().toString().trim();
        if (contextBtn.contains(e.target)) return;

        if (sel.length > 0) {
          contextBtn.style.display = "flex";
          contextBtn.style.top = `${e.pageY + 10}px`;
          contextBtn.style.left = `${e.pageX + 10}px`;
        } else {
          contextBtn.style.display = "none";
        }
      }, 10);
    });

    // Explain Button Click
    document.getElementById("ai-btn-text").onclick = () => {
      const sel = window.getSelection().toString().trim();
      if (sel) {
        sidebar.classList.add("open");
        sidebar.contentWindow.postMessage({ action: "askAI", text: "Explain this:\n" + sel }, "*");
      }
    };

    // Close Button Click
    document.getElementById("ai-close-btn").onclick = (e) => {
      e.stopPropagation(); 
      contextBtn.style.display = "none";
      window.getSelection().removeAllRanges(); 
    };

    /* --- 5. MESSAGING SYSTEM --- */
    
    // Listen for Background Commands
    chrome.runtime.onMessage.addListener((msg) => {
      if (msg.action === "toggleSidebar") sidebar.classList.toggle("open");
      
      if (msg.action === "toggleVoice") {
        sidebar.classList.add("open");
        sidebar.contentWindow.postMessage({ action: "startVoice" }, "*");
      }
      
      if (msg.action === "focusInput") {
        sidebar.classList.add("open");
        sidebar.contentWindow.postMessage({ action: "focusInput" }, "*");
      }
      
      if (msg.action === "summarize") {
        sidebar.classList.add("open");
        const text = document.body.innerText.substring(0, 6000);
        sidebar.contentWindow.postMessage({ action: "summarize", text: text }, "*");
      }
    });

    // Listen for Back Arrow from Sidebar
    window.addEventListener("message", (event) => {
      if (event.data.action === "closeSidebar") {
        sidebar.classList.remove("open");
      }
    });
  }
}