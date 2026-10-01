(() => {
  const VERSION = "v 0.14";
  const el = document.createElement("div");
  el.textContent = VERSION;
  el.style.cssText = [
    "position:fixed",
    "right:10px",
    "bottom:8px",
    "font:16px/1 'VT323','Courier New',monospace",
    "color:rgba(26,26,46,.6)",
    "pointer-events:none",
    "user-select:none",
    "z-index:2000"
  ].join(";");
  document.body.appendChild(el);
})();