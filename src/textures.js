// Генератор процедурных текстур для построек и окружения
// Создаёт естественные шероховатые текстуры без внешних тяжелых картинок
window.Textures = (function () {
  const cache = {};

  function createNoiseCanvas(width, height, drawFn) {
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d');
    drawFn(ctx, width, height);
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    return texture;
  }

  // 1. Дерево (доски пола, стены, стропила)
  function getWoodTexture() {
    if (cache.wood) return cache.wood;
    cache.wood = createNoiseCanvas(512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#654321';
      ctx.fillRect(0, 0, w, h);
      // Волокна дерева
      for (let i = 0; i < 600; i++) {
        ctx.fillStyle = (i % 2 === 0) ? 'rgba(74, 48, 22, 0.4)' : 'rgba(139, 94, 52, 0.35)';
        const y = Math.random() * h;
        const thickness = 1 + Math.random() * 3;
        ctx.fillRect(0, y, w, thickness);
      }
      // Сучки
      for (let k = 0; k < 5; k++) {
        const kx = Math.random() * w;
        const ky = Math.random() * h;
        const rad = 6 + Math.random() * 10;
        const grad = ctx.createRadialGradient(kx, ky, 2, kx, ky, rad);
        grad.addColorStop(0, '#36210f');
        grad.addColorStop(0.8, '#543419');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(kx, ky, rad, 0, Math.PI * 2);
        ctx.fill();
      }
    });
    return cache.wood;
  }

  // 2. Брёвна сруба (продольная кора с темными бороздками)
  function getLogTexture() {
    if (cache.log) return cache.log;
    cache.log = createNoiseCanvas(512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#5c3a21';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 800; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(38, 22, 11, 0.5)' : 'rgba(115, 75, 42, 0.4)';
        const x = Math.random() * w;
        const width = 1 + Math.random() * 2.5;
        ctx.fillRect(x, 0, width, h);
      }
    });
    return cache.log;
  }

  // 3. Каменная кладка (фундамент, очаг/труба)
  function getStoneTexture() {
    if (cache.stone) return cache.stone;
    cache.stone = createNoiseCanvas(512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#475569';
      ctx.fillRect(0, 0, w, h);
      // Пятна и зерно камня
      for (let i = 0; i < 3000; i++) {
        const x = Math.random() * w;
        const y = Math.random() * h;
        const s = 1 + Math.random() * 4;
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(30, 41, 59, 0.6)' : 'rgba(148, 163, 184, 0.35)';
        ctx.fillRect(x, y, s, s);
      }
      // Швы между камнями
      ctx.strokeStyle = 'rgba(15, 23, 42, 0.7)';
      ctx.lineWidth = 3;
      const rows = 8;
      const rh = h / rows;
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * rh);
        ctx.lineTo(w, r * rh);
        ctx.stroke();

        const cols = 5;
        const cw = w / cols;
        const offset = (r % 2) * (cw / 2);
        for (let c = 0; c <= cols + 1; c++) {
          ctx.beginPath();
          ctx.moveTo(c * cw - offset, r * rh);
          ctx.lineTo(c * cw - offset, (r + 1) * rh);
          ctx.stroke();
        }
      }
    });
    return cache.stone;
  }

  // 4. Кирпич (для заброшенного дома)
  function getBrickTexture() {
    if (cache.brick) return cache.brick;
    cache.brick = createNoiseCanvas(512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#8f3d2a';
      ctx.fillRect(0, 0, w, h);
      for (let i = 0; i < 2000; i++) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(180, 83, 56, 0.3)' : 'rgba(92, 33, 20, 0.4)';
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
      // Швы раствора
      ctx.strokeStyle = '#4b5563';
      ctx.lineWidth = 2.5;
      const rows = 16;
      const rh = h / rows;
      for (let r = 0; r <= rows; r++) {
        ctx.beginPath();
        ctx.moveTo(0, r * rh);
        ctx.lineTo(w, r * rh);
        ctx.stroke();

        const cols = 8;
        const cw = w / cols;
        const offset = (r % 2) * (cw / 2);
        for (let c = 0; c <= cols + 1; c++) {
          ctx.beginPath();
          ctx.moveTo(c * cw - offset, r * rh);
          ctx.lineTo(c * cw - offset, (r + 1) * rh);
          ctx.stroke();
        }
      }
    });
    return cache.brick;
  }

  // 5. Ржавый металл (бочки, контейнеры, двери)
  function getRustTexture() {
    if (cache.rust) return cache.rust;
    cache.rust = createNoiseCanvas(512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#3f3f46';
      ctx.fillRect(0, 0, w, h);
      // Ржавые пятна
      for (let i = 0; i < 15; i++) {
        const rx = Math.random() * w;
        const ry = Math.random() * h;
        const rad = 20 + Math.random() * 60;
        const grad = ctx.createRadialGradient(rx, ry, 5, rx, ry, rad);
        grad.addColorStop(0, 'rgba(154, 52, 18, 0.85)');
        grad.addColorStop(0.6, 'rgba(194, 65, 12, 0.5)');
        grad.addColorStop(1, 'transparent');
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(rx, ry, rad, 0, Math.PI * 2);
        ctx.fill();
      }
      // Зернистость металла
      for (let k = 0; k < 2500; k++) {
        ctx.fillStyle = Math.random() > 0.5 ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.2)';
        ctx.fillRect(Math.random() * w, Math.random() * h, 2, 2);
      }
    });
    return cache.rust;
  }

  // 6. Профнастил / гофрированный лист (крыши, заборы)
  function getCorrugatedTexture() {
    if (cache.corrugated) return cache.corrugated;
    cache.corrugated = createNoiseCanvas(512, 512, (ctx, w, h) => {
      ctx.fillStyle = '#52525b';
      ctx.fillRect(0, 0, w, h);
      // Полосы волн
      const waveCount = 32;
      const step = w / waveCount;
      for (let i = 0; i < waveCount; i++) {
        const x = i * step;
        const grad = ctx.createLinearGradient(x, 0, x + step, 0);
        grad.addColorStop(0, '#71717a');
        grad.addColorStop(0.5, '#27272a');
        grad.addColorStop(1, '#71717a');
        ctx.fillStyle = grad;
        ctx.fillRect(x, 0, step, h);
      }
    });
    return cache.corrugated;
  }

  // 7. Мешки с песком (брустверы)
  function getSandbagTexture() {
    if (cache.sandbag) return cache.sandbag;
    cache.sandbag = createNoiseCanvas(256, 256, (ctx, w, h) => {
      ctx.fillStyle = '#b59a68';
      ctx.fillRect(0, 0, w, h);
      // Текстура мешковины (сетка)
      for (let x = 0; x < w; x += 4) {
        ctx.fillStyle = 'rgba(120, 95, 55, 0.35)';
        ctx.fillRect(x, 0, 1.5, h);
      }
      for (let y = 0; y < h; y += 4) {
        ctx.fillStyle = 'rgba(120, 95, 55, 0.35)';
        ctx.fillRect(0, y, w, 1.5);
      }
    });
    return cache.sandbag;
  }

  return {
    getWoodTexture,
    getLogTexture,
    getStoneTexture,
    getBrickTexture,
    getRustTexture,
    getCorrugatedTexture,
    getSandbagTexture
  };
})();
