// Процедурный генератор высококачественных текстур (PBR) для 3D-моделей
// Создаёт реалистичные текстуры дерева, брёвен, черепицы, камня, металла и мешков с песком.
window.Textures = (function () {
  const cache = {};

  function makeCanvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    return c;
  }

  // 1. Деревянные доски (для пола, веранды, дверей и балок)
  function createWoodPlanks() {
    if (cache.wood) return cache.wood;
    const c = makeCanvas(512, 512);
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#61472e';
    ctx.fillRect(0, 0, 512, 512);

    const plankH = 64;
    for (let y = 0; y < 512; y += plankH) {
      // Вариация оттенка каждой доски
      const shade = (Math.random() - 0.5) * 20;
      ctx.fillStyle = `rgb(${95 + shade}, ${70 + shade * 0.8}, ${45 + shade * 0.6})`;
      ctx.fillRect(0, y + 2, 512, plankH - 4);

      // Волокна дерева (горизонтальные линии)
      ctx.strokeStyle = 'rgba(40, 25, 12, 0.25)';
      ctx.lineWidth = 1;
      for (let i = 0; i < 18; i++) {
        const fy = y + 4 + Math.random() * (plankH - 8);
        ctx.beginPath();
        ctx.moveTo(0, fy);
        ctx.bezierCurveTo(128, fy + (Math.random() - 0.5) * 4, 384, fy + (Math.random() - 0.5) * 4, 512, fy);
        ctx.stroke();
      }

      // Щели между досками
      ctx.fillStyle = '#1c120a';
      ctx.fillRect(0, y, 512, 2);
      ctx.fillStyle = '#7a5b3c';
      ctx.fillRect(0, y + plankH - 2, 512, 1);

      // Гвозди
      for (let x = 32; x < 512; x += 128) {
        ctx.fillStyle = '#222';
        ctx.beginPath();
        ctx.arc(x, y + 12, 2.5, 0, Math.PI * 2);
        ctx.arc(x, y + plankH - 12, 2.5, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    cache.wood = tex;
    return tex;
  }

  // 2. Брёвна сруба (кора, продольные борозды)
  function createLogBark() {
    if (cache.logBark) return cache.logBark;
    const c = makeCanvas(512, 512);
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#4a3321';
    ctx.fillRect(0, 0, 512, 512);

    // Борозды коры сосны/кедра
    for (let x = 0; x < 512; x += 4) {
      const v = Math.sin(x * 0.1) * 15 + (Math.random() - 0.5) * 25;
      ctx.fillStyle = `rgb(${74 + v}, ${51 + v * 0.7}, ${33 + v * 0.5})`;
      ctx.fillRect(x, 0, 4, 512);
    }
    // Продольные тени и трещины
    ctx.fillStyle = 'rgba(25, 15, 8, 0.4)';
    for (let i = 0; i < 40; i++) {
      const rx = Math.random() * 512;
      ctx.fillRect(rx, 0, 2 + Math.random() * 3, 512);
    }
    // Лишайники и мох
    ctx.fillStyle = 'rgba(80, 105, 55, 0.2)';
    for (let i = 0; i < 30; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 512, Math.random() * 512, 10 + Math.random() * 20, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    cache.logBark = tex;
    return tex;
  }

  // 3. Черепица крыши (деревянный гонт / шифер)
  function createRoofShingles() {
    if (cache.shingles) return cache.shingles;
    const c = makeCanvas(512, 512);
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#2f2824';
    ctx.fillRect(0, 0, 512, 512);

    const shingleH = 48;
    const shingleW = 64;
    let row = 0;
    for (let y = 0; y < 512; y += shingleH) {
      const offset = (row % 2) * (shingleW / 2);
      for (let x = -shingleW; x < 512 + shingleW; x += shingleW) {
        const v = (Math.random() - 0.5) * 25;
        ctx.fillStyle = `rgb(${60 + v}, ${52 + v * 0.9}, ${45 + v * 0.8})`;
        ctx.fillRect(x + offset + 1, y, shingleW - 2, shingleH - 2);

        // Тень под срезом черепицы
        ctx.fillStyle = 'rgba(15, 12, 10, 0.6)';
        ctx.fillRect(x + offset, y + shingleH - 4, shingleW, 4);

        // Светлая фаска верхнего края
        ctx.fillStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.fillRect(x + offset + 1, y, shingleW - 2, 2);
      }
      row++;
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    cache.shingles = tex;
    return tex;
  }

  // 4. Каменная кладка (фундамент, печь, дымоход)
  function createStoneBricks() {
    if (cache.stone) return cache.stone;
    const c = makeCanvas(512, 512);
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#3a3835';
    ctx.fillRect(0, 0, 512, 512);

    const bH = 32;
    const bW = 64;
    let row = 0;
    for (let y = 0; y < 512; y += bH) {
      const offset = (row % 2) * (bW / 2);
      for (let x = -bW; x < 512 + bW; x += bW) {
        const val = (Math.random() - 0.5) * 30;
        ctx.fillStyle = `rgb(${110 + val}, ${105 + val}, ${98 + val})`;
        ctx.fillRect(x + offset + 2, y + 2, bW - 4, bH - 4);

        // Тёмный раствор в швах
        ctx.fillStyle = '#22201e';
        ctx.strokeRect(x + offset + 1, y + 1, bW - 2, bH - 2);
      }
      row++;
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    cache.stone = tex;
    return tex;
  }

  // 5. Рифлёный металл / профнастил (крыша вышки, ангар)
  function createCorrugatedMetal() {
    if (cache.metal) return cache.metal;
    const c = makeCanvas(256, 256);
    const ctx = c.getContext('2d');

    for (let x = 0; x < 256; x++) {
      const sin = Math.sin((x / 16) * Math.PI * 2);
      const bright = Math.floor(130 + sin * 50);
      ctx.fillStyle = `rgb(${bright}, ${bright + 5}, ${bright + 10})`;
      ctx.fillRect(x, 0, 1, 256);
    }
    // Пятна ржавчины
    ctx.fillStyle = 'rgba(150, 75, 30, 0.35)';
    for (let i = 0; i < 15; i++) {
      ctx.beginPath();
      ctx.arc(Math.random() * 256, Math.random() * 256, 5 + Math.random() * 12, 0, Math.PI * 2);
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    cache.metal = tex;
    return tex;
  }

  // 6. Мешковина (брустверы из мешков с песком)
  function createSandbag() {
    if (cache.sandbag) return cache.sandbag;
    const c = makeCanvas(256, 256);
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#9e8c6e';
    ctx.fillRect(0, 0, 256, 256);

    // Плетение джута/мешковины
    ctx.fillStyle = 'rgba(60, 50, 35, 0.15)';
    for (let x = 0; x < 256; x += 4) ctx.fillRect(x, 0, 2, 256);
    for (let y = 0; y < 256; y += 4) ctx.fillRect(0, y, 256, 2);

    // Швы и складки
    ctx.strokeStyle = '#5a4e3b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(10, 128);
    ctx.lineTo(246, 128);
    ctx.stroke();

    const tex = new THREE.CanvasTexture(c);
    cache.sandbag = tex;
    return tex;
  }

  // 7. Армейский камуфляж / брезент
  function createCamoTarp() {
    if (cache.camo) return cache.camo;
    const c = makeCanvas(256, 256);
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#4d5c41'; // базовый хаки
    ctx.fillRect(0, 0, 256, 256);

    const colors = ['#303d27', '#6b5838', '#262920', '#5a6e4d'];
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.ellipse(
        Math.random() * 256, Math.random() * 256,
        20 + Math.random() * 30, 15 + Math.random() * 25,
        Math.random() * Math.PI, 0, Math.PI * 2
      );
      ctx.fill();
    }

    const tex = new THREE.CanvasTexture(c);
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    cache.camo = tex;
    return tex;
  }

  // 8. Железобетон бункера
  function createConcrete() {
    if (cache.concrete) return cache.concrete;
    const c = makeCanvas(512, 512);
    const ctx = c.getContext('2d');

    ctx.fillStyle = '#6b6e68';
    ctx.fillRect(0, 0, 512, 512);

    // Зернистость бетона
    for (let i = 0; i < 3000; i++) {
      const v = (Math.random() - 0.5) * 40;
      ctx.fillStyle = `rgba(${107 + v}, ${110 + v}, ${104 + v}, 0.6)`;
      ctx.fillRect(Math.random() * 512, Math.random() * 512, 2, 2);
    }
    // Линии опалубки
    ctx.strokeStyle = 'rgba(40, 42, 38, 0.4)';
    ctx.lineWidth = 2;
    for (let y = 128; y < 512; y += 128) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(512, y);
      ctx.stroke();
    }

    const tex = new THREE.CanvasTexture(c);
    cache.concrete = tex;
    return tex;
  }

  return {
    createWoodPlanks,
    createLogBark,
    createRoofShingles,
    createStoneBricks,
    createCorrugatedMetal,
    createSandbag,
    createCamoTarp,
    createConcrete
  };
})();
