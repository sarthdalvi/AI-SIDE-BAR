/* content.js - Fixed: Completely ignore PDF files */

// --- 1. STOP IF PDF ---
// This check runs first. If it's a PDF, we quit immediately.
if (document.contentType === 'application/pdf' || window.location.href.toLowerCase().endsWith('.pdf')) {
  console.log("AI Side Bar: PDF detected. Stopping extension.");
  // We do NOT run the rest of the code.
} else {
  
  // Only run the extension if it is NOT a PDF
  initExtension();
}

function initExtension() {
  console.log("AI Side Bar: Content Script Active");

  /* --- 2. SETUP UI ELEMENTS --- */
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

    /* --- 3. RESTORE POSITION (Memory) --- */
    chrome.storage.local.get(["robotPos"], (result) => {
      if (result.robotPos) {
        const { x, y } = result.robotPos;
        const safeX = Math.min(window.innerWidth - 60, Math.max(10, x));
        const safeY = Math.min(window.innerHeight - 60, Math.max(10, y));
        
        btn.style.left = `${safeX}px`;
        btn.style.top = `${safeY}px`;
        btn.style.right = "auto";
        btn.style.bottom = "auto";
      }
    });

    /* --- 4. DRAG LOGIC --- */
    let isDragging = false;
    let startX, startY, initialLeft, initialTop;
    let dragThreshold = 0; 

    btn.addEventListener("mousedown", (e) => {
      isDragging = true;
      dragThreshold = 0; 
      
      const rect = btn.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      initialLeft = rect.left;
      initialTop = rect.top;
      
      btn.style.transition = "none";
    });

    document.addEventListener("mousemove", (e) => {
      if (!isDragging) return;
      e.preventDefault(); 

      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      
      dragThreshold += Math.abs(e.movementX) + Math.abs(e.movementY);

      let newLeft = initialLeft + dx;
      let newTop = initialTop + dy;

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
      btn.style.transition = "transform 0.1s ease-out"; 

      const rect = btn.getBoundingClientRect();
      chrome.storage.local.set({ 
        robotPos: { x: rect.left, y: rect.top } 
      });
    });

    btn.addEventListener("click", (e) => {
      if (dragThreshold < 5) {
        sidebar.classList.toggle("open");
      }
    });

    /* --- 5. CONTEXT MENU & MESSAGING --- */
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

    contextBtn.onmousedown = (e) => {
      e.preventDefault();
      const sel = window.getSelection().toString().trim();
      if (sel) {
        sidebar.classList.add("open");
        sidebar.contentWindow.postMessage({ action: "askAI", text: "Explain this:\n" + sel }, "*");
      }
      contextBtn.style.display = "none";
    };

    document.addEventListener("mousedown", (e) => {
      if (e.target !== contextBtn && e.target !== btn) {
        contextBtn.style.display = "none";
      }
    });

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

    window.addEventListener("message", (event) => {
      if (event.data.action === "closeSidebar") {
        sidebar.classList.remove("open");
      }
    });
  }
}