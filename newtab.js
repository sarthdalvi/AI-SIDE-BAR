// newtab.js

// 1. Load Bookmarks
chrome.bookmarks.getTree((t) => {
  const bm = document.getElementById('bm');
  const first = (t[0] && t[0].children && t[0].children[0]) || null;
  
  if (first && first.children) {
    first.children.slice(0, 8).forEach(b => {
      if (b.url) {
        const a = document.createElement('a');
        a.href = b.url;
        a.textContent = b.title || b.url;
        bm.appendChild(a);
      }
    });
  } else {
    bm.textContent = "No bookmarks found in first folder.";
  }
});

// 2. Build Calendar
function buildCalendar() {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  let html = `<b>${now.toLocaleString('default', { month: 'long' })} ${year}</b><br><br>`;
  html += 'Su Mo Tu We Th Fr Sa<br>';

  for (let i = 0; i < firstDay; i++) html += '&nbsp;&nbsp;&nbsp;';
  for (let d = 1; d <= daysInMonth; d++) {
    html += (d === now.getDate()) ? `<b>[${d}]</b> ` : ((d < 10 ? ' ' : '') + d + ' ');
    if ((d + firstDay) % 7 === 0) html += '<br>';
  }
  document.getElementById('calendar').innerHTML = html;
}

buildCalendar();