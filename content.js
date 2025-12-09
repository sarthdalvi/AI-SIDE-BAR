/* content.js - Optimized Dragging with Memory */

console.log("AI Side Bar: Content Script Active");

/* --- 1. SETUP UI ELEMENTS --- */
if (!document.getElementById("ai-float-btn")) {

  // 1. Main Floating Button (Robot)
  const btn = document.createElement("div");
  btn.id = "ai-float-btn";
  btn.innerHTML = "🤖";
  document.body.appendChild(btn);

  // 2. Sidebar Iframe
  const sidebar = document.createElement("iframe");
  sidebar.id = "ai-sidebar";
  sidebar.src = chrome.runtime.getURL("sidebar.html");
  sidebar.allow = "microphone *"; 
  document.body.appendChild(sidebar);

  // 3. Simple Context Menu
  const contextBtn = document.createElement("div");
  contextBtn.id = "ai-context-btn";
  contextBtn.textContent = "✨ Explain";
  document.body.appendChild(contextBtn);

  /* --- 2. STYLES --- */
  const style = document.createElement("style");
  style.textContent = `
    #ai-float-btn {
      position: fixed; 
      /* Default position (will be overwritten by storage) */
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
      cursor: grab; 
      z-index: 2147483647; 
      font-size: 24px;
      box-shadow: 0 4px 14px rgba(0,0,0,0.3);
      transition: transform 0.1s ease-out; /* Smooth hover only */
      user-select: none;
      touch-action: none; /* Better touch support */
    }
    #ai-float-btn:active { cursor: grabbing; transform: scale(0.95); }
    
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
      display: none; position: absolute; z-index: 2147483647;
      background: #1f2937; color: white; 
      padding: 8px 12px; border-radius: 6px;
      font-family: sans-serif; font-size: 13px; font-weight: bold;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      animation: popIn 0.15s ease-out;
      border: 1px solid #374151;
    }
    #ai-context-btn:hover { background: #000; transform: scale(1.05); }

    @keyframes popIn {
      from { opacity: 0; transform: scale(0.8); }
      to { opacity: 1; transform: scale(1); }
    }
  `;
  document.head.appendChild(style);

  /* --- 3. RESTORE POSITION (Memory) --- */
  chrome.storage.local.get(["robotPos"], (result) => {
    if (result.robotPos) {
      const { x, y } = result.robotPos;
      // Ensure it's still on screen (in case window resized)
      const safeX = Math.min(window.innerWidth - 60, Math.max(10, x));
      const safeY = Math.min(window.innerHeight - 60, Math.max(10, y));
      
      btn.style.left = `${safeX}px`;
      btn.style.top = `${safeY}px`;
      btn.style.right = "auto";
      btn.style.bottom = "auto";
    }
  });

  /* --- 4. OPTIMIZED DRAG LOGIC --- */
  let isDragging = false;
  let startX, startY, initialLeft, initialTop;
  let dragThreshold = 0; // Tracks total movement distance

  btn.addEventListener("mousedown", (e) => {
    isDragging = true;
    dragThreshold = 0; // Reset movement counter
    
    // Calculate offset
    const rect = btn.getBoundingClientRect();
    startX = e.clientX;
    startY = e.clientY;
    initialLeft = rect.left;
    initialTop = rect.top;
    
    // Remove transition for instant response
    btn.style.transition = "none";
  });

  document.addEventListener("mousemove", (e) => {
    if (!isDragging) return;
    
    e.preventDefault(); 

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;
    
    // Track total movement to distinguish click vs drag
    dragThreshold += Math.abs(e.movementX) + Math.abs(e.movementY);

    // Calculate new pos
    let newLeft = initialLeft + dx;
    let newTop = initialTop + dy;

    // Boundaries
    const maxW = window.innerWidth - 60;
    const maxH = window.innerHeight - 60;
    newLeft = Math.max(10, Math.min(newLeft, maxW));
    newTop = Math.max(10, Math.min(newTop, maxH));

    btn.style.left = `${newLeft}px`;
    btn.style.top = `${newTop}px`;
    btn.style.right = "auto";
    btn.style.bottom = "auto";
  });

  document.addEventListener("mouseup", () => {
    if (!isDragging) return;
    
    isDragging = false;
    btn.style.transition = "transform 0.1s"; // Restore hover effect

    // Save Position to Storage
    const rect = btn.getBoundingClientRect();
    chrome.storage.local.set({ 
      robotPos: { x: rect.left, y: rect.top } 
    });
  });

  // Smart Click: Only open sidebar if we didn't drag much
  btn.addEventListener("click", (e) => {
    // If moved less than 5 pixels, it's a click. Otherwise, it was a drag.
    if (dragThreshold < 5) {
      sidebar.classList.toggle("open");
    }
  });

  /* --- 5. CONTEXT MENU & MESSAGING --- */
  
  // Selection Logic
  document.addEventListener("mouseup", (e) => {
    if (isDragging || dragThreshold > 5) return;

    setTimeout(() => {
      const sel = window.getSelection().toString().trim();
      if (contextBtn.contains(e.target)) return;

      if (sel.length > 0) {
        contextBtn.style.display = "block";
        contextBtn.style.top = `${e.pageY + 10}px`;
        contextBtn.style.left = `${e.pageX + 10}px`;
      } else {
        contextBtn.style.display = "none";
      }
    }, 10);
  });

  // Handle "Explain"
  contextBtn.onmousedown = (e) => {
    e.preventDefault();
    const sel = window.getSelection().toString().trim();
    if (sel) {
      sidebar.classList.add("open");
      sidebar.contentWindow.postMessage({ action: "askAI", text: "Explain this:\n" + sel }, "*");
    }
    contextBtn.style.display = "none";
  };

  // Hide on background click
  document.addEventListener("mousedown", (e) => {
    if (e.target !== contextBtn && e.target !== btn) {
      contextBtn.style.display = "none";
    }
  });

  // Messaging
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

  // Close Sidebar Listener
  window.addEventListener("message", (event) => {
    if (event.data.action === "closeSidebar") {
      sidebar.classList.remove("open");
    }
  });
}