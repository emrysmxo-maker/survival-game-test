// Модуль интеграции 3D-построек, теней солнца и настроек качества в основной движок Survival Game
(function () {
  'use strict';

  // 1. Очистка поляны вокруг точки старта (радиус 18 клеток) от случайных деревьев
  function clearSpawnTrees() {
    if (typeof loadedChunks === 'undefined') return;
    for (const chunk of loadedChunks.values()) {
      if (chunk.trees) {
        chunk.trees = chunk.trees.filter((t) => Math.hypot(t.x, t.y) > 16);
      }
      if (chunk.clutter) {
        chunk.clutter = chunk.clutter.filter((c) => Math.hypot(c.x, c.y) > 16);
      }
    }
  }
  setInterval(clearSpawnTrees, 800);

  // 2. Список построек в игровых координатах поляны
  const testBuildings = [
    { type: 'cabin', name: 'Охотничья изба', x: -5.5, y: -5.5, w: 260, h: 240, baseFrac: 0.8 },
    { type: 'post', name: 'Военный блокпост', x: 6.5, y: -5.5, w: 270, h: 260, baseFrac: 0.8 },
    { type: 'ruin', name: 'Заброшенный дом', x: -5.5, y: 6.5, w: 260, h: 240, baseFrac: 0.8 },
    { type: 'bunker', name: 'Бункер выживших', x: 6.5, y: 6.5, w: 260, h: 220, baseFrac: 0.8 }
  ];

  // 3. Рендеринг 3D-здания в изометрический холст с ЧЕСТНЫМИ ТЕНЯМИ ОТ СОЛНЦА
  function renderBuildingSprite(b) {
    if (typeof THREE === 'undefined') return;
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 512;

    const r = new THREE.WebGLRenderer({ canvas: c, alpha: true, antialias: true });
    r.setSize(512, 512);
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;

    const s = new THREE.Scene();

    // Ортографическая камера в изометрии 2:1 (угол 26.56° к горизонту)
    const frustum = 8.8;
    const cam = new THREE.OrthographicCamera(
      -frustum / 2, frustum / 2,
      frustum / 2, -frustum / 2,
      0.1, 100
    );
    cam.position.set(16, 12, 16);
    cam.lookAt(0, 1.2, 0);

    // Освещение: свет солнца сверху-слева
    const hemi = new THREE.HemisphereLight(0xffffff, 0x444433, 0.65);
    s.add(hemi);

    const sun = new THREE.DirectionalLight(0xfffaed, 1.45);
    sun.position.set(-14, 22, 10);
    sun.castShadow = true;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.camera.near = 1;
    sun.shadow.camera.far = 60;
    sun.shadow.camera.left = -6;
    sun.shadow.camera.right = 6;
    sun.shadow.camera.top = 6;
    sun.shadow.camera.bottom = -6;
    sun.shadow.bias = -0.0005;
    s.add(sun);

    // Плоскость земли для приёма чистой тени солнца
    const groundMat = new THREE.ShadowMaterial({ opacity: 0.42 });
    const groundPlane = new THREE.Mesh(new THREE.PlaneGeometry(24, 24), groundMat);
    groundPlane.rotation.x = -Math.PI / 2;
    groundPlane.position.y = 0;
    groundPlane.receiveShadow = true;
    s.add(groundPlane);

    // Добавляем 3D-модель
    let model = null;
    if (b.type === 'cabin') model = Buildings.createLogCabin(0, 0);
    else if (b.type === 'post') model = Buildings.createMilitaryPost(0, 0);
    else if (b.type === 'ruin') model = Buildings.createRuinedHouse(0, 0);
    else if (b.type === 'bunker') model = Buildings.createBunker(0, 0);

    if (model) {
      model.traverse((n) => {
        if (n.isMesh) {
          n.castShadow = true;
          n.receiveShadow = true;
        }
      });
      s.add(model);
    }

    r.render(s, cam);
    b.canvas = c;
    b.ready = true;
  }

  function initBuildings() {
    testBuildings.forEach((b) => renderBuildingSprite(b));
  }

  // 4. Отрисовка построек с правильной глубиной (Depth Sorting)
  function drawBuilding(b) {
    if (!b.ready || typeof ctx === 'undefined' || typeof toScreen !== 'function' || typeof view === 'undefined') return;
    const pos = toScreen(b.x, b.y);
    if (pos.x < -b.w || pos.x > view.w + b.w || pos.y < -b.h || pos.y > view.h + b.h) return;
    ctx.drawImage(b.canvas, pos.x - b.w / 2, pos.y - b.h * b.baseFrac, b.w, b.h);
  }

  function hookDepthRendering() {
    // Перехватываем drawCharacter: рисуем постройки сзади бойца перед ним
    const origDrawChar = window.drawCharacter;
    if (typeof origDrawChar === 'function') {
      window.drawCharacter = function (c, x, y) {
        if (typeof player !== 'undefined') {
          const pDepth = player.x + player.y;
          testBuildings.forEach((b) => {
            if (b.x + b.y < pDepth) drawBuilding(b);
          });
        }
        origDrawChar(c, x, y);
      };
    }

    // Постройки перед бойцом рисуем после основного кадра
    const origRender = window.render;
    if (typeof origRender === 'function') {
      window.render = function () {
        origRender();
        if (typeof player !== 'undefined') {
          const pDepth = player.x + player.y;
          testBuildings.forEach((b) => {
            if (b.x + b.y >= pDepth) drawBuilding(b);
          });
        }
      };
    }
  }

  // 5. Физическая коллизия (боец не проходит сквозь стены построек)
  function checkBuildingCollisions() {
    if (typeof player === 'undefined') return;
    for (const b of testBuildings) {
      const dx = player.x - b.x;
      const dy = player.y - b.y;
      const dist = Math.hypot(dx, dy);
      const rad = 2.1; // радиус периметра здания
      if (dist < rad && dist > 0.001) {
        player.x = b.x + (dx / dist) * rad;
        player.y = b.y + (dy / dist) * rad;
      }
    }
  }
  setInterval(checkBuildingCollisions, 16);

  // 6. UI-кнопки переключения качества и телепортации в debug-panel
  function setupTestUI() {
    const debugPanel = document.getElementById('debug-panel');
    if (!debugPanel) return;

    let curDprIdx = 0;
    const dprProfiles = [
      { name: '⚡ УЛЬТРА (3.3x)', dpr: 3.3 },
      { name: '⚡ ВЫСОКОЕ (2.0x)', dpr: 2.0 },
      { name: '⚡ СРЕДНЕЕ (1.5x)', dpr: 1.5 },
      { name: '⚡ ЭКОНОМ (1.0x)', dpr: 1.0 }
    ];

    const qBtn = document.createElement('button');
    qBtn.id = 'test-quality-btn';
    qBtn.textContent = dprProfiles[0].name;
    qBtn.style.cssText = `
      background: #1e3a8a;
      border: 1px solid #60a5fa;
      color: #fff;
      font: bold 11px sans-serif;
      padding: 5px 10px;
      border-radius: 6px;
      margin-top: 8px;
      cursor: pointer;
      display: block;
      box-shadow: 0 2px 6px rgba(0,0,0,0.4);
    `;
    qBtn.addEventListener('click', () => {
      curDprIdx = (curDprIdx + 1) % dprProfiles.length;
      const p = dprProfiles[curDprIdx];
      qBtn.textContent = p.name;
      if (typeof MAX_DPR !== 'undefined') window.MAX_DPR = p.dpr;
      if (typeof resize === 'function') {
        if (typeof view !== 'undefined') view.w = 0;
        resize();
      }
    });
    debugPanel.appendChild(qBtn);

    // Кнопки телепортации к постройкам
    const tpDiv = document.createElement('div');
    tpDiv.style.cssText = 'margin-top: 8px; display: flex; gap: 4px; flex-wrap: wrap;';
    tpDiv.innerHTML = `
      <button class="tp-btn" data-x="-5.5" data-y="-4.0" style="background:#166534;border:1px solid #4ade80;color:#fff;font:10px sans-serif;padding:3px 6px;border-radius:4px;cursor:pointer;">🏕️ Сруб</button>
      <button class="tp-btn" data-x="6.5" data-y="-4.0" style="background:#166534;border:1px solid #4ade80;color:#fff;font:10px sans-serif;padding:3px 6px;border-radius:4px;cursor:pointer;">🎖️ Блокпост</button>
      <button class="tp-btn" data-x="-5.5" data-y="8.0" style="background:#166534;border:1px solid #4ade80;color:#fff;font:10px sans-serif;padding:3px 6px;border-radius:4px;cursor:pointer;">🏚️ Руины</button>
      <button class="tp-btn" data-x="6.5" data-y="8.0" style="background:#166534;border:1px solid #4ade80;color:#fff;font:10px sans-serif;padding:3px 6px;border-radius:4px;cursor:pointer;">🚪 Бункер</button>
    `;
    tpDiv.querySelectorAll('.tp-btn').forEach((b) => {
      b.addEventListener('click', () => {
        if (typeof player !== 'undefined') {
          player.x = parseFloat(b.dataset.x);
          player.y = parseFloat(b.dataset.y);
          if (typeof camera !== 'undefined') {
            camera.x = (player.x - player.y) * 32;
            camera.y = (player.x + player.y) * 16;
          }
        }
      });
    });
    debugPanel.appendChild(tpDiv);
  }

  // Запуск
  window.addEventListener('DOMContentLoaded', () => {
    setTimeout(setupTestUI, 500);
    setTimeout(initBuildings, 800);
    setTimeout(hookDepthRendering, 1000);
  });
})();
