const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
const scoreEl = document.getElementById("score");
const bestEl = document.getElementById("best");
const livesEl = document.getElementById("lives");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlayTitle");
const overlayText = document.getElementById("overlayText");
const startBtn = document.getElementById("startBtn");
const jumpBtn = document.getElementById("jumpBtn");
const duckBtn = document.getElementById("duckBtn");

const avatar = new Image();
avatar.src = "./assets/character.png";

const W = canvas.width;
const H = canvas.height;
const groundY = 410;
const gravity = 0.78;
let bestScore = Number(localStorage.getItem("pigRunBest") || 0);
let gameState = "ready";
let lastTime = 0;
let spawnTimer = 0;
let score = 0;
let speed = 5.8;
let distance = 0;
let shake = 0;
let lives = 3;
let invincibleTimer = 0;

bestEl.textContent = String(bestScore);
updateLives();

const pig = {
  x: 132,
  y: groundY - 105,
  w: 92,
  h: 105,
  vy: 0,
  ducking: false,
  onGround: true,
  runFrame: 0,
};

let obstacles = [];
let clouds = [
  { x: 70, y: 72, s: 1 },
  { x: 360, y: 48, s: 0.8 },
  { x: 690, y: 86, s: 1.15 },
];
let parcels = [
  { x: 220, y: groundY + 22 },
  { x: 520, y: groundY + 18 },
  { x: 810, y: groundY + 20 },
];

function resetGame() {
  obstacles = [];
  score = 0;
  speed = 5.8;
  distance = 0;
  spawnTimer = 0;
  shake = 0;
  lives = 3;
  invincibleTimer = 0;
  pig.y = groundY - pig.h;
  pig.vy = 0;
  pig.ducking = false;
  pig.onGround = true;
  gameState = "playing";
  overlay.classList.add("hidden");
  scoreEl.textContent = "0";
  updateLives();
}

function jump() {
  if (gameState !== "playing") {
    resetGame();
    return;
  }
  if (!pig.onGround) return;
  pig.vy = -15.5;
  pig.onGround = false;
}

function duck(active) {
  if (gameState !== "playing") return;
  pig.ducking = active && pig.onGround;
}

function spawnObstacle() {
  const types = [
    { kind: "cone", w: 42, h: 68 },
    { kind: "box", w: 66, h: 58 },
    { kind: "barrier", w: 82, h: 78 },
    { kind: "drone", w: 70, h: 44, air: true },
  ];
  const type = types[Math.floor(Math.random() * types.length)];
  const y = type.air ? groundY - 112 - Math.random() * 10 : groundY - type.h;
  obstacles.push({
    ...type,
    x: W + 36,
    y,
    passed: false,
  });
}

function update(dt) {
  if (gameState !== "playing") return;

  distance += speed * dt;
  score = Math.floor(distance / 10);
  speed = Math.min(12.8, 5.8 + score / 260);
  scoreEl.textContent = String(score);

  pig.runFrame += dt * 0.24;
  pig.vy += gravity * dt;
  pig.y += pig.vy * dt;
  const floor = groundY - pig.h;
  if (pig.y >= floor) {
    pig.y = floor;
    pig.vy = 0;
    pig.onGround = true;
  }

  spawnTimer -= dt;
  if (spawnTimer <= 0) {
    spawnObstacle();
    spawnTimer = 72 + Math.random() * 56 - Math.min(score / 16, 28);
  }

  obstacles.forEach((o) => {
    o.x -= speed * dt;
    if (!o.passed && o.x + o.w < pig.x) {
      o.passed = true;
    }
  });
  obstacles = obstacles.filter((o) => o.x + o.w > -30);

  clouds.forEach((c) => {
    c.x -= speed * dt * 0.08 * c.s;
    if (c.x < -130) c.x = W + 80 + Math.random() * 120;
  });
  parcels.forEach((p) => {
    p.x -= speed * dt * 0.7;
    if (p.x < -60) p.x = W + 80 + Math.random() * 220;
  });

  if (shake > 0) shake -= dt;
  if (invincibleTimer > 0) invincibleTimer -= dt;
  const hitIndex = obstacles.findIndex((o) => intersects(getPigHitbox(), getObstacleHitbox(o)));
  if (hitIndex >= 0 && invincibleTimer <= 0) takeDamage(hitIndex);
}

function takeDamage(hitIndex) {
  lives -= 1;
  updateLives();
  shake = 10;
  invincibleTimer = 95;
  obstacles.splice(hitIndex, 1);

  if (lives <= 0) {
    endGame();
  }
}

function updateLives() {
  if (!livesEl) return;
  [...livesEl.children].forEach((bar, index) => {
    bar.classList.toggle("empty", index >= lives);
  });
}

function endGame() {
  gameState = "over";
  shake = 12;
  if (score > bestScore) {
    bestScore = score;
    localStorage.setItem("pigRunBest", String(bestScore));
    bestEl.textContent = String(bestScore);
  }
  overlayTitle.textContent = "派送路线被挡住了";
  overlayText.textContent = `本次分数 ${score}，调整姿势再冲一次。`;
  startBtn.textContent = "再来";
  overlay.classList.remove("hidden");
}

function getPigHitbox() {
  if (pig.ducking) {
    return { x: pig.x + 14, y: pig.y + 48, w: pig.w - 24, h: 42 };
  }
  return { x: pig.x + 13, y: pig.y + 12, w: pig.w - 24, h: pig.h - 18 };
}

function getObstacleHitbox(o) {
  if (o.kind === "cone") return { x: o.x + 9, y: o.y + 10, w: o.w - 18, h: o.h - 10 };
  if (o.kind === "drone") return { x: o.x + 5, y: o.y + 6, w: o.w - 10, h: o.h - 8 };
  return { x: o.x + 7, y: o.y + 7, w: o.w - 14, h: o.h - 8 };
}

function intersects(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}

function draw() {
  ctx.save();
  ctx.clearRect(0, 0, W, H);
  if (shake > 0) {
    ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake);
  }
  drawSky();
  drawRoad();
  drawPig();
  obstacles.forEach(drawObstacle);
  drawForeground();
  ctx.restore();
}

function drawSky() {
  const sky = ctx.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, "#bfe8fb");
  sky.addColorStop(0.62, "#eff9fd");
  sky.addColorStop(0.63, "#7ec86b");
  sky.addColorStop(1, "#57a75c");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, W, H);

  clouds.forEach((c) => {
    ctx.fillStyle = "rgba(255,255,255,0.88)";
    cloud(c.x, c.y, 42 * c.s);
  });

  ctx.fillStyle = "#3d8d49";
  for (let i = 0; i < 8; i++) {
    const x = ((i * 150 - distance * 0.08) % (W + 150)) - 70;
    ctx.beginPath();
    ctx.ellipse(x, 350, 90, 28, 0, 0, Math.PI * 2);
    ctx.fill();
  }
}

function cloud(x, y, r) {
  ctx.beginPath();
  ctx.arc(x, y, r * 0.72, 0, Math.PI * 2);
  ctx.arc(x + r * 0.55, y - r * 0.2, r * 0.86, 0, Math.PI * 2);
  ctx.arc(x + r * 1.18, y, r * 0.68, 0, Math.PI * 2);
  ctx.rect(x - r * 0.4, y, r * 1.9, r * 0.58);
  ctx.fill();
}

function drawRoad() {
  ctx.fillStyle = "#464d5b";
  ctx.fillRect(0, groundY, W, H - groundY);
  ctx.fillStyle = "#343a46";
  ctx.fillRect(0, groundY + 70, W, 28);
  ctx.strokeStyle = "#ffe082";
  ctx.lineWidth = 6;
  ctx.setLineDash([34, 32]);
  ctx.lineDashOffset = -distance * 0.8;
  ctx.beginPath();
  ctx.moveTo(0, groundY + 34);
  ctx.lineTo(W, groundY + 34);
  ctx.stroke();
  ctx.setLineDash([]);
}

function drawPig() {
  const bodyH = pig.ducking ? 66 : 88;
  const bodyY = pig.ducking ? groundY - bodyH : pig.y + 30;
  const stride = Math.sin(pig.runFrame) * 8;
  const headSize = pig.ducking ? 50 : 60;
  const headX = pig.x + 45;
  const headY = pig.ducking ? bodyY - 8 : pig.y + 26;

  ctx.save();
  if (invincibleTimer > 0 && Math.floor(invincibleTimer / 8) % 2 === 0) {
    ctx.globalAlpha = 0.48;
  }
  ctx.translate(pig.x + pig.w / 2, pig.y + pig.h / 2);
  if (!pig.onGround) ctx.rotate(-0.08);
  ctx.translate(-(pig.x + pig.w / 2), -(pig.y + pig.h / 2));

  drawUniformBody(pig.x + 8, bodyY, 86, bodyH, stride);
  drawRunnerLeg(pig.x + 30, groundY - 10, stride, "#4b3c24");
  drawRunnerLeg(pig.x + 68, groundY - 10, -stride, "#4b3c24");
  drawLeatherStrap(pig.x + 13, bodyY + 4, 82, bodyH);
  drawPhotoHead(headX, headY, headSize);
  drawGlasses(headX, headY, headSize);
  drawCollarBadges(pig.x + 25, bodyY + 10);

  ctx.restore();
}

function drawUniformBody(x, y, w, h, stride) {
  const bodyGradient = ctx.createLinearGradient(x, y, x + w, y + h);
  bodyGradient.addColorStop(0, "#75652f");
  bodyGradient.addColorStop(0.45, "#9a8444");
  bodyGradient.addColorStop(1, "#5f522a");
  ctx.fillStyle = bodyGradient;
  roundRect(x, y, w, h, 18);
  ctx.fill();

  ctx.fillStyle = "#3b3323";
  ctx.beginPath();
  ctx.moveTo(x + 35, y + 8);
  ctx.lineTo(x + 48, y + 34);
  ctx.lineTo(x + 59, y + 8);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#dac59b";
  ctx.beginPath();
  ctx.moveTo(x + 42, y + 4);
  ctx.lineTo(x + 50, y + 22);
  ctx.lineTo(x + 58, y + 4);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#c2a060";
  ctx.beginPath();
  ctx.arc(x + 49, y + 42, 6, 0, Math.PI * 2);
  ctx.arc(x + 49, y + 62, 5, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(44, 35, 23, 0.32)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + 49, y + 26);
  ctx.lineTo(x + 49 + stride * 0.18, y + h - 8);
  ctx.stroke();
}

function drawLeatherStrap(x, y, w, h) {
  ctx.strokeStyle = "#684331";
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x + w - 6, y + 4);
  ctx.lineTo(x + 18, y + h - 6);
  ctx.stroke();
  ctx.strokeStyle = "#9a6a4e";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(x + w - 8, y + 5);
  ctx.lineTo(x + 20, y + h - 7);
  ctx.stroke();
}

function drawCollarBadges(x, y) {
  drawBadge(x - 3, y + 15, -0.28);
  drawBadge(x + 47, y + 15, 0.28);
}

function drawBadge(x, y, angle) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(angle);
  ctx.fillStyle = "#7f1d1d";
  roundRect(-11, -8, 22, 16, 3);
  ctx.fill();
  ctx.strokeStyle = "#e7c166";
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.strokeStyle = "#f5d986";
  ctx.lineWidth = 1.5;
  for (let i = -4; i <= 4; i += 4) {
    ctx.beginPath();
    ctx.moveTo(-7, i);
    ctx.lineTo(7, i);
    ctx.stroke();
  }
  ctx.restore();
}

function drawRunnerLeg(x, y, offset, color) {
  ctx.strokeStyle = color;
  ctx.lineWidth = 8;
  ctx.lineCap = "round";
  ctx.beginPath();
  ctx.moveTo(x, y - 34);
  ctx.lineTo(x + offset, y);
  ctx.stroke();

  ctx.fillStyle = "#2f2418";
  ctx.beginPath();
  ctx.ellipse(x + offset + 8, y + 3, 13, 5, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawPhotoHead(cx, cy, size) {
  ctx.save();
  ctx.beginPath();
  ctx.ellipse(cx, cy + size * 0.04, size * 0.5, size * 0.54, 0, 0, Math.PI * 2);
  ctx.clip();
  if (avatar.complete && avatar.naturalWidth) {
    const sx = 410;
    const sy = 315;
    const sw = 760;
    const sh = 820;
    ctx.drawImage(avatar, sx, sy, sw, sh, cx - size * 0.52, cy - size * 0.52, size * 1.04, size * 1.12);
  } else {
    ctx.fillStyle = "#f0b9a4";
    ctx.fillRect(cx - size * 0.52, cy - size * 0.5, size * 1.04, size * 1.12);
  }
  ctx.restore();

  ctx.strokeStyle = "#6b3d2c";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(cx, cy + size * 0.04, size * 0.5, size * 0.54, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawRestoredCap(cx, cy, size) {
  const capY = cy - size * 0.62;
  const capGradient = ctx.createLinearGradient(cx - size * 0.45, capY - 18, cx + size * 0.45, capY + 22);
  capGradient.addColorStop(0, "#8b7744");
  capGradient.addColorStop(0.5, "#b09a5a");
  capGradient.addColorStop(1, "#756338");
  ctx.fillStyle = capGradient;
  ctx.beginPath();
  ctx.ellipse(cx, capY, size * 0.48, size * 0.28, 0, Math.PI, Math.PI * 2);
  ctx.lineTo(cx + size * 0.45, capY + size * 0.16);
  ctx.quadraticCurveTo(cx, capY + size * 0.28, cx - size * 0.45, capY + size * 0.16);
  ctx.closePath();
  ctx.fill();

  ctx.fillStyle = "#513a2e";
  roundRect(cx - size * 0.43, capY + size * 0.05, size * 0.86, size * 0.08, 4);
  ctx.fill();

  ctx.fillStyle = "#a8945a";
  ctx.beginPath();
  ctx.ellipse(cx, capY + size * 0.2, size * 0.52, size * 0.1, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.strokeStyle = "rgba(59, 45, 26, 0.45)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx, capY - size * 0.25);
  ctx.lineTo(cx, capY + size * 0.08);
  ctx.stroke();

  drawStar(cx, capY - size * 0.04, size * 0.1);
}

function drawGlasses(cx, cy, size) {
  const y = cy + size * 0.04;
  ctx.strokeStyle = "#2a2622";
  ctx.lineWidth = 2.5;
  roundRect(cx - size * 0.36, y - size * 0.1, size * 0.27, size * 0.18, 5);
  ctx.stroke();
  roundRect(cx + size * 0.09, y - size * 0.1, size * 0.27, size * 0.18, 5);
  ctx.stroke();

  ctx.fillStyle = "#6e4a2d";
  ctx.fillRect(cx - size * 0.09, y - 1, size * 0.18, 2);
}

function drawStar(cx, cy, radius) {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.fillStyle = "#f3d37a";
  ctx.strokeStyle = "#87652e";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let i = 0; i < 10; i++) {
    const angle = -Math.PI / 2 + (i * Math.PI) / 5;
    const r = i % 2 === 0 ? radius : radius * 0.45;
    const x = Math.cos(angle) * r;
    const y = Math.sin(angle) * r;
    if (i === 0) ctx.moveTo(x, y);
    else ctx.lineTo(x, y);
  }
  ctx.closePath();
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function drawObstacle(o) {
  if (o.kind === "cone") {
    ctx.fillStyle = "#f97316";
    ctx.beginPath();
    ctx.moveTo(o.x + o.w / 2, o.y);
    ctx.lineTo(o.x + o.w, o.y + o.h);
    ctx.lineTo(o.x, o.y + o.h);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#fff7ed";
    ctx.fillRect(o.x + 11, o.y + 36, o.w - 22, 7);
  } else if (o.kind === "box") {
    ctx.fillStyle = "#b8793a";
    roundRect(o.x, o.y, o.w, o.h, 8);
    ctx.fill();
    ctx.strokeStyle = "#704214";
    ctx.lineWidth = 4;
    ctx.strokeRect(o.x + 10, o.y + 10, o.w - 20, o.h - 20);
  } else if (o.kind === "barrier") {
    ctx.fillStyle = "#e11d48";
    roundRect(o.x, o.y + 18, o.w, 38, 8);
    ctx.fill();
    ctx.fillStyle = "#fff1f2";
    ctx.fillRect(o.x + 8, o.y + 30, o.w - 16, 8);
    ctx.fillStyle = "#333";
    ctx.fillRect(o.x + 14, o.y + 54, 8, 24);
    ctx.fillRect(o.x + o.w - 22, o.y + 54, 8, 24);
  } else {
    ctx.fillStyle = "#263238";
    roundRect(o.x, o.y + 12, o.w, 24, 12);
    ctx.fill();
    ctx.fillStyle = "#ffda6a";
    ctx.fillRect(o.x + 16, o.y + 18, 18, 8);
    ctx.strokeStyle = "#111827";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(o.x + 8, o.y + 10);
    ctx.lineTo(o.x + 30, o.y);
    ctx.moveTo(o.x + o.w - 8, o.y + 10);
    ctx.lineTo(o.x + o.w - 30, o.y);
    ctx.stroke();
  }
}

function drawForeground() {
  parcels.forEach((p) => {
    ctx.fillStyle = "#d7a15d";
    roundRect(p.x, p.y, 32, 24, 4);
    ctx.fill();
    ctx.strokeStyle = "#8a5a2b";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(p.x + 16, p.y);
    ctx.lineTo(p.x + 16, p.y + 24);
    ctx.moveTo(p.x, p.y + 10);
    ctx.lineTo(p.x + 32, p.y + 10);
    ctx.stroke();
  });
}

function roundRect(x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
}

function loop(t) {
  const dt = Math.min(2.2, (t - lastTime) / 16.67 || 1);
  lastTime = t;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

startBtn.addEventListener("click", resetGame);
jumpBtn.addEventListener("click", jump);
duckBtn.addEventListener("pointerdown", () => duck(true));
duckBtn.addEventListener("pointerup", () => duck(false));
duckBtn.addEventListener("pointerleave", () => duck(false));

window.addEventListener("keydown", (event) => {
  if (event.code === "Space" || event.code === "ArrowUp") {
    event.preventDefault();
    jump();
  }
  if (event.code === "ArrowDown") {
    event.preventDefault();
    duck(true);
  }
});

window.addEventListener("keyup", (event) => {
  if (event.code === "ArrowDown") duck(false);
});

avatar.addEventListener("load", draw);
draw();
requestAnimationFrame(loop);
