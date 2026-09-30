(() => {
  // ---------- Settings ----------
  const SPRITES = ["sprites/otto_reg.png", "sprites/otto_openmouth.png"];
  const TALK_SPEED = 30, MOUTH_SPEED = 120;
  const HIDE_AFTER = 5000;   // text box disappears after 5 seconds
  const APPLE_SIZE = 48;

  // ---------- Dialogue ----------
  const story = {
    start: {
      lines: ["Stop touching me.", "Hey! Knock it off.", "Please stop."],
    },
    fed: {
      lines: ["*munch*", "Yummy."],
    }
  };

  // ---------- Elements ----------
  const img = document.getElementById("npc");
  const box = document.getElementById("npc-box");
  const textEl = document.getElementById("npc-text");
  const choicesEl = document.getElementById("npc-choices");
  const countEl = document.getElementById("apple-count");
  const countNum = document.getElementById("apple-num");
  SPRITES.forEach(s => { new Image().src = s; });

  // ---------- Text box ----------
  let node, idx, typing = false, fullLine = "", typeT, mouthT, hideT;

  function hide() {
    clearTimeout(hideT);
    clearInterval(typeT); clearInterval(mouthT);
    typing = false;
    img.src = SPRITES[0];
    box.style.display = "none";
  }

  function resetHide() {
    clearTimeout(hideT);
    hideT = setTimeout(hide, HIDE_AFTER);
  }

  function positionBox() {
    const o = img.getBoundingClientRect();
    const bw = box.offsetWidth;
    box.style.left = Math.max(10, Math.min(o.left + o.width / 2 - bw / 2, window.innerWidth - bw - 10)) + "px";
    if (o.top < 200) {                       // Otto near the top: put the box below him
      box.style.top = o.bottom + 8 + "px";
      box.style.bottom = "auto";
    } else {                                 // otherwise above his head
      box.style.bottom = window.innerHeight - o.top + 8 + "px";
      box.style.top = "auto";
    }
  }

  function goTo(id) {
    if (!id) { hide(); return; }
    node = story[id]; idx = 0;
    box.style.display = "block";
    positionBox();
    resetHide();
    showLine();
  }

  function showLine() {
    clearInterval(typeT); clearInterval(mouthT);   // safe to interrupt a line mid-typing
    choicesEl.innerHTML = "";
    fullLine = node.lines[idx];
    textEl.textContent = "";
    typing = true;
    let i = 0, f = 0;
    mouthT = setInterval(() => { img.src = SPRITES[++f % 2]; }, MOUTH_SPEED);
    typeT = setInterval(() => {
      textEl.textContent += fullLine[i++];
      if (i >= fullLine.length) finish();
    }, TALK_SPEED);
  }

  function finish() {
    clearInterval(typeT); clearInterval(mouthT);
    img.src = SPRITES[0];
    textEl.textContent = fullLine;
    typing = false;
    if (idx === node.lines.length - 1 && node.choices) {
      node.choices.forEach(c => {
        const b = document.createElement("button");
        b.textContent = c.text;
        b.onclick = e => { e.stopPropagation(); goTo(c.go); };
        choicesEl.appendChild(b);
      });
    }
  }

  // Each poke = say the next "don't touch me" line (and loop)
  function poke() {
    if (box.style.display !== "block" || node !== story.start) { goTo("start"); return; }
    resetHide();
    idx = (idx + 1) % node.lines.length;
    showLine();
  }

  // ---------- Dragging Otto ----------
  let dragging = false, moved = false, startX, startY, offX, offY;

  img.addEventListener("pointerdown", e => {
    e.preventDefault();
    dragging = true; moved = false;
    startX = e.clientX; startY = e.clientY;
    const r = img.getBoundingClientRect();
    offX = e.clientX - r.left;
    offY = e.clientY - r.top;
    img.setPointerCapture(e.pointerId);
  });

  img.addEventListener("pointermove", e => {
    if (!dragging) return;
    if (!moved && Math.abs(e.clientX - startX) + Math.abs(e.clientY - startY) > 5) {
      moved = true;
      poke();                                // he complains once when a drag starts
    }
    if (!moved) return;
    const x = Math.max(0, Math.min(e.clientX - offX, window.innerWidth - img.offsetWidth));
    const y = Math.max(0, Math.min(e.clientY - offY, window.innerHeight - img.offsetHeight));
    img.style.left = x + "px";
    img.style.top = y + "px";
    img.style.bottom = "auto";
    if (box.style.display === "block") { positionBox(); resetHide(); }   // box follows him
  });

  img.addEventListener("pointerup", () => { dragging = false; });

  img.addEventListener("click", () => {
    if (moved) return;                       // a drag isn't also a click
    poke();
  });

  // ---------- Apples ----------
  let applesEaten = 0;

  function feed() {
    applesEaten++;
    countNum.textContent = applesEaten;
    countEl.hidden = false;                  // shows on the first apple, stays visible after
    goTo("fed");
  }

  function makeDraggable(apple) {
    let offX, offY;

    apple.addEventListener("pointerdown", e => {
      e.preventDefault();
      const r = apple.getBoundingClientRect();
      offX = e.clientX - r.left;
      offY = e.clientY - r.top;
      apple.style.zIndex = 1200;             // float above Otto while dragging
      apple.style.cursor = "grabbing";
      apple.setPointerCapture(e.pointerId);
    });

    apple.addEventListener("pointermove", e => {
      if (!apple.hasPointerCapture(e.pointerId)) return;
      const x = e.clientX - offX, y = e.clientY - offY;
      apple.style.left = Math.max(0, Math.min(x, window.innerWidth - APPLE_SIZE)) + "px";
      apple.style.top  = Math.max(0, Math.min(y, window.innerHeight - APPLE_SIZE)) + "px";
    });

    apple.addEventListener("pointerup", () => {
      apple.style.zIndex = "";
      apple.style.cursor = "";
      const a = apple.getBoundingClientRect();
      const o = img.getBoundingClientRect();
      const cx = a.left + a.width / 2, cy = a.top + a.height / 2;
      if (cx > o.left && cx < o.right && cy > o.top && cy < o.bottom) {
        apple.remove();
        feed();
      }
    });
  }

  document.getElementById("spawn-apple").addEventListener("click", () => {
    const apple = document.createElement("img");
    apple.src = "sprites/apple.png";
    apple.alt = "";
    apple.className = "apple";
    apple.style.left = Math.random() * (window.innerWidth - APPLE_SIZE) + "px";
    apple.style.top = Math.random() * (window.innerHeight - APPLE_SIZE) + "px";
    document.body.appendChild(apple);
    makeDraggable(apple);
  });
})();