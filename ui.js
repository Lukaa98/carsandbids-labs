(function() {
  function makeDraggable(el, handle) {
    let isDown = false, startX, startY, startLeft, startTop;

    handle.addEventListener('mousedown', (e) => {
      isDown = true;
      startX = e.clientX;
      startY = e.clientY;
      const rect = el.getBoundingClientRect();
      startLeft = rect.left;
      startTop = rect.top;
      el.style.position = 'fixed';
      el.style.right = 'auto';  // free from bottom-right snap
      el.style.bottom = 'auto';
      e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
      if (!isDown) return;
      const dx = e.clientX - startX;
      const dy = e.clientY - startY;
      el.style.left = startLeft + dx + 'px';
      el.style.top = startTop + dy + 'px';
    });

    document.addEventListener('mouseup', () => { isDown = false; });
  }

  const panel = document.getElementById('cab-url-panel');
  if (panel) {
    const header = panel.querySelector('.cab-url-header');
    if (header) makeDraggable(panel, header);
  }
})();
