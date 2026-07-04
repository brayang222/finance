export function spawnConfetti() {
  const W = window.innerWidth;
  const H = window.innerHeight;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  canvas.style.cssText = "position:fixed;inset:0;pointer-events:none;z-index:9998;";
  document.body.appendChild(canvas);

  const ctx = canvas.getContext("2d")!;
  const COLORS = ["#5cae87", "#eceef1", "#f59e0b", "#60a5fa", "#d67c78", "#a78bfa", "#fb923c"];

  const pieces = Array.from({ length: 110 }, () => ({
    x: Math.random() * W,
    y: -10 - Math.random() * 80,
    w: Math.random() * 10 + 5,
    h: Math.random() * 5 + 3,
    r: Math.random() * Math.PI * 2,
    rSpeed: (Math.random() - 0.5) * 0.14,
    vy: Math.random() * 2.5 + 1.5,
    vx: (Math.random() - 0.5) * 1.8,
    color: COLORS[Math.floor(Math.random() * COLORS.length)],
    alpha: 1,
  }));

  let frame = 0;
  let raf: number;

  function tick() {
    ctx.clearRect(0, 0, W, H);
    let alive = false;
    for (const p of pieces) {
      p.y += p.vy;
      p.x += p.vx;
      p.r += p.rSpeed;
      if (frame > 100) p.alpha = Math.max(0, p.alpha - 0.012);
      if (p.alpha <= 0 || p.y > H + 20) continue;
      alive = true;
      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.translate(p.x, p.y);
      ctx.rotate(p.r);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
      ctx.restore();
    }
    frame++;
    if (alive) { raf = requestAnimationFrame(tick); } else { canvas.remove(); }
  }

  raf = requestAnimationFrame(tick);
  setTimeout(() => { cancelAnimationFrame(raf); canvas.remove(); }, 5000);
}
