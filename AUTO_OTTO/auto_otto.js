(() => {
  // ---------- Settings ----------
  const SPRITES = ["sprites/otto_reg.png", "sprites/otto_openmouth.png"];
  const TALK_SPEED = 30, MOUTH_SPEED = 120;
  const HIDE_AFTER = 3000;   // text box disappears after 5 seconds
  const APPLE_SIZE = 48;
  const SHOP_UNLOCK = 10;   // apples needed to unlock the shop
  const TREE_COST = 30;
  const TREE_INTERVAL = 10000;   // an apple every 10 seconds
  const SQUIRREL_COST = 100;
  const SQUIRREL_SPEED = 90;      // pixels per second ("slowly")
  const STASH_RADIUS = 70;        // apples this close to the X count as already stashed
  const SQUIRREL_FRAMES = ["sprites/squirrel_1.png", "sprites/squirrel_2.png"];

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
  const shop = document.getElementById("shop");
  const shopToggle = document.getElementById("shop-toggle");
  const buyBtn = document.getElementById("buy-tree");
  const treePrice = document.getElementById("tree-price");
  SQUIRREL_FRAMES.forEach(s => { new Image().src = s; });
  const buySquirrelBtn = document.getElementById("buy-squirrel");
  const squirrelPrice = document.getElementById("squirrel-price");
  const setBtn = document.getElementById("set-squirrel");
  const stashX = document.getElementById("stash-x");
  const overlay = document.getElementById("place-overlay");

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
  countEl.hidden = false;
  if (shop.hidden && applesEaten >= SHOP_UNLOCK) unlockShop();
  updateShop();
  goTo("fed");
}

function unlockShop() {
  shop.hidden = false;
  void shop.offsetWidth;            // forces a reflow so the slide-in animates
  shop.classList.remove("closed");  // slides in open
  shopToggle.textContent = "◂";
  shopToggle.setAttribute("aria-expanded", "true");
  shopToggle.setAttribute("aria-label", "Close shop");
}

shopToggle.addEventListener("click", () => {
  const closed = shop.classList.toggle("closed");
  shopToggle.textContent = closed ? "▸" : "◂";
  shopToggle.setAttribute("aria-expanded", String(!closed));
  shopToggle.setAttribute("aria-label", closed ? "Open shop" : "Close shop");
});

  function makeDraggable(apple) {
    let offX, offY;

    apple.addEventListener("pointerdown", e => {
      e.preventDefault();
      const r = apple.getBoundingClientRect();
      offX = e.clientX - r.left;
      offY = e.clientY - r.top;
      apple.style.zIndex = 1200;             // float above Otto while dragging
      apple.style.cursor = "grabbing";
      apple.dataset.dragging = "1";
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
      delete apple.dataset.dragging;

      const a = apple.getBoundingClientRect();
      const o = img.getBoundingClientRect();
      const cx = a.left + a.width / 2, cy = a.top + a.height / 2;
      if (cx > o.left && cx < o.right && cy > o.top && cy < o.bottom) {
        apple.remove();
        feed();
      }
    });
  }

function spawnApple(x, y) {
  const apple = document.createElement("img");
  apple.src = "sprites/apple.png";
  apple.alt = "";
  apple.className = "apple";
  apple.style.left = Math.max(0, Math.min(x, window.innerWidth - APPLE_SIZE)) + "px";
  apple.style.top = Math.max(0, Math.min(y, window.innerHeight - APPLE_SIZE)) + "px";
  document.body.appendChild(apple);
  makeDraggable(apple);
}

document.getElementById("spawn-apple").addEventListener("click", () => {
  spawnApple(
    Math.random() * (window.innerWidth - APPLE_SIZE),
    Math.random() * (window.innerHeight - APPLE_SIZE)
  );
});

// ---------- Apple tree ----------
let treeOwned = false, tree;

function updateShop() {
  if (treeOwned) {
    buyBtn.disabled = true;
    treePrice.textContent = "Owned";
  } else {
    buyBtn.disabled = applesEaten < TREE_COST;
  }
  if (squirrelOwned) {
    buySquirrelBtn.disabled = true;
    squirrelPrice.textContent = "Owned";
  } else {
    buySquirrelBtn.disabled = applesEaten < SQUIRREL_COST;
  }
}

function dropAppleFromTree() {
  const t = tree.getBoundingClientRect();
  const x = t.left - 20 + Math.random() * (t.width + 40 - APPLE_SIZE);   // a bit wider than the tree
  const y = t.bottom - 36 + Math.random() * 40;                          // around the base
  spawnApple(x, y);
}

buyBtn.addEventListener("click", () => {
  if (treeOwned || applesEaten < TREE_COST) return;
  applesEaten -= TREE_COST;          // delete this line to make 30 a milestone instead of a cost
  countNum.textContent = applesEaten;
  treeOwned = true;
  tree = document.createElement("img");
  tree.id = "tree";
  tree.src = "sprites/tree.png";
  tree.alt = "";
  document.body.appendChild(tree);
  setInterval(dropAppleFromTree, TREE_INTERVAL);
  updateShop();
});

// ---------- Squirrel ----------
let squirrelOwned = false, squirrel, stash = null, placing = false;
let sq = { x: 0, y: 0 };                          // squirrel's center
let sqTarget = null, sqCarry = null, sqDrop = null;
let sqWander = null, sqWait = 0, sqFacing = 1, sqFrame = 0, sqFrameT = 0, lastT = 0;

const center = el => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; };
const dist = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
const nearStash = p => stash && dist(p, stash) < STASH_RADIUS;
const randomDropSpot = () => ({ x: stash.x + (Math.random() - 0.5) * 70, y: stash.y + (Math.random() - 0.5) * 70 });

function pickApple() {                            // nearest loose apple that isn't already stashed
  if (!stash) return null;
  let best = null, bestD = Infinity;
  document.querySelectorAll(".apple:not(.carried)").forEach(a => {
    if (a.dataset.dragging) return;
    const c = center(a);
    if (nearStash(c)) return;
    const d = dist(c, sq);
    if (d < bestD) { best = a; bestD = d; }
  });
  return best;
}

function step(goal, speed, dt) {                  // move toward goal; true when we get there
  const dx = goal.x - sq.x, dy = goal.y - sq.y, d = Math.hypot(dx, dy), s = speed * dt;
  if (d <= s) { sq.x = goal.x; sq.y = goal.y; return true; }
  sq.x += dx / d * s;
  sq.y += dy / d * s;
  if (Math.abs(dx) > 1) sqFacing = dx > 0 ? 1 : -1;
  return false;
}

function updateSquirrel(dt) {
  let moving = false;

  if (sqCarry) {                                  // delivering
    if (!step(sqDrop, SQUIRREL_SPEED, dt)) moving = true;
    else {                                        // arrived: set the apple down
      sqCarry.style.left = sqDrop.x - APPLE_SIZE / 2 + "px";
      sqCarry.style.top = sqDrop.y - APPLE_SIZE / 2 + "px";
      sqCarry.classList.remove("carried");
      sqCarry = null;
    }
  } else {
    if (!sqTarget || !sqTarget.isConnected || sqTarget.dataset.dragging || nearStash(center(sqTarget))) {
      sqTarget = pickApple();
    }
    if (sqTarget) {
      if (!step(center(sqTarget), SQUIRREL_SPEED, dt)) moving = true;
      else {                                      // arrived: grab it
        sqCarry = sqTarget; sqTarget = null;
        sqCarry.classList.add("carried");
        sqDrop = randomDropSpot();
      }
    } else if (sqWait > 0) {                      // nothing to fetch: rest, then wander
      sqWait -= dt;
    } else {
      if (!sqWander) sqWander = {
        x: 60 + Math.random() * (window.innerWidth - 120),
        y: 60 + Math.random() * (window.innerHeight - 120)
      };
      if (!step(sqWander, SQUIRREL_SPEED / 2, dt)) moving = true;
      else { sqWander = null; sqWait = 1 + Math.random() * 2; }
    }
  }

  if (sqCarry) {                                  // carried apple rides above his head
    sqCarry.style.left = sq.x - APPLE_SIZE / 2 + "px";
    sqCarry.style.top = sq.y - squirrel.offsetHeight / 2 - APPLE_SIZE * 0.6 + "px";
  }

  sqFrameT += dt;
  if (!moving) sqFrame = 0;
  else if (sqFrameT > 0.15) { sqFrameT = 0; sqFrame = 1 - sqFrame; }
  if (squirrel.dataset.frame !== String(sqFrame)) {
    squirrel.src = SQUIRREL_FRAMES[sqFrame];
    squirrel.dataset.frame = sqFrame;
  }
  squirrel.style.left = sq.x + "px";
  squirrel.style.top = sq.y + "px";
  squirrel.style.transform = `translate(-50%, -50%) scaleX(${sqFacing})`;
}

function tick(now) {
  const dt = Math.min((now - lastT) / 1000, 0.05);
  lastT = now;
  updateSquirrel(dt);
  requestAnimationFrame(tick);
}

// ----- choosing the drop spot -----
function startPlacing() {
  placing = true;
  overlay.hidden = false;
  setBtn.textContent = "Cancel";
}
function stopPlacing() {
  placing = false;
  overlay.hidden = true;
  setBtn.textContent = "Set squirrel location";
}

setBtn.addEventListener("click", () => (placing ? stopPlacing() : startPlacing()));
document.addEventListener("keydown", e => { if (e.key === "Escape" && placing) stopPlacing(); });

overlay.addEventListener("click", e => {
  stash = { x: e.clientX, y: e.clientY };
  stashX.style.left = stash.x + "px";
  stashX.style.top = stash.y + "px";
  stashX.hidden = false;
  if (sqCarry) sqDrop = randomDropSpot();         // redirect if he's mid-delivery
  sqTarget = null;
  stopPlacing();
});

// ----- buying -----
buySquirrelBtn.addEventListener("click", () => {
  if (squirrelOwned || applesEaten < SQUIRREL_COST) return;
  applesEaten -= SQUIRREL_COST;        // delete this line to make 100 a milestone instead of a cost
  countNum.textContent = applesEaten;
  squirrelOwned = true;

  squirrel = document.createElement("img");
  squirrel.id = "squirrel";
  squirrel.src = SQUIRREL_FRAMES[0];
  squirrel.alt = "";
  squirrel.addEventListener("click", startPlacing);   // clicking the squirrel also sets the spot
  document.body.appendChild(squirrel);

  sq = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
  setBtn.hidden = false;
  updateShop();
  startPlacing();                      // pick the drop spot right away
  lastT = performance.now();
  requestAnimationFrame(tick);
});

})();